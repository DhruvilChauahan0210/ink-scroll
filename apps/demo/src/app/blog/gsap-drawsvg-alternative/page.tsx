import type { Metadata } from 'next';
import { RelatedResources } from '@/components/RelatedResources';
import Link from 'next/link';
import { MobileMenu } from '@/components/MobileMenu';

export const metadata: Metadata = {
  title: 'GSAP DrawSVG Alternative — 10 KB vs 40 KB, Zero Deps',
  description:
    'Detailed comparison of svg-scroll-draw and GSAP DrawSVG for scroll-driven SVG path animation. Bundle size, dependency count, native CSS fast path, React/Vue/Svelte support, and a migration guide.',
  keywords: [
    'gsap drawsvg alternative',
    'svg scroll animation without gsap',
    'lightweight gsap drawsvg alternative',
    'svg-scroll-draw vs gsap',
    'gsap scrolltrigger alternative',
    'svg path animation scroll react',
    'drawsvg bundle size',
    'scroll driven svg animation library',
    'gsap drawsvg react alternative',
  ],
  alternates: { canonical: '/blog/gsap-drawsvg-alternative' },
  openGraph: {
    title: 'GSAP DrawSVG Alternative — 10 KB vs 40 KB, Zero Deps',
    description:
      '~10 KB, MIT, zero deps. A detailed comparison and drop-in alternative to GSAP DrawSVG + ScrollTrigger.',
    url: 'https://svg-scroll-draw.vercel.app/blog/gsap-drawsvg-alternative',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GSAP DrawSVG Alternative — 10 KB vs 40 KB, Zero Deps',
    description: '~10 KB, MIT, zero deps. Drop-in alternative to GSAP DrawSVG + ScrollTrigger.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'svg-scroll-draw vs GSAP DrawSVG — Free Alternative',
  description:
    'Detailed comparison of svg-scroll-draw and GSAP DrawSVG for scroll-driven SVG path animation. Bundle size, license costs, React/Vue/Svelte support, and a migration guide.',
  author: { '@type': 'Person', name: 'Dhruvil Chauhan' },
  datePublished: '2026-05-30',
  url: 'https://svg-scroll-draw.vercel.app/blog/gsap-drawsvg-alternative',
  about: [
    { '@type': 'SoftwareApplication', name: 'svg-scroll-draw' },
    { '@type': 'SoftwareApplication', name: 'GSAP DrawSVG' },
  ],
};

function Check() {
  return <span className="text-[#22c55e] font-bold text-base">✓</span>;
}
function Cross() {
  return <span className="text-[#ef4444] font-bold text-base">✗</span>;
}
function Dash() {
  return <span className="text-graphite-border">—</span>;
}

function Code({ filename, children }: { filename?: string; children: string }) {
  return (
    <div className="rounded-xl overflow-hidden border border-[#333] text-sm">
      {filename && (
        <div className="bg-[#111] px-4 py-2 text-[11px] font-mono text-[#888] border-b border-[#333]">
          {filename}
        </div>
      )}
      <pre className="bg-[#1a1a1a] text-[#e8e8e3] text-[10px] sm:text-[11.5px] font-mono leading-[1.8] px-4 sm:px-5 py-4 overflow-x-auto whitespace-pre">
        {children}
      </pre>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] uppercase tracking-[0.22em] text-graphite-border mb-4 font-medium">
      {children}
    </p>
  );
}

const BUNDLE_BARS = [
  { label: 'svg-scroll-draw', size: '~10 KB', pct: 22,  color: '#ff90e8' },
  { label: 'GSAP + ScrollTrigger + DrawSVG', size: '~40 KB', pct: 100, color: '#ef4444' },
  { label: 'Framer Motion', size: '~35 KB', pct: 87,  color: '#f59e0b' },
];

