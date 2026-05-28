import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── Solid mock — must be declared before the solid wrapper is imported ────────
// Captures onMount / onCleanup callbacks so tests can fire them manually,
// mirroring the real Solid component lifecycle.
const mountCbs:   (() => void)[] = [];
const cleanupCbs: (() => void)[] = [];

vi.mock('solid-js', () => ({
  onMount:   vi.fn((fn: () => void) => { mountCbs.push(fn); }),
  onCleanup: vi.fn((fn: () => void) => { cleanupCbs.push(fn); }),
}));

import { ScrollDrawRef } from '../angular/index';
import { initScrollDraw } from '../astro/index';
import { scrollDraw as svelteAction, createScrollDraw as svelteCreate } from '../svelte/index';
import { useScrollDraw as solidUse, createScrollDraw as solidCreate } from '../solid/index';

// ── Shared helpers ─────────────────────────────────────────────────────────────

function makePath(): SVGPathElement {
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'path') as SVGPathElement;
  el.setAttribute('stroke', 'black');
  (el as unknown as { getTotalLength: () => number }).getTotalLength = () => 100;
  return el;
}

function makeContainer(): HTMLDivElement {
  const div = document.createElement('div');
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.appendChild(makePath());
  div.appendChild(svg);
  document.body.appendChild(div);
  return div;
}

class RafQueue {
  private queue: FrameRequestCallback[] = [];
  private id = 0;
  schedule = vi.fn((cb: FrameRequestCallback): number => { this.queue.push(cb); return ++this.id; });
  cancel   = vi.fn();
  tick()   { const cb = this.queue.shift(); cb?.(performance.now()); }
}

class FakeIO {
  private cb: IntersectionObserverCallback;
  static instances: FakeIO[] = [];
  constructor(cb: IntersectionObserverCallback) { this.cb = cb; FakeIO.instances.push(this); }
  observe    = vi.fn();
  disconnect = vi.fn();
  trigger(intersecting: boolean) {
    this.cb([{ isIntersecting: intersecting } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
  }
}

let raf: RafQueue;

beforeEach(() => {
  raf = new RafQueue();
  FakeIO.instances = [];
  mountCbs.length   = 0;
  cleanupCbs.length = 0;
  vi.stubGlobal('requestAnimationFrame', raf.schedule);
  vi.stubGlobal('cancelAnimationFrame',  raf.cancel);
  vi.stubGlobal('IntersectionObserver',  FakeIO);
  vi.stubGlobal('scrollY',     0);
  vi.stubGlobal('innerHeight', 800);
  vi.stubGlobal('scrollX',     0);
  vi.stubGlobal('innerWidth',  1200);
  vi.stubGlobal('matchMedia', (q: string) => ({
    matches: false, media: q,
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
  }));
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    top: 0, height: 500, left: 0, width: 500, right: 500, bottom: 500, x: 0, y: 0,
    toJSON: () => {},
  } as DOMRect);
});

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// ── Angular — ScrollDrawRef ───────────────────────────────────────────────────

