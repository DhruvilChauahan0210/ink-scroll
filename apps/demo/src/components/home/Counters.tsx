'use client';

import { ScrollCounter } from 'svg-scroll-draw/react';

type Stat = { to: number; decimals?: number; suffix?: string; label: string; note: string };

const STATS: Stat[] = [
  { to: 10.2, decimals: 1, suffix: ' KB', label: 'gzipped', note: 'the main entry, held to a budget in CI' },
  { to: 623, label: 'unit tests', note: 'including a suite with no DOM at all' },
  { to: 195, suffix: '×3', label: 'browser tests', note: 'per engine: Chromium, Firefox, WebKit' },
  { to: 0, label: 'dependencies', note: 'nothing to audit, nothing to update' },
];

/** The numbers count up as they enter, driven by scroll like everything else. */
export function Counters() {
  return (
    <div className="counters">
      {STATS.map((s, i) => (
        <div className="counter" key={s.label} style={{ '--i': i } as React.CSSProperties}>
          <div className="counter-num">
            <ScrollCounter
              to={s.to}
              from={0}
              decimals={s.decimals ?? 0}
              easing="ease-out"
              trigger={{ start: 'top 92%', end: 'top 50%' }}
              once
            />
            {s.suffix ? <span className="counter-suffix">{s.suffix}</span> : null}
          </div>
          <div className="counter-label">{s.label}</div>
          <div className="counter-note">{s.note}</div>
        </div>
      ))}
    </div>
  );
}
