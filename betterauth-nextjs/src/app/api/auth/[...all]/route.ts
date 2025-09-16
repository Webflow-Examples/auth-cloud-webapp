import { createAuth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

const handler = async (request: Request) => {
  const auth = await createAuth(request);
  return auth.handler(request);
};

export const { POST, GET } = toNextJsHandler(handler);
