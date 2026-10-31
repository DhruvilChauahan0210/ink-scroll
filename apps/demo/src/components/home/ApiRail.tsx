'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { scrollAnimate } from 'svg-scroll-draw';

export type RailItem = { name: string; desc: string; entry: string; href: string };

/**
 * The eight APIs on a pinned horizontal rail: the stage is as tall as the
 * rail is wide, so one pixel of wheel moves the rail one pixel sideways.
 * The translate is scrubbed by the library's own scrollAnimate; the trigger
 * is measured on the tall stage, never on the sticky child.
 */
export function ApiRail({ items }: { items: RailItem[] }) {
  const stage = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const s = stage.current;
    const t = track.current;
    if (!s || !t) return;

    let instance: { destroy(): void } | null = null;
    const build = () => {
      instance?.destroy();
      const travel = Math.max(0, t.scrollWidth - s.clientWidth);
      s.style.height = `${window.innerHeight + travel}px`;
      instance = scrollAnimate(t, {
        props: { transform: ['translateX(0px)', `translateX(${-travel}px)`] },
        trigger: { start: 'top top', end: 'bottom bottom' },
        triggerElement: s,
        easing: 'linear',
      });
    };
    build();

    let timer: ReturnType<typeof setTimeout>;
    const onResize = () => { clearTimeout(timer); timer = setTimeout(build, 120); };
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); clearTimeout(timer); instance?.destroy(); };
  }, []);

  return (
    <div ref={stage} className="rail-stage">
      <div className="rail-sticky">
        <div ref={track} className="rail-track">
          {items.map((it, i) => (
            <Link href={it.href} className="rail-card" key={it.name} data-cursor="open">
              <span className="rail-n">{String(i + 1).padStart(2, '0')}</span>
              <span className="rail-name">{it.name}</span>
              <span className="rail-desc">{it.desc}</span>
              <span className="rail-entry">{it.entry}</span>
            </Link>
          ))}
          <Link href="/docs" className="rail-card rail-end" data-cursor="docs">
            <span className="rail-n">→</span>
            <span className="rail-name"><em>Every option,</em> documented.</span>
            <span className="rail-entry">svg-scroll-draw.vercel.app/docs</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
