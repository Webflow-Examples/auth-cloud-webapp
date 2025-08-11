import { createAuthClient } from "better-auth/client";
export const authClient = createAuthClient({
  /** The base URL of the server (optional if you're using the same domain) */
  baseURL:
    typeof window !== "undefined"
      ? `${window.location.origin}/app/api/auth`
      : "https://hello-webflow-cloud.webflow.io/app/api/auth",
});
