import type { Metadata } from 'next';
import Link from 'next/link';
import { seoTitle } from '../_lib/seo';
import { COMPETITORS, SELF, SELF_ENTRIES, MEASURED_ON, provenance } from '@/data/competitors';
import { REVEAL_PRESETS } from '@/data/facts';
import { jsonLd } from '@/lib/json-ld';
import { SiteShell } from '@/components/site/SiteShell';
import { SpecSheet } from '@/components/h2h/SpecSheet';
import { WeighIn } from '@/components/h2h/WeighIn';
import { Closing, CodeSet, Head, Legend, Matrix, Nb, Notes, OtherSheets, Routes, Toc, type MatrixRow } from '@/components/h2h/parts';

export const metadata: Metadata = {
  title: seoTitle('AOS Alternative: svg-scroll-draw vs AOS vs ScrollReveal'),
  description:
    'svg-scroll-draw vs AOS vs ScrollReveal.js: measured bundle sizes, feature matrix and side-by-side code. scrollReveal is one typed call, no data attributes.',
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

const AOS = COMPETITORS.aos;
const SR = COMPETITORS.scrollreveal;

const pageJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Is there a better alternative to AOS (Animate On Scroll)?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: `Yes. svg-scroll-draw's scrollReveal function replaces AOS with a typed JavaScript API — no data-aos HTML attributes required, no config files, ${REVEAL_PRESETS.length} built-in presets, stagger support, and custom easing. scrollReveal alone is ${SELF_ENTRIES.reveal} KB gzipped; every API at once is ${SELF.gzipKb} KB.`,
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
        text: `ScrollReveal ${SR.version} is ${SR.license}, not MIT — verified from its published package.json. GPL-3.0 is copyleft, so it is worth reading carefully before shipping it inside a closed-source commercial product. AOS ${AOS.version} is ${AOS.license}, and svg-scroll-draw is ${SELF.license}.`,
      },
    },
    {
      '@type': 'Question',
      name: 'Is svg-scroll-draw smaller than AOS or ScrollReveal?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: `No, not for the main entry. Measured at gzip level 9 on ${MEASURED_ON}: scrollreveal ${SR.version} is ${SR.gzipKb} KB, aos ${AOS.version} is ${AOS.gzipKb} KB including its required stylesheet, and svg-scroll-draw ${SELF.version} exposing every API is ${SELF.gzipKb} KB. The like-for-like comparison is the svg-scroll-draw/reveal entry point at ${SELF_ENTRIES.reveal} KB, which is smaller than both — but if all you need is fade-on-scroll, AOS and ScrollReveal are good choices.`,
      },
    },
    {
      '@type': 'Question',
      name: 'Can I migrate from AOS to svg-scroll-draw?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: `Yes. Remove data-aos attributes and replace the AOS.init() call with scrollReveal() targeting the same elements. The ${REVEAL_PRESETS.length} built-in presets (${REVEAL_PRESETS.join(', ')}) cover the common AOS fades, zooms and flips; the AOS drop-in (svg-scroll-draw/aos) keeps the data-aos markup as it is.`,
      },
    },
  ],
};

