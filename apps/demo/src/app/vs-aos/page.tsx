import type { Metadata } from 'next';
import Link from 'next/link';
import { MobileMenu } from '@/components/MobileMenu';
import { CopyButton } from '@/components/CopyButton';

export const metadata: Metadata = {
  title: 'svg-scroll-draw vs AOS vs ScrollReveal.js — Comparison',
  description:
    'Direct comparison: svg-scroll-draw vs AOS (Animate On Scroll) vs ScrollReveal.js. Bundle size, feature matrix, API side-by-side. scrollReveal replaces both with one typed JS call — no data attributes.',
  keywords: [
    'AOS alternative',
    'ScrollReveal.js alternative',
    'animate on scroll alternative',
    'AOS vs scrollreveal',
    'svg-scroll-draw vs AOS',
    'fade in on scroll library',
    'scroll animation library comparison',
    'AOS replacement 2025',
    'ScrollReveal replacement',
    'data-aos alternative',
  ],
  alternates: { canonical: 'https://svg-scroll-draw.vercel.app/vs-aos' },
  openGraph: {
    title: 'svg-scroll-draw vs AOS vs ScrollReveal.js',
    description: 'No data attributes. Typed. One call. Replaces both.',
    url: 'https://svg-scroll-draw.vercel.app/vs-aos',
  },
  twitter: { card: 'summary_large_image', title: 'svg-scroll-draw vs AOS vs ScrollReveal.js', description: 'No data attributes. Typed. One call.' },
};

const pageJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Is there a better alternative to AOS (Animate On Scroll)?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. svg-scroll-draw\'s scrollReveal function replaces AOS with a typed JavaScript API — no data-aos HTML attributes required, no config files, 7 built-in presets, stagger support, and custom easing. All in ~9 KB total.',
      },
    },
    {
      '@type': 'Question',
      name: 'How is svg-scroll-draw different from AOS and ScrollReveal.js?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Unlike AOS and ScrollReveal.js which rely on HTML data attributes (data-aos="fade-up"), svg-scroll-draw uses a pure JavaScript API: scrollReveal(".card", { preset: "fadeUp" }). This gives you TypeScript types, tree-shaking, and no markup coupling.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I migrate from AOS to svg-scroll-draw?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Remove data-aos attributes and replace the AOS.init() call with scrollReveal() targeting the same elements. The 7 built-in presets (fadeUp, fadeDown, fadeLeft, fadeRight, zoomIn, slideIn, flipIn) cover all common AOS animations.',
      },
    },
  ],
};

function Nav() {
  return (
    <nav className="sticky top-0 z-50 bg-light-linen/95 backdrop-blur-sm border-b border-pitch-black flex items-center justify-between px-4 md:px-12 h-14">
      <Link href="/" className="font-display font-bold text-sm tracking-tight hover:opacity-70 transition-opacity shrink-0">svg-scroll-draw</Link>
      <div className="hidden lg:flex items-center gap-2">
        {['Home','Docs','Examples','Blog','Changelog'].map(l => (
          <Link key={l} href={l==='Home'?'/':`/${l.toLowerCase()}`} className="text-xs px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-medium">{l}</Link>
        ))}
        <Link href="/playground" className="text-xs px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-medium">⚡ Playground</Link>
      </div>
      <div className="flex lg:hidden"><MobileMenu /></div>
    </nav>
  );
}

function CodeBlock({ file, children }: { file: string; children: string }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-pitch-black">
      <div className="bg-[#111] flex items-center justify-between px-4 py-2.5">
        <div className="flex gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#444]"/><span className="w-2.5 h-2.5 rounded-full bg-[#444]"/><span className="w-2.5 h-2.5 rounded-full bg-[#444]"/></div>
        <span className="text-[11px] text-[#888] font-mono">{file}</span>
        <CopyButton text={children} />
      </div>
      <pre className="bg-[#1c1c1c] text-[#e8e8e3] px-4 sm:px-6 py-4 text-[11px] sm:text-[13px] font-mono leading-[1.75] overflow-x-auto">{children}</pre>
    </div>
  );
}

