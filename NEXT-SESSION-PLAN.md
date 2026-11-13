# Next Session Plan — svg-scroll-draw

> Updated: 2026-11-13 — **Branch `feat/frames-wrappers-more`** (rebased on `main`): 2.26.0, scrollFrames for Svelte (`scrollFramesAction`, `createScrollFrames`), Solid (`useScrollFrames`, `createScrollFrames`) and Angular (`ScrollFramesRef`) on the React/Vue rules; `easing: 'cubic-bezier(…)'` and `'ease'` work in every engine and on the native path (they used to run as the default without a word), unknown strings warn in development, `steps()` needs a function; main entry 11.9 KB gzipped (was 11.5, budgets raised in `scripts/size.mjs`); `createLenisAdapter().destroy()` restores the browser's `window.scrollY` instead of deleting it; the draw dash is `L 2L` so WebKit paints no cap dot on an undrawn path; the Lenis docs now say Lenis 1.x (every release so far) scrolls the real page and needs no adapter, and `/blog/css-cubic-bezier-easing` says strings work. 2.25.0 is on `main` but untagged; 2.24.0 is tagged and on npm. After 2.26.0 reaches `main`: `git tag v2.26.0 <sha> && git push origin v2.26.0` (until then the recipes and skills pin a jsDelivr/unpkg version that does not exist yet; tag v2.25.0 on its release commit `63e96b5` too if it is to be published). Next: the GSAP benchmark's full ~1 h run on `feat/gsap-bench` (idle machine); request indexing for the new pages (the two new generators, /scroll-image-sequence-generator, /examples/scroll-frames, /showcase/groundtrack and the new blog posts; queue in `reports/indexing-queue.md`, ~2 a day); Search Console review per page in 2–3 weeks; a shadcn directory listing (needs an SVG logo and signed commits by the owner); the awesome-list PR drafts in `reports/awesome-list-prs-2026-11-13.md` for the owner to submit; link submissions in `reports/link-submissions-2026-11-13.md` and the GitHub repo description (owner). Earlier history below. Site on `main` since 2.25.0: the handwriting animation generator (29 tools), the stacking cards and scroll marquee generators, the README hero loops and star buttons, and eleven how-to posts (scroll image sequence, video scrub, counter, cubic-bezier, React, Locomotive alternatives, CSS-only animate on scroll, Next.js, parallax, progress bar, scroll snap).


