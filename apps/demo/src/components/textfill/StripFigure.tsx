/**
 * Fig. 2 — why the direction is a choice of box. On an inline <span> the
 * background is laid out as if its lines were one line, end to end (CSS
 * box-decoration-break: slice, the default), so a fill 70% along it is all of
 * line 1 and the start of line 2: reading order. On the block itself the
 * background is one rectangle, so 70% is an upright front through every line.
 * The same p = 0.7 in both, drawn to scale.
 */

const P = 0.7;
const X = 24;
const L1 = 'Words light up one';
const L2 = 'after another';
const CH = 10;                  // drawn width of a character
const W1 = L1.length * CH;      // 180
const W2 = L2.length * CH;      // 130
const STRIP = W1 + W2;          // the strip, end to end
const FILL = P * STRIP;         // how much of it is filled
const IN2 = FILL - W1;          // of which on line 2
const NOTE_X = 372;

export function StripFigure() {
  const front = X + P * W1;     // the block's front: 70% of its width
  return (
    <figure className="stk-fig tff tff-body">
      <svg
        viewBox="0 0 520 316"
        role="img"
        aria-label={`Two lines of text at progress ${P}. On an inline span, the fill runs along both lines as one strip: all of line 1 and the start of line 2. On the block, one upright front crosses both lines at ${P * 100}% of its width.`}
      >
        <defs>
          <linearGradient id="tff-s1" gradientUnits="userSpaceOnUse" x1={X} x2={X + W1} y1="0" y2="0">
            <stop className="tff-full" offset={Math.min(1, FILL / W1)} />
            <stop className="tff-dim" offset={Math.min(1, FILL / W1)} />
          </linearGradient>
          <linearGradient id="tff-s2" gradientUnits="userSpaceOnUse" x1={X} x2={X + W2} y1="0" y2="0">
            <stop className="tff-full" offset={IN2 / W2} />
            <stop className="tff-dim" offset={IN2 / W2} />
          </linearGradient>
          <linearGradient id="tff-b" gradientUnits="userSpaceOnUse" x1={X} x2={X + W1} y1="0" y2="0">
            <stop className="tff-full" offset={P} />
            <stop className="tff-dim" offset={P} />
          </linearGradient>
        </defs>

        {/* ── An inline span: one strip ─────────────────────────────── */}
        <text className="tff-code" x={0} y={16}>{'<p><span>…</span></p>'} · reading order</text>
        <text className="tff-word is-small" x={X} y={54} textLength={W1} lengthAdjust="spacingAndGlyphs" fill="url(#tff-s1)">{L1}</text>
        <text className="tff-word is-small" x={X} y={82} textLength={W2} lengthAdjust="spacingAndGlyphs" fill="url(#tff-s2)">{L2}</text>

        <g fill="none" stroke="currentColor" strokeWidth="1">
          {/* The strip: line 1 then line 2, laid end to end. */}
          <rect className="tff-strip" x={X} y={112} width={STRIP} height={10} />
          <line className="tff-strip" x1={X + W1} x2={X + W1} y1={106} y2={128} strokeDasharray="2 3" />
          {/* Where its pieces come from. */}
          <path className="tff-path" d={`M${X + W1} 106 V60`} strokeDasharray="2 3" />
          <path className="tff-path" d={`M${X + FILL} 112 L${X + IN2} 88`} strokeDasharray="2 3" />
          <line className="tff-front" x1={X + FILL} x2={X + FILL} y1={104} y2={130} strokeWidth="1.5" />
          <line className="tff-front" x1={X + IN2} x2={X + IN2} y1={66} y2={88} strokeWidth="1.5" />
        </g>
        <rect className="tff-dot" x={X} y={112} width={FILL} height={10} />
        <text className="tff-k" x={X + W1 / 2} y={142} textAnchor="middle">line 1</text>
        <text className="tff-k" x={X + W1 + W2 / 2} y={142} textAnchor="middle">line 2</text>
        <text className="tff-n" x={X} y={158}>0</text>
        <text className="tff-n" x={X + FILL} y={158} textAnchor="middle">p = {P}</text>
        <text className="tff-n" x={X + STRIP} y={158} textAnchor="end">1</text>

        <text className="tff-n" x={NOTE_X} y={50}>display: inline</text>
        <text className="tff-k" x={NOTE_X} y={66}>{P * 100}% of the strip:</text>
        <text className="tff-k" x={NOTE_X} y={80}>all of line 1, then</text>
        <text className="tff-k" x={NOTE_X} y={94}>{Math.round(IN2)} of line 2’s {W2}</text>

        {/* ── The block: one rectangle ──────────────────────────────── */}
        <text className="tff-code" x={0} y={196}>{'<p>…</p>'} · left to right</text>
        <g fill="none" stroke="currentColor" strokeWidth="1">
          <rect className="tff-box" x={X} y={214} width={W1} height={80} strokeDasharray="3 3" />
          <line className="tff-front" x1={front} x2={front} y1={208} y2={300} strokeWidth="1.5" />
        </g>
        <text className="tff-word is-small" x={X} y={246} textLength={W1} lengthAdjust="spacingAndGlyphs" fill="url(#tff-b)">{L1}</text>
        <text className="tff-word is-small" x={X} y={274} textLength={W2} lengthAdjust="spacingAndGlyphs" fill="url(#tff-b)">{L2}</text>
        <text className="tff-n" x={front + 6} y={210}>p = {P}</text>

        <text className="tff-n" x={NOTE_X} y={242}>display: block</text>
        <text className="tff-k" x={NOTE_X} y={258}>{P * 100}% of its width,</text>
        <text className="tff-k" x={NOTE_X} y={272}>on every line at once</text>
      </svg>
      <figcaption className="stk-cap">
        Fig. 2 — the same progress, {P}, on the two boxes. An inline span’s background runs through its lines as one
        strip; a block’s is one rectangle.
      </figcaption>
    </figure>
  );
}
