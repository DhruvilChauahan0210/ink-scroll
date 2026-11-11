<script setup lang="ts">
/**
 * sticky-feature — a left panel that stays in place while the steps on the
 * right scroll past it. The panel tracks the step in view and fills a progress
 * rail as the reader moves through the list.
 *
 * Built on svg-scroll-draw (MIT): https://svg-scroll-draw.vercel.app/blocks
 * Needs: vue 3, svg-scroll-draw. Styling: Tailwind CSS.
 *
 * Props: eyebrow, heading, intro, steps ({ title, body }[]), className (a plain
 * `class` on the component works too: it lands on the <section>).
 *
 * The pin is plain CSS `position: sticky` rather than `scrollPin`, because
 * scrollPin moves the element into a wrapper div and Vue expects to own that
 * node. Sticky does not work inside an ancestor with `overflow: hidden`, so keep
 * this block out of one. Below the `md` breakpoint it becomes a single column.
 *
 * Reduced motion is handled by the library: steps are shown at full opacity and
 * the rail is full. The active-step highlight is state, not motion, so it keeps
 * working either way.
 */

import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { scrollAnimate, type ScrollDrawInstance } from 'svg-scroll-draw';
import { ScrollAnimate, type ScrollAnimateOptions } from 'svg-scroll-draw/vue';

export interface FeatureStep {
  title: string;
  body: string;
}

export interface StickyFeatureProps {
  eyebrow?: string;
  heading?: string;
  intro?: string;
  steps?: FeatureStep[];
  className?: string;
}

const props = withDefaults(defineProps<StickyFeatureProps>(), {
  eyebrow: 'How it works',
  heading: 'Four steps from idea to motion',
  intro: 'The panel stays put while the steps scroll by.',
  // A factory, so each instance gets its own array.
  steps: (): FeatureStep[] => [
    { title: 'Install', body: 'Add one package. It has no dependencies of its own, so nothing else comes with it.' },
    { title: 'Wrap', body: 'Put the component around the SVG or element you want to move.' },
    { title: 'Tune', body: 'Pick an easing and a trigger window. The defaults are a good start.' },
    { title: 'Ship', body: 'Server-rendered markup stays readable. The motion is added in the browser.' },
  ],
  className: '',
});

/**
 * Each step card fades and rises as it enters. One object for the life of the
 * component, so a re-render (the active step changing) never rebuilds a card.
 */
const CARD_OPTIONS: ScrollAnimateOptions = {
  props: { opacity: [0.3, 1], transform: ['translateY(24px)', 'translateY(0px)'] },
  trigger: { start: 'top 85%', end: 'top 55%' },
  easing: 'ease-out',
};

const pad = (n: number): string => String(n).padStart(2, '0');

const active = ref(0);
const listRef = ref<HTMLOListElement | null>(null);
const railRef = ref<HTMLSpanElement | null>(null);

let rail: ScrollDrawInstance | null = null;
let observer: IntersectionObserver | null = null;

// Progress rail: scales from 0 to 1 between the first step reaching the middle
// of the viewport and the last step being fully on screen. The rail sits inside
// the sticky panel, so its own position never changes; `triggerElement`
// measures the scrolling list instead.
function startRail(): void {
  const list = listRef.value;
  const el = railRef.value;
  if (!list || !el) return;

  rail = scrollAnimate(el, {
    props: { transform: ['scaleY(0)', 'scaleY(1)'] },
    triggerElement: list,
    trigger: { start: 'top 60%', end: 'bottom 85%' },
    easing: 'linear',
  });
}

// Active step: the last step with any part in the top half of the viewport.
// A set of visible steps, rather than a thin band, so a fast scroll that jumps
// a step straight past the middle still lands on the right one.
function observeSteps(): void {
  observer?.disconnect();
  observer = null;

  const list = listRef.value;
  if (!list || typeof IntersectionObserver === 'undefined') return;

  const items = Array.from(list.querySelectorAll<HTMLElement>('[data-step]'));
  const inView = new Set<number>();
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const index = Number((entry.target as HTMLElement).dataset.step);
        if (entry.isIntersecting) inView.add(index);
        else inView.delete(index);
      }
      if (inView.size) active.value = Math.max(...inView);
    },
    { rootMargin: '0px 0px -50% 0px' },
  );
  items.forEach((item) => io.observe(item));
  observer = io;
}

onMounted(() => {
  startRail();
  observeSteps();
});

// Re-observe when the step <li>s are replaced, not on every new array. They are
// keyed by title, so a new array with the same titles keeps them, while a step
// added, removed or renamed (a locale switch, say) brings new ones that the old
// observer would never see. `flush: 'post'` waits for them to be in the DOM.
watch(() => JSON.stringify(props.steps.map((step) => step.title)), observeSteps, { flush: 'post' });

onBeforeUnmount(() => {
  // destroy() puts back the rail's own inline style.
  rail?.destroy();
  rail = null;
  observer?.disconnect();
  observer = null;
});
</script>

<template>
  <section :class="['mx-auto grid w-full max-w-5xl gap-10 md:grid-cols-2 md:gap-16', className]">
    <!-- Pinned panel -->
    <div class="md:sticky md:top-24 md:self-start">
      <p class="font-mono text-xs text-neutral-600 dark:text-neutral-400">
        {{ eyebrow }}
      </p>
      <h2 class="mt-3 text-3xl font-medium tracking-tight text-neutral-950 sm:text-4xl dark:text-neutral-50">
        {{ heading }}
      </h2>
      <p class="mt-3 text-neutral-600 dark:text-neutral-400">{{ intro }}</p>

      <div class="mt-8 hidden gap-5 md:flex">
        <span class="relative w-1 shrink-0 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
          <span ref="railRef" class="absolute inset-0 origin-top bg-[#ff90e8]" style="transform: scaleY(0)" />
        </span>
        <ol class="space-y-3">
          <li
            v-for="(step, i) in steps"
            :key="step.title"
            :aria-current="i === active ? 'step' : undefined"
            :class="[
              'flex items-baseline gap-3 text-sm transition-colors duration-300',
              i === active
                ? 'font-semibold text-neutral-950 dark:text-neutral-50'
                : 'text-neutral-600 dark:text-neutral-400',
            ]"
          >
            <span class="font-mono text-xs">{{ pad(i + 1) }}</span>{{ step.title }}
          </li>
        </ol>
      </div>
    </div>

    <!-- Scrolling steps -->
    <ol ref="listRef" class="space-y-6 md:space-y-[30vh] md:py-[10vh]">
      <li v-for="(step, i) in steps" :key="step.title" :data-step="i">
        <ScrollAnimate
          :options="CARD_OPTIONS"
          class="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8 dark:border-neutral-800 dark:bg-neutral-950"
        >
          <span class="font-mono text-xs text-neutral-600 dark:text-neutral-400">Step {{ pad(i + 1) }}</span>
          <h3 class="mt-2 text-xl font-semibold text-neutral-950 dark:text-neutral-50">{{ step.title }}</h3>
          <p class="mt-2 leading-relaxed text-neutral-600 dark:text-neutral-400">{{ step.body }}</p>
        </ScrollAnimate>
      </li>
    </ol>
  </section>
</template>
