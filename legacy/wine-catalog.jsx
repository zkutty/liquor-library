import { useState, useEffect } from "react";

const DEFAULT_WINES = [
  {
    id: 1, name: "StoneCap Riesling", vintage: 2023, producer: "StoneCap / Ridge Vineyards Selection",
    varietal: "Riesling", region: "Columbia Valley", country: "USA 🇺🇸", style: "White",
    alcohol: "~11.5%", drinkWindow: "Now–2028", estimatedPrice: "$15–18", agePotential: "3–5 yrs",
    occasion: "🌹 Tonight", status: "in-cellar",
    tastingNotes: { nose: "White peach, apricot, jasmine blossom, lime zest, subtle honeycomb, faint wet slate", palate: "Off-dry with vibrant acidity, stone fruit leading to citrus pith, light petrol whisper (classic Riesling), clean mineral finish", finish: "Medium-long, refreshing, slightly sweet fade" },
    forCalAusWineLover: "Washington Riesling sits between Clare Valley (Australia) and Alsace in style — riper than Clare, less weighty than Alsace. Lower alcohol than any Chardonnay you know. Think of it as a sophisticated, aromatic alternative to Pinot Grigio.",
    pairings: ["Aperitivo / sipping alone", "Thai / Vietnamese food", "Sushi & sashimi", "Soft cheeses", "Light seafood"],
    notes: "Serve at 8–10°C. Great value for what's in the glass.",
  },
  {
    id: 2, name: "Bonea", vintage: "NV", producer: "Masseria Frattasi",
    varietal: "Falanghina", region: "Sannio / Campania", country: "Italy 🇮🇹", style: "White",
    alcohol: "~13%", drinkWindow: "Now–2026", estimatedPrice: "$20–28", agePotential: "2–3 yrs",
    occasion: "🍋 Drink Soon", status: "in-cellar",
    tastingNotes: { nose: "Citrus blossom, green apple, white peach, light honey, saline mineral edge", palate: "Medium body, lively acidity, stone fruit mid-palate, slightly waxy texture, clean herbal finish", finish: "Crisp and refreshing with a mineral lift" },
    forCalAusWineLover: "Think richer and more characterful than Pinot Grigio, but less tropical than an Aussie Chardonnay. Falanghina is an ancient Southern Italian grape — it's what the Romans actually drank.",
    pairings: ["Seafood & shellfish", "Light pasta (clam / seafood)", "Caprese salad", "Aperitivo boards", "Grilled fish"],
    notes: "Campania's most underrated white grape. Drink relatively young.",
  },
  {
    id: 3, name: "Bugey Pinot Noir 'Le Morillon'", vintage: 2023, producer: "Yves Duport",
    varietal: "Pinot Noir", region: "Bugey, Ain", country: "France 🇫🇷", style: "Red",
    alcohol: "~12%", drinkWindow: "Now–2026", estimatedPrice: "$25–32", agePotential: "2–3 yrs",
    occasion: "🍷 Casual", status: "in-cellar",
    tastingNotes: { nose: "Red cherry, raspberry, violet, light earth, subtle floral lift", palate: "Very light body, silky tannins, high acid, strawberry and cherry fruit, almost translucent in character", finish: "Short-medium, clean, refreshing" },
    forCalAusWineLover: "Nothing like a Russian River or Yarra Valley Pinot. Bugey is a tiny French region near the Alps. Think halfway between a rosé and a Burgundy — delicate to the point of being fragile.",
    pairings: ["Charcuterie boards", "Duck confit", "Mushroom dishes", "Sipping lightly chilled"],
    notes: "Bugey is one of France's most obscure appellations. A curiosity bottle.",
  },
  {
    id: 4, name: "Cabernet Franc", vintage: 2019, producer: "Vinitrio",
    varietal: "Cabernet Franc", region: "France (likely Loire)", country: "France 🇫🇷", style: "Red",
    alcohol: "~13%", drinkWindow: "Now–2027", estimatedPrice: "$20–28", agePotential: "3–5 yrs",
    occasion: "🍷 Drink Now", status: "in-cellar",
    tastingNotes: { nose: "Pencil shavings, green bell pepper, blackcurrant leaf, dark cherry, earthy undertone", palate: "Medium body, fine tannins, red and dark fruit, characteristic herbaceous edge, medium acidity", finish: "Medium, slightly savory, fades with a leafy herb note" },
    forCalAusWineLover: "Cab Franc from the Loire is what Merlot wishes it could be — more herbal and less plummy than Napa. The 'green' quality is intentional and celebrated here.",
    pairings: ["Roasted lamb", "Grilled duck", "Goat cheese", "Mushroom risotto", "Charcuterie"],
    notes: "2019 was an excellent vintage in the Loire. Probably at or near peak now.",
  },
  {
    id: 5, name: "Langhe Nebbiolo", vintage: "Recent", producer: "Cantina Parroco (Azienda San Michele)",
    varietal: "Nebbiolo", region: "Langhe, Piedmont", country: "Italy 🇮🇹", style: "Red",
    alcohol: "~14%", drinkWindow: "Now–2030", estimatedPrice: "$20–30", agePotential: "5–8 yrs",
    occasion: "🍖 Food Wine Only", status: "in-cellar",
    tastingNotes: { nose: "Rose petal, tar, cherry, dried herbs, violets, faint anise", palate: "High tannins, high acidity, red cherry and raspberry fruit, austere and structured", finish: "Long, drying, bitter cherry note (classic Nebbiolo signature)" },
    forCalAusWineLover: "Nebbiolo is the polar opposite of a big Napa Cab. It looks pale but hits you with tannins and acid. It's the grape behind Barolo — 'the King of Italian wine'.",
    pairings: ["Braised beef / osso buco", "Truffle pasta", "Mushroom dishes", "Aged hard cheeses", "Lamb"],
    notes: "⚠️ Do NOT drink alone or without food. Save for a dinner with red meat or pasta.",
  },
  {
    id: 6, name: "Bourgogne Passetoutgrain", vintage: 2022, producer: "Domaine Vincent Prunier",
    varietal: "Gamay + Pinot Noir (blend)", region: "Burgundy", country: "France 🇫🇷", style: "Red",
    alcohol: "~12.5%", drinkWindow: "Now–2026", estimatedPrice: "$22–30", agePotential: "2–4 yrs",
    occasion: "🍷 Weeknight", status: "in-cellar",
    tastingNotes: { nose: "Fresh red berry, violet, light earth, faint barnyard, cranberry", palate: "Light-medium body, juicy acidity, red fruit forward (Gamay influence), more structure from Pinot Noir backbone", finish: "Light, slightly earthy, clean" },
    forCalAusWineLover: "Entry-level Burgundy blend — Gamay plus Pinot Noir. Think lighter, more acidic, less fruit-forward Pinot than what you're used to.",
    pairings: ["Roast chicken", "Charcuterie", "Light cheese plates", "Weeknight dinners"],
    notes: "Drink relatively soon. Serve slightly chilled.",
  },
  {
    id: 7, name: "Cuvée Carpe Diem Rouge", vintage: "NV", producer: "Saint Bacchi (winemaker: Christian)",
    varietal: "Alicante Bouschet (100%)", region: "Vin de France (South of France)", country: "France 🇫🇷", style: "Red",
    alcohol: "~13.5%", drinkWindow: "Now–2027", estimatedPrice: "$24.99", agePotential: "3–5 yrs",
    occasion: "🌟 Special", status: "in-cellar",
    tastingNotes: { nose: "Inky blackberry jam, dried herbs, dark cherry, subtle earthiness, vegetal rusticity and spice", palate: "Dense and full-bodied but not over-extracted — dark fruit, pepper, clove, well-integrated tannins from short 12-day maceration", finish: "Medium-long, balanced, spiced fruit fade with a dry herbal close" },
    forCalAusWineLover: "Think Petite Sirah with more earthiness and less extraction. Alicante Bouschet is a teinturier grape — the flesh itself is red, almost unique in the wine world. Natural wine: expect a little rustic character.",
    pairings: ["Grilled lamb", "Hearty stews / cassoulet", "Charcuterie boards", "Aged hard cheese", "BBQ red meats"],
    notes: "🌿 Natural & Organic. One of the rarest grapes in your collection — ~3,000 hectares globally. 16 months in 225L barrels.",
  },
  {
    id: 8, name: "Chinon 'Le Grand Bouqueteau'", vintage: "NV", producer: "Château du Coudray-Montpensier",
    varietal: "Cabernet Franc", region: "Chinon, Loire Valley", country: "France 🇫🇷", style: "Red",
    alcohol: "~12.5%", drinkWindow: "Now–2027", estimatedPrice: "$22–32", agePotential: "3–5 yrs",
    occasion: "🍷 Dinner", status: "in-cellar",
    tastingNotes: { nose: "Blackcurrant, pencil lead, violet, slight earthiness, fresh herbs", palate: "Medium body, grippy but fine tannins, dark cherry and currant fruit, classic Loire herbal thread throughout", finish: "Medium-long, earthy, graphite mineral note" },
    forCalAusWineLover: "Chinon is the heartland of Cab Franc. Think of it as a more intellectual, food-friendly alternative to Merlot — not about power, about precision.",
    pairings: ["Goat cheese (iconic pairing)", "Rack of lamb", "Rillettes / charcuterie", "Salmon", "Roasted vegetables"],
    notes: "Classic Loire Cab Franc from a historic château.",
  },
  {
    id: 9, name: "Sancerre 'La Forêt Gasselin'", vintage: "NV", producer: "Régis & Laurent Godelu",
    varietal: "Pinot Noir (Red Sancerre)", region: "Sancerre, Loire Valley", country: "France 🇫🇷", style: "Red",
    alcohol: "~12.5%", drinkWindow: "Now–2027", estimatedPrice: "$35–50", agePotential: "3–5 yrs",
    occasion: "🌟 Special", status: "in-cellar",
    tastingNotes: { nose: "Delicate red cherry, raspberry, rose petal, earthy minerality, hint of spice", palate: "Very light body, silky and elegant, red fruit with pronounced chalky mineral quality, gossamer tannins", finish: "Medium, mineral, lingers with a floral note" },
    forCalAusWineLover: "Red Sancerre is one of France's best-kept secrets. Nothing like a California Pinot — lighter, more translucent, all about minerality from limestone soils. What Pinot Noir would be if you stripped all the fruit and left only elegance.",
    pairings: ["Salmon / tuna", "Goat cheese", "Mushroom dishes", "Light poultry", "Charcuterie"],
    notes: "Underrated bottle. Don't overchill — serve around 14°C.",
  },
  {
    id: 10, name: "Malbec", vintage: 2015, producer: "Château Lagrezette",
    varietal: "Malbec (Côt)", region: "Cahors, Southwest France", country: "France 🇫🇷", style: "Red",
    alcohol: "~14.5%", drinkWindow: "Now–2030", estimatedPrice: "$45–65", agePotential: "8–12 yrs",
    occasion: "🏆 Cellar Gem", status: "in-cellar",
    tastingNotes: { nose: "Dark plum, blackberry, leather, tobacco, dried violets, hints of truffle and earth", palate: "Full body, now-integrated tannins (10 years!), dark fruit, chocolate, earthy complexity, excellent structure", finish: "Long and lingering, with a dry, earthy, slightly tannic close" },
    forCalAusWineLover: "Argentine Malbec is all ripe, juicy, plummy fruit. Cahors Malbec (the original) is darker, more structured, earthy, serious — think less Napa Cab, more Bordeaux Left Bank. At 10 years old, drinking beautifully.",
    pairings: ["Duck confit", "Cassoulet", "Steak / red meat", "Aged hard cheeses", "Lamb"],
    notes: "🏆 Your best bottle. 2015 was an exceptional Cahors vintage. Save for a real occasion.",
  },
  {
    id: 11, name: "Saldo Zinfandel", vintage: "Current", producer: "The Prisoner Wine Company",
    varietal: "Zinfandel (+ Petite Sirah)", region: "California", country: "USA 🇺🇸", style: "Red",
    alcohol: "~15.5%", drinkWindow: "Now–2027", estimatedPrice: "$30–35", agePotential: "3–5 yrs",
    occasion: "🍷 Casual", status: "in-cellar",
    tastingNotes: { nose: "Jammy blackberry, raspberry compote, dark cherry, black pepper, vanilla oak, mocha", palate: "Full body, velvety tannins, ripe and generous dark fruit, baking spice, chocolate mid-palate — bold California Zin, plush and crowd-pleasing", finish: "Long, warm, fruit-forward with a peppery heat from the alcohol" },
    forCalAusWineLover: "Home turf — you know this style cold. Saldo is The Prisoner's flagship Zin made from old-vine California fruit blended with Petite Sirah for structure. It's the California expression at its most confident. Think of it as the Shiraz equivalent in American terms.",
    pairings: ["BBQ ribs / brisket", "Burgers", "Pepperoni pizza", "Aged cheddar", "Braised short ribs", "Spiced lamb"],
    notes: "⚠️ High alcohol ~15.5%. Decant 30 mins. Best with food rather than solo sipping.",
  },
  {
    id: 12, name: "Nozzole Chianti Classico Riserva", vintage: 2022, producer: "Tenuta di Nozzole",
    varietal: "Sangiovese (~90%) + Merlot / Colorino", region: "Chianti Classico, Tuscany", country: "Italy 🇮🇹", style: "Red",
    alcohol: "~13.5%", drinkWindow: "2025–2033", estimatedPrice: "$28–38", agePotential: "8–10 yrs",
    occasion: "🌟 Special", status: "in-cellar",
    tastingNotes: { nose: "Dried cherry, leather, tobacco, dried violet, earthy iron note, subtle balsamic, light cedar", palate: "Medium-full body, firm Sangiovese tannins, bright acidity, sour cherry and plum fruit, herbal savouriness — structured and food-driven", finish: "Long, dry, earthy — bitter cherry close that screams for food" },
    forCalAusWineLover: "Sangiovese is nothing like Cabernet — high acid, high tannin, sour cherry fruit, very savory and dry. 'Riserva' means aged longer, minimum 24 months. Think of it as what Pinot Noir would be if it went to Italy, got angrier, and insisted on being eaten with food.",
    pairings: ["Bistecca Fiorentina", "Pasta with ragù / bolognese", "Margherita pizza", "Aged Pecorino", "Roasted lamb", "Wild boar"],
    notes: "Decant 45 mins. Has significant aging potential — could be even better in 3–5 years.",
  },
  {
    id: 13, name: "Sonoma Coast Pinot Noir", vintage: 2023, producer: "La Crema",
    varietal: "Pinot Noir", region: "Sonoma Coast", country: "USA 🇺🇸", style: "Red",
    alcohol: "~13.5%", drinkWindow: "Now–2028", estimatedPrice: "$25–30", agePotential: "3–5 yrs",
    occasion: "🍷 Casual", status: "in-cellar",
    tastingNotes: { nose: "Red cherry, raspberry, cranberry, light vanilla oak, dried rose petal, subtle forest floor", palate: "Medium body, silky tannins, bright acidity, red fruit driven — more restrained and coastal than Russian River, less jam, more finesse", finish: "Medium, clean, slightly spiced, lingering cranberry note" },
    forCalAusWineLover: "You know this territory well. Sonoma Coast is cooler and more maritime than Russian River — you get more freshness and less ripeness. La Crema is consistent, food-friendly, every-night Pinot. Not trying to be Kosta Browne — just reliable and well-made.",
    pairings: ["Salmon / halibut", "Roast chicken", "Duck breast", "Mushroom risotto", "Charcuterie", "Soft cheese"],
    notes: "Very young — 2023 only just released. Give it 6–12 months to open up. Serve around 15–16°C.",
  },
  {
    id: 14, name: "Villa Antinori Bianco", vintage: 2024, producer: "Marchesi Antinori",
    varietal: "Trebbiano Toscano, Malvasia, Pinot Bianco, Chardonnay (blend)", region: "Toscana IGT", country: "Italy 🇮🇹", style: "White",
    alcohol: "~12.5%", drinkWindow: "Now–2026", estimatedPrice: "$15–20", agePotential: "1–2 yrs",
    occasion: "🍋 Drink Soon", status: "in-cellar",
    tastingNotes: {
      nose: "Fresh green apple, lemon zest, white flower, subtle almond, light herbal notes — clean and delicate",
      palate: "Light body, crisp and refreshing acidity, citrus and stone fruit, slightly nutty mid-palate, dry finish with a classic Italian bitter almond close",
      finish: "Short-medium, clean, bright — ends with a pleasant bitter citrus pith note"
    },
    forCalAusWineLover: "Think lighter and more herbal than a California Sauvignon Blanc, and less aromatic than a Clare Valley Riesling. This is quintessential everyday Italian white — unpretentious, refreshing, built for the table. Antinori is a 600-year-old Florentine family, 26 generations of winemaking — this is their crowd-pleaser entry point.",
    pairings: ["Aperitivo", "Light antipasti", "Grilled fish", "Seafood pasta", "Caprese salad", "Light risotto"],
    notes: "2024 is extremely fresh — literally just bottled. Drink within 1–2 years. Great value for the Antinori name. Serve well chilled at 8°C.",
  },
  {
    id: 15, name: "Limizzani Vermentino di Gallura", vintage: "Recent", producer: "Cantina Surrau",
    varietal: "Vermentino (100%)", region: "Gallura, Sardinia", country: "Italy 🇮🇹", style: "White",
    alcohol: "~14%", drinkWindow: "Now–2027", estimatedPrice: "$22–30", agePotential: "3–4 yrs",
    occasion: "🌟 Special", status: "in-cellar",
    tastingNotes: {
      nose: "Citrus blossom, lime zest, white peach, saline sea breeze, light herbal/maquis scrub, faint floral lift",
      palate: "Medium-full body (bigger than it looks), vibrant acidity, stone fruit and citrus pith, pronounced salty/saline mineral quality from granite soils — a genuine sense of place",
      finish: "Medium-long, clean, with a characteristic bitter almond and sea-salt close — very distinctive"
    },
    forCalAusWineLover: "Vermentino di Gallura is Sardinia's only DOCG — the island's highest quality designation, reserved for this one grape from this one region. Surrau is one of Gallura's benchmark producers. Think of it like a coastal Clare Valley Riesling crossed with a mineral Sancerre, but with more body and a salty Mediterranean edge that you won't find anywhere else. The granite soils give it a texture and salinity that is genuinely unlike anything from California or Australia.",
    pairings: ["Fresh oysters", "Grilled sea bass / branzino", "Lobster / scampi", "Spaghetti alle vongole", "Bottarga", "Light summer aperitivo"],
    notes: "🌊 One of the most characterful whites in your collection. That saline, bitter-almond finish is polarising for some, beloved by others — it's 100% intentional. Serve cold at 8–10°C. A great bottle to open with seafood this summer.",
  },
  {
    id: 16, name: "Côtes du Rhône", vintage: 2021, producer: "Domaine La Bouïssière",
    varietal: "Grenache, Syrah, Mourvèdre (GSM blend)", region: "Côtes du Rhône (based in Gigondas)", country: "France 🇫🇷", style: "Red",
    alcohol: "~14%", drinkWindow: "Now–2028", estimatedPrice: "$18–25", agePotential: "4–6 yrs",
    occasion: "🍷 Dinner", status: "in-cellar",
    tastingNotes: {
      nose: "Ripe red cherry, garrigue (wild Provençal herbs — thyme, rosemary, lavender), black olive, white pepper, sun-baked earth, a hint of smoked meat",
      palate: "Medium-full body, soft rounded tannins, dark cherry and plum fruit, fresh acidity lifting it up, beautiful herbal savouriness running through the mid-palate",
      finish: "Medium-long, warm, earthy, fading with dried herbs and a touch of spice"
    },
    forCalAusWineLover: "Southern Rhône Grenache is like if you took a Sonoma Coast Pinot Noir, made it richer and more savory, added Provençal garrigue herbs, and baked it in Mediterranean sunshine. La Bouïssière is actually based in Gigondas — one of the Rhône's most respected villages — so this Côtes du Rhône is made by people with serious pedigree. It punches well above its appellation. Think of it as an Australian GSM (Grenache-Shiraz-Mourvèdre) but with more earthiness and less fruit-bomb intensity.",
    pairings: ["Roast lamb / lamb chops", "Herbed chicken", "Ratatouille", "Grilled sausages", "Aged cheese boards", "Beef stew"],
    notes: "2021 was a solid Rhône vintage with good natural acidity. Thierry and Gilles Faravel are respected growers who sell most of their fruit for Gigondas AOC — this CDR is their entry point and it overdelivers. Decant 20 mins.",
  },
  {
    id: 17, name: "Grüner Veltliner 'Ried Kremser Kogl'", vintage: "Recent", producer: "Weingut Forstreiter",
    varietal: "Grüner Veltliner (100%)", region: "Kremstal DAC, Austria", country: "Austria 🇦🇹", style: "White",
    alcohol: "~12.5%", drinkWindow: "Now–2029", estimatedPrice: "$22–30", agePotential: "5–7 yrs",
    occasion: "🌟 Special", status: "in-cellar",
    tastingNotes: {
      nose: "White pepper (the defining GV signature), grapefruit zest, green herb, wet stone minerality, subtle citrus blossom, lemon curd",
      palate: "Medium body, laser-focused acidity, citrus and stone fruit, stony mineral texture from the loess and primary rock soils of Kremstal — 'Ried' (single vineyard) quality shows in the precision and length",
      finish: "Long, clean, mineral, with that distinctive white pepper spice lingering"
    },
    forCalAusWineLover: "Grüner Veltliner has no real equivalent in California or Australia — it's Austria's signature white grape and utterly unique. The white pepper note is completely its own thing, not found in any other variety. If you had to anchor it: think a more savory, spicier, more mineral Sauvignon Blanc without the tropical fruit. 'DAC' (Districtus Austriae Controllatus) is Austria's top quality classification. 'Ried Kremser Kogl' is a specific single vineyard — a step above entry-level GV in complexity and ageability. Forstreiter has been farming in Krems since 1909.",
    pairings: ["Wiener Schnitzel (the classic Austrian pairing)", "Grilled trout / salmon", "White asparagus", "Sushi", "Goat cheese", "Light vegetable dishes"],
    notes: "🇦🇹 Your most unusual and educational bottle — the only Austrian wine in the collection. GV is a great next step in Old World whites after Riesling. Serve at 10°C. Has genuine aging potential — could develop interestingly over 3–5 years.",
  },
  {
    id: 18, name: "Lambrusco Emilia", vintage: "NV", producer: "Puianello",
    varietal: "Lambrusco (blend)", region: "Emilia, Emilia-Romagna", country: "Italy 🇮🇹", style: "Sparkling",
    alcohol: "~8–11%", drinkWindow: "Now–2026", estimatedPrice: "$12–18", agePotential: "1–2 yrs",
    occasion: "🍷 Casual", status: "in-cellar",
    tastingNotes: {
      nose: "Fresh dark cherry, blackberry, violets, light earthiness, a faint tartness — bright and playful",
      palate: "Light to medium body, gentle fizz (frizzante), fresh dark fruit, low tannins, vibrant acidity, slightly sweet or off-dry — easy and immediately appealing",
      finish: "Short, clean, refreshing — more about fun than complexity"
    },
    forCalAusWineLover: "There is genuinely nothing like Lambrusco in California or Australia. It's a slightly fizzy, low-alcohol red from the Po Valley — the same region that gave the world Prosciutto di Parma, Mortadella, and Parmigiano Reggiano. It was literally designed to cut through rich charcuterie and fatty food. Think of it as what would happen if Beaujolais Nouveau got lightly sparkling and went to an Italian picnic. Serve it cold — yes, cold, unlike most reds — and don't overthink it.",
    pairings: ["Prosciutto / salumi boards", "Pizza", "Mortadella", "Fried food", "Casual picnics", "Summer BBQ appetizers"],
    notes: "🫧 Your first sparkling in the collection. Low alcohol, drink young, serve cold (12°C). This is a fun, unpretentious bottle — not for analysis, for enjoyment. Pop it at the start of a dinner party.",
  },
];

