import './curves.css';
import { CSS_KEYWORDS, bezierRange, fmt, type Bezier } from '@/components/bezier/bezier';
import { presetByKey } from '@/components/bezier/presets';

/**
 * The cubic-bezier post's opening drawing: six easings drawn from their own
 * four numbers. Each curve is an SVG cubic path whose control points are P1
 * and P2, which is the same Bézier the browser eases with, so nothing here is
 * sampled or typed. The values come from the cubic-bezier generator's data
 * (components/bezier/bezier.ts and presets.ts).
 *
 * Every panel shares one vertical scale, from the lowest to the highest
 * progress any of the six curves reaches. Handles that point further out
 * than that are cut at the panel's edge; their numbers are under the curve.
 */

const back = (key: string): Bezier => {
  const p = presetByKey(key);
  if (!p) throw new Error(`no preset ${key}`);
  return p.v;
};

const CURVES: { name: string; v: Bezier }[] = [
  { name: 'ease', v: CSS_KEYWORDS.ease },
  { name: 'ease-in', v: CSS_KEYWORDS['ease-in'] },
  { name: 'ease-out', v: CSS_KEYWORDS['ease-out'] },
  { name: 'ease-in-out', v: CSS_KEYWORDS['ease-in-out'] },
  { name: 'easeOutBack', v: back('named:easeOutBack') },
  { name: 'easeInOutBack', v: back('named:easeInOutBack') },
];

const PAD = 0.08;
const ranges = CURVES.map((c) => bezierRange(c.v, 2000));
const LO = Math.min(...ranges.map((r) => r.min)) - PAD;
const HI = Math.max(...ranges.map((r) => r.max)) + PAD;

// Panel units: 100 per unit of time across and of progress up.
const U = 100;
const X0 = -6;
const W = U + 12;
const H = (HI - LO) * U;
const px = (x: number) => (x * U).toFixed(2);
const py = (y: number) => ((HI - y) * U).toFixed(2);
const pt = (x: number, y: number) => `${px(x)} ${py(y)}`;

export function CurvesFigure() {
  return (
    <div className="cbf">
      <ul className="cbf-grid">
        {CURVES.map(({ name, v }) => {
          const [x1, y1, x2, y2] = v;
          return (
            <li key={name} className="cbf-cell">
              <svg viewBox={`${X0} 0 ${W} ${H.toFixed(2)}`} aria-hidden="true">
                <path className="cbf-unit" d={`M${pt(0, 0)} H${px(1)} M${pt(0, 1)} H${px(1)} M${pt(0, 0)} V${py(1)} M${pt(1, 0)} V${py(1)}`} />
                <path className="cbf-lin" d={`M${pt(0, 0)} L${pt(1, 1)}`} />
                <path className="cbf-arm" d={`M${pt(0, 0)} L${pt(x1, y1)} M${pt(1, 1)} L${pt(x2, y2)}`} />
                <path className="cbf-curve" d={`M${pt(0, 0)} C${pt(x1, y1)} ${pt(x2, y2)} ${pt(1, 1)}`} />
                <circle className="cbf-p" cx={px(x1)} cy={py(y1)} r="3.2" />
                <circle className="cbf-p" cx={px(x2)} cy={py(y2)} r="3.2" />
              </svg>
              <p className="cbf-name">{name}</p>
              <p className="cbf-v">{v.map(fmt).join(', ')}</p>
            </li>
          );
        })}
      </ul>
      <p className="cbf-key" aria-hidden="true">
        <span><i className="is-curve" />the curve</span>
        <span><i className="is-arm" />P0 → P1 and P3 → P2</span>
        <span><i className="is-lin" />linear</span>
      </p>
    </div>
  );
}
