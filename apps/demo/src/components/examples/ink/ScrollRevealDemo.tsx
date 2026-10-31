'use client';

import './ui-b.css';
import { useEffect, useRef } from 'react';
import { scrollReveal } from 'svg-scroll-draw/reveal';

/**
 * scrollReveal — a product's features grid, the section AOS is usually
 * installed for. The hairline grid is the sheet and stays put; each cell's
 * contents fade up into it, one after another, from a single call.
 */

type Icon = 'sync' | 'offline' | 'lock' | 'link' | 'search' | 'history';

/* 24 × 24 line glyphs, stroked in currentColor. */
const ICONS: Record<Icon, string[]> = {
  sync: [
    'M4.5 12 A7.5 7.5 0 0 1 17.8 7.2',
    'M13.9 5.9 L17.8 7.2 L17.3 3.1',
    'M19.5 12 A7.5 7.5 0 0 1 6.2 16.8',
    'M10.1 18.1 L6.2 16.8 L6.7 20.9',
  ],
  offline: [
    'M7 18 H17.5 A3.5 3.5 0 0 0 17.9 11 A5.5 5.5 0 0 0 7.3 9.6 A4.2 4.2 0 0 0 7 18 Z',
    'M4 4 L20 20',
  ],
  lock: ['M6 11 H18 V20.5 H6 Z', 'M8.5 11 V8 A3.5 3.5 0 0 1 15.5 8 V11', 'M12 14.5 V17'],
  link: [
    'M10 14 L14 10',
    'M11 7.5 L13 5.5 A3.9 3.9 0 0 1 18.5 11 L16.5 13',
    'M13 16.5 L11 18.5 A3.9 3.9 0 0 1 5.5 13 L7.5 11',
  ],
  search: ['M10.5 4 A6.5 6.5 0 1 0 10.5 17 A6.5 6.5 0 1 0 10.5 4 Z', 'M15.2 15.2 L20 20'],
  history: ['M12 4 A8 8 0 1 0 12 20 A8 8 0 1 0 12 4 Z', 'M12 7.5 V12 L15 14'],
};

const FEATURES: { title: string; body: string; icon: Icon }[] = [
  { title: 'Live sync', body: 'Edits land on every device as you type.', icon: 'sync' },
  { title: 'Works offline', body: 'Keep writing on a plane; it merges on landing.', icon: 'offline' },
  { title: 'End-to-end encrypted', body: 'Keys stay on your devices, never on ours.', icon: 'lock' },
  { title: 'Share by link', body: 'Read-only or editable, revoked in one click.', icon: 'link' },
  { title: 'Instant search', body: 'Every note and attachment, as you type.', icon: 'search' },
  { title: 'Version history', body: 'Step back to any save from the past year.', icon: 'history' },
];

export function ScrollRevealDemo() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const cells = Array.from(containerRef.current.querySelectorAll<HTMLElement>('.xb-rv-cell'));
    const inst = scrollReveal(cells, {
      preset:  'fadeUp',
      stagger: 0.12,
      once:    true,
    });
    return () => inst.destroy();
  }, []);

  return (
    <div ref={containerRef} className="xb-rv">
      <div className="xb-rv-head">
        <span className="xb-label">Features</span>
        <code className="xb-rv-call">scrollReveal · fadeUp · stagger 0.12</code>
      </div>
      <p className="xb-rv-title">Everything syncs. Nothing leaks.</p>
      <ul className="xb-rv-grid">
        {FEATURES.map((f, i) => (
          <li key={f.title} className="xb-rv-slot">
            <div className="xb-rv-cell">
              <span className="xb-rv-n">{String(i + 1).padStart(2, '0')}</span>
              <svg className="xb-rv-icon" viewBox="0 0 24 24" aria-hidden="true">
                {ICONS[f.icon].map((d) => <path key={d} d={d} />)}
              </svg>
              <span className="xb-rv-name">{f.title}</span>
              <span className="xb-rv-body">{f.body}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
