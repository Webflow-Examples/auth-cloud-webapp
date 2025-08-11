import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDbAsync } from "../db/getDb";
import * as schema from "../db/schema";

export const auth = async (envMap: Cloudflare.Env) => {
  const dbInstance = await getDbAsync(envMap.DB);

  return betterAuth({
    database: drizzleAdapter(dbInstance, {
      provider: "sqlite",
      schema,
    }),
    emailAndPassword: {
      enabled: true,
    },
    secret: envMap.BETTER_AUTH_SECRET,
    baseUrl: envMap.BETTER_AUTH_URL,
    trustedOrigins: [
      "http://localhost:4321",
      "http://localhost:8787",
      "https://hello-webflow-cloud.webflow.io",
      envMap.BETTER_AUTH_URL || "",
    ],
  });
};
