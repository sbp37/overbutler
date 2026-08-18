# Analytics Event Contract

Overbutler currently has **no external analytics SDK** and does not persist analytics events.

## Runtime contract

- Browser event: `overbutler:analytics`
- Runtime API: `window.OVERBUTLER_ANALYTICS`
- Queue: memory-only, latest 80 events
- User-entered nickname, deed text, diary text, and gift name are never event properties.

Current event names:

- `app_open`
- `onboarding_complete`
- `view_change`
- `owner_file_filter`
- `butler_interaction`
- `achievement_submit`
- `achievement_complete`
- `certificate_open`
- `certificate_save`
- `certificate_share`
- `gift_desk_open`
- `gift_given`
- `butler_switch`
- `privacy_open`
- `terms_open`

Allowed properties are limited to non-user text such as character key, view/tab, owner-file filter chip, achievement category/verdict, interaction source, official status, gift reaction type, relationship stage index, onboarding state, and preview state.

The archive tab switch is gone. Records, diary and certificates were merged into one
"owner file" document on 2026-08-17, so tab changes inside that screen are now filter
chip changes and report as `owner_file_filter` with a `filter` property
(`all` / `today` / `official` / `praise`). `view_change` still carries `tab` for the
bottom navigation slot that opened a view.

Connect an external provider only after the provider, consent requirement, retention period, and privacy-policy changes are approved.

