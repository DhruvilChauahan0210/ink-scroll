import type { Metadata } from 'next';
import Link from 'next/link';
import { MobileMenu } from '@/components/MobileMenu';

export const metadata: Metadata = {
  title: 'Zero-JS SVG Scroll Animations with Native CSS',
  description:
    'How svg-scroll-draw uses animation-timeline: view() to run SVG path animations entirely on the browser compositor — zero per-frame JavaScript, no scroll listeners, 60fps guaranteed.',
  keywords: [
    'css animation-timeline view',
    'scroll driven animations css',
    'svg scroll animation native css',
    'animation-timeline svg',
    'scroll-driven animations without javascript',
    'css scroll animation path',
    'svg-scroll-draw native css',
    'compositor animation svg',
    'zero js animation scroll',
  ],
  alternates: { canonical: '/blog/native-css-svg-scroll-animations' },
  openGraph: {
    title: 'Zero-JS SVG Scroll Animations with Native CSS',
    description:
      'How svg-scroll-draw offloads SVG path animations to the browser compositor using animation-timeline: view() — zero JS, 60fps, instant.',
    url: 'https://svg-scroll-draw.vercel.app/blog/native-css-svg-scroll-animations',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Zero-JS SVG Scroll Animations with Native CSS',
    description: 'Zero per-frame JS. SVG path animations driven entirely by CSS on the compositor thread.',
  },
};

const GH  = 'https://github.com/DhruvilChauahan0210/ink-scroll';
const NPM = 'https://www.npmjs.com/package/svg-scroll-draw';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Zero-JS SVG Scroll Animations with Native CSS',
  description:
    'How svg-scroll-draw uses animation-timeline: view() to run SVG path animations entirely on the browser compositor.',
  author: { '@type': 'Person', name: 'Dhruvil Chauhan' },
  datePublished: '2026-06-04',
  url: 'https://svg-scroll-draw.vercel.app/blog/native-css-svg-scroll-animations',
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

const BROWSER_SUPPORT = [
  { browser: 'Chrome',          version: '115+', status: 'full',    note: 'Full support since Jul 2023' },
  { browser: 'Edge',            version: '115+', status: 'full',    note: 'Same engine as Chrome' },
  { browser: 'Firefox',         version: '110+', status: 'full',    note: 'Full support since Mar 2023' },
  { browser: 'Safari',          version: '—',    status: 'none',    note: 'Not yet supported — JS fallback active' },
  { browser: 'Chrome Android',  version: '115+', status: 'full',    note: 'Full mobile support' },
  { browser: 'Firefox Android', version: '110+', status: 'full',    note: 'Full mobile support' },
  { browser: 'Safari iOS',      version: '—',    status: 'none',    note: 'Not yet — JS fallback active' },
];

