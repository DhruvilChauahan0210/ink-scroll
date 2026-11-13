import './once.css';

/**
 * The CSS-only animate-on-scroll post's opening drawing: one card, one reader
 * who scrolls it in, stops, and scrolls back, and what each kind of reveal in
 * the post does meanwhile.
 *
 * - view(): progress is a position, so it follows the scroll both ways. The
 *   card's range is modelled as the stretch of scroll from RANGE[0] to RANGE[1].
 * - observer + class: the class lands once, when the scroll first passes
 *   THRESHOLD, and a TRANSITION_S ease-out transition plays on the clock
 *   (the post's once.css: `transition: … 0.6s ease-out`). Nothing undoes it.
 */

const T = 10; // seconds shown
const RANGE: [number, number] = [0.25, 0.75];
const THRESHOLD = 0.3;
const TRANSITION_S = 0.6;
const STEPS = 200;

const smooth = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
/** The reader: scrolls down from 0.5 s to 4 s, stops, scrolls back from 6 s to 9.5 s. */
const scroll = (t: number) => (t < 6 ? smooth((t - 0.5) / 3.5) : 1 - smooth((t - 6) / 3.5));
const clamp = (v: number) => Math.min(1, Math.max(0, v));

/** CSS ease-out, cubic-bezier(0, 0, 0.58, 1), solved for y at x by bisection. */
function easeOut(x: number) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  // The first control point is (0, 0), so its terms drop out of both.
  const bx = (s: number) => 3 * (1 - s) * s * s * 0.58 + s * s * s;
  const by = (s: number) => 3 * (1 - s) * s * s + s * s * s;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (bx(mid) < x) lo = mid;
    else hi = mid;
  }
  return by((lo + hi) / 2);
}

const times = Array.from({ length: STEPS + 1 }, (_, i) => (i / STEPS) * T);
let t0 = T;
for (const t of times) if (scroll(t) >= THRESHOLD) { t0 = t; break; }

const ROWS: { key: string; label: string; sub: string; value: (t: number) => number; cls: string; mark?: boolean }[] = [
  { key: 'scroll', label: 'The reader', sub: 'scroll position', value: scroll, cls: 'pof-scroll', mark: true },
  {
    key: 'view',
    label: 'view()',
    sub: 'follows the scroll',
    value: (t) => clamp((scroll(t) - RANGE[0]) / (RANGE[1] - RANGE[0])),
    cls: 'pof-view',
  },
  {
    key: 'once',
    label: 'Observer + class',
    sub: 'plays once, stays',
    value: (t) => easeOut((t - t0) / TRANSITION_S),
    cls: 'pof-once',
    mark: true,
  },
];

const pts = (f: (t: number) => number) =>
  times.map((t) => `${((t / T) * 1000).toFixed(1)},${(92 - f(t) * 84).toFixed(1)}`).join(' ');
const markX = ((t0 / T) * 1000).toFixed(1);

export function OnceFigure() {
  return (
    <div className="pof">
      <div className="pof-row pof-phases" aria-hidden="true">
        <span className="pof-l" />
        <span className="pof-track pof-ph">
          <span style={{ left: '0%', width: '40%' }}><i>scrolls </i>down</span>
          <span style={{ left: '40%', width: '20%' }}>stops</span>
          <span style={{ left: '60%', width: '40%' }}><i>scrolls </i>back up</span>
        </span>
      </div>
      {ROWS.map((r) => (
        <div key={r.key} className="pof-row">
          <span className="pof-l">
            <b>{r.label}</b>
            <span>{r.sub}</span>
          </span>
          <span className="pof-track">
            <svg viewBox="0 0 1000 100" preserveAspectRatio="none" aria-hidden="true">
              <path d="M0 92 H1000" className="pof-base" />
              <path d="M0 8 H1000" className="pof-base" />
              {r.mark ? <path d={`M${markX} 0 V100`} className="pof-mark" /> : null}
              <polyline points={pts(r.value)} className={r.cls} />
            </svg>
          </span>
        </div>
      ))}
      <p className="pof-key" aria-hidden="true">
        <span><i className="is-mark" />the card first reaches the observer’s line</span>
        <span>top of each track: fully shown</span>
      </p>
    </div>
  );
}
