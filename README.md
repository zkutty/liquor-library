# Wine Library

A durable personal wine catalog app, migrated from the original `wine-catalog.jsx` prototype.

The first phase keeps the prototype behavior intact while moving cellar data out of JSX and into validated JSON files. The app currently uses local browser storage under the original `wine-cellar-v3` key so existing saved browser data can still load.

## Planning

The product roadmap, milestones, and implementation issues live in the [Liquor Library Linear project](https://linear.app/zkutty/project/liquor-library-06f9304f6281). Reference the relevant Linear issue before starting roadmap work, and keep its status and scope aligned with the implementation.

## Setup

```bash
npm install
npm run migrate:wines
npm run dev
```

Open `http://localhost:3000`.

## Project Shape

- `legacy/wine-catalog.jsx` keeps the untouched source prototype.
- `src/data/cellar.seed.json` contains migrated starter bottles.
- `src/lib/wine-schema.ts` defines the application data model.
- `src/lib/wine-store.ts` owns browser storage compatibility.
- `scripts/migrate-wine-catalog.mjs` extracts `DEFAULT_WINES` into structured JSON.
- `tests/wine-data.test.mjs` validates the generated data.
- `worker/index.ts` is the Cloudflare Worker entry point serving the built site and `/api/*`.

## Deployment

The app deploys to Cloudflare Workers. `next build` produces a static export in
`out/`, which the Worker serves through its assets binding; the Worker itself
handles `/api/*` so it can reach D1 and R2.

```bash
npm run cf:typecheck   # typecheck the Worker against Workers types
npm run cf:preview     # build, then run locally in the workerd runtime
npm run cf:deploy      # build, then deploy to Cloudflare
```

Deploying requires `CLOUDFLARE_API_TOKEN` in the environment (or an interactive
`wrangler login`). `npm run cf:typegen` regenerates Worker binding types.

### Bindings

| Binding | Resource | Purpose |
| --- | --- | --- |
| `ASSETS` | Workers Assets (`out/`) | Serves the static site |
| `DB` | D1 database `liquor-library` | Cellar records |
| `IMAGES` | R2 bucket `liquor-library-images` | Label and bottle images |

`GET /api/health` reports whether D1 and R2 are reachable, returning 200 when
both are healthy and 503 otherwise. Use it to verify a deploy.

### Rollback

Every deploy creates a new Worker version. Roll back from the Cloudflare
dashboard (Workers → liquor-library → Deployments) or with
`wrangler rollback [version-id]`.

## Guardrails

- Do not invent wine facts during migration.
- Preserve legacy fields and strings, including emoji labels.
- Keep `wine-cellar-v3` compatibility until a deliberate storage migration exists.
- Keep the legacy component until the migrated UI has been verified.
