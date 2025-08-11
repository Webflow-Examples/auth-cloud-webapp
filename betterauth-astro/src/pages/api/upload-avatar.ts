import type { APIRoute } from "astro";
import { auth } from "../../utils/auth";
import { createAvatarService } from "../../utils/r2";

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Get the authenticated user
    const authInstance = await auth(locals.runtime.env);
    const session = await authInstance.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
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
        { status: 400, headers: { "Content-Type": "application/json" } }
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
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Upload file as a stream
    console.log("Uploading avatar file:", {
      name: avatarFile.name,
      size: avatarFile.size,
      type: avatarFile.type,
    });

    const fileStream = avatarFile.stream();
    const uploadResult = await avatarService.uploadAvatar(
      userId,
      fileStream,
      avatarFile.name
    );

    if (!uploadResult.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: uploadResult.error || "Failed to upload avatar",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        url: uploadResult.url,
        key: uploadResult.key,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error uploading avatar:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

// Handle OPTIONS for CORS
export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "https://hello-webflow-cloud.webflow.io",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Credentials": "true",
    },
  });
};
