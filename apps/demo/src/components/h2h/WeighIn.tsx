'use client';

import type { CSSProperties } from 'react';
import { ScrollDraw } from 'svg-scroll-draw/react';

export type WeighRow = {
  name: string;
  /** A second line under the name: the version, or what the figure covers. */
  note?: string;
  kb: number;
  /** Already counted on the row above: drawn as pencil, so only the increment inks. */
  from?: number;
  ours?: boolean;
  badge?: string;
};

export type WeighDim = { from: number; to: number; title: string; label: string };

const BAR_W = 1000;

/**
 * A comparison's weigh-in: each measured size as a bar on a KB rule, drawn to
 * scale. Every figure is passed in from data/competitors.ts; nothing here is a
 * number of its own. The bars are horizontal strokes in a viewBox stretched
 * along its length only, so a bar keeps its thickness at any width, and the
 * library inks each one to its measured length as the chart scrolls through.
 * A dashed rule marks our main entry on every row; a dimension line reads off
 * the difference that matters.
 */
export function WeighIn({
  rows,
  max,
  step,
  self,
  dim,
  caption,
}: {
  rows: WeighRow[];
  /** The rule's full length, in KB. */
  max: number;
  /** KB between ticks. */
  step: number;
  /** Where the dashed reference line falls, in KB. */
  self?: number;
  dim?: WeighDim;
  caption: string;
}) {
  const pct = (kb: number) => `${((kb / max) * 100).toFixed(3)}%`;
  const x = (kb: number) => ((kb / max) * BAR_W).toFixed(1);
  const ticks = Array.from({ length: Math.round(max / step) + 1 }, (_, i) => Math.round(i * step * 10) / 10);
  const vars = { '--wi-step': pct(step), ...(self != null ? { '--wi-self': pct(self) } : {}) } as CSSProperties;

  return (
    <figure className={`wi${self != null ? ' has-self' : ''}`} style={vars}>
      <div className="wi-row wi-axis" aria-hidden="true">
        <span className="wi-name">KB · min + gzip</span>
        <span className="wi-scale">
          {ticks.map((t) => (
            <span key={t} style={{ left: pct(t) }}>{t}</span>
          ))}
        </span>
        <span className="wi-val" />
      </div>
      <ScrollDraw
        className="wi-rows"
        selector=".wi-ink"
        trigger={{ start: 'top 88%', end: 'bottom 62%' }}
        stagger={0.12}
        easing="ease-out"
        once
      >
        {rows.map((r) => (
          <div key={r.name} className={`wi-row${r.ours ? ' is-ours' : ''}`}>
            <span className="wi-name">
              <span className="wi-name-t">{r.name}</span>
              {r.badge && <span className="tag wi-tag">{r.badge}</span>}
              {r.note && <small>{r.note}</small>}
            </span>
            <span className="wi-track">
              <svg viewBox={`0 0 ${BAR_W} 12`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
                {r.from ? <path d={`M0 6 H${x(r.from)}`} className="wi-ghost" /> : null}
                <path d={`M${x(r.from ?? 0)} 6 H${x(r.kb)}`} className="wi-ink wi-bar" stroke="currentColor" />
              </svg>
            </span>
            <span className="wi-val">
              {r.kb.toFixed(1)}
              <span> KB</span>
            </span>
          </div>
        ))}
        {dim && (
          <div className="wi-row wi-dimrow">
            <span className="wi-name">
              <span className="wi-name-t">{dim.title}</span>
            </span>
            <span className="wi-track">
              <span className="wi-dim" style={{ left: pct(dim.from), width: pct(dim.to - dim.from) }}>
                <svg viewBox="0 0 100 2" preserveAspectRatio="none" aria-hidden="true" focusable="false">
                  <path d="M0 1 H100" className="wi-ink" stroke="currentColor" />
                </svg>
              </span>
            </span>
            <span className="wi-val wi-dim-l">{dim.label}</span>
          </div>
        )}
      </ScrollDraw>
      <figcaption className="wi-cap">{caption}</figcaption>
    </figure>
  );
}
