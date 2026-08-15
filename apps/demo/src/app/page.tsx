import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { BundleGraphLine, CtaBoldMark } from '@/components/BackgroundDecor';

export const metadata: Metadata = {
  alternates: { canonical: 'https://svg-scroll-draw.vercel.app' },
};
import { ThemeToggle } from '@/components/ThemeToggle';
import { MobileMenu } from '@/components/MobileMenu';
import { LiveStats } from '@/components/LiveStats';
import { CopyButton } from '@/components/CopyButton';
import { InstallTabs } from '@/components/InstallTabs';
import { FrameworkTabs } from '@/components/FrameworkTabs';
import { NativeCSSBadgeLoader as NativeCSSBadge } from '@/components/NativeCSSBadgeLoader';

/* Three flagship demos only. Everything else lives in /examples — see
   HOMEPAGE-INDUSTRY-STANDARD-PLAN.md §4. */
const ScrollShowcase = dynamic(() => import('@/components/ScrollShowcase').then(m => ({ default: m.ScrollShowcase })));
const InteractiveScrollDemo = dynamic(() => import('@/components/InteractiveScrollDemo').then(m => ({ default: m.InteractiveScrollDemo })));
const ScrollAnimateInteractive = dynamic(() => import('@/components/ScrollAnimateInteractive').then(m => ({ default: m.ScrollAnimateInteractive })));
const ScrollTextInteractive = dynamic(() => import('@/components/ScrollTextInteractive').then(m => ({ default: m.ScrollTextInteractive })));

const GH  = 'https://github.com/DhruvilChauahan0210/ink-scroll';
const NPM = 'https://www.npmjs.com/package/svg-scroll-draw';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'svg-scroll-draw',
  description:
    'A lightweight scroll-animation toolkit with best-in-class SVG path drawing. Draw SVG paths, reveal content, animate text, scrub video, and drive CSS from scroll. 10 KB. Zero dependencies.',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Web',
  url: 'https://svg-scroll-draw.vercel.app',
  downloadUrl: 'https://www.npmjs.com/package/svg-scroll-draw',
  codeRepository: 'https://github.com/DhruvilChauahan0210/ink-scroll',
  license: 'https://opensource.org/licenses/MIT',
  softwareVersion: '2.10.0',
  programmingLanguage: ['JavaScript', 'TypeScript'],
  author: {
    '@type': 'Person',
    name: 'Dhruvil Chauhan',
  },
  keywords: 'scroll draw, svg scroll draw, scroll draw animation, scroll draw library, svg, animation, scroll, javascript, react, vue, web animation',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
};

/* ── Shared sub-components ──────────────────────────────────────────────── */

function CodeBlock({ filename, children }: { filename: string; children: string }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-pitch-black">
      <div className="bg-[#111] dark:bg-[#1a1a1a] flex items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#444]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#444]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#444]" />
        </div>
        <span className="text-[11px] text-[#888] font-mono tracking-wide">{filename}</span>
        <CopyButton text={children} />
      </div>
      <pre className="bg-[#242423] dark:bg-[#1c1c1c] text-[#e8e8e3] px-3 sm:px-5 py-4 text-[12px] sm:text-[13px] font-mono leading-[1.75] overflow-x-auto">
        {children}
      </pre>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <code className="inline bg-marketplace-gray border border-subtle-ash px-1.5 py-0.5 rounded-md text-[0.82em] font-mono text-pitch-black align-middle break-all">
      {children}
    </code>
  );
}

/* ── Marquee data ────────────────────────────────────────────────────────
   Brand texture, not a feature dump. Trimmed from 40 items to the ones that
   actually answer "can I trust this" at a glance. */
const MARQUEE_ITEMS = [
  '10 KB gzipped',
  'Zero dependencies',
  '531 tests passing',
  '175 browser tests',
  'SSR safe',
  'Native CSS fast path',
  'React · Vue · Svelte · Solid',
  'Angular · Astro · Nuxt',
  'Reduced motion',
  'TypeScript first',
  'MIT licensed',
];

