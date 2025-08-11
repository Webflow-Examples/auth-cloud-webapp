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

    // Get filename and content type from headers
    const filename = request.headers.get("x-filename");
    const contentType = request.headers.get("content-type");

    if (!filename || !contentType) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Filename and content type headers are required",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("Binary upload request:", {
      filename,
      contentType,
      contentLength: request.headers.get("content-length"),
    });

    const bucket = locals.runtime.env.USER_AVATARS;
    const avatarService = createAvatarService(
      bucket,
      new URL(request.url).origin
    );

    // Get the file as a stream directly from the request body
    const fileStream = request.body;

    if (!fileStream) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No file data received",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Upload the stream directly
    const uploadResult = await avatarService.uploadAvatar(
      userId,
      fileStream,
      filename
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
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-filename",
      "Access-Control-Allow-Credentials": "true",
    },
  });
};
