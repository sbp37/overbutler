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

## Future additions

Append future entries with the same three-field format so decisions remain searchable and easy to audit.
