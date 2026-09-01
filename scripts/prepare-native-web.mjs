import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "www");
const rootAssets = [
  "index.html", "privacy.html", "terms.html", "manifest.webmanifest", "favicon.ico",
  "app.css", "home-final.css", "records-final.css", "manager-final.css",
  "certificate-final.css", "report-final.css", "flow-final.css", "reaction-final.css",
  "relationship-final.css", "ux-polish.css", "contextual-response.css",
  "cat-first-run-polish.css", "home-office.css", "legal.css", "retro-office.css",
  "app.js", "message-interpreter.js", "chat-engine.js", "cat-first-run-polish.js",
  "cat-conversation-memory.js", "storage-bootstrap.js"
];

const exactDesignAssets = new Set([
  "brand/app-icon-192.png",
  "brand/apple-touch-icon-180.png",
  "brand/favicon-32.png",
  "brand/launch-splash-1170x2532.png",
  "brand/overbutler-logo-lockup.webp",
  "brand/share-card-1200x630.png",
  "paper-assets/memo-note.webp",
  "paper-assets/stamp-approved.webp"
]);

function isRuntimeDesignAsset(relativePath) {
  if (exactDesignAssets.has(relativePath)) return true;
  if (/^rooms\/(?:cat-office-(?:room|time-[^/]+)|cat-briefing-board-empty)\.webp$/.test(relativePath)) return true;
  if (/^character-assets\/[^/]+-butler\/[^/]+-butler-reference\.webp$/.test(relativePath)) return true;
  if (/^character-assets\/[^/]+-butler\/ui-poses\/[^/]+\.webp$/.test(relativePath)) return true;
  if (/^character-assets\/cat-butler\/desk-poses\/final-v1\/[^/]+\.webp$/.test(relativePath)) return true;
  if (/^gift-assets\/cat\/[^/]+\.webp$/.test(relativePath)) return true;
  return /^sound-assets\/[^/]+\/[^/]+\.mp3$/.test(relativePath);
}

async function copyRuntimeDesignAssets(directory = path.join(root, "design")) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const source = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await copyRuntimeDesignAssets(source);
      continue;
    }
    const relativePath = path.relative(path.join(root, "design"), source).split(path.sep).join("/");
    if (!isRuntimeDesignAsset(relativePath)) continue;
    const destination = path.join(output, "design", relativePath);
    await mkdir(path.dirname(destination), { recursive: true });
    await cp(source, destination);
  }
}

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const relativePath of rootAssets) {
  const destination = path.join(output, relativePath);
  await mkdir(path.dirname(destination), { recursive: true });
  await cp(path.join(root, relativePath), destination);
}
await copyRuntimeDesignAssets();

const nativeIndexPath = path.join(output, "index.html");
const webScriptBlock = `  <script src="storage-adapter.js?v=native-foundation-1"></script>
  <script src="message-interpreter.js?v=local-interpreter-1"></script>
  <script src="chat-engine.js?v=local-interpreter-1"></script>
  <script src="app.js?v=cat-weekly-return-final"></script>
  <script src="cat-first-run-polish.js?v=1"></script>
  <script src="cat-conversation-memory.js?v=1"></script>`;
const nativeScriptBlock = `  <script type="module" src="storage-bootstrap.js?v=native-foundation-1"></script>`;
const webIndex = await readFile(nativeIndexPath, "utf8");
const nativeIndex = webIndex.replace(webScriptBlock, nativeScriptBlock);
if (nativeIndex === webIndex) {
  throw new Error("Native index bootstrap replacement did not match the web script block");
}
await writeFile(nativeIndexPath, nativeIndex);

// The web deployment imports the zero-dependency web adapter. Only the native
// package receives the Preferences-backed adapter and its Capacitor bridge.
await build({
  entryPoints: [path.join(root, "storage-adapter-native.js")],
  outfile: path.join(output, "storage-adapter.js"),
  bundle: true,
  format: "esm",
  platform: "browser",
  target: ["safari15", "chrome100"],
  sourcemap: false,
  minify: false
});
