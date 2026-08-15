/**
 * Per-example SEO copy for the standalone /examples/<slug> pages.
 *
 * Why this file gates the routes: /examples is one page holding 23 demos, so it
 * can only ever rank for one cluster of queries. Split into individual URLs,
 * each demo targets its own long-tail intent ("animate a logo on scroll react",
 * "svg line chart animation") — which is the single biggest impressions win
 * available on this site.
 *
 * Only slugs present here get a page. `generateStaticParams` reads this file, so
 * examples are promoted to their own URL in reviewed batches rather than all at
 * once with thin, auto-generated copy. An example with no entry stays on the
 * /examples index and nothing breaks.
 *
 * Each entry must earn its URL. `intro` is written for the page, not lifted from
 * the index — a page that only repeats the card blurb is a thin page.
 */

export type ExampleSeo = {
  /** Must match an `id` in EXAMPLES (components/ExamplesPage.tsx). */
  slug: string;
  /** <title>. Aim ≤ 60 chars; the layout template appends " | svg-scroll-draw". */
  title: string;
  /** Meta description, 140–155 chars, ending on something actionable. */
  description: string;
  /** H1 — may differ from the index card label, which is space-constrained. */
  heading: string;
  /** 2–3 sentences of page-specific copy. Not a repeat of the card description. */
  intro: string;
  keywords: string[];
  /** Related slugs for internal linking. Cross-linking is why a cluster outranks a page. */
  related: string[];
};

