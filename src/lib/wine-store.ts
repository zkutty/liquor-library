import type { WineBottle } from "./wine-schema";

export const WINE_STORAGE_KEY = "wine-cellar-v3";

type LegacyStorage = {
  get: (key: string) => Promise<{ value: string } | null>;
  set: (key: string, value: string) => Promise<void>;
};

type StorageWindow = Window & {
  storage?: LegacyStorage;
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

export async function loadStoredWines(seedWines: WineBottle[]): Promise<WineBottle[]> {
  if (typeof window === "undefined") {
    return seedWines;
  }

  const storageWindow = window as StorageWindow;

  try {
    if (storageWindow.storage) {
      const result = await storageWindow.storage.get(WINE_STORAGE_KEY);
      if (result?.value) {
        return mergeStoredWines(seedWines, JSON.parse(result.value));
      }
    }

    const value = window.localStorage.getItem(WINE_STORAGE_KEY);
    if (value) {
      return mergeStoredWines(seedWines, JSON.parse(value));
    }
  } catch {
    return seedWines;
  }

  return seedWines;
}

export async function saveStoredWines(wines: WineBottle[]): Promise<void> {
  const serialized = JSON.stringify(wines);
  const storageWindow = window as StorageWindow;

  if (storageWindow.storage) {
    await storageWindow.storage.set(WINE_STORAGE_KEY, serialized);
    return;
  }

  window.localStorage.setItem(WINE_STORAGE_KEY, serialized);
}
