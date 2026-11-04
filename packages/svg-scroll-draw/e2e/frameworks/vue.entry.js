/**
 * The Vue wrapper, mounted with a real Vue app.
 *
 * Render functions rather than SFCs, so no compiler step is needed for the
 * components under test. `speed` is a declared prop on `<ScrollDraw>`, so this
 * exercises the framework's own prop path when the spec changes it.
 *
 * The component watches its options and rebuilds the engine when one really
 * changes, so a new `speed` reaches the running draw — stated as
 * `reactiveOptions: true` and checked by the spec rather than assumed.
 *
 * `native` is not a declared prop of `<ScrollDraw>`, so the draw here may take
 * the native CSS fast path where the browser supports it. That is what a Vue
 * user gets, and it is why the fade below pins `native: false`: the leak
 * assertions need at least one engine that really runs a frame loop.
 */
import { createApp, h, nextTick, ref } from 'vue';
import { ScrollDraw, ScrollAnimate } from '../../dist/vue/index.mjs';

const svg = () =>
  h('svg', { viewBox: '0 0 200 100', preserveAspectRatio: 'none', style: 'width:100%;height:100%;display:block' }, [
    h('path', {
      d: 'M10 50 C 40 10, 80 10, 100 50 S 160 90, 190 50',
      fill: 'none',
      stroke: '#000',
      'stroke-width': 3,
    }),
  ]);

const speed = ref(1);
const tick = ref(0);
let app = null;

const Root = {
  setup() {
    return () =>
      h('div', { 'data-tick': tick.value }, [
        // `stagger` is set for one reason: it disqualifies the native CSS fast
        // path, so this component always runs the JS engine and the leak
        // assertion has a frame loop to detect. With a single path it changes
        // nothing about the drawing. `native` is not a declared prop of
        // <ScrollDraw>, so this is the only way to express it from a template.
        // A fresh `onProgress` and a fresh slot function every render: neither
        // may count as a changed option.
        h(ScrollDraw, { class: 'fw-draw', easing: 'linear', stagger: 0.01, speed: speed.value, onProgress: () => {} }, () => [svg()]),
        h(ScrollAnimate, {
          class: 'fw-anim',
          options: { props: { opacity: [0, 1] }, easing: 'linear', native: false },
        }),
      ]);
  },
};

export const api = {
  reactiveOptions: true,

  mount() {
    speed.value = 1;
    app = createApp(Root);
    app.mount('#root');
  },

  unmount() {
    app?.unmount();
    app = null;
  },

  setSpeed(v) {
    speed.value = v;
  },

  rerender() {
    tick.value++;
    return nextTick();
  },
};
