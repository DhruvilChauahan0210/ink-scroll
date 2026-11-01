'use client';

import { Fragment } from 'react';
import { ScrollDraw } from 'svg-scroll-draw/react';

/**
 * The Lenis page's opening drawing: where the scroll position travels, from
 * the wheel to the drawn path, on Lenis v2 and on Lenis v1 side by side. On v1
 * the native value goes stale and the adapter is the extra link. The arrows
 * between links are inked by the library on load.
 */

type Cell = { v: string; note?: string; kind?: 'same' | 'stale' | 'fix' | 'none' };
type Row = { k: string; v2: Cell; v1: Cell };

const ROWS: Row[] = [
  { k: 'input', v2: { v: 'wheel · touch' }, v1: { v: 'wheel · touch' } },
  { k: 'smooth', v2: { v: 'lenis.raf(time)', note: 'eases the scroll' }, v1: { v: 'lenis.raf(time)', note: 'eases a virtual value' } },
  { k: 'native', v2: { v: 'window.scrollY', note: 'patched by Lenis' }, v1: { v: 'window.scrollY', note: 'never updated — stale', kind: 'stale' } },
  { k: 'adapter', v2: { v: 'none', note: 'nothing to add', kind: 'none' }, v1: { v: 'createLenisAdapter(lenis)', note: 'patches scrollY, restores on destroy', kind: 'fix' } },
  { k: 'engine', v2: { v: 'scrollDraw()', note: 'reads the right value' }, v1: { v: 'scrollDraw()', note: 'reads the patched value' } },
  { k: 'result', v2: { v: 'the path draws', note: 'in step with the eased scroll' }, v1: { v: 'the path draws', note: 'in step, once the adapter is in' } },
];

function Arrow() {
  return (
    <svg className="sc-arrow" viewBox="0 0 12 22" aria-hidden="true">
      <path d="M6 1 V20 M1.5 15.5 L6 20.5 L10.5 15.5" className="sc-ink" stroke="currentColor" />
    </svg>
  );
}

/** A call may break before its arguments, never inside its name. */
function Code({ v }: { v: string }) {
  const at = v.indexOf('(');
  return at > 0 ? <>{v.slice(0, at)}<wbr />{v.slice(at)}</> : <>{v}</>;
}

function Box({ c }: { c: Cell }) {
  return (
    <div className={`sc-box${c.kind ? ` is-${c.kind}` : ''}`}>
      <code className="sc-v"><Code v={c.v} /></code>
      {c.note && <span className="sc-n">{c.note}</span>}
    </div>
  );
}

export function ScrollChain() {
  return (
    <figure className="stk-fig sc">
      <ScrollDraw className="sc-grid" selector=".sc-ink" autoplay duration={420} delay={300} stagger={0.12} easing="ease-out" once>
        <span className="sc-hd" />
        <span className="sc-hd">lenis v2+</span>
        <span className="sc-hd is-acc">lenis v1</span>
        {ROWS.map((r, i) => (
          <Fragment key={r.k}>
            {i > 0 && (
              <>
                <span />
                <span className="sc-gap"><Arrow /></span>
                <span className="sc-gap"><Arrow /></span>
              </>
            )}
            <span className="sc-k">{r.k}</span>
            <Box c={r.v2} />
            <Box c={r.v1} />
          </Fragment>
        ))}
      </ScrollDraw>
      <figcaption className="stk-cap">fig. 1 — where the scroll position travels, wheel to path</figcaption>
    </figure>
  );
}
