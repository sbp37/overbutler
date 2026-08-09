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

## Future additions

Append future entries with the same three-field format so decisions remain searchable and easy to audit.
