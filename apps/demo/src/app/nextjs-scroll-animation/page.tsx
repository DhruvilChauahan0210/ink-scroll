import type { Metadata } from 'next';
import '@/components/stack/stack.css';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { COMPETITORS, SELF, ratioVsSelf, provenance } from '@/data/competitors';
import { seoTitle } from '../_lib/seo';
import { SiteShell } from '@/components/site/SiteShell';
import { jsonLd, SITE_URL } from '@/lib/json-ld';
import { CodeBox } from '@/components/site/CodeBox';
import { CopyCommand } from '@/components/home/CopyCommand';
import { RenderPath } from '@/components/stack/RenderPath';
import { SizeBars } from '@/components/stack/SizeBars';
import { C, Note, Sec, Toc, pad } from '@/components/stack/parts';
// Rendered from this Server Component: the demo's build fails if the package
// ever ships svg-scroll-draw/react without its "use client" directive.
import { ScrollDraw } from 'svg-scroll-draw/react';

const TITLE = 'Next.js Scroll Animation for the App Router, SSR-Safe';
const DESCRIPTION =
  "Scroll animations for Next.js: one 'use client' component, SSR-safe, no hydration errors. Reveal, pin, text split, SVG draw. 10.7 KB gzip, MIT, TypeScript.";

/** The copy-paste answer, right under the fold. */
const HERO_SNIPPET = `// app/page.tsx — a Server Component, no directive
import { ScrollAnimate, ScrollDraw } from 'svg-scroll-draw/react';

export default function Page() {
  return (
    <main>
      <ScrollAnimate props={{ opacity: [0, 1], transform: ['translateY(32px)', 'translateY(0)'] }} once>
        <h2>Fades up on scroll</h2>
      </ScrollAnimate>
      <ScrollDraw>
        <svg viewBox="0 0 400 24">
          <path d="M2 12 C 100 2, 300 22, 398 12" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      </ScrollDraw>
    </main>
  );
}`;

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

type Card = { id: string; content: React.ReactNode };

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
import { scrollPin }    from 'svg-scroll-draw/pin';
import { scrollReveal } from 'svg-scroll-draw/reveal';

