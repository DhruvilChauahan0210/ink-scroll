import { test, expect } from '@playwright/test';
import { openFixture, collectErrors, scrollToY, read } from './helpers';

/**
 * `scrollDraw` with `morphTo`, drawing a line that morphs to a longer outline.
 *
 * Up to 2.23.3 the dash was sized once, to the starting path, so at progress 1
 * the target outline (320 units here) was drawn for only the starting path's
 * length (40): the line stayed open, mostly undrawn. The dash now fits the
 * longer of the two outlines.
 *
 * Fixture geometry (viewport 900x800): the drawing is 300px tall at document
 * top 1200, so the default window is [400, 1500].
 */

type Row = { scrollY: number; d: string; length: number; dash: number; offset: number; progress: number };

test.describe('scrollDraw morphTo', () => {
  test('a morph to a longer outline is drawn whole at progress 1', async ({ page }) => {
    const errors = collectErrors(page);
    await openFixture(page, 'morph.html');
    expect(errors).toEqual([]);

    // Through the window, not across it in one step: the draw engine's frames
    // still start when its IntersectionObserver sees the drawing.
    await scrollToY(page, 1000);
    await scrollToY(page, 1600);
    const end = await read<Row>(page);
    expect(end.progress).toBe(1);
    expect(end.d.replace(/\s+/g, ' ')).toContain('90');
    expect(end.length).toBeCloseTo(320, 0);
    expect(end.offset).toBe(0);
    expect(end.dash, `dash ${end.dash} of a ${end.length}-unit outline`).toBeGreaterThanOrEqual(end.length - 0.5);
  });

  test('and hidden at progress 0', async ({ page }) => {
    await openFixture(page, 'morph.html');
    await scrollToY(page, 0);
    const start = await read<Row>(page);
    expect(start.progress).toBe(0);
    expect(start.length).toBeCloseTo(40, 0);
    // The gap before the dash covers the whole of the outline it has now.
    expect(start.offset).toBeGreaterThanOrEqual(start.length);
  });
});
