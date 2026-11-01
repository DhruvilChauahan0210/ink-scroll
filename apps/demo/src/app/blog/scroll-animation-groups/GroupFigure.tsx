'use client';

import { ScrollDraw } from 'svg-scroll-draw/react';
import './groups.css';

type Row = { label: string; at: number; to: number; note: string };

/**
 * Group: every card gets the same options and tracks its own position, so a
 * card one grid row lower starts one row-height of scroll later. Spans are in
 * scroll progress through the section (0 → 1); the offsets are one row each.
 */
const GROUP: Row[] = [
  { label: 'card · row 1', at: 0, to: 0.46, note: 'top of the grid' },
  { label: 'card · row 2', at: 0.18, to: 0.64, note: 'one row lower' },
  { label: 'card · row 3', at: 0.36, to: 0.82, note: 'two rows lower' },
];

/** Sequence: each step starts only when the one before it reaches 100%. */
const SEQUENCE: Row[] = [
  { label: 'step 1', at: 0, to: 1 / 3, note: 'starts first' },
  { label: 'step 2', at: 1 / 3, to: 2 / 3, note: 'after 01 hits 100%' },
  { label: 'step 3', at: 2 / 3, to: 1, note: 'after 02 hits 100%' },
];

function Lane({ rows, chained = false }: { rows: Row[]; chained?: boolean }) {
  const x = (v: number) => (v * 1000).toFixed(1);
  return (
    <>
      {rows.map((r, i) => (
        <div key={r.label} className="gf-row">
          <span className="gf-l">{r.label}</span>
          <span className="gf-track">
            <svg viewBox="0 0 1000 12" preserveAspectRatio="none" aria-hidden="true">
              <path d="M0 6 H1000" className="gf-base" />
              <path d={`M${x(r.at)} 6 H${x(r.to)}`} className="gf-ink gf-bar" stroke="currentColor" />
            </svg>
            {chained && i > 0 ? <span className="gf-hand" style={{ left: `${r.at * 100}%` }} aria-hidden="true" /> : null}
          </span>
          <span className="gf-note">{r.note}</span>
        </div>
      ))}
    </>
  );
}

/**
 * The group-API post's opening drawing: the difference between the two calls
 * that animate many elements, as a timing chart over the section's scroll.
 * scrollAnimateGroup runs every card at once, each from its own position, so
 * lower rows trail by a row; scrollAnimateSequence hands off from one step to
 * the next at 100%. Both return one instance for the whole set.
 */
export function GroupFigure() {
  return (
    <ScrollDraw className="gf" selector=".gf-ink" autoplay duration={700} delay={300} stagger={0.12} easing="ease-out" once>
      <div className="gf-row gf-axis" aria-hidden="true">
        <span className="gf-l">scroll</span>
        <span className="gf-track gf-ticks"><span>section enters</span><span>→</span></span>
        <span className="gf-note" />
      </div>

      <div className="gf-grp">
        <p className="gf-hd"><code>scrollAnimateGroup</code><span>together</span></p>
        <Lane rows={GROUP} />
      </div>
      <div className="gf-grp is-seq">
        <p className="gf-hd"><code>scrollAnimateSequence</code><span>one by one</span></p>
        <Lane rows={SEQUENCE} chained />
      </div>

      <p className="gf-inst">
        <span>returns</span> one instance for the whole set — <code>destroy()</code> <code>replay()</code> <code>pause()</code> <code>seek()</code>
      </p>
    </ScrollDraw>
  );
}
