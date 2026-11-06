'use client';

import './finale.css';
import { useCallback, useEffect, useRef, type CSSProperties } from 'react';
import { ScrollDraw } from 'svg-scroll-draw/react';
import { prefersReducedMotion } from './useStageFlag';
import { shortCount, useStars } from './useStars';

/**
 * One more plate before the sign-off: a five-pointed star constructed with
 * compass and straightedge, drawn by scroll. It follows the sheet's rules —
 * a pencil underdrawing the ink covers exactly, labels that appear once their
 * line is inked, the accent kept for one line only: the finished star, whose
 * leader points at "Star on GitHub".
 *
 * The construction (circle radius R about O, A at the top, B on the right):
 * M bisects OB; the arc about M through A meets the diameter at N; AN is the
 * pentagon's side, stepped five times round the circle; joining every second
 * point gives the pentagram, and its outline is the star.
 *
 * Timing is the library's: one ScrollDraw over the pinned track, stroke i
 * starts at i × stagger and takes 1 / speed of the window. --fin-p (the
 * track's progress) drives the labels and the steps, as --so-p does on the sheet.
 */

const GH = 'https://github.com/DhruvilChauahan0210/ink-scroll';

type Tone = 'ink' | 'mute' | 'faint' | 'accent';
/**
 * `about`: an arc's centre: the compass draws it, needle there. `freehand`:
 * inked with the nib alone. Any other stroke is ruled: the straightedge lies
 * along it and the nib inks. `rest`: an invisible stroke, a pause.
 */
type Stroke = { d: string; tone: Tone; w: 'p' | 's' | 'h'; about?: Pt; freehand?: boolean; rest?: boolean };
type Pt = [number, number];

const f = (n: number) => n.toFixed(1);
const O: Pt = [500, 510];
const R = 400;
const rad = (deg: number) => (deg * Math.PI) / 180;
const onCircle = (deg: number, r = R): Pt => [O[0] + r * Math.cos(rad(deg)), O[1] + r * Math.sin(rad(deg))];

const A = onCircle(-90);
const B = onCircle(0);
const M: Pt = [(O[0] + B[0]) / 2, O[1]];
const MA = Math.hypot(A[0] - M[0], A[1] - M[1]);
const N: Pt = [M[0] - MA, O[1]];
const SIDE = Math.hypot(A[0] - N[0], A[1] - N[1]);
/** The five points, A first, clockwise. */
const V: Pt[] = [0, 1, 2, 3, 4].map((k) => onCircle(-90 + 72 * k));
/** The star's inner corners: where the pentagram's lines cross. */
const INNER = R * (Math.cos(rad(72)) / Math.cos(rad(36)));
const STAR = Array.from({ length: 10 }, (_, j) => onCircle(-90 + 36 * j, j % 2 ? INNER : R));

/** A short compass mark across the circle at V[k], swung from V[k - 1]. */
function tick(k: number): string {
  const c = V[(k + 4) % 5];
  const t = Math.atan2(V[k][1] - c[1], V[k][0] - c[0]);
  const p = (dt: number): Pt => [c[0] + SIDE * Math.cos(t + dt), c[1] + SIDE * Math.sin(t + dt)];
  const [a, b] = [p(-0.07), p(0.07)];
  return `M${f(a[0])} ${f(a[1])} A${f(SIDE)} ${f(SIDE)} 0 0 1 ${f(b[0])} ${f(b[1])}`;
}
const line = (a: Pt, b: Pt) => `M${f(a[0])} ${f(a[1])} L${f(b[0])} ${f(b[1])}`;

/** A held breath between steps: an invisible stroke that takes one slot of time. */
const REST: Stroke = { d: 'M-40 -40 h10', tone: 'faint', w: 'h', rest: true };
/** The circle about O in four quarter-turns from A, so it draws at a hand's pace. */
const QUARTERS = [-90, 0, 90, 180].map((deg): Stroke => {
  const a = onCircle(deg);
  const b = onCircle(deg + 90);
  return { d: `M${f(a[0])} ${f(a[1])} A${R} ${R} 0 0 1 ${f(b[0])} ${f(b[1])}`, tone: 'mute', w: 's', about: O };
});
/** The star's outline, point to point: five pieces, each out, in and out again. */
const OUTLINE = [0, 1, 2, 3, 4].map((m): Stroke => {
  const [a, b, c] = [STAR[2 * m], STAR[2 * m + 1], STAR[(2 * m + 2) % 10]];
  return { d: `M${f(a[0])} ${f(a[1])} L${f(b[0])} ${f(b[1])} L${f(c[0])} ${f(c[1])}`, tone: 'accent', w: 'p', freehand: true };
});

