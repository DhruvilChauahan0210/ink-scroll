/**
 * The Solid wrapper, mounted inside a real reactive root.
 *
 * Solid's JSX needs a compile step this suite does not have, so the DOM is built
 * by hand — which is fine, because the wrapper's whole API is a ref setter:
 * `useScrollDraw(options)` returns a function you hand an element to, and does
 * its work in an effect and `onCleanup`.
 *
 * The draw's options are an accessor over a real signal, which is how a Solid
 * user keeps them live: the effect reads `speed()`, so setting the signal
 * re-runs it and the engine is rebuilt — `reactiveOptions: true`.
 *
 * `createRoot` is the part that matters. `onCleanup` only runs when an owner
 * disposes, so a Solid wrapper that registered its cleanup wrongly would leak on
 * every unmount — and `dispose()` here is exactly what Solid calls when the
 * component's owner goes away.
 */
import { createRoot, createSignal } from 'solid-js';
import { useScrollDraw, useScrollAnimate } from '../../dist/solid/index.mjs';

const SVG_NS = 'http://www.w3.org/2000/svg';

function buildDraw() {
  const box = document.createElement('div');
  box.className = 'fw-draw';
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 200 100');
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.style.cssText = 'width:100%;height:100%;display:block';
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', 'M10 50 C 40 10, 80 10, 100 50 S 160 90, 190 50');
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', '#000');
  path.setAttribute('stroke-width', '3');
  svg.appendChild(path);
  box.appendChild(svg);
  return box;
}

let dispose = null;
const [speed, setSpeedSignal] = createSignal(1);
// Read by the accessor so bumping it re-runs the effect with equal options.
const [tick, setTick] = createSignal(0);

export const api = {
  reactiveOptions: true,

  mount() {
    setSpeedSignal(1);
    const root = document.querySelector('#root');
    dispose = createRoot((d) => {
      const drawRef = useScrollDraw(() => {
        tick();
        return { easing: 'linear', native: false, speed: speed() };
      });
      const animRef = useScrollAnimate({
        props: { opacity: [0, 1] },
        easing: 'linear',
        native: false,
      });

      const draw = buildDraw();
      const anim = document.createElement('div');
      anim.className = 'fw-anim';

      root.append(draw, anim);
      // Hand the elements over the way a `ref={...}` binding would, before
      // Solid runs the mount effects.
      drawRef(draw);
      animRef(anim);

      return d;
    });
  },

  unmount() {
    dispose?.();
    dispose = null;
    document.querySelector('#root').replaceChildren();
  },

  setSpeed(v) {
    setSpeedSignal(v);
  },

  rerender() {
    setTick((t) => t + 1);
  },
};
