import { test, expect } from '@playwright/test';
import { openFixture, read, call, scrollToY, settle, collectErrors } from './helpers';

/**
 * Reduced motion turned on while the page is open.
 *
 * Every engine used to read `prefers-reduced-motion` once, at start-up: a reader
 * who turned it on mid-visit (because the page was making them unwell) kept
 * every animation until a reload. Only scrollSnap and the timeline's loop
 * followed it. Now each engine finishes at once, exactly as a page loaded under
 * reduced motion shows it, and stays finished when the setting is turned off.
 *
 * `page.emulateMedia` after load changes the media query the way the OS setting
 * does: the browser fires `change` on every `matchMedia` list, in all three
 * engines. jsdom can only fake that event, so this is the test that counts.
 */

type Row = {
  scrollY: number;
  scrub: number;
  below: number;
  cards: number[];
  words: number[];
  copies: number;
  count: string;
  par: number;
  progress: { scrub: number; below: number };
  completes: { scrub: number; below: number; text: number; count: number };
};

test.describe('reduced motion turned on mid-visit', () => {
  test('finishes every effect at once, and fires each onComplete once', async ({ page }) => {
    const errors = collectErrors(page);
    await openFixture(page, 'motion-live.html');

    const before = await read<Row>(page);
    expect(before.scrub, 'the drawing in view should be part drawn at load').toBeGreaterThan(0.05);
    expect(before.scrub).toBeLessThan(0.95);
    expect(before.below).toBeCloseTo(0, 2);
    expect(before.cards.every((o) => o < 0.05), 'cards hidden below the fold').toBe(true);
    expect(before.words.every((o) => o < 0.05), 'words hidden below the fold').toBe(true);
    expect(before.count).toBe('0');
    expect(before.completes).toEqual({ scrub: 0, below: 0, text: 0, count: 0 });

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await settle(page);

    const after = await read<Row>(page);
    expect(after.scrollY, 'nothing scrolled').toBe(0);
    expect(after.scrub).toBeCloseTo(1, 2);
    expect(after.below).toBeCloseTo(1, 2);
    expect(after.cards.every((o) => o > 0.99), `cards: ${after.cards}`).toBe(true);
    expect(after.words.length).toBeGreaterThan(0);
    expect(after.words.every((o) => o > 0.99), `words: ${after.words}`).toBe(true);
    expect(after.copies, 'the screen-reader copy is there exactly once').toBe(1);
    expect(after.count).toBe('480');
    expect(after.progress).toEqual({ scrub: 1, below: 1 });
    expect(after.completes).toEqual({ scrub: 1, below: 1, text: 1, count: 1 });
    expect(errors).toEqual([]);
  });

  test('nothing moves with the scroll afterwards, and replay() is ignored', async ({ page }) => {
    await openFixture(page, 'motion-live.html');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await settle(page);
    const held = await read<Row>(page);

    await scrollToY(page, 1500);
    await call(page, 'replayBelow');
    await scrollToY(page, 0);

    const row = await read<Row>(page);
    expect(row.par, 'the parallax layer moved with the scroll').toBeCloseTo(held.par, 1);
    expect(row.scrub).toBeCloseTo(1, 2);
    expect(row.below, 'a replay() taken off the instance before the switch redrew it').toBeCloseTo(1, 2);
    expect(row.completes).toEqual(held.completes);
  });

  test('turning it off again leaves everything finished', async ({ page }) => {
    await openFixture(page, 'motion-live.html');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await settle(page);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await settle(page);
    await scrollToY(page, 600);
    await scrollToY(page, 0);

    const row = await read<Row>(page);
    expect(row.scrub).toBeCloseTo(1, 2);
    expect(row.below).toBeCloseTo(1, 2);
    expect(row.cards.every((o) => o > 0.99)).toBe(true);
    expect(row.words.every((o) => o > 0.99)).toBe(true);
    expect(row.count).toBe('480');
    expect(row.completes).toEqual({ scrub: 1, below: 1, text: 1, count: 1 });
  });

  test('an effect already finished does not fire onComplete again', async ({ page }) => {
    await openFixture(page, 'motion-live.html');
    // Scroll the scrubbed drawing out past its end: drawn, onComplete fired.
    await scrollToY(page, 900);
    await expect.poll(async () => (await read<Row>(page)).completes.scrub).toBe(1);

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await settle(page);

    expect((await read<Row>(page)).completes.scrub).toBe(1);
  });

  test('destroy() after the switch puts the text back as it was', async ({ page }) => {
    await openFixture(page, 'motion-live.html');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await settle(page);
    await call(page, 'destroyAll');
    expect(await call<string>(page, 'textHTML')).toBe('Ship real browser tests');
  });
});