/**
 * Every stroke, in the order it inks, grouped by the step that draws it. One
 * stroke at a time: each takes one slot (STAGGER × SPEED = 1), so nothing
 * overlaps, and each step ends on a REST, the tool held where it stopped.
 */
const STEPS: { label: string; strokes: Stroke[] }[] = [
  { label: 'Circle about O', strokes: [...QUARTERS, REST] },
  {
    label: 'Diameter, and the radius OA',
    strokes: [{ d: line(onCircle(180), B), tone: 'faint', w: 'h' }, { d: line(O, A), tone: 'faint', w: 'h' }, REST],
  },
  {
    label: 'Bisect OB at M',
    strokes: [{ d: line([M[0], M[1] - 14], [M[0], M[1] + 14]), tone: 'mute', w: 's' }, REST],
  },
  {
    label: 'Swing MA down to N',
    strokes: [
      { d: `M${f(A[0])} ${f(A[1])} A${f(MA)} ${f(MA)} 0 0 0 ${f(N[0])} ${f(N[1])}`, tone: 'faint', w: 'h', about: M },
      REST,
    ],
  },
  {
    label: 'Step AN round the circle',
    strokes: [
      { d: line(A, N), tone: 'mute', w: 'h' },
      ...[1, 2, 3, 4, 0].map((k): Stroke => ({ d: tick(k), tone: 'mute', w: 's', about: V[(k + 4) % 5] })),
      REST,
    ],
  },
  {
    label: 'Join every second point',
    strokes: [
      ...[
        [0, 2],
        [2, 4],
        [4, 1],
        [1, 3],
        [3, 0],
      ].map(([a, b]): Stroke => ({ d: line(V[a], V[b]), tone: 'ink', w: 's' })),
      REST,
      REST,
    ],
  },
  {
    label: 'Ink the outline. It’s yours.',
    strokes: [...OUTLINE, { d: line(V[4], [40, V[4][1]]), tone: 'accent', w: 'h' }],
  },
];

const ALL = STEPS.flatMap((s) => s.strokes);
const COUNT = ALL.length;
/** The last stroke lands at 92% of the pin, a short hold before the sign-off. */
const END = 0.92;
const STAGGER = Number((END / COUNT).toFixed(5));
const SPEED = 1 / STAGGER;
const doneAt = (i: number) => Math.min(1, (i + 1) * STAGGER).toFixed(3);
const startAt = (i: number) => (i * STAGGER).toFixed(3);
/** First stroke of each step. */
const STEP_AT = STEPS.map((_, s) => STEPS.slice(0, s).reduce((n, x) => n + x.strokes.length, 0));
const LAST = COUNT - 1;

const at = (v: string): CSSProperties => ({ '--fin-at': v }) as CSSProperties;

/** Construction letters and notes, each shown once the stroke it names is inked. */
const NOTES: { x: number; y: number; t: string; i: number; anchor?: 'start' | 'middle' | 'end'; cls?: string }[] = [
  { x: O[0] + 14, y: O[1] + 30, t: 'O', i: STEP_AT[1] },
  { x: A[0] + 16, y: A[1] - 12, t: 'A', i: STEP_AT[1] + 1 },
  { x: B[0] + 16, y: B[1] - 12, t: 'B', i: STEP_AT[1] },
  { x: M[0] + 12, y: M[1] + 40, t: 'M', i: STEP_AT[2] },
  { x: N[0] - 12, y: N[1] + 40, t: 'N', i: STEP_AT[3], anchor: 'end' },
  // Outside the arc about M, level with its highest-left reach.
  { x: M[0] - MA * Math.cos(rad(40)) - 18, y: O[1] - MA * Math.sin(rad(40)), t: '|MA| = |MN|', i: STEP_AT[3], anchor: 'end', cls: 'fin-note' },
  // Under N, where the chord AN starts: the open space below the diameter.
  { x: N[0] - 12, y: N[1] + 76, t: 'AN = side · 72°', i: STEP_AT[4], anchor: 'end', cls: 'fin-note' },
  { x: V[2][0] + 24, y: V[2][1] + 34, t: 'φ = 1.618', i: STEP_AT[5] + 4, cls: 'fin-note' },
  { x: 40, y: V[4][1] - 16, t: 'Yours →', i: LAST, cls: 'fin-note fin-note-accent' },
];
/** The construction points, each shown with the stroke that finds it. */
const DOTS: { p: Pt; i: number }[] = [
  { p: O, i: STEP_AT[1] },
  { p: A, i: STEP_AT[1] + 1 },
  { p: B, i: STEP_AT[1] },
  { p: M, i: STEP_AT[2] },
  { p: N, i: STEP_AT[3] },
];


