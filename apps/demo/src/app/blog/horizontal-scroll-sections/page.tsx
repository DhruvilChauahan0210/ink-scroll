import type { Metadata } from 'next';
import { RelatedResources } from '@/components/RelatedResources';
import Link from 'next/link';
import { MobileMenu } from '@/components/MobileMenu';
import { CopyButton } from '@/components/CopyButton';

export const metadata: Metadata = {
  title: 'Horizontal scroll sections without GSAP — scrollHorizontal',
  description:
    'Build the Apple / Stripe "scroll sideways" pattern without GSAP. scrollHorizontal drives translateX from vertical scroll — one call, sticky CSS, zero dependencies. React and vanilla examples.',
  keywords: [
    'horizontal scroll sections javascript',
    'scroll to move horizontally',
    'apple scroll animation',
    'horizontal parallax scroll',
    'scrollHorizontal without gsap',
    'sticky horizontal scroll',
    'gsap horizontal scroll alternative',
    'translate x on scroll javascript',
    'scroll driven horizontal animation',
  ],
  alternates: { canonical: 'https://svg-scroll-draw.vercel.app/blog/horizontal-scroll-sections' },
  openGraph: {
    title: 'Horizontal scroll sections without GSAP',
    description: 'scrollHorizontal: vertical scroll → horizontal motion. Apple-style pattern. One call.',
    url: 'https://svg-scroll-draw.vercel.app/blog/horizontal-scroll-sections',
  },
};

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline: 'Horizontal scroll sections without GSAP — scrollHorizontal',
  description: 'Build the Apple / Stripe "scroll sideways" pattern without GSAP. scrollHorizontal drives translateX from vertical scroll — one call, sticky CSS, zero dependencies.',
  url: 'https://svg-scroll-draw.vercel.app/blog/horizontal-scroll-sections',
  datePublished: '2026-06-06',
  dateModified: '2026-06-06',
  author: { '@type': 'Person', name: 'Dhruvil Chauhan', url: 'https://github.com/DhruvilChauahan0210' },
  publisher: { '@type': 'Organization', name: 'svg-scroll-draw', url: 'https://svg-scroll-draw.vercel.app' },
  image: 'https://svg-scroll-draw.vercel.app/opengraph-image',
  mainEntityOfPage: { '@type': 'WebPage', '@id': 'https://svg-scroll-draw.vercel.app/blog/horizontal-scroll-sections' },
};

