'use client';

import { useEffect, useState } from 'react';

const KEY = 'ink-booted';
const DRAW_MS = 950;
const LIFT_MS = 720;

/**
 * A one-second ink preloader: a line draws across the page, a counter runs
 * to 100, the curtain lifts. Runs once per tab session, never for
 * reduced-motion users. Marks `.home` as ready so the hero can start its
 * own reveal exactly when the curtain is out of the way.
 */
export function Preloader() {
  const [state, setState] = useState<'idle' | 'draw' | 'lift' | 'done'>('idle');
  const [count, setCount] = useState(0);

  useEffect(() => {
    const home = document.querySelector<HTMLElement>('.home');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let seen = false;
    try { seen = sessionStorage.getItem(KEY) === '1'; } catch { /* private mode */ }

    if (reduced || seen) {
      home?.setAttribute('data-ready', '');
      setState('done');
      return;
    }

    setState('draw');
    const html = document.documentElement;
    const prevOverflow = html.style.overflow;
    html.style.overflow = 'hidden';

    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / DRAW_MS);
      setCount(Math.round(p * 100));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const lift = setTimeout(() => {
      setState('lift');
      home?.setAttribute('data-ready', '');
      html.style.overflow = prevOverflow;
      try { sessionStorage.setItem(KEY, '1'); } catch { /* ignore */ }
    }, DRAW_MS + 120);
    const done = setTimeout(() => setState('done'), DRAW_MS + 120 + LIFT_MS);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(lift);
      clearTimeout(done);
      html.style.overflow = prevOverflow;
    };
  }, []);

  if (state === 'idle' || state === 'done') return null;

  return (
    <div className={`boot ${state === 'lift' ? 'is-lifting' : ''}`} aria-hidden="true">
      <div className="boot-line" style={{ animationDuration: `${DRAW_MS}ms` }} />
      <div className="boot-meta">
        <span>svg-scroll-draw</span>
        <span className="boot-count">{String(count).padStart(3, '0')}</span>
      </div>
    </div>
  );
}
