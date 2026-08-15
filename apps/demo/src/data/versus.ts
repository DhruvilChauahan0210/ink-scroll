/**
 * Comparison pages beyond the original three (/vs-gsap, /vs-aos, /vs-framer-motion).
 *
 * Every figure here comes from src/data/competitors.ts, which records the
 * version, the licence, the measurement date and the command that produced it.
 * CLAIMS-AUDIT.md is the standard: a comparison page states what was measured,
 * says plainly when a competitor wins, and never characterises someone else's
 * project in terms its maintainer would dispute.
 *
 * Note what is deliberately absent: there is no /vs-lenis. Lenis does smooth
 * scrolling, this library does scroll-driven animation, and we ship an adapter
 * for it — framing it as a competitor would be dishonest. It gets an
 * integration page instead.
 */
import { COMPETITORS, SELF } from './competitors';

export type VersusRow = {
  feature: string;
  us: boolean | string | 'partial';
  them: boolean | string | 'partial';
  note?: string;
};

export type Versus = {
  slug: string;
  /** Key into COMPETITORS — the page reads every figure from there. */
  competitorKey: keyof typeof COMPETITORS;
  title: string;
  description: string;
  keywords: string[];
  headline: string;
  /** Lede. Says plainly if they are smaller than us. */
  intro: string;
  /** The honest one-line summary of who should pick which. */
  verdict: string;
  rows: VersusRow[];
  /** Cases where the competitor is the better choice. Not optional. */
  theirWins: { title: string; desc: string }[];
  faq: { q: string; a: string }[];
  sizeNote: string;
};

const us = SELF.gzipKb;