const FEATURES = [
  { f: 'Fade up / down / left / right',       us: true,   aos: true,  sr: true  },
  { f: 'Scale reveal',                         us: true,   aos: true,  sr: true  },
  { f: '3D flip (rotateX / rotateY)',          us: true,   aos: false, sr: true  },
  { f: 'Custom from state (x, y, scale…)',     us: true,   aos: false, sr: true  },
  { f: 'Stagger (cascade)',                    us: true,   aos: true,  sr: true  },
  { f: 'Custom easing function',               us: true,   aos: false, sr: true  },
  { f: 'CSS-only config (data attributes)',    us: false,  aos: true,  sr: false },
  { f: 'TypeScript types',                     us: true,   aos: 'partial', sr: false },
  { f: 'Tree-shakeable sub-imports',           us: true,   aos: false, sr: false },
  { f: 'scrollAnimate (any CSS property)',     us: true,   aos: false, sr: false },
  { f: 'scrollPin / sticky sections',          us: true,   aos: false, sr: false },
  { f: 'scrollSnap',                           us: true,   aos: false, sr: false },
  { f: 'scrollText (split + stagger text)',    us: true,   aos: false, sr: false },
  { f: 'scrollVideo (scrub)',                  us: true,   aos: false, sr: false },
  { f: 'scrollProgress (CSS variable)',        us: true,   aos: false, sr: false },
  { f: 'scrollHorizontal sections',            us: true,   aos: false, sr: false },
  { f: 'React / Vue / Svelte wrappers',        us: true,   aos: 'partial', sr: false },
  { f: 'Active maintenance (2025)',            us: true,   aos: true,  sr: false, note: 'ScrollReveal.js last release: 2021' },
  { f: 'MIT license',                          us: true,   aos: true,  sr: true  },
  { f: 'Bundle size (gzipped)',                us: '~9KB', aos: '~14KB', sr: '~9KB' },
];

function Cell({ val }: { val: boolean | string | undefined }) {
  if (val === true)  return <span className="text-[#22c55e] font-bold">✓</span>;
  if (val === false) return <span className="text-[#ef4444] font-bold">✗</span>;
  if (val === 'partial') return <span className="text-[#f59e0b] font-bold">~</span>;
  return <span className="text-[12px] font-mono font-bold text-pitch-black">{val}</span>;
}

