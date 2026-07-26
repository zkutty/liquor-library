import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const cellar = JSON.parse(fs.readFileSync("src/data/cellar.seed.json", "utf8"));
const seagrapeIndex = JSON.parse(fs.readFileSync("src/data/seagrape-pdf-index.json", "utf8"));

test("cellar seed contains the migrated starter collection", () => {
  assert.equal(cellar.length, 26);
});

test("every migrated wine keeps a stable string id and legacy id", () => {
  const legacyWines = cellar.filter((wine) => wine.legacyId);

  assert.equal(legacyWines.length, 18);

  for (const wine of legacyWines) {
    assert.equal(typeof wine.id, "string");
    assert.equal(typeof wine.legacyId, "number");
    assert.equal(wine.id, `legacy-${wine.legacyId}`);
  }
});

test("migration preserves legacy catalog fields", () => {
  for (const wine of cellar.filter((item) => item.legacyId)) {
    assert.equal(typeof wine.name, "string");
    assert.equal(typeof wine.producer, "string");
    assert.equal(typeof wine.varietal, "string");
    assert.equal(typeof wine.region, "string");
    assert.equal(typeof wine.country, "string");
    assert.equal(typeof wine.style, "string");
    assert.equal(typeof wine.alcohol, "string");
    assert.equal(typeof wine.drinkWindow, "string");
    assert.equal(wine.drinkWindowText, wine.drinkWindow);
    assert.equal(typeof wine.estimatedPrice, "string");
    assert.equal(typeof wine.agePotential, "string");
    assert.equal(typeof wine.occasion, "string");
    assert.equal(typeof wine.tastingNotes.nose, "string");
    assert.equal(typeof wine.tastingNotes.palate, "string");
    assert.equal(typeof wine.tastingNotes.finish, "string");
    assert.equal(typeof wine.forCalAusWineLover, "string");
    assert.ok(Array.isArray(wine.pairings));
    assert.equal(typeof wine.notes, "string");
  }
});

test("new photo-added bottles preserve visible label details without invented facts", () => {
  const olivella = cellar.find((wine) => wine.id === "cantine-olivella-lacrimabianco");
  const melaric = cellar.find((wine) => wine.id === "melaric-le-tandem-l23");

  assert.ok(olivella);
  assert.equal(olivella.producer, "Cantine Olivella");
  assert.equal(olivella.name, "Lacrimabianco");
  assert.equal(olivella.region, "Vesuvio, Campania");
  assert.equal(olivella.varietal, "Caprettone (80%) + Catalanesca (20%)");
  assert.equal(olivella.style, "White");
  assert.equal(olivella.photos.frontLabel, "/photos/img-3442-new-bottles.jpeg");

  assert.ok(melaric);
  assert.equal(melaric.producer, "Melaric");
  assert.equal(melaric.name, "Le Tandem L23");
  assert.equal(melaric.region, "Loire Valley / Vin de France");
  assert.equal(melaric.varietal, "Cabernet Franc (50%) + Grolleau (50%)");
  assert.equal(melaric.vintage, 2023);
  assert.equal(melaric.photos.frontLabel, "/photos/img-3442-new-bottles.jpeg");
});

test("seagrape pdf index is wired to existing matching bottles", () => {
  const cellarIds = new Set(cellar.map((wine) => wine.id));
  const indexedMatches = seagrapeIndex.flatMap((entry) => entry.matchedWineIds);

  assert.ok(seagrapeIndex.length >= 10);
  assert.equal(seagrapeIndex.filter((entry) => entry.matchedWineIds.length > 0).length, seagrapeIndex.length);
  assert.ok(indexedMatches.includes("melaric-le-tandem-l23"));
  assert.ok(indexedMatches.includes("cantine-olivella-lacrimabianco"));
  assert.ok(indexedMatches.includes("legacy-7"));
  assert.ok(indexedMatches.includes("legacy-9"));

  for (const id of indexedMatches) {
    assert.ok(cellarIds.has(id), `${id} should exist in cellar.seed.json`);
  }
});

test("seagrape-enhanced wines carry source references", () => {
  const indexedMatches = seagrapeIndex.flatMap((entry) => entry.matchedWineIds);

  for (const id of indexedMatches) {
    const wine = cellar.find((item) => item.id === id);

    assert.ok(wine, `${id} should exist`);
    assert.ok(Array.isArray(wine.sourceReferences), `${id} should have sourceReferences`);
    assert.ok(wine.sourceReferences.some((source) => source.source === "Sea Grape Wine Shop"));
  }
});

test("unmatched seagrape historical pages are tracked as drunk bottles", () => {
  const historicalWines = cellar.filter((wine) => wine.id.startsWith("historical-"));

  assert.equal(historicalWines.length, 6);

  for (const wine of historicalWines) {
    assert.equal(wine.status, "drunk");
    assert.equal(wine.quantity, 0);
    assert.equal(wine.drunkDate, null);
    assert.ok(wine.notes.includes("Historical Seagrape page"));
  }
});
