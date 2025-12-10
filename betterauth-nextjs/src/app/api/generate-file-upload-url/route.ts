import { NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createAuth } from "@/lib/auth";
import { createFileService } from "@/lib/file-service";
import crypto from "crypto";
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
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate file size (100MB limit)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (fileSize > maxSize) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "File size must be less than 100MB",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Generate a unique key for the file
    const fileExtension = fileName.split(".").pop() || "";
    const key = `files/${userId}/${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}.${fileExtension}`;

    // Generate a temporary upload token with embedded data
    const { env } = await getCloudflareContext({ async: true });
    const expires = Date.now() + 5 * 60 * 1000; // 5 minutes
    const tokenData = {
      userId,
      key,
      expires,
      signature: crypto
        .createHmac("sha256", env.BETTER_AUTH_SECRET as string)
        .update(`${userId}:${key}:${expires}`)
        .digest("hex"),
    };

    const token = Buffer.from(JSON.stringify(tokenData)).toString("base64url");

    // Create the upload URL - use the assets prefix (worker URL) for the actual upload
    const uploadUrl = `${config.assetPrefix}/api/files/temp-upload/${token}`;

    return new Response(
      JSON.stringify({
        success: true,
        uploadUrl,
        key,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating upload URL:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
