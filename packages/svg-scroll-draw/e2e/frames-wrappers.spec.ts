import { test, expect, type Page } from '@playwright/test';
import { openFixture, collectErrors, scrollToY, read, call, table, settle } from './helpers';

/**
 * scrollFrames through every framework wrapper, from dist/, in real browsers:
 * React's and Vue's <ScrollFrames>, the Svelte action, the Solid primitive and
 * the Angular ref class. The pinned pattern (a sticky stage in a tall track,
 * measured as triggerElement), what a re-render rebuilds and what it keeps,
 * and which callback the film calls.
 *
 * The unit suite (scrollFramesWrappers.test.ts) checks what each wrapper
 * hands scrollFrames with the engine replaced by a recorder; this checks the
 * frames a browser paints. In Svelte, Solid and Angular the page writes the
 * canvas and its role and name; the components render them.
 *
 * Fixture geometry (viewport 900x800): the track starts at 1000 and is 1600
 * tall, so `top top` → `bottom bottom` is 1000 → 1800; 25 frames.
 */

type Row = {
  scrollY: number;
  frame: number;
  ready: number;
  load: number;
  a: number;
  b: number;
  role: string | null;
  label: string | null;
  className: string | null;
  trackTop: number;
};

const T_START = 1000;
const T_END = 1800;
const LAST = 24;
const frameAt = (y: number) => Math.round(Math.min(1, Math.max(0, (y - T_START) / (T_END - T_START))) * LAST);

async function allLoaded(page: Page, loads = 1): Promise<void> {
  await expect.poll(async () => (await read<Row>(page)).load, { timeout: 10_000 }).toBe(loads);
  await settle(page);
}

/** Each wrapper, by the name of its scrollFrames API (the test titles the mutations grep for). */
const WRAPPERS = {
  react: '<ScrollFrames>',
  vue: '<ScrollFrames>',
  svelte: 'scrollFramesAction',
  solid: 'useScrollFrames',
  angular: 'ScrollFramesRef',
} as const;

for (const [fw, name] of Object.entries(WRAPPERS)) {
  test.describe(`${fw} ${name}`, () => {
    test('renders the canvas with its attributes, and paints the frame a pinned scroll calls for', async ({ page }) => {
      const errors = collectErrors(page);
      await openFixture(page, `fw-frames.html?fw=${fw}`);
      const first = await read<Row>(page);
      expect(first).toMatchObject({ role: 'img', label: 'A numbered test film', className: 'film', trackTop: T_START });
      await allLoaded(page);

      const rows: { y: number; frame: number; want: number }[] = [];
      for (const y of [500, T_START, 1200, 1400, 1500, 1700, T_END, 2200]) {
        await scrollToY(page, y);
        rows.push({ y, frame: (await read<Row>(page)).frame, want: frameAt(y) });
      }
      const shown = table(rows);
      for (const r of rows) expect(r.frame, `wrong frame painted at y=${r.y}\n${shown}`).toBe(r.want);
      expect(errors).toEqual([]);
    });

    test('a re-render with equal options keeps the film, and calls the latest callback', async ({ page }) => {
      await openFixture(page, `fw-frames.html?fw=${fw}`);
      await allLoaded(page);
      expect((await read<Row>(page)).ready).toBe(1);

      // A fresh frames function, trigger and callbacks each time.
      for (let k = 0; k < 3; k++) await call(page, 'rerender');
      await page.waitForTimeout(500); // a rebuilt film would have painted again by now
      expect((await read<Row>(page)).ready, 'a re-render with equal options rebuilt the film').toBe(1);

      await call(page, 'bucket', 'b');
      const before = await read<Row>(page);
      await scrollToY(page, 1200);
      await scrollToY(page, 1400);
      const after = await read<Row>(page);
      expect(after.b, 'the film never called the new onProgress').toBeGreaterThan(0);
      expect(after.a, 'the film still called the first onProgress').toBe(before.a);
      expect(after.ready).toBe(1);
    });

    test('a frames function that gives other URLs starts a new film', async ({ page }) => {
      await openFixture(page, `fw-frames.html?fw=${fw}`);
      await allLoaded(page);
      await scrollToY(page, 1400);
      expect((await read<Row>(page)).frame).toBe(frameAt(1400));

      await call(page, 'shift', 1); // frame i is now the image of i + 1
      await allLoaded(page, 2);
      await scrollToY(page, 1400);
      expect((await read<Row>(page)).frame).toBe(frameAt(1400) + 1);
    });

    test('unmounting stops the film', async ({ page }) => {
      await openFixture(page, `fw-frames.html?fw=${fw}`);
      await allLoaded(page);
      await call(page, 'unmount');
      const before = await read<Row>(page);
      await scrollToY(page, 1200);
      await scrollToY(page, 1500);
      const after = await read<Row>(page);
      expect(after.a + after.b).toBe(before.a + before.b);
    });
  });
}