const FEATURES: MatrixRow[] = [
  { f: 'Fade up / down / left / right', cells: [true, true, true] },
  { f: 'Scale reveal', cells: [true, true, true] },
  { f: '3D flip (rotateX / rotateY)', cells: [true, false, true] },
  { f: 'Custom from state (x, y, scale…)', cells: [true, false, true] },
  { f: 'Stagger (cascade)', cells: [true, true, true] },
  { f: 'Custom easing function', cells: [true, 'partial', 'partial'], note: 'AOS ships 8 named CSS easings; ScrollReveal takes any CSS timing function. Only we take a JS easing function (createSpring/createBounce/createElastic).' },
  { f: 'CSS-only config (data attributes)', cells: [false, true, false] },
  { f: 'TypeScript types', cells: [true, 'partial', 'partial'], note: 'Neither ships its own .d.ts; both have community types on DefinitelyTyped (@types/aos, @types/scrollreveal).' },
  { f: 'Tree-shakeable sub-imports', cells: [true, false, false] },
  { f: 'scrollAnimate (any CSS property)', cells: [true, false, false] },
  { f: 'scrollPin / sticky sections', cells: [true, false, false] },
  { f: 'scrollSnap', cells: [true, false, false] },
  { f: 'scrollText (split + stagger text)', cells: [true, false, false] },
  { f: 'scrollVideo (scrub)', cells: [true, false, false] },
  { f: 'scrollProgress (CSS variable)', cells: [true, false, false] },
  { f: 'scrollHorizontal sections', cells: [true, false, false] },
  { f: 'Honours prefers-reduced-motion by default', cells: ['partial', false, false], note: 'True for scrollReveal. Not a blanket claim across every API here — scrollHorizontal opts out by design. Neither AOS nor ScrollReveal references prefers-reduced-motion in its published bundle.' },
  { f: 'React / Vue / Svelte wrappers', cells: [true, 'partial', false] },
  { f: 'Last published', cells: [SELF.lastPublish!, AOS.lastPublish!, SR.lastPublish!], note: `Dates from npm, read ${MEASURED_ON}. Both are stable, finished libraries rather than abandoned ones — weigh that how you like.` },
  { f: 'License', cells: [SELF.license, AOS.license, SR.license], note: 'ScrollReveal is GPL-3.0, which is a real consideration for a closed-source commercial product. AOS is MIT, same as us.' },
  { f: 'Bundle size (gzipped)', cells: [`${SELF.gzipKb} KB`, `${AOS.gzipKb} KB`, `${SR.gzipKb} KB`], note: `Measured ${MEASURED_ON} at gzip level 9 against aos ${AOS.version} and scrollreveal ${SR.version}. Both are smaller than us — see below.` },
];

const API = [
  {
    title: 'Fade up on scroll',
    items: [
      { who: 'AOS', file: 'index.html', code: `<!-- HTML attribute on every element -->\n<div data-aos="fade-up"\n     data-aos-once="true">\n  Content\n</div>\n\n<!-- Init in JS -->\nAOS.init({ duration: 800 });` },
      { who: 'ScrollReveal.js', file: 'app.js', code: `// ScrollReveal.js 4.0.9 (GPL-3.0)\nconst sr = ScrollReveal({\n  origin: 'bottom',\n  distance: '32px',\n  duration: 800,\n  once: true,\n});\n\nsr.reveal('.card');` },
      { who: 'svg-scroll-draw', file: 'app.js', ours: true, code: `import { scrollReveal }\n  from 'svg-scroll-draw/reveal';\n\n// One import. One call.\nscrollReveal('.card');\n\n// Custom config:\nscrollReveal('.card', {\n  from:    { opacity: 0, y: 32 },\n  stagger: 0.08,\n  once:    true,\n});` },
    ],
  },
  {
    title: 'Stagger cascade',
    items: [
      { who: 'AOS', file: 'index.html', code: `<!-- AOS: delay per element in HTML -->\n<div data-aos="fade-up"\n     data-aos-delay="0">A</div>\n<div data-aos="fade-up"\n     data-aos-delay="100">B</div>\n<div data-aos="fade-up"\n     data-aos-delay="200">C</div>` },
      { who: 'ScrollReveal.js', file: 'app.js', code: `sr.reveal('.card', {\n  interval: 100,\n  origin:   'bottom',\n});` },
      { who: 'svg-scroll-draw', file: 'app.js', ours: true, code: `scrollReveal('.card', {\n  stagger: 0.1, // seconds\n});` },
    ],
  },
];

const TOC: [string, string][] = [
  ['drop-in', 'AOS drop-in'],
  ['scrollreveal-drop-in', 'ScrollReveal drop-in'],
  ['vs-size', 'Bundle size'],
  ['vs-api', `Side-by-side API · ${API.length}`],
  ['vs-features', `Feature matrix · ${FEATURES.length}`],
  ['vs-more', 'More comparisons'],
];

