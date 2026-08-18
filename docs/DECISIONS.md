# DECISIONS

This document records key project decisions.
Use the format:

- **Date**: YYYY-MM-DD
- **Decision**:
- **Reason**:

## Initial decisions

- **Date**: 2026-08-08  
  **Decision**: Default branch is `main`.  
  **Reason**: Aligns with current repository setup and standard deployment/review flow.

- **Date**: 2026-08-08  
  **Decision**: Mobile-first implementation.  
  **Reason**: Primary user flow is mobile, so responsiveness and touch-first behavior have priority.

- **Date**: 2026-08-08  
  **Decision**: Keep `localStorage`-based behavior first.  
  **Reason**: Existing user data and flows are already built around this storage path.

- **Date**: 2026-08-08  
  **Decision**: Avoid large refactors that break existing behavior.  
  **Reason**: Stability is critical for continuity and low-risk iteration.

- **Date**: 2026-08-08  
  **Decision**: Make changes in small, incremental steps.  
  **Reason**: Safer rollback and easier review of side effects.

- **Date**: 2026-08-08  
  **Decision**: Add external services/libraries only when truly needed.  
  **Reason**: Prevents unnecessary complexity and dependency risk.

- **Date**: 2026-08-08  
  **Decision**: Use `AGENTS.md` as the highest-priority rule during AI-assisted work.  
  **Reason**: Keeps all future agents consistent and behavior-safe.

- **Date**: 2026-08-09
  **Decision**: Keep economy and relationship tuning in the centralized `BALANCE` contract, use global non-regressing progress for applicant unlocks, and never recalculate rewards already stored on legacy records.
  **Reason**: Makes future tuning auditable while preserving existing points, relationships, hired butlers, records, and user expectations.

- **Date**: 2026-08-09
  **Decision**: Normalize malformed legacy entries defensively without truncating valid records or changing the `butlermaker_v1` storage contract.
  **Reason**: Existing users should retain records, certificates, diary snapshots, relationships, and personnel data even when older or partially damaged values are present.

- **Date**: 2026-08-09
  **Decision**: Treat persistence failure as a reversible transaction, keep a last-known-good in-memory snapshot, and use one lightweight browser-history guard for overlays and top-level views.
  **Reason**: Quota or privacy restrictions must never corrupt existing records, while mobile back navigation should cancel or close the current layer before leaving the app.

- **Date**: 2026-08-09
  **Decision**: Establish analytics as a non-persistent in-browser event contract before choosing any external analytics provider.
  **Reason**: Product flows can be instrumented without transmitting nicknames, deed text, diary text, or changing the `butlermaker_v1` data contract; provider and consent decisions remain explicit release choices.

- **Date**: 2026-08-09
  **Decision**: Keep launch artwork reproducible under `design/brand/` and compose it only from the approved wordmark, palette, and existing runtime character PNGs.
  **Reason**: Store assets should remain consistent with the real app and must not silently redraw, recolor, or distort the established characters.

- **Date**: 2026-08-09
  **Decision**: Persist each diary reflection when it is written and backfill legacy reflections once without changing the `butlermaker_v1` key.
  **Reason**: A past diary must retain the original butler, owner name, and wording even after a handover or later dialogue updates.

- **Date**: 2026-08-09
  **Decision**: Package Apps in Toss through an isolated official SDK adapter, then package iOS and Android from the approved local web build instead of wrapping a remote URL.
  **Reason**: Platform-specific configuration must not destabilize the public web app, the Toss bundle has a strict size limit, and native stores require a complete app-like submission rather than a thin website wrapper.

- **Date**: 2026-08-17
  **Decision**: Merge the archive's three tabs (records, diary, certificates) into a single
  "owner file" document, and supersede the RECORDS/DIARY LOCKED entries that required the
  tab structure.
  **Reason**: The app recognised each deed but never accumulated them — day 3 and day 30 looked
  identical, and a user's own story was split across three tabs. One scrolling file makes the
  record grow visibly thicker, and it removes a screen instead of adding one. The certificate
  tab's role as sole entry point is replaced by three paths (filter chip, card stamp, record
  detail), and the next-day diary seal is reused untouched. This supersedes a LOCKED area, so
  it was made only on the explicit request of the project owner.

