// @vitest-environment node
/**
 * Server-side rendering safety, in an environment with no DOM at all.
 *
 * Every other suite here runs in jsdom, where `window` and `document` exist — so
 * none of them can tell whether this library survives being imported on a server.
 * That matters more than usual: it ships wrappers for Next, Nuxt and Astro, all
 * three of which render on the server by default, and a module that touches
 * `document` while being imported takes the whole render down rather than
 * degrading.
 *
 * Two things are checked, for every entry point the package exports:
 *   1. importing it does not throw
 *   2. calling its public API returns an inert instance instead of throwing
 *
 * There is deliberately no `jsdom` anywhere in this file. `globalThis.window`
 * and `globalThis.document` are genuinely absent, which is the whole point.
 */
import { describe, it, expect } from 'vitest';

/** The methods a scroll-driven instance carries, unless it says otherwise. */
const FULL_INSTANCE = ['destroy', 'replay', 'pause', 'resume', 'seek', 'getProgress'];

/**
 * Assert an instance is present, complete and inert.
 *
 * `scrollPin` and `scrollSnap` deliberately expose narrower shapes than the
 * engines do, so the expected methods are a parameter rather than a constant —
 * a server no-op has to match whatever its own client instance offers, or the
 * cleanup a component runs on hydration would throw.
 */
function expectInertInstance(
  instance: unknown,
  label: string,
  methods: string[] = FULL_INSTANCE,
): void {
  const i = instance as Record<string, unknown>;
  expect(i, `${label} returned nothing`).toBeTruthy();
  for (const method of methods) {
    expect(typeof i[method], `${label}.${method} is missing`).toBe('function');
  }
  // Calling them must be safe: a component's cleanup runs on the client after a
  // server render, and it does not know which one it got.
  expect(() => {
    for (const method of methods) (i[method] as (n?: number) => void)(0.5);
  }, `${label} threw while being torn down`).not.toThrow();
}

