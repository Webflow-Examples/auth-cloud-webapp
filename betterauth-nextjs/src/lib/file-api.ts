import config from "../../next.config";

export interface FileInfo {
  key: string;
  url: string;
  filename: string;
  contentType: string;
  fileSize: number;
  uploadedAt: string;
  userId: string;
}

export interface FileUploadResponse {
  success: boolean;
  url?: string;
  key?: string;
  filename?: string;
  fileSize?: number;
  contentType?: string;
  error?: string;
}

export interface FileListResponse {
  success: boolean;
  files?: FileInfo[];
  error?: string;
}

export interface FileDeleteResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percent: number;
  speed: number; // bytes per second
  eta: number; // seconds
}

/**
 * Upload a file to the server
 */
export async function uploadFile(file: File): Promise<FileUploadResponse> {
  try {
    // Step 1: Generate upload URL with signature
    const baseUrl = config.assetPrefix;
    const generateUrlResponse = await fetch(
      `${baseUrl}/api/generate-file-upload-url`,
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
      throw new Error(generateData.error || "Failed to generate upload URL");
    }

    // Step 2: Upload file using the signed URL
    const formData = new FormData();
    formData.append("file", file);

    const uploadResponse = await fetch(generateData.uploadUrl!, {
      method: "POST",
      body: formData,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error("Upload error:", errorText);
      throw new Error(`Upload failed: ${uploadResponse.status}`);
    }

    const data = (await uploadResponse.json()) as FileUploadResponse;
    return data;
  } catch (error) {
    console.error("Error uploading file:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

/**
 * Upload a file with progress tracking using XMLHttpRequest
 */
export function uploadFileWithProgress(
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<FileUploadResponse> {
  return new Promise(async (resolve, reject) => {
    try {
      // Step 1: Generate upload URL with signature
      const baseUrl = config.assetPrefix;
      const generateUrlResponse = await fetch(
        `${baseUrl}/api/generate-file-upload-url`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
        throw new Error(generateData.error || "Failed to generate upload URL");
      }

      // Step 2: Upload file using XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();
      const startTime = Date.now();
      let lastLoaded = 0;
      let lastTime = startTime;

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable && onProgress) {
          const percent = (e.loaded / e.total) * 100;
          const currentTime = Date.now();
          const timeDiff = currentTime - lastTime;
          const bytesDiff = e.loaded - lastLoaded;
          const speed = timeDiff > 0 ? bytesDiff / timeDiff : 0; // bytes per millisecond
          const remainingBytes = e.total - e.loaded;
          const eta = speed > 0 ? remainingBytes / speed : 0; // milliseconds

          onProgress({
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
            const data = JSON.parse(xhr.responseText) as FileUploadResponse;
            console.log(`Parsed upload response:`, data);
            resolve(data);
          } catch (error) {
            console.error(`Failed to parse upload response:`, error);
            console.error(`Raw response:`, xhr.responseText);
            resolve({ success: false, error: "Invalid response from server" });
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

      // Start upload
      xhr.open("POST", generateData.uploadUrl!);
      xhr.send(formData);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * List all files for the current user
 */
export async function listFiles(): Promise<FileListResponse> {
  try {
    const baseUrl = config.assetPrefix;
    const response = await fetch(`${baseUrl}/api/files/list`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("List files error:", errorText);
      throw new Error(`Failed to list files: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error listing files:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to list files",
    };
  }
}

/**
 * Delete a file
 */
export async function deleteFile(key: string): Promise<FileDeleteResponse> {
  try {
    const baseUrl = config.assetPrefix;
    const response = await fetch(`${baseUrl}/api/files/delete`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ key }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Delete file error:", errorText);
      throw new Error(`Failed to delete file: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error deleting file:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete file",
    };
  }
}

/**
 * Get file type category for display
 */
export function getFileTypeCategory(contentType: string): string {
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
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Get file icon based on content type
 */
export function getFileIcon(contentType: string): string {
  if (contentType.startsWith("image/")) return "🖼️";
  if (contentType.startsWith("video/")) return "🎥";
  if (contentType.startsWith("audio/")) return "🎵";
  if (contentType.startsWith("text/")) return "📄";
  if (contentType.includes("pdf")) return "📕";
  if (
    contentType.includes("zip") ||
    contentType.includes("rar") ||
    contentType.includes("tar")
  )
    return "📦";
  return "📎";
}
