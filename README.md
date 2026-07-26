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

### Cellar data

Records live in D1. `migrations/` holds the schema; apply it with
`npm run db:migrate:local` for local development and `npm run db:migrate` for
the deployed database. The schema is already applied to the remote database, and
the migration is written to be safe to re-run.

The `wines.data` column holds the full validated record and is the source of
truth. The other columns are a projection derived on write, so the terroir atlas
and cellar insights can filter and aggregate in SQL without parsing every row.

| Route | Purpose |
| --- | --- |
| `GET /api/wines` | List the cellar |
| `POST /api/wines` | Create a bottle |
| `GET /api/wines/:id` | Read one bottle |
| `PUT /api/wines/:id` | Replace one bottle |
| `DELETE /api/wines/:id` | Remove one bottle |
| `POST /api/import` | Bulk upsert, used by migration and restore |
| `GET /api/export` | Full backup, in the shape `/api/import` accepts |
| `GET /api/stats` | Record count |
| `GET /api/health` | Binding and Access status |

Writes are validated against `wineBottleSchema`, which the Worker and the client
share so the two cannot disagree about the model.

### Migrating off browser storage

On first load against an empty database the app performs a one-time migration:
records under the old `wine-cellar-v3` key are pushed up, and if there are none
the bundled seed is used instead. Imports are keyed by id, so re-running one
cannot duplicate a bottle.

If the API is unreachable — the case under `npm run dev`, where no Worker is
running — the app falls back to browser storage and the header reads
"This browser only" instead of "Synced", so unsynced data is never mistaken for
saved data. Use `npm run cf:preview` to develop against the real stack.

### Backup and restore

`GET /api/export` downloads the full cellar as JSON. Restore by posting that
file's `wines` array back to `POST /api/import`.

### Private access

The site is owner-only. Access is enforced in two layers.

**1. Cloudflare Access at the edge (primary).** In the Cloudflare dashboard, go
to Workers & Pages → `liquor-library` → Settings → Domains & Routes and select
**Enable Cloudflare Access** for the `workers.dev` URL. This creates a reusable
`liquor-library - Production` policy; edit it under Zero Trust → Access →
Applications to restrict it to the owner's email. No custom domain is required.

**2. Assertion verification in the Worker (defence in depth).** Set these Worker
variables so the Worker independently verifies the signed Access assertion:

| Variable | Value |
| --- | --- |
| `ACCESS_TEAM_DOMAIN` | `<your-team>.cloudflareaccess.com` |
| `ACCESS_AUD` | The Application Audience tag from the Access application |

With both set, `/api/*` requires a valid RS256 assertion whose audience and
issuer match. Without them the Worker cannot verify anything and defers to the
edge, and `/api/health` reports `access: "not configured"` so the gap is
visible. `/api/health` never returns collection data and stays reachable so a
deploy can be verified before Access is configured.

### Rollback

Every deploy creates a new Worker version. Roll back from the Cloudflare
dashboard (Workers → liquor-library → Deployments) or with
`wrangler rollback [version-id]`.

## Guardrails

- Do not invent wine facts during migration.
- Preserve legacy fields and strings, including emoji labels.
- Keep `wine-cellar-v3` compatibility until a deliberate storage migration exists.
- Keep the legacy component until the migrated UI has been verified.
