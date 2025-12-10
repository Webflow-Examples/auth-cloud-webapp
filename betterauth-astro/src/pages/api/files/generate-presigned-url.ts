import type { APIRoute } from "astro";
import { auth } from "../../../utils/auth";
import { createFileService } from "../../../utils/file-service";

interface GeneratePresignedUrlRequest {
  fileName: string;
  fileType: string;
  fileSize?: number;
}

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

    const body = (await request.json()) as GeneratePresignedUrlRequest;
    const { fileName, fileType, fileSize } = body;

    if (!fileName || !fileType) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields: fileName, fileType",
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

    // Validate file size (5GB limit)
    const maxSize = 5 * 1024 * 1024 * 1024; // 5GB
    if (fileSize && fileSize > maxSize) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "File size must be less than 5GB",
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
      `Generating presigned URL for: ${fileName}, type: ${fileType}, size: ${fileSize}`
    );

    // Create file service
    const fileService = createFileService(
      locals.runtime.env.USER_AVATARS,
      new URL(request.url).origin
    );

    // Generate a unique key for the file
    const timestamp = Date.now();
    const extension = fileName.split(".").pop() || "";
    const key = `files/${session.user.id}/${timestamp}-${Math.random()
      .toString(36)
      .substring(2)}.${extension}`;

    // Generate presigned URL for direct upload to R2
    const presignedUrl = await fileService.generatePresignedUrl(
      key,
      fileType,
      "PUT",
      3600 // 1 hour expiry
    );

    if (!presignedUrl) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to generate presigned URL",
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

    // Return the presigned URL and metadata
    return new Response(
      JSON.stringify({
        success: true,
        uploadUrl: presignedUrl,
        key: key,
        fields: {},
        headers: {
          "Content-Type": fileType,
        },
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
    console.error("Error generating presigned URL:", error);
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
