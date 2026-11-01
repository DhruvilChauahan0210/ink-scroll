'use client';

import type { CSSProperties } from 'react';
import { ScrollDraw } from 'svg-scroll-draw/react';

export type SpecCol = { name: string; sub?: string; ours?: boolean };
/** `win` is the column that answers the row better; omit it when neither does. */
export type SpecRow = { k: string; cells: string[]; win?: number };

/**
 * A comparison's opening drawing: the at-a-glance table as a specification
 * sheet. One column per library, with its measured version; one row per
 * question a reader weighs. Where one side is clearly ahead the cell carries a
 * check, inked by the library on load — against us as readily as for us.
 */
export function SpecSheet({ cols, rows, caption }: { cols: SpecCol[]; rows: SpecRow[]; caption: string }) {
  const vars = { '--sp-n': cols.length } as CSSProperties;
  return (
    <figure className="sp" style={vars}>
      <ScrollDraw className="sp-grid" selector=".sp-ink" autoplay duration={520} delay={450} stagger={0.16} easing="ease-out" once>
        <table className="sp-table">
          <thead>
            <tr className="sp-row sp-hd">
              <th scope="col"><span className="sr-only">Measure</span></th>
              {cols.map((c) => (
                <th key={c.name} scope="col" className={c.ours ? 'is-ours' : undefined}>
                  {c.name}
                  {c.sub && <span className="sp-sub">{c.sub}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.k} className="sp-row">
                <th scope="row" className="sp-k">{r.k}</th>
                {r.cells.map((v, i) => (
                  <td key={i} className={`sp-v${r.win === i ? ' is-win' : ''}`}>
                    <span className="sp-mark">
                      {r.win === i && (
                        <svg viewBox="0 0 16 16" aria-label="stronger answer" role="img">
                          <path d="M3 8.5 L6.5 12 L13 4.5" className="sp-ink" stroke="currentColor" />
                        </svg>
                      )}
                    </span>
                    <span className="sp-t">{v}</span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollDraw>
      <figcaption className="sp-cap">{caption}</figcaption>
    </figure>
  );
}