describe('SSR — no window, no document', () => {
  it('the environment really has no DOM', () => {
    expect(typeof window, 'this test is running in jsdom and proves nothing').toBe('undefined');
    expect(typeof document).toBe('undefined');
  });

  it('every entry point can be imported', async () => {
    const entries = [
      '../index',
      '../react',
      '../vue',
      '../solid',
      '../svelte',
      '../angular',
      '../astro',
      '../nuxt',
      '../group',
      '../timeline',
      '../cinematic',
      '../web-component',
      '../pin',
      '../snap',
      '../text',
      '../video',
      '../counter',
      '../progress',
      '../horizontal',
      '../reveal',
      '../lenis',
      '../devtools',
    ];

    for (const entry of entries) {
      await expect(import(entry), `importing ${entry} on the server threw`).resolves.toBeTruthy();
    }
  });

  it('the core APIs return inert instances rather than throwing', async () => {
    const { scrollDraw, scrollAnimate, scrollParallax, scrollCounter } = await import('../index');

    expectInertInstance(scrollDraw('#hero'), 'scrollDraw');
    expectInertInstance(scrollAnimate('#card', { props: { opacity: [0, 1] } }), 'scrollAnimate');
    expectInertInstance(scrollParallax('#bg'), 'scrollParallax');
    expectInertInstance(scrollCounter('#count', { to: 100 }), 'scrollCounter');
  });

  it('the v2 APIs return inert instances rather than throwing', async () => {
    const { scrollPin } = await import('../pin');
    const { scrollSnap } = await import('../snap');
    const { scrollText } = await import('../text');
    const { scrollVideo } = await import('../video');
    const { scrollProgress } = await import('../progress');
    const { scrollHorizontal } = await import('../horizontal');
    const { scrollReveal } = await import('../reveal');

    // Both of these ship their own, narrower instance shape.
    expectInertInstance(scrollPin('#panel'), 'scrollPin', ['destroy', 'refresh', 'getProgress']);
    expectInertInstance(scrollSnap('.section'), 'scrollSnap', [
      'destroy',
      'snapTo',
      'getCurrentIndex',
    ]);
    expectInertInstance(scrollText('#headline'), 'scrollText');
    expectInertInstance(scrollVideo('#clip'), 'scrollVideo');
    expectInertInstance(scrollProgress('#bar'), 'scrollProgress');
    expectInertInstance(scrollHorizontal('#track'), 'scrollHorizontal', [
      ...FULL_INSTANCE,
      'refresh',
    ]);
    // scrollReveal is a fan-out with a deliberately minimal surface.
    expectInertInstance(scrollReveal('.card'), 'scrollReveal', ['destroy']);
  });

  it('the group, timeline and cinematic APIs are inert too', async () => {
    const { scrollDrawGroup, scrollDrawSequence, scrollAnimateGroup, scrollParallaxGroup } =
      await import('../group');
    const { scrollDrawTimeline } = await import('../timeline');
    const { Cinematic } = await import('../cinematic');

    expectInertInstance(scrollDrawGroup(['#a', '#b']), 'scrollDrawGroup');
    expectInertInstance(scrollDrawSequence(['#a', '#b']), 'scrollDrawSequence');
    expectInertInstance(
      scrollAnimateGroup(['#a'], { props: { opacity: [0, 1] } }),
      'scrollAnimateGroup',
    );
    expectInertInstance(scrollParallaxGroup(['#a']), 'scrollParallaxGroup');
    expectInertInstance(
      scrollDrawTimeline('#diagram', { tracks: [{ selector: '.p', from: 0, to: 1 }] }),
      'scrollDrawTimeline',
    );

    // Cinematic has its own smaller instance shape.
    const show = new Cinematic({ wrapper: '#app' }).loadStory({
      version: 1,
      totalHeight: '400vh',
      canvas: { width: 100, height: 100 },
      scenes: [],
    });
    expect(() => show.destroy()).not.toThrow();
    expect(show.getProgress()).toBe(0);
  });

  /**
   * Astro is the one that made this necessary. Its init functions default their
   * root to `document`, evaluated at call time — so calling one from component
   * frontmatter (which runs on the server) threw `ReferenceError: document is not
   * defined` rather than doing nothing.
   */
  it('the Astro auto-init functions no-op on the server', async () => {
    const { initScrollDraw, initScrollAnimate, initScrollCounter, initScrollText, initAll } =
      await import('../astro');

    expect(initScrollDraw()).toEqual([]);
    expect(initScrollAnimate()).toEqual([]);
    expect(initScrollCounter()).toEqual([]);
    expect(initScrollText()).toEqual([]);
    expect(initAll()).toEqual({ draw: [], animate: [], counter: [], text: [] });
  });

  it('the Angular ref classes are safe to construct and tear down', async () => {
    const { ScrollDrawRef, ScrollAnimateRef, ScrollCounterRef, ScrollVideoRef, ScrollTextRef } =
      await import('../angular');

    for (const Ref of [ScrollDrawRef, ScrollAnimateRef, ScrollCounterRef, ScrollVideoRef, ScrollTextRef]) {
      const ref = new Ref();
      expect(() => {
        ref.replay();
        ref.pause();
        ref.resume();
        ref.seek(0.5);
        ref.destroy();
      }, `${Ref.name} threw without a DOM`).not.toThrow();
      expect(ref.getProgress()).toBe(0);
    }
  });

  it('the web component entry registers nothing when there is no customElements', async () => {
    // Importing it is the whole API — it defines the element as a side effect,
    // and that has to be conditional or a server import throws.
    await expect(import('../web-component')).resolves.toBeTruthy();
    expect(typeof (globalThis as { customElements?: unknown }).customElements).toBe('undefined');
  });

  it('devtools stays inert without a DOM', async () => {
    const { devtools } = await import('../devtools');
    expect(() => {
      devtools.disable();
      devtools.highlight('#thing');
    }).not.toThrow();
  });
});
