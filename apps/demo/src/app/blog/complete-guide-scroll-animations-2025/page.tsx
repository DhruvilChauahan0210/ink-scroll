import type { Metadata } from 'next';
import Link from 'next/link';
import { MobileMenu } from '@/components/MobileMenu';
import { CopyButton } from '@/components/CopyButton';

export const metadata: Metadata = {
  title: 'The Complete Guide to Scroll Animations in 2025 — svg-scroll-draw',
  description:
    'Every scroll animation pattern explained: fade reveal, parallax, pin/sticky, section snap, text split, video scrub, horizontal scroll, CSS variables. With code examples and library recommendations.',
  keywords: [
    'scroll animation guide',
    'scroll animation javascript 2025',
    'web scroll animation tutorial',
    'scroll driven animation',
    'intersection observer animation',
    'scroll animation library',
    'fade in on scroll',
    'parallax scroll effect',
    'sticky scroll section',
    'scroll animation react',
  ],
  alternates: { canonical: 'https://svg-scroll-draw.vercel.app/blog/complete-guide-scroll-animations-2025' },
  openGraph: {
    title: 'The Complete Guide to Scroll Animations in 2025',
    description: 'Every pattern, every technique, with code. Fade, parallax, pin, snap, text, video, horizontal — all in one place.',
    url: 'https://svg-scroll-draw.vercel.app/blog/complete-guide-scroll-animations-2025',
  },
};

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline: 'The Complete Guide to Scroll Animations in 2025',
  description: 'Every scroll animation pattern explained: fade reveal, parallax, pin/sticky, section snap, text split, video scrub, horizontal scroll, CSS variables.',
  url: 'https://svg-scroll-draw.vercel.app/blog/complete-guide-scroll-animations-2025',
  datePublished: '2026-06-06',
  dateModified: '2026-06-06',
  author: { '@type': 'Person', name: 'Dhruvil Chauhan', url: 'https://github.com/DhruvilChauahan0210' },
  publisher: { '@type': 'Organization', name: 'svg-scroll-draw', url: 'https://svg-scroll-draw.vercel.app' },
  image: 'https://svg-scroll-draw.vercel.app/opengraph-image',
  mainEntityOfPage: { '@type': 'WebPage', '@id': 'https://svg-scroll-draw.vercel.app/blog/complete-guide-scroll-animations-2025' },
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

function Section({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <div className="mt-16 pt-10 border-t border-subtle-ash">
      <p className="text-[11px] font-mono text-graphite-border mb-2 uppercase tracking-[0.18em]">{num}</p>
      <h2 className="font-display font-extrabold text-2xl sm:text-3xl tracking-[-0.02em] mb-6">{title}</h2>
      {children}
    </div>
  );
}

