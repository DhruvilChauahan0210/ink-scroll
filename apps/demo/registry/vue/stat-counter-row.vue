<script setup lang="ts">
/**
 * stat-counter-row — a row of numbers that count up from zero as the row
 * scrolls into view.
 *
 * Built on svg-scroll-draw (MIT): https://svg-scroll-draw.vercel.app/blocks
 * Needs: vue 3, svg-scroll-draw. Styling: Tailwind CSS.
 *
 * Props: eyebrow, stats ({ value, label, prefix?, suffix?, decimals? }[]),
 * className (a plain `class` lands on the <section> too).
 *
 * The default stats are placeholders: replace them with your own. Screen
 * readers get the final value once, not every intermediate number, and the
 * final value reserves its width so the layout does not jump while counting.
 * Reduced motion is handled by the library: the final value is shown at once.
 */

import { computed } from 'vue';
import { ScrollCounter } from 'svg-scroll-draw/vue';

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

const props = withDefaults(defineProps<StatCounterRowProps>(), {
  eyebrow: 'Sample numbers, swap in your own',
  // A factory, so each instance gets its own array.
  stats: (): Stat[] => [
    { value: 12480, label: 'Orders shipped', suffix: '+' },
    { value: 38, label: 'Cities served' },
    { value: 99.2, label: 'On-time rate', suffix: '%', decimals: 1 },
    { value: 4.8, label: 'Average review', suffix: '/5', decimals: 1 },
  ],
  className: '',
});

// Ends on the number's bottom, a point it reaches even at the very end of a
// page; `top 45%` can be out of reach there.
const trigger = { start: 'top bottom', end: 'bottom 90%' };

function formatNumber(n: number, decimals: number): string {
  return n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

const rows = computed(() =>
  props.stats.map((stat) => {
    const decimals = stat.decimals ?? 0;
    const number = formatNumber(stat.value, decimals);
    return {
      ...stat,
      number,
      final: `${stat.prefix ?? ''}${number}${stat.suffix ?? ''}`,
      format: (n: number) => formatNumber(n, decimals),
    };
  }),
);
</script>

<template>
  <section :class="['mx-auto w-full max-w-5xl', className]">
    <p class="font-mono text-xs text-neutral-500 dark:text-neutral-400">
      {{ eyebrow }}
    </p>

    <dl
      class="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-200 lg:grid-cols-4 dark:border-neutral-800 dark:bg-neutral-800"
    >
      <div
        v-for="stat in rows"
        :key="stat.label"
        class="flex flex-col-reverse gap-2 bg-white p-6 sm:p-8 dark:bg-neutral-950"
      >
        <dt class="text-sm text-neutral-600 dark:text-neutral-400">{{ stat.label }}</dt>
        <dd class="text-4xl font-medium tracking-tight text-neutral-950 tabular-nums sm:text-5xl dark:text-neutral-50">
          <span class="sr-only">{{ stat.final }}</span>
          <!-- Both cells of the inline-grid share one grid area: the invisible
               final value holds the width, the counter paints over it. -->
          <span aria-hidden="true" class="inline-flex items-baseline">
            {{ stat.prefix }}<span class="inline-grid">
              <span class="invisible col-start-1 row-start-1">{{ stat.number }}</span>
              <ScrollCounter
                :from="0"
                :to="stat.value"
                :format="stat.format"
                easing="ease-out"
                once
                :trigger="trigger"
                class="col-start-1 row-start-1 text-left"
              />
            </span>
            <span v-if="stat.suffix" class="ml-0.5 text-[0.6em] text-neutral-500 dark:text-neutral-400">{{ stat.suffix }}</span>
          </span>
        </dd>
      </div>
    </dl>
  </section>
</template>
