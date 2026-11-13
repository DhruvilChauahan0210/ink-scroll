import type { Metadata } from 'next';
import Link from 'next/link';
import { seoTitle } from '../../_lib/seo';
import { CSS_KEYWORDS, bezierEasing, bezierRange, cssOf, fmt, pointAt, type Bezier } from '@/components/bezier/bezier';
import { FAMILY_NAMES, NAMED_PRESETS, exactOf, gapBetween, presetByKey, type Preset } from '@/components/bezier/presets';
import { BROWSER_SUPPORT } from '@/data/cssdriven';
import {
  EASING_APIS, EASING_NAMES, EXACT_CSS, FACTORIES, NAMED, NAMED_INFO, NATIVE_EASINGS, curveStats, linearCss, linearText, num,
  springCurve,
} from '@/data/easing';
import { BlogArticle, Section, Code, Callout, Table, Figure, Closing } from '@/components/blog/BlogArticle';
import { CurvesFigure } from './CurvesFigure';

// Searches this post is for: "cubic-bezier css", "css easing functions",
// "ease-in-out cubic bezier", "custom easing css", "linear() easing css",
// "spring easing css". Every curve value comes from the cubic-bezier
// generator's data (components/bezier/) or svg-scroll-draw's easings
// (data/easing.ts), every number about a curve is computed from it here, and
// every listing was run in Chromium, Firefox and WebKit against the browser's
// own timing functions.
const TITLE = 'CSS cubic-bezier() Easing Explained, with Curves to Copy';
const DESCRIPTION =
  'What the four numbers in CSS cubic-bezier() mean, the exact values behind ease and ease-in-out, curves to copy, springs in linear(), and the same curve in JS.';
const URL = 'https://svg-scroll-draw.vercel.app/blog/css-cubic-bezier-easing';

export const metadata: Metadata = {
  title: seoTitle(TITLE),
  description: DESCRIPTION,
  keywords: [
    'cubic-bezier css',
    'css easing functions',
    'ease-in-out cubic bezier',
    'custom easing css',
    'linear() easing css',
    'spring easing css',
    'css timing function',
    'css steps() easing',
    'cubic bezier javascript',
  ],
  alternates: { canonical: '/blog/css-cubic-bezier-easing' },
  openGraph: { title: TITLE, description: DESCRIPTION, url: URL },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline: 'CSS cubic-bezier() easing explained, with curves to copy',
  description: DESCRIPTION,
  url: URL,
  datePublished: '2026-11-13',
  dateModified: '2026-11-13',
  author: { '@type': 'Person', name: 'Dhruvil Chauhan', url: 'https://github.com/DhruvilChauahan0210' },
  publisher: { '@type': 'Organization', name: 'svg-scroll-draw', url: 'https://svg-scroll-draw.vercel.app' },
  image: `${URL}/opengraph-image`,
  mainEntityOfPage: { '@type': 'WebPage', '@id': URL },
};

// ── The curves, from the generator's data ───────────────────────────────────

const need = (key: string): Preset => {
  const p = presetByKey(key);
  if (!p) throw new Error(`no preset ${key}`);
  return p;
};
const EASE = CSS_KEYWORDS.ease;
const OUT_BACK = need('named:easeOutBack');
const IN_OUT_BACK = need('named:easeInOutBack');
const OUT_CUBIC = need('named:easeOutCubic');
const OUT_CUBIC_EXACT = exactOf(OUT_CUBIC);
const BACKS = NAMED_PRESETS.filter((p) => p.family === 'Back');
const OUT_SINE = need('named:easeOutSine');
const OUT_EXPO = need('named:easeOutExpo');
const pct = (p: Preset, t: number) => `${Math.round(bezierEasing(p.v)(t) * 100)}%`;
const KEYWORD_NAMES = Object.keys(CSS_KEYWORDS);
const KINDS = ['In', 'Out', 'InOut'] as const;
const v3 = (n: number) => num(n, 3);
const join = (v: Bezier) => v.map(fmt).join(', ');

/**
 * Speed at the start and the end, as a multiple of linear's: the slope of the
 * curve there. Read off the curve itself, a hair along from each end (s is
 * the curve's own parameter, so there is nothing to solve). Not much closer:
 * where a handle sits on its end, 1 − x shrinks as s², and below 1e-4 the
 * subtraction loses the digits the ratio needs.
 */
