/**
 * Fig. 1 — why the CSS typewriter needs steps(). The line's width over one run
 * of its animation, in ch: a linear ramp grows it smoothly, so most frames cut
 * a letter part way; steps(N) moves it a whole 1ch cell at a time (each jump
 * at the end of its step, steps()'s default), so every frame shows whole
 * letters. Below the plot, the same word at one moment, t, under each.
 */

const WORD = 'typewriter';
const N = WORD.length;
const T = 0.45;

// The plot.
const X0 = 64;
const X1 = 500;
const YT = 48;
const YB = 208;
const x = (t: number) => X0 + t * (X1 - X0);
const y = (k: number) => YB - (k / N) * (YB - YT);

// The two rows of letter cells.
const RX = 150;
const CW = 30;
const ROW_H = 32;
const ROWS = [
  { top: 278, label: 'linear', width: T * N },
  { top: 322, label: `steps(${N})`, width: Math.floor(T * N) },
];

/** The staircase: level k from k/N to (k + 1)/N, then up. */
function stairs(): string {
  let d = `M${x(0)} ${y(0)}`;
  for (let k = 0; k < N; k++) d += ` H${x((k + 1) / N)} V${y(k + 1)}`;
  return d;
}

const fmt = (n: number) => String(+n.toFixed(2));

export function StepsFigure() {
  const ramp = T * N;
  const step = Math.floor(T * N);
  return (
    <figure className="stk-fig typf">
      <svg
        viewBox="0 0 520 364"
        role="img"
        aria-label={`Letters shown against time. A dashed linear ramp rises smoothly from 0 to ${N}; a staircase, steps(${N}), rises one whole letter at a time. At ${T} of the way through, the ramp is at ${fmt(ramp)} and cuts the next letter of “${WORD}” part way; the staircase shows exactly ${step} letters, “${WORD.slice(0, step)}”, and the caret after them.`}
      >
        <defs>
          {ROWS.map((r, i) => (
            <clipPath key={r.label} id={`typf-clip-${i}`}>
              <rect x={RX} y={r.top} width={r.width * CW} height={ROW_H} />
            </clipPath>
          ))}
        </defs>

        <text className="typf-code" x={0} y={14}>{`width: 0 → ${N}ch · animation: typing 1s steps(${N})`}</text>
        <text className="typf-k" x={X0} y={36}>letters shown · the width in ch</text>

        <g fill="none" stroke="currentColor" strokeWidth="1">
          {[0, N / 2, N].map((k) => (
            <line key={k} className="typf-grid" x1={X0} x2={X1} y1={y(k)} y2={y(k)} />
          ))}
          {[0.5, 1].map((t) => (
            <line key={t} className="typf-grid" x1={x(t)} x2={x(t)} y1={YT} y2={YB} />
          ))}
          <line className="typf-axis" x1={X0} x2={X0} y1={YT} y2={YB} />
          <line className="typf-axis" x1={X0} x2={X1} y1={YB} y2={YB} />
          <line className="typf-ramp" x1={x(0)} y1={y(0)} x2={x(1)} y2={y(N)} strokeDasharray="4 4" />
          <path className="typf-step" d={stairs()} strokeWidth="2" />
          <line className="typf-now" x1={x(T)} x2={x(T)} y1={YT} y2={YB} strokeDasharray="1 3" />
        </g>

        {[0, N / 2, N].map((k) => (
          <text key={k} className="typf-n" x={X0 - 10} y={y(k) + 4} textAnchor="end">{k}</text>
        ))}
        {[0, 0.5, 1].map((t) => (
          <text key={t} className="typf-n" x={x(t)} y={YB + 16} textAnchor={t === 0 ? 'start' : t === 1 ? 'end' : 'middle'}>{t}</text>
        ))}
        <text className="typf-k" x={(X0 + X1) / 2} y={YB + 32} textAnchor="middle">time, as a share of the duration</text>

        <text className="typf-k" x={x(0.04)} y={y(7)}>linear: grows smoothly</text>
        <text className="typf-k" x={x(0.6)} y={y(3.2)}>{`steps(${N}): a letter a step`}</text>
        <text className="typf-n" x={x(T) + 6} y={YT + 14}>{`t = ${T}`}</text>

        <circle className="typf-dot is-ramp" cx={x(T)} cy={y(ramp)} r="3.5" strokeWidth="1.5" />
        <circle className="typf-dot" cx={x(T)} cy={y(step)} r="3.5" />
        <text className="typf-n" x={x(T) - 8} y={y(ramp) + 3} textAnchor="end">{`${fmt(ramp)}ch`}</text>
        <text className="typf-n" x={x(T) + 8} y={y(step) + 10}>{`${step}ch`}</text>

        <text className="typf-k" x={0} y={266}>{`at t = ${T}, what each one shows`}</text>
        {ROWS.map((r, i) => (
          <g key={r.label}>
            <text className="typf-n" x={0} y={r.top + 14}>{r.label}</text>
            <text className="typf-k" x={0} y={r.top + 28}>{`width ${fmt(r.width)}ch`}</text>
            <g fill="none" stroke="currentColor" strokeWidth="1">
              {Array.from({ length: N }, (_, c) => (
                <rect key={c} className="typf-cell" x={RX + c * CW} y={r.top} width={CW} height={ROW_H} strokeDasharray="2 3" />
              ))}
            </g>
            <g clipPath={`url(#typf-clip-${i})`}>
              {Array.from(WORD).map((ch, c) => (
                <text key={c} className="typf-ch" x={RX + (c + 0.5) * CW} y={r.top + 22} textAnchor="middle">{ch}</text>
              ))}
            </g>
            {i === 0 ? (
              <line className="typf-edge" x1={RX + r.width * CW} x2={RX + r.width * CW} y1={r.top - 4} y2={r.top + ROW_H + 4} stroke="currentColor" strokeWidth="1" strokeDasharray="3 2" />
            ) : (
              <rect className="typf-caret" x={RX + r.width * CW} y={r.top + 3} width={2.5} height={ROW_H - 6} />
            )}
          </g>
        ))}
      </svg>
      <figcaption className="stk-cap">
        Fig. 1 — the line’s width over one run of the animation. A linear ramp grows it smoothly and, {T} of the way
        through, cuts a letter in half; steps({N}) moves it one 1ch cell at a time, so every frame shows whole letters.
        That staircase is the typewriter.
      </figcaption>
    </figure>
  );
}
