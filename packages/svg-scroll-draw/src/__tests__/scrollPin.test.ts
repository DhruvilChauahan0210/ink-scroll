import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { scrollPin } from '../pin';

// ── helpers ───────────────────────────────────────────────────────────────────

function makeEl(): HTMLDivElement {
  const el = document.createElement('div');
  el.style.width  = '300px';
  el.style.height = '200px';
  document.body.appendChild(el);

  Object.defineProperty(el, 'offsetWidth',  { get: () => 300, configurable: true });
  Object.defineProperty(el, 'offsetHeight', { get: () => 200, configurable: true });
  return el;
}

let rafCallbacks: FrameRequestCallback[] = [];
let rafId = 0;

beforeEach(() => {
  rafCallbacks = [];
  rafId = 0;
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    rafCallbacks.push(cb);
    return ++rafId;
  });
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  vi.stubGlobal('scrollY', 0);
  vi.stubGlobal('innerHeight', 800);
  vi.stubGlobal('innerWidth', 1200);
  vi.stubGlobal('scrollTo', vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

function flush() {
  const cbs = [...rafCallbacks];
  rafCallbacks = [];
  cbs.forEach((cb) => cb(performance.now()));
}

function setWrapperRect(wrapper: Element, top: number, height: number) {
  Object.defineProperty(wrapper, 'getBoundingClientRect', {
    value: () => ({
      top,
      bottom: top + height,
      left: 0,
      right: 300,
      width: 300,
      height,
    }),
    configurable: true,
  });
  Object.defineProperty(wrapper, 'offsetWidth', { get: () => 300, configurable: true });
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('scrollPin', () => {
  it('wraps element in a data-ssd-pin-wrapper div', () => {
    const el       = makeEl();
    const instance = scrollPin(el, { pinDistance: 400 });
    const wrapper  = document.querySelector('[data-ssd-pin-wrapper]');
    expect(wrapper).not.toBeNull();
    expect(wrapper?.contains(el)).toBe(true);
    instance.destroy();
  });

  it('sets wrapper height to elHeight + pinDistance', () => {
    const el       = makeEl();
    const instance = scrollPin(el, { pinDistance: 400 });
    const wrapper  = document.querySelector('[data-ssd-pin-wrapper]') as HTMLElement;
    // 200 (el) + 400 (pinDistance) = 600
    expect(wrapper.style.height).toBe('600px');
    instance.destroy();
  });

  it('pins element (position: fixed) when wrapper top <= pinnedViewportTop', () => {
    const el       = makeEl();
    const instance = scrollPin(el, { pinDistance: 400, top: 0 });

    const wrapper = document.querySelector('[data-ssd-pin-wrapper]') as HTMLElement;
    // Simulate wrapper.top = -50 → above viewport top (0) → should be pinned
    setWrapperRect(wrapper, -50, 600);

    // Trigger scroll listener
    window.dispatchEvent(new Event('scroll'));
    flush();

    expect(el.style.position).toBe('fixed');
    expect(el.style.top).toBe('0px');
    instance.destroy();
  });

  it('unpins to "after" when bottom of pin zone scrolls past pinnedViewportTop', () => {
    const el       = makeEl();
    const instance = scrollPin(el, { pinDistance: 400, top: 0 });

    const wrapper = document.querySelector('[data-ssd-pin-wrapper]') as HTMLElement;
    // wBottom - elHeight <= 0 → after state
    // wTop=-450, height=600, wBottom=150, elHeight=200 → 150-200=-50 <= 0 → after
    setWrapperRect(wrapper, -450, 600);

    window.dispatchEvent(new Event('scroll'));
    flush();

    expect(el.style.position).toBe('absolute');
    expect(el.style.bottom).toBe('0px');
    instance.destroy();
  });

  it('stays "before" when wrapper top > pinnedViewportTop', () => {
    const el       = makeEl();
    const instance = scrollPin(el, { pinDistance: 400, top: 0 });

    const wrapper = document.querySelector('[data-ssd-pin-wrapper]') as HTMLElement;
    setWrapperRect(wrapper, 200, 600); // top=200 > 0 → before

    window.dispatchEvent(new Event('scroll'));
    flush();

    expect(el.style.position).toBe(''); // unchanged / before
    instance.destroy();
  });

  it('fires onEnter when transitioning before → pinned', () => {
    const onEnter  = vi.fn();
    const el       = makeEl();
    const instance = scrollPin(el, { pinDistance: 400, top: 0, onEnter });

    const wrapper = document.querySelector('[data-ssd-pin-wrapper]') as HTMLElement;

    // First: before state
    setWrapperRect(wrapper, 200, 600);
    window.dispatchEvent(new Event('scroll'));
    flush();

    // Then: pinned state
    setWrapperRect(wrapper, -50, 600);
    window.dispatchEvent(new Event('scroll'));
    flush();

    expect(onEnter).toHaveBeenCalledTimes(1);
    instance.destroy();
  });

  it('fires onLeave when transitioning pinned → after', () => {
    const onLeave  = vi.fn();
    const el       = makeEl();
    const instance = scrollPin(el, { pinDistance: 400, top: 0, onLeave });

    const wrapper = document.querySelector('[data-ssd-pin-wrapper]') as HTMLElement;

    // First: pinned
    setWrapperRect(wrapper, -50, 600);
    window.dispatchEvent(new Event('scroll'));
    flush();

    // Then: after
    setWrapperRect(wrapper, -450, 600);
    window.dispatchEvent(new Event('scroll'));
    flush();

    expect(onLeave).toHaveBeenCalledTimes(1);
    instance.destroy();
  });

  it('fires onLeaveBack when transitioning pinned → before', () => {
    const onLeaveBack = vi.fn();
    const el          = makeEl();
    const instance    = scrollPin(el, { pinDistance: 400, top: 0, onLeaveBack });

    const wrapper = document.querySelector('[data-ssd-pin-wrapper]') as HTMLElement;

    // First: pinned
    setWrapperRect(wrapper, -50, 600);
    window.dispatchEvent(new Event('scroll'));
    flush();

    // Then: before (scroll back up)
    setWrapperRect(wrapper, 200, 600);
    window.dispatchEvent(new Event('scroll'));
    flush();

    expect(onLeaveBack).toHaveBeenCalledTimes(1);
    instance.destroy();
  });

  it('restore original styles and unwrap on destroy()', () => {
    const el       = makeEl();
    const parent   = el.parentElement!;
    const instance = scrollPin(el, { pinDistance: 400 });

    expect(el.parentElement?.tagName).toBe('DIV'); // inside wrapper

    instance.destroy();

    // Element should be directly in parent, no wrapper
    expect(el.parentElement).toBe(parent);
    expect(document.querySelector('[data-ssd-pin-wrapper]')).toBeNull();
  });

  it('reports progress via onProgress', () => {
    const onProgress = vi.fn();
    const el         = makeEl();
    const instance   = scrollPin(el, { pinDistance: 400, top: 0, onProgress });

    const wrapper = document.querySelector('[data-ssd-pin-wrapper]') as HTMLElement;
    // pinnedViewportTop=0, wTop=-200 → progress = (0-(-200))/400 = 0.5
    setWrapperRect(wrapper, -200, 600);

    window.dispatchEvent(new Event('scroll'));
    flush();

    expect(onProgress).toHaveBeenCalled();
    const progress = onProgress.mock.calls.at(-1)?.[0] as number;
    expect(progress).toBeCloseTo(0.5, 1);
    instance.destroy();
  });

  it('returns 0 for missing element', () => {
    const instance = scrollPin('#does-not-exist');
    expect(instance.getProgress()).toBe(0);
    expect(() => instance.destroy()).not.toThrow();
  });
});
