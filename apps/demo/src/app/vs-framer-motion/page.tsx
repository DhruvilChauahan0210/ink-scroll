import type { Metadata } from 'next';
import Link from 'next/link';
import { seoTitle } from '../_lib/seo';
import { COMPETITORS, SELF, SELF_ENTRIES, MEASURED_ON, provenance, ratioVsSelf } from '@/data/competitors';
import { jsonLd } from '@/lib/json-ld';
import { SiteShell } from '@/components/site/SiteShell';
import { CodeBox } from '@/components/site/CodeBox';
import { SpecSheet } from '@/components/h2h/SpecSheet';
import { WeighIn } from '@/components/h2h/WeighIn';
import { Calls, Closing, CodeSet, Head, Legend, Matrix, OtherSheets, Toc, type MatrixRow } from '@/components/h2h/parts';

const FM = COMPETITORS.framerMotion;
/** "3.36" → "3.4": one decimal is all the precision a headline ratio deserves. */
const RATIO = (Math.round(ratioVsSelf('framerMotion') * 10) / 10).toFixed(1);

export const metadata: Metadata = {
  title: seoTitle('Framer Motion Alternative for Scroll Animations'),
  description:
    'svg-scroll-draw vs Framer Motion for scroll animation: ~3.4× smaller measured, works outside React, native CSS fast path, MIT. Table and side-by-side code.',
  keywords: [
    'framer motion alternative',
    'framer motion vs scroll animation',
    'svg-scroll-draw vs framer motion',
    'scroll animation without framer motion',
    'framer motion bundle size',
    'react scroll animation alternative',
    'lightweight framer motion',
    'framer motion replacement',
    'scroll animation library 2025',
  ],
  alternates: { canonical: 'https://svg-scroll-draw.vercel.app/vs-framer-motion' },
  openGraph: {
    title: 'svg-scroll-draw vs Framer Motion',
    description: '~3.4× smaller, measured. Framework-agnostic. Native CSS fast path.',
    url: 'https://svg-scroll-draw.vercel.app/vs-framer-motion',
  },
  twitter: { card: 'summary_large_image', title: 'svg-scroll-draw vs Framer Motion', description: '~3.4× smaller, measured. Works outside React. Native CSS fast path.' },
};

const pageJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is a good alternative to Framer Motion for scroll animations?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'svg-scroll-draw is a roughly 3.4× smaller alternative to Framer Motion for scroll-driven animations. It is framework-agnostic (works in React, Vue, Svelte, vanilla JS), MIT licensed, and uses native CSS animation-timeline when possible for zero per-frame JavaScript.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can svg-scroll-draw be used outside of React?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Unlike Framer Motion which is React-only, svg-scroll-draw works with React, Next.js, Vue 3, Svelte, Solid.js, Angular, Astro, Nuxt, and plain vanilla JavaScript.',
      },
    },
    {
      '@type': 'Question',
      name: 'How much smaller is svg-scroll-draw compared to Framer Motion?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: `svg-scroll-draw ${SELF.version} is ${SELF.gzipKb} KB gzipped. framer-motion ${FM.version} is ${FM.gzipKb} KB at its CJS entry and ${FM.bundleKb} KB as a single bundle, measured ${MEASURED_ON} at gzip level 9 — so roughly ${RATIO}x larger on the fairer of the two figures. A tree-shaken modern ESM import can be considerably less than that, because Framer Motion ships a re-export shell and real usage varies with how much of it you touch.`,
      },
    },
  ],
};