/* ── Compact API map — replaces twelve full code cards ─────────────────── */
const API_GROUPS = [
  {
    label: 'Draw & morph',
    items: [
      { name: 'scrollDraw',         desc: 'Draw any SVG path as it enters the viewport.' },
      { name: 'scrollDrawGroup',    desc: 'Animate many SVGs together with shared options.' },
      { name: 'scrollDrawSequence', desc: 'Chain SVGs — each starts when the last finishes.' },
      { name: 'morphTo',            desc: 'Interpolate one path shape into another.' },
    ],
  },
  {
    label: 'Reveal & animate',
    items: [
      { name: 'scrollAnimate', desc: 'Animate any CSS property on any element.' },
      { name: 'scrollReveal',  desc: 'One-line replacement for AOS and ScrollReveal.js.' },
      { name: 'scrollText',    desc: 'Split text into chars, words or lines and stagger it.' },
    ],
  },
  {
    label: 'Scroll experiences',
    items: [
      { name: 'scrollPin',        desc: 'Pin an element while the page scrolls past it.' },
      { name: 'scrollSnap',       desc: 'Section snapping with easing and callbacks.' },
      { name: 'scrollHorizontal', desc: 'Drive horizontal movement from vertical scroll.' },
      { name: 'scrollParallax',   desc: 'Move an element at a fraction of scroll speed.' },
    ],
  },
  {
    label: 'Media & data',
    items: [
      { name: 'scrollVideo',    desc: 'Tie video currentTime to scroll position.' },
      { name: 'scrollCounter',  desc: 'Count a number up as it scrolls into view.' },
      { name: 'scrollProgress', desc: 'Expose progress as a CSS custom property.' },
    ],
  },
  {
    label: 'Tooling',
    items: [
      { name: 'devtools',   desc: 'Dev-only overlay of every active animation.' },
      { name: 'Lenis bridge', desc: 'Works alongside smooth-scroll libraries.' },
      { name: 'CLI',        desc: 'npx svg-scroll-draw init scaffolds a starting setup.' },
    ],
  },
];