/* ── The instruments: a compass for arcs, a straightedge and nib for lines ── */

const LEG = 300;
const set = (el: Element | null, attrs: Record<string, string | number>) => {
  if (el) for (const k in attrs) el.setAttribute(k, String(attrs[k]));
};

/** How much of each ink stroke is down, read from the engine's own dash. */
function inked(path: SVGPathElement): number {
  const arr = parseFloat(path.style.strokeDasharray);
  const off = parseFloat(path.style.strokeDashoffset);
  if (!(arr > 0) || Number.isNaN(off)) return 1;
  return Math.min(1, Math.max(0, 1 - off / arr));
}

/**
 * Puts the right tool on the stroke being drawn: the compass with its needle
 * on the arc's centre and its pencil on the ink's tip, or the straightedge
 * along the line with the nib at the tip. Between strokes and once the star
 * is done the tools are put away.
 */
function placeTools(svg: SVGSVGElement) {
  const inks = svg.querySelectorAll<SVGPathElement>('.fin-ink');
  // The tool follows the stroke being drawn; through a rest it stays where the
  // last real stroke ended, the way a hand pauses before the next step.
  let k = -1;
  let t = 0;
  let all = true;
  inks.forEach((el, i) => {
    const x = inked(el);
    if (x < 0.998) all = false;
    if (x > 0.002 && !ALL[i].rest) {
      k = i;
      t = x;
    }
  });
  const s = ALL[k];
  if (!s || all) {
    svg.dataset.tool = '';
    return;
  }
  const el = inks[k];
  const len = el.getTotalLength();
  const tip = el.getPointAtLength(t * len);
  const T: Pt = [tip.x, tip.y];

  if (s.about) {
    svg.dataset.tool = 'compass';
    const P = s.about;
    const d = Math.hypot(T[0] - P[0], T[1] - P[1]);
    const mx = (P[0] + T[0]) / 2;
    const my = (P[1] + T[1]) / 2;
    let nx = -(T[1] - P[1]) / d;
    let ny = (T[0] - P[0]) / d;
    if (ny > 0) [nx, ny] = [-nx, -ny]; // the hinge rides above the line between the points
    const h = Math.sqrt(Math.max(0, LEG * LEG - (d / 2) ** 2));
    const H: Pt = [mx + nx * h, my + ny * h];
    set(svg.querySelector('.fin-c-needle'), { x1: f(P[0]), y1: f(P[1]), x2: f(H[0]), y2: f(H[1]) });
    set(svg.querySelector('.fin-c-pencil'), { x1: f(H[0]), y1: f(H[1]), x2: f(T[0]), y2: f(T[1]) });
    set(svg.querySelector('.fin-c-hinge'), { cx: f(H[0]), cy: f(H[1]) });
    set(svg.querySelector('.fin-c-grip'), { x1: f(H[0]), y1: f(H[1]), x2: f(H[0] + nx * 40), y2: f(H[1] + ny * 40) });
    set(svg.querySelector('.fin-c-point'), { cx: f(P[0]), cy: f(P[1]) });
    return;
  }

  svg.dataset.tool = s.freehand ? 'nib' : 'rule';
  set(svg.querySelector('.fin-nib'), { transform: `translate(${f(T[0])} ${f(T[1])})` });
  if (svg.dataset.tool !== 'rule') return;
  // The straightedge lies along the whole line, on the side away from the centre.
  const a = el.getPointAtLength(0);
  const b = el.getPointAtLength(len);
  const ux = (b.x - a.x) / len;
  const uy = (b.y - a.y) / len;
  let nx = -uy;
  let ny = ux;
  const mid: Pt = [(a.x + b.x) / 2, (a.y + b.y) / 2];
  if ((mid[0] + nx - O[0]) ** 2 + (mid[1] + ny - O[1]) ** 2 < (mid[0] - O[0]) ** 2 + (mid[1] - O[1]) ** 2) [nx, ny] = [-nx, -ny];
  const E = 40;
  const W = 30;
  const p0: Pt = [a.x - ux * E, a.y - uy * E];
  const p1: Pt = [b.x + ux * E, b.y + uy * E];
  const q = (p: Pt, w: number) => `${f(p[0] + nx * w)} ${f(p[1] + ny * w)}`;
  set(svg.querySelector('.fin-r-body'), { d: `M${q(p0, 3)} L${q(p1, 3)} L${q(p1, 3 + W)} L${q(p0, 3 + W)}Z` });
  // Graduations along the working edge, every 20 units, longer every 100.
  let ticks = '';
  const n = Math.floor((len + 2 * E) / 20);
  for (let i = 0; i <= n; i++) {
    const c: Pt = [p0[0] + ux * i * 20, p0[1] + uy * i * 20];
    ticks += `M${q(c, 3)} L${q(c, i % 5 ? 9 : 15)}`;
  }
  set(svg.querySelector('.fin-r-ticks'), { d: ticks });
}

