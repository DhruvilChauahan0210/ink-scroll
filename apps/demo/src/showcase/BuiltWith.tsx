'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import './builtwith.css';

/**
 * The tab every showcase site carries: these are demo sites for fictional
 * companies, built with svg-scroll-draw, and this says so and links back to
 * the example that explains how.
 *
 * "Show where" outlines every element the library is driving on the page,
 * with its kind and live progress. It reads the registry each instance joins
 * on creation (the one devtools reads: shared through `globalThis` under
 * `Symbol.for('svg-scroll-draw.registry')`), so no site has to mark anything.
 */

type Entry = { type: string; getProgress: () => number };
type Box = { key: number; type: string; p: number; x: number; y: number; w: number; h: number };

const KEY = Symbol.for('svg-scroll-draw.registry');
const STORE = 'ssd-show-where';

function registry(): Map<Element, Entry> | undefined {
  return (globalThis as unknown as Record<symbol, Map<Element, Entry> | undefined>)[KEY];
}

export function BuiltWith({ example, apis }: { example: string; apis: string }) {
  const [on, setOn] = useState(false);
  const [boxes, setBoxes] = useState<Box[]>([]);
  const ids = useRef(new WeakMap<Element, number>());
  const nextId = useRef(1);

  // Remember the choice across showcase sites, where storage allows it.
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      try { if (sessionStorage.getItem(STORE) === '1') setOn(true); } catch { /* storage blocked */ }
    });
    return () => cancelAnimationFrame(id);
  }, []);
  const toggle = () => {
    setOn((v) => {
      try { sessionStorage.setItem(STORE, v ? '0' : '1'); } catch { /* storage blocked */ }
      return !v;
    });
  };

  useEffect(() => {
    if (!on) return;
    let raf = 0;
    const tick = () => {
      const reg = registry();
      const vw = innerWidth, vh = innerHeight;
      const out: Box[] = [];
      reg?.forEach((entry, el) => {
        if (!el.isConnected) return;
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2 || r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw) return;
        let key = ids.current.get(el);
        if (!key) { key = nextId.current++; ids.current.set(el, key); }
        let p = 0;
        try { p = entry.getProgress(); } catch { /* destroyed mid-frame */ }
        out.push({ key, type: entry.type, p: Math.max(0, Math.min(1, p || 0)), x: r.left, y: r.top, w: r.width, h: r.height });
      });
      setBoxes(out);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [on]);

  return (
    <>
      {on && (
        <div className="bw-layer" aria-hidden="true">
          {boxes.map((b) => (
            <div
              key={b.key}
              className="bw-box"
              style={{ transform: `translate(${b.x}px, ${b.y}px)`, width: b.w, height: b.h }}
            >
              <span className={`bw-tag${b.y < 26 ? ' is-in' : ''}`}>
                <b>{b.type}</b>
                <i style={{ '--p': b.p } as React.CSSProperties} />
                {Math.round(b.p * 100)}%
              </span>
            </div>
          ))}
        </div>
      )}
      <aside className="bw" aria-label="About this demo">
        <span className="bw-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="14" height="14"><path d="M3 17 C 6 6, 10 6, 12 12 S 18 18, 21 7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></svg>
        </span>
        <span className="bw-text">
          <b>Demo site</b> built with svg-scroll-draw <i>· {apis}</i>
        </span>
        <button type="button" className={`bw-where${on ? ' is-on' : ''}`} aria-pressed={on} onClick={toggle}>
          <span className="bw-dot" aria-hidden="true" />
          {on ? `${boxes.length} in view` : 'Show where'}
        </button>
        <Link href={`/examples/${example}`} className="bw-link">How it&apos;s built →</Link>
      </aside>
    </>
  );
}
