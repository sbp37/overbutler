# Codex Bridge contract

This directory is the GitHub transport contract for the shared Mac Codex Bridge.

- `queue.json` accepts only an explicitly approved task whose `project` is `overbutler`.
- `result.json` stores the latest execution result and changed-file summary.
- The watcher never commits or pushes project code and never deploys production.
- Dirty worktrees, destructive Git commands, force push, rebase, and hard reset are blocked.
- A task ID is executed at most once.

Bridge metadata commits are transport records, not application releases.
