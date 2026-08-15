/**
 * Single source of truth for every competitor figure quoted on this site.
 *
 * Why this file exists: CLAIMS-AUDIT.md (2026-08-14) found that competitor
 * numbers were hand-typed inline on each comparison page, with no source and no
 * expiry. Several had been wrong for a year — including claims about another
 * project's commercial terms. A stale comparison is a slow-motion false claim.
 *
 * Rules:
 *  1. No competitor figure ships on a page unless it comes from this file.
 *  2. Every entry records the version measured, the command that produced it,
 *     and the date. `npm run check:competitors` fails if any entry is older
 *     than MAX_AGE_DAYS, so the next audit is a script rather than an afternoon.
 *  3. `measured: true` means "produced by running the command". Anything marked
 *     `measured: false` is a capability judgement, not a number, and should say
 *     so on the page.
 *
 * To refresh: re-run each `command` below, update `gzipKb` / `license` /
 * `lastPublish`, and set `measuredOn` to today. Then `npm run check:competitors`.
 */

export const MAX_AGE_DAYS = 180;

export type Competitor = {
  /** npm package name, or a composite label for a multi-package stack. */
  name: string;
  /** Human-facing label used on comparison pages. */
  label: string;
  version: string;
  license: string;
  /** Minified + gzipped at level 9, in KB. */
  gzipKb: number;
  /** ISO date of the package's last npm publish, or null if not applicable. */
  lastPublish: string | null;
  /** The command that produced gzipKb — quoted on the page footnotes. */
  command: string;
  measured: boolean;
  /** Anything a reader needs to weigh the number fairly. */
  caveat?: string;
};

/** ISO date every figure below was measured. Drives the staleness check. */
export const MEASURED_ON = '2026-08-14';

export const SELF: Competitor = {
  name: 'svg-scroll-draw',
  label: 'svg-scroll-draw (all APIs)',
  version: '2.10.0',
  license: 'MIT',
  gzipKb: 10.0,
  lastPublish: '2026-08-14',
  command: 'npm run size',
  measured: true,
  caveat:
    'Main entry, every API at once. Each API is a separate entry point — scrollReveal alone is 3.9 KB, scrollPin 1.5 KB, scrollSnap 1.3 KB.',
};

/** Per-entry-point sizes, for like-for-like comparisons against single-purpose libraries. */
export const SELF_ENTRIES: Record<string, number> = {
  reveal: 3.9,
  pin: 1.5,
  snap: 1.3,
  text: 2.5,
};

