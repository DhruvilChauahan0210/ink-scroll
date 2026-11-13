import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createElement, createRef, act, useRef, type RefObject } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { createApp, h, nextTick, ref as vueRef, defineComponent } from 'vue';
import type { ScrollFramesOptions } from '../frames';

/*
 * The React and Vue <ScrollFrames>. scrollFrames is replaced by a recorder, so
 * each test reads exactly what the component handed it, how many films it
 * started and which of them it stopped. What a browser paints is
 * e2e/frames-wrappers.spec.ts's job.
 */

type Call = { el: Element; options: ScrollFramesOptions; destroyed: boolean };

const { calls } = vi.hoisted(() => ({ calls: [] as Call[] }));

vi.mock('../frames', () => ({
  scrollFrames: (el: Element, options: ScrollFramesOptions) => {
    const call: Call = { el, options, destroyed: false };
    calls.push(call);
    return { destroy: () => { call.destroyed = true; } };
  },
}));

const { ScrollFrames } = await import('../react');
const vue = await import('../vue');
const { framesKey } = await import('../frames/wrapper');

const url = (i: number) => `/f/${i}.jpg`;
let warns: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  calls.length = 0;
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  warns = vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

const warned = () => warns.mock.calls.map((c) => String(c[0])).join('\n');

// ── framesKey ─────────────────────────────────────────────────────────────────

describe('framesKey', () => {
  it('counts a frames function by the URLs it gives, not by identity', () => {
    const a = framesKey({ frames: (i) => `/f/${i}.jpg`, count: 3 });
    expect(framesKey({ frames: (i) => `/f/${i}.jpg`, count: 3 })).toBe(a);
    expect(framesKey({ frames: (i) => `/g/${i}.jpg`, count: 3 })).not.toBe(a);
    expect(framesKey({ frames: (i) => `/f/${i}.jpg`, count: 4 })).not.toBe(a);
  });

  it('reads a list by its contents, and callbacks as present or absent', () => {
    expect(framesKey({ frames: ['/a.jpg'], onProgress: () => {} })).toBe(framesKey({ frames: ['/a.jpg'], onProgress: () => {} }));
    expect(framesKey({ frames: ['/a.jpg'] })).not.toBe(framesKey({ frames: ['/b.jpg'] }));
  });

  it('survives a frames function that throws, or a count that is not a number', () => {
    expect(() => framesKey({ frames: () => { throw new Error('no'); }, count: 3 })).not.toThrow();
    expect(() => framesKey({ frames: url, count: Infinity })).not.toThrow();
    expect(() => framesKey({ frames: url })).not.toThrow();
  });
});

// ── React ─────────────────────────────────────────────────────────────────────

