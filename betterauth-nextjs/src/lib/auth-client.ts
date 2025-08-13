import { createAuthClient } from "better-auth/react";
import config from "../../next.config";

export const { signIn, signUp, signOut, useSession } = createAuthClient({
  baseURL: (() => {
    const assetPrefix = config.assetPrefix || "";

    if (typeof window !== "undefined") {
      return `${window.location.origin}${assetPrefix}/api/auth`;
    }

    if (assetPrefix.startsWith("http")) {
      return `${assetPrefix}/api/auth`;
    }

    return `https://hello-webflow-cloud.webflow.io${assetPrefix}/api/auth`;
  })(),
});
