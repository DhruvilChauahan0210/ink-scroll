import { DEFAULTS, itemsOf, ROW_PRESETS } from './code';

/**
 * The header drawing: two rows of a marquee seen through the window, before
 * and after one screen of scroll. The window is the frame; outside it the
 * rows carry on, dashed, because they are clipped. Row 1 (left) moves from 0
 * to −distance, row 2 (right) from −distance to 0, the same arithmetic as
 * shiftAt in code.ts, drawn at the generator's default distance scaled to the
 * figure (SCALE figure units per px).
 */

const SCALE = 0.25;
const WIN_X = 150;
const WIN_W = 240;
const CH = 6.6; // figure units per character, mono at 11px
const PAD = 14;
const SHIFT = DEFAULTS.distance * SCALE;
const minus = (n: number) => (n < 0 ? `−${Math.abs(n)}` : String(n));

function Row({ words, x, y, ghost }: { words: string[]; x: number; y: number; ghost?: boolean }) {
  let at = x;
  // Twice, as the markup holds them: the copy runs on past the window.
  const all = [...words, ...words, ...words];
  return (
    <g className={ghost ? 'mqf-ghost' : 'mqf-row'}>
      {all.map((w, i) => {
        const width = w.length * CH + PAD;
        const box = (
          <g key={i}>
            <rect x={at} y={y - 11} width={width} height={22} />
            <text x={at + width / 2} y={y + 4} textAnchor="middle">{w}</text>
          </g>
        );
        at += width + 8;
        return box;
      })}
    </g>
  );
}

export function MarqueeFigure() {
  const r1 = itemsOf(ROW_PRESETS[0]);
  const r2 = itemsOf(ROW_PRESETS[1]);
  const start = WIN_X - 60;
  return (
    <figure className="stk-fig mqf">
      <svg
        viewBox="0 0 520 300"
        role="img"
        aria-label={`Two rows of words seen through a window. After one screen of scroll the first row has moved ${DEFAULTS.distance}px to the left and the second ${DEFAULTS.distance}px to the right; outside the window the rows carry on, clipped.`}
      >
        <defs>
          <clipPath id="mqf-clip"><rect x={WIN_X} y={20} width={WIN_W} height={260} /></clipPath>
          {/* The rows outside the window, kept clear of the dimension on the right. */}
          <clipPath id="mqf-out"><rect x={0} y={20} width={WIN_X + WIN_W + 22} height={260} /></clipPath>
          <marker id="mqf-head" viewBox="0 0 8 8" refX="4" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M1 1 L7 4 L1 7" fill="none" stroke="currentColor" strokeWidth="1.2" />
          </marker>
        </defs>

        <text className="mqf-h" x={WIN_X} y={14}>the window</text>

        {/* Before: at the top of the window's scroll. */}
        <text className="mqf-m" x={8} y={52}>before</text>
        <g clipPath="url(#mqf-out)">
          <Row words={r1} x={start} y={74} ghost />
          <Row words={r2} x={start - SHIFT} y={104} ghost />
          <Row words={r1} x={start - SHIFT} y={204} ghost />
          <Row words={r2} x={start} y={234} ghost />
        </g>
        <g clipPath="url(#mqf-clip)">
          <Row words={r1} x={start} y={74} />
          <Row words={r2} x={start - SHIFT} y={104} />
        </g>

        {/* After one screen of scroll. */}
        <text className="mqf-m" x={8} y={182}>after one screen</text>
        <g clipPath="url(#mqf-clip)">
          <Row words={r1} x={start - SHIFT} y={204} />
          <Row words={r2} x={start} y={234} />
        </g>

        <rect className="mqf-win" x={WIN_X} y={20} width={WIN_W} height={260} />

        {/* The moves. */}
        <path className="mqf-arrow" d={`M${WIN_X + WIN_W / 2 + SHIFT / 2} 150 H${WIN_X + WIN_W / 2 - SHIFT / 2}`} markerEnd="url(#mqf-head)" />
        <text className="mqf-k" x={WIN_X + WIN_W / 2} y={142} textAnchor="middle">row 1 · {minus(-DEFAULTS.distance)}px</text>
        <path className="mqf-arrow" d={`M${WIN_X + WIN_W / 2 - SHIFT / 2} 168 H${WIN_X + WIN_W / 2 + SHIFT / 2}`} markerEnd="url(#mqf-head)" />
        <text className="mqf-k" x={WIN_X + WIN_W / 2} y={184} textAnchor="middle">row 2 · +{DEFAULTS.distance}px</text>

        <path className="mqf-dim" d={`M${WIN_X + WIN_W + 40} 74 V204`} markerStart="url(#mqf-head)" markerEnd="url(#mqf-head)" />
        <text className="mqf-m" transform={`translate(${WIN_X + WIN_W + 58} 139) rotate(90)`} textAnchor="middle">one screen of scroll</text>
      </svg>
      <figcaption className="stk-cap">fig. 1 · {DEFAULTS.distance}px per screen, rows in opposite directions</figcaption>
    </figure>
  );
}
