# Next Session Plan — svg-scroll-draw post-polish

> Updated: 2026-05-30 after the polish + GTM session.

---

## 0. Current state

**All tasks from the previous plan are shipped and committed.**

### What shipped in this session

- **Solid.js gallery demo** — `ExamplesPage.tsx`, reactivity graph SVG in Solid blue
- **Framework filter** — pill strip on `/examples` (All / React / Vue 3 / Svelte / Solid / Vanilla / API)
- **OG images** — `/playground` and `/changelog` now have page-specific images; `display:inline-block` Satori crash fixed on all 5 images
- **CTA bug fix** — "Read the Docs →" on `/examples` now links to `/docs`
- **README overhaul** — ToC, "Features at a glance", native CSS section elevated, all frameworks listed, `createBounce`/`createElastic` documented
- **`/blog/gsap-drawsvg-alternative`** — full SEO comparison page with code side-by-side, feature matrix, honest "when GSAP wins" section, migration guide; linked from homepage + docs
- **`createBounce` + `createElastic`** — physics easings in the library (`bounce`, `elastic` named strings + factory fns); 20 new tests (241 total); `EasingName` type updated; playground exposes both with live parameter sliders; docs page has dedicated sections

### Library version
Still `1.1.0` — these are additive changes. Consider bumping to `1.2.0` before the next npm publish.

---

## 1. Repo map (where new things live)

```
packages/svg-scroll-draw/
  src/core/utils.ts            # createBounce, createElastic added
  src/core/types.ts            # EasingName now includes 'bounce' | 'elastic'
  src/index.ts                 # both exported
  src/__tests__/utils.test.ts  # 20 new tests

apps/demo/
  src/app/blog/gsap-drawsvg-alternative/
    page.tsx                   # comparison page
    opengraph-image.tsx        # dark OG image
  src/app/playground/opengraph-image.tsx
  src/app/changelog/opengraph-image.tsx
  src/components/ExamplesPage.tsx   # Solid demo + framework filter
  src/components/SvgPlayground.tsx  # bounce/elastic in dropdown + sliders
  src/components/DocsPage.tsx       # createBounce/createElastic sections
  src/app/sitemap.ts               # /blog/gsap-drawsvg-alternative added
```

---

## 2. What you still need to do manually

- **Post `launch/devto-article.md`** to dev.to
- **Submit `launch/awesome-lists.md` PRs** — one per day, six repos
- **npm publish `1.2.0`** — bump version, then `npm publish --access public` from `packages/svg-scroll-draw`

---

## 3. Remaining code tasks (in priority order)

### TASK A — X/Twitter launch thread  ~20 min
Write an 8–10 tweet thread showcasing the library: bundle size hook, code comparison with GSAP, GIF/video of the animation, link to examples.

### TASK B — Product Hunt launch assets  ~30 min
Tagline, description (260 chars), first comment (the "maker story"), gallery images checklist, and topics list.

### TASK C — `/blog` index page  ~20 min
A simple `/blog` listing page so the comparison post is discoverable. Just a single card linking to the GSAP comparison for now, but sets up the pattern for future posts.

### TASK D — Changelog update  ~10 min
Add a `v1.2.0` entry to the changelog page covering `createBounce`, `createElastic`, Solid.js demo, framework filter, and the GSAP comparison page.

---

## 4. Guardrails

- **Don't republish npm without bumping version** — `1.1.0` is live; new features need `1.2.0`
- **Don't post to external platforms** — `launch/` files are drafts, user posts them
- **Accuracy:** ~4.4 KB, 241 tests, native CSS + JS fallback, MIT, zero deps
- TypeCheck must stay at **zero errors**
