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
      return new Response("File key is required", { status: 400 });
    }

    const { env } = await getCloudflareContext({ async: true });
    const bucket = env.USER_AVATARS as any;

    // Get the object from R2
    const object = await bucket.get(key);

    if (!object) {
      return new Response("File not found", { status: 404 });
    }

    // Get the object body
    const body = await object.arrayBuffer();

    // Create response with appropriate headers
    const response = new Response(body, {
      status: 200,
      headers: {
        "Content-Type":
          object.httpMetadata?.contentType || "application/octet-stream",
        "Cache-Control":
          object.httpMetadata?.cacheControl || "public, max-age=31536000",
        "Content-Length": object.size.toString(),
        ETag: object.httpEtag,
        // Add CORS headers for web access
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });

    return response;
  } catch (error) {
    console.error("Error serving file:", error);
    return new Response("Internal server error", { status: 500 });
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
