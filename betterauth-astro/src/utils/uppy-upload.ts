import Uppy from "@uppy/core";
import XHRUpload from "@uppy/xhr-upload";
import Dashboard from "@uppy/dashboard";
import ProgressBar from "@uppy/progress-bar";

interface UppyUploadResponse {
  success: boolean;
  url?: string;
  key?: string;
  filename?: string;
  fileSize?: number;
  contentType?: string;
  error?: string;
}

interface UppyUploadOptions {
  onProgress?: (progress: {
    loaded: number;
    total: number;
    percent: number;
    speed: number;
    eta: number;
  }) => void;
}

export class UppyFileUploader {
  private uppy: Uppy;
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.BASE_URL as string;

    this.uppy = new Uppy({
      restrictions: {
        maxFileSize: 5 * 1024 * 1024 * 1024, // 5GB
        maxNumberOfFiles: 1,
        allowedFileTypes: null, // Allow all file types
      },
      autoProceed: false,
    });

    // Configure XHR upload with multipart support
    this.uppy.use(XHRUpload, {
      endpoint: `${this.baseUrl}/api/files/upload`,
      method: "POST",
      formData: true,
      fieldName: "file",
      headers: {
        "X-Requested-With": "XMLHttpRequest",
      },
      withCredentials: true,
      limit: 3, // Upload 3 files at a time
      timeout: 60000, // 60 seconds timeout
    });
  }

  /**
   * Upload a single file using Uppy
   */
  async uploadFile(
    file: File,
    options: UppyUploadOptions = {}
  ): Promise<UppyUploadResponse> {
    return new Promise((resolve, reject) => {
      // Set up progress tracking
      if (options.onProgress) {
        this.uppy.on("upload-progress", (file, progress) => {
          const total = progress.bytesTotal || 0;
          const loaded = progress.bytesUploaded || 0;
          options.onProgress!({
            loaded,
            total,
            percent: total > 0 ? (loaded / total) * 100 : 0,
            speed: 0, // Uppy doesn't provide speed in this event
            eta: 0, // Uppy doesn't provide ETA in this event
          });
        });
      }

      // Handle upload success
      this.uppy.on("upload-success", (file, response) => {
        const data = response.body as any;
        if (data.success && file) {
          resolve({
            success: true,
            url: data.url,
            key: data.key,
            filename: file.name,
            fileSize: file.size || 0,
            contentType: file.type,
          });
        } else {
          reject(new Error(data.error || "Upload failed"));
        }
      });

      // Handle upload errors
      this.uppy.on("upload-error", (file, error) => {
        reject(new Error(error.message || "Upload failed"));
      });

      // Add the file and start upload
      this.uppy.addFile({
        name: file.name,
        type: file.type,
        data: file,
        size: file.size,
      });

      this.uppy.upload();
    });
  }

  /**
   * Upload multiple files
   */
  async uploadFiles(
    files: File[],
    options: UppyUploadOptions = {}
  ): Promise<UppyUploadResponse[]> {
    const results: UppyUploadResponse[] = [];

    for (const file of files) {
      try {
        const result = await this.uploadFile(file, options);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          error: error instanceof Error ? error.message : "Upload failed",
        });
      }
    }

    return results;
  }

  /**
   * Get Uppy instance for custom usage
   */
  getUppy(): Uppy {
    return this.uppy;
  }

  /**
   * Reset Uppy state
   */
  reset(): void {
    this.uppy.cancelAll();
  }

  /**
   * Destroy Uppy instance
   */
  destroy(): void {
    this.uppy.cancelAll();
  }
}

// Create a singleton instance
export const uppyUploader = new UppyFileUploader();
