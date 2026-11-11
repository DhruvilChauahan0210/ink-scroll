'use client';

/**
 * stat-counter-row — a row of numbers that count up from zero as the row
 * scrolls into view.
 *
 * Built on svg-scroll-draw (MIT): https://svg-scroll-draw.vercel.app/blocks
 * Needs: react, svg-scroll-draw. Styling: Tailwind CSS.
 *
 * The default stats are placeholders: replace them with your own. Screen
 * readers get the final value once, not every intermediate number, and the
 * final value reserves its width so the layout does not jump while counting.
 * Reduced motion is handled by the library: the final value is shown at once.
 */

import { ScrollCounter } from 'svg-scroll-draw/react';

export interface Stat {
  value: number;
  label: string;
  prefix?: string;
  suffix?: string;
  /** Digits after the decimal point. Default 0. */
  decimals?: number;
}

export interface StatCounterRowProps {
  eyebrow?: string;
  stats?: Stat[];
  className?: string;
}

const DEFAULT_STATS: Stat[] = [
  { value: 12480, label: 'Orders shipped', suffix: '+' },
  { value: 38, label: 'Cities served' },
  { value: 99.2, label: 'On-time rate', suffix: '%', decimals: 1 },
  { value: 4.8, label: 'Average review', suffix: '/5', decimals: 1 },
];

function formatNumber(n: number, decimals: number): string {
  return n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function StatCounterRow({
  eyebrow = 'Sample numbers, swap in your own',
  stats = DEFAULT_STATS,
  className = '',
}: StatCounterRowProps) {
  return (
    <section className={`mx-auto w-full max-w-5xl ${className}`}>
      <p className="font-mono text-xs text-neutral-600 dark:text-neutral-400">
        {eyebrow}
      </p>

      <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-200 lg:grid-cols-4 dark:border-neutral-800 dark:bg-neutral-800">
        {stats.map((stat) => {
          const decimals = stat.decimals ?? 0;
          const final = `${stat.prefix ?? ''}${formatNumber(stat.value, decimals)}${stat.suffix ?? ''}`;

          return (
            <div key={stat.label} className="flex flex-col-reverse gap-2 bg-white p-6 sm:p-8 dark:bg-neutral-950">
              <dt className="text-sm text-neutral-600 dark:text-neutral-400">{stat.label}</dt>
              <dd className="text-4xl font-medium tracking-tight text-neutral-950 tabular-nums sm:text-5xl dark:text-neutral-50">
                <span className="sr-only">{final}</span>
                <span aria-hidden="true" className="inline-flex items-baseline">
                  {stat.prefix}
                  {/* Both cells share one grid area: the invisible final value
                      holds the width, the counter paints over it. */}
                  <span className="inline-grid">
                    <span className="invisible col-start-1 row-start-1">{formatNumber(stat.value, decimals)}</span>
                    <ScrollCounter
                      from={0}
                      to={stat.value}
                      format={(n) => formatNumber(n, decimals)}
                      easing="ease-out"
                      once
                      // Ends on the number's bottom, a point it reaches even at the
                      // very end of a page; `top 45%` can be out of reach there.
                      trigger={{ start: 'top bottom', end: 'bottom 90%' }}
                      className="col-start-1 row-start-1 text-left"
                    />
                  </span>
                  {stat.suffix && <span className="ml-0.5 text-[0.6em] text-neutral-600 dark:text-neutral-400">{stat.suffix}</span>}
                </span>
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}

export default StatCounterRow;
