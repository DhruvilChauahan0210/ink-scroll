'use client';

import { ScrollDraw } from 'svg-scroll-draw/react';

type Row = { name: string; detail: string; kb: number; ours?: boolean };

/** Three weights, as lines that draw to length as you scroll. */
export function VersusBars({ rows }: { rows: Row[] }) {
  const max = Math.max(...rows.map((r) => r.kb));
  return (
    <div className="versus">
      {rows.map((r, i) => {
        const w = (r.kb / max) * 100;
        return (
          <div className={`versus-row ${r.ours ? 'is-ours' : ''}`} key={r.name}>
            <div className="versus-meta">
              <span className="versus-name">{r.name}</span>
              <span className="versus-detail">{r.detail}</span>
            </div>
            <ScrollDraw
              className="versus-track"
              trigger={{ start: 'top 90%', end: 'top 55%' }}
              easing="ease-out"
              once
            >
              <svg viewBox="0 0 100 2" preserveAspectRatio="none" aria-hidden="true">
                {/* No non-scaling-stroke: it puts the dash array in screen px while the
                    measured length stays in user units, and the bar turns into dashes. */}
                <line x1="0" y1="1" x2={w.toFixed(2)} y2="1" />
              </svg>
            </ScrollDraw>
            <span className="versus-kb">
              <span className="versus-index">0{i + 1}</span>
              {r.kb.toFixed(1)} KB
            </span>
          </div>
        );
      })}
    </div>
  );
}
