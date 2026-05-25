import { OnCompleteDemo } from '@/components/OnCompleteDemo';
import { InteractiveScrollDemo } from '@/components/InteractiveScrollDemo';
import { ThemeToggle } from '@/components/ThemeToggle';

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
        <span className="text-[11px] text-[#666] font-mono tracking-wide">{filename}</span>
        <span className="w-16" />
      </div>
      <pre className="bg-[#242423] dark:bg-[#1c1c1c] text-[#e8e8e3] px-5 py-4 text-[13px] font-mono leading-[1.75] overflow-x-auto">
        {children}
      </pre>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <code className="inline-block bg-marketplace-gray border border-subtle-ash px-1.5 py-0.5 rounded-md text-[0.82em] font-mono text-pitch-black align-middle">
      {children}
    </code>
  );
}

/* ── Marquee data ────────────────────────────────────────────────────────── */
const MARQUEE_ITEMS = [
  'Container Automation',
  'SSR Safe',
  'requestAnimationFrame',
  'IntersectionObserver',
  '< 3 KB Gzipped',
  'Zero Dependencies',
  '43 Tests Passing',
  'React + Next.js',
  'Vanilla JS',
];

/* ── Page ────────────────────────────────────────────────────────────────── */
export default function Home() {
  return (
    <main className="bg-light-linen text-pitch-black overflow-x-hidden">

      {/* ── Nav ───────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-light-linen/95 backdrop-blur-sm border-b border-pitch-black flex items-center justify-between px-6 md:px-12 h-14">
        <span className="font-display font-bold text-sm tracking-tight">svg-scroll-draw</span>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <a
            href="https://www.npmjs.com/package/svg-scroll-draw"
            className="text-xs px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-mono"
          >
            v0.1.0
          </a>
          <a
            href="https://github.com"
            className="text-sm px-4 py-1.5 rounded-full bg-pitch-black text-light-linen hover:bg-graphite-border transition-colors font-medium"
          >
            GitHub →
          </a>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section data-mascot-reset className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center border-b border-pitch-black dot-grid overflow-hidden">

        {/* Geometric decoration — thin concentric circles */}
        <div className="pointer-events-none absolute -top-48 -right-48 w-[700px] h-[700px] rounded-full border border-subtle-ash" />
        <div className="pointer-events-none absolute -top-24 -right-24 w-[450px] h-[450px] rounded-full border border-subtle-ash opacity-60" />
        <div className="pointer-events-none absolute top-12 right-12 w-4 h-4 rounded-full bg-creator-pink" />
        <div className="pointer-events-none absolute top-28 right-28 w-2 h-2 rounded-full bg-sunshine-yellow" />
        <div className="pointer-events-none absolute -bottom-32 -left-48 w-[500px] h-[500px] rounded-full border border-subtle-ash opacity-40" />
        <div className="pointer-events-none absolute bottom-24 left-16 w-3 h-3 rounded-full bg-lime-glow" />

        {/* Badge */}
        <div className="relative z-10 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-graphite-border mb-10 border border-subtle-ash bg-light-linen/80 rounded-full px-4 py-1.5 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-creator-pink animate-pulse" />
          Open source · MIT · Zero dependencies
        </div>

        {/* Headline */}
        <h1 className="relative z-10 font-display font-extrabold leading-[0.88] tracking-[-0.04em] mb-8"
            style={{ fontSize: 'clamp(58px, 11vw, 130px)' }}>
          ANIMATE SVG<br />
          PATHS AS YOU{' '}
          <span className="relative inline-block">
            <span className="relative z-10 px-4">SCROLL.</span>
            <span className="absolute inset-0 bg-creator-pink rounded-xl -rotate-[1.2deg]" />
          </span>
        </h1>

        {/* Sub */}
        <p className="relative z-10 text-base md:text-lg text-graphite-border max-w-md mx-auto mb-10 leading-relaxed">
          The definitive modern library. Under 3KB gzipped.
          Works in React, Next.js, and vanilla JS.
        </p>

        {/* CTAs */}
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-3 mb-14">
          <div className="flex items-center gap-2 bg-light-linen border border-pitch-black rounded-full px-5 py-3 text-sm font-mono shadow-[2px_2px_0px_#000]">
            <span className="text-graphite-border select-none">$</span>
            <span className="font-medium">npm i svg-scroll-draw</span>
          </div>
          <a
            href="#demos"
            className="px-6 py-3 rounded-full bg-pitch-black text-light-linen text-sm font-semibold hover:bg-graphite-border transition-colors shadow-[2px_2px_0px_#000] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            See it in action ↓
          </a>
        </div>

        {/* Stats */}
        <div className="relative z-10 flex flex-wrap items-center justify-center gap-2">
          {[
            ['< 3KB', 'gzipped'],
            ['0', 'dependencies'],
            ['SSR', 'safe'],
            ['43', 'tests ✓'],
          ].map(([val, label]) => (
            <div key={val} className="flex items-center gap-1.5 border border-pitch-black bg-light-linen rounded-full px-4 py-1.5 shadow-[1px_1px_0px_#000]">
              <span className="font-display font-bold text-sm">{val}</span>
              <span className="text-[11px] text-graphite-border">{label}</span>
            </div>
          ))}
        </div>

        {/* Scroll nudge */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-graphite-border">
          <span className="text-[10px] font-mono uppercase tracking-[0.22em]">scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-subtle-ash to-transparent" />
        </div>
      </section>

      {/* ── Marquee ───────────────────────────────────────────────────── */}
      <div className="bg-creator-pink border-b border-pitch-black py-3 overflow-hidden select-none">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i} className="flex items-center text-[13px] font-display font-bold uppercase tracking-[0.12em] text-pitch-black">
              {item}
              <span className="mx-6 text-pitch-black/30">◆</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Problems ──────────────────────────────────────────────────── */}
      <section className="bg-marketplace-gray border-b border-pitch-black px-6 md:px-12 py-20">
        <div className="max-w-5xl mx-auto">
          <p className="text-[11px] uppercase tracking-[0.22em] text-graphite-border mb-3 font-medium">The problem</p>
          <h2 className="font-display font-extrabold text-[clamp(32px,5vw,56px)] leading-[0.95] tracking-[-0.03em] mb-12">
            Every existing tool<br />is broken.
          </h2>

          <div className="grid md:grid-cols-3 gap-4" data-mascot="shocked">
            {[
              {
                name: 'GSAP DrawSVG',
                size: '40KB+',
                badge: 'bg-creator-pink',
                flaw: 'Paid license',
                problem: 'Overkill for a single effect — and requires a Club GreenSock subscription for commercial use.',
              },
              {
                name: 'Framer Motion',
                size: '35KB+',
                badge: 'bg-sunshine-yellow',
                flaw: 'React only',
                problem: 'Locks you into one ecosystem and adds 35KB of runtime overhead just to draw a line.',
              },
              {
                name: 'scroll-svg',
                size: '~2KB',
                badge: 'bg-lime-glow',
                flaw: 'Abandoned',
                problem: 'Requires manually targeting individual path IDs. Crashes in Next.js with window is not defined.',
              },
            ].map(({ name, size, badge, flaw, problem }) => (
              <div key={name} className="relative bg-light-linen border border-pitch-black rounded-2xl p-6 overflow-hidden">
                {/* X mark watermark */}
                <span className="absolute -top-3 -right-3 text-[120px] font-display font-extrabold text-pitch-black opacity-[0.04] leading-none select-none pointer-events-none">✕</span>
                <div className="relative">
                  <div className="flex items-start justify-between mb-1">
                    <span className="font-display font-bold text-base">{name}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${badge} text-pitch-black font-medium`}>{size}</span>
                    <span className="text-[11px] font-medium text-firecracker-orange uppercase tracking-wide border border-firecracker-orange rounded-full px-2 py-0.5">{flaw}</span>
                  </div>
                  <p className="text-sm text-graphite-border leading-relaxed">{problem}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Demos ─────────────────────────────────────────────────────── */}
      <div id="demos">

        {/* 01 — Basic */}
        <section data-mascot="draw" className="relative border-b border-pitch-black overflow-hidden">
          <span className="pointer-events-none select-none absolute -right-6 top-1/2 -translate-y-1/2 font-display font-extrabold text-[220px] leading-none text-pitch-black opacity-[0.04]">01</span>
          <div className="max-w-6xl mx-auto px-6 md:px-12 py-24 grid md:grid-cols-2 gap-16 items-start">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-graphite-border mb-3 font-medium">Zero config</p>
              <h2 className="font-display font-extrabold text-[clamp(28px,4vw,44px)] leading-[1] tracking-[-0.03em] mb-5">
                Drop in.<br />It just works.
              </h2>
              <p className="text-graphite-border leading-relaxed mb-6 text-[15px]">
                Wrap any SVG with <Tag>&lt;ScrollDraw&gt;</Tag>.
                The engine discovers every path, measures total length,
                and animates <Tag>stroke-dashoffset</Tag> as it enters the viewport.
                No configuration required.
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
            </div>
            <InteractiveScrollDemo defaultEasing="linear" defaultSpeed={1} svgBg="gray">
              <svg width="260" height="260" viewBox="0 0 260 260" fill="none">
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

        {/* 02 — Easing */}
        <section data-mascot="dance" className="relative border-b border-pitch-black bg-marketplace-gray overflow-hidden">
          <span className="pointer-events-none select-none absolute -left-6 top-1/2 -translate-y-1/2 font-display font-extrabold text-[220px] leading-none text-pitch-black opacity-[0.04]">02</span>
          <div className="max-w-6xl mx-auto px-6 md:px-12 py-24 grid md:grid-cols-2 gap-16 items-start">
            <InteractiveScrollDemo
              className="order-2 md:order-1"
              defaultEasing="ease-out"
              defaultSpeed={1.5}
              svgBg="white"
            >
              <svg width="260" height="260" viewBox="0 0 260 260" fill="none">
                {[1, 2, 3, 4, 5].map((i) => (
                  <path
                    key={i}
                    d={`M ${130 - i * 22} 130 A ${i * 22} ${i * 22} 0 1 1 ${130 + i * 22} 130`}
                    stroke="#ffc900"
                    strokeWidth={i === 5 ? 3 : 1.5}
                    strokeLinecap="round"
                    fill="none"
                    opacity={0.35 + i * 0.13}
                  />
                ))}
              </svg>
            </InteractiveScrollDemo>
            <div className="order-1 md:order-2">
              <p className="text-[11px] uppercase tracking-[0.22em] text-graphite-border mb-3 font-medium">Easing + speed</p>
              <h2 className="font-display font-extrabold text-[clamp(28px,4vw,44px)] leading-[1] tracking-[-0.03em] mb-5">
                Natural motion,<br />your way.
              </h2>
              <p className="text-graphite-border leading-relaxed mb-6 text-[15px]">
                Four built-in curves or any custom{' '}
                <Tag>(t: number) =&gt; number</Tag> function.
                The <Tag>speed</Tag> prop compresses or stretches the draw
                relative to your scroll distance.
              </p>
              <CodeBlock filename="index.tsx">
{`<ScrollDraw
  easing="ease-out"
  speed={1.5}
>
  <svg>...</svg>
</ScrollDraw>`}
              </CodeBlock>
            </div>
          </div>
        </section>

        {/* 03 — Fade */}
        <section data-mascot="magic" className="relative border-b border-pitch-black overflow-hidden">
          <span className="pointer-events-none select-none absolute -right-6 top-1/2 -translate-y-1/2 font-display font-extrabold text-[220px] leading-none text-pitch-black opacity-[0.04]">03</span>
          <div className="max-w-6xl mx-auto px-6 md:px-12 py-24 grid md:grid-cols-2 gap-16 items-start">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-graphite-border mb-3 font-medium">Fade</p>
              <h2 className="font-display font-extrabold text-[clamp(28px,4vw,44px)] leading-[1] tracking-[-0.03em] mb-5">
                Draw and<br />materialise.
              </h2>
              <p className="text-graphite-border leading-relaxed mb-6 text-[15px]">
                Enable <Tag>fade</Tag> to simultaneously animate{' '}
                <Tag>opacity: 0 → 1</Tag> as the path draws.
                Lines seem to emerge from nothing — elegant for technical illustrations and hero graphics.
              </p>
              <CodeBlock filename="index.tsx">
{`<ScrollDraw
  fade={true}
  easing="ease-in-out"
>
  <svg>...</svg>
</ScrollDraw>`}
              </CodeBlock>
            </div>
            <InteractiveScrollDemo defaultEasing="ease-in-out" defaultSpeed={1} fade svgBg="gray">
              <svg width="260" height="260" viewBox="0 0 260 260" fill="none">
                <path d="M 20 130 C 60 60 100 200 140 130 S 200 60 240 130" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                {[20, 80, 140, 200, 240].map((x, i) => (
                  <circle key={i} cx={x} cy={130} r="4" fill="#000" />
                ))}
                <circle cx="140" cy="130" r="4" fill="#ff90e8" />
                <line x1="20" y1="90" x2="240" y2="90" stroke="#d1d5dc" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="20" y1="170" x2="240" y2="170" stroke="#d1d5dc" strokeWidth="1" strokeDasharray="4 4" />
              </svg>
            </InteractiveScrollDemo>
          </div>
        </section>

        {/* 04 — Complex */}
        <section data-mascot="celebrate" className="relative border-b border-pitch-black bg-marketplace-gray overflow-hidden">
          <span className="pointer-events-none select-none absolute -left-6 top-1/2 -translate-y-1/2 font-display font-extrabold text-[220px] leading-none text-pitch-black opacity-[0.04]">04</span>
          <div className="max-w-6xl mx-auto px-6 md:px-12 py-24 grid md:grid-cols-2 gap-16 items-start">
            <InteractiveScrollDemo
              className="order-2 md:order-1"
              defaultEasing="ease-out"
              defaultSpeed={0.9}
              svgBg="white"
            >
              <svg width="260" height="260" viewBox="0 0 260 260" fill="none">
                <polygon points="130,16 244,130 130,244 16,130" stroke="#000000" strokeWidth="2" fill="none" />
                <polygon points="130,58 202,130 130,202 58,130" stroke="#ff90e8" strokeWidth="2" fill="none" />
                <polygon points="130,100 160,130 130,160 100,130" stroke="#ffc900" strokeWidth="2" fill="none" />
                <line x1="130" y1="16" x2="130" y2="244" stroke="#000000" strokeWidth="0.75" strokeDasharray="4 4" opacity="0.3" />
                <line x1="16" y1="130" x2="244" y2="130" stroke="#000000" strokeWidth="0.75" strokeDasharray="4 4" opacity="0.3" />
                <path d="M 118 16 L 130 4 L 142 16" stroke="#000" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                <path d="M 244 118 L 256 130 L 244 142" stroke="#000" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                <path d="M 142 244 L 130 256 L 118 244" stroke="#000" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                <path d="M 16 142 L 4 130 L 16 118" stroke="#000" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              </svg>
            </InteractiveScrollDemo>
            <div className="order-1 md:order-2">
              <p className="text-[11px] uppercase tracking-[0.22em] text-graphite-border mb-3 font-medium">Auto-discovery</p>
              <h2 className="font-display font-extrabold text-[clamp(28px,4vw,44px)] leading-[1] tracking-[-0.03em] mb-5">
                Every path.<br />Automatically.
              </h2>
              <p className="text-graphite-border leading-relaxed mb-4 text-[15px]">
                Every <Tag>&lt;path&gt;</Tag>, <Tag>&lt;line&gt;</Tag>,{' '}
                <Tag>&lt;polyline&gt;</Tag>, and <Tag>&lt;polygon&gt;</Tag> inside
                the container is discovered, measured, and animated.
              </p>
              <p className="text-graphite-border leading-relaxed text-[15px]">
                No manual selectors. No brittle ID targeting. When your designer updates
                the SVG, your code doesn&apos;t break.
              </p>
            </div>
          </div>
        </section>

        {/* 05 — onComplete */}
        <OnCompleteDemo />

      </div>

      {/* ── API Reference ─────────────────────────────────────────────── */}
      <section data-mascot="think" className="bg-marketplace-gray border-t border-pitch-black border-b px-6 md:px-12 py-20">
        <div className="max-w-5xl mx-auto">
          <p className="text-[11px] uppercase tracking-[0.22em] text-graphite-border mb-3 font-medium">Reference</p>
          <h2 className="font-display font-extrabold text-[clamp(32px,5vw,56px)] leading-[0.95] tracking-[-0.03em] mb-12">
            All options.
          </h2>

          <div className="border border-pitch-black rounded-2xl overflow-hidden bg-light-linen shadow-[4px_4px_0px_#000]">
            <div className="hidden md:grid grid-cols-[160px_130px_190px_1fr] gap-4 px-6 py-3 bg-pitch-black text-light-linen text-[11px] uppercase tracking-[0.15em] font-medium">
              <span>Option</span><span>Type</span><span>Default</span><span>Description</span>
            </div>
            {[
              { prop: 'selector', type: 'string', def: '"path, polyline…"', desc: 'CSS selector to target specific child elements.' },
              { prop: 'speed', type: 'number', def: '1', desc: 'Scale factor — values above 1 complete the animation faster.' },
              { prop: 'fade', type: 'boolean', def: 'false', desc: 'Animate opacity 0 → 1 simultaneously while drawing.' },
              { prop: 'easing', type: 'string | fn', def: '"linear"', desc: 'linear · ease-in · ease-out · ease-in-out · or custom (t) => t.' },
              { prop: 'trigger.start', type: 'string', def: '"top bottom"', desc: 'When animation begins. Format: "element-anchor viewport-anchor".' },
              { prop: 'trigger.end', type: 'string', def: '"bottom top"', desc: 'When animation ends.' },
              { prop: 'onComplete', type: '() => void', def: '—', desc: 'Fires once when the path reaches 100% draw progress.' },
            ].map(({ prop, type, def, desc }, i) => (
              <div
                key={prop}
                className={`grid grid-cols-1 md:grid-cols-[160px_130px_190px_1fr] gap-2 md:gap-4 px-6 py-4 text-sm items-start ${i < 6 ? 'border-b border-subtle-ash' : ''}`}
              >
                <code className="font-mono font-semibold text-pitch-black">{prop}</code>
                <code className="font-mono text-graphite-border text-[13px]">{type}</code>
                <code className="font-mono text-graphite-border text-[13px]">{def}</code>
                <p className="text-graphite-border text-[14px] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <section data-mascot="big-dance" className="bg-sunshine-yellow border-b border-pitch-black px-6 md:px-12 py-24 text-center">
        <h2 className="font-display font-extrabold leading-[0.9] tracking-[-0.04em] mb-8 text-pitch-black"
            style={{ fontSize: 'clamp(40px,8vw,96px)' }}>
          THE MODERN<br />STANDARD FOR<br />SCROLL-DRAWN SVG.
        </h2>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <div className="flex items-center gap-2 bg-pitch-black text-light-linen rounded-full px-6 py-3 text-sm font-mono shadow-[3px_3px_0px_rgba(0,0,0,0.3)]">
            <span className="opacity-50">$</span>
            <span>npm i svg-scroll-draw</span>
          </div>
          <a
            href="https://github.com"
            className="px-6 py-3 rounded-full border-2 border-pitch-black bg-transparent text-pitch-black text-sm font-semibold hover:bg-pitch-black hover:text-sunshine-yellow transition-colors shadow-[3px_3px_0px_rgba(0,0,0,0.2)]"
          >
            View on GitHub →
          </a>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="px-6 md:px-12 py-7 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-subtle-ash">
        <span className="font-display font-bold text-sm tracking-tight">svg-scroll-draw</span>
        <div className="flex items-center gap-5 text-[13px] text-graphite-border">
          <span>MIT License</span>
          <span className="text-subtle-ash">·</span>
          <span>&lt; 3KB gzipped</span>
          <span className="text-subtle-ash">·</span>
          <span>Zero dependencies</span>
        </div>
        <span className="text-[11px] font-mono text-graphite-border">v0.1.0</span>
      </footer>

    </main>
  );
}
