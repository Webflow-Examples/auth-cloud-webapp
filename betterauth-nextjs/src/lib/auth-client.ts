import { createAuthClient } from "better-auth/react";
import config from "../../next.config";

export const { signIn, signUp, signOut, useSession } = createAuthClient({
  baseURL: (() => {
    const basePath = config.basePath || "";
    console.log("baseUrl", basePath);
    console.log("process.env.NEXT_PUBLIC_BASE_URL", process.env.NEXT_PUBLIC_BASE_URL);
    console.log("process.env.BASE_URL", process.env.BASE_URL);

    if (typeof window !== "undefined") {
      console.log("CHOSEN 1");
      return `${process.env.NEXT_PUBLIC_BASE_URL}/${basePath}/api/auth`;
    }

    if (basePath.startsWith("http")) {
      console.log("CHOSEN 2");
      return `${basePath}/${config.basePath}/api/auth`;
    }

    console.log("CHOSEN 3");
    return `${process.env.NEXT_PUBLIC_BASE_URL}/${config.basePath}/api/auth`;
  })(),
});
