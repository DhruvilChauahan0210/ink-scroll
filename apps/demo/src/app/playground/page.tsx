import type { Metadata } from 'next';
import '@/components/playground.css';
import Link from 'next/link';
import { seoTitle } from '../_lib/seo';
import { SELF } from '@/data/competitors';
import { SiteShell } from '@/components/site/SiteShell';
import { CodeBox } from '@/components/site/CodeBox';
import { StepRail } from '@/components/site/StepRail';
import { SvgPlayground, PlaygroundFacts } from '@/components/SvgPlayground';
import { PlaygroundPlot } from '@/components/PlaygroundPlot';

export const metadata: Metadata = {
  title: seoTitle('SVG Scroll Animation Playground — Try It Live'),
  description:
    'Paste any SVG and watch it animate on scroll. Tweak easing, speed, stagger, fade, stroke color, morphTo, and clip mode. Share your result with a URL.',
  alternates: { canonical: '/playground' },
  openGraph: {
    title: 'SVG Scroll Animation Playground — svg-scroll-draw',
    description:
      'Paste any SVG and watch it animate on scroll. Tweak easing, speed, stagger, and more.',
    url: 'https://svg-scroll-draw.vercel.app/playground',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SVG Scroll Animation Playground — svg-scroll-draw',
    description: 'Paste any SVG and watch it animate on scroll. Share your result with a URL.',
  },
};

const pad = (n: number) => String(n).padStart(2, '0');

/** What the code tab prints for the first preset (Scope) — speed 1 is the default, so it is left out. */
const FIRST_SNIPPET = `<ScrollDraw
  easing="ease-out"
  stagger={0.12}
>
  <svg>...</svg>
</ScrollDraw>`;

const STEPS: { k: string; zone: string; title: string; body: string; code?: string }[] = [
  {
    k: 'source',
    zone: 'A',
    title: 'Paste any SVG',
    body: 'Drop markup into panel A and it mounts a moment after you stop typing. Before it does, the playground strips <script>, <foreignObject> and every on* handler, then sizes the drawing to fit the specimen.',
  },
  {
    k: 'specimen',
    zone: 'B',
    title: 'Scrub instead of scrolling',
    body: 'The track under panel B stands in for the page’s scroll position: 0% is where the trigger starts, 100% where it ends. Play loops it, reset puts it back to 0, and paper or slate swaps the ground under the drawing.',
  },
  {
    k: 'options',
    zone: 'C',
    title: 'Tune it',
    body: 'Easing, speed, stagger and direction, then colour, width, fill, clip and morph. Each control writes one prop of the component — the parts list below says which.',
  },
  {
    k: 'code',
    zone: 'C',
    title: 'Copy the component',
    body: 'The code tab prints a <ScrollDraw> with only the props you moved off their defaults. This is what it prints for the first preset:',
    code: FIRST_SNIPPET,
  },
  {
    k: 'share',
    zone: 'fig. 2',
    title: 'Send the bench',
    body: 'Share writes the whole state — your markup included — into the URL after #p= and copies the link. Whoever opens it gets the same drawing and the same options, ready to scrub.',
  },
];

/** Every control on the bench, the prop it writes and where the docs cover it. */
const PARTS: { group: string; rows: { control: string; prop: string; range: string; href: string }[] }[] = [
  {
    group: 'v1 · scrollDraw',
    rows: [
      { control: 'Preset', prop: 'preset', range: 'sketch · reveal · typewriter · cinematic · spring', href: '/docs#core-options' },
      { control: 'Easing', prop: 'easing', range: 'linear · ease-in · ease-out · ease-in-out · spring · bounce · elastic', href: '/docs#core-options' },
      { control: 'Bounce params', prop: 'createBounce()', range: 'bounces 1–6 · decay 0.1–0.9', href: '/docs#create-bounce' },
      { control: 'Elastic params', prop: 'createElastic()', range: 'amplitude 1–2.5 · period 0.1–0.8', href: '/docs#create-elastic' },
      { control: 'Speed', prop: 'speed', range: '0.1× – 3×', href: '/docs#core-options' },
      { control: 'Stagger', prop: 'stagger', range: '0 – 0.5', href: '/docs#core-options' },
      { control: 'Direction', prop: 'direction', range: 'forward · reverse', href: '/docs#core-options' },
      { control: 'Once', prop: 'once', range: 'locks at 100%', href: '/docs#core-options' },
      { control: 'Fade', prop: 'fade', range: 'opacity 0 → 1', href: '/docs#visual' },
      { control: 'Stroke colour', prop: 'strokeColor', range: '[from, to]', href: '/docs#visual' },
      { control: 'Stroke width', prop: 'strokeWidth', range: '[from, to]', href: '/docs#visual' },
      { control: 'Fill opacity', prop: 'fillOpacity', range: '[from, to]', href: '/docs#visual' },
      { control: 'Clip reveal', prop: 'clip', range: 'left · right · top · bottom · center', href: '/docs#visual' },
      { control: 'Path morph', prop: 'morphTo', range: 'a target d with the same numeric tokens', href: '/docs#visual' },
    ],
  },
  {
    group: 'v2 · animate · text · counter',
    rows: [
      { control: 'Fade Slide … Color Shift', prop: 'scrollAnimate()', range: 'opacity · transform · background-color · color', href: '/docs#scroll-animate' },
      { control: 'Word, Char, Line', prop: 'scrollText()', range: 'split words · chars · lines, stagger 0 – 0.1', href: '/docs#scroll-text' },
      { control: 'Revenue, Users', prop: 'scrollCounter()', range: 'to, format, easing', href: '/docs#scroll-counter' },
    ],
  },
];

