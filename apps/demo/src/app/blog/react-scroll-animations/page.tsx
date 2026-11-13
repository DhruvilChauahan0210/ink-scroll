import type { Metadata } from 'next';
import Link from 'next/link';
import { seoTitle } from '../../_lib/seo';
import { COMPETITORS, SELF_ENTRIES, MEASURED_ON } from '@/data/competitors';
import { BROWSER_SUPPORT } from '@/data/cssdriven';
import { BlogArticle, Section, Code, Callout, Table, Figure, Closing } from '@/components/blog/BlogArticle';
import { WhenFigure } from './WhenFigure';

// Searches this post is for: "react scroll animation", "animate on scroll
// react", "framer motion useScroll", "react intersection observer animation",
// "scroll animation react without library". The CSS, hook and svg-scroll-draw
// listings were bundled and run in Chromium, Firefox and WebKit, under
// StrictMode and reduced motion; the Motion listings were checked against
// motion 14.14.0's published types, not run.
const TITLE = 'React Scroll Animations: CSS, Framer Motion or a Hook?';
const DESCRIPTION =
  'Four ways to animate on scroll in React: CSS view(), a useInView hook, Motion’s whileInView and useScroll, or components. The trade-offs, and which to pick.';
const URL = 'https://svg-scroll-draw.vercel.app/blog/react-scroll-animations';

export const metadata: Metadata = {
  title: seoTitle(TITLE),
  description: DESCRIPTION,
  keywords: [
    'react scroll animation',
    'animate on scroll react',
    'framer motion useScroll',
    'react intersection observer animation',
    'scroll animation react without library',
    'useInView hook react',
    'motion whileInView',
    'next.js scroll animation',
  ],
  alternates: { canonical: '/blog/react-scroll-animations' },
  openGraph: { title: TITLE, description: DESCRIPTION, url: URL },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline: 'React scroll animations: CSS, Framer Motion or a hook?',
  description: DESCRIPTION,
  url: URL,
  datePublished: '2026-11-13',
  dateModified: '2026-11-13',
  author: { '@type': 'Person', name: 'Dhruvil Chauhan', url: 'https://github.com/DhruvilChauahan0210' },
  publisher: { '@type': 'Organization', name: 'svg-scroll-draw', url: 'https://svg-scroll-draw.vercel.app' },
  image: `${URL}/opengraph-image`,
  mainEntityOfPage: { '@type': 'WebPage', '@id': URL },
};

const FM = COMPETITORS.framerMotion;
const MOTION = COMPETITORS.motionOne;
const support = (b: string) => BROWSER_SUPPORT.find((s) => s.browser.startsWith(b))?.since;

const CSS_CSS = `/* reveal.css, imported once in app/layout.tsx */
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .reveal {
      animation: reveal linear both;
      animation-timeline: view();
      animation-range: entry 0% cover 40%;
    }
  }
}

@keyframes reveal {
  from { opacity: 0; translate: 0 2rem; }
}`;

const CSS_TSX = `// Card.tsx: no 'use client'. It stays a Server Component and ships no JS.
export function Card({ children }: { children: React.ReactNode }) {
  return <div className="card reveal">{children}</div>;
}`;

const HOOK_TS = `import { useEffect, useRef, useState } from 'react';

type Options = { once?: boolean; rootMargin?: string; threshold?: number };

// null until the browser has measured: the server HTML and the first client
// render agree, and nothing is hidden before JavaScript has run.
export function useInView<T extends Element>({
  once = true,
  rootMargin = '0px',
  threshold = 0,
}: Options = {}) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState<boolean | null>(null);

  useEffect(() => {
    const el = ref.current;
    // No observer (very old browser): stay null, which shows the content.
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.disconnect();
        } else {
          setInView((was) => once && was === true);
        }
      },
      { rootMargin, threshold },
    );
    observer.observe(el);
    // On unmount, and between StrictMode's two development mounts.
    return () => observer.disconnect();
  }, [once, rootMargin, threshold]);

  return [ref, inView] as const;
}`;

