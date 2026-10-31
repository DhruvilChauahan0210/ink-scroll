'use client';

import './ui-a.css';
import { useEffect, useRef } from 'react';
import { scrollAnimate } from 'svg-scroll-draw';
import { ScrollDraw } from 'svg-scroll-draw/react';
import { SELF } from '@/data/competitors';

/* Line glyphs, 24 × 24, drawn by the library as their rows slide in. */
const FEATURES = [
  {
    title: 'Native CSS fast path',
    text: 'A view-timeline with no per-frame JavaScript, and the JS engine everywhere else.',
    icon: ['M12 3.5 L21 8.5 L12 13.5 L3 8.5 Z', 'M3 12.5 L12 17.5 L21 12.5', 'M3 16.5 L12 21.5 L21 16.5'],
  },
  {
    title: 'Your framework, not a new one',
    text: 'React, Vue, Svelte, Solid, Angular, Astro and Nuxt.',
    icon: ['M8 6.5 L2.5 12 L8 17.5', 'M16 6.5 L21.5 12 L16 17.5', 'M13.6 4 L10.4 20'],
  },
  {
    title: `${SELF.gzipKb} KB, nothing else`,
    text: 'The main entry with every API, gzipped. Zero runtime dependencies.',
    icon: ['M12 2.8 L20.5 7.4 V16.6 L12 21.2 L3.5 16.6 V7.4 Z', 'M3.5 7.4 L12 12 L20.5 7.4', 'M12 12 V21.2'],
  },
  {
    title: 'Accessible by default',
    text: 'Honours prefers-reduced-motion. Split text keeps its aria-label.',
    icon: [
      'M12 2.6 A1.8 1.8 0 1 0 12 6.2 A1.8 1.8 0 1 0 12 2.6 Z',
      'M4.5 8.6 L12 10 L19.5 8.6',
      'M12 10 V14.6',
      'M12 14.6 L8.4 21',
      'M12 14.6 L15.6 21',
    ],
  },
];

/**
 * scrollAnimate on each row, with a 5% stagger in the trigger: the rows slide
 * in from the left one after another, and each icon inks in with its row.
 */
export function FeatureLinesDemo() {
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const insts = refs.current.map((el, i) =>
      el && scrollAnimate(el, {
        props: { opacity: [0, 1], transform: ['translateX(-20px)', 'translateX(0)'] },
        trigger: { start: `top ${90 - i * 5}%`, end: `top ${60 - i * 5}%` },
        easing: 'ease-out', once: true, native: false,
      })
    ).filter(Boolean);
    return () => insts.forEach((i) => i?.destroy());
  }, []);

  return (
    <div className="xa-fl">
      <p className="xa-label">
        <span>What you get</span>
        <span>v{SELF.version}</span>
      </p>
      <ScrollDraw className="xa-fl-rows" selector=".xa-ink" trigger={{ start: 'top 88%', end: 'top 45%' }} stagger={0.06} easing="ease-out" once>
        {FEATURES.map((f, i) => (
          <div key={f.title} className="xa-fl-row" ref={(el) => { refs.current[i] = el; }}>
            <svg className="xa-ico" viewBox="0 0 24 24" aria-hidden="true">
              {f.icon.map((d) => <path key={d} d={d} className="xa-ink" stroke="currentColor" />)}
            </svg>
            <span>
              <span className="xa-fl-t">{f.title}</span>
              <span className="xa-fl-d">{f.text}</span>
            </span>
            <span className="xa-fl-n" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
          </div>
        ))}
      </ScrollDraw>
    </div>
  );
}
