<script setup lang="ts">
/**
 * headline-text-reveal — a hero headline whose words rise into place one after
 * another as it scrolls into view, followed by the supporting line.
 *
 * Built on svg-scroll-draw (MIT): https://svg-scroll-draw.vercel.app/blocks
 * Needs: vue 3, svg-scroll-draw. Styling: Tailwind CSS.
 *
 * Props: eyebrow, headline, subline, as, trigger, className (a plain `class`
 * lands on the <section> too).
 *
 * The text stays one string in the server HTML, so search engines and screen
 * readers get the full sentence. Reduced motion is handled by the library: the
 * words are shown in place, with no animation.
 *
 * At the very top of a page the headline is already inside the trigger window
 * on load, so it starts part-way revealed. For a reveal that begins as soon as
 * the reader scrolls, pass :trigger="{ start: 'top bottom', end: 'top 20%' }".
 */

import { computed } from 'vue';
import { ScrollText, type ScrollTextOptions } from 'svg-scroll-draw/vue';

export interface HeadlineTextRevealProps {
  eyebrow?: string;
  /** Plain text only: the words are split at runtime. */
  headline?: string;
  /** Plain text only. */
  subline?: string;
  /** Heading level for the headline. Use 'h1' when this is the page's hero. */
  as?: 'h1' | 'h2' | 'h3';
  /** Scroll window for the headline, e.g. { start: 'top 90%', end: 'top 30%' }. */
  trigger?: { start?: string; end?: string };
  className?: string;
}

const props = withDefaults(defineProps<HeadlineTextRevealProps>(), {
  eyebrow: 'Single-origin coffee',
  headline: 'Coffee from three farms, roasted the week you drink it',
  subline: 'Words arrive in reading order, at the pace the reader sets with their own scroll.',
  as: 'h2',
  trigger: () => ({ start: 'top 90%', end: 'top 35%' }),
  className: '',
});

// ScrollText rebuilds its engine when these options change (here: `trigger`),
// and leaves it alone when an equal object is passed again.
const headlineOptions = computed<ScrollTextOptions>(() => ({
  split: 'words',
  stagger: 0.08,
  from: { opacity: 0, y: 32 },
  easing: 'ease-out',
  once: true,
  trigger: props.trigger,
}));

const sublineOptions: ScrollTextOptions = {
  split: 'words',
  stagger: 0.03,
  from: { opacity: 0, y: 12 },
  easing: 'ease-out',
  once: true,
  trigger: { start: 'top 92%', end: 'top 55%' },
};

// The `:key` on each ScrollText below remounts the split if its text changes
// (and the headline's heading level): ScrollText reads its string once, on
// mount, and splits it into word spans.
</script>

<template>
  <section :class="['mx-auto w-full max-w-4xl text-center', className]">
    <p class="font-mono text-xs text-neutral-600 dark:text-neutral-400">
      {{ eyebrow }}
    </p>

    <ScrollText
      :key="`${as}|${headline}`"
      :tag="as"
      :options="headlineOptions"
      class="mt-4 text-[clamp(2.25rem,6vw,4.5rem)] font-medium leading-[0.95] tracking-tight text-neutral-950 text-balance dark:text-neutral-50"
    >
      {{ headline }}
    </ScrollText>

    <ScrollText
      :key="subline"
      tag="p"
      :options="sublineOptions"
      class="mx-auto mt-6 max-w-2xl text-lg text-neutral-600 dark:text-neutral-400"
    >
      {{ subline }}
    </ScrollText>
  </section>
</template>