- **Date**: 2026-08-17
  **Decision**: Adopt one document system for every screen — material hierarchy (grid paper <
  kraft < ivory < memo < gold), three font roles (machine print / official document / butler's
  handwriting), and five character-neutral CSS office parts — and replace FORM 04's dark
  analysis lab with a daylight paper review sheet.
  **Reason**: Each screen had grown its own colour world, so the app read as several products.
  Gold is reserved for certificates because everyday gold makes the certificate ordinary, and
  the handwriting face marks only what the butler wrote by hand, so "who wrote this" stays
  legible. The dark FORM 04 was enjoyable once or twice and then became a gate to clear every
  day; superseding it was an explicit project-owner decision.

- **Date**: 2026-08-18
  **Decision**: Keep the relationship scale in one place — `RELATIONSHIP_BOUNDARIES =
  [0, 18, 40, 60, 80, 100]` in `chat-engine.js` — and map the screen's six stages, the dialogue
  tiers, and the gift-copy tiers onto it. Thresholds may only move earlier, never later.
  **Reason**: The screen used `(index+1)*20` while dialogue used 18/65, so a user could sound
  close to the butler while the stage had not moved. Moving a threshold later would take an
  earned line away from existing accounts, so t2 stayed at 18 and only t3 came forward (65 → 60).
  Verified across obsession 0–100 that no point regresses.

- **Date**: 2026-08-18
  **Decision**: Show the relationship as an approval row rather than a 100-point bar, expand it
  only on an actual stage-up, and mask unreached stage names as 「?」.
  **Reason**: A bar turns a relationship into a progress metric, and printing the future stage
  names turns it into a checklist — arriving somewhere stops being an event. The 100-point scale
  is now internal only; the screen says "about N more deeds to the next cell".

- **Date**: 2026-08-18
  **Decision**: Ship one certificate lineage — the official recognition certificate — on screen
  and in the shared PNG, and never print scores or star ratings on it.
  **Reason**: Two parallel certificate paths meant the same achievement produced different
  documents. The bureau recognises work; it does not grade it, and a number would turn the
  certificate into a report card. The shared image is the only free acquisition channel, so it
  must be the same document the user saw.

- **Date**: 2026-08-18
  **Decision**: Scope negation to the clause containing the verb, never to a fixed window around
  the regex match, and let a negated action reach neither praise nor the title/category pools.
  **Reason**: "밥 먹기 귀찮아서 안 먹었어" was issued as 「생존 연료를 충전한 자」. The guard only
  looked 14 characters around the match, and the meal rule is lazy, so the real negation sat
  outside it; "못" was missing from the table entirely. One misunderstanding of this kind breaks
  the app's whole promise that the butler understands, so the guard has to hold at clause level.

- **Date**: 2026-08-18
  **Decision**: Add a `skipped_care` intent for negated care actions (meal, hygiene, sleep)
  instead of widening `no_motivation`, with a cat-specific pool and one neutral line for the
  other characters.
  **Reason**: `no_motivation` is a feeling ("I don't want to do anything"); skipping lunch is a
  fact. Answering someone who was too busy to eat with "some days you don't want to do anything"
  is still not understanding them, and the reply needs a different shape — concern plus one
  small thing they can do now.

- **Date**: 2026-08-18
  **Decision**: Convert runtime-referenced images to WebP at quality 90 (lossless for the two
  paper parts), keep the PNG originals in the repo, and leave five brand PNGs unconverted —
  favicon, app icon, apple-touch icon, launch splash, and the share card.
  **Reason**: The Toss Apps `.ait` limit is 100MB and runtime images alone were 18.9MB; the
  conversion removed 15.09MB (-79.7%) with alpha preserved exactly. Quality 85 would have saved
  another 0.4MB, which buys nothing against a 100MB ceiling while the character faces are the
  product. Safari requires PNG for the startup image, and several link-preview scrapers
  (KakaoTalk among them) do not render WebP — the share card is the only free acquisition
  channel, so it does not take that risk. Originals stay because the problem is the deploy
  bundle, not the repository.

## Future additions

Append future entries with the same three-field format so decisions remain searchable and easy to audit.
