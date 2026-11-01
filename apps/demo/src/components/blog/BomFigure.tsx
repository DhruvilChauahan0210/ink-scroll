'use client';

import { ScrollDraw } from 'svg-scroll-draw/react';

export type BomPart = { name: string; kb: number };

/**
 * The DrawSVG post's opening drawing: what each side ships to draw one path on
 * scroll, as two parts lists drawn to the same scale. Each GSAP part starts
 * where the one before it ends, so the three read as one stacked bar; the
 * library's single part sits under them in the accent. Every figure arrives as
 * a prop from data/competitors.ts.
 */
export function BomFigure({ theirs, ours, setup }: { theirs: BomPart[]; ours: BomPart; setup: string }) {
  const total = theirs.reduce((s, p) => s + p.kb, 0);
  const starts = theirs.map((_, i) => theirs.slice(0, i).reduce((s, p) => s + p.kb, 0));
  const x = (kb: number) => ((kb / total) * 1000).toFixed(1);
  return (
    <ScrollDraw className="bom" selector=".bom-ink" autoplay duration={800} delay={350} stagger={0.16} easing="ease-out" once>
      <div className="bom-grp">
        <p className="bom-hd"><span>GSAP stack</span><span>{total.toFixed(1)} KB</span></p>
        {theirs.map((p, i) => {
          const from = starts[i];
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
        <div className="bom-row is-setup">
          <span className="bom-n">{String(theirs.length + 1).padStart(2, '0')}</span>
          <span className="bom-name">{setup}</span>
          <span className="bom-note">+ registration before the first tween</span>
          <span className="bom-kb">—</span>
        </div>
      </div>
      <div className="bom-grp is-self">
        <p className="bom-hd"><span>svg-scroll-draw</span><span>{ours.kb.toFixed(1)} KB</span></p>
        <div className="bom-row">
          <span className="bom-n">01</span>
          <span className="bom-name">{ours.name}</span>
          <svg className="bom-svg" viewBox="0 0 1000 12" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 6 H1000" className="bom-track" />
            <path d={`M0 6 H${x(ours.kb)}`} className="bom-ink" stroke="currentColor" />
          </svg>
          <span className="bom-kb">{ours.kb.toFixed(1)}</span>
        </div>
      </div>
    </ScrollDraw>
  );
}
