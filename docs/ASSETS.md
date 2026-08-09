# ASSETS

## Scope and rules

This project stores runtime assets under `design/character-assets/` and does not assume `SVG` as the default format.

- Keep this app’s existing behavior when no portrait assets are available; fallback to emoji is intentional.
- Set `OVERBUTLER_ASSETS[key]._available` to `true` only when the app can actually resolve all required runtime pose paths.
- Avoid referencing non-existent files or folders in `OVERBUTLER_ASSETS`.
- Use meaningful, lower-case, kebab-case names.
- Do not introduce `final`, `new`, `real-final` style version naming.
- Preserve existing directory structure unless there is a concrete need.

## Runtime-relevant structure (current)

```text
app.js
design/character-assets/
  ai-butler/
    ai-butler-5-pose-sheet-chroma.png
    ai-butler-5-pose-sheet-dynamic-chroma.png
    ai-butler-5-pose-sheet-dynamic-transparent-hq.png
    ai-butler-5-pose-sheet-dynamic-transparent.png
    ai-butler-5-pose-sheet-transparent-hq.png
    ai-butler-5-pose-sheet-transparent.png
    ai-butler-reference.png
    ui-poses/
      ai-analysis.png
      ai-base.png
      ai-gift.png
      ai-power.png
      ai-praise.png
  cat-butler/
    cat-butler-5-pose-sheet-chroma.png
    cat-butler-5-pose-sheet-transparent-hq.png
    cat-butler-5-pose-sheet-transparent.png
    cat-butler-reference.png
  dog-butler/
    dog-butler-5-pose-sheet-chroma.png
    dog-butler-5-pose-sheet-transparent-hq.png
    dog-butler-5-pose-sheet-transparent.png
    dog-butler-reference.png
    ui-poses/
      dog-analysis.png
      dog-base.png
      dog-gift.png
      dog-power.png
      dog-praise.png
  fairy-butler/
    fairy-butler-5-pose-sheet-chroma-blue.png
    fairy-butler-5-pose-sheet-transparent-hq.png
    fairy-butler-5-pose-sheet-transparent.png
    fairy-butler-reference.png
    ui-poses/
      fairy-analysis.png
      fairy-base.png
      fairy-gift.png
      fairy-power.png
      fairy-praise.png
  idol-butler/
    idol-butler-5-pose-sheet-chroma.png
    idol-butler-5-pose-sheet-transparent-hq.png
    idol-butler-5-pose-sheet-transparent.png
    idol-butler-reference.png
    ui-poses/
      idol-analysis.png
      idol-base.png
      idol-gift.png
      idol-power.png
      idol-praise.png
  ninja-butler/
    ninja-butler-5-pose-sheet-chroma.png
    ninja-butler-5-pose-sheet-transparent-hq.png
    ninja-butler-5-pose-sheet-transparent.png
    ninja-butler-reference.png
  witch-butler/
    witch-butler-5-pose-sheet-chroma.png
    witch-butler-5-pose-sheet-transparent-hq.png
    witch-butler-5-pose-sheet-transparent.png
    witch-butler-reference.png
  zombie-butler/
    zombie-butler-5-pose-sheet-chroma-blue.png
    zombie-butler-5-pose-sheet-transparent-hq.png
    zombie-butler-5-pose-sheet-transparent.png
    zombie-butler-reference.png
```

## Brand and release artwork

Release-facing artwork is stored under `design/brand/`. Character artwork is composed at its original color and aspect ratio; no CSS filter or generative redraw is used.

```text
design/brand/
  app-icon-1024.png
  app-icon-512.png
  app-icon-192.png
  apple-touch-icon-180.png
  favicon-32.png
  launch-splash-1170x2532.png
  share-card-1200x630.png
  brand-assets-source.html
```

- `brand-assets-source.html` is the reproducible composition source for these raster outputs.
- The app icon uses the office seal/wordmark rather than cropping a character portrait.
- The splash and share art reuse the existing `ui-poses/*-base.png` files without recoloring or ratio changes.
- `manifest.webmanifest` and the document metadata reference only the generated PNG files above.

## Current `OVERBUTLER_ASSETS` policy

- `ai`: `_available: true` and 1:1 UI pose paths are defined (`base`, `analysis`, `praise`, `power`, `gift`).
- `cat`, `dog`: `_available: true` with 1:1 UI pose paths defined (`base`, `analysis`, `praise`, `power`, `gift`).
- `fairy`: `_available: true` with 1:1 UI pose paths defined (`base`, `analysis`, `praise`, `power`, `gift`).
- `star`: `_available: true` with 1:1 idol UI pose paths defined (`base`, `analysis`, `praise`, `power`, `gift`).
- `alien`, `ninja`, `witch`, `fox`, `elf`: `_available: false` (fallback retained until a complete runtime pose set exists).

Notes:
- `alien-butler` and `elf-butler` directories do not exist currently.
- No code changes were made to `localStorage` schema, keys, or character-state persistence.
