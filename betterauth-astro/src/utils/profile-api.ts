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
 * Extract session token from cookies for cross-origin requests
 */
function getSessionToken(): string | null {
  if (typeof document === "undefined") return null;

  // Debug: log all cookies to see what's available
  console.log("All cookies:", document.cookie);

  // BetterAuth typically stores session tokens in cookies
  // Look for common session cookie names - BetterAuth uses a specific format
  const cookieNames = [
    "better-auth.session-token",
    "session-token",
    "auth-token",
    "token",
    "session",
    "auth",
    // BetterAuth specific cookie names
    "better-auth.session",
    "better-auth.token",
    "better-auth",
  ];

  for (const name of cookieNames) {
    const value = document.cookie
      .split("; ")
      .find((row) => row.startsWith(name + "="))
      ?.split("=")[1];

    if (value) {
      console.log(`Found session token in cookie: ${name}`);
      return decodeURIComponent(value);
    }
  }

  // If no specific cookie found, try to find any cookie that might contain a session token
  const allCookies = document.cookie.split("; ");
  for (const cookie of allCookies) {
    const [name, value] = cookie.split("=");
    if (value && value.length > 20) {
      // Session tokens are typically long
      console.log(`Trying potential session cookie: ${name}`);
      return decodeURIComponent(value);
    }
  }

  console.log("No session token found in cookies");
  return null;
}

/**
 * Fetch the current user's profile data
 */
export async function fetchProfile(): Promise<ProfileData | null> {
  // Use BASE_URL for profile operations (main domain where session cookies are available)
  const baseUrl = import.meta.env.BASE_URL as string;
  console.log("baseUrl", baseUrl);

  // Construct full URL
  const fullUrl = (() => {
    // In production, BASE_URL should be the main domain
    if (baseUrl.startsWith("http")) {
      return `${baseUrl}/api/user/profile`;
    }

    // In development, use window.location.origin
    return typeof window !== "undefined"
      ? `${window.location.origin}${baseUrl}/api/user/profile`
      : `${import.meta.env.BETTERAUTH_URL}${baseUrl}/api/user/profile`;
  })();

  try {
    const response = await fetch(fullUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
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
  // Use BASE_URL for profile operations (main domain where session cookies are available)
  const baseUrl = import.meta.env.BASE_URL as string;
  console.log("baseUrl", baseUrl);

  try {
    // If there's an avatar, use the pre-signed URL approach
    let avatarUrl: string | undefined;

    if (profileData.avatar) {
      // Step 1: Generate upload URL - call the main domain where session cookies are available
      const generateUrlResponse = await fetch(
        `${import.meta.env.BASE_URL}/api/generate-upload-url`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            fileName: profileData.avatar.name,
            fileType: profileData.avatar.type,
            fileSize: profileData.avatar.size,
          }),
        }
      );

      if (!generateUrlResponse.ok) {
        const errorText = await generateUrlResponse.text();
        console.error("Generate URL error:", errorText);
        throw new Error(
          `Failed to generate upload URL: ${generateUrlResponse.status}`
        );
      }

      const generateData = (await generateUrlResponse.json()) as {
        success: boolean;
        uploadUrl?: string;
        key?: string;
        error?: string;
      };
      if (!generateData.success) {
        throw new Error(generateData.error || "Failed to generate upload URL");
      }

      // Step 2: Upload file using the temporary URL
      const uploadFormData = new FormData();
      uploadFormData.append("avatar", profileData.avatar);

      console.log("Uploading to temporary URL:", generateData.uploadUrl);

      const uploadResponse = await fetch(generateData.uploadUrl!, {
        method: "POST",
        body: uploadFormData,
      });

      console.log("Upload response status:", uploadResponse.status);

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error("Upload error response:", errorText);
        throw new Error(
          `Upload failed: ${uploadResponse.status} - ${errorText}`
        );
      }

      const uploadData = (await uploadResponse.json()) as {
        success: boolean;
        url?: string;
        key?: string;
        error?: string;
      };
      if (!uploadData.success) {
        throw new Error(uploadData.error || "Upload failed");
      }

      avatarUrl = uploadData.url;
    }

    // Now update the profile data (without the file) - use BASE_URL for profile updates
    const formData = new FormData();
    formData.append("name", profileData.name);
    formData.append("email", profileData.email);

    if (avatarUrl) {
      formData.append("avatarUrl", avatarUrl);
    }

    const response = await fetch(
      `${import.meta.env.BASE_URL}/api/user/profile`,
      {
        method: "POST",
        body: formData,
        credentials: "include",
      }
    );

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
