import type { Metadata } from 'next';
import '@/components/stack/stack.css';
import '@/components/wave/wave.css';
import Link from 'next/link';
import { SELF } from '@/data/competitors';
import { seoTitle } from '../_lib/seo';
import { SiteShell } from '@/components/site/SiteShell';
import { jsonLd, SITE_URL } from '@/lib/json-ld';
import { CodeBox } from '@/components/site/CodeBox';
import { WaveGenerator } from '@/components/wave/WaveGenerator';
import { WaveFigure } from '@/components/wave/WaveFigure';
import { TensionFigure } from '@/components/wave/TensionFigure';
import {
  FILL_TABS, JITTER_H, JITTER_X, LINE_TABS, MAX_LAYERS, SLUG, SMOOTHS, buildWave, cssBackground, type WaveSettings,
} from '@/components/wave/wave';
import { C, Note, Sec, Toc } from '@/components/stack/parts';
import { ToolNextStep } from '@/components/tool-kit/ToolNextStep';
import { withSource } from '@/lib/tool-export';

// Searches this page is for: "svg wave generator", "wave divider svg", "css
// wave background", "animated svg wave". Every path and data URI quoted below
// is written by the generator's own functions, never typed by hand.
const TITLE = 'SVG Wave Generator: Dividers, CSS Backgrounds & Animation';
const DESCRIPTION =
  'Make SVG wave dividers: layers, amplitude, wavelength, curves, peaks or steps, a seed. Copy SVG, React, a CSS background, or a line that draws on scroll.';

const pct = (n: number) => `${Math.round(n * 100)}%`;
const OUTPUTS = new Set([...FILL_TABS, ...LINE_TABS].map(([, label]) => label)).size;

/** A small wave for the CSS example: one peak, short enough to read encoded. */
const SMALL: WaveSettings = {
  mode: 'fill', layers: 1, amplitude: 0.8, waves: 1, smooth: 'peaks', tension: 0, steps: 8, variation: 0, seed: 1,
  flipX: false, flipY: false, height: 48, strokeWidth: 4, stagger: 0, plays: 'scroll', finish: 'leave',
};
const SMALL_CSS = withSource(cssBackground(SMALL, buildWave(SMALL), ['#121110']), SLUG, 'css');

const CATMULL_JS = withSource(`// One cubic Bézier per gap, through every point.
// p: the points, left to right; tension 0 is Catmull-Rom.
function catmullRom(p, tension = 0) {
  const f = (1 - tension) / 6;
  let d = \`M\${p[1].x},\${p[1].y}\`;
  for (let i = 1; i < p.length - 2; i++) {
    const [a, b, c, e] = [p[i - 1], p[i], p[i + 1], p[i + 2]];
    d += \`C\${b.x + (c.x - a.x) * f},\${b.y + (c.y - a.y) * f},\` +
         \`\${c.x - (e.x - b.x) * f},\${c.y - (e.y - b.y) * f},\` +
         \`\${c.x},\${c.y}\`;
  }
  return d; // from p[1] to the point before last: the ends only steer
}`, SLUG, 'js');

const DIVIDER_HTML = `<section class="hero">…</section>

<!-- The wave, filled with the colour of the section it leads into. -->
<svg viewBox="0 0 1440 160" preserveAspectRatio="none"
     width="100%" height="160" aria-hidden="true" style="display:block">
  <path fill="#121110" d="M0,…V160H0Z"/>
</svg>

<section class="next" style="background:#121110">…</section>`;

const DRAW_JS = `import { scrollDraw } from 'svg-scroll-draw';

// With the scroll: done as the wave leaves the top of the window.
scrollDraw('#wave');

// Done by the time it reaches the middle of the screen.
scrollDraw('#wave', { trigger: { end: 'center center' } });

// Once, on its own clock (1000 ms), the first time it is seen.
scrollDraw('#wave', { autoplay: true, once: true });

// Several lines, each starting a little after the one before.
scrollDraw('#wave', { stagger: 0.15 });`;

