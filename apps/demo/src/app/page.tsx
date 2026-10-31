import type { Metadata } from 'next';
import Link from 'next/link';
import { Instrument_Serif } from 'next/font/google';
import './home.css';
import { ThemeToggle } from '@/components/ThemeToggle';
import { MobileMenu } from '@/components/MobileMenu';
import { HeroInk } from '@/components/home/HeroInk';
import { InkTimeline } from '@/components/home/InkTimeline';
import { CodeTabs } from '@/components/home/CodeTabs';
import { CopyCommand } from '@/components/home/CopyCommand';
import { COMPETITORS, SELF, MEASURED_ON } from '@/data/competitors';
import { EXAMPLE_COUNT } from '@/data/examples-index';

export const metadata: Metadata = {
  alternates: { canonical: 'https://svg-scroll-draw.vercel.app' },
};

/* The accent face: a few italic words per heading, never body text. */
const serif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['italic'],
  variable: '--font-instrument-serif',
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
  downloadUrl: 'https://www.npmjs.com/package/svg-scroll-draw',
  codeRepository: 'https://github.com/DhruvilChauahan0210/ink-scroll',
  license: 'https://opensource.org/licenses/MIT',
  softwareVersion: '2.15.0',
  programmingLanguage: ['JavaScript', 'TypeScript'],
  author: { '@type': 'Person', name: 'Dhruvil Chauhan' },
  keywords:
    'scroll draw, svg scroll draw, scroll draw animation, scroll draw library, svg, animation, scroll, javascript, react, vue, web animation',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

const FRAMEWORKS = ['React', 'Next.js', 'Vue', 'Nuxt', 'Svelte', 'Solid', 'Angular', 'Astro', 'Web Component', 'Vanilla'];

/* One line each; the art is a sketch of what the API does, in the page's ink. */
const CAPABILITIES: { name: string; desc: string; imp: string; art: React.ReactNode }[] = [
  {
    name: 'scrollDraw',
    desc: 'Draw any SVG path as it scrolls through the viewport. The original, still the best at it.',
    imp: "svg-scroll-draw",
    art: (
      <svg viewBox="0 0 160 90" strokeLinecap="round"><path className="i" strokeWidth="2" strokeDasharray="4 6" d="M8 70 C 40 10, 70 10, 90 50 S 140 80, 152 20" /><path className="a" strokeWidth="3.5" d="M8 70 C 40 10, 70 10, 90 50" /></svg>
    ),
  },
  {
    name: 'scrollAnimate',
    desc: 'Animate any CSS property on any element from scroll — opacity, transforms, colours, units.',
    imp: 'svg-scroll-draw',
    art: (
      <svg viewBox="0 0 160 90"><rect className="i" x="10" y="44" width="34" height="34" rx="8" strokeWidth="1.5" opacity="0.5" /><rect className="i" x="58" y="30" width="34" height="34" rx="8" strokeWidth="1.5" opacity="0.75" /><rect className="f" x="106" y="14" width="34" height="34" rx="8" strokeWidth="1.5" /></svg>
    ),
  },
  {
    name: 'scrollText',
    desc: 'Split headlines into words, characters or lines and stagger them in. Accessible by default.',
    imp: 'svg-scroll-draw/text',
    art: (
      <svg viewBox="0 0 160 90"><rect className="g" x="8" y="22" width="40" height="12" rx="3" /><rect className="g" x="54" y="22" width="56" height="12" rx="3" opacity="0.7" /><rect className="f" x="116" y="22" width="36" height="12" rx="3" /><rect className="g" x="8" y="48" width="64" height="12" rx="3" opacity="0.45" /><rect className="g" x="78" y="48" width="30" height="12" rx="3" opacity="0.25" /></svg>
    ),
  },
  {
    name: 'scrollPin',
    desc: 'Hold an element in place while the page scrolls past, with enter and leave callbacks.',
    imp: 'svg-scroll-draw/pin',
    art: (
      <svg viewBox="0 0 160 90"><rect className="i" x="10" y="8" width="140" height="74" rx="10" strokeWidth="1.5" /><rect className="f" x="22" y="20" width="52" height="50" rx="7" strokeWidth="1.5" /><path className="i" strokeWidth="1.5" d="M92 26 H136 M92 40 H128 M92 54 H136" /></svg>
    ),
  },
  {
    name: 'scrollParallax',
    desc: 'Move layers at a fraction of the scroll speed — or against it — in one call.',
    imp: 'svg-scroll-draw',
    art: (
      <svg viewBox="0 0 160 90" strokeLinecap="round"><path className="i" strokeWidth="1.5" d="M8 72 L 50 40 L 80 60 L 120 24 L 152 52" opacity="0.5" /><path className="a" strokeWidth="2.5" d="M8 82 L 46 58 L 84 74 L 126 46 L 152 64" /><circle className="f" cx="122" cy="18" r="8" strokeWidth="1.5" /></svg>
    ),
  },
  {
    name: 'scrollVideo',
    desc: 'Tie a video’s current time to scroll — the product-page scrub, without a framework.',
    imp: 'svg-scroll-draw/video',
    art: (
      <svg viewBox="0 0 160 90"><rect className="i" x="8" y="10" width="144" height="56" rx="8" strokeWidth="1.5" /><path className="f" d="M70 26 L 92 38 L 70 50 Z" strokeWidth="1.5" /><rect className="g" x="8" y="76" width="144" height="4" rx="2" /><rect className="f" x="8" y="76" width="88" height="4" rx="2" strokeWidth="0" /></svg>
    ),
  },
  {
    name: 'scrollCounter',
    desc: 'Count a number up as it enters view, with your own formatting and easing.',
    imp: 'svg-scroll-draw',
    art: (
      <svg viewBox="0 0 160 90"><text x="8" y="62" fontFamily="var(--mono)" fontSize="44" fontWeight="600" fill="var(--accent)">2,4</text><text x="94" y="62" fontFamily="var(--mono)" fontSize="44" fontWeight="600" fill="var(--line-2)">80</text></svg>
    ),
  },
  {
    name: 'scrollSnap',
    desc: 'Snap between sections with thresholds, easing and callbacks — no carousel library.',
    imp: 'svg-scroll-draw/snap',
    art: (
      <svg viewBox="0 0 160 90"><rect className="i" x="8" y="14" width="40" height="62" rx="7" strokeWidth="1.5" opacity="0.5" /><rect className="f" x="60" y="14" width="40" height="62" rx="7" strokeWidth="1.5" /><rect className="i" x="112" y="14" width="40" height="62" rx="7" strokeWidth="1.5" opacity="0.5" /></svg>
    ),
  },
];

