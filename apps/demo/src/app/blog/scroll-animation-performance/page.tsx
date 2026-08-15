import type { Metadata } from 'next';
import { RelatedResources } from '@/components/RelatedResources';
import Link from 'next/link';
import { MobileMenu } from '@/components/MobileMenu';
import { CopyButton } from '@/components/CopyButton';

export const metadata: Metadata = {
  title: 'Scroll Animation Performance — Native CSS vs JavaScript',
  description:
    'How svg-scroll-draw uses animation-timeline: view() for zero-JS scroll animations on the compositor. When native CSS wins, when JS wins, and how to get 60fps scroll animations every time.',
  keywords: [
    'scroll animation performance',
    'animation-timeline view()',
    'scroll driven animation native css',
    'javascript scroll animation performance',
    'intersection observer performance',
    'css scroll animation 60fps',
    'compositor scroll animation',
    'scroll animation jank',
    'scroll animation optimization',
  ],
  alternates: { canonical: 'https://svg-scroll-draw.vercel.app/blog/scroll-animation-performance' },
  openGraph: {
    title: 'Scroll Animation Performance — Native CSS vs JavaScript',
    description: 'Zero-JS scroll animations on the compositor. How animation-timeline: view() works and when to use it.',
    url: 'https://svg-scroll-draw.vercel.app/blog/scroll-animation-performance',
  },
};

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline: 'Scroll Animation Performance — Native CSS vs JavaScript',
  description: 'How svg-scroll-draw uses animation-timeline: view() for zero-JS scroll animations on the compositor. When native CSS wins, when JS wins, and how to get 60fps scroll animations every time.',
  url: 'https://svg-scroll-draw.vercel.app/blog/scroll-animation-performance',
  datePublished: '2026-06-06',
  dateModified: '2026-06-06',
  author: { '@type': 'Person', name: 'Dhruvil Chauhan', url: 'https://github.com/DhruvilChauahan0210' },
  publisher: { '@type': 'Organization', name: 'svg-scroll-draw', url: 'https://svg-scroll-draw.vercel.app' },
  image: 'https://svg-scroll-draw.vercel.app/opengraph-image',
  mainEntityOfPage: { '@type': 'WebPage', '@id': 'https://svg-scroll-draw.vercel.app/blog/scroll-animation-performance' },
};

function CodeBlock({ file, children }: { file: string; children: string }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-pitch-black my-5">
      <div className="bg-[#111] flex items-center justify-between px-4 py-2.5">
        <div className="flex gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#444]"/><span className="w-2.5 h-2.5 rounded-full bg-[#444]"/><span className="w-2.5 h-2.5 rounded-full bg-[#444]"/></div>
        <span className="text-[11px] text-[#888] font-mono">{file}</span>
        <CopyButton text={children} />
      </div>
      <pre className="bg-[#1c1c1c] text-[#e8e8e3] px-4 sm:px-6 py-4 text-[12px] sm:text-[13px] font-mono leading-[1.75] overflow-x-auto">{children}</pre>
    </div>
  );
}

