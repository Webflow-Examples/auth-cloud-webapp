import type { APIRoute } from "astro";
import { auth } from "../../../../utils/auth";

export const POST: APIRoute = async ({ request, locals }) => {
  const corsOrigin = locals.runtime.env.BETTER_AUTH_URL;

  try {
    // Get the authenticated user
    const authInstance = await auth(locals.runtime.env);
    const session = await authInstance.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": corsOrigin,
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Allow-Credentials": "true",
          },
        }
      );
    }

    const body = (await request.json()) as {
      key: string;
      uploadId: string;
      parts: Array<{ partNumber: number; etag: string; size: number }>;
      fileName: string;
      fileType: string;
    };
    const { key, uploadId, parts, fileName, fileType } = body;

    if (!key || !uploadId || !parts || !Array.isArray(parts)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields: key, uploadId, parts",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": corsOrigin,
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Allow-Credentials": "true",
          },
        }
      );
    }

    console.log(
      `Completing multipart upload for key: ${key}, parts: ${parts.length}`
    );

    // Sort parts by part number
    parts.sort((a, b) => a.partNumber - b.partNumber);

    // Combine all parts into a single file
    const chunks: ArrayBuffer[] = [];
    let totalSize = 0;

    for (const part of parts) {
      const partKey = `${key}.part${part.partNumber}`;
      const partObject = await locals.runtime.env.USER_AVATARS.get(partKey);

      if (!partObject) {
        throw new Error(`Part ${part.partNumber} not found`);
      }

      const partBuffer = await partObject.arrayBuffer();
      chunks.push(partBuffer);
      totalSize += partBuffer.byteLength;
    }

    // Combine all chunks
    const combinedBuffer = new Uint8Array(totalSize);
    let offset = 0;
    for (const chunk of chunks) {
      combinedBuffer.set(new Uint8Array(chunk), offset);
      offset += chunk.byteLength;
    }

    console.log(`Combined ${chunks.length} parts into ${totalSize} bytes`);

    // Upload the combined file
    const uploadResult = await locals.runtime.env.USER_AVATARS.put(
      key,
      combinedBuffer,
      {
        httpMetadata: {
          contentType: fileType,
          cacheControl: "public, max-age=31536000",
        },
        customMetadata: {
          userId: session.user.id,
          filename: fileName,
          uploadedAt: Date.now().toString(),
          originalName: fileName,
          uploadId,
          partsCount: parts.length.toString(),
        },
      }
    );

    console.log(`Combined file uploaded successfully:`, uploadResult);

    // Clean up individual parts
    for (const part of parts) {
      const partKey = `${key}.part${part.partNumber}`;
      try {
        await locals.runtime.env.USER_AVATARS.delete(partKey);
        console.log(`Cleaned up part ${part.partNumber}`);
      } catch (error) {
        console.warn(`Failed to clean up part ${part.partNumber}:`, error);
      }
    }

    // Generate the final URL
    const basePath = import.meta.env.ASSETS_PREFIX;
    const url = `${basePath}/api/files/${key}`;

    return new Response(
      JSON.stringify({
        success: true,
        url,
        key,
        etag: uploadResult.etag,
        size: totalSize,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": corsOrigin,
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Allow-Credentials": "true",
        },
      }
    );
  } catch (error) {
    console.error("Error completing multipart upload:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": corsOrigin,
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Allow-Credentials": "true",
        },
      }
    );
  }
};

// Handle OPTIONS for CORS
export const OPTIONS: APIRoute = async ({ locals }) => {
  const corsOrigin = locals.runtime.env.BETTER_AUTH_URL;

  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": corsOrigin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Credentials": "true",
    },
  });
};
