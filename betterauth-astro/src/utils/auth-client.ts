import { createAuthClient } from "better-auth/client";
export const authClient = createAuthClient({
  /** The base URL of the server (optional if you're using the same domain) */
  baseURL: (() => {
    const assetsPrefix = (import.meta.env.ASSETS_PREFIX as string) || "";

    // In production, ASSETS_PREFIX is a full URL, so extract just the path
    if (
      import.meta.env.MODE === "production" &&
      assetsPrefix.startsWith("http")
    ) {
      const url = new URL(assetsPrefix);
      const path = url.pathname;

      return typeof window !== "undefined"
        ? `${window.location.origin}${path}/api/auth`
        : `${import.meta.env.BETTER_AUTH_URL}${path}/api/auth`;
    }

    // In development, ASSETS_PREFIX is just a path
    return typeof window !== "undefined"
      ? `${window.location.origin}${assetsPrefix}/api/auth`
      : `${import.meta.env.BETTER_AUTH_URL}${assetsPrefix}/api/auth`;
  })(),
});
