'use client';

import { useEffect, useRef } from 'react';

/**
 * A vermilion nib that follows the pointer, grows into a labelled ring over
 * anything marked `data-cursor="…"`, and pulls `[data-magnetic]` elements a
 * few pixels towards the hand. Also feeds --mx/--my (−1..1) to .hero for the
 * ink field's parallax. Fine pointers only.
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = dot.current;
    const lab = label.current;
    const home = document.querySelector<HTMLElement>('.home');
    if (!el || !lab || !home) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;

    home.setAttribute('data-cursor-on', '');
    const hero = home.querySelector<HTMLElement>('.hero');

    let x = innerWidth / 2;
    let y = innerHeight / 2;
    let cx = x;
    let cy = y;
    let raf = 0;
    let visible = false;

    const loop = () => {
      cx += (x - cx) * 0.22;
      cy += (y - cy) * 0.22;
      el.style.transform = `translate3d(${cx}px, ${cy}px, 0) translate(-50%, -50%)`;
      raf = requestAnimationFrame(loop);
    };

    const relabel = (from: Element | null) => {
      const target = from?.closest<HTMLElement>('[data-cursor]');
      const text = target?.dataset.cursor ?? '';
      if (text !== lab.textContent) lab.textContent = text;
      el.classList.toggle('is-big', !!text);
    };
    // The page moves under a still pointer while scrolling; re-read the target.
    const onScroll = () => { if (visible) relabel(document.elementFromPoint(x, y)); };

    const onMove = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (!visible) { visible = true; el.classList.add('is-on'); raf = requestAnimationFrame(loop); }
      relabel(e.target as Element | null);

      if (hero) {
        const r = hero.getBoundingClientRect();
        const mx = ((e.clientX - r.left) / r.width) * 2 - 1;
        const my = ((e.clientY - r.top) / r.height) * 2 - 1;
        hero.style.setProperty('--mx', Math.max(-1, Math.min(1, mx)).toFixed(3));
        hero.style.setProperty('--my', Math.max(-1, Math.min(1, my)).toFixed(3));
      }
    };
    const onLeave = () => { visible = false; el.classList.remove('is-on'); cancelAnimationFrame(raf); };
    const onDown = () => el.classList.add('is-down');
    const onUp = () => el.classList.remove('is-down');

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);

    // Magnetic pull on buttons and chips.
    const magnets = Array.from(home.querySelectorAll<HTMLElement>('[data-magnetic]'));
    const handlers = magnets.map((m) => {
      const move = (e: PointerEvent) => {
        const r = m.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        m.style.transform = `translate(${(dx * 0.28).toFixed(1)}px, ${(dy * 0.28).toFixed(1)}px)`;
      };
      const leave = () => { m.style.transform = ''; };
      m.addEventListener('pointermove', move);
      m.addEventListener('pointerleave', leave);
      return () => { m.removeEventListener('pointermove', move); m.removeEventListener('pointerleave', leave); };
    });

    return () => {
      home.removeAttribute('data-cursor-on');
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('scroll', onScroll);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      handlers.forEach((h) => h());
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={dot} className="cursor" aria-hidden="true">
      <span ref={label} className="cursor-label" />
    </div>
  );
}
