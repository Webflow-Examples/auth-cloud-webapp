export interface ProfileUpdateData {
  name: string;
  email: string;
}

export interface ProfileResponse {
  success: boolean;
  message?: string;
  error?: string;
  url?: string;
  key?: string;
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
    const basePath = import.meta.env.BASE_URL;
    const response = await fetch(`${basePath}/api/user/profile`, {
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
 * Upload avatar file
 */
export async function uploadAvatar(file: File): Promise<ProfileResponse> {
  try {
    // Use binary upload to avoid FormData limits
    const response = await fetch(`/app/api/upload-avatar-binary`, {
      method: "POST",
      headers: {
        "Content-Type": file.type,
        "x-filename": file.name,
      },
      body: file, // Send the file directly as the request body
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ProfileResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Error uploading avatar:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to upload avatar",
    };
  }
}

/**
 * Update the user's profile data
 */
export async function updateProfile(
  profileData: ProfileUpdateData
): Promise<ProfileResponse> {
  try {
    const formData = new FormData();
    formData.append("name", profileData.name);
    formData.append("email", profileData.email);

    const response = await fetch(`/app/api/user/profile`, {
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

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate avatar file
 */
export function validateAvatarFile(file: File): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

  if (file.size > maxSize) {
    errors.push("Avatar file size must be less than 5MB");
  }

  if (!allowedTypes.includes(file.type)) {
    errors.push("Avatar must be a JPEG, PNG, GIF, or WebP image");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
