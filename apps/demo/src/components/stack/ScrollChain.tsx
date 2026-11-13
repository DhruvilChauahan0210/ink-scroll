'use client';

import { Fragment } from 'react';
import { ScrollDraw } from 'svg-scroll-draw/react';

/**
 * The Lenis page's opening drawing: where the scroll position travels, from
 * the wheel to the drawn path, on Lenis 1.x and on a scroller that keeps a
 * virtual value side by side. Lenis moves the real scroll, so window.scrollY
 * is right with nothing added; on a virtual scroller the native value goes
 * stale and the adapter is the extra link. The arrows between links are inked
 * by the library on load.
 */

type Cell = { v: string; note?: string; kind?: 'same' | 'stale' | 'fix' | 'none' };
type Row = { k: string; lenis: Cell; virt: Cell };

const ROWS: Row[] = [
  { k: 'input', lenis: { v: 'wheel · touch' }, virt: { v: 'wheel · touch' } },
  { k: 'smooth', lenis: { v: 'lenis.raf(time)', note: 'Eases the real scroll' }, virt: { v: 'scroller tick', note: 'Eases a virtual value' } },
  { k: 'native', lenis: { v: 'window.scrollY', note: 'moved by Lenis’s scrollTo()' }, virt: { v: 'window.scrollY', note: 'never updated — stale', kind: 'stale' } },
  { k: 'adapter', lenis: { v: 'none', note: 'Nothing to add', kind: 'none' }, virt: { v: 'createLenisAdapter(scroller)', note: 'patches scrollY, restores on destroy', kind: 'fix' } },
  { k: 'engine', lenis: { v: 'scrollDraw()', note: 'Reads the real value' }, virt: { v: 'scrollDraw()', note: 'Reads the patched value' } },
  { k: 'result', lenis: { v: 'the path draws', note: 'In step with the eased scroll' }, virt: { v: 'the path draws', note: 'In step, once the adapter is in' } },
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
        <span className="sc-hd">lenis 1.x</span>
        <span className="sc-hd is-acc">virtual scroller</span>
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
            <Box c={r.lenis} />
            <Box c={r.virt} />
          </Fragment>
        ))}
      </ScrollDraw>
      <figcaption className="stk-cap">Fig. 1 — where the scroll position travels, wheel to path</figcaption>
    </figure>
  );
}
