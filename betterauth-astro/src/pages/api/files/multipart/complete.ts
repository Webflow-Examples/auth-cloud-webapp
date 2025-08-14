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
      parts: Array<{ partNumber: number; etag: string }>;
    };
    const { key, uploadId, parts } = body;

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

    // Complete the multipart upload
    const result =
      await locals.runtime.env.USER_AVATARS.completeMultipartUpload(
        key,
        uploadId,
        parts
      );

    console.log(`Multipart upload completed:`, result);

    // Generate the final URL
    const basePath = import.meta.env.ASSETS_PREFIX;
    const url = `${basePath}/api/files/${key}`;

    return new Response(
      JSON.stringify({
        success: true,
        url,
        key,
        etag: result.etag,
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
