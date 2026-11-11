import { FILLS, type Fill } from '@/data/keyframes';
import {
  cyclePath, cyclePoints, easingFn, fillsAfter, fillsBefore, firstFrame, lastFrame, reversedAt, spanOf, type Settings,
} from './code';

/**
 * Fig. 1 — one CSS animation laid out on a time axis, drawn from the
 * generator's own timeline maths (spanOf, reversedAt, firstFrame, lastFrame in
 * ./code): a delay, then three cycles of `alternate`, each eased by
 * ease-in-out, plotted as the keyframe offset reached (0% to 100%) against
 * time. Above it, the dimensions the properties set; below it, the four fill
 * modes, inked where the keyframes apply: always during the cycles, during the
 * delay with backwards or both, after the end with forwards or both.
 */

const FIG: Pick<Settings, 'delay' | 'duration' | 'iterations' | 'direction' | 'fill' | 'timing'> = {
  delay: 600,
  duration: 700,
  iterations: 3,
  direction: 'alternate',
  fill: 'both',
  timing: 'ease-in-out',
};

const W = 480;
const L = 44;
const R = 12;
const PW = W - L - R;
const PLOT = { top: 60, h: 84 };
const AXIS = PLOT.top + PLOT.h + 8;
const LANES = { top: 212, pitch: 28 };
const H = LANES.top + FILLS.length * LANES.pitch + 4;

