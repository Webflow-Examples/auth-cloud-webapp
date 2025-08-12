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

    // Handle avatar upload if provided
    if (avatarFile && avatarFile.size > 0) {
      console.log("Avatar file detected:", {
        name: avatarFile.name,
        size: avatarFile.size,
        type: avatarFile.type,
      });
      const bucket = locals.runtime.env.USER_AVATARS;
      const avatarService = createAvatarService(
        bucket,
        new URL(request.url).origin
      );

      // Validate the file
      const validation = avatarService.validateFile(avatarFile);
      if (!validation.valid) {
        return new Response(
          JSON.stringify({
            success: false,
            error: validation.error,
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Delete old avatar if it exists
      if (session.user.image) {
        // Extract key from existing URL
        const existingKey = session.user.image.split(
          `${basePath}/api/avatars/`
        )[1];
        if (existingKey) {
          await avatarService.deleteAvatar(userId, existingKey);
        }
      }

      // Try streaming first, fallback to ArrayBuffer if needed
      console.log("Attempting stream upload...");
      let uploadResult;

      try {
        const fileStream = avatarFile.stream();
        console.log("File stream created, size:", avatarFile.size);

        uploadResult = await avatarService.uploadAvatar(
          userId,
          fileStream,
          avatarFile.name
        );

        if (!uploadResult.success) {
          console.log("Stream upload failed, trying ArrayBuffer...");
          // Fallback to ArrayBuffer
          const fileBuffer = await avatarFile.arrayBuffer();
          console.log(
            "File converted to ArrayBuffer, size:",
            fileBuffer.byteLength
          );

          uploadResult = await avatarService.uploadAvatar(
            userId,
            fileBuffer,
            avatarFile.name
          );
        }
      } catch (error) {
        console.log("Stream upload error, trying ArrayBuffer...", error);
        // Fallback to ArrayBuffer
        const fileBuffer = await avatarFile.arrayBuffer();
        console.log(
          "File converted to ArrayBuffer, size:",
          fileBuffer.byteLength
        );

        uploadResult = await avatarService.uploadAvatar(
          userId,
          fileBuffer,
          avatarFile.name
        );
      }
      console.log("Upload result:", uploadResult);

      if (!uploadResult.success) {
        return new Response(
          JSON.stringify({
            success: false,
            error: uploadResult.error || "Failed to upload avatar",
          }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      avatarUrl = uploadResult.url!;
    }

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
