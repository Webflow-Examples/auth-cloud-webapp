export interface ProfileUpdateData {
  name: string;
  email: string;
  avatar?: File;
}

export interface ProfileResponse {
  success: boolean;
  message?: string;
  error?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
}

export interface ProfileData {
  id: string;
  name: string;
  email: string;
  image?: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Fetch the current user's profile data
 */
export async function fetchProfile(): Promise<ProfileData | null> {
  try {
    const response = await fetch("/app/api/user/profile", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ProfileResponse = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Failed to fetch profile");
    }

    return data.user as ProfileData;
  } catch (error) {
    console.error("Error fetching profile:", error);
    return null;
  }
}

/**
 * Update the user's profile data
 */
export async function updateProfile(
  profileData: ProfileUpdateData
): Promise<ProfileResponse> {
  try {
    // If there's an avatar, upload it separately first
    let avatarUrl: string | undefined;

    if (profileData.avatar) {
      const uploadFormData = new FormData();
      uploadFormData.append("avatar", profileData.avatar);

      const uploadResponse = await fetch("/app/api/upload-avatar", {
        method: "POST",
        body: uploadFormData,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.status}`);
      }

      const uploadData = (await uploadResponse.json()) as { url: string };
      avatarUrl = uploadData.url;
    }

    // Now update the profile data (without the file)
    const formData = new FormData();
    formData.append("name", profileData.name);
    formData.append("email", profileData.email);

    if (avatarUrl) {
      formData.append("avatarUrl", avatarUrl);
    }

    const response = await fetch("/app/api/user/profile", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ProfileResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Error updating profile:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update profile",
    };
  }
}

/**
 * Validate profile data before submission
 */
export function validateProfileData(data: ProfileUpdateData): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate name
  if (!data.name || data.name.trim().length === 0) {
    errors.push("Name is required");
  } else if (data.name.trim().length < 2) {
    errors.push("Name must be at least 2 characters long");
  }

  // Validate email
  if (!data.email || data.email.trim().length === 0) {
    errors.push("Email is required");
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      errors.push("Invalid email format");
    }
  }

  // Validate avatar file if provided
  if (data.avatar) {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

    if (data.avatar.size > maxSize) {
      errors.push("Avatar file size must be less than 5MB");
    }

    if (!allowedTypes.includes(data.avatar.type)) {
      errors.push("Avatar must be a JPEG, PNG, GIF, or WebP image");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
