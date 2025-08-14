import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const { key } = params;

    if (!key) {
      return new Response("File key is required", { status: 400 });
    }

    const env = locals.runtime.env;
    const bucket = env.USER_AVATARS;

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
};

// Handle OPTIONS for CORS
export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
};
