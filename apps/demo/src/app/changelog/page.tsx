import React from 'react';
import type { Metadata } from 'next';
import '@/components/changelog.css';
import { SELF } from '@/data/competitors';
import { SiteShell } from '@/components/site/SiteShell';
import { BreakLine, ReleaseChart, type ChartBar } from '@/components/changelog/ChangelogArt';

export const metadata: Metadata = {
  title: 'Changelog — Release History',
  description:
    'Release history for svg-scroll-draw, the scroll-driven SVG animation library: what shipped in each version, from native CSS scroll timelines to new APIs.',
  alternates: { canonical: '/changelog' },
  openGraph: {
    title: 'Changelog — svg-scroll-draw',
    description:
      'Complete release history for svg-scroll-draw. Native CSS scroll animation, stroke-dashoffset, React/Vue/Svelte support and more.',
    url: 'https://svg-scroll-draw.vercel.app/changelog',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Changelog — svg-scroll-draw',
    description:
      'Complete release history for svg-scroll-draw. Native CSS scroll animation, React/Vue/Svelte/Nuxt support.',
  },
};

const GH  = 'https://github.com/DhruvilChauahan0210/ink-scroll';
const NPM = 'https://www.npmjs.com/package/svg-scroll-draw';

/** What an entry is: an addition, a fix, test coverage, the site and docs, or the build. */
type Kind = 'new' | 'fix' | 'test' | 'site' | 'ci';
type Release = {
  version: string;
  /** One line on what the release was about. */
  title: string;
  /** ISO date where CHANGELOG.md records one, otherwise the month. */
  date: string;
  tag?: string;
  items: { type: Kind; text: string }[];
};

/** The order a release's groups are read in, and what each is called. */
const KINDS: { k: Kind; label: string }[] = [
  { k: 'new', label: 'Added' },
  { k: 'fix', label: 'Fixed' },
  { k: 'test', label: 'Tests' },
  { k: 'site', label: 'Site & docs' },
  { k: 'ci', label: 'Build & CI' },
];

/*
 * The release log, newest first. Like CHANGELOG.md this is history: figures
 * here are what each release said at the time (check:claims exempts this
 * file), so they are never updated to today's numbers.
 */
