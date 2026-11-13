import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createLenisAdapter } from '../lenis';

// ── Fake Lenis ────────────────────────────────────────────────────────────────

function makeFakeLenis() {
  const listeners = new Map<string, Set<Function>>();
  return {
    on(event: string, cb: Function) {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(cb);
    },
    off(event: string, cb: Function) {
      listeners.get(event)?.delete(cb);
    },
    emit(event: string, data: unknown) {
      listeners.get(event)?.forEach((cb) => cb(data));
    },
    listenerCount(event: string) {
      return listeners.get(event)?.size ?? 0;
    },
  };
}

// ── setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.stubGlobal('scrollY', 0);
  vi.stubGlobal('pageYOffset', 0);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ── tests ─────────────────────────────────────────────────────────────────────

describe('createLenisAdapter', () => {
  it('patches window.scrollY with Lenis virtual scroll value', () => {
    const lenis   = makeFakeLenis();
    const adapter = createLenisAdapter(lenis as never);

    lenis.emit('scroll', { scroll: 350, velocity: 0, direction: 1, progress: 0.3 });

    expect(window.scrollY).toBe(350);
    adapter.destroy();
  });

  it('patches window.pageYOffset', () => {
    const lenis   = makeFakeLenis();
    const adapter = createLenisAdapter(lenis as never);

    lenis.emit('scroll', { scroll: 500, velocity: 0, direction: 1, progress: 0.5 });

    expect(window.pageYOffset).toBe(500);
    adapter.destroy();
  });

  it('getScrollY returns last Lenis scroll value', () => {
    const lenis   = makeFakeLenis();
    const adapter = createLenisAdapter(lenis as never);

    lenis.emit('scroll', { scroll: 123, velocity: 0, direction: 1, progress: 0.1 });

    expect(adapter.getScrollY()).toBe(123);
    adapter.destroy();
  });

  it('removes scroll listener on destroy', () => {
    const lenis   = makeFakeLenis();
    const adapter = createLenisAdapter(lenis as never);

    expect(lenis.listenerCount('scroll')).toBe(1);
    adapter.destroy();
    expect(lenis.listenerCount('scroll')).toBe(0);
  });

  it('does not update scrollY after destroy', () => {
    const lenis   = makeFakeLenis();
    const adapter = createLenisAdapter(lenis as never);

    lenis.emit('scroll', { scroll: 100, velocity: 0, direction: 1, progress: 0.1 });
    adapter.destroy();
    lenis.emit('scroll', { scroll: 999, velocity: 0, direction: 1, progress: 0.9 });

    // After destroy, our handler is unregistered so scrollY won't be patched further
    expect(adapter.getScrollY()).toBe(100);
  });

  // 2.26.0: destroy() used to `delete window.scrollY`, and in a browser that
  // deletes the browser's own accessor (Window is a [Global] interface, so it
  // lives on the window object itself), leaving window.scrollY undefined.
  it('destroy() puts back the original scrollY and pageYOffset descriptors', () => {
    const before = {
      scrollY: Object.getOwnPropertyDescriptor(window, 'scrollY'),
      pageYOffset: Object.getOwnPropertyDescriptor(window, 'pageYOffset'),
    };
    expect(before.scrollY).toBeDefined();

    const lenis   = makeFakeLenis();
    const adapter = createLenisAdapter(lenis as never);
    lenis.emit('scroll', { scroll: 250, velocity: 0, direction: 1, progress: 0.2 });
    expect(window.scrollY).toBe(250);

    adapter.destroy();
    expect(Object.getOwnPropertyDescriptor(window, 'scrollY')).toEqual(before.scrollY);
    expect(Object.getOwnPropertyDescriptor(window, 'pageYOffset')).toEqual(before.pageYOffset);
    expect(typeof window.scrollY).toBe('number');
    expect(window.scrollY).toBe(0);
  });

  it('destroy() restores a browser-style accessor, so scrollY follows the real scroll again', () => {
    let real = 40;
    const getter = () => real;
    Object.defineProperty(window, 'scrollY', { get: getter, configurable: true, enumerable: true });

    const lenis   = makeFakeLenis();
    const adapter = createLenisAdapter(lenis as never);
    lenis.emit('scroll', { scroll: 900, velocity: 0, direction: 1, progress: 0.9 });
    expect(window.scrollY).toBe(900);

    adapter.destroy();
    expect(Object.getOwnPropertyDescriptor(window, 'scrollY')?.get).toBe(getter);
    real = 75;
    expect(window.scrollY).toBe(75);
  });

  it('destroy() before any scroll event leaves scrollY untouched', () => {
    const before = Object.getOwnPropertyDescriptor(window, 'scrollY');
    const adapter = createLenisAdapter(makeFakeLenis() as never);
    adapter.destroy();
    expect(Object.getOwnPropertyDescriptor(window, 'scrollY')).toEqual(before);
  });

  it('returns NOOP in SSR environment', () => {
    // Temporarily remove window
    const origWindow = global.window;
    // @ts-expect-error intentional
    delete global.window;

    // Must not throw
    let adapter: ReturnType<typeof createLenisAdapter>;
    expect(() => {
      adapter = createLenisAdapter({} as never);
    }).not.toThrow();
    expect(adapter!.getScrollY()).toBe(0);
    expect(() => adapter!.destroy()).not.toThrow();

    global.window = origWindow;
  });
});
