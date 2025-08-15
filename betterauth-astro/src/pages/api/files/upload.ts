import type { APIRoute } from "astro";
import { auth } from "../../../utils/auth";
import { createFileService } from "../../../utils/file-service";

export const POST: APIRoute = async ({ request, locals }) => {
  // Debug logging
  console.log(
    "Request headers:",
    Object.fromEntries(request.headers.entries())
  );
  console.log("BETTER_AUTH_URL:", locals.runtime.env.BETTER_AUTH_URL);
  console.log("Request origin:", request.headers.get("origin"));

  // Set CORS origin dynamically based on request origin
  const requestOrigin = request.headers.get("origin");
  const corsOrigin = requestOrigin || locals.runtime.env.BETTER_AUTH_URL;

  // Allow specific Webflow domains
  const allowedOrigins = [
    "https://hello-webflow-cloud.webflow.io",
    "https://537a24e0-ec01-494a-a5df-97898f3390cf.wf-app-prod.cosmic.webflow.services",
    locals.runtime.env.BETTER_AUTH_URL,
  ];

  const finalCorsOrigin =
    (allowedOrigins.includes(requestOrigin || "")
      ? requestOrigin
      : locals.runtime.env.BETTER_AUTH_URL) || "*";

  try {
    // Get the authenticated user
    const authInstance = await auth(locals.runtime.env);
    const session = await authInstance.api.getSession({
      headers: request.headers,
    });

    console.log("Session found:", !!session);
    console.log("Session user:", session?.user?.id);

    if (!session?.user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Unauthorized - No valid session found",
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": finalCorsOrigin,
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers":
              "Content-Type, Authorization, X-Requested-With",
            "Access-Control-Allow-Credentials": "true",
          },
        }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file || file.size === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No file provided",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": finalCorsOrigin,
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers":
              "Content-Type, Authorization, X-Requested-With",
            "Access-Control-Allow-Credentials": "true",
          },
        }
      );
    }

    // Validate file size (5GB limit)
    const maxSize = 5 * 1024 * 1024 * 1024; // 5GB
    if (file.size > maxSize) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "File size must be less than 5GB",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": finalCorsOrigin,
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers":
              "Content-Type, Authorization, X-Requested-With",
            "Access-Control-Allow-Credentials": "true",
          },
        }
      );
    }

    console.log(`Uploading file: ${file.name}, size: ${file.size} bytes`);

    // Create file service
    const fileService = createFileService(
      locals.runtime.env.USER_AVATARS,
      new URL(request.url).origin
    );

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Upload file
    const uploadResult = await fileService.uploadFile(
      session.user.id,
      arrayBuffer,
      file.name,
      file.type
    );

    if (!uploadResult.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: uploadResult.error || "Upload failed",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": finalCorsOrigin,
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers":
              "Content-Type, Authorization, X-Requested-With",
            "Access-Control-Allow-Credentials": "true",
          },
        }
      );
    }

    console.log(`File uploaded successfully: ${uploadResult.url}`);

    return new Response(
      JSON.stringify({
        success: true,
        url: uploadResult.url,
        key: uploadResult.key,
        filename: file.name,
        fileSize: file.size,
        contentType: file.type,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": finalCorsOrigin,
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers":
            "Content-Type, Authorization, X-Requested-With",
          "Access-Control-Allow-Credentials": "true",
        },
      }
    );
  } catch (error) {
    console.error("Error uploading file:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": finalCorsOrigin,
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers":
            "Content-Type, Authorization, X-Requested-With",
          "Access-Control-Allow-Credentials": "true",
        },
      }
    );
  }
};

// Handle OPTIONS for CORS
export const OPTIONS: APIRoute = async ({ request, locals }) => {
  const requestOrigin = request.headers.get("origin");
  const allowedOrigins = [
    "https://hello-webflow-cloud.webflow.io",
    "https://537a24e0-ec01-494a-a5df-97898f3390cf.wf-app-prod.cosmic.webflow.services",
    locals.runtime.env.BETTER_AUTH_URL,
  ];

  const finalCorsOrigin =
    (allowedOrigins.includes(requestOrigin || "")
      ? requestOrigin
      : locals.runtime.env.BETTER_AUTH_URL) || "*";

  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": finalCorsOrigin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, Authorization, X-Requested-With",
      "Access-Control-Allow-Credentials": "true",
    },
  });
};
