import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createApp, h, nextTick } from 'vue';

/**
 * What the Vue components hand the engines. The engines are replaced by
 * recorders, so the options are read exactly as the component built them.
 */
const { drawCalls, counterCalls } = vi.hoisted(() => ({
  drawCalls: [] as Record<string, unknown>[],
  counterCalls: [] as Record<string, unknown>[],
}));

vi.mock('../core/engine', () => ({
  createEngine: (_el: Element, o: Record<string, unknown>) => { drawCalls.push(o); return { destroy() {} }; },
}));
vi.mock('../counter', () => ({
  scrollCounter: (_el: Element, o: Record<string, unknown>) => { counterCalls.push(o); return { destroy() {} }; },
}));

const { ScrollDraw, ScrollCounter } = await import('../vue');

async function mount(vnode: () => ReturnType<typeof h>) {
  const root = document.createElement('div');
  document.body.appendChild(root);
  const app = createApp({ render: vnode });
  app.mount(root);
  await nextTick();
  return { root, unmount: () => app.unmount() };
}

beforeEach(() => {
  drawCalls.length = 0;
  counterCalls.length = 0;
  document.body.innerHTML = '';
});

describe('vue components', () => {
  it('<ScrollDraw> passes every option, including the 23 it used to drop', async () => {
    const { root, unmount } = await mount(() =>
      h(ScrollDraw, { preset: 'sketch', strokeColor: 'red', native: false, axis: 'x', 'data-role': 'x' }),
    );
    expect(drawCalls[0]).toEqual({ preset: 'sketch', strokeColor: 'red', native: false, axis: 'x' });
    const div = root.firstElementChild!;
    expect(div.getAttribute('data-role')).toBe('x');
    expect(div.hasAttribute('preset')).toBe(false);
    unmount();
  });

  it('an absent boolean stays absent, so presets and engine defaults apply', async () => {
    const { unmount } = await mount(() => h(ScrollDraw, { speed: 2 }));
    expect(drawCalls[0]).toEqual({ speed: 2 }); // was { speed: 2, fade: false, once: false, debug: false }
    unmount();
  });

  it('a bare boolean attribute still means true', async () => {
    const { unmount } = await mount(() => h(ScrollDraw, { once: '', fade: '' }));
    expect(drawCalls[0]).toEqual({ once: true, fade: true });
    unmount();
  });

  it('<ScrollCounter> leaves once to the engine, which defaults it to true', async () => {
    const { unmount } = await mount(() => h(ScrollCounter, { to: 100 }));
    expect(counterCalls[0]).toEqual({ to: 100 }); // was { to: 100, once: false }
    unmount();
  });
});
