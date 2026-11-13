import { fmt } from '@/components/linedraw/generate';
import { strokeD } from './code';
import { layout } from './layout';

/**
 * Fig. 1 — why the tool uses a single-stroke font.
 *
 * Top: what a line-drawing animation does to an outline font. Its letters are
 * filled shapes, and the stroke follows their edge, so every line of the word
 * comes out twice. (Drawn here as a wide stroke with a narrower one in the
 * page colour on top: the same two edges an outline glyph has.)
 *
 * Below: the same word in the Hershey script the tool uses, each path the
 * pen's centre line, with a dot where the pen goes down.
 */
const WORD = 'writing';
/** The figure is drawn 440 wide, like the line drawing generator's, so its 11px labels read near 11px. */
const W = 440;
const PAD = 14;
const LABEL = 22;
/** As large as fits the width, the outline's 9px stroke included. */
const SIZE = Math.min(96, Math.floor((32 * (W - PAD * 2 - 10)) / layout(WORD, 'script', 32).box.w));
const laid = layout(WORD, 'script', SIZE);
const ROW = Math.ceil(laid.box.h + LABEL + PAD * 2);
const dx = (W - laid.box.w) / 2 - laid.box.x;
const dy = (row: number) => row * ROW + LABEL + PAD - laid.box.y;

export function HandwritingFigure() {
  const paths = (row: number) => laid.strokes.map((s) => strokeD(s.pts, dx, dy(row)));
  const outline = paths(0);
  const single = paths(1);
  return (
    <figure className="hwgf">
      <svg viewBox={`0 0 ${W} ${ROW * 2}`} role="img" aria-labelledby="hwgf-t">
        <title id="hwgf-t">{`The word ${WORD} as an outline font, traced as two lines along each edge, and in a single-stroke font, each stroke drawn once in writing order, with a dot where the pen goes down`}</title>
        <text className="hwgf-k" x={PAD} y={16}>outline font · both edges traced</text>
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <g className="hwgf-ink" stroke="currentColor" strokeWidth={9}>
            {outline.map((d, i) => <path key={i} d={d} />)}
          </g>
          <g className="hwgf-hole" stroke="currentColor" strokeWidth={6}>
            {outline.map((d, i) => <path key={i} d={d} />)}
          </g>
        </g>
        <text className="hwgf-k" x={PAD} y={ROW + 16}>single stroke · each line once, in order</text>
        <g className="hwgf-ink" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          {single.map((d, i) => <path key={i} d={d} />)}
        </g>
        {laid.strokes.map((s, i) => (
          <circle key={i} className="hwgf-dot" cx={fmt(s.pts[0][0] + dx, 2)} cy={fmt(s.pts[0][1] + dy(1), 2)} r={3.5} />
        ))}
      </svg>
      <figcaption>{`Fig. 1 — ${laid.strokes.length} strokes in Hershey’s script, each drawn once from its dot, in writing order; an outline font traces every line twice.`}</figcaption>
    </figure>
  );
}
