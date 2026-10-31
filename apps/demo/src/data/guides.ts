/**
 * Migration guides for people already on AOS, ScrollReveal or vivus in React or
 * Next.js — the searches those libraries' users actually make.
 *
 * Rules, as for the comparison pages: every claim about the other library must
 * be true of its last release (AOS 2.3.4, ScrollReveal 4.0.9, vivus 0.4.6), and
 * every code sample must run against the published package as written.
 */

const SB = 'https://stackblitz.com/github/DhruvilChauahan0210/ink-scroll/tree/main/examples';

export type GuideStep = {
  title: string;
  body: string;
  code?: string;
  file?: string;
};

export type Guide = {
  slug: string;
  /** The library being migrated from, as people write it. */
  from: 'AOS' | 'ScrollReveal' | 'vivus';
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
];

export const GUIDE_SLUGS = GUIDES.map((g) => g.slug);
