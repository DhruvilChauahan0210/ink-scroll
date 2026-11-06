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

// A number was the only form, so `window.innerHeight * 2` was measured once and
// kept the old screen's height after a rotation. A vh value is re-read on every
// measure, from an element 100vh tall, as CSS measures it. jsdom has no layout,
// so that element measures 0 and these fall back to innerHeight, except where a
// test gives 100vh its own height.
describe('scrollPin — pinDistance units', () => {
  const height = () => (document.querySelector('[data-ssd-pin-wrapper]') as HTMLElement).style.height;

  it('a vh value is a share of the viewport height, and follows it', () => {
    const instance = scrollPin(makeEl(), { pinDistance: '150vh' });
    expect(height()).toBe('1400px'); // 200 + 1.5 × 800
    vi.stubGlobal('innerHeight', 600);
    instance.refresh();
    expect(height()).toBe('1100px'); // 200 + 1.5 × 600
    instance.destroy();
  });

  it('a number, and a px string, stay put when the viewport changes', () => {
    for (const pinDistance of [600, '600px'] as const) {
      vi.stubGlobal('innerHeight', 800);
      const instance = scrollPin(makeEl(), { pinDistance });
      vi.stubGlobal('innerHeight', 600);
      instance.refresh();
      expect(height(), String(pinDistance)).toBe('800px');
      instance.destroy();
    }
  });

  it('the default is window.innerHeight, read again on every resize', () => {
    const instance = scrollPin(makeEl());
    expect(height()).toBe('1000px');
    vi.stubGlobal('innerHeight', 500);
    instance.refresh();
    expect(height()).toBe('700px');
    instance.destroy();
  });

  // On a phone the two differ: innerHeight moves with the address bar, CSS's vh
  // is the tall viewport and does not.
  it('a vh value is CSS vh, not innerHeight; the default stays innerHeight', () => {
    const offset = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight')!;
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      configurable: true,
      get(this: HTMLElement) { return this.style.height === '100vh' ? 900 : 0; },
    });
    try {
      const vh = scrollPin(makeEl(), { pinDistance: '100vh' });
      expect(height()).toBe('1100px'); // 200 + 900, the CSS vh
      vh.destroy();
      const byDefault = scrollPin(makeEl());
      expect(height()).toBe('1000px'); // 200 + 800, innerHeight
      byDefault.destroy();
      expect(document.querySelectorAll('div[style*="100vh"]').length, 'the probe is removed').toBe(0);
    } finally {
      Object.defineProperty(HTMLElement.prototype, 'offsetHeight', offset);
    }
  });

  it('decimals work, and a value it cannot read warns once and uses innerHeight', () => {
    const decimal = scrollPin(makeEl(), { pinDistance: '12.5vh' });
    expect(height()).toBe('300px'); // 200 + 0.125 × 800
    decimal.destroy();

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const instance = scrollPin(makeEl(), { pinDistance: '2 screens' as never });
    instance.refresh();
    expect(height()).toBe('1000px');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0].join(' ')).toContain('pinDistance is not a number, vh or px; using window.innerHeight: 2 screens');
    instance.destroy();
    warn.mockRestore();
  });
});
