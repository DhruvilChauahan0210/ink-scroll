# Changelog

All notable changes to `svg-scroll-draw` are documented here.

---

## [Unreleased]

### Site

- **Every page moves to the homepage's design, one page at a time, starting
  with `/docs`.** A shared `SiteShell` gives inner pages the homepage's frame:
  its tokens, the glass nav (solid from the start, with the current section
  underlined in red) and the same signed drawing sheet as the footer, whose
  parts list carries the site's links. Pages built on the old Tailwind palette
  re-ink through it — the old colour variables point at the new tokens, and
  the solid ink outlines become hairlines — so a page moves over without
  rewriting every utility. `/docs` gets an opening in the homepage's type (with
  the version, weight and test counts as hairline cells) beside fig. 1, one
  real `scrollDraw()` call set in type with a leader from each part to the
  section that documents it, inked by the library on load. The body reads as
  a drawing sheet: every section has a zone reference (A1 Installation, B2
  Trigger — letters skip I and O, as on drawings) in a title-block strip with
  the version that added it; the sidebar is a parts list in the page's own
  order (it was grouped by version, so the highlight leapt around while
  reading); install commands are a parts-list table; options are a spec sheet
  under a dimension line the library inks as it scrolls in, carrying the real
  count; code is a numbered listing. The sidebar keeps the current entry in
  view by moving one row at a time, and in-page links glide to their section
  with the highlight held on the clicked entry until it arrives. The old nav,
  which still said v2.10.0, is gone. The homepage's test counts
  moved to `data/facts.ts` so every page's sign-off can quote them; check:claims
  reads it.
- **Examples link to real sites built with the library.** Each example is
  becoming a complete demo site for a fictional company under
  `/showcase/<name>`, so the examples show how the library is used in a real
  product rather than in this site's own style. The example's card and its
  own page show the site's first screen edge to edge — hover dims it and
  offers "Open live site" — under one header with what the company is, its
  name and a single "Live site" button, with the code beside it. First: **Ferrow Coffee Roasters** (`/showcase/ferrow`, the
  logo-reveal example) — the emblem draws on load and `onComplete` floods it
  with the brand colours; origin drawings, farm-to-roastery routes, a roast
  profile whose milestones follow `onProgress`, and the head roaster's
  signature draw as you scroll. Second: **Ledgerline** (`/showcase/ledgerline`,
  the revenue-chart example), a subscription-analytics product — the
  dashboard's MRR lines plot on scroll with the fill and tooltip following
  `onProgress`, cohort curves fan out, a forecast draws past today with a
  widening confidence band, and three sparklines draw together. Third:
  **Quillmark** (`/showcase/quillmark`, the signature example), an
  e-signature product — the client's signature writes itself on a lease in
  one stroke as the contract comes into view and `onComplete` stamps it
  signed; the steps draw in turn and the audit trail's rail draws down the
  page. Showcase sites carry a "demo site" tab that
  links back to the example, and are kept out of search results.
