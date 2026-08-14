import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { scrollText } from '../text';

// ── helpers ──────────────────────────────────────────────────────────────────

function makeParagraph(text = 'Hello world foo bar'): HTMLParagraphElement {
  const el = document.createElement('p');
  el.textContent = text;
  // Mock offsetTop for line detection
  Object.defineProperty(el, 'offsetTop', { value: 0, writable: true });
  document.body.appendChild(el);
  return el;
}

class RafQueue {
  private queue: FrameRequestCallback[] = [];
  private id = 0;
  schedule = vi.fn((cb: FrameRequestCallback): number => { this.queue.push(cb); return ++this.id; });
  cancel = vi.fn();
  tick() { const cb = this.queue.shift(); cb?.(performance.now()); }
}

class FakeIO {
  private cb: IntersectionObserverCallback;
  static instances: FakeIO[] = [];
  constructor(cb: IntersectionObserverCallback) { this.cb = cb; FakeIO.instances.push(this); }
  observe = vi.fn();
  disconnect = vi.fn();
  trigger(v: boolean) {
    this.cb([{ isIntersecting: v } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
  }
}

let raf: RafQueue;

beforeEach(() => {
  FakeIO.instances = [];
  raf = new RafQueue();
  vi.stubGlobal('IntersectionObserver', FakeIO);
  vi.stubGlobal('requestAnimationFrame', raf.schedule);
  vi.stubGlobal('cancelAnimationFrame', raf.cancel);
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    top: 200, height: 100, left: 0, width: 400, right: 400, bottom: 300, x: 0, y: 0, toJSON: () => ({}),
  });
  vi.stubGlobal('scrollY', 0);
  vi.stubGlobal('innerHeight', 800);
});

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// ── tests ─────────────────────────────────────────────────────────────────────

describe('scrollText', () => {
  it('returns noop when element not found', () => {
    const inst = scrollText('#missing');
    expect(inst.getProgress()).toBe(0);
    expect(() => inst.destroy()).not.toThrow();
  });

  it('splits text into word spans by default', () => {
    const el = makeParagraph('Hello world');
    scrollText(el);
    const spans = el.querySelectorAll('span[style]');
    expect(spans.length).toBeGreaterThan(0);
  });

  it('splits into char spans', () => {
    const el = makeParagraph('Hi');
    scrollText(el, { split: 'chars' });
    const spans = Array.from(el.querySelectorAll('span[aria-hidden]'));
    // 'H' and 'i' should be split
    expect(spans.length).toBeGreaterThanOrEqual(2);
  });

  it('sets aria-label on container', () => {
    const el = makeParagraph('Hello world');
    scrollText(el);
    expect(el.getAttribute('aria-label')).toBe('Hello world');
  });

  it('sets aria-hidden on word spans', () => {
    const el = makeParagraph('Hello world');
    scrollText(el);
    const spans = el.querySelectorAll('span[aria-hidden="true"]');
    expect(spans.length).toBeGreaterThan(0);
  });

  it('restores original HTML on destroy', () => {
    const el = makeParagraph('Hello world');
    const original = el.innerHTML;
    const inst = scrollText(el);
    inst.destroy();
    expect(el.innerHTML).toBe(original);
  });

  it('removes aria-label on destroy', () => {
    const el = makeParagraph('Hello');
    const inst = scrollText(el);
    inst.destroy();
    expect(el.getAttribute('aria-label')).toBeNull();
  });

  it('applies opacity at seek(0) from default from', () => {
    const el = makeParagraph('Hello');
    const inst = scrollText(el, { from: { opacity: 0, y: 10 } });
    inst.seek(0);
    const span = el.querySelector('span[aria-hidden]') as HTMLSpanElement | null;
    if (span) {
      expect(parseFloat(span.style.opacity)).toBe(0);
    }
  });

  it('applies opacity at seek(1)', () => {
    const el = makeParagraph('Hello');
    const inst = scrollText(el, { from: { opacity: 0, y: 10 }, stagger: 0 });
    inst.seek(1);
    const spans = Array.from(el.querySelectorAll('span[aria-hidden]')) as HTMLSpanElement[];
    for (const span of spans) {
      expect(parseFloat(span.style.opacity)).toBeCloseTo(1, 1);
    }
  });

  it('getProgress returns 0 initially', () => {
    const el = makeParagraph('Hello');
    const inst = scrollText(el);
    expect(inst.getProgress()).toBe(0);
  });

  it('replay resets to 0', () => {
    const el = makeParagraph('Hello');
    const inst = scrollText(el);
    inst.seek(1);
    inst.replay();
    expect(inst.getProgress()).toBe(0);
  });

  it('pause stops rAF scheduling', () => {
    const el = makeParagraph('Hello world');
    const inst = scrollText(el);
    FakeIO.instances[0].trigger(true);
    raf.tick();
    const before = raf.schedule.mock.calls.length;
    inst.pause();
    raf.tick();
    expect(raf.schedule.mock.calls.length).toBe(before);
  });

  it('resume restarts after pause', () => {
    const el = makeParagraph('Hello');
    const inst = scrollText(el);
    FakeIO.instances[0].trigger(true);
    raf.tick();
    inst.pause();
    const before = raf.schedule.mock.calls.length;
    inst.resume();
    expect(raf.schedule.mock.calls.length).toBeGreaterThan(before);
  });

  it('destroy disconnects observer', () => {
    const el = makeParagraph('Hello');
    const inst = scrollText(el);
    inst.destroy();
    expect(FakeIO.instances[0].disconnect).toHaveBeenCalled();
  });

  it('calls onComplete when fully revealed', () => {
    const el = makeParagraph('Hello world');
    const onComplete = vi.fn();
    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
      top: -200, height: 100, left: 0, width: 400, right: 400, bottom: -100, x: 0, y: 0, toJSON: () => ({}),
    });
    scrollText(el, { onComplete });
    FakeIO.instances[0].trigger(true);
    raf.tick();
    expect(onComplete).toHaveBeenCalled();
  });

  it('handles prefers-reduced-motion by showing final state', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
    const el = makeParagraph('Hello world');
    scrollText(el, { from: { opacity: 0 }, stagger: 0 });
    // Only check inline-block spans (word spans, not whitespace spans)
    const spans = Array.from(el.querySelectorAll('span[style*="inline-block"]')) as HTMLSpanElement[];
    expect(spans.length).toBeGreaterThan(0);
    for (const s of spans) {
      expect(parseFloat(s.style.opacity)).toBeCloseTo(1, 1);
    }
  });

  it('accepts selector string', () => {
    const el = makeParagraph('test');
    el.id = 'text-test';
    expect(() => scrollText('#text-test')).not.toThrow();
  });

  it('clamps seek to [0,1]', () => {
    const el = makeParagraph('Hello');
    const inst = scrollText(el);
    inst.seek(5);
    expect(inst.getProgress()).toBe(1);
    inst.seek(-1);
    expect(inst.getProgress()).toBe(0);
  });

  it('sets --scroll-draw-progress CSS variable', () => {
    const el = makeParagraph('Hello');
    const inst = scrollText(el);
    inst.seek(0.6);
    expect(el.style.getPropertyValue('--scroll-draw-progress')).toBe('0.6');
  });
});

