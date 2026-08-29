# CAT Release Candidate - 2026-08-29

## Current line

- Branch: `codex/cat-core-loop-simplify`
- Product scope: CAT-FIRST
- Storage: local-only `butlermaker_v1`
- Merge status: not merged to `main`

## Product contract

The CAT experience is not a task manager with a mascot. The user tells the first story of the cat butler's career, and those submitted stories become the cat's work, growth, and relationship history.

- The cat only knows what the user directly entered.
- No absence tracking, routine inference, streak pressure, guilt, or relationship loss.
- Comfort takes priority when the user reports sadness, exhaustion, pain, or low motivation.
- A briefing is optional paperwork the butler helps hold, not a productivity score.
- Records preserve both the user's original words and the butler's interpretation.
- Relationship promotions leave visible office traces so growth is not only a number.

## Completed CAT release scope

- First-owner onboarding and rookie-butler world contract
- Natural-language story intake, comfort routing, judgment, result, record detail, diary reveal
- Source text, discovered achievement, and original reaction preservation with legacy fallback
- Six CAT career stages with growth dialogue and room traces
- Today briefing: add, complete, carry manually, story follow-up, and file continuity
- Time-of-day CAT office rooms, lamp state, pose changes, blinking, and mobile horizontal room drag
- Direct gift drag to the cat with relationship response
- One selected desk toy at a time; non-room gifts remain preserved in gift history
- CAT personnel view reduced to owned butlers and the active free unlock queue
- Repeated emotion/body inputs separated and CAT reply pools expanded
- First-week time and personnel greeting variety expanded without surveillance language

## Locked for this candidate

- Do not reintroduce unfinished future-butler cards into the CAT personnel screen.
- The next visible free applicant is the AI butler only. AI completion is a separate pass.
- Keep the desk visually quiet: at most one attractive toy is shown.
- Cat tower implementation remains deferred until it can match every time-of-day room without compositing seams.
- Do not add accounts, server APIs, subscriptions, streaks, or automatic schedule carry-over in this line.
- Do not redesign FORM 01, the file system, or CAT HOME while reviewing this candidate.

## Verification baseline

- `node --check app.js`: pass
- `tests/chat-engine.test.js`: pass
- `tests/message-interpreter.test.js`: pass
- CAT browser regression: 7/7 fixtures, 132 checks
- Mobile widths 360 / 390 / 430: horizontal overflow 0
- Broken runtime images / asset 404: 0
- Browser console errors in key CAT flows: 0
- Legacy localStorage migration: pass

## Remaining decisions

1. Owner visual acceptance on the branch preview.
2. Merge this candidate to `main` only after explicit approval.
3. Build the AI butler as the next free unlock in its own branch and world pass.
4. Revisit the cat tower only with final isolated assets for all room lighting states.

