/**
 * Migration guides for people already on AOS, ScrollReveal, vivus or GSAP
 * ScrollTrigger in React or Next.js — the searches those libraries' users
 * actually make.
 *
 * Rules, as for the comparison pages: every claim about the other library must
 * be true of the release measured in competitors.ts (AOS 2.3.4, ScrollReveal
 * 4.0.9, vivus 0.4.6, gsap 3.15.0), every size comes from competitors.ts rather
 * than being typed here, and every code sample must run against the published
 * package as written. GSAP is free, every plugin included, since 2025 — never
 * call it paid.
 */

import { COMPETITORS, SELF, SELF_ENTRIES } from './competitors';

const SB = 'https://stackblitz.com/github/DhruvilChauahan0210/ink-scroll/tree/main/examples';

const kb = (n: number) => `${n.toFixed(1)} KB`;
const GSAP = COMPETITORS.gsapStack;
const GSAP_CORE = COMPETITORS.gsapCore.gzipKb;
const GSAP_TRIGGER = COMPETITORS.gsapScroll.gzipKb - COMPETITORS.gsapCore.gzipKb;
const GSAP_DRAWSVG = GSAP.gzipKb - COMPETITORS.gsapScroll.gzipKb;

export type GuideStep = {
  title: string;
  body: string;
  code?: string;
  file?: string;
};

/**
 * fig. 1 for a guide that is not about a drop-in. The drop-ins build theirs from
 * competitors.ts by key; anything else spells its rows out, still from that file.
 */
export type GuideSwap = {
  /** Header over the right-hand column — "drop-in" is only true of the drop-ins. */
  to: string;
  rows: { k: string; before: string; after: string }[];
};

export type Guide = {
  slug: string;
  /** The library being migrated from, as people write it. */
  from: 'AOS' | 'ScrollReveal' | 'vivus' | 'GSAP ScrollTrigger';
  framework: 'React' | 'Next.js';
  title: string;
  description: string;
  keywords: string[];
  headline: string;
  intro: string;
  /** What goes wrong with the usual setup — each point true of the original's last release. */
  problems: string[];
  steps: GuideStep[];
  /** What stays exactly the same after the switch. */
  unchanged: string[];
  faq: { q: string; a: string }[];
  starter: string;
  compare: { href: string; label: string };
  swap?: GuideSwap;
};

