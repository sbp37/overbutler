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

## Platform packaging status

### Public web

- The release-candidate web flow, install manifest, icons, legal pages, and mobile safe areas are present.
- Keep `butlermaker_v1` as the compatibility contract. Do not reset it during packaging.
- The final domain, operator name, and support contact are still submission-time inputs.

### Apps in Toss

- Use the official `@apps-in-toss/web-framework` adapter and generate `granite.config.ts` plus a `.ait` bundle.
- `appName`, display name, and icon must exactly match the Apps in Toss console entry. Do not invent these values in source before the console app is fixed.
- Keep the main web viewport accessible. Apply the Apps in Toss pinch-zoom setting only in the platform-specific shell.
- Test the exact bundle in Toss Sandbox, including native back events and all overlays.
- QR-test `localStorage` and production `localStorage` use different origins and do not share data. Production updates on the same origin do preserve data.
- The extracted bundle must stay below the official 100 MB uncompressed limit. Never package the repository root: it contains source sheets, mockups, and reference assets not used at runtime.
- Run `node scripts/build-runtime-bundle.mjs` to create the shared runtime-only source under `dist/runtime/`; use that directory as the input for platform adapters.

### App Store and Google Play

- A website URL or thin remote WebView is not the submission artifact. Build a locally bundled native container after the web release-candidate is approved.
- Use the same local web application and data contract, then add only platform-required native lifecycle, file sharing, haptics, and navigation handling.
- Apple review requires an experience beyond a repackaged website; verify app-like value and on-device completeness before submission.
- Google Play requires stable, meaningful functionality, policy declarations, a live privacy URL, content rating, and the current target API level.
- As of 2026-08-31, new Google Play submissions must target Android 16 / API level 36 or higher.

## Current official references

- Apps in Toss existing-web integration: <https://developers-apps-in-toss.toss.im/tutorials/webview.html>
- Apps in Toss storage behavior: <https://developers-apps-in-toss.toss.im/bedrock/reference/framework/%EC%A0%80%EC%9E%A5%EC%86%8C/Storage.html>
- Apps in Toss WebView properties: <https://developers-apps-in-toss.toss.im/bedrock/reference/framework/%EC%86%8D%EC%84%B1%20%EC%A0%9C%EC%96%B4/webview-props.html>
- Apple App Review Guidelines, especially 2.1 and 4.2: <https://developer.apple.com/app-store/review/guidelines/>
- Google Play functionality policy: <https://support.google.com/googleplay/android-developer/answer/9898783>
- Google Play target API requirement: <https://developer.android.com/google/play/requirements/target-sdk>
