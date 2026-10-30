import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ScrollRevealStatic } from '../scrollreveal';

/*
 * The real-browser parity spec (e2e/scrollreveal.spec.ts) holds the inline
 * styles to ScrollReveal 4.0.9 byte for byte. These cover the API around them:
 * the singleton, option merging, targets, sequencing order, callbacks,
 * clean / sync / destroy and the failure paths — in jsdom, with layout stubbed.
 */

class RafQueue {
  queue: FrameRequestCallback[] = [];
  id = 0;
  schedule = vi.fn((cb: FrameRequestCallback) => { this.queue.push(cb); return ++this.id; });
  cancel = vi.fn();
  flush() { while (this.queue.length) this.queue.shift()?.(performance.now()); }
}

let raf: RafQueue;
let ScrollReveal: ScrollRevealStatic;
const VH = 800;

function layout(el: HTMLElement, top: number, height = 200): HTMLElement {
  for (const [k, v] of Object.entries({ offsetTop: top, offsetHeight: height, offsetLeft: 0, offsetWidth: 600, offsetParent: null })) {
    Object.defineProperty(el, k, { configurable: true, get: () => v });
  }
  return el;
}

function add(id: string, top: number, cls = 'box', style?: string): HTMLElement {
  const el = document.createElement('div');
  el.id = id;
  el.className = cls;
  if (style) el.setAttribute('style', style);
  document.body.appendChild(el);
  return layout(el, top);
}

/** Let reveal()'s deferred initialise run, then its first frame. */
function settle(ms = 0): void {
  vi.advanceTimersByTime(ms);
  raf.flush();
}

function scrollTo(y: number): void {
  vi.stubGlobal('pageYOffset', y);
  window.dispatchEvent(new Event('scroll'));
  raf.flush();
}

const shown = (el: HTMLElement) => el.style.opacity === '1';

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
  raf = new RafQueue();
  vi.stubGlobal('requestAnimationFrame', raf.schedule);
  vi.stubGlobal('cancelAnimationFrame', raf.cancel);
  vi.stubGlobal('pageYOffset', 0);
  Object.defineProperty(document.documentElement, 'clientHeight', { configurable: true, get: () => VH });
  Object.defineProperty(document.documentElement, 'clientWidth', { configurable: true, get: () => 1000 });
  document.head.innerHTML = '<style>.box { opacity: 1; }</style>';
  document.body.innerHTML = '';
  document.documentElement.className = '';
  vi.resetModules();
  ScrollReveal = (await import('../scrollreveal')).default;
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('ScrollReveal drop-in: the factory', () => {
  it('is a singleton that works with and without new, and merges later options', () => {
    const a = ScrollReveal({ duration: 900 });
    const b = new ScrollReveal({ delay: 50 });
    expect(b).toBe(a);
    expect(a.defaults.duration).toBe(900);
    expect(a.defaults.delay).toBe(50);
    expect(a.noop).toBe(false);
    expect(a.version).toBe('4.0.9');
  });

  it('mounts like ScrollReveal: the sr class and body height', () => {
    ScrollReveal();
    expect(document.documentElement.classList.contains('sr')).toBe(true);
    expect(document.body.style.height).toBe('100%');
  });

  it('returns a no-op instance for an invalid container, and removes sr', () => {
    document.documentElement.classList.add('sr');
    const sr = ScrollReveal({ container: '#nope' });
    expect(sr.noop).toBe(true);
    expect(() => sr.reveal('.box')).not.toThrow();
    expect(document.documentElement.classList.contains('sr')).toBe(false);
  });

  it('honours mobile: false on a mobile user agent', () => {
    vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)' });
    expect(ScrollReveal({ mobile: false }).noop).toBe(true);
  });

  it('exposes isSupported and a boolean-only debug flag', () => {
    expect(ScrollReveal.isSupported()).toBe(true);
    ScrollReveal.debug = true;
    (ScrollReveal as unknown as { debug: unknown }).debug = 'yes';
    expect(ScrollReveal.debug).toBe(true);
  });

  it('logs failures only when debug is on', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    ScrollReveal().reveal('.missing');
    expect(log).not.toHaveBeenCalled();
    ScrollReveal.debug = true;
    ScrollReveal().reveal('.missing');
    expect(log.mock.calls[0][0]).toContain('Reveal failed.');
    ScrollReveal.debug = false;
  });
});

