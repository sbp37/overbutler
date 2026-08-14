# PROJECT

## Overbutler (과잉집사)

Overbutler is a **mobile-first relationship simulation** where a user reports one ordinary moment from their day and an assigned butler remembers it.

## Product definition

The butler begins by processing the user's ordinary records as routine office work. As the relationship deepens, the butler remembers more, gives the user visible preferential treatment, and gradually reclassifies the same mundane actions as important records, special cases, and finally absurdly official “great achievements.”

The core loop is:

1. The user reports one ordinary event in a single line.
2. The butler remembers the user's submitted records and reacts according to the current relationship.
3. Daily office incidents reveal the butler's growing favoritism from a third-party perspective.
4. Rare certificates formalize especially funny or meaningful moments without appearing after every record.

The app is not a todo manager, calendar, productivity tracker, streak system, or pet-care simulation. Relationship change and escalating official praise must be expressed through dialogue, memory, office incidents, room details, and rare documents rather than visible XP or progress formulas.

## Current context

- The project was developed mainly in a ChatGPT Site environment and is now transitioning to GitHub-based development.
- Existing UI/UX behavior should be preserved.
- Existing `localStorage` behavior is important and should be kept as stable as possible.

## Development approach

- AI-assisted development is the default workflow.
- Features are added only when needed.
- Technology and architecture changes are incremental and scoped.
- Keep things minimal and avoid unnecessary complexity.

## Service expansion policy

- No immediate redesign of current data model or interface without explicit need.
- Use new services only when a real requirement appears:
  - Supabase: only for account, ranking, or cloud persistence needs.
  - Vercel/Sentry/other external services: only when practically required.

## Notes

- Focus on practical implementation and fast iteration.
- Prefer reliability over “too much polish” if it risks changing current behavior.
