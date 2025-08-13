export interface AvatarUploadResult {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}

export interface AvatarDeleteResult {
  success: boolean;
  error?: string;
}

export interface PreSignedUrlResponse {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
  fields?: Record<string, string>;
}

export class AvatarService {
  private bucket: R2Bucket;
  private baseUrl: string;

  constructor(bucket: R2Bucket, baseUrl: string) {
    this.bucket = bucket;
    this.baseUrl = baseUrl;
  }

  /**
   * Upload a user avatar to R2
   */
  async uploadAvatar(
    userId: string,
    file: ArrayBuffer | ReadableStream<Uint8Array>,
    filename?: string
  ): Promise<AvatarUploadResult> {
    const basePath = import.meta.env.ASSETS_PREFIX;
    try {
      // Check if bucket is available
      if (!this.bucket) {
        return {
          success: false,
          error: "R2 bucket not available",
        };
      }

      // Generate a unique key for the avatar
      const timestamp = Date.now();
      const extension = filename ? this.getFileExtension(filename) : "jpg";
      const key = `avatars/${userId}/${timestamp}.${extension}`;

      // Upload the file to R2
      console.log("Starting R2 upload with stream...");
      const uploadResult = await this.bucket.put(key, file, {
        httpMetadata: {
          contentType: this.getContentType(extension),
          cacheControl: "public, max-age=31536000", // 1 year cache
        },
        customMetadata: {
          userId,
          uploadedAt: timestamp.toString(),
        },
      });
      console.log("R2 upload completed:", uploadResult ? "success" : "failed");

      if (!uploadResult) {
        return {
          success: false,
          error: "Failed to upload file to R2",
        };
      }

      // Return the URL that can be used to access the image
      const url = `${this.baseUrl}${basePath}/api/avatars/${key}`;

      return {
        success: true,
        url,
        key,
      };
    } catch (error) {
      console.error("Error uploading avatar:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Delete a user's avatar from R2
   */
  async deleteAvatar(
    userId: string,
    key?: string
  ): Promise<AvatarDeleteResult> {
    try {
      if (key) {
        // Delete specific avatar
        await this.bucket.delete(key);
      } else {
        // Delete all avatars for the user
        const objects = await this.bucket.list({
          prefix: `avatars/${userId}/`,
        });

        if (objects.objects.length > 0) {
          const keys = objects.objects.map((obj) => obj.key);
          await this.bucket.delete(keys);
        }
      }

      return { success: true };
    } catch (error) {
      console.error("Error deleting avatar:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Upload a user avatar to R2 with a specific key
   */
  async uploadAvatarWithKey(
    userId: string,
    file: ArrayBuffer | ReadableStream<Uint8Array>,
    key: string,
    filename?: string
  ): Promise<AvatarUploadResult> {
    const basePath = import.meta.env.ASSETS_PREFIX;
    try {
      // Check if bucket is available
      if (!this.bucket) {
        return {
          success: false,
          error: "R2 bucket not available",
        };
      }

      // Upload the file to R2 with the provided key
      console.log("Starting R2 upload with specific key:", key);
      const uploadResult = await this.bucket.put(key, file, {
        httpMetadata: {
          contentType: this.getContentType(
            this.getFileExtension(filename || key)
          ),
          cacheControl: "public, max-age=31536000", // 1 year cache
        },
        customMetadata: {
          userId,
          uploadedAt: Date.now().toString(),
        },
      });
      console.log("R2 upload completed:", uploadResult ? "success" : "failed");

      if (!uploadResult) {
        return {
          success: false,
          error: "Failed to upload file to R2",
        };
      }

      // Return the URL that can be used to access the image
      const url = `${this.baseUrl}${basePath}/api/avatars/${key}`;

      return {
        success: true,
        url,
        key,
      };
    } catch (error) {
      console.error("Error uploading avatar:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Get a user's avatar URL
   */
  getAvatarUrl(userId: string, key?: string): string {
    const basePath = import.meta.env.ASSETS_PREFIX;
    console.log("basePath", basePath);
    if (key) {
      return `${this.baseUrl}${basePath}/api/avatars/${key}`;
    }
    // Return a default avatar URL if no specific key is provided
    return `${this.baseUrl}${basePath}/api/avatars/default`;
  }

  /**
   * Generate a temporary upload URL using a different approach
   * Since R2 doesn't have createPresignedUrl, we'll use a different strategy
   */
  async generateUploadUrl(
    userId: string,
    fileName: string,
    fileType: string,
    fileSize: number
  ): Promise<PreSignedUrlResponse> {
    try {
      // Validate file type and size
      const validation = this.validateFileType(fileType, fileSize);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
        };
      }

      // Generate a unique key for the file
      const fileExtension = fileName.split(".").pop() || "jpg";
      const key = `avatars/${userId}/${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}.${fileExtension}`;

      // For now, we'll use a different approach - create a temporary upload endpoint
      // This is a simpler solution that doesn't require pre-signed URLs
      const uploadUrl = `${this.baseUrl}/api/temp-upload/${key}`;

      return {
        success: true,
        url: uploadUrl,
        key,
      };
    } catch (error) {
      console.error("Error generating upload URL:", error);
      return {
        success: false,
        error: "Failed to generate upload URL",
      };
    }
  }

  /**
   * Confirm upload completion and get the public URL
   */
  async confirmUpload(
    key: string
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      // Check if the file exists
      const object = await this.bucket.head(key);
      if (!object) {
        return {
          success: false,
          error: "File not found",
        };
      }

      // Generate the public URL
      const url = `${this.baseUrl}${key}`;

      return {
        success: true,
        url,
      };
    } catch (error) {
      console.error("Error confirming upload:", error);
      return {
        success: false,
        error: "Failed to confirm upload",
      };
    }
  }

  /**
   * Get file extension from filename
   */
  private getFileExtension(filename: string): string {
    const parts = filename.split(".");
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "jpg";
  }

  /**
   * Get content type based on file extension
   */
  private getContentType(extension: string): string {
    const contentTypes: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
      svg: "image/svg+xml",
    };

    return contentTypes[extension] || "image/jpeg";
  }

  /**
   * Validate file type and size
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

    if (file.size > maxSize) {
      return {
        valid: false,
        error: "File size must be less than 5MB",
      };
    }

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: "File type must be JPEG, PNG, GIF, or WebP",
      };
    }

    return { valid: true };
  }

  /**
   * Validate file type and size for pre-signed URL generation
   */
  private validateFileType(
    fileType: string,
    fileSize: number
  ): { valid: boolean; error?: string } {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

    if (fileSize > maxSize) {
      return {
        valid: false,
        error: "File size must be less than 5MB",
      };
    }

    if (!allowedTypes.includes(fileType)) {
      return {
        valid: false,
        error: "File must be a JPEG, PNG, GIF, or WebP image",
      };
    }

    return { valid: true };
  }
}

/**
 * Create an AvatarService instance
 */
export function createAvatarService(
  bucket: R2Bucket,
  baseUrl: string
): AvatarService {
  return new AvatarService(bucket, baseUrl);
}