const FAQ: { q: string; a: string }[] = [
  {
    q: 'How do I make an SVG wave divider between two sections?',
    a: 'Put a wave SVG between the two sections and fill it with the colour of the section it leads into, so the wave looks like the top edge of that section. Give the <svg> a viewBox, width="100%", a fixed height and preserveAspectRatio="none", and display: block. For a wave hanging from the bottom of a section instead, flip it vertically. The generator above writes all of this.',
  },
  {
    q: 'How do I use an SVG wave as a CSS background?',
    a: 'Put the SVG in a data URI: background-image: url("data:image/svg+xml,…"), with background-size: 100% 100% and background-repeat: no-repeat. The SVG must be URL-encoded: # becomes %23 (left alone it starts a URL fragment and cuts the image off at the first hex colour), % becomes %25, < and > become %3C and %3E, and double quotes are swapped for single ones so the SVG fits inside url("…"). The CSS background tab does the encoding.',
  },
  {
    q: 'How do I make an SVG wave stretch to the full width?',
    a: 'Use a viewBox, width="100%" and a height in pixels, and set preserveAspectRatio="none": the drawing then fills the box exactly, stretched sideways but never taller, so it spans any screen at the same height. Without "none" the SVG keeps its proportions and either letterboxes or changes height with the width.',
  },
  {
    q: 'Why is there a gap under my SVG wave?',
    a: 'An inline <svg> sits on the text baseline, like a letter, and the space left for descenders shows under it. display: block on the svg removes it. A hairline can still show where the wave meets the next section when its edge lands between two pixels; overlapping by one pixel, margin-bottom: -1px, hides it.',
  },
  {
    q: 'How do I animate an SVG wave?',
    a: 'Draw its line: switch the generator to line, copy the SVG, and call scrollDraw(\'#wave\') from svg-scroll-draw, which sizes the stroke as one dash and slides it into place as the page scrolls; { autoplay: true, once: true } draws it once on its own clock when it is first seen. Under prefers-reduced-motion it shows the line drawn. To make a filled wave drift sideways instead, it has to tile: set variation to 0 and a whole number of waves, so both ends meet at the same height and slope, then repeat it with background-repeat: repeat-x and a background-size in pixels, and animate background-position-x by one tile width, inside @media (prefers-reduced-motion: no-preference).',
  },
  {
    q: 'What is a Catmull-Rom curve, and what does tension do?',
    a: 'A Catmull-Rom spline is a smooth curve that passes through every point, its direction at each point parallel to the line between the two neighbours. Each gap becomes one cubic Bézier, C in SVG path data, with handles at P1 + (P2 − P0) ÷ 6 and P2 − (P3 − P1) ÷ 6. Tension multiplies both handles by 1 − tension: 0 is the classic curve, 1 leaves no handles and straight lines.',
  },
  {
    q: 'Will the same seed give the same wave?',
    a: 'Yes. Every random number comes from a small seeded generator (mulberry32), one stream per layer, so the same seed and settings give the same path in any browser. Shuffle picks a new seed. With variation at 0 the seed has no effect.',
  },
];

const TOC = [
  { id: 'generator', label: 'The generator' },
  { id: 'maths', label: 'Points, then a curve' },
  { id: 'divider', label: 'As a section divider' },
  { id: 'draw', label: 'Drawing the line on scroll' },
  { id: 'use', label: 'Use it in your project' },
  { id: 'faq', label: `Questions · ${FAQ.length}` },
];

export const metadata: Metadata = {
  title: seoTitle(TITLE),
  description: DESCRIPTION,
  keywords: [
    'svg wave generator', 'wave divider svg', 'css wave background', 'animated svg wave', 'svg wave',
    'svg section divider', 'layered waves svg', 'svg wave background', 'wave svg react', 'catmull-rom bezier',
  ],
  alternates: { canonical: '/svg-wave-generator' },
  openGraph: { type: 'article', title: TITLE, description: DESCRIPTION, url: `${SITE_URL}/svg-wave-generator` },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

const JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      name: 'SVG wave generator',
      url: `${SITE_URL}/svg-wave-generator`,
      description: DESCRIPTION,
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Any (runs in the browser)',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      isPartOf: { '@id': `${SITE_URL}/#software` },
    },
    {
      '@type': 'FAQPage',
      mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
  ],
};