export default function CompletGuidePage() {
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
            <span className="inline-block text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full bg-pitch-black text-light-linen">Guide</span>
            <span className="text-[11px] font-mono text-graphite-border">June 2026 · 15 min read · Cornerstone</span>
          </div>
          <h1 className="font-display font-extrabold text-[clamp(28px,6vw,60px)] leading-[0.92] tracking-[-0.04em] mb-5">
            The complete guide to scroll animations in 2025.
          </h1>
          <p className="text-base sm:text-lg text-graphite-border leading-relaxed max-w-2xl">
            Every scroll animation pattern — fade reveal, parallax, sticky pin, section snap, text split,
            video scrub, horizontal sections, and CSS variable binding — explained with copy-paste code.
            All examples use svg-scroll-draw, a single ~9 KB library that covers all of them.
          </p>
        </div>
      </header>

      <article className="px-4 sm:px-6 md:px-12 py-12 sm:py-16">
        <div className="max-w-3xl mx-auto">

          {/* TOC */}
          <div className="border border-subtle-ash rounded-xl p-6 mb-10 bg-white">
            <p className="text-[11px] font-mono uppercase tracking-[0.16em] text-graphite-border mb-4">Table of contents</p>
            <ol className="space-y-2 text-sm">
              {[
                '01 — Fade reveal (the universal pattern)',
                '02 — Parallax',
                '03 — Animate any CSS property on scroll',
                '04 — Sticky / pin sections',
                '05 — Section snapping',
                '06 — Text split + reveal',
                '07 — Animated counters',
                '08 — Video scrubbing',
                '09 — Horizontal scroll sections',
                '10 — CSS variable binding',
                '11 — Scroll callbacks (onEnter / onLeave)',
                '12 — Native CSS scroll-driven animations',
              ].map(item => (
                <li key={item} className="font-mono text-[12px] text-graphite-border">{item}</li>
              ))}
            </ol>
          </div>

          <Section num="01" title="Fade reveal — the universal pattern">
            <p className="text-graphite-border leading-relaxed mb-4">
              The most common scroll animation: elements fade up into view as the user scrolls past them.
              Every major website uses this. AOS and ScrollReveal.js popularised it. svg-scroll-draw
              does it in one call with <code className="font-mono text-sm bg-marketplace-gray px-1 rounded">scrollReveal</code>.
            </p>
            <CodeBlock file="app.js">{`import { scrollReveal } from 'svg-scroll-draw/reveal';

// Default: fade up (opacity 0→1, translateY 32→0)
scrollReveal('.card');

// Custom from state
scrollReveal('.feature', {
  from:    { opacity: 0, y: 40, scale: 0.96 },
  stagger: 0.1,
  easing:  'ease-out',
  once:    true,
});

// Named presets: fadeUp|fadeDown|fadeLeft|fadeRight|scale|flip|flipX
scrollReveal('.badge', { preset: 'scale' });`}</CodeBlock>
          </Section>

          <Section num="02" title="Parallax">
            <p className="text-graphite-border leading-relaxed mb-4">
              Move elements at a different rate than scroll. Background images, floating badges, decorative shapes.
              Negative speed = opposite direction.
            </p>
            <CodeBlock file="app.js">{`import { scrollParallax } from 'svg-scroll-draw';

scrollParallax('#hero-bg',       { speed: 0.4 });   // slower than scroll
scrollParallax('#floating-badge',{ speed: -0.2 });  // opposite direction
scrollParallax('#side-element',  { speed: 0.3, axis: 'x' }); // horizontal`}</CodeBlock>
          </Section>

          <Section num="03" title="Animate any CSS property on scroll">
            <p className="text-graphite-border leading-relaxed mb-4">
              Not just opacity and transform — any CSS property can be driven by scroll position.
              Colors, backgrounds, borders, clip-paths, filter, font-size, anything.
            </p>
            <CodeBlock file="app.js">{`import { scrollAnimate } from 'svg-scroll-draw';

// Color transition (section background shifts as you scroll through)
scrollAnimate('#section', {
  props: {
    backgroundColor: ['#ffffff', '#0d0d0d'],
    color:           ['#000000', '#ffffff'],
  },
});

// Border radius morph
scrollAnimate('#card', {
  props: { borderRadius: ['0px', '24px'] },
});

// Blur reveal
scrollAnimate('#image', {
  props: { filter: ['blur(20px)', 'blur(0px)'], opacity: [0.3, 1] },
  easing: 'ease-out',
  once:   true,
});`}</CodeBlock>
          </Section>

          <Section num="04" title="Sticky / pin sections">
            <p className="text-graphite-border leading-relaxed mb-4">
              The Apple product page pattern. An element stays fixed while content scrolls past it.
              Use <code className="font-mono text-sm bg-marketplace-gray px-1 rounded">scrollPin</code> — it wraps the target in a spacer so the page layout doesn&apos;t jump.
            </p>
            <CodeBlock file="app.js">{`import { scrollPin } from 'svg-scroll-draw/pin';

// Pin product image while feature text scrolls
scrollPin('#product-image', {
  top:         80,                     // 80px from viewport top (below nav)
  pinDistance: window.innerHeight * 3, // stay pinned for 3 viewport heights
  onEnter:     () => image.classList.add('active'),
  onLeave:     () => image.classList.remove('active'),
  onEnterBack: () => image.classList.add('active'),
  onLeaveBack: () => image.classList.remove('active'),
});`}</CodeBlock>
          </Section>

          <Section num="05" title="Section snapping">
            <p className="text-graphite-border leading-relaxed mb-4">
              Snap the viewport to the nearest section when the user stops scrolling.
              Custom easing, configurable threshold, programmatic control.
            </p>
            <CodeBlock file="app.js">{`import { scrollSnap } from 'svg-scroll-draw/snap';

const snap = scrollSnap('.section', {
  duration:  600,
  easing:    'ease-in-out',
  threshold: 0.3,            // snap if scrolled 30%+ past a section
  onSnap:    (index) => updateNav(index),
});

// Programmatic
snap.snapTo(2);              // smooth scroll to section 2
snap.getCurrentIndex();      // → active section index
snap.destroy();`}</CodeBlock>
          </Section>

          <Section num="06" title="Text split + reveal">
            <p className="text-graphite-border leading-relaxed mb-4">
              Split text into chars, words, or lines and stagger-animate each piece.
              Free replacement for GSAP SplitText (which requires a paid Club GreenSock subscription).
            </p>
            <CodeBlock file="app.js">{`import { scrollText } from 'svg-scroll-draw/text';

// Word-by-word headline reveal
scrollText('#headline', {
  split:   'words',
  stagger: 0.07,
  from:    { opacity: 0, y: 32 },
  easing:  'ease-out',
  once:    true,
});

// Typewriter (char by char)
scrollText('#subtitle', {
  split:   'chars',
  stagger: 0.015,
  from:    { opacity: 0 },
  easing:  'linear',
  once:    true,
});`}</CodeBlock>
          </Section>

          <Section num="07" title="Animated counters">
            <p className="text-graphite-border leading-relaxed mb-4">
              Numbers that count up as they scroll into view. Stats sections, pricing, social proof.
            </p>
            <CodeBlock file="app.js">{`import { scrollCounter } from 'svg-scroll-draw';

scrollCounter('#users',      { to: 50000, format: n => Math.round(n).toLocaleString() + '+' });
scrollCounter('#revenue',    { to: 1250000, format: n => '$' + Math.round(n).toLocaleString() });
scrollCounter('#nps',        { to: 94.7, decimals: 1, format: n => n.toFixed(1) + '%' });
scrollCounter('#bundle',     { to: 9, format: n => '~' + Math.round(n) + ' KB' });`}</CodeBlock>
          </Section>

          <Section num="08" title="Video scrubbing">
            <p className="text-graphite-border leading-relaxed mb-4">
              Tie <code className="font-mono text-sm bg-marketplace-gray px-1 rounded">&lt;video&gt;.currentTime</code> to scroll position.
              The Apple / Stripe product video pattern — free, no GSAP needed.
            </p>
            <CodeBlock file="app.js">{`import { scrollVideo } from 'svg-scroll-draw/video';

scrollVideo('#hero-video', {
  trigger: { start: 'top top', end: 'bottom top' },
});`}</CodeBlock>
          </Section>

          <Section num="09" title="Horizontal scroll sections">
            <p className="text-graphite-border leading-relaxed mb-4">
              Vertical scroll drives horizontal movement. Set up sticky CSS, one call drives the transform.
            </p>
            <CodeBlock file="app.js">{`import { scrollHorizontal } from 'svg-scroll-draw/horizontal';

// CSS: .outer{height:400vh} .sticky{position:sticky;top:0;height:100vh;overflow:hidden}
// .track{display:flex;width:max-content}

scrollHorizontal('.track', {
  distance: document.querySelector('.track').scrollWidth - window.innerWidth,
  easing:   'linear',
});`}</CodeBlock>
          </Section>

          <Section num="10" title="CSS variable binding">
            <p className="text-graphite-border leading-relaxed mb-4">
              Expose scroll progress as a CSS custom property. Then CSS <code className="font-mono text-sm bg-marketplace-gray px-1 rounded">calc()</code> drives everything — color, size, position, filter — with zero extra JS.
            </p>
            <CodeBlock file="app.js">{`import { scrollProgress } from 'svg-scroll-draw/progress';

scrollProgress('#section', { easing: 'ease-in-out' });`}</CodeBlock>
            <CodeBlock file="styles.css">{`#section {
  /* Drive any CSS property from the variable */
  opacity: calc(var(--scroll-progress-eased));
  transform: translateY(calc((1 - var(--scroll-progress-eased)) * 40px));
  background: hsl(
    calc(240 + var(--scroll-progress) * 120),
    60%, 10%
  );
}`}</CodeBlock>
          </Section>

          <Section num="11" title="Scroll callbacks (onEnter / onLeave)">
            <p className="text-graphite-border leading-relaxed mb-4">
              Fire code when scroll crosses the trigger zone — in either direction.
              Nav highlighting, lazy loading, analytics events, state updates.
            </p>
            <CodeBlock file="app.js">{`import { scrollAnimate } from 'svg-scroll-draw';

scrollAnimate('#section', {
  props: { opacity: [0.4, 1] },
  trigger: { start: 'top center', end: 'bottom center' },
  onEnter:     () => nav.setActive('section'),
  onLeave:     () => nav.clearActive('section'),
  onEnterBack: () => nav.setActive('section'),
  onLeaveBack: () => nav.clearActive('section'),
});`}</CodeBlock>
          </Section>

          <Section num="12" title="Native CSS scroll-driven animations">
            <p className="text-graphite-border leading-relaxed mb-4">
              When <code className="font-mono text-sm bg-marketplace-gray px-1 rounded">animation-timeline: view()</code> is supported (Chrome 115+, Edge 115+), svg-scroll-draw automatically uses it — zero JS scroll listeners, zero rAF, pure compositor animation. Falls back silently in older browsers.
            </p>
            <CodeBlock file="app.js">{`import { scrollAnimate } from 'svg-scroll-draw';

// native: true is the default — uses CSS fast path when eligible
scrollAnimate('#hero', {
  props: { opacity: [0, 1], transform: ['translateY(32px)', 'translateY(0)'] },
  // native: true (default) — runs on compositor when supported
});

// Force JS engine (needed for callbacks, velocity, custom easing fns)
scrollAnimate('#section', {
  props: { opacity: [0, 1] },
  native: false,
  onEnter: () => activate(),
});`}</CodeBlock>
          </Section>

          <div className="mt-16 pt-10 border-t border-subtle-ash">
            <p className="font-display font-extrabold text-xl tracking-[-0.02em] mb-6">One library, all patterns.</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-8">
              {['scrollReveal','scrollAnimate','scrollParallax','scrollPin','scrollSnap','scrollText','scrollCounter','scrollVideo','scrollHorizontal','scrollProgress','scrollDraw','devtools'].map(api => (
                <code key={api} className="text-[11px] font-mono bg-marketplace-gray border border-subtle-ash px-2 py-1 rounded text-center text-graphite-border">{api}</code>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/" className="text-sm px-4 py-2 rounded-full bg-pitch-black text-light-linen font-medium">Get started →</Link>
              <Link href="/vs-gsap" className="text-sm px-4 py-2 rounded-full border border-pitch-black hover:bg-pitch-black hover:text-light-linen transition-colors font-medium">vs GSAP →</Link>
              <Link href="/docs" className="text-sm px-4 py-2 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-medium">API Reference →</Link>
            </div>
          </div>
        </div>
      </article>

      <footer className="px-6 md:px-12 py-6 border-t border-subtle-ash text-center text-[11px] font-mono text-graphite-border">
        svg-scroll-draw · MIT · ~9 KB ·{' '}<a href="https://github.com/DhruvilChauahan0210/ink-scroll" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-pitch-black transition-colors">GitHub</a>
      </footer>
    </div>
    </>
  );
}
