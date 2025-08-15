import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ params, locals, request }) => {
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

    // Check if this is a video file
    const contentType =
      object.httpMetadata?.contentType || "application/octet-stream";
    const isVideo = contentType.startsWith("video/");
    const fileSize = object.size;

    // Handle range requests for video streaming
    const rangeHeader = request.headers.get("range");

    if (isVideo && rangeHeader && fileSize > 0) {
      // Parse range header (e.g., "bytes=0-1023")
      const rangeMatch = rangeHeader.match(/bytes=(\d+)-(\d*)/);

      if (rangeMatch) {
        const start = parseInt(rangeMatch[1], 10);
        const end = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : fileSize - 1;

        // Validate range
        if (start >= fileSize || end >= fileSize || start > end) {
          return new Response("Range Not Satisfiable", {
            status: 416,
            headers: {
              "Content-Range": `bytes */${fileSize}`,
              "Content-Length": "0",
            },
          });
        }

        // Get the requested range from R2
        const rangeObject = await bucket.get(key, {
          range: { offset: start, length: end - start + 1 },
        });

        if (!rangeObject) {
          return new Response("Range Not Satisfiable", { status: 416 });
        }

        const contentLength = end - start + 1;

        return new Response(rangeObject.body, {
          status: 206, // Partial Content
          headers: {
            "Content-Type": contentType,
            "Content-Range": `bytes ${start}-${end}/${fileSize}`,
            "Content-Length": contentLength.toString(),
            "Accept-Ranges": "bytes",
            "Cache-Control":
              object.httpMetadata?.cacheControl || "public, max-age=31536000",
            ETag: object.httpEtag,
            // Add CORS headers for web access
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Range, Content-Type",
          },
        });
      }
    }

    // For non-video files or when no range is requested, stream the file
    if (isVideo && fileSize > 10 * 1024 * 1024) {
      // 10MB threshold for streaming
      // Stream large video files
      return new Response(object.body, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Content-Length": fileSize.toString(),
          "Accept-Ranges": "bytes",
          "Cache-Control":
            object.httpMetadata?.cacheControl || "public, max-age=31536000",
          ETag: object.httpEtag,
          // Add CORS headers for web access
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Range, Content-Type",
        },
      });
    } else {
      // For smaller files, load into memory (existing behavior)
      const body = await object.arrayBuffer();

      return new Response(body, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Cache-Control":
            object.httpMetadata?.cacheControl || "public, max-age=31536000",
          "Content-Length": fileSize.toString(),
          ETag: object.httpEtag,
          // Add CORS headers for web access
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }
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
