/**
 * Stacking cards, drawn to scale on one window. Each card is sticky `step`
 * lower than the one before; the covered ones are narrower and darker, and
 * the next one is on its way up. On the right, the scroll past the list's top
 * cut into equal stretches of LAND = height + gap − step: card i is covered
 * over the i-th of them, and the last card over none (stack-code.ts).
 */

const WX0 = 40;       // the window's sides
const WX1 = 236;
const WY0 = 56;       // the window's top
const WH = 300;       // its height
const TOP = 30;       // the `top` setting, to scale
const STEP = 14;      // `step`, to scale
const CARD = 150;     // a card's height, to scale
const SHRINK = 0.06;  // how much a covered card is narrower, per card covered
const AX = 300;       // the scroll axis
const AY0 = 74;       // its zero: the list's top at the window's top
const SEG = 62;       // one LAND, to scale
const CARDS = 4;
const NOW = 1.55;     // where the drawing catches it, in LANDs

export function StackFigure() {
  const w = WX1 - WX0 - 24;
  const cx = (WX0 + WX1) / 2;
  // Cards 0 and 1 are in; card 2 is half way up onto card 1.
  const stuck = [0, 1].map((i) => {
    const covered = i === 0 ? 1 : NOW - 1;
    const k = 1 - SHRINK * covered;
    return { i, y: WY0 + TOP + i * STEP, w: w * k, under: covered > 0.5 };
  });
  const comingY = WY0 + TOP + 2 * STEP + (1 - (NOW - 1)) * (CARD - STEP);
  const nowY = AY0 + NOW * SEG;
  return (
    <figure className="stk-fig scgf">
      <svg
        viewBox="0 0 520 432"
        role="img"
        aria-label="A window with a header. Card 1 is stuck just under the header, card 2 is stuck one step lower, over it, and card 3 slides up from below onto card 2. The covered cards are narrower. On the right, the scroll past the list's top is cut into equal stretches, one per card: card 1 is covered over the first, card 2 over the second, card 3 over the third, and the last card over none."
      >
        <text className="scgf-code" x={WX0 - 16} y={24}>position: sticky; top: top + i × step</text>

        {/* The window, its header `top` tall. */}
        <rect className="scgf-head" x={WX0} y={WY0} width={WX1 - WX0} height={TOP} />
        <rect className="scgf-win" x={WX0} y={WY0} width={WX1 - WX0} height={WH} />
        <text className="scgf-s" x={WX0} y={WY0 - 8}>window</text>
        <text className="scgf-s" x={WX0 + 8} y={WY0 + TOP / 2 + 4}>header</text>

        {/* The stuck cards, each one step lower and drawn over the last. */}
        {stuck.map((c) => (
          <g key={c.i}>
            <rect className={`scgf-card${c.under ? ' is-under' : ''}`} x={cx - c.w / 2} y={c.y} width={c.w} height={CARD} rx="8" />
            <text className={c.under ? 'scgf-s' : 'scgf-l'} x={cx - c.w / 2 + 10} y={c.y + 11}>card {c.i + 1}</text>
          </g>
        ))}
        {/* The next one, on its way up. */}
        <rect className="scgf-card is-coming" x={WX0 + 12} y={comingY} width={w} height={CARD} rx="8" />
        <text className="scgf-l" x={WX0 + 22} y={comingY + 18}>card 3 ↑</text>
        <text className="scgf-s" x={WX0 + 22} y={comingY + 34}>lands at top + 2 × step</text>

        {/* top and step. */}
        <g className="scgf-dim">
          <line x1={WX0 - 14} x2={WX0 - 14} y1={WY0 + 2} y2={WY0 + TOP - 2} />
          <line x1={WX0 - 20} x2={WX0 - 8} y1={WY0} y2={WY0} />
          <line x1={WX0 - 20} x2={WX0 - 8} y1={WY0 + TOP} y2={WY0 + TOP} />
          <line x1={WX1 + 10} x2={WX1 + 22} y1={WY0 + TOP} y2={WY0 + TOP} />
          <line x1={WX1 + 10} x2={WX1 + 22} y1={WY0 + TOP + STEP} y2={WY0 + TOP + STEP} />
          <line x1={WX1 + 16} x2={WX1 + 16} y1={WY0 + TOP + 2} y2={WY0 + TOP + STEP - 2} />
        </g>
        <text className="scgf-n" transform={`translate(${WX0 - 20} ${WY0 + TOP / 2}) rotate(-90)`} textAnchor="middle">top</text>
        <text className="scgf-n" x={WX1 + 26} y={WY0 + TOP + STEP / 2 + 4}>step</text>

        {/* The scroll past the list's top, one stretch per card. */}
        <line className="scgf-axis" x1={AX} x2={AX} y1={AY0 - 8} y2={AY0 + CARDS * SEG} />
        <text className="scgf-l" x={AX - 6} y={AY0 - 18}>scroll past the list’s top</text>
        {Array.from({ length: CARDS }, (_, i) => {
          const y0 = AY0 + i * SEG;
          const last = i === CARDS - 1;
          const on = !last && NOW > i;
          return (
            <g key={i}>
              <line className="scgf-axis" x1={AX - 5} x2={AX + 5} y1={y0} y2={y0} />
              {!last && <line className={on ? 'scgf-win-on' : 'scgf-win-off'} x1={AX + 14} x2={AX + 14} y1={y0 + 3} y2={y0 + SEG - 3} />}
              <text className="scgf-s" x={AX + 24} y={y0 + 4}>{i} × LAND</text>
              <text className={on ? 'scgf-l' : 'scgf-n'} x={AX + 24} y={y0 + SEG / 2 + 4}>
                {last ? `card ${i + 1}: never covered` : `card ${i + 1} covered 0 → 1`}
              </text>
            </g>
          );
        })}
        <line className="scgf-now" x1={AX - 10} x2={AX + 18} y1={nowY} y2={nowY} />
        <text className="scgf-n" x={AX - 14} y={nowY + 4} textAnchor="end">now</text>

        <text className="scgf-s" x={WX0 - 16} y={WY0 + WH + 30}>LAND = card height + gap − step</text>
        <text className="scgf-n" x={WX0 - 16} y={WY0 + WH + 50}>scale = 1 − scale × cover · brightness = 1 − dim × cover</text>
      </svg>
      <figcaption className="stk-cap">
        Fig. 1 — every card sticks one step lower than the last. The scroll between one card sticking and the next
        landing on it is the same for every card, so each one is covered over its own equal stretch.
      </figcaption>
    </figure>
  );
}
