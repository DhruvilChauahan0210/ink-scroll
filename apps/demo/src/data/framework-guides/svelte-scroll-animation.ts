import type { FrameworkGuide } from './types';

/**
 * Written against packages/svg-scroll-draw/src/svelte/index.ts and
 * src/core/reactive.ts, and what e2e/fixtures/fw-svelte.html,
 * e2e/frameworks.spec.ts and src/__tests__/framework.test.ts check. If the
 * wrapper changes, this changes with it.
 */
export const GUIDE: FrameworkGuide = {
  slug: 'svelte-scroll-animation',
  sections: [
    {
      id: 'fw-svelte-action',
      k: 'action',
      title: 'The action is a plain function',
      body: [
        '`scrollDraw` is an ordinary function with the shape Svelte expects of an action: it takes the node and your options, and returns `update()` and `destroy()`. Nothing in `svg-scroll-draw/svelte` imports from `svelte`, and the package lists no Svelte peer dependency, so there is no Svelte version for it to mismatch. `use:scrollDraw` does the same thing in a Svelte 4 component and a Svelte 5 one.',
        '`scrollDraw`, `scrollTextAction` and `scrollVideoAction` default their options to `{}`, so a bare `use:scrollDraw` works. `scrollAnimate` needs `props` and `scrollCounterAction` needs `to`, so those two always take a value. `scrollVideoAction` is typed for an `HTMLVideoElement`: put it on the `<video>` itself. `scrollFramesAction` (2.26.0+) needs `frames` and goes on a `<canvas>` you give `role="img"` and an `aria-label`; an inline `frames` function is read by the URLs it gives, so `update()` keeps the film unless they change.',
        'The browser suite calls the action the way Svelte does, on real nodes. After `destroy()` no IntersectionObserver and no animation frame loop is left running, and a second mount on a new node measures its own position again. That is the path an `{#if}` block takes each time it turns false and back to true.',
      ],
      sample: {
        file: 'Tour.svelte',
        code: `<script>
  import { scrollDraw, scrollVideoAction } from 'svg-scroll-draw/svelte';
</script>

<div use:scrollDraw>
  <svg viewBox="0 0 200 100">
    <path d="M10 50 Q 100 10 190 50" stroke="#111" fill="none" />
  </svg>
</div>

<video use:scrollVideoAction src="/tour.mp4" muted playsinline preload="auto"></video>`,
      },
    },
    {
      id: 'fw-svelte-update',
      k: 'update()',
      title: 'New options go through update()',
      body: [
        'Svelte calls the action\'s `update()` with the new parameter whenever a value read in the `use:` expression changes. An inline `{{ ... }}` is a new object each time, even when every value in it is the same. In Svelte 4 the sample below works with `let speed = 1` and `let drawn = 0` in place of the `$state` calls.',
        'The wrapper turns the options into a JSON fingerprint and compares it with the last one. Equal values keep the running engine. A changed value destroys the engine and builds a new one on the same node; for a scroll-linked draw, it jumps to where the new options put it at the current scroll position. The browser suite checks both halves: doubling `speed` halfway through the scroll window takes the drawing from half to complete, and an update with an equal new object starts no second engine.',
        'Functions count only as present or absent. For each top-level function, such as `onProgress` or a custom `easing`, the engine gets a stand-in that calls the latest one you passed, so the fresh `onProgress` arrow on each update rebuilds nothing and is still the one called. A function one level down, such as a `waypoints` callback, gets no stand-in: passing a different one keeps the engine, which still calls the first one. An element in the options, such as `scrollContainer`, is compared by identity: the same element keeps the engine, a different one rebuilds it.',
      ],
      sample: {
        file: 'SpeedControl.svelte',
        code: `<script>
  import { scrollDraw } from 'svg-scroll-draw/svelte';

  let speed = $state(1);
  let drawn = $state(0);
</script>

<input type="range" min="0.5" max="2" step="0.5" bind:value={speed} />

<div use:scrollDraw={{ speed, easing: 'ease-out', onProgress: (p) => (drawn = p) }}>
  <svg viewBox="0 0 200 100">
    <path d="M10 50 Q 100 10 190 50" stroke="#111" fill="none" />
  </svg>
</div>

<p>{Math.round(drawn * 100)}% drawn</p>`,
      },
    },
    {
      id: 'fw-svelte-factories',
      k: 'create*',
      title: 'The factories hand you the instance',
      body: [
        '`createScrollDraw`, `createScrollAnimate`, `createScrollCounter`, `createScrollVideo` and `createScrollText` each return an object, `{ action, getInstance }`, not an array. Apply `action` with `use:`. `getInstance()` gives you the engine for `replay()`, `pause()`, `resume()`, `seek()` and `getProgress()`. It returns `null` until the action has run and again after `destroy()`, so call it with `?.`.',
        'The factories read their options once, when you call them in `<script>`. The action they return takes only the node and has no `update()`, so a `$state` value passed to the factory stays at its first value as far as the engine knows. When an option has to change after mount, use the plain action instead.',
        'One call holds one engine. Apply the same `action` to two nodes and `getInstance()` returns the second node\'s engine. Removing the first node then destroys that second engine, and the first node\'s engine is never destroyed. Call the factory once per element; inside `{#each}`, move the element into its own component so each row makes its own call.',
      ],
      sample: {
        file: 'Signature.svelte',
        code: `<script>
  import { createScrollDraw } from 'svg-scroll-draw/svelte';

  const { action: draw, getInstance } = createScrollDraw({ easing: 'ease-out', fade: true });
</script>

<div use:draw>
  <svg viewBox="0 0 200 100">
    <path d="M10 50 Q 100 10 190 50" stroke="#111" fill="none" />
  </svg>
</div>

<button onclick={() => getInstance()?.seek(1)}>Show it drawn</button>
<button onclick={() => getInstance()?.replay()}>Replay</button>`,
      },
    },
  ],
};
