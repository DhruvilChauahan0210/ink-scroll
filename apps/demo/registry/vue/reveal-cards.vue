<script setup lang="ts">
/**
 * reveal-cards — a grid of feature cards that fade up one after another as the
 * grid scrolls into view.
 *
 * Built on svg-scroll-draw (MIT): https://svg-scroll-draw.vercel.app/blocks
 * Needs: vue 3, svg-scroll-draw. Styling: Tailwind CSS.
 *
 * Props: eyebrow, heading, cards ({ title, body }[]), className.
 *
 * Each card reveals once and stays revealed. Reduced motion is handled by the
 * library: every card is shown in its final state, with no animation.
 */

import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { scrollReveal, type ScrollRevealInstance } from 'svg-scroll-draw/reveal';

export interface RevealCard {
  title: string;
  body: string;
}

export interface RevealCardsProps {
  eyebrow?: string;
  heading?: string;
  cards?: RevealCard[];
  className?: string;
}

const props = withDefaults(defineProps<RevealCardsProps>(), {
  eyebrow: 'Features',
  heading: 'Everything moves when it should.',
  // A factory, so each instance gets its own array.
  cards: (): RevealCard[] => [
    { title: 'Draw on scroll', body: 'SVG paths ink themselves in as the reader scrolls, tied to their position.' },
    { title: 'Reveal anything', body: 'Fade, slide or scale any element into place. One call for a whole grid.' },
    { title: 'Count up', body: 'Numbers climb from zero to their value as the section comes into view.' },
    { title: 'Split text', body: 'Headlines arrive word by word or letter by letter, still one string in the DOM.' },
    { title: 'Pin and scrub', body: 'Hold a panel in place while the story scrolls past it.' },
    { title: 'Motion-aware', body: 'Visitors who ask for reduced motion get the finished page, not the animation.' },
  ],
  className: '',
});

const gridRef = ref<HTMLUListElement | null>(null);
let reveal: ScrollRevealInstance | null = null;

function start(): void {
  const grid = gridRef.value;
  if (!grid) return;

  const items = Array.from(grid.querySelectorAll<HTMLElement>('[data-reveal-card]'));
  // `stagger` starts each card in a row a fifth of the way into its
  // neighbour's reveal, so cards in the same row still arrive in reading order.
  reveal = scrollReveal(items, {
    from: { opacity: 0, y: 40, scale: 0.97 },
    stagger: 0.2,
    once: true,
  });
}

function stop(): void {
  // destroy() restores the original inline styles, so a rebuild starts clean.
  reveal?.destroy();
  reveal = null;
}

onMounted(start);

// Rebuild only when the number of cards changes, not on every new array.
// `flush: 'post'` waits for the new list to be in the DOM before reading it.
watch(
  () => props.cards.length,
  () => {
    stop();
    start();
  },
  { flush: 'post' },
);

onBeforeUnmount(stop);
</script>

<template>
  <section :class="['mx-auto w-full max-w-5xl', className]">
    <p class="font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">
      {{ eyebrow }}
    </p>
    <h2 class="mt-3 text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl dark:text-neutral-50">
      {{ heading }}
    </h2>

    <ul ref="gridRef" class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <li
        v-for="(card, i) in cards"
        :key="card.title"
        data-reveal-card=""
        class="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-950"
      >
        <span
          class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#ff90e8] font-mono text-xs font-bold text-neutral-950"
        >
          {{ String(i + 1).padStart(2, '0') }}
        </span>
        <h3 class="mt-4 text-lg font-semibold text-neutral-950 dark:text-neutral-50">{{ card.title }}</h3>
        <p class="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">{{ card.body }}</p>
      </li>
    </ul>
  </section>
</template>
