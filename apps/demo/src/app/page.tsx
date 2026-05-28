import { OnCompleteDemo } from '@/components/OnCompleteDemo';
import { WaypointsDemo } from '@/components/WaypointsDemo';
import { ProgressHookDemo } from '@/components/ProgressHookDemo';
import { FillOpacityDemo } from '@/components/FillOpacityDemo';
import { ClipModeDemo } from '@/components/ClipModeDemo';
import { ScrollShowcase } from '@/components/ScrollShowcase';
import { BundleGraphLine, CtaBoldMark } from '@/components/BackgroundDecor';
import { InteractiveScrollDemo } from '@/components/InteractiveScrollDemo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LiveStats } from '@/components/LiveStats';
import { CopyButton } from '@/components/CopyButton';
import { InstallTabs } from '@/components/InstallTabs';
import { FrameworkTabs } from '@/components/FrameworkTabs';

const GH  = 'https://github.com/DhruvilChauahan0210/ink-scroll';
const NPM = 'https://www.npmjs.com/package/svg-scroll-draw';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'svg-scroll-draw',
  description:
    'A zero-dependency JavaScript library that animates SVG paths as you scroll. Under 3 KB brotli.',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Web',
  url: 'https://svg-scroll-draw.vercel.app',
  downloadUrl: 'https://www.npmjs.com/package/svg-scroll-draw',
  codeRepository: 'https://github.com/DhruvilChauahan0210/ink-scroll',
  license: 'https://opensource.org/licenses/MIT',
  softwareVersion: '1.0.0',
  programmingLanguage: ['JavaScript', 'TypeScript'],
  author: {
    '@type': 'Person',
    name: 'Dhruvil Chauhan',
  },
  keywords: 'svg, animation, scroll, javascript, react, vue, web animation',
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
        <span className="text-[11px] text-[#666] font-mono tracking-wide">{filename}</span>
        <CopyButton text={children} />
      </div>
      <pre className="bg-[#242423] dark:bg-[#1c1c1c] text-[#e8e8e3] px-3 sm:px-5 py-4 text-[11px] sm:text-[13px] font-mono leading-[1.75] overflow-x-auto">
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

