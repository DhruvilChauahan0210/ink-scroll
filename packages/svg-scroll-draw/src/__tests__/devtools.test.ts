/**
 * Tests for the dev-only devtools overlay.
 *
 * This is a debugging aid, so the bar it must clear is "never makes things
 * worse": mount and unmount cleanly, leave no stray DOM or listeners behind,
 * and stay inert in production builds.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { devtools } from '../devtools';

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

  it('stays inert in production builds', () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      devtools.enable();
      expect(overlayNodes()).toHaveLength(0);
    } finally {
      process.env.NODE_ENV = prev;
    }
  });
});
