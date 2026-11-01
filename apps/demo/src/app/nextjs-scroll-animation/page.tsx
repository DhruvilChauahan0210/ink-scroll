import type { Metadata } from 'next';
import '@/components/stack/stack.css';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { COMPETITORS, SELF, ratioVsSelf, provenance } from '@/data/competitors';
import { seoTitle } from '../_lib/seo';
import { SiteShell } from '@/components/site/SiteShell';
import { CodeBox } from '@/components/site/CodeBox';
import { CopyCommand } from '@/components/home/CopyCommand';
import { RenderPath } from '@/components/stack/RenderPath';
import { SizeBars } from '@/components/stack/SizeBars';
import { C, Note, Sec, Toc, pad } from '@/components/stack/parts';

const TITLE = 'Next.js Scroll Animation for the App Router, SSR-Safe';
const DESCRIPTION =
  "Scroll animations for Next.js: one 'use client' component, SSR-safe, no hydration errors. Reveal, pin, text split, SVG draw. 10.7 KB gzip, MIT, TypeScript.";

/** Shown in the hero so the copy-paste answer is above the fold. */
const HERO_SNIPPET = `// components/FadeUp.tsx
'use client';
import { ScrollAnimate } from 'svg-scroll-draw/react';

export function FadeUp({ children }: { children: React.ReactNode }) {
  return (
    <ScrollAnimate
      props={{ opacity: [0, 1], transform: ['translateY(32px)', 'translateY(0)'] }}
      once
    >
      {children}
    </ScrollAnimate>
  );
}

// app/page.tsx stays a Server Component
<FadeUp><h2>Fades up on scroll</h2></FadeUp>`;