const S = 1e-4;
function speeds(v: Bezier) {
  const a = pointAt(v, S);
  const b = pointAt(v, 1 - S);
  return { start: a.y / a.x, end: (1 - b.y) / (1 - b.x), half: bezierEasing(v)(0.5) };
}
const EASE_S = speeds(EASE);

// ── steps(), as CSS Easing Level 1 defines it ───────────────────────────────

const JUMPS = ['jump-start', 'jump-end', 'jump-none', 'jump-both'] as const;
type Jump = (typeof JUMPS)[number];
function stepsAt(n: number, pos: Jump, t: number) {
  let step = Math.floor(t * n);
  if (pos === 'jump-start' || pos === 'jump-both') step += 1;
  const jumps = pos === 'jump-none' ? n - 1 : pos === 'jump-both' ? n + 1 : n;
  return Math.min(step, jumps) / jumps;
}
const STEP_N = 4;
const STEP_TIMES = [0.1, 0.3, 0.6, 0.9];
const STEP_ROWS = STEP_TIMES.map((t) => ({ t, v: JUMPS.map((j) => stepsAt(STEP_N, j, t)) }));

// ── A spring as linear() ────────────────────────────────────────────────────

const [TENSION, FRICTION] = FACTORIES.spring.params.map((p) => p.def);
const SPRING_FN = springCurve();
const SPRING_TOL = 0.005;
const SPRING = linearCss(SPRING_FN, SPRING_TOL);
const SPRING_STATS = curveStats(SPRING_FN);
const EVEN_N = 40;
/** How far n + 1 evenly spaced points, rounded to 4 decimals as toLinear writes them, stray from f. */
function evenError(f: (t: number) => number, n: number) {
  const m = n * 50;
  let e = 0;
  for (let i = 0; i <= m; i++) {
    const t = i / m;
    const k = Math.min(Math.floor(t * n), n - 1);
    const a = +f(k / n).toFixed(4);
    const b = +f((k + 1) / n).toFixed(4);
    e = Math.max(e, Math.abs(f(t) - (a + (b - a) * (t * n - k))));
  }
  return e;
}
const EVEN_ERR = evenError(SPRING_FN, EVEN_N);
/** The fewest evenly spaced points that come as close as the thinned list does. */
const EVEN_MATCH = (() => {
  let n = 2;
  while (evenError(SPRING_FN, n) > SPRING.error) n++;
  return n;
})();
const LINEAR_SINCE = 'Chrome and Edge 113, Firefox 112, Safari 17.2';

// ── svg-scroll-draw ─────────────────────────────────────────────────────────

const OUT_GAP = gapBetween(CSS_KEYWORDS['ease-out'], NAMED['ease-out']).gap;
const DEFAULT_OUT = EASING_APIS.filter((a) => a.def === 'ease-out').map((a) => a.api);
const DEFAULT_LINEAR = EASING_APIS.filter((a) => a.def === 'linear').map((a) => a.api);
const list = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);
const SCROLL_SUPPORT = list(BROWSER_SUPPORT.map((b) => `${b.browser.replace(/ \(.*\)$/, '').replace(', ', ' and ')} ${b.since}`));

// ── Listings ────────────────────────────────────────────────────────────────

const ANATOMY = `cubic-bezier(x1, y1, x2, y2)
             └─ P1 ─┘ └─ P2 ─┘

P0 = (0, 0)   the start, fixed
P3 = (1, 1)   the end, fixed
x  = time       x1 and x2 must be between 0 and 1
y  = progress   y1 and y2 can be any number`;

const BASIC_CSS = `.card {
  /* The same curve as the keyword ease, written out. */
  transition: translate 400ms ${cssOf(EASE)};
}
.card:hover {
  translate: 0 -8px;
}`;

const INVALID_CSS = `.panel {
  transition-timing-function: ease-out;
  /* x2 is 1.2, outside 0–1: the browser drops this line, ease-out stays. */
  transition-timing-function: cubic-bezier(0.2, 0, 1.2, 1);
}`;

const BACK_CSS = `.toast {
  translate: 0 120%;
  /* easeOutBack: runs past the end, then settles. */
  transition: translate 500ms ${cssOf(OUT_BACK.v)};
}
.toast.is-open {
  translate: 0 0;
}`;

