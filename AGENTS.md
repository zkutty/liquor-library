# Repository Workflows

## Seagrape PDF Wine Notes

- Before adding or enriching a wine, check the source folder:
  `/Users/zbkutlow/Library/Mobile Documents/com~apple~CloudDocs/Seagrape Wines`
- Run `npm run scan:seagrape` to see indexed Seagrape pages and current cellar matches.
- The manually curated source index is `src/data/seagrape-pdf-index.json`.
- If the scan reports a new PDF, render or OCR the new pages, inspect them, and update `src/data/seagrape-pdf-index.json` before using that source.
- Use Seagrape notes only when producer/name/region/vintage clearly match, or when documenting a close contextual match in `notes`.
- Do not overwrite bottle-specific label facts with a PDF vintage unless the PDF clearly describes the same bottle.
- When using Seagrape material, add or maintain a `sourceReferences` entry on the wine record with source, file, page, match basis, and a short note.
- Keep commentary concise and paraphrased. Do not paste long passages from the PDFs into `cellar.seed.json`.
