import type { Metadata } from 'next';
import Link from 'next/link';
import { seoTitle } from '../../_lib/seo';
import { BlogArticle, Section, Code, Callout, Figure, Closing } from '@/components/blog/BlogArticle';
import { DashFigure } from './DashFigure';

// Searches this post is for: "how to animate svg line drawing css", "svg line
// animation css", "stroke-dasharray animation", "svg stroke animation". Every
// listing below was run in Chromium, Firefox and WebKit before it went here.
const TITLE = 'How to Animate an SVG Line Drawing with CSS';
const DESCRIPTION =
  'Draw an SVG line by line with stroke-dasharray, stroke-dashoffset and pathLength="1": one path, several in order, a loop, reduced motion, and on scroll.';
const URL = 'https://svg-scroll-draw.vercel.app/blog/svg-line-drawing-animation-css';

export const metadata: Metadata = {
  title: seoTitle(TITLE),
  description: DESCRIPTION,
  keywords: [
    'svg line drawing animation css',
    'animate svg line drawing',
    'svg line animation css',
    'stroke-dasharray animation',
    'stroke-dashoffset animation',
    'svg stroke animation',
    'pathLength svg',
    'svg draw animation on scroll',
  ],
  alternates: { canonical: '/blog/svg-line-drawing-animation-css' },
  openGraph: { title: TITLE, description: DESCRIPTION, url: URL },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline: 'How to animate an SVG line drawing with CSS',
  description: DESCRIPTION,
  url: URL,
  datePublished: '2026-11-13',
  dateModified: '2026-11-13',
  author: { '@type': 'Person', name: 'Dhruvil Chauhan', url: 'https://github.com/DhruvilChauahan0210' },
  publisher: { '@type': 'Organization', name: 'svg-scroll-draw', url: 'https://svg-scroll-draw.vercel.app' },
  image: `${URL}/opengraph-image`,
  mainEntityOfPage: { '@type': 'WebPage', '@id': URL },
};

const ONE_HTML = `<svg class="draw" viewBox="0 0 120 80" width="240" height="160" aria-hidden="true">
  <path pathLength="1" d="M10 70 L60 10 L110 70 Z" />
</svg>`;

const ONE_CSS = `.draw > * {
  fill: none;
  stroke: currentColor;
  stroke-width: 3;
  stroke-linejoin: round;
  /* One dash as long as the line, then a gap twice as long. */
  stroke-dasharray: 1 2;
  /* The dash pushed back by its whole length: nothing shows. */
  stroke-dashoffset: 1;
  animation: draw 1.5s ease-out forwards;
}

@keyframes draw {
  to { stroke-dashoffset: 0; }
}`;

const MEASURE_JS = `// No pathLength: measure each shape and use its real length.
for (const shape of document.querySelectorAll('.draw > *')) {
  const length = shape.getTotalLength();
  shape.style.strokeDasharray = \`\${length} \${length * 2}\`;
  shape.style.strokeDashoffset = length;
}`;

const MANY_HTML = `<svg class="draw" viewBox="0 0 200 100" width="400" height="200" aria-hidden="true">
  <rect   pathLength="1" style="--i: 0" x="10" y="40" width="80" height="50" />
  <path   pathLength="1" style="--i: 1" d="M10 40 L50 10 L90 40" />
  <circle pathLength="1" style="--i: 2" cx="150" cy="35" r="20" />
  <line   pathLength="1" style="--i: 3" x1="100" y1="90" x2="190" y2="90" />
</svg>`;

const MANY_CSS = `.draw > * {
  fill: none;
  stroke: currentColor;
  stroke-width: 3;
  stroke-dasharray: 1 2;
  stroke-dashoffset: 1;
  animation: draw 1s ease-out forwards;
  /* Each shape starts 0.6s after the one before it. */
  animation-delay: calc(var(--i) * 0.6s);
}`;

const LOOP_CSS = `.loop > * {
  fill: none;
  stroke: currentColor;
  stroke-width: 3;
  stroke-dasharray: 1 2;
  /* Draw, then undraw, for ever. */
  animation: draw-loop 2s ease-in-out infinite alternate;
}

@keyframes draw-loop {
  from { stroke-dashoffset: 1; }
  to   { stroke-dashoffset: 0; }
}`;

const LOOP_MANY_CSS = `/* One 4s cycle for both lines: the first draws, then the second,
   both hold, and both clear together before it starts again. */
.loop-many > * {
  fill: none;
  stroke: currentColor;
  stroke-width: 3;
  stroke-dasharray: 1 2;
  animation: 4s ease-in-out infinite;
}
.loop-many > :nth-child(1) { animation-name: loop-1; }
.loop-many > :nth-child(2) { animation-name: loop-2; }

@keyframes loop-1 {
  0%       { stroke-dashoffset: 1; }
  30%, 80% { stroke-dashoffset: 0; }
  100%     { stroke-dashoffset: 1; }
}
@keyframes loop-2 {
  0%, 30%  { stroke-dashoffset: 1; }
  60%, 80% { stroke-dashoffset: 0; }
  100%     { stroke-dashoffset: 1; }
}`;

