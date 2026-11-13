import { test, expect } from '@playwright/test';
import { openFixture, collectErrors, call } from './helpers';

/**
 * An undrawn path paints nothing, round caps included.
 *
 * Until 2.26.0 every drawing engine wrote `stroke-dasharray: L` (a dash and
 * an equal gap). At the undrawn offset L the next dash then begins on the
 * path's end, and WebKit, whose own measure of a diagonal line or a closed
 * outline runs a hair past L, painted the start of it: with a round or square
 * cap, a dot on paths not drawn yet. Chromium and Firefox paint nothing, so
 * this only fails in WebKit, and the mutation for it runs there. jsdom paints
 * nothing at all. The fixture's strokes are scaled up twice so a dot is more
 * than a pixel; at 1:1 the same shapes left none to see.
 *
 * Measured by screenshots: each stage with its strokes at progress 0 has to be
 * pixel-identical to the same stage with the strokes hidden. The control, the
 * strokes drawn whole, has to differ, or the comparison could not see a stroke.
 */

const STAGES = ['native', 'js', 'timeline'] as const;

test.describe('round caps', () => {
  test('an undrawn round-cap path paints no pixels', async ({ page }) => {
    const errors = collectErrors(page);
    await openFixture(page, 'round-cap.html');

    await call(page, 'hide', true);
    const empty = await Promise.all(STAGES.map((id) => page.locator(`#${id}`).screenshot()));

    await call(page, 'hide', false);
    await call(page, 'seek', 0);
    for (const [i, id] of STAGES.entries()) {
      const undrawn = await page.locator(`#${id}`).screenshot();
      expect(undrawn.equals(empty[i]), `${id}: an undrawn stroke painted pixels`).toBe(true);
    }

    await call(page, 'seek', 1);
    for (const [i, id] of STAGES.entries()) {
      const drawn = await page.locator(`#${id}`).screenshot();
      expect(drawn.equals(empty[i]), `${id}: the control drew nothing, so the check is blind`).toBe(false);
    }
    expect(errors).toEqual([]);
  });
});
