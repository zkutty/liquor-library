/**
 * Cloudflare Worker entry point for Liquor Library.
 *
 * Static assets (the Next.js `output: "export"` build in `out/`) are served by
 * the assets binding. Only `/api/*` runs this Worker first, per wrangler.jsonc.
 */

export interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  IMAGES: R2Bucket;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

/**
 * Reports whether each binding is actually reachable, so a deploy can be
 * verified end to end before any cellar data depends on it.
 */
async function handleHealth(env: Env): Promise<Response> {
  const checks: Record<string, string> = {};

  try {
    await env.DB.prepare("select 1").first();
    checks.d1 = "ok";
  } catch (error) {
    checks.d1 = `error: ${error instanceof Error ? error.message : String(error)}`;
  }

  try {
    await env.IMAGES.list({ limit: 1 });
    checks.r2 = "ok";
  } catch (error) {
    checks.r2 = `error: ${error instanceof Error ? error.message : String(error)}`;
  }

  const healthy = Object.values(checks).every((value) => value === "ok");

  return json({ status: healthy ? "ok" : "degraded", checks }, healthy ? 200 : 503);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return handleHealth(env);
    }

    if (url.pathname.startsWith("/api/")) {
      return json({ error: "Not found" }, 404);
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
