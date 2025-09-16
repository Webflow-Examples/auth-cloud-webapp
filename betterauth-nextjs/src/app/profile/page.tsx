"use client";

import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import {
  fetchProfile,
  updateProfile,
  validateProfileData,
} from "@/lib/profile-api";
import config from "../../../next.config";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  image?: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export default function ProfilePage() {
  const basePath = config.basePath;
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    text: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
      return;
    }

    if (session) {
      loadProfile();
    }
  }, [session, isPending, router]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await fetchProfile();
      if (response.success && response.user) {
        setProfile(response.user);
        setPreviewUrl(response.user.image || null);
      } else {
        showStatus(response.error || "Failed to load profile", "error");
      }
    } catch (error) {
      showStatus("Failed to load profile", "error");
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

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!profile) return;

    const formData = new FormData(event.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;

    // Validate data
    const validation = validateProfileData({
      name,
      email,
      avatar: selectedFile || undefined,
    });
    if (!validation.valid) {
      showStatus(validation.errors.join(", "), "error");
      return;
    }

    // Show loading state
    setSaving(true);
    showStatus("Updating profile...", "info");

    try {
      const response = await updateProfile({
        name,
        email,
        avatar: selectedFile || undefined,
      });

      if (response.success) {
        showStatus("Profile updated successfully!", "success");
        setSelectedFile(null);
        // Reload profile to get updated data
        await loadProfile();
      } else {
        showStatus(response.error || "Failed to update profile", "error");
      }
    } catch (error) {
      showStatus("Failed to update profile", "error");
    } finally {
      setSaving(false);
    }
  };

  if (isPending || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!session || !profile) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-wf-visual-sans-semibold">
          Account Details
        </h1>

        {/* Status Message */}
        {statusMessage && (
          <div
            className={`p-4 mb-4 rounded-md ${
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
        <form onSubmit={handleSubmit}>
          {/* Avatar Section */}
          <div className="text-center mb-8 p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
            <div className="mb-4">
              <img
                src={previewUrl || `${basePath}/default-avatar.svg`}
                alt="Profile Picture"
                className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg mx-auto"
                onError={(e) => {
                  (
                    e.target as HTMLImageElement
                  ).src = `${basePath}/default-avatar.svg`;
                }}
              />
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={handleUploadClick}
              className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition-colors"
            >
              Upload New Picture
            </button>
            <p className="text-sm text-gray-600 mt-2">
              JPEG, PNG, GIF, or WebP (max 5MB)
            </p>
          </div>

          {/* User Details Form */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name
            </label>
            <input
              type="text"
              name="name"
              defaultValue={profile.name}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              defaultValue={profile.email}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Account Info */}
          <div className="mb-8 p-4 bg-gray-50 rounded-md text-sm">
            <p className="mb-1">
              <strong>Account ID:</strong> {profile.id}
            </p>
            <p className="mb-1">
              <strong>Email Verified:</strong>{" "}
              {profile.emailVerified ? "Yes" : "No"}
            </p>
            <p className="mb-1">
              <strong>Member Since:</strong>{" "}
              {new Date(profile.createdAt).toLocaleDateString()}
            </p>
            <p className="mb-1">
              <strong>Last Updated:</strong>{" "}
              {new Date(profile.updatedAt).toLocaleDateString()}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="bg-gray-600 text-white px-6 py-3 rounded-md font-medium hover:bg-gray-700 transition-colors"
            >
              Back to Home
            </button>
            <button
              type="button"
              onClick={() => router.push(`${basePath}/files`)}
              className="bg-purple-600 text-white px-6 py-3 rounded-md font-medium hover:bg-purple-700 transition-colors"
            >
              File Manager
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
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
                  Saving...
                </span>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
