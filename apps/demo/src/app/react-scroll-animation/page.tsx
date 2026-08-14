import type { Metadata } from 'next';
import Link from 'next/link';
import { MobileMenu } from '@/components/MobileMenu';
import { CopyButton } from '@/components/CopyButton';

export const metadata: Metadata = {
  title: 'React Scroll Animation Library — svg-scroll-draw',
  description:
    'The best scroll animation library for React. ScrollAnimate, ScrollText, ScrollCounter, ScrollPin components + hooks. Typed, tree-shakeable, ~10 KB. Works with Next.js App Router.',
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
    title: 'React Scroll Animation Library — svg-scroll-draw',
    description: 'Typed components + hooks for every scroll animation pattern. ~10 KB. Works with Next.js.',
    url: 'https://svg-scroll-draw.vercel.app/react-scroll-animation',
  },
};

function Nav() {
  return (
    <nav className="sticky top-0 z-50 bg-light-linen/95 backdrop-blur-sm border-b border-pitch-black flex items-center justify-between px-4 md:px-12 h-14">
      <Link href="/" className="font-display font-bold text-sm tracking-tight hover:opacity-70 transition-opacity shrink-0">svg-scroll-draw</Link>
      <div className="hidden lg:flex items-center gap-2">
        {['Home','Docs','Examples','Blog'].map(l => (
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
    <div className="rounded-2xl overflow-hidden border border-pitch-black my-4">
      <div className="bg-[#111] flex items-center justify-between px-4 py-2.5">
        <div className="flex gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#444]"/><span className="w-2.5 h-2.5 rounded-full bg-[#444]"/><span className="w-2.5 h-2.5 rounded-full bg-[#444]"/></div>
        <span className="text-[11px] text-[#888] font-mono">{file}</span>
        <CopyButton text={children} />
      </div>
      <pre className="bg-[#1c1c1c] text-[#e8e8e3] px-4 sm:px-6 py-4 text-[12px] sm:text-[13px] font-mono leading-[1.75] overflow-x-auto">{children}</pre>
    </div>
  );
}

const APIS = [
  { name: 'scrollReveal', sub: 'svg-scroll-draw/reveal', desc: 'Reveal elements on scroll. 7 presets, stagger, custom from state. Replaces AOS.', hook: false },
  { name: 'ScrollAnimate', sub: 'svg-scroll-draw/react', desc: 'Animate any CSS property driven by scroll. Component wrapper around scrollAnimate.', hook: false },
  { name: 'useScrollDraw', sub: 'svg-scroll-draw/react', desc: 'Hook to attach scroll-driven SVG path animation to a ref.', hook: true },
  { name: 'ScrollText', sub: 'svg-scroll-draw/react', desc: 'Split text + stagger reveal. words, chars, or lines. Replaces GSAP SplitText.', hook: false },
  { name: 'ScrollCounter', sub: 'svg-scroll-draw/react', desc: 'Animated number counter driven by scroll. Format function, decimals, easing.', hook: false },
  { name: 'scrollPin', sub: 'svg-scroll-draw/pin', desc: 'Pin an element at a viewport position while content scrolls past it. Full lifecycle callbacks.', hook: false },
  { name: 'scrollSnap', sub: 'svg-scroll-draw/snap', desc: 'Section snapping with custom easing. snapTo(), getCurrentIndex(), onSnap.', hook: false },
  { name: 'scrollProgress', sub: 'svg-scroll-draw/progress', desc: 'Expose scroll progress as --scroll-progress CSS custom property. Drive CSS with calc().', hook: false },
  { name: 'scrollHorizontal', sub: 'svg-scroll-draw/horizontal', desc: 'Apple-style horizontal scroll sections driven by vertical scroll.', hook: false },
];

export default function ReactScrollAnimationPage() {
  return (
    <div className="bg-light-linen text-pitch-black min-h-screen">
      <Nav />

      <header className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-14 sm:py-20">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-5">
            <span className="text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full bg-[#61dafb]/20 border border-[#61dafb]/40 text-pitch-black">React</span>
            <span className="text-[10px] font-mono text-graphite-border">Works with Next.js App Router, Remix, Vite</span>
          </div>
          <h1 className="font-display font-extrabold text-[clamp(32px,7vw,76px)] leading-[0.9] tracking-[-0.04em] mb-6">
            React scroll animations.<br /><span className="text-graphite-border">9 KB. Zero deps.</span>
          </h1>
          <p className="text-base sm:text-lg text-graphite-border leading-relaxed max-w-2xl mb-8">
            Typed React components and hooks for every scroll animation pattern — fade, slide, pin, snap, counter, text reveal, video scrub, horizontal sections.
            No GSAP. No Framer Motion. No config files.
          </p>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-pitch-black text-light-linen rounded-full px-5 py-2.5 text-sm font-mono">
              <span className="opacity-50">$</span><span>npm i svg-scroll-draw</span>
            </div>
            <Link href="/docs" className="px-5 py-2.5 rounded-full border border-pitch-black text-sm font-medium hover:bg-pitch-black hover:text-light-linen transition-colors">API Reference →</Link>
            <Link href="/vs-gsap" className="px-5 py-2.5 rounded-full border border-subtle-ash text-sm font-medium hover:border-pitch-black transition-colors text-graphite-border">vs GSAP →</Link>
          </div>
        </div>
      </header>

      {/* Quick start */}
      <section className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-14">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl tracking-[-0.03em] mb-10">Quick start.</h2>

          <h3 className="font-display font-extrabold text-xl tracking-[-0.02em] mb-3">1. Reveal on scroll (the common case)</h3>
          <CodeBlock file="FeaturesSection.tsx">{`'use client';
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
}`}</CodeBlock>

          <h3 className="font-display font-extrabold text-xl tracking-[-0.02em] mb-3 mt-8">2. Animate any CSS property</h3>
          <CodeBlock file="HeroSection.tsx">{`'use client';
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
}`}</CodeBlock>

          <h3 className="font-display font-extrabold text-xl tracking-[-0.02em] mb-3 mt-8">3. Sticky pin section</h3>
          <CodeBlock file="ProductSection.tsx">{`'use client';
import { useEffect, useRef } from 'react';
import { scrollPin } from 'svg-scroll-draw/pin';

export function ProductSection() {
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!imageRef.current) return;
    const inst = scrollPin(imageRef.current, {
      top:         80,                     // below fixed header
      pinDistance: window.innerHeight * 3,
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
}`}</CodeBlock>

          <h3 className="font-display font-extrabold text-xl tracking-[-0.02em] mb-3 mt-8">4. Animated counter</h3>
          <CodeBlock file="StatsSection.tsx">{`import { ScrollCounter } from 'svg-scroll-draw/react';

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
}`}</CodeBlock>

          <h3 className="font-display font-extrabold text-xl tracking-[-0.02em] mb-3 mt-8">5. Text reveal (replaces GSAP SplitText)</h3>
          <CodeBlock file="Headline.tsx">{`import { ScrollText } from 'svg-scroll-draw/react';

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
}`}</CodeBlock>
        </div>
      </section>

      {/* API overview */}
      <section className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-14">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl tracking-[-0.03em] mb-10">Every React API.</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {APIS.map(({ name, sub, desc, hook }) => (
              <div key={name} className="p-4 rounded-xl border border-subtle-ash bg-white space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <code className="font-mono font-bold text-[13px]">{name}</code>
                  {hook && <span className="text-[9px] font-mono bg-marketplace-gray border border-subtle-ash px-1.5 py-0.5 rounded text-graphite-border shrink-0">hook</span>}
                </div>
                <code className="text-[10px] font-mono text-graphite-border block">{sub}</code>
                <p className="text-[12px] text-graphite-border leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Next.js note */}
      <section className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-14">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl tracking-[-0.03em] mb-6">Next.js App Router.</h2>
          <p className="text-graphite-border leading-relaxed mb-6">
            svg-scroll-draw is fully SSR-safe. All engines guard against <code className="font-mono text-sm bg-marketplace-gray px-1 rounded">window</code> being undefined.
            In Next.js App Router, add <code className="font-mono text-sm bg-marketplace-gray px-1 rounded">&apos;use client&apos;</code> to any component that calls scroll APIs — or use{' '}
            <code className="font-mono text-sm bg-marketplace-gray px-1 rounded">dynamic(() =&gt; import(...), {'{'} ssr: false {'}'} )</code> to lazy-load entire animated sections.
          </p>
          <CodeBlock file="app/page.tsx">{`import dynamic from 'next/dynamic';

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
}`}</CodeBlock>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-pitch-black text-light-linen px-4 sm:px-6 md:px-12 py-16 sm:py-20 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display font-extrabold text-[clamp(28px,6vw,56px)] leading-[0.92] tracking-[-0.04em] mb-4">
            Drop-in for React + Next.js.
          </h2>
          <p className="text-graphite-border text-sm sm:text-base mb-8">MIT. Zero deps. TypeScript. 531 tests. Works everywhere React works.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <div className="flex items-center gap-2 bg-white/10 rounded-full px-5 py-3 text-sm font-mono"><span className="opacity-50">$</span><span>npm i svg-scroll-draw</span></div>
            <Link href="/docs" className="px-5 py-3 rounded-full border-2 border-white text-sm font-semibold hover:bg-white hover:text-pitch-black transition-colors text-center">Full API docs →</Link>
            <Link href="/examples" className="px-5 py-3 rounded-full border-2 border-white/30 text-sm font-medium hover:border-white transition-colors text-center text-graphite-border hover:text-white">Live examples →</Link>
          </div>
        </div>
      </section>

      <footer className="px-6 md:px-12 py-6 border-t border-subtle-ash text-center text-[11px] font-mono text-graphite-border">
        svg-scroll-draw · MIT · ~10 KB ·{' '}<a href="https://github.com/DhruvilChauahan0210/ink-scroll" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-pitch-black transition-colors">GitHub</a>
      </footer>
    </div>
  );
}
