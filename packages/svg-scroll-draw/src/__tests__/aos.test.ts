import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import AOS, { init, refresh, refreshHard, destroy } from '../aos';

class RafQueue {
  queue: FrameRequestCallback[] = [];
  id = 0;
  schedule = vi.fn((cb: FrameRequestCallback) => { this.queue.push(cb); return ++this.id; });
  cancel = vi.fn();
  flush() { while (this.queue.length) this.queue.shift()?.(performance.now()); }
}

let raf: RafQueue;
const VH = 800;

/** jsdom has no layout: give an element the document top and height AOS reads. */
function box(el: HTMLElement, top: number, height = 200): HTMLElement {
  Object.defineProperty(el, 'offsetTop', { configurable: true, get: () => top });
  Object.defineProperty(el, 'offsetHeight', { configurable: true, get: () => height });
  Object.defineProperty(el, 'offsetParent', { configurable: true, get: () => null });
  return el;
}

function add(attrs: Record<string, string>, top: number, height = 200): HTMLElement {
  const el = document.createElement('div');
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  document.body.appendChild(el);
  return box(el, top, height);
}

function scrollTo(y: number): void {
  vi.stubGlobal('scrollY', y);
  window.dispatchEvent(new Event('scroll'));
  raf.flush();
}

const animated = (el: Element) => el.classList.contains('aos-animate');

beforeEach(() => {
  raf = new RafQueue();
  vi.stubGlobal('requestAnimationFrame', raf.schedule);
  vi.stubGlobal('cancelAnimationFrame', raf.cancel);
  vi.stubGlobal('innerHeight', VH);
  vi.stubGlobal('innerWidth', 1280);
  vi.stubGlobal('scrollY', 0);
  document.body.innerHTML = '';
});