const REDUCED_CSS = `/* Everyone gets the finished drawing. */
.draw > * {
  fill: none;
  stroke: currentColor;
  stroke-width: 3;
}

/* Only readers who have not asked for less motion see it draw. */
@media (prefers-reduced-motion: no-preference) {
  .draw > * {
    stroke-dasharray: 1 2;
    stroke-dashoffset: 1;
    animation: draw 1s ease-out forwards;
    animation-delay: calc(var(--i) * 0.6s);
  }
}`;

const SCROLL_CSS = `.draw > * {
  fill: none;
  stroke: currentColor;
  stroke-width: 3;
}

@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    /* The SVG crossing the screen is the timeline every shape shares. */
    .draw { view-timeline: --drawing; }

    .draw > * {
      stroke-dasharray: 1 2;
      stroke-dashoffset: 1;
      animation: draw linear both;
      animation-timeline: --drawing;
      /* Shape i draws over its own slice of the crossing. */
      animation-range:
        cover calc(10% + var(--i) * 10%)
        cover calc(40% + var(--i) * 10%);
    }
  }
}`;

const LIBRARY_JS = `import { scrollDraw } from 'svg-scroll-draw';

// The same markup, pathLength and all, with only the stroke styles:
// scrollDraw sets the dash itself.
scrollDraw('.draw', { stagger: 0.2, once: true });`;