const RELEASES: Release[] = [
  {
    version: '2.19.0',
    title: 'Every engine follows the page',
    date: '2026-11-06',
    items: [
      { type: 'fix', text: 'scrollReveal, scrollAnimate (on its JS path, the only one in Firefox and Safari), scrollCounter, scrollProgress, scrollText, scrollDrawTimeline and scrollVideo re-measure when the layout moves, not only when the window resizes. With 480px arriving above them after load, every one of them used to run as if it had not.' },
      { type: 'fix', text: 'A re-measure leaves out the engine’s own transform, so scrollReveal’s fade-up no longer starts 32px late after a resize.' },
      { type: 'fix', text: 'getProgress() agrees with onProgress under stagger: both report the first path. They disagreed by up to 0.6.' },
      { type: 'fix', text: 'A window resized while scrollPin is pinned moves the element with its wrapper; it kept its old size and position until it unpinned.' },
      { type: 'fix', text: 'scrollParallax travel is a percentage of the layer’s own size, so a layer that grows after load travels its new height, not its first.' },
      { type: 'fix', text: 'React components put id, role, title, aria-* and data-* on the element instead of in the options. Vue’s <ScrollDraw> takes every option (it took 12 of 35), and an absent boolean prop stays absent instead of turning false.' },
      { type: 'new', text: '<scroll-draw> and the Astro scanner follow their options, as the other wrappers do since 2.17.0; running an Astro init again keeps the engine it started. refresh() on scrollAnimate instances.' },
      { type: 'test', text: 'A fixture with all seven engines under a layout that moves; framework fixtures that change the real attribute; 15 new mutations, 78 in all, each caught.' },
      { type: 'site', text: 'Each framework page has sections of its own on how its wrapper works, and quotes its own entry size. Four new blocks: a pinned feature tour, a horizontal case strip, a scrubbed video and a reading-progress bar. Every block now has a Vue and a Svelte version, installed with shadcn-vue or shadcn-svelte and run in a browser in CI.' },
    ],
  },
  {
    version: '2.18.1',
    title: 'A strip that follows the page',
    date: '2026-11-05',
    items: [
      { type: 'fix', text: 'scrollHorizontal re-measures when the window, the page, the track or its runway changes size, so a resize, a late image inside a panel or a hero loading above no longer leaves the strip short of its last panel, past it, or moving before the stage pins. A paused or seeked strip keeps its place.' },
      { type: 'fix', text: 'The default distance is the track minus the sticky stage it is seen through, not minus the window: a strip in a page container narrower than the window reaches its last panel, and a classic scrollbar no longer hides its last 15 px.' },
      { type: 'test', text: 'Four browser tests on all three engines, seven unit tests, and two new mutations: 63, each caught by the test named for it.' },
      { type: 'site', text: 'The horizontal scroll post is a full recipe: a case-study strip in five steps, its React and HTML files run in a browser in CI, and five ways it goes wrong, measured on the file.' },
    ],
  },
  {
    version: '2.18.0',
    title: 'A film in a sticky stage',
    date: '2026-11-05',
    items: [
      { type: 'new', text: 'scrollVideo takes triggerElement: point it at the tall track behind a sticky stage and the film scrubs exactly while the stage is stuck, even across a resize mid-pin. The same option scrollAnimate has had.' },
      { type: 'site', text: 'Four examples are now full recipes: the logo, the pinned feature tour, the stat row and the pinned film, each with steps, the complete files run in a browser in CI, and the ways it goes wrong. /examples marks them and can filter to them.' },
    ],
  },
  {
    version: '2.17.1',
    title: 'once keeps the stagger',
    date: '2026-11-04',
    items: [
      { type: 'fix', text: 'With once and stagger together, every path drew as one and onComplete fired after the first: a single held value was shared by all paths. Each path now holds its own progress.' },
      { type: 'site', text: 'The logo example is a full recipe: four steps with a figure each, the complete component beside it running, the same logo as one HTML file, and five ways it goes wrong. The HTML file is run in a browser in CI.' },
    ],
  },
  {
    version: '2.17.0',
    title: 'Wrappers follow option changes',
    date: '2026-11-04',
    items: [
      { type: 'new', text: 'The React, Vue, Nuxt, Solid and Svelte wrappers rebuild the animation when an option changes, and Angular gets update() for ngOnChanges. Options are compared by value, so an inline object recreated each render keeps the running animation, and callbacks are read live without a rebuild.' },
      { type: 'test', text: 'The browser suite checks both halves on every engine: a changed speed reaches the running draw, and a re-render with equal options keeps the same engine.' },
    ],
  },
  {
    version: '2.16.1',
    title: 'Server Components render the components',
    date: '2026-11-04',
    items: [
      { type: 'fix', text: 'svg-scroll-draw/react ships with "use client", so a Next.js Server Component can render <ScrollDraw>, <ScrollAnimate> and the rest directly; only options that are functions, such as onProgress, still need a client component of your own. The drop-ins’ React hooks already carried it.' },
      { type: 'test', text: 'A unit test reads the built files: every React entry starts with the directive and no shared chunk does. The demo renders <ScrollDraw> from a Server Component, so its build fails without the directive. Three mutations whose code had moved (reveal stagger, video scrub and direction) point at it again, so all 56 run.' },
    ],
  },
  {
    version: '2.16.0',
    title: 'Entries share one engine',
    date: '2026-11-01',
    items: [
      { type: 'new', text: 'ES module entries share code through chunks instead of each bundling its own copy of the engine. Main + /react drops from 18.1 to 13.2 KB as shipped files; an app on five entries drops from 16.3 to 9.4 KB under Vite and from 22.8 to 10.2 KB under webpack. Published paths, exports and the CommonJS, CDN and CLI builds are unchanged.' },
      { type: 'fix', text: 'The drop-ins and their React hooks share one instance under ESM: AOS.refresh() from svg-scroll-draw/aos now reaches the instance useAOS started, and the same holds for the ScrollReveal and vivus hooks.' },
      { type: 'site', text: 'Entry sizes now count every chunk an entry imports, as shipped files — the way the compared libraries are measured. With no bundler each entry pays 0.1–0.5 KB for the lines that join it to its chunks (main 10.7 KB); through a bundler none grew, and scrollPin went from 1.6 to 1.4 KB. Both READMEs’ size tables are generated and checked.' },
    ],
  },
  {
    version: '2.15.3',
    title: 'scrollReveal’s stagger cascades',
    date: '2026-11-01',
    items: [
      { type: 'fix', text: 'scrollReveal’s stagger works. It was documented in seconds but moved each trigger by a few pixels (about 2.5px at the default), and a custom trigger switched it off. It is now a fraction of the reveal window: each element in a row starts that far into its neighbour’s reveal (default 0.15), rows are read from the layout so long lists are not pushed down the page, and the offset applies on top of a custom trigger. The reveal entry is 4.7 KB gzipped.' },
      { type: 'test', text: 'Six unit tests pin the trigger window each element gets; the browser cascade test now runs at the default stagger and requires a visible step, and a row with a custom trigger must cascade too.' },
      { type: 'site', text: 'The native option’s documentation no longer says the draw runs on the compositor: browsers repaint stroke-dashoffset on the main thread. What the native path removes is the per-frame JavaScript.' },
    ],
  },
  {
    version: '2.15.2',
    title: 'scrollVideo keeps its end frame under reduced motion',
    date: '2026-11-01',
    items: [
      { type: 'fix', text: 'scrollVideo under prefers-reduced-motion: the clip shows its last frame once, as documented, but the scroll loop started anyway when the video came into view and — with no trigger window measured — sought it back to frame 0. The loop now returns early under reduced motion, so the end frame stays.' },
      { type: 'test', text: 'A browser test turns reduced motion on, scrolls the clip into view at three positions and expects the last frame each time, in Chromium, Firefox and WebKit. It fails on 2.15.1.' },
    ],
  },
  {
    version: '2.15.1',
    title: 'Dev warnings read the computed stroke',
    date: '2026-10-31',
    items: [
      { type: 'fix', text: 'No more "Element has no stroke" for paths stroked from CSS. The development check read only the stroke attribute, so every path styled with a class, a stylesheet or Tailwind’s stroke-current was reported as invisible while it drew perfectly well — on this project’s own homepage, hundreds of warnings per page load. It now reads the computed stroke, reports a stroke that CSS turns off, and is skipped outright in production builds.' },
      { type: 'test', text: 'Three unit tests for the computed-stroke check, and the CDN dev-build fixture now carries paths stroked from a stylesheet and from an attribute that must stay silent in Chromium, Firefox and WebKit.' },
      { type: 'site', text: 'Homepage redesign — every drawing on the new homepage is something people build with the library, inked by the library over a faint pencil underdrawing and annotated with real values. Dark is now the site default.' },
      { type: 'site', text: 'Migration guides at /guides — AOS in Next.js and React, ScrollReveal in React and Next.js, vivus in React — each leading with npx svg-scroll-draw migrate, the hook, a StackBlitz starter and what stays the same.' },
      { type: 'site', text: 'The live project stats print when their numbers were fetched, so a failed hourly refresh can no longer serve a stale copy quietly.' },
      { type: 'ci', text: 'Vercel builds no longer run out of memory: vercel-build builds the library four tsup configs at a time, peaking around 1.2 GB instead of 4 GB, with byte-for-byte identical output.' },
    ],
  },
  {
    version: '2.15.0',
    title: 'React and Next.js hooks for the drop-ins',
    date: '2026-10-31',
    items: [
      { type: 'new', text: 'svg-scroll-draw/aos/react — useAOS(options, refreshKey?) and <AOSInit />. Initialises on mount and destroys on unmount, which is what StrictMode and route changes trip up in hand-written effects; refreshKey re-measures.' },
      { type: 'new', text: 'svg-scroll-draw/scrollreveal/react — useScrollReveal(options) returns a ref and reveals that element, or its selector children for interval sequences, cleaning up on unmount.' },
      { type: 'new', text: 'svg-scroll-draw/vivus/react — useVivus(options, callback) returns [ref, vivus] and destroys the instance on unmount.' },
      { type: 'test', text: 'A React 18 app in StrictMode with a state-driven route change runs all three hooks in Chromium, Firefox and WebKit; dropping useAOS’s cleanup fails it. Checked separately in a real Next.js 16 App Router app.' },
      { type: 'site', text: 'examples/aos, examples/scrollreveal and examples/vivus — pages written for the original library with only the import changed, opening on StackBlitz with no install.' },
    ],
  },
  {
    version: '2.14.0',
    title: 'One command to migrate',
    date: '2026-10-31',
    items: [
      { type: 'new', text: 'npx svg-scroll-draw migrate switches a project from AOS, ScrollReveal or vivus to the drop-ins in one command: imports, requires and CDN script tags point at the matching entry, AOS’s stylesheet is removed and package.json swaps the dependencies. It touches module names, URLs and dependency entries only, previews with --dry-run, and will not write over uncommitted changes without --force.' },
      { type: 'new', text: 'npx svg-scroll-draw help; an unknown command now says so instead of starting init.' },
      { type: 'test', text: 'The AOS and ScrollReveal parity specs wait for the reference library and the drop-in to agree at each scroll stop instead of reading both after one fixed wait. A real difference never converges, so breaking AOS’s anchor-placement rule still fails at the exact element.' },
    ],
  },
  {
    version: '2.13.0',
    title: 'A drop-in for vivus',
    date: '2026-10-31',
    items: [
      { type: 'new', text: 'svg-scroll-draw/vivus — a drop-in replacement for vivus 0.4, which has not shipped since April 2021. new Vivus(element, options, callback) and every method, option, animation type, start mode and timing function behave as in 0.4.6, quirks included.' },
      { type: 'site', text: '/vs-vivus comparison page. Competitor entries can now carry their own measuredOn date.' },
      { type: 'test', text: 'vivus 0.4.6 runs beside the drop-in in Chromium, Firefox and WebKit across nine configurations, and every generated path and dash value must match exactly at eleven points of the animation.' },
      { type: 'ci', text: 'npm run verify and CI build the library before typechecking the demo, which resolves svg-scroll-draw through dist/ and was being checked against whatever an earlier build left there.' },
    ],
  },
  {
    version: '2.12.0',
    title: 'A drop-in for ScrollReveal, under MIT',
    date: '2026-10-31',
    items: [
      { type: 'new', text: 'svg-scroll-draw/scrollreveal — a drop-in replacement for ScrollReveal.js 4, under MIT (ScrollReveal is GPL-3.0 and has not shipped since 4.0.9). Every method and option, including interval sequences, reset, viewFactor and the four callbacks, writing the same inline styles, data-sr-id and sr class.' },
      { type: 'new', text: 'Deliberate differences: nothing runs on import, and reduced motion shows the final state with no transition.' },
      { type: 'test', text: 'ScrollReveal 4.0.9 runs beside the drop-in in all three engines, and every element’s style attribute, data-sr-id and callback history must match exactly.' },
      { type: 'test', text: 'The idle-cost browser test counts work instead of timing it. Its millisecond ceiling flaked in Firefox under load with nothing regressed; it now counts update runs, and removing the idle short-circuit fails it in all three engines.' },
    ],
  },
  {
    version: '2.11.0',
    title: 'A drop-in for AOS',
    date: '2026-10-30',
    items: [
      { type: 'new', text: 'svg-scroll-draw/aos — a drop-in replacement for AOS. Existing data-aos markup runs with no aos.css: init, refresh, refreshHard, every data-aos-* attribute and the stylesheet’s transforms, matched rule for rule against AOS 2.3.4, plus AOS 3’s mirror, anchorPlacement and events.' },
      { type: 'new', text: 'Deliberate differences: reduced motion shows the final state, disable: \'mobile\' checks viewport width, positions re-measure on load, and destroy() exists for single-page apps.' },
      { type: 'site', text: '/vs-aos leads with "Switch from AOS in one line".' },
      { type: 'test', text: 'AOS 2.3.4 and the drop-in run side by side in Chromium, Firefox and WebKit, and the animated set must match at every scroll stop, down and back up, across three init() configurations.' },
    ],
  },
  {
    version: '2.10.2',
    title: 'Copy-paste blocks, and the right types for ESM',
    date: '2026-10-30',
    items: [
      { type: 'new', text: 'Copy-paste blocks at /blocks — signature draw, reveal cards, stat counter row, sticky feature, headline text reveal — each one React + Tailwind file, installed with the shadcn CLI.' },
      { type: 'new', text: 'An agent skill in skills/svg-scroll-draw/, with API, recipes and GSAP-migration references.' },
      { type: 'fix', text: 'TypeScript resolved the wrong types for ESM users: every export pointed types at the CommonJS .d.ts. Each export now has import → .d.mts and require → .d.ts, and attw reports no problems.' },
      { type: 'fix', text: 'scrollVideo re-seeked the video on every frame while it was visible, keeping the decoder seeking about 60 times a second on a page at rest. It now seeks only when the target time changes.' },
      { type: 'fix', text: 'scrollPin missed the pinned element itself growing; the element is now observed as well as the wrapper and the document.' },
      { type: 'fix', text: '<scroll-draw once> was ignored. The element now reads the attribute, and once="false" reads as off.' },
      { type: 'test', text: 'A firefox-native e2e project turns on Gecko’s scroll-driven animations and runs both native-vs-JS parity suites, failing if the fast path does not engage.' },
      { type: 'site', text: 'Every page title is 60 characters or fewer, and /react-scroll-animation no longer lists a React hook that does not exist.' },
    ],
  },
  {
    version: '2.10.1',
    title: 'The trust release',
    date: '2026-10-30',
    items: [
      { type: 'fix', text: 'devtools showed "No active instances" for code imported from another entry: each built entry carried its own copy of the instance registry. It now lives on globalThis, created on first use.' },
      { type: 'fix', text: 'scrollDraw never registered with devtools at all, on any of its three paths, and neither did scrollAnimate’s native path, scrollSnap, scrollDrawTimeline or Cinematic. All do now, and unregister on destroy().' },
      { type: 'site', text: 'Claims corrected across the npm README and the site: the SplitText size and licence, an unmeasured coverage figure, the native fast path’s browser versions (Safari 26+, Firefox 159+), and the size multiple against GSAP, now the measured 4.4× against core + ScrollTrigger.' },
      { type: 'ci', text: 'check-claims reads the npm README, the whole demo source and llms.txt, checks every per-API size against its built entry, and fails if a corrected claim comes back.' },
      { type: 'new', text: 'examples/vanilla and examples/react — two starters that open on StackBlitz with no install.' },
    ],
  },
  {
    version: '2.10.0',
    title: 'What jsdom could not see',
    date: '2026-08-14',
    items: [
      { type: 'fix', text: 'Both native CSS fast paths ran a different easing curve from the JS engine they replace. ease-in and ease-out here are quadratics; the CSS keywords of the same name are fixed cubic-beziers, and they differ by up to 0.069 — around 7 points of progress mid-scroll. The fast path only engages where the browser supports animation-timeline: view(), so the same page animated one way in Chrome and Firefox and a measurably different way in Safari, which always falls back to the JS engine. scrollAnimate defaults to ease-out, so this was the default configuration. Both engines now emit a timing function that reproduces the JS curve exactly.' },
      { type: 'fix', text: 'The CDN bundle dropped the <scroll-draw> web component — caught before release, so no published version shipped without it. The sideEffects field added during this cycle listed only the built output, while the bundle is built from source, so the bundler tree-shook the custom element out of the very file the README tells CDN users to load. Verified against the published 2.9.0 tarball, which registers the element correctly.' },
      { type: 'fix', text: 'Importing svg-scroll-draw/web-component on a server threw ReferenceError: HTMLElement is not defined, taking the whole render down. The class is now defined inside the same guard as the registration, so it degrades to a no-op like every other entry point.' },
      { type: 'fix', text: 'A finished scrollDrawSequence or scrollAnimateSequence reported 0% progress: the active-step cursor walked past the end of the array, so getProgress() returned 0 at the exact moment everything had completed, and pause(), resume() and seek() became silent no-ops.' },
      { type: 'fix', text: 'Any re-measure while scrolled shifted the trigger window for custom scrollContainer callers. The element offset inside a scroll container already includes the scroll position, and it was being added a second time — so a resize mid-scroll moved the window by however far the user had scrolled. A scrollHorizontal strip scrubbed halfway snapped back to its first panel with no scrolling at all. Three engines had their own copy of the arithmetic, and all three of it.' },
      { type: 'fix', text: 'scrollHorizontal’s default distance ignored scrollContainer, subtracting the window width regardless — so inside a container narrower than the viewport the strip overshot the last panel and parked on empty space, and every nested-container caller had to pass distance by hand.' },
      { type: 'fix', text: 'split: \'lines\' in scrollText threw away the spaces between words. It groups word spans by offsetTop and moved only the words, leaving behind the whitespace spans the splitter creates to hold the gaps open, so "Every word here" rendered as "Everywordhere". Only visible with real layout, which is why jsdom never saw it.' },
      { type: 'fix', text: 'scrollDrawTimeline.destroy() left every path frozen on its last frame, and with fade also half-transparent, for the rest of the page’s life. It now restores what it wrote, like every other module.' },
      { type: 'new', text: 'refresh() on scrollDraw, scrollDrawTimeline and the group APIs — re-measure path lengths and the trigger window after a layout change that fires no resize, such as a tab switching or a font swapping inside a fixed-height box. scrollPin and scrollHorizontal already had it.' },
      { type: 'new', text: 'respectReducedMotion on scrollDrawTimeline (default true), covering the time-driven loop only. Scroll scrubbing advances 1:1 with the user’s own input and keeps working; the loop replays off a timer with no scroll input at all, which is autonomous motion, and it had no check whatsoever.' },
      { type: 'new', text: 'A development CDN build — svg-scroll-draw.dev.global.js. IS_DEV was derived from process.env.NODE_ENV, and process does not exist in a browser without a bundler, so every warning this library has was invisible to exactly the users with the fewest other diagnostics. The production CDN build now drops those warnings at build time instead of shipping and skipping them.' },
      { type: 'test', text: 'Browser coverage for all eight framework wrappers — React, Vue, Solid, Svelte, Angular, Astro, Nuxt and the web component — mounted for real and held to one contract: the engine runs, unmounting stops it (no leaked observers, no leaked frame loop), re-mounting works, and option changes reach the engine only where the wrapper says they do. Roughly a thousand lines that had been excluded from coverage because jsdom cannot mount them.' },
      { type: 'test', text: 'An SSR suite that runs with no DOM at all, covering every entry point: importing must not throw, and every public API must return an inert instance rather than reaching for document. Astro’s auto-init helpers defaulted their root to document at call time, so calling one from component frontmatter — on the server, which is Astro’s default — threw instead of doing nothing.' },
      { type: 'fix', text: 'scrollHorizontal never moved the track in its own documented setup. The default trigger window was measured against the track, and a position:sticky stage pins that track at exactly one stage tall — so both ends resolved to the same scroll position, clamping progress at 0 forever. It had 100% line coverage in jsdom the whole time it was broken: every rect there is 0, so the window is equally degenerate and looks identical to a working one. The trigger is now measured from the container that actually holds the scroll room.' },
      { type: 'new', text: 'triggerElement on scrollHorizontal and scrollAnimate — measure the trigger window from an element other than the animated one. Needed when the animated element is sticky-pinned and cannot supply the scroll length itself. Setting it disables the native CSS fast path, since animation-timeline: view() can only measure its own subject.' },
      { type: 'new', text: 'respectReducedMotion on scrollAnimate (default true) and scrollHorizontal (default false). Horizontal scrubbing opts out deliberately: the transform advances only as the user scrolls, 1:1 with their input, so it is direct manipulation rather than motion that plays at them — and holding a final state instead would leave every panel but one unreachable inside the sticky overflow:hidden container, hiding the content from exactly the people who asked for less motion.' },
      { type: 'fix', text: 'destroy() left the last animated frame’s inline styles on the element. Destroying anything mid-animation froze it there permanently — a card destroyed at 34% stayed at opacity 0.34 and offset by 21px for the rest of the page’s life, which is worse than never having animated it. Affects scrollReveal, scrollAnimate and scrollParallax, and it also made scrollReveal’s documented "restore original styles" untrue.' },
      { type: 'fix', text: 'scrollSnap fired onSnap twice for a single snap. The scroll event produced by its own animated scroll was treated as a fresh user gesture. Guaranteed under reduced motion and easing-dependent otherwise — a public callback that fires once or twice depending on the curve is worse than either.' },
      { type: 'new', text: 'A zero-length trigger window is now a development warning rather than a silently inert element. That is the defect class above: everything looks configured and nothing ever moves.' },
      { type: 'test', text: 'Real-browser coverage for every entry point — 30 to 175 tests per engine on Chromium, Firefox and WebKit. Every API and all eight framework wrappers are now exercised in a real browser rather than in jsdom, where getTotalLength() is stubbed and every rect is 0. scrollVideo verifies the painted frame against currentTime by canvas readback; scrollProgress drives real calc() widths off its custom properties instead of reading the values back in JS.' },
      { type: 'test', text: 'Mutation harness (scripts/mutation-check.mjs) — patches one line of source, rebuilds, and requires the single test named for that behaviour to fail. 56 mutations, all caught, including a regression guard for every fix in this release.' },
      { type: 'test', text: 'Two test-harness faults that were producing false results: the "fixed" e2e viewport was silently overridden per browser project, leaving WebKit 100px shorter than the others, and the fixture server refused HTTP Range requests — which makes Chromium report media as non-seekable, so a correct scrollVideo looked completely inert.' },
    ],
  },
  {
    version: '2.9.0',
    title: 'scrollProgress and scrollHorizontal',
    date: '2026-06-06',
    items: [
      { type: 'new', text: 'scrollProgress (svg-scroll-draw/progress) — expose scroll progress as CSS custom properties (--scroll-progress, --scroll-progress-eased) on any element. Drive CSS animations, calc() expressions, and gradients with zero per-frame JS beyond the variable write.' },
      { type: 'new', text: 'scrollHorizontal (svg-scroll-draw/horizontal) — drive translateX from vertical scroll. The Apple / Stripe horizontal scroll pattern. Supports distance, easing, trigger, onProgress, refresh().' },
      { type: 'site', text: '/vs-aos comparison page — svg-scroll-draw vs AOS vs ScrollReveal.js. 20-row feature matrix, side-by-side code, bundle bars.' },
      { type: 'site', text: '/vs-framer-motion comparison page — feature matrix, bundle comparison, side-by-side API, honest "when Framer Motion wins" section.' },
      { type: 'site', text: '/react-scroll-animation landing page — React-focused guide covering ScrollAnimate, ScrollText, ScrollCounter, ScrollPin components, hooks, and real-world patterns with copy-ready code.' },
      { type: 'site', text: '/nextjs-scroll-animation landing page — Next.js App Router guide covering SSR-safe usage, "use client" pattern, dynamic imports, and all v2 APIs.' },
      { type: 'site', text: 'Blog post: "Horizontal scroll sections without GSAP" at /blog/horizontal-scroll-sections.' },
      { type: 'site', text: 'Blog post: "Complete guide to scroll animations (2025)" at /blog/complete-guide-scroll-animations-2025. 12 patterns, all code included.' },
      { type: 'site', text: 'Blog post: "Scroll animation performance" at /blog/scroll-animation-performance. Deep-dive on rAF budgets, native fast path, and avoiding layout thrash.' },
      { type: 'site', text: 'Home page — "Compare" + "Framework guides" section linking to all comparison pages and the React/Next.js landing pages.' },
      { type: 'new', text: 'Lenis dist types — dist/lenis/index.d.ts and .d.mts shipped so svg-scroll-draw/lenis resolves TypeScript types without manual paths config.' },
      { type: 'test', text: '16 new tests — scrollProgress (8), scrollHorizontal (7), + velocity (1 updated). Total: 423.' },
    ],
  },
  {
    version: '2.8.0',
    title: 'scrollReveal, and speed from scroll velocity',
    date: '2026-06-06',
    items: [
      { type: 'new', text: 'scrollReveal (svg-scroll-draw/reveal) — one-line reveal animations. 7 presets (fadeUp/Down/Left/Right, scale, flip, flipX), custom from state (opacity, x, y, scale, rotate, rotateX, rotateY), stagger, easing, onEnter/onLeave. Drop-in replacement for AOS and ScrollReveal.js.' },
      { type: 'new', text: 'velocityScale on scrollAnimate — scale animation speed by scroll velocity. Pass true (default sensitivity) or a number. Forces JS engine.' },
      { type: 'new', text: 'ResizeObserver on scrollPin — auto-refresh pin dimensions when the element or document layout changes. No more manual refresh() calls on accordion/modal open.' },
      { type: 'site', text: 'Blog post: "Replace AOS / ScrollReveal.js" at /blog/replace-aos-scrollreveal.' },
      { type: 'test', text: '19 new tests — scrollReveal (15), velocityScale (4). Total: 407.' },
    ],
  },
  {
    version: '2.7.0',
    title: 'Callbacks, scrollPin, scrollSnap and Lenis',
    date: '2026-06-06',
    items: [
      { type: 'new', text: 'Scroll callbacks — onEnter, onLeave, onEnterBack, onLeaveBack added to both ScrollDrawOptions and ScrollAnimateOptions. Fire when scroll position crosses the trigger zone boundary in either direction. Forces JS engine.' },
      { type: 'new', text: 'scrollPin (svg-scroll-draw/pin) — pin any element at a viewport position while the page scrolls past it. Wrapper-based layout (no layout shift). Supports pinDistance, top, all lifecycle callbacks, onProgress, refresh().' },
      { type: 'new', text: 'scrollSnap (svg-scroll-draw/snap) — JS-powered section snapping with custom easing, configurable threshold, snapTo(index), getCurrentIndex(), and onSnap callback. Works on vertical and horizontal axes.' },
      { type: 'new', text: 'createLenisAdapter (svg-scroll-draw/lenis) — Lenis v1 smooth-scroll adapter. Patches window.scrollY / window.pageYOffset with Lenis\'s virtual scroll value so all engines stay in sync. Lenis v2+ works out of the box without the adapter.' },
      { type: 'site', text: '/vs-gsap comparison page — bundle size bars, 20-row feature matrix, side-by-side API code for every major use case, license comparison, CTA.' },
      { type: 'site', text: 'Blog post: "Pin sections on scroll without GSAP — scrollPin" at /blog/scroll-pin-without-gsap.' },
      { type: 'test', text: '30 new tests — scrollCallbacks (6), scrollPin (11), scrollSnap (7), lenis (6). Total: 388.' },
    ],
  },
  {
    version: '2.6.0',
    title: 'The playground learns v2',
    date: '2026-06-05',
    items: [
      { type: 'site', text: 'Playground v2 tab — new "v2 ✦" tab in the SVG Playground with live interactive demos for scrollAnimate (5 effect presets, 5 easings, scrubber), scrollText (split/stagger/from-preset), and scrollCounter (4 format presets). Each panel has replay, scrubber, and a copy-ready code snippet.' },
      { type: 'site', text: 'Blog post: "Animate multiple elements on scroll — one call" at /blog/scroll-animation-groups. Covers scrollAnimateGroup, scrollAnimateSequence, scrollParallaxGroup, scrollDrawGroup, scrollDrawSequence with real-world patterns for pricing grids, hero sections, and feature lists.' },
      { type: 'site', text: 'README sub-path exports table updated — all v2 wrappers for Vue, Svelte, Solid, Angular, Astro, Nuxt, and group APIs documented.' },
      { type: 'site', text: 'JSON-LD structured data on home page: softwareVersion updated from 1.2.0 to 2.6.0.' },
    ],
  },
  {
    version: '2.5.0',
    title: 'scrollParallaxGroup, and every framework documented',
    date: '2026-06-05',
    items: [
      { type: 'new', text: 'scrollParallaxGroup — fan-out scrollParallax across multiple elements simultaneously. Same combined instance API as scrollAnimateGroup. Ships in svg-scroll-draw/group.' },
      { type: 'site', text: 'DocsPage Angular v2 — full docs for ScrollAnimateRef, ScrollCounterRef, ScrollVideoRef, ScrollTextRef with Angular component examples.' },
      { type: 'site', text: 'DocsPage Nuxt v2 — useScrollAnimate, useScrollText, useScrollCounter composables + component wrappers + createScrollDrawPlugin. Full parity with Vue/Svelte/Solid docs.' },
      { type: 'site', text: 'DocsPage Astro v2 — initScrollAnimate, initScrollText, initScrollCounter, initAll data-attribute API with full code examples.' },
      { type: 'site', text: 'Desktop nav bug — burger menu was rendering on desktop across 7 pages (blog index, 5 blog posts, ExamplesPage). Wrapped all bare <MobileMenu /> in lg:hidden containers.' },
    ],
  },
  {
    version: '2.4.0',
    title: 'Angular, Astro and Nuxt catch up; groups for scrollAnimate',
    date: '2026-06-05',
    items: [
      { type: 'new', text: 'Angular v2 wrappers — ScrollAnimateRef, ScrollCounterRef, ScrollVideoRef, ScrollTextRef classes. Same class-based init(element, options)/destroy() pattern as ScrollDrawRef. Ships in svg-scroll-draw/angular.' },
      { type: 'new', text: 'Astro v2 — initScrollAnimate(), initScrollText(), initScrollCounter() data-attribute auto-init functions. Plus initAll() convenience that runs all four inits in one call. Ships in svg-scroll-draw/astro.' },
      { type: 'new', text: 'Nuxt v2 — svg-scroll-draw/nuxt now re-exports all v2 Vue composables (useScrollAnimate, useScrollCounter, useScrollVideo, useScrollText) and components. createScrollDrawPlugin() globally registers all five components.' },
      { type: 'new', text: 'scrollAnimateGroup — animate multiple HTML/SVG elements simultaneously with scrollAnimate options. Same fan-out + combined instance API as scrollDrawGroup. Ships in svg-scroll-draw/group.' },
      { type: 'new', text: 'scrollAnimateSequence — animate multiple elements in strict sequence, each starting only after the previous reaches 100%. Ships in svg-scroll-draw/group.' },
      { type: 'site', text: 'ExamplesPage — three new v2 examples: Product Video Scrub (scrollVideo), Feature List Reveal (staggered scrollAnimate rows), Animate Group (scrollAnimateGroup fan-out).' },
      { type: 'site', text: 'Blog post: "scrollAnimate in Vue 3, Svelte, and Solid.js — v2 framework guide" at /blog/vue-svelte-solid-v2. Covers composables, actions, hooks, component wrappers, real-world patterns, Nuxt plugin, Astro data-attributes.' },
    ],
  },
  {
    version: '2.3.0',
    title: 'Vue, Svelte and Solid get the v2 APIs',
    date: '2026-06-05',
    items: [
      { type: 'new', text: 'Vue 3 v2 composables — useScrollAnimate, useScrollCounter, useScrollVideo, useScrollText. Each returns a ref to bind to any element. Ships in svg-scroll-draw/vue alongside the existing useScrollDraw.' },
      { type: 'new', text: 'Vue 3 v2 components — <ScrollAnimate :options="...">, <ScrollCounter :to="...">, <ScrollVideo src="..." :options="...">, <ScrollText :options="..." tag="h2">. Ships in svg-scroll-draw/vue.' },
      { type: 'new', text: 'Svelte v2 actions — scrollAnimate, scrollCounterAction, scrollVideoAction, scrollTextAction Svelte use: actions + createScrollAnimate, createScrollCounter, createScrollVideo, createScrollText helpers that expose getInstance(). Ships in svg-scroll-draw/svelte.' },
      { type: 'new', text: 'Solid v2 hooks — useScrollAnimate, useScrollCounter, useScrollVideo, useScrollText returning ref setters + createScrollAnimate, createScrollCounter, createScrollVideo, createScrollText exposing getInstance(). Ships in svg-scroll-draw/solid.' },
      { type: 'site', text: 'ScrollTextInteractive demo — interactive home page section for scrollText: split mode picker (chars/words/lines), stagger slider (0–0.10), from-preset selector (Fade Up / Rotate In / Scale), scrubber, replay button, and live code block.' },
    ],
  },
  {
    version: '2.2.0',
    title: 'scrollVideo, scrollText and devtools',
    date: '2026-06-04',
    items: [
      { type: 'new', text: 'scrollVideo — tie <video>.currentTime to scroll position. Ships as svg-scroll-draw/video. The Apple / Stripe product-page scrub pattern. Supports from/to in seconds, preload strategy, onReady callback, and the full pause/resume/seek/replay/getProgress instance API.' },
      { type: 'new', text: 'scrollText — split any element into chars, words, or lines and stagger-animate each unit on scroll. Ships as svg-scroll-draw/text, a 2.5 KB alternative to GSAP SplitText. Accessibility: aria-label on container, aria-hidden on spans, destroy() restores original HTML.' },
      { type: 'new', text: 'devtools overlay — ships as svg-scroll-draw/devtools. Fixed panel showing all active animation types (draw/animate/counter/video/text), progress bars, trigger-start/end lines on the page, color-coded by type. enable(), disable(), toggle(), highlight(el). Cmd/Ctrl+Shift+S keyboard shortcut. Zero production bytes (dev-only guard).' },
      { type: 'new', text: 'Global instance registry (src/core/registry.ts) — all engines (animate, counter, video, text) self-register on init and unregister on destroy. DevTools reads the registry.' },
      { type: 'new', text: 'ScrollVideo + ScrollText React components added to svg-scroll-draw/react.' },
      { type: 'test', text: '36 new tests — scrollVideo.test.ts (17), scrollText.test.ts (19). 358 total across 12 suites.' },
      { type: 'site', text: 'Demo site — DocsPage v2.0–2.2 nav group with full option tables. Examples page: Pricing Card Reveal (scrollAnimate), Social Proof Strip (scrollCounter), Hero Headline Reveal (scrollText). Blog post: "Replace GSAP ScrollTrigger with scrollAnimate".' },
    ],
  },
  {
    version: '2.0.0',
    title: 'Beyond SVG: scrollAnimate',
    date: '2026-06-04',
    items: [
      { type: 'new', text: 'scrollAnimate — animate any CSS property (opacity, transform, color, background-color, filter, or any unit-based value) on any HTML or SVG element driven by scroll. Direct replacement for gsap.to + ScrollTrigger for the 80% case. Interpolates numbers, hex/rgb colors, transform functions (multi-function string parsing), and CSS unit values.' },
      { type: 'new', text: 'Native CSS fast path — for opacity/transform with named easing and default trigger, scrollAnimate injects animation-timeline: view() CSS instead of running JS on every frame. Automatically falls back to the JS engine when native is unsupported or the config uses callbacks, custom triggers, once, etc.' },
      { type: 'new', text: 'scrollCounter — animate a number from from to to as the element scrolls into view. Custom format function, decimals shorthand, all standard easing. Ships in the main bundle.' },
      { type: 'new', text: 'scrollParallax — move any element at speed × elementHeight pixels of travel. Negative speed reverses direction. Thin wrapper over scrollAnimate. Ships in the main bundle.' },
      { type: 'new', text: 'ScrollAnimate + ScrollCounter React components added to svg-scroll-draw/react.' },
      { type: 'test', text: '50 new tests — scrollAnimate.test.ts (30), scrollCounter.test.ts (20). 322 total across 10 suites.' },
      { type: 'new', text: 'interpolateValue utility exported — public helper for CSS value interpolation (numbers, colors, transforms, unit values).' },
    ],
  },
  {
    version: '1.8.0',
    title: 'Presets on the site',
    date: '2026-06-04',
    items: [
      { type: 'site', text: 'Changelog page — v1.4.0–v1.7.0 entries added with full release notes; "Latest" tag updated to v1.7.0.' },
      { type: 'site', text: 'Examples page — new Presets card (14 examples total); PresetShowcase component shows all 5 presets side by side on the same SVG.' },
      { type: 'site', text: 'Playground — Preset shortcut dropdown at the top of the Motion tab. Selecting a preset instantly applies its options to the current state.' },
      { type: 'site', text: 'Blog post: "5 scroll animation patterns in under 10 lines" at /blog/5-patterns-under-10-lines. Covers all 5 presets with Vanilla JS + React code. Blog index now shows 4 posts.' },
    ],
  },
  {
    version: '1.7.0',
    title: 'Timelines that loop',
    date: '2026-06-04',
    items: [
      { type: 'new', text: 'scrollDrawTimeline loop option — after the scroll-driven animation completes, automatically replay as a time-driven loop with no further scroll input needed. loop: true = infinite, loop: number = N additional iterations.' },
      { type: 'new', text: 'scrollDrawTimeline loopDuration option — duration of each time-driven loop iteration in ms (default 1500).' },
      { type: 'fix', text: 'doReset() now correctly resets currentAlpha to 0, so getProgress() returns 0 immediately after replay().' },
      { type: 'site', text: 'DocsPage updated — preset in Core Options, new Presets section, new CLI init section, timeline options fully documented (repeat, repeatDelay, loop, loopDuration, debug, label).' },
      { type: 'site', text: 'README updated — Presets section with table, CLI in Install section, preset in options table, timeline table with all new options.' },
      { type: 'test', text: '272 passing tests (5 new loop tests).' },
    ],
  },
  {
    version: '1.6.0',
    title: 'Presets and the CLI',
    date: '2026-06-04',
    items: [
      { type: 'new', text: 'preset option — apply a named option bag as the base config. Five presets: sketch (staggered ease-in), reveal (fade + ease-out + once), typewriter (fast linear stagger), cinematic (slow ease-in-out + fade), spring (spring easing). User options always override.' },
      { type: 'new', text: 'PRESETS export — the preset definitions are exported from the main package for inspection and extension.' },
      { type: 'new', text: 'CLI init tool — npx svg-scroll-draw init scaffolds a ready-to-use starter file for React, Vue, Svelte, Solid, or Vanilla JS. Asks for framework, preset, easing, and selector.' },
      { type: 'site', text: 'Blog post: "Scroll-driven SVG path morphing with morphTo" at /blog/scroll-path-morphing.' },
      { type: 'test', text: '267 passing tests (5 new preset tests).' },
    ],
  },
  {
    version: '1.5.0',
    title: 'Timeline repeats and a debug HUD',
    date: '2026-06-04',
    items: [
      { type: 'new', text: 'scrollDrawTimeline repeat option — replay N times (or \'infinite\') after completion with once: true. After delay, paths reset and animate again on next scroll-into-view.' },
      { type: 'new', text: 'scrollDrawTimeline repeatDelay option — ms to wait before each repeat.' },
      { type: 'new', text: 'scrollDrawTimeline debug option — inject a fixed HUD panel into document.body showing each track\'s scroll window as a coloured progress bar with live fill and global progress. Removed on destroy().' },
      { type: 'new', text: 'scrollDrawTimeline label option — label shown in the debug panel header.' },
      { type: 'site', text: 'Blog post: "Zero-JS SVG scroll animations with native CSS" at /blog/native-css-svg-scroll-animations.' },
      { type: 'test', text: '262 passing tests (8 new timeline tests).' },
    ],
  },
  {
    version: '1.4.0',
    title: 'Cinematic stories',
    date: '2026-05-31',
    items: [
      { type: 'new', text: 'Cinematic class — the runtime bridge for Cinematic Studio. Reads a story.json and wires a scroll-scrubbed timeline with zero JS on the author\'s side. Import from svg-scroll-draw/cinematic.' },
      { type: 'new', text: 'loadStory(story) — builds a sticky-stage scroll structure from the story, strokes draw paths across their scroll range, fades layers in. Honors prefers-reduced-motion.' },
      { type: 'new', text: 'Story protocol types exported: Story, StoryScene, StoryAnimation, DrawAnimation, FadeAnimation, StoryEasing.' },
      { type: 'test', text: '254 passing tests (5 new cinematic tests).' },
    ],
  },
  {
    version: '1.3.0',
    title: 'Autoplay',
    date: '2026-05-30',
    items: [
      { type: 'new', text: 'autoplay option — trigger the animation on viewport enter instead of scroll. Draws over duration milliseconds, replays on each re-entry. Use once: true to play only the first time.' },
      { type: 'new', text: 'duration option (number, default 1000ms) — controls how long the autoplay animation runs. Only used when autoplay: true.' },
      { type: 'new', text: 'All existing visual options work in autoplay mode — easing, stagger, fade, strokeColor, strokeWidth, fillOpacity, clip, morphTo, waypoints, repeat, repeatDelay, direction, onStart, onComplete, onProgress.' },
      { type: 'new', text: 'Full instance API in autoplay mode — pause/resume freeze/unfreeze elapsed time; seek(0–1) jumps to a fraction of duration; replay restarts from scratch.' },
      { type: 'test', text: '249 passing tests (8 new) — autoplay draw, onStart, onComplete, seek, replay, destroy, clip mode, and once covered.' },
    ],
  },
  {
    version: '1.2.0',
    title: 'Bounce and elastic easing',
    date: 'May 2026',
    items: [
      { type: 'new', text: 'createBounce({ bounces, decay }) — bounce-out easing that rises to 1 then makes N dips before settling. Also available as the named string \'bounce\'. Values stay within [0, 1]' },
      { type: 'new', text: 'createElastic({ amplitude, period }) — elastic-out easing that overshoots past 1 and oscillates back. Also available as the named string \'elastic\'. Based on the Penner elastic-out formula' },
      { type: 'new', text: 'EasingName type updated — \'bounce\' and \'elastic\' are now valid TypeScript string values for the easing option' },
      { type: 'test', text: '241 passing tests (20 new) — createBounce and createElastic covered across boundary values, curve shape, overshoot, and factory parameterization' },
      { type: 'site', text: 'Solid.js gallery demo on /examples — fine-grained reactivity graph (createSignal → createMemo → createEffect) in Solid brand blue' },
      { type: 'site', text: 'Framework filter on /examples — pill strip (All / React / Vue 3 / Svelte / Solid / Vanilla / API) filters the 13-demo gallery client-side' },
      { type: 'site', text: 'Page-specific OG images for /playground and /changelog; display:inline-block Satori crash fixed across all five OG images' },
      { type: 'site', text: '/blog/gsap-drawsvg-alternative — full SEO comparison page with bundle size chart, side-by-side code, 19-row feature matrix, and migration guide' },
      { type: 'site', text: 'Playground easing dropdown now includes bounce and elastic with live parameter sliders (Bounces/Decay and Amplitude/Period)' },
    ],
  },
  {
    version: '1.1.0',
    title: 'Native CSS scroll timelines',
    date: '2026-05-30',
    items: [
      { type: 'new', text: 'Native CSS scroll-driven rendering — on supporting browsers (Chrome, Edge, Firefox) the simple draw case runs on the compositor via animation-timeline: view() with zero per-frame JavaScript and no scroll/resize listeners' },
      { type: 'new', text: 'native option (default true) — automatically uses the CSS fast path when eligible; pass false to always use the JS engine. The full instance API works on both paths' },
      { type: 'test', text: '221 passing tests across 7 suites — engine-native.test.ts added to cover the native CSS path and fallback logic' },
      { type: 'site', text: 'Bundle size claim corrected to ~4.4 KB gzipped across all docs (stale "<3 KB" figure removed)' },
    ],
  },
  {
    version: '1.0.0',
    title: 'Sequences fixed, and 1.0',
    date: '2026-05-28',
    items: [
      { type: 'fix', text: 'scrollDrawSequence chain was broken — engines now created upfront and paused; each step resumes only when the previous fires onComplete. activeIdx tracks correctly so pause/resume/seek/getProgress always target the active step.' },
      { type: 'test', text: '194 passing tests across 6 suites — engine, engine-options, group, timeline, framework wrappers (Angular, Astro, Svelte, Solid), and utilities' },
      { type: 'test', text: 'Framework wrapper tests — Angular ScrollDrawRef, Astro initScrollDraw, Svelte scrollDraw action + createScrollDraw, Solid useScrollDraw + createScrollDraw' },
      { type: 'test', text: 'Root workspace test runner — npx vitest run from the repo root works via vitest.workspace.ts' },
      { type: 'ci', text: 'CI coverage threshold enforcement — Node 20 + 22 matrix' },
      { type: 'site', text: 'JSDoc improvements — clip, morphTo, and scrollDrawSequence document their non-obvious edge cases inline' },
    ],
  },
  {
    version: '0.7.0',
    title: 'Timelines and createSpring',
    date: 'May 2026',
    items: [
      { type: 'new', text: 'createSpring({ tension, friction }) — parameterize the spring easing instead of the hardcoded preset' },
      { type: 'new', text: 'svg-scroll-draw/timeline — scrollDrawTimeline API for independent per-track scroll windows within a single range' },
      { type: 'new', text: '--scroll-draw-progress CSS custom property — set on the container every frame, drive CSS animations without JS callbacks' },
      { type: 'site', text: 'Docs page (/docs) — full API reference with sidebar navigation and IntersectionObserver-based active tracking' },
      { type: 'site', text: 'Group & Sequence demos on the examples page' },
      { type: 'site', text: 'Timeline API demo on the examples page' },
    ],
  },
  {
    version: '0.6.2',
    title: 'fillOpacity',
    date: 'May 2026',
    items: [
      { type: 'new', text: 'fillOpacity — animate fill opacity in sync with the stroke draw. Use [0, 1] to flood a fill as the outline traces itself' },
      { type: 'new', text: 'useScrollDrawProgress React hook — reactive 0–1 scroll progress for any element, same trigger/easing API' },
      { type: 'new', text: 'svg-scroll-draw/web-component subpath export — <scroll-draw> importable directly, not just via CDN' },
    ],
  },
  {
    version: '0.6.0',
    title: 'Playback control, morphing and groups',
    date: 'May 2026',
    items: [
      { type: 'new', text: 'Pause / Resume / Seek — full imperative playback control on every instance' },
      { type: 'new', text: 'Path Morphing (morphTo) — interpolate a path\'s d attribute to a target shape on scroll' },
      { type: 'new', text: 'Velocity Scale (velocityScale) — draw speed scales with scroll speed' },
      { type: 'new', text: 'Repeat / RepeatDelay — replay N times or loop infinitely' },
      { type: 'new', text: 'Astro adapter (svg-scroll-draw/astro) — data-attribute API with initScrollDraw()' },
      { type: 'new', text: 'Nuxt adapter (svg-scroll-draw/nuxt) — useScrollDraw() composable for Nuxt 3' },
      { type: 'new', text: 'Group API (svg-scroll-draw/group) — scrollDrawGroup and scrollDrawSequence' },
      { type: 'new', text: 'Web Component — <scroll-draw> custom element, auto-registers via CDN' },
    ],
  },
  {
    version: '0.4.0',
    title: 'Solid, Angular, colour and width',
    date: 'May 2026',
    items: [
      { type: 'new', text: 'Solid.js adapter (svg-scroll-draw/solid) — useScrollDraw and createScrollDraw hooks' },
      { type: 'new', text: 'Angular adapter (svg-scroll-draw/angular) — ScrollDrawRef class for AfterViewInit lifecycle' },
      { type: 'new', text: 'Stroke color animation (strokeColor) — static or [from, to] interpolation' },
      { type: 'new', text: 'Stroke width animation (strokeWidth) — static or [from, to] interpolation' },
      { type: 'new', text: 'Auto Reverse (autoReverse) — follows scroll direction automatically' },
      { type: 'new', text: 'Custom scroll container (scrollContainer)' },
      { type: 'new', text: 'Waypoints — fire callbacks at specific 0–1 progress thresholds' },
      { type: 'new', text: 'Delay option — milliseconds before the engine starts observing' },
    ],
  },
  {
    version: '0.3.0',
    title: 'Svelte, horizontal scroll and spring easing',
    date: 'May 2026',
    items: [
      { type: 'new', text: 'Svelte adapter (svg-scroll-draw/svelte) — use:scrollDraw action and createScrollDraw' },
      { type: 'new', text: 'Horizontal scroll support (axis: "x")' },
      { type: 'new', text: 'Replay API — instance.replay() to re-trigger imperatively' },
      { type: 'new', text: 'Spring easing — physics-based overshoot-and-settle curve' },
      { type: 'new', text: 'Once mode (once) — draw once and stay drawn' },
      { type: 'new', text: 'Debug overlay (debug) — visualizes trigger zones in dev mode' },
      { type: 'new', text: 'onStart lifecycle hook' },
    ],
  },
  {
    version: '0.2.0',
    title: 'Vue 3 and the playground',
    date: 'May 2026',
    items: [
      { type: 'new', text: 'Vue 3 adapter (svg-scroll-draw/vue) — <ScrollDraw> component and useScrollDraw composable' },
      { type: 'site', text: 'SVG Playground at /playground — live SVG editor with all options' },
      { type: 'site', text: 'Interactive demo with easing and speed controls' },
      { type: 'site', text: 'OpenGraph and Twitter preview card image URLs' },
    ],
  },
  {
    version: '0.1.0',
    title: 'Initial release',
    date: 'May 2026',
    tag: 'Initial release',
    items: [
      { type: 'new', text: 'Core scrollDraw() function — zero dependencies, ~3 KB gzipped' },
      { type: 'new', text: 'React wrapper (svg-scroll-draw/react) — <ScrollDraw> component' },
      { type: 'new', text: 'Easing curves — linear, ease-in, ease-out, ease-in-out' },
      { type: 'new', text: 'Trigger system — element/viewport anchor strings' },
      { type: 'new', text: 'Stagger, fade, direction, once, speed options' },
      { type: 'new', text: 'IntersectionObserver viewport culling' },
      { type: 'new', text: 'SSR safe — window guards, Next.js App Router compatible' },
      { type: 'new', text: 'rect and circle support via perimeter approximation' },
      { type: 'new', text: 'CDN IIFE bundle at dist/cdn/svg-scroll-draw.global.js' },
    ],
  },
];

