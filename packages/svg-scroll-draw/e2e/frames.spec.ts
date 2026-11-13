import { test, expect, type Page } from '@playwright/test';
import { openFixture, collectErrors, scrollToY, read, call, table, settle } from './helpers';

/**
 * `scrollFrames` in real browsers: real image loads, a real decoder and a real
 * canvas, read back pixel by pixel.
 *
 * jsdom has no decoder and no 2D context, so the unit suite can only check
 * which image the engine asked the canvas to draw. Here every frame is a PNG
 * serve.mjs draws on request, its red channel the frame index × 10, so the
 * pixel at the centre of the canvas names the frame the browser painted.
 *
 * Fixture geometry (viewport 900x800): #film at document top 1200, 320×400,
 * 25 frames. The default window `top top` → `bottom top` is 1200 → 1600.
 */

type Row = {
  scrollY: number;
  frame: number;
  width: number;
  height: number;
  progress: number;
  ready: number;
  load: number;
  complete: number;
  progressCalls: number;
  lastFrame: number;
  warnings: number;
  warned: string;
};

type Px = [number, number, number, number];

const T_START = 1200;
const T_END = 1600;
const LAST = 24;
const frameAt = (y: number) => Math.round(Math.min(1, Math.max(0, (y - T_START) / (T_END - T_START))) * LAST);

/** Every generated-frame request the page makes, in order, by index. */
function frameRequests(page: Page): { asked: number[]; inFlight: () => number; peak: () => number } {
  const asked: number[] = [];
  let open = 0;
  let peak = 0;
  const isFrame = (u: string) => u.includes('/e2e/gen/frame.png');
  page.on('request', (r) => {
    if (!isFrame(r.url())) return;
    asked.push(Number(new URL(r.url()).searchParams.get('i')));
    peak = Math.max(peak, ++open);
  });
  const done = (r: { url: () => string }) => { if (isFrame(r.url())) open--; };
  page.on('requestfinished', done);
  page.on('requestfailed', done);
  return { asked, inFlight: () => open, peak: () => peak };
}

/** Wait until every frame has loaded (onLoad), so a pixel read is not a race. */
async function allLoaded(page: Page): Promise<void> {
  await expect.poll(async () => (await read<Row>(page)).load, { timeout: 10_000 }).toBe(1);
  await settle(page);
}

