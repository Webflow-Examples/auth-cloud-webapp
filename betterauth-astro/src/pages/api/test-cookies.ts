import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ request }) => {
  const corsOrigin = "https://hello-webflow-cloud.webflow.io";

  // Log all headers and cookies
  const headers = Object.fromEntries(request.headers.entries());
  const cookies = request.headers.get("cookie") || "";

  console.log("All headers:", headers);
  console.log("Cookies:", cookies);

  return new Response(
    JSON.stringify({
      success: true,
      headers,
      cookies,
      cookieArray: cookies.split("; ").map((cookie) => {
        const [name, value] = cookie.split("=");
        return { name, value: value ? decodeURIComponent(value) : "" };
      }),
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": corsOrigin,
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Credentials": "true",
      },
    }
  );
};

export const OPTIONS: APIRoute = async () => {
  const corsOrigin = "https://hello-webflow-cloud.webflow.io";

  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": corsOrigin,
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Credentials": "true",
    },
  });
};
