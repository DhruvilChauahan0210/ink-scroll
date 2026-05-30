# Next Session Plan — svg-scroll-draw GTM

> Handoff for a fresh session (Claude Sonnet 4.6). Self-contained — read this top to
> bottom before starting. Companion docs: `GO-TO-MARKET.md` (strategy) and `CHANGELOG.md`.

---

## 0. Current state (as of 2026-05-30) — read first

**`svg-scroll-draw@1.1.0` is fully shipped and in sync everywhere:**
- npm `latest` = `1.1.0` ✅ · GitHub release `v1.1.0` ✅ · git tag + `main` pushed ✅
- New feature: **native CSS scroll-driven rendering** (`animation-timeline: view()`) with
  automatic fallback to the JS engine. Controlled by the new `native` option (default `true`).
- Size claims corrected repo-wide to **~4.4 KB gzipped** (was a stale "<3 KB").
- Test suite: **221 passing** (7 suites). `prefers-reduced-motion` is already handled in the engine.

**Two things that turned out to already be DONE (do not redo):**
- ✅ **Example gallery exists** — 10 polished demos in `apps/demo/src/components/ExamplesPage.tsx`
  (Logo Reveal, Revenue Chart, Signature, Checkout Flow, Delivery Route, API Architecture,
  Astro, Timeline/Group/Sequence). The GTM doc's "build a gallery" item is effectively complete.
- ✅ `prefers-reduced-motion` accessibility default (in `engine.ts`).

**So the remaining work is content + reach, not features or the gallery.**

---

## 1. Repo map (where things live)

```
packages/svg-scroll-draw/        # the library (published)
  src/core/engine.ts             # core engine + native CSS fast path (nativeEligible/buildNative)
  src/core/types.ts              # ScrollDrawOptions (incl. `native`)
  src/__tests__/                 # 7 suites, 221 tests (engine-native.test.ts is the native path)
  README.md                      # npm-facing docs (has Options table + "Native CSS rendering")
apps/demo/                       # the marketing/docs site (Next.js 16 App Router, Tailwind v4)
  src/app/page.tsx               # landing page (hero, bundle bar chart, demos)
  src/app/docs/page.tsx          # docs  → src/components/DocsPage.tsx
  src/app/examples/page.tsx      # gallery → src/components/ExamplesPage.tsx (10 demos)
  src/app/playground/page.tsx    # live SVG playground
README.md                        # repo root README (mirrors package README)
GO-TO-MARKET.md                  # strategy + native-CSS positioning
```

**Run / verify:**
- Library tests: `cd packages/svg-scroll-draw && npm test`  (expect 221 passing)
- Library build: `npm run build` in the same dir
- Demo dev server: `cd apps/demo && npm run dev`
- Demo typecheck: `cd apps/demo && npx tsc --noEmit`
  - ⚠️ **Known pre-existing error**: `MobileMenu.tsx(23,22)` `useRef()` strictness — NOT yours,
    ignore it (or fix as a freebie: give `useRef` an explicit `undefined` initial arg).

**Gotchas:** `dist/` is committed (rebuild + commit it if you change library source). Only
commit on `main` after branching if that's the preferred flow — the user has been committing directly to `main`.

---

## 2. Tasks, in priority order

### TASK A — Showcase the native CSS feature on the site  ⭐ highest leverage
**Why:** 1.1.0's headline feature has zero presence on the site, and "why not just use native
CSS?" is the #1 question a launch audience will ask. Answer it *with* a demo.

**Do:**
1. Add a **"Native CSS, with a safety net"** section to `apps/demo/src/app/page.tsx` (near the
   bundle-size bar chart) OR a dedicated block in `DocsPage.tsx`. Content:
   - One sentence: on supporting browsers the simple case runs on the compositor via
     `animation-timeline: view()` — **zero per-frame JS, no scroll/resize listeners**.
   - The fallback list (callbacks, stagger, morph, velocity, autoReverse, once, repeat, custom
     trigger, custom easing → JS engine). Copy is already written in `README.md` →
     "Native CSS rendering" section; reuse it.
   - The `native: false` escape hatch.
2. Add a tiny **live indicator** to one existing demo: detect support with
   `CSS.supports('animation-timeline: view()')` and show a badge — "running on native CSS" vs
   "running on JS engine". Great proof-of-concept screenshot for the launch.
3. Update `DocsPage.tsx` options table to include the `native` option (mirror the README).

**Acceptance:** `npm run dev`, scroll the landing page, see the native section render; badge
reflects the browser; `npx tsc --noEmit` shows no NEW errors; commit + push (Vercel auto-deploys).

---

### TASK B — SEO audit of the live docs
**Why:** Long-tail search ("animate svg on scroll react/vue/next") is the compounding
default-maker. The site is the asset; make it rank.

**Do:** Invoke the **`seo-audit` skill** against `https://svg-scroll-draw.vercel.app`
(and `/docs`, `/examples`). Then implement the high-impact, low-effort fixes it surfaces —
likely: per-page `<title>`/meta descriptions targeting the keywords, OpenGraph completeness,
structured data, heading hierarchy, internal linking, sitemap/robots.

**Acceptance:** A short list of fixes applied + a list of deferred ones. Re-run to confirm.
Target keywords to weave in: *svg draw on scroll, animate svg line on scroll react / vue / next,
stroke-dashoffset scroll animation, scroll-driven svg*.

---

### TASK C — Distribution assets (writing — Sonnet does this well)
**Why:** The library is feature-complete and shipped; nobody knows it exists. This is the
actual battle. Per `GO-TO-MARKET.md §2`, none of these are done yet.

**Do — draft each as a markdown file under a new `launch/` folder (don't post; the user posts):**
1. `launch/product-hunt.md` — tagline, description, first-comment story, the
   "40 KB GSAP → 4.4 KB + native CSS" angle, asset checklist (the demo GIF exists at repo root
   `demo.gif`).
2. `launch/devto-article.md` — "I replaced GSAP DrawSVG with 4.4 KB (and it uses native CSS
   where it can)". Technical story + the native fast-path design + benchmark framing.
3. `launch/x-thread.md` — 5–7 tweet thread, before/after, GIF, bundle bar.
4. `launch/awesome-lists.md` — the exact list of `awesome-*` repos to PR (awesome-react,
   awesome-vue, awesome-svg, awesome-animation, awesome-javascript) with the one-line entry text.

**Acceptance:** Four drafts the user can copy-paste. Keep claims accurate (4.4 KB, 221 tests,
native CSS + JS fallback, MIT, zero deps). Do NOT post anything.

---

### TASK D — (Optional polish) Svelte/Solid/Astro/Nuxt example parity
The library already ships these wrappers and an Astro example exists in the gallery. If time
remains, add one Svelte and one Vue gallery demo so non-React communities see first-class support.
Lower priority than A–C.

---

## 3. Recommended order for the session
1. **TASK A** (native showcase) — ties directly to the release, biggest credibility win.
2. **TASK B** (SEO) — compounding, mostly mechanical.
3. **TASK C** (launch drafts) — sets up the actual distribution push.
4. TASK D only if time remains.

Do A fully (code + verify + commit + push) before starting B. Keep each task's commit separate.

## 4. Guardrails
- **Accuracy over hype** — every size/test claim must match reality (4.4 KB, 221 tests). An
  inflated claim is a trust liability; that's why the size sweep happened this session.
- **Don't republish npm** unless the user explicitly bumps a version — `1.1.0` is live and final.
- **Don't post to any external platform** — draft only; the user posts.
- Verify the dev site renders (`npm run dev`) before claiming a UI task is done.
```
