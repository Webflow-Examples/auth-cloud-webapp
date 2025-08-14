import { NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createFileService } from "@/lib/file-service";
import crypto from "crypto";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const token = resolvedParams.token?.join("/");

    if (!token) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Upload token is required",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Decode and validate the token
    let tokenData;
    try {
      const decodedToken = Buffer.from(token, "base64url").toString();
      tokenData = JSON.parse(decodedToken);
    } catch (error) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid upload token",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate token expiration
    if (Date.now() > tokenData.expires) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Upload token has expired",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate signature
    const { env } = await getCloudflareContext({ async: true });
    const expectedSignature = crypto
      .createHmac("sha256", env.BETTER_AUTH_SECRET as string)
      .update(`${tokenData.userId}:${tokenData.key}:${tokenData.expires}`)
      .digest("hex");

    if (tokenData.signature !== expectedSignature) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid upload token signature",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const userId = tokenData.userId;
    const key = tokenData.key;

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

    const bucket = env.USER_AVATARS as any;
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

    // Upload the file using the provided key
    const fileBuffer = await file.arrayBuffer();
    const uploadResult = await fileService.uploadFileWithKey(
      userId,
      fileBuffer,
      key,
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

    // Token is automatically expired after use (no cleanup needed)

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
    console.error("Error in temp upload:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
