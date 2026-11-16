import { test, expect } from '@playwright/test';
import { openFixture, collectErrors } from './helpers';

/**
 * no-flash.css (2.28.0). The GSAP benchmark found svg-scroll-draw painting the
 * finished drawing first in every run: the paths are whole in the HTML until
 * the module runs. With the stylesheet and the pending attribute, every frame
 * before the engine paints no stroke; without the stylesheet the same page
 * shows them whole, so this test catches the flash it guards against.
 */

async function frames(page: import('@playwright/test').Page, css: '1' | '0'): Promise<number[]> {
  await openFixture(page, `no-flash.html?css=${css}`);
  return page.evaluate(() => (window as unknown as { __frames: number[] }).__frames);
}

test('with no-flash.css, no frame paints a stroke whole before the engine runs', async ({ page }) => {
  const errors = collectErrors(page);
  const f = await frames(page, '1');
  expect(f.length).toBeGreaterThan(3); // frames were painted while the module was on its way
  expect(f.filter((n) => n > 0)).toEqual([]);
  // and once the engine ran, the attribute is gone and the strokes show
  expect(await page.evaluate(() => document.getElementById('art')!.hasAttribute('data-scroll-draw-pending'))).toBe(false);
  expect(await page.evaluate(() => getComputedStyle(document.querySelector('#art path')!).strokeOpacity)).toBe('1');
  expect(errors).toEqual([]);
});

test('without it, the same page paints the drawing whole first: the flash this guards against', async ({ page }) => {
  const f = await frames(page, '0');
  expect(f.some((n) => n === 3)).toBe(true);
});
