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

## Numbers in docs are derived, never typed from memory

`npm run check:claims` reads the real test and example counts out of the suites
and fails when a doc disagrees; `npm run size` does the same for bundle figures.
Run them instead of editing a number by hand — CI enforces both. The counts live
in `README.md`, `STATUS.md`, the demo's opengraph image and its React landing page.

## The browser suite tests the built output, not `src/`

`packages/svg-scroll-draw/e2e` fixtures import `/dist/...` — the same files that
ship — so after editing `src/` run `npm run build:lib` before `npm run test:e2e`,
or the browser tests will check the previous build and pass.

## Coverage has two halves, and jsdom is the weaker one

The unit suite stubs `getTotalLength`, fakes `IntersectionObserver` and runs where
every rect is zero. Anything about real layout, real scrolling, the native CSS
path or a framework wrapper belongs in `e2e/`. `src/__tests__/ssr.test.ts` is the
third environment: no DOM at all, which is the only place a server-side crash
shows up.
