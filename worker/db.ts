/**
 * D1 persistence for the cellar.
 *
 * The `data` column holds the full validated record; the other columns are a
 * projection derived on write. All writes go through `toRow` so the projection
 * cannot drift from the record it describes.
 */

import { wineBottleSchema, type WineBottle } from "../src/lib/wine-schema";

export type ImportSummary = {
  imported: number;
  skipped: number;
  errors: string[];
};

type WineRow = {
  data: string;
};

function textOrNull(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  }

  if (typeof value === "number") {
    return String(value);
  }

  return null;
}

function toRow(wine: WineBottle) {
  return [
    wine.id,
    typeof wine.legacyId === "number" ? wine.legacyId : null,
    wine.producer ?? "",
    wine.name,
    textOrNull(wine.vintage),
    textOrNull(wine.country),
    textOrNull(wine.region),
    textOrNull(wine.subregion),
    textOrNull(wine.varietal),
    textOrNull(wine.style),
    textOrNull(wine.occasion),
    wine.status,
    wine.quantity,
    textOrNull(wine.drunkDate),
    JSON.stringify(wine),
    wine.createdAt,
    wine.updatedAt,
  ];
}

const UPSERT_SQL = `
  insert into wines (
    id, legacy_id, producer, name, vintage, country, region, subregion,
    varietal, style, occasion, status, quantity, drunk_date, data,
    created_at, updated_at
  )
  values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  on conflict(id) do update set
    legacy_id  = excluded.legacy_id,
    producer   = excluded.producer,
    name       = excluded.name,
    vintage    = excluded.vintage,
    country    = excluded.country,
    region     = excluded.region,
    subregion  = excluded.subregion,
    varietal   = excluded.varietal,
    style      = excluded.style,
    occasion   = excluded.occasion,
    status     = excluded.status,
    quantity   = excluded.quantity,
    drunk_date = excluded.drunk_date,
    data       = excluded.data,
    updated_at = excluded.updated_at
`;

function parseRow(row: WineRow): WineBottle {
  return JSON.parse(row.data) as WineBottle;
}

export async function countWines(db: D1Database): Promise<number> {
  const row = await db.prepare("select count(*) as total from wines").first<{ total: number }>();
  return row?.total ?? 0;
}

export async function listWines(db: D1Database): Promise<WineBottle[]> {
  const { results } = await db
    .prepare("select data from wines order by created_at asc, id asc")
    .all<WineRow>();

  return results.map(parseRow);
}

export async function getWine(db: D1Database, id: string): Promise<WineBottle | null> {
  const row = await db.prepare("select data from wines where id = ?").bind(id).first<WineRow>();
  return row ? parseRow(row) : null;
}

export async function upsertWine(db: D1Database, wine: WineBottle): Promise<void> {
  await db
    .prepare(UPSERT_SQL)
    .bind(...toRow(wine))
    .run();
}

export async function deleteWine(db: D1Database, id: string): Promise<boolean> {
  const result = await db.prepare("delete from wines where id = ?").bind(id).run();
  return (result.meta.changes ?? 0) > 0;
}

/**
 * Imports a batch of records, validating each one. Invalid records are reported
 * rather than aborting the batch, so one malformed bottle cannot block a
 * migration of the rest of the cellar.
 */
export async function importWines(db: D1Database, input: unknown): Promise<ImportSummary> {
  if (!Array.isArray(input)) {
    return { imported: 0, skipped: 0, errors: ["expected an array of wines"] };
  }

  const statements: D1PreparedStatement[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();
  let skipped = 0;

  for (const [index, candidate] of input.entries()) {
    const parsed = wineBottleSchema.safeParse(candidate);

    if (!parsed.success) {
      skipped += 1;
      const label =
        candidate && typeof candidate === "object" && "name" in candidate
          ? String((candidate as { name: unknown }).name)
          : `index ${index}`;
      errors.push(`${label}: ${parsed.error.issues.map((issue) => issue.message).join("; ")}`);
      continue;
    }

    // A batch runs as one transaction, so two rows with the same id would
    // collide inside it rather than upsert over each other.
    if (seen.has(parsed.data.id)) {
      skipped += 1;
      errors.push(`${parsed.data.name}: duplicate id ${parsed.data.id} in payload`);
      continue;
    }

    seen.add(parsed.data.id);
    statements.push(db.prepare(UPSERT_SQL).bind(...toRow(parsed.data)));
  }

  if (statements.length > 0) {
    await db.batch(statements);
  }

  return { imported: statements.length, skipped, errors };
}