const HOOK_TSX = `'use client';
import { useInView } from './useInView';

export function Reveal({ children }: { children: React.ReactNode }) {
  const [ref, inView] = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className="fade-up"
      data-in-view={inView === null ? undefined : String(inView)}
    >
      {children}
    </div>
  );
}`;

const HOOK_CSS = `/* The observed box stays put; only what is inside it moves. */
@media (prefers-reduced-motion: no-preference) {
  .fade-up > * {
    transition: opacity 0.6s ease-out, translate 0.6s ease-out;
  }
  .fade-up[data-in-view='false'] > * {
    opacity: 0;
    translate: 0 2rem;
  }
}`;

const MOTION_INVIEW_TSX = `'use client';
import { motion } from 'motion/react';

export function Card({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}`;

const MOTION_SCROLL_TSX = `'use client';
import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';

export function ScrubCard({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'start center'],
  });
  const opacity = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [32, 0]);
  const reduce = useReducedMotion();

  return (
    <motion.div ref={ref} style={reduce ? undefined : { opacity, y }}>
      {children}
    </motion.div>
  );
}`;

const MOTION_CONFIG_TSX = `'use client';
import { MotionConfig } from 'motion/react';

// Wrap the app once, in app/layout.tsx.
export function Providers({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}`;

const LIB_TSX = `import { ScrollAnimate } from 'svg-scroll-draw/react';

// No 'use client' here: the components carry it, and every prop is plain data.
export function Card({ children }: { children: React.ReactNode }) {
  return (
    <ScrollAnimate
      className="card"
      props={{ opacity: [0, 1], transform: ['translateY(32px)', 'translateY(0px)'] }}
      trigger={{ start: 'top 88%', end: 'top 53%' }}
      once
    >
      {children}
    </ScrollAnimate>
  );
}`;

const LIB_MORE_TSX = `import { ScrollDraw, ScrollText } from 'svg-scroll-draw/react';

export function Hero() {
  return (
    <section>
      <ScrollText as="h2" split="words" stagger={0.06}>
        Words arrive one at a time
      </ScrollText>
      <ScrollDraw>
        <svg viewBox="0 0 400 60" aria-hidden="true">
          <path d="M10 50 C 120 0, 280 0, 390 50" fill="none" stroke="currentColor" strokeWidth={3} />
        </svg>
      </ScrollDraw>
    </section>
  );
}`;

const LIB_HOOK_TSX = `'use client';
import { useRef } from 'react';
import { useScrollDrawProgress } from 'svg-scroll-draw/react';

export function Meter() {
  const ref = useRef<HTMLDivElement>(null);
  const progress = useScrollDrawProgress(ref, {
    trigger: { start: 'top 88%', end: 'top 53%' },
    once: true,
  });
  return (
    <div ref={ref} style={{ opacity: progress }}>
      {Math.round(progress * 100)}% read
    </div>
  );
}`;

const TREE = `app/
  layout.tsx      Server Component; imports reveal.css, wraps <Providers> if you use Motion
  page.tsx        Server Component; renders all of the below
  Card.tsx        CSS only: no directive, no JavaScript
  Reveal.tsx      'use client': calls useInView
  useInView.ts    no directive: only client components import it
  ScrubCard.tsx   'use client': Motion hooks
  providers.tsx   'use client': MotionConfig`;

const HOOK_LINES = HOOK_TS.split('\n').length;

