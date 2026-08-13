## What this changes

<!-- One or two sentences. For a bug fix, say what was broken. -->

## Why

<!-- Link an issue, or explain the case that motivated it. -->

## Checklist

- [ ] `npm run verify` passes (typecheck, unit tests, build, size budgets, doc claims)
- [ ] `npm run test:e2e` passes (Chromium, Firefox, WebKit)
- [ ] **For a bug fix:** there is a test that I watched **fail** against the old
      code and pass with the fix. A regression test that passes on the broken
      version looks like coverage but is not.
- [ ] Browser behaviour is covered in `e2e/`, not just jsdom — the unit tests stub
      `getTotalLength` and fake `IntersectionObserver`, so they cannot verify layout
      or scrolling.
- [ ] No bare `process.*` in library source (use `IS_DEV` / `warn` from `core/env`)
- [ ] Anything that moves the page on its own honours `prefers-reduced-motion`
- [ ] Size figures in the README still match `npm run size` if bundle size moved
- [ ] `CHANGELOG.md` updated

## Measurements

<!-- For perf or size changes, before-and-after numbers rather than adjectives. -->
