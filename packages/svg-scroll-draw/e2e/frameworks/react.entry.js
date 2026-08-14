/**
 * The React wrapper, mounted for real with react-dom.
 *
 * `React.createElement` rather than JSX so the bundle needs no transform config;
 * what is under test is the wrapper's effect lifecycle, not the syntax.
 *
 * Options are deliberately passed as props on the components, which is the only
 * way a React user can pass them — and `useEffect(..., [])` means they are read
 * once. `reactiveOptions: false` states that; the spec checks it.
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { ScrollDraw, ScrollAnimate } from '../../dist/react/index.mjs';

const h = React.createElement;

const svg = () =>
  h(
    'svg',
    { viewBox: '0 0 200 100', preserveAspectRatio: 'none', style: { width: '100%', height: '100%', display: 'block' } },
    h('path', {
      d: 'M10 50 C 40 10, 80 10, 100 50 S 160 90, 190 50',
      fill: 'none',
      stroke: '#000',
      strokeWidth: 3,
    }),
  );

let root = null;
let applySpeed = null;

function App() {
  const [speed, setSpeed] = React.useState(1);
  applySpeed = setSpeed;

  return h(
    React.Fragment,
    null,
    h(
      ScrollDraw,
      { className: 'fw-draw', easing: 'linear', native: false, speed },
      svg(),
    ),
    h(
      ScrollAnimate,
      { className: 'fw-anim', props: { opacity: [0, 1] }, easing: 'linear', native: false },
      null,
    ),
  );
}

export const api = {
  reactiveOptions: false,

  mount() {
    root = createRoot(document.querySelector('#root'));
    // Synchronous so the fixture is measurable the moment it is ready.
    React.act ? React.act(() => root.render(h(App))) : root.render(h(App));
  },

  unmount() {
    root?.unmount();
    root = null;
    applySpeed = null;
  },

  setSpeed(v) {
    applySpeed?.(v);
  },
};