export function Finale() {
  const ref = useRef<HTMLElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const toolFrame = useRef(0);
  const stars = useStars();

  const write = useCallback((p: number) => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--fin-p', p.toFixed(4));
    el.toggleAttribute('data-ready', p >= Number(doneAt(LAST)) - 0.02);
    // onProgress runs before the engine writes this frame's dashes; place the
    // tools on the next frame, from the ink as it now stands, or they would
    // freeze one stroke behind when the scroll stops.
    cancelAnimationFrame(toolFrame.current);
    toolFrame.current = requestAnimationFrame(() => {
      if (svgRef.current) placeTools(svgRef.current);
    });
  }, []);

  // The engine reports its first stroke's alpha; the track's own position over
  // the trigger window is what the labels and steps follow.
  const onProgress = useCallback(() => {
    const track = ref.current?.parentElement;
    if (!track) return;
    const r = track.getBoundingClientRect();
    const span = r.height - window.innerHeight;
    write(span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 1);
  }, [write]);

  useEffect(() => {
    if (prefersReducedMotion()) write(1);
    return () => cancelAnimationFrame(toolFrame.current);
  }, [write]);

  return (
    <ScrollDraw
      className="fin"
      selector=".fin-ink"
      trigger={{ start: 'top top', end: 'bottom bottom' }}
      stagger={STAGGER}
      speed={SPEED}
      easing="ease-in-out"
      onProgress={onProgress}
    >
      <section ref={ref} className="fin-pin" aria-labelledby="fin-title">
        <div className="fin-copy">
          <p className="fin-k">★ / one more plate</p>
          <h2 id="fin-title" className="fin-title">
            A star, by compass and scroll
          </h2>
          <ol className="fin-steps">
            {STEPS.map((s, k) => (
              <li
                key={s.label}
                className="fin-step"
                style={{ '--fin-at': startAt(STEP_AT[k]), '--fin-end': doneAt(STEP_AT[k] + s.strokes.length - 1) } as CSSProperties}
              >
                <span className="fin-step-n">{String(k + 1).padStart(2, '0')}</span>
                <span>{s.label}</span>
              </li>
            ))}
          </ol>
          <a href={GH} target="_blank" rel="noopener noreferrer" className="btn fin-cta" data-magnetic>
            <span className="fin-cta-star" aria-hidden="true">
              ★
            </span>
            <span>Star on GitHub</span>
            {stars !== null ? <span className="fin-cta-n">{shortCount(stars)}</span> : null}
          </a>
        </div>

        <svg ref={svgRef} className="fin-plate" viewBox="0 0 1000 1000" aria-hidden="true" focusable="false" data-tool="">
          {ALL.map((s, k) => (
            <path
              key={k}
              className={`fin-ink fin-t-${s.tone} fin-w-${s.w}${s.rest ? ' fin-rest' : ''}`}
              stroke="currentColor"
              d={s.d}
            />
          ))}
          {DOTS.map(({ p, i }, k) => (
            <circle key={k} className="fin-fade fin-dot" cx={f(p[0])} cy={f(p[1])} r="4.5" style={at(doneAt(i))} />
          ))}
          {NOTES.map((n) => (
            <text
              key={n.t}
              className={`fin-fade fin-label ${n.cls ?? ''}`}
              x={f(n.x)}
              y={f(n.y)}
              textAnchor={n.anchor ?? 'start'}
              style={at(doneAt(n.i))}
            >
              {n.t}
            </text>
          ))}

          {/* The instruments, placed each frame by placeTools(). */}
          <g className="fin-tool fin-compass">
            <line className="fin-c-needle" />
            <line className="fin-c-pencil" />
            <line className="fin-c-grip" />
            <circle className="fin-c-hinge" r="9" />
            <circle className="fin-c-point" r="3" />
          </g>
          <g className="fin-tool fin-rule">
            <path className="fin-r-body" />
            <path className="fin-r-ticks" />
          </g>
          <g className="fin-tool fin-nib">
            <g transform="rotate(32)">
              <path className="fin-nib-body" d="M0 0 L-9 -24 Q-10 -34 0 -42 Q10 -34 9 -24 Z" />
              <path className="fin-nib-slit" d="M0 -3 V-24" />
              <circle className="fin-nib-hole" cx="0" cy="-27" r="2.6" />
            </g>
          </g>
        </svg>
      </section>
    </ScrollDraw>
  );
}
