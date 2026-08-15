import type { Metadata } from 'next';
import Link from 'next/link';
import { MobileMenu } from '@/components/MobileMenu';
import { CopyButton } from '@/components/CopyButton';
import { COMPETITORS, SELF, SELF_ENTRIES, MEASURED_ON, provenance } from '@/data/competitors';

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
    'scrollreveal license',
    'is scrollreveal gpl',
    'aos bundle size',
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
        text: 'Yes. svg-scroll-draw\'s scrollReveal function replaces AOS with a typed JavaScript API — no data-aos HTML attributes required, no config files, 7 built-in presets, stagger support, and custom easing. All in ~10 KB total.',
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
      name: 'What license is ScrollReveal.js, and can I use it in a commercial product?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: `ScrollReveal ${COMPETITORS.scrollreveal.version} is ${COMPETITORS.scrollreveal.license}, not MIT — verified from its published package.json. GPL-3.0 is copyleft, so it is worth reading carefully before shipping it inside a closed-source commercial product. AOS ${COMPETITORS.aos.version} is ${COMPETITORS.aos.license}, and svg-scroll-draw is ${SELF.license}.`,
      },
    },
    {
      '@type': 'Question',
      name: 'Is svg-scroll-draw smaller than AOS or ScrollReveal?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: `No, not for the main entry. Measured at gzip level 9 on ${MEASURED_ON}: scrollreveal ${COMPETITORS.scrollreveal.version} is ${COMPETITORS.scrollreveal.gzipKb} KB, aos ${COMPETITORS.aos.version} is ${COMPETITORS.aos.gzipKb} KB including its required stylesheet, and svg-scroll-draw ${SELF.version} exposing every API is ${SELF.gzipKb} KB. The like-for-like comparison is the svg-scroll-draw/reveal entry point at ${SELF_ENTRIES.reveal} KB, which is smaller than both — but if all you need is fade-on-scroll, AOS and ScrollReveal are good choices.`,
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
  { f: 'Custom easing function',               us: true,   aos: 'partial', sr: 'partial', note: 'AOS ships 8 named CSS easings; ScrollReveal takes any CSS timing function. Only we take a JS easing function (createSpring/createBounce/createElastic).' },
  { f: 'CSS-only config (data attributes)',    us: false,  aos: true,  sr: false },
  { f: 'TypeScript types',                     us: true,   aos: 'partial', sr: 'partial', note: 'Neither ships its own .d.ts; both have community types on DefinitelyTyped (@types/aos, @types/scrollreveal).' },
  { f: 'Tree-shakeable sub-imports',           us: true,   aos: false, sr: false },
  { f: 'scrollAnimate (any CSS property)',     us: true,   aos: false, sr: false },
  { f: 'scrollPin / sticky sections',          us: true,   aos: false, sr: false },
  { f: 'scrollSnap',                           us: true,   aos: false, sr: false },
  { f: 'scrollText (split + stagger text)',    us: true,   aos: false, sr: false },
  { f: 'scrollVideo (scrub)',                  us: true,   aos: false, sr: false },
  { f: 'scrollProgress (CSS variable)',        us: true,   aos: false, sr: false },
  { f: 'scrollHorizontal sections',            us: true,   aos: false, sr: false },
  { f: 'Honours prefers-reduced-motion by default', us: 'partial', aos: false, sr: false, note: 'True for scrollReveal. Not a blanket claim across every API here — scrollHorizontal opts out by design. Neither AOS nor ScrollReveal references prefers-reduced-motion in its published bundle.' },
  { f: 'React / Vue / Svelte wrappers',        us: true,   aos: 'partial', sr: false },
  { f: 'Last published',                       us: SELF.lastPublish!, aos: COMPETITORS.aos.lastPublish!, sr: COMPETITORS.scrollreveal.lastPublish!, note: `Dates from npm, read ${MEASURED_ON}. Both are stable, finished libraries rather than abandoned ones — weigh that how you like.` },
  { f: 'License',                              us: SELF.license, aos: COMPETITORS.aos.license, sr: COMPETITORS.scrollreveal.license, note: 'ScrollReveal is GPL-3.0, which is a real consideration for a closed-source commercial product. AOS is MIT, same as us.' },
  { f: 'Bundle size (gzipped)',                us: `${SELF.gzipKb} KB`, aos: `${COMPETITORS.aos.gzipKb} KB`, sr: `${COMPETITORS.scrollreveal.gzipKb} KB`, note: `Measured ${MEASURED_ON} at gzip level 9 against aos ${COMPETITORS.aos.version} and scrollreveal ${COMPETITORS.scrollreveal.version}. Both are smaller than us — see below.` },
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
            Both of them are smaller than us, and both do less; the numbers below are measured so you can
            decide which trade you want.
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
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl tracking-[-0.03em] mb-4">Bundle size.</h2>

          <div className="rounded-xl border border-subtle-ash bg-marketplace-gray/40 p-5 mb-8">
            <p className="text-[13px] text-graphite-border leading-relaxed">
              <strong className="text-pitch-black">This one does not go our way, so here it is plainly:</strong>{' '}
              AOS and ScrollReveal are both <em>smaller</em> than svg-scroll-draw&apos;s main entry. They also do
              considerably less — neither draws SVG paths, pins, snaps, splits text or scrubs video. If all you need is
              fade-up-on-scroll, they are a perfectly good choice and you should use them. Our{' '}
              <code className="font-mono text-[0.9em] bg-white px-1.5 py-0.5 rounded border border-subtle-ash">svg-scroll-draw/reveal</code>{' '}
              entry point is 3.9 KB if you want just that piece — that is the number worth comparing, not the 10.0 KB
              figure for every API at once.
            </p>
          </div>

          <div className="space-y-4 mb-6">
            {[
              { label: `scrollreveal ${COMPETITORS.scrollreveal.version}`, size: `${COMPETITORS.scrollreveal.gzipKb} KB`, pct: Math.round((COMPETITORS.scrollreveal.gzipKb / SELF.gzipKb) * 100), color: '#e0e0e0', badge: 'smallest' },
              { label: `aos ${COMPETITORS.aos.version} (js+css)`, size: `${COMPETITORS.aos.gzipKb} KB`, pct: Math.round((COMPETITORS.aos.gzipKb / SELF.gzipKb) * 100), color: '#c8c8c8', badge: null },
              { label: 'svg-scroll-draw/reveal', size: `${SELF_ENTRIES.reveal} KB`, pct: Math.round((SELF_ENTRIES.reveal / SELF.gzipKb) * 100), color: '#ff90e8', badge: 'like-for-like' },
              { label: 'svg-scroll-draw (all APIs)', size: `${SELF.gzipKb} KB`, pct: 100, color: '#ffc4f2', badge: 'yours' },
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
            {provenance([`aos ${COMPETITORS.aos.version}`, `scrollreveal ${COMPETITORS.scrollreveal.version}`, `svg-scroll-draw ${SELF.version}`])}{' '}
            AOS includes its stylesheet (2.1 KB), which you need.
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
                  { label: 'ScrollReveal.js', code: `// ScrollReveal.js 4.0.9 (GPL-3.0)\nconst sr = ScrollReveal({\n  origin: 'bottom',\n  distance: '32px',\n  duration: 800,\n  once: true,\n});\n\nsr.reveal('.card');` },
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
        svg-scroll-draw · MIT · ~10 KB ·{' '}<a href="https://github.com/DhruvilChauahan0210/ink-scroll" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-pitch-black transition-colors">GitHub</a>
      </footer>
    </div>
    </>
  );
}
