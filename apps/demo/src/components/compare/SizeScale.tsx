'use client';

import './compare.css';
import { ScrollDraw } from 'svg-scroll-draw/react';

export type SizeBar = {
  /** Package and version, e.g. "vivus 0.4.6". */
  label: string;
  /** One line under the label: what the figure covers. */
  sub?: string;
  kb: number;
  /** This library's own figure, inked in the accent. */
  ours?: boolean;
};

/**
 * Bundle sizes drawn to one scale, like a dimensioned drawing: a ruled track
 * per package, a bar the library inks to its measured length, and the figure
 * at the end. Every number comes from data/competitors.ts — the caller passes
 * them in, this only draws.
 *
 * Each bar is a single thick stroke in a 100-unit viewBox stretched to its
 * share of the track. The stretch is horizontal only, so the stroke keeps its
 * height while the library draws it left to right.
 */
export function SizeScale({ bars, n = 1, caption }: { bars: SizeBar[]; n?: number; caption: string }) {
  const max = Math.max(...bars.map((b) => b.kb));
  const step = max <= 12 ? 2 : max <= 24 ? 5 : 10;
  const top = Math.ceil(max / step) * step;
  const ticks = Array.from({ length: top / step + 1 }, (_, i) => i * step);

  return (
    <figure className="sz" style={{ '--sz-cols': top / step } as React.CSSProperties}>
      <div className="sz-row sz-scale" aria-hidden="true">
        <span className="sz-label">package</span>
        <span className="sz-track">
          {ticks.map((t) => (
            <span key={t} className="sz-tick" style={{ left: `${(t / top) * 100}%` }}>{t}</span>
          ))}
        </span>
        <span className="sz-val">gzip</span>
      </div>
      <ScrollDraw className="sz-rows" selector=".sz-ink" autoplay duration={900} delay={250} stagger={0.18} easing="ease-out" once>
        {bars.map((b) => (
          <div key={b.label} className={`sz-row${b.ours ? ' is-ours' : ''}`}>
            <span className="sz-label">
              <span className="sz-name">{b.label}</span>
              {b.sub && <span className="sz-sub">{b.sub}</span>}
            </span>
            <span className="sz-track">
              <svg className="sz-bar" style={{ width: `${(b.kb / top) * 100}%` }} viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true">
                <path d="M0 5 H100" className="sz-ink" stroke="currentColor" />
              </svg>
            </span>
            <span className="sz-val">{b.kb.toFixed(1)} KB</span>
          </div>
        ))}
      </ScrollDraw>
      <figcaption className="sz-cap">fig. {String(n).padStart(2, '0')} — {caption}</figcaption>
    </figure>
  );
}