export const GUIDES: Guide[] = [
  {
    slug: 'aos-nextjs',
    from: 'AOS',
    framework: 'Next.js',
    title: 'AOS in Next.js App Router: Setup That Cleans Up',
    description:
      'Use AOS animate-on-scroll in the Next.js App Router: one <AOSInit /> in your layout, StrictMode-safe, keeps every data-aos attribute. No aos.css.',
    keywords: [
      'aos nextjs',
      'aos next.js app router',
      'animate on scroll nextjs',
      'aos init nextjs',
      'aos react nextjs layout',
      'next.js scroll animation data-aos',
    ],
    headline: 'AOS in the App Router, set up once.',
    intro:
      'Most AOS setups in Next.js are a client component that calls AOS.init() inside a useEffect. It works, but AOS was written before React: it has no way to stop. svg-scroll-draw/aos is a drop-in that keeps the AOS API and your data-aos markup, adds destroy(), and ships a "use client" component you can put straight into app/layout.tsx.',
    problems: [
      'AOS 2.3.4 has init, refresh and refreshHard — no destroy. Every init() adds its scroll, resize and orientation listeners and starts another MutationObserver, and nothing removes them.',
      "React's StrictMode mounts, unmounts and remounts effects in development, so a plain useEffect(() => AOS.init(), []) runs init twice and nothing undoes the first.",
      'The useEffect has to live in a client component, so a layout needs a separate wrapper file just to start AOS.',
      'aos.css is a separate stylesheet you have to import globally.',
    ],
    steps: [
      {
        title: 'Switch the package — one command',
        body: 'This rewrites the aos import, removes the aos.css import and swaps the dependency in package.json. Preview with --dry-run first; it refuses to write over uncommitted git changes.',
        code: 'npx svg-scroll-draw migrate --dry-run\nnpx svg-scroll-draw migrate\nnpm install',
        file: 'terminal',
      },
      {
        title: 'Start AOS from the layout',
        body: 'AOSInit is a client component, so a Server Component layout can render it directly. It initialises on mount and destroys on unmount, which makes StrictMode’s double mount harmless. Delete your old wrapper component and its useEffect.',
        code: `import { AOSInit } from 'svg-scroll-draw/aos/react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AOSInit once duration={700} />
        {children}
      </body>
    </html>
  );
}`,
        file: 'app/layout.tsx',
      },
      {
        title: 'Re-measure when the layout moves (optional)',
        body: 'New [data-aos] elements that a navigation renders are picked up automatically by a MutationObserver. If something else shifts the page — images loading, data arriving — pass a refreshKey and positions are measured again when it changes.',
        code: `'use client';
import { usePathname } from 'next/navigation';
import { useAOS } from 'svg-scroll-draw/aos/react';

export function AOSWithRoute() {
  useAOS({ once: true }, usePathname());
  return null;
}`,
        file: 'app/aos-with-route.tsx',
      },
    ],
    unchanged: [
      'Every data-aos, data-aos-offset, data-aos-delay, data-aos-duration, data-aos-easing and data-aos-anchor-placement attribute.',
      'The animations themselves: the drop-in mirrors aos.css 2.3.4 rule for rule, so custom [data-aos="…"] CSS keeps working.',
      'Trigger positions: the browser test suite runs AOS 2.3.4 beside the drop-in and checks they animate the same elements at the same scroll positions.',
    ],
    faq: [
      {
        q: 'Do I still need aos.css?',
        a: 'No. The drop-in injects the same rules itself when AOS starts. Remove the import (npx svg-scroll-draw migrate does it for you).',
      },
      {
        q: 'Does it work with the Pages Router too?',
        a: 'Yes. Render <AOSInit /> in pages/_app.tsx, or call useAOS() in a component that mounts on every page.',
      },
      {
        q: 'Will it run on the server?',
        a: 'No — it renders nothing on the server and starts in the browser after hydration. Importing it in a Server Component file is fine because the entry is marked "use client".',
      },
      {
        q: 'What about users who prefer reduced motion?',
        a: 'With prefers-reduced-motion: reduce, every element is shown in its final state immediately. AOS itself ignores that setting.',
      },
    ],
    starter: `${SB}/aos`,
    compare: { href: '/vs-aos', label: 'AOS vs svg-scroll-draw' },
  },
  {
    slug: 'aos-react',
    from: 'AOS',
    framework: 'React',
    title: 'AOS in React: A StrictMode-Safe useAOS Hook',
    description:
      'Animate on scroll in React with your existing AOS markup: useAOS() starts AOS, cleans up on unmount and survives StrictMode. Drop-in, no aos.css.',
    keywords: [
      'aos react',
      'react animate on scroll',
      'aos react hook',
      'aos init react useeffect',
      'react aos strictmode',
      'aos react vite',
    ],
    headline: 'AOS in React, without the useEffect.',
    intro:
      'The usual React setup for AOS is a useEffect that calls AOS.init() once. svg-scroll-draw/aos keeps the AOS API and every data-aos attribute, and its React entry gives you a hook that also stops AOS when the component goes away.',
    problems: [
      'AOS 2.3.4 cannot be stopped: there is no destroy(), and each init() adds listeners and a MutationObserver that are never removed.',
      'Under StrictMode, development runs every effect twice, so a plain init effect starts AOS twice.',
      'aos.css has to be imported separately, usually in main.jsx.',
    ],
    steps: [
      {
        title: 'Switch the package — one command',
        body: 'Rewrites the import, removes the aos.css import and swaps the dependency. --dry-run shows the changes first.',
        code: 'npx svg-scroll-draw migrate --dry-run\nnpx svg-scroll-draw migrate\nnpm install',
        file: 'terminal',
      },
      {
        title: 'Replace the effect with useAOS',
        body: 'Call it once, near the root. Options are the AOS options you already pass to init().',
        code: `import { useAOS } from 'svg-scroll-draw/aos/react';

export default function App() {
  useAOS({ once: true, duration: 700 });
  return (
    <main>
      <h1 data-aos="fade-up">Hello</h1>
      <p data-aos="fade-up" data-aos-delay="150">Same markup as before.</p>
    </main>
  );
}`,
        file: 'App.jsx',
      },
      {
        title: 'With a router',
        body: 'Pass something that changes on navigation as the second argument and trigger positions are re-measured when it does. Elements added by the new route are picked up either way.',
        code: `import { useLocation } from 'react-router-dom';
import { useAOS } from 'svg-scroll-draw/aos/react';

function Layout({ children }) {
  useAOS({ once: true }, useLocation().pathname);
  return children;
}`,
        file: 'Layout.jsx',
      },
    ],
    unchanged: [
      'Your data-aos attributes, including offsets, delays, durations, easings and anchor placements.',
      'AOS.init / refresh / refreshHard, if you still call them directly — import AOS from svg-scroll-draw/aos.',
      'The look: the drop-in reproduces aos.css 2.3.4 rule for rule.',
    ],
    faq: [
      {
        q: 'Can I keep calling AOS.init() myself?',
        a: "Yes. import AOS from 'svg-scroll-draw/aos' behaves like AOS, plus AOS.destroy() for cleanup. The hook is just that lifecycle done for you.",
      },
      {
        q: 'How big is it?',
        a: 'The React entry is about 3.1 KB gzipped including the AOS drop-in and its styles. AOS 2.3.4 is 6.7 KB with aos.css.',
      },
      {
        q: 'Does it support TypeScript?',
        a: 'Yes — the options, the hook and AOSInit are typed.',
      },
    ],
    starter: `${SB}/aos`,
    compare: { href: '/vs-aos', label: 'AOS vs svg-scroll-draw' },
  },
  {
    slug: 'scrollreveal-react',
    from: 'ScrollReveal',
    framework: 'React',
    title: 'ScrollReveal in React and Next.js (MIT, With Hooks)',
    description:
      'Use ScrollReveal in React and Next.js with useScrollReveal(): reveals components when they mount, cleans up on unmount, same options. MIT, not GPL.',
    keywords: [
      'scrollreveal react',
      'scrollreveal nextjs',
      'scrollreveal react hook',
      'scrollreveal mit alternative',
      'scrollreveal license commercial',
      'react reveal on scroll',
    ],
    headline: 'ScrollReveal, per component.',
    intro:
      'ScrollReveal is GPL-3.0, with a paid licence for commercial work, and has not shipped since 4.0.9. svg-scroll-draw/scrollreveal is an independent MIT implementation of the same API, and its React entry reveals each component as it mounts instead of once at start-up.',
    problems: [
      'The usual setup is one ScrollReveal().reveal(".card") when the app starts. reveal() only finds the elements that exist at that moment, so components that mount later — a new route, a list that loads — are not revealed unless you call sync().',
      'Nothing cleans up when a component unmounts unless you call clean() yourself.',
      'ScrollReveal is licensed GPL-3.0 for open source and non-commercial use; commercial sites need a paid licence.',
    ],
    steps: [
      {
        title: 'Switch the package — one command',
        body: 'Points every scrollreveal import at the drop-in and swaps the dependency. Your ScrollReveal() calls do not change.',
        code: 'npx svg-scroll-draw migrate --dry-run\nnpx svg-scroll-draw migrate\nnpm install',
        file: 'terminal',
      },
      {
        title: 'Reveal from the component that renders the content',
        body: 'useScrollReveal returns a ref. Put it on the element to reveal — or on a container and pass selector to reveal its children, which is how an interval sequence is written. In Next.js, use it in a client component.',
        code: `'use client';
import { useScrollReveal } from 'svg-scroll-draw/scrollreveal/react';

export function Features({ items }) {
  const ref = useScrollReveal({ selector: '.card', interval: 80, distance: '40px' });
  return (
    <section ref={ref}>
      {items.map((item) => (
        <div className="card" key={item.id}>{item.title}</div>
      ))}
    </section>
  );
}`,
        file: 'Features.jsx',
      },
      {
        title: 'Keep shared defaults where they were',
        body: 'ScrollReveal({ ... }) still sets defaults for every later reveal, exactly as before.',
        code: `import ScrollReveal from 'svg-scroll-draw/scrollreveal';

ScrollReveal({ duration: 800, easing: 'cubic-bezier(0.5, 0, 0, 1)' });`,
        file: 'main.jsx',
      },
    ],
    unchanged: [
      'Every option: distance, origin, opacity, scale, rotate, delay, duration, easing, interval, reset, useDelay, viewFactor, viewOffset, container, mobile, desktop, cleanup and the four callbacks.',
      'The inline styles written — the browser test suite runs ScrollReveal 4.0.9 beside the drop-in and requires them to match byte for byte.',
      'The sr class on <html> that anti-flash CSS keys off.',
    ],
    faq: [
      {
        q: 'Is this really MIT?',
        a: 'Yes. It is an independent implementation written from ScrollReveal’s behaviour, with no ScrollReveal code in it, and the whole package is MIT.',
      },
      {
        q: 'Do I have to use the hook?',
        a: "No. import ScrollReveal from 'svg-scroll-draw/scrollreveal' works exactly like ScrollReveal; the hook adds the mount and unmount handling.",
      },
      {
        q: 'Does it work in the Next.js App Router?',
        a: 'Yes, in client components. The entry is marked "use client".',
      },
    ],
    starter: `${SB}/scrollreveal`,
    compare: { href: '/vs-aos#scrollreveal-drop-in', label: 'ScrollReveal vs svg-scroll-draw' },
  },
  {
    slug: 'vivus-react',
    from: 'vivus',
    framework: 'React',
    title: 'vivus in React: SVG Line Drawing With useVivus',
    description:
      'Animate SVG strokes with vivus in React: useVivus() creates the instance on your <svg>, cleans up on unmount and returns it for play(). Same vivus API.',
    keywords: [
      'vivus react',
      'vivus js react',
      'react svg line drawing',
      'vivus nextjs',
      'animate svg stroke react',
      'react svg draw animation',
    ],
    headline: 'vivus, as a hook.',
    intro:
      'vivus needs the mounted <svg>, so React code reaches for a ref and an effect, and has to remember to destroy the instance. svg-scroll-draw/vivus is a drop-in for vivus 0.4 with the same API, and its React entry does that wiring for you.',
    problems: [
      'new Vivus() must run after the <svg> is in the DOM, so every component needs a ref and a useEffect.',
      'If the component unmounts mid-animation without destroy(), the animation-frame loop keeps running against detached paths; under StrictMode the effect also runs twice in development.',
      'vivus has not shipped since 0.4.6 (April 2021).',
    ],
    steps: [
      {
        title: 'Switch the package — one command',
        body: 'Points every vivus import at the drop-in and swaps the dependency. Your new Vivus() calls keep working as they are.',
        code: 'npx svg-scroll-draw migrate --dry-run\nnpx svg-scroll-draw migrate\nnpm install',
        file: 'terminal',
      },
      {
        title: 'Use the hook instead of ref + effect',
        body: 'useVivus returns the ref for your <svg> and the instance once it is ready. It destroys the instance on unmount. In Next.js, use it in a client component.',
        code: `'use client';
import { useVivus } from 'svg-scroll-draw/vivus/react';

export function Logo() {
  const [ref, vivus] = useVivus({ type: 'oneByOne', duration: 120 });
  return (
    <svg ref={ref} viewBox="0 0 120 40" onClick={() => vivus?.reset().play()}>
      <path d="M10 30 C 30 0, 60 0, 80 30" stroke="currentColor" fill="none" />
      <circle cx="100" cy="20" r="12" stroke="currentColor" fill="none" />
    </svg>
  );
}`,
        file: 'Logo.jsx',
      },
      {
        title: 'Want it to follow the scroll instead?',
        body: 'vivus plays on a clock. If the line should draw as the page scrolls — and reverse when it scrolls back — use ScrollDraw from the same package.',
        code: `import { ScrollDraw } from 'svg-scroll-draw/react';

<ScrollDraw easing="ease-out">
  <svg viewBox="0 0 120 40">{/* paths */}</svg>
</ScrollDraw>`,
        file: 'Hero.jsx',
      },
    ],
    unchanged: [
      'new Vivus(element, options, callback) and every option, animation type and start mode.',
      'The output: shapes become the same <path>s with the same dash values — the browser test suite compares the SVG markup with vivus 0.4.6 exactly.',
      'Vivus.EASE and the other timing functions, and the data-start / data-duration / data-delay / data-async / data-ignore attributes.',
    ],
    faq: [
      {
        q: 'Do I need to change my vivus options?',
        a: 'No. Pass the same options object to useVivus (or to new Vivus) as before.',
      },
      {
        q: 'How do I replay the animation?',
        a: 'The hook returns the instance: vivus.reset().play(), or play(-1) to run it backwards.',
      },
      {
        q: 'Does it respect reduced motion?',
        a: 'Yes. With prefers-reduced-motion: reduce, play() jumps straight to the end and still fires its callbacks.',
      },
    ],
    starter: `${SB}/vivus`,
    compare: { href: '/vs-vivus', label: 'vivus vs svg-scroll-draw' },
  },
  {
    slug: 'gsap-scrolltrigger-react',
    from: 'GSAP ScrollTrigger',
    framework: 'React',
    title: 'Migrating From GSAP ScrollTrigger and DrawSVG in React',
    description:
      'Map GSAP ScrollTrigger and DrawSVG code to svg-scroll-draw, option by option: scrub, pin, timelines, callbacks and React — and what has no equivalent.',
    keywords: [
      'gsap scrolltrigger alternative',
      'migrate from gsap scrolltrigger',
      'drawsvg alternative react',
      'scrolltrigger react',
      'gsap drawsvg scroll animation',
      'scrolltrigger pin alternative',
    ],
    headline: 'From ScrollTrigger, call by call.',
    intro: `GSAP is free — every plugin, ScrollTrigger and DrawSVG included — and it does far more than this library. If what you use it for is scroll-scrubbed line drawing, pinned sections and enter/leave callbacks, svg-scroll-draw does that with the same trigger syntax and callback names, in a ${kb(SELF.gzipKb)} main entry instead of ${kb(GSAP.gzipKb)}. It is not a drop-in: each call is rewritten by hand, and the steps below map them one at a time, including the parts that have no equivalent.`,
    problems: [
      `Three modules and a registration call before the first tween: gsap, gsap/ScrollTrigger and gsap/DrawSVGPlugin, then gsap.registerPlugin(). Together they are ${kb(GSAP.gzipKb)} gzipped — core ${kb(GSAP_CORE)}, ScrollTrigger ${kb(GSAP_TRIGGER)}, DrawSVG ${kb(GSAP_DRAWSVG)} — measured against gsap ${GSAP.version}.`,
      "A scrubbed line needs three settings to agree: drawSVG on the tween, scrub: true on the ScrollTrigger, and ease: 'none'. Leave the ease out and GSAP's default power1.out curve bends the drawing against the scroll.",
      'In React, every tween and ScrollTrigger made in an effect has to be reverted on unmount. useGSAP() from the separate @gsap/react package, or gsap.context(), does it; a plain useEffect does not, and StrictMode’s development double mount then creates each ScrollTrigger twice.',
      'ScrollTrigger drives a scrubbed tween from JavaScript, frame by frame, for as long as you scroll through it.',
    ],
    steps: [
      {
        title: 'Install it beside GSAP',
        body: 'There is no codemod for GSAP — npx svg-scroll-draw migrate only rewrites AOS, ScrollReveal and vivus — so move one call at a time. Both libraries can run on the same page while you do, as long as no element is animated by both.',
        code: 'npm install svg-scroll-draw\n# once nothing imports gsap any more:\nnpm uninstall gsap @gsap/react',
        file: 'terminal',
      },
      {
        title: 'A scrubbed DrawSVG line becomes scrollDraw',
        body: "The element you pass is the trigger, and the strokes inside it are what draws. scrub: true needs no option, because every svg-scroll-draw call follows the scroll, and the default easing is linear, as ease: 'none' is. start and end take an element edge (top, center or bottom) and a viewport position (top, center, bottom or a percentage); pixel values and relative ends such as '+=500' are not supported. Leave trigger out and supporting browsers run the draw on native CSS, with no JavaScript per frame.",
        code: `// before: GSAP + ScrollTrigger + DrawSVG
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin);

gsap.from('#route path', {
  drawSVG: 0,
  ease: 'none',
  scrollTrigger: {
    trigger: '#route',
    start: 'top 80%',
    end: 'bottom 40%',
    scrub: true,
  },
});

// after: svg-scroll-draw
import { scrollDraw } from 'svg-scroll-draw';

scrollDraw('#route', {
  trigger: { start: 'top 80%', end: 'bottom 40%' },
});`,
        file: 'route.js',
      },
      {
        title: 'A scrubbed tween becomes scrollAnimate',
        body: "props takes [from, to] pairs of CSS values; a single value animates from the current computed style, as gsap.to() does. Transforms are CSS strings rather than x and y. scrollAnimate's default easing is ease-out, so pass 'linear' to match ease: 'none'. Each call animates one element — the first match of a selector — so loop over a list, or pass an array to scrollAnimateGroup from svg-scroll-draw/group.",
        code: `// before
gsap.fromTo('#panel', { opacity: 0, y: 40 }, {
  opacity: 1,
  y: 0,
  ease: 'none',
  scrollTrigger: {
    trigger: '#panel',
    start: 'top 85%',
    end: 'top 50%',
    scrub: true,
  },
});

// after
import { scrollAnimate } from 'svg-scroll-draw';

scrollAnimate('#panel', {
  props: {
    opacity: [0, 1],
    transform: ['translateY(40px)', 'translateY(0px)'],
  },
  trigger: { start: 'top 85%', end: 'top 50%' },
  easing: 'linear',
});`,
        file: 'panel.js',
      },
      {
        title: 'pin: true becomes scrollPin',
        body: `scrollPin holds the element at the top of the viewport, as start: 'top top' does, for pinDistance pixels of scroll — one viewport height if you leave it out; top: 80 pins it 80px down instead. It wraps the element in a spacer that reserves that distance, as pinSpacing: true does; there is no pinSpacing: false. A pinned scrub is two calls: onProgress reports 0–1 through the pin, and seek() moves any instance to that point and holds it there. svg-scroll-draw/pin is its own ${kb(SELF_ENTRIES.pin)} entry.`,
        code: `// before
gsap.from('#stage path', {
  drawSVG: 0,
  ease: 'none',
  scrollTrigger: {
    trigger: '#stage',
    start: 'top top',
    end: '+=1500',
    pin: true,
    scrub: true,
  },
});

// after
import { scrollDraw } from 'svg-scroll-draw';
import { scrollPin } from 'svg-scroll-draw/pin';

const draw = scrollDraw('#stage svg');
scrollPin('#stage', {
  pinDistance: 1500,               // end: '+=1500'
  onProgress: (p) => draw.seek(p), // scrub the drawing while pinned
});`,
        file: 'story.js',
      },
      {
        title: 'A scrubbed timeline becomes scrollDrawTimeline',
        body: "A timeline places tweens in seconds; a track is a slice of the scroll window from 0 to 1. Divide each tween's start and end by the timeline's length — 10 here — to get from and to. Each track draws the strokes its selector matches inside the container, linear unless you give it an easing. Tracks only draw: a timeline that also fades or moves elements needs scrollAnimate calls with their own windows, and there are no labels to snap to.",
        code: `// before
const tl = gsap.timeline({
  defaults: { ease: 'none' },
  scrollTrigger: {
    trigger: '#diagram',
    start: 'top 80%',
    end: 'bottom 20%',
    scrub: true,
  },
});
tl.from('#diagram .outline', { drawSVG: 0, duration: 5 }, 0)
  .from('#diagram .detail', { drawSVG: 0, duration: 5 }, 3)
  .from('#diagram .label', { drawSVG: 0, duration: 3 }, 7);

// after
import { scrollDrawTimeline } from 'svg-scroll-draw/timeline';

scrollDrawTimeline('#diagram', {
  trigger: { start: 'top 80%', end: 'bottom 20%' },
  tracks: [
    { selector: '.outline', from: 0,   to: 0.5 },
    { selector: '.detail',  from: 0.3, to: 0.8 },
    { selector: '.label',   from: 0.7, to: 1 },
  ],
});`,
        file: 'diagram.js',
      },
      {
        title: 'Callbacks, refresh and markers',
        body: 'The four edge callbacks keep their names and fire at the same moments. onUpdate becomes onProgress, which receives the 0–1 progress rather than a ScrollTrigger. There is no global ScrollTrigger.refresh(): every instance re-measures on resize by itself, and scrollDraw, scrollPin and scrollDrawTimeline also have refresh() for layout changes a resize does not report — scrollAnimate has none of its own. markers: true becomes debug: true on scrollDraw, or devtools.enable() for every instance at once; both do nothing in production builds.',
        code: `import { scrollDraw } from 'svg-scroll-draw';
import { devtools } from 'svg-scroll-draw/devtools';

const nav = document.querySelector('nav');
const meter = document.querySelector('meter');

const route = scrollDraw('#route', {
  trigger: { start: 'top center', end: 'bottom center' },
  onEnter:     () => nav.classList.add('on'),
  onLeave:     () => nav.classList.remove('on'),
  onEnterBack: () => nav.classList.add('on'),
  onLeaveBack: () => nav.classList.remove('on'),
  onProgress:  (p) => (meter.value = p), // was onUpdate: (self) => self.progress
  debug: true,                           // was markers: true
});

devtools.enable(); // start and end lines for every instance
route.refresh();   // was ScrollTrigger.refresh(), for this instance
route.destroy();   // was kill() or ctx.revert()`,
        file: 'nav.js',
      },
      {
        title: 'useGSAP becomes a component',
        body: 'useGSAP() and registerPlugin() go. ScrollDraw, ScrollAnimate, ScrollText, ScrollCounter and ScrollVideo create their animation when they mount and destroy it when they unmount, so StrictMode’s double mount is harmless; their options are read once, at mount. When a component needs the number itself, useScrollDrawProgress(ref, options) returns the 0–1 progress as state. scrollPin and scrollDrawTimeline have no component: create them in a useEffect and return destroy, as here. In the Next.js App Router, all of this goes in a client component.',
        code: `'use client';
import { useEffect, useRef } from 'react';
import { ScrollDraw } from 'svg-scroll-draw/react';
import { scrollPin } from 'svg-scroll-draw/pin';

export function Story() {
  const stage = useRef(null);

  useEffect(() => {
    const pin = scrollPin(stage.current, { pinDistance: 1200 });
    return () => pin.destroy();
  }, []);

  return (
    <>
      <ScrollDraw trigger={{ start: 'top 80%', end: 'bottom 40%' }}>
        <svg viewBox="0 0 400 120" fill="none" stroke="currentColor">
          <path d="M10 100 C 120 10, 280 10, 390 100" />
        </svg>
      </ScrollDraw>
      <section ref={stage}>Pinned for 1200px of scroll.</section>
    </>
  );
}`,
        file: 'Story.jsx',
      },
    ],
    unchanged: [
      'The trigger window syntax: an element edge, then a viewport position — "top 80%", "center center", "bottom top" — and the same default window, from top bottom to bottom top.',
      'The four edge callbacks, by name and by moment: onEnter, onLeave, onEnterBack and onLeaveBack, on scrollDraw, scrollAnimate and scrollPin.',
      'Your SVG: scrollDraw draws strokes the way DrawSVG does, with stroke-dasharray and stroke-dashoffset, on paths, lines, polylines, polygons, rects and circles by default — the selector option picks anything else.',
      'Control from code: the instance you get back has pause() and resume(), seek(0.5) where a tween has progress(0.5), and destroy() where it has kill().',
    ],
    faq: [
      {
        q: 'Isn’t GSAP free now?',
        a: 'Yes. Since 2025 GSAP and every plugin that used to be members-only — DrawSVG, SplitText and MorphSVG among them — cost nothing, for commercial work too. They ship under GSAP’s Standard "No Charge" licence, which is not open source and bars use in no-code visual animation tools that compete with Webflow; svg-scroll-draw is MIT. Price is no reason to switch. Weight and a native CSS path can be.',
      },
      {
        q: 'What in ScrollTrigger has no equivalent?',
        a: 'Tweens on a clock: gsap.to() on any property or object, independent of scroll — only SVG strokes can play over time here, with scrollDraw’s autoplay and duration. Snapping to progress points or labels; scrollSnap from svg-scroll-draw/snap snaps between whole sections instead. Scrub smoothing such as scrub: 1 — progress follows the scroll position exactly. ScrollTrigger.batch(); scrollReveal from svg-scroll-draw/reveal reveals every match with a stagger per row, but has no batched callbacks. pinSpacing: false, pixel or relative trigger positions, and a global refresh(). The rest of GSAP — Flip, MorphSVG, MotionPath, Draggable — is out of scope.',
      },
      {
        q: 'Does DrawSVG’s segment syntax carry over?',
        a: 'Only the whole stroke. scrollDraw draws each stroke from its start to its end, as drawSVG does going from 0 to "0% 100%", and direction: "reverse" erases it instead. Segments — "40% 60%", a dash travelling along the path, or drawing out from the middle — have no equivalent.',
      },
      {
        q: 'How do toggleActions and once map?',
        a: 'Every call scrubs by default and runs backwards when you scroll back. once: true holds the furthest point reached, so a drawing never undraws — what toggleActions: "play none none none" or once: true is usually there for. A timed play on entry exists for SVG strokes only: autoplay: true with a duration in milliseconds, replayed on each entry unless once is set. Per-edge actions such as "play pause resume reverse" have no equivalent; call pause(), resume() or replay() from the four callbacks instead.',
      },
      {
        q: 'Will the migrated animations run on native CSS?',
        a: 'The simplest ones will. A scrollDraw or scrollAnimate with the default window, no callbacks, no once and an easing CSS can express is handed to the browser’s scroll-driven CSS animations where they are supported, and then runs with no JavaScript per frame. A custom start or end, a callback or once keeps it on the JavaScript engine, which runs only while the element is on screen. On either path the browser still repaints stroke-dashoffset on the main thread.',
      },
      {
        q: 'Does it handle horizontal scrolling and scroll containers?',
        a: 'horizontal: true becomes axis: "x", and scroller becomes scrollContainer (a selector or an element), on scrollDraw and scrollAnimate. The pinned sideways strip — panels moved with xPercent while the page scrolls down — is scrollHorizontal from svg-scroll-draw/horizontal: you write the position: sticky wrapper in CSS, and it moves the track.',
      },
      {
        q: 'What about reduced motion?',
        a: 'ScrollTrigger leaves it to you, usually through gsap.matchMedia(). With prefers-reduced-motion: reduce, scrollDraw and scrollAnimate show their finished state straight away; scrollDrawTimeline keeps scrubbing, since that moves only with the reader’s own scroll, but skips its time-based loop.',
      },
    ],
    starter: `${SB}/react`,
    compare: { href: '/vs-gsap', label: 'GSAP vs svg-scroll-draw' },
    swap: {
      to: 'svg-scroll-draw',
      rows: [
        { k: 'import', before: GSAP.name, after: SELF.name },
        { k: 'version', before: GSAP.version, after: SELF.version },
        { k: 'licence', before: GSAP.license, after: SELF.license },
        { k: 'gzip', before: kb(GSAP.gzipKb), after: kb(SELF.gzipKb) },
        { k: 'in React', before: 'useGSAP · @gsap/react', after: '<ScrollDraw> · <ScrollAnimate>' },
      ],
    },
  },
];

export const GUIDE_SLUGS = GUIDES.map((g) => g.slug);
