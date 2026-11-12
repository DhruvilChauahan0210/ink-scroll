import type { Metadata } from 'next';
import '@/components/stack/stack.css';
import '@/components/bezier/bezier.css';
import Link from 'next/link';
import { SELF } from '@/data/competitors';
import { NAMED, num } from '@/data/easing';
import { seoTitle } from '../_lib/seo';
import { SiteShell } from '@/components/site/SiteShell';
import { jsonLd, SITE_URL } from '@/lib/json-ld';
import { CodeBox } from '@/components/site/CodeBox';
import { ToolNextStep } from '@/components/tool-kit/ToolNextStep';
import { CubicBezierGenerator } from '@/components/bezier/CubicBezierGenerator';
import { AnatomyFigure } from '@/components/bezier/AnatomyFigure';
import { CSS_KEYWORDS, bezierEasing, bezierRange, cssOf, pointAt, solveS, type Bezier } from '@/components/bezier/bezier';
import {
  CSS_PRESETS, FAMILY_NAMES, LIB_PRESETS, NAMED_PRESETS, ceil1, exactOf, gapBetween, gapOf, presetByKey, type Preset,
} from '@/components/bezier/presets';
import { SLUG, TABS } from '@/components/bezier/code';
import { C, Note, Sec, Toc } from '@/components/stack/parts';

// Searches this page is for: "cubic bezier generator", "cubic-bezier css",
// "css easing generator", "custom easing function". Every number below is
// computed from the generator's own maths (components/bezier/), never typed.
const TITLE = 'Cubic Bezier Generator: CSS Easing & Custom Easing Function';
const DESCRIPTION =
  'Drag two points to make a CSS cubic-bezier() easing. Race it against ease or easeOutBack, then copy the CSS or a JavaScript easing function.';

const need = (key: string): Preset => {
  const p = presetByKey(key);
  if (!p) throw new Error(`no preset ${key}`);
  return p;
};
const v3 = (n: number) => num(n, 3);

const EASE = CSS_KEYWORDS.ease;
const easeAt = bezierEasing(EASE);
const SOLVE = [0.25, 0.5, 0.75].map((t) => {
  const r = solveS(EASE, t);
  return { t, s: r.s, y: pointAt(EASE, r.s).y, steps: r.newton };
});
const STEEP: Bezier = [1, 0, 0, 1];
const STEEP_SOLVE = solveS(STEEP, 0.4999);

const OUT_BACK = need('named:easeOutBack');
const IN_OUT_BACK = need('named:easeInOutBack');
const OUT_CUBIC = need('named:easeOutCubic');
const IN_OUT_CUBIC = need('named:easeInOutCubic');
const OUT_QUART = need('named:easeOutQuart');
const OUT_BACK_R = bezierRange(OUT_BACK.v, 4000);
const IN_OUT_BACK_R = bezierRange(IN_OUT_BACK.v, 4000);
const OUT_CUBIC_EXACT = exactOf(OUT_CUBIC);

// The CSS keywords against svg-scroll-draw's easings of the same name (core/easing.ts:103-107, copied in data/easing.ts).
const CSS_VS_LIB: Record<string, string> = {
  ease: 'No easing of that name.',
  'ease-in': `'ease-in' is t², up to ${v3(gapBetween(CSS_KEYWORDS['ease-in'], NAMED['ease-in']).gap)} away.`,
  'ease-out': `'ease-out' is t(2 − t), up to ${v3(gapBetween(CSS_KEYWORDS['ease-out'], NAMED['ease-out']).gap)} away.`,
  'ease-in-out': `'ease-in-out' is two quadratics, up to ${v3(gapBetween(CSS_KEYWORDS['ease-in-out'], NAMED['ease-in-out']).gap)} away.`,
  linear: "'linear', the same.",
};
const IN_GAP = v3(gapBetween(CSS_KEYWORDS['ease-in'], NAMED['ease-in']).gap);
const LIB_GAP = ceil1(Math.max(...LIB_PRESETS.map((p) => gapOf(p).gap)));
const EXACT_COUNT = NAMED_PRESETS.filter((p) => p.poly).length;

