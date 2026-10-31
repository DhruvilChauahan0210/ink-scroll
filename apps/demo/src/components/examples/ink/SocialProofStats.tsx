'use client';

import './ui-a.css';
import { useEffect, useRef } from 'react';
import { scrollAnimate, scrollCounter } from 'svg-scroll-draw';
import { ScrollDraw } from 'svg-scroll-draw/react';
import { SELF } from '@/data/competitors';
import { BROWSER_TESTS, UNIT_TESTS } from '@/data/facts';

/* Line glyphs, 24 × 24, drawn by the library as the strip arrives. */
const ICONS = {
  unit: ['M12 2.5 A9.5 9.5 0 1 0 12 21.5 A9.5 9.5 0 1 0 12 2.5 Z', 'M7.8 12.3 L10.8 15.3 L16.3 9.3'],
  browser: ['M2.8 4.5 H21.2 V19.5 H2.8 Z', 'M2.8 8.5 H21.2', 'M8.6 14 L11 16.4 L15.6 11.8'],
  size: ['M12 2.8 L20.5 7.4 V16.6 L12 21.2 L3.5 16.6 V7.4 Z', 'M3.5 7.4 L12 12 L20.5 7.4', 'M12 12 V21.2'],
  none: ['M12 4.5 A7.5 7.5 0 1 0 12 19.5 A7.5 7.5 0 1 0 12 4.5 Z', 'M5 20 L19 4'],
};

/* Real figures only: the test counts check:claims guards, the measured size
   of the main entry, and the dependency count from package.json. */
const STATS = [
  { to: UNIT_TESTS, label: 'Unit tests', src: 'vitest', icon: ICONS.unit, fmt: (n: number) => Math.round(n).toLocaleString('en-US') },
  { to: BROWSER_TESTS * 3, label: 'Browser tests', src: `${BROWSER_TESTS} × chromium, firefox, webkit`, icon: ICONS.browser, fmt: (n: number) => Math.round(n).toLocaleString('en-US') },
  { to: SELF.gzipKb, label: 'KB gzipped', src: 'main entry, all APIs', icon: ICONS.size, fmt: (n: number) => n.toFixed(1) },
  { to: 0, label: 'Dependencies', src: 'package.json', icon: ICONS.none, fmt: (n: number) => Math.round(n).toString() },
];

/**
 * scrollCounter with a format function per figure, plus scrollAnimate on each
 * cell: the cells rise in a few percent apart and their numbers count up from
 * zero as they come.
 */
export function SocialProofStats() {
  const numRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const nums = numRefs.current;
    const items = itemRefs.current;
    const insts = STATS.flatMap((s, i) => {
      const num = nums[i];
      const item = items[i];
      return [
        num && scrollCounter(num, {
          to: s.to, format: s.fmt, easing: 'ease-out', once: true,
          trigger: { start: `top ${86 - i * 4}%`, end: `top ${46 - i * 4}%` },
        }),
        item && scrollAnimate(item, {
          props: { opacity: [0, 1], transform: ['translateY(18px)', 'translateY(0)'] },
          trigger: { start: `top ${88 - i * 4}%`, end: `top ${54 - i * 4}%` },
          easing: 'ease-out', once: true,
        }),
      ];
    }).filter(Boolean);
    return () => insts.forEach((i) => i && i.destroy());
  }, []);

  return (
    <section className="xa-stats" aria-label="The project in numbers">
      <p className="xa-label">
        <span>Measured, not estimated</span>
        <span>v{SELF.version}</span>
      </p>
      <ScrollDraw className="xa-stats-grid" selector=".xa-ink" trigger={{ start: 'top 88%', end: 'top 50%' }} stagger={0.03} easing="ease-out" once>
        {STATS.map((s, i) => (
          <div key={s.label} className="xa-stat" ref={(el) => { itemRefs.current[i] = el; }}>
            <svg className="xa-ico" viewBox="0 0 24 24" aria-hidden="true">
              {s.icon.map((d) => <path key={d} d={d} className="xa-ink" stroke="currentColor" />)}
            </svg>
            <span className={`xa-stat-n${s.to === 0 ? ' is-a' : ''}`} ref={(el) => { numRefs.current[i] = el; }}>
              {s.fmt(0)}
            </span>
            <span className="xa-stat-l">{s.label}</span>
            <span className="xa-stat-s">{s.src}</span>
          </div>
        ))}
      </ScrollDraw>
    </section>
  );
}
