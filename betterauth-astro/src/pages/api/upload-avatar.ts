import type { APIRoute } from "astro";
import { auth } from "../../utils/auth";
import { createAvatarService } from "../../utils/r2";

export const POST: APIRoute = async ({ request, locals }) => {
  // Get CORS origin from environment variables
  const getCorsOrigin = () => {
    const baseUrl = import.meta.env.BASE_URL as string;
    const assetsPrefix = import.meta.env.ASSETS_PREFIX as string;

    // If we have a full URL, extract just the origin
    if (assetsPrefix && assetsPrefix.startsWith("http")) {
      const url = new URL(assetsPrefix);
      return `${url.protocol}//${url.host}`;
    }

    // If we have a base URL that's a full URL, extract just the origin
    if (baseUrl && baseUrl.startsWith("http")) {
      const url = new URL(baseUrl);
      return `${url.protocol}//${url.host}`;
    }

    // Fallback to the main domain
    return "https://hello-webflow-cloud.webflow.io";
  };

  const corsOrigin = getCorsOrigin();

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
    const formData = await request.formData();
    const avatarFile = formData.get("avatar") as File | null;

    if (!avatarFile || avatarFile.size === 0) {
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
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Allow-Credentials": "true",
          },
        }
      );
    }

    const bucket = locals.runtime.env.USER_AVATARS;
    const avatarService = createAvatarService(
      bucket,
      new URL(request.url).origin
    );

    // Validate the file
    const validation = avatarService.validateFile(avatarFile);
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
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Allow-Credentials": "true",
          },
        }
      );
    }

    // Convert to ArrayBuffer for direct upload
    const fileBuffer = await avatarFile.arrayBuffer();
    const uploadResult = await avatarService.uploadAvatar(
      userId,
      fileBuffer,
      avatarFile.name
    );

    if (!uploadResult.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: uploadResult.error || "Failed to upload avatar",
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

    return new Response(
      JSON.stringify({
        success: true,
        url: uploadResult.url,
        key: uploadResult.key,
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
    console.error("Error uploading avatar:", error);
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

export const OPTIONS: APIRoute = async () => {
  const getCorsOrigin = () => {
    const baseUrl = import.meta.env.BASE_URL as string;
    const assetsPrefix = import.meta.env.ASSETS_PREFIX as string;

    // If we have a full URL, extract just the origin
    if (assetsPrefix && assetsPrefix.startsWith("http")) {
      const url = new URL(assetsPrefix);
      return `${url.protocol}//${url.host}`;
    }

    // If we have a base URL that's a full URL, extract just the origin
    if (baseUrl && baseUrl.startsWith("http")) {
      const url = new URL(baseUrl);
      return `${url.protocol}//${url.host}`;
    }

    // Fallback to the main domain
    return "https://hello-webflow-cloud.webflow.io";
  };

  const corsOrigin = getCorsOrigin();

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
