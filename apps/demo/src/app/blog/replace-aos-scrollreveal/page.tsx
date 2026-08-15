import type { Metadata } from 'next';
import { RelatedResources } from '@/components/RelatedResources';
import Link from 'next/link';
import { MobileMenu } from '@/components/MobileMenu';
import { CopyButton } from '@/components/CopyButton';

export const metadata: Metadata = {
  title: 'Replace AOS / ScrollReveal.js — svg-scroll-draw scrollReveal',
  description:
    'Drop-in replacement for AOS and ScrollReveal.js. One function call, 7 named presets, stagger, custom easing — no data attributes, no config files. Part of svg-scroll-draw, ~10 KB total.',
  keywords: [
    'AOS alternative',
    'ScrollReveal.js alternative',
    'replace AOS',
    'animate on scroll javascript',
    'scroll reveal animation',
    'fade in on scroll',
    'scroll animation library',
    'aos js alternative',
    'scrollreveal js replacement',
    'reveal on scroll javascript',
    'scroll driven animation',
    'intersection observer animation',
  ],
  alternates: { canonical: 'https://svg-scroll-draw.vercel.app/blog/replace-aos-scrollreveal' },
  openGraph: {
    title: 'Replace AOS / ScrollReveal.js with one function call',
    description: 'scrollReveal — 7 presets, stagger, custom easing, no data attributes. Part of svg-scroll-draw (~10 KB).',
    url: 'https://svg-scroll-draw.vercel.app/blog/replace-aos-scrollreveal',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Replace AOS / ScrollReveal.js with one function call',
    description: 'One import. One call. 7 presets. Zero config files.',
  },
};

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline: 'Replace AOS / ScrollReveal.js — svg-scroll-draw scrollReveal',
  description: 'Drop-in replacement for AOS and ScrollReveal.js. One function call, 7 named presets, stagger, custom easing — no data attributes.',
  url: 'https://svg-scroll-draw.vercel.app/blog/replace-aos-scrollreveal',
  datePublished: '2026-06-06',
  dateModified: '2026-06-06',
  author: { '@type': 'Person', name: 'Dhruvil Chauhan', url: 'https://github.com/DhruvilChauahan0210' },
  publisher: { '@type': 'Organization', name: 'svg-scroll-draw', url: 'https://svg-scroll-draw.vercel.app' },
  image: 'https://svg-scroll-draw.vercel.app/opengraph-image',
  mainEntityOfPage: { '@type': 'WebPage', '@id': 'https://svg-scroll-draw.vercel.app/blog/replace-aos-scrollreveal' },
};