const statusColor: Record<string, string> = {
  full:    '#22c55e',
  partial: '#ffc900',
  none:    '#ef4444',
};

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
          <div className="flex lg:hidden">
            <MobileMenu />
          </div>
        </nav>

        {/* Hero */}
        <section className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-12 sm:py-16 md:py-20">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 mb-6 text-[11px] font-mono text-graphite-border">
              <Link href="/" className="hover:text-pitch-black transition-colors">svg-scroll-draw</Link>
              <span>/</span>
              <Link href="/blog" className="hover:text-pitch-black transition-colors">blog</Link>
              <span>/</span>
              <span className="text-pitch-black">native-css</span>
            </div>

            <SectionLabel>Performance · June 2026 · 7 min read</SectionLabel>

            <h1 className="font-display font-extrabold text-[clamp(26px,5vw,60px)] leading-[0.92] tracking-[-0.04em] mb-6">
              Zero-JS SVG scroll<br />
              <span className="relative inline-block">
                <span className="relative z-10 px-2">animations.</span>
                <span className="absolute inset-0 bg-creator-pink rounded-xl -rotate-[0.5deg]" />
              </span>
            </h1>

            <p className="text-base sm:text-lg text-graphite-border max-w-2xl leading-relaxed mb-8">
              Since v1.1.0, svg-scroll-draw automatically hands off eligible animations to the browser&apos;s
              native CSS compositor using{' '}
              <code className="font-mono text-sm bg-marketplace-gray border border-subtle-ash px-1.5 py-0.5 rounded-md text-pitch-black">animation-timeline: view()</code>.
              Zero per-frame JavaScript. No scroll listeners. 60fps even under heavy CPU load.
            </p>

            <div className="flex flex-wrap gap-3">
              {[
                { label: 'JS per frame', value: '0 bytes', color: '#22c55e' },
                { label: 'Scroll listeners', value: 'none', color: '#22c55e' },
                { label: 'Browser support', value: 'Chrome/FF 115+', color: '#ff90e8' },
                { label: 'Opt-out', value: 'native: false', color: '#888' },
              ].map((s) => (
                <div key={s.label} className="border border-pitch-black rounded-xl px-4 py-3 bg-white">
                  <p className="text-[10px] font-mono text-graphite-border mb-0.5">{s.label}</p>
                  <p className="font-display font-extrabold text-lg leading-none" style={{ color: s.color }}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What is animation-timeline */}
        <section className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-12 sm:py-14">
          <div className="max-w-4xl mx-auto">
            <SectionLabel>The CSS primitive</SectionLabel>
            <h2 className="font-display font-extrabold text-[clamp(22px,4vw,42px)] leading-[1] tracking-[-0.03em] mb-6">
              What is <code className="font-mono">animation-timeline: view()</code>?
            </h2>
            <div className="space-y-4 text-[15px] text-graphite-border leading-relaxed max-w-2xl">
              <p>
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/animation-timeline/view"
                  target="_blank" rel="noopener noreferrer"
                  className="text-pitch-black font-medium underline underline-offset-2">
                  Scroll-Driven Animations
                </a>{' '}
                is a CSS spec that lets you tie a CSS <code className="font-mono text-[13px] text-pitch-black">@keyframes</code> animation
                to the scroll position of an element in the viewport — without any JavaScript.
                The browser handles it entirely on the compositor thread.
              </p>
              <p>
                The key property is <code className="font-mono text-[13px] text-pitch-black">animation-timeline: view()</code>.
                Combined with <code className="font-mono text-[13px] text-pitch-black">animation-range</code>, you declare
                &ldquo;play this animation as the element travels from X to Y in the viewport&rdquo;.
                The browser scrubs the animation in sync with scroll — no rAF, no event listeners,
                no JavaScript execution per frame.
              </p>
            </div>

            <Code filename="native-css-raw.css">{`/* Pure CSS scroll-driven animation */
@keyframes draw-path {
  from { stroke-dashoffset: var(--path-length); }
  to   { stroke-dashoffset: 0; }
}

path {
  stroke-dasharray:  var(--path-length);
  stroke-dashoffset: var(--path-length);

  animation-name:           draw-path;
  animation-timing-function: ease-out;
  animation-fill-mode:      both;
  animation-duration:       1s; /* ignored — scroll drives it */

  animation-timeline: view();   /* scroll-driven */
  animation-range: entry 20% exit 80%;
}`}
            </Code>

            <p className="text-[15px] text-graphite-border leading-relaxed max-w-2xl">
              The catch: you have to know the path length upfront (to set <code className="font-mono text-[13px] text-pitch-black">--path-length</code>),
              and Safari doesn&apos;t support it yet. That&apos;s where svg-scroll-draw comes in —
              it measures the length, injects the CSS, and falls back to the JS engine seamlessly on unsupported browsers.
            </p>
          </div>
        </section>

        {/* How svg-scroll-draw activates it */}
        <section className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-12 sm:py-14 bg-marketplace-gray">
          <div className="max-w-4xl mx-auto">
            <SectionLabel>Under the hood</SectionLabel>
            <h2 className="font-display font-extrabold text-[clamp(22px,4vw,42px)] leading-[1] tracking-[-0.03em] mb-6">
              How svg-scroll-draw activates the native path
            </h2>
            <div className="space-y-4 text-[15px] text-graphite-border leading-relaxed max-w-2xl mb-8">
              <p>
                When you call <code className="font-mono text-[13px] text-pitch-black">scrollDraw()</code>, the engine
                first checks whether the config is &ldquo;native-eligible&rdquo;. If it is and the browser supports
                <code className="font-mono text-[13px] text-pitch-black"> animation-timeline: view()</code>,
                it generates a <code className="font-mono text-[13px] text-pitch-black">&lt;style&gt;</code> tag
                and injects the CSS keyframe animation — then returns. The JS rAF loop never starts.
              </p>
              <p>
                If the browser doesn&apos;t support it (Safari, older Chrome/FF), the engine falls back
                to the full JS path transparently. Your code doesn&apos;t change. The animation looks identical.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              <div className="bg-white rounded-2xl border border-[#22c55e] p-5">
                <p className="text-[11px] font-mono font-semibold text-[#22c55e] uppercase tracking-wider mb-3">Native CSS path</p>
                <ul className="space-y-2 text-[13px]">
                  {[
                    'Runs on compositor thread',
                    'Zero per-frame JavaScript',
                    'No scroll event listeners',
                    'No requestAnimationFrame',
                    '60fps even under heavy CPU load',
                    'Instant response to scroll direction changes',
                  ].map(item => (
                    <li key={item} className="flex items-center gap-2">
                      <span className="text-[#22c55e] font-bold">✓</span>
                      <span className="text-graphite-border">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white rounded-2xl border border-subtle-ash p-5">
                <p className="text-[11px] font-mono font-semibold text-graphite-border uppercase tracking-wider mb-3">JS fallback path</p>
                <ul className="space-y-2 text-[13px]">
                  {[
                    'IntersectionObserver gating',
                    'requestAnimationFrame loop',
                    'Runs only while visible',
                    'Same visual result',
                    'Full instance API works',
                    'Activates automatically on Safari',
                  ].map(item => (
                    <li key={item} className="flex items-center gap-2">
                      <span className="text-graphite-border">→</span>
                      <span className="text-graphite-border">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <Code filename="engine.ts (simplified eligibility check)">{`function isNativeEligible(options) {
  if (!CSS.supports('animation-timeline', 'view()')) return false;
  if (options.native === false)      return false; // explicit opt-out
  if (options.stagger !== 0)         return false; // stagger needs JS timing
  if (options.onProgress || options.onStart || options.onComplete) return false; // callbacks need JS frames
  if (options.morphTo)               return false; // path interpolation = JS only
  if (options.velocityScale)         return false; // needs live velocity
  if (options.repeat || options.once) return false; // loop/once logic = JS
  if (typeof options.easing === 'function') return false; // custom fn = JS
  if (options.speed !== 1)           return false; // non-1 speed shifts the range
  if (options.strokeColor || options.strokeWidth || options.fillOpacity) return false;
  return true; // ✓ hand off to CSS
}`}
            </Code>
          </div>
        </section>

        {/* Eligibility rules */}
        <section className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-12 sm:py-14">
          <div className="max-w-4xl mx-auto">
            <SectionLabel>Eligibility</SectionLabel>
            <h2 className="font-display font-extrabold text-[clamp(22px,4vw,42px)] leading-[1] tracking-[-0.03em] mb-6">
              What triggers native vs JS?
            </h2>
            <p className="text-[15px] text-graphite-border leading-relaxed max-w-2xl mb-8">
              The native path activates when all of these are true:
            </p>

            <div className="space-y-3 mb-8">
              {[
                {
                  condition: 'Browser supports animation-timeline: view()',
                  detail: 'Chrome 115+, Edge 115+, Firefox 110+. Safari falls back automatically.',
                  native: true,
                },
                {
                  condition: 'No callbacks (onProgress, onStart, onComplete)',
                  detail: 'Callbacks require a JS frame to fire. Declaring any callback forces the JS engine.',
                  native: true,
                },
                {
                  condition: 'No stagger',
                  detail: 'stagger offsets individual paths by time fractions — CSS can\'t express per-path delays within a single view() range.',
                  native: true,
                },
                {
                  condition: 'No morphTo, velocityScale, repeat, or once',
                  detail: 'These features need frame-by-frame state management that CSS can\'t provide.',
                  native: true,
                },
                {
                  condition: 'Named easing (not a custom function)',
                  detail: 'linear, ease-in, ease-out, ease-in-out map directly to CSS timing functions. Spring/bounce/elastic and custom functions require JS.',
                  native: true,
                },
                {
                  condition: 'speed === 1 (default)',
                  detail: 'Non-1 speed values shift the effective trigger range. This is trivial in JS but requires a CSS calc() trick that isn\'t worth the complexity.',
                  native: true,
                },
                {
                  condition: 'No animated colors or widths',
                  detail: 'strokeColor, strokeWidth, fillOpacity — all require per-frame interpolation.',
                  native: true,
                },
              ].map(({ condition, detail, native }) => (
                <div key={condition} className={`rounded-xl border p-4 ${native ? 'border-[#22c55e33] bg-[#22c55e08]' : 'border-subtle-ash bg-white'}`}>
                  <div className="flex items-start gap-3">
                    <span className="text-[#22c55e] font-bold text-base mt-0.5 shrink-0">✓</span>
                    <div>
                      <p className="font-medium text-[13px] mb-1">{condition}</p>
                      <p className="text-[12px] text-graphite-border leading-relaxed">{detail}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Callout label="The 90% case" color="#ff90e8">
              The vast majority of real-world scroll-draw animations — a logo tracing in, a line chart
              appearing, a hero illustration drawing — use the default options. No callbacks, no stagger,
              default speed, named easing. These all hit the native path automatically on Chrome and Firefox.
            </Callout>
          </div>
        </section>

        {/* Code examples */}
        <section className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-12 sm:py-14 bg-marketplace-gray">
          <div className="max-w-4xl mx-auto">
            <SectionLabel>In practice</SectionLabel>
            <h2 className="font-display font-extrabold text-[clamp(22px,4vw,42px)] leading-[1] tracking-[-0.03em] mb-8">
              Native vs JS — the code is identical
            </h2>
            <p className="text-[15px] text-graphite-border leading-relaxed max-w-2xl mb-6">
              You don&apos;t write different code for the native path. The engine decides.
              Here are examples that hit native, and examples that stay on JS:
            </p>

            <h3 className="font-display font-bold text-lg mb-3 text-[#22c55e]">Native path activated ✓</h3>
            <Code filename="logo.js">{`import { scrollDraw } from 'svg-scroll-draw';

// Simple logo reveal — compositor-driven on Chrome/FF
scrollDraw('#logo', {
  easing: 'ease-out',
  fade: true,
  trigger: { start: 'top 80%', end: 'top 20%' },
});
// → CSS animation-timeline: view() injected, no JS loop`}</Code>

            <Code filename="Logo.tsx">{`import { ScrollDraw } from 'svg-scroll-draw/react';

// React component — also hits native path
function Logo() {
  return (
    <ScrollDraw easing="ease-in-out" fade once>
      <svg>…</svg>
    </ScrollDraw>
  );
}
// once:true forces the JS path (needs freeze logic)`}</Code>

            <h3 className="font-display font-bold text-lg mt-8 mb-3 text-graphite-border">JS path (by necessity)</h3>
            <Code filename="chart.js">{`// onProgress callback → JS path (needs frame-by-frame)
scrollDraw('#chart', {
  easing: 'ease-out',
  onProgress: (alpha) => {
    counter.textContent = Math.round(alpha * 1000);
  },
});

// stagger → JS path (per-path offset timing)
scrollDraw('#diagram', {
  stagger: 0.15,
  easing: 'ease-out',
});

// spring easing → JS path (not a CSS timing function)
scrollDraw('#path', {
  easing: 'spring',
});

// Opt out explicitly
scrollDraw('#path', {
  native: false, // always use JS engine
});`}</Code>
          </div>
        </section>

        {/* Browser support */}
        <section className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-12 sm:py-14">
          <div className="max-w-4xl mx-auto">
            <SectionLabel>Browser support</SectionLabel>
            <h2 className="font-display font-extrabold text-[clamp(22px,4vw,42px)] leading-[1] tracking-[-0.03em] mb-8">
              Where native runs today
            </h2>
            <div className="overflow-x-auto rounded-xl border border-pitch-black mb-6">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-pitch-black text-light-linen">
                    <th className="text-left px-4 py-3 font-medium text-xs uppercase tracking-wider">Browser</th>
                    <th className="text-left px-4 py-3 font-medium text-xs uppercase tracking-wider">Version</th>
                    <th className="text-left px-4 py-3 font-medium text-xs uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-xs uppercase tracking-wider">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {BROWSER_SUPPORT.map((row, i) => (
                    <tr key={row.browser} className={`border-t border-subtle-ash ${i % 2 === 0 ? 'bg-white' : 'bg-[#f9f8f6]'}`}>
                      <td className="px-4 py-3 font-medium text-[13px]">{row.browser}</td>
                      <td className="px-4 py-3 font-mono text-[12px] text-graphite-border">{row.version}</td>
                      <td className="px-4 py-3">
                        <span
                          className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: statusColor[row.status] + '22', color: statusColor[row.status] }}
                        >
                          {row.status === 'full' ? 'native CSS' : row.status === 'none' ? 'JS fallback' : 'partial'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[12px] text-graphite-border">{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Callout label="Safari" color="#ffc900">
              Safari does not yet support <code className="font-mono text-[13px]">animation-timeline: view()</code>.
              svg-scroll-draw detects this at runtime and activates the JS engine automatically — the
              animation looks and behaves identically. No code changes, no Safari-specific branches.
            </Callout>
          </div>
        </section>

        {/* Performance impact */}
        <section className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-12 sm:py-14 bg-marketplace-gray">
          <div className="max-w-4xl mx-auto">
            <SectionLabel>Performance impact</SectionLabel>
            <h2 className="font-display font-extrabold text-[clamp(22px,4vw,42px)] leading-[1] tracking-[-0.03em] mb-6">
              Why the compositor matters
            </h2>
            <div className="space-y-4 text-[15px] text-graphite-border leading-relaxed max-w-2xl mb-8">
              <p>
                JavaScript animations run on the main thread. When your main thread is busy — parsing JS,
                running React reconciliation, handling events — the scroll animation stutters. The scroll event
                fires, the rAF fires, but the frame is delayed. That&apos;s why even well-optimised JS scroll
                animations can drop frames during page load or heavy interaction.
              </p>
              <p>
                CSS animations using <code className="font-mono text-[13px] text-pitch-black">animation-timeline: view()</code>
                run on the compositor thread — a separate thread that handles transforms and opacity.
                It doesn&apos;t wait for the main thread. Scroll input goes directly to the compositor,
                the animation updates, the frame is painted. Main thread can be fully occupied and it doesn&apos;t matter.
              </p>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                {
                  title: 'Heavy page load',
                  js: 'Main thread busy parsing JS → rAF fires late → visible stutter',
                  native: 'Compositor thread independent → animation still smooth',
                  color: '#ff90e8',
                },
                {
                  title: 'React re-renders',
                  js: 'setState cascade → main thread blocked → animation stutters',
                  native: 'Compositor unaffected by React work',
                  color: '#5865F2',
                },
                {
                  title: 'Low-power mode',
                  js: 'rAF throttled → animation choppy at 30fps',
                  native: 'Compositor-native → matches display refresh rate',
                  color: '#22c55e',
                },
              ].map(({ title, js, native, color }) => (
                <div key={title} className="bg-white rounded-2xl border border-subtle-ash p-5">
                  <p className="font-display font-extrabold text-base mb-4" style={{ color }}>{title}</p>
                  <p className="text-[11px] font-mono text-graphite-border uppercase tracking-wider mb-1">JS</p>
                  <p className="text-[12px] text-graphite-border leading-relaxed mb-3">{js}</p>
                  <p className="text-[11px] font-mono text-[#22c55e] uppercase tracking-wider mb-1">Native CSS</p>
                  <p className="text-[12px] text-pitch-black leading-relaxed">{native}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Opt-out + instance API */}
        <section className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-12 sm:py-14">
          <div className="max-w-4xl mx-auto">
            <SectionLabel>Control</SectionLabel>
            <h2 className="font-display font-extrabold text-[clamp(22px,4vw,42px)] leading-[1] tracking-[-0.03em] mb-6">
              Opt-out and instance API
            </h2>
            <div className="space-y-4 text-[15px] text-graphite-border leading-relaxed max-w-2xl mb-6">
              <p>
                If you need to force the JS engine — for testing, for a polyfill, or because you&apos;re debugging —
                set <code className="font-mono text-[13px] text-pitch-black">native: false</code>:
              </p>
            </div>
            <Code filename="opt-out.js">{`scrollDraw('#logo', {
  easing: 'ease-out',
  native: false, // always use JS rAF engine
});`}</Code>
            <div className="space-y-4 text-[15px] text-graphite-border leading-relaxed max-w-2xl mt-6 mb-6">
              <p>
                The full instance API — <code className="font-mono text-[13px] text-pitch-black">pause()</code>,{' '}
                <code className="font-mono text-[13px] text-pitch-black">resume()</code>,{' '}
                <code className="font-mono text-[13px] text-pitch-black">seek()</code>,{' '}
                <code className="font-mono text-[13px] text-pitch-black">replay()</code>,{' '}
                <code className="font-mono text-[13px] text-pitch-black">destroy()</code> —
                works on both paths. The native path implements these by toggling{' '}
                <code className="font-mono text-[13px] text-pitch-black">animation-play-state</code> and
                injecting inline offsets.
              </p>
            </div>
            <Code filename="instance-api.js">{`const instance = scrollDraw('#logo', { easing: 'ease-out' });

instance.pause();              // pauses wherever it is
instance.resume();             // continues from same point
instance.seek(0.5);            // jump to 50% drawn
instance.replay();             // restart from 0
instance.destroy();            // remove all styles + observers
instance.getProgress();        // → 0–1`}</Code>
          </div>
        </section>

        {/* TL;DR */}
        <section className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-12 sm:py-14 bg-marketplace-gray">
          <div className="max-w-4xl mx-auto">
            <SectionLabel>Summary</SectionLabel>
            <h2 className="font-display font-extrabold text-[clamp(22px,4vw,42px)] leading-[1] tracking-[-0.03em] mb-6">
              TL;DR
            </h2>
            <ul className="space-y-3 max-w-2xl">
              {[
                'svg-scroll-draw automatically uses the native CSS compositor path on Chrome 115+ and Firefox 110+.',
                'The native path runs zero JavaScript per frame — no scroll listeners, no rAF.',
                'The JS fallback activates automatically on Safari and older browsers — same visual result.',
                'Any config that needs JS (callbacks, stagger, spring easing, repeat, velocityScale) stays on the JS engine.',
                'The vast majority of real-world logo reveals and path animations hit the native path.',
                'You don\'t write different code. The engine decides.',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-creator-pink font-bold mt-0.5 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                  <span className="text-[15px] text-graphite-border leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 sm:px-6 md:px-12 py-12 sm:py-16">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <p className="font-display font-extrabold text-xl mb-1">Try it yourself</p>
              <p className="text-[14px] text-graphite-border">
                Open DevTools → Performance while scrolling a svg-scroll-draw animation.
                On Chrome, you&apos;ll see zero main-thread JS per frame.
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

        {/* Footer */}
        <footer className="border-t border-pitch-black px-4 sm:px-6 md:px-12 py-8">
          <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-4">
            <span className="font-mono text-[11px] text-graphite-border">svg-scroll-draw · MIT · ~10 KB gzipped</span>
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