export const VERSUS: Versus[] = [
  {
    slug: 'vs-scrollmagic',
    competitorKey: 'scrollmagic',
    title: 'ScrollMagic Alternative — One Library, No GSAP Plugin',
    description:
      'svg-scroll-draw vs ScrollMagic: ScrollMagic detects scroll but has no animation engine, so it needs GSAP. This does both in one 10 KB package.',
    keywords: [
      'scrollmagic alternative',
      'scrollmagic replacement',
      'svg-scroll-draw vs scrollmagic',
      'scrollmagic vs gsap scrolltrigger',
      'modern scrollmagic alternative',
      'scroll animation without scrollmagic',
      'scrollmagic 2026',
      'scrollmagic gsap plugin',
    ],
    headline: 'One library, not two.',
    intro: `ScrollMagic is ${COMPETITORS.scrollmagic.gzipKb} KB against our ${us} KB, so on raw numbers it wins — but that figure buys you scroll *detection* only. ScrollMagic has no animation engine: to actually move anything you pair it with GSAP through its animation.gsap plugin, which puts the real total well past ours. That is the comparison worth making, and it is the one this page makes.`,
    verdict:
      'Pick ScrollMagic if you already have GSAP in the bundle and want its scene/controller model. Pick this if you would rather not ship two libraries to animate one element.',
    rows: [
      { feature: 'Detects scroll position / triggers', us: true, them: true },
      { feature: 'Animates without a second library', us: true, them: false, note: 'ScrollMagic delegates animation — typically to GSAP via animation.gsap, or to Velocity' },
      { feature: 'SVG path draw', us: true, them: false, note: 'Only via GSAP DrawSVG' },
      { feature: 'Text split + stagger', us: true, them: false },
      { feature: 'Number counters', us: true, them: false },
      { feature: 'Video scrub', us: true, them: false },
      { feature: 'Pin / sticky sections', us: true, them: true },
      { feature: 'Section snapping', us: true, them: false },
      { feature: 'Native CSS fast path', us: true, them: false, note: 'ScrollMagic predates animation-timeline: view() by about a decade' },
      { feature: 'Framework wrappers', us: '8', them: false, note: 'jQuery plugin only' },
      { feature: 'TypeScript types shipped', us: true, them: false, note: 'Community types exist on DefinitelyTyped' },
      { feature: 'Tree-shakeable entry points', us: true, them: false },
      { feature: 'Debug indicators', us: true, them: true, note: 'Both ship a visual debug overlay — ScrollMagic via its debug.addIndicators plugin' },
      { feature: 'Bundle size (gzipped)', us: `${us} KB`, them: `${COMPETITORS.scrollmagic.gzipKb} KB`, note: 'ScrollMagic alone. Add GSAP core + ScrollTrigger to animate anything and it is 45+ KB on top.' },
    ],
    theirWins: [
      { title: 'The scene/controller model', desc: 'ScrollMagic’s Scene and Controller abstraction is genuinely expressive for complex multi-trigger pages, and some teams prefer thinking in scenes.' },
      { title: 'You already ship GSAP', desc: 'If GSAP is in the bundle regardless, ScrollMagic adds only 5.9 KB on top and reuses an animation engine you have already paid for.' },
      { title: 'A decade of answers', desc: 'ScrollMagic has been around since 2014. Almost any question has a Stack Overflow answer already.' },
    ],
    faq: [
      {
        q: 'Is ScrollMagic still maintained?',
        a: `The npm package was last published ${COMPETITORS.scrollmagic.lastPublish}. It is a stable, finished library rather than an abandoned one — but it predates modern scroll APIs, so it uses scroll listeners rather than IntersectionObserver and has no path to the native CSS scroll timeline.`,
      },
      {
        q: 'Does ScrollMagic need GSAP?',
        a: 'For animation, effectively yes. ScrollMagic detects scroll and manages scenes; it does not interpolate values. The standard setup adds GSAP through the animation.gsap plugin, so the practical bundle is ScrollMagic plus GSAP core plus ScrollTrigger.',
      },
      {
        q: 'What is a modern ScrollMagic alternative?',
        a: `svg-scroll-draw covers detection and animation in one ${us} KB package with zero dependencies, eight framework wrappers, shipped TypeScript types, and a native CSS fast path. GSAP ScrollTrigger is the other obvious answer and is broader still.`,
      },
    ],
    sizeNote:
      'ScrollMagic is smaller on its own and we are not going to pretend otherwise. The number that matters for a page that actually animates something is ScrollMagic plus an animation engine.',
  },
  {
    slug: 'vs-motion',
    competitorKey: 'motionOne',
    title: 'Motion Alternative for Scroll — 10 KB vs 45 KB',
    description:
      'svg-scroll-draw vs Motion (motion.dev): a scroll-specialised 10 KB library against a general animation engine. Feature matrix and measured sizes.',
    keywords: [
      'motion one alternative',
      'motion.dev alternative',
      'motion scroll animation',
      'svg-scroll-draw vs motion',
      'lightweight motion alternative',
      'scroll animation library comparison',
      'motion vs gsap scroll',
      'framer motion successor',
    ],
    headline: 'Scroll-specialised, not general.',
    intro: `Motion is the successor to Framer Motion and a genuinely excellent general animation engine — springs, gestures, layout animations, timelines. This is not that. This library does one axis, scroll, and does the scroll-specific things Motion leaves to you: SVG path drawing, pinning, snapping, text splitting and video scrubbing. The size gap follows from the scope gap: ${us} KB against ${COMPETITORS.motionOne.gzipKb} KB for Motion’s single bundle.`,
    verdict:
      'Pick Motion if you animate more than scroll — gestures, layout, springs, enter/exit. Pick this if scroll is the whole job and you would rather ship a tenth of the bytes.',
    rows: [
      { feature: 'Scroll-driven animation', us: true, them: true },
      { feature: 'SVG path draw', us: true, them: 'partial', note: 'Motion animates any attribute, so pathLength works — but there is no draw-specific API, stagger orchestration or preset' },
      { feature: 'Pin / sticky sections', us: true, them: false },
      { feature: 'Section snapping', us: true, them: false },
      { feature: 'Text split + stagger', us: true, them: false, note: 'No splitText in the published bundle; you split the DOM yourself' },
      { feature: 'Number counters', us: true, them: 'partial', note: 'animate() on a value plus an onUpdate handler; no format helper' },
      { feature: 'Video scrub', us: true, them: false },
      { feature: 'Horizontal scroll sections', us: true, them: false },
      { feature: 'Spring physics', us: 'partial', them: true, note: 'We ship createSpring for easing; Motion has a real physics model with velocity transfer' },
      { feature: 'Gestures (drag, hover, tap)', us: false, them: true, note: 'Motion’s gesture system has no equivalent here and is not something we intend to build' },
      { feature: 'Layout / shared-element animation', us: false, them: true },
      { feature: 'Enter/exit animation', us: false, them: true },
      { feature: 'Native CSS fast path', us: true, them: 'partial', note: 'Motion uses WAAPI where it can, which is close in spirit; ours compiles eligible draws to a CSS view-timeline with no per-frame JS at all' },
      { feature: 'Bundle size (gzipped)', us: `${us} KB`, them: `${COMPETITORS.motionOne.gzipKb} KB`, note: 'Motion’s single dist bundle. A tree-shaken import of only its scroll helpers is considerably smaller.' },
    ],
    theirWins: [
      { title: 'Everything that is not scroll', desc: 'Gestures, drag, layout animations, enter/exit, orchestrated variants. Motion is a complete animation system; this is a scroll library.' },
      { title: 'Real spring physics', desc: 'Motion models velocity and mass properly, including handing velocity from a gesture into a spring. Our createSpring is a spring-shaped easing curve, not a physics engine.' },
      { title: 'Tree-shaking makes the size gap smaller', desc: 'The 45.2 KB figure is the full bundle. Import only what you use and Motion is far lighter than that number suggests.' },
    ],
    faq: [
      {
        q: 'What is the difference between Motion and svg-scroll-draw?',
        a: `Motion is a general animation engine covering gestures, layout, springs and enter/exit as well as scroll. svg-scroll-draw only does scroll, but covers scroll-specific work Motion does not — SVG path drawing with stagger, pinning, snapping, text splitting and video scrubbing — at ${us} KB against ${COMPETITORS.motionOne.gzipKb} KB.`,
      },
      {
        q: 'Is Motion the same as Framer Motion?',
        a: 'Motion is the successor package and shares the same version line; framer-motion remains the React-specific entry point. Both are MIT licensed and actively published.',
      },
      {
        q: 'Can I use both together?',
        a: 'Yes. They touch different properties and neither patches global scroll state, so using Motion for gestures and layout alongside this for scroll-driven work is a reasonable setup.',
      },
    ],
    sizeNote:
      'Motion’s figure is its single bundle, which is the fairest like-for-like against our main entry — but tree-shaking helps Motion more than it helps us, because we already split every API into its own entry point.',
  },
  {
    slug: 'vs-locomotive-scroll',
    competitorKey: 'locomotive',
    title: 'Locomotive Scroll Alternative — Animation, Not Smooth Scroll',
    description:
      'svg-scroll-draw vs Locomotive Scroll: Locomotive smooths scrolling and reports progress; this animates. Measured sizes and an honest feature matrix.',
    keywords: [
      'locomotive scroll alternative',
      'locomotive scroll v5',
      'svg-scroll-draw vs locomotive scroll',
      'smooth scroll animation library',
      'locomotive scroll replacement',
      'scroll animation without locomotive',
      'locomotive scroll lenis',
      'data-scroll alternative',
    ],
    headline: 'Different jobs, similar size.',
    intro: `These two are close in size — ${COMPETITORS.locomotive.gzipKb} KB against our ${us} KB — and easy to mistake for alternatives, but they do different jobs. Locomotive Scroll v5 is a smooth-scroll and scroll-detection layer built on Lenis: it eases the scroll itself and applies classes or progress values as elements pass through the viewport. It does not interpolate SVG paths, split text or scrub video. If you want the momentum feel, you want Locomotive or Lenis. If you want things to animate, you want this.`,
    verdict:
      'Pick Locomotive for smooth scrolling with simple in-view triggers. Pick this for the animation itself — and note you can run both, since v5 is Lenis-based.',
    rows: [
      { feature: 'Smooth / eased scrolling', us: false, them: true, note: 'Not something we do or plan to — it is Lenis’s job, and we ship an adapter for it' },
      { feature: 'In-view detection', us: true, them: true },
      { feature: 'Scroll progress value', us: true, them: true, note: 'Ours is exposed as a CSS custom property so you can drive CSS without a callback' },
      { feature: 'SVG path draw', us: true, them: false },
      { feature: 'Animate arbitrary CSS properties', us: true, them: 'partial', note: 'Locomotive applies classes and progress; the animating is left to your CSS' },
      { feature: 'Text split + stagger', us: true, them: false },
      { feature: 'Number counters', us: true, them: false },
      { feature: 'Video scrub', us: true, them: false },
      { feature: 'Pin / sticky sections', us: true, them: 'partial', note: 'data-scroll-sticky covers the basic case' },
      { feature: 'Parallax', us: true, them: true },
      { feature: 'Horizontal scroll sections', us: true, them: true },
      { feature: 'Config in HTML attributes', us: false, them: true, note: 'A genuine preference difference, not a defect either way' },
      { feature: 'Framework wrappers', us: '8', them: false },
      { feature: 'Bundle size (gzipped)', us: `${us} KB`, them: `${COMPETITORS.locomotive.gzipKb} KB`, note: 'Locomotive’s bundled build, which includes Lenis' },
    ],
    theirWins: [
      { title: 'Smooth scrolling', desc: 'The momentum feel is the entire point of Locomotive and we do not compete with it. If that is what you are after, use Locomotive or Lenis directly.' },
      { title: 'Attribute-driven setup', desc: 'data-scroll attributes mean no JavaScript per element. If your team prefers configuration in markup, that is a real advantage.' },
      { title: 'It is Lenis underneath', desc: 'v5 rebuilt on Lenis, so you get a well-maintained smooth-scroll core rather than a bespoke scroll hijack.' },
    ],
    faq: [
      {
        q: 'Is Locomotive Scroll an alternative to svg-scroll-draw?',
        a: 'Not really — they solve different problems. Locomotive smooths the scroll and reports when elements enter view; svg-scroll-draw animates SVG paths, text, counters and video against scroll position. Many sites want both.',
      },
      {
        q: 'Can I use Locomotive Scroll with svg-scroll-draw?',
        a: 'Yes. Locomotive v5 is built on Lenis, and Lenis v2 and later patch window.scrollY natively, so our engines read the correct value with no adapter. For Lenis v1 there is an adapter at svg-scroll-draw/lenis.',
      },
      {
        q: 'Which is smaller?',
        a: `Locomotive Scroll is ${COMPETITORS.locomotive.gzipKb} KB and svg-scroll-draw is ${us} KB for every API at once, measured at gzip level 9. They are close enough that size should not decide it — scope should.`,
      },
    ],
    sizeNote:
      'These are close enough in size that the number is not the argument. What differs is what you get for it: smooth scrolling and triggers, versus an animation engine.',
  },
];

export const VERSUS_SLUGS = VERSUS.map((v) => v.slug);
