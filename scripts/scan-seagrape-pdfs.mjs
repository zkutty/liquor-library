import fs from "node:fs";
import path from "node:path";

const folder = "/Users/zbkutlow/Library/Mobile Documents/com~apple~CloudDocs/Seagrape Wines";
const indexPath = path.join(process.cwd(), "src", "data", "seagrape-pdf-index.json");
const cellarPath = path.join(process.cwd(), "src", "data", "cellar.seed.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const index = readJson(indexPath);
const cellar = readJson(cellarPath);
const cellarIds = new Set(cellar.map((wine) => wine.id));
const indexedFiles = new Set(index.map((entry) => entry.file));

const pdfFiles = fs
  .readdirSync(folder)
  .filter((file) => file.toLowerCase().endsWith(".pdf"))
  .sort();

const newPdfFiles = pdfFiles.filter((file) => !indexedFiles.has(file));
const missingPdfFiles = [...indexedFiles].filter((file) => !pdfFiles.includes(file));
const matchedEntries = index.filter((entry) => entry.matchedWineIds?.some((id) => cellarIds.has(id)));
const staleMatches = index.flatMap((entry) =>
  (entry.matchedWineIds ?? [])
    .filter((id) => !cellarIds.has(id))
    .map((id) => ({ sourceId: entry.id, wineId: id })),
);

console.log(`Seagrape PDFs found: ${pdfFiles.length}`);
for (const file of pdfFiles) {
  console.log(`- ${file}`);
}

console.log(`\nIndexed Seagrape wine pages: ${index.length}`);
console.log(`Current cellar matches: ${matchedEntries.length}`);
for (const entry of matchedEntries) {
  console.log(`- ${entry.name} -> ${entry.matchedWineIds.join(", ")} (${entry.file}, page ${entry.page})`);
}

if (newPdfFiles.length > 0) {
  console.log("\nNew PDF files need manual render/OCR and index updates:");
  for (const file of newPdfFiles) {
    console.log(`- ${file}`);
  }
}

if (missingPdfFiles.length > 0) {
  console.log("\nIndexed PDF files missing from the Seagrape folder:");
  for (const file of missingPdfFiles) {
    console.log(`- ${file}`);
  }
}

if (staleMatches.length > 0) {
  console.log("\nStale source matches point at missing cellar IDs:");
  for (const match of staleMatches) {
    console.log(`- ${match.sourceId} -> ${match.wineId}`);
  }
  process.exitCode = 1;
}
