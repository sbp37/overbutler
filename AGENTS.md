# Overbutler AGENTS

Repository is the Overbutler web app.  
AI-assisted work should follow these constraints:

- Verify current behavior and code before making changes.
- Do not refactor or touch unrelated areas unless explicitly requested.
- Make small, incremental changes only.
- Preserve existing UI/UX and `localStorage` behavior as much as possible.
- Mobile-first implementation with horizontal scroll prevention.
- Prefer the simplest and most stable implementation first.
- Do not add new frameworks/libraries/backends unless requested.
- Add Supabase only when truly needed for accounts, ranking, and cloud persistence.
- Do not add Vercel/Sentry/etc. external services without explicit request.
- Never delete or reset existing `localStorage` keys or user data arbitrarily.
- Reuse existing design system and styles; avoid redesigning components.
- Before finishing, remove broken imports, debug code, and obvious runtime errors.
- Keep `main` as the default branch.
- Move project documentation and asset conventions into `docs/` when expanding this set of rules.
