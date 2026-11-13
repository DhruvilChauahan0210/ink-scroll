import { EASING_NAMES, NAMED, curvePath, curveStats, num } from '@/data/easing';

/**
 * Fig. 1 — the seven named easings as small multiples, one shared scale:
 * progress in across (0 → 1), progress out up, with the 0 and 1 lines drawn.
 * Whatever goes above the dashed 1 line is overshoot, inked in the accent.
 * The curves are the library's (copied in data/easing.ts from core/easing.ts).
 *
 * Each cell is its own small SVG in a CSS grid, with its labels in HTML under
 * it: one SVG for the whole grid scaled its text with it, to 6px on a phone.
 * The strokes do not scale (non-scaling-stroke), so they stay hairlines.
 */

const W = 108;
const H = 64;
const LO = -0.15;
const HI = 1.5;
const BOX = { x: 4, y: 4, w: W - 8, h: H - 8 };

const yOf = (v: number) => BOX.y + (1 - (v - LO) / (HI - LO)) * BOX.h;

export function CurvesFigure() {
  const cells = EASING_NAMES.map((name) => {
    const f = NAMED[name];
    const s = curveStats(f);
    // Only where something happens: a peak past 1, or a fall back below it.
    const note = s.max > 1.0005 ? `peak ${num(s.max)}` : s.reaches < 0.99 && s.after < 0.9995 ? `dip ${num(s.after)}` : '';
    return { name, d: curvePath(f, BOX, LO, HI, 200), note };
  });

  return (
    <figure className="stk-fig ezf">
      <div
        className="ezf-grid"
        role="img"
        aria-label="The seven named easings plotted on one scale: linear, ease-in, ease-out and ease-in-out stay between 0 and 1; spring and elastic rise past 1 before settling; bounce reaches 1 and dips back."
      >
        {cells.map((c) => (
          <div key={c.name} className="ezf-cell">
            <svg viewBox={`0 0 ${W} ${H}`} aria-hidden="true" focusable="false">
              <defs>
                {/* Clear of the 1 line by more than the stroke, so a curve that only touches 1 stays ink. */}
                <clipPath id={`ezf-clip-${c.name}`}>
                  <rect x={BOX.x} y={0} width={BOX.w} height={yOf(1) - 2} />
                </clipPath>
                {/* Written once and drawn twice (ink, then the overshoot in the accent): 200 points a curve. */}
                <path id={`ezf-d-${c.name}`} d={c.d} vectorEffect="non-scaling-stroke" />
              </defs>
              <line className="ezf-zero" x1={BOX.x} x2={BOX.x + BOX.w} y1={yOf(0)} y2={yOf(0)} />
              <line className="ezf-one" x1={BOX.x} x2={BOX.x + BOX.w} y1={yOf(1)} y2={yOf(1)} />
              <use className="ezf-curve" href={`#ezf-d-${c.name}`} />
              <use className="ezf-over" href={`#ezf-d-${c.name}`} clipPath={`url(#ezf-clip-${c.name})`} />
            </svg>
            <p className="ezf-lab">
              <span className="ezf-name">{c.name}</span>
              {c.note && <span className="ezf-note">{c.note}</span>}
            </p>
          </div>
        ))}
        <div className="ezf-cell is-key">
          <div className="ezf-keyplot">
            <svg viewBox={`0 0 ${W} ${H}`} aria-hidden="true" focusable="false">
              <line className="ezf-axis" x1={26} x2={BOX.x + BOX.w} y1={yOf(0)} y2={yOf(0)} />
              <line className="ezf-axis" x1={26} x2={26} y1={BOX.y} y2={yOf(0)} />
              <line className="ezf-one" x1={26} x2={BOX.x + BOX.w} y1={yOf(1)} y2={yOf(1)} />
            </svg>
            <span className="ezf-tick" style={{ top: `${(yOf(1) / H) * 100}%` }}>1</span>
            <span className="ezf-tick" style={{ top: `${(yOf(0) / H) * 100}%` }}>0</span>
          </div>
          <p className="ezf-lab">
            <span className="ezf-name">key</span>
            <span className="ezf-note">in → out ↑</span>
          </p>
        </div>
      </div>
      <figcaption className="stk-cap">
        Fig. 1 — the seven named easings on one scale: progress in across, progress out up, dashed at 1. Spring and
        elastic pass 1 before they settle; bounce touches it and falls back.
      </figcaption>
    </figure>
  );
}