const FEATURES: MatrixRow[] = [
  { f: 'Scroll-driven animations', cells: [true, true] },
  { f: 'Animate any CSS property', cells: [true, true] },
  { f: 'SVG path draw animation', cells: [true, true], note: 'Framer Motion does do this — its pathLength / pathOffset / pathSpacing props map onto stroke-dasharray and stroke-dashoffset, normalised 0–1. Paired with useScroll it covers the basic draw. What it has no equivalent for is multi-path stagger orchestration and the native CSS fast path.' },
  { f: 'Pin / sticky sections', cells: [true, false] },
  { f: 'Section snapping', cells: [true, false] },
  { f: 'Text split + stagger', cells: [true, false], note: 'Framer Motion needs SplitText manually' },
  { f: 'Animated counters', cells: [true, 'partial'], note: 'Framer Motion useTransform can do this but requires boilerplate' },
  { f: 'Video scrub', cells: [true, false] },
  { f: 'scrollReveal (one-line preset)', cells: [true, false] },
  { f: 'scrollProgress (CSS variable)', cells: [true, false] },
  { f: 'Horizontal scroll sections', cells: [true, 'partial'] },
  { f: 'Honours prefers-reduced-motion by default', cells: ['partial', 'partial'], note: 'Ours is default-on for scrollDraw, scrollAnimate, scrollReveal, scrollCounter, scrollText, scrollVideo, scrollSnap and Cinematic — but scrollHorizontal opts out by design, and scrollPin/scrollProgress have no reduced-motion path. Framer Motion has useReducedMotion() and MotionConfig reducedMotion="user" — good tooling, but opt-in rather than default.' },
  { f: 'Native CSS fast path', cells: [true, false], note: 'svg-scroll-draw uses animation-timeline: view() when eligible' },
  { f: 'Works outside React', cells: [true, false], note: 'Framer Motion is React-only' },
  { f: 'Vue / Svelte / Solid wrappers', cells: [true, false] },
  { f: 'Velocity-scaled animation', cells: [true, false] },
  { f: 'Lenis smooth scroll adapter', cells: [true, 'partial'] },
  { f: 'MIT license', cells: [true, true] },
  { f: 'Bundle size (gzipped)', cells: [`${SELF.gzipKb} KB`, `${FM.gzipKb} KB`], note: `framer-motion ${FM.version} CJS entry, measured ${MEASURED_ON}. Its single bundle is ${FM.bundleKb} KB; a tree-shaken ESM import can be well under both — Framer Motion’s real cost depends heavily on how much of it you use.` },
];

const PAIRS = [
  {
    title: 'Fade + slide in on scroll',
    fmFile: 'Card.tsx',
    fm: `import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

function Card() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView
        ? { opacity: 1, y: 0 }
        : { opacity: 0, y: 32 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      Content
    </motion.div>
  );
}`,
    ours: `import { scrollReveal }
  from 'svg-scroll-draw/reveal';

// Works in React, Vue, Svelte,
// Solid, Astro, Nuxt, or vanilla
scrollReveal('.card', {
  from:   { opacity: 0, y: 32 },
  easing: 'ease-out',
  once:   true,
});`,
  },
  {
    title: 'Scrub animation tied to scroll position',
    fmFile: 'Section.tsx',
    fm: `import { useScroll, useTransform,
  motion } from 'framer-motion';

function Section() {
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const opacity = useTransform(
    scrollYProgress, [0, 1], [0, 1]
  );
  return (
    <motion.div style={{ opacity }}>
      Content
    </motion.div>
  );
}`,
    ours: `import { scrollAnimate }
  from 'svg-scroll-draw';

scrollAnimate('#section', {
  props: { opacity: [0, 1] },
  trigger: {
    start: 'top bottom',
    end:   'bottom top',
  },
});`,
  },
];

const WHEN_FM = [
  { title: 'Rich React component animations', desc: 'Hover states, enter/exit transitions, layout animations, drag — Framer Motion\'s component model shines for interactive UI beyond scroll.' },
  { title: 'AnimatePresence', desc: 'Exit animations when components unmount. Genuinely hard to do without Framer Motion\'s lifecycle integration.' },
  { title: 'Gesture animations', desc: 'Drag, pan, tap, hover — Framer Motion\'s gesture system is unmatched.' },
  { title: 'Spring physics', desc: 'Framer Motion\'s spring/inertia model is more physics-accurate for complex gesture responses.' },
];

