import type { Metadata } from 'next';
import Link from 'next/link';
import { MobileMenu } from '@/components/MobileMenu';
import { CopyButton } from '@/components/CopyButton';

export const metadata: Metadata = {
  title: 'svg-scroll-draw vs Framer Motion — Scroll Animation Comparison',
  description:
    'svg-scroll-draw vs Framer Motion for scroll animations. 4× smaller bundle, works outside React, native CSS fast path, MIT license. Comparison table, bundle sizes, and side-by-side code.',
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
    description: '4× smaller. Framework-agnostic. Native CSS fast path.',
    url: 'https://svg-scroll-draw.vercel.app/vs-framer-motion',
  },
  twitter: { card: 'summary_large_image', title: 'svg-scroll-draw vs Framer Motion', description: '4× smaller. Works outside React. Native CSS fast path.' },
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
        text: 'svg-scroll-draw is a 4× smaller alternative to Framer Motion for scroll-driven animations. It is framework-agnostic (works in React, Vue, Svelte, vanilla JS), MIT licensed, and uses native CSS animation-timeline when possible for zero per-frame JavaScript.',
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
        text: 'svg-scroll-draw is ~9 KB gzipped. Framer Motion is ~35 KB gzipped — approximately 4× larger. For projects that only need scroll-driven animations, svg-scroll-draw eliminates the bundle overhead entirely.',
      },
    },
  ],
};

function Nav() {
  return (
    <nav className="sticky top-0 z-50 bg-light-linen/95 backdrop-blur-sm border-b border-pitch-black flex items-center justify-between px-4 md:px-12 h-14">
      <Link href="/" className="font-display font-bold text-sm tracking-tight hover:opacity-70 transition-opacity shrink-0">svg-scroll-draw</Link>
      <div className="hidden lg:flex items-center gap-2">
        {['Home','Docs','Examples','Blog','Changelog'].map(l => (
          <Link key={l} href={l==='Home'?'/':`/${l.toLowerCase()}`} className="text-xs px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-medium">{l}</Link>
        ))}
        <Link href="/playground" className="text-xs px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-medium">⚡ Playground</Link>
      </div>
      <div className="flex lg:hidden"><MobileMenu /></div>
    </nav>
  );
}

function CodeBlock({ file, children }: { file: string; children: string }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-pitch-black">
      <div className="bg-[#111] flex items-center justify-between px-4 py-2.5">
        <div className="flex gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#444]"/><span className="w-2.5 h-2.5 rounded-full bg-[#444]"/><span className="w-2.5 h-2.5 rounded-full bg-[#444]"/></div>
        <span className="text-[11px] text-[#888] font-mono">{file}</span>
        <CopyButton text={children} />
      </div>
      <pre className="bg-[#1c1c1c] text-[#e8e8e3] px-4 sm:px-6 py-4 text-[11px] sm:text-[13px] font-mono leading-[1.75] overflow-x-auto">{children}</pre>
    </div>
  );
}

function Check() { return <span className="text-[#22c55e] font-bold text-base">✓</span>; }
function Cross() { return <span className="text-[#ef4444] font-bold text-base">✗</span>; }
function Partial() { return <span className="text-[#f59e0b] font-bold text-base">~</span>; }

const FEATURES = [
  { f: 'Scroll-driven animations',       us: true,  fm: true,   note: '' },
  { f: 'Animate any CSS property',       us: true,  fm: true,   note: '' },
  { f: 'SVG path draw animation',        us: true,  fm: false,  note: 'Framer Motion has no stroke-dashoffset animation' },
  { f: 'Pin / sticky sections',          us: true,  fm: false,  note: '' },
  { f: 'Section snapping',               us: true,  fm: false,  note: '' },
  { f: 'Text split + stagger',           us: true,  fm: false,  note: 'Framer Motion needs SplitText manually' },
  { f: 'Animated counters',              us: true,  fm: 'partial', note: 'Framer Motion useTransform can do this but requires boilerplate' },
  { f: 'Video scrub',                    us: true,  fm: false,  note: '' },
  { f: 'scrollReveal (one-line preset)', us: true,  fm: false,  note: '' },
  { f: 'scrollProgress (CSS variable)',  us: true,  fm: false,  note: '' },
  { f: 'Horizontal scroll sections',     us: true,  fm: 'partial', note: '' },
  { f: 'Native CSS fast path',           us: true,  fm: false,  note: 'svg-scroll-draw uses animation-timeline: view() when eligible' },
  { f: 'Works outside React',            us: true,  fm: false,  note: 'Framer Motion is React-only' },
  { f: 'Vue / Svelte / Solid wrappers',  us: true,  fm: false,  note: '' },
  { f: 'Velocity-scaled animation',      us: true,  fm: false,  note: '' },
  { f: 'Lenis smooth scroll adapter',    us: true,  fm: 'partial', note: '' },
  { f: 'MIT license',                    us: true,  fm: true,   note: '' },
  { f: 'Bundle size (gzipped)',          us: '~9 KB', fm: '~35 KB', note: '' },
];

