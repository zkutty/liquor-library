/**
 * Cloudflare Worker entry point for Liquor Library.
 *
 * Static assets (the Next.js `output: "export"` build in `out/`) are served by
 * the assets binding. Only `/api/*` runs this Worker first, per wrangler.jsonc.
 */

import { readAccessConfig, verifyAccessJwt } from "./access";

export interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  IMAGES: R2Bucket;
  ACCESS_TEAM_DOMAIN?: string;
  ACCESS_AUD?: string;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

/**
 * Reports whether each binding is reachable and whether Access enforcement is
 * configured, so a deploy can be verified end to end before any cellar data
 * depends on it.
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

  checks.access = readAccessConfig(env as unknown as Record<string, unknown>)
    ? "enforced"
    : "not configured";

  const healthy = checks.d1 === "ok" && checks.r2 === "ok";

  return json({ status: healthy ? "ok" : "degraded", checks }, healthy ? 200 : 503);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (!url.pathname.startsWith("/api/")) {
      return env.ASSETS.fetch(request);
    }

    // `/api/health` reports infrastructure state only, never collection data,
    // and stays reachable without an assertion so a deploy can be verified
    // before Access is configured.
    if (url.pathname === "/api/health") {
      return handleHealth(env);
    }

    const access = await verifyAccessJwt(
      request,
      readAccessConfig(env as unknown as Record<string, unknown>),
    );

    // When Access is unconfigured the edge is not injecting assertions, so
    // enforcing here would reject every request. The edge Access application is
    // the primary control; this check is defence in depth against it being
    // removed or misconfigured. `/api/health` surfaces which mode is active.
    if (access.state === "invalid") {
      return json({ error: "Unauthorized", reason: access.reason }, 401);
    }

    return json({ error: "Not found" }, 404);
  },
} satisfies ExportedHandler<Env>;