function CodeBlock({ file, children }: { file: string; children: string }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-pitch-black my-5">
      <div className="bg-[#111] flex items-center justify-between px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#444]"/>
          <span className="w-2.5 h-2.5 rounded-full bg-[#444]"/>
          <span className="w-2.5 h-2.5 rounded-full bg-[#444]"/>
        </div>
        <span className="text-[11px] text-[#888] font-mono">{file}</span>
        <CopyButton text={children}/>
      </div>
      <pre className="bg-[#1c1c1c] text-[#e8e8e3] px-4 sm:px-6 py-4 text-[12px] sm:text-[13px] font-mono leading-[1.75] overflow-x-auto">{children}</pre>
    </div>
  );
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-l-4 border-creator-pink bg-creator-pink/5 px-5 py-4 rounded-r-xl my-5 text-sm leading-relaxed">{children}</div>
  );
}

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
    <div className="bg-light-linen text-pitch-black min-h-screen">

      <nav className="sticky top-0 z-50 bg-light-linen/95 backdrop-blur-sm border-b border-pitch-black flex items-center justify-between px-4 md:px-12 h-14">
        <Link href="/" className="font-display font-bold text-sm tracking-tight hover:opacity-70 transition-opacity shrink-0">svg-scroll-draw</Link>
        <div className="hidden lg:flex items-center gap-2">
          {['Home','Docs','Examples','Changelog','Blog'].map(l => (
            <Link key={l} href={l==='Home'?'/':`/${l.toLowerCase()}`} className="text-xs px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-medium">{l}</Link>
          ))}
          <Link href="/playground" className="text-xs px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-medium">⚡ Playground</Link>
        </div>
        <div className="flex lg:hidden"><MobileMenu /></div>
      </nav>

      <header className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-12 sm:py-16">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-5">
            <span className="inline-block text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full bg-[#60a5fa]/20 text-pitch-black border border-[#60a5fa]/40">How-To</span>
            <span className="text-[11px] font-mono text-graphite-border">June 2026 · 6 min read</span>
          </div>
          <h1 className="font-display font-extrabold text-[clamp(28px,6vw,60px)] leading-[0.92] tracking-[-0.04em] mb-5">
            Horizontal scroll sections<br />without GSAP.
          </h1>
          <p className="text-base sm:text-lg text-graphite-border leading-relaxed max-w-2xl">
            Apple does it. Stripe does it. Linear does it. Vertical scroll drives horizontal movement —
            and it&apos;s one of the most striking effects on the web. Here&apos;s how to build it in{' '}
            <code className="font-mono text-[0.9em] bg-marketplace-gray px-1.5 py-0.5 rounded">~10 lines</code>,
            no GSAP.
          </p>
        </div>
      </header>

      <article className="px-4 sm:px-6 md:px-12 py-12 sm:py-16">
        <div className="max-w-3xl mx-auto">

          <h2 className="font-display font-extrabold text-2xl sm:text-3xl tracking-[-0.02em] mb-4 mt-10">How it works</h2>
          <p className="text-graphite-border leading-relaxed mb-4">
            The pattern has three layers:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-graphite-border mb-6 text-sm">
            <li><strong>A tall outer container</strong> — gives the page enough scroll height for the horizontal travel distance</li>
            <li><strong>A sticky inner container</strong> — stays fixed in the viewport while the user scrolls through the outer</li>
            <li><strong>A horizontal track</strong> — slides left (translateX) proportional to how far through the outer the user has scrolled</li>
          </ol>
          <p className="text-graphite-border leading-relaxed mb-4">
            You set up the CSS. <code className="font-mono text-sm bg-marketplace-gray px-1 rounded">scrollHorizontal</code> drives the translateX.
          </p>

          <h2 className="font-display font-extrabold text-2xl sm:text-3xl tracking-[-0.02em] mb-4 mt-12">Step 1 — CSS setup</h2>
          <CodeBlock file="styles.css">{`.outer {
  height: 400vh;             /* scroll space = 3 extra viewport heights */
}

.sticky {
  position: sticky;
  top: 0;
  height: 100vh;
  overflow: hidden;
}

.track {
  display: flex;
  width: max-content;        /* as wide as all sections combined */
  height: 100%;
}

.section {
  width: 100vw;
  height: 100vh;
  flex-shrink: 0;
}`}</CodeBlock>

          <h2 className="font-display font-extrabold text-2xl sm:text-3xl tracking-[-0.02em] mb-4 mt-12">Step 2 — HTML</h2>
          <CodeBlock file="index.html">{`<div class="outer">
  <div class="sticky">
    <div class="track" id="track">
      <section class="section">Section 1</section>
      <section class="section">Section 2</section>
      <section class="section">Section 3</section>
      <section class="section">Section 4</section>
    </div>
  </div>
</div>`}</CodeBlock>

          <h2 className="font-display font-extrabold text-2xl sm:text-3xl tracking-[-0.02em] mb-4 mt-12">Step 3 — JavaScript</h2>
          <CodeBlock file="app.js">{`import { scrollHorizontal } from 'svg-scroll-draw/horizontal';

const track = document.querySelector('#track');

scrollHorizontal(track, {
  // Travel the full width of all sections minus one viewport
  distance: track.scrollWidth - window.innerWidth,
  easing:   'linear',  // linear = scrub feel (matches scroll exactly)
});`}</CodeBlock>

          <p className="text-graphite-border leading-relaxed mb-4">That&apos;s it. The trigger defaults to <code className="font-mono text-sm bg-marketplace-gray px-1 rounded">top top → bottom bottom</code> which maps the full scroll height of the outer container to the full horizontal travel distance.</p>

          <p className="text-graphite-border leading-relaxed mb-4">Note <em>which</em> element that window is measured from: the outer container, not the track. The track can&apos;t supply it — the sticky stage pins the track at exactly one viewport tall, so measuring against it would put the start and end of the window at the same scroll position, and nothing would move. <code className="font-mono text-sm bg-marketplace-gray px-1 rounded">scrollHorizontal</code> finds the outer container for you by walking up to the nearest <code className="font-mono text-sm bg-marketplace-gray px-1 rounded">position: sticky</code> ancestor and taking its parent, which is the structure above.</p>

          <p className="text-graphite-border leading-relaxed mb-4">If your layout doesn&apos;t use a sticky stage — a custom pinning approach, or a nested scroll container — pass the element that owns the scroll length explicitly:</p>
          <CodeBlock file="app.js">{`scrollHorizontal(track, {
  distance:       track.scrollWidth - window.innerWidth,
  triggerElement: '#outer',   // the element whose height is the scroll runway
});`}</CodeBlock>

          <h2 className="font-display font-extrabold text-2xl sm:text-3xl tracking-[-0.02em] mb-4 mt-12">React version</h2>
          <CodeBlock file="HorizontalScroll.tsx">{`'use client';
import { useEffect, useRef } from 'react';
import { scrollHorizontal } from 'svg-scroll-draw/horizontal';

const SECTIONS = ['Intro', 'Features', 'Pricing', 'Contact'];

export function HorizontalScroll() {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const inst = scrollHorizontal(track, {
      distance: track.scrollWidth - window.innerWidth,
      easing:   'linear',
    });

    // Recalculate on resize
    const onResize = () => inst.refresh();
    window.addEventListener('resize', onResize);

    return () => {
      inst.destroy();
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <div style={{ height: '400vh' }}>
      <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden' }}>
        <div ref={trackRef} style={{ display: 'flex', width: 'max-content', height: '100%' }}>
          {SECTIONS.map(s => (
            <section key={s} style={{ width: '100vw', height: '100vh', flexShrink: 0 }}>
              <h2>{s}</h2>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}`}</CodeBlock>

          <h2 className="font-display font-extrabold text-2xl sm:text-3xl tracking-[-0.02em] mb-4 mt-12">Progress indicators</h2>
          <p className="text-graphite-border leading-relaxed mb-2">Use <code className="font-mono text-sm bg-marketplace-gray px-1 rounded">onProgress</code> to drive dot indicators:</p>
          <CodeBlock file="app.js">{`const dots = document.querySelectorAll('.dot');

scrollHorizontal('#track', {
  distance:   3 * window.innerWidth,
  easing:     'linear',
  onProgress: (p) => {
    // p is 0→1 across all sections
    const activeIndex = Math.round(p * (dots.length - 1));
    dots.forEach((d, i) => d.classList.toggle('active', i === activeIndex));
  },
});`}</CodeBlock>

          <h2 className="font-display font-extrabold text-2xl sm:text-3xl tracking-[-0.02em] mb-4 mt-12">Combine with scrollReveal inside sections</h2>
          <CodeBlock file="app.js">{`import { scrollHorizontal } from 'svg-scroll-draw/horizontal';
import { scrollReveal }     from 'svg-scroll-draw/reveal';
import { scrollProgress }   from 'svg-scroll-draw/progress';

// Drive horizontal movement
scrollHorizontal('#track', { distance: 3 * window.innerWidth });

// Reveal content inside sections as they come into view
scrollReveal('.section-content', {
  preset:  'fadeUp',
  stagger: 0.1,
});

// Expose progress as CSS variable for background color transitions
scrollProgress('#track', {
  variable: '--scroll-p',
  easing:   'ease-in-out',
});
// CSS: background: hsl(calc(240 + var(--scroll-p) * 120), 60%, 10%);`}</CodeBlock>

          <Callout>
            <strong>Performance tip:</strong> Use <code className="font-mono text-[0.9em]">easing: &apos;linear&apos;</code> for a true scrub feel.
            Non-linear easings work too but feel less physically accurate — the horizontal position will
            lead or lag the scroll position, which can feel jarring.
          </Callout>

          <h2 className="font-display font-extrabold text-2xl sm:text-3xl tracking-[-0.02em] mb-4 mt-12">API</h2>
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
                  ['distance', 'number', 'Horizontal travel in px. Default: track.scrollWidth - window.innerWidth'],
                  ['easing',   'EasingName | fn', 'Easing for horizontal movement. Default: linear'],
                  ['trigger',  'TriggerConfig',   'Scroll window. Default: top top → bottom bottom'],
                  ['scrollContainer', 'string | Element', 'Custom scroll container. Default: window'],
                  ['triggerElement', 'string | Element', 'Element whose height is the scroll runway. Default: the container of the nearest position:sticky ancestor'],
                  ['respectReducedMotion', 'boolean', 'Default: false. The scrub advances only as the user scrolls, and holding a final state would hide every panel but one'],
                  ['onProgress', '(p: number) => void', 'Progress 0–1 through the horizontal travel'],
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
              <Link href="/blog/scroll-pin-without-gsap" className="text-sm px-4 py-2 rounded-full border border-pitch-black hover:bg-pitch-black hover:text-light-linen transition-colors font-medium">scrollPin without GSAP →</Link>
              <Link href="/vs-gsap" className="text-sm px-4 py-2 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-medium">Full GSAP comparison →</Link>
              <Link href="/docs" className="text-sm px-4 py-2 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-medium">API Reference →</Link>
            </div>
          </div>
        </div>
      </article>

      <RelatedResources post="horizontal-scroll-sections" />
      <footer className="px-6 md:px-12 py-6 border-t border-subtle-ash text-center text-[11px] font-mono text-graphite-border">
        svg-scroll-draw · MIT · ~10 KB gzipped ·{' '}
        <a href="https://github.com/DhruvilChauahan0210/ink-scroll" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-pitch-black transition-colors">GitHub</a>
      </footer>
    </div>
    </>
  );
}
