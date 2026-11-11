import type { Metadata } from 'next';
import '@/components/stack/stack.css';
import '@/components/blob/blob.css';
import Link from 'next/link';
import { SELF } from '@/data/competitors';
import { seoTitle } from '../_lib/seo';
import { SiteShell } from '@/components/site/SiteShell';
import { jsonLd, SITE_URL } from '@/lib/json-ld';
import { CodeBox } from '@/components/site/CodeBox';
import { BlobGenerator } from '@/components/blob/BlobGenerator';
import { BlobFigure } from '@/components/blob/BlobFigure';
import { MORPH_FIG, MorphFigure } from '@/components/blob/MorphFigure';
import {
  GALLERY, HANDLE, MAX_POINTS, MAX_RANDOMNESS, MIN_POINTS, blobGeometry, fmt, nextSeed,
} from '@/components/blob/blob';
import { OUTPUT_COUNT } from '@/components/blob/code';
import { C, Note, Sec, Toc } from '@/components/stack/parts';

// Searches this page is for: "svg blob generator", "blob shape generator",
// "organic shape svg", "random blob svg". Every path, length and limit quoted
// below comes from the generator's own functions (components/blob/blob.ts).
const TITLE = 'SVG Blob Generator: Random Organic Shapes, Morph & Draw';
const DESCRIPTION =
  'Make random organic blob shapes in SVG: set the points, randomness and seed, morph to the next seed, draw the outline on scroll. Copy SVG, React or CSS.';

const SIXTH = Math.round(1 / HANDLE);

/** The morph example starts from the longer outline: scrollDraw sizes its dash to the shape it starts with. */
const MORPH = (() => {
  const base = { ...MORPH_FIG, size: 400, line: 4 };
  const a = { seed: MORPH_FIG.seed, g: blobGeometry(base) };
  const b = { seed: nextSeed(MORPH_FIG.seed), g: blobGeometry({ ...base, seed: nextSeed(MORPH_FIG.seed) }) };
  const [from, to] = a.g.length >= b.g.length ? [a, b] : [b, a];
  return { from, to, points: MORPH_FIG.points };
})();

const PATH_JS = `// Spokes at equal angles from the top, clockwise; a radius on each (px);
// a closed Catmull-Rom curve through their ends: one C per point, then Z.
function blobPath(radii, cx, cy) {
  const n = radii.length;
  const p = radii.map((r, i) => {
    const a = -Math.PI / 2 + (i / n) * 2 * Math.PI;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  });
  const at = (i) => p[(i + n) % n];
  const f = (v) => +v.toFixed(1);
  let d = \`M\${f(p[0][0])},\${f(p[0][1])}\`;
  for (let i = 0; i < n; i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    // Each handle: a ${SIXTH === 6 ? 'sixth' : `1/${SIXTH}`} of the chord between the point's neighbours.
    const c1 = [p1[0] + (p2[0] - p0[0]) / ${SIXTH}, p1[1] + (p2[1] - p0[1]) / ${SIXTH}];
    const c2 = [p2[0] - (p3[0] - p1[0]) / ${SIXTH}, p2[1] - (p3[1] - p1[1]) / ${SIXTH}];
    d += \` C\${f(c1[0])},\${f(c1[1])} \${f(c2[0])},\${f(c2[1])} \${f(p2[0])},\${f(p2[1])}\`;
  }
  return d + ' Z';
}

blobPath([150, 120, 165, 110, 140], 200, 200); // five points around 200, 200`;

const SEED_JS = `// mulberry32: a 32-bit seed in, the same stream of numbers in [0, 1) out.
function mulberry32(seed) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Seed ${GALLERY[0].seed}, ${GALLERY[0].points} points, randomness ${GALLERY[0].randomness}:
// each radius between ${fmt(1 - GALLERY[0].randomness, 2)} and 1 of the longest.
const rand = mulberry32(${GALLERY[0].seed});
const radii = Array.from({ length: ${GALLERY[0].points} }, () => 1 - ${GALLERY[0].randomness} * rand());`;

const MORPH_JS = `// <div id="blob"><svg viewBox="0 0 400 400" width="400" height="400">
//   <path d="${MORPH.from.g.d}"
//     fill="none" stroke="currentColor" stroke-width="4"/>
// </svg></div>

import { scrollDraw } from 'svg-scroll-draw';

// Seed ${MORPH.from.seed} draws and becomes seed ${MORPH.to.seed} as #blob scrolls through
// the window. ${MORPH.points} points each, so both are M, ${MORPH.points} × C, Z.
scrollDraw('#blob', {
  morphTo: '${MORPH.to.g.d}',
});`;

