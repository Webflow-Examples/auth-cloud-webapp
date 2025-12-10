import { NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createAuth } from "@/lib/auth";
import { createAvatarService } from "@/lib/r2";
import config from "../../../../next.config";

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user
    const authInstance = await createAuth(request);
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

    const { env } = await getCloudflareContext({ async: true });
    const bucket = env.USER_AVATARS as any;
    const avatarService = createAvatarService(
      bucket,
      config.basePath!,
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
}