export default function SvgWaveGeneratorPage() {
  return (
    <SiteShell active="/svg-wave-generator" crumbs={[['SVG wave generator', '/svg-wave-generator']]} kicker="svg / your turn">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(JSON_LD) }} />
      <div className="stk">

        <header className="pg-head stk-head">
          <div>
            <p className="pg-kicker">
              <span>tool / svg waves</span>
              <span>runs in your browser</span>
            </p>
            <h1 className="pg-title stk-title">SVG wave generator</h1>
            <p className="pg-lede">
              Set the layers, the amplitude, the wavelength and the shape, shuffle the seed until it looks right, and
              copy one responsive SVG: as a file, a React component or a CSS background. Or keep just the line, and
              draw it on scroll.
            </p>
            <div className="pg-actions">
              <a href="#generator" className="btn btn-solid" data-magnetic>Make a wave ↓</a>
              <Link href="/svg-path-viewer" className="btn" data-magnetic>SVG path viewer →</Link>
            </div>
            <dl className="pg-facts">
              <div><dt>Layers</dt><dd>1–{MAX_LAYERS}</dd></div>
              <div><dt>Shapes</dt><dd>{SMOOTHS.length}</dd></div>
              <div><dt>Outputs</dt><dd>{OUTPUTS}</dd></div>
              <div><dt>Uploads</dt><dd>0</dd></div>
            </dl>
          </div>
          <WaveFigure />
        </header>

        <div className="stk-body">
          <Toc label="On this page" items={TOC} />
          <div className="stk-main">

            <Sec n={1} k="The tool" id="generator" title="Make a wave">
              <p className="stk-p">
                Each layer is one closed shape, its wave along the top and its flat side at the bottom, so it fills down
                to the next section: give the front layer that section’s colour. Switch the output to line to keep only
                the waves themselves, as strokes that scrollDraw draws.
              </p>
              <WaveGenerator version={SELF.version} />
            </Sec>

            <Sec n={2} k="The maths" id="maths" title="Points first, then a curve">
              <p className="stk-p">
                The wave starts as a row of points: a crest, then a trough, every half wavelength, the amplitude above
                and below a baseline (fig. 1). The wavelength is the width divided by the number of waves. Layers get
                baselines spaced evenly down the height and phases spread along one wavelength, so their crests do not
                line up. Variation moves each point sideways by up to {pct(JITTER_X)} of the spacing, pulls it toward the
                baseline by up to {pct(JITTER_H)} of the amplitude and nudges each layer’s phase, all with numbers from
                the seed.
              </p>
              <p className="stk-p">
                Then a curve through them. A Catmull-Rom spline passes through every point, its direction at each one
                parallel to the line between the two neighbours, and in SVG it is one cubic Bézier per gap: from P1 to
                P2, the handles sit at P1 + (P2 − P0) ÷ 6 and P2 − (P3 − P1) ÷ 6.
              </p>
              <CodeBox file="catmull-rom.js">{CATMULL_JS}</CodeBox>
              <Note k="Tension">
                Tension multiplies both handles by 1 − tension. At 0 the curve is the classic Catmull-Rom; at 1 the
                handles are gone and the curve is straight lines through the same points, the peaks shape (fig. 2).
                Steps samples the tension-0 curve at the middle of each step.
              </Note>
              <TensionFigure />
              <p className="stk-p">
                <b className="wv-b">Exactly 0 to the width.</b> The points carry on past both edges, so every gap has
                neighbours whatever the phase. The curve is then cut where it crosses x = 0 and x = width (split with
                de Casteljau’s construction at the point where x is exactly the edge), and the shape closes down the
                side, back along the bottom and up: <C>V height H 0 Z</C>. At any seed, phase or number of waves the
                shape meets both sides of its box, with no sliver at either end.
              </p>
              <p className="stk-p">
                <b className="wv-b">Inside the box.</b> A curve through points can swing past them. The generator finds
                each piece’s highest and lowest point, where the cubic’s slope is 0, and if one would leave the box it
                scales that layer toward its baseline just enough. With variation at 0 and a whole number of waves, the
                two ends meet at the same height and slope, so the wave tiles.
              </p>
            </Sec>

            <Sec n={3} k="In a page" id="divider" title="Use it as a section divider">
              <p className="stk-p">
                Put the SVG between two sections and fill it with the colour of the one it leads into. With{' '}
                <C>{'width="100%"'}</C>, a fixed height and <C>{'preserveAspectRatio="none"'}</C> it
                stretches to any width without changing height: wide screens get gentler waves, phones steeper ones (try
                the 390px preview). Flip it vertically to make it the bottom edge of the section above instead.
              </p>
              <CodeBox file="divider.html">{DIVIDER_HTML}</CodeBox>
              <Note k="The gap under it">
                An inline SVG sits on the text baseline, which leaves a few pixels under it: <C>display: block</C>{' '}
                removes them. If a hairline still shows where the wave meets the next section, because its edge lands
                between two pixels, overlap them by one: <C>margin-bottom: -1px</C>.
              </Note>
              <p className="stk-p">
                As a CSS background the same SVG goes in a data URI, and it has to be URL-encoded. A <C>#</C> starts a
                URL fragment, so a hex colour left as it is cuts the image off there; <C>%</C>, <C>{'<'}</C>,{' '}
                <C>{'>'}</C> and spaces are not allowed as they are either. The CSS tab encodes them and swaps double
                quotes for single ones, so the SVG sits inside <C>{'url("…")'}</C>. <C>{'background-size: 100% 100%'}</C> stretches it the way <C>{'preserveAspectRatio="none"'}</C> stretches the inline SVG.
                This one is a single peak, short enough to read:
              </p>
              <CodeBox file="wave.css">{SMALL_CSS}</CodeBox>
            </Sec>

            <Sec n={4} k="scrollDraw" id="draw" title="Draw the wave line on scroll">
              <p className="stk-p">
                In line mode the generator keeps only each layer’s wave, as an open path with a stroke and no fill.
                scrollDraw turns each stroke into one dash as long as the line and slides it into place as the page
                scrolls: by default from when the top of the wave reaches the bottom of the window until its bottom
                leaves the top (<C>trigger</C> <C>{"'top bottom'"}</C> to <C>{"'bottom top'"}</C>), at an
                even rate (linear easing). The draws and done controls change that, and the code includes only what
                differs from the defaults.
              </p>
              <CodeBox file="main.js">{DRAW_JS}</CodeBox>
              <Note k="Not stretched">
                A stroke in a stretched SVG is stretched with it: under <C>{'preserveAspectRatio="none"'}</C> on a
                phone, the flat stretches of the line come out thicker than the slopes. So the line keeps its
                proportions and scales evenly, and its stroke stays even. <C long>{'vector-effect="non-scaling-stroke"'}</C>{' '}
                would even the width of a stretched one, but the browser then lays the dash out in screen pixels while
                scrollDraw sizes it from <C>getTotalLength()</C> in viewBox units, so the line would finish early.
              </Note>
              <Note k="2.23.2">
                In 2.23.2 and earlier, <C>autoplay: true</C> without <C>once</C>, a stagger or a callback could take the
                native CSS scroll-timeline path and follow the scroll instead of its own clock; fixed in 2.23.3.{' '}
                <C>once: true</C>, which the generator adds, keeps it on the clock in both.
              </Note>
              <Note k="Reduced motion">
                Under <C>prefers-reduced-motion: reduce</C> scrollDraw shows the line drawn from the start and never
                animates it.
              </Note>
            </Sec>

            <Sec n={5} k="Next" id="use" title="Use it in your project">
              <ToolNextStep
                slug={SLUG}
                api="scrollDraw"
                docs="/docs#core-options"
                related={['svg-blob-generator', 'scroll-trigger-visualizer']}
              />
              <Note k="Fill needs nothing">
                The fill’s SVG, React component and CSS background need no package at all: only the line, drawn on
                scroll, imports scrollDraw (or <C>ScrollDraw</C> from <C>svg-scroll-draw/react</C>).
              </Note>
            </Sec>

            <Sec n={6} k={`${FAQ.length} questions`} id="faq" title="SVG wave questions">
              <div className="stk-faq">
                {FAQ.map((f, i) => (
                  <div key={f.q} className="stk-q">
                    <span className="stk-q-n">Q{i + 1}</span>
                    <div>
                      <h3 className="stk-q-t">{f.q}</h3>
                      <p className="stk-p">{f.a}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Sec>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
