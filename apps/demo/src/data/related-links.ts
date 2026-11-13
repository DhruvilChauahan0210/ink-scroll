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
  /** Tool slugs (data/tools.ts) that build what the post describes — at most two. */
  tools?: string[];
};

export const RELATED_BY_POST: Record<string, RelatedLinks> = {
  'css-scroll-snap': {
    examples: ['scroll-snap', 'scroll-pin'],
    tools: ['css-scroll-snap-generator', 'horizontal-scroll-generator'],
    pages: [
      { href: '/scroll-pin-generator', label: 'Scroll pin generator', blurb: 'Hold a section in place while steps change, instead of snapping between them.' },
    ],
  },
  'parallax-scrolling-css': {
    examples: ['scroll-animate', 'scroll-animate-group'],
    tools: ['parallax-scrolling-generator', 'scroll-trigger-visualizer'],
    pages: [
      { href: '/easing-visualizer', label: 'Easing visualizer', blurb: 'See how an easing changes the speed of a layer as it moves.' },
    ],
  },
  'reading-progress-bar-css': {
    examples: ['scroll-animate', 'scroll-counter'],
    tools: ['scroll-progress-bar-generator', 'css-scroll-driven-animation-generator'],
    pages: [
      { href: '/scroll-trigger-visualizer', label: 'Scroll trigger visualizer', blurb: 'Watch the top-top to bottom-bottom trigger turn into progress from 0 to 1.' },
    ],
  },
  'svg-line-drawing-animation-css': {
    examples: ['logo-reveal', 'signature'],
    tools: ['svg-line-drawing-generator', 'svg-path-viewer'],
    pages: [
      { href: '/svg-path-editor', label: 'SVG path editor', blurb: 'Reverse a path to change where it starts drawing, or move its points.' },
    ],
  },
  'css-scroll-driven-animations': {
    examples: ['scroll-reveal', 'scroll-animate'],
    tools: ['css-scroll-driven-animation-generator', 'scroll-trigger-visualizer'],
    pages: [
      { href: '/scroll-progress-bar-generator', label: 'Scroll progress bar generator', blurb: 'The scroll(root) bar from this post, on any edge or as a ring.' },
    ],
  },
  'text-animation-on-scroll': {
    examples: ['scroll-text', 'scroll-text-lines'],
    tools: ['text-animation-generator', 'text-fill-scroll-generator'],
    pages: [
      { href: '/aos-animation', label: 'AOS animation examples', blurb: 'Every data-aos effect running live, for revealing whole blocks.' },
    ],
  },
  'complete-guide-scroll-animations-2026': {
    examples: ['scroll-reveal', 'scroll-pin', 'scroll-snap', 'scroll-text', 'scroll-video'],
    tools: ['scroll-reveal-generator', 'scroll-trigger-visualizer'],
  },
  'scroll-animation-performance': {
    examples: ['presets', 'logo-reveal'],
    tools: ['css-scroll-driven-animation-generator'],
    pages: [
      { href: '/vs-gsap', label: 'svg-scroll-draw vs GSAP', blurb: 'Measured sizes and where GSAP is still the better call.' },
    ],
  },
  'unslop-ai-looking-ui': {
    examples: ['scroll-reveal', 'scroll-text'],
    pages: [
      { href: '/blocks', label: 'Scroll blocks', blurb: 'The copy-paste blocks, after the same passes.' },
      { href: '/blog/reduced-motion-scroll-animations', label: 'Reduced motion, effect by effect', blurb: 'What each scroll effect should do when a reader asks for less motion.' },
    ],
  },
  'reduced-motion-scroll-animations': {
    examples: ['scroll-reveal', 'scroll-snap', 'scroll-video'],
    pages: [
      { href: '/blog/horizontal-scroll-sections', label: 'Horizontal scroll sections', blurb: 'The strip that keeps scrubbing under reduced motion, built step by step.' },
      { href: '/blog/unslop-ai-looking-ui', label: 'Unslopping a site', blurb: 'Thirteen signs of AI-looking UI on this site, and how each was fixed.' },
    ],
  },
  'accessible-split-text-animation': {
    examples: ['scroll-text', 'scroll-text-lines'],
    tools: ['text-animation-generator', 'typewriter-effect-generator'],
    pages: [
      { href: '/react-scroll-animation', label: 'React scroll animation', blurb: 'scrollText and the rest as React components and hooks.' },
      { href: '/blog/unslop-ai-looking-ui', label: 'Unslopping a site', blurb: 'The design audit that came after the accessibility one.' },
    ],
  },
  'horizontal-scroll-sections': {
    examples: ['scroll-snap', 'scroll-pin'],
    tools: ['horizontal-scroll-generator', 'css-scroll-snap-generator'],
    pages: [
      { href: '/vs-locomotive-scroll', label: 'vs Locomotive Scroll', blurb: 'Locomotive also does horizontal sections — and is smaller. What differs is scope.' },
    ],
  },
  'replace-aos-scrollreveal': {
    examples: ['scroll-reveal', 'scroll-animate-group'],
    tools: ['aos-animation', 'scroll-reveal-generator'],
    pages: [
      { href: '/vs-aos', label: 'vs AOS and ScrollReveal', blurb: 'Both are smaller than us. The honest comparison, with measured figures.' },
    ],
  },
  'scroll-pin-without-gsap': {
    examples: ['scroll-pin', 'scroll-video'],
    tools: ['scroll-pin-generator', 'scroll-video-scrub-generator'],
    pages: [
      { href: '/vs-scrollmagic', label: 'vs ScrollMagic', blurb: 'ScrollMagic pins too — but needs GSAP to animate anything.' },
    ],
  },
  'scroll-animation-groups': {
    examples: ['group-api', 'scroll-animate-group', 'sequence-api'],
    tools: ['scroll-reveal-generator'],
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
    tools: ['scroll-trigger-visualizer', 'scroll-pin-generator'],
    pages: [
      { href: '/vs-gsap', label: 'The full GSAP comparison', blurb: '10.7 KB vs 47.5 KB measured — and GSAP has been free since 2025.' },
    ],
  },
  '5-patterns-under-10-lines': {
    examples: ['scroll-reveal', 'scroll-counter', 'scroll-text', 'scroll-text-lines', 'presets'],
    tools: ['counter-animation-generator', 'text-animation-generator'],
  },
  'scroll-path-morphing': {
    examples: ['logo-reveal', 'signature'],
    tools: ['svg-morph-generator', 'svg-path-editor'],
  },
  'native-css-svg-scroll-animations': {
    examples: ['logo-reveal', 'presets'],
    tools: ['css-scroll-driven-animation-generator', 'svg-line-drawing-generator'],
    pages: [
      { href: '/lenis-scroll-animation', label: 'Using Lenis alongside this', blurb: 'Smooth scrolling bypasses the native CSS path — here is why.' },
    ],
  },
  'gsap-drawsvg-alternative': {
    examples: ['logo-reveal', 'signature', 'line-chart', 'flowchart', 'network', 'map-route'],
    tools: ['svg-path-viewer', 'svg-line-drawing-generator'],
    pages: [
      { href: '/vs-gsap', label: 'The full GSAP comparison', blurb: 'Beyond DrawSVG — the whole feature matrix, measured.' },
    ],
  },
};
