import type { FrameworkGuide } from './types';

/**
 * The Vue 3 sections of /vue-scroll-animation. Every claim is read from
 * packages/svg-scroll-draw/src/vue/index.ts and src/core/reactive.ts, and from
 * what e2e/frameworks.spec.ts (vue row) and src/__tests__/vueProps.test.ts
 * check. If the wrapper changes, these change with it. What Vue's SFC compiler
 * does with a template (inline handlers cached unless they use a v-for or slot
 * variable, a literal prop marked constant) was read from the samples compiled
 * with @vue/compiler-sfc 3.5.
 */
export const GUIDE: FrameworkGuide = {
  slug: 'vue-scroll-animation',
  sections: [
    {
      id: 'fw-vue-getters',
      k: 'composables',
      title: 'Pass a getter to keep options live',
      body: [
        'Each composable takes its options as a plain object, a `ref` (a `computed` counts) or a getter function. A getter or a ref is read inside a Vue `watch`. When a value it reads changes, the old engine is destroyed and a new one starts on the same element with the new values: a scroll-linked draw picks up at the current scroll position, and an `autoplay` draw plays again from the start once it is in view. A plain object gives the watch nothing to track, so it is read once.',
        'Only the argument is unwrapped, not the fields inside it. With `const speed = ref(1)`, `useScrollDraw({ speed })` hands the engine the ref object instead of the number. Write `useScrollDraw(() => ({ speed: speed.value }))`. Props destructured from `defineProps()` in Vue 3.5 follow the same rule: inside a getter they stay live, in a plain object they are read at setup.',
        'The watch compares a fingerprint of the options (`optionsKey`), not the object. A getter that returns a new object with the same values rebuilds nothing.',
      ],
      sample: {
        file: 'DrawOnScroll.vue',
        code: `<script setup>
import { useScrollDraw } from 'svg-scroll-draw/vue';

const { speed = 1, easing = 'ease-out' } = defineProps({
  speed: Number,
  easing: String,
});

// Live: the draw is rebuilt when either prop changes.
const container = useScrollDraw(() => ({ speed, easing }));

// Read once at setup: useScrollDraw({ speed, easing })
</script>

<template>
  <div ref="container">
    <slot />
  </div>
</template>`,
      },
    },
    {
      id: 'fw-vue-rerender',
      k: 're-renders',
      title: 'Re-renders keep the running draw',
      body: [
        'The components read every option prop inside their watch, but rebuild only when the options differ by value. `:trigger="{ start: step.start }"` builds a new object each time the parent renders; while `step.start` holds the same string the contents are equal, so the running draw stays. Vue\'s template compiler marks a literal with nothing reactive in it, such as `:trigger="{ start: \'top 80%\' }"`, as constant and does not pass it again. A different `speed`, easing name or trigger does rebuild.',
        'Functions count as present or absent, never by identity. The engine gets wrappers that call the latest function under the same name (`liveFns`), so a callback or a custom `easing` function that changes between renders takes effect without a rebuild. In an SFC template Vue caches an inline handler such as `@progress="p => (pct = p)"`, so it never changes. One that uses a `v-for` or slot variable, like `@progress="p => (step.pct = p)"`, is a new function on every render, as is any arrow in a render function or JSX. Adding or removing a callback does rebuild. The browser suite re-renders a real Vue app with a fresh `onProgress` arrow on `<ScrollDraw>` and a fresh options object on `<ScrollAnimate>`, and requires the same engine afterwards.',
        'Only top-level functions are read live. The callbacks inside `waypoints` stay the ones the engine was built with until something else rebuilds it. One that closes over a ref still reads its current `.value`.',
      ],
      sample: {
        file: 'StepList.vue',
        code: `<script setup>
import { reactive } from 'vue';
import { ScrollDraw } from 'svg-scroll-draw/vue';

const steps = reactive([
  { id: 'plan', start: 'top 85%', pct: 0 },
  { id: 'build', start: 'top 70%', pct: 0 },
  { id: 'ship', start: 'top 55%', pct: 0 },
]);
</script>

<template>
  <ol>
    <li v-for="step in steps" :key="step.id">
      {{ step.id }} {{ Math.round(step.pct * 100) }}%
      <!-- Each progress call re-renders the list: a new trigger object
           and a new arrow for every row, equal by value, so no draw
           restarts -->
      <ScrollDraw :trigger="{ start: step.start }" @progress="p => (step.pct = p)">
        <svg viewBox="0 0 240 24" fill="none" stroke="currentColor">
          <path d="M4 12 C 60 2, 180 22, 236 12" />
        </svg>
      </ScrollDraw>
    </li>
  </ol>
</template>`,
      },
    },
    {
      id: 'fw-vue-props',
      k: 'props',
      title: 'Every option is a prop on <ScrollDraw>',
      body: [
        'Since 2.19.0 the component declares a prop for each key of `ScrollDrawOptions`, typed against it with `satisfies`, so a missing or extra key is a type error. Before, it declared 12: `preset`, `native`, `axis`, `strokeColor` and the rest landed on the div as attributes and never reached the engine. Kebab-case works (`stroke-color`), and the callbacks are props too, so `@progress`, `@enter` and `@leave-back` arrive as `onProgress`, `onEnter` and `onLeaveBack`.',
        'Boolean options work bare: `<ScrollDraw once fade>` passes `true` for both. `clip` takes a bare attribute (the left edge) or an edge name, and `velocityScale` takes a bare attribute or a number. A boolean you leave out stays undefined instead of becoming `false`, so `preset="reveal"` keeps the fade and the once it sets, and an absent `native` still means the native CSS path when the browser and the options allow it.',
        'Attributes that are not options, such as `class`, `id`, `data-*` and `aria-*`, fall through to the wrapping div as they do on any Vue component. `<ScrollAnimate>`, `<ScrollVideo>` and `<ScrollText>` take their options as one `:options` object, compared the same way. `<ScrollCounter>` takes them as props (`to`, `from`, `format`, `decimals` and the rest) and leaves an absent `once` to the engine, which defaults it to true.',
      ],
      sample: {
        file: 'BrandMark.vue',
        code: `<script setup>
import { ScrollDraw } from 'svg-scroll-draw/vue';

const emit = defineEmits(['drawn']);
</script>

<template>
  <!-- preset, stroke-color, once and @complete reach the engine;
       class and aria-hidden land on the div -->
  <ScrollDraw
    preset="sketch"
    stroke-color="#42b883"
    once
    class="brand-mark"
    aria-hidden="true"
    @complete="emit('drawn')"
  >
    <svg viewBox="0 0 200 120" fill="none" stroke="currentColor" stroke-width="8">
      <path d="M20 100 L 60 20 L 100 100" />
      <path d="M100 100 L 140 20 L 180 100" />
    </svg>
  </ScrollDraw>
</template>`,
      },
    },
  ],
};
