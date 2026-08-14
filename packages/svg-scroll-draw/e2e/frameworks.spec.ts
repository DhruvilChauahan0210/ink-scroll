import { test, expect } from '@playwright/test';
import { openFixture, collectErrors, scrollToY, read, call } from './helpers';

/**
 * The framework wrappers, mounted for real — Phase 2 Priority 2.
 *
 * About a thousand lines across eight adapters, every one of them excluded from
 * coverage because jsdom cannot mount them, and every one of them the code most
 * users actually touch. "Thin adapter" was an assumption nobody had tested.
 *
 * They are all the same shape — create an engine on mount, destroy it on
 * unmount — so they are held to one contract by one parameterised spec rather
 * than eight bespoke ones. A wrapper that quietly diverges shows up as a
 * difference between the rows, not as a missing test.
 *
 * What each fixture must produce (`fixtures/_fw.mjs` documents the harness):
 *   `.fw-draw`  top 1000, 300 tall → trigger window 200 → 1300
 *   `.fw-anim`  top 1300, 200 tall → trigger window 500 → 1500
 *
 * React, Vue, Solid and Nuxt need their framework in the page, so those fixtures
 * load a bundle built by `e2e/build-fixtures.mjs` from `dist/` — the published
 * output, not `src/`. The other four need nothing: Svelte's wrappers are plain
 * action functions, Angular's are framework-agnostic classes, Astro's are DOM
 * scanners, and the web component is a custom element.
 */

type Row = {
  scrollY: number;
  mounted: boolean;
  drawn: number | null;
  opacity: number | null;
  liveObservers: number;
};

type Geometry = {
  viewportHeight: number;
  drawTop: number | null;
  drawHeight: number | null;
  animTop: number | null;
  animHeight: number | null;
  pathLength: number | null;
};

type Contract = { reactiveOptions: boolean; hasAnim: boolean };

const DRAW_START = 200;
const DRAW_END = 1300;
const ANIM_START = 500;
const ANIM_END = 1500;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const drawAt = (y: number) => clamp01((y - DRAW_START) / (DRAW_END - DRAW_START));
const animAt = (y: number) => clamp01((y - ANIM_START) / (ANIM_END - ANIM_START));

const WRAPPERS = [
  { name: 'react', fixture: 'fw-react.html' },
  { name: 'vue', fixture: 'fw-vue.html' },
  { name: 'solid', fixture: 'fw-solid.html' },
  { name: 'svelte', fixture: 'fw-svelte.html' },
  { name: 'angular', fixture: 'fw-angular.html' },
  { name: 'astro', fixture: 'fw-astro.html' },
  { name: 'nuxt', fixture: 'fw-nuxt.html' },
  { name: 'web-component', fixture: 'fw-webcomponent.html' },
];

