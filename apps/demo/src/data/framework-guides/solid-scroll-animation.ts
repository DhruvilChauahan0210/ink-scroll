import type { FrameworkGuide } from './types';

/**
 * Solid-only sections for /solid-scroll-animation, written from
 * packages/svg-scroll-draw/src/solid/index.ts (bind, createEffect, untrack,
 * onCleanup), src/core/reactive.ts (optionsKey, liveFns) and what
 * e2e/frameworks/solid.entry.js plus e2e/frameworks.spec.ts check in a real
 * Solid root.
 */
export const GUIDE: FrameworkGuide = {
  slug: 'solid-scroll-animation',
  sections: [
    {
      id: 'fw-solid-accessor',
      k: 'accessor',
      title: 'Pass a function, not an object',
      body: [
        '`useScrollDraw({ speed: speed() })` calls the signal once, while the component function runs, and nothing reads it again: a later `setSpeed(2)` never reaches the drawing. Pass a function instead, `useScrollDraw(() => ({ speed: speed() }))`. The hook calls it inside a `createEffect`, so the signal becomes a dependency, and a new value destroys the engine and starts another with the new options.',
        'The browser suite runs this in a real Solid root: with the page held at one scroll position, setting the signal from 1 to 2 takes the path from half drawn to fully drawn. Read props the same way, inside the function. Destructuring them in the component body reads them once, like the object form.',
        'A props object also works passed as it is, because Solid props are getters and the hook reads every property inside its effect. That includes `children`: the effect reads it each time it runs, and reading JSX children in Solid builds them again, as nodes nothing inserts. Split `children`, and any other prop that is not an option, off with `splitProps` first.',
      ],
      sample: {
        file: 'Drawn.tsx',
        code: `import { splitProps, type JSX } from 'solid-js';
import { useScrollDraw, type ScrollDrawOptions } from 'svg-scroll-draw/solid';

type Props = ScrollDrawOptions & { children: JSX.Element };

export function Drawn(props: Props) {
  // \`options\` keeps Solid's getters, so the hook sees prop changes.
  const [local, options] = splitProps(props, ['children']);
  const draw = useScrollDraw(options);

  return <div ref={draw}>{local.children}</div>;
}

// <Drawn speed={speed()} easing="ease-out"><svg>...</svg></Drawn>`,
      },
    },
    {
      id: 'fw-solid-fingerprint',
      k: 'optionsKey',
      title: 'An equal re-run keeps the engine',
      body: [
        'The effect re-runs whenever a signal the function read changes, even when the options come out the same. Before rebuilding, it turns them into a fingerprint with `optionsKey` and compares it with the one the running engine was built from. If they match it returns, and the drawing carries on from where it is.',
        'Functions count only as present or absent. A fresh `onComplete` arrow on every run is not a change, and the engine still calls the newest one, because it is handed wrappers that look the function up on the latest options.',
        'The engine itself is built inside `untrack`. Whatever it reads while starting, your callbacks included, does not become a dependency of the effect, so the effect re-runs only for what your options read.',
      ],
      sample: {
        file: 'Signature.tsx',
        code: `import { createSignal, Show } from 'solid-js';
import { useScrollDraw } from 'svg-scroll-draw/solid';

export function Signature(props: { speed: number }) {
  const [done, setDone] = createSignal(false);

  const draw = useScrollDraw(() => ({
    speed: props.speed,               // a dependency: a change rebuilds
    onComplete: () => setDone(true),  // a new arrow each run: no rebuild
  }));

  return (
    <>
      <div ref={draw}>
        <svg viewBox="0 0 240 80" fill="none" stroke="#111">
          <path d="M10 60 C 30 10, 50 10, 60 45 S 90 75, 110 40 S 150 15, 170 50 S 220 60, 230 30" />
        </svg>
      </div>
      <Show when={done()}><p>Signed.</p></Show>
    </>
  );
}`,
      },
    },
    {
      id: 'fw-solid-owner',
      k: 'onCleanup',
      title: 'Call the hook where the element lives',
      body: [
        '`onCleanup` attaches to the owner that is running when the hook is called, normally the component. When Solid disposes that owner the engine is destroyed. The browser suite disposes a real `createRoot` and checks that no IntersectionObserver and no animation frame is left running.',
        'So call the hook inside the component that `<Show>` or `<For>` creates, not in its parent. The ref setter only stores the node, and the effect starts the engine on its first run, after the component has rendered and `ref` has been set. A node that a `<Show>` in the same component adds later is stored but not started until the effect runs again, which with a plain object is never. A node it removes keeps its engine until that component is disposed.',
        'Each hook has a `create` twin (`createScrollDraw`, `createScrollAnimate`, `createScrollCounter`, `createScrollText`, `createScrollVideo`) that returns `{ ref, getInstance }`, an object rather than a pair. `getInstance()` is `undefined` until the effect starts an engine, and again after cleanup. After a rebuild it returns the new engine, so call it at the moment you use it rather than storing what it returned once.',
      ],
      sample: {
        file: 'Panel.tsx',
        code: `import { createSignal, Show } from 'solid-js';
import { createScrollDraw } from 'svg-scroll-draw/solid';

function Diagram() {
  // Owned by Diagram, so hiding it in <Show> destroys the engine.
  const { ref, getInstance } = createScrollDraw({ preset: 'sketch' });

  return (
    <>
      <div ref={ref}>
        <svg viewBox="0 0 220 80" fill="none" stroke="#111">
          <rect x="10" y="20" width="60" height="40" />
          <path d="M70 40 H 150" />
          <rect x="150" y="20" width="60" height="40" />
        </svg>
      </div>
      <button onClick={() => getInstance()?.seek(1)}>Show all</button>
    </>
  );
}

export function Panel() {
  const [open, setOpen] = createSignal(false);

  return (
    <>
      <button onClick={() => setOpen((o) => !o)}>Diagram</button>
      <Show when={open()}>
        <Diagram />
      </Show>
    </>
  );
}`,
      },
    },
  ],
};
