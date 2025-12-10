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
      `Completing multipart upload for key: ${key}, uploadId: ${uploadId}, parts: ${parts.length}`
    );

    // Remove duplicates and sort parts by part number
    const uniqueParts = parts.filter(
      (part, index, self) =>
        index === self.findIndex((p) => p.partNumber === part.partNumber)
    );

    uniqueParts.sort((a, b) => a.partNumber - b.partNumber);
    console.log("Original parts count:", parts.length);
    console.log("Unique parts count:", uniqueParts.length);
    console.log("Sorted unique parts:", uniqueParts);

    // Validate parts
    for (let i = 0; i < uniqueParts.length; i++) {
      if (uniqueParts[i].partNumber !== i + 1) {
        throw new Error(
          `Missing part ${i + 1}. Expected part ${i + 1}, got part ${
            uniqueParts[i].partNumber
          }`
        );
      }
      if (!uniqueParts[i].etag || uniqueParts[i].etag.length === 0) {
        throw new Error(`Invalid etag for part ${uniqueParts[i].partNumber}`);
      }
    }

    let uploadResult: any;
    try {
      // Use R2's proper multipart upload completion
      const multipartUpload =
        locals.runtime.env.USER_AVATARS.resumeMultipartUpload(key, uploadId);

      console.log("Resumed multipart upload:", {
        key,
        uploadId,
        partsCount: uniqueParts.length,
      });

      // Convert parts to R2UploadedPart format
      const uploadedParts = uniqueParts.map((part) => ({
        partNumber: part.partNumber,
        etag: part.etag.replace(/"/g, ""), // Remove quotes if present
      }));

      console.log("Uploaded parts for R2:", uploadedParts);

      // Add a longer delay to ensure all parts are fully processed by R2
      console.log("Waiting 3 seconds for R2 to process all parts...");
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Complete the multipart upload with retry logic
      let retryCount = 0;
      const maxRetries = 5;

      while (retryCount < maxRetries) {
        try {
          uploadResult = await multipartUpload.complete(uploadedParts);
          break; // Success, exit retry loop
        } catch (retryError) {
          retryCount++;
          console.log(`Completion attempt ${retryCount} failed:`, retryError);

          if (retryCount >= maxRetries) {
            throw retryError;
          }

          // Wait before retrying (exponential backoff)
          await new Promise((resolve) =>
            setTimeout(resolve, 2000 * retryCount)
          );
        }
      }

      console.log(`Multipart upload completed successfully:`, uploadResult);
    } catch (multipartError) {
      console.error("Error in multipart completion:", multipartError);
      throw multipartError;
    }

    // Update the file metadata after completion
    // Note: R2 doesn't support updating metadata directly, so we'll need to handle this differently
    // For now, the file will be accessible but without custom metadata

    // Generate the final URL
    const basePath = import.meta.env.ASSETS_PREFIX;
    const url = `${basePath}/api/files/${key}`;

    // Calculate total size from parts
    const totalSize = uniqueParts.reduce((sum, part) => sum + part.size, 0);

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
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({
        success: false,
        error: `Internal server error: ${errorMessage}`,
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
