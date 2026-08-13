# Contributing

Thanks for looking. This is a small project, so the process is short.

## Setup

```bash
git clone https://github.com/DhruvilChauahan0210/ink-scroll.git
cd ink-scroll
npm install          # builds the library automatically via `prepare`
npm run dev          # demo site on http://localhost:3000
```

Node 18+ is required. One `npm install` is enough — the library builds itself on
install, so the demo can resolve `svg-scroll-draw` immediately.

## Layout

```
packages/svg-scroll-draw/   the library — this is what ships to npm
  src/core/                 engine, triggers, easings, env, motion
  src/<api>/                one directory per public API (reveal, pin, snap, …)
  src/<framework>/          thin wrappers (react, vue, svelte, solid, …)
  src/__tests__/            vitest, jsdom
  e2e/                      Playwright, real browsers
apps/demo/                  Next.js docs + examples site
```

## Before you open a PR

```bash
npm run verify       # typecheck + unit tests + build + size budgets + doc claims
npm run test:e2e     # Playwright across Chromium, Firefox, WebKit
```

`npm run verify` is what CI runs, minus the browser tests. Both must pass.

First e2e run needs the browsers:

```bash
npx playwright install chromium firefox webkit --prefix packages/svg-scroll-draw
```

## Things this repo is strict about

**Claims must be true.** The README once advertised "~4.4 KB gzipped" against a
real 8.9 KB, and "272 tests" against 425. Two guards now exist and CI enforces
both:

- `npm run size` measures every entry point from the built output. Budgets live in
  `packages/svg-scroll-draw/scripts/size.mjs`. If you make something bigger,
  either shrink it or raise the budget *and* update every size figure in the README.
- `npm run check:claims` derives the real test and example counts from source and
  fails when a doc disagrees. If you add tests, the count in the README, STATUS.md
  and the demo has to move with them.

**Bug fixes need a test that fails without the fix.** Not "a test that passes" — a
test you have actually watched fail against the old code. A regression test that
passes on the broken version is worse than none, because it looks like coverage.
This has already happened once here; see the `startTime = null` history in
`CHANGELOG.md`.

**jsdom cannot verify browser behaviour.** The unit tests stub `getTotalLength`,
fake `IntersectionObserver`, and run where `getBoundingClientRect()` returns
zeros. They are good for engine arithmetic and nothing else. Anything about real
layout, real scrolling, or the native CSS path belongs in `e2e/`.

**No bare `process`.** `process` does not exist in a browser without a bundler, and
a bare `process.env.NODE_ENV` guard used to throw `ReferenceError` in CDN builds.
Import `IS_DEV` or `warn` from `src/core/env.ts`. A test enforces this.

**Respect `prefers-reduced-motion`.** Anything that moves the page on its own —
animated programmatic scrolling especially — needs a reduced-motion path. The
convention is to jump to the final state rather than disable the feature. See
`src/core/motion.ts`.

## Docs to update

`CLAUDE.md` lists which files need to move together when behaviour changes:
`CHANGELOG.md`, `README.md`, `ROADMAP.md`, `STATUS.md`, and the package version.
Keeping those in sync is part of the change, not follow-up work.

## Commit messages

Conventional commits — `fix(engine):`, `feat(reveal):`, `docs:`, `test:`,
`perf(engine):`, `ci:`. For bug fixes, say what broke and how you know it is fixed;
measured numbers are better than adjectives.

## Reporting bugs instead

A reproduction is worth more than a description. A StackBlitz or a single HTML
file using the CDN build is ideal, and tells us the browser too.
