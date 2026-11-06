'use client';

import { ScrollDraw } from 'svg-scroll-draw/react';
import { Delta } from './VerifyKit';

export type RecordRow = {
  /** The revision number inside the delta, or null for work not yet done. */
  rev: string | null;
  tag: string;
  heading: string;
  items: string[];
  /** Where on the page the row is proven, e.g. "01 – 05". */
  zone: string;
  href: string;
};

/**
 * /verify's opening drawing: the revision block of a drawing sheet. One row
 * per phase of the work, with the delta a sheet puts beside whatever that
 * revision changed, what the phase found, and the zone of this page where each
 * finding is re-run. The deltas are inked by the library on load.
 */
export function VerifyRecord({ rows }: { rows: RecordRow[] }) {
  return (
    <figure className="vf-rec">
      <ScrollDraw className="vf-rec-grid" selector=".vf-rec-ink" autoplay duration={800} delay={300} stagger={0.18} easing="ease-out" once>
        <div className="vf-rec-row vf-rec-hd" aria-hidden="true">
          <span>rev</span>
          <span>scope</span>
          <span>found</span>
          <span>zone</span>
        </div>
        {rows.map((r) => (
          <div key={r.tag} className={`vf-rec-row${r.rev === null ? ' is-open' : ''}`}>
            <span className="vf-rec-rev">
              {r.rev === null ? (
                <svg className="vf-delta is-open" viewBox="0 0 28 24" aria-label="not yet done">
                  <path d="M14 2.2 L26 21.8 H2 Z" className="vf-delta-ink" />
                </svg>
              ) : (
                <Delta rev={r.rev} ink />
              )}
            </span>
            <span className="vf-rec-scope">
              <span className="vf-rec-tag">{r.tag}</span>
              <span className="vf-rec-h">{r.heading}</span>
            </span>
            <ul className="vf-rec-found">
              {r.items.map((it) => (
                <li key={it}>{it}</li>
              ))}
            </ul>
            <a href={r.href} className="vf-rec-zone">
              <span>§</span> {r.zone}
            </a>
          </div>
        ))}
      </ScrollDraw>
      <figcaption className="vf-rec-cap">Fig. 1 — the revision record: what each phase found, and where on this sheet it is re-run</figcaption>
    </figure>
  );
}
