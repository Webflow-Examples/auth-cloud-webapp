import type { APIRoute } from "astro";
import { auth } from "../../../utils/auth";
import { createAvatarService } from "../../../utils/r2";
import { getDb } from "../../../db/getDb";
import { user } from "../../../db/schema/auth-schema";
import { eq } from "drizzle-orm";

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // Get the authenticated user
    const authInstance = await auth(locals.runtime.env);
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
    const db = getDb(locals.runtime.env.DB);

    // Get fresh user data from database
    const userData = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (userData.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "User not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: userData[0],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  // Get the base URL from the request URL
  const basePath = locals.runtime.env.BASE_URL;
  try {
    // Log request details for debugging
    console.log("Profile update request received");
    console.log("Content-Type:", request.headers.get("content-type"));
    console.log("Content-Length:", request.headers.get("content-length"));
    // Get the authenticated user
    const authInstance = await auth(locals.runtime.env);
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

    // Parse form data with error handling
    let formData: FormData;
    try {
      formData = await request.formData();
      console.log("FormData parsed successfully");
    } catch (error) {
      console.error("Error parsing FormData:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "Failed to parse form data. File may be too large or corrupted.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const avatarFile = formData.get("avatar") as File | null;

    // Validate required fields
    if (!name || !email) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Name and email are required",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid email format",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const db = getDb(locals.runtime.env.DB);
    let avatarUrl = session.user.image; // Keep existing avatar if no new one uploaded

    // Note: Avatar uploads are now handled by a separate endpoint (/api/upload-avatar)
    // This endpoint only handles profile data updates

    // Update user in database
    const updateData: any = {
      name,
      email,
      updatedAt: new Date(),
    };

    // Only update image if we have a new avatar URL
    if (avatarUrl !== session.user.image) {
      updateData.image = avatarUrl;
    }

    await db.update(user).set(updateData).where(eq(user.id, userId));

    return new Response(
      JSON.stringify({
        success: true,
        message: "Profile updated successfully",
        user: {
          id: userId,
          name,
          email,
          image: avatarUrl,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error updating user profile:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

// Handle OPTIONS for CORS
export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "https://hello-webflow-cloud.webflow.io",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Credentials": "true",
    },
  });
};

// New endpoint for getting presigned upload URLs
export const PUT: APIRoute = async ({ request, locals }) => {
  try {
    // Get the authenticated user
    const authInstance = await auth(locals.runtime.env);
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
      filename: string;
      contentType: string;
    };
    const { filename, contentType } = body;

    if (!filename || !contentType) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Filename and content type are required",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const bucket = locals.runtime.env.USER_AVATARS;
    const timestamp = Date.now();
    const extension = filename.split(".").pop() || "jpg";
    const key = `avatars/${userId}/${timestamp}.${extension}`;

    // Create a presigned URL for direct upload (R2 doesn't support createMultipartUpload)
    // Instead, we'll use a different approach - let's just return the key and handle upload differently
    const uploadKey = key;

    return new Response(
      JSON.stringify({
        success: true,
        uploadKey: uploadKey,
        key,
        url: `${new URL(request.url).origin}/app/api/avatars/${key}`,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error creating upload URL:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