- **`/examples` rebuilt as a catalogue of drawings.** The 23 previews were
  the old site — Discord blurple, pink and yellow, emoji, the Syne display
  face, and figures that had gone stale ("9 KB", "423 tests"). Every one is
  redrawn in the homepage's ink: precise strokes over a pencil underdrawing,
  one accent, mono labels with real values — a nib mark whose fill floods in
  on `onComplete`; the homepage's chart, signature, route and system diagram;
  a checkout flow; an Astro attribute diagram; the timeline's bars beside a
  ruler of each track's scroll window with a live playhead; group, sequence
  and preset plates (each preset's settings read from `PRESETS`); Vue, Svelte
  and Solid as their own component, store and signal graphs; and the
  interface demos (pricing card, counters with the real test counts and
  weight, headline, lists, cards, pinned panel, snap carousel, video scrub)
  rebuilt in hairline cells and Geist. The page is a hairline grid of plates
  — figure number, APIs, frameworks and a guide link in a caption strip, the
  drawing, then the title and a "code" drawer — instead of 23 identical
  rows. Snippets and descriptions changed with their drawings; 785 lines of
  old demo code are gone. Two stale lines in the detail copy were corrected
  (a colour shift the chart never did; the reveal entry is 4.5 KB, not 3.9).
- **`/examples` and each example's page follow.** The opening splits the
  title from the controls (framework filters as pills with their counts, and
  hairline cells for patterns, frameworks, weight and dependencies). Each of
  the 23 examples opens with a title-block strip — its number, the APIs it
  uses, its frameworks — over a numbered code listing, beside its live
  preview mounted as a captioned plate that stays pinned while you read the
  code. Previews keep their own colours on a paper or slate ground. An
  example's own page gets a breadcrumb kicker, the install command, the same
  code-and-plate row and its related examples as a parts list. The old pink
  call-to-action band and footer give way to the sign-off sheet.
- **`/guides` and each migration guide follow.** The index is a parts list of
  the four guides under hairline cells with each drop-in's measured weight
  against the library it replaces. A guide opens beside fig. 1, the swap:
  import, version, licence, gzip size and the React hook, before and after,
  from `data/competitors.ts`, with arrows the library inks on load (a value
  that does not change gets an equals sign instead of a strike-through).
  Below, numbered sections: the problems as the sheet's notes, the steps
  along a rail the library inks as you read down the procedure, what stays
  the same as a checked list, the questions numbered, and the other guides
  as a parts list — with a sticky contents list on wide screens.

---

## [2.15.1] — 2026-10-31

### Fixed

- **No more "Element has no stroke" for paths stroked from CSS.** The dev
  check read only the `stroke` attribute, so every path styled with a class,
  a stylesheet or Tailwind's `stroke-current` was reported as invisible while
  it drew perfectly well — on this project's own homepage that was hundreds of
  warnings per page load. It now reads the computed stroke (which folds in CSS
  and presentation attributes) and falls back to the attribute only where
  there is no style engine. A stroke CSS turns off (`stroke: none` over a
  `stroke` attribute) is now reported, and a `fill` attribute that CSS turns
  off no longer is. The check is skipped outright in production builds.

### Tests

- Three unit tests: a stroke from a CSS class does not warn, CSS
  `stroke: none` over an attribute does, and a `fill` attribute that CSS turns
  off does not.
- `e2e/cdn.spec.ts`: the dev-build fixture's "mistake" path used to be stroked
  from CSS and relied on the false warning; it now has no stroke at all, and
  two new paths, stroked from a stylesheet and from an attribute, must stay
  silent in Chromium, Firefox and WebKit.

### Site

- **The live project stats can't go quietly stale.** A failed hourly refresh
  keeps serving the last good response, which is how the GitHub numbers sat
  at an August copy (5 stars, "2mo ago") on a network that intercepts TLS.
  The chapter now prints when its numbers were fetched (the oldest `Date`
  header among the four responses), and `GITHUB_TOKEN`, when set, lifts
  GitHub's 60-an-hour anonymous limit that shared build and function IPs
  can hit.
- **Vercel builds no longer run out of memory.** `tsup` builds all ~33
  configs at once, each with its own TypeScript program for `dts`; that
  peaks around 4 GB in one process and the Vercel build container killed it
  (exit 137, OOM) on the homepage deploy. `vercel-build` now builds the
  library with `scripts/build-lowmem.mjs` — the same `tsup.config.ts`, four
  configs at a time — which peaks around 1.2 GB and produces byte-for-byte
  identical `dist/` (114 files, checked by hash). Releases still use plain
  `tsup`.
- **Homepage redesign — every line is a real use case.** A new `/` where
  nothing is decoration: each drawing is something people build with the
  library, inked by the library over a faint pencil underdrawing, annotated
  like a blueprint with real values. The hero is chapter 00: an exploded technical
  drawing of a fountain pen — nib, feed, section, converter, barrel, cap —
  inked by the library on load with labels that map each part to the
  library (the nib is `scrollDraw()`, the converter holds 10.2 KB of ink),
  then, pinned, the parts slide home along their assembly guides into one
  pen as you scroll. Then:
  01 a gallery that draws a signature, a route map, a chart, a product
  sketch, a logo and a system diagram as each tile arrives; 02 a pinned
  watchmaker's drawing of a mechanical movement inked stroke by stroke;
  03 a printer's proof sheet — crop marks, ruler, registration targets —
  marked up in editor's red pen as you read; 04 GSAP vs svg-scroll-draw on a
  precision balance that tips as the weights land (47.5 KB of GSAP +
  ScrollTrigger + DrawSVG against 10.2 KB), beside the same effect written
  both ways (17 lines vs 7); 05 the eight APIs as blueprint plates on a
  pinned sideways rail (a pen nib, a keyframe track, an exploded word, a
  pushpin, parallax planes, a film strip, an odometer, snap slots), each
  inked as it crosses the centre; 06 an instrument panel — Chromium, Firefox
  and WebKit gauges sweeping to 195, an odometer counting the unit tests, a
  size meter settling under its red CI budget line; 07 a circuit board that
  wires the core to every framework entry, with framework tabs that light
  their trace; 08 before / after, said literally: two browser windows side
  by side whose only difference is the import line — the same page, the same
  markup (`data-aos="fade-up"`), the same entrance playing in both — with
  each file's weight underneath; tabs for AOS, ScrollReveal and vivus;
  09 the project counted live — GitHub stars, forks, open issues and last
  commit, npm downloads a week and a month, and the last 30 days of npm
  downloads as a line the library inks as you scroll, with its peak marked —
  refreshed hourly and stamped with when the numbers were fetched;
  and a sign-off that is an engineering drawing
  sheet: zone borders, the hand-lettered *draw* again, and a title block
  carrying the version, weight, tests and links. Every figure comes from
  `data/competitors.ts` or the page's claim-checked constants. Geist
  throughout, ink on near-black or ink on paper, one accent (editor's red).
  The nav is transparent over the hero; once the page moves, a frosted
  glass bar fades in behind it — same size and positions, nothing moves —
  with the mark drawn by the library on load, a version tag, an icon theme
  toggle, and below 1024px a full-screen menu in the page's own type that
  holds the page still while open. Lenis smooth scroll (demo-only
  dependency), re-measured whenever the page grows so it always reaches
  the end. Styles scoped under `.home`; each
  chapter carries its own scoped CSS and deterministic geometry. The mascot
  stays off `/`. The examples count reads `EXAMPLE_COUNT`.
- **Dark is the site default.** With no stored preference the no-flash
  script now adds `.dark`; a stored `light` is the only thing that keeps it
  off. Every page already had the dark theme — this only changes the first
  impression.
- **Migration guides** at `/guides`: AOS in Next.js, AOS in React, ScrollReveal
  in React and Next.js, vivus in React — the searches those libraries' users
  make. Each leads with `npx svg-scroll-draw migrate`, the hook, the StackBlitz
  starter and what stays the same, with HowTo and FAQ structured data. Data
  lives in `data/guides.ts`; every claim about the original library is checked
  against its last release (for example, AOS 2.3.4 does pick up new elements
  through its own MutationObserver, so the guides do not claim otherwise —
  its problem in React is that init() can't be undone). Linked from the home
  and mobile nav, `/vs-aos`, `/vs-vivus` (comparison pages can now carry a
  `guide` link), the READMEs and llms.txt; in the sitemap.

---

## [2.15.0] — 2026-10-31

### Added

- **React and Next.js hooks for the drop-ins**, as their own entries so nobody
  pays for the ones they do not use, each built with a leading `"use client"`:
  - `svg-scroll-draw/aos/react` — `useAOS(options, refreshKey?)` and
    `<AOSInit />`. Initialises on mount and destroys on unmount (AOS has no
    destroy, which is why StrictMode and route changes trip hand-written
    effects); `refreshKey` re-measures; new `[data-aos]` content from a route
    change is picked up by the drop-in's MutationObserver. 3.1 KB.
  - `svg-scroll-draw/scrollreveal/react` — `useScrollReveal(options)` returns
    a ref and reveals that element, or its `selector` children for `interval`
    sequences, cleaning up on unmount. 4.6 KB.
  - `svg-scroll-draw/vivus/react` — `useVivus(options, callback)` returns
    `[ref, vivus]` and destroys the instance on unmount. 4.0 KB.
- tsup's Rollup pass strips module directives, so these three entries build
  with `treeshake: false` (esbuild still drops unused code) to keep
  `"use client"`. `size.mjs` now measures nested entries such as `aos/react`.

### Tests

- `e2e/dropins-react.spec.ts`: a React 18 app in StrictMode with a state-driven
  route change, in Chromium, Firefox and WebKit — one AOS stylesheet after the
  double mount, unique ScrollReveal ids, one vivus callback, page A cleaned up
  and page B's `[data-aos]` picked up, a clean re-init on the way back, and
  `<AOSInit>` unmounting removes AOS; no page or console errors. Dropping
  `useAOS`'s cleanup fails it. Checked separately in a real Next.js 16 App
  Router app: `<AOSInit />` in a Server Component layout builds and runs, and
  both hooks work, with no errors.

### Site and examples

- `examples/aos`, `examples/scrollreveal` and `examples/vivus`: pages written
  for the original library with only the import changed, opening on StackBlitz
  with no install. Linked from `/vs-aos` (both drop-in sections), `/vs-vivus`
  (a new optional `tryUrl` on comparison pages), each README drop-in section and
  `examples/README.md`. Each was installed from npm, built and scrolled in
  Chromium: every AOS element animated, every ScrollReveal element revealed,
  every vivus path drawn, no errors.

---

## [2.14.0] — 2026-10-31

### Added

- **`npx svg-scroll-draw migrate`** switches a project from AOS, ScrollReveal or
  vivus to the drop-ins in one command: `import` / `require` / dynamic
  `import()` of `aos`, `scrollreveal` and `vivus` point at the matching entry
  (with `.default` on CommonJS requires of the latter two), CDN `<script>` tags
  from unpkg, jsDelivr, cdnjs or node_modules point at the script-tag builds
  (a stale `integrity` hash is removed), AOS's `aos.css` imports, `<link>`s and
  `@import`s are removed, and `package.json` swaps the dependencies (keeping its
  indentation). It touches module names, URLs and dependency entries only,
  skips `node_modules` and build output, previews with `--dry-run`, and will not
  write over uncommitted git changes without `--force`. Checked end to end: a
  Vite app on `aos` and one on `scrollreveal` + `vivus` install and build after
  migrating, and a CDN page loads all three drop-ins with no errors.
- `npx svg-scroll-draw help`; an unknown command now says so instead of
  starting `init`.

### Tests

- The AOS and ScrollReveal parity specs wait for the reference library and the
  drop-in to agree at each scroll stop (up to 2 s, via `converge()` in
  `e2e/helpers.ts`) instead of reading both after one fixed wait. AOS updates
  on a setTimeout throttle and the drop-in on requestAnimationFrame, so on a
  slow runner one could still be a frame behind: CI's WebKit run on the 2.13.0
  commit failed twice at different elements and offsets, while the release run
  on the same commit passed. A real difference never converges — breaking the
  AOS anchor-placement offset rule still fails at the exact element and offset —
  and 45 WebKit repeats pass under CPU load.

---

## [2.13.0] — 2026-10-31

### Added

- **`svg-scroll-draw/vivus` — a drop-in replacement for vivus 0.4.** vivus has
  not shipped since 0.4.6 (April 2021). `new Vivus(element, options, callback)`
  and every method, option, animation type (delayed, sync, async, nsync,
  oneByOne, scenario, scenario-sync), start mode, `file` / `<object>` loading,
  scenario `data-*` attribute and timing function behave as in 0.4.6. Shapes
  become `<path>`s with the same `d` strings and dashes get the same values,
  including vivus's quirks (`delayUnit` spreads over every `<path>`, ignored
  ones too). `dist/cdn/vivus.global.js` defines `window.Vivus`. 3.9 KB gzipped
  (vivus 0.4.6: 4.1 KB). Under reduced motion `play()` jumps to the exact end
  frame and still fires its callbacks. Its two console warnings are development-only,
  through the same `warn()` as the rest of the library.
- `/vs-vivus` comparison page. Competitor entries can now carry their own
  `measuredOn` date, so a figure measured later than the shared date says so.

### Tests

- `e2e/vivus.spec.ts` runs vivus 0.4.6 beside the drop-in in Chromium, Firefox
  and WebKit across nine configurations and requires the SVG markup — every
  generated path and dash value — to match exactly at eleven points of the
  animation, plus vivus's frame maths, `play()` both ways with the same
  callbacks, `inViewport` starts, `destroy()` and the script-tag build. vivus
  is a devDependency copied into the gitignored fixtures/build. Spreading the
  delay over drawn paths only fails it on `delayUnit`. 13 unit tests and the
  SSR import cover the rest.

### CI

- `npm run verify` (which the release workflow runs) and `ci.yml` now build
  the library before typechecking the demo. The demo resolves svg-scroll-draw
  through `dist/`, so it was being checked against whatever an earlier build
  left there; the first 2.13.0 release run failed its demo typecheck that way,
  on a commit that passed CI, a fresh-clone typecheck and the local production
  build, and nothing was published.

---

## [2.12.0] — 2026-10-31

### Added

- **`svg-scroll-draw/scrollreveal` — a drop-in replacement for ScrollReveal.js 4,
  under MIT.** ScrollReveal is GPL-3.0 (paid licence for commercial use) and has
  not shipped since 4.0.9. This is an independent implementation of its API —
  `ScrollReveal(options)` (with or without `new`, a singleton that merges later
  options), `reveal` / `clean` / `sync` / `destroy`, every option including
  `interval` sequences, `reset`, `useDelay`, `viewFactor` / `viewOffset`, custom
  containers, `mobile` / `desktop`, `cleanup` and the four callbacks — writing
  the same inline styles (`visibility`, `opacity`, `matrix3d()`, `transition`),
  `data-sr-id` and `sr` class. ScrollReveal's quirks are kept where output
  depends on them, e.g. a distance is read to one decimal place (`12.25px` →
  12.2). `dist/cdn/scrollreveal.global.js` defines `window.ScrollReveal` as the
  function. 4.5 KB gzipped (ScrollReveal 4.0.9: 5.6 KB).
- Deliberate differences: nothing runs on import (ScrollReveal mounts when its
  script loads; this mounts on the first call); reduced motion shows the final
  state with no transition.

### Tests

- **The idle-cost browser test counts work instead of timing it.** It asserted
  cumulative callback milliseconds against a 6 ms ceiling, sampled while other
  browsers ran the rest of the suite, and flaked in Firefox under load (6–8 ms,
  locally and once in the 2.11.0 release run) with nothing regressed — it needed
  two retries to stay green. The fixture now counts update-body runs through
  `onProgress`: parked for a second, at most one per instance; scrolling, at
  least half the frames. With the idle short-circuit removed it reads 480 body
  runs against a limit of 8 in all three engines (the old timing assertion
  caught that in Chromium by 0.1 ms). The retries are gone; 10 repeats per
  engine pass with none while the full suite runs alongside.
- `e2e/scrollreveal.spec.ts` runs ScrollReveal 4.0.9 beside the drop-in on one
  page in Chromium, Firefox and WebKit, down the page and back, and requires
  every element's `style` attribute, `data-sr-id` and callback history to match
  exactly. ScrollReveal is GPL-3.0, so it is a devDependency copied into the
  gitignored `e2e/fixtures/build/` at test time, never committed. Breaking the
  one-decimal distance parse fails it at the exact element and value. 17 unit
  tests cover the API around it; the SSR suite imports it with no DOM.

---

## [2.11.0] — 2026-10-30

### Added

- **`svg-scroll-draw/aos` — a drop-in replacement for AOS.** `import AOS from
  'svg-scroll-draw/aos'` (or `dist/cdn/aos.global.js`, which defines `window.AOS`)
  runs existing `data-aos` markup with no `aos.css`: `init`, `refresh`,
  `refreshHard`, every `data-aos-*` attribute, the `aos-init` / `aos-animate`
  classes and the stylesheet's transforms and end states, matched rule for rule
  against AOS 2.3.4. AOS 3's `mirror`, `anchorPlacement`, class-name options and
  `aos:in` / `aos:out` events are supported as well. 3.0 KB gzipped with its
  styles (AOS 2.3.4 is 6.7 KB with its stylesheet).
- Deliberate differences: reduced motion shows the final state; `disable:
  'mobile'` etc. check viewport width; positions re-measure on `load`;
  `destroy()` for single-page apps.

### Site

- `/vs-aos` leads with "Switch from AOS in one line". Code cards there now fill
  their height (shorter cards in a row showed a white strip).

### Tests

- `e2e/aos.spec.ts` runs AOS 2.3.4 (vendored in `e2e/fixtures/vendor`, MIT) and
  the drop-in side by side on the same markup, in Chromium, Firefox and WebKit:
  the animated set must match at every scroll stop down and back up, across three
  `init()` configurations, and settled opacity / transform / visibility must
  match. Breaking AOS's anchor-placement offset rule fails it at the exact
  elements and offsets affected. 25 unit tests cover options, events, lifecycle
  and SSR.

---

## [2.10.2] — 2026-10-30

### Added

- **Copy-paste blocks** at `/blocks`: signature draw, reveal cards, stat counter
  row, sticky feature, headline text reveal. Each is one React + Tailwind file and
  installs with `npx shadcn@latest add https://svg-scroll-draw.vercel.app/r/<name>.json`.
  `apps/demo/scripts/build-registry.mjs` writes the registry; the demo build fails
  if it is stale.
- **Agent skill** in `skills/svg-scroll-draw/` (SKILL.md plus API, recipes and
  GSAP-migration references), linked from both READMEs and `llms.txt`.
  `check-claims` scans it.

### Site

- Every page title is 60 characters or fewer and names the brand once. The
  homepage targets "SVG scroll animation"; `/vs-gsap` leads with a comparison table
  read from `competitors.ts`; `/react-scroll-animation` and
  `/nextjs-scroll-animation` get a copy-paste snippet in the hero.
- `/react-scroll-animation` listed a `useScrollDraw` React hook that does not
  exist; `/nextjs-scroll-animation` said GSAP was "~50 KB, 5×" (45.3 KB, 4.4×).
- The 2025 scroll-animation guide moved to `…-2026`, with a 308 redirect.

### Fixed

- **TypeScript resolved the wrong types for ESM users.** Every export pointed
  `types` at the CommonJS `.d.ts`, so under `moduleResolution: node16`/`nodenext`
  an `import` was typed as CommonJS ("masquerading as CJS" in
  `@arethetypeswrong/cli`), and under `node10` no subpath (`/react`, `/vue`, …)
  resolved types at all. Each export now has `import` → `.d.mts` and `require` →
  `.d.ts`, `typesVersions` covers `node10`, and `./package.json` is exported.
  `attw` reports no problems.
- **`scrollVideo` re-seeked the video on every frame while it was visible.**
  Each write to `currentTime` starts a seek, even to the value it already has, and
  the update loop wrote it every animation frame — so a page at rest kept the
  decoder seeking about 60 times a second. In Firefox `seeking` never settled,
  which is what failed the CI paint test. It now seeks only when the target time
  changes; `onProgress` and `--scroll-draw-progress` still update every frame, and
  `seek()` / `replay()` always seek.
- **`scrollPin` missed the pinned element growing.** Its ResizeObserver watched
  the wrapper and the document, but `measure()` fixes the wrapper's height, so a
  taller element changed neither and the pin zone kept its old height. The
  element itself is now observed. The e2e test only passed because an observer
  always fires once after `observe()`; it now waits that out, and fails against
  the old build in all three engines.
- **`<scroll-draw once>` was ignored.** The README's CDN example used it, but the
  element never read the attribute. It now does, and `once="false"` reads as off.
- The root README showed `useScrollDraw` imported from `svg-scroll-draw/react`,
  which does not exist there; it now points to `useScrollDrawProgress`.
- The `bin` path no longer needs npm's auto-correction on publish.

### Tests

- New `firefox-native` e2e project: Playwright still bundles Firefox 153, so it
  enables Gecko's `layout.css.scroll-driven-animations.enabled` pref and runs both
  native-vs-JS parity suites. It fails if the fast path does not engage, so it
  cannot pass by comparing the JS engine with itself.

### CI

- `release.yml` can create the GitHub release (`contents: write`). 2.10.1
  published to npm and then stopped with a 403 at that step.

---

## [2.10.1] — 2026-10-30

The trust release. No API changes. It fixes a devtools bug that hid every
instance, and the numbers the npm page and the site had wrong.

### Fixed

- **`devtools` showed "No active instances" for code imported from another
  entry.** Each built entry carried its own copy of the instance registry, so
  `scrollAnimate` from the main entry and `devtools` from `svg-scroll-draw/devtools`
  never saw each other. The registry now lives on `globalThis` under
  `Symbol.for('svg-scroll-draw.registry')`, created on first use (nothing runs on
  import, so SSR is unaffected).
- **`scrollDraw` never registered with devtools at all**, on any of its three
  paths (native CSS, autoplay, JS). Neither did `scrollAnimate`'s native path,
  `scrollSnap`, `scrollDrawTimeline` or `Cinematic`. All do now, and unregister
  on `destroy()`.

### Docs and claims

- The npm README said GSAP SplitText needs a paid subscription, that SplitText
  adds ~18 KB (gsap 3.15.0 SplitText is 3.6 KB), that we cover "95% of
  ScrollTrigger use cases" (never measured), and listed the native fast path as
  Safari 18+ / Firefox 110+. All corrected: Safari 26+, and Firefox 159+, which
  turned scroll-driven animations on by default on 27 Oct 2026.
- "9× smaller than GSAP" removed everywhere. Measured: 4.4× against core +
  ScrollTrigger (45.3 KB), 4.7× against core + ScrollTrigger + DrawSVG (47.5 KB).
- Per-entry sizes on the site and READMEs updated to the built output.
- `check-claims` now reads the npm README, the whole demo source, `llms.txt` and
  the launch drafts; checks every per-API size against its built entry; and fails
  on the specific false claims above if they come back.
- npm README: demo GIF, StackBlitz links, and 17 more search keywords.

### Added

- `examples/vanilla` and `examples/react`: two starters that open on StackBlitz
  with no install and use the published package.

### Size

The registry cost is 0.05–0.16 KB per entry: main 10.0 → 10.2 KB. Budgets for
`web-component` (6.5 → 6.8) and `snap` (1.6 → 1.9) were raised to fit it.

---

## [2.10.0] — 2026-08-14

The correctness release. Every entry point in the library, including all eight
framework wrappers, now has real-browser coverage; almost everything below was
found by writing that coverage rather than by a bug report.

### Fixed

- **The CDN bundle dropped the `<scroll-draw>` web component** — caught before
  release, so no published version was affected. The `sideEffects` field added
  during this cycle listed only the built output (`./dist/web-component/*`), but
  the bundle is built from `src/`, so the bare `import './web-component'` in the
  CDN entry was tree-shaken away as side-effect-free. Verified against the
  published 2.9.0 tarball, which registers the element correctly: this was a
  regression introduced by the tree-shaking work and found by the new CDN spec,
  not something users ever downloaded.
- **Importing `svg-scroll-draw/web-component` on a server threw.**
  `class ScrollDrawElement extends HTMLElement` was evaluated at module scope, and
  `HTMLElement` does not exist on a server, so an SSR render died with
  `ReferenceError: HTMLElement is not defined` instead of degrading. The class now
  lives inside the same guard as the registration.
- **Any re-measure while scrolled shifted the trigger window for
  `scrollContainer` callers.** The element's offset inside a scroll container
  already includes the scroll position, and `computeTriggers` added it again — so
  a resize, an orientation change or a `refresh()` mid-scroll moved the window by
  however far the user had scrolled. Measured: a `scrollHorizontal` strip scrubbed
  halfway snapped back to its first panel with no scrolling at all. Three engines
  each had their own copy of the arithmetic and therefore three copies of the
  defect; it now lives once, in `core/utils`.
- **`scrollHorizontal`'s default `distance` ignored `scrollContainer`**,
  subtracting `window.innerWidth` regardless. Inside a container narrower than the
  viewport that overshoots — the strip runs past the last panel and parks on empty
  space — and every nested-container caller had to pass `distance` by hand, which
  is not what the option's documented default says.
- **`split: 'lines'` threw away the spaces between words.** `scrollText` groups
  word spans by `offsetTop` and moved only the words, leaving behind the
  whitespace spans the splitter emits to hold the gaps open, then cleared the
  element — so "Every word here" rendered as "Everywordhere". Invisible to the
  unit suite: in jsdom every `offsetTop` is 0, so there is one line and no gaps to
  lose.
- **`scrollDrawTimeline.destroy()` left the paths frozen on their last frame** —
  and, with `fade`, half-transparent — for the rest of the page's life. It was the
  last module that did not restore what it wrote.
- **Both native CSS fast paths ran a different easing curve from the JS engine
  they replace.** `ease-in` and `ease-out` here are quadratics (`t²` and
  `t(2-t)`); the engines handed CSS the *keyword* of the same name, which is a
  fixed cubic-bézier — `ease-out` is `cubic-bezier(0, 0, 0.58, 1)`. The two differ
  by up to **0.069**, close to 7 points of progress mid-scroll. Because the fast
  path only engages where the browser supports `animation-timeline: view()`, the
  same page animated one way in Chrome and Firefox and a measurably different way
  in Safari, which always falls back to the JS engine. `scrollAnimate` defaults to
  `ease-out`, so this was the default configuration rather than an exotic one.
  The new `core/css-easing` module emits timing functions that reproduce the JS
  curves: exact cubic-béziers for `ease-in` / `ease-out` (error 3e-7) and a sampled
  `linear()` for `ease-in-out`, which no single cubic-bézier can express (error
  5e-4). An easing with no CSS equivalent now declines the fast path rather than
  substituting a curve the caller did not ask for. Affects `scrollDraw` and
  `scrollAnimate`, and therefore `scrollReveal` and the group APIs built on them.
  The existing parity suite could not have caught it — `scrollDraw` defaults to
  `linear`, so every comparison it made was on the one curve where CSS and JS
  agree. Both parity fixtures now carry a non-linear pair.
- **A finished `scrollDrawSequence` / `scrollAnimateSequence` reported 0%
  progress.** When the last step completed, the internal cursor advanced past the
  end of the instance array — so `getProgress()` read from `undefined` and returned
  0 at the exact moment everything had finished, and `pause()`, `resume()` and
  `seek()` became silent no-ops for the rest of the page's life. The cursor is now
  clamped to the last step.
- **`scrollHorizontal` never moved the track, in its own documented setup.** The
  default trigger window (`top top` → `bottom bottom`) was measured against the
  track, and a `position: sticky` stage pins the track at exactly one viewport
  tall — so both ends resolved to the same scroll position. A zero-length window
  clamps progress at 0 forever: the API was inert in the exact CSS arrangement its
  own JSDoc prescribes. It had 100% line coverage in jsdom, where every rect is 0
  and the window is equally degenerate, which is indistinguishable from working.
  The trigger is now measured from the element that actually holds the scroll room
  — the container of the nearest sticky ancestor — overridable with the new
  `triggerElement` option, and falling back to the previous behaviour when there is
  no sticky ancestor.
- **A zero-length trigger window is now a development warning** rather than a
  silently inert element. This defect is invisible: everything looks configured and
  nothing ever moves.

- **`destroy()` left the last animated frame's inline styles on the element.**
  `createAnimateEngine` writes `opacity` / `transform` (and
  `--scroll-draw-progress`) inline every frame and removed none of them on
  teardown, so destroying anything mid-animation froze it there permanently — a
  card destroyed at 34% stayed at `opacity: 0.34; translateY(21px)` for the rest
  of the page's life, which is worse than never having animated it. It also made
  `scrollReveal`'s documented "restore original styles" untrue. The engine now
  captures the element's inline values before its first write and restores them on
  `destroy()`, on both the native and JS paths and under reduced motion. Affects
  `scrollReveal`, `scrollAnimate` and `scrollParallax`.
- **`scrollSnap` fired `onSnap` twice for a single snap.** The scroll event
  produced by its *own* animated scroll was treated as a fresh user gesture, and
  the resulting `snapTo(currentIndex)` took the "already there" early return —
  firing the callback again. Guaranteed under reduced motion, where one instant
  jump emits one unmistakable scroll event; intermittent otherwise, since a snap
  whose final frame lands where it already was emits no trailing event at all. A
  public callback that fires once or twice depending on the easing curve is worse
  than either. The scroll handler now ignores a position already parked on the
  current section.

### Removed

- Dead initial write in `scrollCounter`: `el.textContent = fmt(from)` ran a few
  lines before `applyAlpha(initAlpha)` overwrote it in the same task, so no frame
  could ever show it. The surviving write is the correct one — it renders the value
  for the current scroll position, which for an element already scrolled past is
  its final value rather than `from`.

### Fixed (earlier in this cycle)

- **The native CSS fast path did not match the JS engine.** `buildNative()` put
  `animation-timeline: view()` on each `<path>`, making every path its own timeline
  subject. A path's bounding box is almost never its container's box, so the two
  engines measured different scroll ranges and drew different amounts at the same
  offset — up to 0.063 apart in Chromium and 0.114 in WebKit, with multi-path SVGs
  drifting from each other as well. The timeline is now a named `view-timeline`
  declared on the container, which reproduces the JS trigger window exactly
  (0.0000 divergence at every sampled offset). This was the library's headline
  claim and nothing had ever verified it.
- **`ReferenceError: process is not defined` in any browser without a bundler.**
  Every dev warning was guarded by a bare `process.env.NODE_ENV` check. Reaching
  one threw instead of logging — which broke the advertised CDN / `<script type=
  "module">` usage. Repro: style a path's stroke with CSS rather than a `stroke`
  attribute, and the engine's "no stroke" warning took the whole call down. All 13
  affected modules now use a guarded `IS_DEV` from `core/env.ts`, enforced by a test.
- **`scrollSnap` ignored `prefers-reduced-motion`.** It animates
  `window.scrollTo` over a duration, taking over the user's scrolling, with no
  check at all. It now jumps straight to the target section when reduced motion is
  requested; snapping still happens, only the animated scroll is dropped.
- **The reduced-motion preference was read once at construction**, so toggling the
  OS setting did nothing until a reload. Now tracked live via
  `core/motion.ts`, with the listener removed on `destroy()`.
- **`morphTo` produced silently wrong shapes.** Interpolation pairs coordinates
  positionally, so mismatched command sequences never reach the target —
  `'M10 10 L90 90'` → `'M10 10 C20 20, 40 40, 90 90'` ends at `'M10 10 L20 20'`.
  Now warns in development on a command or coordinate-count mismatch, and on
  `morphTo` applied to a non-`<path>` element.
- **The debug overlay leaked a scroll listener.** `destroy()` removed the node but
  not the listener, and `cacheTriggers()` rebuilt the overlay on every resize, so
  listeners accumulated while detached nodes stayed reachable.
- **A single `rafId` was written from two places** — the IntersectionObserver
  callback and the tail of `update()`. If the observer scheduled a frame while one
  was pending, the older handle was lost and that loop became unstoppable, immune
  to `pause()` and `destroy()`.

- **`autoplay` animations could complete invisibly.** Leaving the viewport assigned
  `startTime = null`. Since `null` coerces to `0`, a later `pause()` recorded the
  whole timestamp since page load as `pausedElapsed` instead of an elapsed duration,
  and `resume()` then began a run already "elapsed" far past its own duration — so
  the draw finished instantly while still off-screen. Scrolling down revealed a
  static, already-drawn SVG. Replaced with an explicit run-state flag.
- **`getProgress()` always returned `0`** for `autoplay` stroke animations —
  `currentAlpha` was only ever set on the clip-path branch.
- **`replay()` reported the previous run's progress** until the next frame landed.
- **`npx svg-scroll-draw init` generated invalid SVG for Vue and Svelte.** The
  templates emitted JSX-style `strokeWidth` / `strokeLinecap`, which HTML-parsed
  templates discard — the starter example rendered with a 1px butt-capped stroke
  instead of the intended 2.5px round one.
- **`init` prompted for a CSS selector it then ignored** for React, Vue, Svelte and
  Solid. It now asks only for the vanilla target, the only one that uses it.
- Importing the CLI module no longer seizes `stdin`; the readline interface is now
  created inside `main()`.

### Performance

- **The JS engine no longer recomputes while the page is still.** The rAF loop ran
  every frame for as long as the container was in view, whether or not the scroll
  position had moved: 8 instances parked in a viewport cost 488 frames and 6.4 ms
  of JavaScript per second in Chromium. `update()` now short-circuits when the
  scroll position is unchanged and nothing has invalidated the frame. Measured
  idle vs actively-scrolling afterwards — Chromium 2.8 ms vs 20 ms, Firefox 3.0 vs
  51, WebKit 2.0 vs 83. This is the path Firefox and every pre-115 browser always
  take.

### Added

- **Playwright test suite across Chromium, Firefox and WebKit** (`npm run test:e2e`),
  run in CI. The 488 unit tests run in jsdom with `getTotalLength` stubbed and
  `IntersectionObserver` faked, so they verify engine arithmetic and nothing about
  browser behaviour. Now 118 browser tests per engine (354 runs) covering
  native-vs-JS parity, idle cost, and `scrollReveal`, `scrollPin`, `scrollSnap`,
  `scrollText`, `scrollCounter`, `scrollProgress`, `scrollParallax`, `scrollVideo`
  and `scrollHorizontal`. Notable: reduced motion is exercised through Playwright's real
  media emulation rather than a stubbed `matchMedia`; `scrollProgress` is checked
  by driving real `calc()` widths off its custom properties, not by reading the
  value back in JS; and `scrollVideo` verifies the *painted* frame against
  `currentTime` via a canvas readback, so a scrub that sets the property without
  repainting cannot pass.
- **`refresh()` on `scrollDraw`, `scrollDrawTimeline` and the group APIs.**
  Re-measures path lengths and the trigger window after a layout change that fires
  no resize — a tab switching, a sibling collapsing, a font swapping inside a
  fixed-height box. `scrollPin` and `scrollHorizontal` already had it. Implemented
  on both engine paths: the JS path rewrites `stroke-dasharray`, the native path
  also rewrites the `--ssd-len` custom property its keyframes interpolate from.
- **`respectReducedMotion` on `scrollDrawTimeline`** (default `true`), covering
  the time-driven `loop` only. The two halves of that API deserve different
  answers: scroll scrubbing advances 1:1 with the user's own input and keeps
  working, while `loop` replays the whole timeline off `performance.now()` with no
  scroll input at all — autonomous motion by any definition, and it had no check
  whatsoever. Tracked live, so toggling the OS setting takes effect without a
  reload.
- **A development CDN build — `dist/cdn/svg-scroll-draw.dev.global.js`.** `IS_DEV`
  is derived from `process.env.NODE_ENV`, and `process` does not exist in a
  browser without a bundler, so every warning this library has was unreachable for
  exactly the users with the fewest other diagnostics — including the zero-length
  trigger window that would have caught the `scrollHorizontal` defect. The
  production CDN build now defines the same flag to `false`, so those warnings are
  dropped at build time instead of shipped and skipped, and it has a size budget
  for the first time.
- **Browser coverage for all eight framework wrappers** — React, Vue, Solid,
  Svelte, Angular, Astro, Nuxt and the web component — closing Phase 2 Priority 2.
  Roughly a thousand lines that had been excluded from coverage because jsdom
  cannot mount them. Every wrapper is mounted for real and held to one contract by
  one parameterised spec: the engine runs, unmounting stops it (no leaked
  observer, no leaked frame loop), mounting again works, and option changes reach
  the engine only where the wrapper says they do. React, Vue, Solid and Nuxt are
  bundled from `dist/` by `e2e/build-fixtures.mjs`; the other four need nothing,
  because Svelte's wrappers are plain action functions, Angular's are
  framework-agnostic classes, Astro's are DOM scanners and the web component is a
  custom element.
- **An SSR suite that runs with no DOM at all** (`src/__tests__/ssr.test.ts`),
  covering every entry point: importing must not throw, and every public API must
  return an inert instance whose methods are safe to call. It found the two SSR
  defects above. Astro's auto-init helpers also defaulted their root to `document`
  at call time, so calling one from component frontmatter — on the server, which
  is Astro's default — threw rather than doing nothing; they now return `[]`.
- **Browser coverage for the last untested modules**, closing Phase 2 Priority 1:
  `animate-parity` (`scrollAnimate`'s own native fast path against the JS engine
  across all four named easings, plus its eligibility gate: ten configurations CSS
  cannot express, each required to decline, and a control required to accept),
  `group` (`scrollDrawGroup`, `scrollDrawSequence`, `scrollAnimateGroup`,
  `scrollAnimateSequence`, `scrollParallaxGroup`), `timeline` and `cinematic`. That
  takes the browser suite from 76 to 118 tests per engine, 354 runs across the
  three. `group` was the weakest module in the library at 50% lines, and the jsdom
  half of that measured little: `scrollParallaxGroup`'s contract is travel =
  speed × the element's own height, exercised there against a height of 0.
  - Fan-out is the shared failure mode of every entry point in `group`, so
    `seek()`, `destroy()` and the sequence gate are each asserted against every
    member rather than against the group's own report of itself.
  - Pinned as a real cross-browser difference rather than asserted away: past the
    end of a `view()` range, Chromium and WebKit hold the animation's end state
    while Firefox treats the inactive timeline as unresolved and holds the *start*
    state. The test asserts the property that makes it harmless — the element is
    off-screen wherever the engines differ, and recovers on re-entry — instead of
    hard-coding a browser name.
- **`scripts/mutation-check.mjs`** — patches one line of source per run, rebuilds,
  and requires the single test named for that behaviour to fail. 41 mutations, all
  caught. `CONTRIBUTING.md` requires new tests to be watched failing against a
  broken build; this makes that a command instead of a claim that decays.
- **`scripts/make-fixture-video.mjs`** — regenerates `e2e/fixtures/clip.webm`, the
  4-second scrub target (one solid grey per frame, every frame a keyframe, so a
  painted pixel identifies the decoded frame). Uses Playwright's own browser and
  bundled ffmpeg, so it needs no system tooling.
- `respectReducedMotion` option on `scrollSnap` (default `true`).
- `respectReducedMotion` option on `scrollAnimate` (default `true`) and on
  `scrollHorizontal` (default **`false`**). Horizontal scrubbing opts out
  deliberately: the transform advances only as the user scrolls, 1:1 with their
  input, so it is direct manipulation rather than autonomous motion — and applying
  a final state instead leaves every panel but the last unreachable inside the
  sticky `overflow: hidden` container, hiding the content from exactly the people
  who asked for less motion.
- `triggerElement` option on `scrollHorizontal` (and on `scrollAnimate`, for the
  same purpose): measure the trigger window from an element other than the animated
  one. Required whenever the animated element is sticky-pinned and therefore cannot
  supply the scroll length itself. Setting it disables the native CSS fast path,
  since `animation-timeline: view()` can only measure its own subject.
- `SECURITY.md` with a stated threat model, `CONTRIBUTING.md`, issue and PR
  templates, and Dependabot.
- **Release workflow with npm provenance.** Publishing was manual from a laptop;
  releases are now tagged, fully verified including browser tests, and
  cryptographically attested to the commit that produced them
  (`npm audit signatures`).

### Changed

- **Corrected every size and count claim in the README and the npm description.**
  The package advertised `~4.4 KB gzipped` against a real 8.9 KB main entry, plus
  `272 tests` (really 461) and `13 examples` (really 23). The size section is now a
  measured 21-entry table showing that per-API entry points start at 0.2 KB.
- Coverage thresholds now reflect measured reality (85/85/77/79 against 85.9% lines).
  They previously demanded 90/90/85/80 against an actual 74%, so the required CI
  coverage step failed on every push to `main`.
- Coverage exclusions made consistent across all eight framework wrappers.
- `sideEffects` and `engines` added to `package.json`.
- **The e2e viewport is now genuinely fixed at 900x800.** It was set at the top
  level of the Playwright config, where each project's `devices[...]` spread
  overrode it — leaving Chromium and Firefox at 1280x720 and WebKit at 1280x700.
  Any fixture doing arithmetic from the viewport height was therefore subtly wrong
  in exactly one browser.
- **The e2e static server honours HTTP Range requests.** Without `Accept-Ranges`
  and 206 replies, Chromium reports media as non-seekable: `video.seekable` stays
  empty and every assignment to `currentTime` is silently dropped. That made a
  correct `scrollVideo` look completely broken — the exact class of false negative
  this phase exists to remove.

### Added

- `scripts/size.mjs` — prints the per-entry gzip table and, with `--check`, fails the
  build when an entry exceeds its budget.
- `scripts/check-claims.mjs` — derives the real test and example counts from source
  and fails when a doc disagrees. Wired into CI and `npm run verify`.
- CI now typechecks the library. Previously only `apps/demo` was checked, which is how
  a type error shipped in `core/engine.ts`.
- 36 tests covering the CLI generators and the devtools overlay, both previously at 0%.
- `prepare` script so a fresh clone builds the library on `npm install`.

---

## [2.9.0] — 2026-06-06

### Added

- **`scrollProgress`** (`svg-scroll-draw/progress`) — expose scroll progress as CSS custom properties (`--scroll-progress`, `--scroll-progress-eased`) on any element. Drive CSS animations, `calc()` expressions, and gradients with zero per-frame JS beyond the variable write.
- **`scrollHorizontal`** (`svg-scroll-draw/horizontal`) — drive `translateX` from vertical scroll. The Apple / Stripe horizontal scroll pattern. You handle sticky CSS; one call drives the transform. Supports `distance`, `easing`, `trigger`, `onProgress`, `refresh()`.
- **`scrollReveal` example** on Examples page — live cascade demo (6 cards, `stagger: 0.12`, `once: true`).
- **`/vs-aos`** comparison page — svg-scroll-draw vs AOS vs ScrollReveal.js. Feature matrix (20 rows), side-by-side code, bundle bars.
- **`/vs-framer-motion`** comparison page — feature matrix, bundle comparison, side-by-side API, honest "when Framer Motion wins" section.
- **Blog post** — "Horizontal scroll sections without GSAP" at `/blog/horizontal-scroll-sections`.
- **Blog index** — horizontal scroll post added. 10 posts total.
- **Home page** — 2 new API cards (`scrollProgress` v2.9.0, `scrollHorizontal` v2.9.0). Grid is now 12 cards.
- **Docs** — v2.9.0 nav group (`scrollProgress`, `scrollHorizontal`). Docs version badge → v2.9.0. MobileMenu → v2.9.0.
- **16 new tests** — scrollProgress (8), scrollHorizontal (7), + velocity (1 updated). Total: 423.
- **`/react-scroll-animation`** — React-focused landing page covering `ScrollAnimate`, `ScrollText`, `ScrollCounter`, `ScrollPin` components, hooks (`useScrollAnimate`, `useScrollDrawProgress`), and real-world patterns with copy-ready code.
- **`/nextjs-scroll-animation`** — Next.js App Router landing page covering SSR-safe usage, `"use client"` pattern, dynamic imports, and all v2 APIs.
- **Blog post** — "Complete guide to scroll animations (2025)" at `/blog/complete-guide-scroll-animations-2025`. 12 patterns, all code included.
- **Blog post** — "Scroll animation performance" at `/blog/scroll-animation-performance`. Deep-dive on `rAF` budgets, native fast path, and avoiding layout thrash.
- **Home page** — new "Compare" + "Framework guides" section with links to all comparison pages and the React/Next.js landing pages.
- **Lenis dist types** — `dist/lenis/index.d.ts` and `.d.mts` shipped so the `svg-scroll-draw/lenis` subpath resolves TypeScript types correctly without manual `paths` config.

---

## [2.8.0] — 2026-06-06

### Added

- **`scrollReveal`** (`svg-scroll-draw/reveal`) — one-line reveal animations. 7 presets (fadeUp/Down/Left/Right, scale, flip, flipX), custom `from` state (opacity, x, y, scale, rotate, rotateX, rotateY), `stagger`, `easing`, `onEnter`/`onLeave`. Drop-in replacement for AOS and ScrollReveal.js.
- **`velocityScale` on `scrollAnimate`** — scale animation speed by scroll velocity. Pass `true` (default sensitivity) or a number. Forces JS engine.
- **`ResizeObserver` on `scrollPin`** — auto-refresh pin dimensions when the element or document layout changes. No more manual `refresh()` calls on accordion/modal open.
- **19 new tests** — scrollReveal (15), velocityScale (4). Total: 407.
- **Blog post** — "Replace AOS / ScrollReveal.js" at `/blog/replace-aos-scrollreveal`.
- **Home page** — `scrollReveal` v2.8.0 card added to API grid (10 cards total).
- **Docs** — v2.8.0 nav group with `scrollReveal` and `velocityScale` sections. Docs version badge → v2.8.0.
- **MobileMenu** version badge → v2.8.0.

---

## [2.7.0] — 2026-06-06

### Added

- **Scroll callbacks** — `onEnter`, `onLeave`, `onEnterBack`, `onLeaveBack` added to both `ScrollDrawOptions` and `ScrollAnimateOptions`. Fire when scroll position crosses the trigger zone boundary in either direction. Forces JS engine (disables native fast path).
- **`scrollPin`** (`svg-scroll-draw/pin`) — pin any element at a viewport position while the page scrolls past it. Wrapper-based layout (no layout shift). Supports `pinDistance`, `top`, `onEnter`, `onLeave`, `onEnterBack`, `onLeaveBack`, `onProgress`, `refresh()`.
- **`scrollSnap`** (`svg-scroll-draw/snap`) — JS-powered section snapping with custom easing, configurable threshold, `snapTo(index)`, `getCurrentIndex()`, and `onSnap` callback. Works on vertical and horizontal axes.
- **`createLenisAdapter`** (`svg-scroll-draw/lenis`) — Lenis v1 smooth-scroll adapter. Patches `window.scrollY` / `window.pageYOffset` with Lenis's virtual scroll value so all engines stay in sync. Lenis v2+ works out of the box without the adapter.
- **30 new tests** — `scrollCallbacks` (6), `scrollPin` (11), `scrollSnap` (7), `lenis` (6). Total: 388.
- **`/vs-gsap` comparison page** — bundle size bars, 20-row feature matrix, side-by-side API code for every major use case, license comparison, CTA.
- **Home page** — 3 new v2 API cards (`scrollPin`, `scrollSnap`, `onEnter/onLeave`). Grid is now 9 cards. Bundle chart links to `/vs-gsap`.
- **Blog post** — "Pin sections on scroll without GSAP — scrollPin" at `/blog/scroll-pin-without-gsap`.
- **`softwareVersion`** JSON-LD updated to 2.7.0. MobileMenu version badge updated to v2.7.0.

---

## [2.6.0] — 2026-06-05

### Added

- **Playground v2 tab** — new `v2 ✦` tab in the SVG Playground. Live interactive demos for three APIs:
  - `scrollAnimate`: 5 effect presets (Fade+Slide, Scale+Fade, Slide Left, Rotate In, Color Shift), 5 easings, scrubber, replay, live card preview.
  - `scrollText`: split mode picker (words/chars/lines), stagger slider, 3 from-presets (Fade Up, Rotate In, Scale), scrubber, dark-bg headline preview.
  - `scrollCounter`: 4 format presets (users, revenue, satisfaction, tests), scrubber, replay.
  - Each panel generates a copy-ready code snippet.
- **Blog post** — "Animate multiple elements on scroll — one call" at `/blog/scroll-animation-groups`. Covers all 5 group functions with real-world patterns.
- **README exports table** — updated `svg-scroll-draw/vue`, `/svelte`, `/solid`, `/angular`, `/astro`, `/nuxt`, `/group` rows to list all v2 exports.

### Fixed

- JSON-LD `softwareVersion` on home page corrected from `1.2.0` to `2.6.0`.

---

## [2.5.0] — 2026-06-05

### Added

- **`scrollParallaxGroup(targets, options)`** — fan-out `scrollParallax` across multiple elements simultaneously. Returns the same combined `destroy`/`replay`/`pause`/`resume`/`seek` instance as `scrollAnimateGroup`. Ships in `svg-scroll-draw/group`.
- **DocsPage Angular v2** — `ScrollAnimateRef`, `ScrollCounterRef`, `ScrollVideoRef`, `ScrollTextRef` with Angular `@ViewChild` component lifecycle examples.
- **DocsPage Nuxt v2** — `useScrollAnimate`, `useScrollText`, `useScrollCounter` composables, component wrappers, and `createScrollDrawPlugin`. Full parity with Vue/Svelte/Solid docs depth.
- **DocsPage Astro v2** — `initScrollAnimate`, `initScrollText`, `initScrollCounter`, `initAll` with complete data-attribute code examples.

### Fixed

- Desktop nav duplicate burger menu — `<MobileMenu />` was rendering on desktop on 7 pages (blog index, 5 blog posts, ExamplesPage). All now wrapped in `lg:hidden`.

---

## [2.4.0] — 2026-06-05

### Added — Angular/Astro/Nuxt v2 + scrollAnimateGroup + examples + blog

**Angular v2 wrappers** (`svg-scroll-draw/angular`)
- `ScrollAnimateRef` — class with `init(element, options)` / `replay()` / `pause()` / `resume()` / `seek()` / `destroy()`.
- `ScrollCounterRef` — same class API wrapping `scrollCounter`.
- `ScrollVideoRef` — same class API wrapping `scrollVideo` for `<video>` elements.
- `ScrollTextRef` — same class API wrapping `scrollText`.

**Astro v2** (`svg-scroll-draw/astro`)
- `initScrollAnimate(root?)` — finds all `[data-scroll-animate]` elements and initialises `createAnimateEngine` from the JSON in `data-scroll-animate-options`.
- `initScrollCounter(root?)` — same pattern for `[data-scroll-counter]`.
- `initScrollText(root?)` — same pattern for `[data-scroll-text]`.
- `initAll(root?)` — convenience that runs all four inits and returns `{ draw, animate, counter, text }`.

**Nuxt v2** (`svg-scroll-draw/nuxt`)
- Re-exports all v2 Vue composables: `useScrollAnimate`, `useScrollCounter`, `useScrollVideo`, `useScrollText`.
- Re-exports all v2 Vue components: `ScrollAnimate`, `ScrollCounter`, `ScrollVideo`, `ScrollText`.
- `createScrollDrawPlugin()` now globally registers all five components (`ScrollDraw` + v2 set).

**Group API** (`svg-scroll-draw/group`)
- `scrollAnimateGroup(targets, options)` — fan-out `scrollAnimate` across multiple elements simultaneously. Returns a combined instance with full `destroy`/`replay`/`pause`/`resume`/`seek` API.
- `scrollAnimateSequence(targets, options)` — chain `scrollAnimate` across elements in strict sequence.

**ExamplesPage**
- Product Video Scrub — `scrollVideo` concept with mock timeline, timestamp counter, saturation transition.
- Feature List Reveal — staggered `scrollAnimate` row-by-row entrance.
- Animate Group — `scrollAnimateGroup` fan-out of four v2 API cards.
- Header count updated to 17 examples.

**Blog**
- New post: "scrollAnimate in Vue 3, Svelte, and Solid.js — v2 framework guide" at `/blog/vue-svelte-solid-v2`. Composables, actions, hooks, component wrappers, real-world patterns (staggered card grid, marketing headline), Nuxt plugin, Astro data-attributes, summary table.

---

## [2.3.0] — 2026-06-05

### Added — v2 framework wrappers + interactive demo

**Vue 3 v2 composables** (`svg-scroll-draw/vue`)
- `useScrollAnimate(options)` — returns a ref; bind to any element to animate CSS props on scroll.
- `useScrollCounter(options)` — returns a ref; bind to a `<span>` or any element to count up on scroll.
- `useScrollVideo(options)` — returns a ref; bind to a `<video>` to scrub `currentTime` on scroll.
- `useScrollText(options)` — returns a ref; bind to any text element to split and stagger-animate on scroll.
- `<ScrollAnimate :options="...">` — convenience component; wraps children in a `<div>` and animates.
- `<ScrollCounter :to="..." ...>` — renders a `<span>` counter.
- `<ScrollVideo src="..." :options="...">` — renders a `<video>` scrubbed by scroll.
- `<ScrollText :options="..." tag="h2">` — renders any tag with text split and animated.

**Svelte v2 actions** (`svg-scroll-draw/svelte`)
- `scrollAnimate` — Svelte `use:` action for `createAnimateEngine`. `update()` reinitialises on option change.
- `scrollCounterAction` — Svelte action for `scrollCounter`.
- `scrollVideoAction` — Svelte action for `scrollVideo`.
- `scrollTextAction` — Svelte action for `scrollText`.
- `createScrollAnimate(options)` — returns `{ action, getInstance }` for imperative control.
- `createScrollCounter`, `createScrollVideo`, `createScrollText` — same pattern.

**Solid v2 hooks** (`svg-scroll-draw/solid`)
- `useScrollAnimate(options)` — returns ref setter for any element.
- `useScrollCounter(options)` — returns ref setter for a counter element.
- `useScrollVideo(options)` — returns ref setter for a `<video>` element.
- `useScrollText(options)` — returns ref setter for a text element.
- `createScrollAnimate`, `createScrollCounter`, `createScrollVideo`, `createScrollText` — return `{ ref, getInstance }` for imperative control.

**Demo site**
- `ScrollTextInteractive` — interactive home page section for `scrollText`: split mode picker (chars/words/lines), stagger slider (0–0.10), from-preset selector (Fade Up / Rotate In / Scale), scrubber, replay button, live code block.
- Changelog page: "v2 — The Platform Shift" visual callout separating v2.x and v1.x entries.
- DocsPage: new `v2.3.0` nav group with full usage docs for Vue 3 v2 composables/components, Svelte v2 actions, and Solid v2 hooks.
- FrameworkTabs: Vue 3, Svelte, and Solid tabs updated to showcase v2 API (`useScrollAnimate`, `scrollAnimate` action, `useScrollText`, etc.) alongside v1 comment.
- All version badges updated to v2.3.0.

---

## [2.2.0] — 2026-06-04 · **published**

### Added — v2 Phase 2 + Phase 3
- **`scrollVideo(target, options)`** — tie `<video>.currentTime` to scroll position. Ships as `svg-scroll-draw/video`. Supports `from`/`to` in seconds, `preload`, `onReady`, all lifecycle callbacks and instance methods. Auto-pauses on init, handles `loadedmetadata` lazily.
- **`scrollText(target, options)`** — split text into `chars`, `words`, or `lines` and animate each unit on scroll with stagger. Ships as `svg-scroll-draw/text`. Free replacement for GSAP SplitText. Accessibility: `aria-label` on container, `aria-hidden` on spans, `destroy()` restores original HTML.
- **`devtools` overlay** — ships as `svg-scroll-draw/devtools`. Visual panel showing all active animation types (draw/animate/counter/video/text), progress bars, trigger lines, color-coded by type. `devtools.enable()`, `devtools.disable()`, `devtools.toggle()`, `devtools.highlight(el)`. `Cmd/Ctrl+Shift+S` keyboard shortcut. Dev-only — zero production bytes.
- **`ScrollVideo` React component** — `svg-scroll-draw/react` wrapper for `scrollVideo`.
- **`ScrollText` React component** — `svg-scroll-draw/react` wrapper for `scrollText`.
- **Global instance registry** (`src/core/registry.ts`) — all engines (animate, counter, video, text) self-register on init and unregister on destroy. DevTools reads the registry.
- **36 new tests** — `scrollVideo.test.ts` (17), `scrollText.test.ts` (19). 358 total.

### Demo site
- **v2 section on home page** — 6-card grid for scrollAnimate, scrollVideo, scrollCounter, scrollText, scrollParallax, DevTools with code snippets.
- **DocsPage v2.0–2.2 nav group** — full API docs for all 6 new APIs.
- **ExamplesPage** — 3 new v2 example cards: scrollAnimate fade/slide, scrollCounter stats, scrollText word reveal.
- **Blog post: "Replace GSAP ScrollTrigger with scrollAnimate"** — full migration guide with side-by-side code at `/blog/replace-gsap-scrolltrigger`.
- **Blog index** — now shows 5 posts.
- **Sitemap** — updated with new blog post.

---

## [2.0.0] — 2026-06-04

### Added — v2 APIs (Phase 1)
- **`scrollAnimate(target, options)`** — animate any CSS property on any DOM/SVG element driven by scroll. Supports `opacity`, `transform` (with multi-function interpolation), `color`, `background-color`, and any CSS property with numeric units. Native CSS `animation-timeline: view()` fast path when eligible. Same trigger, easing, `once`, `seek`, `pause`, `resume`, `replay`, `getProgress`, `destroy` API as `scrollDraw`.
- **`scrollCounter(target, options)`** — scroll-driven number counter. Animates a numeric value from `from` to `to` as the element scrolls into view. Supports custom `format` function, `decimals` shorthand, `once` (default true), and all lifecycle callbacks.
- **`scrollParallax(target, options)`** — move any element at a different rate than scroll. `speed` multiplier relative to element size (`0.3` = 30% of element height travel, `-0.2` = opposite direction). Thin wrapper over `scrollAnimate`.
- **`ScrollAnimate` React component** — `svg-scroll-draw/react` wrapper for `scrollAnimate`.
- **`ScrollCounter` React component** — `svg-scroll-draw/react` wrapper for `scrollCounter`.
- **50 new tests** — `scrollAnimate.test.ts` (30 tests), `scrollCounter.test.ts` (20 tests). 322 total.
- **`interpolateValue` export** — public utility for CSS value interpolation (numbers, colors, transforms, unit values).

### Breaking changes
None — all v1 APIs unchanged. v2 is purely additive.

---

## [1.8.0] — 2026-06-04

### Added
- **Changelog page** — v1.4.0 through v1.7.0 entries added; "Latest" tag updated to v1.7.0.
- **Examples page** — new Presets example card showing all 5 presets on the same SVG side by side. Count updated from 13 to 14.
- **Playground** — Preset shortcut dropdown at the top of the Motion tab. Selecting a preset instantly applies its option values (easing, stagger, speed, fade, once) to the current state.
- **Blog post: "5 scroll animation patterns in under 10 lines"** — `/blog/5-patterns-under-10-lines`. Covers all 5 presets with Vanilla JS + React code, use cases, and when-to-use guidance. Blog index now shows 4 posts.

### Notes
- No library changes in v1.8.0 — all changes are demo site only. Version bump optional.

---

## [1.7.0] — 2026-06-04

### Added
- **`loop` option for `scrollDrawTimeline`** — after the scroll-driven animation completes, automatically replay as a time-driven loop. `true` = loop infinitely, `number` = loop N additional times. Each iteration plays over `loopDuration` ms.
- **`loopDuration` option** — duration of each time-driven loop iteration in ms (default `1500`).
- **`preset` in docs** — `preset` option now documented in DocsPage Core Options section with link to Presets section.
- **Presets section in DocsPage** — all 5 presets documented with option sets and code example.
- **CLI section in DocsPage** — `npx svg-scroll-draw init` documented with framework-specific output descriptions.
- **README updates** — Presets section with table, CLI in Install section, `preset` in options table, timeline options table updated with `repeat`, `repeatDelay`, `loop`, `loopDuration`, `debug`, `label`. Test count updated to 272.
- **5 new loop tests** — 272 tests total.
- **`doReset()` fix** — now correctly resets `currentAlpha = 0` so `getProgress()` returns 0 after `replay()`.

### Notes
- Fully backward compatible — `loop` and `loopDuration` default to off/1500.

---

## [1.6.0] — 2026-06-04

### Added
- **`preset` option** — apply a named option bag as the base config. User options always override. Five presets:
  - `'sketch'` — staggered ease-in draw, pencil feel
  - `'reveal'` — fade + ease-out, draws once on viewport entry
  - `'typewriter'` — fast linear draw with stagger
  - `'cinematic'` — slow ease-in-out with fade, dramatic entrance
  - `'spring'` — spring easing, bouncy organic feel
  ```js
  scrollDraw('#logo', { preset: 'reveal' });
  scrollDraw('#logo', { preset: 'sketch', easing: 'ease-out' }); // easing overrides preset
  ```
- **`PRESETS` export** — the preset definitions are exported so you can inspect or extend them:
  ```js
  import { PRESETS } from 'svg-scroll-draw';
  console.log(PRESETS.reveal); // { easing: 'ease-out', fade: true, speed: 1.2, once: true }
  ```
- **CLI init tool** (`npx svg-scroll-draw init`) — interactive scaffolder that generates a starter file for your framework. Asks for framework (React/Vue/Svelte/Solid/Vanilla), preset, easing, and selector. Writes a ready-to-use component file.
- **5 new tests** for preset option — 267 tests total.
- **Blog post: "Scroll-driven SVG path morphing with morphTo"** — `/blog/scroll-path-morphing`. Covers path compatibility rules, use cases (icon transitions, data viz, blobs), combining with fade/strokeColor, limitations, and full API reference.

### Notes
- Fully backward compatible — `preset` defaults to undefined (no change in behaviour).

---

## [1.5.0] — 2026-06-04

### Added
- **`repeat` option for `scrollDrawTimeline`** — replay the timeline N times or `'infinite'` after it completes. Works with `once: true`: after completion + `repeatDelay` ms, all paths reset and the animation plays again on the next scroll-into-view.
  ```js
  scrollDrawTimeline('#diagram', {
    tracks: [...],
    once: true,
    repeat: 3,
    repeatDelay: 800,
  });
  ```
- **`repeatDelay` option for `scrollDrawTimeline`** — milliseconds to wait before each repeat (default `0`).
- **`debug` option for `scrollDrawTimeline`** — injects a fixed HUD panel into `document.body` showing each track's scroll window as a coloured progress bar, live fill, and global progress. Removed automatically on `destroy()`. Designed for tuning `from`/`to` values without guesswork.
  ```js
  scrollDrawTimeline('#diagram', {
    tracks: [...],
    debug: true,
    label: 'hero diagram',
  });
  ```
- **`label` option for `scrollDrawTimeline`** — string shown in the debug panel header. Defaults to the target selector.
- **8 new tests** covering `repeat` reset, `repeat` + `onComplete` multi-fire, timer cancellation on `destroy`, `replay()` resetting the repeat counter, debug overlay injection, and debug overlay removal. **262 tests total.**
- **Blog post: "Zero-JS SVG scroll animations with native CSS"** — `/blog/native-css-svg-scroll-animations`. Deep-dive on the `animation-timeline: view()` fast path: eligibility rules, browser support matrix, performance benefits, opt-out, and instance API.

### Notes
- Fully backward compatible — `repeat`, `repeatDelay`, `debug`, `label` all default to off/undefined.

---

## [1.4.0] — 2026-05-31

### Added
- **`Cinematic` class** — the runtime bridge for [Cinematic Studio](https://github.com/DhruvilChauahan0210/reel),
  the visual scroll-animation editor. Reads a `story.json` authored in the Studio and
  wires a scroll-scrubbed timeline with zero JavaScript on the author's side:

  ```js
  import { Cinematic } from "svg-scroll-draw";
  import story from "./story.json";
  new Cinematic({ wrapper: "#app" }).loadStory(story);
  ```
- **`loadStory(story)`** builds a sticky-stage scroll structure from the story, strokes
  each traced `draw` path on across its scroll range, and fades `fade` layers (the product
  photo) in. Honors `prefers-reduced-motion` by jumping to the finished frame, and only
  runs its rAF loop while the stage is on screen (IntersectionObserver-gated).
- **Cinematic Story protocol types** exported: `Story`, `StoryScene`, `StoryAnimation`,
  `DrawAnimation`, `FadeAnimation`, `StoryEasing`. New `svg-scroll-draw/cinematic` subpath
  for tree-shaken imports.
- **5 new tests** covering DOM construction, draw + fade scrubbing at a known scroll
  position, reduced-motion fallback, and observer lifecycle. **254 tests total.**

### Notes
- Fully backward compatible — purely additive. The existing `scrollDraw` API is untouched.

---

## [1.3.0] — 2026-05-30

### Added
- **`autoplay` option** (`boolean`, default `false`) — trigger the animation when the
  element enters the viewport instead of tying it to scroll position. The draw runs over
  `duration` milliseconds and replays each time the element re-enters the viewport. Use
  `once: true` to play only the first time.
- **`duration` option** (`number`, default `1000`) — animation duration in milliseconds,
  used only when `autoplay: true`.
- All existing visual options work in autoplay mode: `easing`, `stagger`, `fade`,
  `strokeColor`, `strokeWidth`, `fillOpacity`, `clip`, `morphTo`, `waypoints`, `repeat`,
  `repeatDelay`, `onStart`, `onComplete`, `onProgress`, `direction`.
- The full instance API works in autoplay mode — `pause` / `resume` freeze/unfreeze
  elapsed time; `seek(0–1)` jumps to a fraction of `duration`; `replay` restarts from 0.
- **8 new tests** covering autoplay draw, `onStart`, `onComplete`, `seek`, `replay`,
  `destroy`, clip mode, and `once`. **249 tests total.**

### Notes
- Fully backward compatible — `autoplay` defaults to `false`, existing scroll-driven
  code is unchanged.

---

## [1.1.0] — 2026-05-30

### Added
- **Native CSS scroll-driven rendering** — when the browser supports
  [`animation-timeline: view()`](https://developer.mozilla.org/en-US/docs/Web/CSS/animation-timeline)
  and the config is simple (default trigger, named easing, optional `fade`, forward or
  reverse), the draw now runs on the compositor with **zero per-frame JavaScript and no
  scroll/resize listeners**. The full instance API (`pause`, `resume`, `seek`, `replay`,
  `getProgress`, `destroy`) works on both the native and JS paths.
- **`native` option** (`boolean`, default `true`) — set `false` to always use the JS
  engine. When `true`, the JS engine is still used automatically for any config CSS
  can't express declaratively (callbacks, `stagger`, `morphTo`, `velocityScale`,
  `autoReverse`, `once`, `repeat`, custom trigger/scroll-container, `speed ≠ 1`,
  custom-function or `spring` easing, animated color/width/fill).
- **27 new tests** (`engine-native.test.ts`) covering native activation, automatic
  fallback for every non-eligible config, the unsupported-browser path, and the
  instance API on the native path. **221 tests total.**

### Changed
- Documentation now reports the accurate **~4.4 KB gzipped** core size (the engine has
  grown well beyond the original ~3 KB with morph, clip, velocity, waypoints, timeline,
  and group features). Still 8–9× smaller than Framer Motion or GSAP DrawSVG.

### Notes
- Fully backward compatible — existing code keeps working unchanged, and behavior is
  identical in browsers without native `animation-timeline` support.

---

## [1.0.0] — 2026-05-28

First stable release. The public API is now considered stable — no breaking changes
will be made without a major version bump.

### Added
- **`scrollDrawSequence` bug fix** — engines are now all created upfront and paused;
  later steps no longer read the wrong scroll position when chained. `activeIdx`
  now tracks correctly so `pause()`, `resume()`, `seek()`, and `getProgress()`
  always target the currently active step.
- **194 passing tests** across 6 test suites — engine, engine-options, group,
  timeline, framework wrappers (Angular, Astro, Svelte, Solid), and utilities.
- **Framework wrapper tests** — Angular `ScrollDrawRef`, Astro `initScrollDraw`,
  Svelte `scrollDraw` action + `createScrollDraw`, Solid `useScrollDraw` +
  `createScrollDraw` all now have dedicated test coverage.
- **Root workspace test runner** — `npx vitest run` from the repo root now works
  correctly via `vitest.workspace.ts`, picking up all packages with the right jsdom
  environment.

### Improved
- **Coverage** — lines 94.98%, functions 95.23%, branches 82.94%; all thresholds pass.
- **JSDoc** — `clip`, `morphTo`, and `scrollDrawSequence` now document their
  non-obvious edge cases inline (clip:true maps to 'left', morphTo silently no-ops
  on non-path elements, sequence forces once:true per step).

---

## [0.6.2] — 2026

### Added
- **`fillOpacity`** — animate fill opacity in sync with the stroke draw. Single number = static override; `[from, to]` tuple = interpolate as the path draws. Use `fillOpacity={[0, 1]}` to flood a shape's fill in as its outline traces itself — no `onComplete` hack needed.
- **`useScrollDrawProgress` hook (React)** — returns a reactive `number` (0–1) representing scroll progress for any element. Same `trigger` / `speed` / `easing` / `axis` / `scrollContainer` / `once` options as `ScrollDraw`. Use it to drive any animation alongside or independent of an SVG draw.
- **`svg-scroll-draw/web-component`** export — `<scroll-draw>` custom element now importable directly; previously only available via CDN.

---

## [0.6.0] — 2025

### Added
- **Pause / Resume / Seek** — imperative API to programmatically control animation state
- **Path Morphing** (`morphTo`) — interpolate a path's `d` attribute from its original shape to a target shape as you scroll
- **Velocity Scale** (`velocityScale`) — draw speed scales with how fast the user scrolls
- **Repeat** (`repeat`, `repeatDelay`) — replay the animation N times or loop it infinitely
- **Astro adapter** (`svg-scroll-draw/astro`) — data-attribute API with `initScrollDraw()`, no JS imports in markup
- **Nuxt adapter** (`svg-scroll-draw/nuxt`) — `useScrollDraw()` composable for Nuxt 3
- **Group API** (`svg-scroll-draw/group`) — `scrollDrawGroup` and `scrollDrawSequence` for animating multiple SVG containers simultaneously or in sequence
- **Web Component** (`svg-scroll-draw/web-component`) — `<scroll-draw>` custom element, auto-registers via CDN or import

---

## [0.5.0]

### Added
- Internal refactor preparing adapters for Astro, Nuxt, and Group API

---

## [0.4.0]

### Added
- **SolidJS adapter** (`svg-scroll-draw/solid`) — `useScrollDraw` hook
- **Angular adapter** (`svg-scroll-draw/angular`) — `ScrollDrawRef` class for `AfterViewInit` pattern
- **Color animation** (`strokeColor`) — static override or `[from, to]` tuple to animate stroke color as the path draws
- **Width animation** (`strokeWidth`) — static override or `[from, to]` tuple to animate stroke width as the path draws
- **Auto Reverse** (`autoReverse`) — animation follows scroll direction, reversing when the user scrolls back up
- **Custom scroll container** (`scrollContainer`) — target a specific scrollable element instead of the window
- **Waypoints** — fire callbacks at specific scroll progress thresholds (0–1)
- **Delay** (`delay`) — milliseconds to wait before the engine starts observing

---

## [0.3.0]

### Added
- **Svelte adapter** (`svg-scroll-draw/svelte`) — `use:scrollDraw` action
- **Horizontal scroll** (`axis: "x"`) — track horizontal scroll containers
- **Replay API** — `instance.replay()` to re-trigger the animation imperatively
- **Spring easing** — physics-based overshoot-and-settle curve
- **Once mode** (`once`) — draw once and stay drawn
- **Debug overlay** (`debug`) — visualizes trigger start/end zones in development
- **`onStart` lifecycle hook** — fires on the first animation frame

---

## [0.2.1]

### Fixed
- OpenGraph and Twitter preview card image URLs

---

## [0.2.0]

### Added
- **Vue 3 adapter** (`svg-scroll-draw/vue`) — `<ScrollDraw>` component and `useScrollDraw` composable
- SVG Playground at `/playground` — paste any SVG and tweak all options live
- Live GitHub / npm stats section on the demo site
- Interactive demo component with easing and speed controls

---

## [0.1.0] — Initial release

### Added
- Core scroll-draw engine — `stroke-dashoffset` animation driven by `IntersectionObserver` + `requestAnimationFrame`
- Zero dependencies, ~3 KB gzipped
- **React / Next.js adapter** (`svg-scroll-draw/react`) — `<ScrollDraw>` wrapper component
- Vanilla JS API — `scrollDraw(selector, options)`
- CDN build — global `SvgScrollDraw` with `<scroll-draw>` web component auto-registration
- Options: `selector`, `speed`, `fade`, `easing` (linear, ease-in, ease-out, ease-in-out), `stagger`, `direction`, `once`, `debug`, `axis`, `scrollContainer`, `threshold`, `rootMargin`
- Lifecycle hooks: `onStart`, `onProgress`, `onComplete`
- Trigger control: `trigger.start`, `trigger.end`
- SSR-safe (no `window` access during server render)
- 56 passing tests
