import { auth } from "../../../utils/auth";
import type { APIRoute } from "astro";

export const ALL: APIRoute = async (ctx) => {
  // If you want to use rate limiting, make sure to set the 'x-forwarded-for' header to the request headers from the context
  // ctx.request.headers.set("x-forwarded-for", ctx.clientAddress);
  const authHandler = await auth(ctx.locals.runtime.env as Cloudflare.Env);
  return authHandler.handler(ctx.request);
};