**Growth (branch `feat/growth`, from `main` at 2.24.0):** README loops in `.github/media/` (hero pen, Groundtrack, Lumen, Atelier Nord, the line drawing generator; recorded from a production build by CDP screencast and converted with ffmpeg palettegen/paletteuse, 720 px wide), both READMEs lead with the hero and a quick start (the npm README's absolute raw URL 404s until `main` has `.github/media/`; npm shows it from the next publish), and `components/site/GitHubStar.tsx` closes every tool and blog post with the hourly cached star count. Next: watch stars and weekly installs for 2–3 weeks before more growth work; re-record a loop whenever its page changes visibly.
---

## Tool kit, three tools and 2.23.4 (2026-11-12) — branch `feat/tools-kit-and-fixes`

**Owner, in this order:**
1. After the branch reaches `main`: `git tag v2.23.4 <sha> && git push origin v2.23.4`.
   Until 2.23.4 is on npm, the tools' downloads and the recipe files point at a
   jsDelivr version that does not exist yet. The release job now runs in
   Playwright's image, so a mirror outage cannot hold it.
2. GitHub Sponsors profile, if not done yet (the footer links to it).
3. Request indexing for the three new tools: /svg-path-editor,
   /typewriter-effect-generator, /scroll-video-scrub-generator.

**Next work:**
- Move scrollDraw's JS engine, scrollCounter, scrollText, scrollVideo and
  useScrollDrawProgress from their IntersectionObserver to the trigger-window
  gate the animate engine got in 2.23.4: a jump across a whole window (End, an
  anchor link) still paints nothing there.
- scrollAnimate clip-path tuples (`inset(0, 50%, 0, 0)`), blocked by budgets.
- scrollSnap: Next pressed twice during one glide moves one section; Next on
  the last section fires onSnap again.
- scrollVideo: no clamp of the time to [from, to] under overshooting easings.
- Measure before building more tools: `npm run report:numbers` weekly; Search
  Console per page after 2–3 weeks.

## 2.23.0 and the unslop post (2026-11-07) — published

- The drop-ins listen too: AOS in `init()` (module state), ScrollReveal in the
  factory (`motionReduced`, cleared by `destroy()`), vivus per instance
  (`endNow()`, shared with `play()`'s reduced branch). Browser tests and three
  mutations; aos budget 3.3.
- Post `/blog/unslop-ai-looking-ui` (unslop has 60 signs; earlier notes said
  59, corrected).
- Full mutation run (all 92 before this release's three) ran in a separate
  worktree with `E2E_PORT=4273` so it could not touch this checkout.
- Released 2026-11-07: v2.20.1, v2.21.0, v2.22.0, v2.23.0 (`bd31fe2`), all on
  npm. They were pushed within two minutes, npm processed 2.23.0 before
  2.21.0/2.22.0, and `latest` ended on 2.22.0; the owner ran `npm dist-tag add
  svg-scroll-draw@2.23.0 latest` (after `npm login`; the old token had expired,
  and dist-tag asks for a browser 2FA approval) and set v2.23.0 as GitHub's
  latest release. release.yml now decides the dist-tag itself
  (`scripts/release-dist-tag.mjs`), so tags pushed together are safe.
- Full mutation run: 92/92 caught, in a separate worktree on E2E_PORT=4273.

## Unslop (2026-11-07) — merged and deployed

- Rubric: heydamir/unslop (`skills/unslop/references/signs.md`, `SKILL.md`,
  `tokens.md`), read from GitHub; its scripts were not run (snapshot and
  story video are not needed with the code at hand). Audit: 13 of 60 signs on
  the site, "light slop", so polish mode.
- Done: spacing on the 4px grid, plain nav surface, no emoji, copy (badge,
  `!`, hype words, placeholders, headline periods), sentence-case labels at
  normal tracking, emphasis by colour, radius by size, the stack pulse runs
  once; blocks (eyebrows, weight 500, copy); showcase ("New" pills, gradient
  headlines, unverifiable "Trusted by" counts, coloured glows, caps).
- Final pass (branch `fix/unslop-final`): clamp() bounds, dead marquee CSS,
  caption periods, fragment ledes, hero proof rows; checked by eye.
- Showcase in full (second round, same branch): spacing, copy (144
  headlines), colour (gradients, washes, glass), type (weights, italics,
  tracking), radius and one easing, every site.
- Left on purpose: Lumen's sunset sky (its scene, a moment); the live-state
  loops in product mock-ups; lowercase labels that are code, option or
  package names, or the path-style breadcrumb (`find-lowercase-labels.mjs`
  lists 802 distinct, the English ones done).
- Stride's calendar derives "missed" days from today's date, so its content,
  and what test-showcase measures, changes from day to day.
- Showcase contrast: all 708 old failures fixed (text colours to the nearest
  passing shade of the same hue, white-on-accent buttons darkened, opacity
  dims raised); `test-showcase.mjs` runs in CI with 0 problems. Lesson: a
  colour changed site-wide must be checked on every background it is used on,
  not only where it failed (Shipyard's grey failed on one light pill and was
  darkened everywhere, breaking 68 dark-background uses until restored).
- Screens could not be screenshotted at the end (display asleep): look at
  /, /docs, a blog post, /blocks and two showcase sites on the Vercel preview
  before merging.

## 2.22.0 — reduced motion followed live (2026-11-06, pushed in `66af2b5`)

- `core/motion-live.ts` `finishWhenReduced(options, build)`: builds the
  instance; when reduced motion turns on it destroys it and builds it again
  through the start-up reduced branch, behind a stable object (methods taken
  off it keep reaching the live one), without `onComplete` if the old one had
  finished. Used by the draw engine, the animate engine (reveal, parallax,
  groups, horizontal with `respectReducedMotion: true`), text and counter.
  Video and `Cinematic` finish in place (`watchReducedMotion`); the React
  progress hook sets 1. Drop-ins untouched. A file of its own so snap and the
  timeline do not carry it (the chunked build shares whole files).
- One way, on purpose: turning it off leaves everything finished.
- Tests: `motionLive.test.ts` (14), `e2e/motion-live.spec.ts` (5) plus one
  each in video and cinematic, 9 mutations run and caught. Two mutation anchors
  had been stale since 2.21.0 (`text/aria-label` removed, `text/destroy-restore`
  re-anchored): `mutation-check.mjs --anchors` now runs in verify and CI.
- **The full mutation run takes hours** (a tsup build per mutation, about two
  minutes each). Run a subset by id (`node scripts/mutation-check.mjs
  reduced-live`); SIGINT cannot interrupt it between builds, so if you must stop
  it, kill it and `git diff` the one file the last mutation names.
- **Owner:** tags in order, each once npm shows the one before: `v2.20.1` on
  `975dce6`, `v2.21.0` on `140ae6c`, then `v2.22.0` on its release commit.

## IndexNow refusals warn (2026-11-06, not pushed)

- `indexnow.mjs`: a 403, 429 or 5xx from IndexNow leaves a GitHub warning and
  exits 0; 400/422, the key file and the sitemap still fail. Bing answered 202
  twice, then 403 "UserForbiddedToAccessSite" with the key file served.

## Reduced-motion post (2026-11-06) — pushed in `08467e6`

- `/blog/reduced-motion-scroll-animations`: effect by effect, built from what
  each engine does (`src/core/motion.ts`, `motion-watch.ts`, each engine's
  `prefersReduced` branch) and the 13 e2e specs that emulate reduced motion.
  Since 2.22.0 it also describes the live switch (on: finish at once; off:
  stay finished) and the library's behaviour since then.
- Port etiquette with other sessions: use your own port for `next start` and
  stop your own PID; `pkill -f "next start -p 3100"` once killed another
  session's server.

## SEO check and an accessibility post (2026-11-06) — pushed in `44e4dfd`

- `apps/demo/scripts/test-seo.mjs` reads every sitemap page's server HTML for
  what search results are built from (title, description, canonical, one h1,
  lang, noindex, OG/Twitter with a loading image, JSON-LD, inbound links). It
  runs in CI on the same server as test-blocks and test-a11y. One fix: the
  line-chart example's description.
- New post `/blog/accessible-split-text-animation` (claims checked against
  WAI-ARIA 1.2 §5.2.8.6 and GSAP's SplitText docs on 2026-11-06).

## The live chapter (2026-11-06, site-only, merged from `claude/funny-kowalevski-260099`)

- **Why the GitHub cards said "—":** the homepage is static with hourly ISR.
  When a regeneration finds a cached `fetch` stale, Next 16 refetches it in the
  foreground and returns whatever came back (`patch-fetch.js`, the
  `willConsumerServerCache` branch), and only 200s are cached. One refused
  GitHub call (the anonymous limit, 60 an hour, shared by Vercel's IPs, is the
  likely refusal; Vercel's logs were not readable from here) gave "—" for the
  hour, with the good answer still cached. `/api/stars` had the same flaw.
- **Now:** `apps/demo/src/lib/live-data.ts` keeps each figure in
  `unstable_cache`, whose loader throws on anything but a well-formed 200;
  `unstable_cache` returns the last value when a revalidation throws. A refusal
  is logged as `revalidating cache with key: …` with the status. Replay it with
  a production build: move `.next/server/app/index.*` and
  `.next/server/route-cache` aside, set the `.next/cache/fetch-cache` files' mtime
  2 h back and `next start` **without** `--use-system-ca` (on this laptop's
  network that fails GitHub only, npm still answers).
- **Lifetime downloads**: every day since the registry's `time.created`, a
  year at a time (npm drops the oldest days of a range over 18 months), up to
  yesterday. The card is their sum; the chart opens on them, with a "last 30
  days / all time" switch (`charts` in `LiveBoard`, built by `plot()` in
  `LiveStats`).
- **The chart** has a read-out per day (hover, tap, keys), built as a
  `role="slider"` pad over the plot (`Plot` in `components/home/LiveBoard.tsx`).
- **Owner:** set `GITHUB_TOKEN` on Vercel (fine-grained, read-only access to
  public repositories); without it a never-fetched figure can still show "—"
  on a fresh data cache.
- `apps/demo/src/components/LiveStats.tsx` is the May 2026 version of this
  chapter and nothing imports it.

## 2.21.0 and the site's accessibility (2026-11-06) — pushed in `140ae6c`, not tagged

- **Library:** `scrollText` keeps one visually hidden copy of the text for
  screen readers instead of an `aria-label` (forbidden on `<p>`/`<span>`/
  `<div>`, so a reader could get nothing); `readable()` in `src/text/index.ts`.
  `el.textContent` now has the text twice.
- **Site:** `apps/demo/scripts/test-a11y.mjs` (in CI after test-blocks): axe on
  all 64 pages under reduced motion plus every internal link — 0 violations,
  0 broken links after the fixes listed in CHANGELOG [Unreleased] → Site. The
  owner chose to grey non-current steps by colour, not opacity, in the
  pinned-feature-tour and video-scrub blocks and their recipes. axe 4.14 does
  not treat `overflow: clip` as hiding; the script excludes what a clip box
  cuts off at its centre.
- **Speed:** all pages were already "good"; Syne is no longer preloaded (fonts
  86 → 52 KB). `/docs` as a Server Component was tried 2026-11-06 and reverted: as a Server Component with a client sidebar it shipped 27 KB less JS but 41 KB more HTML (React's server payload repeats the content), and measured the same main-thread work (script 193 → 188 ms, all tasks 895 → 939 ms at CPU 4×, median of 7) with LCP the same or slightly worse. The script time is React, the router, the drawings and the copy buttons, not the content. Don't redo it without a new reason.
- Tagged and published 2026-11-07 (`v2.20.1` on `975dce6`, `v2.21.0` on `140ae6c`).

## IndexNow and true sitemap dates (2026-11-06, pushed in `975dce6`)

- After each production deploy Vercel reports to GitHub, `indexnow.yml` runs
  `apps/demo/scripts/indexnow.mjs`: the sitemap URLs dated on or after the
  previous production deploy's day go to api.indexnow.org (Bing, Yandex,
  Seznam, Naver…). Key `cff7b1aad337fe3f2e7de7398f3b57b9`, served from
  `apps/demo/public/`. `--dry-run` prints the request; `SITEMAP_URL` points it
  at a local `next start`; a manual run with "all" sends every URL.
- The sitemap's dates had sat at 2026-11-04 through a day of releases:
  `npm run sitemap:dates` was manual. It now counts uncommitted files as today,
  reads the component behind `/docs` and `/examples`, the registry behind
  `/blocks`, the recipes behind the example pages and the guides behind the
  framework pages, and `--check` runs in verify and CI (whose checkouts now
  fetch full history). CLAUDE.md says to run it before committing a page.
- **Bing refuses it for now:** runs on `975dce6` and `140ae6c` got 202; the
  runs on `44e4dfd` and `08467e6` got 403 "UserForbiddedToAccessSite", with the
  key file served correctly (checked with Bingbot's user agent too). A 403,
  429 or 5xx now warns (GitHub annotation) and exits 0; 400/422 and anything
  about the key file or the sitemap still fail.
- **Owner:** add the site to Bing Webmaster Tools and verify it first, then
  Actions → IndexNow → Run workflow, tick "all", once (the 35 unindexed
  pages); `gh workflow run` is blocked on this network.

## 2.20.0 (2026-11-06) — published, `v2.20.0` on `972d705`

- **Library:** `scrollPin`'s `pinDistance` takes `'150vh'`, measured from an
  element 100vh tall as CSS measures it (follows rotation and window resizes,
  not a phone's address bar, which moves `innerHeight` and fires a resize),
  and `'600px'`; a number is still fixed pixels; the default stays
  `window.innerHeight`; anything else warns once (`distance()` in
  `src/pin/index.ts`). Pin entry 1.6 KB (1.58), budget 1.6.
- **Tests:** `pin.spec.ts` resizes the viewport and simulates an address bar
  (`pin.html?distance=`), five unit tests in `scrollPin.test.ts`, mutations
  `pin/vh-follows` and `pin/vh-is-css`. A full run (about an hour) found three
  anchors stale since 2.19.0 — `pin/refresh`, `parallax/travel`,
  `parallax/axis` — re-anchored; all 82 caught. Run the full harness before
  claiming "all caught" again.
- **Docs and blocks:** examples write screens as `'300vh'`; the scroll-pin
  recipe and the pinned-feature-tour block (React, Vue, Svelte) use vh, and the
  block's registry dependency is `svg-scroll-draw@^2.20.0` (`build-registry`
  accepts a versioned one; `/blocks` counts packages by name). Until 2.20.0 is
  on npm, `shadcn add` for that block cannot resolve the version — push the
  tag soon after the commit.
- **Release:** the first through npm's trusted publisher: `npm view
  svg-scroll-draw@2.20.0 _npmUser` is GitHub Actions (`trustedPublisher:
  github`), with a SLSA provenance attestation.

## npm trusted publishing (2026-11-06)

npm restricts tokens that bypass 2FA from direct publishing in January 2027;
the release job used an `NPM_TOKEN` automation token. It now publishes with
npm 11 through npm's trusted publisher (npmjs.com → svg-scroll-draw → Settings
→ Trusted Publisher → GitHub Actions: `DhruvilChauahan0210` / `ink-scroll` /
`release.yml`, no environment, `npm publish` allowed).

1. ~~Trusted publisher added~~ — 2026-11-06.
2. ~~First release through it~~ — 2.20.0: `_npmUser` is GitHub Actions
   (2.19.1 shows the owner's account, `phantomcd0210`, published with the token).
3. `NODE_AUTH_TOKEN` and `--provenance` are out of `release.yml`, so there is no
   token fallback (not yet pushed when written). **Owner:** delete the
   `NPM_TOKEN` repository secret, revoke the automation token on npmjs.com,
   and set the package's Publishing access to "Require two-factor
   authentication and disallow bypass 2fa tokens".

## Dependencies (2026-11-06) — `660f363`, pushed; the Dependabot PRs closed

The eight open Dependabot PRs, worked locally rather than merged (main moves by
pushing `feat/homepage-redesign:main`, so merging a PR would make the two
diverge). Actions v7 / gh-release v3; Next 16.4.5, React 19.3.1, esbuild
0.28.2 and the other minor/patch updates; TypeScript 7, ESLint 10 and
`@types/node` 26 declined with the reason in `.github/dependabot.yml`. Checked:
`verify`, the browser suite, the demo checks and a sweep of all 64 sitemap
pages on the built site. PRs #1–#4 and #6–#9 are closed (#6–#8 by
Dependabot once the ignore rules landed); the work network blocks posting
GitHub comments, so the reasons are in `660f363`'s message and dependabot.yml. `npm audit`: 17 findings left, all in dev tools —
the 3 critical and 1 high are vitest 2 and its vite (vitest's major is a
deliberate step, ignored in dependabot.yml); the moderates are vitest, tsup's
own esbuild 0.27.7 and a `minimatch` inside typescript-eslint.

## 2.19.1 (2026-11-06) — published, `v2.19.1` on `2f7b711`

- **Library:** a staggered drawing finishes. With the default trigger the engine
  stopped as the drawing left the screen and every later path froze short of 1,
  so `onComplete` never fired on any page; it now follows the scroll off screen
  until the last window ends (`next()` / `inStaggerTail()` in `core/engine.ts`).
  Where the page ends before the last window, `fitStagger()` tightens the
  stagger evenly so the last path finishes at the bottom; a page with room
  keeps it exactly as written (the owner asked that existing drawings look the
  same).
- **Tests:** `e2e/stagger.spec.ts` + `fixtures/stagger-end.html`, five unit
  tests in `engine-options`, mutations `stagger/fit-page-end` and
  `stagger/offscreen-tail` (80). Main entry 11.4 KB.
- **Playwright 1.65.0** (Firefox 159): the `firefox-native` project is gone;
  `firefox` runs both parity suites on the real fast path, and
  `NATIVE_PROJECTS` in `e2e/helpers.ts` makes them fail if Chromium or Firefox
  stops taking it. 681 runs (227 per engine). After pulling, run
  `npx playwright install chromium firefox webkit` once.
- Released after 2.19.0. Both tags went out 22s apart and the runs raced:
  2.19.1 published first, so 2.19.0 took npm `latest` and GitHub's latest
  release; the owner moved both back (`npm dist-tag add svg-scroll-draw@2.19.1
  latest`, and "Set as the latest release" on GitHub). See the gotcha below.

## 2.19.0 (2026-11-06) — published, `v2.19.0` on `f131f9c`

The owner asked for four follow-ups, done overnight, then committed and pushed
on review.

- **Library:** one shared layout watcher (`src/core/layout-watch.ts`) for the
  animate, counter, progress, text, timeline and video engines (the draw engine
  and scrollHorizontal moved onto it); `refresh()` on scrollAnimate instances;
  measuring without the engine's own transform; stagger `getProgress()` = first
  path, as `onProgress`; React attributes on the element; Vue `<ScrollDraw>`
  takes every option and absent booleans stay absent; `<scroll-draw>`
  observedAttributes; Astro one live engine per element and kind; the Astro
  counter example fixed. Version 2.19.0 everywhere, sizes and claims updated,
  CHANGELOG and `/changelog` written.
- **Tests:** `e2e/layout.spec.ts` (+ `late-layout.html`), framework fixtures that
  write the real attribute, unit `layoutWatch` / `vueProps` / refresh / stagger;
  15 new mutations — all 78 caught; scrollPin resize mid-pin and scrollParallax travel fixed too.
- **Site:** framework pages with sections of their own
  (`apps/demo/src/data/framework-guides/`), measured shared text 40–50% → 9.5–15.9%;
  four new blocks with `npm run test:blocks --workspace=apps/demo` (needs the
  site running); `build-registry --check` in CI and `verify`.

- **Vue blocks (done):** `apps/demo/registry/vue/<name>.vue` for the nine blocks
  (written, browser-checked and reviewed for parity by a workflow); `build-registry.mjs`
  publishes them as shadcn-vue items at `/r/vue/<name>.json` (+ index) and
  `--check` covers them; `/blocks` shows each one's `shadcn-vue add` command and
  source; `node apps/demo/scripts/test-vue-blocks.mjs` compiles each SFC, styles
  it with its own Tailwind 4 CSS and runs it in Chromium (in CI after the
  recipes). The React sticky-feature block now re-observes when its steps are
  renamed — a reviewer found the highlight froze on a same-length rename.

- **Adversarial review before release (end of the night):** three reviewers on
  the library changes, each finding reproduced in a browser before it counted.
  Fixed: the layout watcher dropped a change landing before its first report
  (now compared with the box at observe time), stopped reporting for a second
  engine on the same element when one was destroyed (now counted), and threw in
  a document with no body; Vue `:trigger="null"` reached the engine; the
  `<scroll-draw>` key could not tell `once` added from absent; a second Astro
  kind on one element narrowed the MutationObserver filter, and an old Astro
  handle could destroy an engine a newer one used (handles are counted now);
  parallax on an SVG child resolved its percentage against the SVG viewport
  (`transform-box: fill-box`, restored on destroy); a re-measure measured the
  engine's own size props and fought a CSS transition (all of its props are
  put back, transitions off, while it measures). The scrollContainer /
  100%-tall-body gap it left open is closed too (see below).

### Done after the review (2026-11-06, the owner asked: "do them as well")
- The layout gap: the watcher also observes the boxes above each element, so
  growth inside a custom scrollContainer or on an `html, body { height: 100% }`
  page is heard (browser tests for both, mutation `layout/boxes-above`).
- Size: the watcher was compacted (543 → 473 B gzipped on its own); the main
  entry is 11.2 KB with every fix in.
- Svelte 5 versions of all nine blocks, published for shadcn-svelte without
  `path`, on /blocks, run by `test-svelte-blocks` in CI.
- `test:blocks` in CI: build the demo, `next start -p 3100`, run it (proven
  locally the same way).

### Found along the way
- A numeric scrollPin `pinDistance` is a fixed pixel count (a resize mid-pin is
  fixed in 2.19.0; the distance itself stays what you passed) — in "Next, in order".
- With `stagger`, the last path's window runs past `trigger.end` — fixed in 2.19.1.

## Background (2026-10-30, still true)

**2.10.1 is on npm** (`latest`, signed provenance via `release.yml`). It shipped
the shared devtools registry and the claims pass. The GitHub release page for
`v2.10.1` was not created (the job had `contents: read`, now `write`).

**2.10.2** shipped the day-2 work — see its CHANGELOG entry: `/blocks` + shadcn registry, agent skill, site-wide title fixes,
the ESM types fix, the `scrollVideo` re-seek fix, `<scroll-draw once>`, and the
`firefox-native` e2e project.

Numbers that set the priorities (Search Console and npm, 2026-10-30): 4,020
lifetime downloads, ~170 a month; 5 GitHub stars; 147 Google clicks in five
months, 81% to the homepage; `/vs-gsap` at position 11 with 425 impressions.

### Showcase sites (all 23 live from `main` since `32f3409`)
- Each example has a complete demo site for a fictional company under `/showcase/<slug>`,
  linked from its card and its page. The owner wants real products, not this site's ink
  style. Sites 5–23 are built on the shared frame in `src/showcase/kit` (`Site`, `Hero`,
  `Sec`, `Pricing`, `Quote`; brand variables on each site's root class, defaults in
  `:where(.sk)` so the site always wins).
- To change one: edit `src/showcase/<slug>/`; recapture its card image with Playwright
  at 1280×800 ×1.5, demo tab hidden and the nav made opaque, framed where the effect is
  drawn (not always the hero). Save it as `public/showcase/<slug>-<sha8>.webp` — the hash
  busts Next's image cache, a same-name file keeps serving the old picture — and point
  `SHOWCASE` in `src/showcase/index.ts` at it. Card copy and code live in
  `components/examples/scenes/data.ts`.
- The ink previews in `components/examples/ink/` are only used now for the `preview`
  field, which no card shows while a site exists (their `*.codes.ts` are deleted).
- Fictional brands only, no real logos; realistic copy; check desktop and 390px.

### Gotcha: intermittent Vercel production failures
- Twice on 2026-10-31 a production build failed (~3 min in) while the preview build of
  the same commit passed and local `vercel-build` passed; an identical re-run succeeded
  the first time. The logs need a Vercel login (the CLI isn't installed here). If it
  keeps happening, read the log in the dashboard before changing anything.

### Gotcha: bumping the version
- Replace only the pinned CDN URLs (`unpkg.com/svg-scroll-draw@x` and
  `cdn.jsdelivr.net/npm/svg-scroll-draw@x`), `package.json`, the lockfile and
  `SELF` in `competitors.ts`. A blanket `svg-scroll-draw@<old>` replace also
  rewrote history (an `npm dist-tag` command, an `_npmUser` check) and the
  blocks' `svg-scroll-draw@^x` minimum; fixed 2026-11-06.

### Gotcha: two releases at once
- npm makes whichever version publishes last `latest`, even a lower one, and
  only after it finishes processing (a few minutes after "+ pkg@x.y.z"); the
  release action marks each GitHub release latest when it creates it. So with
  two versions to release, push the second tag only after the first is on npm
  (`npm view svg-scroll-draw@<first> version` answers), or fix both afterwards:
  `npm dist-tag add svg-scroll-draw@<newest> latest` (needs `npm login` and a
  2FA approval in the browser) and "Set as the latest release" on GitHub.
- Tag each release on its own commit (`git tag vX.Y.Z <sha>`): the job fails
  when the tag disagrees with package.json at the tagged commit.

### Gotcha on this laptop
- The work network answers some `gh` writes with its own HTML page instead of
  passing them to GitHub ("invalid character '<'"): PR and issue comments (REST
  or GraphQL, so `gh pr close --comment` fails outright), release edits
  (`gh release edit`, or a PATCH with `make_latest`) and cancelling a run
  (`gh run cancel`, or the REST POST). Closing a PR works:
  `gh api -X PATCH repos/DhruvilChauahan0210/ink-scroll/pulls/<n> -f state=closed`.
  Put the reasons in the commit message instead (found 2026-11-06).
- The network intercepts TLS, and Node rejects api.github.com's certificate, so a
  plain `npm run dev` keeps serving a stale cached GitHub response. Run the dev server
  (and any local `vercel-build`) with `NODE_OPTIONS=--use-system-ca` (Node ≥ 22.15).
  Don't put that flag in package.json: it is for this laptop's network only
  (Node before 22.15 rejects it; CI runs 22 and 24 since 2026-11-06).
- Optional: a `GITHUB_TOKEN` env var on Vercel lifts GitHub's anonymous rate limit
  for the live stats chapter. Without one a refused refresh keeps the last good
  figures (`lib/live-data.ts`); "—" shows only before the first good answer.

### Adding a page (the redesign is done — every route uses `SiteShell`)
- Wrap the route in `components/site/SiteShell` (nav, tokens, sign-off footer), add
  it to `components/site/routes.ts` (keeps the mascot off it) and to
  `components/site/sitemap.ts` (`check-nav` fails otherwise), give it a `pg-head`
  opening and reuse the shared pieces: `CodeBox` listings, `Plate` previews, `tb`
  title strips, `pill`s, `StepRail`; comparison pages use the `VersusPage` template.

### Shipped since
- **Homepage redesign** (site-only, live from `main` at 760bfb6, 2026-10-31): every
  drawing a real use case, inked by the library over a pencil underdrawing — an
  exploded fountain-pen hero that assembles on scroll, the use-case gallery, the
  watch-movement chapter, a red-pen proof sheet, GSAP weighed on a balance, API
  blueprint plates, test gauges, a framework circuit board, before/after windows for
  the drop-ins, the project counted live (GitHub + npm, a 30-day download line, a
  "checked" timestamp) and an engineering-sheet footer; a glass nav that never moves;
  dark by default. Rejected along the way (don't revisit): SaaS cards, giant editorial type,
  generative ink, a torus knot, topo rings, railway/plug/camera metaphors for chapter 08.
- `/guides` — five migration guides, live from `main` (site-only).

- **2.15.1** — the "Element has no stroke" dev warning reads the computed stroke, so
  paths stroked from CSS (the whole homepage) stop flooding the console.
- **2.15.0** — React / Next.js hooks for the drop-ins: `useAOS` + `<AOSInit />`,
  `useScrollReveal`, `useVivus` (all `"use client"`). StackBlitz starters for each
  drop-in are live from `main`.
- **2.14.0** — `npx svg-scroll-draw migrate`: one command to switch from AOS,
  ScrollReveal or vivus.
- **2.13.0** — `svg-scroll-draw/vivus`, the vivus drop-in, with an exact
  SVG-markup parity suite against vivus 0.4.6, and the `/vs-vivus` page.
- **2.12.0** — `svg-scroll-draw/scrollreveal`, the MIT ScrollReveal drop-in, with a
  byte-for-byte inline-style parity suite against ScrollReveal 4.0.9.
- **2.11.0** — `svg-scroll-draw/aos`, the AOS drop-in, with a side-by-side parity
  suite against AOS 2.3.4. Watch npm weekly downloads for its effect.

### Next, in order
1. ~~Tag `v2.19.0` and `v2.19.1`~~ — both published 2026-11-06.
   2.20.0 published 2026-11-06 through npm's trusted publisher. The owner's
   last steps (delete `NPM_TOKEN`, revoke the token, disallow tokens) are in
   "npm trusted publishing" above.
2. ~~A staggered drawing that never finishes; Playwright 1.65.0 and folding
   `firefox-native` into `firefox`~~ — both done in 2.19.1 (2026-11-06).
3. **Owner:** create the `v2.10.1` GitHub release page by hand (its job lacked
   `contents: write`; from 2.10.2 the workflow creates it).
4. **Owner:** push the `v2.23.2` tag on its release commit (autoplay with a
   stagger: seek(1) finishes every path). 2.23.1 is out (2026-11-11).
5. **Owner, ~2026-11-18:** re-check Search Console for the new titles
   (`/vs-gsap` again on 2026-11-11, home, React, Next.js). Read on 2026-11-11:
   impressions halved the week of 2026-11-01, after the site-wide redesign,
   and position went from ~6 to ~12; 21 indexed, 42 "Discovered – not
   indexed", 8 external links. Leave ranking pages alone for 2–3 weeks; the
   lever is links from other sites: nine awesome-list PRs opened 2026-11-11
   (STATUS lists them); newsletter forms still to send. `/react-scroll-animation`
   got a comparison and FAQ the same day (was position 44) and Page indexing for the 35
   "Discovered – not indexed" pages (sitemap resubmitted 2026-11-04, 64
   discovered); request indexing ~10 a day (the daily quota). Compare CTR on
   `/docs`, `/vs-locomotive-scroll`, `/lenis-scroll-animation` and the
   scroll-pin post (titles changed 2026-11-04). Watch GitHub stars after the
   homepage finale (2026-11-04).
5. **Open, the owner's call:** the naming decision (see `ROADMAP.md`).
6. ~~A viewport-relative scrollPin `pinDistance`~~ — `'150vh'` in 2.20.0,
   measured as CSS's vh.

Recipes: all five planned are done — logo (`/examples/logo-reveal`), pinned
feature tour (`/examples/scroll-pin`), stat row (`/examples/scroll-counter`),
pinned film (`/examples/scroll-video`), case-study strip
(`/blog/horizontal-scroll-sections`). Pattern for another: `src/recipes/<slug>/`
files + `components/recipes/recipes.tsx` steps and pitfalls + a check in
`scripts/test-recipes.mjs`; a blog post uses `POST_RECIPE_SLUGS` and places
`RecipeSteps` / `RecipeFiles` / `RecipePitfalls` in its own sections, as
`components/recipes/StripRecipe.tsx` does.

---

## State at 2.10.0 (2026-08-14)

**2.10.0 is published (npm `latest`) and merged to `main`, tagged `v2.10.0`.
Phase 2 is complete — every priority, not just the coverage ones.**

Published by hand rather than through the release workflow, so this version has
no provenance attestation. Verified after the fact by unpacking the tarball from
the registry: both CDN builds present, `<scroll-draw>` registering in the
production one, and the corrected easing curves in `dist/index.mjs`.

Every entry point the package exports now has real-browser coverage in Chromium,
Firefox and WebKit, plus an SSR suite that runs with no DOM at all. The mutation
harness proves each new test fails against a deliberately broken build.

Ten defects came out of writing that coverage. The ones a user would have hit:

- **Both native fast paths ran the wrong easing curve** — the CSS keyword of the
  same name, which is a different curve, up to **0.069** apart. On
  `scrollAnimate`'s default easing, so Chrome and Safari rendered the same page
  differently.
- **The CDN bundle silently dropped `<scroll-draw>`** — `sideEffects` listed only
  the built output, so the bundler tree-shook the custom element out of the exact
  file the README tells CDN users to load.
- **Importing the web component on a server crashed the render** —
  `extends HTMLElement` at module scope, evaluated on import.
- **Re-measuring while scrolled moved the trigger window** for every
  `scrollContainer` caller: a `scrollHorizontal` strip scrubbed halfway snapped
  back to its first panel on a resize. Three engines, three copies of the same
  arithmetic.
- **`split: 'lines'` deleted the spaces between words** — "Every word here"
  rendered as "Everywordhere". Invisible in jsdom, where there is only ever one
  line.
- **A finished sequence reported 0% progress**, and its `pause`/`resume`/`seek`
  became silent no-ops.
- Plus: `scrollHorizontal`'s default distance ignoring `scrollContainer`,
  `scrollDrawTimeline.destroy()` leaving paths frozen mid-draw, its time-driven
  `loop` ignoring `prefers-reduced-motion`, and Astro's auto-init throwing in
  server frontmatter.

Unit coverage was ratcheted alongside: `group` 50→96%, `snap` 81→95%, `text`
80→96%, `devtools` 47→95%, overall 85→91%.

---

## What is left

### 1. Release follow-ups — done
- [x] `NPM_TOKEN` is in repo secrets: every release since 2.10.1 is a tag push,
      published by `release.yml` with signed provenance (latest: 2.15.3).
- [x] The workflow runs the browser suite remotely before publishing, on every
      release tag.
- [x] `release.yml` has a concurrency group per tag (2026-11-01): re-pushing a
      tag queues a second run instead of racing the first to `npm publish`.

### 2. Accuracy pass on the comparison pages — done
- [x] `CLAIMS-AUDIT.md` items: GSAP is described as free since 2025 everywhere
      (`/vs-gsap`, `data/competitors.ts`); AOS 6.7 KB and ScrollReveal 5.6 KB
      (GPL-3.0) are quoted as smaller than us.
- [x] 2026-11-01: the native CSS path is no longer called compositor work —
      `stroke-dashoffset` repaints on the main thread; what goes away is the
      per-frame script. Fixed on the native, performance and GSAP DrawSVG
      posts, the 2026 guide, `/docs`, the homepage, the Next.js landing,
      `llms.txt`, the root README and the `native` option's JSDoc. The native
      post's figure and scenario table are redrawn to match.
- [x] 2026-11-01: `/vs-aos` quotes the reveal entry (not the full bundle) and
      the seven real presets (`REVEAL_PRESETS` in `data/facts.ts`, held to the
      library by check:claims); AOS's stylesheet and Framer Motion's bundle
      come from `data/competitors.ts` (`cssKb`, `bundleKb`).

### 3. Site catch-up — `/verify` stops three fixes short
`/verify` is the page that shows each claim being true in a real browser, and it
still ends at the horizontal-scroll fix. Missing sections, in rough order of how
convincing they are:

- [x] A finished `scrollDrawSequence` reporting 100%. **Done (2026-08-15)** —
      section 13, `SequenceCompletionProof`. Measures 1.000 with `onComplete`
      fired, live.
- [x] `split: 'lines'` keeping its spaces. **Done (2026-08-15)** — section 14,
      `SplitLinesSpacingProof`. Counts whitespace before and after the split;
      currently 11 and 11.
- [x] Native-vs-JS easing parity — **section 15, live (2026-11-01).** The 0.83
      below was the page's harness: the native cell's React key was its label,
      which changes once support is detected, so React replaced the cell after the
      library attached. `e2e/parity.spec.ts` already had an ease-out case passing
      on every engine. Keyed by role it reads 0.0001. Kept below as the record.
      What follows is the original write-up, from when it was **built, withheld,
      and turned up a number that needed explaining before it shipped.**

      `EasingParityProof` in `apps/demo/src/components/VerifyPhase3.tsx` is
      written and works; it is deliberately not wired into `/verify`.

      What it measures, using the same deterministic sweep as
      `LiveParityProof` (step to 10 fixed offsets, wait four frames, read
      `strokeDashoffset` on both):

      | config | worst Δ mid-draw |
      |---|---|
      | `{ native: true }` vs `{ native: false }` — section 06's control | **0.0000** |
      | the same, plus `easing: 'ease-out'` on both | **0.8271** |

      One variable changed. Reproduce by wiring the component into `/verify`
      and pressing "Run the sweep" in a browser with
      `animation-timeline: view()` support.

      Why it is not published as a verdict:

      - 0.83 is far too large to be a timing-function difference. Two easing
        curves cannot be 0.83 apart at the same progress. That points at the
        **animation range**, not the curve — the native side appears to finish
        much earlier rather than follow a different shape.
      - `nativeEligible()` allows a named easing through (`cssTiming` is the
        only easing gate) and only the default trigger reaches `buildNative()`,
        so both sides should be walking the same `cover` range.
      - It is one new harness, on one browser, written in the same session. The
        first version of it reported a false 0.86 from compositor commit lag
        before the sweep was made deterministic, which is precisely the trap
        `VerifyPhase1` documents. It may still be measuring wrong.

      Next step is to settle it in the e2e suite rather than in the page:
      extend `e2e/parity.spec.ts` with an `ease-out` case. If it reproduces
      there, it is a real 2.10.x bug in `buildNative`'s range or keyframe
      emission and the fix is a release. If it does not, the harness is wrong
      and should be corrected before the section ships.

The docs page itself is done — it shipped with the release: a v2.10.0 group for
`refresh()`, the timeline's reduced-motion option and the dev CDN build, and the
native-CSS section now names the four easings the fast path accepts and says they
are emitted as this library's curves rather than the CSS keywords. What is
missing is the *demonstration*, which is what `/verify` is for.

### 4. Option reactivity across the wrappers — done (2.17.0)
Decided "re-create on change". React, Vue (+ Nuxt), Solid and Svelte rebuild the
engine when an option really changes and keep it for equal options; Angular has
`update()` for `ngOnChanges`. The comparison is `optionsKey` in
`src/core/reactive.ts` (values compared, functions present/absent, elements by
identity) and callbacks are read live (`liveFns`). The browser suite checks both
halves. Left: Astro and `<scroll-draw>` still read their options once.

### Known browser differences, pinned rather than fixed
- Past the end of a `view()` range, Chromium and WebKit hold the animation's end
  state while **Firefox** treats the now-inactive timeline as unresolved and holds
  the *start* state instead — the same card reads 1 in Chrome and 0 in Firefox.
  Not visible: the `cover` range spans exactly the offsets where any part of the
  element is in the scrollport, so the engines only disagree while it is off-screen,
  and it recovers on the frame it re-enters. `group.spec.ts` asserts that property
  rather than a browser name, so a Firefox fix will not fail the suite.
- The jump-scroll asymmetry from Phase 1 still stands (`parity.spec.ts`), and now
  bites the tests too: the JS engine only writes while the element is intersecting,
  so a spec that jumps *past* a target instead of scrolling through it sees an
  undrawn element. Walk the offsets.

### Conventions worth keeping

- New fixtures go through `e2e/helpers.ts` (deterministic sweep) and
  `e2e/fixtures/_probe.mjs` (parse in the page, assert on numbers in the spec).
- Add a mutation to `scripts/mutation-check.mjs` for every new behaviour asserted.
  A `MISSED` result means either the test is weak or the mutated code is dead — the
  counter's redundant initial write was found exactly that way. There is a third
  case now: a difference too small for a browser test to resolve. Substituting the
  CSS keyword for `ease-in-out` is wrong by 0.0119, inside the 0.02 the parity specs
  must allow for sub-frame timing, so that curve is pinned in
  `src/__tests__/css-easing.test.ts` (tolerance 1e-3) and the harness carries a
  comment saying why it has no browser mutation. Prefer that to loosening a
  tolerance or leaving a permanent MISSED.
- Anything time-driven cannot be checked with a sweep — the replay can start and
  finish between two `read()` calls. `timeline.html` instead has the page count the
  movement itself, every frame, and only counts changes that happen while
  `window.scrollY` did not move: that is the exact claim ("it animated without
  scroll input"), and it cannot be raced.
- Fixture arithmetic assumes the 900x800 viewport pinned per-project in
  `e2e/playwright.config.ts`. Assert the geometry in the first test of each spec so
  a layout drift fails loudly instead of silently sampling the wrong offsets.

---

## What shipped this session (v2.6.0 → v2.7.0)

### Library
- [x] **Scroll callbacks** — `onEnter`, `onLeave`, `onEnterBack`, `onLeaveBack` on `scrollAnimate` + `scrollDraw`
- [x] **`scrollPin`** (`svg-scroll-draw/pin`) — wrapper-based element pin with full lifecycle callbacks
- [x] **`scrollSnap`** (`svg-scroll-draw/snap`) — JS section snapping with `snapTo()` + `onSnap`
- [x] **`createLenisAdapter`** (`svg-scroll-draw/lenis`) — `window.scrollY` patcher for a scroller with a virtual position (Lenis 1.x needs none; `destroy()` restores the browser's property since 2.26.0)
- [x] 30 new tests → 388 total, build clean

### Demo site
- [x] **`/vs-gsap` page** — bundle bars, feature matrix (20 rows), side-by-side API code, license comparison, CTA
- [x] **Home page v2 grid** — 3 new cards: `scrollPin`, `scrollSnap`, `onEnter/onLeave`
- [x] **Blog post** — "Pin sections on scroll without GSAP" at `/blog/scroll-pin-without-gsap`
- [x] Blog index updated, bundle chart links to `/vs-gsap`, JSON-LD v2.7.0, MobileMenu v2.7.0

---

## What also shipped this session

- [x] Docs page v2.7.0 section — scrollPin, scrollSnap, Scroll Callbacks, Lenis Adapter (full option tables)
- [x] scrollAnimate docs table updated with onEnter/onLeave/onEnterBack/onLeaveBack
- [x] Docs version badge → v2.7.0
- [x] Examples page — scrollPin "Sticky Feature Panel" + scrollSnap "Horizontal Snap Carousel" live demos
- [x] v2.7.0 published to npm

## What also shipped (v2.8.0)

- [x] `scrollReveal` (`svg-scroll-draw/reveal`) — 7 presets, stagger, custom from state, onEnter/onLeave
- [x] `velocityScale` on `scrollAnimate` — speed scales with scroll velocity
- [x] `ResizeObserver` auto-refresh on `scrollPin`
- [x] 407 tests passing, build clean
- [x] Blog post: "Replace AOS / ScrollReveal.js" at `/blog/replace-aos-scrollreveal`
- [x] Home page grid: 10 API cards (added scrollReveal v2.8.0)
- [x] Docs: v2.8.0 nav group (scrollReveal + velocityScale), badge → v2.8.0

## What shipped (v2.9.0)

### Library
- [x] `scrollProgress` (`/progress`) — CSS custom property binding (`--scroll-progress`, `--scroll-progress-eased`)
- [x] `scrollHorizontal` (`/horizontal`) — Apple-style vertical→horizontal scroll sections
- [x] 478 tests passing, build + TS clean

### Demo site
- [x] scrollReveal example card on ExamplesPage (cascade demo)
- [x] `/vs-aos` — svg-scroll-draw vs AOS vs ScrollReveal.js comparison page
- [x] `/vs-framer-motion` — comparison page with side-by-side API + honest "when FM wins"
- [x] Blog: "Horizontal scroll sections without GSAP" at `/blog/horizontal-scroll-sections`
- [x] Home page: 12 API cards (added scrollProgress + scrollHorizontal v2.9.0)
- [x] Docs: v2.9.0 nav group + DocSections, badge → v2.9.0, MobileMenu → v2.9.0

## Track B distribution content shipped

- [x] **v2.9.0 published**
- [x] `/react-scroll-animation` — React landing page targeting "react scroll animation library"
- [x] `/nextjs-scroll-animation` — Next.js landing page targeting "next.js scroll animation"
- [x] `/vs-aos` — comparison vs AOS + ScrollReveal.js
- [x] `/vs-framer-motion` — comparison vs Framer Motion
- [x] Blog: "Complete guide to scroll animations in 2025" (cornerstone, 12 patterns)
- [x] Blog: "Scroll animation performance — native CSS vs JS"
- [x] Home page: Compare + Framework guides section (6 links)
- [x] Blog index: 14 posts total

## Remaining tasks

### What's left
See "What is left" at the top of this file. Phase 2 is closed; the queue after
publishing is Priorities 4–5 in `ROADMAP.md` — the naming decision, then the
migration guides and recipes.
- More blog posts targeting "GSAP alternative" searches

### TASK 2 — Distribution & growth
- Post to Reddit r/webdev, Product Hunt, dev.to
- Submit to "awesome scroll animation" GitHub lists
- Cross-post the `/vs-gsap` page in GSAP-related communities

---

## Guardrails
- **Don't publish without bumping version** — 2.10.0 is already staged in
  `package.json`, the changelog and every site badge, so the next publish after it
  is v2.11.0
- **Publish through the release workflow, not from a laptop** — the provenance
  attestation is the point of it
- **Don't post to external platforms** — user posts manually
- **Always update STATUS.md + ROADMAP.md + CHANGELOG.md + NEXT-SESSION-PLAN.md after any code change**
- Numbers are checked, not remembered: `node scripts/check-claims.mjs` reads the
  suites and fails if any doc disagrees. Run it rather than editing counts by hand.
