import { NAMED, curveStats, num, type EasingName } from '@/data/easing';

/**
 * Fig. 2 — easing as a remapping. Each row has two scales on one ruler: the
 * progress in (top, the scroll, in ten equal steps) and the progress out
 * (bottom). A connector joins each step to where the easing sends it, so
 * linear's are all upright, ease-out's crowd towards the end, and spring's
 * cross past 1 and come back. The values are the library's curves
 * (data/easing.ts, copied from core/easing.ts).
 *
 * Each row's SVG has no viewBox: x is a percentage of its width and y is in
 * pixels, so the labels stay at their CSS size at any width (a scaled SVG
 * drew them at 18px on a desktop and 7px on a phone). The names are HTML,
 * beside the rows on a wide screen and above them on a phone.
 */

const ROWS: EasingName[] = ['linear', 'ease-out', 'spring'];
const LO = -0.05;
const HI = 1.45;
const TOP = 22;
const BOT = 62;
const H = 80;
const STEPS = 10;

const xOf = (v: number) => `${(((v - LO) / (HI - LO)) * 100).toFixed(3)}%`;

export function RemapFigure() {
  return (
    <figure className="stk-fig ezm">
      <div
        className="ezm-rows"
        role="img"
        aria-label="Ten equal steps of progress in, joined to where linear, ease-out and spring send them: linear keeps them evenly spaced, ease-out bunches them near 1, spring carries some past 1."
      >
        {ROWS.map((name, r) => {
          const f = NAMED[name];
          const steps = Array.from({ length: STEPS + 1 }, (_, i) => i / STEPS);
          const far = Math.max(...steps.map(f));
          const peak = curveStats(f).max;
          return (
            <div key={name} className="ezm-row">
              <span className="ezm-name">{name}</span>
              <svg className="ezm-svg" width="100%" height={H} aria-hidden="true" focusable="false">
                <line className="ezm-rule" x1={xOf(0)} x2={xOf(1)} y1={TOP} y2={TOP} />
                <line className="ezm-rule" x1={xOf(LO)} x2={xOf(HI)} y1={BOT} y2={BOT} />
                <line className="ezm-one" x1={xOf(1)} x2={xOf(1)} y1={TOP - 6} y2={BOT + 6} />
                {steps.map((t) => (
                  <g key={t}>
                    <line className="ezm-tick" x1={xOf(t)} x2={xOf(t)} y1={TOP - 4} y2={TOP} />
                    <line className={f(t) > 1.0005 ? 'ezm-link is-over' : 'ezm-link'} x1={xOf(t)} x2={xOf(f(t))} y1={TOP} y2={BOT} />
                    <circle className="ezm-dot" cx={xOf(f(t))} cy={BOT} r={1.8} />
                  </g>
                ))}
                {r === 0 && (
                  <>
                    <text className="ezm-axis" x={xOf(0)} y={TOP - 9} textAnchor="middle">0</text>
                    <text className="ezm-axis" x={xOf(0.5)} y={TOP - 9} textAnchor="middle">in · equal steps</text>
                    <text className="ezm-axis" x={xOf(1)} y={TOP - 9} textAnchor="middle">1</text>
                  </>
                )}
                <text className="ezm-axis" x="100%" y={BOT + 16} textAnchor="end">
                  {far > 1.0005 ? `out · steps reach ${num(far)}, the curve ${num(peak)}` : 'out'}
                </text>
              </svg>
            </div>
          );
        })}
      </div>
      <figcaption className="stk-cap">
        Fig. 2 — ten equal steps of scroll in, and where each easing sends them out. The upright line is 1, the end.
      </figcaption>
    </figure>
  );
}
