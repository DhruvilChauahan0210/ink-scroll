'use client';

import { useEffect } from 'react';

/** Buttons marked `data-magnetic` lean a few pixels toward the pointer. */
export function Magnetic() {
  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const els = Array.from(document.querySelectorAll<HTMLElement>('.home [data-magnetic]'));
    const offs = els.map((m) => {
      const move = (e: PointerEvent) => {
        const r = m.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        m.style.transform = `translate(${(dx * 0.22).toFixed(1)}px, ${(dy * 0.22).toFixed(1)}px)`;
      };
      const leave = () => { m.style.transform = ''; };
      m.addEventListener('pointermove', move);
      m.addEventListener('pointerleave', leave);
      return () => { m.removeEventListener('pointermove', move); m.removeEventListener('pointerleave', leave); };
    });
    return () => offs.forEach((off) => off());
  }, []);
  return null;
}
