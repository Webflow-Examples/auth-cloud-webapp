import { createAuthClient } from "better-auth/react";
import config from "../../next.config";

export const { signIn, signUp, signOut, useSession } = createAuthClient({
  baseURL: (() => {
    const baseUrl = config.BASE_URL || "";

    if (typeof window !== "undefined") {
      return `${window.location.origin}${baseUrl}/api/auth`;
    }

    if (baseUrl.startsWith("http")) {
      return `${baseUrl}/api/auth`;
    }

    return `https://hello-webflow-cloud.webflow.io${baseUrl}/api/auth`;
  })(),
});
