import type { Metadata } from 'next';
import { Fragment } from 'react';
import { seoTitle } from '../../_lib/seo';
import { BlogArticle, Section, Code, Callout, Table, Notes, Cols, Mark, Figure, Closing } from '@/components/blog/BlogArticle';
import { MorphFigure } from './MorphFigure';
import './morph.css';

export const metadata: Metadata = {
  title: seoTitle('Scroll-Driven SVG Path Morphing with morphTo'),
  description:
    'How to use the morphTo option in svg-scroll-draw to interpolate SVG path shapes as you scroll. Path compatibility, use cases, and live code examples.',
  keywords: [
    'svg path morphing scroll',
    'morphTo svg animation',
    'svg shape transition scroll',
    'scroll-driven path morphing',
    'svg morph on scroll',
    'svg path interpolation javascript',
    'stroke-dashoffset morph animation',
    'svg-scroll-draw morphTo',
  ],
  alternates: { canonical: '/blog/scroll-path-morphing' },
  openGraph: {
    title: 'Scroll-Driven SVG Path Morphing with morphTo',
    description: 'Interpolate SVG path shapes as you scroll — built in, no GSAP MorphSVGPlugin, zero extra dependencies.',
    url: 'https://svg-scroll-draw.vercel.app/blog/scroll-path-morphing',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Scroll-Driven SVG Path Morphing with morphTo',
    description: 'Interpolate SVG path shapes as you scroll — built in, no GSAP MorphSVGPlugin, zero extra dependencies.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Scroll-Driven SVG Path Morphing with morphTo',
  author: { '@type': 'Person', name: 'Dhruvil Chauhan' },
  datePublished: '2026-06-04',
  url: 'https://svg-scroll-draw.vercel.app/blog/scroll-path-morphing',
};

/** Where morphTo earns its place: a title, a line, and the call. */
const USE_CASES: { title: string; desc: string; file: string; example: string }[] = [
  {
    title: 'Icon transitions',
    desc: 'Morph a play button into a pause button, a hamburger into an X, or a circle into a checkmark as the user scrolls past a milestone.',
    file: 'icon.js',
    example: `scrollDraw('#icon', {\n  morphTo: pauseIcon,\n  easing: 'spring',\n  trigger: { start: 'top 60%', end: 'top 40%' },\n});`,
  },
  {
    title: 'Data visualisation',
    desc: 'Morph a bar chart shape into a line chart shape, or transform a circle chart into its expanded state as the section scrolls into view.',
    file: 'chart.js',
    example: `scrollDraw('#chart-shape', {\n  morphTo: lineChartPath,\n  easing: 'ease-in-out',\n  once: true,\n});`,
  },
  {
    title: 'Blob / organic shapes',
    desc: 'Animate background blobs or decorative shapes between two organic forms. Combine with fade for a smooth entrance.',
    file: 'blob.js',
    example: `scrollDraw('#blob', {\n  morphTo: blobVariant2,\n  fade: true,\n  easing: 'ease-out',\n});`,
  },
  {
    title: 'Logo storytelling',
    desc: 'Draw the logo as a simple shape, then morph it into its final form as the hero section exits the viewport.',
    file: 'logo.js',
    example: `scrollDraw('#logo-path', {\n  morphTo: finalLogoPath,\n  easing: 'spring',\n  trigger: { start: 'top 90%', end: 'top 10%' },\n});`,
  },
];

const LIMITS = [
  { t: '<path> only', d: 'morphTo no-ops on <rect>, <circle>, <line>, <polyline>, and other SVG shape elements (a development build warns in the console). Convert them to <path> equivalents first.' },
  { t: 'Non-SVG elements', d: 'This is SVG path interpolation — it does not work on HTML elements, CSS clip-paths, or canvas. For HTML morphing you still need GSAP or the Web Animations API.' },
  { t: 'Complex structure changes', d: 'If your paths have fundamentally different command structures (e.g. one uses cubic beziers, the other straight lines), the interpolation will look wrong. Restructure to match.' },
  { t: 'Activates native CSS opt-out', d: 'morphTo requires JS per-frame updates, so it automatically bypasses the native CSS animation-timeline path. The JS engine draws it frame by frame instead.' },
];

/** [option, type, notes] — the quick reference. */
const API: [string, string, string][] = [
  ['morphTo', 'string', 'Target path d attribute. Must be numerically compatible with the source path.'],
  ['easing', 'EasingName | fn', 'Controls the morph curve, not just the draw. spring and bounce give great shape transitions.'],
  ['fade', 'boolean', 'Fade in simultaneously with draw + morph.'],
  ['once', 'boolean', 'Stay morphed at the target shape after first completion.'],
  ['trigger', '{ start, end }', 'Viewport anchors for when the morph starts and ends.'],
  ['strokeColor', 'string | [string, string]', 'Interpolate stroke color as the shape morphs.'],
  ['onComplete', '() => void', 'Fires when morph reaches 100%. Swap to a static version here if needed.'],
];

export default function Page() {
  return (
    <BlogArticle
      slug="scroll-path-morphing"
      jsonLd={jsonLd}
      tags={['morphTo', 'SVG paths', 'no MorphSVG']}
      title={<>Scroll-driven SVG <span className="ba-nw">path morphing</span></>}
      lede={
        <>
          The <code>morphTo</code> option lets you interpolate a SVG path&apos;s <code>d</code> attribute from its
          original shape to a target shape — all driven by scroll position. No GSAP MorphSVGPlugin, no extra import,
          zero extra dependencies.
        </>
      }
      facts={[
        { k: 'Extra dependencies', v: '0' },
        { k: 'vs GSAP MorphSVG', v: 'built in' },
        { k: 'Works with', v: '<path>' },
        { k: 'Triggers on', v: 'scroll' },
      ]}
      figure={
        <Figure n={1} caption="what morphTo does to this post's square → diamond pair: each number moves in a straight line to its partner, and the middle frame is the engine's morphPath() at t = 0.5">
          <MorphFigure />
        </Figure>
      }
    >
      <Section id="concept" k="the concept" title="What is SVG path morphing?">
        <p>
          Every SVG <code>&lt;path&gt;</code> has a <code>d</code> attribute — a string of commands that defines its
          shape. Path morphing means smoothly interpolating between two <code>d</code> strings at a given progress
          value (0–1).
        </p>
        <p>
          At progress 0, the path looks like the original shape. At progress 1, it looks like <code>morphTo</code>.
          Anywhere in between, each numeric coordinate is linearly interpolated — producing a smooth shape transition.
        </p>
        <p>
          Combined with scroll-driven progress, you get shape changes that respond directly to how far the user has
          scrolled — without a single line of animation logic.
        </p>
        <Code file="shape.js">{`// A circle → square morph driven by scroll
scrollDraw('#shape', {
  morphTo: 'M10 10 L90 10 L90 90 L10 90 Z',  // target: a square
  easing: 'ease-in-out',
  trigger: { start: 'top 70%', end: 'top 20%' },
});
// The path starts as its original shape (e.g. a circle)
// and morphs into the square as the user scrolls down`}</Code>
      </Section>

      <Section id="under-the-hood" k="under the hood" title="How svg-scroll-draw morphs paths">
        <p>
          The engine extracts all numeric tokens from both the original and target <code>d</code> strings, then
          linearly interpolates each token pair at the current scroll alpha. The non-numeric parts (command letters
          like <code>M</code>, <code>L</code>, <code>C</code>) are taken from the original path — they define the shape
          structure, which must be compatible between the two paths.
        </p>
        <Code file="morphing (simplified)">{`function morphPath(from: string, to: string, t: number): string {
  const toNums = to.match(/[-+]?[\\d.]+/g).map(Number);
  let idx = 0;
  return from.replace(/[-+]?[\\d.]+/g, (match) => {
    const fromNum = parseFloat(match);
    const toNum   = toNums[idx++] ?? fromNum;
    return String(fromNum + (toNum - fromNum) * t);
  });
}

// At t=0:   returns original path d
// At t=0.5: returns midpoint between original and target
// At t=1:   returns morphTo path d`}</Code>
        <p>
          This runs every animation frame while the element is in view, updating the <code>d</code> attribute directly
          on the <code>&lt;path&gt;</code> element. The stroke-dashoffset draw animation runs simultaneously — path
          draws <em>and</em> morphs at the same time.
        </p>
      </Section>

      <Section id="compatibility" k="the golden rule" title="Paths must be numerically compatible">
        <p>
          The morph works by pairing numeric tokens from the original and target path strings one-for-one. If they have
          different counts, the extra target tokens are ignored and any missing ones hold their start value, so the
          morph never quite reaches the target shape. For a perfect morph, both paths should have{' '}
          <strong>the same number of numeric tokens</strong>. A development build warns in the console when the command
          letters or the number count differ.
        </p>
        <Cols>
          <div className="mp-case">
            <p className="mp-case-k"><Mark ok={true} /> Compatible</p>
            <Code>{`<!-- Both have 8 numeric tokens -->
<path d="M10 10 L90 10 L90 90 L10 90" />

morphTo: "M50 10 L90 50 L50 90 L10 50"`}</Code>
            <p className="mp-case-d">Square → Diamond: same structure, same token count. Morphs cleanly.</p>
          </div>
          <div className="mp-case is-bad">
            <p className="mp-case-k"><Mark ok={false} /> Incompatible</p>
            <Code>{`<!-- Triangle: 6 tokens -->
<path d="M50 10 L90 90 L10 90 Z" />

<!-- Star: 20 tokens -->
morphTo: "M50 5 L61 35 L95 35 L68 57 ..."`}</Code>
            <p className="mp-case-d">Different command counts — morph will be approximate or look wrong.</p>
          </div>
        </Cols>
        <Callout k="tip: use the same SVG editor">
          The easiest way to ensure compatibility: draw both shapes in Figma or Illustrator, export as SVG, and verify
          the <code>d</code> strings have the same number of path commands. Most shape transformations (square →
          diamond, circle → blob) work when you constrain yourself to the same command structure.
        </Callout>
      </Section>

      <Section id="use-cases" k="use cases" toc="When to reach for morphTo" title={<>When to reach for <code className="mp-code">morphTo</code></>}>
        {USE_CASES.map((u) => (
          <Fragment key={u.title}>
            <h3 className="ba-h3">{u.title}</h3>
            <p>{u.desc}</p>
            <Code file={u.file}>{u.example}</Code>
          </Fragment>
        ))}
      </Section>

      <Section id="combined" k="combining effects" toc="Draw and morph simultaneously" title={<>Draw <em>and</em> morph simultaneously</>}>
        <p>
          <code>morphTo</code> runs alongside the stroke-dashoffset draw animation — both update on the same scroll
          alpha. The path traces itself in <em>and</em> transforms its shape at the same time. Combined with{' '}
          <code>fade</code> and <code>strokeColor</code>, this produces effects that feel far more complex than the code
          suggests.
        </p>
        <Code file="combined.js">{`import { scrollDraw } from 'svg-scroll-draw';

// Path draws in, morphs shape, changes colour, and fades — all at once
scrollDraw('#hero-shape', {
  morphTo:     finalShape,
  strokeColor: ['#ff90e8', '#5865F2'],  // pink → indigo as it draws
  fade:        true,                     // opacity 0 → 1
  easing:      'ease-in-out',
  once:        true,
  trigger:     { start: 'top 80%', end: 'top 20%' },
});`}</Code>
        <h3 className="ba-h3">React version</h3>
        <Code file="HeroShape.tsx">{`import { ScrollDraw } from 'svg-scroll-draw/react';

function HeroShape() {
  return (
    <ScrollDraw
      morphTo={finalShape}
      strokeColor={['#ff90e8', '#5865F2']}
      fade
      easing="ease-in-out"
      once
      trigger={{ start: 'top 80%', end: 'top 20%' }}
    >
      <svg viewBox="0 0 100 100">
        <path d={originalShape} stroke="currentColor" strokeWidth="2" fill="none" />
      </svg>
    </ScrollDraw>
  );
}`}</Code>
      </Section>

      <Section id="limitations" k="limitations" toc="What morphTo can’t do" title={<>What morphTo can&apos;t do</>}>
        <Notes items={LIMITS} />
      </Section>

      <Section id="api" k="quick reference" title="Full API">
        <Table
          head={['Option', 'Type', 'Notes']}
          rows={API.map(([opt, type, note]) => [opt, <code key="t">{type}</code>, note])}
        />
      </Section>

      <Closing
        title="Try it in the Playground"
        lede={<>Paste any two compatible SVG paths and set <code>morphTo</code> to see it live.</>}
        links={[{ href: '/playground', label: 'Playground →' }]}
      />
    </BlogArticle>
  );
}
