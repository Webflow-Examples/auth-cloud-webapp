import { createAuthClient } from "better-auth/react";
import config from "../../next.config";

export const { signIn, signUp, signOut, useSession } = createAuthClient({
  baseURL:
    typeof window !== "undefined"
      ? `${window.location.origin}${config.assetPrefix}/api/auth`
      : `http://localhost:8787${config.assetPrefix}/api/auth`,
});