const IN_LIBRARY = `import { scrollDraw, scrollAnimate } from 'svg-scroll-draw';
import { scrollReveal } from 'svg-scroll-draw/reveal';

// cubicBezier() is the function the generator writes (the scrollDraw tab).
const easeOutBack = cubicBezier(${OUT_BACK.v.join(', ')});

scrollDraw('#logo', { easing: easeOutBack });
scrollAnimate('#card', { props: { transform: ['scale(0.8)', 'scale(1)'] }, easing: easeOutBack });
scrollReveal('.feature', { easing: easeOutBack });

// svg-scroll-draw's own ease-in and ease-out are exact cubic-béziers: use the names.
scrollDraw('#chart', { easing: 'ease-out' }); // ${cssOf(LIB_PRESETS[1].v)}`;

const MATHS = `// cubic-bezier(x1, y1, x2, y2), at a parameter s from 0 to 1:
x(s) = 3·x1·s·(1 − s)² + 3·x2·s²·(1 − s) + s³    // time
y(s) = 3·y1·s·(1 − s)² + 3·y2·s²·(1 − s) + s³    // progress

// To ease time t: solve x(s) = t for s, then return y(s).`;

const FAQ: { q: string; a: string }[] = [
  {
    q: 'What is cubic-bezier() in CSS?',
    a: `A CSS easing function given by four numbers, cubic-bezier(x1, y1, x2, y2). They place the two control points of a Bézier curve that runs from (0, 0) to (1, 1), with time across and progress up. Use it wherever CSS takes an easing: transition-timing-function, animation-timing-function, the transition and animation shorthands, or the easing of element.animate(). The keywords are cubic-béziers too: ease is cubic-bezier(${EASE.join(', ')}).`,
  },
  {
    q: 'How do I write a custom easing function in JavaScript?',
    a: 'An easing function takes time t from 0 to 1 and returns progress. For a cubic-bezier, solve x(s) = t for the curve parameter s, then return y(s). Newton–Raphson finds s in a few steps where the curve is not flat in x; bisection takes over where it is, and always finishes because x(s) never falls. The scrollDraw tab above writes the whole function, about 30 lines with no imports, and it works with any library that takes (t) => number.',
  },
  {
    q: 'Why must x1 and x2 be between 0 and 1?',
    a: 'Because x is time. CSS treats a cubic-bezier() with x1 or x2 outside 0–1 as invalid, so the browser drops the whole declaration. Inside that range x(s) never runs backwards, so every moment of time has exactly one progress. The y values have no limit, which is what lets a curve overshoot.',
  },
  {
    q: 'How do I make an overshoot or “back” easing with cubic-bezier?',
    a: `Put a y outside 0–1. easeOutBack, cubic-bezier(${OUT_BACK.v.join(', ')}), runs on to ${v3(OUT_BACK_R.max)} and settles back at 1; a y below 0 pulls back before it starts. The curve’s y is a cubic in s, so it turns at most twice: one cubic-bezier can pull back once and overshoot once, as easeInOutBack does, but cannot bounce or ring. For that, use CSS linear() with many points, or svg-scroll-draw’s createBounce, createSpring and createElastic.`,
  },
  {
    q: 'What is the difference between ease, ease-in-out and linear?',
    a: `linear is cubic-bezier(0, 0, 1, 1): the same speed throughout. ease-in-out is cubic-bezier(0.42, 0, 0.58, 1), slow at both ends and symmetric, so it is half way at half time. ease, cubic-bezier(${EASE.join(', ')}), speeds up early and spends most of its time slowing down: at half time it is already ${v3(easeAt(0.5))} of the way. ease is the default for both transitions and animations.`,
  },
  {
    q: 'What are the cubic-bezier values for easeInOutCubic, easeOutCubic and the other named easings?',
    a: `easeInOutCubic is usually written cubic-bezier(${IN_OUT_CUBIC.v.join(', ')}), easeOutCubic cubic-bezier(${OUT_CUBIC.v.join(', ')}) and easeOutQuart cubic-bezier(${OUT_QUART.v.join(', ')}); section 4 lists all ${NAMED_PRESETS.length}. Most are approximations of Robert Penner’s equations, off by up to ${ceil1(Math.max(...NAMED_PRESETS.map((p) => gapOf(p).gap)))}. ${EXACT_COUNT} of the equations are cubic polynomials and so are exactly a cubic-bezier: easeOutCubic is exactly ${OUT_CUBIC_EXACT ? cssOf(OUT_CUBIC_EXACT) : ''}.`,
  },
  {
    q: 'Can I use a cubic-bezier with svg-scroll-draw?',
    a: `Yes. Every svg-scroll-draw API that takes easing takes a function of t, so pass the generated cubicBezier(…) function: scrollDraw('#logo', { easing: cubicBezier(${OUT_BACK.v.join(', ')}) }). A function runs on the library’s JavaScript engine. svg-scroll-draw’s own 'ease-in' and 'ease-out' are exactly cubic-bezier(${LIB_PRESETS[0].v.join(', ')}) and cubic-bezier(${LIB_PRESETS[1].v.join(', ')}); the CSS keywords with the same names are different curves, up to ${IN_GAP} away.`,
  },
];

