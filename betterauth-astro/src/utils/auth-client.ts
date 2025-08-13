import { createAuthClient } from "better-auth/client";

export const authClient = createAuthClient({
  /** The base URL of the server (optional if you're using the same domain) */
  baseURL: (() => {
    const baseUrl = (import.meta.env.BASE_URL as string) || "";

    console.log("ASSETS_PREFIX:", baseUrl);
    console.log("typeof window:", typeof window);
    console.log("baseUrl.startsWith('http'):", baseUrl.startsWith("http"));

    if (typeof window !== "undefined") {
      // In browser: if assetsPrefix is a full URL, use it directly
      if (baseUrl.startsWith("http")) {
        const browserUrl = `${baseUrl}/api/auth`;
        console.log("Browser URL (full):", browserUrl);
        return browserUrl;
      }
      // In browser: if assetsPrefix is just a path, add window.location.origin
      const browserUrl = `${window.location.origin}${baseUrl}/api/auth`;
      console.log("Browser URL (path):", browserUrl);
      return browserUrl;
    }

    // Server-side: if assetsPrefix is a full URL, use it directly
    if (baseUrl.startsWith("http")) {
      const serverUrl = `${baseUrl}/api/auth`;
      console.log("Server URL (full):", serverUrl);
      return serverUrl;
    }

    // Server-side: if assetsPrefix is just a path, add the domain
    const fallbackUrl = `https://hello-webflow-cloud.webflow.io${baseUrl}/api/auth`;
    console.log("Server URL (fallback):", fallbackUrl);
    return fallbackUrl;
  })(),
});