describe('ScrollDrawRef (Angular)', () => {
  it('init() starts observing the element', () => {
    const ref = new ScrollDrawRef();
    const container = makeContainer();
    ref.init(container);
    expect(FakeIO.instances[0].observe).toHaveBeenCalledWith(container);
  });

  it('init() returns the instance for chaining', () => {
    const ref = new ScrollDrawRef();
    expect(ref.init(makeContainer())).toBe(ref);
  });

  it('destroy() disconnects the observer', () => {
    const ref = new ScrollDrawRef();
    ref.init(makeContainer());
    ref.destroy();
    expect(FakeIO.instances[0].disconnect).toHaveBeenCalled();
  });

  it('destroy() is a no-op before init()', () => {
    const ref = new ScrollDrawRef();
    expect(() => ref.destroy()).not.toThrow();
  });

  it('destroy() returns the instance for chaining', () => {
    const ref = new ScrollDrawRef();
    ref.init(makeContainer());
    expect(ref.destroy()).toBe(ref);
  });

  it('calling init() twice destroys the first engine before creating the second', () => {
    const ref       = new ScrollDrawRef();
    const container = makeContainer();
    ref.init(container);
    const firstIO = FakeIO.instances[0];
    ref.init(container);
    // First engine must have been disconnected before the second was created
    expect(firstIO.disconnect).toHaveBeenCalled();
    expect(FakeIO.instances).toHaveLength(2);
  });

  it('replay() resets dashoffset to full length', () => {
    const container = makeContainer();
    const ref       = new ScrollDrawRef();
    ref.init(container);

    vi.stubGlobal('scrollY', 500);
    FakeIO.instances[0].trigger(true);
    raf.tick();

    ref.replay();

    const path = container.querySelector('path') as SVGPathElement;
    expect(parseFloat(path.style.strokeDashoffset)).toBeCloseTo(100, 0);
  });

  it('replay() returns the instance for chaining', () => {
    const ref = new ScrollDrawRef();
    ref.init(makeContainer());
    expect(ref.replay()).toBe(ref);
  });

  it('replay() is a no-op before init()', () => {
    const ref = new ScrollDrawRef();
    expect(() => ref.replay()).not.toThrow();
  });
});

// ── Astro — initScrollDraw ───────────────────────────────────────────────────

describe('initScrollDraw (Astro)', () => {
  it('returns empty array when no [data-scroll-draw] elements exist', () => {
    const instances = initScrollDraw();
    expect(instances).toHaveLength(0);
  });

  it('returns one instance per [data-scroll-draw] element', () => {
    const a = makeContainer();
    const b = makeContainer();
    a.setAttribute('data-scroll-draw', '');
    b.setAttribute('data-scroll-draw', '');

    const instances = initScrollDraw();
    expect(instances).toHaveLength(2);
  });

  it('each returned instance exposes destroy and replay', () => {
    const container = makeContainer();
    container.setAttribute('data-scroll-draw', '');

    const [instance] = initScrollDraw();
    expect(typeof instance.destroy).toBe('function');
    expect(typeof instance.replay).toBe('function');
  });

  it('parses options from data-scroll-draw-options JSON attribute', () => {
    const container = makeContainer();
    container.setAttribute('data-scroll-draw', '');
    container.setAttribute('data-scroll-draw-options', '{"fade":true}');

    initScrollDraw();

    // fade:true → path opacity initialised to '0'
    const path = container.querySelector('path') as SVGPathElement;
    expect(path.style.opacity).toBe('0');
  });

  it('falls back to empty options when JSON is invalid', () => {
    const container = makeContainer();
    container.setAttribute('data-scroll-draw', '');
    container.setAttribute('data-scroll-draw-options', '{bad json}');

    expect(() => initScrollDraw()).not.toThrow();
  });

  it('scopes the search to a provided root element', () => {
    const outside = makeContainer();
    outside.setAttribute('data-scroll-draw', '');

    const scope = document.createElement('div');
    document.body.appendChild(scope);
    const inside = makeContainer();
    inside.setAttribute('data-scroll-draw', '');
    scope.appendChild(inside);

    const instances = initScrollDraw(scope);
    expect(instances).toHaveLength(1);
  });

  it('each instance observes its own element', () => {
    const a = makeContainer();
    const b = makeContainer();
    a.setAttribute('data-scroll-draw', '');
    b.setAttribute('data-scroll-draw', '');

    initScrollDraw();

    expect(FakeIO.instances[0].observe).toHaveBeenCalledWith(a);
    expect(FakeIO.instances[1].observe).toHaveBeenCalledWith(b);
  });
});

// ── Svelte — scrollDraw action ───────────────────────────────────────────────

