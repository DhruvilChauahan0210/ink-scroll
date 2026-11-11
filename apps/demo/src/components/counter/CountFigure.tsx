import { COUNTER_DEFAULTS, easeOut } from '@/data/counter';

/**
 * How the number follows the scroll. On the left, the window: the count is at
 * 0 when the element's top crosses 80% of it and at 1 when it reaches 20%
 * (the trigger defaults in counter/index.ts). On the right, the same height
 * read as progress, and the number it shows: from + (to − from) ×
 * ease(progress), as update() writes it. The two share their vertical axis, so
 * the element's top, drawn half way, points straight at its number.
 *
 * 360 units wide, so the 10px labels are 9.7px on a 390px phone; the two
 * guide lines are named at the plot's end, which keeps the window narrow.
 */

const TO = 12400;
const P = 0.5;
const nf = new Intl.NumberFormat('en-US');

// The window, and the progress axis that shares its height.
const WIN = { x: 8, y: 20, w: 66, h: 240 };
// The element, its top on the progress line.
const BOX = { x: 13, w: 54, h: 34 };
const yAt = (frac: number) => WIN.y + frac * WIN.h;
const Y0 = yAt(0.8);
const Y1 = yAt(0.2);
const yOf = (p: number) => Y0 + (Y1 - Y0) * p;

// The value axis.
const X0 = 116;
const X1 = 354;
const xOf = (v: number) => X0 + (X1 - X0) * v;
const BASE = 240;
// Lines across the progress labels break around them.
const GAP = 88;
// The scroll arrow, between the window and the progress labels.
const ARROW = 81;

const CURVE = Array.from({ length: 41 }, (_, i) => i / 40)
  .map((p) => `${xOf(easeOut(p)).toFixed(1)},${yOf(p).toFixed(1)}`)
  .join(' ');

export function CountFigure() {
  const yP = yOf(P);
  const xEase = xOf(easeOut(P));
  const xLin = xOf(P);
  const shown = nf.format(TO * easeOut(P));
  const ticks = [
    { x: X0, v: '0', anchor: 'start' },
    { x: xLin, v: nf.format(TO * P), anchor: 'middle' },
    { x: xEase, v: shown, anchor: 'middle' },
    { x: X1, v: nf.format(TO), anchor: 'end' },
  ] as const;

  return (
    <figure className="stk-fig ctrf">
      <svg
        viewBox="0 0 360 290"
        role="img"
        aria-label={`A counter to ${nf.format(TO)}. Its element's top is half way between 80% and 20% of the window, so progress is ${P}; with ease-out the number shown is ${shown}, where linear would show ${nf.format(TO * P)}.`}
      >
        <g fill="none" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke">
          <rect className="ctrf-frame" x={WIN.x} y={WIN.y} width={WIN.w} height={WIN.h} />
          {[Y0, Y1].map((y) => (
            <path key={y} className="ctrf-guide" d={`M${WIN.x} ${y} H${GAP} M${X0} ${y} H${X1}`} strokeDasharray="2 4" />
          ))}
          <rect className="ctrf-box" x={BOX.x} y={yP} width={BOX.w} height={BOX.h} />
          <path className="ctrf-link" d={`M${ARROW} ${yP + BOX.h + 2} V${yP + 6} M${ARROW - 5} ${yP + 12} L${ARROW} ${yP + 6} L${ARROW + 5} ${yP + 12}`} />

          <line className="ctrf-axis" x1={X0} x2={X0} y1={Y1} y2={Y0} />
          <line className="ctrf-axis" x1={X0} x2={X1} y1={BASE} y2={BASE} />
          {ticks.map((t) => <line key={t.x} className="ctrf-axis" x1={t.x} x2={t.x} y1={BASE - 4} y2={BASE + 4} />)}

          <line className="ctrf-lin" x1={X0} y1={Y0} x2={X1} y2={Y1} strokeDasharray="4 4" />
          <polyline className="ctrf-curve" points={CURVE} strokeWidth="2" />

          <path className="ctrf-link" d={`M${BOX.x + BOX.w} ${yP} H${GAP} M${X0} ${yP} H${xEase}`} strokeDasharray="3 3" />
          <line className="ctrf-lin" x1={xLin} x2={xLin} y1={yP} y2={BASE} strokeDasharray="3 3" />
          <line className="ctrf-link" x1={xEase} x2={xEase} y1={yP} y2={BASE} strokeDasharray="3 3" />
        </g>
        <circle className="ctrf-ring" cx={xLin} cy={yP} r={3} />
        <circle className="ctrf-dot" cx={xEase} cy={yP} r={3.5} />

        <text className="ctrf-n" x={WIN.x} y={12}>window</text>
        <text className="ctrf-num" x={BOX.x + BOX.w / 2} y={yP + 22} textAnchor="middle">{shown}</text>

        <text className="ctrf-n" x={X0} y={Y1 - 16} textAnchor="middle">progress</text>
        <text className="ctrf-n" x={X1} y={Y1 - 6} textAnchor="end">end · {COUNTER_DEFAULTS.end}</text>
        <text className="ctrf-n" x={X0 + 8} y={Y0 + 15}>start · {COUNTER_DEFAULTS.start}</text>
        <text className="ctrf-n" x={X0 - 6} y={Y1 + 4} textAnchor="end">1</text>
        <text className="ctrf-n" x={X0 - 6} y={yP + 4} textAnchor="end">{P}</text>
        <text className="ctrf-n" x={X0 - 6} y={Y0 + 4} textAnchor="end">0</text>
        <text className="ctrf-k" x={xEase + 8} y={yP + 22}>ease-out</text>
        <text className="ctrf-n" x={xOf(0.78) - 10} y={yOf(0.78) - 8} textAnchor="end">linear</text>

        {ticks.map((t) => (
          <text key={t.x} className="ctrf-n" x={t.x} y={BASE + 18} textAnchor={t.anchor}>{t.v}</text>
        ))}
        <text className="ctrf-k" x={WIN.x} y={284}>value = from + (to − from) × ease(progress)</text>
      </svg>
      <figcaption className="stk-cap">
        Fig. 1 — progress is 0 when the element’s top crosses {COUNTER_DEFAULTS.start.replace('top ', '')} of the
        window and 1 at {COUNTER_DEFAULTS.end.replace('top ', '')}. Half way, ease-out already shows {shown} of{' '}
        {nf.format(TO)}; linear would show {nf.format(TO * P)}.
      </figcaption>
    </figure>
  );
}
