import type { APIRoute } from "astro";
import { auth } from "../../utils/auth";
import { createFileService } from "../../utils/file-service";

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
    const file = formData.get("file") as File | null;

    if (!file || file.size === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No file provided",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
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
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Convert to ArrayBuffer for upload
    const fileBuffer = await file.arrayBuffer();
    const uploadResult = await fileService.uploadFile(
      userId,
      fileBuffer,
      file.name,
      file.type
    );

    if (!uploadResult.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: uploadResult.error || "Failed to upload file",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        url: uploadResult.url,
        key: uploadResult.key,
        filename: file.name,
        fileSize: file.size,
        contentType: file.type,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error uploading file:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