const pad = (n: number) => String(n).padStart(2, '0');
const anchor = (v: string) => `v${v.replace(/\./g, '-')}`;
const major = (v: string) => v.split('.')[0];
const isIso = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d);

/** What each era of the log was, by major version. */
const ERAS: Record<string, string> = {
  '2': 'scroll animation platform',
  '1': 'the SVG draw library',
  '0': 'before 1.0',
};

/*
 * Entry points, identifiers, tags, files and site paths, set in mono so a
 * long entry scans. Display only: the text itself is unchanged. One capture
 * group, so split() puts every match at an odd index.
 */
const CODE = /(npx svg-scroll-draw(?: [a-z]+)?|svg-scroll-draw\/[a-z][\w/-]*|<\/?[A-Za-z][\w-]*(?:\s[^<>]{0,40})?>|--[a-z][\w-]+|\b(?:dist|src|scripts|e2e|examples|skills)\/[\w./-]*\w|\.?\b[a-z][\w-]*(?:\.[\w-]+)*\.(?:tsx|ts|mts|cts|mjs|js|json)\b|\b[a-z]+[A-Z]\w*(?:\.[a-z]\w*)*(?:\(\))?|\b[a-z]+\(\)|(?<![\w.)])\/[a-z][\w-]*(?:\/[\w-]+(?:\.[\w-]+)*)*)/;
function inked(text: string) {
  return text.split(CODE).map((part, i) => (i % 2 ? <code key={i}>{part}</code> : part));
}

