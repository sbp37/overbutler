# Release Baseline

## Versioning

- `APP_VERSION` in `app.js` is the user-visible app version and storage schema marker.
- Update notes and the manager screen version must match `APP_VERSION`.
- Additive state normalization remains compatible with the `butlermaker_v1` key.

## Web launch files

- Install metadata: `manifest.webmanifest`
- Privacy policy: `privacy.html`
- Terms of service: `terms.html`
- Brand artwork: `design/brand/`
- Vercel static routing: `vercel.json`

## Before a real store submission

- Replace the review URL with the final public domain in store metadata.
- Confirm the final operator name and customer-support contact in both legal documents.
- Recheck hosting/font providers and any overseas processing disclosures.
- Complete current Apps in Toss, Apple App Store, and Google Play policy checklists.
- Run `quality-handoff`, then `release-check` on the exact submission build.

