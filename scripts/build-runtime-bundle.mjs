import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { dirname, relative, resolve, sep } from "node:path";

const root = resolve(import.meta.dirname, "..");
const output = resolve(root, "dist/runtime");
const maxBundleBytes = 100 * 1024 * 1024;

const entryFiles = [
  "index.html",
  "chat-engine.js",
  "app.js",
  "app.css",
  "home-final.css",
  "records-final.css",
  "manager-final.css",
  "certificate-final.css",
  "report-final.css",
  "flow-final.css",
  "reaction-final.css",
  "relationship-final.css",
  "manifest.webmanifest",
  "privacy.html",
  "terms.html",
  "legal.css",
];

const assetPattern = /design\/[a-z0-9_./-]+\.(?:png|jpe?g|webp|svg)/gi;
const files = new Set(entryFiles);

for (const file of entryFiles) {
  const source = resolve(root, file);
  const text = await readFile(source, "utf8");
  for (const match of text.matchAll(assetPattern)) files.add(match[0]);
}

await rm(output, { recursive: true, force: true });

for (const file of [...files].sort()) {
  const source = resolve(root, file);
  const destination = resolve(output, file);
  const sourceRelative = relative(root, source);
  if (sourceRelative.startsWith(`..${sep}`) || sourceRelative === "..") {
    throw new Error(`Refusing path outside project: ${file}`);
  }
  await stat(source);
  await mkdir(dirname(destination), { recursive: true });
  await cp(source, destination);
}

async function collect(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = resolve(directory, entry.name);
    if (entry.isDirectory()) result.push(...await collect(absolute));
    else result.push(absolute);
  }
  return result;
}

const emitted = await collect(output);
const bundleBytes = (await Promise.all(emitted.map(file => stat(file)))).reduce((sum, item) => sum + item.size, 0);
if (bundleBytes > maxBundleBytes) {
  throw new Error(`Runtime bundle is ${(bundleBytes / 1024 / 1024).toFixed(2)} MB; Apps in Toss limit is 100 MB uncompressed.`);
}

const report = {
  files: emitted.length,
  bytes: bundleBytes,
  megabytes: Number((bundleBytes / 1024 / 1024).toFixed(2)),
  limitMegabytes: 100,
};
await writeFile(resolve(output, "bundle-report.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ output, ...report }, null, 2));
