import { maxStagger } from '@/data/text-effects';

/**
 * How stagger divides one scroll window between the pieces: each word gets
 * its own slice of the 0 → 1 progress, starting `stagger` after the one
 * before, all ending by 1. The slices are scrollText's own maths (unitAlpha in
 * packages/svg-scroll-draw/src/text/index.ts): piece i runs from i × stagger
 * to i × stagger + (1 − (n − 1) × stagger).
 */

const WORDS = ['Every', 'word', 'arrives', 'as', 'you', 'scroll'];
const STAGGER = 0.1;
const W = 520;
const ROW = 30;
const LEFT = 92;
const SPAN = W - LEFT - 12;

export function StaggerFigure() {
  const n = WORDS.length;
  const length = 1 - (n - 1) * STAGGER;
  const h = n * ROW + 44;
  return (
    <figure className="stk-fig tgf">
      <svg viewBox={`0 0 ${W} ${h}`} role="img" aria-label={`Each of ${n} words gets its own slice of the scroll progress, ${STAGGER} apart.`}>
        <g fill="none" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke">
          {[0, 0.25, 0.5, 0.75, 1].map((t) => (
            <line key={t} className="tgf-grid" x1={LEFT + t * SPAN} x2={LEFT + t * SPAN} y1={8} y2={n * ROW + 8} />
          ))}
          {WORDS.map((w, i) => {
            const a = i * STAGGER;
            const y = i * ROW + 8 + ROW / 2;
            return (
              <g key={w}>
                <line className="tgf-track" x1={LEFT} x2={LEFT + SPAN} y1={y} y2={y} />
                <line className="tgf-slice" x1={LEFT + a * SPAN} x2={LEFT + (a + length) * SPAN} y1={y} y2={y} />
              </g>
            );
          })}
        </g>
        {WORDS.map((w, i) => (
          <text key={w} className="tgf-word" x={LEFT - 12} y={i * ROW + 8 + ROW / 2 + 4} textAnchor="end">{w}</text>
        ))}
        {[0, 0.5, 1].map((t) => (
          <text key={t} className="tgf-axis" x={LEFT + t * SPAN} y={n * ROW + 30} textAnchor="middle">{t}</text>
        ))}
      </svg>
      <figcaption className="stk-cap">
        Fig. 1 — stagger {STAGGER}: each word animates over its own slice of the scroll, {STAGGER} after the last.
        With {n} words the most it can be is {maxStagger(n).toFixed(1)}.
      </figcaption>
    </figure>
  );
}
