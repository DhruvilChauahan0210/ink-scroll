import type { Metadata } from 'next';
import '@/components/stack/stack.css';
import Link from 'next/link';
import { seoTitle } from '../_lib/seo';
import { COMPETITORS, SELF, provenance } from '@/data/competitors';
import { UNIT_TESTS } from '@/data/facts';
import { SiteShell } from '@/components/site/SiteShell';
import { jsonLd, SITE_URL } from '@/lib/json-ld';
import { CodeBox } from '@/components/site/CodeBox';
import { StepRail } from '@/components/site/StepRail';
import { CopyCommand } from '@/components/home/CopyCommand';
import { PageMap } from '@/components/stack/PageMap';
import { SizeBars } from '@/components/stack/SizeBars';
import { C, Sec, Toc, pad } from '@/components/stack/parts';

const TITLE = `React Scroll Animation: Components & Hooks, ${SELF.gzipKb} KB`;
const DESCRIPTION =
  `Scroll animations in React with typed components and hooks: fade, pin, snap, text split, SVG draw. ${SELF.gzipKb} KB gzip, MIT, works in the Next.js App Router.`;

export const metadata: Metadata = {
  title: seoTitle(TITLE),
  description: DESCRIPTION,
  keywords: [
    'react scroll animation',
    'react scroll animation library',
    'react animate on scroll',
    'react scroll reveal',
    'react intersection observer animation',
    'scroll animation react hooks',
    'react framer motion alternative',
    'react gsap alternative',
    'react scroll trigger',
    'next.js scroll animation',
  ],
  alternates: { canonical: '/react-scroll-animation' },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: 'https://svg-scroll-draw.vercel.app/react-scroll-animation',
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

/** Shown in the hero so the copy-paste answer is above the fold. */
const HERO_SNIPPET = `'use client';
import { ScrollAnimate } from 'svg-scroll-draw/react';

export function FadeUp({ children }: { children: React.ReactNode }) {
  return (
    <ScrollAnimate
      props={{ opacity: [0, 1], transform: ['translateY(40px)', 'translateY(0)'] }}
      once
    >
      {children}
    </ScrollAnimate>
  );
}`;

const APIS = [
  { name: 'scrollReveal', sub: 'svg-scroll-draw/reveal', desc: 'Reveal elements on scroll. 7 presets, stagger, custom from state. Replaces AOS.', hook: false },
  { name: 'ScrollAnimate', sub: 'svg-scroll-draw/react', desc: 'Animate any CSS property driven by scroll. Component wrapper around scrollAnimate.', hook: false },
  { name: 'ScrollDraw', sub: 'svg-scroll-draw/react', desc: 'Wrap any inline SVG and its paths draw as you scroll. Presets, stagger, easing.', hook: false },
  { name: 'useScrollDrawProgress', sub: 'svg-scroll-draw/react', desc: 'Hook that returns live 0–1 scroll progress for a ref, for driving your own UI.', hook: true },
  { name: 'ScrollText', sub: 'svg-scroll-draw/react', desc: 'Split text + stagger reveal. words, chars, or lines. Replaces GSAP SplitText.', hook: false },
  { name: 'ScrollCounter', sub: 'svg-scroll-draw/react', desc: 'Animated number counter driven by scroll. Format function, decimals, easing.', hook: false },
  { name: 'scrollPin', sub: 'svg-scroll-draw/pin', desc: 'Pin an element at a viewport position while content scrolls past it. Full lifecycle callbacks.', hook: false },
  { name: 'scrollSnap', sub: 'svg-scroll-draw/snap', desc: 'Section snapping with custom easing. snapTo(), getCurrentIndex(), onSnap.', hook: false },
  { name: 'scrollProgress', sub: 'svg-scroll-draw/progress', desc: 'Expose scroll progress as --scroll-progress CSS custom property. Drive CSS with calc().', hook: false },
  { name: 'scrollHorizontal', sub: 'svg-scroll-draw/horizontal', desc: 'Apple-style horizontal scroll sections driven by vertical scroll.', hook: false },
];

const QUICK_START = [
  { file: 'FeaturesSection.tsx', title: 'Reveal on scroll (the common case)', code: `'use client';
import { useEffect } from 'react';
import { scrollReveal } from 'svg-scroll-draw/reveal';

export function FeaturesSection() {
  useEffect(() => {
    const inst = scrollReveal('.feature-card', {
      preset:  'fadeUp',
      stagger: 0.1,
      once:    true,
    });
    return () => inst.destroy();
  }, []);

  return (
    <section>
      {features.map(f => (
        <div key={f.id} className="feature-card">{f.content}</div>
      ))}
    </section>
  );
}` },
  { file: 'HeroSection.tsx', title: 'Animate any CSS property', code: `'use client';
import { useEffect, useRef } from 'react';
import { scrollAnimate } from 'svg-scroll-draw';
// Or use the component wrapper:
import { ScrollAnimate } from 'svg-scroll-draw/react';

// Hook style (imperative)
export function HeroSection() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const inst = scrollAnimate(ref.current, {
      props: {
        opacity:   [0, 1],
        transform: ['translateY(40px)', 'translateY(0)'],
      },
      easing: 'ease-out',
      once:   true,
    });
    return () => inst.destroy();
  }, []);

  return <div ref={ref}>Hero content</div>;
}

// Component style (declarative)
export function HeroDeclarative() {
  return (
    <ScrollAnimate
      props={{ opacity: [0, 1], transform: ['translateY(24px)', 'translateY(0)'] }}
      easing="ease-out"
      once
    >
      <div>Hero content</div>
    </ScrollAnimate>
  );
}` },
  { file: 'ProductSection.tsx', title: 'Sticky pin section', code: `'use client';
import { useEffect, useRef } from 'react';
import { scrollPin } from 'svg-scroll-draw/pin';

export function ProductSection() {
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!imageRef.current) return;
    const inst = scrollPin(imageRef.current, {
      top:         80,                     // below fixed header
      pinDistance: '300vh',
      onEnter:     () => setActive(true),
      onLeave:     () => setActive(false),
    });
    return () => inst.destroy();
  }, []);

  return (
    <div style={{ display: 'flex', gap: 64 }}>
      <div ref={imageRef} style={{ width: '50%' }}>
        <img src="/product.webp" alt="Product" />
      </div>
      <div style={{ flex: 1 }}>
        {features.map(f => <FeatureBlock key={f.id} {...f} />)}
      </div>
    </div>
  );
}` },
  { file: 'StatsSection.tsx', title: 'Animated counter', code: `import { ScrollCounter } from 'svg-scroll-draw/react';

export function StatsSection() {
  return (
    <div className="stats-grid">
      <ScrollCounter
        to={50000}
        format={n => Math.round(n).toLocaleString() + '+'}
        easing="ease-out"
        once
      />
      <ScrollCounter to={9} format={n => '~' + Math.round(n) + ' KB'} once />
    </div>
  );
}` },
  { file: 'Headline.tsx', title: 'Text reveal (replaces GSAP SplitText)', code: `import { ScrollText } from 'svg-scroll-draw/react';

export function Headline() {
  return (
    <ScrollText
      split="words"
      stagger={0.07}
      from={{ opacity: 0, y: 32 }}
      easing="ease-out"
      once
    >
      <h1>Animate everything on scroll.</h1>
    </ScrollText>
  );
}` },
];

const APP_PAGE = `import dynamic from 'next/dynamic';

// Option A: 'use client' component
// AnimatedHero.tsx starts with 'use client'
import { AnimatedHero } from '@/components/AnimatedHero';

// Option B: dynamic import with ssr: false
const AnimatedSection = dynamic(
  () => import('@/components/AnimatedSection'),
  { ssr: false }
);

export default function Page() {
  return (
    <>
      <AnimatedHero />
      <AnimatedSection />
    </>
  );
}`;

/** The libraries React developers weigh this against, measured the same way (`data/competitors.ts`). */
const CMP = [
  {
    name: 'GSAP + ScrollTrigger', size: COMPETITORS.gsapScroll.gzipKb, api: 'useGSAP hook (@gsap/react)',
    note: 'Free since 2025 and the most capable: sequenced timelines for anything. Pick it when the page is one long choreographed piece.',
    href: '/vs-gsap',
  },
  {
    name: 'Framer Motion', size: COMPETITORS.framerMotion.gzipKb, api: 'useScroll, useTransform, motion.*',
    note: 'React-only, and also does layout, gesture and exit animation. Pick it when you already use it for those.',
    href: '/vs-framer-motion',
  },
  {
    name: 'AOS', size: COMPETITORS.aos.gzipKb, api: 'none: data attributes + AOS.init()',
    note: `Smaller, but reveal-on-scroll only, and last published ${COMPETITORS.aos.lastPublish?.slice(0, 4)}. Pick it for fades on a simple page.`,
    href: '/vs-aos',
  },
  {
    name: 'svg-scroll-draw', size: SELF.gzipKb, api: 'components + hooks',
    note: 'Scroll-tied drawing, reveals, pinning, text and video, on CSS scroll timelines where supported. Also Vue, Svelte, Solid, Angular.',
    href: '/docs', highlight: true,
  },
];

/** Asked about React scroll animation; answered once, here and in the page's FAQPage data. */
const FAQ: { q: string; a: string }[] = [
  {
    q: 'What is the best scroll animation library for React?',
    a: 'It depends on the page. GSAP with ScrollTrigger handles long choreographed timelines best; Framer Motion fits if you already use it for layout and gestures; AOS covers simple fade-ins. svg-scroll-draw covers scroll-tied drawing, reveals, pinning, split text and video scrubbing in one small package, and hands the work to the browser\'s CSS scroll timeline where it can.',
  },
  {
    q: 'How do I animate an element when it scrolls into view in React?',
    a: 'Wrap it in <ScrollAnimate> with the properties to animate and once to play it a single time, as in the first example on this page. For many elements at once, call scrollReveal with a selector inside useEffect and return its destroy() for cleanup.',
  },
  {
    q: 'Can I do scroll animations in React without a library?',
    a: "Yes. An IntersectionObserver that adds a class covers fade-ins, and CSS animation-timeline: view() ties an animation to scroll in browsers that support it. A library earns its place when you need a fallback for the browsers that don't, scrubbing back and forth, pinning, SVG path lengths or cleanup across route changes.",
  },
  {
    q: 'Is svg-scroll-draw a Framer Motion alternative?',
    a: 'For scroll-driven effects, yes, at a fraction of the size. It does not replace Framer Motion\'s layout animations, gestures or exit animations, so keep Framer Motion if a page relies on those.',
  },
  {
    q: 'Does it work with React Server Components and Next.js?',
    a: "Yes. The components in svg-scroll-draw/react ship with 'use client', so a Server Component can render them directly; only function options such as onProgress need a client file of your own. On the server every call is a no-op, so rendering never touches window.",
  },
  {
    q: 'How do I clean up scroll animations in React?',
    a: 'The components clean up when they unmount. The plain functions return an instance: call them inside useEffect and return instance.destroy(), so nothing keeps listening after the component is gone.',
  },
];

const TOC = [
  { id: 'answer', label: 'The answer' },
  { id: 'quick-start', label: `Quick start · ${QUICK_START.length}` },
  { id: 'every-api', label: `Every React API · ${APIS.length}` },
  { id: 'app-router', label: 'Next.js App Router' },
  { id: 'which-library', label: 'Which library to pick' },
  { id: 'faq', label: `Questions · ${FAQ.length}` },
  { id: 'drop-in', label: 'Drop it in' },
];

/** What this page is, for search engines: a technical article about the library. */
const ARTICLE = {
  '@type': 'TechArticle',
  headline: TITLE,
  description: DESCRIPTION,
  url: `${SITE_URL}/react-scroll-animation`,
  author: { '@type': 'Person', name: 'Dhruvil Chauhan', url: 'https://github.com/DhruvilChauahan0210' },
  publisher: { '@type': 'Organization', name: 'svg-scroll-draw', url: SITE_URL },
  about: { '@id': `${SITE_URL}/#software` },
  mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/react-scroll-animation` },
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

export default function ReactScrollAnimationPage() {
  return (
    <SiteShell active="/react-scroll-animation" crumbs={[['React', '/react-scroll-animation']]} kicker="react / your turn">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(JSON_LD) }} />
      <div className="stk stk-react">

        {/* ── Opening ────────────────────────────────────── */}
        <header className="pg-head stk-head">
          <div>
            <p className="pg-kicker">
              <span>react / components &amp; hooks</span>
              <span>works with next.js app router, remix, vite</span>
            </p>
            <h1 className="pg-title stk-title">
              React scroll animations <span className="dim">in {SELF.gzipKb}&nbsp;KB, zero&nbsp;deps</span>
            </h1>
            <p className="pg-lede">
              Typed React components and hooks for every scroll animation pattern — fade, slide, pin, snap, counter,
              text reveal, video scrub, horizontal sections. No GSAP. No Framer Motion. No config files.
            </p>
            <div className="pg-actions">
              <CopyCommand />
              <Link href="/docs" className="btn" data-magnetic>API Reference →</Link>
              <Link href="/vs-gsap" className="btn" data-magnetic>vs GSAP →</Link>
            </div>
            <dl className="pg-facts">
              <div><dt>Gzipped</dt><dd>{SELF.gzipKb} KB</dd></div>
              <div><dt>React APIs</dt><dd>{APIS.length}</dd></div>
              <div><dt>Unit tests</dt><dd>{UNIT_TESTS}</dd></div>
              <div><dt>Dependencies</dt><dd>0</dd></div>
            </dl>
          </div>
          <PageMap />
        </header>

        <div className="stk-body">
          <Toc label="On this page" items={TOC} />
          <div className="stk-main">

            {/* ── 01 The answer ─────────────────────────────── */}
            <Sec n={1} k="The answer" id="answer" title="Fade anything up, in one component">
              <p className="stk-p">
                The copy-paste answer: a client component that wraps its children in <C>ScrollAnimate</C> and
                plays once. Use it anywhere, including inside a Server Component page.
              </p>
              <CodeBox file="FadeUp.tsx">{HERO_SNIPPET}</CodeBox>
            </Sec>

            {/* ── 02 Quick start ────────────────────────────── */}
            <Sec n={2} k={`quick start · ${QUICK_START.length} steps`} id="quick-start" title="Quick start">
              <p className="stk-p">
                Five patterns that cover most of a landing page — the same five numbered on the drawing above.
              </p>
              <StepRail>
                <ol className="stk-steps">
                  {QUICK_START.map((s, i) => (
                    <li key={s.file} id={`qs-${i + 1}`} className="stk-step">
                      <span className="stk-node" aria-hidden="true">{i + 1}</span>
                      <p className="stk-step-k">Step {pad(i + 1)} · <span>{s.file}</span></p>
                      <h3 className="stk-h3">{i + 1}. {s.title}</h3>
                      <CodeBox file={s.file}>{s.code}</CodeBox>
                    </li>
                  ))}
                </ol>
              </StepRail>
            </Sec>

            {/* ── 03 Every API ──────────────────────────────── */}
            <Sec n={3} k={`parts list · ${APIS.length} apis`} id="every-api" title="Every React API">
              <ol className="stk-parts">
                <li className="stk-part stk-part-h" aria-hidden="true"><span>no.</span><span>api · entry</span><span>What it does</span></li>
                {APIS.map(({ name, sub, desc, hook }, i) => (
                  <li key={name} className="stk-part">
                    <span className="stk-part-n">{pad(i + 1)}</span>
                    <span className="stk-part-api"><code>{name}</code><span>{sub}</span></span>
                    <p className="stk-part-d">{desc}{hook && <span className="tag">hook</span>}</p>
                  </li>
                ))}
              </ol>
              <p className="stk-p stk-more">
                Have an SVG to draw? The <Link href="/svg-to-jsx-converter">SVG to JSX converter</Link> turns it into
                a typed React component, wrapped in <C>ScrollDraw</C> if you want, and the{' '}
                <Link href="/scroll-reveal-generator">scroll reveal generator</Link> copies a ready React component
                for card reveals.
              </p>
            </Sec>

            {/* ── 04 Next.js App Router ─────────────────────── */}
            <Sec n={4} k="next.js" id="app-router" title="Next.js App Router">
              <p className="stk-p">
                svg-scroll-draw is fully SSR-safe. All engines guard against <C>window</C> being undefined.
                In Next.js App Router, add <C>&apos;use client&apos;</C> to any component that calls scroll APIs — or use{' '}
                <C long>dynamic(() =&gt; import(...), {'{'} ssr: false {'}'} )</C> to lazy-load entire animated sections.
              </p>
              <CodeBox file="app/page.tsx">{APP_PAGE}</CodeBox>
              <p className="stk-p stk-more">
                Server and client boundaries, route changes and cleanup are on the{' '}
                <Link href="/nextjs-scroll-animation">Next.js page</Link>.
              </p>
            </Sec>

            {/* ── 05 Which library ──────────────────────────── */}
            <Sec n={5} k="measured" id="which-library" title="Which React scroll animation library?">
              <p className="stk-p">
                Four libraries cover most React scroll animation. Each is the right pick for some page; the sizes are
                minified and gzipped, measured the same way for all four.
              </p>
              <SizeBars
                caption="fig. 2 — bundle, minified + gzipped, to one scale"
                rows={CMP.map((c) => ({ label: c.name, kb: c.size, self: c.highlight }))}
              />
              <div className="stk-cmp stk-cmp-2x2">
                {CMP.map(({ name, size, api, note, href, highlight }) => (
                  <div key={name} className={`stk-cmp-col${highlight ? ' is-self' : ''}`}>
                    <p className="stk-cmp-name">{name}</p>
                    <dl>
                      <div><dt>Bundle</dt><dd>{size} KB</dd></div>
                      <div><dt>React API</dt><dd>{api}</dd></div>
                    </dl>
                    <p className="stk-cmp-note">{note}</p>
                    {!highlight && <p className="stk-cmp-note"><Link href={href}>Side by side →</Link></p>}
                  </div>
                ))}
              </div>
              <p className="stk-src">
                {provenance([`gsap ${COMPETITORS.gsapScroll.version}`, `framer-motion ${COMPETITORS.framerMotion.version}`, `aos ${COMPETITORS.aos.version}`, `svg-scroll-draw ${SELF.version}`])}
              </p>
            </Sec>

            {/* ── 06 Questions ──────────────────────────────── */}
            <Sec n={6} k={`${FAQ.length} questions`} id="faq" title="Questions React developers ask">
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

            {/* ── 07 Drop it in ─────────────────────────────── */}
            <Sec n={7} k="Drop it in" id="drop-in" title="Drop-in for React + Next.js">
              <dl className="stk-close-specs">
                <div><dt>Licence</dt><dd>MIT</dd></div>
                <div><dt>Dependencies</dt><dd>Zero</dd></div>
                <div><dt>Types</dt><dd>TypeScript</dd></div>
                <div><dt>Unit tests</dt><dd>{UNIT_TESTS} tests</dd></div>
                <div><dt>Runs</dt><dd>Everywhere React works</dd></div>
              </dl>
              <div className="pg-actions">
                <CopyCommand />
                <Link href="/docs" className="btn btn-solid" data-magnetic>Full API docs →</Link>
                <Link href="/examples" className="btn" data-magnetic>Live examples →</Link>
              </div>
            </Sec>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