describe('<ScrollFrames> (React)', () => {
  let root: Root | null = null;
  let host: HTMLElement;

  const render = (props: Record<string, unknown>) =>
    act(() => root!.render(createElement(ScrollFrames, { frames: url, count: 3, 'aria-label': 'A film', ...props } as never)));

  beforeEach(() => {
    host = document.body.appendChild(document.createElement('div'));
    root = createRoot(host);
  });

  afterEach(() => {
    act(() => root?.unmount());
    root = null;
  });

  const canvas = () => host.querySelector('canvas')!;

  it('renders a canvas, role="img" by default, with its attributes on it', () => {
    render({ className: 'film', style: { width: '100%' }, id: 'f', 'data-x': '1' });
    const c = canvas();
    expect(c.getAttribute('role')).toBe('img');
    expect(c.getAttribute('aria-label')).toBe('A film');
    expect(c.className).toBe('film');
    expect(c.style.width).toBe('100%');
    expect(c.id).toBe('f');
    expect(c.getAttribute('data-x')).toBe('1');
    expect(calls).toHaveLength(1);
    expect(calls[0].el).toBe(c);
  });

  /*
   * scrollFrames holds the box of a canvas sized by its attributes with inline
   * width, height or aspect-ratio. React writes only the style keys that
   * changed, so a re-render with a fresh style object (equal, or another key
   * changed) must leave the ones the library wrote alone.
   */
  it('a re-render with a style prop keeps the inline size the library wrote', () => {
    render({ style: { width: '100%' } });
    const c = canvas();
    c.style.height = '160px';
    c.style.setProperty('--scroll-draw-progress', '0.5');
    render({ style: { width: '100%' } });
    render({ style: { width: '100%', opacity: 0.5 } });
    expect(c.style.width).toBe('100%');
    expect(c.style.opacity).toBe('0.5');
    expect(c.style.height).toBe('160px');
    expect(c.style.getPropertyValue('--scroll-draw-progress')).toBe('0.5');
    expect(calls).toHaveLength(1);
  });

  it('takes its own role', () => {
    render({ role: 'presentation' });
    expect(canvas().getAttribute('role')).toBe('presentation');
  });

  it('passes every option, and no attribute, to scrollFrames', () => {
    const onReady = vi.fn();
    render({
      frames: ['/a.jpg', '/b.jpg'], count: 2, trigger: { start: 'top top' }, easing: 'ease-in', once: true,
      axis: 'x', fit: 'contain', concurrency: 2, onReady, className: 'film', id: 'f',
    });
    const o = calls[0].options as unknown as Record<string, unknown>;
    expect(Object.keys(o).sort()).toEqual(
      ['axis', 'concurrency', 'count', 'easing', 'fit', 'frames', 'onReady', 'once', 'trigger'],
    );
    expect(o).toMatchObject({ frames: ['/a.jpg', '/b.jpg'], fit: 'contain', concurrency: 2, once: true });
  });

  it('keeps the film through re-renders with a fresh frames function and fresh callbacks, which stay live', () => {
    const first = vi.fn();
    const second = vi.fn();
    render({ frames: (i: number) => `/f/${i}.jpg`, trigger: { start: 'top top' }, onProgress: first });
    render({ frames: (i: number) => `/f/${i}.jpg`, trigger: { start: 'top top' }, onProgress: second });
    expect(calls).toHaveLength(1);
    calls[0].options.onProgress!(0.5, 1);
    expect(second).toHaveBeenCalledWith(0.5, 1);
    expect(first).not.toHaveBeenCalled();
  });

  it('starts a new film when the frames function gives other URLs, or the count changes', () => {
    render({ frames: (i: number) => `/f/${i}.jpg` });
    render({ frames: (i: number) => `/g/${i}.jpg` });
    expect(calls).toHaveLength(2);
    expect(calls[0].destroyed).toBe(true);
    expect((calls[1].options.frames as (i: number) => string)(2)).toBe('/g/2.jpg');
    render({ frames: (i: number) => `/g/${i}.jpg`, count: 4 });
    expect(calls).toHaveLength(3);
    expect(calls[1].destroyed).toBe(true);
  });

  /*
   * A frames function and a list of the same URLs share a key, so the film is
   * kept. It must keep the frames it was built with: read live, `frames` would
   * call the list now in the props, throw, and every frame not yet loaded
   * would be skipped.
   */
  it('keeps a working film when frames turns from a function into a list of the same URLs', () => {
    render({ frames: url });
    render({ frames: [0, 1, 2].map(url) });
    expect(calls).toHaveLength(1);
    const f = calls[0].options.frames;
    const urls = [0, 1, 2].map((i) => (typeof f === 'function' ? f(i) : f[i]));
    expect(urls).toEqual(['/f/0.jpg', '/f/1.jpg', '/f/2.jpg']);
  });

  it('starts a new film when fit or the trigger changes', () => {
    render({ fit: 'cover' });
    render({ fit: 'contain' });
    render({ fit: 'contain', trigger: { start: 'top 50%' } });
    expect(calls.map((c) => c.options.fit)).toEqual(['cover', 'contain', 'contain']);
  });

  it('reads a triggerElement ref when the film starts, as an ancestor it renders itself', () => {
    let track: RefObject<HTMLElement | null> | null = null;
    function Pinned() {
      const t = useRef<HTMLElement>(null);
      track = t;
      return createElement('section', { ref: t }, createElement(ScrollFrames, { frames: url, count: 3, triggerElement: t, 'aria-label': 'A film' }));
    }
    act(() => root!.render(createElement(Pinned)));
    act(() => root!.render(createElement(Pinned)));
    expect(calls).toHaveLength(1);
    expect(calls[0].options.triggerElement).toBe(track!.current);
    expect(host.querySelector('section')).toBe(track!.current);
  });

  it('passes a triggerElement element as it is, and a new one starts a new film', () => {
    const a = document.createElement('div');
    const b = document.createElement('div');
    render({ triggerElement: a });
    render({ triggerElement: a });
    render({ triggerElement: b });
    expect(calls.map((c) => c.options.triggerElement)).toEqual([a, b]);
  });

  it('a ref that is never attached measures the canvas', () => {
    render({ triggerElement: createRef() });
    expect(calls[0].options.triggerElement).toBeUndefined();
  });

  it('warns when the canvas has no name, and not when it has one or is decoration', () => {
    render({ 'aria-label': undefined });
    expect(warned()).toMatch(/<ScrollFrames>: the canvas has no aria-label/);
    act(() => root!.unmount());
    warns.mockClear();
    for (const props of [{}, { 'aria-label': undefined, 'aria-hidden': true }, { 'aria-label': undefined, role: 'presentation' }, { 'aria-label': undefined, 'aria-labelledby': 'cap' }]) {
      root = createRoot(host);
      render(props);
      act(() => root!.unmount());
    }
    root = null;
    expect(warned()).toBe('');
  });

  it('stops the film on unmount', () => {
    render({});
    act(() => root!.unmount());
    root = null;
    expect(calls[0].destroyed).toBe(true);
  });
});

