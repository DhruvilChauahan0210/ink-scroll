import { polygonPath } from './pin-code';

/**
 * What scrollPin builds, drawn to scale on one page. The wrapper it adds is the
 * panel's height plus pinDistance. The pin line is `top` px below the window's
 * top; the pin starts when the wrapper's top reaches it and ends pinDistance
 * later, when the panel's bottom meets the wrapper's. On the right, the same
 * stretch of scroll as progress 0 → 1, cut into four equal steps, and the
 * callbacks at its two ends (pin/index.ts: update() and setState()).
 */

const X0 = 72;        // the wrapper's sides
const X1 = 204;
const Y0 = 76;        // the wrapper's top: the pin starts here
const PANEL = 60;
const DIST = 240;     // pinDistance, to scale
const TOP = 28;       // the `top` option, to scale
const VIEW = 184;     // the window's height, to scale
const STEPS = 4;
const P = 0.4;        // where the drawing catches it
const AX = 300;       // the progress axis
const LX = 310;       // its labels

const yAt = (p: number) => Y0 + p * DIST;

export function TrackFigure() {
  const pin = yAt(P);
  const winTop = pin - TOP;
  const end = yAt(1);
  const bottom = end + PANEL;
  const step = Math.min(STEPS - 1, Math.floor(P * STEPS));
  return (
    <figure className="stk-fig spnf">
      <svg
        viewBox="0 0 520 432"
        role="img"
        aria-label="A tall wrapper as high as the panel plus the pin distance. The panel sits at its top before the pin, held by position fixed under the window’s top while pinned, and at its bottom after. On the right the pin distance runs from progress 0 to 1 in four equal steps, with onEnter and onLeaveBack at 0 and onLeave and onEnterBack at 1."
      >
        <text className="spnf-code" x={X0 - 20} y={24}>scrollPin(stage, {'{'} top, pinDistance {'}'})</text>
        <text className="spnf-k" x={X0} y={Y0 - 10}>wrapper · added by scrollPin</text>

        <g fill="none" stroke="currentColor" strokeWidth="1">
          {/* The wrapper: panel + pinDistance tall, in the page's flow. */}
          <rect className="spnf-wrap" x={X0} y={Y0} width={X1 - X0} height={DIST + PANEL} />

          {/* Where the panel sits before the pin and after it. */}
          <rect className="spnf-ghost" x={X0 + 6} y={Y0 + 4} width={X1 - X0 - 12} height={PANEL - 8} strokeDasharray="3 4" />
          <rect className="spnf-ghost" x={X0 + 6} y={end + 4} width={X1 - X0 - 12} height={PANEL - 8} strokeDasharray="3 4" />

          {/* The window, part way through: its header is `top` tall. */}
          <rect className="spnf-head" x={X0 - 14} y={winTop} width={X1 - X0 + 28} height={TOP} />
          <rect className="spnf-win" x={X0 - 14} y={winTop} width={X1 - X0 + 28} height={VIEW} />
          <line className="spnf-win" x1={X0 - 14} x2={X1 + 14} y1={pin} y2={pin} />

          {/* pinDistance: from the panel's place before to its place after. */}
          <line className="spnf-dim" x1={X0 - 32} x2={X0 - 32} y1={Y0 + 3} y2={end - 3} />
          <path className="spnf-dim" d={`M${X0 - 36} ${Y0 + 9} L${X0 - 32} ${Y0 + 2} L${X0 - 28} ${Y0 + 9}`} />
          <path className="spnf-dim" d={`M${X0 - 36} ${end - 9} L${X0 - 32} ${end - 2} L${X0 - 28} ${end - 9}`} />
          <line className="spnf-dim" x1={X0 - 38} x2={X0 - 26} y1={Y0} y2={Y0} />
          <line className="spnf-dim" x1={X0 - 38} x2={X0 - 26} y1={end} y2={end} />

          {/* top: from the window's top to the pin line. */}
          <line className="spnf-dim" x1={X1 + 26} x2={X1 + 26} y1={winTop + 2} y2={pin - 2} />
          <line className="spnf-dim" x1={X1 + 20} x2={X1 + 32} y1={winTop} y2={winTop} />

          {/* The pin line, carried across to the progress axis. */}
          <line className="spnf-pin" x1={X1 + 14} x2={AX} y1={pin} y2={pin} strokeDasharray="5 4" />
          <line className="spnf-start" x1={X1} x2={AX} y1={Y0} y2={Y0} strokeDasharray="2 4" />
          <line className="spnf-start" x1={X1} x2={AX} y1={end} y2={end} strokeDasharray="2 4" />

          {/* Progress: the pin distance in equal steps. */}
          <line className="spnf-axis" x1={AX} x2={AX} y1={Y0} y2={end} />
          {Array.from({ length: STEPS + 1 }, (_, k) => (
            <line key={k} className="spnf-axis" x1={AX - 5} x2={AX + 5} y1={yAt(k / STEPS)} y2={yAt(k / STEPS)} />
          ))}
          <line className="spnf-now" x1={AX} x2={AX} y1={yAt(step / STEPS)} y2={yAt((step + 1) / STEPS)} />
        </g>

        {/* The panel, pinned: position fixed, `top` below the window's top. */}
        <rect className="spnf-panel" x={X0 + 6} y={pin} width={X1 - X0 - 12} height={PANEL} />
        <path className="spnf-shape" d={polygonPath(step + 3, 17, 0)} transform={`translate(${X0 + 34} ${pin + PANEL / 2})`} />
        <text className="spnf-in" x={X0 + 62} y={pin + 25}>step {step + 1}</text>
        <text className="spnf-in-s" x={X0 + 62} y={pin + 42}>fixed</text>
        <circle className="spnf-dot" cx={AX} cy={pin} r="3.5" />

        <text className="spnf-in-s" x={X0 + 12} y={Y0 + PANEL / 2 + 4}>before · in flow</text>
        <text className="spnf-in-s" x={X0 + 12} y={end + PANEL / 2 + 4}>after · bottom 0</text>
        <text className="spnf-k" x={X0 - 14} y={winTop - 6}>window</text>
        <text className="spnf-k" x={X0 - 8} y={pin - 9}>header</text>
        <text className="spnf-n" x={X1 + 34} y={winTop + TOP / 2 + 4}>top</text>
        <text className="spnf-n" transform={`translate(${X0 - 42} ${(Y0 + end) / 2}) rotate(-90)`} textAnchor="middle">pinDistance</text>

        <text className="spnf-l" x={LX} y={Y0 - 4}>progress 0 · pin starts</text>
        <text className="spnf-s" x={LX} y={Y0 + 13}>onEnter ↓ · onLeaveBack ↑</text>
        {Array.from({ length: STEPS }, (_, k) => (
          <text key={k} className={k === step ? 'spnf-l' : 'spnf-s'} x={LX} y={yAt((k + 0.5) / STEPS) + 4}>
            step {k + 1}{k === step ? ` · progress ${P}` : ''}
          </text>
        ))}
        <text className="spnf-l" x={LX} y={end - 4}>progress 1 · pin ends</text>
        <text className="spnf-s" x={LX} y={end + 13}>onLeave ↓ · onEnterBack ↑</text>

        <text className="spnf-s" x={X0 - 14} y={bottom + 24}>wrapper = panel + pinDistance tall</text>
        <text className="spnf-f" x={X0 - 14} y={bottom + 44}>progress = (top − wrapper’s top) ÷ pinDistance</text>
      </svg>
      <figcaption className="stk-cap">
        Fig. 1 — scrollPin wraps the panel in a div as tall as the panel plus pinDistance. The panel is fixed under
        the pin line for that stretch of scroll, and onProgress reports it as 0 to 1: four steps, a quarter each.
      </figcaption>
    </figure>
  );
}