export default function Page() {
  return (
    <BlogArticle
      slug="svg-line-drawing-animation-css"
      jsonLd={articleJsonLd}
      tags={['stroke-dasharray', 'pathLength', 'CSS animation']}
      title={<>How to animate an SVG line drawing with CSS</>}
      lede={
        <>
          An SVG line that draws itself takes two stroke properties and one keyframe. Add{' '}
          <code>pathLength=&quot;1&quot;</code> and no shape needs measuring. Here it is for one path, for several in
          order, on a loop, for readers who ask for less motion, and on scroll, with every listing run in Chromium,
          Firefox and WebKit.
        </>
      }
      facts={[
        { k: 'JavaScript', v: 'none' },
        { k: 'Properties', v: 'dasharray · dashoffset' },
        { k: 'Shape length', v: 'pathLength="1"' },
      ]}
      figure={
        <Figure n={1} caption={<>one triangle with <code>pathLength=&quot;1&quot;</code> and <code>stroke-dasharray: 1 2</code> at three offsets, drawn by the browser from those values. The offset slides the dash back along the line; only the part inside the line shows.</>}>
          <DashFigure />
        </Figure>
      }
      further={[
        { href: '/blog/css-scroll-driven-animations', label: 'CSS scroll-driven animations explained', blurb: 'view(), scroll() and every animation-range name, behind the on-scroll version here.' },
        { href: '/blog/gsap-drawsvg-alternative', label: 'svg-scroll-draw vs GSAP DrawSVG', blurb: 'When a drawing needs more than CSS: the two libraries side by side.' },
      ]}
    >
      <Section id="trick" k="the trick" title="How a stroke draws itself">
        <p>
          A stroke can be cut into dashes. <code>stroke-dasharray</code> sets how long each dash and each gap is, and{' '}
          <code>stroke-dashoffset</code> slides that pattern along the line. Make one dash as long as the whole line,
          push it back by its own length, and nothing shows. Animate the offset to 0 and the dash slides into place:
          the line appears to draw from its start to its end.
        </p>
        <p>
          The only number this needs is the line’s length, and <code>pathLength=&quot;1&quot;</code> removes it. It
          tells the browser to treat the shape as 1 unit long for dash purposes, whatever its real length, so the dash
          is 1 and the offset runs from 1 to 0 for every shape you draw.
        </p>
        <Code file="draw.html">{ONE_HTML}</Code>
        <Code file="draw.css">{ONE_CSS}</Code>
        <p>
          Why a gap of 2 and not 1? With <code>stroke-dasharray: 1</code> the next dash starts exactly where the line
          ends, and WebKit draws a dot at that corner of a closed, round-capped shape before anything should show.
          A gap twice the line puts the next dash out of reach in every engine. The{' '}
          <Link href="/svg-line-drawing-generator">SVG line drawing generator</Link> writes it that way for the same
          reason; its page lists this and the other cases measured in all three engines.
        </p>
        <Callout k="no pathLength">
          <p>
            If you cannot edit the markup, measure instead. <code>getTotalLength()</code> gives each shape’s length
            in its own units; set the dash and offset to it and the same keyframe works, because an animation
            overrides inline styles.
          </p>
        </Callout>
        <Code file="measure.js">{MEASURE_JS}</Code>
      </Section>

      <Section id="several" k="stagger" title="Several paths, one after another">
        <p>
          A real drawing is many shapes. <code>pathLength</code> works on all of them (<code>path</code>,{' '}
          <code>line</code>, <code>polyline</code>, <code>polygon</code>, <code>rect</code>, <code>circle</code>{' '}
          and <code>ellipse</code>), so one rule draws them all. Give each shape its place in the order as a custom
          property, and let <code>animation-delay</code> multiply it.
        </p>
        <Code file="house.html">{MANY_HTML}</Code>
        <Code file="house.css">{MANY_CSS}</Code>
        <p>
          The <code>@keyframes draw</code> rule is the one from above. Each shape draws from where its outline
          starts: a path from its first point, a <code>rect</code> from its top-left corner going clockwise, a{' '}
          <code>circle</code> from its rightmost point (3 o’clock) going clockwise. To change where a path starts,
          reverse it: the <Link href="/svg-path-editor">SVG path editor</Link> has a button for that, and the{' '}
          <Link href="/svg-path-viewer">SVG path viewer</Link> shows every path’s length and commands, and what would
          stop it drawing.
        </p>
        <Callout k="sharp corners">
          While a closed shape is dashed, browsers can leave out the join where its outline starts and ends, so a
          mitred corner there loses its tip. A round <code>stroke-linejoin</code> hides it; the generator instead
          switches the dash off at the very end of the animation.
        </Callout>
      </Section>

      <Section id="loop" k="infinite" title="Make it loop">
        <p>
          For one shape, a loop is two words: <code>infinite alternate</code>. It draws, then undraws back to its
          start, then draws again.
        </p>
        <Code file="loop.css">{LOOP_CSS}</Code>
        <p>
          Several shapes need more than that. With one shared keyframe and a different delay on each, every shape
          repeats on its own schedule, so the drawing is never whole and never empty at the same moment. Put every
          shape on the same cycle instead, each with its own keyframes for its slice of it:
        </p>
        <Code file="loop-many.css">{LOOP_MANY_CSS}</Code>
        <p>
          That gets long by hand for more than a few shapes. The generator writes the same per-shape keyframes for
          any drawing you paste in, as a repeat or an alternate loop.
        </p>
      </Section>

      <Section id="reduced-motion" k="accessibility" title="Respect reduced motion">
        <p>
          A line drawing is decoration. For readers who ask their system for less motion, show it finished. The
          safest way is to put the dash and the animation inside{' '}
          <code>@media (prefers-reduced-motion: no-preference)</code>: everyone else gets a plain stroke with no dash
          at all, so there is no hidden state to undo.
        </p>
        <Code file="reduced.css">{REDUCED_CSS}</Code>
        <p>
          The other way round, <code>@media (prefers-reduced-motion: reduce)</code> with{' '}
          <code>animation: none</code>, also has to set the offset back to 0, and loses to any more specific rule that
          sets an <code>animation-name</code>, like the <code>:nth-child</code> rules in the loop above. Why decoration
          should finish rather than vanish is in{' '}
          <Link href="/blog/reduced-motion-scroll-animations">reduced motion for scroll animations</Link>.
        </p>
      </Section>

      <Section id="on-scroll" k="scroll" title="Draw it on scroll">
        <p>
          The same keyframe can follow the scroll instead of the clock. Give the SVG a named view timeline, which runs
          from the moment it starts to enter the screen to the moment it has left, and point each shape’s animation
          at it. <code>animation-range</code> gives each shape its own slice of that crossing, which is the scroll
          version of a stagger.
        </p>
        <Code file="scroll.css">{SCROLL_CSS}</Code>
        <p>
          The timeline is set on the <code>&lt;svg&gt;</code> and not on each shape, so every shape measures the same
          box. The <code>animation</code> shorthand resets <code>animation-timeline</code> and{' '}
          <code>animation-range</code>, so both come after it. Browsers without scroll timelines skip the whole{' '}
          <code>@supports</code> block and show the drawing finished. How <code>view()</code> and the range names
          work, and which browsers have them, is in{' '}
          <Link href="/blog/css-scroll-driven-animations">CSS scroll-driven animations explained</Link>.
        </p>
        <p>
          CSS on a scroll timeline has limits: it plays backwards when the reader scrolls back, it cannot stop once the
          drawing is done, and it fires no event when it finishes. svg-scroll-draw covers those. Since 2.23.4 it reads a{' '}
          <code>pathLength</code> on a shape, so the markup above works as it is:
        </p>
        <Code file="scroll.js">{LIBRARY_JS}</Code>
        <p>
          With <code>once</code> the drawing stays drawn after the reader scrolls back, and under reduced motion it is
          shown finished. A plain call with no stagger and no <code>once</code> writes the view-timeline CSS above
          itself where the browser supports it and runs on JavaScript elsewhere; the{' '}
          <Link href="/blog/native-css-svg-scroll-animations">native CSS path</Link> post lists exactly when.
        </p>
      </Section>

      <Closing
        title="Paste an SVG, get the CSS"
        lede="The line drawing generator writes all of this for any SVG: pathLength on every shape, the stagger, a loop, the reduced-motion rule, and a scroll version."
        links={[
          { href: '/svg-line-drawing-generator', label: 'Line drawing generator →' },
          { href: '/svg-path-viewer', label: 'SVG path viewer' },
        ]}
      />
    </BlogArticle>
  );
}
