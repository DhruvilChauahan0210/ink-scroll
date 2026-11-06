<script lang="ts" module>
  /**
   * stat-counter-row — a row of numbers that count up from zero as the row
   * scrolls into view.
   *
   * Built on svg-scroll-draw (MIT): https://svg-scroll-draw.vercel.app/blocks
   * Needs: svelte 5, svg-scroll-draw. Styling: Tailwind CSS.
   *
   * Props: eyebrow, stats ({ value, label, prefix?, suffix?, decimals? }[]),
   * className.
   *
   * The default stats are placeholders: replace them with your own. Screen
   * readers get the final value once, not every intermediate number, and the
   * final value reserves its width so the layout does not jump while counting.
   * Reduced motion is handled by the library: the final value is shown at once.
   */

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

  // Ends on the number's bottom, a point it reaches even at the very end of a
  // page; `top 45%` can be out of reach there.
  const TRIGGER = { start: 'top bottom', end: 'bottom 90%' };

  function formatNumber(n: number, decimals: number): string {
    return n.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }
</script>

<script lang="ts">
  import { scrollCounterAction } from 'svg-scroll-draw/svelte';

  let {
    eyebrow = 'Sample numbers, swap in your own',
    stats = DEFAULT_STATS,
    className = '',
  }: StatCounterRowProps = $props();
</script>

<section class="mx-auto w-full max-w-5xl {className}">
  <p class="font-mono text-xs text-neutral-500 dark:text-neutral-400">
    {eyebrow}
  </p>

  <dl
    class="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-200 lg:grid-cols-4 dark:border-neutral-800 dark:bg-neutral-800"
  >
    {#each stats as stat (stat.label)}
      {@const decimals = stat.decimals ?? 0}
      {@const number = formatNumber(stat.value, decimals)}
      {@const final = `${stat.prefix ?? ''}${number}${stat.suffix ?? ''}`}

      <div class="flex flex-col-reverse gap-2 bg-white p-6 sm:p-8 dark:bg-neutral-950">
        <dt class="text-sm text-neutral-600 dark:text-neutral-400">{stat.label}</dt>
        <dd class="text-4xl font-medium tracking-tight text-neutral-950 tabular-nums sm:text-5xl dark:text-neutral-50">
          <span class="sr-only">{final}</span>
          <!-- Both cells of the inline-grid share one grid area: the invisible
               final value holds the width, the counter paints over it. The
               action rebuilds the counter only when an option really changes. -->
          <span aria-hidden="true" class="inline-flex items-baseline">
            {stat.prefix}<span class="inline-grid">
              <span class="invisible col-start-1 row-start-1">{number}</span>
              <span
                use:scrollCounterAction={{
                  from: 0,
                  to: stat.value,
                  format: (n: number) => formatNumber(n, decimals),
                  easing: 'ease-out',
                  once: true,
                  trigger: TRIGGER,
                }}
                class="col-start-1 row-start-1 text-left"
              ></span>
            </span>
            {#if stat.suffix}
              <span class="ml-0.5 text-[0.6em] text-neutral-500 dark:text-neutral-400">{stat.suffix}</span>
            {/if}
          </span>
        </dd>
      </div>
    {/each}
  </dl>
</section>
