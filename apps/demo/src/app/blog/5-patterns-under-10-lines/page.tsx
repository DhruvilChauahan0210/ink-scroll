import type { Metadata } from 'next';
import Link from 'next/link';
import { MobileMenu } from '@/components/MobileMenu';

export const metadata: Metadata = {
  title: '5 SVG Scroll Animation Patterns in Under 10 Lines',
  description:
    'Five production-ready SVG scroll animation patterns — logo reveal, sketch diagram, typewriter, cinematic hero, and spring icon — each in 3 lines using svg-scroll-draw presets.',
  keywords: [
    'svg scroll animation examples',
    'svg scroll animation react',
    'scroll animation patterns',
    'svg path animation one liner',
    'svg-scroll-draw preset',
    'logo reveal scroll animation',
    'svg animation without gsap',
    'scroll animation under 10 lines',
  ],
  alternates: { canonical: '/blog/5-patterns-under-10-lines' },
  openGraph: {
    title: '5 SVG Scroll Animation Patterns in Under 10 Lines',
    description: 'Logo reveal, sketch diagram, typewriter, cinematic hero, spring icon — each in 3 lines with svg-scroll-draw presets.',
    url: 'https://svg-scroll-draw.vercel.app/blog/5-patterns-under-10-lines',
  },
  twitter: {
    card: 'summary_large_image',
    title: '5 SVG Scroll Animation Patterns in Under 10 Lines',
    description: '5 production-ready scroll animations, each in 3 lines. No GSAP. No config.',
  },
};

const GH  = 'https://github.com/DhruvilChauahan0210/ink-scroll';
const NPM = 'https://www.npmjs.com/package/svg-scroll-draw';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: '5 SVG Scroll Animation Patterns in Under 10 Lines',
  author: { '@type': 'Person', name: 'Dhruvil Chauhan' },
  datePublished: '2026-06-04',
  url: 'https://svg-scroll-draw.vercel.app/blog/5-patterns-under-10-lines',
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] uppercase tracking-[0.22em] text-graphite-border mb-4 font-medium">
      {children}
    </p>
  );
}

