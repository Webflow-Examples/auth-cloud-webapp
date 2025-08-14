import type { APIRoute } from "astro";
import { createFileService } from "../../../../utils/file-service";
import crypto from "crypto";

export const POST: APIRoute = async ({ request, params, locals }) => {
  // Get the origin URL from the environment variable
  const corsOrigin = locals.runtime.env.BETTER_AUTH_URL;

  try {
    const { token } = params;

    if (!token) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Upload token is required",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": corsOrigin,
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Credentials": "true",
          },
        }
      );
    }

    // Decode and validate the token
    let tokenData;
    try {
      const decodedToken = Buffer.from(token, "base64url").toString();
      tokenData = JSON.parse(decodedToken);
    } catch (error) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid upload token",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": corsOrigin,
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Credentials": "true",
          },
        }
      );
    }

    // Validate token expiration
    if (Date.now() > tokenData.expires) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Upload token has expired",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": corsOrigin,
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Credentials": "true",
          },
        }
      );
    }

    // Validate signature
    const expectedSignature = crypto
      .createHmac("sha256", locals.runtime.env.BETTER_AUTH_SECRET)
      .update(`${tokenData.userId}:${tokenData.key}:${tokenData.expires}`)
      .digest("hex");

    if (tokenData.signature !== expectedSignature) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid upload token signature",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": corsOrigin,
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Credentials": "true",
          },
        }
      );
    }

    const userId = tokenData.userId;
    const key = tokenData.key;

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file || file.size === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No file provided",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": corsOrigin,
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Credentials": "true",
          },
        }
      );
    }

    const bucket = locals.runtime.env.USER_AVATARS;
    const fileService = createFileService(bucket, new URL(request.url).origin);

    // Validate the file
    const validation = fileService.validateFile(file);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({
          success: false,
          error: validation.error,
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": corsOrigin,
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Credentials": "true",
          },
        }
      );
    }

    // Upload the file using the provided key
    console.log(
      `Processing upload for file: ${file.name}, size: ${file.size} bytes`
    );

    let uploadResult;

    // Try streaming first, fallback to buffer for smaller files or if streaming fails
    if (file.size > 50 * 1024 * 1024) {
      // 50MB threshold
      try {
        console.log(
          `Using streaming upload for large file (${file.size} bytes)`
        );
        const fileStream = file.stream();
        uploadResult = await fileService.uploadFileWithKey(
          userId,
          fileStream,
          key,
          file.name,
          file.type
        );
      } catch (streamError) {
        console.warn(
          `Streaming upload failed, falling back to buffer:`,
          streamError
        );
        const fileBuffer = await file.arrayBuffer();
        uploadResult = await fileService.uploadFileWithKey(
          userId,
          fileBuffer,
          key,
          file.name,
          file.type
        );
      }
    } else {
      // For smaller files, use buffer upload
      console.log(`Using buffer upload for smaller file (${file.size} bytes)`);
      const fileBuffer = await file.arrayBuffer();
      uploadResult = await fileService.uploadFileWithKey(
        userId,
        fileBuffer,
        key,
        file.name,
        file.type
      );
    }

    console.log(`Upload result:`, uploadResult);

    if (!uploadResult.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: uploadResult.error || "Failed to upload file",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": corsOrigin,
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Credentials": "true",
          },
        }
      );
    }

    // Token is automatically expired after use (no cleanup needed)

    return new Response(
      JSON.stringify({
        success: true,
        url: uploadResult.url,
        key: uploadResult.key,
        filename: file.name,
        fileSize: file.size,
        contentType: file.type,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": corsOrigin,
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Credentials": "true",
        },
      }
    );
  } catch (error) {
    console.error("Error in temp upload:", error);
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
          "Access-Control-Allow-Headers": "Content-Type",
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
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Credentials": "true",
    },
  });
};
