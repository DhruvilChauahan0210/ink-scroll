import type { Metadata } from 'next';
import Link from 'next/link';
import './home.css';
import { MobileMenu } from '@/components/MobileMenu';
import { SmoothScroll } from '@/components/home/SmoothScroll';
import { HomeThemeToggle } from '@/components/home/HomeThemeToggle';
import { Progress } from '@/components/home/Progress';
import { Knot } from '@/components/home/Knot';
import { ScrollFx } from '@/components/home/ScrollFx';
import { Magnetic } from '@/components/home/Magnetic';
import { ContourDraw } from '@/components/home/ContourDraw';
import { Manifesto } from '@/components/home/Manifesto';
import { ApiRail } from '@/components/home/ApiRail';
import { Counters } from '@/components/home/Counters';
import { VersusBars } from '@/components/home/VersusBars';
import { CodeTabs } from '@/components/home/CodeTabs';
import { CopyCommand } from '@/components/home/CopyCommand';
import { COMPETITORS, SELF, MEASURED_ON } from '@/data/competitors';
import { EXAMPLE_COUNT } from '@/data/examples-index';

export const metadata: Metadata = {
  alternates: { canonical: 'https://svg-scroll-draw.vercel.app' },
};

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
    <div className="home">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SmoothScroll />
      <Magnetic />

      {/* ── Nav ──────────────────────────────────────────────────────── */}
      <header className="nav">
        <Progress />
        <Link href="/" className="nav-brand" aria-label="svg-scroll-draw home">
          <Mark />
          svg-scroll-draw
        </Link>
        <nav className="nav-links" aria-label="Primary">
          <Link href="/docs">Docs</Link>
          <Link href="/examples">Examples</Link>
          <Link href="/guides">Guides</Link>
          <Link href="/blocks">Blocks</Link>
          <Link href="/blog">Blog</Link>
        </nav>
        <div className="nav-right">
          <a href={GH} className="nav-gh" target="_blank" rel="noopener noreferrer">GitHub</a>
          <HomeThemeToggle />
          <Link href="/docs" className="btn btn-sm nav-cta">Get started</Link>
          <div className="nav-menu"><MobileMenu /></div>
        </div>
      </header>

      <main>
        {/* ── Hero ─────────────────────────────────────────────────── */}
        <section className="hero" aria-label="Introduction">
          <ScrollFx
            className="hero-stage"
            props={{ opacity: [1, 0.15], transform: ['translateY(0px) scale(1)', 'translateY(-60px) scale(0.92)'] }}
            trigger={{ start: 'top top', end: 'bottom top' }}
            triggerSelector=".hero"
            easing="ease-in"
          >
            <Knot />
          </ScrollFx>
          <div className="hero-foot">
            <div>
              <h1 className="h1">
                The scroll animation library <span className="dim">that draws.</span>
              </h1>
              <p className="hero-sub">
                Draw SVG paths, reveal content, pin sections and scrub video from scroll —
                on the browser’s own scroll timeline where it has one. {SELF.gzipKb} KB, zero dependencies.
              </p>
            </div>
            <div>
              <div className="hero-cta">
                <CopyCommand />
                <Link href="/docs" className="btn btn-solid" data-magnetic>Get started</Link>
              </div>
              <p className="hero-note" style={{ marginTop: 14, textAlign: 'right' }}>Free and open source · MIT</p>
            </div>
          </div>
        </section>

        <div className="strip" aria-label="At a glance">
          <span><b>{SELF.gzipKb} KB</b> gzipped</span>
          <span><b>0</b> dependencies</span>
          <span><b>623</b> tests</span>
          <span><b>195</b> browser tests × 3 engines</span>
          <span><b>8</b> framework wrappers</span>
          <span><b>MIT</b></span>
        </div>

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

        {/* ── 03 Instruments (horizontal rail) ─────────────────────── */}
        <section className="chapter chapter-rail" aria-labelledby="inst-title">
          <div className="chapter-head">
            <span className="label"><b>03</b> / the toolkit</span>
            <div>
              <h2 id="inst-title" className="h2">Eight small APIs. <span className="dim">One hand.</span></h2>
              <p className="body">
                Every API is its own entry point with the same instance shape — destroy, replay,
                pause, resume, seek, getProgress — so learning one teaches you the rest. Keep scrolling;
                the rail moves sideways.
              </p>
            </div>
          </div>
          <ApiRail items={INSTRUMENTS} />
        </section>

        {/* ── 04 Numbers ───────────────────────────────────────────── */}
        <section className="chapter" aria-labelledby="num-title">
          <div className="chapter-head">
            <span className="label"><b>04</b> / scrollCounter</span>
            <h2 id="num-title" className="h2">Tested in real browsers, <span className="dim">not just in theory.</span></h2>
          </div>
          <Counters />
        </section>

        {/* ── 05 Weight ────────────────────────────────────────────── */}
        <section className="chapter" aria-labelledby="w-title">
          <div className="chapter-head">
            <span className="label"><b>05</b> / weight</span>
            <div>
              <h2 id="w-title" className="h2">A fifth of the bytes <span className="dim">for the effects you ship.</span></h2>
              <p className="body">
                Drawing, reveals, pins, counters — in one import. Most pages add a single entry
                point and stop there.
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
              <h2 id="code-title" className="h2" style={{ marginTop: 16 }}>Written the way <span className="dim">your framework writes.</span></h2>
              <p className="body" style={{ marginTop: 20 }}>
                A component in React and Vue, an action in Svelte, a hook in Solid, a custom element
                for plain HTML. SSR-safe: importing on a server never touches the DOM.
              </p>
              <div className="code-links">
                <Link href="/examples" className="btn" data-magnetic>{EXAMPLE_COUNT} live examples</Link>
                <Link href="/blocks" className="btn" data-magnetic>Copy-paste blocks</Link>
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
              <h2 id="sw-title" className="h2">Already on AOS? <span className="dim">Change one import.</span></h2>
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
          <h2 id="final-title" className="final-words">Start <em>drawing</em> today.</h2>
          <p className="final-sub">One install, one call, and the page follows the scroll.</p>
          <div className="final-cta">
            <CopyCommand />
            <Link href="/docs" className="btn btn-solid" data-magnetic>Read the docs</Link>
            <a href={GH} target="_blank" rel="noopener noreferrer" className="btn" data-magnetic>Star on GitHub</a>
          </div>

          <footer className="foot">
            <div className="foot-col">
              <p className="foot-meta">
                svg-scroll-draw v{SELF.version}<br />
                {SELF.gzipKb} KB gzipped · 623 tests · 195 browser tests × 3 engines · MIT
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
        </section>
      </main>
    </div>
  );
}