// ── Vue ───────────────────────────────────────────────────────────────────────

describe('<ScrollFrames> (Vue)', () => {
  async function mount(render: () => ReturnType<typeof h>) {
    const el = document.body.appendChild(document.createElement('div'));
    const app = createApp({ render });
    app.mount(el);
    await nextTick();
    return { el, unmount: () => app.unmount() };
  }

  it('renders a canvas, role="img" by default, with class, style and aria-label falling through', async () => {
    const { el, unmount } = await mount(() =>
      h(vue.ScrollFrames, { frames: url, count: 3, class: 'film', style: 'width: 100%', 'aria-label': 'A film', 'data-x': '1' }),
    );
    const c = el.querySelector('canvas')!;
    expect(c.getAttribute('role')).toBe('img');
    expect(c.getAttribute('aria-label')).toBe('A film');
    expect(c.className).toBe('film');
    expect(c.style.width).toBe('100%');
    expect(c.getAttribute('data-x')).toBe('1');
    expect(c.hasAttribute('frames')).toBe(false);
    expect(calls[0].el).toBe(c);
    unmount();
    expect(calls[0].destroyed).toBe(true);
  });

  it('a re-render with a style object keeps the inline size the library wrote', async () => {
    const opacity = vueRef(1);
    const { el, unmount } = await mount(() =>
      h(vue.ScrollFrames, { frames: url, count: 3, style: { width: '100%', opacity: opacity.value }, 'aria-label': 'A film' }),
    );
    const c = el.querySelector('canvas')!;
    c.style.height = '160px';
    opacity.value = 0.5;
    await nextTick();
    expect(c.style.opacity).toBe('0.5');
    expect(c.style.height).toBe('160px');
    expect(calls).toHaveLength(1);
    unmount();
  });

  it('takes its own role', async () => {
    const { el, unmount } = await mount(() => h(vue.ScrollFrames, { frames: url, count: 3, role: 'presentation' }));
    expect(el.querySelector('canvas')!.getAttribute('role')).toBe('presentation');
    unmount();
  });

  it('passes every option, an absent boolean left absent, and a bare one true', async () => {
    const onLoad = vi.fn();
    const { unmount } = await mount(() =>
      h(vue.ScrollFrames, {
        frames: ['/a.jpg'], count: 1, trigger: { start: 'top top' }, easing: 'ease-out', axis: 'x', fit: 'contain',
        concurrency: 3, onLoad, 'aria-label': 'A film',
      }),
    );
    expect(Object.keys(calls[0].options).sort()).toEqual(
      ['axis', 'concurrency', 'count', 'easing', 'fit', 'frames', 'onLoad', 'trigger', 'triggerElement'],
    );
    expect(calls[0].options.triggerElement).toBeUndefined();
    unmount();
    const bare = await mount(() => h(vue.ScrollFrames, { frames: url, count: 3, once: '' }));
    expect(calls[1].options.once).toBe(true);
    bare.unmount();
  });

  it('keeps the film for a fresh equal frames function, with callbacks live; new URLs start a new one', async () => {
    const base = vueRef('/f/');
    const tick = vueRef(0);
    const seen: string[] = [];
    const { unmount } = await mount(() => {
      // Read at render, so each render's callback says which render it came from.
      const t = tick.value;
      return h('div', { 'data-tick': t }, [
        h(vue.ScrollFrames, {
          frames: (i: number) => `${base.value}${i}.jpg`,
          count: 3,
          'aria-label': 'A film',
          onProgress: () => seen.push(`tick ${t}`),
        }),
      ]);
    });
    tick.value++;
    await nextTick();
    expect(calls).toHaveLength(1);
    calls[0].options.onProgress!(0.5, 1);
    expect(seen).toEqual(['tick 1']);

    base.value = '/g/';
    await nextTick();
    expect(calls).toHaveLength(2);
    expect(calls[0].destroyed).toBe(true);
    expect((calls[1].options.frames as (i: number) => string)(0)).toBe('/g/0.jpg');
    unmount();
  });

  it('keeps a working film when frames turns from a function into a list of the same URLs', async () => {
    const list = vueRef(false);
    const { unmount } = await mount(() =>
      h(vue.ScrollFrames, { frames: list.value ? [0, 1, 2].map(url) : url, count: 3, 'aria-label': 'A film' }),
    );
    list.value = true;
    await nextTick();
    expect(calls).toHaveLength(1);
    const f = calls[0].options.frames;
    const urls = [0, 1, 2].map((i) => (typeof f === 'function' ? f(i) : f[i]));
    expect(urls).toEqual(['/f/0.jpg', '/f/1.jpg', '/f/2.jpg']);
    unmount();
  });

  it('finds a triggerElement selector when the film starts', async () => {
    const Track = defineComponent({
      setup: () => () => h('section', { id: 'track' }, [h(vue.ScrollFrames, { frames: url, count: 3, triggerElement: '#track', 'aria-label': 'A film' })]),
    });
    const { el, unmount } = await mount(() => h(Track));
    expect(calls[0].options.triggerElement).toBe(el.querySelector('#track'));
    unmount();
  });

  it('warns for a selector that matches nothing, and measures the canvas', async () => {
    const { unmount } = await mount(() => h(vue.ScrollFrames, { frames: url, count: 3, triggerElement: '#nope', 'aria-label': 'A film' }));
    expect(calls[0].options.triggerElement).toBeUndefined();
    expect(warned()).toMatch(/"#nope" matches nothing/);
    unmount();
  });

  it('warns when the canvas has no name, and not when it is decoration', async () => {
    const a = await mount(() => h(vue.ScrollFrames, { frames: url, count: 3 }));
    expect(warned()).toMatch(/<ScrollFrames>: the canvas has no aria-label/);
    a.unmount();
    warns.mockClear();
    const b = await mount(() => h(vue.ScrollFrames, { frames: url, count: 3, 'aria-hidden': 'true' }));
    expect(warned()).toBe('');
    b.unmount();
  });

  it('useScrollFrames starts a film on the canvas it is bound to, and follows a getter', async () => {
    const count = vueRef(3);
    const Comp = defineComponent({
      setup() {
        const film = vue.useScrollFrames(() => ({ frames: url, count: count.value }));
        return () => h('canvas', { ref: film });
      },
    });
    const { el, unmount } = await mount(() => h(Comp));
    expect(calls[0].el).toBe(el.querySelector('canvas'));
    count.value = 4;
    await nextTick();
    expect(calls.map((c) => c.options.count)).toEqual([3, 4]);
    unmount();
    expect(calls[1].destroyed).toBe(true);
  });
});