export const metadata: Metadata = {
  title: seoTitle(TITLE),
  description: DESCRIPTION,
  keywords: [
    'next.js scroll animation',
    'nextjs scroll animation library',
    'next.js animate on scroll',
    'next.js gsap alternative',
    'next.js framer motion alternative',
    'app router scroll animation',
    'next.js scroll reveal',
    'server components scroll animation',
    'next.js intersection observer',
    'scroll animation ssr safe',
  ],
  alternates: { canonical: '/nextjs-scroll-animation' },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: 'https://svg-scroll-draw.vercel.app/nextjs-scroll-animation',
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

const PATTERNS: { file: string; title: string; lede?: ReactNode; code: string }[] = [
  {
    file: 'components/AnimatedCards.tsx',
    title: 'Client Component (recommended)',
    lede: <>Add <C>&apos;use client&apos;</C> to any component that uses scroll APIs. Everything else can be a Server Component.</>,
    code: `'use client';
import { useEffect } from 'react';
import { scrollReveal } from 'svg-scroll-draw/reveal';
import { scrollAnimate } from 'svg-scroll-draw';

export function AnimatedCards({ cards }: { cards: Card[] }) {
  useEffect(() => {
    const reveal = scrollReveal('.card', { preset: 'fadeUp', stagger: 0.1 });
    const hero   = scrollAnimate('#hero-title', {
      props: { opacity: [0, 1], transform: ['translateY(32px)', 'translateY(0)'] },
      easing: 'ease-out',
      once:   true,
    });
    return () => { reveal.destroy(); hero.destroy(); };
  }, []);

  return (
    <div>
      <h1 id="hero-title">Features</h1>
      {cards.map(c => <div key={c.id} className="card">{c.content}</div>)}
    </div>
  );
}`,
  },
  {
    file: 'app/page.tsx',
    title: 'Dynamic import (heavy animated sections)',
    lede: <>For large animated sections, lazy-load them so they don&apos;t block the initial page render.</>,
    code: `import dynamic from 'next/dynamic';

// This section and its scroll animations only load when needed
const AnimatedShowcase = dynamic(
  () => import('@/components/AnimatedShowcase'),
  {
    ssr:     false,
    loading: () => <div className="h-96 animate-pulse bg-gray-100" />,
  }
);

// Server Component — no 'use client' needed here
export default async function Page() {
  const data = await fetchData(); // server-side data fetching
  return (
    <main>
      <Hero />          {/* Server Component — static */}
      <AnimatedShowcase data={data} />  {/* Client, lazy */}
    </main>
  );
}`,
  },
  {
    file: 'components/PinnedSection.tsx',
    title: 'useEffect cleanup (avoid memory leaks)',
    code: `'use client';
import { useEffect, useRef } from 'react';
import { scrollPin }      from 'svg-scroll-draw/pin';
import { scrollHorizontal } from 'svg-scroll-draw/horizontal';
import { scrollReveal }   from 'svg-scroll-draw/reveal';

export function ProductWalkthrough() {
  const imageRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const instances = [
      imageRef.current && scrollPin(imageRef.current, {
        pinDistance: window.innerHeight * 3,
        onEnter: () => console.log('pinned'),
      }),
      scrollReveal('.feature-text', { preset: 'fadeUp', stagger: 0.08 }),
    ].filter(Boolean);

    return () => instances.forEach(i => i && i.destroy());
  }, []); // run once on mount

  return (
    <div style={{ display: 'flex' }}>
      <div ref={imageRef}>...</div>
      <div className="feature-text">...</div>
    </div>
  );
}`,
  },
  {
    file: 'components/AnimatedPage.tsx',
    title: 'Route change cleanup',
    code: `'use client';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { scrollReveal } from 'svg-scroll-draw/reveal';

export function AnimatedPage({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const instanceRef = useRef<{ destroy: () => void } | null>(null);

  useEffect(() => {
    // Re-run on route change — pathname in deps array
    instanceRef.current = scrollReveal('.animate-in', {
      preset: 'fadeUp',
      stagger: 0.08,
      once: true,
    });

    return () => instanceRef.current?.destroy();
  }, [pathname]); // re-initialize on route change

  return <div>{children}</div>;
}`,
  },
];

const CMP = [
  { key: 'gsapScroll', name: 'GSAP + ScrollTrigger', size: COMPETITORS.gsapScroll.gzipKb, ssr: '✓ client-side setup', typed: '✓', note: `Free since 2025, mature, and does far more — at ${ratioVsSelf('gsapScroll')}× the bytes.` },
  { key: 'framerMotion', name: 'Framer Motion', size: COMPETITORS.framerMotion.gzipKb, ssr: '✓', typed: '✓', note: 'React-only. Draws SVG via pathLength; no pin/snap.' },
  { key: 'self', name: 'svg-scroll-draw', size: SELF.gzipKb, ssr: '✓', typed: '✓', note: 'MIT. Works in React, Vue, Svelte and vanilla JS.', highlight: true },
];

const TOC = [
  { id: 'answer', label: 'The answer' },
  { id: 'patterns', label: `The patterns · ${PATTERNS.length}` },
  { id: 'alternatives', label: 'vs common alternatives' },
  { id: 'built-for-next', label: 'Built for Next.js' },
];

export default function NextjsScrollAnimationPage() {
  return (
    <SiteShell kicker="next.js / your turn">
      <div className="stk stk-next">

        {/* ── Opening ────────────────────────────────────── */}
        <header className="pg-head stk-head">
          <div>
            <p className="pg-kicker">
              <span>next.js / ssr-safe</span>
              <span>app router · pages router</span>
            </p>
            <h1 className="pg-title stk-title">Scroll animations for Next.js.</h1>
            <p className="pg-lede">
              svg-scroll-draw is built SSR-first. All scroll APIs guard against <C>window</C> being undefined.
              Works in App Router Server Components, Client Components, and Pages Router — no hydration errors,
              no <C>document is not defined</C>.
            </p>
            <div className="pg-actions">
              <CopyCommand />
              <Link href="/react-scroll-animation" className="btn" data-magnetic>React guide →</Link>
            </div>
            <dl className="pg-facts">
              <div><dt>Gzipped</dt><dd>{SELF.gzipKb} KB</dd></div>
              <div><dt>Server render</dt><dd>No-op</dd></div>
              <div><dt>Patterns</dt><dd>{PATTERNS.length}</dd></div>
              <div><dt>Licence</dt><dd>{SELF.license}</dd></div>
            </dl>
          </div>
          <RenderPath />
        </header>

        <div className="stk-body">
          <Toc label="on this page" items={TOC} />
          <div className="stk-main">

            {/* ── 01 The answer ─────────────────────────────── */}
            <Sec n={1} k="the answer" id="answer" title="One client component. The page stays on the server.">
              <p className="stk-p">
                Mark the animated wrapper <C>&apos;use client&apos;</C> and use it from any Server Component —
                the page itself needs no directive.
              </p>
              <CodeBox file="components/FadeUp.tsx">{HERO_SNIPPET}</CodeBox>
            </Sec>

            {/* ── 02 The patterns ───────────────────────────── */}
            <Sec n={2} k={`${PATTERNS.length} patterns`} id="patterns" title="The patterns.">
              <div className="stk-pats">
                {PATTERNS.map((p, i) => (
                  <div key={p.file} id={`pt-${i + 1}`} className="stk-pat">
                    <p className="stk-step-k">pattern {pad(i + 1)} · <span>{p.file}</span></p>
                    <h3 className="stk-h3">Pattern {i + 1} — {p.title}</h3>
                    {p.lede && <p className="stk-p">{p.lede}</p>}
                    <CodeBox file={p.file}>{p.code}</CodeBox>
                  </div>
                ))}
              </div>

              <Note k="SSR safety">
                Every svg-scroll-draw engine starts with <C long>if (typeof window === &apos;undefined&apos;) return NOOP;</C>.
                All server-side renders return a no-op instance — no hydration mismatch, no crashes.
              </Note>
              <Note k="Native CSS">
                When the browser supports <C>animation-timeline: view()</C>, svg-scroll-draw automatically uses it —
                zero JS scroll listeners, zero rAF calls, no JavaScript per frame. Falls back to JS engine seamlessly.
              </Note>
            </Sec>

            {/* ── 03 vs alternatives ────────────────────────── */}
            <Sec n={3} k="measured" id="alternatives" title="vs common alternatives.">
              <SizeBars
                caption="fig. 2 — bundle, minified + gzipped, to one scale"
                rows={CMP.map((c) => ({ label: c.name, kb: c.size, self: c.highlight }))}
              />
              <div className="stk-cmp">
                {CMP.map(({ name, size, ssr, typed, note, highlight }) => (
                  <div key={name} className={`stk-cmp-col${highlight ? ' is-self' : ''}`}>
                    <p className="stk-cmp-name">{name}</p>
                    <dl>
                      <div><dt>Bundle</dt><dd>{size} KB</dd></div>
                      <div><dt>SSR-safe</dt><dd>{ssr}</dd></div>
                      <div><dt>TypeScript</dt><dd>{typed}</dd></div>
                    </dl>
                    <p className="stk-cmp-note">{note}</p>
                  </div>
                ))}
              </div>
              <p className="stk-src">
                {provenance([`gsap ${COMPETITORS.gsapScroll.version}`, `framer-motion ${COMPETITORS.framerMotion.version}`, `svg-scroll-draw ${SELF.version}`])}
              </p>
            </Sec>

            {/* ── 04 Built for Next.js ──────────────────────── */}
            <Sec n={4} k="drop it in" id="built-for-next" title="Built for Next.js.">
              <dl className="stk-close-specs">
                <div><dt>SSR</dt><dd>Safe by default</dd></div>
                <div><dt>Router</dt><dd>App Router ready</dd></div>
                <div><dt>Licence</dt><dd>MIT</dd></div>
                <div><dt>Gzipped</dt><dd>{SELF.gzipKb} KB</dd></div>
                <div><dt>Types</dt><dd>TypeScript</dd></div>
              </dl>
              <div className="pg-actions">
                <CopyCommand />
                <Link href="/docs" className="btn btn-solid" data-magnetic>Full docs →</Link>
                <Link href="/react-scroll-animation" className="btn" data-magnetic>React guide →</Link>
              </div>
            </Sec>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
