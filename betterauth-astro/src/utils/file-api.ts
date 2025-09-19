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

interface MultipartAllUrlsResponse {
  success: boolean;
  partUrls?: Array<{ partNumber: number; url: string }>;
  error?: string;
}

interface MultipartBatchUrlsResponse {
  success: boolean;
  partUrls?: Array<{ partNumber: number; url: string }>;
  hasMore?: boolean;
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
      multipartRequired?: boolean;
      message?: string;
    };

    if (!generateData.success) {
      throw new Error(generateData.error || "Failed to generate upload URL");
    }

    // Check if multipart upload is required
    if (generateData.multipartRequired) {
      console.log("Multipart upload required:", generateData.message);
      throw new Error(
        "Large file detected. Please use multipart upload for files larger than 100MB."
      );
    }

    if (!generateData.uploadUrl) {
      throw new Error("No upload URL provided");
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
        multipartRequired?: boolean;
        message?: string;
      };

      if (!generateData.success) {
        throw new Error(generateData.error || "Failed to generate upload URL");
      }

      // Check if multipart upload is required
      if (generateData.multipartRequired) {
        console.log("Multipart upload required:", generateData.message);
        throw new Error(
          "Large file detected. Please use multipart upload for files larger than 100MB."
        );
      }

      if (!generateData.uploadUrl) {
        throw new Error("No upload URL provided");
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

    // Step 2: Split file into parts (10MB each for better performance)
    const partSize = 10 * 1024 * 1024; // 10MB
    const totalParts = Math.ceil(file.size / partSize);

    console.log(
      `Starting multipart upload: ${totalParts} parts of ${partSize} bytes each`
    );

    // Upload parts in batches to avoid timeout
    const batchSize = 15; // Generate 15 URLs per request
    const concurrencyLimit = 3; // Upload 3 parts at a time
    const allParts: Array<{ partNumber: number; etag: string; size: number }> =
      [];

    for (
      let batchStart = 1;
      batchStart <= totalParts;
      batchStart += batchSize
    ) {
      const batchEnd = Math.min(batchStart + batchSize - 1, totalParts);

      console.log(`Getting URLs for parts ${batchStart}-${batchEnd}`);

      // Get URLs for this batch
      const batchUrlsResponse = await fetch(
        `${baseUrl}/api/files/multipart/get-part-urls-batch`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            key,
            uploadId,
            startPartNumber: batchStart,
            endPartNumber: batchEnd,
          }),
        }
      );

      if (!batchUrlsResponse.ok) {
        throw new Error(
          `Failed to get batch URLs: ${batchUrlsResponse.status}`
        );
      }

      const batchUrlsData =
        (await batchUrlsResponse.json()) as MultipartBatchUrlsResponse;
      if (!batchUrlsData.success || !batchUrlsData.partUrls) {
        throw new Error("Failed to get batch URLs");
      }

      // Upload parts in this batch with concurrency control
      const batchPromises: Array<
        Promise<{ partNumber: number; etag: string; size: number }>
      > = [];

      for (const partInfo of batchUrlsData.partUrls) {
        const partNumber = partInfo.partNumber;
        const start = (partNumber - 1) * partSize;
        const end = Math.min(start + partSize, file.size);
        const chunk = file.slice(start, end);

        // Create upload promise
        const uploadPromise = (async () => {
          const uploadResponse = await fetch(partInfo.url, {
            method: "POST",
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

          console.log(`Uploaded part ${partNumber}/${totalParts}`);
          return {
            partNumber: uploadData.partNumber!,
            etag: uploadData.etag!,
            size: uploadData.size!,
          };
        })();

        batchPromises.push(uploadPromise);
      }

      // Wait for all parts in this batch to complete
      const batchResults = await Promise.all(batchPromises);
      allParts.push(...batchResults);

      // Update progress after each batch
      if (onProgress) {
        const loaded = allParts.length * partSize;
        const percent = (loaded / file.size) * 100;
        onProgress({
          loaded: Math.min(loaded, file.size),
          total: file.size,
          percent: Math.min(percent, 100),
          speed: 0,
          eta: 0,
        });
      }
    }

    // Final progress update for all parts uploaded
    if (onProgress) {
      const totalUploaded = allParts.length * partSize;
      const percent = (totalUploaded / file.size) * 100;
      onProgress({
        loaded: Math.min(totalUploaded, file.size),
        total: file.size,
        percent: Math.min(percent, 100),
        speed: 0,
        eta: 0,
      });
    }

    // Sort parts by part number
    const parts = allParts.sort((a, b) => a.partNumber - b.partNumber);

    console.log(`Multipart upload summary:`);
    console.log(`- Total parts expected: ${totalParts}`);
    console.log(`- Parts actually uploaded: ${parts.length}`);
    console.log(
      `- Parts array:`,
      parts.map((p) => ({ partNumber: p.partNumber, size: p.size }))
    );

    if (parts.length !== totalParts) {
      throw new Error(
        `Expected ${totalParts} parts but only uploaded ${parts.length} parts`
      );
    }

    // Step 3: Complete multipart upload
    if (onProgress) {
      onProgress({
        loaded: file.size,
        total: file.size,
        percent: 95, // 95% - parts uploaded, now completing
        speed: 0,
        eta: 0,
      });
    }

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

    // Final progress update - upload complete
    if (onProgress) {
      onProgress({
        loaded: file.size,
        total: file.size,
        percent: 100,
        speed: 0,
        eta: 0,
      });
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
