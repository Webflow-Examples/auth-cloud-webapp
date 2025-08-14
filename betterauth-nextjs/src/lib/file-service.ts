import config from "../../next.config";

export interface FileUploadResult {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
  fileSize?: number;
  contentType?: string;
}

export interface FileDeleteResult {
  success: boolean;
  error?: string;
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export interface FileInfo {
  key: string;
  url: string;
  filename: string;
  contentType: string;
  fileSize: number;
  uploadedAt: string;
  userId: string;
}

export class FileService {
  private bucket: R2Bucket;
  private baseUrl: string;

  constructor(bucket: R2Bucket, baseUrl: string) {
    this.bucket = bucket;
    this.baseUrl = baseUrl;
  }

  /**
   * Upload any file to R2
   */
  async uploadFile(
    userId: string,
    file: ArrayBuffer | ReadableStream<Uint8Array>,
    filename: string,
    contentType: string
  ): Promise<FileUploadResult> {
    try {
      if (!this.bucket) {
        return {
          success: false,
          error: "R2 bucket not available",
        };
      }

      // Generate a unique key for the file
      const timestamp = Date.now();
      const extension = this.getFileExtension(filename);
      const key = `files/${userId}/${timestamp}-${this.generateRandomString()}.${extension}`;

      return await this.uploadFileWithKey(
        userId,
        file,
        key,
        filename,
        contentType
      );
    } catch (error) {
      console.error("Error uploading file:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Upload file with a specific key
   */
  async uploadFileWithKey(
    userId: string,
    file: ArrayBuffer | ReadableStream<Uint8Array>,
    key: string,
    filename: string,
    contentType?: string
  ): Promise<FileUploadResult> {
    try {
      if (!this.bucket) {
        return {
          success: false,
          error: "R2 bucket not available",
        };
      }

      // Generate a unique key for the file
      const timestamp = Date.now();
      const extension = this.getFileExtension(filename);
      const key = `files/${userId}/${timestamp}-${this.generateRandomString()}.${extension}`;

      // Upload the file to R2
      console.log("Starting file upload to R2...");
      const uploadResult = await this.bucket.put(key, file, {
        httpMetadata: {
          contentType:
            contentType || this.getContentType(this.getFileExtension(filename)),
          cacheControl: "public, max-age=31536000", // 1 year cache
        },
        customMetadata: {
          userId,
          filename,
          uploadedAt: timestamp.toString(),
          originalName: filename,
        },
      });

      if (!uploadResult) {
        return {
          success: false,
          error: "Failed to upload file to R2",
        };
      }

      // Return the URL that can be used to access the file
      const url = `${this.baseUrl}${config.assetPrefix}/api/files/${key}`;

      return {
        success: true,
        url,
        key,
        fileSize: file instanceof ArrayBuffer ? file.byteLength : undefined,
        contentType,
      };
    } catch (error) {
      console.error("Error uploading file:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Delete a file from R2
   */
  async deleteFile(key: string): Promise<FileDeleteResult> {
    try {
      await this.bucket.delete(key);
      return { success: true };
    } catch (error) {
      console.error("Error deleting file:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * List all files for a user
   */
  async listUserFiles(userId: string): Promise<FileInfo[]> {
    try {
      const objects = await this.bucket.list({
        prefix: `files/${userId}/`,
      });

      const files: FileInfo[] = [];
      for (const obj of objects.objects) {
        const metadata = await this.bucket.head(obj.key);
        if (metadata) {
          files.push({
            key: obj.key,
            url: `${this.baseUrl}${config.assetPrefix}/api/files/${obj.key}`,
            filename:
              metadata.customMetadata?.originalName ||
              obj.key.split("/").pop() ||
              "Unknown",
            contentType:
              metadata.httpMetadata?.contentType || "application/octet-stream",
            fileSize: obj.size,
            uploadedAt:
              metadata.customMetadata?.uploadedAt 
                ? new Date(parseInt(metadata.customMetadata.uploadedAt)).toISOString()
                : new Date().toISOString(),
            userId: metadata.customMetadata?.userId || userId,
          });
        }
      }

      // Sort by upload date (newest first)
      return files.sort(
        (a, b) =>
          new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      );
    } catch (error) {
      console.error("Error listing files:", error);
      return [];
    }
  }

  /**
   * Validate uploaded file
   */
  validateFile(file: File): FileValidationResult {
    // Check file size (100MB limit for large files like videos)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      return {
        valid: false,
        error: "File size must be less than 100MB",
      };
    }

    // Check for potentially dangerous file types
    const dangerousExtensions = [
      "exe",
      "bat",
      "cmd",
      "com",
      "pif",
      "scr",
      "vbs",
      "js",
    ];
    const extension = this.getFileExtension(file.name).toLowerCase();
    if (dangerousExtensions.includes(extension)) {
      return {
        valid: false,
        error: "This file type is not allowed for security reasons",
      };
    }

    return { valid: true };
  }

  /**
   * Get file extension from filename
   */
  private getFileExtension(filename: string): string {
    const parts = filename.split(".");
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
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
      svg: "image/svg+xml",
      mp4: "video/mp4",
      webm: "video/webm",
      mov: "video/quicktime",
      avi: "video/x-msvideo",
      mp3: "audio/mpeg",
      wav: "audio/wav",
      ogg: "audio/ogg",
      pdf: "application/pdf",
      txt: "text/plain",
      zip: "application/zip",
      rar: "application/x-rar-compressed",
      tar: "application/x-tar",
    };
    return typeMap[extension] || "application/octet-stream";
  }

  /**
   * Generate a random string for unique file naming
   */
  private generateRandomString(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  /**
   * Get file type category for display
   */
  getFileTypeCategory(contentType: string): string {
    if (contentType.startsWith("image/")) return "Image";
    if (contentType.startsWith("video/")) return "Video";
    if (contentType.startsWith("audio/")) return "Audio";
    if (contentType.startsWith("text/")) return "Document";
    if (contentType.includes("pdf")) return "Document";
    if (
      contentType.includes("zip") ||
      contentType.includes("rar") ||
      contentType.includes("tar")
    )
      return "Archive";
    return "Other";
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }
}

/**
 * Create a file service instance
 */
export function createFileService(
  bucket: R2Bucket,
  baseUrl: string
): FileService {
  return new FileService(bucket, baseUrl);
}
