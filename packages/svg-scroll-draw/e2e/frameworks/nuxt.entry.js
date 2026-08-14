/**
 * The Nuxt integration.
 *
 * Nuxt itself cannot run in this harness, but the thing the package actually
 * ships for Nuxt can: a Vue plugin that registers every component globally, and
 * a set of re-exports. The documented Option B is
 * `nuxtApp.vueApp.use(createScrollDrawPlugin())` — so this installs the plugin
 * on a real Vue app and then uses the components *by name in a template*, which
 * is the only thing global registration buys you and the only way to tell it
 * actually happened.
 *
 * The template needs Vue's runtime compiler, so this entry is bundled against
 * the full build (see build-fixtures.mjs).
 */
import { createApp, ref } from 'vue';
import { createScrollDrawPlugin, ScrollDraw, ScrollAnimate } from '../../dist/nuxt/index.mjs';

const speed = ref(1);
let app = null;

const Root = {
  // Deliberately by name, with no local `components` option: if the plugin did
  // not register them, Vue resolves these to nothing and renders empty elements.
  template: `
    <div>
      <ScrollDraw class="fw-draw" easing="linear" :stagger="0.01" :speed="speed">
        <svg viewBox="0 0 200 100" preserveAspectRatio="none" style="width:100%;height:100%;display:block">
          <path d="M10 50 C 40 10, 80 10, 100 50 S 160 90, 190 50" fill="none" stroke="#000" stroke-width="3" />
        </svg>
      </ScrollDraw>
      <ScrollAnimate class="fw-anim" :options="animOptions" />
    </div>
  `,
  setup() {
    return {
      speed,
      animOptions: { props: { opacity: [0, 1] }, easing: 'linear', native: false },
    };
  },
};

export const api = {
  reactiveOptions: false,

  mount() {
    speed.value = 1;
    app = createApp(Root);
    app.use(createScrollDrawPlugin());
    app.mount('#root');
  },

  unmount() {
    app?.unmount();
    app = null;
  },

  setSpeed(v) {
    speed.value = v;
  },

  /** Both re-export paths must reach the same components the plugin registers. */
  reexports: () => ({
    scrollDraw: typeof ScrollDraw === 'object',
    scrollAnimate: typeof ScrollAnimate === 'object',
  }),
};
