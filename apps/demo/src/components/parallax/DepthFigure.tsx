import { screenRate } from '@/data/parallax';

/**
 * Parallax seen side on: one scroll of Δ, four layers, four distances. A
 * layer moves up the screen with the page, plus scrollParallax's own travel,
 * speed × its height spread over its trigger window (window + layer of
 * scroll), so for the same scroll it covers Δ × (1 + speed × H ÷ (V + H)).
 * Drawn with every layer as tall as the window (H = V), which makes that
 * 1 + speed ÷ 2: the arrows are that arithmetic, from screenRate in
 * data/parallax.ts, not drawn by eye.
 */

const LAYERS = [
  { name: 'front', speed: 0.6 },
  { name: 'page', speed: 0 },
  { name: 'hills', speed: -0.4 },
  { name: 'sky', speed: -0.8 },
];
const X = [204, 290, 376, 462];
const BEFORE = 214;
const DELTA = 100;
const TOP = 40;
const BOTTOM = 252;
const minus = (n: number) => (n < 0 ? `−${Math.abs(n)}` : String(n));

export function DepthFigure() {
  return (
    <figure className="stk-fig plxf">
      <svg
        viewBox="0 0 520 300"
        role="img"
        aria-label="Four layers seen from the side after the same scroll: the front layer at speed 0.6 moves 1.3 times the scroll, the page at speed 0 moves with it, hills at −0.4 move 0.8 times and the sky at −0.8 moves 0.6 times."
      >
        <defs>
          <marker id="plxf-head" viewBox="0 0 8 8" refX="4" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path className="plxf-ink" d="M1 1 L7 4 L1 7" fill="none" stroke="currentColor" strokeWidth="1.2" />
          </marker>
          <marker id="plxf-head-g" viewBox="0 0 8 8" refX="4" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path className="plxf-guide" d="M1 1 L7 4 L1 7" fill="none" stroke="currentColor" strokeWidth="1.2" />
          </marker>
        </defs>

        {/* The reader: an eye, its sight lines to the window's edges. */}
        <g className="plxf-guide" fill="none" stroke="currentColor" strokeWidth="1">
          <path d="M18 146 Q32 134 46 146 Q32 158 18 146 Z" />
          <line x1="48" y1="146" x2="70" y2={TOP + 8} strokeDasharray="2 3" />
          <line x1="48" y1="146" x2="70" y2={BOTTOM - 4} strokeDasharray="2 3" />
          <line x1="100" x2="490" y1={BEFORE} y2={BEFORE} strokeDasharray="3 4" />
          {X.map((x) => <line key={x} x1={x} x2={x} y1={TOP} y2={BOTTOM} strokeDasharray="1 4" />)}
        </g>
        <circle className="plxf-ink" cx="32" cy="146" r="3" fill="currentColor" />

        {/* The window: V tall. */}
        <g className="plxf-ink" fill="none" stroke="currentColor" strokeWidth="1.2">
          <path d={`M66 ${TOP + 8} H74 M70 ${TOP + 8} V${BOTTOM - 4} M66 ${BOTTOM - 4} H74`} />
        </g>
        <text className="plxf-k" x="70" y={TOP - 2} textAnchor="middle">window</text>
        <text className="plxf-k" x="80" y="150">V</text>

        {/* The scroll: Δ. */}
        <line className="plxf-ink" x1="112" x2="112" y1={BEFORE - 4} y2={BEFORE - DELTA + 4} stroke="currentColor" strokeWidth="1.6" markerEnd="url(#plxf-head)" />
        <text className="plxf-k" x="120" y={BEFORE - DELTA / 2 + 4}>scroll Δ</text>
        <text className="plxf-n" x="164" y="274" textAnchor="end">speed</text>
        <text className="plxf-n" x="164" y="290" textAnchor="end">layer</text>

        {LAYERS.map((l, i) => {
          const k = screenRate(l.speed, 1, 1);
          const after = BEFORE - DELTA * k;
          const x = X[i];
          return (
            <g key={l.name}>
              <circle className="plxf-guide" cx={x} cy={BEFORE} r="4.5" fill="none" stroke="currentColor" strokeWidth="1" />
              <line className="plxf-ink" x1={x} x2={x} y1={BEFORE - 7} y2={after + 8} stroke="currentColor" strokeWidth="1.6" markerEnd="url(#plxf-head)" />
              <circle className="plxf-ink" cx={x} cy={after} r="4.5" fill="currentColor" />
              <text className="plxf-v" x={x + 10} y={after + 4}>{k.toFixed(1)}Δ</text>
              <text className="plxf-k" x={x} y="274" textAnchor="middle">{minus(l.speed)}</text>
              <text className="plxf-n" x={x} y="290" textAnchor="middle">{l.name}</text>
            </g>
          );
        })}

        <text className="plxf-n" x={X[0]} y="20" textAnchor="middle">near</text>
        <text className="plxf-n" x={X[3]} y="20" textAnchor="middle">far</text>
        <line className="plxf-guide" x1={X[0] + 20} x2={X[3] - 20} y1="16" y2="16" stroke="currentColor" strokeWidth="1" markerStart="url(#plxf-head-g)" markerEnd="url(#plxf-head-g)" />
      </svg>
      <figcaption className="stk-cap">
        Fig. 1 — one scroll, four layers seen side on. Each moves Δ × (1 + speed × H ÷ (V + H)) up the screen, H its
        height and V the window’s. Drawn with layers as tall as the window: 1 + speed ÷ 2.
      </figcaption>
    </figure>
  );
}
