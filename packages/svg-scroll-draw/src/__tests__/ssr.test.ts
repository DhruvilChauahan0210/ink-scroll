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
      '../frames',
      '../counter',
      '../progress',
      '../horizontal',
      '../reveal',
      '../lenis',
      '../devtools',
      '../aos',
      '../scrollreveal',
      '../vivus',
      '../aos/react',
      '../scrollreveal/react',
      '../vivus/react',
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
    const { scrollFrames } = await import('../frames');
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
    expectInertInstance(scrollFrames('#film', { frames: (i) => `/f/${i}.png`, count: 60 }), 'scrollFrames');
    expectInertInstance(scrollProgress('#bar'), 'scrollProgress');
    expectInertInstance(scrollHorizontal('#track'), 'scrollHorizontal', [
      ...FULL_INSTANCE,
      'refresh',
    ]);
    // scrollReveal is a fan-out with a deliberately minimal surface.
    expectInertInstance(scrollReveal('.card'), 'scrollReveal', ['destroy']);
  });

  /*
   * 2.26.0: a CSS easing string is parsed with no DOM involved (no CSS.supports,
   * no getComputedStyle), so a server render that passes one is as inert as
   * any other, and the curve itself is already usable on the server.
   */
  it('a CSS easing string resolves without a DOM, and the engines given one stay inert', async () => {
    const { resolveEasing, cssEasing } = await import('../core/easing');
    const { cssTimingFor } = await import('../core/css-easing');
    expect(resolveEasing('cubic-bezier(.2,.8,.2,1)')(0.5)).toBeGreaterThan(0.9);
    expect(cssEasing('ease')?.[1]).toBe('cubic-bezier(0.25,0.1,0.25,1)');
    expect(cssTimingFor('cubic-bezier(.2,.8,.2,1)')).toBe('cubic-bezier(0.2,0.8,0.2,1)');

    const easing = 'cubic-bezier(.2,.8,.2,1)' as const;
    const { scrollDraw, scrollAnimate, scrollCounter } = await import('../index');
    const { scrollText } = await import('../text');
    const { scrollVideo } = await import('../video');
    const { scrollFrames } = await import('../frames');
    const { scrollProgress } = await import('../progress');
    const { scrollSnap } = await import('../snap');
    expectInertInstance(scrollDraw('#hero', { easing }), 'scrollDraw');
    expectInertInstance(scrollAnimate('#card', { props: { opacity: [0, 1] }, easing }), 'scrollAnimate');
    expectInertInstance(scrollCounter('#count', { to: 100, easing: 'ease' }), 'scrollCounter');
    expectInertInstance(scrollText('#headline', { easing }), 'scrollText');
    expectInertInstance(scrollVideo('#clip', { easing }), 'scrollVideo');
    expectInertInstance(scrollFrames('#film', { frames: (i) => `/f/${i}.png`, count: 60, easing }), 'scrollFrames');
    expectInertInstance(scrollProgress('#bar', { easing }), 'scrollProgress');
    expectInertInstance(scrollSnap('.section', { easing }), 'scrollSnap', ['destroy', 'snapTo', 'getCurrentIndex']);
  });

  /*
   * <ScrollFrames> calls the frames function while rendering (its key reads the
   * URLs), so the render itself has to stay off the DOM, not only the effect.
   */
  it('<ScrollFrames> renders to a string in React and Vue', async () => {
    const { createElement } = await import('react');
    const { renderToString } = await import('react-dom/server');
    const { ScrollFrames } = await import('../react');
    const html = renderToString(
      createElement(ScrollFrames, { frames: (i: number) => `/f/${i}.jpg`, count: 3, className: 'film', 'aria-label': 'A film' }),
    );
    const attrs = (s: string) => s.match(/[\w-]+="[^"]*"/g)!.sort();
    const want = ['aria-label="A film"', 'class="film"', 'role="img"'];
    expect(html.startsWith('<canvas ')).toBe(true);
    expect(attrs(html)).toEqual(want);

    const { createSSRApp, h } = await import('vue');
    const { renderToString: vueToString } = await import('vue/server-renderer');
    const vue = await import('../vue');
    const out = await vueToString(
      createSSRApp({ render: () => h(vue.ScrollFrames, { frames: (i: number) => `/f/${i}.jpg`, count: 3, class: 'film', 'aria-label': 'A film' }) }),
    );
    expect(out.startsWith('<canvas ')).toBe(true);
    expect(attrs(out)).toEqual(want);
  });

  it('the ScrollReveal drop-in returns an inert instance on the server', async () => {
    const ScrollReveal = (await import('../scrollreveal')).default;
    const sr = ScrollReveal({ distance: '20px' });
    expect(sr.noop).toBe(true);
    expect(() => { sr.reveal('.box'); sr.sync(); sr.clean('.box'); sr.destroy(); }).not.toThrow();
    expect(ScrollReveal.isSupported()).toBe(false);
  });

  it('the AOS drop-in is a no-op on the server', async () => {
    const AOS = (await import('../aos')).default;
    expect(AOS.init({ once: true })).toEqual([]);
    expect(() => { AOS.refresh(); AOS.refreshHard(); AOS.destroy(); }).not.toThrow();
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
    const { ScrollDrawRef, ScrollAnimateRef, ScrollCounterRef, ScrollVideoRef, ScrollFramesRef, ScrollTextRef } =
      await import('../angular');

    for (const Ref of [ScrollDrawRef, ScrollAnimateRef, ScrollCounterRef, ScrollVideoRef, ScrollFramesRef, ScrollTextRef]) {
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

  /*
   * Angular Universal runs ngAfterViewInit on the server, so ScrollFramesRef.init
   * gets a server-side canvas there; a selector triggerElement must not reach
   * for a `document` that is not there. Solid's server build never runs the
   * effect, and Svelte never runs an action on the server, but each hook has to
   * be callable while a component renders to a string.
   */
  it('the Svelte, Solid and Angular scrollFrames wrappers stay inert without a DOM', async () => {
    const { ScrollFramesRef } = await import('../angular');
    const solid = await import('../solid');
    const svelte = await import('../svelte');
    const canvas = { tagName: 'CANVAS', getAttribute: (n: string) => (n === 'aria-label' ? 'A film' : null) } as never;
    const options = { frames: (i: number) => `/f/${i}.jpg`, count: 3, triggerElement: '#track' };

    const film = new ScrollFramesRef();
    expect(() => film.init(canvas, options).update({ ...options, count: 4 }).destroy()).not.toThrow();
    expect(film.getProgress()).toBe(0);
    expect(typeof solid.useScrollFrames(options)).toBe('function');
    expect(solid.createScrollFrames(() => options).getInstance()).toBeUndefined();
    expect(svelte.createScrollFrames(options).getInstance()).toBeNull();
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
