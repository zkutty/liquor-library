"use client";

import { useEffect, useMemo, useState } from "react";
import seedWines from "@/data/cellar.seed.json";
import type { WineBottle } from "@/lib/wine-schema";
import { createWine, loadCellar, saveWine, type CellarSource } from "@/lib/wine-store";

const OCC_COLORS: Record<string, string> = {
  "🌹 Tonight": "#c0392b",
  "🍋 Drink Soon": "#c9962a",
  "🍷 Casual": "#7a3b6e",
  "🍷 Drink Now": "#7a3b6e",
  "🍷 Weeknight": "#7a3b6e",
  "🍷 Dinner": "#7a3b6e",
  "🍖 Food Wine Only": "#b03020",
  "🌟 Special": "#2980b9",
  "🏆 Cellar Gem": "#c9962a",
  "❓ Unknown": "#555",
};

const BLANK: Omit<WineBottle, "id" | "createdAt" | "updatedAt" | "quantity" | "status"> & {
  status: WineBottle["status"];
  quantity?: number;
} = {
  name: "",
  vintage: "",
  producer: "",
  varietal: "",
  region: "",
  country: "",
  style: "Red",
  alcohol: "",
  drinkWindow: "",
  drinkWindowText: "",
  estimatedPrice: "",
  agePotential: "",
  occasion: "🍷 Casual",
  status: "in_cellar",
  tastingNotes: { nose: "", palate: "", finish: "" },
  forCalAusWineLover: "",
  pairings: [],
  notes: "",
};

function Input({
  label,
  value,
  onChange,
  rows,
}: {
  label: string;
  value: string | number | undefined;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <div className="field">
      <label>{label}</label>
      {rows ? (
        <textarea value={value ?? ""} onChange={(event) => onChange(event.target.value)} rows={rows} />
      ) : (
        <input value={value ?? ""} onChange={(event) => onChange(event.target.value)} />
      )}
    </div>
  );
}

function isInCellar(wine: WineBottle) {
  return wine.status === "in_cellar";
}

