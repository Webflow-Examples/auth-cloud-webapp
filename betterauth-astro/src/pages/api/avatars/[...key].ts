import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const { key } = params;

    if (!key) {
      return new Response("Avatar key is required", { status: 400 });
    }

    const env = locals.runtime.env;
    const bucket = env.USER_AVATARS;

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
};

// Handle OPTIONS for CORS
export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "https://hello-webflow-cloud.webflow.io",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Credentials": "true",
    },
  });
};
