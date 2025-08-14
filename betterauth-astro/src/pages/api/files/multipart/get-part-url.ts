import type { APIRoute } from "astro";
import { auth } from "../../../../utils/auth";
import crypto from "crypto";

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
      partNumber: number;
    };
    const { key, uploadId, partNumber } = body;

    if (!key || !uploadId || !partNumber) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields: key, uploadId, partNumber",
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

    // Generate a secure token for cross-origin authentication
    const tokenData = {
      userId: session.user.id,
      key,
      uploadId,
      partNumber,
      expires: Date.now() + 5 * 60 * 1000, // 5 minutes
    };

    const signature = crypto
      .createHmac("sha256", locals.runtime.env.BETTER_AUTH_SECRET)
      .update(
        `${tokenData.userId}:${tokenData.key}:${tokenData.uploadId}:${tokenData.partNumber}:${tokenData.expires}`
      )
      .digest("hex");

    const token = Buffer.from(
      JSON.stringify({ ...tokenData, signature })
    ).toString("base64url");

    const baseUrl = import.meta.env.ASSETS_PREFIX as string;
    const presignedUrl = `${baseUrl}/api/files/multipart/upload-part?token=${token}`;

    return new Response(
      JSON.stringify({
        success: true,
        presignedUrl,
        partNumber,
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
    console.error("Error generating part URL:", error);
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
