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
  private queue: { id: number; cb: FrameRequestCallback }[] = [];
  private id = 0;
  schedule = vi.fn((cb: FrameRequestCallback): number => { this.queue.push({ id: ++this.id, cb }); return this.id; });
  cancel   = vi.fn((id: number) => { this.queue = this.queue.filter((f) => f.id !== id); });
  /**
   * One frame: every callback queued before it, as a browser runs them. The
   * engines' frames follow the trigger window and wake on scroll events, so an
   * engine an earlier test left can share the queue.
   */
  tick() { const frame = this.queue; this.queue = []; for (const f of frame) f.cb(performance.now()); }
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

/**
 * Scroll the page: set the offset and fire a scroll event, as a browser does.
 * The frames follow the trigger window and wake on scroll (core/frame-gate),
 * so moving `scrollY` alone is not a scroll.
 */
function scroll(y?: number): void {
  if (y !== undefined) vi.stubGlobal('scrollY', y);
  window.dispatchEvent(new Event('scroll'));
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

  // An aria-label is not allowed on a <p>, <span> or <div>, and a screen reader
  // may skip it; with every split piece aria-hidden it then read nothing.
  it('keeps the whole text once for screen readers, with no aria-label', () => {
    const el = makeParagraph('Hello world');
    scrollText(el);
    expect(el.hasAttribute('aria-label')).toBe(false);
    const readable = Array.from(el.querySelectorAll('span')).filter((s) => !s.closest('[aria-hidden="true"]'));
    expect(readable.map((s) => s.textContent)).toEqual(['Hello world']);
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

  it('destroy() leaves an aria-label the page set alone', () => {
    const el = makeParagraph('Hello');
    el.setAttribute('aria-label', 'Greeting');
    const inst = scrollText(el);
    inst.destroy();
    expect(el.getAttribute('aria-label')).toBe('Greeting');
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
    scroll();
    raf.tick();
    const before = raf.schedule.mock.calls.length;
    inst.pause();
    raf.tick();
    expect(raf.schedule.mock.calls.length).toBe(before);
  });

  it('resume restarts after pause', () => {
    const el = makeParagraph('Hello');
    const inst = scrollText(el);
    scroll();
    raf.tick();
    inst.pause();
    const before = raf.schedule.mock.calls.length;
    inst.resume();
    expect(raf.schedule.mock.calls.length).toBeGreaterThan(before);
  });

  it('destroy stops listening for scroll', () => {
    const el = makeParagraph('Hello');
    const unlisten = vi.spyOn(window, 'removeEventListener');
    const inst = scrollText(el);
    inst.destroy();
    expect(unlisten).toHaveBeenCalledWith('scroll', expect.any(Function), expect.anything());
  });

  it('calls onComplete when fully revealed', () => {
    const el = makeParagraph('Hello world');
    const onComplete = vi.fn();
    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
      top: -200, height: 100, left: 0, width: 400, right: 400, bottom: -100, x: 0, y: 0, toJSON: () => ({}),
    });
    scrollText(el, { onComplete });
    scroll();
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
// replay() set `paused` to false and requested no frame, so after pause() or
// seek() the text stopped following the scroll until it left the screen and
// came back. Window [−480, −120]; y −300 is half way.
describe('scrollText replay() restarts the frame loop', () => {
  it('after pause()', () => {
    const el = makeParagraph();
    const inst = scrollText(el, { once: false });
    scroll();
    raf.tick();
    inst.pause();
    raf.tick(); // a frame pause() could not cancel in this fake sees `paused` and stops
    inst.replay();
    expect(inst.getProgress()).toBe(0);
    scroll(-300);
    raf.tick();
    expect(inst.getProgress()).toBeCloseTo(0.5, 6);
  });

  it('after seek()', () => {
    const el = makeParagraph();
    const inst = scrollText(el);
    scroll();
    raf.tick();
    inst.seek(0.2);
    raf.tick();
    inst.replay();
    scroll(-300);
    raf.tick();
    expect(inst.getProgress()).toBeCloseTo(0.5, 6);
  });

  it('does not start a second loop when it was running', () => {
    const el = makeParagraph();
    const inst = scrollText(el);
    scroll(-300); // in the window: the loop runs
    raf.tick();
    inst.replay();
    // One loop: each frame requests the next, once.
    const frames = raf.schedule.mock.calls.length;
    raf.tick();
    expect(raf.schedule.mock.calls.length - frames).toBe(1);
  });
});

// split: 'chars' split by UTF-16 unit: an emoji became two spans of lone
// surrogates, drawn as two U+FFFD. And as inline-blocks side by side, a line
// could break between any two letters; a word's letters share a nowrap box now.
describe("scrollText split: 'chars'", () => {
  it('keeps a character outside the BMP whole', () => {
    const el = makeParagraph('Hi 👋 there');
    scrollText(el, { split: 'chars' });
    const units = Array.from(el.querySelectorAll<HTMLSpanElement>('span')).filter((s) => s.style.opacity !== '');
    expect(units.map((s) => s.textContent)).toEqual(['H', 'i', '👋', 't', 'h', 'e', 'r', 'e']);
    expect(units.some((s) => /[\uD800-\uDFFF]/.test(s.textContent ?? '') && s.textContent!.length === 1)).toBe(false);
  });

  it("puts each word's letters in one nowrap box, hidden like the letters", () => {
    const el = makeParagraph('Hi there');
    scrollText(el, { split: 'chars' });
    const boxes = Array.from(el.children).filter((c) => (c as HTMLElement).style.whiteSpace === 'nowrap' && c.childElementCount);
    expect(boxes.map((b) => b.textContent)).toEqual(['Hi', 'there']);
    for (const b of boxes) {
      expect((b as HTMLElement).style.display).toBe('inline-block');
      expect(b.getAttribute('aria-hidden')).toBe('true');
    }
  });

  // Chinese and Japanese put no spaces between words, so a line of them in one
  // word box never wrapped and ran out of its paragraph.
  it('gives each CJK character a box of its own, so a line can break between them', () => {
    const el = makeParagraph('Hi 你好吗');
    scrollText(el, { split: 'chars' });
    const units = Array.from(el.querySelectorAll<HTMLSpanElement>('span')).filter((s) => s.style.opacity !== '');
    expect(units.map((s) => s.textContent)).toEqual(['H', 'i', '你', '好', '吗']);
    expect(units.filter((s) => s.parentElement === el).map((s) => s.textContent)).toEqual(['你', '好', '吗']);
    expect((units[0].parentElement as HTMLElement).style.whiteSpace).toBe('nowrap');
  });

  it('gives each Thai character a box of its own too: Thai puts no spaces between words', () => {
    const el = makeParagraph('Hi สวัสดี');
    scrollText(el, { split: 'chars' });
    const units = Array.from(el.querySelectorAll<HTMLSpanElement>('span')).filter((s) => s.style.opacity !== '');
    expect(units.filter((s) => s.parentElement === el).map((s) => s.textContent).join('')).toBe('สวัสดี');
    expect((units[0].parentElement as HTMLElement).style.whiteSpace).toBe('nowrap');
  });

  // Past 1 / stagger units the stagger did not fit the window: every unit was
  // a step, the first shown at progress 0, and from the 27th on (at the default
  // 0.04) none was ever shown, even at 1.
  it('a line of many characters starts hidden and ends shown, every one of them', () => {
    const el = makeParagraph('abcdefghijklmnopqrstuvwxyzABCDEFGHIJ');
    const inst = scrollText(el, { split: 'chars', easing: 'linear' });
    const opacities = () => Array.from(el.querySelectorAll<HTMLSpanElement>('span')).filter((s) => s.style.opacity !== '').map((s) => Number(s.style.opacity));
    inst.seek(0);
    expect(opacities().every((o) => o === 0)).toBe(true);
    inst.seek(1);
    expect(opacities().every((o) => o === 1)).toBe(true);
    inst.seek(0.51);
    const mid = opacities();
    expect(mid.some((o) => o > 0 && o < 1), 'units should fade, not step').toBe(true);
  });

  it('destroy() puts the original markup back', () => {
    const el = makeParagraph('Hi 👋 there');
    const original = el.innerHTML;
    scrollText(el, { split: 'chars' }).destroy();
    expect(el.innerHTML).toBe(original);
  });
});

describe('scrollText — resize handling', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  function resize(): void {
    window.dispatchEvent(new Event('resize'));
    vi.advanceTimersByTime(200); // past the 150ms debounce
  }

  it('re-splits lines without losing the screen-reader text or the markup', () => {
    const el = makeParagraph('Hello world foo bar');
    scrollText(el, { split: 'lines' });
    // What is drawn: the aria-hidden pieces. The screen-reader copy is the rest.
    const shown = () => Array.from(el.children).filter((c) => c.getAttribute('aria-hidden') === 'true').map((c) => c.textContent).join('');
    const spoken = () => Array.from(el.children).filter((c) => c.getAttribute('aria-hidden') !== 'true').map((c) => c.textContent);

    const before = el.querySelectorAll('span').length;
    expect(before, 'nothing was split to begin with').toBeGreaterThan(0);
    // The gaps between words survive the split itself, not only the re-split.
    expect(shown(), 'the split glued the words together').toBe('Hello world foo bar');

    resize();

    expect(el.querySelectorAll('span').length, 'the re-split lost the units').toBe(before);
    expect(spoken(), 'the screen-reader text was dropped or doubled').toEqual(['Hello world foo bar']);
    expect(shown(), 'the rendered text changed').toBe('Hello world foo bar');
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
