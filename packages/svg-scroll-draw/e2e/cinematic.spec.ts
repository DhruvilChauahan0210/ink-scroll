import { test, expect } from '@playwright/test';
import { openFixture, collectErrors, scrollToY, read, call, table } from './helpers';

/**
 * `Cinematic` in a real browser: a story JSON in, a scroll-scrubbed show out.
 *
 * This is the Studio's runtime, so the story file is the contract — and the parts
 * of it that matter most are the parts jsdom cannot evaluate. `loadStory` builds
 * a `position: sticky` stage and derives progress from
 * `-wrapper.getBoundingClientRect().top / (wrapper.offsetHeight - innerHeight)`.
 * In jsdom that is `-0 / (0 - 768)`: every scene reads as progress 0 forever, and
 * `totalHeight: '400vh'` resolves to no height at all.
 *
 * Fixture (viewport 900x800): `#app` at document top with `totalHeight: 400vh`
 * → 3200 tall, so the scroll room is 3200 - 800 = 2400 and global progress is
 * simply `scrollY / 2400`. Scene windows are 0–40%, 60–100% and 0–100%, with a
 * fade over 10–50%.
 */

type Row = {
  scrollY: number;
  early: number;
  late: number;
  measured: number;
  photo: number;
  progress: number;
  tiny: number;
  tinyProgress: number;
};

const SCROLLABLE = 2400;
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const globalAt = (y: number) => clamp01(y / SCROLLABLE);
const localOf = (g: number, from: number, to: number) => clamp01((g - from) / (to - from));
/** The fade easing is fixed at ease-in-out by the runtime; stories cannot set it. */
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);

