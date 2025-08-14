import type { APIRoute } from "astro";
import { auth } from "../../utils/auth";
import { createFileService } from "../../utils/file-service";

export const DELETE: APIRoute = async ({ request, locals }) => {
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
    const { key } = await request.json();

    if (!key) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "File key is required",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Verify the file belongs to the user
    if (!key.startsWith(`files/${userId}/`)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Unauthorized to delete this file",
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    const bucket = locals.runtime.env.USER_AVATARS;
    const fileService = createFileService(bucket, new URL(request.url).origin);

    // Delete the file
    const deleteResult = await fileService.deleteFile(key);

    if (!deleteResult.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: deleteResult.error || "Failed to delete file",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "File deleted successfully",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error deleting file:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