export function TimelineFigure() {
  const sp = spanOf(FIG);
  const x = (t: number) => L + (t / sp.total) * PW;
  const y = (v: number) => PLOT.top + (1 - v) * PLOT.h;
  const fn = easingFn(FIG.timing);
  const end = sp.delay + sp.active;
  const first = firstFrame(FIG.direction);
  const last = lastFrame(sp.count, FIG.direction);
  const cycles = Array.from({ length: sp.count }, (_, i) => {
    const t0 = sp.delay + i * sp.duration;
    const back = reversedAt(i, FIG.direction);
    return {
      i,
      t0,
      back,
      d: cyclePath(cyclePoints(fn, back), x(t0), x(t0 + sp.duration) - x(t0), PLOT.top, PLOT.h),
    };
  });
  const ticks = [0, ...cycles.map((c) => c.t0), end];

  return (
    <figure className="stk-fig kfgf">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`A CSS animation on a time axis: a ${sp.delay} ms delay, then ${sp.count} cycles of ${sp.duration} ms with direction ${FIG.direction}, so the keyframe offset runs 0 to 100%, back to 0 and up again. Fill both holds the ${first}% frame during the delay and the ${last}% frame after the end. Below, the four fill modes: none applies the keyframes only during the cycles, forwards adds the time after, backwards the delay, both adds both.`}
      >
        {/* The two phases outside the cycles. */}
        <rect className="kfgf-zone" x={x(0)} y={PLOT.top} width={x(sp.delay) - x(0)} height={PLOT.h} />
        <rect className="kfgf-zone" x={x(end)} y={PLOT.top} width={x(sp.total) - x(end)} height={PLOT.h} />
        <text className="kfgf-t kfgf-dim" x={x(sp.delay / 2)} y={PLOT.top + 16} textAnchor="middle">before</text>
        <text className="kfgf-t kfgf-dim" x={x((end + sp.total) / 2)} y={PLOT.top + PLOT.h - 8} textAnchor="middle">after</text>

        {/* Dimensions: the delay, one cycle's duration, the count. */}
        <g className="kfgf-dimline">
          <Dim x1={x(0)} x2={x(sp.delay)} y={26} label="delay" />
          <Dim x1={x(sp.delay)} x2={x(sp.delay + sp.duration)} y={26} label="duration" />
          <Dim x1={x(sp.delay)} x2={x(end)} y={48} label={`iteration-count: ${sp.count}`} />
        </g>

        {/* The plot: 0% and 100% rules, cycle boundaries, the eased cycles, the held frames. */}
        <g fill="none" strokeWidth="1">
          <line className="kfgf-rule" x1={L} x2={W - R} y1={y(1)} y2={y(1)} />
          <line className="kfgf-rule" x1={L} x2={W - R} y1={y(0)} y2={y(0)} />
          {cycles.slice(1).map((c) => (
            <line key={c.i} className="kfgf-rule" x1={x(c.t0)} x2={x(c.t0)} y1={PLOT.top} y2={PLOT.top + PLOT.h} />
          ))}
          {cycles.map((c) => <path key={c.i} className="kfgf-ink" d={c.d} />)}
          {fillsBefore(FIG.fill) && <line className="kfgf-ink" x1={x(0)} x2={x(sp.delay)} y1={y(first / 100)} y2={y(first / 100)} />}
          {fillsAfter(FIG.fill) && <line className="kfgf-ink" x1={x(end)} x2={x(sp.total)} y1={y(last / 100)} y2={y(last / 100)} />}
        </g>
        {cycles.map((c) => (
          <text
            key={c.i}
            className="kfgf-t"
            x={x(c.t0) + 6}
            y={c.back ? PLOT.top + PLOT.h - 7 : PLOT.top + 15}
          >
            {c.i + 1}
          </text>
        ))}
        <text className="kfgf-t kfgf-dim" x={L - 6} y={y(1) + 4} textAnchor="end">100%</text>
        <text className="kfgf-t kfgf-dim" x={L - 6} y={y(0) + 4} textAnchor="end">0%</text>

        {/* The time axis, in ms. */}
        <line className="kfgf-axis" x1={L} x2={W - R} y1={AXIS} y2={AXIS} />
        {ticks.map((t) => (
          <g key={t}>
            <line className="kfgf-axis" x1={x(t)} x2={x(t)} y1={AXIS} y2={AXIS + 4} />
            <text className="kfgf-t kfgf-dim" x={x(t)} y={AXIS + 17} textAnchor="middle">{t}</text>
          </g>
        ))}
        <text className="kfgf-t kfgf-dim" x={W - R} y={AXIS + 17} textAnchor="end">ms</text>

        {/* The four fill modes: where the keyframes apply. */}
        <text className="kfgf-t kfgf-dim" x={L} y={LANES.top - 20}>animation-fill-mode</text>
        {FILLS.map((f, i) => <Lane key={f} fill={f} top={LANES.top + i * LANES.pitch} x={x} delay={sp.delay} end={end} total={sp.total} />)}
      </svg>
      <figcaption className="stk-cap">
        Fig. 1 — delay {sp.delay} ms, duration {sp.duration} ms, {sp.count} cycles, {FIG.direction}, fill {FIG.fill}: the
        keyframe offset over time. Below, where each fill mode applies the keyframes.
      </figcaption>
    </figure>
  );
}

/** A dimension line: end ticks, the span, and its name above it. */
function Dim({ x1, x2, y, label }: { x1: number; x2: number; y: number; label: string }) {
  return (
    <g>
      <line x1={x1} x2={x2} y1={y} y2={y} />
      <line x1={x1} x2={x1} y1={y - 4} y2={y + 4} />
      <line x1={x2} x2={x2} y1={y - 4} y2={y + 4} />
      <text className="kfgf-t" x={(x1 + x2) / 2} y={y - 6} textAnchor="middle">{label}</text>
    </g>
  );
}

function Lane({ fill, top, x, delay, end, total }: { fill: Fill; top: number; x: (t: number) => number; delay: number; end: number; total: number }) {
  const bar = top + 11;
  return (
    <g>
      <text className="kfgf-t" x={L} y={top}>{fill}</text>
      <line className="kfgf-track" x1={x(0)} x2={x(total)} y1={bar} y2={bar} />
      <line className="kfgf-bar" x1={x(fillsBefore(fill) ? 0 : delay)} x2={x(fillsAfter(fill) ? total : end)} y1={bar} y2={bar} />
    </g>
  );
}
