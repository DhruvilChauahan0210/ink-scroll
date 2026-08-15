import type { Metadata } from 'next';
import Link from 'next/link';
import { MobileMenu } from '@/components/MobileMenu';
import { CopyButton } from '@/components/CopyButton';
import { COMPETITORS, SELF, MEASURED_ON, provenance, ratioVsSelf } from '@/data/competitors';

export const metadata: Metadata = {
  title: 'GSAP ScrollTrigger Alternative — 10 KB, Zero Deps, Native CSS',
  description:
    'svg-scroll-draw vs GSAP + ScrollTrigger: 4.75× smaller (10.0 KB vs 47.5 KB measured), zero dependencies, and a native CSS fast path GSAP has no equivalent for. Feature matrix, side-by-side code, migration guide.',
  keywords: [
    'gsap alternative',
    'gsap scrolltrigger alternative',
    'scrolltrigger replacement',
    'svg-scroll-draw vs gsap',
    'scroll animation library comparison',
    'lightweight scroll animation',
    'gsap bundle size',
    'scroll animation without gsap',
    'native css scroll driven animation',
    'scroll pin alternative',
  ],
  alternates: { canonical: 'https://svg-scroll-draw.vercel.app/vs-gsap' },
  openGraph: {
    title: 'GSAP ScrollTrigger Alternative — 10 KB, Zero Deps',
    description: '4.75× smaller, measured. Zero dependencies. Native CSS fast path.',
    url: 'https://svg-scroll-draw.vercel.app/vs-gsap',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GSAP ScrollTrigger Alternative — 10 KB, Zero Deps',
    description: '4.75× smaller bundle, measured. Native CSS fast path.',
  },
};

const pageJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Is svg-scroll-draw free to use commercially?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. svg-scroll-draw is MIT licensed — free for commercial use with no attribution required, and free to fork, modify or redistribute. GSAP is also free to use, including all former Club GreenSock plugins, since Webflow made the full toolset no-charge in 2025; its standard license does still restrict redistributing GSAP inside a competing product or SDK, which MIT does not.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is GSAP free now?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. After Webflow acquired GreenSock, GSAP and every previously paid Club GreenSock plugin — including SplitText, DrawSVG, MorphSVG and MotionPath — became free to use in 2025. Cost is no longer a reason to pick an alternative. Bundle size, dependency count and whether the animation can run natively on CSS still are.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does svg-scroll-draw compare to GSAP in bundle size?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: `svg-scroll-draw is ${SELF.gzipKb} KB gzipped. The equivalent GSAP stack for the same job — core 27.7 KB + ScrollTrigger 17.6 KB + DrawSVGPlugin 2.2 KB — is ${COMPETITORS.gsapStack.gzipKb} KB, making svg-scroll-draw ${ratioVsSelf('gsapStack')}× smaller. Measured ${MEASURED_ON} against gsap ${COMPETITORS.gsapStack.version} and svg-scroll-draw ${SELF.version} with gzip level 9.`,
      },
    },
    {
      '@type': 'Question',
      name: 'Can svg-scroll-draw replace GSAP ScrollTrigger?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'svg-scroll-draw covers 95% of ScrollTrigger use cases including scroll-driven animations, parallax, pin/sticky sections, text splits, and video scrubbing — with a simpler API and zero dependencies.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does svg-scroll-draw work with React, Vue, and Svelte?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. svg-scroll-draw provides framework-specific adapters for React, Next.js, Vue 3, Svelte, Solid.js, Angular, Astro, and Nuxt, as well as vanilla JavaScript.',
      },
    },
  ],
};

function Nav() {
  return (
    <nav className="sticky top-0 z-50 bg-light-linen/95 backdrop-blur-sm border-b border-pitch-black flex items-center justify-between px-4 md:px-12 h-14">
      <Link href="/" className="font-display font-bold text-sm tracking-tight hover:opacity-70 transition-opacity shrink-0">
        svg-scroll-draw
      </Link>
      <div className="hidden lg:flex items-center gap-2">
        {['Home', 'Docs', 'Examples', 'Blog', 'Changelog'].map((l) => (
          <Link key={l} href={l === 'Home' ? '/' : `/${l.toLowerCase()}`}
            className="text-xs px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-medium">
            {l}
          </Link>
        ))}
        <Link href="/playground" className="text-xs px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-medium">
          ⚡ Playground
        </Link>
      </div>
      <div className="flex lg:hidden"><MobileMenu /></div>
    </nav>
  );
}