/** One release: its title block on the left, its entries by kind on the right. */
function ReleaseEntry({ r, rev, latest }: { r: Release; rev: number; latest: boolean }) {
  const id = anchor(r.version);
  const groups = KINDS.map(({ k, label }) => ({ k, label, items: r.items.filter((it) => it.type === k) })).filter((g) => g.items.length);
  const tag = latest ? 'latest' : r.tag;
  return (
    <article className="cl-rel" id={id} aria-labelledby={`${id}-h`}>
      <header className="cl-meta">
        <p className="cl-meta-k">
          <span className="cl-meta-n">rev. {pad(rev)}</span>
          {isIso(r.date) ? <time dateTime={r.date}>{r.date}</time> : <span>{r.date}</span>}
        </p>
        <h2 id={`${id}-h`} className="cl-v">
          <a href={`#${id}`} aria-label={`v${r.version}, ${r.title}`}>v{r.version}</a>
        </h2>
        <p className="cl-name">{r.title}</p>
        <dl className="cl-tb">
          {groups.map((g) => (
            <div key={g.k} className={`is-${g.k}`}><dt>{g.label}</dt><dd>{g.items.length}</dd></div>
          ))}
        </dl>
        <p className="cl-meta-foot">
          {tag && <span className={`cl-tag${latest ? ' is-latest' : ''}`}>{tag}</span>}
          <a href={`${NPM}/v/${r.version}`} target="_blank" rel="noopener noreferrer" className="cl-npm">npm · v{r.version} ↗</a>
        </p>
      </header>
      <div className="cl-body">
        {groups.map((g) => (
          <section key={g.k} className={`cl-grp is-${g.k}`} aria-label={`${g.label} in v${r.version}`}>
            <h3 className="cl-grp-h"><span>{g.label}</span><span className="cl-grp-n">{pad(g.items.length)}</span></h3>
            <ol className="cl-list">
              {g.items.map((it, j) => (
                <li key={j}><span className="cl-n">{pad(j + 1)}</span><p>{inked(it.text)}</p></li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </article>
  );
}

/** Between 2.0.0 and 1.8.0: where the library stopped being only an SVG drawing tool. */
function PlatformShift() {
  return (
    <aside className="cl-shift" aria-label="v2.0 — The Platform Shift">
      <BreakLine />
      <div className="cl-shift-in">
        <div className="cl-shift-meta">
          <p className="cl-meta-k"><span className="cl-meta-n">v2.0</span><span>June 2026</span></p>
          <h2 className="cl-shift-h">The platform shift</h2>
        </div>
        <p className="cl-shift-p">
          svg-scroll-draw grew from an SVG path drawing tool into a full scroll animation platform.
          Six new APIs — <code>scrollAnimate</code>, <code>scrollCounter</code>, <code>scrollParallax</code>,{' '}
          <code>scrollVideo</code>, <code>scrollText</code>, and <code>devtools</code> — added in v2.0–v2.2.
          Everything below this line is the original SVG draw library.
        </p>
      </div>
    </aside>
  );
}

export default function ChangelogPage() {
  const total = RELEASES.reduce((n, r) => n + r.items.length, 0);
  const fixes = RELEASES.reduce((n, r) => n + r.items.filter((it) => it.type === 'fix').length, 0);
  const bars: ChartBar[] = [...RELEASES].reverse().map((r) => {
    const fix = r.items.filter((it) => it.type === 'fix').length;
    return { id: anchor(r.version), v: r.version, fix, rest: r.items.length - fix };
  });
  const eras = ['2', '1', '0'].map((m) => ({ m, list: RELEASES.filter((r) => major(r.version) === m) }));

  return (
    <SiteShell active="/changelog" crumbs={[['Changelog', '/changelog']]} kicker="changelog / your turn">
      <div className="cl">

        {/* ── Opening ────────────────────────────────────── */}
        <header className="pg-head cl-head">
          <div>
            <p className="pg-kicker"><span>changelog / release history</span><span>v{SELF.version}</span></p>
            <h1 className="pg-title">Changelog</h1>
            <p className="pg-lede">
              Every release of <code className="cl-code">svg-scroll-draw</code>, newest first — what each version
              added, what it fixed and how it was tested, as it was written at the time.
            </p>
            <div className="pg-actions">
              <a href={`${GH}/blob/main/CHANGELOG.md`} target="_blank" rel="noopener noreferrer" className="btn btn-solid" data-magnetic>
                CHANGELOG.md ↗
              </a>
              <a href={`${NPM}?activeTab=versions`} target="_blank" rel="noopener noreferrer" className="btn" data-magnetic>
                Versions on npm ↗
              </a>
            </div>
            <dl className="pg-facts">
              <div><dt>Latest</dt><dd>v{RELEASES[0].version}</dd></div>
              <div><dt>Releases</dt><dd>{RELEASES.length}</dd></div>
              <div><dt>Entries</dt><dd>{total}</dd></div>
              <div><dt>Fixes</dt><dd>{fixes}</dd></div>
            </dl>
          </div>
          <ReleaseChart bars={bars} />
        </header>

        {/* ── Sheet index: every release, by era ─────────── */}
        <nav className="cl-index" aria-label="Releases by major version">
          <p className="cl-index-h"><span>sheet index</span><span>{RELEASES.length} releases</span></p>
          {eras.map(({ m, list }) => {
            const from = list[list.length - 1].date;
            const to = list[0].date;
            return (
              <div key={m} className="cl-index-row">
                <p className="cl-index-k">
                  <b>{m}.x</b>
                  <span>{ERAS[m]}</span>
                  <span className="cl-index-d">{from === to ? from : `${from} → ${to}`}</span>
                </p>
                <div className="cl-index-v">
                  {list.map((r) => (
                    <a key={r.version} href={`#${anchor(r.version)}`}>{r.version}</a>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        {/* ── The log ────────────────────────────────────── */}
        <div className="cl-log">
          {RELEASES.map((r, i) => (
            <React.Fragment key={r.version}>
              {r.version === '1.8.0' && <PlatformShift />}
              <ReleaseEntry r={r} rev={RELEASES.length - i} latest={i === 0 && r.version === SELF.version} />
            </React.Fragment>
          ))}
        </div>
      </div>
    </SiteShell>
  );
}