const STEPS = [
  {
    title: 'Install it',
    body: 'One package, no dependencies. Every API is its own entry point, so you ship only what you import — scrollReveal alone is a few kilobytes.',
    code: 'npm i svg-scroll-draw',
  },
  {
    title: 'Point it at an element',
    body: 'Pass a selector or an element and the options you need. Trigger windows, easing, stagger and once are all optional; the defaults draw across the viewport.',
    code: "scrollDraw('#logo', { stagger: 0.1 })",
  },
  {
    title: 'Scroll',
    body: 'Where the browser supports scroll-driven animations, the draw runs on a CSS view-timeline with no JavaScript per frame. Everywhere else the JS engine takes over — and the two are tested to render the same.',
    code: 'animation-timeline: view()',
  },
];

const DROP_INS = [
  { from: 'AOS', title: 'Keep your data-aos markup', code: "import AOS from 'svg-scroll-draw/aos'", href: '/guides/aos-nextjs', go: 'AOS in Next.js →' },
  { from: 'ScrollReveal', title: 'Same API, MIT not GPL', code: "import ScrollReveal from 'svg-scroll-draw/scrollreveal'", href: '/guides/scrollreveal-react', go: 'ScrollReveal in React →' },
  { from: 'vivus', title: 'Same new Vivus() calls', code: "import Vivus from 'svg-scroll-draw/vivus'", href: '/guides/vivus-react', go: 'vivus in React →' },
];

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <svg viewBox="0 0 16 16" fill="none" stroke="var(--paper)" strokeWidth="2" strokeLinecap="round">
        <path d="M2.5 11.5 C 4.5 4, 7 4, 8 8 S 11.5 12, 13.5 4.5" />
      </svg>
    </span>
  );
}