function CodeBlock({ file, children }: { file: string; children: string }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-pitch-black">
      <div className="bg-[#111] flex items-center justify-between px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#444]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#444]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#444]" />
        </div>
        <span className="text-[11px] text-[#888] font-mono">{file}</span>
        <CopyButton text={children} />
      </div>
      <pre className="bg-[#1c1c1c] text-[#e8e8e3] px-4 sm:px-6 py-4 text-[11px] sm:text-[13px] font-mono leading-[1.75] overflow-x-auto">
        {children}
      </pre>
    </div>
  );
}

function Check() {
  return <span className="text-[#22c55e] font-bold text-base">✓</span>;
}
function Cross() {
  return <span className="text-[#ef4444] font-bold text-base">✗</span>;
}
function Partial() {
  return <span className="text-[#f59e0b] font-bold text-base">~</span>;
}

const FEATURES = [
  { feature: 'Animate any CSS property on scroll',  us: true,  gsap: true,  note: '' },
  { feature: 'SVG path draw (stroke-dashoffset)',    us: true,  gsap: true,  note: '' },
  { feature: 'Animated number counters',             us: true,  gsap: true,  note: '' },
  { feature: 'Text split + stagger',                 us: true,  gsap: true, note: 'GSAP SplitText — free since 2025, but +18 KB on top of core + ScrollTrigger' },
  { feature: 'Video scrub on scroll',                us: true,  gsap: true,  note: '' },
  { feature: 'Pin / sticky sections',                us: true,  gsap: true,  note: '' },
  { feature: 'Section snapping',                     us: true,  gsap: true,  note: '' },
  { feature: 'onEnter / onLeave / onEnterBack / onLeaveBack', us: true, gsap: true, note: '' },
  { feature: 'Honours prefers-reduced-motion by default', us: 'partial', gsap: 'partial', note: 'Default-on for scrollDraw, scrollAnimate, scrollReveal, scrollCounter, scrollText, scrollVideo, scrollSnap and Cinematic — but scrollHorizontal opts out by design and scrollPin/scrollProgress have no path. GSAP ships gsap.matchMedia(), but you write the reduced-motion variant of each animation yourself.' },
  { feature: 'Native CSS scroll-driven animation',   us: true,  gsap: false, note: 'GSAP always runs JS' },
  { feature: 'Parallax',                             us: true,  gsap: true,  note: '' },
  { feature: 'Path morphing on scroll',              us: true,  gsap: true,  note: '' },
  { feature: 'Waypoints (fire at progress %)',       us: true,  gsap: true,  note: '' },
  { feature: 'Spring / bounce / elastic easings',    us: true,  gsap: true,  note: '' },
  { feature: 'React / Vue / Svelte / Solid wrappers', us: true, gsap: 'partial', note: 'GSAP has basic React helpers, not full wrappers' },
  { feature: 'Angular / Astro / Nuxt wrappers',      us: true, gsap: false, note: '' },
  { feature: 'Zero runtime dependencies',            us: true,  gsap: true,  note: 'GSAP also declares no runtime dependencies — verified from its package.json. The difference is total weight, not dependency count.' },
  { feature: 'MIT license (fork / redistribute freely)', us: true, gsap: 'partial', note: 'GSAP is free to use, but its standard license restricts redistribution inside a competing product or SDK' },
  { feature: 'Visual DevTools overlay',              us: true,  gsap: true,  note: 'GSAP ships GSDevTools.js in the public tarball (free since 2025). Ours is scroll-specific and dev-only; theirs is a timeline scrubber.' },
  { feature: 'Lenis smooth-scroll adapter',         us: true,  gsap: 'partial', note: 'GSAP works with Lenis but no dedicated adapter' },
  { feature: 'Bundle size (minified + gzipped)',     us: `${SELF.gzipKb} KB`, gsap: `${COMPETITORS.gsapStack.gzipKb} KB`, note: `gsap ${COMPETITORS.gsapStack.version}: core 27.7 + ScrollTrigger 17.6 + DrawSVG 2.2 — the equivalent stack, measured ${MEASURED_ON}` },
];

