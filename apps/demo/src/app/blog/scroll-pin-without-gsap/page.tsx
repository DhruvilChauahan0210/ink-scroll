import type { Metadata } from 'next';
import { RelatedResources } from '@/components/RelatedResources';
import Link from 'next/link';
import { MobileMenu } from '@/components/MobileMenu';
import { CopyButton } from '@/components/CopyButton';

export const metadata: Metadata = {
  title: 'Pin sections on scroll without GSAP — scrollPin',
  description:
    'How to pin any element at a viewport position while the page scrolls past it — without GSAP. scrollPin from svg-scroll-draw: wrapper-based, no layout shift, full lifecycle callbacks, 9 KB total.',
  keywords: [
    'scroll pin without gsap',
    'gsap pin alternative',
    'sticky scroll section javascript',
    'scrolltrigger pin alternative',
    'pin element on scroll',
    'scroll-driven sticky section',
    'svg-scroll-draw scrollPin',
    'pin animation javascript',
    'position fixed on scroll',
    'scroll snap and pin',
  ],
  alternates: { canonical: '/blog/scroll-pin-without-gsap' },
  openGraph: {
    title: 'Pin sections on scroll without GSAP — scrollPin',
    description: 'A wrapper-based pin implementation with full lifecycle callbacks. Zero GSAP. ~10 KB total.',
    url: 'https://svg-scroll-draw.vercel.app/blog/scroll-pin-without-gsap',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pin sections on scroll without GSAP — scrollPin',
    description: 'Sticky scroll sections without GSAP. Full lifecycle callbacks. 9 KB total.',
  },
};

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline: 'Pin sections on scroll without GSAP — scrollPin',
  description: 'How to pin any element at a viewport position while the page scrolls past it — without GSAP. scrollPin from svg-scroll-draw: wrapper-based, no layout shift, full lifecycle callbacks.',
  url: 'https://svg-scroll-draw.vercel.app/blog/scroll-pin-without-gsap',
  datePublished: '2026-06-06',
  dateModified: '2026-06-06',
  author: { '@type': 'Person', name: 'Dhruvil Chauhan', url: 'https://github.com/DhruvilChauahan0210' },
  publisher: { '@type': 'Organization', name: 'svg-scroll-draw', url: 'https://svg-scroll-draw.vercel.app' },
  image: 'https://svg-scroll-draw.vercel.app/opengraph-image',
  mainEntityOfPage: { '@type': 'WebPage', '@id': 'https://svg-scroll-draw.vercel.app/blog/scroll-pin-without-gsap' },
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
              How-To
            </span>
            <span className="text-[11px] font-mono text-graphite-border">June 2026 · 7 min read</span>
          </div>
          <h1 className="font-display font-extrabold text-[clamp(28px,6vw,60px)] leading-[0.92] tracking-[-0.04em] mb-5">
            Pin sections on scroll<br />without GSAP.
          </h1>
          <p className="text-base sm:text-lg text-graphite-border leading-relaxed max-w-2xl">
            The Apple product page. The Stripe feature walkthrough. The sticky image with scrolling text.
            These all use the same pattern: pin an element in place while the page scrolls past it.
            Here&apos;s how to do it without GSAP — in{' '}
            <code className="font-mono text-[0.9em] bg-marketplace-gray px-1.5 py-0.5 rounded">~10 KB</code> total.
          </p>
        </div>
      </header>

      {/* Article */}
      <article className="px-4 sm:px-6 md:px-12 py-12 sm:py-16">
        <div className="max-w-3xl mx-auto">

          <h2 className="font-display font-extrabold text-2xl sm:text-3xl tracking-[-0.02em] mb-4 mt-10">
            What &ldquo;pin&rdquo; means
          </h2>
          <p className="text-graphite-border leading-relaxed mb-4">
            A pinned element is fixed to a viewport position while the page scrolls a defined distance past it.
            When the scroll reaches the end of the &ldquo;pin zone&rdquo;, the element is released and continues with the page.
          </p>
          <p className="text-graphite-border leading-relaxed mb-4">
            GSAP ScrollTrigger built the mental model: <code className="font-mono text-sm bg-marketplace-gray px-1 rounded">pin: true</code> +
            a scroll distance. svg-scroll-draw ships the same pattern as{' '}
            <code className="font-mono text-sm bg-marketplace-gray px-1 rounded">scrollPin</code> in the{' '}
            <code className="font-mono text-sm bg-marketplace-gray px-1 rounded">svg-scroll-draw/pin</code> sub-path.
          </p>

          <h2 className="font-display font-extrabold text-2xl sm:text-3xl tracking-[-0.02em] mb-4 mt-12">
            Install
          </h2>
          <CodeBlock file="terminal">{`npm install svg-scroll-draw`}</CodeBlock>

          <h2 className="font-display font-extrabold text-2xl sm:text-3xl tracking-[-0.02em] mb-4 mt-12">
            The simplest pin
          </h2>
          <p className="text-graphite-border leading-relaxed mb-2">
            Pin <code className="font-mono text-sm bg-marketplace-gray px-1 rounded">#panel</code> at the top of the viewport
            for one full viewport-height of scroll:
          </p>
          <CodeBlock file="app.js">{`import { scrollPin } from 'svg-scroll-draw/pin';

const instance = scrollPin('#panel', {
  pinDistance: window.innerHeight, // default
});

// Later: remove pin and restore the DOM
// instance.destroy();`}</CodeBlock>

          <p className="text-graphite-border leading-relaxed mb-4">
            That&apos;s it. <code className="font-mono text-sm bg-marketplace-gray px-1 rounded">scrollPin</code> wraps the
            target in a spacer div (so the page layout doesn&apos;t jump), applies{' '}
            <code className="font-mono text-sm bg-marketplace-gray px-1 rounded">position: fixed</code> when the element
            hits the viewport top, and releases it when the pin zone ends.
          </p>

          <h2 className="font-display font-extrabold text-2xl sm:text-3xl tracking-[-0.02em] mb-4 mt-12">
            Pin at a custom viewport position
          </h2>
          <p className="text-graphite-border leading-relaxed mb-2">
            Use the <code className="font-mono text-sm bg-marketplace-gray px-1 rounded">top</code> option to pin at
            a different viewport Y offset — e.g. 80px below the top (for a fixed navbar):
          </p>
          <CodeBlock file="app.js">{`scrollPin('#sticky-image', {
  top:         80,           // pin 80px from viewport top
  pinDistance: 600,          // hold for 600px of scroll
});`}</CodeBlock>

          <h2 className="font-display font-extrabold text-2xl sm:text-3xl tracking-[-0.02em] mb-4 mt-12">
            Lifecycle callbacks
          </h2>
          <p className="text-graphite-border leading-relaxed mb-2">
            Four callbacks mirror GSAP&apos;s ScrollTrigger API exactly:
          </p>
          <CodeBlock file="app.js">{`scrollPin('#feature-panel', {
  pinDistance: 800,
  onEnter:     () => panel.classList.add('active'),
  onLeave:     () => panel.classList.remove('active'),
  onEnterBack: () => panel.classList.add('active'),
  onLeaveBack: () => panel.classList.remove('active'),
});`}</CodeBlock>

          <Callout>
            <strong>onEnter</strong> fires when scroll first reaches the pin zone (scrolling down).<br />
            <strong>onLeave</strong> fires when scroll exits the pin zone at the end (scrolling down).<br />
            <strong>onEnterBack</strong> fires when scroll re-enters the pin zone (scrolling back up).<br />
            <strong>onLeaveBack</strong> fires when scroll exits the pin zone at the start (scrolling back up).
          </Callout>

          <h2 className="font-display font-extrabold text-2xl sm:text-3xl tracking-[-0.02em] mb-4 mt-12">
            Progress callback
          </h2>
          <p className="text-graphite-border leading-relaxed mb-2">
            Use <code className="font-mono text-sm bg-marketplace-gray px-1 rounded">onProgress</code> to drive
            another animation while the element is pinned:
          </p>
          <CodeBlock file="app.js">{`import { scrollPin }    from 'svg-scroll-draw/pin';
import { scrollAnimate } from 'svg-scroll-draw';

// Fade in a caption as the user scrolls through the pin zone
scrollPin('#hero-image', {
  pinDistance: 600,
  onProgress: (p) => {
    // p is 0 → 1 through the pin zone
    caption.style.opacity = p.toFixed(3);
  },
});`}</CodeBlock>

          <h2 className="font-display font-extrabold text-2xl sm:text-3xl tracking-[-0.02em] mb-4 mt-12">
            Apple-style: pin image, scroll text
          </h2>
          <p className="text-graphite-border leading-relaxed mb-2">
            The classic pattern: image stays fixed while feature copy scrolls past it.
          </p>
          <CodeBlock file="feature-section.js">{`import { scrollPin }    from 'svg-scroll-draw/pin';
import { scrollAnimate } from 'svg-scroll-draw';

// Pin the product image
const pin = scrollPin('#product-image', {
  top:         80,
  pinDistance: window.innerHeight * 3,
  onEnter: () => image.src = '/hero-active.png',
});

// Animate each feature block as it scrolls in
document.querySelectorAll('.feature-block')
  .forEach(el => {
    scrollAnimate(el, {
      props: {
        opacity:   [0, 1],
        transform: ['translateY(32px)', 'translateY(0)'],
      },
      easing: 'ease-out',
      once:   true,
    });
  });`}</CodeBlock>

          <h2 className="font-display font-extrabold text-2xl sm:text-3xl tracking-[-0.02em] mb-4 mt-12">
            React usage
          </h2>
          <CodeBlock file="FeatureSection.tsx">{`'use client';
import { useEffect, useRef } from 'react';
import { scrollPin } from 'svg-scroll-draw/pin';

export function FeatureSection() {
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!imageRef.current) return;
    const instance = scrollPin(imageRef.current, {
      top:         80,
      pinDistance: window.innerHeight * 2,
      onEnter:     () => console.log('pinned'),
      onLeave:     () => console.log('released'),
    });
    return () => instance.destroy();
  }, []);

  return (
    <section className="flex gap-16">
      <div ref={imageRef} className="w-1/2">
        <img src="/product.png" alt="Product" />
      </div>
      <div className="w-1/2 space-y-64 py-32">
        <p>Feature one text...</p>
        <p>Feature two text...</p>
        <p>Feature three text...</p>
      </div>
    </section>
  );
}`}</CodeBlock>

          <h2 className="font-display font-extrabold text-2xl sm:text-3xl tracking-[-0.02em] mb-4 mt-12">
            Section snapping
          </h2>
          <p className="text-graphite-border leading-relaxed mb-4">
            Often pin sections are combined with scroll snap. svg-scroll-draw ships both:
          </p>
          <CodeBlock file="app.js">{`import { scrollPin }  from 'svg-scroll-draw/pin';
import { scrollSnap } from 'svg-scroll-draw/snap';

// Snap between fullscreen sections
scrollSnap('.section', {
  duration:  600,
  easing:    'ease-in-out',
  onSnap:    (index) => console.log('section', index),
});

// Pin the nav while scrolling
scrollPin('#nav', {
  top:         0,
  pinDistance: document.body.scrollHeight,
});`}</CodeBlock>

          <h2 className="font-display font-extrabold text-2xl sm:text-3xl tracking-[-0.02em] mb-4 mt-12">
            Cleanup
          </h2>
          <p className="text-graphite-border leading-relaxed mb-4">
            Every <code className="font-mono text-sm bg-marketplace-gray px-1 rounded">scrollPin</code> call returns an
            instance with <code className="font-mono text-sm bg-marketplace-gray px-1 rounded">destroy()</code> and{' '}
            <code className="font-mono text-sm bg-marketplace-gray px-1 rounded">refresh()</code>.
            Call <code className="font-mono text-sm bg-marketplace-gray px-1 rounded">destroy()</code> in component
            cleanup / route change. Call{' '}
            <code className="font-mono text-sm bg-marketplace-gray px-1 rounded">refresh()</code> if the page layout
            changes dynamically (accordion opens, dynamic content loads).
          </p>
          <CodeBlock file="app.js">{`const pin = scrollPin('#panel', { pinDistance: 600 });

// Recalculate after layout change
document.querySelector('#accordion').addEventListener('click', () => {
  pin.refresh();
});

// Remove on page unload
window.addEventListener('beforeunload', () => pin.destroy());`}</CodeBlock>

          <h2 className="font-display font-extrabold text-2xl sm:text-3xl tracking-[-0.02em] mb-4 mt-12">
            Full API
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-pitch-black">
                  <th className="text-left py-3 pr-4 font-mono font-bold">Option</th>
                  <th className="text-left py-3 pr-4 font-mono font-bold">Type</th>
                  <th className="text-left py-3 font-mono font-bold">Description</th>
                </tr>
              </thead>
              <tbody className="font-mono text-[12px]">
                {[
                  ['pinDistance', 'number', 'Pixels of scroll to stay pinned. Default: window.innerHeight'],
                  ['top', 'number', 'Viewport Y (px) to pin at. Default: 0 (viewport top)'],
                  ['scrollContainer', 'string | Element', 'Custom scroll container. Default: window'],
                  ['onEnter', '() => void', 'Fires when pin zone is entered (scrolling down)'],
                  ['onLeave', '() => void', 'Fires when pin zone is exited at end (scrolling down)'],
                  ['onEnterBack', '() => void', 'Fires when pin zone is re-entered (scrolling up)'],
                  ['onLeaveBack', '() => void', 'Fires when pin zone is exited at start (scrolling up)'],
                  ['onProgress', '(p: number) => void', 'Progress 0–1 through the pin zone, every frame'],
                ].map(([opt, type, desc]) => (
                  <tr key={opt} className="border-b border-subtle-ash">
                    <td className="py-3 pr-4 text-creator-pink">{opt}</td>
                    <td className="py-3 pr-4 text-graphite-border">{type}</td>
                    <td className="py-3 text-graphite-border">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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

      <RelatedResources post="scroll-pin-without-gsap" />
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
