import type { APIRoute } from "astro";
import crypto from "crypto";

export const POST: APIRoute = async ({ request, locals }) => {
  const corsOrigin = locals.runtime.env.BETTER_AUTH_URL;

  try {
    // Get query parameters
    const url = new URL(request.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: "Token is required" }),
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

    // Decode and validate token
    let tokenData: {
      userId: string;
      key: string;
      uploadId: string;
      partNumber: number;
      expires: number;
      signature: string;
    };

    try {
      const decodedToken = Buffer.from(token, "base64url").toString("utf-8");
      tokenData = JSON.parse(decodedToken);
    } catch (error) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid token format" }),
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

    // Check if token is expired
    if (Date.now() > tokenData.expires) {
      return new Response(
        JSON.stringify({ success: false, error: "Token has expired" }),
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

    // Validate signature
    const expectedSignature = crypto
      .createHmac("sha256", locals.runtime.env.BETTER_AUTH_SECRET)
      .update(
        `${tokenData.userId}:${tokenData.key}:${tokenData.uploadId}:${tokenData.partNumber}:${tokenData.expires}`
      )
      .digest("hex");

    if (tokenData.signature !== expectedSignature) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid token signature" }),
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

    const { userId, key, uploadId, partNumber } = tokenData;

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

    // Use R2's proper multipart upload API
    const multipartUpload =
      locals.runtime.env.USER_AVATARS.resumeMultipartUpload(key, uploadId);

    // Upload this part to the multipart upload
    const uploadResult = await multipartUpload.uploadPart(partNumber, chunk);

    console.log(`Part ${partNumber} uploaded successfully:`, uploadResult);

    return new Response(
      JSON.stringify({
        success: true,
        partNumber: partNumber,
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
