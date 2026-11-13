import './dash.css';

/**
 * The line-drawing post's opening drawing: one triangle with pathLength="1"
 * and stroke-dasharray: 1 2, at three values of stroke-dashoffset. Each shape
 * is drawn by the browser from those exact values, the same as the post's CSS;
 * the tape beside it shows where the dash and the gap sit along the line,
 * whose own length is 0 → 1.
 */

const D = 'M10 70 L60 10 L110 70 Z';
const OFFSETS = [1, 0.5, 0];

/** Tape: a value along the line (−1 … 2) to an x in the tape's viewBox. */
const X = (v: number) => 20 + (v + 1) * 80;

function Tape({ o }: { o: number }) {
  const dashFrom = -o;
  const dashTo = 1 - o;
  const gapTo = Math.min(3 - o, 2);
  return (
    <svg className="df-tape" viewBox="0 0 300 34" aria-hidden="true">
      <rect className="df-win" x={X(0)} y={4} width={X(1) - X(0)} height={14} />
      <line className="df-dash" x1={X(dashFrom)} x2={X(dashTo)} y1={11} y2={11} />
      <line className="df-gap" x1={X(dashTo)} x2={X(gapTo)} y1={11} y2={11} />
      <text className="df-tick" x={X(0)} y={31} textAnchor="middle">0</text>
      <text className="df-tick" x={X(1)} y={31} textAnchor="middle">1</text>
    </svg>
  );
}

export function DashFigure() {
  return (
    <div className="df">
      <div className="df-row df-hd" aria-hidden="true">
        <span>stroke-dashoffset</span>
        <span>What shows</span>
        <span>Dash and gap along the line</span>
      </div>
      {OFFSETS.map((o) => (
        <div key={o} className="df-row">
          <code className="df-k">{o}</code>
          <svg className="df-shape" viewBox="0 0 120 80" role="img" aria-label={o === 1 ? 'Nothing drawn' : o === 0 ? 'The whole triangle drawn' : 'Half the triangle drawn'}>
            <path className="df-ghost" d={D} />
            <path className="df-ink" d={D} pathLength={1} strokeDasharray="1 2" strokeDashoffset={o} />
          </svg>
          <Tape o={o} />
        </div>
      ))}
      <p className="df-key" aria-hidden="true">
        <span><i className="is-dash" />dash, 1 long</span>
        <span><i className="is-gap" />gap, 2 long</span>
        <span><i className="is-win" />the line, 0 → 1</span>
      </p>
    </div>
  );
}
