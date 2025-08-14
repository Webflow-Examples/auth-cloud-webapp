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

export interface MultipartInitResponse {
  success: boolean;
  uploadId?: string;
  key?: string;
  error?: string;
}

export interface MultipartPartResponse {
  success: boolean;
  presignedUrl?: string;
  partNumber?: number;
  error?: string;
}

export interface MultipartUploadPartResponse {
  success: boolean;
  partNumber?: number;
  etag?: string;
  size?: number;
  error?: string;
}

export interface MultipartCompleteResponse {
  success: boolean;
  url?: string;
  key?: string;
  etag?: string;
  size?: number;
  error?: string;
}

/**
 * Upload a file to the server
 */
export async function uploadFile(file: File): Promise<FileUploadResponse> {
  try {
    // Step 1: Generate upload URL with signature
    const baseUrl = import.meta.env.BASE_URL as string;
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
      const baseUrl = import.meta.env.BASE_URL as string;
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
 * Upload a file using multipart upload for large files
 */
export async function uploadFileMultipart(
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<FileUploadResponse> {
  try {
    console.log(
      `Starting multipart upload for file: ${file.name}, size: ${file.size} bytes`
    );

    // Step 1: Initialize multipart upload
    const baseUrl = import.meta.env.BASE_URL as string;
    console.log(`Using base URL: ${baseUrl}`);

    const initResponse = await fetch(`${baseUrl}/api/files/multipart/init`, {
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
    });

    console.log(`Init response status: ${initResponse.status}`);

    if (!initResponse.ok) {
      const errorText = await initResponse.text();
      console.error(`Init response error: ${errorText}`);
      throw new Error(
        `Failed to initialize multipart upload: ${initResponse.status} - ${errorText}`
      );
    }

    const initData = (await initResponse.json()) as MultipartInitResponse;
    console.log(`Init response data:`, initData);
    if (!initData.success || !initData.uploadId || !initData.key) {
      throw new Error(
        initData.error || "Failed to initialize multipart upload"
      );
    }

    const { uploadId, key } = initData;

    // Step 2: Split file into parts (5MB each)
    const partSize = 5 * 1024 * 1024; // 5MB
    const totalParts = Math.ceil(file.size / partSize);
    const parts: Array<{ partNumber: number; etag: string; size: number }> = [];

    console.log(
      `Starting multipart upload: ${totalParts} parts of ${partSize} bytes each`
    );

    for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
      const start = (partNumber - 1) * partSize;
      const end = Math.min(start + partSize, file.size);
      const chunk = file.slice(start, end);

      // Get upload URL for this part
      const partUrlResponse = await fetch(
        `${baseUrl}/api/files/multipart/get-part-url`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            key,
            uploadId,
            partNumber,
          }),
        }
      );

      if (!partUrlResponse.ok) {
        throw new Error(`Failed to get part URL for part ${partNumber}`);
      }

      const partUrlData =
        (await partUrlResponse.json()) as MultipartPartResponse;
      if (!partUrlData.success || !partUrlData.presignedUrl) {
        throw new Error(`Failed to get upload URL for part ${partNumber}`);
      }

      // Upload this part
      const uploadResponse = await fetch(partUrlData.presignedUrl, {
        method: "POST",
        credentials: "include",
        body: chunk,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Failed to upload part ${partNumber}`);
      }

      const uploadData =
        (await uploadResponse.json()) as MultipartUploadPartResponse;
      if (!uploadData.success) {
        throw new Error(
          `Failed to upload part ${partNumber}: ${uploadData.error}`
        );
      }

      parts.push({
        partNumber: uploadData.partNumber!,
        etag: uploadData.etag!,
        size: uploadData.size!,
      });

      // Update progress
      if (onProgress) {
        const loaded = partNumber * partSize;
        const percent = (loaded / file.size) * 100;
        onProgress({
          loaded: Math.min(loaded, file.size),
          total: file.size,
          percent: Math.min(percent, 100),
          speed: 0, // Can't calculate speed for multipart
          eta: 0, // Can't calculate ETA for multipart
        });
      }

      console.log(`Uploaded part ${partNumber}/${totalParts}`);
    }

    // Step 3: Complete multipart upload
    const completeResponse = await fetch(
      `${baseUrl}/api/files/multipart/complete`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          key,
          uploadId,
          parts,
          fileName: file.name,
          fileType: file.type,
        }),
      }
    );

    if (!completeResponse.ok) {
      throw new Error(
        `Failed to complete multipart upload: ${completeResponse.status}`
      );
    }

    const completeData =
      (await completeResponse.json()) as MultipartCompleteResponse;
    if (!completeData.success) {
      throw new Error(
        completeData.error || "Failed to complete multipart upload"
      );
    }

    return {
      success: true,
      url: completeData.url,
      key: completeData.key,
      filename: file.name,
      fileSize: file.size,
      contentType: file.type,
    };
  } catch (error) {
    console.error("Error in multipart upload:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Multipart upload failed",
    };
  }
}

/**
 * List all files for the current user
 */
export async function listFiles(): Promise<FileListResponse> {
  try {
    const baseUrl = import.meta.env.BASE_URL as string;
    const response = await fetch(`${baseUrl}/api/files/list`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("List files error:", errorText);
      throw new Error(`Failed to list files: ${response.status}`);
    }

    const data = (await response.json()) as FileListResponse;
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
    const baseUrl = import.meta.env.BASE_URL as string;
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

    const data = (await response.json()) as FileDeleteResponse;
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
