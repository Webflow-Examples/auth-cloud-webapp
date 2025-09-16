import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDbAsync } from "../db/getDb";
import * as schema from "../db/schema";
import config from "../../next.config";

export const createAuth = async (request: Request) => {
  const db = await getDbAsync();

  const { env } = await getCloudflareContext({ async: true });

  const baseUrl = new URL(request.url).origin;
  console.log("auth util - baseUrl", baseUrl);
  const configBasePath = config.basePath;
  const configAssetPrefix = config.assetPrefix;

  console.log("auth util - configBasePath", configBasePath);
  console.log("auth util - configAssetPrefix", configAssetPrefix);


  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema,
    }),
    emailAndPassword: {
      enabled: true,
    },
    secret: env.BETTER_AUTH_SECRET,
    baseUrl: env.BETTER_AUTH_URL,
    trustedOrigins: [
      "http://localhost:3000",
      "http://localhost:8787",
      env?.BETTER_AUTH_URL ?? "",
      // @ts-ignore
      baseUrl,
      configBasePath!,
      configAssetPrefix!,
    ],
  });
};
