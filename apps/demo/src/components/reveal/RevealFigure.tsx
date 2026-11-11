import { REVEAL_DEFAULTS, REVEAL_FROM, easeOut } from '@/data/reveal';

/**
 * One card through scrollReveal's default reveal, in three windows. The
 * dashed lines are the trigger window: progress 0 when the card's top is on
 * the start line (88% down the window), 1 on the end line (53%). The dotted
 * box is the card's place in the layout, which never moves and is what the
 * window is measured from; the solid card is what is painted, offset by the
 * fadeUp start state and faded by the eased progress. Every number is read
 * from data/reveal.ts, which mirrors packages/svg-scroll-draw/src/reveal/index.ts.
 */

const W = 452;
const LEFT = 50;
const FW = 120;
const GAP = 16;
const FT = 14;
const FH = 214;
const CW = 78;
const CH = 44;
/** Figure units per CSS pixel of offset: drawn larger than life so 32px reads. */
const K = 0.5;

const Y0 = REVEAL_FROM.fadeUp.y ?? 0;
const START = REVEAL_DEFAULTS.start;
const END = REVEAL_DEFAULTS.end;
const lineY = (pct: number) => FT + (FH * pct) / 100;

const STATES = [0, 0.5, 1].map((t) => {
  const alpha = easeOut(t);
  const y = +(Y0 * (1 - alpha)).toFixed(2);
  return { t, alpha, y };
});

export function RevealFigure() {
  const sY = lineY(START);
  const eY = lineY(END);
  return (
    <figure className="stk-fig srgf">
      <svg
        viewBox={`0 0 ${W} 306`}
        role="img"
        aria-label={`A card in three windows: at the ${START}% line it is ${Y0}px low and transparent, half way it is ${STATES[1].y}px low at opacity ${STATES[1].alpha}, at the ${END}% line it is in place.`}
      >
        <defs>
          {STATES.map((_, i) => (
            <clipPath key={i} id={`srgf-win-${i}`}>
              <rect x={LEFT + i * (FW + GAP)} y={FT} width={FW} height={FH} />
            </clipPath>
          ))}
        </defs>

        {/* The trigger lines' names, once, on the left. */}
        <g>
          <text className="srgf-pct" x={LEFT - 8} y={sY + 3.5} textAnchor="end">{START}%</text>
          <text className="srgf-sub" x={LEFT - 8} y={sY + 17} textAnchor="end">start</text>
          <text className="srgf-pct" x={LEFT - 8} y={eY + 3.5} textAnchor="end">{END}%</text>
          <text className="srgf-sub" x={LEFT - 8} y={eY + 17} textAnchor="end">end</text>
        </g>

        {STATES.map((s, i) => {
          const fx = LEFT + i * (FW + GAP);
          const top = sY + (eY - sY) * s.t;
          const painted = top + s.y * K;
          const cx = fx + 14;
          const dimX = cx + CW + 9;
          return (
            <g key={s.t}>
              <rect className="srgf-frame" x={fx} y={FT} width={FW} height={FH} />
              {i === 0 && <text className="srgf-sub" x={fx + 8} y={FT + 14}>window</text>}
              <line className="srgf-trig" x1={fx} x2={fx + FW} y1={sY} y2={sY} />
              <line className="srgf-trig" x1={fx} x2={fx + FW} y1={eY} y2={eY} />

              <g clipPath={`url(#srgf-win-${i})`}>
                {/* Its place in the layout. */}
                <rect className="srgf-place" x={cx} y={top} width={CW} height={CH} />
                {/* What is painted: offset by y, faded by the progress. */}
                <g className={s.alpha === 0 ? 'srgf-ghost' : 'srgf-card'} opacity={s.alpha === 0 ? 1 : s.alpha}>
                  <rect className="srgf-body" x={cx} y={painted} width={CW} height={CH} />
                  <rect className="srgf-thumb" x={cx + 6} y={painted + 6} width={CW - 12} height={18} />
                  <line className="srgf-text" x1={cx + 6} x2={cx + 50} y1={painted + 31} y2={painted + 31} />
                  <line className="srgf-text" x1={cx + 6} x2={cx + 36} y1={painted + 38} y2={painted + 38} />
                </g>
                {s.y > 0 && (
                  <g className="srgf-dim">
                    <line x1={dimX} x2={dimX} y1={top} y2={painted} />
                    <line x1={dimX - 3} x2={dimX + 3} y1={top} y2={top} />
                    <line x1={dimX - 3} x2={dimX + 3} y1={painted} y2={painted} />
                  </g>
                )}
              </g>
              {s.y > 0 && (
                <text className="srgf-dimk" x={dimX + 5} y={(top + painted) / 2 + 3.5}>{s.y}</text>
              )}

              <text className="srgf-n" x={fx} y={FT + FH + 20}>progress {s.t}</text>
              <text className="srgf-sub" x={fx} y={FT + FH + 36}>
                {s.t === 0.5 ? `ease-out → ${s.alpha}` : s.t === 0 ? `top at ${START}%` : `top at ${END}%`}
              </text>
              <text className="srgf-sub" x={fx} y={FT + FH + 51}>y {s.y}px</text>
              <text className="srgf-sub" x={fx} y={FT + FH + 66}>opacity {s.alpha}</text>
            </g>
          );
        })}
      </svg>
      <figcaption className="stk-cap">
        Fig. 1 — fadeUp, the default: a card starts {Y0}px low and transparent when its top crosses {START}% of the
        window, and is in place by {END}%. The dotted box is where it sits in the layout, and the window is measured
        from there.
      </figcaption>
    </figure>
  );
}