export default function WineCellar() {
  const [wines, setWines] = useState<WineBottle[] | null>(null);
  const [selected, setSelected] = useState<WineBottle | null>(null);
  const [filter, setFilter] = useState("All");
  const [view, setView] = useState<"cellar" | "drunk">("cellar");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [pairingText, setPairingText] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [source, setSource] = useState<CellarSource>("cloud");

  useEffect(() => {
    void loadCellar(seedWines as WineBottle[]).then((loaded) => {
      setWines(loaded.wines);
      setSelected(loaded.wines.find(isInCellar) ?? loaded.wines[0] ?? null);
      setSource(loaded.source);

      if (loaded.migrated > 0) {
        showToast(`Moved ${loaded.migrated} bottles from this browser to the cloud`);
      }
    });
  }, []);

  const cellar = useMemo(() => wines?.filter(isInCellar) ?? [], [wines]);
  const drunk = useMemo(() => wines?.filter((wine) => wine.status === "drunk") ?? [], [wines]);
  const visibleWines = useMemo(() => {
    const source = view === "cellar" ? cellar : drunk;
    return source.filter((wine) => filter === "All" || wine.style === filter);
  }, [cellar, drunk, filter, view]);

  async function persist(wine: WineBottle, updatedWines: WineBottle[], isNew = false) {
    setSaving(true);
    try {
      await (isNew ? createWine : saveWine)(wine, source, updatedWines);
    } catch (error) {
      console.error("Failed to save", error);
      showToast("Save failed — changes are not stored");
    } finally {
      setSaving(false);
    }
  }

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2500);
  }

  function updateForm<Key extends keyof typeof BLANK>(key: Key, value: (typeof BLANK)[Key]) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  function updateTastingNote(key: "nose" | "palate" | "finish", value: string) {
    setForm((previous) => ({
      ...previous,
      tastingNotes: { ...previous.tastingNotes, [key]: value },
    }));
  }

  function markDrunk(wine: WineBottle) {
    if (!wines) return;

    const drunkWine: WineBottle = {
      ...wine,
      status: "drunk",
      drunkDate: new Date().toLocaleDateString(),
      updatedAt: new Date().toISOString(),
    };
    const updatedWines = wines.map((item) => (item.id === wine.id ? drunkWine : item));

    setWines(updatedWines);
    void persist(drunkWine, updatedWines);
    setSelected(updatedWines.find(isInCellar) ?? updatedWines[0] ?? null);
    showToast(`"${wine.name}" moved to drunk log`);
  }

  function restore(wine: WineBottle) {
    if (!wines) return;

    const restored: WineBottle = {
      ...wine,
      status: "in_cellar",
      drunkDate: null,
      updatedAt: new Date().toISOString(),
    };
    const updatedWines = wines.map((item) => (item.id === wine.id ? restored : item));

    setWines(updatedWines);
    void persist(restored, updatedWines);
    setSelected(restored);
    showToast(`"${wine.name}" restored`);
  }

  function addWine() {
    if (!wines || !form.name) return;

    const now = new Date().toISOString();
    const wine: WineBottle = {
      ...form,
      id: `wine-${Date.now()}`,
      quantity: 1,
      status: "in_cellar",
      drinkWindowText: form.drinkWindow,
      pairings: pairingText
        .split(",")
        .map((pairing) => pairing.trim())
        .filter(Boolean),
      createdAt: now,
      updatedAt: now,
    };
    const updatedWines = [...wines, wine];

    setWines(updatedWines);
    void persist(wine, updatedWines, true);
    setSelected(wine);
    setShowAdd(false);
    setForm(BLANK);
    setPairingText("");
    showToast(`"${wine.name}" added`);
  }

  if (!wines) {
    return <div className="loading">Loading cellar...</div>;
  }

  return (
    <main className="shell">
      {toast ? <div className="toast">{toast}</div> : null}

      <header className="topbar">
        <div className="topbar-inner">
          <div>
            <p className="eyebrow">
              Personal Collection · {source === "cloud" ? "Synced" : "This browser only"}
            </p>
            <h1>Wine Cellar</h1>
            <p className="summary">
              {cellar.length} in cellar · {drunk.length} drunk {saving ? "· saving..." : ""}
            </p>
          </div>
          <button className="primary-button" onClick={() => setShowAdd(true)}>
            + Add Bottle
          </button>
        </div>
      </header>

      <div className="workspace">
        <aside className="sidebar">
          <div className="tabs">
            <button className={view === "cellar" ? "active" : ""} onClick={() => setView("cellar")}>
              Cellar ({cellar.length})
            </button>
            <button className={view === "drunk" ? "active" : ""} onClick={() => setView("drunk")}>
              Drunk ({drunk.length})
            </button>
          </div>

          <div className="filters">
            {["All", "Red", "White", "Rosé", "Sparkling"].map((style) => (
              <button className={filter === style ? "active" : ""} key={style} onClick={() => setFilter(style)}>
                {style}
              </button>
            ))}
          </div>

          {visibleWines.length === 0 ? <div className="empty">Nothing here yet</div> : null}
          {visibleWines.map((wine) => (
            <button
              className={`wine-row ${selected?.id === wine.id ? "active" : ""}`}
              key={wine.id}
              onClick={() => setSelected(wine)}
            >
              <span>
                <strong>{wine.name}</strong>
                <small>
                  {wine.vintage} · {wine.varietal}
                </small>
                {wine.drunkDate ? <small>Drunk: {wine.drunkDate}</small> : null}
              </span>
              <em>{wine.style}</em>
              {wine.occasion ? (
                <b style={{ color: OCC_COLORS[wine.occasion] ?? "#999" }}>{wine.occasion}</b>
              ) : null}
            </button>
          ))}
        </aside>

        {selected ? (
          <section className="detail">
            <div className="detail-heading">
              <div>
                <h2>{selected.name}</h2>
                <p>{selected.producer}</p>
                <small>{selected.country}</small>
              </div>
              <div className="actions">
                <strong>{selected.vintage}</strong>
                {selected.status === "in_cellar" ? (
                  <button onClick={() => markDrunk(selected)}>Mark as Drunk</button>
                ) : (
                  <button onClick={() => restore(selected)}>Restore to Cellar</button>
                )}
              </div>
            </div>

            <div className="stats">
              {[
                ["Varietal", selected.varietal],
                ["Region", selected.region],
                ["Style", selected.style],
                ["Drink Window", selected.drinkWindowText ?? selected.drinkWindow],
                ["Est. Price", selected.estimatedPrice],
                ["Age Potential", selected.agePotential],
              ].map(([label, value]) => (
                <div key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>

            {selected.tastingNotes?.nose || selected.tastingNotes?.palate ? (
              <section className="section">
                <h3>Tasting Notes</h3>
                {[
                  ["Nose", selected.tastingNotes.nose],
                  ["Palate", selected.tastingNotes.palate],
                  ["Finish", selected.tastingNotes.finish],
                ].map(([label, value]) =>
                  value ? (
                    <p key={label}>
                      <strong>{label}:</strong> {value}
                    </p>
                  ) : null,
                )}
              </section>
            ) : null}

            {selected.forCalAusWineLover ? (
              <section className="context">
                <h3>Context for a Cal / Aus Wine Drinker</h3>
                <p>{selected.forCalAusWineLover}</p>
              </section>
            ) : null}

            {selected.pairings?.length ? (
              <section className="section">
                <h3>Food Pairings</h3>
                <div className="pairings">
                  {selected.pairings.map((pairing) => (
                    <span key={pairing}>{pairing}</span>
                  ))}
                </div>
              </section>
            ) : null}

            {selected.notes ? (
              <section className="note">
                <h3>Sommelier Note</h3>
                <p>{selected.notes}</p>
              </section>
            ) : null}
          </section>
        ) : null}
      </div>

      {showAdd ? (
        <div className="modal-backdrop" onClick={(event) => event.target === event.currentTarget && setShowAdd(false)}>
          <div className="modal">
            <div className="modal-heading">
              <h2>Add New Bottle</h2>
              <button onClick={() => setShowAdd(false)}>×</button>
            </div>
            <div className="form-grid">
              <Input label="Wine Name" value={form.name} onChange={(value) => updateForm("name", value)} />
              <Input label="Producer" value={form.producer} onChange={(value) => updateForm("producer", value)} />
              <Input label="Vintage" value={form.vintage} onChange={(value) => updateForm("vintage", value)} />
              <Input label="Varietal / Grape" value={form.varietal} onChange={(value) => updateForm("varietal", value)} />
              <Input label="Region" value={form.region} onChange={(value) => updateForm("region", value)} />
              <Input label="Country" value={form.country} onChange={(value) => updateForm("country", value)} />
              <div className="field">
                <label>Style</label>
                <select value={form.style} onChange={(event) => updateForm("style", event.target.value)}>
                  {["Red", "White", "Rosé", "Sparkling", "Dessert", "Orange"].map((style) => (
                    <option key={style}>{style}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Occasion</label>
                <select value={form.occasion} onChange={(event) => updateForm("occasion", event.target.value)}>
                  {Object.keys(OCC_COLORS).map((occasion) => (
                    <option key={occasion}>{occasion}</option>
                  ))}
                </select>
              </div>
              <Input label="Price" value={form.estimatedPrice} onChange={(value) => updateForm("estimatedPrice", value)} />
              <Input label="Drink Window" value={form.drinkWindow} onChange={(value) => updateForm("drinkWindow", value)} />
              <Input label="Age Potential" value={form.agePotential} onChange={(value) => updateForm("agePotential", value)} />
              <Input label="Alcohol %" value={form.alcohol} onChange={(value) => updateForm("alcohol", value)} />
            </div>
            <Input label="Nose" value={form.tastingNotes?.nose} onChange={(value) => updateTastingNote("nose", value)} rows={2} />
            <Input label="Palate" value={form.tastingNotes?.palate} onChange={(value) => updateTastingNote("palate", value)} rows={2} />
            <Input label="Finish" value={form.tastingNotes?.finish} onChange={(value) => updateTastingNote("finish", value)} rows={1} />
            <Input
              label="Context for Cal/Aus Wine Drinker"
              value={form.forCalAusWineLover}
              onChange={(value) => updateForm("forCalAusWineLover", value)}
              rows={2}
            />
            <Input label="Food Pairings (comma-separated)" value={pairingText} onChange={setPairingText} />
            <Input label="Sommelier Notes" value={form.notes} onChange={(value) => updateForm("notes", value)} rows={2} />
            <div className="modal-actions">
              <button onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="primary-button" disabled={!form.name} onClick={addWine}>
                Add to Cellar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