export const EXAMPLE_SEO: Record<string, ExampleSeo> = {
  'logo-reveal': {
    slug: 'logo-reveal',
    title: 'Animate a Logo on Scroll — SVG Draw-On Reveal',
    description:
      'Draw an SVG logo stroke-by-stroke as the user scrolls, then flood it with brand colour on completion. Copy-paste React code, ~10 KB, no GSAP.',
    heading: 'Logo reveal on scroll',
    intro:
      'A logo that draws itself in is the most-requested scroll effect there is, and it is almost always built with GSAP DrawSVG for what amounts to one animated stroke-dashoffset. This example does it with a single component and no plugin registration. The interesting part is not the draw — it is what happens at 100%: onComplete fires, the outline floods with brand colour, and a second animation runs off the back of it.',
    keywords: [
      'animate logo on scroll',
      'svg logo animation scroll',
      'logo draw on animation',
      'animate svg logo react',
      'logo reveal scroll animation',
      'draw svg logo on scroll',
      'stroke-dashoffset logo animation',
      'svg logo animation without gsap',
    ],
    related: ['signature', 'line-chart'],
  },
  'line-chart': {
    slug: 'line-chart',
    title: 'SVG Line Chart Animation on Scroll (No Library)',
    description:
      'Animate a line chart as it scrolls into view — axes first, then the data line tracing in with a colour shift. Copy-paste code, zero chart dependencies.',
    heading: 'Line chart that draws on scroll',
    intro:
      'Animated charts usually mean pulling in a charting library, or hand-rolling a requestAnimationFrame loop that fights the scroll position. Neither is necessary when the chart is already an SVG path. This example sequences two draws — the axes settle first, then the revenue line traces across them and shifts from grey to brand pink as it goes, using strokeColor interpolation rather than a CSS transition.',
    keywords: [
      'svg line chart animation',
      'animate chart on scroll',
      'line chart draw animation',
      'scroll triggered chart animation',
      'animated svg graph',
      'chart animation without library',
      'data visualization scroll animation',
      'animate line graph javascript',
    ],
    related: ['logo-reveal', 'scroll-counter'],
  },
  signature: {
    slug: 'signature',
    title: 'Handwriting & Signature Animation on Scroll',
    description:
      'Make a signature write itself as the page scrolls — the classic handwriting effect in a few lines of SVG and one function call. No GSAP, no canvas.',
    heading: 'Signature handwriting animation',
    intro:
      'The handwriting effect is the purest demonstration of scroll-driven path drawing: a single continuous path, drawn at the speed the reader scrolls. It works because a signature is already one long stroke, so the dash offset maps directly onto the pen travelling across the page. The one thing worth getting right is easing — a linear draw reads mechanical, while ease-out lands the way a hand actually lifts.',
    keywords: [
      'signature animation svg',
      'handwriting animation css',
      'animate signature on scroll',
      'svg handwriting effect',
      'text write on animation',
      'signature draw animation javascript',
      'handwriting scroll animation react',
      'animated signature website',
    ],
    related: ['logo-reveal', 'scroll-text'],
  },

  // ── Batch 2 · diagrams ────────────────────────────────────────────────────
  flowchart: {
    slug: 'flowchart',
    title: 'Animated Flowchart on Scroll — SVG Diagram Reveal',
    description:
      'Draw a flowchart step by step as the reader scrolls: boxes, then connectors, in sequence. Keeps the diagram readable before it animates. Copy-paste code.',
    heading: 'Flowchart that draws on scroll',
    intro:
      'A diagram that assembles itself as you scroll is the clearest way to explain a multi-step process, because the reader meets one step at a time instead of a finished wall of boxes. The trick that makes it work is what stays still: fills, labels and icons are static, so the chart is legible even before it animates and for anyone who never scrolls. Only the borders and arrows are on the timeline.',
    keywords: [
      'animated flowchart',
      'svg flowchart animation',
      'flowchart draw on scroll',
      'animated diagram javascript',
      'process flow animation',
      'step by step diagram animation',
      'animate connectors svg',
      'scroll triggered diagram',
    ],
    related: ['network', 'map-route'],
  },
  'map-route': {
    slug: 'map-route',
    title: 'Animate a Map Route on Scroll — SVG Path Tracing',
    description:
      'Trace a delivery route across a map as the page scrolls — the journey-line effect used on logistics and travel sites. No mapping library required.',
    heading: 'Map route tracing on scroll',
    intro:
      'Route tracing is the effect every logistics, travel and delivery site reaches for, and it is usually built on a mapping SDK far heavier than the animation itself. If the route is an SVG path, none of that is needed. The map, street names and distance badge stay static; only the route line advances, so the reader follows the journey at their own scroll speed.',
    keywords: [
      'animate map route',
      'svg map path animation',
      'route animation on scroll',
      'delivery route animation',
      'animated journey line',
      'trace path on map javascript',
      'travel route scroll animation',
      'geographic path tracing svg',
    ],
    related: ['flowchart', 'signature'],
  },
  network: {
    slug: 'network',
    title: 'Animated Architecture Diagram — Draw Connections on Scroll',
    description:
      'Draw the wires between services as the reader scrolls an architecture diagram. Boxes stay readable throughout; only the connections animate. Copy-paste code.',
    heading: 'Architecture diagram connections',
    intro:
      'Technical architecture diagrams are the hardest thing to read on a landing page — everything arrives at once and the eye has nowhere to start. Animating only the connections fixes that: the service boxes are visible from the outset, and the wires draw in request order, so the reader traces the path a request actually takes rather than decoding a static graph.',
    keywords: [
      'animated architecture diagram',
      'network diagram animation',
      'animate connection lines svg',
      'system diagram scroll animation',
      'api architecture visual',
      'animated technical diagram',
      'draw lines between boxes javascript',
      'infographic line reveal',
    ],
    related: ['flowchart', 'map-route'],
  },

  // ── Batch 3 · framework integrations ──────────────────────────────────────
  vue: {
    slug: 'vue',
    title: 'Vue 3 Scroll Animation — ScrollDraw & useScrollDraw',
    description:
      'Scroll-driven SVG animation in Vue 3 with a component or a composable. Full ref control, SSR-safe, ~10 KB, no GSAP. Copy-paste Vue code.',
    heading: 'Vue 3 scroll animation',
    intro:
      'Vue gets first-class treatment here rather than a vanilla escape hatch: a <ScrollDraw> component for the common case, and a useScrollDraw composable when you need the instance to pause, seek or replay it. Both ship in the same package — there is no separate Vue build to install, and both clean up on unmount so nothing leaks across route changes.',
    keywords: [
      'vue scroll animation',
      'vue 3 scroll animate',
      'useScrollDraw vue',
      'vue svg animation on scroll',
      'vue scroll animation library',
      'vue alternative to gsap scrolltrigger',
      'nuxt scroll animation',
      'vue composable scroll',
    ],
    related: ['svelte', 'solid', 'astro'],
  },
  svelte: {
    slug: 'svelte',
    title: 'Svelte Scroll Animation — use:scrollDraw Action',
    description:
      'Animate SVG on scroll in Svelte with a native action. use:scrollDraw needs no wrapper component, and createScrollDraw gives full instance control.',
    heading: 'Svelte scroll animation',
    intro:
      'Svelte actions are the right primitive for this — no wrapper component, no extra element in the DOM, just use:scrollDraw on the node you want animated. This example animates a reactive store graph with spring easing, and reaches for createScrollDraw when the instance itself needs handling. Cleanup is automatic through the action lifecycle.',
    keywords: [
      'svelte scroll animation',
      'svelte scroll animate action',
      'use:scrollDraw svelte',
      'svelte svg animation',
      'svelte animate on scroll',
      'svelte alternative to gsap',
      'sveltekit scroll animation',
      'svelte action animation',
    ],
    related: ['vue', 'solid'],
  },
  solid: {
    slug: 'solid',
    title: 'Solid.js Scroll Animation — useScrollDraw Hook',
    description:
      'Scroll-driven SVG animation in Solid.js with a hook that respects fine-grained reactivity. No re-renders, ~10 KB, zero dependencies.',
    heading: 'Solid.js scroll animation',
    intro:
      'Solid’s fine-grained reactivity means an animation library must not force re-renders to move a value, and this one does not — the draw runs outside the reactive graph entirely, driven by scroll position. The example animates a signal feeding two memos into an effect, which is a fitting subject: the diagram explains the model the code is written in.',
    keywords: [
      'solid js scroll animation',
      'solidjs scroll animate',
      'useScrollDraw solid',
      'solid svg animation',
      'solid.js animation library',
      'solid scroll trigger',
      'fine grained reactivity animation',
      'solidjs animate on scroll',
    ],
    related: ['vue', 'svelte'],
  },

  // ── Batch 4 · orchestration APIs ──────────────────────────────────────────
  'group-api': {
    slug: 'group-api',
    title: 'Animate Multiple SVGs Together on Scroll — Group API',
    description:
      'Wire several separate SVG containers to one scroll timeline with scrollDrawGroup. They start together, no matter where they sit in the DOM.',
    heading: 'Animate multiple SVGs together',
    intro:
      'Once a page has more than one animated element, the problem stops being the animation and becomes coordination — three separate observers means three slightly different start times, which reads as sloppy. scrollDrawGroup binds any number of containers to a single scroll timeline so they move as one, with one observer rather than one per element.',
    keywords: [
      'animate multiple svg on scroll',
      'scroll animation group',
      'synchronized scroll animation',
      'animate several elements together',
      'scrollDrawGroup',
      'multiple svg same timeline',
      'gsap scrolltrigger batch alternative',
      'coordinate scroll animations',
    ],
    related: ['sequence-api', 'timeline-api'],
  },
  'sequence-api': {
    slug: 'sequence-api',
    title: 'Sequential Scroll Animation — One After Another',
    description:
      'Chain scroll animations so each starts only when the previous finishes. scrollDrawSequence handles the ordering — no manual delay maths.',
    heading: 'Animate one after another',
    intro:
      'Strict ordering is what separates a sequence from a stagger: step two must not begin until step one has genuinely reached 100%, however fast or slow the reader scrolls. Hand-tuned delays cannot promise that, because the timing depends on scroll speed. scrollDrawSequence chains on completion instead, so the order holds at any pace.',
    keywords: [
      'sequential scroll animation',
      'chain scroll animations',
      'one after another animation',
      'scrollDrawSequence',
      'step by step scroll reveal',
      'animation sequence javascript',
      'ordered scroll animation',
      'staggered sequence svg',
    ],
    related: ['group-api', 'timeline-api'],
  },
  'timeline-api': {
    slug: 'timeline-api',
    title: 'Scroll Timeline API — Independent Animation Windows',
    description:
      'Give every element its own slice of the scroll range. scrollDrawTimeline maps each track to a start and end percentage — like keyframes for scroll.',
    heading: 'Independent scroll timelines',
    intro:
      'Sometimes elements should not share a timeline at all: axes belong at the very start of the scroll range, bars across the middle, a trend line at the end. scrollDrawTimeline gives each track its own window expressed in percentages of the scroll range, which is closer to authoring keyframes than to wiring up triggers — and it is the closest thing here to GSAP’s timeline model.',
    keywords: [
      'scroll timeline api',
      'scroll driven timeline animation',
      'independent scroll windows',
      'scrollDrawTimeline',
      'keyframes on scroll',
      'gsap timeline alternative',
      'scroll progress mapping',
      'multi track scroll animation',
    ],
    related: ['sequence-api', 'group-api'],
  },

  // ── Batch 5 · v2 element APIs ─────────────────────────────────────────────
  'scroll-reveal': {
    slug: 'scroll-reveal',
    title: 'Scroll Reveal Without AOS — One Call, No Attributes',
    description:
      'Fade and cascade elements into view with one scrollReveal call. A 3.9 KB, typed replacement for AOS and ScrollReveal.js — no data attributes.',
    heading: 'Card cascade reveal on scroll',
    intro:
      'Reveal-on-scroll is the most common scroll effect on the web and usually arrives via data attributes sprinkled through the markup, which couples your animation config to your HTML and gives you nothing typed to refactor against. One scrollReveal call on a selector replaces the lot. Worth being straight: AOS (6.7 KB) and ScrollReveal (5.6 KB) are fine at this and are not much bigger than our 3.9 KB reveal entry — the case for switching is types, tree-shaking and not touching your markup.',
    keywords: [
      'scroll reveal javascript',
      'aos alternative',
      'fade in on scroll',
      'reveal elements on scroll',
      'scrollreveal alternative',
      'animate on scroll without aos',
      'cascade reveal animation',
      'stagger fade in scroll',
    ],
    related: ['scroll-animate', 'scroll-animate-group'],
  },
  'scroll-animate': {
    slug: 'scroll-animate',
    title: 'Animate Any CSS Property on Scroll — scrollAnimate',
    description:
      'Drive opacity, transform, colour or any unit value from scroll position. Staggered per-element triggers build a natural reveal. Copy-paste code.',
    heading: 'Animate any CSS property on scroll',
    intro:
      'scrollDraw handles SVG paths; scrollAnimate handles everything else — any CSS property, interpolated from scroll position, including multi-function transform strings and hex or rgb colours. This example gives each part of a pricing card its own trigger offset, which is what stops a staggered reveal reading like a single block sliding in.',
    keywords: [
      'animate css property on scroll',
      'scroll animation javascript',
      'opacity transform on scroll',
      'scrollAnimate',
      'scroll driven css animation',
      'animate transform on scroll',
      'scroll linked animation',
      'card reveal animation',
    ],
    related: ['scroll-reveal', 'scroll-animate-group'],
  },
  'scroll-animate-group': {
    slug: 'scroll-animate-group',
    title: 'Animate Multiple Elements on Scroll — Fan-Out in One Call',
    description:
      'Reveal a whole grid of elements together with scrollAnimateGroup. One call, one timeline, one observer — no per-element boilerplate.',
    heading: 'Fan-out animation on scroll',
    intro:
      'Writing the same scrollAnimate call four times is how a card grid ends up with four observers and four subtly different start times. scrollAnimateGroup takes a selector and animates everything it matches on one shared timeline, which is both less code and measurably less work for the browser on a long page.',
    keywords: [
      'animate multiple elements on scroll',
      'scrollAnimateGroup',
      'fan out scroll animation',
      'animate grid on scroll',
      'stagger elements on scroll',
      'scroll animation multiple divs',
      'animate list items on scroll',
      'batch scroll animation',
    ],
    related: ['scroll-animate', 'scroll-reveal'],
  },
  'scroll-counter': {
    slug: 'scroll-counter',
    title: 'Animated Number Counter on Scroll — scrollCounter',
    description:
      'Count numbers up from zero as they scroll into view, with custom formatting for currency, percentages or compact notation. 1 KB, no dependencies.',
    heading: 'Number counter on scroll',
    intro:
      'Counting statistics up as they enter the viewport is the standard social-proof pattern, and it is usually a hand-rolled requestAnimationFrame loop plus an IntersectionObserver plus formatting logic. scrollCounter is those three things in one call, with a format function so 1200000 can render as $1.2M without you touching the animation.',
    keywords: [
      'animated number counter',
      'count up animation scroll',
      'scrollCounter',
      'number animation javascript',
      'statistics counter animation',
      'animate numbers on scroll',
      'count up on scroll react',
      'social proof counter',
    ],
    related: ['line-chart', 'scroll-animate'],
  },
  'scroll-text': {
    slug: 'scroll-text',
    title: 'Text Reveal on Scroll — Split Words & Characters',
    description:
      'Split a headline into words or characters and stagger them in on scroll. A 2.5 KB alternative to GSAP SplitText, with accessible markup.',
    heading: 'Headline text reveal on scroll',
    intro:
      'Word-by-word headline reveals are the signature effect of an agency landing page, and the accessibility trap is that splitting text into spans normally destroys it for screen readers. This keeps an aria-label on the container and marks the fragments aria-hidden, so the headline is still read as one sentence — and destroy() puts the original HTML back.',
    keywords: [
      'text reveal animation scroll',
      'split text animation',
      'gsap splittext alternative',
      'animate text word by word',
      'character reveal animation',
      'scrollText',
      'headline animation on scroll',
      'staggered text animation',
    ],
    related: ['scroll-text-lines', 'signature'],
  },
  'scroll-text-lines': {
    slug: 'scroll-text-lines',
    title: 'Feature List Reveal on Scroll — Staggered Rows',
    description:
      'Slide feature rows in from the left with a staggered cascade as the section scrolls into view. The standard marketing feature-list reveal.',
    heading: 'Feature list cascade on scroll',
    intro:
      'The staggered feature row is one of the most reused blocks in marketing pages, and the detail that makes it feel deliberate is per-row trigger offsets rather than one delay multiplied out. Each row gets its own trigger point, so the cascade tracks the reader’s scroll rather than running on a fixed clock once the section appears.',
    keywords: [
      'feature list animation',
      'staggered row reveal',
      'slide in on scroll',
      'feature section animation',
      'animate rows on scroll',
      'marketing page scroll animation',
      'cascade list animation',
      'staggered reveal css',
    ],
    related: ['scroll-text', 'scroll-animate-group'],
  },
  'scroll-video': {
    slug: 'scroll-video',
    title: 'Scroll-Scrubbed Video — Tie currentTime to Scroll',
    description:
      'Scrub a video frame by frame with scroll position, the Apple product-page effect. scrollVideo binds currentTime to scroll in one call.',
    heading: 'Video scrubbing on scroll',
    intro:
      'Scroll-scrubbed video is the Apple product-page effect: the reader controls playback with the scroll wheel. Mechanically it is just video.currentTime driven by scroll progress, and the parts that are actually fiddly are preloading enough of the file to scrub without stalling and handling browsers that need Range requests. scrollVideo covers those.',
    keywords: [
      'scroll video scrub',
      'video scrubbing on scroll',
      'apple scroll video effect',
      'scrollVideo',
      'control video with scroll',
      'video currentTime scroll',
      'scroll driven video playback',
      'frame by frame scroll video',
    ],
    related: ['scroll-pin', 'scroll-animate'],
  },

  // ── Batch 6 · layout APIs & setup ─────────────────────────────────────────
  'scroll-pin': {
    slug: 'scroll-pin',
    title: 'Pin a Section on Scroll Without GSAP — scrollPin',
    description:
      'Pin an element while the page scrolls past it — the Apple and Stripe walkthrough pattern. Wrapper-based, no layout shift, full lifecycle callbacks.',
    heading: 'Sticky pinned section on scroll',
    intro:
      'Pinning is the pattern behind almost every product walkthrough: an image holds still while copy scrolls past it. Doing it with position: sticky alone breaks down the moment you need to know when the pin started or ended. scrollPin wraps the target in a spacer so nothing shifts, and gives you onEnter, onLeave, onEnterBack and onLeaveBack.',
    keywords: [
      'pin section on scroll',
      'sticky scroll section',
      'gsap pin alternative',
      'scrollPin',
      'scrolltrigger pin alternative',
      'pin element while scrolling',
      'sticky product walkthrough',
      'scroll pin javascript',
    ],
    related: ['scroll-snap', 'scroll-video'],
  },
  'scroll-snap': {
    slug: 'scroll-snap',
    title: 'Horizontal Snap Carousel on Scroll — scrollSnap',
    description:
      'Drag or swipe between cards with threshold-based snapping and custom easing. onSnap keeps indicators in sync. 1.3 KB, no carousel library.',
    heading: 'Horizontal snap carousel',
    intro:
      'CSS scroll-snap is excellent until you need to know which slide you landed on, or want easing other than the browser default. scrollSnap keeps the drag feel but adds a threshold you control, custom easing, and an onSnap callback — which is what the dot indicators in this example are wired to, rather than polling scroll position.',
    keywords: [
      'horizontal scroll snap',
      'snap carousel javascript',
      'scrollSnap',
      'swipe carousel without library',
      'scroll snap with callback',
      'horizontal scroll sections',
      'drag carousel javascript',
      'section snapping scroll',
    ],
    related: ['scroll-pin', 'scroll-video'],
  },
  presets: {
    slug: 'presets',
    title: 'Scroll Animation Presets — One-Line Setup',
    description:
      'Five named presets — sketch, reveal, typewriter, cinematic, spring — set sensible defaults in one option. Your own options always win.',
    heading: 'Scroll animation presets',
    intro:
      'Most scroll animations want the same handful of option combinations, and getting there means learning the whole option surface first. A preset is shorthand for two to four of those options, so { preset: "sketch" } is a complete setup. They are not a lock-in: anything you pass alongside a preset overrides it, so a preset is a starting point rather than a mode.',
    keywords: [
      'scroll animation presets',
      'one line scroll animation',
      'animation preset library',
      'sketch animation preset',
      'typewriter scroll effect',
      'cinematic scroll animation',
      'spring easing scroll',
      'quick scroll animation setup',
    ],
    related: ['scroll-reveal', 'scroll-animate'],
  },
  astro: {
    slug: 'astro',
    title: 'Astro Scroll Animation — Zero-JS Server Components',
    description:
      'Add scroll animation to Astro with a data attribute and one init call. No framework wrapper, no hydration — options pass as a JSON attribute.',
    heading: 'Astro scroll animation',
    intro:
      'Astro’s whole premise is shipping no JavaScript unless you ask for it, so a component wrapper that forces hydration would defeat the point. Here the markup stays a server component: mark elements with data-scroll-draw, pass options as a JSON attribute, and call initScrollDraw() once from a client script. One small script for the whole page, no island per animation.',
    keywords: [
      'astro scroll animation',
      'astro svg animation',
      'zero js scroll animation',
      'astro animation library',
      'data attribute scroll animation',
      'astro island animation',
      'server component animation',
      'astro scroll effect',
    ],
    related: ['vue', 'presets'],
  },
};

export const SEO_SLUGS = Object.keys(EXAMPLE_SEO);