export default function VsAosPage() {
  return (
    <SiteShell active="/vs-aos" crumbs={[['vs AOS', '/vs-aos']]} kicker="vs aos / your turn" cta={{ href: '/guides', label: 'Migration guides' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(pageJsonLd) }} />
      <div className="h2h">

        {/* ── Opening ──────────────────────────────────────────────────────── */}
        <header className="pg-head h2h-head">
          <div>
            <p className="pg-kicker">
              <span>comparison / svg-scroll-draw vs aos vs scrollreveal</span>
              <span>measured {MEASURED_ON}</span>
            </p>
            <h1 className="pg-title h2h-title is-name">
              <span className="nb">svg-scroll-draw</span> <span className="dim">vs AOS vs ScrollReveal.</span>
            </h1>
            <p className="pg-lede is-lead">
              Already on AOS or ScrollReveal? Change one import.{' '}
              <code>svg-scroll-draw/aos</code> reads your existing <code>data-aos</code> markup with no{' '}
              <code>aos.css</code>; <code>svg-scroll-draw/scrollreveal</code> runs your{' '}
              <code>ScrollReveal().reveal()</code> calls under MIT instead of GPL-3.0.
            </p>
            <p className="pg-lede">
              AOS and ScrollReveal.js put animation config in HTML data attributes.
              svg-scroll-draw puts it in JavaScript — typed, traceable, and part of a full scroll platform.
              Both of them are smaller than us, and both do less; the numbers below are measured so you can
              decide which trade you want.
            </p>
            <div className="pg-actions">
              <Link href="/" className="btn btn-solid" data-magnetic>Get started free →</Link>
              <Link href="/blog/replace-aos-scrollreveal" className="btn" data-magnetic>Migration guide →</Link>
            </div>
            <dl className="pg-facts is-2">
              <div><dt>AOS → drop-in</dt><dd>{AOS.gzipKb.toFixed(1)} → {SELF_ENTRIES.aos.toFixed(1)} KB</dd></div>
              <div><dt>ScrollReveal → drop-in</dt><dd>{SR.gzipKb.toFixed(1)} → {SELF_ENTRIES.scrollreveal.toFixed(1)} KB</dd></div>
              <div><dt>ScrollReveal licence</dt><dd>{SR.license} → {SELF.license}</dd></div>
              <div><dt>Migrate</dt><dd>1 import</dd></div>
            </dl>
          </div>
          <SpecSheet
            cols={[
              { name: 'svg-scroll-draw', sub: SELF.version, ours: true },
              { name: 'AOS', sub: AOS.version },
              { name: 'ScrollReveal', sub: SR.version },
            ]}
            rows={[
              { k: 'Gzip', cells: [`${SELF_ENTRIES.reveal} KB reveal · ${SELF.gzipKb} KB all`, `${AOS.gzipKb} KB js + css`, `${SR.gzipKb} KB`] },
              { k: 'Licence', cells: [SELF.license, AOS.license, SR.license] },
              { k: 'Configured in', cells: ['A typed JS call', 'HTML data attributes', 'A JS call'] },
              { k: 'Last publish', cells: [SELF.lastPublish!, AOS.lastPublish!, SR.lastPublish!] },
              { k: 'Beyond reveal', cells: ['Draw, pin, snap, text, video', 'No', 'No'], win: 0 },
              { k: 'Drop-in', cells: [`/aos ${SELF_ENTRIES.aos.toFixed(1)} KB · /scrollreveal ${SELF_ENTRIES.scrollreveal.toFixed(1)} KB`, '—', '—'] },
            ]}
            caption="fig. 1 — three libraries, one sheet · ✓ where one is clearly ahead"
          />
        </header>

        <div className="h2h-body">
          <div className="h2h-main">

            {/* ── 01 AOS drop-in ─────────────────────────────── */}
            <section id="drop-in" className="h2h-sec" aria-labelledby="drop-in-h">
              <Head n={1} k="drop-in · aos" id="drop-in-h">Switch from AOS in one line.</Head>
              <p className="h2h-p">
                Keep every <code>data-aos</code>, <code>data-aos-offset</code>,{' '}
                <code>data-aos-anchor-placement</code> and custom animation you wrote. Delete{' '}
                <code>aos.css</code>: the styles ship inside the module. The browser suite runs AOS 2.3.4
                and the drop-in side by side on the same page in Chromium, Firefox and WebKit, and checks that the same
                elements animate at the same scroll positions with the same computed styles.
              </p>
              <Routes
                items={[
                  { label: 'Bundler', file: 'npm', code: `- import AOS from 'aos';
- import 'aos/dist/aos.css';
+ import AOS from 'svg-scroll-draw/aos';

AOS.init({ once: true });` },
                  { label: 'Next.js layout', file: 'app/layout.tsx (Next.js)', code: `import { AOSInit } from 'svg-scroll-draw/aos/react';

// A Server Component is fine: the entry is "use client".
// Initialises on mount, cleans up on unmount (StrictMode-safe),
// and picks up [data-aos] content from route changes.
export default function RootLayout({ children }) {
  return <html lang="en"><body><AOSInit once />{children}</body></html>;
}` },
                  { label: 'Let the CLI do it', file: 'terminal', code: `# or let it do the edits: imports, script tags, aos.css, package.json
npx svg-scroll-draw migrate --dry-run
npx svg-scroll-draw migrate` },
                  { label: 'CDN script tag', file: 'index.html', code: `<!-- remove the aos.js script and the aos.css link, then: -->
<script src="https://unpkg.com/svg-scroll-draw/dist/cdn/aos.global.js"></script>
<script>AOS.init();</script>` },
                ]}
              />
              <h3 className="h2h-h3">Differences, on purpose</h3>
              <Notes
                items={[
                  <><code>prefers-reduced-motion</code> shows every element in its final state.</>,
                  <><code>disable: &apos;mobile&apos;</code> checks viewport width rather than the user agent.</>,
                  <>Positions are re-measured on <code>load</code> so late images do not shift triggers.</>,
                  <>There is a <code>destroy()</code> for single-page apps.</>,
                  <>AOS 3&apos;s <code>mirror</code>, <code>anchorPlacement</code>, <code>aos:in</code> / <code>aos:out</code> events and class name options work too.</>,
                ]}
              />
              <div className="pg-actions">
                <a href="https://stackblitz.com/github/DhruvilChauahan0210/ink-scroll/tree/main/examples/aos" target="_blank" rel="noopener noreferrer" className="btn btn-solid" data-magnetic>
                  Try the AOS drop-in on StackBlitz ↗
                </a>
              </div>
              <p className="h2h-links">
                <span>step-by-step</span>
                <Link href="/guides/aos-nextjs">AOS in Next.js</Link>
                <Link href="/guides/aos-react">AOS in React</Link>
              </p>
            </section>

            {/* ── 02 ScrollReveal drop-in ────────────────────── */}
            <section id="scrollreveal-drop-in" className="h2h-sec" aria-labelledby="scrollreveal-drop-in-h">
              <Head n={2} k="drop-in · scrollreveal" id="scrollreveal-drop-in-h">Switch from ScrollReveal, keep your code.</Head>
              <p className="h2h-p">
                ScrollReveal is GPL-3.0, with a paid licence for commercial work, and has not shipped since 4.0.9. The drop-in is
                an independent MIT implementation of the same API: every option, sequences, <code>reset</code>,{' '}
                <code>viewFactor</code>, callbacks, <code>clean</code> / <code>sync</code> / <code>destroy</code>. The browser suite
                runs ScrollReveal 4.0.9 beside it in Chromium, Firefox and WebKit and checks that every element&apos;s inline styles
                match byte for byte at every scroll stop. <strong>{SELF_ENTRIES.scrollreveal} KB, against {SR.gzipKb} KB.</strong>
              </p>
              <Routes
                items={[
                  { label: 'Bundler', file: 'npm', code: `- import ScrollReveal from 'scrollreveal';
+ import ScrollReveal from 'svg-scroll-draw/scrollreveal';

ScrollReveal({ distance: '40px' }).reveal('.card', { interval: 80 });` },
                  { label: 'CDN script tag', file: 'index.html', code: `<!-- replace the scrollreveal script with: -->
<script src="https://unpkg.com/svg-scroll-draw/dist/cdn/scrollreveal.global.js"></script>
<script>ScrollReveal().reveal('.card');</script>` },
                ]}
              />
              <div className="pg-actions">
                <a href="https://stackblitz.com/github/DhruvilChauahan0210/ink-scroll/tree/main/examples/scrollreveal" target="_blank" rel="noopener noreferrer" className="btn btn-solid" data-magnetic>
                  Try the ScrollReveal drop-in on StackBlitz ↗
                </a>
              </div>
              <p className="h2h-links">
                <span>step-by-step</span>
                <Link href="/guides/scrollreveal-react">ScrollReveal in React and Next.js</Link>
              </p>
            </section>

            {/* ── 03 Bundle size ─────────────────────────────── */}
            <section className="h2h-sec" aria-labelledby="vs-size">
              <Head n={3} k="weigh-in" id="vs-size">Bundle size.</Head>
              <Nb>
                <strong>Read the right row.</strong>{' '}
                The AOS drop-in is {SELF_ENTRIES.aos} KB with its styles, against AOS&apos;s {AOS.gzipKb} KB. But AOS and
                ScrollReveal are both <em>smaller</em> than svg-scroll-draw’s main entry. They also do
                considerably less — neither draws SVG paths, pins, snaps, splits text or scrubs video. If all you need is
                fade-up-on-scroll, they are a perfectly good choice and you should use them. Our{' '}
                <code>svg-scroll-draw/reveal</code> entry point is {SELF_ENTRIES.reveal} KB if you want just that piece — that is
                the number worth comparing, not the {SELF.gzipKb} KB figure for every API at once.
              </Nb>
              <WeighIn
                max={12}
                step={2}
                rows={[
                  { name: `scrollreveal ${SR.version}`, note: SR.license, kb: SR.gzipKb, badge: 'smallest' },
                  { name: `aos ${AOS.version} (js+css)`, note: AOS.license, kb: AOS.gzipKb },
                  { name: 'svg-scroll-draw/scrollreveal', note: 'the ScrollReveal drop-in', kb: SELF_ENTRIES.scrollreveal, ours: true, badge: 'drop-in' },
                  { name: 'svg-scroll-draw/aos', note: 'the AOS drop-in, css incl.', kb: SELF_ENTRIES.aos, ours: true, badge: 'drop-in' },
                  { name: 'svg-scroll-draw/reveal', note: 'scrollReveal alone', kb: SELF_ENTRIES.reveal, ours: true, badge: 'like-for-like' },
                  { name: 'svg-scroll-draw (all APIs)', note: `${SELF.version} · every API at once`, kb: SELF.gzipKb, ours: true, badge: 'yours' },
                ]}
                dim={{ from: SELF_ENTRIES.aos, to: AOS.gzipKb, title: 'AOS → its drop-in', label: `Δ ${(AOS.gzipKb - SELF_ENTRIES.aos).toFixed(1)} KB` }}
                caption="fig. 2 — the weigh-in, to scale · they are lighter than our main entry, heavier than the drop-ins"
              />
              <p className="h2h-src">
                {provenance([`aos ${AOS.version}`, `scrollreveal ${SR.version}`, `svg-scroll-draw ${SELF.version}`])}{' '}
                AOS includes its stylesheet ({AOS.cssKb} KB), which you need.
              </p>
            </section>

            {/* ── 04 API comparison ──────────────────────────── */}
            <section className="h2h-sec" aria-labelledby="vs-api">
              <Head n={4} k={`${API.length} tasks`} id="vs-api">Side-by-side API.</Head>
              {API.map((s, i) => (
                <CodeSet key={s.title} n={`4.${i + 1}`} title={s.title} items={s.items} />
              ))}
            </section>

            {/* ── 05 Feature matrix ──────────────────────────── */}
            <section className="h2h-sec" aria-labelledby="vs-features">
              <Head n={5} k={`${FEATURES.length} rows`} id="vs-features">Feature matrix.</Head>
              <Matrix cols={[{ name: 'svg-scroll-draw', ours: true }, { name: 'AOS' }, { name: 'ScrollReveal.js' }]} rows={FEATURES} />
              <Legend />
            </section>

            {/* ── 06 More comparisons ────────────────────────── */}
            <section className="h2h-sec" aria-labelledby="vs-more">
              <Head n={6} k="the set" id="vs-more">More comparisons.</Head>
              <OtherSheets current="/vs-aos" />
            </section>
          </div>
          <Toc items={TOC} />
        </div>

        {/* ── The last word ──────────────────────────────────────────────── */}
        <Closing
          n={7}
          title="One import. Done."
          actions={
            <>
              <Link href="/docs" className="btn btn-solid" data-magnetic>Read the docs →</Link>
              <Link href="/blog/replace-aos-scrollreveal" className="btn" data-magnetic>Migration guide →</Link>
            </>
          }
        >
          No data attributes. No config files. No separate CSS import. Works in React, Vue, Svelte, Solid, Astro, Nuxt.
        </Closing>
      </div>
    </SiteShell>
  );
}
