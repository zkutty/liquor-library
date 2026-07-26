import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, "out");
const distDir = path.join(root, "dist");
const staticDir = path.join(distDir, "static");
const serverDir = path.join(distDir, "server");
const serverFile = path.join(serverDir, "index.js");

if (!fs.existsSync(outDir)) {
  throw new Error("Missing Next static export output directory: out");
}

fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(staticDir, { recursive: true });
fs.mkdirSync(serverDir, { recursive: true });
fs.cpSync(outDir, staticDir, { recursive: true });

const worker = `const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8"
};

export default {
  async fetch(request, env) {
    if (env?.ASSETS?.fetch) {
      const response = await env.ASSETS.fetch(request);
      if (response.status !== 404) {
        return response;
      }
    }

    const url = new URL(request.url);
    const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
    const asset = STATIC_ASSETS[pathname] ?? STATIC_ASSETS[pathname + ".html"] ?? STATIC_ASSETS["/index.html"];
    const extension = pathname.includes(".") ? pathname.slice(pathname.lastIndexOf(".")) : ".html";

    return new Response(asset, {
      headers: {
        "content-type": MIME_TYPES[extension] ?? "application/octet-stream",
        "cache-control": extension === ".html" ? "no-cache" : "public, max-age=31536000, immutable"
      }
    });
  }
};

const STATIC_ASSETS = ${JSON.stringify(readStaticAssets(outDir), null, 2)};
`;

fs.writeFileSync(serverFile, worker);
console.log(`Built Sites static worker at ${serverFile}`);

function readStaticAssets(directory) {
  const assets = {};

  walk(directory, (filePath) => {
    const relative = `/${path.relative(directory, filePath).replaceAll(path.sep, "/")}`;
    const extension = path.extname(filePath).toLowerCase();

    if ([".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".pdf"].includes(extension)) {
      return;
    }

    assets[relative] = fs.readFileSync(filePath, "utf8");
  });

  return assets;
}

function walk(directory, visit) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const filePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      walk(filePath, visit);
    } else {
      visit(filePath);
    }
  }
}
