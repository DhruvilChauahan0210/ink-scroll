import type { Metadata } from 'next';
import Link from 'next/link';
import { MobileMenu } from '@/components/MobileMenu';

export const metadata: Metadata = {
  title: 'Scroll-Driven SVG Path Morphing with morphTo',
  description:
    'How to use the morphTo option in svg-scroll-draw to interpolate SVG path shapes as you scroll. Path compatibility, use cases, and live code examples.',
  keywords: [
    'svg path morphing scroll',
    'morphTo svg animation',
    'svg shape transition scroll',
    'scroll-driven path morphing',
    'svg morph on scroll',
    'svg path interpolation javascript',
    'stroke-dashoffset morph animation',
    'svg-scroll-draw morphTo',
  ],
  alternates: { canonical: '/blog/scroll-path-morphing' },
  openGraph: {
    title: 'Scroll-Driven SVG Path Morphing with morphTo',
    description: 'Interpolate SVG path shapes as you scroll — no GSAP MorphSVG, no paid plugins.',
    url: 'https://svg-scroll-draw.vercel.app/blog/scroll-path-morphing',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Scroll-Driven SVG Path Morphing with morphTo',
    description: 'Interpolate SVG path shapes as you scroll — no GSAP MorphSVG, no paid plugins.',
  },
};

const GH  = 'https://github.com/DhruvilChauahan0210/ink-scroll';
const NPM = 'https://www.npmjs.com/package/svg-scroll-draw';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Scroll-Driven SVG Path Morphing with morphTo',
  author: { '@type': 'Person', name: 'Dhruvil Chauhan' },
  datePublished: '2026-06-04',
  url: 'https://svg-scroll-draw.vercel.app/blog/scroll-path-morphing',
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