describe('svelte scrollDraw action', () => {
  it('returns an object with update and destroy methods', () => {
    const node   = makeContainer();
    const action = svelteAction(node);
    expect(typeof action.update).toBe('function');
    expect(typeof action.destroy).toBe('function');
  });

  it('starts observing the node immediately on mount', () => {
    const node = makeContainer();
    svelteAction(node);
    expect(FakeIO.instances[0].observe).toHaveBeenCalledWith(node);
  });

  it('destroy() disconnects the observer', () => {
    const node   = makeContainer();
    const action = svelteAction(node);
    action.destroy();
    expect(FakeIO.instances[0].disconnect).toHaveBeenCalled();
  });

  it('update() replaces the engine with new options', () => {
    const node   = makeContainer();
    const action = svelteAction(node, { fade: false });
    action.update({ fade: true });

    // Old engine is destroyed (disconnect called) and new one created
    expect(FakeIO.instances[0].disconnect).toHaveBeenCalled();
    expect(FakeIO.instances).toHaveLength(2);

    const path = node.querySelector('path') as SVGPathElement;
    expect(path.style.opacity).toBe('0'); // fade:true → hidden initially
  });

  it('passes options to the engine', () => {
    const node = makeContainer();
    svelteAction(node, { fade: true });
    const path = node.querySelector('path') as SVGPathElement;
    expect(path.style.opacity).toBe('0');
  });
});

describe('svelte createScrollDraw helper', () => {
  it('returns { action, getInstance }', () => {
    const { action, getInstance } = svelteCreate({ easing: 'ease-out' });
    expect(typeof action).toBe('function');
    expect(typeof getInstance).toBe('function');
  });

  it('getInstance() returns null before action is attached', () => {
    const { getInstance } = svelteCreate();
    expect(getInstance()).toBeNull();
  });

  it('getInstance() returns the live engine after action is attached', () => {
    const { action, getInstance } = svelteCreate({ easing: 'ease-out' });
    action(makeContainer());
    expect(getInstance()).not.toBeNull();
    expect(typeof getInstance()?.destroy).toBe('function');
  });

  it('action destroy() nulls out the instance', () => {
    const { action, getInstance } = svelteCreate();
    const { destroy } = action(makeContainer());
    destroy();
    expect(getInstance()).toBeNull();
  });
});

// ── Solid — useScrollDraw / createScrollDraw ──────────────────────────────────

describe('solid useScrollDraw', () => {
  it('returns a ref setter function', () => {
    const ref = solidUse({ easing: 'ease-out' });
    expect(typeof ref).toBe('function');
  });

  it('creates the engine when mount fires after the ref is set', () => {
    const ref       = solidUse({ easing: 'ease-out' });
    const container = makeContainer();
    ref(container);           // set the node
    mountCbs[0]();            // simulate Solid onMount

    expect(FakeIO.instances[0].observe).toHaveBeenCalledWith(container);
  });

  it('does not create an engine if mount fires before the ref is set', () => {
    solidUse({ easing: 'ease-out' });
    mountCbs[0](); // mount before ref is set → el is undefined → no engine
    expect(FakeIO.instances).toHaveLength(0);
  });

  it('destroys the engine when cleanup fires', () => {
    const ref       = solidUse();
    const container = makeContainer();
    ref(container);
    mountCbs[0]();
    cleanupCbs[0](); // simulate Solid onCleanup
    expect(FakeIO.instances[0].disconnect).toHaveBeenCalled();
  });
});

describe('solid createScrollDraw', () => {
  it('returns { ref, getInstance }', () => {
    const { ref, getInstance } = solidCreate({ easing: 'spring' });
    expect(typeof ref).toBe('function');
    expect(typeof getInstance).toBe('function');
  });

  it('getInstance() returns undefined before mount', () => {
    const { ref, getInstance } = solidCreate();
    const container = makeContainer();
    ref(container);
    // mount not yet called
    expect(getInstance()).toBeUndefined();
  });

  it('getInstance() returns the live engine after mount', () => {
    const { ref, getInstance } = solidCreate({ easing: 'ease-out' });
    const container = makeContainer();
    ref(container);
    mountCbs[0]();
    expect(getInstance()).toBeDefined();
    expect(typeof getInstance()?.destroy).toBe('function');
  });

  it('getInstance() returns undefined after cleanup', () => {
    const { ref, getInstance } = solidCreate();
    ref(makeContainer());
    mountCbs[0]();
    cleanupCbs[0]();
    expect(getInstance()).toBeUndefined();
  });
});
