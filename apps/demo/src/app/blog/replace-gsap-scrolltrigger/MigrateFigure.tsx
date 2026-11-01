'use client';

import { ScrollDraw } from 'svg-scroll-draw/react';
import './migrate.css';

export type MigrateRow = {
  /** What the effect is, in a reader's words. */
  use: string;
  /** The ScrollTrigger recipe it takes today. */
  gsap: string;
  /** The one call that replaces it. */
  ours: string;
  /** The import path that call ships in. */
  from: string;
};

export type Weight = { label: string; kb: number; self?: boolean };

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * The ScrollTrigger post's opening drawing: the migration map. Each row is one
 * of the five recipes the post migrates, with the ScrollTrigger code it takes
 * today, an inked arrow, and the single call that replaces it. Under the map,
 * the weight each side puts on the page, drawn to one scale. Every row and
 * every size arrives as a prop; the sizes come from data/competitors.ts.
 */
export function MigrateFigure({ rows, weights }: { rows: MigrateRow[]; weights: Weight[] }) {
  const max = Math.max(...weights.map((w) => w.kb));
  return (
    <ScrollDraw className="rg" selector=".rg-ink" autoplay duration={700} delay={300} stagger={0.09} easing="ease-out" once>
      <p className="rg-hd">
        <span>ScrollTrigger recipe</span>
        <span>svg-scroll-draw</span>
      </p>
      <ol className="rg-list">
        {rows.map((r, i) => (
          <li key={r.use} className="rg-row">
            <span className="rg-n">{pad(i + 1)}</span>
            <span className="rg-from">
              <span className="rg-use">{r.use}</span>
              <code>{r.gsap}</code>
            </span>
            <svg className="rg-arrow" viewBox="0 0 44 12" aria-hidden="true">
              <path className="rg-ink" d="M2 6 H40 M35 2 L41 6 L35 10" stroke="currentColor" />
            </svg>
            <span className="rg-to">
              <code>{r.ours}()</code>
              <span className="rg-path">{r.from}</span>
            </span>
          </li>
        ))}
      </ol>

      <div className="rg-w">
        <p className="rg-hd">
          <span>weight on the page</span>
          <span>gzipped</span>
        </p>
        {weights.map((w) => (
          <div key={w.label} className={`rg-wrow${w.self ? ' is-self' : ''}`}>
            <span className="rg-wl">{w.label}</span>
            <svg className="rg-wsvg" viewBox="0 0 1000 12" preserveAspectRatio="none" aria-hidden="true">
              <path d="M0 6 H1000" className="rg-track" />
              <path d={`M0 6 H${((w.kb / max) * 1000).toFixed(1)}`} className="rg-ink rg-bar" stroke="currentColor" />
            </svg>
            <span className="rg-kb">{w.kb.toFixed(1)} KB</span>
          </div>
        ))}
      </div>
    </ScrollDraw>
  );
}
