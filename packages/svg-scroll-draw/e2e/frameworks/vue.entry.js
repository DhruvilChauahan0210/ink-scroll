/**
 * The Vue wrapper, mounted with a real Vue app.
 *
 * Render functions rather than SFCs, so no compiler step is needed for the
 * components under test. `speed` is a declared prop on `<ScrollDraw>`, so this
 * exercises the framework's own prop path when the spec changes it.
 *
 * The component reads its options once in `onMounted`, so a prop change does not
 * reach the running engine — stated as `reactiveOptions: false` and checked by
 * the spec rather than assumed.
 *
 * `native` is not a declared prop of `<ScrollDraw>`, so the draw here may take
 * the native CSS fast path where the browser supports it. That is what a Vue
 * user gets, and it is why the fade below pins `native: false`: the leak
 * assertions need at least one engine that really runs a frame loop.
 */
import { createApp, h, ref } from 'vue';
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
let app = null;

const Root = {
  setup() {
    return () =>
      h('div', null, [
        // `stagger` is set for one reason: it disqualifies the native CSS fast
        // path, so this component always runs the JS engine and the leak
        // assertion has a frame loop to detect. With a single path it changes
        // nothing about the drawing. `native` is not a declared prop of
        // <ScrollDraw>, so this is the only way to express it from a template.
        h(ScrollDraw, { class: 'fw-draw', easing: 'linear', stagger: 0.01, speed: speed.value }, () => [svg()]),
        h(ScrollAnimate, {
          class: 'fw-anim',
          options: { props: { opacity: [0, 1] }, easing: 'linear', native: false },
        }),
      ]);
  },
};

export const api = {
  reactiveOptions: false,

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
};