const FAQ: { q: string; a: string }[] = [
  {
    q: 'How do I make a random blob shape in SVG?',
    a: `Put a few points around a centre at equal angles, give each its own random distance from the centre, and join them with one smooth closed curve. The generator above does exactly that: ${MIN_POINTS} to ${MAX_POINTS} points, a radius on each from a seeded random number generator, and a closed Catmull-Rom curve written as one cubic Bézier (C) per point and a Z. Copy the result as an SVG file, the bare d value, a React component or a CSS clip-path.`,
  },
  {
    q: 'How do I make a smooth blob with no corner where the path closes?',
    a: `Make the curve leave every point in the direction it arrived. In a Catmull-Rom curve the direction at each point is parallel to the line between its two neighbours, and the Bézier handles on either side of the point lie along that direction, each a ${SIXTH === 6 ? 'sixth' : `1/${SIXTH}`} of that line long. To close it, wrap the neighbours round: the first point’s neighbour before is the last point, and the last point’s neighbour after is the first. The seam is then as smooth as every other point, and the path ends with Z after a C that already ends on the start.`,
  },
  {
    q: 'How do I morph one SVG blob into another?',
    a: 'Give both blobs the same number of points. Then both paths have the same commands, M, one C per point and Z, so every number in one has a partner in the other, and anything that moves numbers can move between them: SMIL’s <animate attributeName="d">, a JavaScript animation library, or scrollDraw’s morphTo option as the page scrolls. The preview above moves the radii instead, so every point slides along its own spoke. Blobs with different point counts have different commands, and a number-for-number morph cannot pair them up.',
  },
  {
    q: 'How do I draw a blob’s outline on scroll?',
    a: 'Give the path a stroke and no fill, wrap the SVG in an element, and call scrollDraw(\'#blob\') from svg-scroll-draw. It measures the outline with getTotalLength(), makes the stroke one dash that long and slides it into place as the element scrolls through the window, at a steady rate: from its top reaching the bottom of the window to its bottom reaching the top. The Draw it panel above writes the markup and the call for the blob you made, as JavaScript or React.',
  },
  {
    q: 'Can I use a blob as a CSS clip-path or a mask?',
    a: 'Yes. clip-path: path(\'…\') takes the d value as it is, but counts in pixels of the element’s box and does not scale, so the CSS clip-path tab writes it for an element exactly the size you set. For a shape that scales with its element, use the SVG file as a mask image, or put the path in a <clipPath clipPathUnits="objectBoundingBox"> with every number divided by the size, so they run from 0 to 1.',
  },
  {
    q: 'Will the same seed always give the same blob?',
    a: 'Yes. The radii come from mulberry32, a small seeded generator made of 32-bit integer arithmetic, so the same seed gives the same numbers on every machine, and the same seed, point count, randomness and size give the same blob. Math.random() cannot be seeded, which is why it only picks a new seed when you press Shuffle. The SVG, React and CSS outputs carry a comment that names the seed and settings that made them.',
  },
];

const TOC = [
  { id: 'generator', label: 'The generator' },
  { id: 'how', label: 'How a blob is built' },
  { id: 'seeds', label: 'Seeds' },
  { id: 'morph', label: 'Morphing blobs' },
  { id: 'faq', label: `Questions · ${FAQ.length}` },
];

