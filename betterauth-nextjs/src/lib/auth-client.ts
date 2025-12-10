import { createAuthClient } from "better-auth/react";
import config from "../../next.config";

export const { signIn, signUp, signOut, useSession } = createAuthClient({
  baseURL: (() => {
    const basePath = config.basePath || "";

    if (typeof window !== "undefined") {
      return `${process.env.BETTER_AUTH_URL}/${basePath}/api/auth`;
    }

    if (basePath.startsWith("http")) {
      return `${basePath}/${config.basePath}/api/auth`;
    }

    return `${process.env.BETTER_AUTH_URL}/${basePath}/api/auth`;
  })(),
});
