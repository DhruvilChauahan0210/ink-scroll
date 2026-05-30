import type { Metadata } from 'next';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import { MobileMenu } from '@/components/MobileMenu';

const OG_IMAGE = 'https://svg-scroll-draw.vercel.app/opengraph-image';

export const metadata: Metadata = {
  title: 'Changelog — Release History',
  description:
    'Complete release history for svg-scroll-draw, the scroll-driven SVG path animation library. Track what shipped in each version, including native CSS scroll animation support.',
  alternates: { canonical: '/changelog' },
  openGraph: {
    title: 'Changelog — svg-scroll-draw',
    description:
      'Complete release history for svg-scroll-draw. Native CSS scroll animation, stroke-dashoffset, React/Vue/Svelte support and more.',
    url: 'https://svg-scroll-draw.vercel.app/changelog',
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: 'svg-scroll-draw Changelog' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Changelog — svg-scroll-draw',
    description:
      'Complete release history for svg-scroll-draw. Native CSS scroll animation, React/Vue/Svelte/Nuxt support.',
    images: [OG_IMAGE],
  },
};

const GH  = 'https://github.com/DhruvilChauahan0210/ink-scroll';
const NPM = 'https://www.npmjs.com/package/svg-scroll-draw';

const RELEASES = [
  {
    version: '1.1.0',
    date: 'May 2026',
    tag: 'Latest',
    tagColor: 'bg-creator-pink',
    items: [
      { type: 'new', text: 'Native CSS scroll-driven rendering — on supporting browsers (Chrome, Edge, Firefox) the simple draw case runs on the compositor via animation-timeline: view() with zero per-frame JavaScript and no scroll/resize listeners' },
      { type: 'new', text: 'native option (default true) — automatically uses the CSS fast path when eligible; pass false to always use the JS engine. The full instance API works on both paths' },
      { type: 'new', text: '221 passing tests across 7 suites — engine-native.test.ts added to cover the native CSS path and fallback logic' },
      { type: 'fix', text: 'Bundle size claim corrected to ~4.4 KB gzipped across all docs (stale "<3 KB" figure removed)' },
    ],
  },
  {
    version: '1.0.0',
    date: 'May 2026',
    tag: null,
    tagColor: '',
    items: [
      { type: 'fix', text: 'scrollDrawSequence chain was broken — engines now created upfront and paused; each step resumes only when the previous fires onComplete. activeIdx tracks correctly so pause/resume/seek/getProgress always target the active step.' },
      { type: 'new', text: '194 passing tests across 6 suites — engine, engine-options, group, timeline, framework wrappers (Angular, Astro, Svelte, Solid), and utilities' },
      { type: 'new', text: 'Framework wrapper tests — Angular ScrollDrawRef, Astro initScrollDraw, Svelte scrollDraw action + createScrollDraw, Solid useScrollDraw + createScrollDraw' },
      { type: 'new', text: 'Root workspace test runner — npx vitest run from the repo root works via vitest.workspace.ts' },
      { type: 'new', text: 'CI coverage threshold enforcement — Node 20 + 22 matrix' },
      { type: 'new', text: 'JSDoc improvements — clip, morphTo, and scrollDrawSequence document their non-obvious edge cases inline' },
    ],
  },
  {
    version: '0.7.0',
    date: 'May 2026',
    tag: null,
    tagColor: '',
    items: [
      { type: 'new', text: 'createSpring({ tension, friction }) — parameterize the spring easing instead of the hardcoded preset' },
      { type: 'new', text: 'svg-scroll-draw/timeline — scrollDrawTimeline API for independent per-track scroll windows within a single range' },
      { type: 'new', text: '--scroll-draw-progress CSS custom property — set on the container every frame, drive CSS animations without JS callbacks' },
      { type: 'new', text: 'Docs page (/docs) — full API reference with sidebar navigation and IntersectionObserver-based active tracking' },
      { type: 'new', text: 'Group & Sequence demos on the examples page' },
      { type: 'new', text: 'Timeline API demo on the examples page' },
    ],
  },
  {
    version: '0.6.2',
    date: 'May 2026',
    tag: null,
    tagColor: '',
    items: [
      { type: 'new', text: 'fillOpacity — animate fill opacity in sync with the stroke draw. Use [0, 1] to flood a fill as the outline traces itself' },
      { type: 'new', text: 'useScrollDrawProgress React hook — reactive 0–1 scroll progress for any element, same trigger/easing API' },
      { type: 'new', text: 'svg-scroll-draw/web-component subpath export — <scroll-draw> importable directly, not just via CDN' },
    ],
  },
  {
    version: '0.6.0',
    date: 'May 2026',
    tag: null,
    tagColor: '',
    items: [
      { type: 'new', text: 'Pause / Resume / Seek — full imperative playback control on every instance' },
      { type: 'new', text: 'Path Morphing (morphTo) — interpolate a path\'s d attribute to a target shape on scroll' },
      { type: 'new', text: 'Velocity Scale (velocityScale) — draw speed scales with scroll speed' },
      { type: 'new', text: 'Repeat / RepeatDelay — replay N times or loop infinitely' },
      { type: 'new', text: 'Astro adapter (svg-scroll-draw/astro) — data-attribute API with initScrollDraw()' },
      { type: 'new', text: 'Nuxt adapter (svg-scroll-draw/nuxt) — useScrollDraw() composable for Nuxt 3' },
      { type: 'new', text: 'Group API (svg-scroll-draw/group) — scrollDrawGroup and scrollDrawSequence' },
      { type: 'new', text: 'Web Component — <scroll-draw> custom element, auto-registers via CDN' },
    ],
  },
  {
    version: '0.4.0',
    date: 'May 2026',
    tag: null,
    tagColor: '',
    items: [
      { type: 'new', text: 'Solid.js adapter (svg-scroll-draw/solid) — useScrollDraw and createScrollDraw hooks' },
      { type: 'new', text: 'Angular adapter (svg-scroll-draw/angular) — ScrollDrawRef class for AfterViewInit lifecycle' },
      { type: 'new', text: 'Stroke color animation (strokeColor) — static or [from, to] interpolation' },
      { type: 'new', text: 'Stroke width animation (strokeWidth) — static or [from, to] interpolation' },
      { type: 'new', text: 'Auto Reverse (autoReverse) — follows scroll direction automatically' },
      { type: 'new', text: 'Custom scroll container (scrollContainer)' },
      { type: 'new', text: 'Waypoints — fire callbacks at specific 0–1 progress thresholds' },
      { type: 'new', text: 'Delay option — milliseconds before the engine starts observing' },
    ],
  },
  {
    version: '0.3.0',
    date: 'May 2026',
    tag: null,
    tagColor: '',
    items: [
      { type: 'new', text: 'Svelte adapter (svg-scroll-draw/svelte) — use:scrollDraw action and createScrollDraw' },
      { type: 'new', text: 'Horizontal scroll support (axis: "x")' },
      { type: 'new', text: 'Replay API — instance.replay() to re-trigger imperatively' },
      { type: 'new', text: 'Spring easing — physics-based overshoot-and-settle curve' },
      { type: 'new', text: 'Once mode (once) — draw once and stay drawn' },
      { type: 'new', text: 'Debug overlay (debug) — visualizes trigger zones in dev mode' },
      { type: 'new', text: 'onStart lifecycle hook' },
    ],
  },
  {
    version: '0.2.0',
    date: 'May 2026',
    tag: null,
    tagColor: '',
    items: [
      { type: 'new', text: 'Vue 3 adapter (svg-scroll-draw/vue) — <ScrollDraw> component and useScrollDraw composable' },
      { type: 'new', text: 'SVG Playground at /playground — live SVG editor with all options' },
      { type: 'new', text: 'Interactive demo with easing and speed controls' },
      { type: 'fix', text: 'OpenGraph and Twitter preview card image URLs' },
    ],
  },
  {
    version: '0.1.0',
    date: 'May 2026',
    tag: 'Initial release',
    tagColor: 'bg-lime-glow',
    items: [
      { type: 'new', text: 'Core scrollDraw() function — zero dependencies, ~3 KB gzipped' },
      { type: 'new', text: 'React wrapper (svg-scroll-draw/react) — <ScrollDraw> component' },
      { type: 'new', text: 'Easing curves — linear, ease-in, ease-out, ease-in-out' },
      { type: 'new', text: 'Trigger system — element/viewport anchor strings' },
      { type: 'new', text: 'Stagger, fade, direction, once, speed options' },
      { type: 'new', text: 'IntersectionObserver viewport culling' },
      { type: 'new', text: 'SSR safe — window guards, Next.js App Router compatible' },
      { type: 'new', text: 'rect and circle support via perimeter approximation' },
      { type: 'new', text: 'CDN IIFE bundle at dist/cdn/svg-scroll-draw.global.js' },
    ],
  },
] as const;

