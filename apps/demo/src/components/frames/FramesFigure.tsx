/**
 * How scrollFrames turns a scroll position into a picture, for a sequence of
 * 12 frames. Top: the trigger window on the scroll axis, progress 0 to 1.
 * Middle: the window mapped onto the frames; progress P calls for frame
 * round(P × (count − 1)) (frames/index.ts applyAlpha). Bottom: the order the
 * frames load in (frames/index.ts loadOrder: the first, the last, then the
 * midpoint of every gap, coarse to fine), and what is drawn after four loads:
 * the frame asked for is not in yet, so the nearest loaded one is (nearest()
 * looks one step down before one step up).
 */

const COUNT = 12;
const P = 0.58;
const LOADED = 4;

/** frames/index.ts loadOrder, for the figure. */
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

const AX = 78;
const SX0 = 110;
const SX1 = 410;
const BOX = 30;
const STEP = 36;
const FX = 47;
const R1 = 176;
const R2 = 300;

export function FramesFigure() {
  const order = loadOrder(COUNT);
  const rank = new Map(order.map((f, i) => [f, i + 1]));
  const loaded = new Set(order.slice(0, LOADED));
  const want = Math.round(P * (COUNT - 1));
  let shown = -1;
  for (let d = 0; d < COUNT && shown < 0; d++) {
    if (loaded.has(want - d)) shown = want - d;
    else if (loaded.has(want + d)) shown = want + d;
  }
  const bx = (i: number) => FX + i * STEP;
  const mid = (i: number) => bx(i) + BOX / 2;
  const px = SX0 + P * (SX1 - SX0);

  return (
    <figure className="stk-fig isgf">
      <svg
        viewBox="0 0 520 420"
        role="img"
        aria-label={`The scroll axis with a trigger window from progress 0 to 1, mapped onto a sequence of ${COUNT} frames. Progress ${P} calls for frame ${want}, round(${P} × ${COUNT - 1}). Below, the order the frames load in: ${order.join(', ')}. After ${LOADED} loads frame ${want} is not in yet, so its nearest loaded neighbour, frame ${shown}, is drawn until it arrives.`}
      >
        <text className="isgf-code" x={40} y={24}>scrollFrames(canvas, {'{'} frames, count {'}'})</text>

        <text className="isgf-k" x={40} y={AX - 28}>scroll position · progress</text>
        <g fill="none" stroke="currentColor" strokeWidth="1">
          <line className="isgf-axis" x1={40} x2={480} y1={AX} y2={AX} />
          <line className="isgf-win" x1={SX0} x2={SX1} y1={AX} y2={AX} strokeWidth="4" />
          <line className="isgf-axis" x1={SX0} x2={SX0} y1={AX - 6} y2={AX + 6} />
          <line className="isgf-axis" x1={SX1} x2={SX1} y1={AX - 6} y2={AX + 6} />
          <line className="isgf-map" x1={SX0} y1={AX + 6} x2={mid(0)} y2={R1 - 4} strokeDasharray="2 4" />
          <line className="isgf-map" x1={SX1} y1={AX + 6} x2={mid(COUNT - 1)} y2={R1 - 4} strokeDasharray="2 4" />
          <line className="isgf-now" x1={px} y1={AX} x2={mid(want)} y2={R1 - 4} />
        </g>
        <text className="isgf-s" x={SX0} y={AX + 22} textAnchor="middle">0</text>
        <text className="isgf-s" x={SX1} y={AX + 22} textAnchor="middle">1</text>
        <text className="isgf-l" x={px} y={AX - 10} textAnchor="middle">{P}</text>

        <text className="isgf-k" x={40} y={R1 - 14}>frame = round(progress × (count − 1))</text>
        {Array.from({ length: COUNT }, (_, i) => (
          <g key={i}>
            <rect className={`isgf-frame${i === want ? ' is-target' : ''}`} x={bx(i)} y={R1} width={BOX} height={BOX * 0.7} />
            <text className="isgf-n" x={mid(i)} y={R1 + BOX * 0.7 + 14} textAnchor="middle">{i}</text>
          </g>
        ))}
        <text className="isgf-l" x={40} y={R1 + 58}>round({P} × {COUNT - 1}) = {want}</text>

        <text className="isgf-k" x={40} y={R2 - 30}>load order · after {LOADED} loads</text>
        {Array.from({ length: COUNT }, (_, i) => (
          <g key={i}>
            <rect
              className={`isgf-frame${i === shown ? ' is-shown' : loaded.has(i) ? ' is-loaded' : ''}${i === want ? ' is-target' : ''}`}
              x={bx(i)} y={R2} width={BOX} height={BOX * 0.7}
            />
            <text className="isgf-n" x={mid(i)} y={R2 - 6} textAnchor="middle">{rank.get(i)}</text>
          </g>
        ))}
        <g fill="none" stroke="currentColor" strokeWidth="1.2" className="isgf-arrow">
          <path d={`M${mid(want)} ${R2 + BOX * 0.7 + 6} C${mid(want)} ${R2 + 44} ${mid(shown)} ${R2 + 44} ${mid(shown)} ${R2 + BOX * 0.7 + 8}`} />
          <path d={`M${mid(shown) - 4} ${R2 + BOX * 0.7 + 14} L${mid(shown)} ${R2 + BOX * 0.7 + 7} L${mid(shown) + 4} ${R2 + BOX * 0.7 + 14}`} />
        </g>
        <text className="isgf-l" x={40} y={R2 + 74}>frame {want} not in yet: frame {shown}, the nearest, is drawn</text>
        <text className="isgf-s" x={40} y={R2 + 94}>first, last, then the middle of every gap, {'≤'} 6 at a time</text>
      </svg>
      <figcaption className="stk-cap">
        Fig. 1 · Scroll to frame, and the order the frames arrive in. {COUNT} frames, progress {P}.
      </figcaption>
    </figure>
  );
}
