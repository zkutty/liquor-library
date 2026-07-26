import type { WineBottle } from "./wine-schema";

export const WINE_STORAGE_KEY = "wine-cellar-v3";

type LegacyStorage = {
  get: (key: string) => Promise<{ value: string } | null>;
  set: (key: string, value: string) => Promise<void>;
};

type StorageWindow = Window & {
  storage?: LegacyStorage;
};

/** Where the loaded cellar came from, so the UI can say when it is not synced. */
export type CellarSource = "cloud" | "local";

export type LoadedCellar = {
  wines: WineBottle[];
  source: CellarSource;
  migrated: number;
};

export function normalizeWineRecord(record: WineBottle | Record<string, unknown>): WineBottle {
  const raw = record as Record<string, unknown>;
  const legacyId = typeof raw.legacyId === "number" ? raw.legacyId : typeof raw.id === "number" ? raw.id : undefined;
  const rawStatus = typeof raw.status === "string" ? raw.status : "in_cellar";
  const now = new Date().toISOString();

  return {
    ...(record as WineBottle),
    id: typeof raw.id === "string" ? raw.id : legacyId ? `legacy-${legacyId}` : `wine-${Date.now()}`,
    legacyId,
    quantity: typeof raw.quantity === "number" ? raw.quantity : 1,
    status: rawStatus === "in-cellar" ? "in_cellar" : (rawStatus as WineBottle["status"]),
    legacyStatus: typeof raw.legacyStatus === "string" ? raw.legacyStatus : rawStatus,
    drinkWindowText:
      typeof raw.drinkWindowText === "string"
        ? raw.drinkWindowText
        : typeof raw.drinkWindow === "string"
          ? raw.drinkWindow
          : undefined,
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : now,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : now,
  };
}

export function mergeStoredWines(seedWines: WineBottle[], storedWines: unknown): WineBottle[] {
  if (!Array.isArray(storedWines)) {
    return seedWines;
  }

  const normalizedStored = storedWines.map((wine) => normalizeWineRecord(wine as Record<string, unknown>));
  const storedKeys = new Set(
    normalizedStored.map((wine) => wine.legacyId?.toString() ?? wine.id),
  );
  const missingSeeds = seedWines.filter((wine) => !storedKeys.has(wine.legacyId?.toString() ?? wine.id));

  return [...normalizedStored, ...missingSeeds];
}

/** Reads whatever the pre-Cloudflare browser-storage build left behind. */
export async function readLocalWines(): Promise<WineBottle[] | null> {
  if (typeof window === "undefined") {
    return null;
  }

  const storageWindow = window as StorageWindow;

  try {
    if (storageWindow.storage) {
      const result = await storageWindow.storage.get(WINE_STORAGE_KEY);
      if (result?.value) {
        return (JSON.parse(result.value) as unknown[]).map((wine) =>
          normalizeWineRecord(wine as Record<string, unknown>),
        );
      }
    }

    const value = window.localStorage.getItem(WINE_STORAGE_KEY);
    if (value) {
      return (JSON.parse(value) as unknown[]).map((wine) =>
        normalizeWineRecord(wine as Record<string, unknown>),
      );
    }
  } catch {
    return null;
  }

  return null;
}

async function api(path: string, init?: RequestInit): Promise<Response> {
  const response = await fetch(`/api${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`${init?.method ?? "GET"} /api${path} failed: ${response.status} ${detail.slice(0, 200)}`);
  }

  return response;
}

async function fetchWines(): Promise<WineBottle[]> {
  const response = await api("/wines");
  const body = (await response.json()) as { wines: WineBottle[] };
  return body.wines;
}

/**
 * Loads the cellar from durable storage.
 *
 * On an empty database this performs the one-time migration: records left in
 * browser storage by the previous build are pushed up, and if there are none
 * the bundled seed is used instead. If the API is unreachable — which is the
 * case under `next dev`, where no Worker is running — it falls back to browser
 * storage and reports `source: "local"` so the UI can say the data is not
 * synced rather than silently pretending it is.
 */
export async function loadCellar(seedWines: WineBottle[]): Promise<LoadedCellar> {
  try {
    const wines = await fetchWines();

    if (wines.length > 0) {
      return { wines, source: "cloud", migrated: 0 };
    }

    const localWines = await readLocalWines();
    const payload = localWines?.length ? mergeStoredWines(seedWines, localWines) : seedWines;

    await api("/import", { method: "POST", body: JSON.stringify(payload) });

    return {
      wines: await fetchWines(),
      source: "cloud",
      migrated: localWines?.length ?? 0,
    };
  } catch (error) {
    console.warn("Falling back to browser storage", error);
    const localWines = await readLocalWines();
    return { wines: mergeStoredWines(seedWines, localWines), source: "local", migrated: 0 };
  }
}

async function writeLocalWines(wines: WineBottle[]): Promise<void> {
  const serialized = JSON.stringify(wines);
  const storageWindow = window as StorageWindow;

  if (storageWindow.storage) {
    await storageWindow.storage.set(WINE_STORAGE_KEY, serialized);
    return;
  }

  window.localStorage.setItem(WINE_STORAGE_KEY, serialized);
}

/** Persists a single bottle. `allWines` is only used for the local fallback. */
export async function saveWine(
  wine: WineBottle,
  source: CellarSource,
  allWines: WineBottle[],
): Promise<void> {
  if (source === "local") {
    return writeLocalWines(allWines);
  }

  await api(`/wines/${encodeURIComponent(wine.id)}`, {
    method: "PUT",
    body: JSON.stringify(wine),
  });
}

export async function createWine(
  wine: WineBottle,
  source: CellarSource,
  allWines: WineBottle[],
): Promise<void> {
  if (source === "local") {
    return writeLocalWines(allWines);
  }

  await api("/wines", { method: "POST", body: JSON.stringify(wine) });
}
