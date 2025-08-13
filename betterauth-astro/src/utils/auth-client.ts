import { createAuthClient } from "better-auth/client";

export const authClient = createAuthClient({
  /** The base URL of the server (optional if you're using the same domain) */
  baseURL: (() => {
    const assetsPrefix = (import.meta.env.ASSETS_PREFIX as string) || "";

    if (typeof window !== "undefined") {
      return `${window.location.origin}${assetsPrefix}/api/auth`;
    }

    if (assetsPrefix.startsWith("http")) {
      return `${assetsPrefix}/api/auth`;
    }

    return `https://hello-webflow-cloud.webflow.io${assetsPrefix}/api/auth`;
  })(),
});
