/**
 * Blog post index — the single source for /blog, the RSS feed and the sitemap.
 *
 * Lives here rather than in app/blog/page.tsx so the feed route can import it
 * without pulling a page module (and its metadata export) into the request.
 */
export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  tag: string;
  tagColor: string;
  readTime: string;
  /** Human label shown on the index, e.g. "June 2026". */
  date: string;
  /** ISO date used for RSS pubDate and schema. */
  published?: string;
};

export const POSTS: BlogPost[] = [
  {
    slug: 'complete-guide-scroll-animations-2025',
    title: 'The complete guide to scroll animations in 2025',
    description:
      'Every scroll animation pattern — fade reveal, parallax, sticky pin, section snap, text split, video scrub, horizontal sections, CSS variables — with copy-paste code. 12 patterns, one library.',
    tag: 'Guide',
    tagColor: '#111',
    readTime: '15 min read',
    date: 'June 2026',
  },
  {
    slug: 'scroll-animation-performance',
    title: 'Scroll animation performance — native CSS vs JavaScript',
    description:
      'How svg-scroll-draw uses animation-timeline: view() for zero-JS scroll animations on the compositor. When native CSS wins, when JS wins, and how the eligibility check works.',
    tag: 'Performance',
    tagColor: '#22c55e',
    readTime: '8 min read',
    date: 'June 2026',
  },
  {
    slug: 'horizontal-scroll-sections',
    title: 'Horizontal scroll sections without GSAP — scrollHorizontal',
    description:
      'The Apple / Stripe product page pattern: vertical scroll drives horizontal movement. Build it with scrollHorizontal from svg-scroll-draw — one call, CSS setup, zero GSAP. Includes React example and sticky layout guide.',
    tag: 'How-To',
    tagColor: '#60a5fa',
    readTime: '6 min read',
    date: 'June 2026',
  },
  {
    slug: 'replace-aos-scrollreveal',
    title: 'Replace AOS / ScrollReveal.js with one function call',
    description:
      'scrollReveal from svg-scroll-draw: 7 presets, stagger, custom easing, no data attributes, no config files. Drop-in replacement for AOS and ScrollReveal.js — fully typed, part of a larger platform.',
    tag: 'Migration',
    tagColor: '#ef4444',
    readTime: '6 min read',
    date: 'June 2026',
  },
  {
    slug: 'scroll-pin-without-gsap',
    title: 'Pin sections on scroll without GSAP — scrollPin',
    description:
      'How to pin any element at a viewport position while the page scrolls past it. Wrapper-based layout, zero layout shift, full lifecycle callbacks (onEnter/onLeave/onEnterBack/onLeaveBack). No GSAP. ~10 KB total.',
    tag: 'How-To',
    tagColor: '#f59e0b',
    readTime: '7 min read',
    date: 'June 2026',
  },
  {
    slug: 'scroll-animation-groups',
    title: 'Animate multiple elements on scroll — one call',
    description:
      'scrollAnimateGroup, scrollAnimateSequence, scrollParallaxGroup, scrollDrawGroup — the complete guide to fan-out, cascade, and parallax animations across multiple elements. Real-world patterns for pricing grids, hero sections, and feature lists.',
    tag: 'Patterns',
    tagColor: '#ffc900',
    readTime: '7 min read',
    date: 'June 2026',
  },
  {
    slug: 'vue-svelte-solid-v2',
    title: 'scrollAnimate in Vue 3, Svelte, and Solid.js — v2 framework guide',
    description:
      'Full guide to using svg-scroll-draw v2 APIs in Vue 3, Svelte, and Solid.js. Composables, use: actions, hooks, component wrappers — with copy-paste examples for scrollAnimate, scrollText, scrollCounter, and scrollVideo.',
    tag: 'Framework Guide',
    tagColor: '#42b883',
    readTime: '9 min read',
    date: 'June 2026',
  },
  {
    slug: 'replace-gsap-scrolltrigger',
    title: 'Replace GSAP ScrollTrigger with scrollAnimate',
    description:
      'Full migration guide: scrollAnimate covers 95% of ScrollTrigger use cases at 9× smaller bundle size. Side-by-side code for fade/slide, parallax, counters, text reveals, and video scrubbing.',
    tag: 'Migration',
    tagColor: '#ef4444',
    readTime: '8 min read',
    date: 'June 2026',
  },
  {
    slug: '5-patterns-under-10-lines',
    title: '5 scroll animation patterns in under 10 lines',
    description:
      'Logo reveal, sketch diagram, typewriter, cinematic hero, and spring icon — five production-ready patterns each in 3 lines using svg-scroll-draw presets. No config, no GSAP.',
    tag: 'Patterns',
    tagColor: '#ffc900',
    readTime: '5 min read',
    date: 'June 2026',
  },
  {
    slug: 'scroll-path-morphing',
    title: 'Scroll-driven SVG path morphing with morphTo',
    description:
      'How to interpolate SVG path shapes as you scroll using the morphTo option. Path compatibility, use cases, combining with fade and strokeColor, and a full API reference.',
    tag: 'Deep Dive',
    tagColor: '#5865F2',
    readTime: '6 min read',
    date: 'June 2026',
  },
  {
    slug: 'native-css-svg-scroll-animations',
    title: 'Zero-JS SVG scroll animations with native CSS',
    description:
      'How svg-scroll-draw uses animation-timeline: view() to run SVG path animations on the browser compositor — zero per-frame JavaScript, no scroll listeners, 60fps guaranteed.',
    tag: 'Performance',
    tagColor: '#22c55e',
    readTime: '7 min read',
    date: 'June 2026',
  },
  {
    slug: 'gsap-drawsvg-alternative',
    title: 'svg-scroll-draw vs GSAP DrawSVG',
    description:
      'Bundle size, licensing, side-by-side code, a full feature matrix, and a migration guide. The definitive comparison for developers choosing between the two.',
    tag: 'Comparison',
    tagColor: '#ff90e8',
    readTime: '6 min read',
    date: 'May 2026',
  },
];
