import { createAuthClient } from "better-auth/client";
export const authClient = createAuthClient({
  /** The base URL of the server (optional if you're using the same domain) */
  baseURL:
    import.meta.env.MODE === "development"
      ? typeof window !== "undefined"
        ? `${window.location.origin}${import.meta.env.ASSETS_PREFIX}/api/auth`
        : `${import.meta.env.BETTERAUTH_URL}${
            import.meta.env.ASSETS_PREFIX
          }/api/auth`
      : typeof window !== "undefined"
      ? `${window.location.origin}/${
          import.meta.env.ASSETS_PREFIX.path
        }/api/auth`
      : `${import.meta.env.BETTERAUTH_URL}/${
          import.meta.env.ASSETS_PREFIX.path
        }/api/auth`,
});