test.describe('scrollFrames', () => {
  test('the canvas paints the frame the scroll calls for', async ({ page }) => {
    const errors = collectErrors(page);
    await openFixture(page, 'frames.html');
    expect(await call(page, 'geometry')).toMatchObject({ top: T_START, cssWidth: 320, cssHeight: 400, viewport: 800 });
    await allLoaded(page);

    const rows: { y: number; frame: number; want: number }[] = [];
    for (const y of [0, T_START, 1250, 1300, 1400, 1450, 1550, T_END]) {
      await scrollToY(page, y);
      rows.push({ y, frame: (await read<Row>(page)).frame, want: frameAt(y) });
    }
    const shown = table(rows);
    for (const r of rows) expect(r.frame, `wrong frame painted at y=${r.y}\n${shown}`).toBe(r.want);
    expect(errors).toEqual([]);
  });

  test('loads frame 0, then the last, then coarse to fine, six at a time', async ({ page }) => {
    const net = frameRequests(page);
    await page.goto('/e2e/fixtures/frames.html?delay=150');
    await page.waitForFunction(() => (window as unknown as { __ready?: boolean }).__ready === true);
    await allLoaded(page);
    expect(net.asked.slice(0, 3), net.asked.join(' ')).toEqual([0, LAST, 12]);
    expect(new Set(net.asked.slice(0, 6)), net.asked.join(' ')).toEqual(new Set([0, 24, 12, 6, 18, 3]));
    expect([...net.asked].sort((a, b) => a - b), 'every frame once').toEqual(Array.from({ length: 25 }, (_, i) => i));
    expect(net.peak(), 'more than `concurrency` images in flight').toBeLessThanOrEqual(6);
    expect(net.peak(), 'the loads never overlapped').toBeGreaterThan(1);
  });

  test('onReady fires once, when the first frame is on the canvas', async ({ page }) => {
    await openFixture(page, 'frames.html');
    await expect.poll(async () => (await read<Row>(page)).ready, { timeout: 5000 }).toBe(1);
    const row = await read<Row>(page);
    expect(row.frame, 'onReady before anything was drawn').toBe(0);
    await allLoaded(page);
    expect((await read<Row>(page)).ready).toBe(1);
  });

  test('a jump past the whole window paints the last frame and completes', async ({ page }) => {
    await openFixture(page, 'frames.html');
    await allLoaded(page);
    expect((await read<Row>(page)).frame).toBe(0);
    // One instant jump, never on screen in between (a reload's restored
    // scroll, an anchor link). The End key below scrolls smoothly in Chromium,
    // so it passes through the window and proves less.
    await page.evaluate(() => window.scrollTo(0, 3000));
    await expect.poll(async () => (await read<Row>(page)).frame, { timeout: 5000 }).toBe(LAST);
    const row = await read<Row>(page);
    expect(row.progress).toBe(1);
    expect(row.complete).toBe(1);

    await scrollToY(page, 0);
    expect((await read<Row>(page)).frame).toBe(0);
    await page.keyboard.press('End');
    await expect.poll(async () => (await read<Row>(page)).frame, { timeout: 5000 }).toBe(LAST);
  });

  test('until the wanted frame arrives, the nearest loaded one shows', async ({ page }) => {
    // Frame 12 is held 1.5s; the rest arrive at once.
    await page.goto('/e2e/fixtures/frames.html?slow=12', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => (window as unknown as { __ready?: boolean }).__ready === true);
    await page.evaluate(() => window.scrollTo(0, 1400)); // frame 12
    await expect.poll(async () => (await read<Row>(page)).frame, { timeout: 1200 }).toBe(11);
    await expect.poll(async () => (await read<Row>(page)).frame, { timeout: 5000 }).toBe(12);
  });

  test('draws only when the frame changes, not on every frame at rest', async ({ page }) => {
    await openFixture(page, 'frames.html');
    await allLoaded(page);
    await scrollToY(page, 1400);
    const draws = await page.evaluate(async () => {
      const proto = CanvasRenderingContext2D.prototype;
      const real = proto.drawImage;
      let n = 0;
      proto.drawImage = function (...a: Parameters<typeof real>) { n++; return real.apply(this, a); } as typeof real;
      const frames = (k: number) => new Promise<void>((r) => {
        const step = () => (k-- > 0 ? requestAnimationFrame(step) : r());
        step();
      });
      // At rest; then a scroll inside frame 12 (1392 → 1408 rounds to it).
      await frames(10);
      const atRest = n;
      window.scrollTo(0, 1405);
      await frames(5);
      const sameFrame = n;
      window.scrollTo(0, 1450);
      await frames(5);
      proto.drawImage = real;
      return { atRest, sameFrame, moved: n };
    });
    expect(draws).toEqual({ atRest: 0, sameFrame: 0, moved: 1 });
  });

  test('a frame that fails is skipped for its nearest neighbour, with a warning', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/e2e/fixtures/frames.html?fail=12');
    await page.waitForFunction(() => (window as unknown as { __ready?: boolean }).__ready === true);
    await allLoaded(page);
    await scrollToY(page, 1400); // frame 12
    const row = await read<Row>(page);
    expect([11, 13]).toContain(row.frame);
    expect(row.warnings, row.warned).toBe(1);
    expect(row.warned).toContain('i=12');
    expect(errors).toEqual([]);
  });

  test('destroy() mid-load stops the loads and draws nothing', async ({ page }) => {
    const errors = collectErrors(page);
    const net = frameRequests(page);
    // Not to `load`: images started before it delay it, so it would wait for them.
    await page.goto('/e2e/fixtures/frames.html?delay=400', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => (window as unknown as { __ready?: boolean }).__ready === true);
    await call(page, 'destroyFilm');
    const asked = net.asked.length;
    await page.waitForTimeout(900);
    const row = await read<Row>(page);
    expect(row.ready, 'drew after destroy()').toBe(0);
    expect(row.frame).toBe(-1);
    expect(row.load).toBe(0);
    expect(net.asked.length, 'started a load after destroy()').toBe(asked);
    expect(errors).toEqual([]);
  });

  test('reduced motion: requests only the last frame and shows it', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const net = frameRequests(page);
    await openFixture(page, 'frames.html');
    await allLoaded(page);
    expect(net.asked).toEqual([LAST]);
    for (const y of [0, T_START, 1400, T_END]) {
      await scrollToY(page, y);
      expect((await read<Row>(page)).frame, `at y=${y}`).toBe(LAST);
    }
    await page.waitForTimeout(200);
    expect(net.asked).toEqual([LAST]);
  });

  test('reduced motion turned on mid-scrub stops on the last frame', async ({ page }) => {
    await openFixture(page, 'frames.html');
    await allLoaded(page);
    await scrollToY(page, 1300);
    expect((await read<Row>(page)).frame).toBe(6);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect.poll(async () => (await read<Row>(page)).frame, { timeout: 5000 }).toBe(LAST);
    for (const y of [T_START, 1400]) {
      await scrollToY(page, y);
      expect((await read<Row>(page)).frame, `at y=${y}`).toBe(LAST);
    }
  });

  test('cover fills the box, cropping the sides, centred', async ({ page }) => {
    await openFixture(page, 'frames.html');
    const g = await call<Record<string, Px>>(page, 'fit', 'cover');
    const want = [120, 135, 64, 255];
    for (const k of ['centre', 'top', 'left', 'aboveEdge', 'leftOfBand']) {
      expect(g[k].map((v, i) => Math.abs(v - want[i]) <= 3), `${k}: ${g[k]}`).toEqual([true, true, true, true]);
    }
  });

  test('contain fits inside the box, letterboxed, centred', async ({ page }) => {
    await openFixture(page, 'frames.html');
    const g = await call<Record<string, Px>>(page, 'fit', 'contain');
    // 160×90 in 320×400: 320×180, from y 110 to 290; the 20px bands are 40px.
    expect(g.top[3], 'above the picture is empty').toBe(0);
    expect(g.aboveEdge[3], 'the picture starts at y=110, centred').toBe(0);
    expect(g.belowEdge[3]).toBe(255);
    expect(g.left.slice(0, 3), 'the black band shows').toEqual([0, 0, 0]);
    expect(g.leftOfBand.slice(0, 3)).toEqual([0, 0, 0]);
    expect(Math.round(g.rightOfBand[0] / 10)).toBe(12);
    expect(Math.round(g.centre[0] / 10)).toBe(12);
  });

  test('methods called after destroy() leave it stopped', async ({ page }) => {
    await openFixture(page, 'frames.html');
    await allLoaded(page);
    await scrollToY(page, 1400); // inside the window, where the frames run
    expect(await call<number>(page, 'afterDestroy'), 'onProgress calls after destroy()').toBe(0);
  });

  test('a canvas sized by its attributes keeps its size: unstyled', async ({ page }) => {
    await openFixture(page, 'frames.html');
    const dpr = Math.min(2, (await call<{ dpr: number }>(page, 'geometry')).dpr);
    const { early, late } = await call<{ early: Record<string, number>; late: Record<string, number> }>(page, 'attrSized', 'unstyled');
    expect(late, 'the canvas grew').toEqual(early);
    // The default 300×150 box, held; the store at the ratio.
    expect(late).toEqual({ width: 300 * dpr, height: 150 * dpr, cssWidth: 300, cssHeight: 150 });
  });

  test('a canvas sized by its attributes keeps its size: width 100%, auto height', async ({ page }) => {
    await openFixture(page, 'frames.html');
    const { early, late } = await call<{ early: Record<string, number>; late: Record<string, number> }>(page, 'attrSized', 'portrait');
    expect(late, 'the canvas crept').toEqual(early);
    expect(late.cssWidth).toBe(333);
    expect(Math.abs(late.cssHeight - 1000), `${late.cssHeight}`).toBeLessThanOrEqual(1);
  });

  test('a resize of the box resizes the backing store and redraws', async ({ page }) => {
    await openFixture(page, 'frames.html');
    await allLoaded(page);
    await scrollToY(page, 1400);
    // Desktop Safari is a 2x device; the others 1x.
    const dpr = Math.min(2, (await call<{ dpr: number }>(page, 'geometry')).dpr);
    const after = await call<{ width: number; height: number; frame: number }>(page, 'setWidth', 200);
    expect(after).toEqual({ width: 200 * dpr, height: 400 * dpr, frame: 12 });
  });
});

