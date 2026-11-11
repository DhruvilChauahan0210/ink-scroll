/**
 * Fig. 1 — the fill front as progress runs 0 → 1. Each row is the same
 * sentence at one progress p, painted the way the generated CSS paints it: a
 * gradient with a hard stop at p, so everything before p × its length is the
 * filled colour and the rest the unfilled one. The front sits at p × the
 * text's length in reading order: 0.5 is half the text, whatever the scroll
 * distance behind it.
 */

const ROWS = [0, 0.25, 0.5, 0.75, 1];
const SENTENCE = 'Each word lights up as you read it';
const TX = 76;          // where the text starts
const TW = 420;         // and its drawn length
const Y0 = 84;          // first baseline
const DY = 46;          // row pitch
const AXIS = Y0 + (ROWS.length - 1) * DY + 34;

export function FillFigure() {
  return (
    <figure className="stk-fig tff">
      <svg
        viewBox="0 0 520 340"
        role="img"
        aria-label="The same sentence five times, at progress 0, 0.25, 0.5, 0.75 and 1. The filled part grows from the start of the text: at 0.5 the front is half way through it, at 1 the whole sentence is filled."
      >
        <defs>
          {ROWS.map((p, i) => (
            <linearGradient key={p} id={`tff-row-${i}`} gradientUnits="userSpaceOnUse" x1={TX} x2={TX + TW} y1="0" y2="0">
              <stop className="tff-full" offset={p} />
              <stop className="tff-dim" offset={p} />
            </linearGradient>
          ))}
        </defs>

        <text className="tff-code" x={0} y={18}>background-size: calc(p × 100%) 100%</text>
        <text className="tff-k" x={0} y={48}>progress p</text>
        <text className="tff-k" x={TX} y={48}>the text, filled up to p × its length</text>

        {ROWS.map((p, i) => {
          const y = Y0 + i * DY;
          const x = TX + p * TW;
          return (
            <g key={p}>
              <text className="tff-n" x={0} y={y}>{p.toFixed(2)}</text>
              <text className="tff-word" x={TX} y={y} textLength={TW} lengthAdjust="spacingAndGlyphs" fill={`url(#tff-row-${i})`}>
                {SENTENCE}
              </text>
              <g fill="none" stroke="currentColor" strokeWidth="1">
                <line className="tff-rule" x1={TX} x2={TX + TW} y1={y + 10} y2={y + 10} />
                <line className="tff-front" x1={x} x2={x} y1={y - 22} y2={y + 10} strokeWidth="1.5" />
              </g>
              <circle className="tff-dot" cx={x} cy={y - 22} r="2.5" />
            </g>
          );
        })}

        <text className="tff-k" x={TX + 0.5 * TW + 8} y={Y0 + 2 * DY - 24}>← fill front, at p × the length</text>

        <g fill="none" stroke="currentColor" strokeWidth="1">
          <line className="tff-tick" x1={TX} x2={TX + TW} y1={AXIS} y2={AXIS} />
          {[0, 0.5, 1].map((t) => (
            <line key={t} className="tff-tick" x1={TX + t * TW} x2={TX + t * TW} y1={AXIS - 4} y2={AXIS + 4} />
          ))}
        </g>
        {[0, 0.5, 1].map((t) => (
          <text key={t} className="tff-n" x={TX + t * TW} y={AXIS + 18} textAnchor={t === 0 ? 'start' : t === 1 ? 'end' : 'middle'}>
            {t}
          </text>
        ))}
        <text className="tff-k" x={TX + TW / 2} y={AXIS + 36} textAnchor="middle">share of the text filled, in reading order</text>
      </svg>
      <figcaption className="stk-cap">
        Fig. 1 — the fill front at five values of progress. Scrolling sets p, 0 at the start line and 1 at the end line;
        the gradient behind the text is filled up to p × its length.
      </figcaption>
    </figure>
  );
}
