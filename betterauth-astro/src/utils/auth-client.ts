import { createAuthClient } from "better-auth/client";

export const authClient = createAuthClient({
  /** The base URL of the server (optional if you're using the same domain) */
  baseURL: (() => {
    const assetsPrefix = (import.meta.env.ASSETS_PREFIX as string) || "";

    console.log("ASSETS_PREFIX:", assetsPrefix);
    console.log("typeof window:", typeof window);
    console.log(
      "assetsPrefix.startsWith('http'):",
      assetsPrefix.startsWith("http")
    );

    if (typeof window !== "undefined") {
      // In browser: if assetsPrefix is a full URL, use it directly
      if (assetsPrefix.startsWith("http")) {
        const browserUrl = `${assetsPrefix}/api/auth`;
        console.log("Browser URL (full):", browserUrl);
        return browserUrl;
      }
      // In browser: if assetsPrefix is just a path, add window.location.origin
      const browserUrl = `${window.location.origin}${assetsPrefix}/api/auth`;
      console.log("Browser URL (path):", browserUrl);
      return browserUrl;
    }

    // Server-side: if assetsPrefix is a full URL, use it directly
    if (assetsPrefix.startsWith("http")) {
      const serverUrl = `${assetsPrefix}/api/auth`;
      console.log("Server URL (full):", serverUrl);
      return serverUrl;
    }

    // Server-side: if assetsPrefix is just a path, add the domain
    const fallbackUrl = `https://hello-webflow-cloud.webflow.io${assetsPrefix}/api/auth`;
    console.log("Server URL (fallback):", fallbackUrl);
    return fallbackUrl;
  })(),
});
