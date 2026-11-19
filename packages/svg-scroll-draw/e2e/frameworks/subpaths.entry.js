/**
 * `svg-scroll-draw/subpaths` with React's and Vue's <ScrollDraw> (subpaths.spec).
 *
 * The two frameworks own the <path> they render. splitSubpaths leaves that
 * node in place holding the first subpath and inserts the rest after it, so a
 * re-render and an unmount must still find their own node and leave no piece
 * behind. Each splits before the drawing starts: React in a layout effect of
 * the svg's own component (layout effects run before <ScrollDraw>'s), Vue in a
 * function ref (set while the element mounts, before any mounted hook).
 * `d` has three subpaths of 360, 180 and 80 px.
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { createApp, h as vh, ref } from 'vue';
import { ScrollDraw as ReactDraw } from '../../dist/react/index.mjs';
import { ScrollDraw as VueDraw } from '../../dist/vue/index.mjs';
import { splitSubpaths, joinSubpaths } from '../../dist/subpaths/index.mjs';

export const D = 'M20 40 H380 M20 100 H200 M20 160 H100';

let reactRoot = null;
let bump = null;

function House({ tick }) {
  const svg = React.useRef(null);
  React.useLayoutEffect(() => {
    splitSubpaths(svg.current);
    const el = svg.current;
    return () => joinSubpaths(el);
  }, []);
  return React.createElement('svg', { ref: svg, viewBox: '0 0 400 200', width: 400, height: 200, style: { display: 'block' } },
    React.createElement('path', { d: D, fill: 'none', stroke: '#111', strokeWidth: 6, className: `p${tick}` }));
}

function App() {
  const [tick, setTick] = React.useState(0);
  bump = setTick;
  return React.createElement(
    ReactDraw,
    { id: 'react-draw', 'data-tick': tick, stagger: 1, native: false, onComplete: () => {} },
    React.createElement(House, { tick }),
  );
}

const vueTick = ref(0);
let vueApp = null;
const VueRoot = {
  setup: () => () =>
    vh(VueDraw, { id: 'vue-draw', 'data-tick': vueTick.value, stagger: 1, native: false, onComplete: () => {} }, {
      default: () =>
        vh('svg', { viewBox: '0 0 400 200', width: 400, height: 200, style: 'display:block', ref: (el) => el && splitSubpaths(el) }, [
          vh('path', { d: D, fill: 'none', stroke: '#111', 'stroke-width': 6, class: `p${vueTick.value}` }),
        ]),
    }),
};

const act = (fn) => (React.act ? React.act(fn) : fn());

export const api = {
  mount() {
    reactRoot = createRoot(document.querySelector('#react'));
    act(() => reactRoot.render(React.createElement(App)));
    vueApp = createApp(VueRoot);
    vueApp.mount('#vue');
  },
  /** A new class on the path in both: the framework patches its own node. */
  async rerender() {
    act(() => bump((t) => t + 1));
    vueTick.value++;
    await new Promise((r) => setTimeout(r, 50));
  },
  unmount() {
    act(() => reactRoot.unmount());
    vueApp.unmount();
  },
};