const LINEAR_CSS = `/* Points spread evenly: 0 at the start, 0.25 half way, 1 at the end. */
.a { transition-timing-function: linear(0, 0.25, 1); }

/* Or pin a point to a time: 0.8 of the way at 30% of the time. */
.b { transition-timing-function: linear(0, 0.8 30%, 1); }`;

const TO_LINEAR_JS = `// Any easing function as CSS linear(): n + 1 points, evenly spaced in time.
function toLinear(ease, n = ${EVEN_N}) {
  const points = [];
  for (let i = 0; i <= n; i++) points.push(+ease(i / n).toFixed(4));
  return \`linear(\${points.join(', ')})\`;
}

// A spring: svg-scroll-draw's createSpring() at its defaults, written out.
const spring = (t) => 1 - Math.cos(t * Math.PI * ${TENSION}) * Math.pow(1 - t, ${FRICTION});

document.documentElement.style.setProperty('--spring', toLinear(spring));`;

const SPRING_CSS = `.pop {
  scale: 0;
  /* For browsers without linear(): a cubic-bezier that overshoots once. */
  transition: scale 900ms ${cssOf(OUT_BACK.v)};
  /* A browser that cannot read linear() drops this line and keeps the one above. */
  transition-timing-function: linear(
${linearText(SPRING.stops, 5, '    ')}
  );
}
.pop.is-in {
  scale: 1;
}`;

const STEPS_CSS = `/* A sprite sheet: 8 frames of 100px side by side, 800px in all. */
.walker {
  width: 100px;
  height: 100px;
  background: url(walk.png) 0 0 / 800px 100px;
  animation: walk 800ms steps(8) infinite;
}
@keyframes walk {
  to { background-position: -800px 0; }
}`;

const SCROLL_CSS = `@keyframes grow {
  from { scale: 0 1; }
  to   { scale: 1 1; }
}

.progress {
  position: fixed;
  inset: 0 0 auto;
  height: 4px;
  transform-origin: left;
  /* linear: the bar is exactly as full as the page is scrolled. */
  animation: grow linear both;
  animation-timeline: scroll(root);
}`;

const SETTLE_CSS = `@keyframes rise {
  from { opacity: 0; translate: 0 48px; }
}

.card {
  /* ease-out: most of the rise happens early in the range, the rest settles. */
  animation: rise ease-out both;
  animation-timeline: view();
  animation-range: entry 0% cover 40%;
}`;

const SOLVER_JS = `// cubic-bezier(x1, y1, x2, y2) as a function of time t, from 0 to 1.
function cubicBezier(x1, y1, x2, y2) {
  // Each coordinate is a cubic in s, the position along the curve.
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const X = (s) => ((ax * s + bx) * s + cx) * s;
  const Y = (s) => ((ay * s + by) * s + cy) * s;
  const dX = (s) => (3 * ax * s + 2 * bx) * s + cx;

  return (t) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    // Newton's method: a few steps, wherever the curve is not flat in x.
    let s = t;
    for (let i = 0; i < 8; i++) {
      const e = X(s) - t;
      if (Math.abs(e) < 1e-7) return Y(s);
      const d = dX(s);
      if (Math.abs(d) < 1e-6) break;
      s -= e / d;
      if (s < 0 || s > 1) break;
    }
    // Bisection: slower, but always lands, because X never falls.
    let lo = 0, hi = 1;
    s = t;
    while (hi - lo > 1e-7) {
      if (X(s) < t) lo = s; else hi = s;
      s = (lo + hi) / 2;
    }
    return Y(s);
  };
}`;

const RAF_JS = `const easeOutBack = cubicBezier(${join(OUT_BACK.v)});

function animate(el, from, to, ms, ease) {
  const start = performance.now();
  requestAnimationFrame(function frame(now) {
    const t = Math.min((now - start) / ms, 1);
    el.style.translate = \`\${from + (to - from) * ease(t)}px 0\`;
    if (t < 1) requestAnimationFrame(frame);
  });
}

animate(document.querySelector('.ball'), 0, 300, 600, easeOutBack);`;

const WAAPI_JS = `// The Web Animations API takes the CSS strings as they are.
document.querySelector('.ball').animate(
  { translate: ['0 0', '300px 0'] },
  { duration: 600, easing: '${cssOf(OUT_BACK.v)}', fill: 'forwards' },
);`;