export function ProductWalkthrough() {
  const imageRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const instances = [
      imageRef.current && scrollPin(imageRef.current, {
        pinDistance: '300vh',
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

/**
 * A whole App Router project, smallest that shows the split: one client file
 * holds every animated part, the page stays a Server Component that fetches.
 * Typechecked as real files against the built package before it went here.
 */
const TREE = `app/
  layout.tsx       Server Component, nothing to add
  page.tsx         Server Component: fetches, renders the animated parts
components/
  motion.tsx       'use client': the only client file`;

const EXAMPLE: { file: string; lede: ReactNode; code: string }[] = [
  {
    file: 'components/motion.tsx',
    lede: <>The components work from the page itself; a client file is where your own wrappers go — named, reusable, and the only place callbacks can live. Each sets up on mount and cleans up on unmount.</>,
    code: `'use client';

import type { ReactNode } from 'react';
import { ScrollAnimate, ScrollDraw, ScrollText } from 'svg-scroll-draw/react';

/** Fades its children up the first time they scroll into view. */
export function FadeUp({ children }: { children: ReactNode }) {
  return (
    <ScrollAnimate props={{ opacity: [0, 1], transform: ['translateY(32px)', 'translateY(0)'] }} once>
      {children}
    </ScrollAnimate>
  );
}

/** A headline whose words rise in one after another. */
export function Headline({ text }: { text: string }) {
  return (
    <ScrollText as="h2" split="words" stagger={0.06} once>
      {text}
    </ScrollText>
  );
}

/** A rule that draws itself across the section as you scroll. */
export function DrawnRule() {
  return (
    <ScrollDraw>
      <svg viewBox="0 0 400 24" width="100%" aria-hidden="true">
        <path d="M2 12 C 100 2, 300 22, 398 12" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
    </ScrollDraw>
  );
}`,
  },
  {
    file: 'app/page.tsx',
    lede: <>The page has no directive. It fetches on the server, renders the markup in full, and the animated parts hydrate on their own.</>,
    code: `import { DrawnRule, FadeUp, Headline } from '@/components/motion';

type Feature = { id: string; title: string; body: string };

async function getFeatures(): Promise<Feature[]> {
  const res = await fetch('https://example.com/api/features', { next: { revalidate: 3600 } });
  return res.json();
}

export default async function Page() {
  const features = await getFeatures();
  return (
    <main>
      <Headline text="Scroll animations, rendered on the server." />
      <DrawnRule />
      {features.map((f) => (
        <FadeUp key={f.id}>
          <article>
            <h3>{f.title}</h3>
            <p>{f.body}</p>
          </article>
        </FadeUp>
      ))}
    </main>
  );
}`,
  },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: 'Does svg-scroll-draw work with React Server Components?',
    a: "Yes. From v2.16.1 the components in svg-scroll-draw/react carry 'use client', so a Server Component renders <ScrollDraw>, <ScrollAnimate> and the rest directly. Only options that are functions, such as onProgress, need a 'use client' file of your own. On the server every svg-scroll-draw call returns a no-op instance, so rendering never touches window or document.",
  },
  {
    q: 'Do I need next/dynamic with ssr: false?',
    a: 'No. The library is safe to render on the server as it is. Use next/dynamic only to lazy-load a heavy animated section so it does not hold up the first paint.',
  },
  {
    q: 'Will scroll animations cause hydration errors in Next.js?',
    a: 'No. The server renders your markup unchanged and the library only starts after the component mounts in the browser, so the HTML React hydrates matches what the server sent.',
  },
  {
    q: 'Does it work with the Pages Router?',
    a: "Yes. Pages Router components already run in the browser, so no directive is needed: use the same components, or call the functions inside useEffect and return their destroy().",
  },
  {
    q: 'What happens on route changes?',
    a: 'Components from svg-scroll-draw/react clean up when they unmount, so pages that change need nothing extra. Selector-based calls made in a layout that persists across routes should re-run when the pathname changes, as in pattern 4.',
  },
  {
    q: 'Does it respect prefers-reduced-motion?',
    a: 'Yes. With reduced motion requested, drawings, reveals and text show in their final state instead of animating, and if the reader turns it on while the page is open, everything still moving finishes at once.',
  },
];

const CMP = [
  { key: 'gsapScroll', name: 'GSAP + ScrollTrigger', size: COMPETITORS.gsapScroll.gzipKb, ssr: '✓ client-side setup', typed: '✓', note: `Free since 2025, mature, and does far more — at ${ratioVsSelf('gsapScroll')}× the bytes.` },
  { key: 'framerMotion', name: 'Framer Motion', size: COMPETITORS.framerMotion.gzipKb, ssr: '✓', typed: '✓', note: 'React-only. Draws SVG via pathLength; no pin/snap.' },
  { key: 'self', name: 'svg-scroll-draw', size: SELF.gzipKb, ssr: '✓', typed: '✓', note: 'MIT. Works in React, Vue, Svelte and vanilla JS.', highlight: true },
];

const TOC = [
  { id: 'answer', label: 'The answer' },
  { id: 'example', label: 'A complete App Router example' },
  { id: 'patterns', label: `The patterns · ${PATTERNS.length}` },
  { id: 'faq', label: `Questions · ${FAQ.length}` },
  { id: 'alternatives', label: 'vs common alternatives' },
  { id: 'built-for-next', label: 'Built for Next.js' },
];

/** What this page is, for search engines: a technical article, and its questions. */
const ARTICLE = {
  '@type': 'TechArticle',
  headline: TITLE,
  description: DESCRIPTION,
  url: `${SITE_URL}/nextjs-scroll-animation`,
  author: { '@type': 'Person', name: 'Dhruvil Chauhan', url: 'https://github.com/DhruvilChauahan0210' },
  publisher: { '@type': 'Organization', name: 'svg-scroll-draw', url: SITE_URL },
  about: { '@id': `${SITE_URL}/#software` },
  mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/nextjs-scroll-animation` },
};
const JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    ARTICLE,
    {
      '@type': 'FAQPage',
      mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
  ],
};

export default function NextjsScrollAnimationPage() {
  return (
    <SiteShell active="/nextjs-scroll-animation" crumbs={[['Next.js', '/nextjs-scroll-animation']]} kicker="next.js / your turn">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(JSON_LD) }} />
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
            <Sec n={1} k="the answer" id="answer" title="Render it from a Server Component.">
              <p className="stk-p">
                The components in <C>svg-scroll-draw/react</C> carry <C>&apos;use client&apos;</C> (from v2.16.1), so
                a Server Component renders them directly: your markup is server-rendered, and the animation starts in
                the browser. The page needs no directive.
              </p>
              <CodeBox file="app/page.tsx">{HERO_SNIPPET}</CodeBox>
              <ScrollDraw className="stk-live">
                <svg viewBox="0 0 400 24" width="100%" aria-hidden="true">
                  <path d="M2 12 C 100 2, 300 22, 398 12" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
              </ScrollDraw>
              <p className="stk-src">
                fig. 1 — the line above is that <C>&lt;ScrollDraw&gt;</C>, rendered by this page, a Server Component.
              </p>
              <Note k="Callbacks">
                A function cannot cross from a Server Component to a client one, so options such as <C>onProgress</C> or{' '}
                <C>onComplete</C> go in a <C>&apos;use client&apos;</C> file of your own, as in the complete example below.
                On v2.16.0 and earlier, wrap every component that way.
              </Note>
            </Sec>

            {/* ── 02 A complete App Router example ──────────── */}
            <Sec n={2} k="copy the whole thing" id="example" title="A complete App Router example.">
              <p className="stk-p">
                The smallest project that shows the split: one client file holds every animated part, and the page
                stays a Server Component that fetches its data. Install, add these files, run <C>next dev</C>.
              </p>
              <CodeBox file="project">{TREE}</CodeBox>
              {EXAMPLE.map((f) => (
                <div key={f.file} className="stk-pat">
                  <p className="stk-step-k">file · <span>{f.file}</span></p>
                  <p className="stk-p">{f.lede}</p>
                  <CodeBox file={f.file}>{f.code}</CodeBox>
                </div>
              ))}
              <Note k="Pages Router">
                Pages Router components already run in the browser, so drop the <C>&apos;use client&apos;</C> line and
                use <C>components/motion.tsx</C> from any page as it is.
              </Note>
            </Sec>

            {/* ── 03 The patterns ───────────────────────────── */}
            <Sec n={3} k={`${PATTERNS.length} patterns`} id="patterns" title="The patterns.">
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

            {/* ── 04 Questions ──────────────────────────────── */}
            <Sec n={4} k={`${FAQ.length} questions`} id="faq" title="Questions Next.js developers ask.">
              <div className="stk-faq">
                {FAQ.map((f, i) => (
                  <div key={f.q} className="stk-q">
                    <span className="stk-q-n">Q{i + 1}</span>
                    <div>
                      <h3 className="stk-q-t">{f.q}</h3>
                      <p className="stk-p">{f.a}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Sec>

            {/* ── 05 vs alternatives ────────────────────────── */}
            <Sec n={5} k="measured" id="alternatives" title="vs common alternatives.">
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

            {/* ── 06 Built for Next.js ──────────────────────── */}
            <Sec n={6} k="drop it in" id="built-for-next" title="Built for Next.js.">
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
