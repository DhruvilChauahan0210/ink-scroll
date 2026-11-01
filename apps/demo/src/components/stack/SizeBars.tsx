'use client';

import { ScrollDraw } from 'svg-scroll-draw/react';

export type SizeBar = { label: string; kb: number; note?: string; self?: boolean; sum?: boolean };

/**
 * Measured bundle sizes as ruled bars, to one scale, inked by the library as
 * they scroll into view. Every figure comes from data/competitors.ts.
 *
 * Each bar is a one-axis SVG stretched along its length only, so the stroke
 * keeps its thickness at any width.
 */
export function SizeBars({ rows, caption }: { rows: SizeBar[]; caption: string }) {
  const max = Math.max(...rows.map((r) => r.kb));
  return (
    <figure className="sb">
      <ScrollDraw className="sb-rows" selector=".sb-ink" trigger={{ start: 'top 85%', end: 'bottom 55%' }} stagger={0.12} easing="ease-out" once>
        {rows.map((r) => (
          <div key={r.label} className={`sb-row${r.self ? ' is-self' : ''}${r.sum ? ' is-sum' : ''}`}>
            <span className="sb-l">
              <span className="sb-name">{r.label}</span>
              {r.note && <span className="sb-note">{r.note}</span>}
            </span>
            <span className="sb-track">
              <svg className="sb-bar" style={{ width: `${(r.kb / max) * 100}%` }} viewBox="0 0 100 8" preserveAspectRatio="none" aria-hidden="true">
                <path d="M0 4 H100" className="sb-ink" stroke="currentColor" />
              </svg>
            </span>
            <span className="sb-kb">{r.kb.toFixed(1)} KB</span>
          </div>
        ))}
      </ScrollDraw>
      <figcaption className="stk-cap">{caption}</figcaption>
    </figure>
  );
}