function CodeBlock({ file, children }: { file: string; children: string }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-pitch-black my-5">
      <div className="bg-[#111] flex items-center justify-between px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#444]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#444]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#444]" />
        </div>
        <span className="text-[11px] text-[#888] font-mono">{file}</span>
        <CopyButton text={children} />
      </div>
      <pre className="bg-[#1c1c1c] text-[#e8e8e3] px-4 sm:px-6 py-4 text-[12px] sm:text-[13px] font-mono leading-[1.75] overflow-x-auto">
        {children}
      </pre>
    </div>
  );
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-l-4 border-creator-pink bg-creator-pink/5 px-5 py-4 rounded-r-xl my-5 text-sm leading-relaxed">
      {children}
    </div>
  );
}

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
    <div className="bg-light-linen text-pitch-black min-h-screen">

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-light-linen/95 backdrop-blur-sm border-b border-pitch-black flex items-center justify-between px-4 md:px-12 h-14">
        <Link href="/" className="font-display font-bold text-sm tracking-tight hover:opacity-70 transition-opacity shrink-0">
          svg-scroll-draw
        </Link>
        <div className="hidden lg:flex items-center gap-2">
          {['Home', 'Docs', 'Examples', 'Changelog', 'Blog'].map((label) => (
            <Link key={label} href={label === 'Home' ? '/' : `/${label.toLowerCase()}`}
              className="text-xs px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-medium">
              {label}
            </Link>
          ))}
          <Link href="/playground" className="text-xs px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-medium">
            ⚡ Playground
          </Link>
        </div>
        <div className="flex lg:hidden"><MobileMenu /></div>
      </nav>

      {/* Hero */}
      <header className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-12 sm:py-16">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-5">
            <span className="inline-block text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full bg-sunshine-yellow/30 text-pitch-black border border-sunshine-yellow/60">
              Migration Guide
            </span>
            <span className="text-[11px] font-mono text-graphite-border">June 2026 · 6 min read</span>
          </div>
          <h1 className="font-display font-extrabold text-[clamp(28px,6vw,60px)] leading-[0.92] tracking-[-0.04em] mb-5">
            Replace AOS and ScrollReveal.js<br />with one function call.
          </h1>
          <p className="text-base sm:text-lg text-graphite-border leading-relaxed max-w-2xl">
            AOS and ScrollReveal.js work — but they require data attributes on every element,
            separate config files, and add another library to your bundle.{' '}
            <code className="font-mono text-[0.9em] bg-marketplace-gray px-1.5 py-0.5 rounded">scrollReveal</code>{' '}
            from svg-scroll-draw does the same job in a single JS call with zero markup changes.
          </p>
        </div>
      </header>

      {/* Article */}
      <article className="px-4 sm:px-6 md:px-12 py-12 sm:py-16">
        <div className="max-w-3xl mx-auto">

          <h2 className="font-display font-extrabold text-2xl sm:text-3xl tracking-[-0.02em] mb-4 mt-10">
            The problem with AOS and ScrollReveal.js
          </h2>
          <p className="text-graphite-border leading-relaxed mb-4">
            Both libraries work well for simple cases. But they have the same fundamental design: scroll animation is configured via <strong>HTML data attributes</strong> — <code className="font-mono text-sm bg-marketplace-gray px-1 rounded">data-aos="fade-up"</code> or{' '}
            <code className="font-mono text-sm bg-marketplace-gray px-1 rounded">data-sr-id</code>. This means:
          </p>
          <ul className="list-disc list-inside space-y-2 text-graphite-border mb-6 text-sm">
            <li>Animations are scattered across your HTML — hard to trace, hard to change globally</li>
            <li>No type safety — a typo in a data attribute silently does nothing</li>
            <li>Data attributes mix concerns — presentation logic in HTML, not JavaScript</li>
            <li>Both add ~10–20 KB on top of your bundle, just for fade-in effects</li>
            <li>ScrollReveal.js is not actively maintained (last release: 2021)</li>
          </ul>
          <p className="text-graphite-border leading-relaxed mb-4">
            <code className="font-mono text-sm bg-marketplace-gray px-1 rounded">scrollReveal</code> from svg-scroll-draw is the JS-first alternative: all configuration lives in your JavaScript, it&apos;s fully typed, and it&apos;s part of a broader scroll animation platform — not a standalone one-trick library.
          </p>

          <h2 className="font-display font-extrabold text-2xl sm:text-3xl tracking-[-0.02em] mb-4 mt-12">
            Zero-config: the default (fade up)
          </h2>
          <p className="text-graphite-border leading-relaxed mb-2">
            The most common scroll animation — fade up — requires zero configuration:
          </p>
          <CodeBlock file="app.js">{`import { scrollReveal } from 'svg-scroll-draw/reveal';

// Fade up every .card on scroll — that's it
scrollReveal('.card');`}</CodeBlock>

          <p className="text-graphite-border leading-relaxed mb-2">Compare that with AOS:</p>
          <CodeBlock file="index.html">{`<!-- AOS: every element needs a data attribute -->
<div class="card" data-aos="fade-up">…</div>
<div class="card" data-aos="fade-up" data-aos-delay="100">…</div>
<div class="card" data-aos="fade-up" data-aos-delay="200">…</div>

<!-- Plus AOS init in your JS -->
AOS.init({ duration: 800, once: true });`}</CodeBlock>

          <h2 className="font-display font-extrabold text-2xl sm:text-3xl tracking-[-0.02em] mb-4 mt-12">
            7 named presets
          </h2>
          <CodeBlock file="app.js">{`import { scrollReveal } from 'svg-scroll-draw/reveal';

scrollReveal('.card',    { preset: 'fadeUp'    }); // ↑ default
scrollReveal('.badge',   { preset: 'fadeDown'  }); // ↓
scrollReveal('.sidebar', { preset: 'fadeLeft'  }); // ←
scrollReveal('.tooltip', { preset: 'fadeRight' }); // →
scrollReveal('.hero',    { preset: 'scale'     }); // scale up from 88%
scrollReveal('.panel',   { preset: 'flip'      }); // rotateX 20→0 (3D flip)
scrollReveal('.tile',    { preset: 'flipX'     }); // rotateY 20→0`}</CodeBlock>

          <h2 className="font-display font-extrabold text-2xl sm:text-3xl tracking-[-0.02em] mb-4 mt-12">
            Custom from state
          </h2>
          <p className="text-graphite-border leading-relaxed mb-2">
            Full control — combine any properties with numeric values:
          </p>
          <CodeBlock file="app.js">{`scrollReveal('.feature', {
  from: {
    opacity: 0,
    y:       40,     // translateY(40px) → 0
    scale:   0.95,   // scale(0.95) → 1
  },
  easing:  'ease-out',
  stagger: 0.08,
  once:    true,
});

// 3D card flip
scrollReveal('.card', {
  from: { opacity: 0, rotateX: 15, scale: 0.97 },
});

// Slide in from left with full opacity (no fade)
scrollReveal('.list-item', {
  from: { x: -48 },  // translateX(-48px) → 0, no opacity change
});`}</CodeBlock>

          <h2 className="font-display font-extrabold text-2xl sm:text-3xl tracking-[-0.02em] mb-4 mt-12">
            Stagger
          </h2>
          <p className="text-graphite-border leading-relaxed mb-2">
            The <code className="font-mono text-sm bg-marketplace-gray px-1 rounded">stagger</code> option offsets each element&apos;s trigger window —
            earlier elements in the list start animating sooner, later ones start a little further down the viewport.
            This creates a natural cascade without any per-element delay config:
          </p>
          <CodeBlock file="app.js">{`// Cards cascade: card-0 animates first, then card-1, card-2…
scrollReveal('.pricing-card', {
  preset:  'fadeUp',
  stagger: 0.12,
  easing:  'ease-out',
});

// Very subtle stagger for a large list
scrollReveal('.testimonial', {
  preset:  'scale',
  stagger: 0.06,
});\`}`}</CodeBlock>

          <h2 className="font-display font-extrabold text-2xl sm:text-3xl tracking-[-0.02em] mb-4 mt-12">
            React usage
          </h2>
          <CodeBlock file="FeaturesSection.tsx">{`'use client';
import { useEffect } from 'react';
import { scrollReveal } from 'svg-scroll-draw/reveal';

export function FeaturesSection() {
  useEffect(() => {
    const instance = scrollReveal('.feature-card', {
      preset:  'fadeUp',
      stagger: 0.1,
      once:    true,
    });
    return () => instance.destroy();
  }, []);

  return (
    <section>
      {features.map(f => (
        <div key={f.id} className="feature-card">
          {f.content}
        </div>
      ))}
    </section>
  );
}`}</CodeBlock>

          <h2 className="font-display font-extrabold text-2xl sm:text-3xl tracking-[-0.02em] mb-4 mt-12">
            Migration table
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-pitch-black bg-pitch-black text-light-linen">
                  <th className="text-left py-3 px-4 font-mono text-[11px] uppercase tracking-wide">AOS / ScrollReveal.js</th>
                  <th className="text-left py-3 px-4 font-mono text-[11px] uppercase tracking-wide">scrollReveal</th>
                </tr>
              </thead>
              <tbody className="text-[13px]">
                {[
                  ['data-aos="fade-up"', "scrollReveal('.el') // default"],
                  ['data-aos="fade-left"', "scrollReveal('.el', { preset: 'fadeLeft' })"],
                  ['data-aos="zoom-in"', "scrollReveal('.el', { preset: 'scale' })"],
                  ['data-aos="flip-up"', "scrollReveal('.el', { preset: 'flip' })"],
                  ['data-aos-delay="100"', "stagger: 0.1"],
                  ['data-aos-duration="800"', "trigger: { start: 'top 85%', end: 'top 50%' }"],
                  ['data-aos-once="true"', "once: true (default)"],
                  ['AOS.init({ once: true })', "scrollReveal('.el', { once: true })"],
                  ['AOS.refresh()', "instance.destroy(); scrollReveal(...)"],
                ].map(([before, after]) => (
                  <tr key={before} className="border-b border-subtle-ash">
                    <td className="py-3 px-4 font-mono text-graphite-border text-[11px] break-all">{before}</td>
                    <td className="py-3 px-4 font-mono text-creator-pink text-[11px] break-all">{after}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="font-display font-extrabold text-2xl sm:text-3xl tracking-[-0.02em] mb-4 mt-12">
            Full API
          </h2>
          <CodeBlock file="index.js">{`import { scrollReveal } from 'svg-scroll-draw/reveal';

const instance = scrollReveal(
  '.card',            // CSS selector, NodeList, or Element[]
  {
    preset:  'fadeUp',   // 'fadeUp' | 'fadeDown' | 'fadeLeft' | 'fadeRight'
                         // | 'scale' | 'flip' | 'flipX'
    from: {              // custom start state (overrides preset)
      opacity: 0,
      x: 0, y: 0,
      scale: 1,
      rotate: 0,
      rotateX: 0, rotateY: 0,
    },
    stagger: 0.08,       // viewport-% offset per element (default: 0.08)
    easing:  'ease-out', // any easing name or custom function
    once:    true,       // freeze at max progress (default: true)
    trigger: {           // override default trigger window
      start: 'top 88%',
      end:   'top 53%',
    },
    onEnter: () => {},   // fires when first element enters view
    onLeave: () => {},   // fires when last element leaves view
  }
);

instance.destroy(); // removes all animations, restores original styles`}</CodeBlock>

          <Callout>
            <strong>scrollReveal vs scrollAnimateGroup:</strong> Use{' '}
            <code className="font-mono text-[0.9em]">scrollReveal</code> for the common case — preset animations on a group of elements.
            Use{' '}
            <code className="font-mono text-[0.9em]">scrollAnimateGroup</code> when you need precise per-element control
            over different CSS properties with shared trigger timing.
          </Callout>

          <div className="mt-12 pt-8 border-t border-subtle-ash">
            <p className="text-[12px] font-mono text-graphite-border mb-4">Continue reading</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/blog/replace-gsap-scrolltrigger"
                className="text-sm px-4 py-2 rounded-full border border-pitch-black hover:bg-pitch-black hover:text-light-linen transition-colors font-medium">
                Replace GSAP ScrollTrigger →
              </Link>
              <Link href="/vs-gsap"
                className="text-sm px-4 py-2 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-medium">
                Full GSAP comparison →
              </Link>
              <Link href="/docs"
                className="text-sm px-4 py-2 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-medium">
                API Reference →
              </Link>
            </div>
          </div>
        </div>
      </article>

      <RelatedResources post="replace-aos-scrollreveal" />
      <footer className="px-6 md:px-12 py-6 border-t border-subtle-ash text-center text-[11px] font-mono text-graphite-border">
        svg-scroll-draw · MIT · ~10 KB gzipped ·{' '}
        <a href="https://github.com/DhruvilChauahan0210/ink-scroll" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-pitch-black transition-colors">
          GitHub
        </a>
      </footer>
    </div>
    </>
  );
}