export default function VsAosPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageJsonLd) }} />
    <div className="bg-light-linen text-pitch-black min-h-screen">
      <Nav />

      <header className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-14 sm:py-20">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] uppercase tracking-[0.22em] text-graphite-border mb-4 font-mono font-medium">Comparison</p>
          <h1 className="font-display font-extrabold text-[clamp(32px,7vw,76px)] leading-[0.9] tracking-[-0.04em] mb-6">
            svg-scroll-draw<br /><span className="text-graphite-border">vs AOS vs ScrollReveal.</span>
          </h1>
          <p className="text-base sm:text-lg text-graphite-border leading-relaxed max-w-2xl mb-8">
            AOS and ScrollReveal.js put animation config in HTML data attributes.
            svg-scroll-draw puts it in JavaScript — typed, traceable, and part of a full scroll platform.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/" className="px-5 py-2.5 rounded-full bg-pitch-black text-light-linen text-sm font-semibold hover:opacity-90 transition-opacity">Get started free →</Link>
            <Link href="/blog/replace-aos-scrollreveal" className="px-5 py-2.5 rounded-full border border-pitch-black text-sm font-medium hover:bg-pitch-black hover:text-light-linen transition-colors">Migration guide →</Link>
          </div>
        </div>
      </header>

      {/* Bundle size */}
      <section className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-14">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] uppercase tracking-[0.22em] text-graphite-border mb-2 font-mono font-medium">01</p>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl tracking-[-0.03em] mb-8">Bundle size.</h2>
          <div className="space-y-4 mb-6">
            {[
              { label: 'svg-scroll-draw', size: '~9 KB',  pct: 64, color: '#ff90e8', badge: 'yours' },
              { label: 'ScrollReveal.js', size: '~9 KB',  pct: 64, color: '#e0e0e0', badge: null },
              { label: 'AOS',             size: '~14 KB', pct: 100, color: '#c8c8c8', badge: null },
            ].map(({ label, size, pct, color, badge }) => (
              <div key={label} className="flex items-center gap-4">
                <div className="w-40 shrink-0 text-right"><span className="text-[12px] font-mono text-graphite-border">{label}</span></div>
                <div className="flex-1 flex items-center gap-3">
                  <div className="h-8 rounded-lg flex items-center px-3" style={{ width: `${pct}%`, background: color, minWidth: 60 }}>
                    <span className="text-[11px] font-mono font-bold text-pitch-black whitespace-nowrap">{size}</span>
                  </div>
                  {badge && <span className="text-[10px] font-mono text-graphite-border border border-subtle-ash px-2 py-0.5 rounded-full">{badge}</span>}
                </div>
              </div>
            ))}
          </div>
          <p className="text-[12px] text-graphite-border font-mono">
            All sizes minified + gzipped. AOS includes CSS (~6KB). svg-scroll-draw includes all v2 APIs.
          </p>
        </div>
      </section>

      {/* API comparison */}
      <section className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-14">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] uppercase tracking-[0.22em] text-graphite-border mb-2 font-mono font-medium">02</p>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl tracking-[-0.03em] mb-10">Side-by-side API.</h2>

          <div className="space-y-8">
            <div>
              <h3 className="font-display font-extrabold text-xl tracking-[-0.02em] mb-4">Fade up on scroll</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { label: 'AOS', code: `<!-- HTML attribute on every element -->\n<div data-aos="fade-up"\n     data-aos-once="true">\n  Content\n</div>\n\n<!-- Init in JS -->\nAOS.init({ duration: 800 });` },
                  { label: 'ScrollReveal.js', code: `// ScrollReveal.js — last updated 2021\nconst sr = ScrollReveal({\n  origin: 'bottom',\n  distance: '32px',\n  duration: 800,\n  once: true,\n});\n\nsr.reveal('.card');` },
                  { label: 'svg-scroll-draw', code: `import { scrollReveal }\n  from 'svg-scroll-draw/reveal';\n\n// One import. One call.\nscrollReveal('.card');\n\n// Custom config:\nscrollReveal('.card', {\n  from:    { opacity: 0, y: 32 },\n  stagger: 0.08,\n  once:    true,\n});` },
                ].map(({ label, code }) => (
                  <div key={label}>
                    <p className="text-[11px] font-mono text-graphite-border mb-2 uppercase tracking-[0.1em]">{label}</p>
                    <CodeBlock file={label === 'AOS' ? 'index.html' : 'app.js'}>{code}</CodeBlock>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-display font-extrabold text-xl tracking-[-0.02em] mb-4">Stagger cascade</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { label: 'AOS', code: `<!-- AOS: delay per element in HTML -->\n<div data-aos="fade-up"\n     data-aos-delay="0">A</div>\n<div data-aos="fade-up"\n     data-aos-delay="100">B</div>\n<div data-aos="fade-up"\n     data-aos-delay="200">C</div>` },
                  { label: 'ScrollReveal.js', code: `sr.reveal('.card', {\n  interval: 100,\n  origin:   'bottom',\n});` },
                  { label: 'svg-scroll-draw', code: `scrollReveal('.card', {\n  stagger: 0.1, // seconds\n});` },
                ].map(({ label, code }) => (
                  <div key={label}>
                    <p className="text-[11px] font-mono text-graphite-border mb-2 uppercase tracking-[0.1em]">{label}</p>
                    <CodeBlock file={label === 'AOS' ? 'index.html' : 'app.js'}>{code}</CodeBlock>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature matrix */}
      <section className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-14">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] uppercase tracking-[0.22em] text-graphite-border mb-2 font-mono font-medium">03</p>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl tracking-[-0.03em] mb-10">Feature matrix.</h2>
          <div className="rounded-2xl border border-pitch-black overflow-hidden">
            <div className="grid grid-cols-[1fr_auto_auto_auto] bg-[#111] text-light-linen">
              {['Feature','svg-scroll-draw','AOS','ScrollReveal.js'].map(h => (
                <div key={h} className="px-4 py-3 text-[11px] font-mono font-semibold uppercase tracking-[0.1em] text-center first:text-left">{h}</div>
              ))}
            </div>
            {FEATURES.map(({ f, us, aos, sr, note }, i) => (
              <div key={f} className={`grid grid-cols-[1fr_auto_auto_auto] items-center border-t border-subtle-ash ${i%2===0?'bg-white':'bg-light-linen'}`}>
                <div className="px-4 py-3">
                  <span className="text-[13px] font-medium">{f}</span>
                  {note && <p className="text-[10px] text-graphite-border font-mono mt-0.5">{note}</p>}
                </div>
                <div className="px-4 py-3 text-center"><Cell val={us}/></div>
                <div className="px-4 py-3 text-center"><Cell val={aos}/></div>
                <div className="px-4 py-3 text-center"><Cell val={sr}/></div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-graphite-border font-mono mt-3">✓ supported · ✗ not supported · ~ partial</p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-pitch-black text-light-linen px-4 sm:px-6 md:px-12 py-16 sm:py-20 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display font-extrabold text-[clamp(28px,6vw,56px)] leading-[0.92] tracking-[-0.04em] mb-4">One import. Done.</h2>
          <p className="text-graphite-border text-sm sm:text-base mb-8">No data attributes. No config files. No separate CSS import. Works in React, Vue, Svelte, Solid, Astro, Nuxt.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <div className="flex items-center gap-2 bg-white/10 rounded-full px-5 py-3 text-sm font-mono"><span className="opacity-50">$</span><span>npm i svg-scroll-draw</span></div>
            <Link href="/" className="px-5 py-3 rounded-full border-2 border-white text-sm font-semibold hover:bg-white hover:text-pitch-black transition-colors text-center">Read the docs →</Link>
          </div>
        </div>
      </section>

      <footer className="px-6 md:px-12 py-6 border-t border-subtle-ash text-center text-[11px] font-mono text-graphite-border">
        svg-scroll-draw · MIT · ~9 KB ·{' '}<a href="https://github.com/DhruvilChauahan0210/ink-scroll" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-pitch-black transition-colors">GitHub</a>
      </footer>
    </div>
    </>
  );
}
