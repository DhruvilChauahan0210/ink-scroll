'use client';

import './b2-figures.css';
import { ScrollDraw } from 'svg-scroll-draw/react';

export type RevealPart = { name: string; kb: number };
export type RevealKit = {
  title: string;
  /** Shown after the total, e.g. the licence. */
  note?: string;
  parts: RevealPart[];
  /** What you write before anything animates — a call, or an attribute on every element. */
  setup: { name: string; note: string }[];
  self?: boolean;
};

/**
 * The AOS post's opening drawing: what each option ships to fade a grid of
 * cards in on scroll, as parts lists drawn to one scale. Byte figures arrive as
 * props from data/competitors.ts; the setup rows are each library's real API —
 * AOS needs an attribute on every element plus an init call, scrollReveal one
 * call with a selector. Same row anatomy as the DrawSVG post's parts list.
 */
export function RevealFigure({ kits }: { kits: RevealKit[] }) {
  const max = Math.max(...kits.map((k) => k.parts.reduce((s, p) => s + p.kb, 0)));
  const x = (kb: number) => ((kb / max) * 1000).toFixed(1);
  return (
    <ScrollDraw className="bom b2-rv" selector=".bom-ink" autoplay duration={800} delay={350} stagger={0.14} easing="ease-out" once>
      {kits.map((kit) => {
        const total = kit.parts.reduce((s, p) => s + p.kb, 0);
        let at = 0;
        return (
          <div key={kit.title} className={`bom-grp${kit.self ? ' is-self' : ''}`}>
            <p className="bom-hd">
              <span>{kit.title}</span>
              <span>{total.toFixed(1)} KB{kit.note ? <em className="b2-rv-lic"> · {kit.note}</em> : null}</span>
            </p>
            {kit.parts.map((p, i) => {
              const from = at;
              at += p.kb;
              return (
                <div key={p.name} className="bom-row">
                  <span className="bom-n">{String(i + 1).padStart(2, '0')}</span>
                  <span className="bom-name">{p.name}</span>
                  <svg className="bom-svg" viewBox="0 0 1000 12" preserveAspectRatio="none" aria-hidden="true">
                    <path d="M0 6 H1000" className="bom-track" />
                    <path d={`M${x(from)} 6 H${x(from + p.kb)}`} className="bom-ink" stroke="currentColor" />
                  </svg>
                  <span className="bom-kb">{p.kb.toFixed(1)}</span>
                </div>
              );
            })}
            {kit.setup.map((s, i) => (
              <div key={s.name} className="bom-row is-setup">
                <span className="bom-n">{String(kit.parts.length + i + 1).padStart(2, '0')}</span>
                <span className="bom-name">{s.name}</span>
                <span className="bom-note">{s.note}</span>
                <span className="bom-kb">—</span>
              </div>
            ))}
          </div>
        );
      })}
    </ScrollDraw>
  );
}