const OCC_COLORS = {
  "🌹 Tonight": "#c0392b", "🍋 Drink Soon": "#c9962a", "🍷 Casual": "#7a3b6e",
  "🍷 Drink Now": "#7a3b6e", "🍷 Weeknight": "#7a3b6e", "🍷 Dinner": "#7a3b6e",
  "🍖 Food Wine Only": "#b03020", "🌟 Special": "#2980b9", "🏆 Cellar Gem": "#c9962a", "❓ Unknown": "#555",
};

const BLANK = {
  name: "", vintage: "", producer: "", varietal: "", region: "", country: "",
  style: "Red", alcohol: "", drinkWindow: "", estimatedPrice: "", agePotential: "",
  occasion: "🍷 Casual", status: "in-cellar",
  tastingNotes: { nose: "", palate: "", finish: "" },
  forCalAusWineLover: "", pairings: [], notes: "",
};

const Inp = ({ label, value, onChange, rows }) => (
  <div style={{ marginBottom: 11 }}>
    <label style={{ display: "block", fontSize: 9, color: "#9a6a3a", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 3 }}>{label}</label>
    {rows
      ? <textarea value={value} onChange={onChange} rows={rows} style={{ width: "100%", background: "#150406", border: "1px solid #3a1a1a", borderRadius: 5, padding: "7px 9px", color: "#e8d5b0", fontSize: 12, resize: "vertical", boxSizing: "border-box", fontFamily: "Georgia,serif" }} />
      : <input value={value} onChange={onChange} style={{ width: "100%", background: "#150406", border: "1px solid #3a1a1a", borderRadius: 5, padding: "7px 9px", color: "#e8d5b0", fontSize: 12, boxSizing: "border-box", fontFamily: "Georgia,serif" }} />
    }
  </div>
);

