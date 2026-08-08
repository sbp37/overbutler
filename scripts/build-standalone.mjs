import { readFile, mkdir, writeFile } from "node:fs/promises";
import { extname, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const sourcePath = resolve(root, "index.html");
const outputDir = resolve(root, "dist");
const outputPath = resolve(outputDir, "index.html");

const mimeTypes = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

let html = await readFile(sourcePath, "utf8");
const css = await readFile(resolve(root, "app.css"), "utf8");
const js = await readFile(resolve(root, "app.js"), "utf8");

html = html
  .replace('<link rel="stylesheet" href="app.css">', () => `<style>\n${css}\n</style>`)
  .replace('<script src="app.js"></script>', () => `<script>\n${js}\n</script>`);

const localImages = [...new Set(
  [...html.matchAll(/(?:src\s*=\s*|url\()["']?([^"')]+\.(?:png|jpe?g|webp|svg))["']?|["'](design\/[^"']+\.(?:png|jpe?g|webp|svg))["']/gi)]
    .map((match) => match[1] || match[2])
    .filter((path) => !path.startsWith("data:") && !path.startsWith("http"))
)];

for (const imagePath of localImages) {
  let bytes;
  try {
    bytes = await readFile(resolve(root, imagePath));
  } catch (error) {
    if (error.code === "ENOENT") continue;
    throw error;
  }
  const mime = mimeTypes[extname(imagePath).toLowerCase()];
  const dataUri = `data:${mime};base64,${bytes.toString("base64")}`;
  html = html.split(imagePath).join(dataUri);
}

await mkdir(outputDir, { recursive: true });
await writeFile(outputPath, html);
console.log(outputPath);
