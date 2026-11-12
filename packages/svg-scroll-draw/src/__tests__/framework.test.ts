import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── Solid mock — must be declared before the solid wrapper is imported ────────
// Captures the hook's effect and cleanup so tests can fire them by hand. Solid
// runs an effect after render, once refs are set — the moment onMount ran — and
// again whenever something it read changes; calling mountCbs[0]() again stands
// in for that re-run.
const mountCbs:   (() => void)[] = [];
const cleanupCbs: (() => void)[] = [];

vi.mock('solid-js', () => ({
  createEffect: vi.fn((fn: () => void) => { mountCbs.push(fn); }),
  onCleanup:    vi.fn((fn: () => void) => { cleanupCbs.push(fn); }),
  untrack:      <T,>(fn: () => T): T => fn(),
}));

import { ScrollDrawRef } from '../angular/index';
import { _getRegistry } from '../core/registry';
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
  /** One frame: every callback queued before it, as a browser runs them. */
  tick()   { const frame = this.queue; this.queue = []; for (const cb of frame) cb(performance.now()); }
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
let listens: ReturnType<typeof vi.spyOn>;
let unlistens: ReturnType<typeof vi.spyOn>;

/**
 * Every engine made, in order, by the scroll listener its frames wake on
 * (core/frame-gate), and whether destroy() took that listener off again.
 */
function engines(): { gone: boolean }[] {
  const scrolls = (spy: ReturnType<typeof vi.spyOn>) => spy.mock.calls.filter((c) => c[0] === 'scroll').map((c) => c[1]);
  const removed = scrolls(unlistens);
  return scrolls(listens).map((fn) => ({ gone: removed.includes(fn) }));
}

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
  listens = vi.spyOn(window, 'addEventListener');
  unlistens = vi.spyOn(window, 'removeEventListener');
});

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// ── Angular — ScrollDrawRef ───────────────────────────────────────────────────

describe('ScrollDrawRef (Angular)', () => {
  it('init() starts an engine on the element', () => {
    const ref = new ScrollDrawRef();
    const container = makeContainer();
    ref.init(container);
    expect(_getRegistry().has(container)).toBe(true);
  });

  it('init() returns the instance for chaining', () => {
    const ref = new ScrollDrawRef();
    expect(ref.init(makeContainer())).toBe(ref);
  });

  it('destroy() destroys the engine', () => {
    const ref = new ScrollDrawRef();
    ref.init(makeContainer());
    ref.destroy();
    expect(engines()[0].gone).toBe(true);
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
    ref.init(container);
    // First engine must have been destroyed before the second was created
    expect(engines()[0].gone).toBe(true);
    expect(engines()).toHaveLength(2);
  });

  it('replay() resets dashoffset to full length', () => {
    const container = makeContainer();
    const ref       = new ScrollDrawRef();
    ref.init(container);

    vi.stubGlobal('scrollY', 500);
    window.dispatchEvent(new Event('scroll'));
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

describe('ScrollDrawRef.update() (Angular ngOnChanges)', () => {
  it('is a no-op before init()', () => {
    const ref = new ScrollDrawRef();
    expect(() => ref.update({ speed: 2 })).not.toThrow();
    expect(engines()).toHaveLength(0);
  });

  it('keeps the running engine when the options are equal', () => {
    const ref = new ScrollDrawRef();
    ref.init(makeContainer(), { speed: 1, trigger: { start: 'top 80%' } });
    ref.update({ speed: 1, trigger: { start: 'top 80%' } });
    expect(engines()).toHaveLength(1);
    expect(engines()[0].gone).toBe(false);
  });

  it('rebuilds the engine on the same element when an option changes', () => {
    const ref = new ScrollDrawRef();
    const container = makeContainer();
    ref.init(container, { speed: 1 });
    ref.update({ speed: 2 });
    expect(engines()).toHaveLength(2);
    expect(engines()[0].gone).toBe(true);
    expect(_getRegistry().has(container)).toBe(true);
  });

  it('does nothing after destroy()', () => {
    const ref = new ScrollDrawRef();
    ref.init(makeContainer(), { speed: 1 });
    ref.destroy();
    ref.update({ speed: 2 });
    expect(engines()).toHaveLength(1);
  });
});

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

  it('each instance runs on its own element', () => {
    const a = makeContainer();
    const b = makeContainer();
    a.setAttribute('data-scroll-draw', '');
    b.setAttribute('data-scroll-draw', '');

    initScrollDraw();

    expect(_getRegistry().has(a)).toBe(true);
    expect(_getRegistry().has(b)).toBe(true);
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

  it('starts an engine on the node immediately on mount', () => {
    const node = makeContainer();
    svelteAction(node);
    expect(_getRegistry().has(node)).toBe(true);
  });

  it('destroy() destroys the engine', () => {
    const node   = makeContainer();
    const action = svelteAction(node);
    action.destroy();
    expect(engines()[0].gone).toBe(true);
  });

  it('update() replaces the engine with new options', () => {
    const node   = makeContainer();
    const action = svelteAction(node, { fade: false });
    action.update({ fade: true });

    // Old engine is destroyed (disconnect called) and new one created
    expect(engines()[0].gone).toBe(true);
    expect(engines()).toHaveLength(2);

    const path = node.querySelector('path') as SVGPathElement;
    expect(path.style.opacity).toBe('0'); // fade:true → hidden initially
  });

  it('update() keeps the engine when Svelte passes an equal new object', () => {
    // An inline `use:scrollDraw={{ … }}` is a new object on every change in
    // the expression; tearing the draw down for each would restart it.
    const action = svelteAction(makeContainer(), { speed: 1, trigger: { start: 'top 80%' } });
    action.update({ speed: 1, trigger: { start: 'top 80%' } });
    expect(engines()).toHaveLength(1);
    expect(engines()[0].gone).toBe(false);
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

    expect(_getRegistry().has(container)).toBe(true);
  });

  it('does not create an engine if mount fires before the ref is set', () => {
    solidUse({ easing: 'ease-out' });
    mountCbs[0](); // mount before ref is set → el is undefined → no engine
    expect(engines()).toHaveLength(0);
  });

  it('destroys the engine when cleanup fires', () => {
    const ref       = solidUse();
    const container = makeContainer();
    ref(container);
    mountCbs[0]();
    cleanupCbs[0](); // simulate Solid onCleanup
    expect(engines()[0].gone).toBe(true);
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

describe('solid option changes', () => {
  it('rebuilds the engine when an accessor returns a changed option', () => {
    let speed = 1;
    const ref = solidUse(() => ({ speed }));
    ref(makeContainer());
    mountCbs[0]();
    speed = 2;
    mountCbs[0](); // Solid re-runs the effect when the signal it read changes

    expect(engines()).toHaveLength(2);
    expect(engines()[0].gone).toBe(true);
  });

  it('keeps the engine when the effect re-runs with equal options', () => {
    const ref = solidUse(() => ({ speed: 1, trigger: { start: 'top 80%' } }));
    ref(makeContainer());
    mountCbs[0]();
    mountCbs[0]();

    expect(engines()).toHaveLength(1);
    expect(engines()[0].gone).toBe(false);
  });

  it('getInstance() follows the rebuilt engine', () => {
    let speed = 1;
    const { ref, getInstance } = solidCreate(() => ({ speed }));
    ref(makeContainer());
    mountCbs[0]();
    const first = getInstance();
    speed = 2;
    mountCbs[0]();
    expect(getInstance()).toBeDefined();
    expect(getInstance()).not.toBe(first);
  });
});
