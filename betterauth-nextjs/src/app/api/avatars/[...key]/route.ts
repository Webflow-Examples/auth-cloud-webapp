import { NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const key = resolvedParams.key?.join("/");

    if (!key) {
      return new Response("Avatar key is required", { status: 400 });
    }

    const { env } = await getCloudflareContext({ async: true });
    const bucket = env.USER_AVATARS as any;

    // Get the object from R2
    const object = await bucket.get(key);

    if (!object) {
      return new Response("Avatar not found", { status: 404 });
    }

    // Get the object body
    const body = await object.arrayBuffer();

    // Create response with appropriate headers
    const response = new Response(body, {
      status: 200,
      headers: {
        "Content-Type": object.httpMetadata?.contentType || "image/jpeg",
        "Cache-Control":
          object.httpMetadata?.cacheControl || "public, max-age=31536000",
        "Content-Length": object.size.toString(),
        ETag: object.httpEtag,
      },
    });

    return response;
  } catch (error) {
    console.error("Error serving avatar:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
