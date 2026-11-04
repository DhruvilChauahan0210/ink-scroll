'use client';

import { useEffect, useRef } from 'react';
import { scrollCounter } from 'svg-scroll-draw';
import './stat-row.css';

const STATS = [
  { value: 1284500, decimals: 0, unit: '', label: 'Trees planted' },
  { value: 3410, decimals: 0, unit: '\u00a0ha', label: 'Hectares restored' },
  { value: 41.2, decimals: 1, unit: 'k t', label: 'Carbon captured' },
  { value: 86, decimals: 0, unit: '%', label: 'Still growing after three years' },
];

/** One number formatter per stat, so every frame of the count is formatted like the final value. */
const formatter = (decimals: number) => {
  const nf = new Intl.NumberFormat('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return (n: number) => nf.format(n);
};

export function StatRow() {
  const row = useRef<HTMLDListElement>(null);

  useEffect(() => {
    if (!row.current) return;
    const counters = Array.from(row.current.querySelectorAll('.stat-run'), (el, i) =>
      scrollCounter(el, {
        to: STATS[i].value,
        format: formatter(STATS[i].decimals),
        // Finish as the row comes fully into view — a point it reaches even
        // at the very end of the page.
        trigger: { start: 'top bottom', end: 'bottom 90%' },
      }),
    );
    return () => counters.forEach((c) => c.destroy());
  }, []);

  return (
    <dl ref={row} className="stats">
      {STATS.map((s) => {
        const final = formatter(s.decimals)(s.value);
        return (
          <div key={s.label} className="stat">
            <dt>{s.label}</dt>
            <dd>
              {/* Read once, in full, by screen readers. */}
              <span className="stat-sr">{final}{s.unit}</span>
              <span className="stat-num" aria-hidden="true">
                {/* The final value, invisible, holding the width. */}
                <span className="stat-hold">{final}</span>
                {/* What counts. It starts as the real number, so the HTML has it. */}
                <span className="stat-run">{final}</span>
                {s.unit}
              </span>
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
