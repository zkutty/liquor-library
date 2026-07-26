import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = process.cwd();
const legacyPath = path.join(root, "legacy", "wine-catalog.jsx");
const outputPath = path.join(root, "src", "data", "cellar.seed.json");
const timestamp = "2026-07-13T00:00:00.000Z";

function extractArrayLiteral(source, name) {
  const marker = `const ${name} =`;
  const markerIndex = source.indexOf(marker);

  if (markerIndex === -1) {
    throw new Error(`Could not find ${name}`);
  }

  const start = source.indexOf("[", markerIndex);
  if (start === -1) {
    throw new Error(`Could not find ${name} array start`);
  }

  let depth = 0;
  let quote = null;
  let escaped = false;

  for (let index = start; index < source.length; index += 1) {
    const char = source[index];

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }

    if (char === "\"" || char === "'" || char === "`") {
      quote = char;
      continue;
    }

    if (char === "[") {
      depth += 1;
    } else if (char === "]") {
      depth -= 1;
      if (depth === 0) {
        return source.slice(start, index + 1);
      }
    }
  }

  throw new Error(`Could not find ${name} array end`);
}

const source = fs.readFileSync(legacyPath, "utf8");
const literal = extractArrayLiteral(source, "DEFAULT_WINES");
const legacyWines = vm.runInNewContext(literal, Object.create(null), {
  timeout: 1000,
});

const migrated = legacyWines.map((wine) => ({
  ...wine,
  id: `legacy-${wine.id}`,
  legacyId: wine.id,
  quantity: 1,
  legacyStatus: wine.status,
  status: wine.status === "in-cellar" ? "in_cellar" : wine.status,
  drinkWindowText: wine.drinkWindow,
  createdAt: timestamp,
  updatedAt: timestamp,
}));

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(migrated, null, 2)}\n`);

console.log(`Migrated ${migrated.length} wines to ${outputPath}`);
