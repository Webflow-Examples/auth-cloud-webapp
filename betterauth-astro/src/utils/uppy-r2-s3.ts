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

    // Don't configure XHRUpload here - we'll handle uploads manually with signed URLs
  }

  /**
   * Upload a single file using signed URL approach
   */
  async uploadFile(
    file: File,
    options: UppyUploadOptions = {}
  ): Promise<UppyUploadResponse> {
    return new Promise(async (resolve, reject) => {
      try {
        console.log(
          `Starting signed URL upload for file: ${file.name}, size: ${file.size} bytes`
        );

        // Step 1: Generate signed upload URL
        const generateUrlResponse = await fetch(
          `${this.baseUrl}/api/generate-file-upload-url`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
              fileName: file.name,
              fileType: file.type,
              fileSize: file.size,
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
          throw new Error(
            generateData.error || "Failed to generate upload URL"
          );
        }

        console.log("Generated signed URL:", generateData.uploadUrl);

        // Step 2: Upload file using the signed URL with progress tracking
        const xhr = new XMLHttpRequest();
        const startTime = Date.now();
        let lastLoaded = 0;
        let lastTime = startTime;

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable && options.onProgress) {
            const percent = (e.loaded / e.total) * 100;
            const currentTime = Date.now();
            const timeDiff = currentTime - lastTime;
            const bytesDiff = e.loaded - lastLoaded;
            const speed = timeDiff > 0 ? bytesDiff / timeDiff : 0; // bytes per millisecond
            const remainingBytes = e.total - e.loaded;
            const eta = speed > 0 ? remainingBytes / speed : 0; // milliseconds

            options.onProgress!({
              loaded: e.loaded,
              total: e.total,
              percent,
              speed: speed * 1000, // convert to bytes per second
              eta: eta / 1000, // convert to seconds
            });

            lastLoaded = e.loaded;
            lastTime = currentTime;
          }
        });

        xhr.addEventListener("load", () => {
          console.log(`Upload response status: ${xhr.status}`);
          console.log(`Upload response text:`, xhr.responseText);

          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText) as UppyUploadResponse;
              console.log(`Parsed upload response:`, data);
              resolve(data);
            } catch (error) {
              console.error(`Failed to parse upload response:`, error);
              console.error(`Raw response:`, xhr.responseText);
              resolve({
                success: false,
                error: "Invalid response from server",
              });
            }
          } else {
            console.error(
              `Upload failed with status ${xhr.status}:`,
              xhr.responseText
            );
            reject(
              new Error(`Upload failed: ${xhr.status} - ${xhr.responseText}`)
            );
          }
        });

        xhr.addEventListener("error", () => {
          reject(new Error("Upload failed due to network error"));
        });

        xhr.addEventListener("abort", () => {
          reject(new Error("Upload was cancelled"));
        });

        // Prepare form data
        const formData = new FormData();
        formData.append("file", file);

        // Start upload to signed URL
        xhr.open("POST", generateData.uploadUrl!);
        xhr.send(formData);
      } catch (error) {
        reject(error);
      }
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