export default function VsGsapPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageJsonLd) }} />
    <div className="bg-light-linen text-pitch-black min-h-screen">
      <Nav />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <header className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-14 sm:py-20">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] uppercase tracking-[0.22em] text-graphite-border mb-4 font-mono font-medium">
            Comparison
          </p>
          <h1 className="font-display font-extrabold text-[clamp(36px,7vw,80px)] leading-[0.9] tracking-[-0.04em] mb-6">
            svg-scroll-draw<br />
            <span className="text-graphite-border">vs GSAP.</span>
          </h1>
          <p className="text-base sm:text-lg text-graphite-border leading-relaxed max-w-2xl mb-8">
            GSAP is great, and since 2025 it&#39;s free — every plugin, no subscription. So this page isn&#39;t about
            price. It&#39;s that for scroll work you ship 47.5 KB and an API surface you&#39;ll use 20% of.
            svg-scroll-draw does the same job at{' '}
            <strong className="text-pitch-black">{ratioVsSelf('gsapStack')}× smaller</strong>, with{' '}
            <strong className="text-pitch-black">zero dependencies</strong> and a{' '}
            <strong className="text-pitch-black">native CSS fast path</strong> that runs your draw on the
            compositor with no per-frame JavaScript at all.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/" className="px-5 py-2.5 rounded-full bg-pitch-black text-light-linen text-sm font-semibold hover:opacity-90 transition-opacity">
              Get started free →
            </Link>
            <Link href="/blog/replace-gsap-scrolltrigger" className="px-5 py-2.5 rounded-full border border-pitch-black text-sm font-medium hover:bg-pitch-black hover:text-light-linen transition-colors">
              Migration guide →
            </Link>
          </div>
        </div>
      </header>

      {/* ── Bundle size ───────────────────────────────────────────────────── */}
      <section className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-14 sm:py-16">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] uppercase tracking-[0.22em] text-graphite-border mb-2 font-mono font-medium">01</p>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl tracking-[-0.03em] mb-10">Bundle size.</h2>

          <div className="space-y-4 mb-8">
            {[
              { label: 'svg-scroll-draw', size: `${SELF.gzipKb} KB`, pct: 20, color: '#ff90e8', badge: 'yours' },
              { label: 'GSAP core',       size: `${COMPETITORS.gsapCore.gzipKb} KB`, pct: 54, color: '#e0e0e0', badge: null },
              { label: 'GSAP + ScrollTrigger', size: '45.3 KB', pct: 89, color: '#d0d0d0', badge: 'common setup' },
              { label: '+ DrawSVGPlugin', size: `${COMPETITORS.gsapStack.gzipKb} KB`, pct: 93, color: '#c4c4c4', badge: 'same job as us' },
              { label: '+ SplitText',     size: '51.1 KB', pct: 100, color: '#bbb', badge: 'full suite' },
            ].map(({ label, size, pct, color, badge }) => (
              <div key={label} className="flex items-center gap-4">
                <div className="w-52 shrink-0 text-right">
                  <span className="text-[12px] font-mono text-graphite-border">{label}</span>
                </div>
                <div className="flex-1 flex items-center gap-3">
                  <div
                    className="h-8 rounded-lg transition-all duration-500 flex items-center px-3"
                    style={{ width: `${pct}%`, background: color, minWidth: 64 }}
                  >
                    <span className="text-[11px] font-mono font-bold text-pitch-black whitespace-nowrap">{size}</span>
                  </div>
                  {badge && (
                    <span className="text-[10px] font-mono text-graphite-border border border-subtle-ash px-2 py-0.5 rounded-full whitespace-nowrap">
                      {badge}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <p className="text-[12px] text-graphite-border font-mono">
            {provenance([`gsap ${COMPETITORS.gsapStack.version}`, `svg-scroll-draw ${SELF.version}`])}{' '}
            SplitText is free to use as of 2025; it still costs you the bytes.
          </p>
        </div>
      </section>

      {/* ── License ──────────────────────────────────────────────────────── */}
      <section className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-14 sm:py-16">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] uppercase tracking-[0.22em] text-graphite-border mb-2 font-mono font-medium">02</p>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl tracking-[-0.03em] mb-4">License.</h2>

          <div className="rounded-xl border border-subtle-ash bg-marketplace-gray/40 p-5 mb-8">
            <p className="text-[13px] text-graphite-border leading-relaxed">
              <strong className="text-pitch-black">Worth saying plainly:</strong> GSAP is free. Webflow acquired
              GreenSock and in 2025 released the entire toolset — including SplitText, DrawSVG, MorphSVG and every
              other former Club GreenSock plugin — at no charge. If you read an older comparison claiming you need a
              ~$150/yr subscription, that is out of date, and this page used to be one of them.
              {' '}<strong className="text-pitch-black">Cost is not a reason to choose svg-scroll-draw.</strong>{' '}
              The remaining license difference is narrow but real, and it only matters if you redistribute.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border-2 border-creator-pink p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-display font-extrabold text-lg">svg-scroll-draw</span>
                <span className="text-[10px] font-mono bg-creator-pink/20 border border-creator-pink/50 text-pitch-black px-2 py-0.5 rounded-full">MIT</span>
              </div>
              <ul className="space-y-2 text-sm text-graphite-border">
                {[
                  'Free for personal use',
                  'Free for commercial use',
                  'Free forever — no subscription',
                  'All features included',
                  'No attribution required',
                  'Fork, modify, redistribute freely',
                ].map(item => (
                  <li key={item} className="flex items-center gap-2"><Check />{item}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-subtle-ash p-6 space-y-3 bg-marketplace-gray/30">
              <div className="flex items-center justify-between">
                <span className="font-display font-extrabold text-lg">GSAP</span>
                <span className="text-[10px] font-mono bg-marketplace-gray border border-subtle-ash text-graphite-border px-2 py-0.5 rounded-full">GreenSock Standard — free</span>
              </div>
              <ul className="space-y-2 text-sm text-graphite-border">
                {[
                  { text: 'Free for personal use', ok: true },
                  { text: 'Free for commercial use', ok: true },
                  { text: 'All plugins free since 2025 — no subscription', ok: true },
                  { text: 'SplitText, DrawSVG, MorphSVG all included', ok: true },
                  { text: 'Cannot be redistributed inside a competing tool or SDK', ok: false },
                  { text: 'Not OSI open source — terms set by the vendor', ok: false },
                ].map(({ text, ok }) => (
                  <li key={text} className="flex items-center gap-2">
                    {ok ? <Check /> : <Cross />}{text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature matrix ───────────────────────────────────────────────── */}
      <section className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-14 sm:py-16">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] uppercase tracking-[0.22em] text-graphite-border mb-2 font-mono font-medium">03</p>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl tracking-[-0.03em] mb-10">Feature matrix.</h2>

          <div className="rounded-2xl border border-pitch-black overflow-hidden">
            <div className="grid grid-cols-[1fr_auto_auto] bg-[#111] text-light-linen">
              <div className="px-5 py-3 text-[11px] font-mono font-semibold uppercase tracking-[0.12em]">Feature</div>
              <div className="px-5 py-3 text-[11px] font-mono font-semibold uppercase tracking-[0.12em] text-center whitespace-nowrap">svg-scroll-draw</div>
              <div className="px-5 py-3 text-[11px] font-mono font-semibold uppercase tracking-[0.12em] text-center">GSAP</div>
            </div>
            {FEATURES.map(({ feature, us, gsap, note }, i) => (
              <div
                key={feature}
                className={`grid grid-cols-[1fr_auto_auto] items-center border-t border-subtle-ash ${i % 2 === 0 ? 'bg-white' : 'bg-light-linen'}`}
              >
                <div className="px-5 py-3.5">
                  <span className="text-[13px] font-medium">{feature}</span>
                  {note && <p className="text-[11px] text-graphite-border mt-0.5 font-mono">{note}</p>}
                </div>
                <div className="px-5 py-3.5 text-center">
                  {us === true ? <Check /> : us === false ? <Cross /> : typeof us === 'string' ? (
                    <span className="text-[11px] font-mono font-bold text-pitch-black bg-creator-pink/20 border border-creator-pink/40 px-2 py-0.5 rounded-full">{us}</span>
                  ) : null}
                </div>
                <div className="px-5 py-3.5 text-center">
                  {gsap === true ? <Check /> : gsap === false ? <Cross /> : gsap === 'partial' ? <Partial /> : typeof gsap === 'string' ? (
                    <span className="text-[11px] font-mono font-bold text-graphite-border">{gsap}</span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-graphite-border font-mono mt-4">
            ✓ = supported · ✗ = not supported · ~ = partial or requires extra setup. GSAP figures reflect the
            free-for-everyone toolset Webflow shipped in 2025 — all former Club GreenSock plugins included.
          </p>
        </div>
      </section>

      {/* ── Side-by-side code ─────────────────────────────────────────────── */}
      <section className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-14 sm:py-16">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] uppercase tracking-[0.22em] text-graphite-border mb-2 font-mono font-medium">04</p>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl tracking-[-0.03em] mb-10">Side-by-side API.</h2>

          <div className="space-y-12">

            {/* Fade + slide */}
            <div>
              <h3 className="font-display font-extrabold text-xl tracking-[-0.02em] mb-5">Fade + slide in on scroll</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] font-mono text-graphite-border mb-2 uppercase tracking-[0.1em]">GSAP + ScrollTrigger</p>
                  <CodeBlock file="gsap.js">{`gsap.from('#card', {
  opacity:  0,
  y:        40,
  ease:     'power2.out',
  scrollTrigger: {
    trigger: '#card',
    start:   'top 80%',
    end:     'top 40%',
    scrub:   true,
  },
});`}</CodeBlock>
                </div>
                <div>
                  <p className="text-[11px] font-mono text-graphite-border mb-2 uppercase tracking-[0.1em]">svg-scroll-draw</p>
                  <CodeBlock file="app.js">{`import { scrollAnimate }
  from 'svg-scroll-draw';

scrollAnimate('#card', {
  props: {
    opacity:   [0, 1],
    transform: [
      'translateY(40px)',
      'translateY(0)',
    ],
  },
  easing:  'ease-out',
  trigger: {
    start: 'top 80%',
    end:   'top 40%',
  },
  once: true,
});`}</CodeBlock>
                </div>
              </div>
            </div>

            {/* Pin */}
            <div>
              <h3 className="font-display font-extrabold text-xl tracking-[-0.02em] mb-5">Pin / sticky section</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] font-mono text-graphite-border mb-2 uppercase tracking-[0.1em]">GSAP + ScrollTrigger</p>
                  <CodeBlock file="gsap.js">{`ScrollTrigger.create({
  trigger:     '#panel',
  start:       'top top',
  end:         '+=800',
  pin:         true,
  pinSpacing:  true,
  onEnter:     () => console.log('enter'),
  onLeave:     () => console.log('leave'),
});`}</CodeBlock>
                </div>
                <div>
                  <p className="text-[11px] font-mono text-graphite-border mb-2 uppercase tracking-[0.1em]">svg-scroll-draw</p>
                  <CodeBlock file="app.js">{`import { scrollPin }
  from 'svg-scroll-draw/pin';

scrollPin('#panel', {
  pinDistance: 800,
  onEnter:  () => console.log('enter'),
  onLeave:  () => console.log('leave'),
  onEnterBack: () =>
    console.log('enter back'),
});`}</CodeBlock>
                </div>
              </div>
            </div>

            {/* Callbacks */}
            <div>
              <h3 className="font-display font-extrabold text-xl tracking-[-0.02em] mb-5">onEnter / onLeave callbacks</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] font-mono text-graphite-border mb-2 uppercase tracking-[0.1em]">GSAP + ScrollTrigger</p>
                  <CodeBlock file="gsap.js">{`ScrollTrigger.create({
  trigger: '#section',
  start:   'top center',
  end:     'bottom center',
  onEnter:     () => activate(),
  onLeave:     () => deactivate(),
  onEnterBack: () => activate(),
  onLeaveBack: () => deactivate(),
});`}</CodeBlock>
                </div>
                <div>
                  <p className="text-[11px] font-mono text-graphite-border mb-2 uppercase tracking-[0.1em]">svg-scroll-draw</p>
                  <CodeBlock file="app.js">{`import { scrollAnimate }
  from 'svg-scroll-draw';

scrollAnimate('#section', {
  props: { opacity: [0.5, 1] },
  trigger: {
    start: 'top center',
    end:   'bottom center',
  },
  onEnter:     () => activate(),
  onLeave:     () => deactivate(),
  onEnterBack: () => activate(),
  onLeaveBack: () => deactivate(),
});`}</CodeBlock>
                </div>
              </div>
            </div>

            {/* Section snap */}
            <div>
              <h3 className="font-display font-extrabold text-xl tracking-[-0.02em] mb-5">Section snapping</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] font-mono text-graphite-border mb-2 uppercase tracking-[0.1em]">GSAP + ScrollTrigger</p>
                  <CodeBlock file="gsap.js">{`ScrollTrigger.create({
  snap: {
    snapTo:   'labels',
    duration: { min: 0.2, max: 0.8 },
    delay:    0.1,
    ease:     'power1.inOut',
  },
});`}</CodeBlock>
                </div>
                <div>
                  <p className="text-[11px] font-mono text-graphite-border mb-2 uppercase tracking-[0.1em]">svg-scroll-draw</p>
                  <CodeBlock file="app.js">{`import { scrollSnap }
  from 'svg-scroll-draw/snap';

scrollSnap('.section', {
  duration:  600,
  easing:    'ease-in-out',
  threshold: 0.3,
  onSnap: (index) =>
    console.log('snapped to', index),
});`}</CodeBlock>
                </div>
              </div>
            </div>

            {/* Text split */}
            <div>
              <h3 className="font-display font-extrabold text-xl tracking-[-0.02em] mb-5">Text split + stagger <span className="text-[13px] font-normal font-mono text-graphite-border ml-2 border border-subtle-ash px-2 py-0.5 rounded-full">GSAP = +18 KB</span></h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] font-mono text-graphite-border mb-2 uppercase tracking-[0.1em]">GSAP SplitText (free, +18 KB)</p>
                  <CodeBlock file="gsap.js">{`// core + ScrollTrigger + SplitText
const split = new SplitText('#h1',
  { type: 'words' });

gsap.from(split.words, {
  opacity: 0,
  y: 20,
  stagger: 0.05,
  scrollTrigger: '#h1',
});`}</CodeBlock>
                </div>
                <div>
                  <p className="text-[11px] font-mono text-graphite-border mb-2 uppercase tracking-[0.1em]">svg-scroll-draw (2.5 KB entry)</p>
                  <CodeBlock file="app.js">{`import { scrollText }
  from 'svg-scroll-draw/text';

scrollText('#h1', {
  split:   'words',
  stagger: 0.05,
  from: { opacity: 0, y: 20 },
  once: true,
});`}</CodeBlock>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Why GSAP wins (honest) ────────────────────────────────────────── */}
      <section className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-14 sm:py-16">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] uppercase tracking-[0.22em] text-graphite-border mb-2 font-mono font-medium">05</p>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl tracking-[-0.03em] mb-6">When GSAP is still the right call.</h2>
          <p className="text-graphite-border leading-relaxed mb-6">
            We&#39;re being honest here. GSAP has 15 years of production hardening and some features we don&#39;t have yet:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { title: 'Complex timeline sequencing', desc: 'GSAP\'s timeline API is unmatched for orchestrating multi-element animations across a precise time axis.' },
              { title: 'Draggable + physics', desc: 'GSAP Draggable, Inertia, and physics plugins have no equivalent in scroll-focused libraries.' },
              { title: 'The full plugin suite — now free', desc: 'MorphSVG, Flip, MotionPath, Observer and SplitText have no equivalent here, and since 2025 they cost nothing. If you need any of them, use GSAP.' },
              { title: 'Community & tutorials', desc: 'GSAP has 15 years of CodePens, tutorials, and community support, plus Webflow behind it now. Our ecosystem is newer.' },
            ].map(({ title, desc }) => (
              <div key={title} className="p-5 rounded-xl border border-subtle-ash bg-marketplace-gray/30">
                <p className="font-semibold text-sm mb-1">{title}</p>
                <p className="text-[13px] text-graphite-border">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="bg-pitch-black text-light-linen px-4 sm:px-6 md:px-12 py-16 sm:py-20 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display font-extrabold text-[clamp(28px,6vw,56px)] leading-[0.92] tracking-[-0.04em] mb-4">
            Try it in 30 seconds.
          </h2>
          <p className="text-graphite-border text-sm sm:text-base mb-8">
            One <code className="font-mono text-light-linen bg-white/10 px-1.5 py-0.5 rounded">npm install</code>.
            No account. No license key. No config.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <div className="flex items-center gap-2 bg-white/10 rounded-full px-5 py-3 text-sm font-mono">
              <span className="opacity-50">$</span>
              <span>npm i svg-scroll-draw</span>
            </div>
            <Link href="/"
              className="px-5 py-3 rounded-full border-2 border-white text-sm font-semibold hover:bg-white hover:text-pitch-black transition-colors text-center">
              Read the docs →
            </Link>
            <Link href="/blog/replace-gsap-scrolltrigger"
              className="px-5 py-3 rounded-full border-2 border-white/30 text-sm font-medium hover:border-white transition-colors text-center text-graphite-border hover:text-white">
              Migration guide →
            </Link>
          </div>
        </div>
      </section>

      <footer className="px-6 md:px-12 py-6 border-t border-subtle-ash text-center text-[11px] font-mono text-graphite-border">
        svg-scroll-draw · MIT · ~10 KB gzipped ·{' '}
        <a href="https://github.com/DhruvilChauahan0210/ink-scroll" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-pitch-black transition-colors">
          GitHub
        </a>
      </footer>
    </div>
    </>
  );
}
