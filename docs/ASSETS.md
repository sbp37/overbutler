# ASSETS

This project keeps assets practical and close to runtime needs.

## Core rules

- Keep app assets managed inside the project repository.
- Do not assume SVG as the default format.
- Use only needed formats (`PNG`, `WebP`, etc.) based on actual usage.
- Maintain transparent variants for character/decoration assets that require alpha backgrounds.
- Keep file names meaningful.
  - Recommended: lower-case kebab-case.
  - Example: `butler-happy.png`, `result-badge-gold.webp`
  - Avoid: `image1.png`, `final-final.png`
- Avoid piling up unnecessary versioned copies of the same asset.
- Remove unused assets only after checking real references in code.
- Keep folder structure consistent with current code usage; do not create large new asset directories in bulk during this step.

## Naming policy

- Use semantic names that reflect role/state.
- Use one clear naming style per folder.
- Prefer short names over cute-but-ambiguous names when possible.

## Review process

1. Confirm actual usage via code before adding or removing assets.
2. Prefer replacing existing assets over adding duplicates.
3. Keep transparent-background files when visual composition depends on them.