function Callout({ color = '#ff90e8', label, children }: { color?: string; label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border px-5 py-4 my-6" style={{ borderColor: color + '44', background: color + '0a' }}>
      <p className="text-[10px] font-mono font-semibold uppercase tracking-wider mb-2" style={{ color }}>{label}</p>
      <div className="text-[14px] text-pitch-black leading-relaxed">{children}</div>
    </div>
  );
}

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
              <span className="text-pitch-black">morphTo</span>
            </div>

            <SectionLabel>Deep Dive · June 2026 · 6 min read</SectionLabel>

            <h1 className="font-display font-extrabold text-[clamp(26px,5vw,60px)] leading-[0.92] tracking-[-0.04em] mb-6">
              Scroll-driven SVG<br />
              <span className="relative inline-block">
                <span className="relative z-10 px-2">path morphing.</span>
                <span className="absolute inset-0 bg-creator-pink rounded-xl -rotate-[0.4deg]" />
              </span>
            </h1>

            <p className="text-base sm:text-lg text-graphite-border max-w-2xl leading-relaxed mb-8">
              The <code className="font-mono text-sm bg-marketplace-gray border border-subtle-ash px-1.5 py-0.5 rounded-md text-pitch-black">morphTo</code> option
              lets you interpolate a SVG path&apos;s <code className="font-mono text-[13px] text-pitch-black">d</code> attribute
              from its original shape to a target shape — all driven by scroll position.
              No GSAP MorphSVGPlugin. No paid add-ons. Zero extra dependencies.
            </p>

            <div className="flex flex-wrap gap-3">
              {[
                { label: 'Extra dependencies', value: '0',         color: '#22c55e' },
                { label: 'vs GSAP MorphSVG',   value: 'free',      color: '#ff90e8' },
                { label: 'Works with',         value: '<path>',     color: '#5865F2' },
                { label: 'Triggers on',        value: 'scroll',     color: '#888' },
              ].map((s) => (
                <div key={s.label} className="border border-pitch-black rounded-xl px-4 py-3 bg-white">
                  <p className="text-[10px] font-mono text-graphite-border mb-0.5">{s.label}</p>
                  <p className="font-display font-extrabold text-lg leading-none font-mono" style={{ color: s.color }}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What is path morphing */}
        <section className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-12 sm:py-14">
          <div className="max-w-4xl mx-auto">
            <SectionLabel>The concept</SectionLabel>
            <h2 className="font-display font-extrabold text-[clamp(22px,4vw,42px)] leading-[1] tracking-[-0.03em] mb-6">
              What is SVG path morphing?
            </h2>
            <div className="space-y-4 text-[15px] text-graphite-border leading-relaxed max-w-2xl">
              <p>
                Every SVG <code className="font-mono text-[13px] text-pitch-black">&lt;path&gt;</code> has a{' '}
                <code className="font-mono text-[13px] text-pitch-black">d</code> attribute — a string of commands
                that defines its shape. Path morphing means smoothly interpolating between two{' '}
                <code className="font-mono text-[13px] text-pitch-black">d</code> strings at a given progress value (0–1).
              </p>
              <p>
                At progress 0, the path looks like the original shape.
                At progress 1, it looks like <code className="font-mono text-[13px] text-pitch-black">morphTo</code>.
                Anywhere in between, each numeric coordinate is linearly interpolated — producing a smooth shape transition.
              </p>
              <p>
                Combined with scroll-driven progress, you get shape changes that respond
                directly to how far the user has scrolled — without a single line of animation logic.
              </p>
            </div>

            <Code>{`// A circle → square morph driven by scroll
scrollDraw('#shape', {
  morphTo: 'M10 10 L90 10 L90 90 L10 90 Z',  // target: a square
  easing: 'ease-in-out',
  trigger: { start: 'top 70%', end: 'top 20%' },
});
// The path starts as its original shape (e.g. a circle)
// and morphs into the square as the user scrolls down`}</Code>
          </div>
        </section>

        {/* How it works */}
        <section className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-12 sm:py-14 bg-marketplace-gray">
          <div className="max-w-4xl mx-auto">
            <SectionLabel>Under the hood</SectionLabel>
            <h2 className="font-display font-extrabold text-[clamp(22px,4vw,42px)] leading-[1] tracking-[-0.03em] mb-6">
              How svg-scroll-draw morphs paths
            </h2>
            <div className="space-y-4 text-[15px] text-graphite-border leading-relaxed max-w-2xl mb-6">
              <p>
                The engine extracts all numeric tokens from both the original and target{' '}
                <code className="font-mono text-[13px] text-pitch-black">d</code> strings, then linearly
                interpolates each token pair at the current scroll alpha. The non-numeric parts
                (command letters like <code className="font-mono text-[13px] text-pitch-black">M</code>,{' '}
                <code className="font-mono text-[13px] text-pitch-black">L</code>,{' '}
                <code className="font-mono text-[13px] text-pitch-black">C</code>) are taken from the original path —
                they define the shape structure, which must be compatible between the two paths.
              </p>
            </div>

            <Code filename="morphing (simplified)">{`function morphPath(from: string, to: string, t: number): string {
  const toNums = to.match(/[-+]?[\d.]+/g).map(Number);
  let idx = 0;
  return from.replace(/[-+]?[\d.]+/g, (match) => {
    const fromNum = parseFloat(match);
    const toNum   = toNums[idx++] ?? fromNum;
    return String(fromNum + (toNum - fromNum) * t);
  });
}

// At t=0:   returns original path d
// At t=0.5: returns midpoint between original and target
// At t=1:   returns morphTo path d`}</Code>

            <p className="text-[15px] text-graphite-border leading-relaxed max-w-2xl mt-4">
              This runs every animation frame while the element is in view, updating the{' '}
              <code className="font-mono text-[13px] text-pitch-black">d</code> attribute directly on the{' '}
              <code className="font-mono text-[13px] text-pitch-black">&lt;path&gt;</code> element.
              The stroke-dashoffset draw animation runs simultaneously — path draws <em>and</em> morphs at the same time.
            </p>
          </div>
        </section>

        {/* Compatibility rule */}
        <section className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-12 sm:py-14">
          <div className="max-w-4xl mx-auto">
            <SectionLabel>The golden rule</SectionLabel>
            <h2 className="font-display font-extrabold text-[clamp(22px,4vw,42px)] leading-[1] tracking-[-0.03em] mb-6">
              Paths must be numerically compatible
            </h2>
            <div className="space-y-4 text-[15px] text-graphite-border leading-relaxed max-w-2xl mb-6">
              <p>
                The morph works by pairing numeric tokens from the original and target path strings one-for-one.
                If they have different counts, the extra target tokens are ignored (morphing snaps to a close approximation).
                For a perfect morph, both paths should have <strong className="text-pitch-black">the same number of numeric tokens</strong>.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <div className="bg-white rounded-xl border-2 border-[#22c55e] p-5">
                <p className="text-[11px] font-mono font-semibold text-[#22c55e] uppercase tracking-wider mb-3">Compatible ✓</p>
                <Code>{`<!-- Both have 8 numeric tokens -->
<path d="M10 10 L90 10 L90 90 L10 90" />

morphTo: "M50 10 L90 50 L50 90 L10 50"`}</Code>
                <p className="text-[12px] text-graphite-border mt-2">Square → Diamond: same structure, same token count. Morphs cleanly.</p>
              </div>
              <div className="bg-white rounded-xl border border-subtle-ash p-5">
                <p className="text-[11px] font-mono font-semibold text-graphite-border uppercase tracking-wider mb-3">Incompatible ✗</p>
                <Code>{`<!-- Triangle: 6 tokens -->
<path d="M50 10 L90 90 L10 90 Z" />

<!-- Star: 20 tokens -->
morphTo: "M50 5 L61 35 L95 35 L68 57 ..."`}</Code>
                <p className="text-[12px] text-graphite-border mt-2">Different command counts — morph will be approximate or look wrong.</p>
              </div>
            </div>

            <Callout label="Tip: use the same SVG editor" color="#ff90e8">
              The easiest way to ensure compatibility: draw both shapes in Figma or Illustrator,
              export as SVG, and verify the <code className="font-mono text-[13px]">d</code> strings have the
              same number of path commands. Most shape transformations (square → diamond, circle → blob)
              work when you constrain yourself to the same command structure.
            </Callout>
          </div>
        </section>

        {/* Use cases */}
        <section className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-12 sm:py-14 bg-marketplace-gray">
          <div className="max-w-4xl mx-auto">
            <SectionLabel>Use cases</SectionLabel>
            <h2 className="font-display font-extrabold text-[clamp(22px,4vw,42px)] leading-[1] tracking-[-0.03em] mb-8">
              When to reach for <code className="font-mono">morphTo</code>
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  title: 'Icon transitions',
                  desc: 'Morph a play button into a pause button, a hamburger into an X, or a circle into a checkmark as the user scrolls past a milestone.',
                  example: `scrollDraw('#icon', {\n  morphTo: pauseIcon,\n  easing: 'spring',\n  trigger: { start: 'top 60%', end: 'top 40%' },\n});`,
                  color: '#ff90e8',
                },
                {
                  title: 'Data visualisation',
                  desc: 'Morph a bar chart shape into a line chart shape, or transform a circle chart into its expanded state as the section scrolls into view.',
                  example: `scrollDraw('#chart-shape', {\n  morphTo: lineChartPath,\n  easing: 'ease-in-out',\n  once: true,\n});`,
                  color: '#5865F2',
                },
                {
                  title: 'Blob / organic shapes',
                  desc: 'Animate background blobs or decorative shapes between two organic forms. Combine with fade for a smooth entrance.',
                  example: `scrollDraw('#blob', {\n  morphTo: blobVariant2,\n  fade: true,\n  easing: 'ease-out',\n});`,
                  color: '#22c55e',
                },
                {
                  title: 'Logo storytelling',
                  desc: 'Draw the logo as a simple shape, then morph it into its final form as the hero section exits the viewport.',
                  example: `scrollDraw('#logo-path', {\n  morphTo: finalLogoPath,\n  easing: 'spring',\n  trigger: { start: 'top 90%', end: 'top 10%' },\n});`,
                  color: '#ffc900',
                },
              ].map(({ title, desc, example, color }) => (
                <div key={title} className="bg-white rounded-2xl border border-subtle-ash p-5">
                  <p className="font-display font-extrabold text-base mb-2" style={{ color }}>{title}</p>
                  <p className="text-[13px] text-graphite-border leading-relaxed mb-3">{desc}</p>
                  <Code>{example}</Code>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Combined with draw */}
        <section className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-12 sm:py-14">
          <div className="max-w-4xl mx-auto">
            <SectionLabel>Combining effects</SectionLabel>
            <h2 className="font-display font-extrabold text-[clamp(22px,4vw,42px)] leading-[1] tracking-[-0.03em] mb-6">
              Draw <em>and</em> morph simultaneously
            </h2>
            <div className="space-y-4 text-[15px] text-graphite-border leading-relaxed max-w-2xl mb-6">
              <p>
                <code className="font-mono text-[13px] text-pitch-black">morphTo</code> runs alongside the stroke-dashoffset draw animation —
                both update on the same scroll alpha. The path traces itself in <em>and</em> transforms its shape at the same time.
                Combined with <code className="font-mono text-[13px] text-pitch-black">fade</code> and{' '}
                <code className="font-mono text-[13px] text-pitch-black">strokeColor</code>, this produces effects
                that feel far more complex than the code suggests.
              </p>
            </div>

            <Code filename="combined.js">{`import { scrollDraw } from 'svg-scroll-draw';

// Path draws in, morphs shape, changes colour, and fades — all at once
scrollDraw('#hero-shape', {
  morphTo:     finalShape,
  strokeColor: ['#ff90e8', '#5865F2'],  // pink → indigo as it draws
  fade:        true,                     // opacity 0 → 1
  easing:      'ease-in-out',
  once:        true,
  trigger:     { start: 'top 80%', end: 'top 20%' },
});`}</Code>

            <Code filename="React version">{`import { ScrollDraw } from 'svg-scroll-draw/react';

function HeroShape() {
  return (
    <ScrollDraw
      morphTo={finalShape}
      strokeColor={['#ff90e8', '#5865F2']}
      fade
      easing="ease-in-out"
      once
      trigger={{ start: 'top 80%', end: 'top 20%' }}
    >
      <svg viewBox="0 0 100 100">
        <path d={originalShape} stroke="currentColor" strokeWidth="2" fill="none" />
      </svg>
    </ScrollDraw>
  );
}`}</Code>
          </div>
        </section>

        {/* Limitations */}
        <section className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-12 sm:py-14 bg-marketplace-gray">
          <div className="max-w-4xl mx-auto">
            <SectionLabel>Limitations</SectionLabel>
            <h2 className="font-display font-extrabold text-[clamp(22px,4vw,42px)] leading-[1] tracking-[-0.03em] mb-6">
              What morphTo can&apos;t do
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  title: '<path> only',
                  desc: 'morphTo silently no-ops on <rect>, <circle>, <line>, <polyline>, and other SVG shape elements. Convert them to <path> equivalents first.',
                  color: '#ef4444',
                },
                {
                  title: 'Non-SVG elements',
                  desc: 'This is SVG path interpolation — it does not work on HTML elements, CSS clip-paths, or canvas. For HTML morphing you still need GSAP or the Web Animations API.',
                  color: '#ef4444',
                },
                {
                  title: 'Complex structure changes',
                  desc: 'If your paths have fundamentally different command structures (e.g. one uses cubic beziers, the other straight lines), the interpolation will look wrong. Restructure to match.',
                  color: '#f59e0b',
                },
                {
                  title: 'Activates native CSS opt-out',
                  desc: 'morphTo requires JS per-frame updates, so it automatically bypasses the native CSS animation-timeline path. That\'s fine — the JS engine handles it seamlessly.',
                  color: '#888',
                },
              ].map(({ title, desc, color }) => (
                <div key={title} className="bg-white rounded-xl border border-subtle-ash p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span style={{ color }} className="font-bold text-base">!</span>
                    <p className="font-semibold text-[13px]">{title}</p>
                  </div>
                  <p className="text-[13px] text-graphite-border leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Quick reference */}
        <section className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-12 sm:py-14">
          <div className="max-w-4xl mx-auto">
            <SectionLabel>Quick reference</SectionLabel>
            <h2 className="font-display font-extrabold text-[clamp(22px,4vw,42px)] leading-[1] tracking-[-0.03em] mb-6">
              Full API
            </h2>

            <div className="overflow-x-auto rounded-xl border border-pitch-black">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-pitch-black text-light-linen">
                    <th className="text-left px-4 py-3 font-medium text-xs uppercase tracking-wider">Option</th>
                    <th className="text-left px-4 py-3 font-medium text-xs uppercase tracking-wider">Type</th>
                    <th className="text-left px-4 py-3 font-medium text-xs uppercase tracking-wider">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { opt: 'morphTo',  type: 'string',   note: 'Target path d attribute. Must be numerically compatible with the source path.' },
                    { opt: 'easing',   type: 'EasingName | fn', note: 'Controls the morph curve, not just the draw. spring and bounce give great shape transitions.' },
                    { opt: 'fade',     type: 'boolean',  note: 'Fade in simultaneously with draw + morph.' },
                    { opt: 'once',     type: 'boolean',  note: 'Stay morphed at the target shape after first completion.' },
                    { opt: 'trigger',  type: '{ start, end }', note: 'Viewport anchors for when the morph starts and ends.' },
                    { opt: 'strokeColor', type: 'string | [string, string]', note: 'Interpolate stroke color as the shape morphs.' },
                    { opt: 'onComplete', type: '() => void', note: 'Fires when morph reaches 100%. Swap to a static version here if needed.' },
                  ].map((row, i) => (
                    <tr key={row.opt} className={`border-t border-subtle-ash ${i % 2 === 0 ? 'bg-white' : 'bg-[#f9f8f6]'}`}>
                      <td className="px-4 py-3 font-mono text-[12px] font-medium">{row.opt}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-graphite-border">{row.type}</td>
                      <td className="px-4 py-3 text-[13px] text-graphite-border">{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 sm:px-6 md:px-12 py-12 sm:py-16">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <p className="font-display font-extrabold text-xl mb-1">Try it in the Playground</p>
              <p className="text-[14px] text-graphite-border">
                Paste any two compatible SVG paths and set <code className="font-mono text-[13px]">morphTo</code> to see it live.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link href="/playground" className="text-sm px-5 py-2.5 rounded-full bg-pitch-black text-light-linen hover:bg-graphite-border transition-colors font-medium whitespace-nowrap">
                ⚡ Playground →
              </Link>
              <Link href="/blog" className="text-sm px-5 py-2.5 rounded-full border border-pitch-black hover:bg-marketplace-gray transition-colors font-medium whitespace-nowrap">
                ← Blog
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
