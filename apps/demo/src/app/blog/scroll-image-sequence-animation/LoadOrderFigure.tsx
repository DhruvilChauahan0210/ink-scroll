import './load-order.css';

/**
 * The image-sequence post's opening drawing: the order scrollFrames fetches a
 * 9-frame sequence in, and what a reader parked at frame WANTED sees after each
 * load. Every cell is computed, nothing is typed: loadOrder() is
 * packages/svg-scroll-draw/src/frames/index.ts loadOrder (not exported, so
 * repeated here, as components/frames/FramesFigure.tsx does), and nearest() is
 * the same file's nearest(): one step down is tried before one step up.
 */

const COUNT = 9;
const WANTED = 5;

/** frames/index.ts loadOrder: the first, the last, then every gap's midpoint, coarse to fine. */
function loadOrder(n: number): number[] {
  const order = n > 1 ? [0, n - 1] : [0];
  const gaps: [number, number][] = [[0, n - 1]];
  for (let g = 0; g < gaps.length; g++) {
    const [lo, hi] = gaps[g];
    if (hi - lo < 2) continue;
    const mid = (lo + hi) >> 1;
    order.push(mid);
    gaps.push([lo, mid], [mid, hi]);
  }
  return order;
}

/** frames/index.ts nearest: the loaded frame closest to `i`, searching outward. */
function nearest(i: number, loaded: Set<number>): number {
  for (let d = 0; d < COUNT; d++) {
    if (loaded.has(i - d)) return i - d;
    if (loaded.has(i + d)) return i + d;
  }
  return -1;
}

const ORD = ['1st', '2nd', '3rd'];
const ordinal = (k: number) => ORD[k - 1] ?? `${k}th`;

export function LoadOrderFigure() {
  const order = loadOrder(COUNT);
  const frames = Array.from({ length: COUNT }, (_, i) => i);
  const rows = order.map((f, k) => {
    const loaded = new Set(order.slice(0, k + 1));
    return { f, k: k + 1, loaded, shown: nearest(WANTED, loaded) };
  });
  const exactAt = rows.find((r) => r.shown === WANTED)?.k ?? COUNT;
  const progress = WANTED / (COUNT - 1);

  return (
    <div
      className="lo"
      role="img"
      aria-label={`The order scrollFrames loads ${COUNT} frames in: ${order.join(', ')}. A reader whose scroll calls for frame ${WANTED} sees ${rows
        .map((r) => `frame ${r.shown} after load ${r.k}`)
        .join(', ')}: the nearest loaded frame until frame ${WANTED} itself arrives, on load ${exactAt}.`}
    >
      <div className="lo-row lo-axis">
        <span className="lo-l">Frame</span>
        <span className="lo-cells">
          {frames.map((i) => (
            <span key={i} className={i === WANTED ? 'is-want' : undefined}>{i}</span>
          ))}
        </span>
        <span className="lo-r">Drawn</span>
      </div>
      {rows.map((r) => (
        <div key={r.k} className="lo-row">
          <span className="lo-l">
            {ordinal(r.k)} load <b>{r.f}</b>
          </span>
          <span className="lo-cells">
            {frames.map((i) => (
              <i
                key={i}
                className={[
                  r.loaded.has(i) ? 'is-in' : '',
                  i === r.f ? 'is-new' : '',
                  i === r.shown ? 'is-shown' : '',
                  i === WANTED ? 'is-col' : '',
                ].filter(Boolean).join(' ') || undefined}
              />
            ))}
          </span>
          <span className={`lo-r${r.shown === WANTED ? ' is-exact' : ''}`}>{r.shown}</span>
        </div>
      ))}
      <p className="lo-key">
        <span><i className="is-in" />loaded</span>
        <span><i className="is-in is-new" />this load</span>
        <span><i className="is-shown" />drawn at progress {progress} (frame {WANTED})</span>
      </p>
    </div>
  );
}