test.describe('scrollFrames on a 2x screen', () => {
  test.use({ deviceScaleFactor: 2 });

  test('an unstyled canvas at 2x keeps its size', async ({ page }) => {
    await openFixture(page, 'frames.html');
    const { early, late } = await call<{ early: Record<string, number>; late: Record<string, number> }>(page, 'attrSized', 'unstyled');
    expect(late, 'the canvas grew').toEqual(early);
    expect(late).toEqual({ width: 600, height: 300, cssWidth: 300, cssHeight: 150 });
  });

  test('the backing store is the CSS box × 2', async ({ page }) => {
    await openFixture(page, 'frames.html');
    expect((await call<{ dpr: number }>(page, 'geometry')).dpr).toBe(2);
    const row = await read<Row>(page);
    expect([row.width, row.height]).toEqual([640, 800]);
    const g = await call<Record<string, Px>>(page, 'fit', 'contain');
    expect(g.aboveEdge[3]).toBe(0);
    expect(g.belowEdge[3]).toBe(255);
  });
});

test.describe('scrollFrames on a 3x screen', () => {
  test.use({ deviceScaleFactor: 3 });

  test('the ratio is capped at 2', async ({ page }) => {
    await openFixture(page, 'frames.html');
    expect((await call<{ dpr: number }>(page, 'geometry')).dpr).toBe(3);
    const row = await read<Row>(page);
    expect([row.width, row.height]).toEqual([640, 800]);
  });
});