const LIB_JS = `import { scrollDraw, scrollAnimate, createSpring } from 'svg-scroll-draw';

// A name: ${EASING_NAMES.join(', ')}.
scrollDraw('#route', { easing: 'ease-in-out' });

// A factory, with your own numbers.
scrollAnimate('#badge', {
  props: { transform: ['scale(0.6)', 'scale(1)'] },
  easing: createSpring({ tension: 3, friction: 1.8 }),
});

// Any function of t, like cubicBezier() above.
scrollDraw('#logo', { easing: cubicBezier(${join(OUT_BACK.v)}) });`;

export default function Page() {
  return (
    <BlogArticle
      slug="css-cubic-bezier-easing"
      jsonLd={articleJsonLd}
      tags={['cubic-bezier()', 'linear()', 'Easing']}
      title={<>CSS cubic-bezier() easing explained, with curves to copy</>}
      lede={
        <>
          <code>cubic-bezier()</code> is four numbers that bend a straight line from start to end into a curve, and
          the curve decides how fast a transition moves at each moment. Here is what each number does, the exact values
          behind <code>ease</code> and <code>ease-in-out</code>, a table of curves to copy, springs and bounces with{' '}
          <code>linear()</code>, and the same curve as a JavaScript function.
        </>
      }
      facts={[
        { k: 'CSS keywords', v: KEYWORD_NAMES.length },
        { k: 'curves to copy', v: NAMED_PRESETS.length },
        { k: 'spring in linear()', v: `${SPRING.stops.length} points` },
      ]}
      figure={
        <Figure n={1} caption="six easings drawn from their own four numbers. Each curve is an SVG cubic path with P1 and P2 as its control points, the same curve the browser eases with. Across is time, up is progress, the box is 0 to 1 and the dashed line is linear. A handle cut at the edge goes on to the y in its numbers.">
          <CurvesFigure />
        </Figure>
      }
      further={[
        { href: '/blog/css-scroll-driven-animations', label: 'CSS scroll-driven animations explained', blurb: 'view(), scroll() and animation-range: the timelines an easing on scroll runs along.' },
        { href: '/blog/reduced-motion-scroll-animations', label: 'Reduced motion for scroll animations', blurb: 'What to show when a reader has asked for less motion, overshoot included.' },
      ]}
    >
      <Section id="numbers" k="the model" title="What the four numbers mean">
        <p>
          An easing curve maps time to progress. Both run from 0 to 1: across is the fraction of the duration gone,
          up is the fraction of the way from the start value to the end value. <code>cubic-bezier()</code> draws that
          curve as a cubic Bézier with four points. The first, P0, is fixed at (0, 0) and the last, P3, at (1, 1).
          The four numbers place the two in between:
        </p>
        <Code file="cubic-bezier.txt">{ANATOMY}</Code>
        <p>
          P1 and P2 are handles, not points on the curve. The curve leaves the start heading towards P1 and arrives at
          the end coming from the direction of P2, and the further a handle sits from its end, the harder it pulls.
          Fig. 1 draws six curves straight from their numbers. Use one anywhere CSS takes an easing:
        </p>
        <Code file="card.css">{BASIC_CSS}</Code>
        <p>
          The x values are time, and time cannot run backwards, so x1 and x2 must be between 0 and 1. Anything else
          makes the whole declaration invalid, and the browser keeps whatever easing came before it. The y values have
          no limit; that is how a curve <a href="#overshoot">overshoots</a>.
        </p>
        <Code file="invalid.css">{INVALID_CSS}</Code>
      </Section>

      <Section id="keywords" k="the keywords" title="ease, ease-in, ease-out and ease-in-out, exactly">
        <p>
          The easing keywords are cubic-béziers with fixed numbers, set by the CSS Easing Functions spec. Writing the
          numbers out gives exactly the same curve as the keyword. <code>ease</code> is the default for both{' '}
          <code>transition-timing-function</code> and <code>animation-timing-function</code>, so a transition with no
          easing named uses it.
        </p>
        <Table
          head={['Keyword', 'Is exactly', 'Progress at half time']}
          rows={KEYWORD_NAMES.map((k) => [k, <code key="v">{cssOf(CSS_KEYWORDS[k])}</code>, v3(speeds(CSS_KEYWORDS[k]).half)])}
          caption="Progress at half time is computed from the numbers, and matches the browser’s own keyword in Chromium, Firefox and WebKit."
        />
        <p>
          <code>ease-in-out</code> is symmetric, so it is exactly half way at half time. <code>ease</code> is not: it
          is already {v3(EASE_S.half)} of the way there at half time, and spends the second half of the duration on the
          last {Math.round((1 - EASE_S.half) * 100)}% of the distance. That is why it feels quick and soft at once, and
          why it is a reasonable default for small UI changes.
        </p>
      </Section>

      <Section id="read" k="reading" title="Read a curve: the slope is the speed">
        <p>
          The steepness of the curve at any moment is how fast the value is changing then, compared with linear,
          whose slope is 1 throughout. Flat means still; steeper than the diagonal means faster than linear. The
          curve leaves the start heading straight for P1, so P1 sets the starting speed, and P2 sets the final one
          the same way. When a handle sits on its own end, as P1 does in <code>ease-out</code>, the curve heads for
          the other handle instead.
        </p>
        <Table
          head={['Keyword', 'Speed at the start', 'Speed at the end']}
          rows={KEYWORD_NAMES.map((k) => {
            const s = speeds(CSS_KEYWORDS[k]);
            return [k, `${num(s.start, 2)} × linear`, `${num(s.end, 2)} × linear`];
          })}
          caption="The slope of each curve at its two ends, read from the curve itself."
        />
        <p>
          So <code>ease-out</code> leaves at {num(speeds(CSS_KEYWORDS['ease-out']).start, 2)} times linear’s speed
          and arrives at rest: good for things coming into view, which should react at once and settle.{' '}
          <code>ease-in</code> is the reverse, still at the start and fastest as it hits the end, which suits things
          leaving. <code>ease-in-out</code> is still at both ends, for something moving from one resting place to
          another. To turn any curve around, so an in becomes an out, swap the handles and subtract every number from 1:{' '}
          <code>cubic-bezier(1 − x2, 1 − y2, 1 − x1, 1 − y1)</code>.
        </p>
      </Section>

      <Section id="copy" k={`${NAMED_PRESETS.length} curves`} title="Curves to copy">
        <p>
          The usual names for curves, easeOutCubic and the rest, come from Robert Penner’s easing equations. These
          are the cubic-bezier values commonly published for them; each cell goes inside{' '}
          <code>cubic-bezier( )</code>. From Sine down to Expo each family is steeper than the one before, so its Out
          curve does more of the moving early and spends longer settling: a quarter of the way through,{' '}
          {OUT_SINE.name} has covered {pct(OUT_SINE, 0.25)} of the distance and {OUT_EXPO.name}{' '}
          {pct(OUT_EXPO, 0.25)}.
        </p>
        <Table
          head={['Family', 'In', 'Out', 'In-out']}
          rows={FAMILY_NAMES.map((fam) => [
            fam,
            ...KINDS.map((kind) => <code key={kind}>{join(need(`named:ease${kind}${fam}`).v)}</code>),
          ])}
          caption={<>Values from the <Link href="/cubic-bezier-generator">cubic-bezier generator</Link>, which also says how far each is from the equation it is named after.</>}
        />
        <p>
          Most of these are close copies of their equation, not the equation itself. Where the equation is a cubic
          polynomial, a cubic-bezier with its x handles at ⅓ and ⅔ is it exactly: {OUT_CUBIC.name}, which is 1 − (1 − t)³,
          is exactly{' '}
          <code>{OUT_CUBIC_EXACT ? cssOf(OUT_CUBIC_EXACT) : ''}</code>. The{' '}
          <Link href="/cubic-bezier-generator">generator</Link> gives the exact form wherever there is one.
        </p>
      </Section>

      <Section id="overshoot" k="past the ends" title="Overshoot and back curves">
        <p>
          Put a y outside 0 to 1 and the motion leaves the range between its start and end values. A y above 1 runs past
          the end and comes back; a y below 0 pulls back before it sets off. These are the Back curves:
        </p>
        <Table
          head={['Name', 'cubic-bezier', 'Lowest', 'Highest']}
          rows={BACKS.map((p) => {
            const r = bezierRange(p.v, 4000);
            return [p.name, <code key="v">{join(p.v)}</code>, `${v3(r.min)} at ${num(r.minAt, 2)}`, `${v3(r.max)} at ${num(r.maxAt, 2)}`];
          })}
          caption="Lowest and highest progress and the time each is reached, sampled from the curve. The handles go further out than the curve does."
        />
        <Code file="toast.css">{BACK_CSS}</Code>
        <p>
          Overshoot works on anything with room past its end: a translate, a scale, a width. Opacity is clamped
          to 0–1, and colour channels to their range, so on those an overshoot just holds at the end for a moment.
        </p>
        <Callout k="twice at most">
          A cubic-bezier’s y is a cubic, so it turns at most twice. One curve can pull back once and overshoot once,
          as {IN_OUT_BACK.name} does, but it cannot bounce or wobble. For that you need <code>linear()</code>.
        </Callout>
      </Section>

      <Section id="linear" k="linear()" title="Springs and bounces with linear()">
        <p>
          <code>linear()</code> is an easing made of points joined by straight lines. With two points it is the{' '}
          <code>linear</code> keyword; with enough of them it can follow any curve, including ones that swing past 1
          several times. Each point is a progress value, optionally with the time it applies at:
        </p>
        <Code file="linear.css">{LINEAR_CSS}</Code>
        <p>
          Nobody writes a spring by hand. Write the curve as a function of t and sample it. This one is the spring
          svg-scroll-draw ships, which peaks at {v3(SPRING_STATS.max)} and settles; {EVEN_N + 1} evenly spaced points
          follow it to within {v3(EVEN_ERR)}:
        </p>
        <Code file="to-linear.js">{TO_LINEAR_JS}</Code>
        <p>
          Then use <code>var(--spring)</code> as the easing. Even spacing spends points where the curve is nearly
          straight: to stay within {v3(SPRING.error)} of this spring it needs {EVEN_MATCH + 1}. Keeping only the
          points the shape needs does it with {SPRING.stops.length}, which is short enough to paste:
        </p>
        <Code file="pop.css">{SPRING_CSS}</Code>
        <p>
          <code>linear()</code> works in {LINEAR_SINCE}. A browser older than that drops the whole declaration, which
          is why the listing gives a cubic-bezier first: it keeps that line and gets one overshoot instead of the
          spring. The <Link href="/easing-visualizer">easing visualizer</Link> builds springs, bounces and elastic
          curves with sliders and writes their <code>linear()</code> with how far it can be from the curve.
        </p>
      </Section>

      <Section id="steps" k="steps()" title="steps(): motion in jumps">
        <p>
          <code>steps(n)</code> does not ease at all: it holds the value still and jumps, n times. That is what a
          sprite sheet needs, where a background slides one whole frame at a time, and what a typewriter or a ticking
          clock needs.
        </p>
        <Code file="walker.css">{STEPS_CSS}</Code>
        <p>
          The second argument says where the jumps go. The default, <code>jump-end</code>, holds the first value and
          reaches the last only at the very end; <code>jump-start</code> jumps at once and holds the last value;{' '}
          <code>jump-none</code> holds both the first and the last for a step each; <code>jump-both</code> holds
          neither. For <code>steps({STEP_N}, …)</code>:
        </p>
        <Table
          head={['Time', ...JUMPS]}
          first="plain"
          rows={STEP_ROWS.map((r) => [String(r.t), ...r.v.map((v, i) => <code key={i}>{num(v, 3)}</code>)])}
          caption="Progress from each jump position, from the spec’s step algorithm, checked against the browser’s own steps() in three engines."
        />
        <p>
          <code>start</code> and <code>end</code> are older names for <code>jump-start</code> and{' '}
          <code>jump-end</code>, and <code>step-start</code> and <code>step-end</code> are{' '}
          <code>steps(1, jump-start)</code> and <code>steps(1, jump-end)</code>. In the sprite above,{' '}
          <code>steps(8)</code> with its default <code>jump-end</code> holds 0, −100px and so on to −700px, one
          frame each for an eighth of the time. −800px would show frame one again, and it is never held: the next
          loop starts at 0, which is frame one.
        </p>
      </Section>

      <Section id="scroll" k="scroll-driven" title="Easing on a scroll-driven animation">
        <p>
          With <code>animation-timeline</code>, the scroll position takes the place of time, and the easing maps
          scroll progress to animation progress the same way. One thing catches people out: the default is still{' '}
          <code>ease</code>. A reading progress bar without <code>linear</code> is{' '}
          {Math.round(EASE_S.half * 100)}% full when the page is half read.
        </p>
        <Code file="progress.css">{SCROLL_CSS}</Code>
        <p>
          Linear is the usual choice for scrubbing because the reader is already supplying the motion: they speed up,
          slow down and stop, and the page should follow their hand exactly. An easing on top makes the same flick of
          the wheel move things by different amounts at different points, which reads as lag or a jump, not as softness.
        </p>
        <p>
          Easing still helps where the animation has a clear finish inside a short range, like a card arriving.
          There, <code>ease-out</code> puts most of the movement at the start of the range, so the card is nearly in
          place early and spends the rest of the scroll settling, rather than still sliding as the reader looks at it:
        </p>
        <Code file="settle.css">{SETTLE_CSS}</Code>
        <p>
          Scroll timelines work in {SCROLL_SUPPORT}. How <code>view()</code>, <code>scroll()</code> and the ranges work
          is in <Link href="/blog/css-scroll-driven-animations">CSS scroll-driven animations explained</Link>.
        </p>
      </Section>

      <Section id="js" k="javascript" title="The same curve as a JavaScript function">
        <p>
          Code that animates in <code>requestAnimationFrame</code> needs the easing as a function from time to
          progress. A cubic-bezier is not written that way: both x and y are cubics in a third number, s, the position
          along the curve. So the function has to find the s whose x is the time t, then return the y there.
          Newton’s method finds it in a few steps; where the curve is flat in x it can stall, so bisection takes over,
          which always finishes because x only ever rises.
        </p>
        <Code file="cubic-bezier.js">{SOLVER_JS}</Code>
        <p>
          It matches the browser’s own <code>cubic-bezier()</code> to well within a thousandth in Chromium, Firefox
          and WebKit, for every curve in this post. Use it with a time you measure yourself:
        </p>
        <Code file="animate.js">{RAF_JS}</Code>
        <p>
          If all you need is one element moving, you may not need the function at all:{' '}
          <code>element.animate()</code> takes the same <code>cubic-bezier()</code>, <code>linear()</code> and{' '}
          <code>steps()</code> strings as CSS, and a browser can run it off the main thread, as it does a CSS
          animation of a transform or opacity.
        </p>
        <Code file="waapi.js">{WAAPI_JS}</Code>
      </Section>

      <Section id="library" k="svg-scroll-draw" title="Easing in svg-scroll-draw">
        <p>
          svg-scroll-draw’s <code>easing</code> option takes one of {EASING_NAMES.length} names or any function of t.
          The time is how far the scroll is through the trigger window, so the easing decides how much of the motion
          each stretch of scroll gets. {list(DEFAULT_LINEAR)} default to <code>linear</code>; {list(DEFAULT_OUT)}{' '}
          default to <code>ease-out</code>.
        </p>
        <Code file="main.js">{LIB_JS}</Code>
        <Table
          head={['Name', 'Curve', 'In CSS']}
          rows={EASING_NAMES.map((n) => [
            n,
            NAMED_INFO[n].formula,
            EXACT_CSS[n] ? <code key="c">{EXACT_CSS[n]}</code> : <code key="c">linear()</code>,
          ])}
          caption={<>The names and their maths, from svg-scroll-draw’s core/easing.ts. With {list(NATIVE_EASINGS.map((n) => `'${n}'`))}, scrollDraw and scrollAnimate can hand the animation to the browser’s own scroll timeline.</>}
        />
        <p>
          The names are the library’s own curves, not the CSS keywords. Its <code>ease-out</code> is t(2 − t), up
          to {v3(OUT_GAP)} away from CSS’s <code>ease-out</code>, and is exactly the cubic-bezier in the table, so
          when the library hands an animation to the browser it writes that and not the keyword. For a CSS curve, pass
          the <code>cubicBezier()</code> function above.
        </p>
        <Callout k="a string is a name">
          Only the names in the table work as strings. In plain JavaScript, <code>{"easing: 'cubic-bezier(…)'"}</code> or a
          misspelt name falls back to the function’s default easing without an error; TypeScript rejects both. Pass
          a function instead, and use <code>createSpring</code>, <code>createBounce</code> or{' '}
          <code>createElastic</code> for the swinging curves with your own numbers.
        </Callout>
      </Section>

      <Closing
        title="Drag the handles, copy the curve"
        lede="Move P1 and P2, race the curve against ease or easeOutBack, and copy the cubic-bezier() for CSS or the JavaScript function for your own code."
        command="npm i svg-scroll-draw"
        links={[
          { href: '/cubic-bezier-generator', label: 'Cubic-bezier generator →' },
          { href: '/easing-visualizer', label: 'Easing visualizer' },
        ]}
      />
    </BlogArticle>
  );
}
