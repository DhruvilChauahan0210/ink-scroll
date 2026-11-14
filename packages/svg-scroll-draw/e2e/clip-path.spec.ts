import { test, expect } from '@playwright/test';
import { openFixture, collectErrors, scrollToY, read } from './helpers';

/**
 * clip-path shapes through scrollAnimate's JS engine, in real browsers.
 *
 * Up to 2.26.1 the engine rebuilt every function as `fn(a, b, c)`: inset() got
 * commas, circle() lost its `at`, polygon() the % of a bare 0. No browser
 * accepts those, so the style was dropped and the element showed unclipped for
 * the whole scroll. jsdom cannot tell, because it accepts any string.
 */

type Shape = { inline: string; computed: string };

const HALF: Record<string, string> = {
  inset: 'inset(0px 25% 0px 0px round 8px)',
  circle: 'circle(37.5% at 50% 50%)',
  polygon: 'polygon(0px 0px, 50% 0px, 50% 100%, 0px 100%)',
};

test('clip-path shapes animate in a syntax the browser applies', async ({ page }) => {
  const errors = collectErrors(page);
  await openFixture(page, 'clip-path.html');
  await scrollToY(page, 700);
  const got = await read<Record<string, Shape>>(page);
  for (const [id, want] of Object.entries(HALF)) {
    // An invalid declaration is dropped, which leaves `inline` empty.
    expect(got[id].inline, id).not.toBe('');
    expect(got[id].computed.replace(/\s+/g, ' '), id).toBe(want);
  }
  expect(errors).toEqual([]);
});
