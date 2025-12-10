import { NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createAuth } from "@/lib/auth";
import { createFileService } from "@/lib/file-service";

export async function GET(request: NextRequest) {
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

    const { env } = await getCloudflareContext({ async: true });
    const bucket = env.USER_AVATARS as any; // Using the same bucket for now
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
}
