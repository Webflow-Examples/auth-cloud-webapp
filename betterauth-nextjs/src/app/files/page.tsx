"use client";

import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import {
  uploadFile,
  listFiles,
  deleteFile,
  FileInfo,
  getFileTypeCategory,
  formatFileSize,
  getFileIcon,
} from "@/lib/file-api";
import config from "../../../next.config";

export default function FilesPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    text: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
      return;
    }

    if (session) {
      loadFiles();
    }
  }, [session, isPending, router]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const response = await listFiles();
      if (response.success && response.files) {
        setFiles(response.files);
      } else {
        showStatus(response.error || "Failed to load files", "error");
      }
    } catch (error) {
      showStatus("Failed to load files", "error");
    } finally {
      setLoading(false);
    }
  };

  const showStatus = (text: string, type: "success" | "error" | "info") => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    showStatus("Uploading file...", "info");

    try {
      const response = await uploadFile(selectedFile);
      if (response.success) {
        showStatus("File uploaded successfully!", "success");
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        await loadFiles(); // Reload the file list
      } else {
        showStatus(response.error || "Failed to upload file", "error");
      }
    } catch (error) {
      showStatus("Failed to upload file", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (key: string, filename: string) => {
    if (!confirm(`Are you sure you want to delete "${filename}"?`)) return;

    setDeleting(key);
    try {
      const response = await deleteFile(key);
      if (response.success) {
        showStatus("File deleted successfully!", "success");
        await loadFiles(); // Reload the file list
      } else {
        showStatus(response.error || "Failed to delete file", "error");
      }
    } catch (error) {
      showStatus("Failed to delete file", "error");
    } finally {
      setDeleting(null);
    }
  };

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      showStatus("URL copied to clipboard!", "success");
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (error) {
      showStatus("Failed to copy URL", "error");
    }
  };

  const openFile = (url: string) => {
    window.open(url, "_blank");
  };

  if (isPending || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-wf-visual-sans-semibold">
            File Manager
          </h1>
          <p className="text-center text-gray-600 mb-8">
            Upload and manage your files for use in Webflow sites
          </p>

          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-4 mb-6 rounded-md ${
                statusMessage.type === "success"
                  ? "bg-green-100 text-green-700 border border-green-200"
                  : statusMessage.type === "error"
                  ? "bg-red-100 text-red-700 border border-red-200"
                  : "bg-blue-100 text-blue-700 border border-blue-200"
              }`}
            >
              {statusMessage.text}
            </div>
          )}

          {/* Upload Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Upload New File</h2>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 bg-gray-50"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                accept="*/*"
              />

              {!selectedFile ? (
                <div>
                  <div className="text-4xl mb-4">📁</div>
                  <p className="text-lg text-gray-600 mb-2">
                    Drag and drop a file here, or{" "}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-blue-600 hover:text-blue-700 underline"
                    >
                      browse files
                    </button>
                  </p>
                  <p className="text-sm text-gray-500">
                    Supports any file type up to 100MB
                  </p>
                </div>
              ) : (
                <div>
                  <div className="text-4xl mb-4">
                    {getFileIcon(selectedFile.type)}
                  </div>
                  <p className="text-lg font-medium mb-2">
                    {selectedFile.name}
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    {formatFileSize(selectedFile.size)} •{" "}
                    {getFileTypeCategory(selectedFile.type)}
                  </p>

                  {/* Upload Progress */}
                  {uploading && (
                    <div className="mb-4">
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300 animate-pulse"
                          style={{ width: "60%" }}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-600">Uploading file...</p>
                    </div>
                  )}

                  <div className="flex gap-2 justify-center">
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      disabled={uploading}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleUpload}
                      disabled={uploading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {uploading ? (
                        <span className="flex items-center">
                          <svg
                            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Uploading...
                        </span>
                      ) : (
                        "Upload File"
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Files List */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Your Files</h2>
            {loading ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-4">📂</div>
                <p>Loading files...</p>
                <div className="mt-4">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              </div>
            ) : files.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-4">📂</div>
                <p>No files uploaded yet</p>
                <p className="text-sm">Upload your first file to get started</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {files.map((file) => (
                  <div
                    key={file.key}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="text-2xl">
                        {getFileIcon(file.contentType)}
                      </div>
                      <button
                        onClick={() => handleDelete(file.key, file.filename)}
                        disabled={deleting === file.key}
                        className="text-red-500 hover:text-red-700 text-sm disabled:opacity-50"
                      >
                        {deleting === file.key ? (
                          <span className="flex items-center">
                            <svg
                              className="animate-spin -ml-1 mr-1 h-3 w-3"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            Deleting...
                          </span>
                        ) : (
                          "Delete"
                        )}
                      </button>
                    </div>

                    <h3
                      className="font-medium text-gray-900 mb-1 truncate"
                      title={file.filename}
                    >
                      {file.filename}
                    </h3>

                    <p className="text-sm text-gray-600 mb-2">
                      {formatFileSize(file.fileSize)} •{" "}
                      {getFileTypeCategory(file.contentType)}
                    </p>

                    <p className="text-xs text-gray-500 mb-3">
                      Uploaded {new Date(file.uploadedAt).toLocaleDateString()}
                    </p>

                    <div className="flex gap-2">
                      <button
                        onClick={() => openFile(file.url)}
                        className="flex-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Open
                      </button>
                      <button
                        onClick={() => copyToClipboard(file.url)}
                        className={`px-3 py-1 text-sm rounded ${
                          copiedUrl === file.url
                            ? "bg-green-600 text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                      >
                        {copiedUrl === file.url ? (
                          <span className="flex items-center">
                            <svg
                              className="w-3 h-3 mr-1"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Copied!
                          </span>
                        ) : (
                          "Copy URL"
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Back Button */}
          <div className="mt-8 text-center">
            <button
              onClick={() => router.push(`${config.assetPrefix}/`)}
              className="bg-gray-600 text-white px-6 py-3 rounded-md font-medium hover:bg-gray-700 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
