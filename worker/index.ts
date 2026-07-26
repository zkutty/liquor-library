/**
 * Cloudflare Worker entry point for Liquor Library.
 *
 * Static assets (the Next.js `output: "export"` build in `out/`) are served by
 * the assets binding. Only `/api/*` runs this Worker first, per wrangler.jsonc.
 */

import { wineBottleSchema } from "../src/lib/wine-schema";
import { readAccessConfig, verifyAccessJwt } from "./access";
import { countWines, deleteWine, getWine, importWines, listWines, upsertWine } from "./db";

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

async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
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

async function handleWines(request: Request, env: Env, id: string | null): Promise<Response> {
  if (id === null) {
    switch (request.method) {
      case "GET": {
        const wines = await listWines(env.DB);
        return json({ wines, count: wines.length });
      }
      case "POST": {
        const parsed = wineBottleSchema.safeParse(await readJsonBody(request));

        if (!parsed.success) {
          return json({ error: "Invalid wine", issues: parsed.error.issues }, 400);
        }

        await upsertWine(env.DB, parsed.data);
        return json({ wine: parsed.data }, 201);
      }
      default:
        return json({ error: "Method not allowed" }, 405);
    }
  }

  switch (request.method) {
    case "GET": {
      const wine = await getWine(env.DB, id);
      return wine ? json({ wine }) : json({ error: "Not found" }, 404);
    }
    case "PUT": {
      const parsed = wineBottleSchema.safeParse(await readJsonBody(request));

      if (!parsed.success) {
        return json({ error: "Invalid wine", issues: parsed.error.issues }, 400);
      }

      if (parsed.data.id !== id) {
        return json({ error: "Body id does not match the path id" }, 400);
      }

      await upsertWine(env.DB, parsed.data);
      return json({ wine: parsed.data });
    }
    case "DELETE": {
      const deleted = await deleteWine(env.DB, id);
      return deleted ? json({ deleted: id }) : json({ error: "Not found" }, 404);
    }
    default:
      return json({ error: "Method not allowed" }, 405);
  }
}

/**
 * Accepts a full cellar payload. Used by the first-run migration that moves
 * records out of browser storage, and by restore from an export.
 */
async function handleImport(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const body = await readJsonBody(request);
  const wines = Array.isArray(body) ? body : (body as { wines?: unknown })?.wines;
  const summary = await importWines(env.DB, wines);

  // Nothing landed and something was wrong with the payload: report it as a
  // client error rather than a successful no-op.
  const rejected = summary.imported === 0 && summary.errors.length > 0;

  return json(summary, rejected ? 400 : 200);
}

/** Full backup of the cellar, in the same shape `/api/import` accepts. */
async function handleExport(env: Env): Promise<Response> {
  const wines = await listWines(env.DB);

  return new Response(JSON.stringify({ wines, exportedAt: new Date().toISOString() }, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="liquor-library-backup.json"`,
    },
  });
}

async function handleApi(request: Request, env: Env, url: URL): Promise<Response> {
  const segments = url.pathname.split("/").filter(Boolean).slice(1);

  if (segments[0] === "wines" && segments.length <= 2) {
    return handleWines(request, env, segments[1] ?? null);
  }

  if (segments[0] === "import" && segments.length === 1) {
    return handleImport(request, env);
  }

  if (segments[0] === "export" && segments.length === 1) {
    return handleExport(env);
  }

  if (segments[0] === "stats" && segments.length === 1) {
    return json({ wines: await countWines(env.DB) });
  }

  return json({ error: "Not found" }, 404);
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

    try {
      return await handleApi(request, env, url);
    } catch (error) {
      console.error("API error", error);
      return json({ error: "Internal error" }, 500);
    }
  },
} satisfies ExportedHandler<Env>;