export default function ChangelogPage() {
  return (
    <div className="bg-light-linen text-pitch-black min-h-screen">

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-light-linen/95 backdrop-blur-sm border-b border-pitch-black flex items-center justify-between px-4 md:px-12 h-14">
        <Link href="/" className="font-display font-bold text-sm tracking-tight shrink-0">svg-scroll-draw</Link>

        {/* Desktop */}
        <div className="hidden lg:flex items-center gap-2">
          <ThemeToggle />
          <Link href="/docs" className="text-xs px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-medium whitespace-nowrap">Docs</Link>
          <Link href="/examples" className="text-xs px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-medium whitespace-nowrap">Examples</Link>
          <Link href="/playground" className="text-xs px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-medium whitespace-nowrap">⚡ Playground</Link>
          <a href={NPM} target="_blank" rel="noopener noreferrer" className="text-xs px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-mono whitespace-nowrap">v1.1.0</a>
          <a href={GH} target="_blank" rel="noopener noreferrer" className="text-sm px-4 py-1.5 rounded-full bg-pitch-black text-light-linen hover:bg-graphite-border transition-colors font-medium whitespace-nowrap">GitHub →</a>
        </div>

        {/* Mobile / tablet */}
        <div className="flex lg:hidden items-center gap-2">
          <ThemeToggle />
          <MobileMenu />
        </div>
      </nav>

      {/* Header */}
      <section className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-12 sm:py-16">
        <div className="max-w-3xl mx-auto">
          <p className="text-[11px] uppercase tracking-[0.22em] text-graphite-border mb-3 font-medium">Release history</p>
          <h1 className="font-display font-extrabold text-[clamp(36px,7vw,80px)] leading-[0.92] tracking-[-0.04em] mb-4">
            Changelog
          </h1>
          <p className="text-base text-graphite-border">
            Every release of <code className="font-mono text-pitch-black text-sm bg-marketplace-gray border border-subtle-ash px-1.5 py-0.5 rounded-md">svg-scroll-draw</code>, newest first.
          </p>
        </div>
      </section>

      {/* Releases */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-12 py-10 sm:py-12 space-y-0">
        {RELEASES.map((release, i) => (
          <div key={release.version} className="relative flex gap-4 sm:gap-6 md:gap-10 pb-10 sm:pb-12">
            {/* Timeline line */}
            {i < RELEASES.length - 1 && (
              <div className="absolute left-[13px] top-8 bottom-0 w-px bg-subtle-ash" />
            )}

            {/* Dot */}
            <div className="relative flex flex-col items-center shrink-0 pt-1">
              <div className={`w-7 h-7 rounded-full border-2 border-pitch-black flex items-center justify-center ${release.tag ? 'bg-pitch-black' : 'bg-light-linen'}`}>
                {release.tag && <div className="w-2 h-2 rounded-full bg-creator-pink" />}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <a
                  href={`${NPM}/v/${release.version}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-display font-extrabold text-xl tracking-tight hover:underline"
                >
                  v{release.version}
                </a>
                {release.tag && (
                  <span className={`text-[10px] font-bold uppercase tracking-[0.14em] px-2.5 py-0.5 rounded-full ${release.tagColor} text-pitch-black`}>
                    {release.tag}
                  </span>
                )}
                <span className="text-[11px] font-mono text-graphite-border">{release.date}</span>
              </div>

              <ul className="space-y-2">
                {release.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2.5 text-sm">
                    <span className={`mt-0.5 shrink-0 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full font-mono ${
                      item.type === 'new' ? 'bg-lime-glow/40 text-pitch-black' : 'bg-creator-pink/30 text-pitch-black'
                    }`}>
                      {item.type === 'new' ? 'new' : 'fix'}
                    </span>
                    <span className="text-graphite-border leading-relaxed">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <footer className="border-t border-subtle-ash px-6 md:px-12 py-6 text-center text-[11px] font-mono text-graphite-border">
        svg-scroll-draw · MIT · ~4.4 KB gzipped ·{' '}
        <a href={GH} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-pitch-black transition-colors">
          GitHub
        </a>
      </footer>
    </div>
  );
}
