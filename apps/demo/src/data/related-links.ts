/**
 * Internal linking map: blog post → the example and landing pages it should link to.
 *
 * Why this exists: the site gained 34 URLs (23 example pages, 6 framework
 * landings, 4 comparison/integration pages) that the 12 blog posts had no way
 * to reach. A page with no internal links pointing at it is a page Google
 * crawls late and ranks poorly, however good it is — and the blog posts are the
 * pages with the most existing authority to pass on.
 *
 * Rule for adding an entry: only link where a reader would actually want to go
 * next. A related-links block stuffed with every page is link spam and reads
 * like it. Three to five genuinely relevant destinations beats twelve.
 */

export type RelatedLinks = {
  /** Example slugs — resolved against EXAMPLE_SEO for the label and blurb. */
  examples?: string[];
  /** Absolute paths to landing/comparison pages, with a hand-written label. */
  pages?: { href: string; label: string; blurb: string }[];
};

export const RELATED_BY_POST: Record<string, RelatedLinks> = {
  'complete-guide-scroll-animations-2025': {
    examples: ['scroll-reveal', 'scroll-pin', 'scroll-snap', 'scroll-text', 'scroll-video'],
  },
  'scroll-animation-performance': {
    examples: ['presets', 'logo-reveal'],
    pages: [
      { href: '/vs-gsap', label: 'svg-scroll-draw vs GSAP', blurb: 'Measured sizes and where GSAP is still the better call.' },
    ],
  },
  'horizontal-scroll-sections': {
    examples: ['scroll-snap', 'scroll-pin'],
    pages: [
      { href: '/vs-locomotive-scroll', label: 'vs Locomotive Scroll', blurb: 'Locomotive also does horizontal sections — and is smaller. What differs is scope.' },
    ],
  },
  'replace-aos-scrollreveal': {
    examples: ['scroll-reveal', 'scroll-animate-group'],
    pages: [
      { href: '/vs-aos', label: 'vs AOS and ScrollReveal', blurb: 'Both are smaller than us. The honest comparison, with measured figures.' },
    ],
  },
  'scroll-pin-without-gsap': {
    examples: ['scroll-pin', 'scroll-video'],
    pages: [
      { href: '/vs-scrollmagic', label: 'vs ScrollMagic', blurb: 'ScrollMagic pins too — but needs GSAP to animate anything.' },
    ],
  },
  'scroll-animation-groups': {
    examples: ['group-api', 'scroll-animate-group', 'sequence-api'],
  },
  'vue-svelte-solid-v2': {
    examples: ['vue', 'svelte', 'solid', 'astro'],
    pages: [
      { href: '/vue-scroll-animation', label: 'Vue 3 guide', blurb: 'Composable and component, with SSR notes.' },
      { href: '/svelte-scroll-animation', label: 'Svelte guide', blurb: 'Native actions — no wrapper element.' },
      { href: '/solid-scroll-animation', label: 'Solid.js guide', blurb: 'Runs outside the reactive graph, so no re-renders.' },
      { href: '/nuxt-scroll-animation', label: 'Nuxt 3 guide', blurb: 'Per-component imports or one global plugin. SSR-safe either way.' },
      { href: '/astro-scroll-animation', label: 'Astro guide', blurb: 'A data attribute and one init call — no island, no hydration.' },
      { href: '/angular-scroll-animation', label: 'Angular guide', blurb: 'Plain classes driven from ngAfterViewInit. No @angular/core dependency.' },
    ],
  },
  'replace-gsap-scrolltrigger': {
    examples: ['scroll-animate', 'timeline-api', 'scroll-pin'],
    pages: [
      { href: '/vs-gsap', label: 'The full GSAP comparison', blurb: '10.0 KB vs 47.5 KB measured — and GSAP has been free since 2025.' },
    ],
  },
  '5-patterns-under-10-lines': {
    examples: ['scroll-reveal', 'scroll-counter', 'scroll-text', 'scroll-text-lines', 'presets'],
  },
  'scroll-path-morphing': {
    examples: ['logo-reveal', 'signature'],
  },
  'native-css-svg-scroll-animations': {
    examples: ['logo-reveal', 'presets'],
    pages: [
      { href: '/lenis-scroll-animation', label: 'Using Lenis alongside this', blurb: 'Smooth scrolling bypasses the native CSS path — here is why.' },
    ],
  },
  'gsap-drawsvg-alternative': {
    examples: ['logo-reveal', 'signature', 'line-chart', 'flowchart', 'network', 'map-route'],
    pages: [
      { href: '/vs-gsap', label: 'The full GSAP comparison', blurb: 'Beyond DrawSVG — the whole feature matrix, measured.' },
    ],
  },
};
