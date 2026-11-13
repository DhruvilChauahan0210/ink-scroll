import './when.css';

/**
 * The React scroll animation post's opening drawing: where each of the post's
 * listings animates, read along one axis, the card's top edge as a share of
 * the screen's height (100% is the bottom edge, 0% the top). The card is a
 * fifth of the screen tall (CARD_H), which only the two rows measured by the
 * card's own size depend on. Every number here is the listing's own, and
 * the post's harness measures them in three browsers:
 *
 *   CSS view()     animation-range: entry 0% cover 40%  → 100% to 52%
 *   useInView      threshold 0, rootMargin 0px          → starts at 100%
 *   whileInView    viewport amount 0.3                  → starts at 94%, measured
 *                  where Motion draws the card (initial y: 32, so 32px low)
 *   useScroll      offset ['start end', 'start center'] → 100% to 50%
 *   ScrollAnimate  trigger top 88% → top 53%            → 88% to 53%
 */

export const CARD_H = 20;
export const CLOCK_MS = 600;

type Row =
  | { name: string; sub: string; kind: 'scrub'; from: number; to: number; end: string }
  | { name: string; sub: string; kind: 'clock'; from: number; as?: string };

export const ROWS: Row[] = [
  // cover runs 100 + CARD_H; 40% of it is scrolled when the top reaches 52%.
  { name: 'CSS view()', sub: 'entry 0% → cover 40%', kind: 'scrub', from: 100, to: Math.round(100 - 0.4 * (100 + CARD_H)), end: 'reverses' },
  { name: 'useInView', sub: 'threshold 0', kind: 'clock', from: 100 },
  { name: 'whileInView', sub: 'amount 0.3', kind: 'clock', from: Math.round(100 - 0.3 * CARD_H), as: ' (drawn 32px low)' },
  { name: 'useScroll', sub: 'start end → start center', kind: 'scrub', from: 100, to: 50, end: 'reverses' },
  { name: 'ScrollAnimate', sub: 'top 88% → top 53%', kind: 'scrub', from: 88, to: 53, end: 'holds' },
];

/** Card top at `pos`% of the screen → x across the track, scrolling left to right. */
const x = (pos: number) => ((100 - pos) * 10).toFixed(1);
const pct = (pos: number) => `${100 - pos}%`;

export function WhenFigure() {
  return (
    <div className="wf">
      <div className="wf-row wf-axis" aria-hidden="true">
        <span className="wf-l">Card top</span>
        <span className="wf-track wf-ticks">
          {[100, 75, 50, 25, 0].map((t) => <span key={t}>{t}%</span>)}
        </span>
      </div>
      {ROWS.map((r) => (
        <div key={r.name} className={`wf-row is-${r.kind}`}>
          <span className="wf-l">
            <b>{r.name}</b> <span className="wf-sub">{r.sub}</span>
          </span>
          <span className="wf-track">
            <svg viewBox="0 0 1000 12" preserveAspectRatio="none" aria-hidden="true">
              <path d="M0 6 H1000" className="wf-base" />
              {r.kind === 'scrub' ? <path d={`M${x(r.from)} 6 H${x(r.to)}`} className="wf-bar" /> : null}
            </svg>
            {r.kind === 'clock' ? <i className="wf-dot" style={{ left: pct(r.from) }} aria-hidden="true" /> : null}
            <span className="wf-note">
              {r.kind === 'clock'
                ? `starts at ${r.from}%${r.as ?? ''}, then ${CLOCK_MS / 1000} s on a clock`
                : `${r.from}% → ${r.to}%, ${r.end} on the way back`}
            </span>
          </span>
        </div>
      ))}
      <p className="wf-key" aria-hidden="true">
        <span><i className="is-bar" />follows the scroll</span>
        <span><i className="is-dot" />starts a timed animation</span>
        <span>card {CARD_H}% of the screen tall</span>
      </p>
    </div>
  );
}