/* ── Marquee data ────────────────────────────────────────────────────────── */
const MARQUEE_ITEMS = [
  'Container Automation',
  'SSR Safe',
  'requestAnimationFrame',
  'IntersectionObserver',
  '~3 KB Gzipped',
  'Zero Dependencies',
  '56 Tests Passing',
  'React + Next.js',
  'Vue 3',
  'Svelte',
  'Vanilla JS',
  'Web Component',
  'Reduced Motion',
  'Spring Easing',
  'Once Mode',
  'Debug Overlay',
  'Horizontal Scroll',
  'Replay API',
  'Color Animation',
  'Auto Reverse',
  'Waypoints',
  'SolidJS',
  'Angular',
  'Astro',
  'Nuxt',
  'Path Morphing',
  'Timeline API',
  'createSpring',
  'CSS Custom Property',
  'Group API',
  'Sequence API',
  'Pause · Resume · Seek',
  'Velocity Scale',
  'Repeat',
  'useScrollDrawProgress',
  'Fill Opacity',
  'Clip Mode',
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
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide">
          <ThemeToggle />
          <a
            href="/docs"
            className="inline-flex text-xs px-3 sm:px-3.5 py-2 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-medium items-center gap-1 whitespace-nowrap"
          >
            Docs
          </a>
          <a
            href="/examples"
            className="hidden sm:inline-flex text-xs px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-medium items-center gap-1 whitespace-nowrap"
          >
            Examples
          </a>
          <a
            href="/changelog"
            className="hidden md:inline-flex text-xs px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-medium items-center gap-1 whitespace-nowrap"
          >
            Changelog
          </a>
          <a
            href="/playground"
            className="hidden sm:inline-flex text-xs px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-medium items-center gap-1 whitespace-nowrap"
          >
            ⚡ Playground
          </a>
          <a
            href={NPM}
            target="_blank" rel="noopener noreferrer"
            className="hidden sm:inline-flex text-xs px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-mono whitespace-nowrap"
          >
            v1.0.0
          </a>
          <a
            href={GH}
            target="_blank" rel="noopener noreferrer"
            className="text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-full bg-pitch-black text-light-linen hover:bg-graphite-border transition-colors font-medium whitespace-nowrap"
          >
            GitHub →
          </a>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section data-mascot-reset className="relative min-h-[100svh] flex flex-col items-center justify-center px-4 sm:px-6 text-center border-b border-pitch-black dot-grid overflow-hidden">


        {/* Geometric decoration — hidden on small screens to prevent overflow */}
        <div className="hidden sm:block pointer-events-none absolute -top-48 -right-48 w-[700px] h-[700px] rounded-full border border-subtle-ash" />
        <div className="hidden sm:block pointer-events-none absolute -top-24 -right-24 w-[450px] h-[450px] rounded-full border border-subtle-ash opacity-60" />
        <div className="pointer-events-none absolute top-12 right-12 w-4 h-4 rounded-full bg-creator-pink" />
        <div className="pointer-events-none absolute top-28 right-28 w-2 h-2 rounded-full bg-sunshine-yellow" />
        <div className="hidden sm:block pointer-events-none absolute -bottom-32 -left-48 w-[500px] h-[500px] rounded-full border border-subtle-ash opacity-40" />
        <div className="pointer-events-none absolute bottom-24 left-16 w-3 h-3 rounded-full bg-lime-glow" />

        {/* Badge */}
        <div className="relative z-10 inline-flex items-center gap-2 text-[10px] sm:text-[11px] uppercase tracking-[0.18em] sm:tracking-[0.22em] text-graphite-border mb-6 sm:mb-10 border border-subtle-ash bg-light-linen/80 rounded-full px-3 sm:px-4 py-1.5 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-creator-pink animate-pulse shrink-0" />
          <span>Open source · MIT · Zero dependencies</span>
        </div>

        {/* Headline */}
        <h1 className="relative z-10 font-display font-extrabold leading-[0.88] tracking-[-0.04em] mb-6 sm:mb-8"
            style={{ fontSize: 'clamp(42px, 11vw, 130px)' }}>
          ANIMATE SVG<br />
          PATHS AS YOU{' '}
          <span className="relative inline-block">
            <span className="relative z-10 px-2 sm:px-4">SCROLL.</span>
            <span className="absolute inset-0 bg-creator-pink rounded-xl -rotate-[1.2deg]" />
          </span>
        </h1>

        {/* Sub */}
        <p className="relative z-10 text-sm sm:text-base md:text-lg text-graphite-border max-w-sm sm:max-w-md mx-auto mb-8 sm:mb-10 leading-relaxed">
          The definitive modern library. ~3 KB gzipped.
          Works in React, Next.js, and vanilla JS.
        </p>

        {/* CTAs */}
        <div className="relative z-10 flex flex-col items-center gap-3 mb-10 sm:mb-14 w-full max-w-sm sm:max-w-md px-2">
          <InstallTabs />
          <a
            href="#demos"
            className="px-6 py-3 rounded-full bg-pitch-black text-light-linen text-sm font-semibold hover:bg-graphite-border shadow-[2px_2px_0px_#000] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            See it in action ↓
          </a>
        </div>

        {/* Stats */}
        <div className="relative z-10 flex flex-wrap items-center justify-center gap-2">
          {[
            ['~3 KB', 'gzipped'],
            ['0', 'dependencies'],
            ['SSR', 'safe'],
            ['56', 'tests ✓'],
          ].map(([val, label]) => (
            <div key={val} className="flex items-center gap-1.5 border border-pitch-black bg-light-linen rounded-full px-3 sm:px-4 py-1.5 shadow-[1px_1px_0px_#000]">
              <span className="font-display font-bold text-xs sm:text-sm">{val}</span>
              <span className="text-[10px] sm:text-[11px] text-graphite-border">{label}</span>
            </div>
          ))}
        </div>

        {/* Scroll nudge */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-graphite-border z-10">
          <span className="text-[10px] font-mono uppercase tracking-[0.22em]">scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-subtle-ash to-transparent" />
        </div>

      </section>

      {/* ── Scroll showcase ───────────────────────────────────────────── */}
      <ScrollShowcase />

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
      <section className="bg-marketplace-gray border-b border-pitch-black px-4 sm:px-6 md:px-12 py-12 sm:py-16 md:py-20">
        <div className="max-w-5xl mx-auto">
          <p className="text-[11px] uppercase tracking-[0.22em] text-graphite-border mb-3 font-medium">The problem</p>
          <h2 className="font-display font-extrabold text-[clamp(28px,5vw,56px)] leading-[0.95] tracking-[-0.03em] mb-8 sm:mb-12">
            Every existing tool<br />is broken.
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4" data-mascot="shocked">
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

      {/* ── Bundle size chart ─────────────────────────────────────────── */}
      <section className="relative border-b border-pitch-black px-4 sm:px-6 md:px-12 py-12 sm:py-16 md:py-20 overflow-hidden">
        <BundleGraphLine />
        <div className="max-w-5xl mx-auto">
          <p className="text-[11px] uppercase tracking-[0.22em] text-graphite-border mb-3 font-medium">Bundle size</p>
          <h2 className="font-display font-extrabold text-[clamp(28px,5vw,56px)] leading-[0.95] tracking-[-0.03em] mb-8 sm:mb-12">
            ~3 KB.<br />Not 40 KB.
          </h2>

          <div className="space-y-5">
            {[
              { name: 'svg-scroll-draw', size: '~3 KB',  pct: 7.5,  color: 'bg-creator-pink',    badge: '✓ yours' },
              { name: 'Framer Motion',   size: '~35 KB', pct: 87.5, color: 'bg-sunshine-yellow', badge: null },
              { name: 'GSAP DrawSVG',    size: '~40 KB', pct: 100,  color: 'bg-[#e0e0e0] dark:bg-[#333]', badge: null },
            ].map(({ name, size, pct, color, badge }) => (
              <div key={name}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-sm">{name}</span>
                    {badge && (
                      <span className="text-[10px] font-medium bg-creator-pink text-pitch-black px-2 py-0.5 rounded-full uppercase tracking-wide">{badge}</span>
                    )}
                  </div>
                  <span className="font-mono text-sm text-graphite-border">{size} gzip</span>
                </div>
                <div className="h-7 bg-marketplace-gray rounded-lg overflow-hidden border border-subtle-ash">
                  <div
                    className={`h-full ${color} rounded-lg transition-all`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <p className="mt-6 text-[13px] text-graphite-border">
            Sizes are minified + gzipped. GSAP DrawSVG requires a paid Club GreenSock license for commercial use.
          </p>
        </div>
      </section>

      {/* ── Demos ─────────────────────────────────────────────────────── */}
      <div id="demos">

        {/* 01 — Basic */}
        <section data-mascot="draw" className="relative border-b border-pitch-black overflow-hidden">
          <span className="pointer-events-none select-none absolute -right-6 top-1/2 -translate-y-1/2 font-display font-extrabold text-[120px] md:text-[220px] leading-none text-pitch-black opacity-[0.04]">01</span>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-12 py-12 sm:py-16 md:py-24 grid md:grid-cols-2 gap-8 md:gap-16 items-start">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-graphite-border mb-3 font-medium">Zero config</p>
              <h2 className="font-display font-extrabold text-[clamp(28px,4vw,44px)] leading-[1] tracking-[-0.03em] mb-5">
                Drop in.<br />It just works.
              </h2>
              <p className="text-graphite-border leading-relaxed mb-6 text-[15px] break-words">
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
              <svg width="260" height="260" viewBox="0 0 260 260" fill="none" className="max-w-full h-auto">
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
          <span className="pointer-events-none select-none absolute -left-6 top-1/2 -translate-y-1/2 font-display font-extrabold text-[120px] md:text-[220px] leading-none text-pitch-black opacity-[0.04]">02</span>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-12 py-12 sm:py-16 md:py-24 grid md:grid-cols-2 gap-8 md:gap-16 items-start">
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
              <p className="text-graphite-border leading-relaxed mb-6 text-[15px] break-words">
                Five built-in curves — including a <Tag>spring</Tag> that
                overshoots and settles — or any custom{' '}
                <Tag>(t: number) =&gt; number</Tag> function.
                The <Tag>speed</Tag> prop compresses or stretches the draw
                relative to your scroll distance.
              </p>
              <CodeBlock filename="index.tsx">
{`<ScrollDraw
  easing="spring"
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
          <span className="pointer-events-none select-none absolute -right-6 top-1/2 -translate-y-1/2 font-display font-extrabold text-[120px] md:text-[220px] leading-none text-pitch-black opacity-[0.04]">03</span>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-12 py-12 sm:py-16 md:py-24 grid md:grid-cols-2 gap-8 md:gap-16 items-start">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-graphite-border mb-3 font-medium">Fade</p>
              <h2 className="font-display font-extrabold text-[clamp(28px,4vw,44px)] leading-[1] tracking-[-0.03em] mb-5">
                Draw and<br />materialise.
              </h2>
              <p className="text-graphite-border leading-relaxed mb-6 text-[15px] break-words">
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
          <span className="pointer-events-none select-none absolute -left-6 top-1/2 -translate-y-1/2 font-display font-extrabold text-[120px] md:text-[220px] leading-none text-pitch-black opacity-[0.04]">04</span>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-12 py-12 sm:py-16 md:py-24 grid md:grid-cols-2 gap-8 md:gap-16 items-start">
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

        {/* 06 — autoReverse */}
        <section data-mascot="think" className="relative border-b border-pitch-black bg-marketplace-gray overflow-hidden">
          <span className="pointer-events-none select-none absolute -left-6 top-1/2 -translate-y-1/2 font-display font-extrabold text-[120px] md:text-[220px] leading-none text-pitch-black opacity-[0.04]">06</span>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-12 py-12 sm:py-16 md:py-24 grid md:grid-cols-2 gap-8 md:gap-16 items-start">
            <InteractiveScrollDemo
              className="order-2 md:order-1"
              defaultEasing="ease-in-out"
              defaultSpeed={0.9}
              svgBg="white"
            >
              <svg width="260" height="200" viewBox="0 0 260 200" fill="none">
                <path d="M 20 100 C 60 30 100 170 130 100 C 160 30 200 170 240 100"
                  stroke="#000" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                <path d="M 20 100 C 60 30 100 170 130 100 C 160 30 200 170 240 100"
                  stroke="#ff90e8" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.35"/>
                <line x1="20" y1="100" x2="240" y2="100" stroke="#ddd" strokeWidth="1" strokeDasharray="4 4"/>
                {[20,65,110,155,200,240].map((x) => (
                  <circle key={x} cx={x} cy={100} r="3" fill="#e2e2e2" stroke="#bbb" strokeWidth="1"/>
                ))}
              </svg>
            </InteractiveScrollDemo>
            <div className="order-1 md:order-2">
              <p className="text-[11px] uppercase tracking-[0.22em] text-graphite-border mb-3 font-medium">Auto Reverse</p>
              <h2 className="font-display font-extrabold text-[clamp(28px,4vw,44px)] leading-[1] tracking-[-0.03em] mb-5">
                Scroll up,<br />draw back.
              </h2>
              <p className="text-graphite-border leading-relaxed mb-6 text-[15px] break-words">
                Enable <Tag>autoReverse</Tag> and the animation automatically
                follows scroll direction — drawing forward as you scroll down,
                erasing as you scroll back up. No manual <Tag>direction</Tag> switching needed.
              </p>
              <CodeBlock filename="index.tsx">
{`<ScrollDraw autoReverse>
  <svg>...</svg>
</ScrollDraw>`}
              </CodeBlock>
            </div>
          </div>
        </section>

        {/* 07 — strokeColor */}
        <section data-mascot="magic" className="relative border-b border-pitch-black overflow-hidden">
          <span className="pointer-events-none select-none absolute -right-6 top-1/2 -translate-y-1/2 font-display font-extrabold text-[120px] md:text-[220px] leading-none text-pitch-black opacity-[0.04]">07</span>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-12 py-12 sm:py-16 md:py-24 grid md:grid-cols-2 gap-8 md:gap-16 items-start">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-graphite-border mb-3 font-medium">Color Animation</p>
              <h2 className="font-display font-extrabold text-[clamp(28px,4vw,44px)] leading-[1] tracking-[-0.03em] mb-5">
                Color that<br />follows the draw.
              </h2>
              <p className="text-graphite-border leading-relaxed mb-6 text-[15px] break-words">
                Pass a <Tag>[from, to]</Tag> tuple to <Tag>strokeColor</Tag> and the stroke
                interpolates between two colors as the path draws.
                No extra CSS or keyframes — the engine handles it per-frame.
              </p>
              <CodeBlock filename="index.tsx">
{`<ScrollDraw
  strokeColor={['#ff6b9d', '#ffc900']}
  easing="ease-out"
>
  <svg>...</svg>
</ScrollDraw>`}
              </CodeBlock>
            </div>
            <InteractiveScrollDemo
              defaultEasing="ease-out"
              defaultSpeed={0.8}
              svgBg="gray"
              colorFrom="#ff6b9d"
              colorTo="#ffc900"
            >
              <svg width="260" height="200" viewBox="0 0 260 200" fill="none">
                <path d="M 20 160 C 40 80 80 40 130 50 C 180 60 220 100 240 60"
                  stroke="#ff6b9d" strokeWidth="3" strokeLinecap="round"/>
                <path d="M 20 160 C 40 120 80 100 130 100 C 180 100 220 140 240 120"
                  stroke="#ff6b9d" strokeWidth="1.5" strokeLinecap="round" opacity="0.35"/>
              </svg>
            </InteractiveScrollDemo>
          </div>
        </section>

        {/* 08 — strokeWidth */}
        <section data-mascot="draw" className="relative border-b border-pitch-black bg-marketplace-gray overflow-hidden">
          <span className="pointer-events-none select-none absolute -left-6 top-1/2 -translate-y-1/2 font-display font-extrabold text-[120px] md:text-[220px] leading-none text-pitch-black opacity-[0.04]">08</span>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-12 py-12 sm:py-16 md:py-24 grid md:grid-cols-2 gap-8 md:gap-16 items-start">
            <InteractiveScrollDemo
              className="order-2 md:order-1"
              defaultEasing="ease-in-out"
              defaultSpeed={0.9}
              svgBg="white"
              widthFrom={0.5}
              widthTo={6}
            >
              <svg width="260" height="200" viewBox="0 0 260 200" fill="none">
                <path d="M 20 170 C 40 100 70 60 110 70 C 150 80 160 40 200 30 C 220 25 240 40 250 60"
                  stroke="#000" strokeWidth="0.5" strokeLinecap="round"/>
                <path d="M 20 170 C 40 140 70 130 110 135 C 150 140 180 130 220 135 C 235 138 248 145 255 155"
                  stroke="#ff90e8" strokeWidth="0.5" strokeLinecap="round" opacity="0.5"/>
              </svg>
            </InteractiveScrollDemo>
            <div className="order-1 md:order-2">
              <p className="text-[11px] uppercase tracking-[0.22em] text-graphite-border mb-3 font-medium">Width Animation</p>
              <h2 className="font-display font-extrabold text-[clamp(28px,4vw,44px)] leading-[1] tracking-[-0.03em] mb-5">
                Hairline thin<br />to bold.
              </h2>
              <p className="text-graphite-border leading-relaxed mb-6 text-[15px] break-words">
                Pass a <Tag>[from, to]</Tag> tuple to <Tag>strokeWidth</Tag> and
                the line grows from a hairline to any thickness as it draws.
                Combine with <Tag>strokeColor</Tag> for dramatic logo reveals.
              </p>
              <CodeBlock filename="index.tsx">
{`<ScrollDraw
  strokeWidth={[0.5, 6]}
  easing="ease-in-out"
>
  <svg>...</svg>
</ScrollDraw>`}
              </CodeBlock>
            </div>
          </div>
        </section>

        {/* 09 — waypoints */}
        <WaypointsDemo />

        {/* 10 — morphTo */}
        <section data-mascot="magic" className="relative border-b border-pitch-black overflow-hidden">
          <span className="pointer-events-none select-none absolute -right-6 top-1/2 -translate-y-1/2 font-display font-extrabold text-[120px] md:text-[220px] leading-none text-pitch-black opacity-[0.04]">10</span>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-12 py-12 sm:py-16 md:py-24 grid md:grid-cols-2 gap-8 md:gap-16 items-start">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-graphite-border mb-3 font-medium">Path Morphing</p>
              <h2 className="font-display font-extrabold text-[clamp(28px,4vw,44px)] leading-[1] tracking-[-0.03em] mb-5">
                Shape-shifts<br />as you scroll.
              </h2>
              <p className="text-graphite-border leading-relaxed mb-6 text-[15px] break-words">
                Pass a <Tag>morphTo</Tag> path string and the SVG shape interpolates
                from its original <Tag>d</Tag> to the target as you scroll.
                Both paths must have the same command count — perfect for logo reveals and icon transitions.
              </p>
              <CodeBlock filename="index.tsx">
{`<ScrollDraw
  morphTo="M 130 40 L 220 130 L 130 220 L 40 130 Z"
  easing="ease-in-out"
>
  <svg>
    <path d="M 130 40 C 220 40 220 220 130 220
             C 40 220 40 40 130 40 Z" />
  </svg>
</ScrollDraw>`}
              </CodeBlock>
            </div>
            <InteractiveScrollDemo
              defaultEasing="ease-in-out"
              defaultSpeed={0.9}
              svgBg="white"
            >
              <svg width="260" height="260" viewBox="0 0 260 260" fill="none">
                {/* Circle → diamond morph — shown via static preview; live via ScrollDraw on the page */}
                <path
                  d="M 130 40 C 196 40 220 84 220 130 C 220 176 196 220 130 220 C 64 220 40 176 40 130 C 40 84 64 40 130 40 Z"
                  stroke="#000" strokeWidth="2.5" strokeLinecap="round" fill="none"
                />
                <path
                  d="M 130 40 L 220 130 L 130 220 L 40 130 Z"
                  stroke="#ff90e8" strokeWidth="1.5" strokeLinecap="round"
                  strokeDasharray="6 4" fill="none" opacity="0.5"
                />
                <circle cx="130" cy="40"  r="4" fill="#ff90e8" />
                <circle cx="220" cy="130" r="4" fill="#ff90e8" />
                <circle cx="130" cy="220" r="4" fill="#ff90e8" />
                <circle cx="40"  cy="130" r="4" fill="#ff90e8" />
                <text x="130" y="136" textAnchor="middle" fontSize="10" fontFamily="monospace" fill="#999" opacity="0.6">morphs to →</text>
              </svg>
            </InteractiveScrollDemo>
          </div>
        </section>

        {/* 11 — Group API */}
        <section data-mascot="celebrate" className="relative border-b border-pitch-black bg-marketplace-gray overflow-hidden">
          <span className="pointer-events-none select-none absolute -left-6 top-1/2 -translate-y-1/2 font-display font-extrabold text-[120px] md:text-[220px] leading-none text-pitch-black opacity-[0.04]">11</span>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-12 py-12 sm:py-16 md:py-24 grid md:grid-cols-2 gap-8 md:gap-16 items-start">
            <div className="order-2 md:order-1 flex flex-col gap-3 sm:gap-4">
              {/* Three mini SVG containers stacked */}
              {[
                { stroke: '#ff90e8', d: 'M 20 60 C 40 10 80 10 100 60 S 160 110 180 60' },
                { stroke: '#ffc900', d: 'M 20 60 L 60 20 L 100 60 L 140 20 L 180 60' },
                { stroke: '#000',    d: 'M 20 40 C 60 10 120 110 180 40' },
              ].map(({ stroke, d }, i) => (
                <div key={i} className="flex-1 flex items-center justify-center rounded-2xl border border-pitch-black bg-[#ffffff] p-4 sm:p-6 shadow-[2px_2px_0px_#000]">
                  <svg width="180" height="80" viewBox="0 0 200 80" fill="none" className="max-w-full h-auto">
                    <path d={d} stroke={stroke} strokeWidth="3" strokeLinecap="round" fill="none" />
                  </svg>
                </div>
              ))}
            </div>
            <div className="order-1 md:order-2">
              <p className="text-[11px] uppercase tracking-[0.22em] text-graphite-border mb-3 font-medium">Group API</p>
              <h2 className="font-display font-extrabold text-[clamp(28px,4vw,44px)] leading-[1] tracking-[-0.03em] mb-5">
                Many SVGs,<br />one command.
              </h2>
              <p className="text-graphite-border leading-relaxed mb-6 text-[15px] break-words">
                Use <Tag>scrollDrawGroup</Tag> to animate multiple SVG containers simultaneously
                with shared options. Or use <Tag>scrollDrawSequence</Tag> to chain them — each one
                starts only after the previous finishes.
              </p>
              <CodeBlock filename="main.js">
{`import { scrollDrawGroup, scrollDrawSequence }
  from 'svg-scroll-draw/group';

// Animate all three at once
const group = scrollDrawGroup(
  ['#chart-1', '#chart-2', '#chart-3'],
  { easing: 'ease-out', stagger: 0.1 }
);

// Or chain them in sequence
const seq = scrollDrawSequence(
  ['#step-1', '#step-2', '#step-3'],
  { easing: 'spring' }
);`}
              </CodeBlock>
            </div>
          </div>
        </section>

        {/* 12 — useScrollDrawProgress hook */}
        <ProgressHookDemo />

        {/* 13 — fillOpacity */}
        <FillOpacityDemo />

        {/* 14 — clip mode */}
        <ClipModeDemo />

      </div>

      {/* ── API Reference ─────────────────────────────────────────────── */}
      <section data-mascot="think" className="bg-marketplace-gray border-t border-pitch-black border-b px-4 sm:px-6 md:px-12 py-12 sm:py-16 md:py-20">
        <div className="max-w-5xl mx-auto">
          <p className="text-[11px] uppercase tracking-[0.22em] text-graphite-border mb-3 font-medium">Reference</p>
          <h2 className="font-display font-extrabold text-[clamp(28px,5vw,56px)] leading-[0.95] tracking-[-0.03em] mb-8 sm:mb-12">
            All options.
          </h2>

          <div className="border border-pitch-black rounded-2xl overflow-hidden bg-light-linen shadow-[4px_4px_0px_#000] overflow-x-auto">
            <div className="hidden md:grid grid-cols-[160px_130px_190px_1fr] gap-4 px-6 py-3 bg-pitch-black text-light-linen text-[11px] uppercase tracking-[0.15em] font-medium">
              <span>Option</span><span>Type</span><span>Default</span><span>Description</span>
            </div>
            {[
              { prop: 'selector', type: 'string', def: '"path, polyline…"', desc: 'CSS selector to target specific child elements.' },
              { prop: 'speed', type: 'number', def: '1', desc: 'Scale factor — values above 1 complete the animation faster.' },
              { prop: 'fade', type: 'boolean', def: 'false', desc: 'Animate opacity 0 → 1 simultaneously while drawing.' },
              { prop: 'easing', type: 'string | fn', def: '"linear"', desc: 'linear · ease-in · ease-out · ease-in-out · spring · or custom (t) => t.' },
              { prop: 'stagger', type: 'number', def: '0', desc: 'Normalized scroll-progress offset between each path starting. e.g. 0.15 → each path begins 15% of the range after the previous.' },
              { prop: 'direction', type: '"forward"|"reverse"', def: '"forward"', desc: 'forward draws the path in. reverse starts fully drawn and erases as you scroll.' },
              { prop: 'once', type: 'boolean', def: 'false', desc: 'Draw once and stay drawn — animation does not reverse when scrolling back up.' },
              { prop: 'debug', type: 'boolean', def: 'false', desc: 'Renders a visual overlay showing trigger start/end zones. Dev-only, stripped in production.' },
              { prop: 'axis', type: '"x" | "y"', def: '"y"', desc: 'Scroll axis to track. Use "x" for horizontal scroll containers.' },
              { prop: 'scrollContainer', type: 'string | Element', def: 'window', desc: 'CSS selector or Element for a custom scroll container instead of the window.' },
              { prop: 'autoReverse', type: 'boolean', def: 'false', desc: 'Automatically reverse the animation when the user scrolls back up.' },
              { prop: 'delay', type: 'number', def: '0', desc: 'Milliseconds to wait before the engine starts observing — useful for page-load sequences.' },
              { prop: 'strokeColor', type: 'string | [string,string]', def: '—', desc: 'Static color override or [from, to] tuple to animate stroke color as the path draws.' },
              { prop: 'strokeWidth', type: 'number | [number,number]', def: '—', desc: 'Static width override or [from, to] tuple to animate stroke width as the path draws.' },
              { prop: 'fillOpacity', type: 'number | [number,number]', def: '—', desc: 'Static fill-opacity override or [from, to] tuple to animate fill opacity in sync with the stroke draw. Use [0, 1] to flood fill as the outline traces itself.' },
              { prop: 'clip', type: 'boolean | string', def: 'false', desc: "Reveal using CSS clip-path instead of stroke-dashoffset. Works on any HTML/SVG content. Values: 'left' (default), 'right', 'top', 'bottom', 'center' (radial). All easing/speed/trigger options apply." },
              { prop: 'waypoints', type: 'Record<number, fn>', def: '—', desc: 'Fire callbacks at specific progress thresholds (0–1). e.g. { 0.5: () => doSomething() }. Resets on replay().' },
              { prop: 'trigger.start', type: 'string', def: '"top bottom"', desc: 'When animation begins. Accepts anchor strings ("top bottom") or viewport percentages ("20%").' },
              { prop: 'trigger.end', type: 'string', def: '"bottom top"', desc: 'When animation ends. Accepts anchor strings or viewport percentages.' },
              { prop: 'velocityScale', type: 'boolean | number', def: 'false', desc: 'Scale draw speed by scroll velocity — faster scrolling draws faster. Pass a number to set sensitivity.' },
              { prop: 'threshold', type: 'number', def: '0', desc: 'IntersectionObserver threshold — how much of the element must be visible before animating.' },
              { prop: 'rootMargin', type: 'string', def: '"0px"', desc: 'IntersectionObserver rootMargin — expand or shrink the trigger zone.' },
              { prop: 'repeat', type: 'number | "infinite"', def: '0', desc: 'Repeat the animation N times. Use "infinite" to loop forever.' },
              { prop: 'repeatDelay', type: 'number', def: '0', desc: 'Milliseconds to wait between repeats.' },
              { prop: 'morphTo', type: 'string', def: '—', desc: 'SVG path `d` value to morph toward as the animation progresses.' },
              { prop: 'onStart', type: '() => void', def: '—', desc: 'Fires once on the first frame the animation begins drawing.' },
              { prop: 'onProgress', type: '(n: number) => void', def: '—', desc: 'Called every animation frame with current draw alpha (0–1).' },
              { prop: 'onComplete', type: '() => void', def: '—', desc: 'Fires once when all paths reach 100% draw progress.' },
              { prop: 'useScrollDrawProgress', type: 'hook', def: '—', desc: 'React hook — returns scroll progress (0–1) for any element. Same trigger/speed/easing options as ScrollDraw. No SVG required.' },
            ].map(({ prop, type, def, desc }, i) => (
              <div
                key={prop}
                className={`grid grid-cols-1 md:grid-cols-[160px_130px_190px_1fr] gap-1.5 md:gap-4 px-4 sm:px-6 py-3 sm:py-4 text-sm items-start ${i < 26 ? 'border-b border-subtle-ash' : ''}`}
              >
                <code className="font-mono font-semibold text-pitch-black text-[12px] sm:text-sm">{prop}</code>
                <code className="font-mono text-graphite-border text-[11px] sm:text-[13px]"><span className="md:hidden text-[10px] uppercase tracking-wide text-graphite-border/60 mr-1">type:</span>{type}</code>
                <code className="font-mono text-graphite-border text-[11px] sm:text-[13px]"><span className="md:hidden text-[10px] uppercase tracking-wide text-graphite-border/60 mr-1">default:</span>{def}</code>
                <p className="text-graphite-border text-[13px] sm:text-[14px] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Framework quickstart ──────────────────────────────────────── */}
      <section className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-12 sm:py-16 md:py-20">
        <div className="max-w-5xl mx-auto">
          <p className="text-[11px] uppercase tracking-[0.22em] text-graphite-border mb-3 font-medium">Quickstart</p>
          <h2 className="font-display font-extrabold text-[clamp(28px,5vw,56px)] leading-[0.95] tracking-[-0.03em] mb-8 sm:mb-12">
            Works everywhere<br />you do.
          </h2>
          <FrameworkTabs />
        </div>
      </section>

      {/* ── Live Stats ────────────────────────────────────────────────── */}
      <LiveStats />

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <section data-mascot="big-dance" className="relative bg-sunshine-yellow border-b border-pitch-black px-4 sm:px-6 md:px-12 py-16 sm:py-20 md:py-24 text-center overflow-hidden">
        <CtaBoldMark />
        <h2 className="font-display font-extrabold leading-[0.9] tracking-[-0.04em] mb-6 sm:mb-8 text-pitch-black"
            style={{ fontSize: 'clamp(32px,8vw,96px)' }}>
          THE MODERN<br />STANDARD FOR<br />SCROLL-DRAWN SVG.
        </h2>
        <div className="flex flex-col items-center justify-center gap-3 w-full max-w-sm mx-auto sm:max-w-none sm:flex-row sm:flex-wrap">
          <div className="flex items-center gap-2 bg-pitch-black text-light-linen rounded-full px-5 py-3 text-sm font-mono shadow-[3px_3px_0px_rgba(0,0,0,0.3)] w-full sm:w-auto justify-center">
            <span className="opacity-50">$</span>
            <span>npm i svg-scroll-draw</span>
          </div>
          <a
            href="/playground"
            className="px-5 py-3 rounded-full border-2 border-pitch-black bg-transparent text-pitch-black text-sm font-semibold hover:bg-pitch-black hover:text-sunshine-yellow transition-colors shadow-[3px_3px_0px_rgba(0,0,0,0.2)] w-full sm:w-auto text-center"
          >
            ⚡ Try the Playground →
          </a>
          <a
            href={GH}
            target="_blank" rel="noopener noreferrer"
            className="px-5 py-3 rounded-full border-2 border-pitch-black bg-transparent text-pitch-black text-sm font-semibold hover:bg-pitch-black hover:text-sunshine-yellow transition-colors shadow-[3px_3px_0px_rgba(0,0,0,0.2)] w-full sm:w-auto text-center"
          >
            View on GitHub →
          </a>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="px-4 sm:px-6 md:px-12 py-8 border-t border-subtle-ash">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
          <span className="font-display font-bold text-sm tracking-tight">svg-scroll-draw</span>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 text-[13px] text-graphite-border">
            <span>MIT License</span>
            <span className="text-subtle-ash">·</span>
            <span>~3 KB gzipped</span>
            <span className="text-subtle-ash">·</span>
            <span>Zero dependencies</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
            <a
              href="/examples"
              className="text-[12px] font-medium px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors"
            >
              Examples
            </a>
            <a
              href={GH}
              target="_blank" rel="noopener noreferrer"
              className="text-[12px] font-medium px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors flex items-center gap-1.5"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              GitHub
            </a>
            <a
              href={NPM}
              target="_blank" rel="noopener noreferrer"
              className="text-[12px] font-medium px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors flex items-center gap-1.5"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M0 0v24h24V0H0zm19.2 19.2H4.8V4.8h14.4v14.4zm-9.6-9.6v4.8H7.2V7.2h9.6v7.2h-4.8V9.6h-2.4z"/>
              </svg>
              npm
            </a>
            <span className="text-[11px] font-mono text-graphite-border">v1.0.0</span>
          </div>
        </div>

        {/* Product Hunt embed card */}
        <div className="mt-6 pt-6 border-t border-subtle-ash flex justify-center">
          <div style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            border: '1px solid rgb(224, 224, 224)',
            borderRadius: 12,
            padding: '16px',
            maxWidth: 500,
            width: '100%',
            background: 'rgb(255, 255, 255)',
            boxShadow: 'rgba(0,0,0,0.05) 0px 2px 8px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <img
                alt="svg-scroll-draw"
                src="https://ph-files.imgix.net/1ed7196f-bc94-4765-a849-68b31b0c32bd.png?auto=format&fit=crop&w=80&h=80"
                style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'rgb(26,26,26)', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  svg-scroll-draw
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: 14, color: 'rgb(102,102,102)', lineHeight: 1.4 }}>
                  Scroll-driven SVG path animation. Zero deps. 3 KB.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
              <a
                href="https://www.producthunt.com/products/svg-scroll-draw?utm_source=embed&utm_medium=post_embed"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '8px 16px',
                  background: 'rgb(255,97,84)', color: 'rgb(255,255,255)',
                  textDecoration: 'none', borderRadius: 8,
                  fontSize: 14, fontWeight: 600,
                }}
              >
                Check it out on Product Hunt →
              </a>
              <a
                href="https://www.producthunt.com/products/svg-scroll-draw/reviews/new?utm_source=badge-product_review&utm_medium=badge"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src="https://api.producthunt.com/widgets/embed-image/v1/product_review.svg?product_id=1235411&theme=light"
                  alt="Leave a review on Product Hunt"
                  width={200}
                  height={43}
                />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-subtle-ash text-center text-[11px] text-graphite-border font-mono">
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
