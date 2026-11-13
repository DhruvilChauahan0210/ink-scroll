import './curve.css';
import { easeOut } from '@/data/counter';

/**
 * The number-counter post's opening drawing: the number countUp in the post
 * shows over its 2 s, counting to 12,400, with the post's easeOut, t × (2 − t)
 * (the curve svg-scroll-draw calls ease-out, EASINGS['ease-out'] in
 * core/easing.ts, imported here from data/counter.ts), against linear. Every
 * point and every number below is worked out from that function.
 */

const TO = 12400;
const DURATION_MS = 2000;
const MARKS = [500, 1000, 1500, 2000];
const nf = new Intl.NumberFormat('en-US');

// A 1000 × 1000 box stretched to the plot; the strokes do not scale.
const pt = (t: number, v: number) => `${(t * 1000).toFixed(1)},${(1000 - v * 1000).toFixed(1)}`;
const STEPS = Array.from({ length: 41 }, (_, i) => i / 40);
const EASED = STEPS.map((t) => pt(t, easeOut(t))).join(' ');
const LINEAR = `${pt(0, 0)} ${pt(1, 1)}`;

export function CurveFigure() {
  const half = easeOut(0.5);
  return (
    <div className="nc">
      <div className="nc-chart">
        <div className="nc-y" aria-hidden="true">
          <span>{nf.format(TO)}</span>
          <span>{nf.format(TO / 2)}</span>
          <span>0</span>
        </div>
        <div className="nc-plot">
          <svg viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">
            {[250, 500, 750].map((y) => <path key={`h${y}`} d={`M0 ${y} H1000`} className="nc-grid" />)}
            {[250, 500, 750].map((x) => <path key={`v${x}`} d={`M${x} 0 V1000`} className="nc-grid" />)}
            <polyline points={LINEAR} className="nc-lin" />
            <polyline points={EASED} className="nc-ease" />
          </svg>
          {MARKS.slice(0, 3).map((ms) => {
            const t = ms / DURATION_MS;
            return (
              <span key={ms} aria-hidden="true">
                <i className="nc-dot is-lin" style={{ left: `${t * 100}%`, bottom: `${t * 100}%` }} />
                <i className="nc-dot is-ease" style={{ left: `${t * 100}%`, bottom: `${easeOut(t) * 100}%` }} />
              </span>
            );
          })}
          <span className="nc-note" style={{ left: '50%', bottom: `${half * 100}%` }} aria-hidden="true">
            {nf.format(TO * half)} at 1 s
          </span>
        </div>
      </div>
      <div className="nc-x" aria-hidden="true">
        {[0, 500, 1000, 1500, 2000].map((ms) => (
          <span key={ms} style={{ left: `${(ms / DURATION_MS) * 100}%` }}>{ms === 0 ? '0' : `${ms / 1000} s`}</span>
        ))}
      </div>
      <table className="nc-table">
        <thead>
          <tr>
            <th scope="col">Time</th>
            {MARKS.map((ms) => <th key={ms} scope="col">{ms / 1000} s</th>)}
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row"><i className="nc-key is-ease" />easeOut</th>
            {MARKS.map((ms) => <td key={ms}>{nf.format(Math.round(TO * easeOut(ms / DURATION_MS)))}</td>)}
          </tr>
          <tr>
            <th scope="row"><i className="nc-key is-lin" />linear</th>
            {MARKS.map((ms) => <td key={ms}>{nf.format(Math.round((TO * ms) / DURATION_MS))}</td>)}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
