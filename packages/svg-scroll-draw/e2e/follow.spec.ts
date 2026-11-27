import { test, expect, type Page } from '@playwright/test';
import { openFixture, collectErrors, scrollToY, call, settle } from './helpers';

/**
 * `svg-scroll-draw/follow` in a real browser (fixtures/follow.html): an HTML
 * element beside a viewBox shown at 3x and an SVG one inside a scaled group
 * stay on the path at the scroll's share of its length; rotate follows the
 * tangent on screen through an uneven viewBox; draw draws up to the element;
 * a sticky stage; a resize; a jump past the window; destroy(); reduced motion.
 */

type Check = { p: number; off: number; angle: number | null; tangent: number };

async function at(page: Page, name: string, p: number): Promise<Check> {
  await scrollToY(page, await call<number>(page, 'yAt', name, p));
  await settle(page);
  return call<Check>(page, 'check', name);
}

/** Angles equal modulo a full turn. */
const turn = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180);

test.describe('svg-scroll-draw/follow', () => {
  let errors: string[];
  test.beforeEach(async ({ page }) => {
    errors = collectErrors(page);
    await openFixture(page, 'follow.html');
  });
  test.afterEach(() => expect(errors).toEqual([]));

  test('an HTML element and an SVG element sit on the path at the scroll\'s share of its length', async ({ page }) => {
    for (const p of [0, 0.2, 0.5, 0.8, 1]) {
      for (const name of ['plane', 'dot']) {
        const c = await at(page, name, p);
        expect(c.p, name).toBeCloseTo(p, 2);
        expect(c.off, `${name} at ${p}: ${JSON.stringify(c)}`).toBeLessThan(1);
      }
    }
    // Without rotate the element keeps its own orientation.
    expect((await at(page, 'plane', 0.5)).angle).toBeCloseTo(0, 1);
  });

  test('rotate follows the tangent on screen, through a viewBox stretched unevenly', async ({ page }) => {
    for (const p of [0.1, 0.5, 0.9]) {
      const c = await at(page, 'arrow', p);
      expect(c.off, JSON.stringify(c)).toBeLessThan(1);
      // 45 degrees in user units, atan(200 / 600) on screen.
      expect(Math.abs(c.tangent - 18.43), JSON.stringify(c)).toBeLessThan(0.1);
      expect(turn(c.angle!, c.tangent), JSON.stringify(c)).toBeLessThan(0.5);
    }
  });

  test('draw draws the path from its start up to the element', async ({ page }) => {
    await at(page, 'arrow', 0);
    expect(await call<number[]>(page, 'drawn')).toEqual([0, 0]);
    for (const p of [0.3, 0.7, 1]) {
      await at(page, 'arrow', p);
      const [from, to] = await call<number[]>(page, 'drawn');
      expect(from).toBe(0);
      expect(Math.abs(to - p), `${p}: ${to}`).toBeLessThan(0.01);
    }
  });

  test('in a sticky stage it travels while the path holds still', async ({ page }) => {
    for (const p of [0.25, 0.5, 0.75]) {
      const c = await at(page, 'pin', p);
      expect(c.off, `${p}: ${JSON.stringify(c)}`).toBeLessThan(1);
      expect(turn(c.angle!, c.tangent), JSON.stringify(c)).toBeLessThan(0.5);
    }
  });

  test('after a resize scales the <svg>, it is back on the path', async ({ page }) => {
    // Re-measured while scrolled: the CTM and the box are read together.
    await at(page, 'plane', 0.4);
    await page.setViewportSize({ width: 500, height: 800 });
    await page.waitForTimeout(400);
    await settle(page);
    for (const p of [0.4, 0.6]) {
      const c = await at(page, 'plane', p);
      expect(c.off, `${p}: ${JSON.stringify(c)}`).toBeLessThan(1);
      const d = await at(page, 'dot', p);
      expect(d.off, `${p}: ${JSON.stringify(d)}`).toBeLessThan(1);
    }
  });

  test('a jump past the window lands at the end and fires onComplete once', async ({ page }) => {
    await scrollToY(page, await call<number>(page, 'maxScroll'));
    await settle(page);
    expect(await call(page, 'progress', 'plane')).toBe(1);
    const c = await call<Check>(page, 'check', 'plane');
    expect(c.off, JSON.stringify(c)).toBeLessThan(1);
    expect(await call(page, 'completed')).toEqual({ plane: 1 });
  });

  test('destroy() puts back inline styles and the transform attribute exactly', async ({ page }) => {
    await at(page, 'plane', 0.5);
    await at(page, 'arrow', 0.5);
    expect(await call(page, 'destroyAll')).toEqual({
      kept: true,
      plane: null,
      dot: 'translate(999 999)',
      diag: null,
    });
  });
});

test('under reduced motion the element is at the end at once, the path drawn', async ({ page }) => {
  const errors = collectErrors(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openFixture(page, 'follow.html');
  expect(await call(page, 'completed')).toEqual({ plane: 1 });
  expect(await call(page, 'progress', 'arrow')).toBe(1);
  expect(await call<number[]>(page, 'drawn')).toEqual([0, 1]);
  // Where the end is, wherever the scroll is.
  const route = await page.evaluate(() => {
    const path = document.querySelector('#route') as SVGPathElement;
    const p = path.getPointAtLength(path.getTotalLength());
    const s = new DOMPoint(p.x, p.y).matrixTransform(path.getScreenCTM()!);
    const r = document.querySelector('#plane .c')!.getBoundingClientRect();
    return Math.hypot(r.left - s.x, r.top - s.y);
  });
  expect(route).toBeLessThan(1);
  expect(errors).toEqual([]);
});
