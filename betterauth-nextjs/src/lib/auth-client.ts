import { createAuthClient } from "better-auth/react";

export const { signIn, signUp, signOut, useSession } = createAuthClient({
  baseURL:
    typeof window !== "undefined"
      ? `${window.location.origin}/next/api/auth`
      : "http://localhost:8787/next/api/auth",
});
