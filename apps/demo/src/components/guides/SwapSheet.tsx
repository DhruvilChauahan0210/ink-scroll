'use client';

import { ScrollDraw } from 'svg-scroll-draw/react';

export type SwapRow = { k: string; before: string; after: string };

/**
 * The guide's opening drawing: the library being replaced and its drop-in,
 * side by side, row by row, from the site's measured data. The arrows between
 * the columns are inked by the library on load. `to` heads the right-hand
 * column — "drop-in" unless the guide is a rewrite rather than a swap.
 */
export function SwapSheet({ from, to = 'drop-in', rows }: { from: string; to?: string; rows: SwapRow[] }) {
  return (
    <figure className="sw">
      <ScrollDraw className="sw-grid" selector=".sw-ink" autoplay duration={700} delay={350} stagger={0.14} easing="ease-out" once>
        <div className="sw-row sw-hd" aria-hidden="true">
          <span />
          <span>{from}</span>
          <span />
          <span>{to}</span>
        </div>
        {rows.map((r) => {
          // A row that does not change says so, rather than striking out a value that stays.
          const same = r.before === r.after;
          return (
            <div key={r.k} className={`sw-row${same ? ' is-same' : ''}`}>
              <span className="sw-k">{r.k}</span>
              <span className="sw-b">{r.before}</span>
              {same ? (
                <span className="sw-eq" aria-label="unchanged">=</span>
              ) : (
                <svg className="sw-arrow" viewBox="0 0 40 12" aria-label="becomes">
                  <path d="M2 6 H36 M31 1.5 L36.5 6 L31 10.5" className="sw-ink" stroke="currentColor" />
                </svg>
              )}
              <span className="sw-a">{r.after}</span>
            </div>
          );
        })}
      </ScrollDraw>
      <figcaption className="sw-cap">Fig. 1 — what changes, measured</figcaption>
    </figure>
  );
}
