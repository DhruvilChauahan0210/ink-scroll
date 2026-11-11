import { circlePath, rectPath, type Get, type Segment } from './convert';

/**
 * How a shape becomes a path, drawn by the converter itself: the rect and the
 * circle below are the paths rectPath() and circlePath() write, with their
 * construction lines. A rounded rect is four sides and four quarter arcs,
 * starting rx along the top edge; a circle is two half arcs from its
 * rightmost point. Both run clockwise, as the browser runs the shapes.
 */

const attrs = (o: Record<string, number>): Get => (n) => (n in o ? String(o[n]) : null);

const R = { x: 24, y: 60, width: 184, height: 124, rx: 36 };
const C = { cx: 318, cy: 122, r: 62 };
const rect = rectPath(attrs(R));
const circle = circlePath(attrs(C));

const skeleton = (segs: Segment[]) => segs.map(([c]) => c).join(' ');

export function PathFigure() {
  if (!rect.ok || !circle.ok) return null;
  const { x, y, width: w, height: h, rx: r } = R;
  const k = r * Math.SQRT1_2;
  // Where each corner's A label sits: off the arc's midpoint, outward.
  const corners: [number, number][] = [
    [x + w - r + k + 9, y + r - k - 6],
    [x + w - r + k + 9, y + h - r + k + 13],
    [x + r - k - 9, y + h - r + k + 13],
    [x + r - k - 9, y + r - k - 6],
  ];
  return (
    <figure className="stk-fig s2pf">
      <svg viewBox="0 0 420 240" role="img" aria-label="A rounded rect as a path: M at x plus rx on the top edge, then H, A, V, A, H, A, V, A and Z, clockwise. A circle as a path: M at its rightmost point, then two half arcs and Z.">
        {/* Construction: the top-left corner's circle, its centre and radii; the circle's diameter. */}
        <g className="s2pf-pencil" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 4">
          <circle cx={x + r} cy={y + r} r={r} />
          <line x1={x + r} y1={y + r} x2={x + r} y2={y} />
          <line x1={x + r} y1={y + r} x2={x} y2={y + r} />
          <line x1={C.cx - C.r} y1={C.cy} x2={C.cx + C.r} y2={C.cy} />
        </g>
        <g className="s2pf-pencil" fill="currentColor">
          <circle cx={x + r} cy={y + r} r="1.8" />
          <circle cx={C.cx} cy={C.cy} r="1.8" />
          <circle cx={C.cx - C.r} cy={C.cy} r="2.2" />
        </g>

        {/* The paths, as the converter writes them. */}
        <g className="s2pf-ink" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
          <path d={rect.d} />
          <path d={circle.d} />
          {/* Which way round: right along the top, left along the circle's bottom. */}
          <path d={`M${x + w / 2 + 14} ${y - 5} l6 5 -6 5`} strokeWidth="1.5" />
          <path d={`M${C.cx + 6} ${C.cy + C.r - 5} l-6 5 6 5`} strokeWidth="1.5" />
        </g>
        <g className="s2pf-ink" fill="currentColor">
          <circle cx={x + r} cy={y} r="3.5" />
          <circle cx={C.cx + C.r} cy={C.cy} r="3.5" />
        </g>

        {/* The commands, beside the parts they draw. */}
        <g className="s2pf-cmd" textAnchor="middle">
          <text x={x + r} y={y - 10}>M</text>
          <text x={x + w / 2 - 8} y={y - 8}>H</text>
          <text x={x + w + 11} y={y + h / 2 + 4}>V</text>
          <text x={x + w / 2} y={y + h + 17}>H</text>
          <text x={x - 11} y={y + h / 2 + 4}>V</text>
          {corners.map(([cx, cy], i) => <text key={i} x={cx} y={cy}>A</text>)}
          <text x={C.cx + C.r + 11} y={C.cy + 4}>M</text>
          <text x={C.cx} y={C.cy + C.r + 22}>A · 1</text>
          <text x={C.cx} y={C.cy - C.r - 8}>A · 2</text>
        </g>
        <g className="s2pf-dim">
          <text x={x + r / 2} y={y + r + 13} textAnchor="middle">rx</text>
          <text x={x + r + 5} y={y + r / 2 + 4}>ry</text>
          <text x={C.cx + C.r / 2} y={C.cy - 6} textAnchor="middle">r</text>
        </g>

        <g className="s2pf-k">
          <text x={x} y="22">{'<rect rx="36">'}</text>
          <text x={C.cx - C.r} y="22">{'<circle r="62">'}</text>
        </g>
        <g className="s2pf-d" textAnchor="middle">
          <text x={x + w / 2} y="226">d = {skeleton(rect.segments)}</text>
          <text x={C.cx} y="226">d = {skeleton(circle.segments)}</text>
        </g>
      </svg>
      <figcaption className="stk-cap">
        Fig. 1 — drawn from the converter’s own output. A rounded rect is four sides and four quarter arcs, starting rx
        along the top edge; a circle is two half arcs from its rightmost point. Both run clockwise, as the shapes do.
      </figcaption>
    </figure>
  );
}
