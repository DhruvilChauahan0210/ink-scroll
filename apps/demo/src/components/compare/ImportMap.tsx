'use client';

import './compare.css';
import { ScrollDraw } from 'svg-scroll-draw/react';

export type ImportRow = {
  /** Sample number, zero-padded. */
  n: string;
  file: string;
  heading: string;
  /** Anchor of the sample further down the page. */
  href: string;
  /** What the sample actually uses from the entry: named imports, attributes or components. */
  names: string[];
};

/**
 * A framework landing's opening drawing: the wrapper's entry point as the
 * trunk, and a branch to each code sample on the page naming exactly what that
 * sample takes from it — parsed from the samples themselves, so it cannot
 * drift from the code below. The trunk and branches are inked by the library
 * on load; each branch links to its sample.
 *
 * Each row carries its own trunk segment (stretched lengthways only, like the
 * guides' step rail) and a fixed-size branch, so the drawing reflows at any
 * width without distorting a stroke.
 */
export function ImportMap({ entry, swatch, name, rows }: { entry: string; swatch: string; name: string; rows: ImportRow[] }) {
  return (
    <figure className="im" aria-label={`What each sample on this page uses from ${entry}`}>
      <ScrollDraw className="im-draw" selector=".im-ink" autoplay duration={650} delay={300} stagger={0.12} easing="ease-out" once>
        <div className="im-root">
          <span className="im-sw" style={{ background: swatch }} aria-hidden="true" />
          <span className="im-entry">{entry}</span>
          <span className="im-fw">{name}</span>
        </div>
        <ol className="im-rows">
          {rows.map((r) => (
            <li key={r.href} className="im-row">
              <svg className="im-trunk" viewBox="0 0 2 100" preserveAspectRatio="none" aria-hidden="true">
                <path d="M1 0 V100" className="im-ink" stroke="currentColor" />
              </svg>
              <svg className="im-branch" viewBox="0 0 34 12" aria-hidden="true">
                <path d="M0 6 H30 M25.5 1.8 L30.5 6 L25.5 10.2" className="im-ink" stroke="currentColor" />
              </svg>
              <a href={r.href} className="im-link">
                <span className="im-k"><span className="im-n">{r.n}</span>{r.file}</span>
                <span className="im-h">{r.heading}</span>
                <span className="im-names">
                  {r.names.map((x) => <code key={x}>{x}</code>)}
                </span>
              </a>
            </li>
          ))}
        </ol>
      </ScrollDraw>
      <figcaption className="im-cap">fig. 01 — what each sample below takes from {entry}</figcaption>
    </figure>
  );
}