export default function Home() {
  const sizes = [
    { name: 'svg-scroll-draw', note: 'every API', kb: SELF.gzipKb, ours: true },
    { name: COMPETITORS.framerMotion.label, note: 'CJS entry', kb: COMPETITORS.framerMotion.gzipKb, ours: false },
    { name: COMPETITORS.gsapStack.label, note: COMPETITORS.gsapStack.version, kb: COMPETITORS.gsapStack.gzipKb, ours: false },
  ];
  const max = Math.max(...sizes.map((s) => s.kb));

  return (
    <div className={`home ${serif.variable}`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <header className="nav">
        <div className="wrap nav-inner">
          <Link href="/" className="brand" aria-label="svg-scroll-draw home">
            <BrandMark />
            svg-scroll-draw
          </Link>
          <nav className="nav-links" aria-label="Main">
            {[
              ['Docs', '/docs'],
              ['Examples', '/examples'],
              ['Blocks', '/blocks'],
              ['Guides', '/guides'],
              ['Blog', '/blog'],
              ['Changelog', '/changelog'],
            ].map(([label, href]) => (
              <Link key={href} href={href} className="nav-link">{label}</Link>
            ))}
            <a href={GH} target="_blank" rel="noopener noreferrer" className="nav-link">GitHub</a>
          </nav>
          <div className="nav-right">
            <ThemeToggle />
            <Link href="/docs" className="btn btn-primary btn-sm nav-cta">
              Get started
            </Link>
            <div className="lg:hidden"><MobileMenu /></div>
          </div>
        </div>
      </header>

      <main>
        {/* ── Hero ──────────────────────────────────────────────────── */}
        <section className="hero" data-mascot-reset>
          <div className="wrap hero-grid">
            <div>
              <Link href="/guides" className="badge">
                <span className="pill">2.15</span>
                <span className="badge-text">React hooks for AOS, ScrollReveal &amp; vivus drop-ins</span>
                <span aria-hidden="true">→</span>
              </Link>
              <h1 className="display">
                The page draws <em>itself</em> as you scroll.
              </h1>
              <p className="lede">
                svg-scroll-draw draws SVG paths, reveals content, pins sections, splits text and scrubs video from
                scroll — in 10 KB, with zero dependencies, on the browser’s own scroll timeline wherever it can.
              </p>
              <div className="cta-row">
                <CopyCommand />
                <Link href="/docs" className="btn btn-primary">
                  Read the docs <span aria-hidden="true">→</span>
                </Link>
              </div>
              <div className="proof num">
                <div><b>10 KB</b><span>gzipped, every API</span></div>
                <div><b>0</b><span>dependencies</span></div>
                <div><b>623 tests</b><span>unit, plus real browsers</span></div>
                <div><b>MIT</b><span>no licence fee, ever</span></div>
              </div>
            </div>
            <HeroInk />
          </div>
        </section>

        {/* ── Frameworks ─────────────────────────────────────────────── */}
        <div className="strip">
          <div className="wrap strip-inner">
            <span className="label">First-class wrappers for</span>
            {FRAMEWORKS.map((f) => <span key={f}>{f}</span>)}
          </div>
        </div>

        {/* ── Capabilities ───────────────────────────────────────────── */}
        <section className="section">
          <div className="wrap">
            <div className="section-head">
              <span className="eyebrow">One package</span>
              <h2 className="h2">Everything scroll can drive, <em>in one toolkit.</em></h2>
              <p className="lede">
                Each API is a separate entry point with the same instance shape — destroy, replay, pause, resume, seek,
                getProgress — so learning one teaches you the rest.
              </p>
            </div>
            <div className="bento">
              {CAPABILITIES.map((c) => (
                <article key={c.name} className="cell">
                  <div className="cell-art" aria-hidden="true">{c.art}</div>
                  <h3>{c.name}</h3>
                  <p>{c.desc}</p>
                  <span className="imp">{c.imp}</span>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works: a line that draws as you read ─────────────── */}
        <section className="section" data-mascot="draw">
          <div className="wrap">
            <div className="section-head">
              <span className="eyebrow">How it works</span>
              <h2 className="h2">Three steps. <em>Watch the line.</em></h2>
              <p className="lede">The ink on the left is scrollDraw, scrubbed by your scroll position. Scroll back up and it rewinds.</p>
            </div>
            <div className="timeline">
              <InkTimeline />
              {STEPS.map((s, i) => (
                <div key={s.title} className="step">
                  <div>
                    <span className="step-num">0{i + 1}</span>
                    <h3>{s.title}</h3>
                    <p>{s.body}</p>
                  </div>
                  <div className="code">
                    <pre>{s.code}</pre>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Code ───────────────────────────────────────────────────── */}
        <section className="section">
          <div className="wrap split">
            <div>
              <span className="eyebrow">Your stack</span>
              <h2 className="h2" style={{ margin: '18px 0' }}>Write it the way <em>your framework</em> writes things.</h2>
              <p className="lede">
                A component in React and Vue, an action in Svelte, a hook in Solid, a ref in Angular, a custom element
                for plain HTML. All SSR-safe: importing on a server never touches the DOM.
              </p>
              <div className="cta-row">
                <Link href="/examples" className="btn btn-ghost">{EXAMPLE_COUNT} live examples</Link>
                <Link href="/blocks" className="btn btn-ghost">Copy-paste blocks</Link>
              </div>
            </div>
            <CodeTabs />
          </div>
        </section>

        {/* ── Native performance ─────────────────────────────────────── */}
        <section className="section">
          <div className="wrap split">
            <div>
              <span className="eyebrow">Performance</span>
              <h2 className="h2" style={{ margin: '18px 0' }}>Off the main thread, <em>where the browser allows.</em></h2>
              <p className="lede">
                Simple draws compile to a CSS scroll timeline the browser runs itself, so a busy main thread cannot make
                them stutter. Everything else uses an IntersectionObserver-gated loop that skips frames where nothing
                moved.
              </p>
              <div className="browsers">
                <span><b>Chrome</b> 115+</span>
                <span><b>Edge</b> 115+</span>
                <span><b>Safari</b> 26+</span>
                <span><b>Firefox</b> 159+</span>
              </div>
            </div>
            <div className="lanes">
              <div className="lane">
                <div className="lane-head"><b>Native fast path</b><span>no JS per frame</span></div>
                <div className="flow">
                  <span className="node hot">scroll</span><span className="arrow">→</span>
                  <span className="node hot">view-timeline</span><span className="arrow">→</span>
                  <span className="node hot">compositor</span>
                </div>
              </div>
              <div className="lane">
                <div className="lane-head"><b>JavaScript engine</b><span>older browsers</span></div>
                <div className="flow">
                  <span className="node">scroll</span><span className="arrow">→</span>
                  <span className="node">requestAnimationFrame</span><span className="arrow">→</span>
                  <span className="node">style write</span>
                </div>
              </div>
              <p className="bar-note">
                Both engines run side by side in the browser suite in Chromium, Firefox and WebKit, and must render the
                same stroke at every offset.
              </p>
            </div>
          </div>
        </section>

        {/* ── Size ───────────────────────────────────────────────────── */}
        <section className="section">
          <div className="wrap split">
            <div>
              <span className="eyebrow">Bundle size</span>
              <h2 className="h2" style={{ margin: '18px 0' }}>
                The whole toolkit is <em>smaller</em> than the alternatives’ core.
              </h2>
              <p className="lede">
                {SELF.gzipKb} KB gzipped for every API at once, and most pages import one or two entry points. Measured,
                not estimated — and checked in CI so the number cannot drift.
              </p>
              <div className="cta-row">
                <Link href="/vs-gsap" className="btn btn-ghost">Compared with GSAP</Link>
                <Link href="/vs-framer-motion" className="btn btn-ghost">With Framer Motion</Link>
              </div>
            </div>
            <div>
              <div className="bars num">
                {sizes.map((s) => (
                  <div key={s.name} className="bar-row">
                    <div className="bar-label">
                      <span>{s.name} <span className="muted">· {s.note}</span></span>
                      <span>{s.kb} KB</span>
                    </div>
                    <div className="bar-track">
                      <div className={`bar-fill${s.ours ? ' ours' : ''}`} style={{ width: `${(s.kb / max) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="bar-note">
                Minified and gzipped at level 9, measured {MEASURED_ON}. GSAP has been free since 2025 and does more than
                scroll; for the scroll effects here, this is the difference you ship.
              </p>
            </div>
          </div>
        </section>

        {/* ── Drop-ins ───────────────────────────────────────────────── */}
        <section className="section">
          <div className="wrap">
            <div className="band">
              <span className="eyebrow">Switching</span>
              <h2 className="h2" style={{ margin: '18px 0', maxWidth: 760 }}>
                Already on AOS, ScrollReveal or vivus? <em>Change one import.</em>
              </h2>
              <p className="lede">
                Each has a drop-in that keeps its API and your markup, tested side by side against the real library in
                three browsers — and a React hook that cleans up after itself.
              </p>
              <div className="band-grid">
                {DROP_INS.map((d) => (
                  <Link key={d.from} href={d.href} className="dropin">
                    <span className="from">from {d.from}</span>
                    <b>{d.title}</b>
                    <code>{d.code}</code>
                    <span className="go">{d.go}</span>
                  </Link>
                ))}
              </div>
              <div className="migrate"><span aria-hidden="true">$</span> npx svg-scroll-draw migrate</div>
            </div>
          </div>
        </section>

        {/* ── Quality ────────────────────────────────────────────────── */}
        <section className="section">
          <div className="wrap">
            <div className="section-head">
              <span className="eyebrow">Proof, not adjectives</span>
              <h2 className="h2">Tested in <em>real browsers,</em> not just in theory.</h2>
            </div>
            <div className="stats num">
              <div className="stat"><b>623</b><span>unit tests, including a suite with no DOM at all for server rendering.</span></div>
              {/* check:claims guards this figure: 195 browser tests per engine */}
              <div className="stat"><b>195</b><span>browser tests, run in each of Chromium, Firefox and WebKit on every push.</span></div>
              <div className="stat"><b>{SELF.gzipKb} KB</b><span>main entry, held to a size budget in CI with every other entry point.</span></div>
              <div className="stat"><b>8</b><span>framework wrappers, each mounted for real in the browser suite.</span></div>
              <div className="stat"><b>0</b><span>runtime dependencies. Nothing to audit but this package.</span></div>
              <div className="stat"><b>a11y</b><span>prefers-reduced-motion respected; split text keeps its accessible label.</span></div>
            </div>
          </div>
        </section>

        {/* ── Final CTA ──────────────────────────────────────────────── */}
        <section className="final">
          <div className="final-ink" aria-hidden="true">
            <svg viewBox="0 0 1200 400" preserveAspectRatio="none" fill="none">
              <path d="M-20 300 C 200 120, 380 360, 600 220 S 1000 60, 1220 180" strokeWidth="1.5" />
            </svg>
          </div>
          <div className="wrap" style={{ position: 'relative' }}>
            <span className="eyebrow">Get started</span>
            <h2 className="display" style={{ margin: '22px 0 18px' }}>
              Start <em>drawing.</em>
            </h2>
            <p className="lede" style={{ margin: '0 auto' }}>Free, MIT, and one install away.</p>
            <div className="cta-row">
              <CopyCommand />
              <Link href="/docs" className="btn btn-primary">Read the docs <span aria-hidden="true">→</span></Link>
              <a href={GH} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">Star on GitHub</a>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="foot">
        <div className="wrap">
          <div className="foot-grid">
            <div>
              <Link href="/" className="brand"><BrandMark />svg-scroll-draw</Link>
              <p className="muted" style={{ fontSize: 14, lineHeight: 1.6, marginTop: 14, maxWidth: 320 }}>
                Scroll-driven animation for the web. {SELF.gzipKb} KB, zero dependencies, MIT.
              </p>
            </div>
            <div>
              <h4>Learn</h4>
              <ul>
                <li><Link href="/docs">Docs</Link></li>
                <li><Link href="/examples">Examples</Link></li>
                <li><Link href="/blocks">Blocks</Link></li>
                <li><Link href="/playground">Playground</Link></li>
              </ul>
            </div>
            <div>
              <h4>Switch</h4>
              <ul>
                <li><Link href="/guides">Migration guides</Link></li>
                <li><Link href="/vs-gsap">vs GSAP</Link></li>
                <li><Link href="/vs-aos">vs AOS</Link></li>
                <li><Link href="/vs-vivus">vs vivus</Link></li>
              </ul>
            </div>
            <div>
              <h4>Project</h4>
              <ul>
                <li><a href={GH} target="_blank" rel="noopener noreferrer">GitHub</a></li>
                <li><a href={NPM} target="_blank" rel="noopener noreferrer">npm</a></li>
                <li><Link href="/changelog">Changelog</Link></li>
                <li><Link href="/blog">Blog</Link></li>
              </ul>
            </div>
          </div>
          <small>svg-scroll-draw v{SELF.version} · MIT licensed · made for the scroll</small>
        </div>
      </footer>
    </div>
  );
}