describe('ScrollReveal drop-in: revealing', () => {
  it('accepts a selector, an element, a NodeList and an array', () => {
    const els = ['a', 'b', 'c', 'd'].map((id, i) => add(id, 2000 + i * 10));
    const sr = ScrollReveal();
    sr.reveal('#a');
    sr.reveal(els[1]);
    sr.reveal(document.querySelectorAll('#c'));
    sr.reveal([els[3]]);
    for (const el of els) expect(el.hasAttribute('data-sr-id')).toBe(true);
  });

  it('hides off-screen elements and reveals them once scrolled into view', () => {
    const el = add('a', 2000);
    ScrollReveal().reveal('.box', { distance: '20px' });
    settle();
    expect(el.style.visibility).toBe('visible');
    expect(el.style.opacity).toBe('0');
    expect(el.style.transform).toBe('matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 20, 0, 1)');
    scrollTo(1300); // 2000 < 1300 + 800
    expect(shown(el)).toBe(true);
    expect(el.style.transform).toBe('matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)');
    expect(el.style.transition).toBe('opacity 0.6s cubic-bezier(0.5, 0, 0, 1) 0s, transform 0.6s cubic-bezier(0.5, 0, 0, 1) 0s');
  });

  it('keeps the author’s inline styles', () => {
    const el = add('a', 0, 'box', 'color: red; margin-top: 4px');
    ScrollReveal().reveal('.box');
    settle();
    expect(el.style.color).toBe('red');
    expect(el.style.marginTop).toBe('4px');
  });

  it('reset hides again on the way out; without it the element stays', () => {
    const keep = add('keep', 2000, 'box keep');
    const reset = add('reset', 2000, 'box reset');
    const sr = ScrollReveal();
    sr.reveal('.keep');
    sr.reveal('.reset', { reset: true });
    settle();
    scrollTo(1300);
    scrollTo(0);
    expect(shown(keep)).toBe(true);
    expect(reset.style.opacity).toBe('0');
  });

  it('viewFactor needs that share of the element inside the view', () => {
    const el = add('a', 1000, 'box', undefined);
    layout(el, 1000, 400);
    ScrollReveal().reveal('.box', { viewFactor: 0.5 });
    settle();
    scrollTo(399); // element top + 200 must pass 399 + 800
    expect(shown(el)).toBe(false);
    scrollTo(401);
    expect(shown(el)).toBe(true);
  });

  it('fires before/after callbacks around the transition, and cleanup cleans', () => {
    const el = add('a', 0);
    const calls: string[] = [];
    ScrollReveal().reveal('.box', {
      duration: 300,
      delay: 100,
      cleanup: true,
      beforeReveal: () => calls.push('before'),
      afterReveal: () => calls.push('after'),
    });
    settle();
    expect(calls).toEqual(['before']);
    vi.advanceTimersByTime(399);
    expect(calls).toEqual(['before']);
    vi.advanceTimersByTime(1);
    expect(calls).toEqual(['before', 'after']);
    expect(el.hasAttribute('data-sr-id')).toBe(false);
  });

  it('a sequence reveals one member per interval, in order', () => {
    const els = ['s0', 's1', 's2'].map((id, i) => add(id, 100 + i * 10, 'box seq'));
    ScrollReveal().reveal('.seq', { interval: 100 });
    settle();
    expect(els.map(shown)).toEqual([true, false, false]);
    settle(100);
    expect(els.map(shown)).toEqual([true, true, false]);
    settle(100);
    expect(els.map(shown)).toEqual([true, true, true]);
  });
});

describe('ScrollReveal drop-in: clean, sync, destroy', () => {
  it('clean() restores the element and forgets it', () => {
    const el = add('a', 2000, 'box', 'color: red');
    const sr = ScrollReveal();
    sr.reveal('.box');
    settle();
    sr.clean('#a');
    expect(el.hasAttribute('data-sr-id')).toBe(false);
    expect(el.style.color).toBe('red');
    expect(el.style.visibility).toBe('visible');
    scrollTo(1500);
    expect(el.style.opacity).toBe('0'); // no longer managed
  });

  it('sync() picks up elements added after reveal()', () => {
    // As in ScrollReveal, a reveal() that matches nothing fails and is not
    // recorded, so the first call needs a match for sync() to replay it.
    add('first', 0);
    const sr = ScrollReveal();
    sr.reveal('.box');
    settle();
    const late = add('late', 0);
    expect(late.hasAttribute('data-sr-id')).toBe(false);
    sr.sync();
    raf.flush();
    expect(late.hasAttribute('data-sr-id')).toBe(true);
    expect(shown(late)).toBe(true);
  });

  it('destroy() restores every element and stops listening', () => {
    const el = add('a', 2000);
    const sr = ScrollReveal();
    sr.reveal('.box');
    settle();
    sr.destroy();
    expect(el.hasAttribute('data-sr-id')).toBe(false);
    scrollTo(1500);
    expect(el.style.opacity).toBe('0');
  });

  it('reduced motion shows everything with no transition and no listeners', () => {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('reduce'), addEventListener() {}, removeEventListener() {} }));
    const el = add('a', 9000);
    ScrollReveal().reveal('.box', { distance: '50px' });
    settle();
    expect(el.style.transition).toBe('none');
    expect(el.style.transform).toBe('matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)');
    expect(raf.schedule).not.toHaveBeenCalled();
  });
});