export default function WineCellar() {
  const [wines, setWines] = useState(null);
  const [sel, setSel] = useState(null);
  const [filter, setFilter] = useState("All");
  const [view, setView] = useState("cellar");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ ...BLANK });
  const [pairStr, setPairStr] = useState("");
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get("wine-cellar-v3");
        if (r) {
          const stored = JSON.parse(r.value);
          const storedIds = new Set(stored.map(w => w.id));
          const merged = [...stored, ...DEFAULT_WINES.filter(w => !storedIds.has(w.id))];
          setWines(merged);
          setSel(merged.find(w => w.status === "in-cellar") || merged[0]);
        } else {
          setWines(DEFAULT_WINES);
          setSel(DEFAULT_WINES[0]);
        }
      } catch {
        setWines(DEFAULT_WINES);
        setSel(DEFAULT_WINES[0]);
      }
    })();
  }, []);

  const persist = async (updated) => {
    setSaving(true);
    try { await window.storage.set("wine-cellar-v3", JSON.stringify(updated)); showToast("Saved ✓"); }
    catch { showToast("Save error"); }
    setSaving(false);
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); };
  const setF = (key, val) => setForm(p => ({ ...p, [key]: val }));
  const setN = (key, val) => setForm(p => ({ ...p, tastingNotes: { ...p.tastingNotes, [key]: val } }));

  const markDrunk = (w) => {
    const u = wines.map(x => x.id === w.id ? { ...x, status: "drunk", drunkDate: new Date().toLocaleDateString() } : x);
    setWines(u); persist(u);
    const next = u.find(x => x.status === "in-cellar");
    setSel(next || u[0]);
    showToast(`🍷 "${w.name}" moved to drunk log`);
  };

  const restore = (w) => {
    const u = wines.map(x => x.id === w.id ? { ...x, status: "in-cellar", drunkDate: null } : x);
    setWines(u); persist(u); setSel(w); showToast(`↩ "${w.name}" restored`);
  };

  const addWine = () => {
    const wine = { ...form, id: Date.now(), pairings: pairStr.split(",").map(p => p.trim()).filter(Boolean) };
    const u = [...wines, wine];
    setWines(u); persist(u); setSel(wine); setShowAdd(false);
    setForm({ ...BLANK }); setPairStr(""); showToast(`✓ "${wine.name}" added`);
  };

  if (!wines) return (
    <div style={{ minHeight: "100vh", background: "#0d0205", display: "flex", alignItems: "center", justifyContent: "center", color: "#e8d5b0", fontFamily: "Georgia,serif" }}>Loading cellar...</div>
  );

  const cellar = wines.filter(w => w.status === "in-cellar");
  const drunk = wines.filter(w => w.status === "drunk");
  const list = (view === "cellar" ? cellar : drunk).filter(w => filter === "All" || w.style === filter);

  const statBox = (l, v) => (
    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid #2a1010", borderRadius: 6, padding: "8px 10px" }}>
      <div style={{ fontSize: 8, color: "#6a4a2a", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 3 }}>{l}</div>
      <div style={{ fontSize: 11, color: "#d4b870" }}>{v}</div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#0d0205 0%,#1a0608 40%,#120410 100%)", fontFamily: "Georgia,'Times New Roman',serif", color: "#e8d5b0" }}>

      {toast && <div style={{ position: "fixed", top: 16, right: 16, background: "#1a3a1a", border: "1px solid #2a5a2a", color: "#80c080", padding: "9px 16px", borderRadius: 8, fontSize: 12, zIndex: 999, boxShadow: "0 4px 16px rgba(0,0,0,0.5)" }}>{toast}</div>}

      <div style={{ borderBottom: "1px solid #4a1a1a", padding: "22px 26px 16px", background: "linear-gradient(180deg,rgba(80,10,10,0.3) 0%,transparent 100%)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 10 }}>
          <div>
            <p style={{ color: "#9a6a3a", fontSize: 9, letterSpacing: "0.25em", textTransform: "uppercase", margin: "0 0 3px" }}>Personal Collection · Synced</p>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: "normal", color: "#f0d8a0" }}>🍷 Wine Cellar</h1>
            <p style={{ margin: "3px 0 0", color: "#7a5a3a", fontSize: 11 }}>{cellar.length} in cellar · {drunk.length} drunk {saving && "· saving..."}</p>
          </div>
          <button onClick={() => setShowAdd(true)} style={{ padding: "8px 18px", background: "rgba(139,32,32,0.25)", border: "1px solid #8b2020", borderRadius: 7, color: "#e8a0a0", fontSize: 12, cursor: "pointer" }}>+ Add Bottle</button>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "18px 26px", display: "flex", gap: 22, flexWrap: "wrap" }}>
        <div style={{ width: 264, flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
            {[["cellar", `🍾 Cellar (${cellar.length})`], ["drunk", `📖 Drunk (${drunk.length})`]].map(([v, label]) => (
              <button key={v} onClick={() => setView(v)} style={{ flex: 1, padding: "5px 0", borderRadius: 7, border: `1px solid ${view === v ? "#8b2020" : "#2a1010"}`, background: view === v ? "rgba(139,32,32,0.18)" : "transparent", color: view === v ? "#e8a0a0" : "#6a4a3a", fontSize: 10, cursor: "pointer" }}>{label}</button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 5, marginBottom: 13, flexWrap: "wrap" }}>
            {["All", "Red", "White", "Rosé", "Sparkling"].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ padding: "3px 9px", borderRadius: 12, border: `1px solid ${filter === f ? "#c9962a" : "#2a1010"}`, background: filter === f ? "rgba(201,150,42,0.1)" : "transparent", color: filter === f ? "#c9962a" : "#5a3a2a", fontSize: 9, cursor: "pointer" }}>{f}</button>
            ))}
          </div>
          {list.length === 0 && <div style={{ color: "#4a3a2a", fontSize: 12, textAlign: "center", paddingTop: 24 }}>Nothing here yet</div>}
          {list.map(w => (
            <div key={w.id} onClick={() => setSel(w)} style={{ padding: "11px 13px", marginBottom: 6, borderRadius: 7, border: `1px solid ${sel?.id === w.id ? "#8b2020" : "#2a1010"}`, background: sel?.id === w.id ? "rgba(139,32,32,0.18)" : "rgba(255,255,255,0.015)", cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: "#f0d8a0", lineHeight: 1.3 }}>{w.name}</div>
                  <div style={{ fontSize: 10, color: "#7a5a3a", marginTop: 2 }}>{w.vintage} · {w.varietal}</div>
                  {w.drunkDate && <div style={{ fontSize: 9, color: "#5a4a3a", marginTop: 1 }}>Drunk: {w.drunkDate}</div>}
                </div>
                <div style={{ fontSize: 8, padding: "2px 5px", borderRadius: 6, border: `1px solid ${w.style === "White" ? "#8a7340" : w.style === "Rosé" ? "#8a4060" : "#6a2020"}`, color: w.style === "White" ? "#c9a840" : w.style === "Rosé" ? "#c07090" : "#c07070", marginLeft: 5, flexShrink: 0 }}>{w.style}</div>
              </div>
              <div style={{ marginTop: 5 }}>
                <span style={{ fontSize: 9, background: `${OCC_COLORS[w.occasion] || "#555"}22`, border: `1px solid ${OCC_COLORS[w.occasion] || "#555"}44`, color: OCC_COLORS[w.occasion] || "#999", padding: "1px 7px", borderRadius: 8 }}>{w.occasion}</span>
              </div>
            </div>
          ))}
        </div>

        {sel && (
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ background: "linear-gradient(135deg,rgba(30,5,5,0.9),rgba(20,5,15,0.95))", border: "1px solid #3a1a1a", borderRadius: 11, padding: "22px 26px" }}>
              <div style={{ borderBottom: "1px solid #2a1010", paddingBottom: 16, marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 18, color: "#f0d8a0", fontWeight: "normal" }}>{sel.name}</h2>
                  <p style={{ margin: "3px 0 0", color: "#9a6a3a", fontSize: 12 }}>{sel.producer}</p>
                  <p style={{ margin: "2px 0 0", color: "#6a4a2a", fontSize: 11 }}>{sel.country}</p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 7 }}>
                  <div style={{ fontSize: 18, color: "#c9962a" }}>{sel.vintage}</div>
                  {sel.status === "in-cellar"
                    ? <button onClick={() => markDrunk(sel)} style={{ padding: "5px 12px", background: "rgba(80,10,10,0.4)", border: "1px solid #6a2020", borderRadius: 6, color: "#c07070", fontSize: 11, cursor: "pointer" }}>🍷 Mark as Drunk</button>
                    : <button onClick={() => restore(sel)} style={{ padding: "5px 12px", background: "rgba(10,40,10,0.4)", border: "1px solid #2a6a2a", borderRadius: 6, color: "#70c070", fontSize: 11, cursor: "pointer" }}>↩ Restore to Cellar</button>
                  }
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 20 }}>
                {[["Varietal", sel.varietal], ["Region", sel.region], ["Style", sel.style], ["Drink Window", sel.drinkWindow], ["Est. Price", sel.estimatedPrice], ["Age Potential", sel.agePotential]].map(([l, v]) => statBox(l, v))}
              </div>
              {(sel.tastingNotes.nose || sel.tastingNotes.palate) && <>
                <h3 style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "#8a5a3a", margin: "0 0 11px", fontWeight: "normal" }}>Tasting Notes</h3>
                {[["Nose", sel.tastingNotes.nose], ["Palate", sel.tastingNotes.palate], ["Finish", sel.tastingNotes.finish]].map(([l, v]) => v ? (
                  <div key={l} style={{ marginBottom: 9 }}>
                    <span style={{ fontSize: 10, color: "#c9962a", fontStyle: "italic", marginRight: 6 }}>{l}:</span>
                    <span style={{ fontSize: 12, color: "#c8b89a", lineHeight: 1.6 }}>{v}</span>
                  </div>
                ) : null)}
              </>}
              {sel.forCalAusWineLover && <div style={{ background: "rgba(201,150,42,0.07)", border: "1px solid rgba(201,150,42,0.18)", borderRadius: 7, padding: "12px 14px", margin: "18px 0" }}>
                <div style={{ fontSize: 9, color: "#c9962a", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 6 }}>🌎 Context for a Cal / Aus Wine Drinker</div>
                <p style={{ margin: 0, fontSize: 12, color: "#c8b89a", lineHeight: 1.7 }}>{sel.forCalAusWineLover}</p>
              </div>}
              {sel.pairings?.length > 0 && <div style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "#8a5a3a", margin: "0 0 9px", fontWeight: "normal" }}>Food Pairings</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {sel.pairings.map(p => <span key={p} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 11, background: "rgba(139,32,32,0.12)", border: "1px solid rgba(139,32,32,0.25)", color: "#d4a0a0" }}>{p}</span>)}
                </div>
              </div>}
              {sel.notes && <div style={{ background: "rgba(100,20,20,0.12)", border: "1px solid #3a1a1a", borderRadius: 7, padding: "10px 13px" }}>
                <div style={{ fontSize: 9, color: "#8a5a3a", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>Sommelier Note</div>
                <p style={{ margin: 0, fontSize: 11, color: "#9a8060", lineHeight: 1.6, fontStyle: "italic" }}>{sel.notes}</p>
              </div>}
            </div>
          </div>
        )}
      </div>

      {showAdd && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.82)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
          <div style={{ background: "#1a0608", border: "1px solid #4a1a1a", borderRadius: 12, padding: 24, maxWidth: 580, width: "100%", maxHeight: "88vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h2 style={{ margin: 0, fontSize: 16, color: "#f0d8a0", fontWeight: "normal" }}>Add New Bottle</h2>
              <button onClick={() => setShowAdd(false)} style={{ background: "none", border: "none", color: "#7a5a3a", fontSize: 18, cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" }}>
              <Inp label="Wine Name" value={form.name} onChange={e => setF("name", e.target.value)} />
              <Inp label="Producer" value={form.producer} onChange={e => setF("producer", e.target.value)} />
              <Inp label="Vintage" value={form.vintage} onChange={e => setF("vintage", e.target.value)} />
              <Inp label="Varietal / Grape" value={form.varietal} onChange={e => setF("varietal", e.target.value)} />
              <Inp label="Region" value={form.region} onChange={e => setF("region", e.target.value)} />
              <Inp label="Country" value={form.country} onChange={e => setF("country", e.target.value)} />
              <div style={{ marginBottom: 11 }}>
                <label style={{ display: "block", fontSize: 9, color: "#9a6a3a", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 3 }}>Style</label>
                <select value={form.style} onChange={e => setF("style", e.target.value)} style={{ width: "100%", background: "#150406", border: "1px solid #3a1a1a", borderRadius: 5, padding: "7px 9px", color: "#e8d5b0", fontSize: 12 }}>
                  {["Red","White","Rosé","Sparkling","Dessert","Orange"].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 11 }}>
                <label style={{ display: "block", fontSize: 9, color: "#9a6a3a", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 3 }}>Occasion</label>
                <select value={form.occasion} onChange={e => setF("occasion", e.target.value)} style={{ width: "100%", background: "#150406", border: "1px solid #3a1a1a", borderRadius: 5, padding: "7px 9px", color: "#e8d5b0", fontSize: 12 }}>
                  {Object.keys(OCC_COLORS).map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <Inp label="Price" value={form.estimatedPrice} onChange={e => setF("estimatedPrice", e.target.value)} />
              <Inp label="Drink Window" value={form.drinkWindow} onChange={e => setF("drinkWindow", e.target.value)} />
              <Inp label="Age Potential" value={form.agePotential} onChange={e => setF("agePotential", e.target.value)} />
              <Inp label="Alcohol %" value={form.alcohol} onChange={e => setF("alcohol", e.target.value)} />
            </div>
            <Inp label="Nose" value={form.tastingNotes.nose} onChange={e => setN("nose", e.target.value)} rows={2} />
            <Inp label="Palate" value={form.tastingNotes.palate} onChange={e => setN("palate", e.target.value)} rows={2} />
            <Inp label="Finish" value={form.tastingNotes.finish} onChange={e => setN("finish", e.target.value)} rows={1} />
            <Inp label="Context for Cal/Aus Wine Drinker" value={form.forCalAusWineLover} onChange={e => setF("forCalAusWineLover", e.target.value)} rows={2} />
            <Inp label="Food Pairings (comma-separated)" value={pairStr} onChange={e => setPairStr(e.target.value)} />
            <Inp label="Sommelier Notes" value={form.notes} onChange={e => setF("notes", e.target.value)} rows={2} />
            <div style={{ display: "flex", gap: 9, justifyContent: "flex-end", marginTop: 6 }}>
              <button onClick={() => setShowAdd(false)} style={{ padding: "8px 18px", background: "transparent", border: "1px solid #3a1a1a", borderRadius: 7, color: "#7a5a3a", fontSize: 12, cursor: "pointer" }}>Cancel</button>
              <button onClick={addWine} disabled={!form.name} style={{ padding: "8px 18px", background: "rgba(139,32,32,0.28)", border: "1px solid #8b2020", borderRadius: 7, color: "#e8a0a0", fontSize: 12, cursor: "pointer", opacity: form.name ? 1 : 0.4 }}>Add to Cellar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
