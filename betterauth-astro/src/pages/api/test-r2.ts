import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ locals }) => {
  try {
    const env = locals.runtime.env;
    const bucket = env.USER_AVATARS;

    // Test bucket access by listing objects
    const objects = await bucket.list({ limit: 1 });

    return new Response(
      JSON.stringify({
        success: true,
        message: "R2 bucket access is working",
        bucketName: "user-avatars",
        objectsCount: objects.objects.length,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("R2 test error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};
