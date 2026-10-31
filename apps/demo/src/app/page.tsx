import type { Metadata } from 'next';
import Link from 'next/link';
import { Big_Shoulders, Instrument_Serif } from 'next/font/google';
import './home.css';
import { MobileMenu } from '@/components/MobileMenu';
import { SmoothScroll } from '@/components/home/SmoothScroll';
import { Preloader } from '@/components/home/Preloader';
import { HomeThemeToggle } from '@/components/home/HomeThemeToggle';
import { ContourDraw } from '@/components/home/ContourDraw';
import { Manifesto } from '@/components/home/Manifesto';
import { Counters } from '@/components/home/Counters';
import { VersusBars } from '@/components/home/VersusBars';
import { Reveal } from '@/components/home/Reveal';
import { CodeTabs } from '@/components/home/CodeTabs';
import { CopyCommand } from '@/components/home/CopyCommand';
import { COMPETITORS, SELF, MEASURED_ON } from '@/data/competitors';
import { EXAMPLE_COUNT } from '@/data/examples-index';

export const metadata: Metadata = {
  alternates: { canonical: 'https://svg-scroll-draw.vercel.app' },
};

/* The two voices of the page: a condensed display for the big words, an
   italic serif for the one soft word in each line. */
const display = Big_Shoulders({
  subsets: ['latin'],
  weight: ['800', '900'],
  variable: '--font-ink-display',
  display: 'swap',
});
const serif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['italic'],
  variable: '--font-ink-serif',
  display: 'swap',
});

const GH = 'https://github.com/DhruvilChauahan0210/ink-scroll';
const NPM = 'https://www.npmjs.com/package/svg-scroll-draw';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'svg-scroll-draw',
  description:
    'A lightweight scroll-animation toolkit with best-in-class SVG path drawing. Draw SVG paths, reveal content, animate text, scrub video, and drive CSS from scroll. 10 KB gzipped, zero dependencies, MIT.',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Web',
  url: 'https://svg-scroll-draw.vercel.app',
  downloadUrl: NPM,
  codeRepository: GH,
  license: 'https://opensource.org/licenses/MIT',
  softwareVersion: SELF.version,
  programmingLanguage: ['JavaScript', 'TypeScript'],
  author: { '@type': 'Person', name: 'Dhruvil Chauhan' },
  keywords:
    'scroll draw, svg scroll draw, scroll draw animation, scroll draw library, svg, animation, scroll, javascript, react, vue, web animation',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

const FRAMEWORKS = ['React', 'Next.js', 'Vue', 'Nuxt', 'Svelte', 'Solid', 'Angular', 'Astro', 'Web Component', 'Vanilla JS'];

const INSTRUMENTS = [
  { name: 'scrollDraw',     desc: 'Draw any SVG path from scroll. The original, and still the best at it.', entry: 'svg-scroll-draw',       href: '/docs#scrolldraw' },
  { name: 'scrollAnimate',  desc: 'Any CSS property, scrubbed by position: opacity, transforms, colours, units.', entry: 'svg-scroll-draw',       href: '/docs#scrollanimate' },
  { name: 'scrollText',     desc: 'Split a headline into words, characters or lines and stagger them in.',  entry: 'svg-scroll-draw/text',  href: '/docs#scrolltext' },
  { name: 'scrollPin',      desc: 'Hold a section in place while the page keeps moving.',                 entry: 'svg-scroll-draw/pin',   href: '/docs#scrollpin' },
  { name: 'scrollParallax', desc: 'Layers that move at their own fraction of the scroll speed.',          entry: 'svg-scroll-draw',       href: '/docs#scrollparallax' },
  { name: 'scrollVideo',    desc: 'Tie a video’s current time to scroll. No framework needed.',           entry: 'svg-scroll-draw/video', href: '/docs#scrollvideo' },
  { name: 'scrollCounter',  desc: 'Numbers that count up as they enter, with your own formatting.',       entry: 'svg-scroll-draw',       href: '/docs#scrollcounter' },
  { name: 'scrollSnap',     desc: 'Snap between sections with thresholds, easing and callbacks.',         entry: 'svg-scroll-draw/snap',  href: '/docs#scrollsnap' },
];

const SWITCH = [
  { from: 'AOS',          entry: 'svg-scroll-draw/aos',          guide: '/guides/aos-nextjs' },
  { from: 'ScrollReveal', entry: 'svg-scroll-draw/scrollreveal', guide: '/guides/scrollreveal-react' },
  { from: 'vivus',        entry: 'svg-scroll-draw/vivus',        guide: '/guides/vivus-react' },
];

