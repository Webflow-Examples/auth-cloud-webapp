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
      fileName: string;
      fileType: string;
      fileSize: number;
    };
    const { fileName, fileType, fileSize } = body;

    if (!fileName || !fileType || !fileSize) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields: fileName, fileType, fileSize",
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

    // Generate a unique key for the file
    const fileExtension = fileName.split(".").pop() || "";
    const key = `files/${session.user.id}/${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}.${fileExtension}`;

    // Initialize multipart upload using R2's S3-compatible API
    console.log(`Attempting to create multipart upload for key: ${key}`);

    const multipartUpload =
      await locals.runtime.env.USER_AVATARS.createMultipartUpload(key, {
        httpMetadata: {
          contentType: fileType,
          cacheControl: "public, max-age=31536000",
        },
        customMetadata: {
          userId: session.user.id,
          filename: fileName,
          uploadedAt: Date.now().toString(),
          originalName: fileName,
        },
      });

    console.log(`Multipart upload initialized:`, multipartUpload);

    return new Response(
      JSON.stringify({
        success: true,
        uploadId: multipartUpload.uploadId,
        key,
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
    console.error("Error initializing multipart upload:", error);
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
