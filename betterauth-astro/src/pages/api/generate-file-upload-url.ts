import type { APIRoute } from "astro";
import { auth } from "../../utils/auth";
import { createFileService } from "../../utils/file-service";
import crypto from "crypto";

export const POST: APIRoute = async ({ request, locals }) => {
  // Get the origin URL from the environment variable
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

    const userId = session.user.id;
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

    // Validate file size (1GB limit)
    const maxSize = 1000 * 1024 * 1024; // 100MB
    if (fileSize > maxSize) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "File size must be less than 100MB",
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
    const key = `files/${userId}/${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}.${fileExtension}`;

    // Generate a temporary upload token with embedded data
    const expires = Date.now() + 5 * 60 * 1000; // 5 minutes
    const tokenData = {
      userId,
      key,
      expires,
      signature: crypto
        .createHmac("sha256", locals.runtime.env.BETTER_AUTH_SECRET)
        .update(`${userId}:${key}:${expires}`)
        .digest("hex"),
    };

    const token = Buffer.from(JSON.stringify(tokenData)).toString("base64url");

    // Create the upload URL - use the assets prefix (worker URL) for the actual upload
    const assetsPrefix = import.meta.env.ASSETS_PREFIX as string;
    const uploadUrl = assetsPrefix.startsWith("http")
      ? `${assetsPrefix}/api/files/temp-upload/${token}`
      : `${
          new URL(request.url).origin
        }${assetsPrefix}/api/files/temp-upload/${token}`;

    return new Response(
      JSON.stringify({
        success: true,
        uploadUrl,
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
    console.error("Error generating upload URL:", error);
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
