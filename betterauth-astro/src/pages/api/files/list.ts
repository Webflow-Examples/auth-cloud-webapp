import type { APIRoute } from "astro";
import { auth } from "../../../utils/auth";
import { createFileService } from "../../../utils/file-service";

export const GET: APIRoute = async ({ request, locals }) => {
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

    const bucket = locals.runtime.env.USER_AVATARS;
    const fileService = createFileService(bucket, new URL(request.url).origin);

    // List user files
    const files = await fileService.listUserFiles(userId);

    return new Response(
      JSON.stringify({
        success: true,
        files,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error listing files:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