export const metadata: Metadata = {
  title: seoTitle(TITLE),
  description: DESCRIPTION,
  keywords: [
    'svg blob generator', 'blob shape generator', 'organic shape svg', 'random blob svg', 'svg blob',
    'blob svg path', 'blob maker', 'svg blob morph', 'css clip-path blob', 'catmull-rom svg path',
  ],
  alternates: { canonical: '/svg-blob-generator' },
  openGraph: { type: 'article', title: TITLE, description: DESCRIPTION, url: `${SITE_URL}/svg-blob-generator` },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

const JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      name: 'SVG blob generator',
      url: `${SITE_URL}/svg-blob-generator`,
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

export default function SvgBlobGeneratorPage() {
  return (
    <SiteShell active="/svg-blob-generator" crumbs={[['SVG blob generator', '/svg-blob-generator']]} kicker="svg / your turn">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(JSON_LD) }} />
      <div className="stk">

        <header className="pg-head stk-head">
          <div>
            <p className="pg-kicker">
              <span>tool / svg blobs</span>
              <span>runs in your browser</span>
            </p>
            <h1 className="pg-title stk-title">SVG blob generator</h1>
            <p className="pg-lede">
              Make a random, organic blob shape: choose how many points it has, how far each may wander and a seed, and
              copy it as an SVG file, a path’s <C>d</C>, React or a CSS clip-path. Morph it into the next seed, or watch
              scrollDraw draw its outline.
            </p>
            <div className="pg-actions">
              <a href="#generator" className="btn btn-solid" data-magnetic>Open the generator ↓</a>
              <Link href="/svg-path-viewer" className="btn" data-magnetic>SVG path viewer →</Link>
            </div>
            <dl className="pg-facts">
              <div><dt>Points</dt><dd>{MIN_POINTS}–{MAX_POINTS}</dd></div>
              <div><dt>Randomness</dt><dd>0–{MAX_RANDOMNESS}</dd></div>
              <div><dt>Code outputs</dt><dd>{OUTPUT_COUNT}</dd></div>
              <div><dt>Gallery seeds</dt><dd>{GALLERY.length}</dd></div>
            </dl>
          </div>
          <BlobFigure />
        </header>

        <div className="stk-body">
          <Toc label="On this page" items={TOC} />
          <div className="stk-main">

            <Sec n={1} k="The tool" id="generator" title="Make a blob">
              <p className="stk-p">
                Every setting redraws the blob at once. Construction shows how it is made; Morph moves it toward the
                next seed and back, and the Path d tab then gives both paths. The gallery loads {GALLERY.length} seeds
                to start from.
              </p>
              <BlobGenerator />
            </Sec>

            <Sec n={2} k="The construction" id="how" title="How a blob is built">
              <p className="stk-p">
                <b className="blb-b">Spokes.</b> The blob has as many spokes as points, 360° ÷ points apart, the first
                straight up and the rest clockwise. The path starts at the first, so a drawing of its outline starts at
                the top (fig. 1).
              </p>
              <p className="stk-p">
                <b className="blb-b">Radii.</b> Each spoke gets its own length from the seed, between 1 − randomness and
                1 of the longest possible. At randomness 0 every spoke is as long as the others: a rounded triangle at{' '}
                {MIN_POINTS} points, close to a circle at {MAX_POINTS}.
              </p>
              <p className="stk-p">
                <b className="blb-b">The curve.</b> A closed Catmull-Rom curve through the spokes’ ends, written as one
                cubic Bézier per point. Each piece, from one point to the next, gets a handle at each end, set off from
                its point by a {SIXTH === 6 ? 'sixth' : `1/${SIXTH}`} of the line between that point’s two neighbours:
                forward at the start, back at the end. So the curve leaves each point in the direction it arrived. Then
                the whole shape is scaled about the centre until its farthest point sits 5% of the size, plus half the
                line, inside the box.
              </p>
              <CodeBox file="blob-path.js">{PATH_JS}</CodeBox>
              <Note k={`Why ${MAX_RANDOMNESS}`}>
                Randomness stops at {MAX_RANDOMNESS}. Past it, a short radius between two long ones can fold the curve
                back over itself. Tried against every pattern of neighbouring radii from {MIN_POINTS} to {MAX_POINTS}{' '}
                points, the curve always keeps turning the same way round the centre up to {MAX_RANDOMNESS}, and can
                turn back at 0.8.
              </Note>
            </Sec>

            <Sec n={3} k="Seeds" id="seeds" title="The same seed, the same blob">
              <p className="stk-p">
                The radii come from mulberry32, a seeded random number generator a few lines long. The same seed gives the
                same numbers in every browser, because it is all 32-bit integer arithmetic, so a blob can be made again
                from its seed, point count, randomness and size. The SVG, React and CSS outputs carry a comment
                that says them.
              </p>
              <CodeBox file="seed.js">{SEED_JS}</CodeBox>
              <p className="stk-p">
                The seed gives the radii in order, so changing the number of points keeps the first radii and adds or
                drops some at the end. The spokes move to new angles, though, so the shape is a new one. Randomness
                scales the same numbers: at a lower setting the blob keeps its bumps where they were, only smaller.
              </p>
            </Sec>

            <Sec n={4} k="Morphing" id="morph" title="Morphing one blob into another">
              <p className="stk-p">
                Two blobs with the same number of points have the same spokes and the same commands: M, one C per
                point, Z. Only the numbers differ, so a morph can move each number toward its partner. The preview
                moves the radii instead, which keeps every point on its own spoke (fig. 2).
              </p>
              <MorphFigure />
              <p className="stk-p">
                On scroll, <C>morphTo</C> does the number-for-number version: it moves a <C>{'<path>'}</C>’s{' '}
                <C>d</C> toward another as the drawing progresses, and in development warns when the two paths’
                commands or number counts differ.
              </p>
              <CodeBox file="morph.js">{MORPH_JS}</CodeBox>
              <Note k="The dash">
                scrollDraw measures the line once, on the path it starts with (and again on a resize or{' '}
                <C>refresh()</C>), and the dash keeps that length while the shape changes. If the blob it becomes is
                longer, the end of its outline is still open when the scroll is done. Seed {MORPH.from.seed} is the
                longer of these two, {fmt(MORPH.from.g.length, 1)} px against {fmt(MORPH.to.g.length, 1)}, so it is the
                one the path starts from. The generator’s readout gives each blob’s length.
              </Note>
            </Sec>

            <Sec n={5} k={`${FAQ.length} questions`} id="faq" title="SVG blob questions">
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
              <p className="stk-p stk-more">
                Drawing on scroll with svg-scroll-draw {SELF.version}: <Link href="/docs">the docs</Link>, or the{' '}
                <Link href="/svg-path-viewer">SVG path viewer</Link> to measure and check any path.
              </p>
            </Sec>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
