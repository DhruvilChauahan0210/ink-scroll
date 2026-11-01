'use client';

import { ScrollDraw } from 'svg-scroll-draw/react';

export type Bar = {
  label: string;
  /** The measured value, from data/* — never typed. */
  value: number;
  /** Shown after the value, e.g. "KB". */
  unit?: string;
  /** Where the bar starts, for a stacked breakdown. Defaults to 0. */
  from?: number;
  /** Draw this row in the accent (the library's own figure). */
  self?: boolean;
  /** A note in place of the value, e.g. "1 import". */
  note?: string;
};

/**
 * A measured comparison drawn to scale: one inked bar per row, the library
 * draws each as it scrolls into view. The bars are horizontal strokes in a
 * viewBox stretched only lengthways (the StepRail trick), so the stroke keeps
 * its weight at any width; labels and values are HTML and stay legible.
 */
export function Bars({ rows, max, unit = 'KB' }: { rows: Bar[]; max?: number; unit?: string }) {
  const top = max ?? Math.max(...rows.map((r) => (r.from ?? 0) + r.value));
  return (
    <ScrollDraw className="ba-bars" selector=".ba-bar-ink" stagger={0.12} easing="ease-out" once trigger={{ start: 'top 85%', end: 'top 45%' }}>
      {rows.map((r) => {
        const x0 = ((r.from ?? 0) / top) * 1000;
        const x1 = (((r.from ?? 0) + r.value) / top) * 1000;
        return (
          <div key={r.label} className={`ba-bar${r.self ? ' is-self' : ''}`}>
            <span className="ba-bar-l">{r.label}</span>
            <svg className="ba-bar-svg" viewBox="0 0 1000 12" preserveAspectRatio="none" aria-hidden="true">
              <path d="M0 6 H1000" className="ba-bar-track" />
              <path d={`M${x0.toFixed(1)} 6 H${x1.toFixed(1)}`} className="ba-bar-ink" stroke="currentColor" />
            </svg>
            <span className="ba-bar-v">{r.note ?? `${r.value.toFixed(1)} ${r.unit ?? unit}`}</span>
          </div>
        );
      })}
    </ScrollDraw>
  );
}