const TOC: [string, string][] = [
  ['vs-size', 'Bundle size'],
  ['vs-api', `Side-by-side API · ${PAIRS.length + 1}`],
  ['vs-features', `Feature matrix · ${FEATURES.length}`],
  ['vs-when', 'When Framer Motion is right'],
  ['vs-more', 'More comparisons'],
];

export default function VsFramerMotionPage() {
  return (
    <SiteShell active="/vs-framer-motion" kicker="vs framer motion / your turn">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(pageJsonLd) }} />
      <div className="h2h">

        {/* ── Opening ──────────────────────────────────────────────────────── */}
        <header className="pg-head h2h-head">
          <div>
            <p className="pg-kicker">
              <span>comparison / svg-scroll-draw vs framer motion</span>
              <span>measured {MEASURED_ON}</span>
            </p>
            <h1 className="pg-title h2h-title is-name">
              <span className="nb">svg-scroll-draw</span> <span className="dim">vs Framer Motion.</span>
            </h1>
            <p className="pg-lede">
              Framer Motion is excellent for React component animations. For scroll-driven effects specifically,
              svg-scroll-draw does more — at roughly a third of the bytes — and works in any framework.
            </p>
            <div className="pg-actions">
              <Link href="/" className="btn btn-solid" data-magnetic>Get started free →</Link>
              <Link href="/vs-gsap" className="btn" data-magnetic>vs GSAP →</Link>
            </div>
            <dl className="pg-facts">
              <div><dt>svg-scroll-draw</dt><dd>{SELF.gzipKb} KB</dd></div>
              <div><dt>Framer Motion</dt><dd>{FM.gzipKb} KB</dd></div>
              <div><dt>Smaller by</dt><dd>{RATIO}×</dd></div>
              <div><dt>Licence</dt><dd>{SELF.license} · {FM.license}</dd></div>
            </dl>
          </div>
          <SpecSheet
            cols={[
              { name: 'svg-scroll-draw', sub: SELF.version, ours: true },
              { name: 'Framer Motion', sub: FM.version },
            ]}
            rows={[
              { k: 'Size, min + gzip', cells: [`${SELF.gzipKb} KB, every API`, `${FM.gzipKb} KB, cjs entry`], win: 0 },
              { k: 'Runs in', cells: ['React, Vue, Svelte, Solid, Angular, Astro, Nuxt, vanilla', 'React'], win: 0 },
              { k: 'Native CSS path', cells: ['animation-timeline: view(), when eligible', 'No'], win: 0 },
              { k: 'Pin, snap, text, video', cells: ['Built in', 'No'], win: 0 },
              { k: 'Gestures, exit, layout', cells: ['No', 'AnimatePresence, drag, layout'], win: 1 },
              { k: 'License', cells: [SELF.license, FM.license] },
            ]}
            caption="fig. 1 — at a glance · ✓ where one side is clearly ahead"
          />
        </header>

        <div className="h2h-body">
          <div className="h2h-main">

            {/* ── 01 Bundle ──────────────────────────────────── */}
            <section className="h2h-sec" aria-labelledby="vs-size">
              <Head n={1} k="weigh-in" id="vs-size">Bundle size.</Head>
              <p className="h2h-p">
                Framer Motion&apos;s entry beside ours, with the one piece the fade-in below actually imports. The dashed
                rule is svg-scroll-draw with every API loaded.
              </p>
              <WeighIn
                max={40}
                step={5}
                self={SELF.gzipKb}
                rows={[
                  { name: 'svg-scroll-draw/reveal', note: 'what the fade-in below imports', kb: SELF_ENTRIES.reveal, ours: true, badge: 'one entry' },
                  { name: 'svg-scroll-draw', note: `${SELF.version} · every API`, kb: SELF.gzipKb, ours: true, badge: 'yours' },
                  { name: 'Framer Motion', note: `framer-motion ${FM.version}`, kb: FM.gzipKb, badge: 'cjs entry' },
                ]}
                dim={{ from: SELF.gzipKb, to: FM.gzipKb, title: 'Difference', label: `Δ ${(FM.gzipKb - SELF.gzipKb).toFixed(1)} KB` }}
                caption={`fig. 2 — the weigh-in, to scale · ${RATIO}× the bytes at the CJS entry`}
              />
              <p className="h2h-src">
                {provenance([`framer-motion ${FM.version}`, `svg-scroll-draw ${SELF.version}`])}{' '}
                Framer Motion tree-shaking helps but scroll-specific APIs pull in most of the core.
              </p>
            </section>

            {/* ── 02 Side by side ────────────────────────────── */}
            <section className="h2h-sec" aria-labelledby="vs-api">
              <Head n={2} k={`${PAIRS.length + 1} tasks`} id="vs-api">Side-by-side API.</Head>
              {PAIRS.map((p, i) => (
                <CodeSet
                  key={p.title}
                  n={`2.${i + 1}`}
                  title={p.title}
                  items={[
                    { who: 'Framer Motion', file: p.fmFile, code: p.fm },
                    { who: 'svg-scroll-draw', file: 'app.js', code: p.ours, ours: true },
                  ]}
                />
              ))}
              <div className="cs">
                <div className="cs-head">
                  <span className="cs-n">2.{PAIRS.length + 1}</span>
                  <h3 className="cs-t">CSS variable binding</h3>
                  <span className="tag cs-tag">svg-scroll-draw only</span>
                </div>
                <div className="cs-grid cs-2">
                  <div className="cs-col is-ours">
                    <p className="cs-who"><span>svg-scroll-draw</span><span className="cs-lines">the call</span></p>
                    <CodeBox file="app.js">{`import { scrollProgress } from 'svg-scroll-draw/progress';

// Set --scroll-progress (0→1) and --scroll-progress-eased on the element
scrollProgress('#hero', { easing: 'ease-in-out' });`}</CodeBox>
                  </div>
                  <div className="cs-col is-ours">
                    <p className="cs-who"><span>styles.css</span><span className="cs-lines">the binding</span></p>
                    <CodeBox file="styles.css">{`#hero {
  /* Drive CSS animations directly from the scroll variable */
  opacity: calc(var(--scroll-progress-eased));
  transform: translateY(
    calc((1 - var(--scroll-progress-eased)) * 40px)
  );
  background-size:
    calc(100% + var(--scroll-progress) * 20%)
    auto;
}`}</CodeBox>
                  </div>
                </div>
              </div>
            </section>

            {/* ── 03 Feature matrix ──────────────────────────── */}
            <section className="h2h-sec" aria-labelledby="vs-features">
              <Head n={3} k={`${FEATURES.length} rows`} id="vs-features">Feature matrix.</Head>
              <Matrix cols={[{ name: 'svg-scroll-draw', ours: true }, { name: 'Framer Motion' }]} rows={FEATURES} />
              <Legend />
            </section>

            {/* ── 04 When Framer Motion wins ─────────────────── */}
            <section className="h2h-sec" aria-labelledby="vs-when">
              <Head n={4} k="their side" id="vs-when">When Framer Motion is the right call.</Head>
              <Calls items={WHEN_FM} />
            </section>

            {/* ── 05 More comparisons ────────────────────────── */}
            <section className="h2h-sec" aria-labelledby="vs-more">
              <Head n={5} k="the set" id="vs-more">More comparisons.</Head>
              <OtherSheets current="/vs-framer-motion" />
            </section>
          </div>
          <Toc items={TOC} />
        </div>

        {/* ── The last word ──────────────────────────────────────────────── */}
        <Closing
          n={6}
          title="Scroll animations, solved."
          actions={
            <>
              <Link href="/docs" className="btn btn-solid" data-magnetic>Read the docs →</Link>
              <Link href="/vs-gsap" className="btn" data-magnetic>vs GSAP →</Link>
            </>
          }
        >
          {SELF.gzipKb} KB. Framework-agnostic. MIT. Works everywhere Framer Motion doesn’t.
        </Closing>
      </div>
    </SiteShell>
  );
}