const TOC = [
  { id: 'generator', label: 'The generator' },
  { id: 'how', label: 'How cubic-bezier() works' },
  { id: 'overshoot', label: 'Below 0 and past 1' },
  { id: 'named', label: `Named curves · ${CSS_PRESETS.length} + ${NAMED_PRESETS.length}` },
  { id: 'library', label: 'With svg-scroll-draw' },
  { id: 'use', label: 'Use it in your project' },
  { id: 'faq', label: `Questions · ${FAQ.length}` },
];

export const metadata: Metadata = {
  title: seoTitle(TITLE),
  description: DESCRIPTION,
  keywords: [
    'cubic bezier generator', 'cubic-bezier css', 'css easing generator', 'custom easing function', 'cubic-bezier editor',
    'css cubic-bezier tool', 'easing function javascript', 'easeOutBack cubic-bezier', 'easeInOutCubic cubic-bezier',
    'css timing function',
  ],
  alternates: { canonical: '/cubic-bezier-generator' },
  openGraph: { type: 'article', title: TITLE, description: DESCRIPTION, url: `${SITE_URL}/cubic-bezier-generator` },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

const JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      name: 'Cubic-bezier generator',
      url: `${SITE_URL}/cubic-bezier-generator`,
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

export default function CubicBezierGeneratorPage() {
  return (
    <SiteShell
      active="/cubic-bezier-generator"
      crumbs={[['Cubic-bezier generator', '/cubic-bezier-generator']]}
      kicker="easing / your turn"
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(JSON_LD) }} />
      <div className="stk">

        <header className="pg-head stk-head">
          <div>
            <p className="pg-kicker">
              <span>tool / cubic-bezier</span>
              <span>css · javascript</span>
            </p>
            <h1 className="pg-title stk-title">Cubic-bezier generator</h1>
            <p className="pg-lede">
              Drag the two control points, or type the numbers, and watch the curve race against <C>ease</C> or any
              named easing. Then copy the <C>cubic-bezier()</C> for CSS, or the same curve as a JavaScript easing
              function for svg-scroll-draw.
            </p>
            <div className="pg-actions">
              <a href="#generator" className="btn btn-solid" data-magnetic>Open the generator ↓</a>
              <Link href="/easing-visualizer" className="btn" data-magnetic>Easing visualizer →</Link>
            </div>
            <dl className="pg-facts">
              <div><dt>CSS keywords</dt><dd>{CSS_PRESETS.length}</dd></div>
              <div><dt>Named curves</dt><dd>{NAMED_PRESETS.length}</dd></div>
              <div><dt>Code outputs</dt><dd>{TABS.length}</dd></div>
              <div><dt>Gzipped</dt><dd>{SELF.gzipKb} KB</dd></div>
            </dl>
          </div>
          <AnatomyFigure />
        </header>

        <div className="stk-body">
          <Toc label="On this page" items={TOC} />
          <div className="stk-main">

            <Sec n={1} k="The tool" id="generator" title="Make a cubic-bezier easing">
              <p className="stk-p">
                Start from a CSS keyword, one of svg-scroll-draw’s own easings or one of {NAMED_PRESETS.length} named
                curves, then drag P1 and P2. The markers race over the duration you pick, the line is drawn by
                scrollDraw with your curve as its easing, and the browser check compares the JavaScript function with
                your browser’s own <C>cubic-bezier()</C>.
              </p>
              <CubicBezierGenerator version={SELF.version} />
            </Sec>

            <Sec n={2} k="The model" id="how" title="How cubic-bezier() works">
              <p className="stk-p">
                A cubic Bézier curve has four points. In an easing, the first is pinned at (0, 0), the start, and the
                last at (1, 1), the end; <C>cubic-bezier(x1, y1, x2, y2)</C> places the two between, P1 and P2. The
                curve leaves P0 heading for P1 and arrives at P3 from the direction of P2, and the further a point is
                from its end, the harder it pulls (fig. 1). Across is time, up is progress.
              </p>
              <p className="stk-p">
                Both coordinates are cubics in a parameter <C>s</C> that runs along the curve. The browser knows the
                time, not <C>s</C>, so to ease time <C>t</C> it solves <C>x(s) = t</C> first and then reads{' '}
                <C>y(s)</C>. The generator’s function does the same, with Newton–Raphson and bisection where the curve
                is flat. For <C>ease</C>:
              </p>
              <CodeBox file="cubic-bezier.txt">{MATHS}</CodeBox>
              <div className="bz-scroll" tabIndex={0} role="region" aria-label="Easing three times with ease">
                <table className="bz-table">
                  <thead><tr><th>Time t</th><th>Solved s</th><th>Progress y(s)</th><th>Newton steps</th></tr></thead>
                  <tbody>
                    {SOLVE.map((r) => (
                      <tr key={r.t}>
                        <td className="is-code">{r.t}</td>
                        <td className="is-code">{num(r.s, 4)}</td>
                        <td className="is-code">{num(r.y, 4)}</td>
                        <td className="is-code">{r.steps}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Note k="Why x stays in 0–1">
                CSS treats a <C>cubic-bezier()</C> with x1 or x2 outside 0–1 as invalid and drops the declaration.
                With both inside, x(s) never runs backwards, so each moment has one progress. The editor keeps x in
                range and lets y go anywhere from −5 to 5.
              </Note>
              <Note k="Flat in x">
                <C>cubic-bezier(1, 0, 0, 1)</C> stops in x at its middle: the slope of x(s) is 0 at s = 0.5, where a
                Newton step would divide by zero. Near there the function halves the interval instead: at time 0.4999
                it drops Newton at once and halves {STEEP_SOLVE.bisection} times.
              </Note>
            </Sec>

            <Sec n={3} k="Past the ends" id="overshoot" title="Below 0 and past 1">
              <p className="stk-p">
                Time stays between 0 and 1; progress does not have to. A y1 or y2 above 1 makes the motion run past its
                end and come back: <C>easeOutBack</C> peaks at {v3(OUT_BACK_R.max)} at time {num(OUT_BACK_R.maxAt, 2)}.
                Below 0 it pulls back before it sets off: <C>easeInOutBack</C> does both, down to{' '}
                {v3(IN_OUT_BACK_R.min)} and up to {v3(IN_OUT_BACK_R.max)}. The editor draws those stretches of the
                curve in the accent.
              </p>
              <div className="stk-faq">
                <div className="stk-q">
                  <span className="stk-q-n">move</span>
                  <div>
                    <p className="stk-p">
                      A transform or a length goes past its end value and comes back. In svg-scroll-draw 2.23.3 and
                      earlier, scrollAnimate stops updating an element once its own transform has carried it wholly
                      out of view, or out of an <C>overflow: hidden</C> parent, so an overshoot that far leaves it
                      there. Fixed in 2.23.4.
                    </p>
                  </div>
                </div>
                <div className="stk-q">
                  <span className="stk-q-n">clamp</span>
                  <div>
                    <p className="stk-p">
                      Opacity is clamped to 0–1 and each colour channel to its range, so past the end they hold at
                      the end.
                    </p>
                  </div>
                </div>
                <div className="stk-q">
                  <span className="stk-q-n">draw</span>
                  <div>
                    <p className="stk-p">
                      In scrollDraw the dash slides beyond the end of the path, so past 1 the start of the line clears
                      for a moment and fills back in, and below 0 a piece of its far end shows before the line begins.
                      Try <C>easeOutBack</C> and <C>easeInBack</C> in the generator and watch the ends of the line.
                    </p>
                  </div>
                </div>
              </div>
              <Note k="Twice at most">
                y(s) is a cubic, so it turns at most twice: one cubic-bezier can pull back once and overshoot once, but
                cannot bounce or ring. For several swings use CSS <C>linear()</C> through many points, or
                svg-scroll-draw’s <C>createBounce</C>, <C>createSpring</C> and <C>createElastic</C>, all in the{' '}
                <Link href="/easing-visualizer">easing visualizer</Link>.
              </Note>
              <Note k="once">
                With <C>once: true</C>, svg-scroll-draw 2.23.2 and earlier keep the highest eased value reached in
                scrollDraw, scrollAnimate, scrollReveal, scrollCounter, scrollVideo and useScrollDrawProgress, so an
                easing that overshoots freezes on its peak: easeOutBack’s line stays short at its start, and a card
                stays {v3(OUT_BACK_R.max)} of the way along. Fixed in 2.23.3, which keeps the furthest scroll progress
                instead and eases it after, as scrollText already did, so the curve plays out and ends at 1.
              </Note>
            </Sec>

            <Sec n={4} k={`${CSS_PRESETS.length} keywords · ${NAMED_PRESETS.length} curves`} id="named" title="Named curves and their cubic-bezier values">
              <p className="stk-p">
                The CSS keywords, as the CSS Easing spec defines them, beside svg-scroll-draw’s easings of the same
                name. Only <C>linear</C> is the same curve in both.
              </p>
              <div className="bz-scroll" tabIndex={0} role="region" aria-label="The CSS keywords">
                <table className="bz-table is-stack">
                  <thead><tr><th>Keyword</th><th>cubic-bezier</th><th>svg-scroll-draw’s own</th></tr></thead>
                  <tbody>
                    {CSS_PRESETS.map((p) => (
                      <tr key={p.key}>
                        <td className="is-code">{p.name}</td>
                        <td className="is-code">{cssOf(p.v)}</td>
                        <td data-k="svg-scroll-draw">{CSS_VS_LIB[p.name]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="stk-p bz-after">
                The named curves are Robert Penner’s easing equations, as the cubic-béziers usually published for them.
                Most are close copies, not the equation itself; the third column says how close.
              </p>
              <div className="bz-scroll" tabIndex={0} role="region" aria-label="Named curves">
                <table className="bz-table is-stack">
                  <thead><tr><th>Name</th><th>cubic-bezier</th><th>Off its equation by</th><th>Exactly</th></tr></thead>
                  <tbody>
                    {FAMILY_NAMES.map((fam) => [
                      <tr key={fam} className="is-fam"><td colSpan={4}>{fam}</td></tr>,
                      ...NAMED_PRESETS.filter((p) => p.family === fam).map((p) => {
                        const exact = exactOf(p);
                        return (
                          <tr key={p.key}>
                            <td className="is-code">{p.name}</td>
                            <td className="is-code">{cssOf(p.v)}</td>
                            <td className="is-code" data-k="off by">up to {ceil1(gapOf(p).gap)}</td>
                            <td className="is-code" data-k="exactly">{exact ? cssOf(exact) : '—'}</td>
                          </tr>
                        );
                      }),
                    ])}
                  </tbody>
                </table>
              </div>
              <Note k="Exact ones">
                A cubic polynomial is exactly a cubic-bezier with its x controls at 1/3 and 2/3: then x(s) = s, and
                y(s) is the polynomial. That is how svg-scroll-draw hands its own <C>ease-in</C> and{' '}
                <C>ease-out</C> to CSS, within {LIB_GAP} of t² and t(2 − t). {EXACT_COUNT} of Penner’s equations are
                cubics (Quad, Cubic and Back, in and out), so the last column gives them exactly. The in-out ones are
                two curves joined at the middle, and sine, expo and circ are not polynomials, so no cubic-bezier is
                exact for them.
              </Note>
            </Sec>

            <Sec n={5} k="The library" id="library" title="A cubic-bezier in svg-scroll-draw">
              <p className="stk-p">
                svg-scroll-draw’s <C>easing</C> option takes a name or any function of t, in scrollDraw, scrollAnimate,
                scrollReveal, scrollText, scrollCounter and every other API that eases. Paste the generated{' '}
                <C>cubicBezier()</C> and pass what it returns. In a scroll
                animation, time is the scroll position through the trigger window, so the curve decides how much of
                the motion each stretch of scroll gets.
              </p>
              <CodeBox file="main.js">{IN_LIBRARY}</CodeBox>
              <Note k="Native">
                scrollDraw and scrollAnimate can hand an animation to the browser’s own scroll timeline only when its
                easing is <C>linear</C>, <C>ease-in</C>, <C>ease-out</C> or <C>ease-in-out</C>, by name, and no other
                option needs JavaScript. A function always runs on the JavaScript engine. So when your curve is one of
                the library’s quadratics, the generator writes the name.
              </Note>
              <Note k="Drop-ins">
                The AOS and ScrollReveal drop-ins (<C>svg-scroll-draw/aos</C>, <C>svg-scroll-draw/scrollreveal</C>)
                animate with CSS transitions, so their <C>easing</C> takes the <C>cubic-bezier()</C> string itself,
                and so does AOS’s <C>data-aos-easing</C> attribute.
              </Note>
              <Note k="Reduced motion">
                For readers who ask their system for less motion, scrollDraw and scrollAnimate show the end state at
                once, whatever the easing.
              </Note>
            </Sec>

            <Sec n={6} k="Next" id="use" title="Use it in your project">
              <ToolNextStep
                slug={SLUG}
                api="scrollDraw"
                docs="/docs#core-options"
                related={['easing-visualizer', 'css-keyframes-animation-generator']}
              />
              <Note k="CSS needs nothing">
                The CSS tab needs no package at all. The scrollDraw and scrollAnimate tabs import from the main entry,
                and the <C>cubicBezier()</C> they paste has no imports of its own. Run it, under the code, writes one
                page with your curve as the CSS tab’s transition, then on a scrollDraw line and a scrollAnimate dot
                over real page scroll, the library loaded from jsDelivr, pinned to {SELF.version}.
              </Note>
            </Sec>

            <Sec n={7} k={`${FAQ.length} questions`} id="faq" title="Cubic-bezier questions">
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
