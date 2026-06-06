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