function Code({ filename, children }: { filename?: string; children: string }) {
  return (
    <div className="rounded-xl overflow-hidden border border-[#333] text-sm my-4">
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

const PATTERNS = [
  {
    number: '01',
    color: '#22c55e',
    preset: 'reveal',
    title: 'Logo reveal',
    useCase: 'Hero sections, brand marks, above-the-fold SVG illustrations',
    description: 'The most common scroll animation. A logo or illustration draws in once as it enters the viewport, fades as it draws, and stays drawn. The reveal preset sets fade, ease-out, and once — the three options you\'d set manually every time.',
    sets: 'easing: \'ease-out\', fade: true, speed: 1.2, once: true',
    vanilla: `import { scrollDraw } from 'svg-scroll-draw';

scrollDraw('#logo', { preset: 'reveal' });`,
    react: `import { ScrollDraw } from 'svg-scroll-draw/react';

function Logo() {
  return (
    <ScrollDraw preset="reveal">
      <svg>…</svg>
    </ScrollDraw>
  );
}`,
    when: 'Any SVG that should draw in once and stay visible. Default trigger (top bottom → bottom top) works well — the reveal feels fast and satisfying.',
  },
  {
    number: '02',
    color: '#ff90e8',
    preset: 'sketch',
    title: 'Sketch diagram',
    useCase: 'Technical diagrams, infographics, process flows, architectural illustrations',
    description: 'Multi-path SVGs — diagrams, flowcharts, architecture drawings — look best when paths trace in one by one rather than all at once. The sketch preset adds a 0.1 stagger and uses ease-in so each line feels like a pen stroke.',
    sets: 'easing: \'ease-in\', stagger: 0.1, speed: 0.9',
    vanilla: `scrollDraw('#architecture-diagram', { preset: 'sketch' });

// Or slow it down slightly for dense diagrams
scrollDraw('#circuit', { preset: 'sketch', speed: 0.7 });`,
    react: `<ScrollDraw preset="sketch">
  <svg>{/* your diagram SVG */}</svg>
</ScrollDraw>

{/* Override stagger for fewer paths */}
<ScrollDraw preset="sketch" stagger={0.2}>
  <svg>{/* 3-step flow */}</svg>
</ScrollDraw>`,
    when: 'Any SVG with 3+ paths. The stagger is proportional to the scroll range, so it always feels right regardless of the trigger window size.',
  },
  {
    number: '03',
    color: '#ffc900',
    preset: 'typewriter',
    title: 'Typewriter / sequential',
    useCase: 'Code snippets drawn as SVG, timeline steps, sequential data labels',
    description: 'When you want paths to appear quickly in strict sequence — like text being typed or steps in a timeline — the typewriter preset uses linear easing (mechanical, no easing in/out) with a tight 0.05 stagger and fast speed.',
    sets: 'easing: \'linear\', stagger: 0.05, speed: 1.5',
    vanilla: `scrollDraw('#timeline-steps', { preset: 'typewriter' });

// Tighten the trigger window for a snappier effect
scrollDraw('#code-svg', {
  preset: 'typewriter',
  trigger: { start: 'top 70%', end: 'top 30%' },
});`,
    react: `<ScrollDraw preset="typewriter">
  <svg>{/* sequential path SVG */}</svg>
</ScrollDraw>`,
    when: 'Works best when paths have a natural left-to-right or top-to-bottom order. The linear easing gives it a robotic precision that fits code and data contexts.',
  },
  {
    number: '04',
    color: '#5865F2',
    preset: 'cinematic',
    title: 'Cinematic hero',
    useCase: 'Landing page heroes, scroll storytelling, large showcase illustrations',
    description: 'Slow, deliberate, and dramatic. The cinematic preset draws over a longer scroll range (speed: 0.75) with ease-in-out so it accelerates into and decelerates out of the draw, plus a fade for a film-like reveal. Perfect for full-width hero SVGs.',
    sets: 'easing: \'ease-in-out\', fade: true, speed: 0.75',
    vanilla: `scrollDraw('#hero-illustration', { preset: 'cinematic' });

// Add strokeColor for extra drama
scrollDraw('#hero', {
  preset: 'cinematic',
  strokeColor: ['#333', '#ff90e8'],
});`,
    react: `<ScrollDraw
  preset="cinematic"
  strokeColor={['#333', '#ff90e8']}
>
  <svg>{/* hero illustration */}</svg>
</ScrollDraw>`,
    when: 'Use on large SVGs that deserve attention. Pair with a sticky section so the SVG draws as the user scrolls through a full viewport height.',
  },
  {
    number: '05',
    color: '#ef4444',
    preset: 'spring',
    title: 'Spring / playful',
    useCase: 'Icons, small decorative elements, UI feedback SVGs, loading indicators',
    description: 'Spring easing overshoots past 1.0 and settles back — giving small SVGs a bouncy, alive feeling that linear and ease-out never capture. Great for icons and micro-animations where you want personality, not polish.',
    sets: 'easing: \'spring\', speed: 1.1',
    vanilla: `scrollDraw('#check-icon',   { preset: 'spring' });
scrollDraw('#star-rating', { preset: 'spring', stagger: 0.08 });`,
    react: `{/* React icon with spring + stagger */}
<ScrollDraw preset="spring" stagger={0.08}>
  <svg>{/* star or check icon */}</svg>
</ScrollDraw>`,
    when: 'Best on small, simple paths (icons, badges, decorative marks). Avoid on complex multi-path SVGs where the overshoot looks chaotic.',
  },
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
            <Link href="/docs"       className="text-xs px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-medium">Docs</Link>
            <Link href="/examples"   className="text-xs px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-medium">Examples</Link>
            <Link href="/blog"       className="text-xs px-3.5 py-1.5 rounded-full border border-pitch-black bg-pitch-black text-light-linen font-medium">Blog</Link>
            <Link href="/playground" className="text-xs px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-medium">⚡ Playground</Link>
          </div>
          <MobileMenu />
        </nav>

        {/* Hero */}
        <section className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-12 sm:py-16 md:py-20">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 mb-6 text-[11px] font-mono text-graphite-border">
              <Link href="/" className="hover:text-pitch-black transition-colors">svg-scroll-draw</Link>
              <span>/</span>
              <Link href="/blog" className="hover:text-pitch-black transition-colors">blog</Link>
              <span>/</span>
              <span className="text-pitch-black">patterns</span>
            </div>

            <SectionLabel>Patterns · June 2026 · 5 min read</SectionLabel>

            <h1 className="font-display font-extrabold text-[clamp(26px,5vw,60px)] leading-[0.92] tracking-[-0.04em] mb-6">
              5 scroll animation<br />
              <span className="relative inline-block">
                <span className="relative z-10 px-2">patterns.</span>
                <span className="absolute inset-0 bg-creator-pink rounded-xl -rotate-[0.4deg]" />
              </span>
              <span className="text-graphite-border"> Under 10 lines.</span>
            </h1>

            <p className="text-base sm:text-lg text-graphite-border max-w-2xl leading-relaxed mb-8">
              The five scroll animation patterns that cover 95% of real-world SVG use cases —
              each in 3 lines using svg-scroll-draw presets.
              No config, no GSAP, no boilerplate.
            </p>

            <div className="flex flex-wrap gap-3">
              {PATTERNS.map(p => (
                <div key={p.preset} className="border border-pitch-black rounded-xl px-4 py-2 bg-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: p.color }} />
                  <span className="font-mono text-[12px] font-medium">{p.preset}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Patterns */}
        {PATTERNS.map((p, i) => (
          <section
            key={p.preset}
            className={`border-b border-pitch-black px-4 sm:px-6 md:px-12 py-12 sm:py-16 ${i % 2 === 1 ? 'bg-marketplace-gray' : ''}`}
          >
            <div className="max-w-5xl mx-auto">
              <div className="flex items-start gap-4 mb-6">
                <span className="font-display font-extrabold text-[clamp(36px,6vw,72px)] leading-none tracking-tighter opacity-10 select-none flex-shrink-0">
                  {p.number}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: p.color + '22', color: p.color }}
                    >
                      preset: &apos;{p.preset}&apos;
                    </span>
                    <span className="text-[11px] font-mono text-graphite-border">{p.sets}</span>
                  </div>
                  <h2 className="font-display font-extrabold text-[clamp(22px,4vw,42px)] leading-[1] tracking-[-0.03em]" style={{ color: p.color }}>
                    {p.title}
                  </h2>
                </div>
              </div>

              <p className="text-[13px] font-mono text-graphite-border mb-3">
                <span className="font-semibold text-pitch-black">Use case:</span> {p.useCase}
              </p>
              <p className="text-[15px] text-graphite-border leading-relaxed max-w-2xl mb-6">
                {p.description}
              </p>

              <div className="grid lg:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-[11px] font-mono font-semibold text-graphite-border uppercase tracking-wider mb-2">Vanilla JS</p>
                  <Code>{p.vanilla}</Code>
                </div>
                <div>
                  <p className="text-[11px] font-mono font-semibold text-graphite-border uppercase tracking-wider mb-2">React</p>
                  <Code>{p.react}</Code>
                </div>
              </div>

              <div className="rounded-xl border px-4 py-3" style={{ borderColor: p.color + '33', background: p.color + '08' }}>
                <span className="text-[11px] font-mono font-semibold uppercase tracking-wider" style={{ color: p.color }}>When to use: </span>
                <span className="text-[13px] text-pitch-black">{p.when}</span>
              </div>
            </div>
          </section>
        ))}

        {/* Combining presets */}
        <section className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-12 sm:py-14 bg-marketplace-gray">
          <div className="max-w-4xl mx-auto">
            <SectionLabel>Bonus</SectionLabel>
            <h2 className="font-display font-extrabold text-[clamp(22px,4vw,42px)] leading-[1] tracking-[-0.03em] mb-6">
              Override any preset value
            </h2>
            <p className="text-[15px] text-graphite-border leading-relaxed max-w-2xl mb-6">
              Presets are just defaults. Pass any option alongside <code className="font-mono text-[13px] text-pitch-black">preset</code> to override:
            </p>
            <Code>{`// reveal but with spring easing instead of ease-out
scrollDraw('#logo', { preset: 'reveal', easing: 'spring' });

// sketch but slower and with color animation
scrollDraw('#diagram', {
  preset: 'sketch',
  speed:        0.6,
  strokeColor:  ['#aaa', '#ff90e8'],
});

// Inspect what a preset sets
import { PRESETS } from 'svg-scroll-draw';
console.log(PRESETS.cinematic);
// { easing: 'ease-in-out', fade: true, speed: 0.75 }`}</Code>
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 sm:px-6 md:px-12 py-12 sm:py-16">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <p className="font-display font-extrabold text-xl mb-1">Try the presets live</p>
              <p className="text-[14px] text-graphite-border">
                Open the Playground, select a preset from the Motion tab, and see the effect instantly.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link href="/playground" className="text-sm px-5 py-2.5 rounded-full bg-pitch-black text-light-linen hover:bg-graphite-border transition-colors font-medium whitespace-nowrap">
                ⚡ Playground →
              </Link>
              <Link href="/examples" className="text-sm px-5 py-2.5 rounded-full border border-pitch-black hover:bg-marketplace-gray transition-colors font-medium whitespace-nowrap">
                Examples →
              </Link>
            </div>
          </div>
        </section>

        <footer className="border-t border-pitch-black px-4 sm:px-6 md:px-12 py-8">
          <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-4">
            <span className="font-mono text-[11px] text-graphite-border">svg-scroll-draw · MIT · ~4.4 KB gzipped</span>
            <div className="flex items-center gap-4">
              <a href={GH}  target="_blank" rel="noopener noreferrer" className="text-xs text-graphite-border hover:text-pitch-black transition-colors">GitHub</a>
              <a href={NPM} target="_blank" rel="noopener noreferrer" className="text-xs text-graphite-border hover:text-pitch-black transition-colors">npm</a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
