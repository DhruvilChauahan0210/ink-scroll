/**
 * The instance registry devtools reads.
 *
 * Two defects this suite pins:
 *
 *   1. Every built entry point inlines its own copy of core/registry.ts, so a
 *      module-local Map gave `svg-scroll-draw` and `svg-scroll-draw/devtools` a
 *      registry each — devtools reported "No active instances" on a page full of
 *      them. The registry now lives on `globalThis` under a `Symbol.for` key;
 *      the module-copy tests below load registry.ts twice with
 *      `vi.resetModules()` to simulate two bundles.
 *
 *   2. `scrollDraw` — the flagship API — never registered at all, on any of its
 *      three paths, and neither did scrollAnimate's native path, scrollSnap,
 *      scrollDrawTimeline or Cinematic.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { scrollDraw, scrollAnimate, Cinematic } from '../index';
import { scrollSnap } from '../snap';
import { scrollDrawTimeline } from '../timeline';
import { _register, _unregister, _getRegistry } from '../core/registry';

const KEY = Symbol.for('svg-scroll-draw.registry');

function makePath(): SVGPathElement {
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'path') as SVGPathElement;
  el.setAttribute('stroke', 'black');
  el.setAttribute('d', 'M0 0 L100 0');
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

class FakeIO {
  constructor(public cb: IntersectionObserverCallback) {}
  observe    = vi.fn();
  unobserve  = vi.fn();
  disconnect = vi.fn();
}

function setNativeSupport(supported: boolean): void {
  vi.stubGlobal('CSS', { supports: vi.fn(() => supported) });
}

beforeEach(() => {
  vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1));
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  vi.stubGlobal('IntersectionObserver', FakeIO);
  vi.stubGlobal('ResizeObserver', class { observe = vi.fn(); disconnect = vi.fn(); });
  vi.stubGlobal('matchMedia', (q: string) => ({
    matches: false, media: q, addEventListener: vi.fn(), removeEventListener: vi.fn(),
  }));
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    top: 100, height: 500, left: 0, width: 500, right: 500, bottom: 600, x: 0, y: 100,
    toJSON: () => {},
  } as DOMRect);
  setNativeSupport(false);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  document.body.innerHTML = '';
  document.head.innerHTML = '';
});

describe('registry — shared via globalThis', () => {
  it('stores its Map on globalThis under Symbol.for("svg-scroll-draw.registry")', () => {
    const el = document.createElement('div');
    _register(el, { type: 'draw', getProgress: () => 0, getTrigger: () => ({ tStart: 0, tEnd: 1 }) });
    const shared = (globalThis as unknown as Record<symbol, Map<Element, unknown>>)[KEY];
    expect(shared).toBeInstanceOf(Map);
    expect(shared).toBe(_getRegistry());
    expect(shared.has(el)).toBe(true);
    _unregister(el);
    expect(shared.has(el)).toBe(false);
  });

  it('two separately loaded copies of the module see the same instances', async () => {
    vi.resetModules();
    const copyA = await import('../core/registry');
    vi.resetModules();
    const copyB = await import('../core/registry');
    // Genuinely two module instances, as two tsup bundles would be.
    expect(copyA).not.toBe(copyB);
    expect(copyA._register).not.toBe(copyB._register);

    const el = document.createElement('div');
    copyA._register(el, { type: 'animate', getProgress: () => 0.5, getTrigger: () => ({ tStart: 0, tEnd: 1 }) });
    expect(copyB._getRegistry().get(el)?.type).toBe('animate');
    expect(_getRegistry().has(el)).toBe(true);

    copyB._unregister(el);
    expect(copyA._getRegistry().has(el)).toBe(false);
  });

  it('a separately loaded devtools sees instances created through the main entry', async () => {
    const container = makeContainer();
    container.id = 'from-main-entry';
    vi.resetModules();
    const main = await import('../index');
    vi.resetModules();
    const { devtools } = await import('../devtools');

    const inst = main.scrollDraw(container);
    devtools.enable();
    try {
      const panel = document.querySelector('[data-ssd-devtools-panel]');
      // enable() schedules the first render; run it by hand.
      const render = (requestAnimationFrame as unknown as ReturnType<typeof vi.fn>).mock.calls.at(-1)?.[0];
      render?.(0);
      expect(panel?.textContent).toContain('draw #from-main-entry');
      expect(panel?.textContent).not.toContain('No active instances');
    } finally {
      devtools.disable();
      inst.destroy();
    }
  });

  it('touches no DOM global to find the registry', () => {
    // SSR safety is covered end to end in ssr.test.ts; this pins the mechanism.
    vi.stubGlobal('window', undefined);
    vi.stubGlobal('document', undefined);
    const fake = {} as Element;
    expect(() => {
      _register(fake, { type: 'pin', getProgress: () => 0, getTrigger: () => ({ tStart: 0, tEnd: 1 }) });
      _unregister(fake);
    }).not.toThrow();
  });
});

describe('scrollDraw registers with devtools', () => {
  it('JS path: registers on create, unregisters on destroy', () => {
    const container = makeContainer();
    const inst = scrollDraw(container);
    const entry = _getRegistry().get(container);
    expect(entry?.type).toBe('draw');
    expect(entry?.getProgress()).toBe(inst.getProgress());
    const { tStart, tEnd } = entry!.getTrigger();
    expect(Number.isFinite(tStart) && Number.isFinite(tEnd)).toBe(true);
    expect(tEnd).toBeGreaterThan(tStart);

    inst.destroy();
    expect(_getRegistry().has(container)).toBe(false);
  });

  it('progress reported to devtools tracks seek()', () => {
    const container = makeContainer();
    const inst = scrollDraw(container);
    inst.seek(0.4);
    expect(_getRegistry().get(container)?.getProgress()).toBeCloseTo(0.4);
    inst.destroy();
  });

  it('native CSS path: registers and unregisters', () => {
    setNativeSupport(true);
    const container = makeContainer();
    const inst = scrollDraw(container);
    // Sanity: this really took the native path.
    expect(document.head.querySelector('style[data-svg-scroll-draw]')).not.toBeNull();
    const entry = _getRegistry().get(container);
    expect(entry?.type).toBe('draw');
    expect(entry!.getTrigger().tEnd).toBeGreaterThan(entry!.getTrigger().tStart);
    inst.destroy();
    expect(_getRegistry().has(container)).toBe(false);
  });

  it('autoplay path: registers and unregisters', () => {
    const container = makeContainer();
    const inst = scrollDraw(container, { autoplay: true });
    expect(_getRegistry().get(container)?.type).toBe('draw');
    inst.destroy();
    expect(_getRegistry().has(container)).toBe(false);
  });

  it('inert instances (reduced motion) do not register', () => {
    vi.stubGlobal('matchMedia', (q: string) => ({
      matches: true, media: q, addEventListener: vi.fn(), removeEventListener: vi.fn(),
    }));
    const container = makeContainer();
    scrollDraw(container).destroy();
    expect(_getRegistry().has(container)).toBe(false);
  });
});

describe('other engines that used to be missing', () => {
  it('scrollAnimate native path registers and unregisters', () => {
    setNativeSupport(true);
    const el = document.createElement('div');
    document.body.appendChild(el);
    const inst = scrollAnimate(el, { props: { opacity: [0, 1] } });
    expect(document.head.querySelector('style[data-ssd-animate]')).not.toBeNull();
    expect(_getRegistry().get(el)?.type).toBe('animate');
    inst.destroy();
    expect(_getRegistry().has(el)).toBe(false);
  });

  it('scrollSnap registers on its first section', () => {
    const sections = [0, 1, 2].map(() => {
      const s = document.createElement('section');
      document.body.appendChild(s);
      return s;
    });
    const snap = scrollSnap(sections);
    const entry = _getRegistry().get(sections[0]);
    expect(entry?.type).toBe('snap');
    expect(entry?.getProgress()).toBe(0);
    snap.destroy();
    expect(_getRegistry().has(sections[0])).toBe(false);
  });

  it('scrollDrawTimeline registers and unregisters', () => {
    const container = makeContainer();
    const tl = scrollDrawTimeline(container, { tracks: [{ selector: 'path', from: 0, to: 1 }] });
    expect(_getRegistry().get(container)?.type).toBe('draw');
    tl.destroy();
    expect(_getRegistry().has(container)).toBe(false);
  });

  it('Cinematic registers its mount and unregisters on destroy', () => {
    const mount = document.createElement('div');
    document.body.appendChild(mount);
    const show = new Cinematic({ wrapper: mount }).loadStory({
      totalHeight: '300vh',
      canvas: { width: 100, height: 100 },
      scenes: [],
    } as unknown as Parameters<Cinematic['loadStory']>[0]);
    expect(_getRegistry().get(mount)?.type).toBe('draw');
    show.destroy();
    expect(_getRegistry().has(mount)).toBe(false);
  });
});