test.describe('Cinematic', () => {
  test('builds the whole scroll structure out of the story', async ({ page }) => {
    const errors = collectErrors(page);
    await openFixture(page, 'cinematic.html');
    expect(errors).toEqual([]);

    const s = await call<{
      mountPosition: string;
      mountHeight: number;
      stageExists: boolean;
      stagePosition: string;
      stageHeight: number;
      stageOverflow: string;
      viewBox: string;
      pathIds: string[];
      strokeWidths: string[];
      dasharrays: string[];
      measuredLength: number;
      photoIsImage: string;
      photoAlt: string;
    }>(page, 'structure');

    // `totalHeight: '400vh'` has to become real height, or there is nothing to
    // scroll through — the exact thing a zero-height jsdom body cannot detect.
    expect(s.mountHeight).toBe(3200);
    expect(s.mountPosition).toBe('relative');

    expect(s.stageExists).toBe(true);
    expect(s.stagePosition).toBe('sticky');
    expect(s.stageHeight, 'the stage should be exactly one viewport tall').toBe(800);
    expect(s.stageOverflow).toBe('hidden');

    expect(s.viewBox, 'the canvas dimensions must reach the SVG').toBe('0 0 200 100');
    expect(s.pathIds).toEqual(['p-early', 'p-late', 'p-measured']);
    expect(s.strokeWidths).toEqual(['3', '5', '2']);

    // Pre-measured lengths come from the story; a zero length means measure it.
    // Compared as numbers: the inline value is unitless but engines echo it back
    // differently, and the number is the part that matters.
    expect(s.dasharrays.slice(0, 2).map(parseFloat)).toEqual([180, 180]);
    expect(parseFloat(s.dasharrays[2]), 'the runtime did not measure the path itself').toBeCloseTo(
      s.measuredLength,
      0,
    );

    // The background layer is a real <img> with an empty alt: decoration, not
    // content, so assistive technology should skip it.
    expect(s.photoIsImage).toBe('IMG');
    expect(s.photoAlt).toBe('');
  });

  test('every animation runs on its own window from the story', async ({ page }) => {
    await openFixture(page, 'cinematic.html');

    const offsets = [0, 480, 960, 1200, 1440, 1920, 2400];
    const rows: Row[] = [];
    for (const y of offsets) {
      await scrollToY(page, y);
      rows.push(await read<Row>(page));
    }

    const shown = table(
      rows.map((r) => ({
        y: r.scrollY,
        g: globalAt(r.scrollY),
        early: r.early,
        late: r.late,
        measured: r.measured,
        photo: r.photo,
      })),
    );

    for (const r of rows) {
      const g = globalAt(r.scrollY);
      expect(r.progress, `progress at y=${r.scrollY}\n${shown}`).toBeCloseTo(g, 1);
      expect(r.early, `0–40% draw at y=${r.scrollY}\n${shown}`).toBeCloseTo(localOf(g, 0, 0.4), 1);
      expect(r.late, `60–100% draw at y=${r.scrollY}\n${shown}`).toBeCloseTo(localOf(g, 0.6, 1), 1);
      expect(r.measured, `0–100% draw at y=${r.scrollY}\n${shown}`).toBeCloseTo(g, 1);
      expect(r.photo, `fade at y=${r.scrollY}\n${shown}`).toBeCloseTo(
        easeInOut(localOf(g, 0.1, 0.5)),
        1,
      );
    }

    // The gap between the two windows is the whole point: at the half-way mark
    // the first animation is finished and the second has not begun.
    const mid = rows.find((r) => r.scrollY === 1200)!;
    expect(mid.early, shown).toBeCloseTo(1, 1);
    expect(mid.late, `the second scene started during the gap\n${shown}`).toBeCloseTo(0, 2);
    expect(mid.measured, shown).toBeCloseTo(0.5, 1);
  });

  test('paints the correct frame at load, without waiting for a scroll', async ({ page }) => {
    // A deep link into the middle of the story: reload with the scroll already
    // there, so the very first paint has to be right.
    await page.goto('/e2e/fixtures/cinematic.html');
    await page.evaluate(() => window.scrollTo(0, 1200));
    await page.reload();
    await page.waitForFunction(() => (window as unknown as { __ready?: boolean }).__ready === true);

    const row = await read<Row>(page);
    // Firefox and WebKit restore scroll on reload; Chromium may not. Only assert
    // the frame when the restore actually happened.
    if (row.scrollY > 1000) {
      expect(row.early, 'loaded mid-story showing frame zero').toBeCloseTo(1, 1);
      expect(row.measured).toBeCloseTo(globalAt(row.scrollY), 1);
    }
  });

  test('a story shorter than the viewport cannot scrub, and says so', async ({ page }) => {
    await openFixture(page, 'cinematic.html');

    // `#tiny` is 50vh tall — there is no scroll room inside it. Above it, the
    // story has not started.
    const before = await read<Row>(page);
    expect(before.tinyProgress).toBe(0);
    expect(before.tiny).toBeCloseTo(0, 2);

    // Once its top passes the viewport top, the only sensible answer is "done".
    await scrollToY(page, 3400);
    const after = await read<Row>(page);
    expect(after.tinyProgress, 'a story with no scroll room never resolves').toBe(1);
    expect(after.tiny, 'the final frame was never painted').toBeCloseTo(1, 1);
  });

  test('reduced motion shows the finished frame and never scrubs', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openFixture(page, 'cinematic.html');

    // Nothing scrolled, yet the story is complete: no motion is used to tell it.
    const start = await read<Row>(page);
    expect(start.scrollY).toBe(0);
    expect(start.progress).toBe(1);
    expect(start.early).toBeCloseTo(1, 1);
    expect(start.late).toBeCloseTo(1, 1);
    expect(start.measured).toBeCloseTo(1, 1);
    expect(start.photo).toBeCloseTo(1, 1);

    // And it stays there — scrolling must not start animating after all.
    await scrollToY(page, 1200);
    const scrolled = await read<Row>(page);
    expect(scrolled.late, 'reduced motion still scrubbed the story').toBeCloseTo(1, 1);
  });

  /**
   * Documented behaviour: destroy() stops the scroll loop and detaches the
   * observer, but deliberately leaves the built DOM in place.
   */
  test('destroy() stops the loop but leaves the built stage in the page', async ({ page }) => {
    await openFixture(page, 'cinematic.html');

    await scrollToY(page, 960);
    const before = await read<Row>(page);
    expect(before.measured).toBeGreaterThan(0.2);

    await call(page, 'destroy');
    await scrollToY(page, 2400);
    const after = await read<Row>(page);

    expect(
      after.measured,
      `still scrubbing after destroy: ${before.measured.toFixed(3)} → ${after.measured.toFixed(3)}`,
    ).toBeCloseTo(before.measured, 2);
    expect(await call<boolean>(page, 'stageStillThere')).toBe(true);
  });
});