const MORE = [
  { href: '/docs', title: 'API reference', note: 'Every option on the bench, and the ones it leaves out: triggers, callbacks, timelines, framework wrappers.' },
  { href: '/examples', title: 'Examples', note: 'Logo reveals, line charts, signatures — real interfaces drawn on scroll, each with its code.' },
  { href: '/blocks', title: 'Blocks', note: 'Copy-paste scroll animation blocks for React and Tailwind, one file each.' },
  { href: '/guides', title: 'Migration guides', note: 'Moving from AOS, ScrollReveal or vivus onto the maintained drop-ins, or from GSAP ScrollTrigger.' },
];

function Head({ n, k, id, children }: { n: number; k: string; id: string; children: React.ReactNode }) {
  return (
    <>
      <div className="tb">
        <span className="tb-n">{pad(n)}</span>
        <span>{k}</span>
      </div>
      <h2 id={id} className="pl-h2">{children}</h2>
    </>
  );
}

/** Where each group's numbering starts, so the parts list counts straight through. */
const PART_START = PARTS.map((_, gi) => PARTS.slice(0, gi).reduce((a, g) => a + g.rows.length, 0));

export default function PlaygroundPage() {
  return (
    <SiteShell active="/playground" crumbs={[['Playground', '/playground']]} kicker="playground / your turn">
      <div className="play">

        {/* ── Opening ──────────────────────────────────────── */}
        <header className="pg-head pl-head">
          <div>
            <p className="pg-kicker"><span>playground / try it live</span><span>v{SELF.version}</span></p>
            <h1 className="pg-title pl-title">SVG scroll animation playground</h1>
            <p className="pg-lede">
              Paste any SVG and scrub it the way scrolling will draw it. Tweak easing, speed, stagger, fade,
              stroke colour, morphTo and clip mode, copy the component it prints, and share the result as a URL.
            </p>
            <div className="pg-actions">
              <a href="#bench" className="btn btn-solid" data-magnetic>Open the bench ↓</a>
              <Link href="/docs#core-options" className="btn" data-magnetic>Read the options</Link>
            </div>
            <PlaygroundFacts gzipKb={SELF.gzipKb} />
          </div>
          <PlaygroundPlot />
        </header>

        {/* ── The bench ────────────────────────────────────── */}
        <section id="bench" className="pl-sec-bench" aria-label="Playground">
          <SvgPlayground />
        </section>

        <div className="pl-body">

          {/* ── 01 From the bench to your page ─────────────── */}
          <section className="pl-sec pl-sec-grid" aria-labelledby="pl-how">
            <div className="pl-sec-head">
              <Head n={1} k={`${STEPS.length} steps`} id="pl-how">From the bench to your page</Head>
              <p className="pl-p">
                The bench is the library with the scroll taken out: a scrubber drives the same progress a
                page would, so what you tune here is what ships.
              </p>
            </div>
            <StepRail>
              <ol className="pl-steps">
                {STEPS.map((s, i) => (
                  <li key={s.title} className="pl-step">
                    <span className="pl-node" aria-hidden="true">{i + 1}</span>
                    <p className="pl-step-k">step {pad(i + 1)} · <span>{s.k}, {s.zone}</span></p>
                    <h3 className="pl-h3">{s.title}</h3>
                    <p className="pl-p">{s.body}</p>
                    {s.code && <CodeBox file="Drawing.tsx">{s.code}</CodeBox>}
                  </li>
                ))}
              </ol>
            </StepRail>
          </section>

          {/* ── 02 Every control is a prop ──────────────────── */}
          <section className="pl-sec" aria-labelledby="pl-parts">
            <Head n={2} k="parts list" id="pl-parts">Every control is a prop</Head>
            <p className="pl-p">
              The options panel is the component&apos;s props, laid out. Each control below maps to an option
              you can pass yourself, with the range the bench lets you try.
            </p>
            <div className="pl-parts">
              <div className="pl-parts-h" aria-hidden="true">
                <span />
                <span>control</span>
                <span>prop</span>
                <span>on the bench</span>
                <span />
              </div>
              {PARTS.map((g, gi) => (
                <div key={g.group}>
                  <p className="pl-parts-group">{g.group}</p>
                  {g.rows.map((r, ri) => (
                    <Link key={r.control} href={r.href} className="pl-part">
                      <span className="pl-part-n">{pad(PART_START[gi] + ri + 1)}</span>
                      <span className="pl-part-c">{r.control}</span>
                      <span className="pl-part-p">{r.prop}</span>
                      <span className="pl-part-r">{r.range}</span>
                      <span className="pl-part-go" aria-hidden="true">docs →</span>
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </section>

          {/* ── 03 Keep going ────────────────────────────────── */}
          <section className="pl-sec" aria-labelledby="pl-more">
            <Head n={3} k="keep going" id="pl-more">Take it further</Head>
            <div className="ex-rel-list">
              {MORE.map((m, i) => (
                <Link key={m.href} href={m.href} className="ex-rel-row">
                  <span className="ex-rel-n">{pad(i + 1)}</span>
                  <span>
                    <span className="ex-rel-t">{m.title}</span>
                    <span className="ex-rel-d">{m.note}</span>
                  </span>
                  <span className="ex-rel-go" aria-hidden="true">open →</span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </SiteShell>
  );
}