export default function ScrollPerformancePage() {
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
            <span className="inline-block text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full bg-[#22c55e]/20 border border-[#22c55e]/40 text-pitch-black">Performance</span>
            <span className="text-[11px] font-mono text-graphite-border">June 2026 · 8 min read</span>
          </div>
          <h1 className="font-display font-extrabold text-[clamp(28px,6vw,60px)] leading-[0.92] tracking-[-0.04em] mb-5">
            Scroll animation performance.<br />Native CSS vs JavaScript.
          </h1>
          <p className="text-base sm:text-lg text-graphite-border leading-relaxed max-w-2xl">
            Most scroll animation libraries run JavaScript on every scroll event. svg-scroll-draw takes a different approach:
            use the browser&apos;s native <code className="font-mono text-[0.9em] bg-marketplace-gray px-1.5 py-0.5 rounded">animation-timeline: view()</code> when possible — zero JS, pure compositor — and fall back to a lean JS engine when it&apos;s not.
          </p>
        </div>
      </header>

      <article className="px-4 sm:px-6 md:px-12 py-12 sm:py-16">
        <div className="max-w-3xl mx-auto">

          <h2 className="font-display font-extrabold text-2xl sm:text-3xl tracking-[-0.02em] mb-4 mt-10">The problem with JS scroll listeners</h2>
          <p className="text-graphite-border leading-relaxed mb-4">
            Traditional scroll animation libraries work by listening to the scroll event, reading the scroll position, and then updating element styles in response. This runs on the main thread, competing with layout, paint, and user input.
          </p>
          <p className="text-graphite-border leading-relaxed mb-4">
            Even with <code className="font-mono text-sm bg-marketplace-gray px-1 rounded">passive: true</code> and <code className="font-mono text-sm bg-marketplace-gray px-1 rounded">requestAnimationFrame</code>, any JS on the scroll path adds latency.
            On low-end mobile, this is the difference between smooth 60fps and visible jank.
          </p>

          <h2 className="font-display font-extrabold text-2xl sm:text-3xl tracking-[-0.02em] mb-4 mt-12">The native CSS fast path</h2>
          <p className="text-graphite-border leading-relaxed mb-4">
            CSS Scroll-Driven Animations (<code className="font-mono text-sm bg-marketplace-gray px-1 rounded">animation-timeline: view()</code>) run entirely on the compositor thread. The browser handles the scroll → animation mapping with <strong>zero JavaScript involvement</strong>. No main thread. No GC pauses. Just the GPU.
          </p>
          <p className="text-graphite-border leading-relaxed mb-4">
            Supported in Chrome 115+, Edge 115+, and Firefox 110+ (behind a flag). ~85% of browsers as of 2025.
          </p>
          <CodeBlock file="native-css.css">{`/* What the browser generates under the hood */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(32px); }
  to   { opacity: 1; transform: translateY(0); }
}

.animate {
  animation-name:            fadeUp;
  animation-duration:        auto;         /* scroll-driven */
  animation-timing-function: ease-out;
  animation-fill-mode:       both;
  animation-timeline:        view();       /* tied to scroll */
  animation-range:           cover 0% cover 100%;
}`}</CodeBlock>

          <h2 className="font-display font-extrabold text-2xl sm:text-3xl tracking-[-0.02em] mb-4 mt-12">How svg-scroll-draw picks the right engine</h2>
          <p className="text-graphite-border leading-relaxed mb-4">
            svg-scroll-draw checks a set of eligibility criteria on every <code className="font-mono text-sm bg-marketplace-gray px-1 rounded">scrollAnimate</code> call. If all pass, it injects a <code className="font-mono text-sm bg-marketplace-gray px-1 rounded">&lt;style&gt;</code> tag and adds a class — no JS scroll listeners at all.
          </p>
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-pitch-black bg-pitch-black text-light-linen">
                  <th className="text-left py-2.5 px-4 font-mono text-[11px] uppercase tracking-wide">Condition</th>
                  <th className="text-left py-2.5 px-4 font-mono text-[11px] uppercase tracking-wide">Native path</th>
                  <th className="text-left py-2.5 px-4 font-mono text-[11px] uppercase tracking-wide">JS engine</th>
                </tr>
              </thead>
              <tbody className="text-[13px]">
                {[
                  ['Browser supports animation-timeline: view()', '✓', 'fallback'],
                  ['axis: "y" (vertical)', '✓', '✓'],
                  ['No custom scrollContainer', '✓', '✓'],
                  ['String easing (ease-out etc.)', '✓', '✓'],
                  ['No callbacks (onEnter, onComplete…)', '✓', '✓'],
                  ['Default trigger (top bottom → bottom top)', '✓', '✓'],
                  ['speed: 1', '✓', '✓'],
                  ['once: false', '✓', '✓'],
                  ['Safe CSS prop (opacity, transform, color…)', '✓', '✓'],
                ].map(([cond, n, j]) => (
                  <tr key={cond} className="border-b border-subtle-ash">
                    <td className="py-2.5 px-4 text-graphite-border">{cond}</td>
                    <td className="py-2.5 px-4 text-[#22c55e] font-bold">{n}</td>
                    <td className="py-2.5 px-4">{j}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <CodeBlock file="app.js">{`import { scrollAnimate } from 'svg-scroll-draw';

// ✅ Native CSS path — zero JS scroll listeners
scrollAnimate('#hero', {
  props:  { opacity: [0, 1], transform: ['translateY(32px)', 'translateY(0)'] },
  easing: 'ease-out',
  // native: true is the default
});

// ⚡ Falls back to JS engine — callbacks require main-thread JS
scrollAnimate('#section', {
  props:   { opacity: [0, 1] },
  onEnter: () => nav.setActive('section'),  // needs JS
});

// Force JS engine explicitly
scrollAnimate('#card', {
  props:  { opacity: [0, 1] },
  native: false,
});`}</CodeBlock>

          <h2 className="font-display font-extrabold text-2xl sm:text-3xl tracking-[-0.02em] mb-4 mt-12">The JS engine — when it runs</h2>
          <p className="text-graphite-border leading-relaxed mb-4">
            When the native path isn&apos;t eligible, svg-scroll-draw uses an <code className="font-mono text-sm bg-marketplace-gray px-1 rounded">IntersectionObserver</code> to start/stop a <code className="font-mono text-sm bg-marketplace-gray px-1 rounded">requestAnimationFrame</code> loop only while the element is in the viewport. The rAF loop stops completely when the element scrolls out — no wasted work.
          </p>
          <p className="text-graphite-border leading-relaxed mb-4">
            CSS property updates are batched per frame via <code className="font-mono text-sm bg-marketplace-gray px-1 rounded">el.style.setProperty()</code> — a single style recalc per element per frame.
          </p>

          <h2 className="font-display font-extrabold text-2xl sm:text-3xl tracking-[-0.02em] mb-4 mt-12">Performance tips</h2>
          <ul className="space-y-4 text-graphite-border">
            {[
              { t: 'Stick to native-eligible configs', b: 'opacity + transform are compositor-only properties. Adding them to native CSS path = zero main thread work. Avoid animating layout-triggering properties (width, height, top, left) even in the JS engine.' },
              { t: 'Use once: true for reveal animations', b: 'Reveal animations that reverse on scroll back keep the rAF loop running. once: true freezes the final value and stops the loop after completion.' },
              { t: 'prefers-reduced-motion is respected automatically', b: 'svg-scroll-draw checks window.matchMedia("(prefers-reduced-motion: reduce)") and applies the final state immediately — no animation, full accessibility.' },
              { t: 'Trigger windows matter', b: 'A trigger from top-bottom to bottom-top means the animation is active the entire time the element is in view. Narrow triggers (e.g. top 80% to top 40%) run the rAF loop for less time.' },
            ].map(({ t, b }) => (
              <li key={t} className="pl-4 border-l-2 border-creator-pink">
                <strong className="text-pitch-black block mb-1">{t}</strong>
                {b}
              </li>
            ))}
          </ul>

          <div className="mt-12 pt-8 border-t border-subtle-ash">
            <div className="flex flex-wrap gap-3">
              <Link href="/blog/native-css-svg-scroll-animations" className="text-sm px-4 py-2 rounded-full border border-pitch-black hover:bg-pitch-black hover:text-light-linen transition-colors font-medium">Deep dive: native CSS →</Link>
              <Link href="/vs-gsap" className="text-sm px-4 py-2 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-medium">vs GSAP performance →</Link>
              <Link href="/docs" className="text-sm px-4 py-2 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-medium">API Reference →</Link>
            </div>
          </div>
        </div>
      </article>

      <RelatedResources post="scroll-animation-performance" />
      <footer className="px-6 md:px-12 py-6 border-t border-subtle-ash text-center text-[11px] font-mono text-graphite-border">
        svg-scroll-draw · MIT · ~10 KB ·{' '}<a href="https://github.com/DhruvilChauahan0210/ink-scroll" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-pitch-black transition-colors">GitHub</a>
      </footer>
    </div>
    </>
  );
}