/* ── Page ────────────────────────────────────────────────────────────────── */
export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    <main className="bg-light-linen text-pitch-black overflow-x-hidden">

      {/* ── Nav ───────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-light-linen/95 backdrop-blur-sm border-b border-pitch-black flex items-center justify-between px-4 md:px-12 h-14">
        <span className="font-display font-bold text-sm tracking-tight shrink-0">svg-scroll-draw</span>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-2">
          <ThemeToggle />
          <Link href="/docs" className="text-xs px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-medium whitespace-nowrap">Docs</Link>
          <Link href="/examples" className="text-xs px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-medium whitespace-nowrap">Examples</Link>
          <Link href="/blog" className="text-xs px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-medium whitespace-nowrap">Blog</Link>
          <Link href="/changelog" className="text-xs px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-medium whitespace-nowrap">Changelog</Link>
          <a href={NPM} target="_blank" rel="noopener noreferrer" className="text-xs px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-mono whitespace-nowrap">v2.10.0</a>
          <Link href="/playground" className="text-sm px-4 py-1.5 rounded-full bg-pitch-black text-light-linen hover:bg-graphite-border transition-colors font-medium whitespace-nowrap">Open Playground →</Link>
        </div>

        {/* Mobile / tablet nav */}
        <div className="flex lg:hidden items-center gap-2">
          <ThemeToggle />
          <MobileMenu />
        </div>
      </nav>

      {/* ── 1. Hero + immediate proof ─────────────────────────────────── */}
      <section data-mascot-reset className="relative min-h-[100svh] flex flex-col items-center justify-center px-4 sm:px-6 text-center border-b border-pitch-black dot-grid overflow-hidden">

        {/* Geometric decoration — hidden on small screens to prevent overflow */}
        <div aria-hidden="true" className="hidden sm:block pointer-events-none absolute -top-48 -right-48 w-[700px] h-[700px] rounded-full border border-subtle-ash" />
        <div aria-hidden="true" className="hidden sm:block pointer-events-none absolute -top-24 -right-24 w-[450px] h-[450px] rounded-full border border-subtle-ash opacity-60" />
        <div aria-hidden="true" className="pointer-events-none absolute top-12 right-12 w-4 h-4 rounded-full bg-creator-pink" />
        <div aria-hidden="true" className="pointer-events-none absolute top-28 right-28 w-2 h-2 rounded-full bg-sunshine-yellow" />
        <div aria-hidden="true" className="hidden sm:block pointer-events-none absolute -bottom-32 -left-48 w-[500px] h-[500px] rounded-full border border-subtle-ash opacity-40" />
        <div aria-hidden="true" className="pointer-events-none absolute bottom-24 left-16 w-3 h-3 rounded-full bg-lime-glow" />

        {/* Category label */}
        <div className="relative z-10 inline-flex items-center gap-2 text-[10px] sm:text-[11px] uppercase tracking-[0.18em] sm:tracking-[0.22em] text-graphite-border mb-6 sm:mb-10 border border-subtle-ash bg-light-linen/80 rounded-full px-3 sm:px-4 py-1.5 font-medium">
          <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-creator-pink animate-pulse shrink-0" />
          <span>Open-source scroll animation for the web</span>
        </div>

        {/* Headline — outcome first.
            Sized so the headline holds three lines and the CTA + proof strip
            stay above the fold at 1440×900 — the first viewport has to sell the
            product, not just shout at it. */}
        <h1 className="relative z-10 font-display font-extrabold leading-[0.9] tracking-[-0.04em] mb-5 sm:mb-7"
            style={{ fontSize: 'clamp(34px, 7.4vw, 88px)' }}>
          MAKE THE PAGE<br />
          MOVE AS YOU{' '}
          <span className="relative inline-block">
            <span className="relative z-10 px-2 sm:px-4">SCROLL.</span>
            <span aria-hidden="true" className="absolute inset-0 bg-creator-pink rounded-xl -rotate-[1.2deg]" />
          </span>
        </h1>

        {/* Sub */}
        <p className="relative z-10 text-[15px] sm:text-base md:text-lg text-graphite-border max-w-md sm:max-w-xl mx-auto mb-8 sm:mb-10 leading-relaxed">
          Draw SVG paths, reveal content, animate text, and scrub video with one
          tiny, dependency-free library. React, Vue, Svelte, Solid, Angular,
          Astro, and vanilla JS.
        </p>

        {/* CTAs — one primary, one secondary */}
        <div className="relative z-10 flex flex-col items-center gap-3 mb-10 sm:mb-14 w-full max-w-sm sm:max-w-md px-2">
          <InstallTabs />
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
            <Link
              href="/playground"
              className="flex-1 px-6 py-3 rounded-full bg-pitch-black text-light-linen text-sm font-semibold hover:bg-graphite-border shadow-[2px_2px_0px_#000] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-center"
            >
              Open Playground →
            </Link>
            <Link
              href="/examples"
              className="flex-1 px-6 py-3 rounded-full border border-pitch-black text-sm font-semibold hover:bg-pitch-black hover:text-light-linen transition-colors text-center"
            >
              View examples
            </Link>
          </div>
        </div>

        {/* Technical proof strip — verified, current claims only */}
        <div className="relative z-10 flex flex-wrap items-center justify-center gap-2">
          {[
            ['10 KB', 'gzipped'],
            ['0', 'dependencies'],
            ['SSR', 'safe'],
            ['531 tests', 'passing'],
            ['MIT', 'licensed'],
          ].map(([val, label]) => (
            <div key={val} className="flex items-center gap-1.5 border border-pitch-black bg-light-linen rounded-full px-3 sm:px-4 py-1.5 shadow-[1px_1px_0px_#000]">
              <span className="font-display font-bold text-xs sm:text-sm">{val}</span>
              <span className="text-[11px] sm:text-[12px] text-graphite-border">{label}</span>
            </div>
          ))}
        </div>

        {/* Scroll nudge */}
        <div aria-hidden="true" className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-graphite-border z-10">
          <span className="text-[10px] font-mono uppercase tracking-[0.22em]">scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-subtle-ash to-transparent" />
        </div>

      </section>

      {/* ── Signature demonstration, immediately after the hero ───────── */}
      <ScrollShowcase />

      {/* ── Marquee (brand texture) ───────────────────────────────────── */}
      <div aria-hidden="true" className="bg-creator-pink border-b border-pitch-black py-3 overflow-hidden select-none">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i} className="flex items-center text-[13px] font-display font-bold uppercase tracking-[0.12em] text-pitch-black">
              {item}
              <span className="mx-6 text-pitch-black/30">◆</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── 2. Three reasons to choose it ─────────────────────────────── */}
      <section className="bg-marketplace-gray border-b border-pitch-black px-4 sm:px-6 md:px-12 py-12 sm:py-16 md:py-20">
        <div className="max-w-5xl mx-auto">
          <p className="text-[11px] uppercase tracking-[0.22em] text-graphite-border mb-3 font-medium">Why this one</p>
          <h2 className="font-display font-extrabold text-[clamp(28px,5vw,56px)] leading-[0.95] tracking-[-0.03em] mb-8 sm:mb-12">
            Built for scroll,<br />and nothing else.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-mascot="think">
            {[
              {
                n: '01',
                title: 'Purpose-built for scroll',
                body: 'Triggers, progress, callbacks, playback control, and reduced-motion handling are one consistent API — not a general animation engine you configure into a scroll tool.',
              },
              {
                n: '02',
                title: 'Native when possible',
                body: 'Simple cases run on the compositor via CSS scroll timelines. Anything CSS cannot express falls back to the JS engine automatically. Your code never changes.',
              },
              {
                n: '03',
                title: 'One package, every framework',
                body: 'First-class wrappers for React, Vue, Svelte, Solid, Angular, Astro, and Nuxt, plus vanilla JS and a web component — with zero runtime dependencies.',
              },
            ].map(({ n, title, body }) => (
              <div key={n} className="relative bg-light-linen border border-pitch-black rounded-2xl p-6 overflow-hidden">
                <span aria-hidden="true" className="absolute -top-3 -right-2 text-[110px] font-display font-extrabold text-pitch-black opacity-[0.05] leading-none select-none pointer-events-none">{n}</span>
                <div className="relative">
                  <h3 className="font-display font-bold text-lg mb-3">{title}</h3>
                  <p className="text-sm text-graphite-border leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. Bundle size — measured, not rhetorical ─────────────────── */}
      <section className="relative border-b border-pitch-black px-4 sm:px-6 md:px-12 py-12 sm:py-16 md:py-20 overflow-hidden">
        <BundleGraphLine />
        <div className="max-w-5xl mx-auto">
          <p className="text-[11px] uppercase tracking-[0.22em] text-graphite-border mb-3 font-medium">Bundle size</p>
          <h2 className="font-display font-extrabold text-[clamp(28px,5vw,56px)] leading-[0.95] tracking-[-0.03em] mb-5">
            10 KB for the<br />complete toolkit.
          </h2>
          <p className="text-graphite-border leading-relaxed mb-8 sm:mb-10 text-[15px] max-w-2xl">
            Every library below is good at what it does. If you need a full
            animation platform, GSAP earns its size. This chart is about one
            thing only: what you ship when scroll animation is the job.
          </p>

          <div className="space-y-5">
            {[
              { name: 'svg-scroll-draw', size: '10.0 KB', pct: 21,   color: 'bg-creator-pink',    badge: '✓ yours' },
              { name: 'Framer Motion',   size: '34.3 KB', pct: 72,   color: 'bg-sunshine-yellow', badge: null },
              { name: 'GSAP + ScrollTrigger + DrawSVG', size: '47.5 KB', pct: 100, color: 'bg-[#e0e0e0] dark:bg-[#333]', badge: null },
            ].map(({ name, size, pct, color, badge }) => (
              <div key={name}>
                <div className="flex items-center justify-between mb-2 gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono font-semibold text-[13px] sm:text-sm truncate">{name}</span>
                    {badge && (
                      <span className="text-[10px] font-medium bg-creator-pink text-pitch-black px-2 py-0.5 rounded-full uppercase tracking-wide shrink-0">{badge}</span>
                    )}
                  </div>
                  <span className="font-mono text-[13px] sm:text-sm text-graphite-border shrink-0">{size} gzip</span>
                </div>
                <div className="h-7 bg-marketplace-gray rounded-lg overflow-hidden border border-subtle-ash">
                  <div
                    className={`h-full ${color} rounded-lg`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <p className="mt-6 text-[13px] text-graphite-border">
            Minified + gzipped. GSAP is free to use, DrawSVG included — this is a
            size comparison, not a price one.{' '}
            <Link href="/vs-gsap" className="underline underline-offset-2 hover:text-pitch-black transition-colors whitespace-nowrap">
              Full GSAP comparison →
            </Link>
          </p>
        </div>
      </section>

      {/* ── 4. Native CSS fast path ───────────────────────────────────── */}
      <section className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-12 sm:py-16 md:py-20">
        <div className="max-w-5xl mx-auto">
          <p className="text-[11px] uppercase tracking-[0.22em] text-graphite-border mb-3 font-medium">Performance</p>
          <h2 className="font-display font-extrabold text-[clamp(28px,5vw,56px)] leading-[0.95] tracking-[-0.03em] mb-5">
            Native CSS, with<br />a safety net.
          </h2>
          <p className="text-graphite-border leading-relaxed mb-8 text-[15px] max-w-2xl">
            On Chrome, Edge, and Firefox the simple draw case runs on the compositor via{' '}
            <code className="font-mono text-[13px] bg-marketplace-gray border border-subtle-ash px-1.5 py-0.5 rounded-md">animation-timeline: view()</code>
            {' '}— <strong>zero per-frame JavaScript, no scroll listeners, no rAF loop.</strong>{' '}
            When the browser can&apos;t support it, the library falls back to the JS
            engine automatically. You never change your code.
          </p>

          <div className="grid sm:grid-cols-2 gap-6 mb-6">
            <div className="rounded-2xl border border-pitch-black bg-light-linen p-6 shadow-[2px_2px_0px_#000]">
              <div className="flex items-center gap-2 mb-3">
                <span aria-hidden="true" className="w-2 h-2 rounded-full bg-[#6cc070]" />
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-graphite-border">Native CSS fast path</span>
              </div>
              <p className="text-sm text-graphite-border leading-relaxed mb-3">
                A default or named trigger, a named easing, optional{' '}
                <code className="font-mono text-[12px]">fade</code>, forward or reverse direction.
              </p>
              <CodeBlock filename="native.tsx">
{`<ScrollDraw easing="ease-out" fade>
  <svg>...</svg>
</ScrollDraw>
// ✓ Uses animation-timeline: view()`}
              </CodeBlock>
              <div className="mt-4 flex items-center gap-2">
                <span className="text-[11px] text-graphite-border font-mono">your browser:</span>
                <NativeCSSBadge />
              </div>
            </div>

            <div className="rounded-2xl border border-pitch-black bg-marketplace-gray p-6 shadow-[2px_2px_0px_#000]">
              <div className="flex items-center gap-2 mb-3">
                <span aria-hidden="true" className="w-2 h-2 rounded-full bg-graphite-border" />
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-graphite-border">JS engine (auto fallback)</span>
              </div>
              <p className="text-sm text-graphite-border leading-relaxed mb-3">
                Callbacks, waypoints, stagger, morphing, spring easing, animated
                colour or width, custom containers — anything CSS can&apos;t express
                declaratively.
              </p>
              <CodeBlock filename="js-engine.tsx">
{`<ScrollDraw native={false} easing="spring">
  <svg>...</svg>
</ScrollDraw>
// Forces JS engine regardless of browser`}
              </CodeBlock>
            </div>
          </div>

          <p className="text-[13px] text-graphite-border">
            The full instance API — <code className="font-mono text-[12px]">pause</code>,{' '}
            <code className="font-mono text-[12px]">resume</code>,{' '}
            <code className="font-mono text-[12px]">seek</code>,{' '}
            <code className="font-mono text-[12px]">replay</code>,{' '}
            <code className="font-mono text-[12px]">destroy</code> — works on both paths.{' '}
            <Link href="/docs" className="underline underline-offset-2 hover:text-pitch-black transition-colors">
              Full eligibility rules in the docs →
            </Link>
          </p>
        </div>
      </section>

      {/* ── 5. Flagship demonstrations — three, not fifteen ───────────── */}
      <div id="demos">

        {/* Demo 1 — SVG path drawing, the signature capability */}
        <section data-mascot="draw" className="relative border-b border-pitch-black overflow-hidden">
          <span aria-hidden="true" className="pointer-events-none select-none absolute -right-6 top-1/2 -translate-y-1/2 font-display font-extrabold text-[120px] md:text-[200px] leading-none text-pitch-black opacity-[0.04]">01</span>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-12 py-12 sm:py-16 md:py-24 grid md:grid-cols-2 gap-8 md:gap-16 items-start">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-graphite-border mb-3 font-medium">SVG path drawing</p>
              <h2 className="font-display font-extrabold text-[clamp(28px,4vw,44px)] leading-[1] tracking-[-0.03em] mb-5">
                Drop in.<br />It just works.
              </h2>
              <p className="text-graphite-border leading-relaxed mb-6 text-[15px] break-words">
                Wrap any SVG with <Tag>&lt;ScrollDraw&gt;</Tag>. The engine finds every
                path, measures it, and animates it as it enters the viewport. No
                selectors, no IDs, no configuration.
              </p>
              <CodeBlock filename="index.tsx">
{`import { ScrollDraw } from 'svg-scroll-draw/react';

export default function Hero() {
  return (
    <ScrollDraw>
      <svg>...</svg>
    </ScrollDraw>
  );
}`}
              </CodeBlock>
              <Link href="/examples/logo-reveal" className="inline-block mt-4 text-[13px] font-medium underline underline-offset-2 hover:text-pitch-black transition-colors text-graphite-border">
                See the full example →
              </Link>
            </div>
            <InteractiveScrollDemo defaultEasing="linear" defaultSpeed={1} svgBg="gray">
              <svg width="260" height="260" viewBox="0 0 260 260" fill="none" className="max-w-full h-auto" aria-label="A curve drawing itself from bottom-left to top-right as you scroll" role="img">
                <path d="M 25 235 C 25 115 130 25 235 25" stroke="#ff90e8" strokeWidth="3.5" strokeLinecap="round" />
                <path d="M 25 195 C 25 115 105 45 235 65" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="7 5" opacity="0.25" />
                <circle cx="25" cy="235" r="6" fill="#ff90e8" />
                <circle cx="235" cy="25" r="6" fill="#ff90e8" />
                <circle cx="25" cy="235" r="11" stroke="#ff90e8" strokeWidth="1.5" fill="none" opacity="0.4" />
                <circle cx="235" cy="25" r="11" stroke="#ff90e8" strokeWidth="1.5" fill="none" opacity="0.4" />
              </svg>
            </InteractiveScrollDemo>
          </div>
        </section>

        {/* Demo 2 — general CSS animation: proves it goes beyond SVG */}
        <ScrollAnimateInteractive />

        {/* Demo 3 — text animation: a high-value real-world pattern */}
        <ScrollTextInteractive />

      </div>

      {/* ── 6. Compact API map ────────────────────────────────────────── */}
      <section data-mascot="magic" className="bg-marketplace-gray border-b border-pitch-black px-4 sm:px-6 md:px-12 py-12 sm:py-16 md:py-20">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 sm:gap-8 mb-8 sm:mb-12">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.22em] text-graphite-border mb-3 font-medium">The rest of the toolkit</p>
              <h2 className="font-display font-extrabold text-[clamp(28px,4.2vw,48px)] leading-[0.95] tracking-[-0.03em]">
                Beyond SVG.<br />Animate everything.
              </h2>
            </div>
            <Link href="/docs" className="shrink-0 text-sm px-4 py-2 rounded-full border border-pitch-black hover:bg-pitch-black hover:text-light-linen transition-colors font-medium whitespace-nowrap self-start sm:self-auto">
              Read the docs →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {API_GROUPS.map(({ label, items }) => (
              <div key={label} className="bg-light-linen border border-pitch-black rounded-2xl p-5">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-graphite-border mb-4">{label}</h3>
                <ul className="space-y-3">
                  {items.map(({ name, desc }) => (
                    <li key={name}>
                      <code className="font-mono font-semibold text-[13px] text-pitch-black">{name}</code>
                      <p className="text-[13px] text-graphite-border leading-relaxed mt-0.5">{desc}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p className="mt-8 text-[13px] text-graphite-border">
            Every API above has a runnable example and a full options reference.{' '}
            <Link href="/examples" className="underline underline-offset-2 hover:text-pitch-black transition-colors">
              Browse all 23 examples →
            </Link>
          </p>
        </div>
      </section>

      {/* ── 7. Framework quickstart ───────────────────────────────────── */}
      <section className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-12 sm:py-16 md:py-20">
        <div className="max-w-5xl mx-auto">
          <p className="text-[11px] uppercase tracking-[0.22em] text-graphite-border mb-3 font-medium">Quickstart</p>
          <h2 className="font-display font-extrabold text-[clamp(28px,5vw,56px)] leading-[0.95] tracking-[-0.03em] mb-8 sm:mb-12">
            Works everywhere<br />you do.
          </h2>
          <FrameworkTabs />
        </div>
      </section>

      {/* ── 8. Credibility and comparison ─────────────────────────────── */}
      <LiveStats />

      <section className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-12 sm:py-16">
        <div className="max-w-5xl mx-auto">
          <p className="text-[11px] uppercase tracking-[0.22em] text-graphite-border mb-3 font-medium">Compare</p>
          <h2 className="font-display font-extrabold text-[clamp(24px,4vw,40px)] leading-[1] tracking-[-0.03em] mb-3">
            Choose the tool that<br />matches the job.
          </h2>
          <p className="text-graphite-border leading-relaxed mb-8 text-[15px] max-w-2xl">
            Honest, side-by-side breakdowns — including the cases where another
            library is the better answer.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <div className="space-y-2">
                {[
                  { href: '/vs-gsap',          label: 'svg-scroll-draw vs GSAP',  sub: 'bundle, license, feature matrix' },
                  { href: '/vs-aos',           label: 'vs AOS + ScrollReveal.js', sub: 'no data attributes, typed API' },
                  { href: '/vs-framer-motion', label: 'vs Framer Motion',         sub: '3× smaller, framework-agnostic' },
                ].map(({ href, label, sub }) => (
                  <Link key={href} href={href} className="flex items-center justify-between p-4 rounded-xl border border-subtle-ash hover:border-pitch-black hover:shadow-[2px_2px_0_#000] transition-all bg-white group">
                    <div>
                      <p className="font-semibold text-sm group-hover:underline underline-offset-2">{label}</p>
                      <p className="text-[12px] font-mono text-graphite-border mt-0.5">{sub}</p>
                    </div>
                    <span aria-hidden="true" className="text-graphite-border group-hover:text-pitch-black transition-colors">→</span>
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <div className="space-y-2">
                {[
                  { href: '/react-scroll-animation',   label: 'React scroll animations',   sub: 'components, hooks, patterns' },
                  { href: '/nextjs-scroll-animation',  label: 'Next.js scroll animations', sub: 'App Router, SSR-safe, dynamic import' },
                  { href: '/verify',                   label: 'Verify every claim',        sub: 'reproducible size and test proofs' },
                ].map(({ href, label, sub }) => (
                  <Link key={href} href={href} className="flex items-center justify-between p-4 rounded-xl border border-subtle-ash hover:border-pitch-black hover:shadow-[2px_2px_0_#000] transition-all bg-white group">
                    <div>
                      <p className="font-semibold text-sm group-hover:underline underline-offset-2">{label}</p>
                      <p className="text-[12px] font-mono text-graphite-border mt-0.5">{sub}</p>
                    </div>
                    <span aria-hidden="true" className="text-graphite-border group-hover:text-pitch-black transition-colors">→</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 9. Final CTA ──────────────────────────────────────────────── */}
      <section data-mascot="big-dance" className="relative bg-sunshine-yellow border-b border-pitch-black px-4 sm:px-6 md:px-12 py-16 sm:py-20 md:py-24 text-center overflow-hidden">
        <CtaBoldMark />
        <h2 className="font-display font-extrabold leading-[0.9] tracking-[-0.04em] mb-6 sm:mb-8 text-pitch-black"
            style={{ fontSize: 'clamp(30px,7vw,84px)' }}>
          BUILD YOUR FIRST<br />SCROLL ANIMATION<br />IN TWO MINUTES.
        </h2>
        <div className="flex flex-col items-center justify-center gap-3 w-full max-w-sm mx-auto sm:max-w-none sm:flex-row sm:flex-wrap">
          <Link
            href="/playground"
            className="px-6 py-3 rounded-full bg-pitch-black text-light-linen text-sm font-semibold hover:bg-graphite-border transition-colors shadow-[3px_3px_0px_rgba(0,0,0,0.3)] w-full sm:w-auto text-center"
          >
            Open Playground →
          </Link>
          <div className="flex items-center gap-2 border-2 border-pitch-black text-pitch-black rounded-full px-5 py-3 text-sm font-mono w-full sm:w-auto justify-center">
            <span aria-hidden="true" className="opacity-50">$</span>
            <span>npm i svg-scroll-draw</span>
            <CopyButton text="npm i svg-scroll-draw" />
          </div>
          <Link
            href="/docs"
            className="px-5 py-3 rounded-full border-2 border-pitch-black bg-transparent text-pitch-black text-sm font-semibold hover:bg-pitch-black hover:text-sunshine-yellow transition-colors w-full sm:w-auto text-center"
          >
            Read the docs →
          </Link>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="px-4 sm:px-6 md:px-12 py-8 border-t border-subtle-ash">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
          <span className="font-display font-bold text-sm tracking-tight">svg-scroll-draw</span>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 text-[13px] text-graphite-border">
            <span>MIT License</span>
            <span aria-hidden="true" className="text-subtle-ash">·</span>
            <span>10 KB gzipped</span>
            <span aria-hidden="true" className="text-subtle-ash">·</span>
            <span>Zero dependencies</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
            <Link
              href="/examples"
              className="text-[12px] font-medium px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors"
            >
              Examples
            </Link>
            <a
              href={GH}
              target="_blank" rel="noopener noreferrer"
              className="text-[12px] font-medium px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors flex items-center gap-1.5"
            >
              <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              GitHub
            </a>
            <a
              href={NPM}
              target="_blank" rel="noopener noreferrer"
              className="text-[12px] font-medium px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors flex items-center gap-1.5"
            >
              <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M0 0v24h24V0H0zm19.2 19.2H4.8V4.8h14.4v14.4zm-9.6-9.6v4.8H7.2V7.2h9.6v7.2h-4.8V9.6h-2.4z"/>
              </svg>
              npm
            </a>
            <a
              href="https://www.producthunt.com/products/svg-scroll-draw?utm_source=embed&utm_medium=post_embed"
              target="_blank" rel="noopener noreferrer"
              className="text-[12px] font-medium px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors"
            >
              Product Hunt
            </a>
            <span className="text-[12px] font-mono text-graphite-border">v2.10.0</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-subtle-ash text-center text-[12px] text-graphite-border font-mono">
          built by{' '}
          <a
            href="https://github.com/DhruvilChauahan0210"
            target="_blank" rel="noopener noreferrer"
            className="hover:text-pitch-black transition-colors underline underline-offset-2"
          >
            dhruvil0210
          </a>
        </div>
      </footer>

    </main>
    </>
  );
}
