# ink-scroll — Claude Guidelines

## After every code change, sync these docs

Whenever you add a feature, fix a bug, refactor, or bump a version, update **all** of the following that are affected before closing the task:

| File | What to update |
|---|---|
| `ROADMAP.md` | Mark completed items ✓, remove stale entries, add new ideas |
| `STATUS.md` | Check off completed items, add new ones if needed |
| `NEXT-SESSION-PLAN.md` | Update "Current state" section, remove completed tasks, add new ones |
| `CHANGELOG.md` | Add an entry under the correct version |
| `packages/svg-scroll-draw/package.json` | Bump version if the change is user-facing |
| `README.md` | Update feature list, API table, or examples if the API changed |

**Rule:** Never report a task as done if any of these docs still describe the old state. Docs drift = confusion next session.

## Key facts (verify before assuming)
- Library: `packages/svg-scroll-draw` — check `package.json` for current version
- Demo app: `apps/demo` — Next.js 16 App Router
- Tests: `packages/svg-scroll-draw/src/__tests__/` — run `npm test` from root
- Build: `npm run build:lib` builds the library, `npm run dev` starts the demo
