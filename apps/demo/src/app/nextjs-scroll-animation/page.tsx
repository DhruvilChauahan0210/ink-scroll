import type { Metadata } from 'next';
import Link from 'next/link';
import { MobileMenu } from '@/components/MobileMenu';
import { CopyButton } from '@/components/CopyButton';

export const metadata: Metadata = {
  title: 'Next.js Scroll Animations — svg-scroll-draw',
  description:
    'Scroll animations for Next.js App Router. SSR-safe, TypeScript, use client pattern, dynamic imports, ~10 KB. Replaces GSAP + Framer Motion for scroll-driven effects.',
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
    title: 'Next.js Scroll Animations — svg-scroll-draw',
    description: 'SSR-safe, App Router ready, ~10 KB. The scroll animation library built for Next.js.',
    url: 'https://svg-scroll-draw.vercel.app/nextjs-scroll-animation',
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

function Callout({ emoji, title, children }: { emoji: string; title: string; children: React.ReactNode }) {
  return (
    <div className="border border-subtle-ash rounded-xl p-5 my-5 bg-white">
      <p className="font-semibold text-sm mb-2">{emoji} {title}</p>
      <div className="text-[13px] text-graphite-border leading-relaxed">{children}</div>
    </div>
  );
}

export default function NextjsScrollAnimationPage() {
  return (
    <div className="bg-light-linen text-pitch-black min-h-screen">
      <Nav />

      <header className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-14 sm:py-20">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-5">
            <span className="text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full bg-pitch-black text-light-linen">Next.js</span>
            <span className="text-[10px] font-mono text-graphite-border">App Router · Pages Router · SSR-safe</span>
          </div>
          <h1 className="font-display font-extrabold text-[clamp(32px,7vw,76px)] leading-[0.9] tracking-[-0.04em] mb-6">
            Scroll animations<br />for Next.js.
          </h1>
          <p className="text-base sm:text-lg text-graphite-border leading-relaxed max-w-2xl mb-8">
            svg-scroll-draw is built SSR-first. All scroll APIs guard against{' '}
            <code className="font-mono text-[0.9em] bg-marketplace-gray px-1.5 py-0.5 rounded">window</code> being undefined.
            Works in App Router Server Components, Client Components, and Pages Router — no hydration errors, no{' '}
            <code className="font-mono text-[0.9em] bg-marketplace-gray px-1.5 py-0.5 rounded">document is not defined</code>.
          </p>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-pitch-black text-light-linen rounded-full px-5 py-2.5 text-sm font-mono">
              <span className="opacity-50">$</span><span>npm i svg-scroll-draw</span>
            </div>
            <Link href="/react-scroll-animation" className="px-5 py-2.5 rounded-full border border-pitch-black text-sm font-medium hover:bg-pitch-black hover:text-light-linen transition-colors">React guide →</Link>
          </div>
        </div>
      </header>

      <section className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-14">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl tracking-[-0.03em] mb-10">The patterns.</h2>

          <h3 className="font-display font-extrabold text-xl tracking-[-0.02em] mb-2">Pattern 1 — Client Component (recommended)</h3>
          <p className="text-graphite-border text-sm mb-3">Add <code className="font-mono bg-marketplace-gray px-1 rounded">&apos;use client&apos;</code> to any component that uses scroll APIs. Everything else can be a Server Component.</p>
          <CodeBlock file="components/AnimatedCards.tsx">{`'use client';
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
}`}</CodeBlock>

          <h3 className="font-display font-extrabold text-xl tracking-[-0.02em] mb-2 mt-8">Pattern 2 — Dynamic import (heavy animated sections)</h3>
          <p className="text-graphite-border text-sm mb-3">For large animated sections, lazy-load them so they don&apos;t block the initial page render.</p>
          <CodeBlock file="app/page.tsx">{`import dynamic from 'next/dynamic';

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
}`}</CodeBlock>

          <h3 className="font-display font-extrabold text-xl tracking-[-0.02em] mb-2 mt-8">Pattern 3 — useEffect cleanup (avoid memory leaks)</h3>
          <CodeBlock file="components/PinnedSection.tsx">{`'use client';
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
}`}</CodeBlock>

          <h3 className="font-display font-extrabold text-xl tracking-[-0.02em] mb-2 mt-8">Pattern 4 — Route change cleanup</h3>
          <CodeBlock file="components/AnimatedPage.tsx">{`'use client';
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
}`}</CodeBlock>

          <Callout emoji="✅" title="SSR safety">
            Every svg-scroll-draw engine starts with <code className="font-mono text-[0.85em]">if (typeof window === &apos;undefined&apos;) return NOOP;</code>.
            All server-side renders return a no-op instance — no hydration mismatch, no crashes.
          </Callout>

          <Callout emoji="⚡" title="Native CSS fast path">
            When the browser supports <code className="font-mono text-[0.85em]">animation-timeline: view()</code>,
            svg-scroll-draw automatically uses it — zero JS scroll listeners, zero rAF calls,
            pure compositor animation. Falls back to JS engine seamlessly.
          </Callout>
        </div>
      </section>

      {/* Comparison */}
      <section className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-14">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl tracking-[-0.03em] mb-10">vs common alternatives.</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { name: 'GSAP + ScrollTrigger', size: '~50 KB', ssr: '✗ needs guards', typed: '~', note: 'Free, mature, but 5× the bytes.' },
              { name: 'Framer Motion', size: '34.3 KB', ssr: '✓', typed: '✓', note: 'React-only. Draws SVG via pathLength; no pin/snap.' },
              { name: 'svg-scroll-draw', size: '~10 KB', ssr: '✓', typed: '✓', note: 'MIT. Everything. Works everywhere.', highlight: true },
            ].map(({ name, size, ssr, typed, note, highlight }) => (
              <div key={name} className={`p-5 rounded-xl border ${highlight ? 'border-2 border-creator-pink bg-creator-pink/5' : 'border-subtle-ash bg-white'}`}>
                <p className="font-display font-extrabold text-base mb-3">{name}</p>
                <div className="space-y-1.5 text-[12px] font-mono">
                  <div className="flex justify-between"><span className="text-graphite-border">Bundle</span><strong>{size}</strong></div>
                  <div className="flex justify-between"><span className="text-graphite-border">SSR-safe</span><strong>{ssr}</strong></div>
                  <div className="flex justify-between"><span className="text-graphite-border">TypeScript</span><strong>{typed}</strong></div>
                </div>
                <p className="text-[11px] text-graphite-border mt-3 leading-relaxed">{note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-pitch-black text-light-linen px-4 sm:px-6 md:px-12 py-16 sm:py-20 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display font-extrabold text-[clamp(28px,6vw,56px)] leading-[0.92] tracking-[-0.04em] mb-4">Built for Next.js.</h2>
          <p className="text-graphite-border text-sm sm:text-base mb-8">SSR-safe by default. App Router ready. MIT. ~10 KB.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <div className="flex items-center gap-2 bg-white/10 rounded-full px-5 py-3 text-sm font-mono"><span className="opacity-50">$</span><span>npm i svg-scroll-draw</span></div>
            <Link href="/docs" className="px-5 py-3 rounded-full border-2 border-white text-sm font-semibold hover:bg-white hover:text-pitch-black transition-colors text-center">Full docs →</Link>
          </div>
        </div>
      </section>

      <footer className="px-6 md:px-12 py-6 border-t border-subtle-ash text-center text-[11px] font-mono text-graphite-border">
        svg-scroll-draw · MIT · ~10 KB ·{' '}<a href="https://github.com/DhruvilChauahan0210/ink-scroll" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-pitch-black transition-colors">GitHub</a>
      </footer>
    </div>
  );
}
