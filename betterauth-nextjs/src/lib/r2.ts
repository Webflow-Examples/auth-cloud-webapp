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

export interface FileValidationResult {
  valid: boolean;
  error?: string;
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
      const url = `${this.baseUrl}/next/api/avatars/${key}`;

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
   * Get a user's avatar URL
   */
  getAvatarUrl(userId: string, key?: string): string {
    if (key) {
      return `${this.baseUrl}/next/api/avatars/${key}`;
    }
    // Return a default avatar URL if no specific key is provided
    return `${this.baseUrl}/next/api/avatars/default`;
  }

  /**
   * Validate uploaded file
   */
  validateFile(file: File): FileValidationResult {
    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return {
        valid: false,
        error: "File size must be less than 5MB",
      };
    }

    // Check file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: "Only JPEG, PNG, GIF, and WebP files are allowed",
      };
    }

    return { valid: true };
  }

  /**
   * Get file extension from filename
   */
  private getFileExtension(filename: string): string {
    const parts = filename.split(".");
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "jpg";
  }

  /**
   * Get content type from file extension
   */
  private getContentType(extension: string): string {
    const typeMap: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
    };
    return typeMap[extension] || "image/jpeg";
  }
}

/**
 * Create an avatar service instance
 */
export function createAvatarService(
  bucket: R2Bucket,
  baseUrl: string
): AvatarService {
  return new AvatarService(bucket, baseUrl);
}
