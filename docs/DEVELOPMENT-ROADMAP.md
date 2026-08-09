# Overbutler Development Roadmap

This checklist preserves the agreed product order. Complete each batch with mobile regression checks before moving to the next one.

## Core product loop

- [x] Owner nickname, time-based typed greeting, diary, and drag-to-gift interaction
- [x] Five visible relationship stages, relationship progress, stage-up feedback, and past-achievement recall
- [x] Strengthen achievement analysis, normal/power praise distinction, rare verdicts, and result pacing
- [x] Finish shareable certificate output for long text and major social ratios

## Character relationship content

- [x] Complete personality content matrices for the four launch butlers first
- [x] Add gift preference, duplicate-gift, rare-gift, return, and absence reactions
- [x] Add lightweight home interactions and pose persistence without excessive animation
- [x] Expand personality content for every currently supported butler; unavailable portraits stay intentional silhouettes/fallbacks
- [ ] Confirm the final launch roster: runtime currently supports 10 butlers, while an earlier product direction referenced 11

## Product screens and first use

- [x] Align analysis, praise result, certificate, and gift screens to the approved visual language
- [x] Align diary/archive, manager, and recruitment screens to the approved visual language
- [x] Reduce first-use flow to nickname → assignment → first deed → praise → first certificate/progress
- [x] Tune points, gifts, relationship speed, unlock conditions, and rare-reaction frequency

## Stability and release

- [x] Validate localStorage migration and long/edge-case content across 360/390/430px
- [x] Audit broken assets, back navigation, repeated taps, storage failures, share/save failures, and accessibility
- [x] Prepare legal pages, app icon/splash/share art, versioning, platform safe areas, and analytics events
- [x] Validate the public web build with the complete mobile relationship flow
- [x] Audit Apps in Toss, App Store, and Play Store packaging against current official requirements
- [ ] Confirm the Apps in Toss console `appName` and icon URL, then add the isolated SDK adapter
- [ ] Build a runtime-only `.ait` bundle under 100 MB and validate it in Toss Sandbox
- [ ] Create locally bundled iOS/Android containers and validate native navigation, sharing, lifecycle, and signing
- [ ] Confirm the final domain, operator/support details, store metadata, and submission accounts
- [ ] Run `quality-handoff` and `release-check` on each exact submission artifact

## Deferred until proven necessary

- Free chat expansion
- World ranking
- Complex accounts or cloud sync
- Generative AI integration
- Social feed and calendar features
- Large backend or framework migration