for (const wrapper of WRAPPERS) {
  test.describe(`${wrapper.name} wrapper`, () => {
    test('mounts without error, in the geometry the spec assumes', async ({ page }) => {
      const errors = collectErrors(page);
      await openFixture(page, wrapper.fixture);
      expect(errors).toEqual([]);

      const row = await read<Row>(page);
      expect(row.mounted, 'the wrapper rendered nothing').toBe(true);

      const geo = await call<Geometry>(page, 'geometry');
      const contract = await call<Contract>(page, 'contract');
      expect(geo.viewportHeight).toBe(800);
      expect(geo.drawTop, 'the draw is not where the trigger arithmetic expects').toBe(1000);
      expect(geo.drawHeight).toBe(300);
      // A real measured path: the unit suites all run against a stub.
      expect(geo.pathLength).toBeGreaterThan(100);

      if (contract.hasAnim) {
        expect(geo.animTop).toBe(1300);
        expect(geo.animHeight).toBe(200);
      }
    });

    test('the mounted engine tracks scroll', async ({ page }) => {
      await openFixture(page, wrapper.fixture);
      const contract = await call<Contract>(page, 'contract');

      for (const y of [200, 500, 750, 1000, 1300]) {
        await scrollToY(page, y);
        const row = await read<Row>(page);
        expect(row.drawn, `draw at y=${y}`).toBeCloseTo(drawAt(y), 1);
        if (contract.hasAnim) {
          expect(row.opacity, `fade at y=${y}`).toBeCloseTo(animAt(y), 1);
        }
      }
    });

    /**
     * The failure mode that matters for an adapter, and the one nothing here
     * could previously see: the element goes away, the engine does not. A leaked
     * rAF loop is invisible — the page looks correct while burning a frame's work
     * for every component ever mounted, on every route change, for the life of
     * the tab.
     */
    test('unmounting stops everything it started', async ({ page }) => {
      await openFixture(page, wrapper.fixture);

      await scrollToY(page, 750);
      const before = await read<Row>(page);
      expect(before.liveObservers, 'nothing was observing to begin with').toBeGreaterThan(0);

      /*
       * The positive control, without which the assertion below passes for a
       * wrapper that never started anything. The JS engine keeps its loop alive
       * even when the scroll has not moved — it skips the work, not the frame —
       * so a mounted, visible instance ticks every frame.
       */
      const mountedTicks = await call<number>(page, 'ticksOver', 5);
      expect(
        mountedTicks,
        'nothing was animating before unmount, so this test proves nothing',
      ).toBeGreaterThan(0);

      await call(page, 'unmount');
      const after = await read<Row>(page);

      expect(after.mounted, 'the element survived unmount').toBe(false);
      expect(after.liveObservers, 'an IntersectionObserver outlived the component').toBe(0);

      // And no frame loop is still running. Sampled over several frames with the
      // untouched rAF, so the measurement cannot count itself.
      const ticks = await call<number>(page, 'ticksOver', 5);
      expect(ticks, `${ticks} frames of animation work after unmount`).toBe(0);
    });

    test('mounting again after an unmount works', async ({ page }) => {
      await openFixture(page, wrapper.fixture);
      await call(page, 'unmount');
      await call(page, 'mount');

      // A route change is not a page load: the second mount has to behave like
      // the first, including re-measuring its own position.
      await scrollToY(page, 750);
      const row = await read<Row>(page);
      expect(row.mounted, 'the second mount rendered nothing').toBe(true);
      expect(row.drawn, 'the re-mounted engine is not tracking scroll').toBeCloseTo(
        drawAt(750),
        1,
      );
    });

    /**
     * Whether changing an option reaches the running engine, checked against
     * what the wrapper claims rather than against one framework's habits.
     *
     * Only the Svelte actions re-create on a parameter change — Svelte calls
     * `update()` for you. The component and hook wrappers read their options
     * once on mount (`useEffect(…, [])`, `onMounted`, `onMount`), so changing a
     * prop afterwards does nothing at all. That is a real limitation, and pinning
     * it here means it cannot change by accident in either direction.
     */
    test('option changes reach the engine only where the wrapper says they do', async ({
      page,
    }) => {
      await openFixture(page, wrapper.fixture);
      const contract = await call<Contract>(page, 'contract');

      await scrollToY(page, 750); // half-way through the draw window
      const before = await read<Row>(page);
      expect(before.drawn).toBeCloseTo(0.5, 1);

      // Doubling the speed doubles progress at the same offset — if it lands.
      await call(page, 'setSpeed', 2);
      await scrollToY(page, 750);
      const after = await read<Row>(page);

      if (contract.reactiveOptions) {
        expect(
          after.drawn,
          'the wrapper claims option changes are live, but the engine did not change',
        ).toBeCloseTo(1, 1);
      } else {
        expect(
          after.drawn,
          'the wrapper claims options are read once, but the engine picked up a change',
        ).toBeCloseTo(0.5, 1);
      }
    });
  });
}

test.describe('nuxt plugin', () => {
  /**
   * Nuxt's Option B is `nuxtApp.vueApp.use(createScrollDrawPlugin())`, and the
   * only thing global registration buys is using the components by name without
   * importing them. The fixture's template does exactly that with no local
   * `components` option — so if the plugin had not registered them, Vue would
   * resolve the tags to nothing and the fixture would render empty elements.
   */
  test('registers the components globally, so a template can use them by name', async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await openFixture(page, 'fw-nuxt.html');

    // Vue logs unresolved components as a warning rather than an error, so the
    // proof is that the components rendered their own markup at all.
    expect(errors).toEqual([]);
    const geo = await call<Geometry>(page, 'geometry');
    expect(geo.drawTop, '<ScrollDraw> did not resolve from the plugin').toBe(1000);
    expect(geo.animTop, '<ScrollAnimate> did not resolve from the plugin').toBe(1300);
    expect(geo.pathLength).toBeGreaterThan(100);
  });
});