export default function Page() {
  return (
    <BlogArticle
      slug="react-scroll-animations"
      jsonLd={articleJsonLd}
      tags={['React', 'Next.js', 'Framer Motion']}
      title={<>React scroll animations: CSS, Framer Motion or a hook?</>}
      lede={
        <>
          There are four honest ways to animate something as it scrolls into view in React: a CSS class on a scroll
          timeline, a small <code>useInView</code> hook, Motion (the library that was Framer Motion), or a component
          library. They differ in what the animation follows, what they cost, and what they do on the server and under
          reduced motion. Here is each one, written correctly, and a table to choose.
        </>
      }
      facts={[
        { k: 'CSS view()', v: '0 KB of JS' },
        { k: 'useInView', v: `${HOOK_LINES} lines` },
        { k: 'framer-motion', v: `${FM.gzipKb} KB` },
        { k: 'svg-scroll-draw/react', v: `${SELF_ENTRIES.react} KB` },
      ]}
      figure={
        <Figure n={1} caption={<>where each listing in this post animates, by where the card’s top edge is on the screen. Bars follow the scroll; rings start a 0.6 s animation that runs whatever the scroll does next.</>}>
          <WhenFigure />
        </Figure>
      }
      further={[
        { href: '/blog/css-scroll-driven-animations', label: 'CSS scroll-driven animations explained', blurb: 'view(), scroll() and animation-range, behind the zero-JavaScript way.' },
        { href: '/blog/reduced-motion-scroll-animations', label: 'Reduced motion for scroll animations', blurb: 'What prefers-reduced-motion should do to a reveal, a scrub and a snap.' },
      ]}
    >
      <Section id="two-kinds" k="first" title="Two kinds of scroll animation">
        <p>
          Before picking a tool, pick a behaviour, because the four ways split into two kinds. A <em>triggered</em>{' '}
          animation waits for a moment, the card entering the screen, and then plays on a clock: 0.6 seconds, whether
          the reader keeps scrolling, stops or goes back. A <em>scrubbed</em> animation has no clock. Its progress is
          the scroll position, so it moves only while the reader scrolls, and backwards when they scroll back.
        </p>
        <p>
          Fig. 1 puts the listings below on one axis. The <code>useInView</code> hook and Motion’s{' '}
          <code>whileInView</code> are triggered; CSS <code>view()</code>, Motion’s <code>useScroll</code> and
          svg-scroll-draw are scrubbed. Triggered is the classic “animate on scroll” and, today, needs JavaScript to notice
          the moment. Scrubbed can be done in CSS alone, and reads as the page responding to the reader’s hand.
        </p>
      </Section>

      <Section id="css" k="way 1 · css only" title="CSS only: a class on a scroll timeline">
        <p>
          The smallest React scroll animation is not React at all. <code>animation-timeline: view()</code> drives a
          normal CSS animation by the element’s trip through the screen, so the component only adds a class:
        </p>
        <Code file="reveal.css">{CSS_CSS}</Code>
        <Code file="Card.tsx">{CSS_TSX}</Code>
        <p>
          The range <code>entry 0% cover 40%</code> starts the fade as the card’s top edge enters at the bottom and
          ends it 40% of the way through its whole crossing, which for a card a fifth of the screen tall is when its
          top reaches 52% (the first bar in Fig. 1). The keyframes give only <code>from</code>, so the card ends at its
          own styles.
        </p>
        <p>The trade-offs:</p>
        <ul>
          <li>
            <strong>Support.</strong> Chrome and Edge since {support('Chrome')}, Safari since {support('Safari')},
            Firefox since {support('Firefox')}. Everywhere else <code>@supports</code> skips the block and the card
            simply shows, which is the right failure.
          </li>
          <li>
            <strong>No “once”.</strong> It is scrubbed, so scrolling back up fades the card out again. CSS has no way
            to hold the end state once reached.
          </li>
          <li>
            <strong>No events.</strong> Nothing tells your React code the card arrived. If you need a callback, this
            is the wrong tool.
          </li>
        </ul>
        <p>
          Everything that moves is inside <code>prefers-reduced-motion: no-preference</code>, so readers who asked for
          less motion get the card as it is. How the ranges work is in{' '}
          <Link href="/blog/css-scroll-driven-animations">CSS scroll-driven animations explained</Link>, and the{' '}
          <Link href="/css-scroll-driven-animation-generator">CSS scroll-driven animation generator</Link> writes this
          block for seven effects.
        </p>
      </Section>

      <Section id="hook" k="way 2 · a hook" title={<>A <code>useInView</code> hook, written correctly</>} toc="A useInView hook">
        <p>
          For a triggered reveal with no dependency, an <code>IntersectionObserver</code> in an effect is enough. Five
          things are easy to get wrong in it, and this one handles all five:
        </p>
        <Code file="useInView.ts">{HOOK_TS}</Code>
        <Code file="Reveal.tsx">{HOOK_TSX}</Code>
        <Code file="fade-up.css">{HOOK_CSS}</Code>
        <ul>
          <li>
            <strong>Cleanup.</strong> The effect returns <code>observer.disconnect()</code>, so an unmounted card stops
            being watched, and a route change leaves nothing behind.
          </li>
          <li>
            <strong>StrictMode.</strong> In development React mounts, unmounts and mounts every effect again. The first
            observer is disconnected before its first callback can arrive, so the second one is the only one left. A
            hook that keeps the observer in a module variable, or skips the cleanup, ends up with two.
          </li>
          <li>
            <strong>Once.</strong> With <code>once</code> the observer disconnects itself on the first sighting, and
            never sets the card back to hidden.
          </li>
          <li>
            <strong>Server rendering.</strong> The state starts as <code>null</code>, not <code>false</code>. The
            server HTML has no <code>data-in-view</code> at all, so it matches the first client render, and the CSS only
            hides what is inside <code>[data-in-view=&apos;false&apos;]</code>, which only the observer can set. If the
            bundle never loads, every card is visible. <code>IntersectionObserver</code> is only touched inside the
            effect, which never runs on the server.
          </li>
          <li>
            <strong>The observed box never moves.</strong> An observer measures an element where it is drawn,
            transforms included. Put the <code>2rem</code> drop on the observed element and it starts 2rem lower than
            its place, so it is seen later than you asked. With <code>once</code> off it is worse: a card leaving at the
            top is hidden, drops back into view, shows, rises out again, and loops. The hook watches the wrapper; the
            CSS moves only its children.
          </li>
        </ul>
        <p>
          A card already on screen at load goes straight from <code>null</code> to <code>true</code> and never hides.
          With the default <code>threshold: 0</code> that holds for any card with a single pixel showing. A negative
          bottom <code>rootMargin</code>, such as <code>&apos;0px 0px -15% 0px&apos;</code>, makes reveals start
          higher up the screen, at a price: a card sitting in that bottom strip at load is shown, then hidden when the
          first callback arrives.
        </p>
        <p>
          The <Link href="/scroll-reveal-generator">scroll reveal generator</Link> builds a set of reveal presets with
          stagger and copies them as a React component, if you would rather not keep this file.
        </p>
      </Section>

      <Section id="motion" k="way 3 · motion" title="Motion: whileInView and useScroll">
        <p>
          Framer Motion is now published as <code>motion</code>, and its React API is imported from{' '}
          <code>motion/react</code>. The old <code>framer-motion</code> package still ships alongside it, at the same
          version (14.14.0 for both at the time of writing), so existing imports keep working. Its triggered reveal is
          three props:
        </p>
        <Code file="Card.tsx">{MOTION_INVIEW_TSX}</Code>
        <p>
          <code>amount: 0.3</code> waits until 30% of the card is in view, and <code>once</code> stops it reversing.
          Motion observes the <code>motion.div</code> itself, which <code>initial</code> draws 32px low, so the ring
          in Fig. 1 is at 94% of the card as drawn: on a screen 800px tall, its place is at 90% when it starts.
        </p>
        <p>
          The scrubbed version reads the scroll as a motion value and maps it onto styles. Motion sets those styles
          directly, without a React render per frame:
        </p>
        <Code file="ScrubCard.tsx">{MOTION_SCROLL_TSX}</Code>
        <p>
          The offset pair reads “start the progress when the card’s start meets the screen’s end, finish it when the
          card’s start meets the centre”: 100% to 50% in Fig. 1. Like CSS, it reverses on the way back; holding the end
          state is code you write.
        </p>
        <p>
          The cost is size. The <code>framer-motion</code> {FM.version} CJS entry is {FM.gzipKb} KB gzipped and the{' '}
          <code>motion</code> {MOTION.version} single bundle {MOTION.gzipKb} KB, measured {MEASURED_ON}; a tree-shaken
          import of a few pieces is smaller than both, so measure your own build. It is worth that when you already use
          Motion for what it is best at: layout animation, gestures and exit animation with{' '}
          <code>AnimatePresence</code>. For scroll alone, the comparison is on{' '}
          <Link href="/vs-framer-motion">svg-scroll-draw vs Framer Motion</Link>.
        </p>
        <Callout k="not run here">
          The Motion listings, these two and the one under reduced motion, were type-checked against the published
          types of <code>motion</code> 14.14.0, import paths and every prop and option name, but not run in a browser.
          Every other listing in this post was, in Chromium, Firefox and WebKit.
        </Callout>
      </Section>

      <Section id="library" k="way 4 · components" title="svg-scroll-draw’s React components">
        <p>
          <code>svg-scroll-draw/react</code> is a set of components over the library’s scroll engines:{' '}
          <code>ScrollAnimate</code> for any CSS property, <code>ScrollText</code> for split text,{' '}
          <code>ScrollDraw</code> for SVG strokes, <code>ScrollCounter</code>, <code>ScrollVideo</code> and{' '}
          <code>ScrollFrames</code>, plus one hook, <code>useScrollDrawProgress</code>. All of them are scrubbed, and{' '}
          <code>once</code> holds the end state, the one thing CSS cannot do:
        </p>
        <Code file="Card.tsx">{LIB_TSX}</Code>
        <p>
          The card starts as its top passes 88% of the way down the screen and is in place by 53%. Leave out{' '}
          <code>once</code>, the trigger and callbacks, keep the other defaults, and animate only properties such as{' '}
          <code>opacity</code> and <code>transform</code>, and <code>ScrollAnimate</code> hands the work to <code>animation-timeline: view()</code>{' '}
          in browsers that have it, with the JavaScript engine everywhere else. Text and drawings are one component
          each:
        </p>
        <Code file="Hero.tsx">{LIB_MORE_TSX}</Code>
        <p>
          <code>ScrollText</code> splits the heading into words and keeps one plain copy for screen readers. For your
          own UI, the hook returns the same 0 to 1 progress as state:
        </p>
        <Code file="Meter.tsx">{LIB_HOOK_TSX}</Code>
        <p>
          That re-renders the component on every frame the value changes, which is fine for one element; for many,
          the components are cheaper because they write styles without rendering. The whole entry, every component
          and its engines, is {SELF_ENTRIES.react} KB gzipped. The{' '}
          <Link href="/react-scroll-animation">React scroll animation page</Link> has the quick start and every API,
          the <Link href="/blocks">blocks</Link> install ready-made sections with the shadcn CLI, and the{' '}
          <Link href="/text-animation-generator">text animation generator</Link> copies a <code>ScrollText</code>{' '}
          component.
        </p>
      </Section>

      <Section id="nextjs" k="next.js" title="In the Next.js App Router">
        <p>
          Every page in the App Router is a Server Component unless a file says <code>&apos;use client&apos;</code>.
          Hooks and effects only run in client components, so the question for each way is which file needs the
          directive:
        </p>
        <Code file="app/">{TREE}</Code>
        <ul>
          <li>
            <strong>CSS</strong> needs nothing: the class is in the server HTML, and the browser animates it.
          </li>
          <li>
            <strong>The hook</strong> lives in a client component. The hook file itself needs no directive, because only
            client components import it.
          </li>
          <li>
            <strong>Motion</strong> needs a client file for its hooks. For a plain <code>motion.div</code> inside a
            Server Component, import it from <code>motion/react-client</code>, whose elements carry the directive.
          </li>
          <li>
            <strong>svg-scroll-draw</strong> components carry <code>&apos;use client&apos;</code> already, so a Server
            Component renders <code>&lt;ScrollAnimate&gt;</code> directly. A function prop, such as{' '}
            <code>onComplete</code>, cannot cross from server to client, and needs a client file of your own.
          </li>
        </ul>
        <p>
          Hydration is where they differ most. A hydration mismatch comes from rendering something on the client that
          the server could not know, like reading <code>window.matchMedia</code> in <code>useState</code>; all four ways
          here avoid that. What differs is what the server HTML shows. CSS and svg-scroll-draw send the content as it
          is, and the start state is applied in the browser. The hook sends no attribute, so nothing is hidden.
          Motion writes the <code>initial</code> values into the server HTML, so the card arrives at{' '}
          <code>opacity: 0</code> and stays there until the page hydrates, or for good if the script fails. More on
          boundaries and route changes is on the <Link href="/nextjs-scroll-animation">Next.js scroll animation</Link>{' '}
          page.
        </p>
      </Section>

      <Section id="reduced-motion" k="accessibility" title="Reduced motion, way by way">
        <p>
          A reader who sets “reduce motion” should get the content, in place, without the trip. Each way gets there
          differently:
        </p>
        <ul>
          <li>
            <strong>CSS and the hook</strong> put every hiding and moving rule inside{' '}
            <code>@media (prefers-reduced-motion: no-preference)</code>. Under reduced motion the rules do not exist,
            and the card is simply there. The media query also responds live if the setting changes.
          </li>
          <li>
            <strong>Motion</strong> leaves it to you. <code>MotionConfig</code> with <code>reducedMotion=&quot;user&quot;</code>{' '}
            switches off the transform animations Motion plays, so <code>whileInView</code> still fades but no longer
            slides. A <code>useScroll</code> scrub is not an animation Motion plays, it is your values following the
            scroll, so the listing above checks <code>useReducedMotion()</code> itself.
          </li>
          <li>
            <strong>svg-scroll-draw</strong> does it by default. Every component shows its end state at once: the card
            in place, the text whole, the drawing drawn, the counter at its number, the video and frames on their last
            frame. If the reader turns the setting on while the page is open, what is animating finishes at once too.{' '}
            <code>useScrollDrawProgress</code> returns 1.
          </li>
        </ul>
        <Code file="providers.tsx">{MOTION_CONFIG_TSX}</Code>
        <p>
          What each kind of effect should do under the setting, and why a scrub that follows the reader’s own scroll
          can sometimes stay, is in{' '}
          <Link href="/blog/reduced-motion-scroll-animations">reduced motion for scroll animations</Link>.
        </p>
      </Section>

      <Section id="decide" k="decision" title="Which one to use">
        <Table
          first="plain"
          head={['Way', 'JavaScript', 'Follows', 'Holds at the end', 'Reduced motion', 'Pick it when']}
          rows={[
            ['CSS view()', 'None', 'The scroll', 'No', 'Your @media block', 'A fade or slide, and older browsers may just show the content'],
            ['useInView hook', `Your ${HOOK_LINES} lines`, 'A clock, from a moment', 'Yes, once', 'Your @media block', 'One triggered reveal and no dependency'],
            ['Motion whileInView', `${FM.gzipKb} KB entry`, 'A clock, from a moment', 'Yes, viewport.once', 'Opt-in: MotionConfig', 'You already use Motion for layout, gestures or exit'],
            ['Motion useScroll', `${FM.gzipKb} KB entry`, 'The scroll', 'Code you write', 'Opt-in: useReducedMotion', 'Scrubbed values in an app that has Motion'],
            ['svg-scroll-draw/react', `${SELF_ENTRIES.react} KB, every component`, 'The scroll', 'Yes, once', 'On by default', 'Text, SVG drawing, counters, video or frames as well as reveals'],
          ]}
          caption={`Sizes minified and gzipped: framer-motion ${FM.version} at its CJS entry, measured ${MEASURED_ON}, and the whole svg-scroll-draw/react entry. A tree-shaken Motion import is smaller.`}
        />
        <p>
          If the effect is one fade, start with CSS, and add the hook if you need it to play once or in every
          browser. If you already ship Motion, use it. If the page needs more than reveals, the components do the
          rest with the same trigger syntax and reduced-motion handling throughout.
        </p>
      </Section>

      <Closing
        title="Copy a reveal component"
        lede="Pick a preset, stagger and trigger, scroll the preview, and copy one scrollReveal call or a React component."
        command="npm i svg-scroll-draw"
        links={[
          { href: '/scroll-reveal-generator', label: 'Scroll reveal generator →' },
          { href: '/react-scroll-animation', label: 'React scroll animation' },
        ]}
      />
    </BlogArticle>
  );
}