/*
 * Re-splitting on resize.
 *
 * `split: 'lines'` is the only mode whose unit boundaries depend on layout, so
 * it is the only one that has to re-split when the box changes width — and that
 * handler was never entered by a test. It is also the riskiest path in the
 * module: it rewrites innerHTML from the saved original, which is exactly how a
 * split element loses its accessible name or its animation progress.
 */
describe('scrollText — resize handling', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  function resize(): void {
    window.dispatchEvent(new Event('resize'));
    vi.advanceTimersByTime(200); // past the 150ms debounce
  }

  it('re-splits lines without losing the accessible name or the markup', () => {
    const el = makeParagraph('Hello world foo bar');
    scrollText(el, { split: 'lines' });

    const before = el.querySelectorAll('span').length;
    expect(before, 'nothing was split to begin with').toBeGreaterThan(0);
    // The gaps between words survive the split itself, not only the re-split.
    expect(el.textContent, 'the split glued the words together').toBe('Hello world foo bar');

    resize();

    expect(el.querySelectorAll('span').length, 'the re-split lost the units').toBe(before);
    expect(el.getAttribute('aria-label'), 'the accessible name was dropped').toBe(
      'Hello world foo bar',
    );
    expect(el.textContent, 'the rendered text changed').toBe('Hello world foo bar');
  });

  it('keeps the current progress across a re-split', () => {
    const el = makeParagraph('Hello world foo bar');
    const instance = scrollText(el, { split: 'lines' });

    instance.seek(1);
    const opacityBefore = (el.querySelector('span') as HTMLElement).style.opacity;
    expect(opacityBefore, 'the units were never animated').not.toBe('');

    resize();

    // A re-split that restarted from zero would flash the whole line back out.
    expect(
      (el.querySelector('span') as HTMLElement).style.opacity,
      'the re-split reset the animation',
    ).toBe(opacityBefore);
  });

  it('the other split modes do not re-split, and survive a resize', () => {
    const el = makeParagraph('Hello world');
    scrollText(el, { split: 'chars' });
    const before = el.innerHTML;

    resize();

    expect(el.innerHTML, 'a non-line split was rewritten on resize').toBe(before);
  });

  it('destroy() stops the resize handler from touching the element', () => {
    const el = makeParagraph('Hello world foo bar');
    const instance = scrollText(el, { split: 'lines' });
    instance.destroy();

    const restored = el.innerHTML;
    resize();
    expect(el.innerHTML, 'a destroyed instance re-split on resize').toBe(restored);
  });
});
