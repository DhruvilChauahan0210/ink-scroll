/**
 * Tests for the dev-only devtools overlay.
 *
 * This is a debugging aid, so the bar it must clear is "never makes things
 * worse": mount and unmount cleanly, leave no stray DOM or listeners behind,
 * and stay inert in production builds.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { devtools } from '../devtools';
import { _register, _unregister, _getRegistry } from '../core/registry';
import type { RegistryEntry } from '../core/registry';

/** Everything devtools appended to <body>, i.e. anything but our test target. */
function overlayNodes(): Element[] {
  // The overlay/panel are the only fixed-position nodes devtools appends.
  return Array.from(document.body.children).filter(
    (el) => el !== container && el.tagName !== 'SCRIPT',
  );
}

let container: HTMLElement;
let rafSpy: ReturnType<typeof vi.fn>;

beforeEach(() => {
  document.body.innerHTML = '';
  container = document.createElement('div');
  container.id = 'target';
  document.body.appendChild(container);

  // Queue rAF instead of running it, so renderLoop doesn't recurse forever.
  rafSpy = vi.fn(() => 1);
  vi.stubGlobal('requestAnimationFrame', rafSpy);
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
});

afterEach(() => {
  devtools.disable();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

describe('devtools', () => {
  it('exposes the documented API', () => {
    expect(devtools.enable).toBeTypeOf('function');
    expect(devtools.disable).toBeTypeOf('function');
    expect(devtools.toggle).toBeTypeOf('function');
    expect(devtools.highlight).toBeTypeOf('function');
  });

  it('enable() mounts overlay UI and starts a render loop', () => {
    expect(overlayNodes()).toHaveLength(0);
    devtools.enable();
    expect(overlayNodes().length).toBeGreaterThan(0);
    expect(rafSpy).toHaveBeenCalled();
  });

  it('disable() removes everything it mounted', () => {
    devtools.enable();
    expect(overlayNodes().length).toBeGreaterThan(0);
    devtools.disable();
    expect(overlayNodes()).toHaveLength(0);
  });

  it('enable() is idempotent — no duplicate overlays', () => {
    devtools.enable();
    const first = overlayNodes().length;
    devtools.enable();
    devtools.enable();
    expect(overlayNodes()).toHaveLength(first);
  });

  it('disable() is safe to call when never enabled', () => {
    expect(() => devtools.disable()).not.toThrow();
    expect(() => devtools.disable()).not.toThrow();
  });

  it('toggle() flips mounted state both ways', () => {
    devtools.toggle();
    expect(overlayNodes().length).toBeGreaterThan(0);
    devtools.toggle();
    expect(overlayNodes()).toHaveLength(0);
  });

  it('removes its keydown listener on disable', () => {
    const add = vi.spyOn(window, 'addEventListener');
    const remove = vi.spyOn(window, 'removeEventListener');

    devtools.enable();
    const keydownAdds = add.mock.calls.filter(([type]) => type === 'keydown');
    expect(keydownAdds).toHaveLength(1);

    devtools.disable();
    const keydownRemoves = remove.mock.calls.filter(([type]) => type === 'keydown');
    expect(keydownRemoves).toHaveLength(1);
  });

  it('highlight() is inert while disabled', () => {
    expect(() => devtools.highlight('#target')).not.toThrow();
    expect(container.style.outline).toBe('');
  });

  it('highlight() ignores selectors that match nothing', () => {
    devtools.enable();
    expect(() => devtools.highlight('#does-not-exist')).not.toThrow();
  });

  it('highlight() ignores elements with no registered instance', () => {
    devtools.enable();
    // #target has no engine attached, so there is nothing to outline.
    expect(() => devtools.highlight(container)).not.toThrow();
    expect(container.style.outline).toBe('');
  });

  // IS_DEV is a module-level constant so bundlers can fold it away, which means
  // it cannot be toggled by mutating process.env at runtime. Mock the env module
  // and re-import devtools to exercise the production branch.
  it('stays inert in production builds', async () => {
    vi.resetModules();
    vi.doMock('../core/env', () => ({ IS_DEV: false, warn: () => {} }));
    const { devtools: prodDevtools } = await import('../devtools');

    prodDevtools.enable();
    expect(overlayNodes()).toHaveLength(0);

    vi.doUnmock('../core/env');
    vi.resetModules();
  });
});

/*
 * The rendering half.
 *
 * Everything above mounts and unmounts an *empty* overlay, which is why this
 * module sat at 47% lines — `renderTriggerLines()` and `renderPanel()` only do
 * anything once something is registered, and nothing was ever registered. A
 * debugging aid that draws the wrong thing is worse than one that draws nothing,
 * so the drawing is worth pinning.
 */
describe('devtools — rendering registered instances', () => {
  /** Register a fake instance directly: this is the contract the engines use. */
  function register(el: Element, over: Partial<RegistryEntry> = {}): void {
    _register(el, {
      type: 'draw',
      getProgress: () => 0.42,
      getTrigger: () => ({ tStart: 100, tEnd: 900 }),
      ...over,
    } as RegistryEntry);
  }

  /** Run one frame of the render loop by hand. */
  function tick(): void {
    const loop = rafSpy.mock.calls.at(-1)?.[0] as (() => void) | undefined;
    loop?.();
  }

  beforeEach(() => {
    for (const [el] of _getRegistry()) _unregister(el);
    vi.stubGlobal('scrollY', 0);
    vi.stubGlobal('innerHeight', 800);
  });

  afterEach(() => {
    for (const [el] of _getRegistry()) _unregister(el);
  });

  it('says so when there is nothing to show', () => {
    devtools.enable();
    tick();
    expect(document.body.textContent).toContain('No active instances');
  });

  it('draws a start and an end line for a registered instance', () => {
    register(container);
    devtools.enable();
    tick();

    const overlay = overlayNodes()[0];
    // Two trigger lines, each with its badge.
    expect(overlay.children.length).toBe(2);
    expect(overlay.textContent).toMatch(/start/i);
    expect(overlay.textContent).toMatch(/end/i);
  });

  it('positions the lines relative to the current scroll', () => {
    register(container);
    devtools.enable();
    tick();

    const topsAt = (): number[] =>
      Array.from(overlayNodes()[0].children).map((c) => parseFloat((c as HTMLElement).style.top));
    expect(topsAt()).toEqual([100, 900]);

    // Scrolled down 100px, the same absolute triggers are 100px higher on screen.
    vi.stubGlobal('scrollY', 100);
    tick();
    expect(topsAt()).toEqual([0, 800]);
  });

  it('skips instances whose trigger window is nowhere near the viewport', () => {
    register(container, { getTrigger: () => ({ tStart: 90000, tEnd: 99000 }) });
    devtools.enable();
    tick();
    expect(overlayNodes()[0].children.length).toBe(0);
  });

  it('lists each instance in the panel with its live progress', () => {
    register(container);
    devtools.enable();
    tick();

    const panel = overlayNodes().find((n) => n.textContent?.includes('%'))!;
    expect(panel, 'no panel row was rendered').toBeTruthy();
    expect(panel.textContent).toContain('draw');
    expect(panel.textContent).toContain('42');
  });

  it('re-renders rather than appending on every frame', () => {
    register(container);
    devtools.enable();
    tick();
    const after1 = overlayNodes().map((n) => n.children.length);
    tick();
    tick();
    expect(overlayNodes().map((n) => n.children.length), 'rows accumulated').toEqual(after1);
  });

  it('highlight() outlines a registered element and clears it again', () => {
    vi.useFakeTimers();
    try {
      register(container);
      devtools.enable();
      devtools.highlight('#target');

      expect(container.style.outline, 'no outline was applied').not.toBe('');
      expect(container.style.outlineOffset).toBe('2px');

      vi.advanceTimersByTime(2100);
      expect(container.style.outline, 'the outline was left on the element').toBe('');
      expect(container.style.outlineOffset).toBe('');
    } finally {
      vi.useRealTimers();
    }
  });
});