const FEATURES = [
  { feature: 'License',               ours: 'MIT — fork and redistribute freely', theirs: 'Free to use; own terms restrict redistribution', ourWin: true },
  { feature: 'Bundle size (gzipped)', ours: '~10 KB',                           theirs: '~40 KB (gsap + ScrollTrigger + DrawSVG)',              ourWin: true },
  { feature: 'Dependencies',          ours: 'Zero',                              theirs: '3 packages to install and register',                   ourWin: true },
  { feature: 'Native CSS fast path',  ours: 'Yes — compositor-driven on Chrome/FF 115+', theirs: 'No — JS only',                                ourWin: true },
  { feature: 'React component',       ours: '<ScrollDraw> + useScrollDraw hook', theirs: 'useEffect/useRef boilerplate every time',              ourWin: true },
  { feature: 'Vue 3',                 ours: '<ScrollDraw> + useScrollDraw composable', theirs: 'Manual setup, no official wrapper',            ourWin: true },
  { feature: 'Svelte',                ours: 'use:scrollDraw action',             theirs: 'Manual setup',                                        ourWin: true },
  { feature: 'Solid.js',             ours: 'useScrollDraw + createScrollDraw',   theirs: 'Manual setup',                                        ourWin: true },
  { feature: 'Angular / Nuxt / Astro', ours: 'First-class wrappers',            theirs: 'Manual setup',                                        ourWin: true },
  { feature: 'stagger',               ours: 'Built-in option',                   theirs: 'gsap.utils.toArray() + per-element delay',             ourWin: true },
  { feature: 'morphTo',               ours: 'Built-in option',                   theirs: 'MorphSVGPlugin — free, but another package',           ourWin: true },
  { feature: 'CSS custom property',   ours: '--scroll-draw-progress on every frame', theirs: 'Manual onUpdate callback',                       ourWin: true },
  { feature: 'Sequence API',          ours: 'scrollDrawSequence()',              theirs: 'Complex ScrollTrigger chaining',                       ourWin: true },
  { feature: 'Group API',             ours: 'scrollDrawGroup()',                  theirs: 'Manually share trigger across multiple tweens',         ourWin: true },
  { feature: 'Physics easings',        ours: 'spring, bounce, elastic built-in + factory fns', theirs: 'Bounce, Elastic, CustomEase — all free, separate imports',  ourWin: true },
  { feature: 'Timeline API',          ours: 'scrollDrawTimeline() — independent track windows', theirs: 'Yes — GSAP timeline is its strength',    ourWin: false },
  { feature: 'Complex multi-element timelines', ours: 'Scroll-draw scope only', theirs: 'Yes — GSAP excels here',                              ourWin: false },
  { feature: 'Non-SVG animations',    ours: 'clip reveal only',                  theirs: 'Yes — text, DOM, anything',                            ourWin: false },
  { feature: 'SSR safe',              ours: 'Yes — observers skip on server',    theirs: 'Needs manual typeof window guards',                    ourWin: true },
  { feature: 'TypeScript',            ours: 'Full types included',               theirs: 'Full types included',                                  ourWin: null },
];

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="bg-light-linen text-pitch-black min-h-screen">

        {/* Nav */}
        <nav className="sticky top-0 z-50 bg-light-linen/95 backdrop-blur-sm border-b border-pitch-black flex items-center justify-between px-4 md:px-12 h-14">
          <Link href="/" className="font-display font-bold text-sm tracking-tight hover:opacity-70 transition-opacity shrink-0">
            svg-scroll-draw
          </Link>
          <div className="hidden lg:flex items-center gap-2">
            <Link href="/" className="text-xs px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-medium">Home</Link>
            <Link href="/docs" className="text-xs px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-medium">Docs</Link>
            <Link href="/examples" className="text-xs px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-medium">Examples</Link>
            <Link href="/blog" className="text-xs px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-medium">Blog</Link>
            <Link href="/playground" className="text-xs px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-medium">⚡ Playground</Link>
          </div>
          <div className="flex lg:hidden">
            <MobileMenu />
          </div>
        </nav>

        {/* Hero */}
        <section className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-12 sm:py-16 md:py-20">
          <div className="max-w-4xl mx-auto">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 mb-6 text-[11px] font-mono text-graphite-border">
              <Link href="/" className="hover:text-pitch-black transition-colors">svg-scroll-draw</Link>
              <span>/</span>
              <span>blog</span>
              <span>/</span>
              <span className="text-pitch-black">comparison</span>
            </div>

            <SectionLabel>GSAP DrawSVG Alternative · May 2026 · 6 min read</SectionLabel>

            <h1 className="font-display font-extrabold text-[clamp(28px,5.5vw,64px)] leading-[0.92] tracking-[-0.04em] mb-6">
              svg-scroll-draw<br />
              vs GSAP DrawSVG
            </h1>

            <p className="text-base sm:text-lg text-graphite-border max-w-2xl leading-relaxed mb-8">
              GSAP DrawSVG is powerful, and since 2025 it&apos;s free for everyone — so this isn&apos;t a price argument.
              It does still cost you ~40 KB, three packages to register, and boilerplate in every framework.
              Here&apos;s a complete comparison, side-by-side code, and a migration guide.
            </p>

            {/* Quick stats */}
            <div className="flex flex-wrap gap-3">
              {[
                { label: 'svg-scroll-draw', value: '~10 KB', sub: 'gzipped', color: '#ff90e8' },
                { label: 'GSAP stack',       value: '~40 KB',  sub: 'gzipped', color: '#ef4444' },
                { label: 'svg-scroll-draw', value: 'MIT',     sub: 'license',  color: '#22c55e' },
                { label: 'GSAP DrawSVG',    value: 'Paid',    sub: 'commercial', color: '#f59e0b' },
              ].map((s, i) => (
                <div key={i} className="border border-pitch-black rounded-xl px-4 py-3 bg-white">
                  <p className="text-[10px] font-mono text-graphite-border mb-0.5">{s.label}</p>
                  <p className="font-display font-extrabold text-xl leading-none" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-[10px] font-mono text-graphite-border mt-0.5">{s.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* At a glance */}
        <section className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-12 sm:py-14 bg-marketplace-gray">
          <div className="max-w-4xl mx-auto">
            <SectionLabel>At a glance</SectionLabel>
            <h2 className="font-display font-extrabold text-[clamp(22px,4vw,42px)] leading-[1] tracking-[-0.03em] mb-8">
              The short version
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {/* svg-scroll-draw card */}
              <div className="bg-white rounded-2xl border-2 border-[#22c55e] p-6 shadow-[3px_3px_0px_#22c55e]">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-[#22c55e]" />
                  <p className="font-display font-extrabold text-lg">svg-scroll-draw</p>
                </div>
                <ul className="space-y-2 text-sm">
                  {[
                    '~10 KB gzipped — 4× smaller than GSAP',
                    'MIT — free for commercial use, forever',
                    'Zero dependencies',
                    'Native CSS fast path (Chrome/FF 115+)',
                    'First-class React, Vue, Svelte, Solid, Angular, Nuxt, Astro wrappers',
                    'stagger, morphTo, Sequence, Group, Timeline — all built in',
                    'SSR-safe out of the box',
                  ].map(item => (
                    <li key={item} className="flex items-start gap-2">
                      <Check />
                      <span className="text-[13px] leading-snug">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* GSAP card */}
              <div className="bg-white rounded-2xl border border-subtle-ash p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-[#888]" />
                  <p className="font-display font-extrabold text-lg text-graphite-border">GSAP DrawSVG</p>
                </div>
                <ul className="space-y-2">
                  {[
                    { ok: false, text: '~40 KB (gsap + ScrollTrigger + DrawSVG)' },
                    { ok: false, text: '3 packages, plugin registration boilerplate' },
                    { ok: false, text: 'JS only — no native CSS path' },
                    { ok: false, text: 'No framework wrappers — useEffect + useRef every time in React' },
                    { ok: false, text: 'Path morphing needs MorphSVGPlugin — free, but another import' },
                    { ok: true,  text: 'Unmatched for complex multi-element timelines (non-SVG)' },
                  ].map(item => (
                    <li key={item.text} className="flex items-start gap-2">
                      {item.ok ? <Check /> : <Cross />}
                      <span className="text-[13px] leading-snug text-graphite-border">{item.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Licensing */}
        <section className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-12 sm:py-14">
          <div className="max-w-4xl mx-auto">
            <SectionLabel>Licensing</SectionLabel>
            <h2 className="font-display font-extrabold text-[clamp(22px,4vw,42px)] leading-[1] tracking-[-0.03em] mb-6">
              The real cost of GSAP DrawSVG
            </h2>
            <div className="prose-like max-w-2xl space-y-4 text-[15px] text-graphite-border leading-relaxed">
              <p>
                It is not money. <strong className="text-pitch-black">GSAP is free</strong> — Webflow acquired GreenSock
                and released the whole toolset, DrawSVG and MorphSVG included, at no charge in 2025. If you have read an
                older comparison that says otherwise, including an earlier version of this post, it is out of date.
              </p>
              <p>
                The cost is <strong className="text-pitch-black">bytes and setup</strong>. To draw one path on scroll you
                install three packages, call <code className="font-mono text-[0.9em]">gsap.registerPlugin()</code>, and
                ship ~40 KB gzipped — for an effect that is fundamentally one animated{' '}
                <code className="font-mono text-[0.9em]">stroke-dashoffset</code>.
              </p>
              <p>
                The one licence difference worth knowing is narrow: <strong className="text-pitch-black">svg-scroll-draw is MIT</strong>,
                so you can fork it, bundle it and redistribute it inside your own library. GSAP&apos;s licence is free-of-charge
                but has its own terms around redistribution in a competing product — read them yourself rather than take our word for it.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <div className="bg-[#fff0fb] border border-[#ff90e8] rounded-xl px-4 py-3 text-sm">
                <p className="font-semibold text-pitch-black mb-0.5">svg-scroll-draw</p>
                <p className="font-mono text-xs text-graphite-border">MIT · ~10 KB · zero deps</p>
              </div>
              <div className="bg-marketplace-gray/40 border border-subtle-ash rounded-xl px-4 py-3 text-sm">
                <p className="font-semibold text-pitch-black mb-0.5">GSAP DrawSVG</p>
                <p className="font-mono text-xs text-graphite-border">Free · ~40 KB · 3 packages</p>
              </div>
            </div>
          </div>
        </section>

        {/* Bundle size */}
        <section className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-12 sm:py-14 bg-marketplace-gray">
          <div className="max-w-4xl mx-auto">
            <SectionLabel>Bundle size</SectionLabel>
            <h2 className="font-display font-extrabold text-[clamp(22px,4vw,42px)] leading-[1] tracking-[-0.03em] mb-8">
              4× smaller than GSAP
            </h2>
            <div className="space-y-4">
              {BUNDLE_BARS.map(b => (
                <div key={b.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium">{b.label}</span>
                    <span className="text-sm font-mono font-bold" style={{ color: b.color }}>{b.size}</span>
                  </div>
                  <div className="h-8 bg-[#e8e8e3] rounded-lg overflow-hidden">
                    <div
                      className="h-full rounded-lg transition-all"
                      style={{ width: `${b.pct}%`, background: b.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-6 text-[13px] text-graphite-border">
              GSAP stack includes gsap core (~27 KB) + ScrollTrigger (~7 KB) + DrawSVG plugin.
              On Chrome/Edge/Firefox 115+ svg-scroll-draw also offloads the simple draw case to the browser&apos;s native CSS compositor — zero per-frame JavaScript.
            </p>
          </div>
        </section>

        {/* Code comparison */}
        <section className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-12 sm:py-14">
          <div className="max-w-5xl mx-auto">
            <SectionLabel>Code comparison</SectionLabel>
            <h2 className="font-display font-extrabold text-[clamp(22px,4vw,42px)] leading-[1] tracking-[-0.03em] mb-8">
              Same animation, both libraries
            </h2>

            <h3 className="font-display font-bold text-xl mb-4">Vanilla JS</h3>
            <div className="grid lg:grid-cols-2 gap-4 mb-10">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#ef4444] font-medium mb-2">GSAP DrawSVG</p>
                <Code filename="hero.js">{`// 3 imports, plugin registration required
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'; // paid

gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin);

gsap.fromTo(
  '#logo path',
  { drawSVG: '0%' },
  {
    drawSVG: '100%',
    ease: 'power2.out',
    scrollTrigger: {
      trigger: '#logo',
      start: 'top 80%',
      end: 'top 20%',
      scrub: true,
    },
  }
);`}</Code>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#22c55e] font-medium mb-2">svg-scroll-draw</p>
                <Code filename="hero.js">{`// 1 import, zero config
import { scrollDraw } from 'svg-scroll-draw';

scrollDraw('#logo', {
  easing: 'ease-out',
  trigger: { start: 'top 80%', end: 'top 20%' },
});`}</Code>
              </div>
            </div>

            <h3 className="font-display font-bold text-xl mb-4">React</h3>
            <div className="grid lg:grid-cols-2 gap-4 mb-10">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#ef4444] font-medium mb-2">GSAP DrawSVG</p>
                <Code filename="Logo.tsx">{`import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';

gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin);

function Logo() {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('path', { drawSVG: '0%' }, {
        drawSVG: '100%',
        ease: 'power2.out',
        scrollTrigger: {
          trigger: ref.current,
          start: 'top 80%',
          end: 'top 20%',
          scrub: true,
        },
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  return <svg ref={ref}>…</svg>;
}`}</Code>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#22c55e] font-medium mb-2">svg-scroll-draw</p>
                <Code filename="Logo.tsx">{`import { ScrollDraw } from 'svg-scroll-draw/react';

function Logo() {
  return (
    <ScrollDraw
      easing="ease-out"
      trigger={{ start: 'top 80%', end: 'top 20%' }}
    >
      <svg>…</svg>
    </ScrollDraw>
  );
}`}</Code>
              </div>
            </div>

            <h3 className="font-display font-bold text-xl mb-4">With stagger</h3>
            <div className="grid lg:grid-cols-2 gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#ef4444] font-medium mb-2">GSAP DrawSVG</p>
                <Code filename="chart.js">{`// Must use gsap.utils.toArray + manual delay
const paths = gsap.utils.toArray('#chart path');
paths.forEach((path, i) => {
  gsap.fromTo(path,
    { drawSVG: '0%' },
    {
      drawSVG: '100%',
      delay: i * 0.15,
      scrollTrigger: {
        trigger: '#chart',
        start: 'top 80%',
        scrub: true,
      },
    }
  );
});`}</Code>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#22c55e] font-medium mb-2">svg-scroll-draw</p>
                <Code filename="chart.js">{`// stagger is a first-class option
scrollDraw('#chart', {
  easing: 'ease-out',
  stagger: 0.15,
  once: true,
});`}</Code>
              </div>
            </div>
          </div>
        </section>

        {/* Feature matrix */}
        <section className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-12 sm:py-14 bg-marketplace-gray">
          <div className="max-w-5xl mx-auto">
            <SectionLabel>Feature comparison</SectionLabel>
            <h2 className="font-display font-extrabold text-[clamp(22px,4vw,42px)] leading-[1] tracking-[-0.03em] mb-8">
              Full feature matrix
            </h2>
            <div className="overflow-x-auto rounded-xl border border-pitch-black">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-pitch-black text-light-linen">
                    <th className="text-left px-4 py-3 font-medium text-xs uppercase tracking-wider w-1/3">Feature</th>
                    <th className="text-left px-4 py-3 font-medium text-xs uppercase tracking-wider">svg-scroll-draw</th>
                    <th className="text-left px-4 py-3 font-medium text-xs uppercase tracking-wider">GSAP DrawSVG</th>
                  </tr>
                </thead>
                <tbody>
                  {FEATURES.map((row, i) => (
                    <tr key={row.feature} className={`border-t border-subtle-ash ${i % 2 === 0 ? 'bg-white' : 'bg-[#f9f8f6]'}`}>
                      <td className="px-4 py-3 font-medium text-[12px] sm:text-[13px]">{row.feature}</td>
                      <td className="px-4 py-3 text-[12px] sm:text-[13px]">
                        <div className="flex items-start gap-1.5">
                          {row.ourWin === true ? <Check /> : row.ourWin === false ? <Dash /> : <Check />}
                          <span className={row.ourWin === false ? 'text-graphite-border' : ''}>{row.ours}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[12px] sm:text-[13px]">
                        <div className="flex items-start gap-1.5">
                          {row.ourWin === true ? <Cross /> : row.ourWin === false ? <Check /> : <Check />}
                          <span className={row.ourWin === true ? 'text-graphite-border' : ''}>{row.theirs}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* When GSAP wins */}
        <section className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-12 sm:py-14">
          <div className="max-w-4xl mx-auto">
            <SectionLabel>Honest guidance</SectionLabel>
            <h2 className="font-display font-extrabold text-[clamp(22px,4vw,42px)] leading-[1] tracking-[-0.03em] mb-6">
              When GSAP still makes sense
            </h2>
            <p className="text-[15px] text-graphite-border leading-relaxed mb-6 max-w-2xl">
              svg-scroll-draw is purpose-built for one thing: animating SVG paths as you scroll.
              If your project goes beyond that, GSAP may be the right tool:
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                {
                  title: 'Complex multi-element timelines',
                  desc: 'Orchestrating dozens of DOM elements across a 10-second scrubbed sequence — GSAP\'s timeline API has no peer.',
                },
                {
                  title: 'Non-SVG animations',
                  desc: 'Text splitting, FLIP, DOM transforms, canvas — GSAP animates anything. svg-scroll-draw only handles SVG paths.',
                },
                {
                  title: 'Physics easings (CustomEase)',
                  desc: 'svg-scroll-draw ships spring, bounce, and elastic. But GSAP\'s CustomEase (paid) and the depth of its easing ecosystem still wins for highly tailored curves.',
                },
                {
                  title: 'Already in your bundle',
                  desc: 'If you\'re already paying the GSAP bundle cost for other animations, DrawSVG adds marginal bytes and your team already knows the API.',
                },
              ].map(item => (
                <div key={item.title} className="bg-marketplace-gray rounded-xl border border-subtle-ash p-5">
                  <p className="font-semibold text-[13px] mb-1.5">{item.title}</p>
                  <p className="text-[13px] text-graphite-border leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Migration guide */}
        <section className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-12 sm:py-14 bg-marketplace-gray">
          <div className="max-w-4xl mx-auto">
            <SectionLabel>Migration guide</SectionLabel>
            <h2 className="font-display font-extrabold text-[clamp(22px,4vw,42px)] leading-[1] tracking-[-0.03em] mb-6">
              Switch in under 5 minutes
            </h2>
            <p className="text-[15px] text-graphite-border leading-relaxed mb-8 max-w-2xl">
              For SVG path drawing specifically, the migration is almost mechanical. The concepts map directly.
            </p>

            <div className="space-y-6">
              <div>
                <p className="text-sm font-semibold mb-3">1. Install</p>
                <Code>{`npm i svg-scroll-draw
# remove: npm uninstall gsap (if gsap was only used for DrawSVG)`}</Code>
              </div>

              <div>
                <p className="text-sm font-semibold mb-3">2. Replace the GSAP call</p>
                <div className="grid lg:grid-cols-2 gap-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[#ef4444] font-medium mb-2">Before (GSAP)</p>
                    <Code>{`import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';

gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin);

gsap.fromTo('#hero path', { drawSVG: '0%' }, {
  drawSVG: '100%',
  ease: 'power2.out',
  scrollTrigger: {
    trigger: '#hero',
    start: 'top 80%',
    end: 'bottom 20%',
    scrub: true,
  },
});`}</Code>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[#22c55e] font-medium mb-2">After (svg-scroll-draw)</p>
                    <Code>{`import { scrollDraw } from 'svg-scroll-draw';

scrollDraw('#hero', {
  easing: 'ease-out',
  trigger: {
    start: 'top 80%',
    end: 'bottom 20%',
  },
});`}</Code>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold mb-3">3. Easing name map</p>
                <div className="overflow-x-auto rounded-xl border border-subtle-ash">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-[#f0ede6] border-b border-subtle-ash">
                        <th className="text-left px-4 py-2.5 font-medium text-xs uppercase tracking-wider">GSAP ease</th>
                        <th className="text-left px-4 py-2.5 font-medium text-xs uppercase tracking-wider">svg-scroll-draw easing</th>
                      </tr>
                    </thead>
                    <tbody className="font-mono text-[12px]">
                      {[
                        ['power2.out / power3.out', '"ease-out"'],
                        ['power2.in',               '"ease-in"'],
                        ['power2.inOut',             '"ease-in-out"'],
                        ['linear',                  '"linear"'],
                        ['elastic.out',             '"spring" or createSpring({ tension, friction })'],
                        ['none',                    '"linear"'],
                      ].map(([gsap, ours]) => (
                        <tr key={gsap} className="border-t border-subtle-ash">
                          <td className="px-4 py-2.5 text-[#ef4444]">{gsap}</td>
                          <td className="px-4 py-2.5 text-[#22c55e]">{ours}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-pitch-black bg-creator-pink px-4 sm:px-6 md:px-12 py-12 sm:py-16 text-center">
          <h2 className="font-display font-extrabold text-[clamp(24px,5vw,52px)] leading-[0.95] tracking-[-0.03em] mb-4 text-pitch-black">
            Ready to make the switch?
          </h2>
          <p className="text-[15px] text-pitch-black/70 mb-8 max-w-md mx-auto">
            One install. No membership. Works in every framework.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 w-full max-w-xs mx-auto sm:max-w-none sm:flex-row sm:flex-wrap">
            <div className="flex items-center gap-2 bg-pitch-black text-light-linen rounded-full px-5 sm:px-6 py-3 text-sm font-mono shadow-[3px_3px_0px_rgba(0,0,0,0.3)] w-full sm:w-auto justify-center">
              <span className="opacity-50">$</span>
              <span>npm i svg-scroll-draw</span>
            </div>
            <Link
              href="/playground"
              className="px-5 sm:px-6 py-3 rounded-full border-2 border-pitch-black bg-transparent text-pitch-black text-sm font-semibold hover:bg-pitch-black hover:text-creator-pink transition-colors shadow-[3px_3px_0px_rgba(0,0,0,0.2)] w-full sm:w-auto text-center"
            >
              ⚡ Try the Playground →
            </Link>
            <Link
              href="/examples"
              className="px-5 sm:px-6 py-3 rounded-full border-2 border-pitch-black bg-transparent text-pitch-black text-sm font-semibold hover:bg-pitch-black hover:text-creator-pink transition-colors shadow-[3px_3px_0px_rgba(0,0,0,0.2)] w-full sm:w-auto text-center"
            >
              See 23 Examples →
            </Link>
          </div>
        </section>

        {/* Footer */}
      <RelatedResources post="gsap-drawsvg-alternative" />
        <footer className="px-6 md:px-12 py-6 border-t border-subtle-ash text-center text-[11px] font-mono text-graphite-border">
          svg-scroll-draw · MIT · ~10 KB gzipped ·{' '}
          <a href="https://github.com/DhruvilChauahan0210/ink-scroll" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-pitch-black transition-colors">
            GitHub
          </a>
          {' '}·{' '}
          <Link href="/docs" className="underline underline-offset-2 hover:text-pitch-black transition-colors">
            Docs
          </Link>
          {' '}·{' '}
          <Link href="/examples" className="underline underline-offset-2 hover:text-pitch-black transition-colors">
            Examples
          </Link>
        </footer>

      </div>
    </>
  );
}
