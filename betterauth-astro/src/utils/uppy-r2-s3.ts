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

export class UppyR2S3Uploader {
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

    // Configure XHR upload for R2
    this.uppy.use(XHRUpload, {
      endpoint: `${import.meta.env.ASSETS_PREFIX}/api/files/upload`,
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
   * Upload a single file using Uppy with R2 S3
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
            speed: 0,
            eta: 0,
          });
        });
      }

      // Handle upload success
      this.uppy.on("upload-success", (file, response) => {
        if (file && response.body) {
          resolve({
            success: true,
            url: response.body.url,
            key: response.body.key,
            filename: file.name,
            fileSize: file.size || 0,
            contentType: file.type,
          });
        } else {
          reject(new Error("Upload failed"));
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
export const uppyR2S3Uploader = new UppyR2S3Uploader();
