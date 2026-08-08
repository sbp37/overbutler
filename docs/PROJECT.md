# PROJECT

## Overbutler (과잉집사)

Overbutler is a **mobile-first web app** focused on lightweight, amusing task reporting with “over-enthusiastic butler” personas.

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
