# Wine Library

A durable personal wine catalog app, migrated from the original `wine-catalog.jsx` prototype.

The first phase keeps the prototype behavior intact while moving cellar data out of JSX and into validated JSON files. The app currently uses local browser storage under the original `wine-cellar-v3` key so existing saved browser data can still load.

## Planning

The product roadmap, milestones, and implementation issues live in the [Wine Library Linear project](https://linear.app/zkutty/project/wine-library-06f9304f6281). Reference the relevant Linear issue before starting roadmap work, and keep its status and scope aligned with the implementation.

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

## Guardrails

- Do not invent wine facts during migration.
- Preserve legacy fields and strings, including emoji labels.
- Keep `wine-cellar-v3` compatibility until a deliberate storage migration exists.
- Keep the legacy component until the migrated UI has been verified.
