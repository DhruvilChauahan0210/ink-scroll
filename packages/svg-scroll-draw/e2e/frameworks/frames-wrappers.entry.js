/**
 * <ScrollFrames> from both wrappers that have one, React and Vue, mounted for
 * real from dist/. One page mounts one of them (`?fw=react` or `?fw=vue`), in
 * the pinned pattern a page uses it for: a sticky stage in a tall track, the
 * track measured as triggerElement (a ref in React, a selector in Vue).
 *
 * Every render passes a fresh frames function, a fresh trigger object and
 * fresh callbacks, as inline props are written. Each callback captures the
 * render it came from (`bucket`), so the spec can tell whether the film calls
 * the latest one or the first.
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { createApp, h as vh, nextTick, ref } from 'vue';
import { ScrollFrames as ReactFrames } from '../../dist/react/index.mjs';
import { ScrollFrames as VueFrames } from '../../dist/vue/index.mjs';

const COUNT = 25;
const frameUrl = (i, shift) => `/e2e/gen/frame.png?i=${i + shift}`;
const TRIGGER = () => ({ start: 'top top', end: 'bottom bottom' });

/** What the films report: builds show as onReady, one per film that painted. */
export const stats = { ready: 0, load: 0, a: 0, b: 0 };

// ── React ─────────────────────────────────────────────────────────────────────

const rh = React.createElement;
let set = null;

function ReactApp() {
  const [state, setState] = React.useState({ shift: 0, tick: 0, bucket: 'a' });
  set = setState;
  const track = React.useRef(null);
  const { shift, tick, bucket } = state;
  return rh(
    'section',
    { ref: track, id: 'track' },
    rh(
      'div',
      { className: 'stage' },
      rh(ReactFrames, {
        frames: (i) => frameUrl(i, shift),
        count: COUNT,
        triggerElement: track,
        trigger: TRIGGER(),
        className: 'film',
        'aria-label': 'A numbered test film',
        'data-tick': tick,
        onReady: () => { stats.ready++; },
        onLoad: () => { stats.load++; },
        onProgress: () => { stats[bucket]++; },
      }),
    ),
  );
}

function reactApi() {
  let root = null;
  const act = (fn) => (React.act ? React.act(fn) : fn());
  const update = (patch) => act(() => set?.((s) => ({ ...s, ...patch(s) })));
  return {
    mount() {
      root = createRoot(document.querySelector('#root'));
      act(() => root.render(rh(ReactApp)));
    },
    rerender: () => update((s) => ({ tick: s.tick + 1 })),
    bucket: (b) => update(() => ({ bucket: b })),
    shift: (n) => update(() => ({ shift: n })),
    unmount() {
      act(() => root?.unmount());
      root = null;
    },
  };
}

// ── Vue ───────────────────────────────────────────────────────────────────────

function vueApi() {
  const shift = ref(0);
  const tick = ref(0);
  const bucket = ref('a');
  let app = null;
  const Root = {
    setup() {
      return () => {
        // Read here, so each render's callback holds its own bucket.
        const b = bucket.value;
        const s = shift.value;
        return vh('section', { id: 'track' }, [
          vh('div', { class: 'stage' }, [
            vh(VueFrames, {
              frames: (i) => frameUrl(i, s),
              count: COUNT,
              triggerElement: '#track',
              trigger: TRIGGER(),
              class: 'film',
              'aria-label': 'A numbered test film',
              'data-tick': tick.value,
              onReady: () => { stats.ready++; },
              onLoad: () => { stats.load++; },
              onProgress: () => { stats[b]++; },
            }),
          ]),
        ]);
      };
    },
  };
  return {
    mount() {
      app = createApp(Root);
      app.mount('#root');
    },
    rerender: () => { tick.value++; return nextTick(); },
    bucket: (b) => { bucket.value = b; return nextTick(); },
    shift: (n) => { shift.value = n; return nextTick(); },
    unmount() {
      app?.unmount();
      app = null;
    },
  };
}

export const api = (fw) => (fw === 'vue' ? vueApi() : reactApi());
