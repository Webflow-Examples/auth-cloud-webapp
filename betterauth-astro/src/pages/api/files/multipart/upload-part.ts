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

    // Get query parameters
    const url = new URL(request.url);
    const key = url.searchParams.get("key");
    const uploadId = url.searchParams.get("uploadId");
    const partNumber = url.searchParams.get("partNumber");

    if (!key || !uploadId || !partNumber) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required parameters: key, uploadId, partNumber",
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

    // Get the file chunk from the request body
    const chunk = await request.arrayBuffer();

    if (!chunk || chunk.byteLength === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No file chunk provided",
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
      `Uploading part ${partNumber} for key ${key}, size: ${chunk.byteLength} bytes`
    );

    // Upload this part to R2
    const partKey = `${key}.part${partNumber}`;
    const uploadResult = await locals.runtime.env.USER_AVATARS.put(
      partKey,
      chunk,
      {
        httpMetadata: {
          contentType: "application/octet-stream",
        },
        customMetadata: {
          uploadId,
          partNumber,
          originalKey: key,
          userId: session.user.id,
        },
      }
    );

    console.log(`Part ${partNumber} uploaded successfully:`, uploadResult);

    return new Response(
      JSON.stringify({
        success: true,
        partNumber: parseInt(partNumber),
        etag: uploadResult.etag,
        size: chunk.byteLength,
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
    console.error("Error uploading part:", error);
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
