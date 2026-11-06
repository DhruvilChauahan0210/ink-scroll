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
 * `<ScrollDraw>` declares every option as a prop (it used to declare 12 of 35,
 * so `native`, `preset`, `strokeColor` and the rest rendered as attributes on
 * the div and never reached the engine). `native: false` keeps both engines on
 * the JS path, so the leak assertions have a frame loop to detect; `data-role`
 * is an ordinary attribute and must fall through to the div.
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
        // A fresh `onProgress` and a fresh slot function every render: neither
        // may count as a changed option.
        h(ScrollDraw, { class: 'fw-draw', 'data-role': 'drawing', easing: 'linear', native: false, speed: speed.value, onProgress: () => {} }, () => [svg()]),
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
