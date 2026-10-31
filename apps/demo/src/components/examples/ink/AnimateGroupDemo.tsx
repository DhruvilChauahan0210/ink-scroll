'use client';

import './ui-a.css';
import { useEffect, useRef } from 'react';
import { scrollAnimateGroup } from 'svg-scroll-draw/group';
import { ScrollDraw } from 'svg-scroll-draw/react';

const TRIGGER = { start: 'top 88%', end: 'top 25%' } as const;

/* Line glyphs, 24 × 24, one per API, drawn by the library. */
const CARDS = [
  {
    name: 'scrollAnimate',
    desc: 'Any CSS property, from one value to another.',
    icon: [
      'M3.5 7 H7', 'M11 7 H20.5', 'M9 5 A2 2 0 1 0 9 9 A2 2 0 1 0 9 5 Z',
      'M3.5 12 H13', 'M17 12 H20.5', 'M15 10 A2 2 0 1 0 15 14 A2 2 0 1 0 15 10 Z',
      'M3.5 17 H5', 'M9 17 H20.5', 'M7 15 A2 2 0 1 0 7 19 A2 2 0 1 0 7 15 Z',
    ],
  },
  {
    name: 'scrollCounter',
    desc: 'Numbers that count, with your own format.',
    icon: ['M9.6 3.5 L7.6 20.5', 'M16.4 3.5 L14.4 20.5', 'M4.5 9 H20', 'M4 15 H19.5'],
  },
  {
    name: 'scrollText',
    desc: 'Split into words, chars or lines, then stagger.',
    icon: ['M3.5 6 V4 H15 V6', 'M9.25 4 V19.5', 'M6.75 19.5 H11.75', 'M15.5 12 H20.5', 'M15.5 15.75 H20.5', 'M15.5 19.5 H20.5'],
  },
  {
    name: 'scrollVideo',
    desc: 'A video’s currentTime, scrubbed by scroll.',
    icon: ['M2.8 5 H21.2 V19 H2.8 Z', 'M10 9 L15 12 L10 15 Z'],
  },
];

/**
 * scrollAnimateGroup: one call, one set of options, four cards. Each card
 * tracks its own position, so the grid fans in together.
 */
export function AnimateGroupDemo() {
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const els = refs.current.filter(Boolean) as Element[];
    const group = scrollAnimateGroup(els, {
      props: { opacity: [0, 1], transform: ['translateY(28px)', 'translateY(0)'] },
      easing: 'ease-out',
      once: true,
      trigger: TRIGGER,
      native: false,
    });
    return () => group.destroy();
  }, []);

  return (
    <div className="xa-grp">
      <p className="xa-label">
        <span>One call · four elements</span>
        <span>svg-scroll-draw/group</span>
      </p>
      <ScrollDraw className="xa-grp-grid" selector=".xa-ink" trigger={{ start: 'top 85%', end: 'top 40%' }} stagger={0.02} easing="ease-out" once>
        {CARDS.map((c, i) => (
          <div key={c.name} className="xa-card" ref={(el) => { refs.current[i] = el; }}>
            <div className="xa-card-top">
              <svg className="xa-ico" viewBox="0 0 24 24" aria-hidden="true">
                {c.icon.map((d) => <path key={d} d={d} className="xa-ink" stroke="currentColor" />)}
              </svg>
              <span className="xa-card-n" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
            </div>
            <code className="xa-card-name">{c.name}</code>
            <span className="xa-card-d">{c.desc}</span>
          </div>
        ))}
      </ScrollDraw>
    </div>
  );
}