afterEach(() => {
  destroy();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('AOS drop-in: setup', () => {
  it('has the AOS shape, as a default export and as named exports', () => {
    expect(Object.keys(AOS).sort()).toEqual(['destroy', 'init', 'refresh', 'refreshHard']);
    expect(AOS.init).toBe(init);
  });

  it('marks every element, injects one stylesheet and returns the elements', () => {
    const a = add({ 'data-aos': 'fade-up' }, 2000);
    const b = add({ 'data-aos': 'zoom-in' }, 3000);
    expect(init()).toEqual([a, b]);
    expect(a.classList.contains('aos-init')).toBe(true);
    expect(document.querySelectorAll('style#svg-scroll-draw-aos')).toHaveLength(1);
    init();
    expect(document.querySelectorAll('style#svg-scroll-draw-aos')).toHaveLength(1);
  });

  it('turns duration, delay and easing into per-element custom properties', () => {
    const el = add({ 'data-aos': 'fade', 'data-aos-duration': '1200', 'data-aos-delay': '300', 'data-aos-easing': 'ease-out-back' }, 2000);
    const plain = add({ 'data-aos': 'fade' }, 2000);
    init({ duration: 600, easing: 'linear' });
    expect(el.style.getPropertyValue('--aos-duration')).toBe('1200ms');
    expect(el.style.getPropertyValue('--aos-delay')).toBe('300ms');
    expect(el.style.getPropertyValue('--aos-easing')).toBe('cubic-bezier(.175,.885,.32,1.275)');
    expect(plain.style.getPropertyValue('--aos-duration')).toBe('600ms');
    expect(plain.style.getPropertyValue('--aos-easing')).toBe('linear');
  });

  it('honours custom class names and useClassNames', () => {
    const el = add({ 'data-aos': 'animate__fadeIn animate__slow' }, 0);
    init({ initClassName: 'ready', animatedClassName: 'animate__animated', useClassNames: true });
    expect(el.classList.contains('ready')).toBe(true);
    expect(Array.from(el.classList)).toEqual(expect.arrayContaining(['animate__animated', 'animate__fadeIn', 'animate__slow']));
  });
});

describe('AOS drop-in: triggering', () => {
  // top 2000, viewport 800, offset 120 → in at scrollY >= 2000 - 800 + 120 = 1320
  it('animates in past the trigger point and out again on the way back', () => {
    const el = add({ 'data-aos': 'fade-up' }, 2000);
    init();
    expect(animated(el)).toBe(false);
    scrollTo(1320); // AOS compares strictly: exactly on the trigger is not past it
    expect(animated(el)).toBe(false);
    scrollTo(1321);
    expect(animated(el)).toBe(true);
    scrollTo(0);
    expect(animated(el)).toBe(false);
  });

  it('animates elements already in view at init', () => {
    const el = add({ 'data-aos': 'fade' }, 100);
    init();
    expect(animated(el)).toBe(true);
  });

  it('once keeps the element animated, globally or per element', () => {
    const a = add({ 'data-aos': 'fade' }, 2000);
    const b = add({ 'data-aos': 'fade', 'data-aos-once': 'true' }, 2000);
    init();
    scrollTo(1500);
    scrollTo(0);
    expect(animated(a)).toBe(false);
    expect(animated(b)).toBe(true);
  });

  it('mirror animates out once the element has scrolled past the top', () => {
    // out at top + height - offset = 2000 + 200 - 120 = 2080
    const el = add({ 'data-aos': 'fade', 'data-aos-mirror': 'true' }, 2000);
    init();
    scrollTo(1500);
    expect(animated(el)).toBe(true);
    scrollTo(2081);
    expect(animated(el)).toBe(false);
    scrollTo(1500);
    expect(animated(el)).toBe(true);
  });

  it('reads data-aos-once like AOS: only "true"/"false" override the global', () => {
    const empty = add({ 'data-aos': 'fade', 'data-aos-once': '' }, 2000);
    const off = add({ 'data-aos': 'fade', 'data-aos-once': 'false' }, 2000);
    init({ once: true });
    scrollTo(1500);
    scrollTo(0);
    expect(animated(empty)).toBe(true); // global once wins
    expect(animated(off)).toBe(false);
  });

  it('a non-numeric data-aos-offset means 0, as in AOS', () => {
    const el = add({ 'data-aos': 'fade', 'data-aos-offset': 'abc' }, 2000);
    init({ offset: 500 });
    scrollTo(1201);
    expect(animated(el)).toBe(true);
  });

  it('uses data-aos-offset over the global offset', () => {
    const el = add({ 'data-aos': 'fade', 'data-aos-offset': '0' }, 2000);
    init({ offset: 500 });
    scrollTo(1201);
    expect(animated(el)).toBe(true);
  });

  it('anchor placements move the trigger like AOS, with its offset-0 quirk', () => {
    // inline placement and no inline offset → offset 0 (AOS behaviour)
    // center-center: top - vh + vh/2 + h/2 = 2000 - 800 + 400 + 100 = 1700
    const el = add({ 'data-aos': 'fade', 'data-aos-anchor-placement': 'center-center' }, 2000);
    init();
    scrollTo(1700);
    expect(animated(el)).toBe(false);
    scrollTo(1701);
    expect(animated(el)).toBe(true);
  });

  it('a global anchorPlacement still uses the global offset', () => {
    // top-top: top - vh + vh + offset = 2000 + 120
    const el = add({ 'data-aos': 'fade' }, 2000);
    init({ anchorPlacement: 'top-top' });
    scrollTo(2120);
    expect(animated(el)).toBe(false);
    scrollTo(2121);
    expect(animated(el)).toBe(true);
  });

  it('data-aos-anchor triggers off another element', () => {
    const anchor = add({ id: 'anchor' }, 4000);
    const el = add({ 'data-aos': 'fade', 'data-aos-anchor': '#anchor' }, 100);
    init();
    expect(anchor).toBeTruthy();
    expect(animated(el)).toBe(false);
    scrollTo(4000 - VH + 120 + 1);
    expect(animated(el)).toBe(true);
  });

  it('fires aos:in / aos:out, plus the per-id events', () => {
    const el = add({ 'data-aos': 'fade', 'data-aos-id': 'hero' }, 2000);
    const seen: Array<[string, unknown]> = [];
    const stop = new AbortController();
    for (const type of ['aos:in', 'aos:out', 'aos:in:hero', 'aos:out:hero']) {
      document.addEventListener(type, (e) => seen.push([type, (e as CustomEvent).detail]), { signal: stop.signal });
    }
    init();
    scrollTo(1500);
    scrollTo(0);
    stop.abort();
    expect(seen).toEqual([['aos:in', el], ['aos:in:hero', el], ['aos:out', el], ['aos:out:hero', el]]);
  });
});

describe('AOS drop-in: lifecycle', () => {
  it('refresh() re-measures after a layout change', () => {
    const el = add({ 'data-aos': 'fade' }, 2000);
    init();
    scrollTo(1400);
    expect(animated(el)).toBe(true);
    box(el, 5000);
    refresh();
    expect(animated(el)).toBe(false);
  });

  it('refreshHard() picks up elements added later', () => {
    init({ disableMutationObserver: true });
    const late = add({ 'data-aos': 'fade' }, 0);
    expect(late.classList.contains('aos-init')).toBe(false);
    refreshHard();
    expect(late.classList.contains('aos-init')).toBe(true);
    expect(animated(late)).toBe(true);
  });

  it('the mutation observer picks up new [data-aos] elements by itself', async () => {
    init();
    const late = add({ 'data-aos': 'fade' }, 0);
    await new Promise((r) => setTimeout(r, 0));
    expect(late.classList.contains('aos-init')).toBe(true);
  });

  it('disable strips the attributes so nothing stays hidden', () => {
    const el = add({ 'data-aos': 'fade-up', 'data-aos-duration': '600' }, 2000);
    expect(init({ disable: true })).toEqual([]);
    expect(el.hasAttribute('data-aos')).toBe(false);
    expect(el.hasAttribute('data-aos-duration')).toBe(false);
    expect(document.getElementById('svg-scroll-draw-aos')).toBeNull();
  });

  it("disable: 'mobile' and predicates are honoured", () => {
    vi.stubGlobal('innerWidth', 600);
    const el = add({ 'data-aos': 'fade' }, 2000);
    init({ disable: 'mobile' });
    expect(el.hasAttribute('data-aos')).toBe(false);

    const el2 = add({ 'data-aos': 'fade' }, 2000);
    init({ disable: () => false });
    expect(el2.classList.contains('aos-init')).toBe(true);
  });

  it('reduced motion shows every element in its final state without a transition', () => {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('reduce'), addEventListener() {}, removeEventListener() {} }));
    const el = add({ 'data-aos': 'fade-up' }, 9000);
    init();
    expect(animated(el)).toBe(true);
    expect(el.hasAttribute('data-aos-instant')).toBe(true);
  });

  it('waits for a custom startEvent', () => {
    const el = add({ 'data-aos': 'fade' }, 0);
    init({ startEvent: 'app:ready' });
    expect(el.classList.contains('aos-init')).toBe(false);
    document.dispatchEvent(new Event('app:ready'));
    expect(el.classList.contains('aos-init')).toBe(true);
  });

  it('destroy() stops scroll handling and removes the stylesheet', () => {
    const el = add({ 'data-aos': 'fade' }, 2000);
    init();
    destroy();
    expect(document.getElementById('svg-scroll-draw-aos')).toBeNull();
    scrollTo(1500);
    expect(animated(el)).toBe(false);
  });

  it('a resize re-measures after its debounce', () => {
    vi.useFakeTimers();
    const el = add({ 'data-aos': 'fade' }, 2000);
    init();
    vi.stubGlobal('scrollY', 1400);
    box(el, 1000);
    window.dispatchEvent(new Event('resize'));
    vi.advanceTimersByTime(60);
    raf.flush();
    expect(animated(el)).toBe(true);
  });
});
