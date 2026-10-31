'use client';

import { useEffect, useRef } from 'react';

/**
 * The cursor is a brush. Moving over the hero lays down ink whose width
 * follows the hand's speed — slow is thick, fast is thin — and every
 * frame fades the canvas a little, so the mark lives for about a second.
 * Pointer-only; on touch there is nothing to hover.
 */
export function InkTrail() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const hero = canvas?.parentElement;
    if (!canvas || !hero) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let dpr = 1;
    let ink = '#000';
    const readInk = () => { ink = getComputedStyle(hero).color; };
    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      const r = hero.getBoundingClientRect();
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
      canvas.style.width = `${r.width}px`;
      canvas.style.height = `${r.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    };
    resize();
    readInk();

    const themeWatch = new MutationObserver(readInk);
    themeWatch.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    let last: { x: number; y: number; t: number } | null = null;
    let width = 6;
    let active = false;
    let raf = 0;

    const fade = () => {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0,0,0,0.045)';
      ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      ctx.globalCompositeOperation = 'source-over';
      raf = requestAnimationFrame(fade);
    };

    const onMove = (e: PointerEvent) => {
      const r = hero.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      const t = performance.now();
      if (!active) { active = true; raf = requestAnimationFrame(fade); }
      if (last) {
        const dt = Math.max(8, t - last.t);
        const speed = Math.hypot(x - last.x, y - last.y) / dt; // px per ms
        const target = Math.max(1.5, Math.min(16, 15 - speed * 7));
        width += (target - width) * 0.3;
        ctx.strokeStyle = ink;
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.moveTo(last.x, last.y);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
      last = { x, y, t };
    };
    const onLeave = () => { last = null; };

    hero.addEventListener('pointermove', onMove);
    hero.addEventListener('pointerleave', onLeave);
    window.addEventListener('resize', resize);
    return () => {
      hero.removeEventListener('pointermove', onMove);
      hero.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('resize', resize);
      themeWatch.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  return <canvas ref={ref} className="trail" aria-hidden="true" />;
}