export const COMPETITORS: Record<string, Competitor> = {
  gsapStack: {
    name: 'gsap + ScrollTrigger + DrawSVGPlugin',
    label: 'GSAP + ScrollTrigger + DrawSVG',
    version: '3.15.0',
    license: 'GreenSock Standard (free of charge)',
    gzipKb: 47.5,
    lastPublish: null,
    command:
      'npm pack gsap@3.15.0 && gzip -9 each of gsap.min.js (27.7) + ScrollTrigger.min.js (17.6) + DrawSVGPlugin.min.js (2.2)',
    measured: true,
    caveat:
      'The equivalent stack for what this library does. GSAP has been free for everyone — every former Club GreenSock plugin included — since Webflow released the toolset in 2025. It declares zero runtime dependencies, and ships GSDevTools.js.',
  },
  gsapCore: {
    name: 'gsap',
    label: 'GSAP core',
    version: '3.15.0',
    license: 'GreenSock Standard (free of charge)',
    gzipKb: 27.7,
    lastPublish: null,
    command: 'npm pack gsap@3.15.0 && gzip -9 package/dist/gsap.min.js',
    measured: true,
  },
  framerMotion: {
    name: 'framer-motion',
    label: 'Framer Motion',
    version: '13.1.0',
    license: 'MIT',
    gzipKb: 34.3,
    lastPublish: null,
    command: 'npm pack framer-motion@13.1.0 && gzip -9 the cjs entry',
    measured: true,
    caveat:
      'CJS entry. The single bundle is 61.6 KB; a tree-shaken modern ESM import can be well under both, because the ESM entry is a re-export shell and real cost depends on how much you touch. Framer Motion does draw SVG paths via pathLength / pathOffset / pathSpacing.',
  },
  aos: {
    name: 'aos',
    label: 'AOS',
    version: '2.3.4',
    license: 'MIT',
    gzipKb: 6.7,
    lastPublish: '2022-06-13',
    command:
      'npm pack aos@2.3.4 && gzip -9 package/dist/aos.js (4.6) + package/dist/aos.css (2.1)',
    measured: true,
    caveat:
      'Smaller than us. Includes its required stylesheet. Reveal-on-scroll only, configured through HTML data attributes. Ships 8 named CSS easings.',
  },
  scrollreveal: {
    name: 'scrollreveal',
    label: 'ScrollReveal.js',
    version: '4.0.9',
    license: 'GPL-3.0',
    gzipKb: 5.6,
    lastPublish: '2022-06-26',
    command:
      'npm pack scrollreveal@4.0.9 && gzip -9 package/dist/scrollreveal.min.js',
    measured: true,
    caveat:
      'Smaller than us, and GPL-3.0 rather than MIT — worth reading before shipping it inside a closed-source commercial product.',
  },
  scrollmagic: {
    name: 'scrollmagic',
    label: 'ScrollMagic',
    version: '2.0.9',
    license: 'MIT OR GPL-3.0+',
    gzipKb: 5.9,
    lastPublish: '2026-06-25',
    command: 'npm pack scrollmagic@2.0.9 && gzip -9 package/scrollmagic/minified/ScrollMagic.min.js',
    measured: true,
    caveat:
      'Smaller than us, but it only detects scroll — it has no animation engine of its own. The usual setup pairs it with GSAP via its animation.gsap plugin, so the real comparison is ScrollMagic + GSAP against us.',
  },
  motionOne: {
    name: 'motion',
    label: 'Motion',
    version: '13.1.0',
    license: 'MIT',
    gzipKb: 45.2,
    lastPublish: '2026-08-10',
    command: 'npm pack motion@13.1.0 && gzip -9 package/dist/motion.js',
    measured: true,
    caveat:
      'The single dist bundle. Motion is the successor package to framer-motion and shares its version line; a tree-shaken import of just the scroll helpers is far smaller than this figure.',
  },
  locomotive: {
    name: 'locomotive-scroll',
    label: 'Locomotive Scroll',
    version: '5.0.1',
    license: 'MIT',
    gzipKb: 9.3,
    lastPublish: '2026-01-15',
    command: 'npm pack locomotive-scroll@5.0.1 && gzip -9 package/bundled/locomotive-scroll.min.js',
    measured: true,
    caveat:
      'Roughly our size. v5 is a smooth-scroll and scroll-detection layer built on Lenis — it applies classes and reports progress, it does not animate SVG paths, split text or scrub video.',
  },
  lenis: {
    name: 'lenis',
    label: 'Lenis',
    version: '1.3.26',
    license: 'MIT',
    gzipKb: 5.3,
    lastPublish: '2026-08-05',
    command: 'npm pack lenis@1.3.26 && gzip -9 package/dist/lenis.min.js',
    measured: true,
    caveat:
      'Not a competitor. Lenis does smooth scrolling; this library does scroll-driven animation. They are designed to be used together, and svg-scroll-draw ships an adapter at svg-scroll-draw/lenis for Lenis v1.',
  },
  scrollSvg: {
    name: 'scroll-svg',
    label: 'scroll-svg',
    version: '1.5.2',
    license: 'MIT',
    gzipKb: 1.7,
    lastPublish: '2026-02-01',
    command: 'npm pack scroll-svg@1.5.2 && gzip -9 the dist entry',
    measured: true,
    caveat:
      'Smaller than us and actively published — do not describe it as abandoned. Draws paths; no reveal, pin, snap, text or video.',
  },
};

/** "10.0 KB vs 47.5 KB" → 4.75. Rounded to 2dp so pages cannot drift from the source. */
export function ratioVsSelf(key: keyof typeof COMPETITORS): number {
  return Math.round((COMPETITORS[key].gzipKb / SELF.gzipKb) * 100) / 100;
}

/** Standard footnote so every chart cites its own provenance. */
export function provenance(versions: string[]): string {
  return `All sizes minified + gzipped at level 9, measured ${MEASURED_ON} against ${versions.join(
    ', ',
  )} — measured, not estimated.`;
}