export default function VsFramerMotionPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageJsonLd) }} />
    <div className="bg-light-linen text-pitch-black min-h-screen">
      <Nav />

      <header className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-14 sm:py-20">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] uppercase tracking-[0.22em] text-graphite-border mb-4 font-mono font-medium">Comparison</p>
          <h1 className="font-display font-extrabold text-[clamp(32px,7vw,76px)] leading-[0.9] tracking-[-0.04em] mb-6">
            svg-scroll-draw<br /><span className="text-graphite-border">vs Framer Motion.</span>
          </h1>
          <p className="text-base sm:text-lg text-graphite-border leading-relaxed max-w-2xl mb-8">
            Framer Motion is excellent for React component animations. For scroll-driven effects specifically,
            svg-scroll-draw does more — at 4× smaller — and works in any framework.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/" className="px-5 py-2.5 rounded-full bg-pitch-black text-light-linen text-sm font-semibold hover:opacity-90 transition-opacity">Get started free →</Link>
            <Link href="/vs-gsap" className="px-5 py-2.5 rounded-full border border-pitch-black text-sm font-medium hover:bg-pitch-black hover:text-light-linen transition-colors">vs GSAP →</Link>
          </div>
        </div>
      </header>

      {/* Bundle */}
      <section className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-14">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] uppercase tracking-[0.22em] text-graphite-border mb-2 font-mono font-medium">01</p>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl tracking-[-0.03em] mb-8">Bundle size.</h2>
          <div className="space-y-4 mb-6">
            {[
              { label: 'svg-scroll-draw', size: '~9 KB',  pct: 26, color: '#ff90e8', badge: 'yours' },
              { label: 'Framer Motion',   size: '~35 KB', pct: 100, color: '#e0e0e0', badge: null },
            ].map(({ label, size, pct, color, badge }) => (
              <div key={label} className="flex items-center gap-4">
                <div className="w-40 shrink-0 text-right"><span className="text-[12px] font-mono text-graphite-border">{label}</span></div>
                <div className="flex-1 flex items-center gap-3">
                  <div className="h-8 rounded-lg flex items-center px-3" style={{ width: `${pct}%`, background: color, minWidth: 60 }}>
                    <span className="text-[11px] font-mono font-bold text-pitch-black whitespace-nowrap">{size}</span>
                  </div>
                  {badge && <span className="text-[10px] font-mono text-graphite-border border border-subtle-ash px-2 py-0.5 rounded-full">{badge}</span>}
                </div>
              </div>
            ))}
          </div>
          <p className="text-[12px] text-graphite-border font-mono">Minified + gzipped. Framer Motion tree-shaking helps but scroll-specific APIs pull in most of the core.</p>
        </div>
      </section>

      {/* Side by side */}
      <section className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-14">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] uppercase tracking-[0.22em] text-graphite-border mb-2 font-mono font-medium">02</p>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl tracking-[-0.03em] mb-10">Side-by-side API.</h2>
          <div className="space-y-10">

            <div>
              <h3 className="font-display font-extrabold text-xl tracking-[-0.02em] mb-4">Fade + slide in on scroll</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] font-mono text-graphite-border mb-2 uppercase tracking-[0.1em]">Framer Motion</p>
                  <CodeBlock file="Card.tsx">{`import { motion, useInView } from 'framer-motion';
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
}`}</CodeBlock>
                </div>
                <div>
                  <p className="text-[11px] font-mono text-graphite-border mb-2 uppercase tracking-[0.1em]">svg-scroll-draw</p>
                  <CodeBlock file="app.js">{`import { scrollReveal }
  from 'svg-scroll-draw/reveal';

// Works in React, Vue, Svelte,
// Solid, Astro, Nuxt, or vanilla
scrollReveal('.card', {
  from:   { opacity: 0, y: 32 },
  easing: 'ease-out',
  once:   true,
});`}</CodeBlock>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-display font-extrabold text-xl tracking-[-0.02em] mb-4">Scrub animation tied to scroll position</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] font-mono text-graphite-border mb-2 uppercase tracking-[0.1em]">Framer Motion</p>
                  <CodeBlock file="Section.tsx">{`import { useScroll, useTransform,
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
}`}</CodeBlock>
                </div>
                <div>
                  <p className="text-[11px] font-mono text-graphite-border mb-2 uppercase tracking-[0.1em]">svg-scroll-draw</p>
                  <CodeBlock file="app.js">{`import { scrollAnimate }
  from 'svg-scroll-draw';

scrollAnimate('#section', {
  props: { opacity: [0, 1] },
  trigger: {
    start: 'top bottom',
    end:   'bottom top',
  },
});`}</CodeBlock>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-display font-extrabold text-xl tracking-[-0.02em] mb-4">CSS variable binding <span className="text-[13px] font-normal font-mono text-[#22c55e] ml-2 border border-[#22c55e]/30 bg-[#22c55e]/10 px-2 py-0.5 rounded-full">svg-scroll-draw only</span></h3>
              <CodeBlock file="app.js">{`import { scrollProgress } from 'svg-scroll-draw/progress';

// Set --scroll-progress (0→1) and --scroll-progress-eased on the element
scrollProgress('#hero', { easing: 'ease-in-out' });`}</CodeBlock>
              <CodeBlock file="styles.css">{`#hero {
  /* Drive CSS animations directly from the scroll variable */
  opacity: calc(var(--scroll-progress-eased));
  transform: translateY(
    calc((1 - var(--scroll-progress-eased)) * 40px)
  );
  background-size:
    calc(100% + var(--scroll-progress) * 20%)
    auto;
}`}</CodeBlock>
            </div>

          </div>
        </div>
      </section>

      {/* Feature matrix */}
      <section className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-14">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] uppercase tracking-[0.22em] text-graphite-border mb-2 font-mono font-medium">03</p>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl tracking-[-0.03em] mb-10">Feature matrix.</h2>
          <div className="rounded-2xl border border-pitch-black overflow-hidden">
            <div className="grid grid-cols-[1fr_auto_auto] bg-[#111] text-light-linen">
              {['Feature','svg-scroll-draw','Framer Motion'].map(h => (
                <div key={h} className="px-5 py-3 text-[11px] font-mono font-semibold uppercase tracking-[0.1em] text-center first:text-left">{h}</div>
              ))}
            </div>
            {FEATURES.map(({ f, us, fm, note }, i) => (
              <div key={f} className={`grid grid-cols-[1fr_auto_auto] items-center border-t border-subtle-ash ${i%2===0?'bg-white':'bg-light-linen'}`}>
                <div className="px-5 py-3.5">
                  <span className="text-[13px] font-medium">{f}</span>
                  {note && <p className="text-[11px] text-graphite-border font-mono mt-0.5">{note}</p>}
                </div>
                <div className="px-5 py-3.5 text-center">
                  {us === true ? <Check/> : us === false ? <Cross/> : typeof us === 'string' ? <span className="text-[11px] font-mono font-bold">{us}</span> : null}
                </div>
                <div className="px-5 py-3.5 text-center">
                  {fm === true ? <Check/> : fm === false ? <Cross/> : fm === 'partial' ? <Partial/> : typeof fm === 'string' ? <span className="text-[11px] font-mono font-bold">{fm}</span> : null}
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-graphite-border font-mono mt-3">✓ supported · ✗ not supported · ~ partial</p>
        </div>
      </section>

      {/* When Framer Motion wins */}
      <section className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-14">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] uppercase tracking-[0.22em] text-graphite-border mb-2 font-mono font-medium">04</p>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl tracking-[-0.03em] mb-6">When Framer Motion is the right call.</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { title: 'Rich React component animations', desc: 'Hover states, enter/exit transitions, layout animations, drag — Framer Motion\'s component model shines for interactive UI beyond scroll.' },
              { title: 'AnimatePresence', desc: 'Exit animations when components unmount. Genuinely hard to do without Framer Motion\'s lifecycle integration.' },
              { title: 'Gesture animations', desc: 'Drag, pan, tap, hover — Framer Motion\'s gesture system is unmatched.' },
              { title: 'Spring physics', desc: 'Framer Motion\'s spring/inertia model is more physics-accurate for complex gesture responses.' },
            ].map(({ title, desc }) => (
              <div key={title} className="p-5 rounded-xl border border-subtle-ash bg-marketplace-gray/30">
                <p className="font-semibold text-sm mb-1">{title}</p>
                <p className="text-[13px] text-graphite-border">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-pitch-black text-light-linen px-4 sm:px-6 md:px-12 py-16 sm:py-20 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display font-extrabold text-[clamp(28px,6vw,56px)] leading-[0.92] tracking-[-0.04em] mb-4">Scroll animations, solved.</h2>
          <p className="text-graphite-border text-sm sm:text-base mb-8">~9 KB. Framework-agnostic. MIT. Works everywhere Framer Motion doesn&apos;t.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <div className="flex items-center gap-2 bg-white/10 rounded-full px-5 py-3 text-sm font-mono"><span className="opacity-50">$</span><span>npm i svg-scroll-draw</span></div>
            <Link href="/" className="px-5 py-3 rounded-full border-2 border-white text-sm font-semibold hover:bg-white hover:text-pitch-black transition-colors text-center">Read the docs →</Link>
            <Link href="/vs-gsap" className="px-5 py-3 rounded-full border-2 border-white/30 text-sm font-medium hover:border-white transition-colors text-center text-graphite-border hover:text-white">vs GSAP →</Link>
          </div>
        </div>
      </section>

      <footer className="px-6 md:px-12 py-6 border-t border-subtle-ash text-center text-[11px] font-mono text-graphite-border">
        svg-scroll-draw · MIT · ~9 KB ·{' '}<a href="https://github.com/DhruvilChauahan0210/ink-scroll" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-pitch-black transition-colors">GitHub</a>
      </footer>
    </div>
    </>
  );
}