const WEIGHTS = [
  { name: 'svg-scroll-draw', detail: 'every API, one import', kb: SELF.gzipKb, ours: true },
  { name: 'Framer Motion',   detail: 'CJS entry',             kb: COMPETITORS.framerMotion.gzipKb },
  { name: 'GSAP + ScrollTrigger + DrawSVG', detail: COMPETITORS.gsapStack.version, kb: COMPETITORS.gsapStack.gzipKb },
];

function Mark() {
  return (
    <svg className="nav-mark" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 17 C 6 6, 10 6, 12 12 S 18 18, 21 7" />
    </svg>
  );
}

export default function HomePage() {
  const marquee = [...FRAMEWORKS, ...FRAMEWORKS];
  return (
    <div className={`home ${display.variable} ${serif.variable}`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SmoothScroll />
      <Preloader />

      {/* ── Nav ──────────────────────────────────────────────────────── */}
      <header className="nav">
        <Link href="/" className="nav-brand" aria-label="svg-scroll-draw home">
          <Mark />
          svg-scroll-draw
        </Link>
        <div className="nav-center">v{SELF.version} — {SELF.gzipKb} KB — MIT</div>
        <div className="nav-right">
          <nav className="nav-links" aria-label="Primary">
            <Link href="/docs">Docs</Link>
            <Link href="/examples">Examples</Link>
            <Link href="/guides">Guides</Link>
            <Link href="/blocks">Blocks</Link>
            <a href={GH} target="_blank" rel="noopener noreferrer">GitHub</a>
          </nav>
          <HomeThemeToggle />
          <div className="nav-menu"><MobileMenu /></div>
        </div>
      </header>

      <main>
        {/* ── Hero ─────────────────────────────────────────────────── */}
        <section className="hero" aria-label="Introduction">
          <h1 className="hero-words">
            <span className="mask" style={{ '--i': 0 } as React.CSSProperties}><span>The page</span></span>
            <span className="mask is-serif" style={{ '--i': 1 } as React.CSSProperties}><span>draws</span></span>
            <span className="mask is-offset" style={{ '--i': 2 } as React.CSSProperties}><span>itself.</span></span>
          </h1>
          <div className="hero-foot">
            <div>
              <p className="hero-lede">
                <b>svg-scroll-draw</b> is an SVG and scroll animation library. It draws paths, reveals
                content, pins sections, splits text and scrubs video from scroll — on the browser’s own
                scroll timeline wherever it can.
              </p>
              <div className="hero-meta label">
                <span><b>{SELF.gzipKb} KB</b> gzipped</span>
                <span><b>0</b> dependencies</span>
                <span><b>623</b> tests</span>
                <span><b>MIT</b></span>
              </div>
            </div>
            <div className="hero-cta">
              <CopyCommand />
              <Link href="/docs" className="btn btn-solid">Read the docs</Link>
              <span className="scroll-cue label"><i /> scroll</span>
            </div>
          </div>
        </section>

        {/* ── 01 Draw ──────────────────────────────────────────────── */}
        <section className="draw" aria-labelledby="draw-title">
          <ContourDraw />
        </section>

        {/* ── 02 Manifesto ─────────────────────────────────────────── */}
        <section className="chapter" aria-label="Why">
          <div className="chapter-head">
            <span className="label"><b>02</b> / scrollText</span>
            <div />
          </div>
          <Manifesto />
        </section>

        {/* ── 03 Instruments ───────────────────────────────────────── */}
        <section className="chapter" aria-labelledby="inst-title">
          <div className="chapter-head">
            <span className="label"><b>03</b> / the toolkit</span>
            <div>
              <h2 id="inst-title" className="h2">Eight <em>instruments,</em> one hand.</h2>
              <p className="body">
                Every API is its own entry point with the same instance shape — destroy, replay,
                pause, resume, seek, getProgress — so learning one teaches you the rest.
              </p>
            </div>
          </div>
          <div className="rows">
            {INSTRUMENTS.map((it, i) => (
              <Reveal key={it.name} y={24}>
                <Link href={it.href} className="row">
                  <span className="row-n">{String(i + 1).padStart(2, '0')}</span>
                  <span className="row-name">{it.name}</span>
                  <span className="row-desc">{it.desc}</span>
                  <span className="row-entry">{it.entry}</span>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── 04 Numbers ───────────────────────────────────────────── */}
        <section className="chapter" aria-labelledby="num-title">
          <div className="chapter-head">
            <span className="label"><b>04</b> / scrollCounter</span>
            <h2 id="num-title" className="h2">Tested in <em>real</em> browsers.</h2>
          </div>
          <Counters />
        </section>

        {/* ── 05 Weight ────────────────────────────────────────────── */}
        <section className="chapter" aria-labelledby="w-title">
          <div className="chapter-head">
            <span className="label"><b>05</b> / weight</span>
            <div>
              <h2 id="w-title" className="h2">A fifth of the <em>bytes.</em></h2>
              <p className="body">
                The scroll effects you actually ship — drawing, reveals, pins, counters — in one
                import. Most pages add a single entry point and stop there.
              </p>
            </div>
          </div>
          <VersusBars rows={WEIGHTS} />
          <p className="versus-note">
            Minified and gzipped at level 9, measured {MEASURED_ON}. GSAP has been free since 2025 and
            does far more than scroll; for the scroll effects here, this is the difference you ship.
          </p>
        </section>

        {/* ── 06 Code ──────────────────────────────────────────────── */}
        <section className="chapter" aria-labelledby="code-title">
          <div className="marquee" aria-hidden="true">
            <div className="marquee-track">
              {marquee.map((f, i) => <span key={i}>{f}</span>)}
            </div>
          </div>
          <div className="code-grid">
            <div>
              <span className="label"><b>06</b> / your stack</span>
              <h2 id="code-title" className="h2" style={{ marginTop: 18 }}>Write it the way <em>your</em> framework writes.</h2>
              <p className="body" style={{ marginTop: 24 }}>
                A component in React and Vue, an action in Svelte, a hook in Solid, a custom element
                for plain HTML. SSR-safe: importing on a server never touches the DOM.
              </p>
              <div className="code-links">
                <Link href="/examples" className="btn">{EXAMPLE_COUNT} live examples</Link>
                <Link href="/blocks" className="btn">Copy-paste blocks</Link>
              </div>
            </div>
            <CodeTabs />
          </div>
        </section>

        {/* ── 07 Switch ────────────────────────────────────────────── */}
        <section className="chapter" aria-labelledby="sw-title">
          <div className="chapter-head">
            <span className="label"><b>07</b> / switching</span>
            <div>
              <h2 id="sw-title" className="h2">Already on AOS? <em>Change one import.</em></h2>
              <p className="body">
                Each has a drop-in that keeps its API and your markup, tested side by side against
                the real library in three browsers — and a React hook that cleans up after itself.
              </p>
            </div>
          </div>
          <div className="switch">
            {SWITCH.map((s) => (
              <Link href={s.guide} className="switch-row" key={s.from}>
                <span className="switch-from"><small>from</small>{s.from}</span>
                <span className="switch-entry">{s.entry}</span>
                <span className="switch-arrow" aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
          <div className="switch-cmd">
            <CopyCommand command="npx svg-scroll-draw migrate" />
            <span className="label">rewrites the imports for you</span>
          </div>
        </section>

        {/* ── Final ────────────────────────────────────────────────── */}
        <section className="final" aria-labelledby="final-title">
          <h2 id="final-title" className="final-words">
            Start<em>drawing.</em>
          </h2>
          <div className="final-cta">
            <CopyCommand />
            <Link href="/docs" className="btn">Read the docs</Link>
            <a href={GH} target="_blank" rel="noopener noreferrer" className="btn">Star on GitHub</a>
          </div>

          <footer className="foot">
            <div className="foot-col">
              <p className="foot-meta">
                svg-scroll-draw v{SELF.version} · {SELF.gzipKb} KB gzipped · 623 tests · 195 browser tests × 3 engines · MIT
              </p>
            </div>
            <div className="foot-col">
              <h4>Learn</h4>
              <Link href="/docs">Docs</Link>
              <Link href="/examples">Examples</Link>
              <Link href="/blocks">Blocks</Link>
              <Link href="/playground">Playground</Link>
            </div>
            <div className="foot-col">
              <h4>Switch</h4>
              <Link href="/guides">Migration guides</Link>
              <Link href="/vs-gsap">vs GSAP</Link>
              <Link href="/vs-aos">vs AOS</Link>
              <Link href="/vs-vivus">vs vivus</Link>
            </div>
            <div className="foot-col">
              <h4>Project</h4>
              <a href={GH} target="_blank" rel="noopener noreferrer">GitHub</a>
              <a href={NPM} target="_blank" rel="noopener noreferrer">npm</a>
              <Link href="/changelog">Changelog</Link>
              <Link href="/blog">Blog</Link>
            </div>
          </footer>
          <div className="wordmark" aria-hidden="true"><span>svg-scroll-draw</span></div>
        </section>
      </main>
    </div>
  );
}
