import type { APIRoute } from "astro";
import { auth } from "../../utils/auth";

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // Test authentication
    const authInstance = await auth(locals.runtime.env);
    const session = await authInstance.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Not authenticated",
          message: "Please log in to test profile functionality",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Profile API is accessible",
        user: {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          hasImage: !!session.user.image,
        },
        endpoints: {
          getProfile: "GET /api/user/profile",
          updateProfile: "POST /api/user/profile",
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Profile test error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
