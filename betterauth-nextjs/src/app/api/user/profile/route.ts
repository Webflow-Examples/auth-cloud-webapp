import { NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createAuth } from "@/lib/auth";
import { createAvatarService } from "@/lib/r2";
import { getDbAsync } from "@/db/getDb";
import { user } from "@/db/schema/auth-schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user
    const authInstance = await createAuth();
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
    const db = await getDbAsync();

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
}

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user
    const authInstance = await createAuth();
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

    // Parse form data
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const avatarFile = formData.get("avatar") as File | null;
    const uploadedAvatarUrl = formData.get("avatarUrl") as string | null;

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

    const db = await getDbAsync();
    let avatarUrl = uploadedAvatarUrl || session.user.image;

    // Handle avatar upload if provided
    if (avatarFile && avatarFile.size > 0) {
      const { env } = await getCloudflareContext({ async: true });
      const bucket = env.USER_AVATARS as any;
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
        const existingKey = session.user.image.split("/app/api/avatars/")[1];
        if (existingKey) {
          await avatarService.deleteAvatar(userId, existingKey);
        }
      }

      // Convert to ArrayBuffer for upload
      const fileBuffer = await avatarFile.arrayBuffer();
      const uploadResult = await avatarService.uploadAvatar(
        userId,
        fileBuffer,
        avatarFile.name
      );

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
          ...session.user,
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
}
