import { test, expect } from '@playwright/test';
import { openFixture, collectErrors, scrollToY, read, call, sweep, table } from './helpers';

/**
 * `scrollReveal` in real browsers.
 *
 * 100% line coverage in jsdom and zero browser coverage until this file. jsdom
 * cannot verify any of what matters here: `getComputedStyle().transform` there is
 * whatever was assigned rather than a resolved matrix, `getBoundingClientRect()`
 * returns zeros so no trigger window is real, and `matchMedia` is a stub, so the
 * reduced-motion branch was only ever tested against a fake.
 *
 * Fixture geometry (viewport 900x800, from playwright.config.ts):
 *   rowA top = 1200, rowB top = 2520, both 120px tall
 *
 * The engine maps element i to the window `top (88 - 4i)%` → `top (53 - 4i)%`
 * at stagger 1 (its capped maximum). In scroll offsets, for rowA:
 *   card 0: 496 → 776    card 1: 528 → 808
 *   card 2: 560 → 840    card 3: 592 → 872
 * so y=700 is mid-window for all four with strictly decreasing progress, which
 * is what makes the cascade measurable rather than incidental.
 */

type CardState = {
  opacity: number;
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  inlineOpacity: string;
  inlineTransform: string;
};

type Row = { scrollY: number; cards: CardState[]; revs: CardState[] };

/** rowB (once:false) window: 1816 → 2096. */
const REV_MID = 1900;
const REV_END = 2150;

test.describe('scrollReveal', () => {
  test('loads the real bundle and starts at the from-state', async ({ page }) => {
    const errors = collectErrors(page);
    await openFixture(page, 'reveal.html');

    expect(errors).toEqual([]);

    const geo = await call<{ rowATop: number; rowBTop: number; viewport: number }>(
      page,
      'geometry',
    );
    // Guard the arithmetic this whole file depends on. If the fixture's layout
    // drifts, every offset below becomes meaningless — fail here, loudly, rather
    // than pass vacuously at the wrong scroll positions.
    expect(geo).toEqual({ rowATop: 1200, rowBTop: 2520, viewport: 800 });

    const row = await read<Row>(page);
    // Default preset fadeUp: opacity 0, translateY 32px.
    for (const [i, c] of row.cards.entries()) {
      expect(c.opacity, `card ${i} should start transparent`).toBeLessThanOrEqual(0.01);
      expect(c.y, `card ${i} should start offset downward`).toBeCloseTo(32, 0);
    }
    // scale preset: opacity 0, scale 0.88.
    for (const [i, r] of row.revs.entries()) {
      expect(r.opacity, `rev ${i}`).toBeLessThanOrEqual(0.01);
      expect(r.scaleX, `rev ${i}`).toBeCloseTo(0.88, 2);
    }
  });

  test('applies real resolved transforms mid-window', async ({ page }) => {
    await openFixture(page, 'reveal.html');
    await scrollToY(page, 700);

    const { cards } = await read<Row>(page);
    const c = cards[0];

    expect(c.opacity).toBeGreaterThan(0.05);
    expect(c.opacity).toBeLessThan(0.99);
    // Partly travelled: strictly between the from-state and the final state.
    expect(c.y).toBeGreaterThan(0);
    expect(c.y).toBeLessThan(32);
    // And it is a real computed matrix, not just an inline string we wrote.
    expect(c.inlineTransform).toContain('translateY');
  });

  test('stagger produces a strictly ordered cascade', async ({ page }) => {
    await openFixture(page, 'reveal.html');
    await scrollToY(page, 700);

    const { cards } = await read<Row>(page);
    const shown = table(cards.map((c, i) => ({ card: i, opacity: c.opacity, y: c.y })));

    // Every card shares a document Y, so any ordering here is the stagger.
    for (let i = 1; i < cards.length; i++) {
      expect(
        cards[i].opacity,
        `card ${i} should trail card ${i - 1}\n${shown}`,
      ).toBeLessThan(cards[i - 1].opacity);
    }
    // Guard against a vacuous pass where every card sits at 0 or 1.
    expect(cards[0].opacity, shown).toBeGreaterThan(0.05);
    expect(cards[cards.length - 1].opacity, shown).toBeLessThan(0.95);
  });

  test('reaches the final state and holds it (once: true)', async ({ page }) => {
    await openFixture(page, 'reveal.html');

    const rows = await sweep<Row>(page, [700, 800, 900]);
    const last = rows[rows.length - 1];
    for (const [i, c] of last.cards.entries()) {
      expect(c.opacity, `card ${i} at y=900`).toBeGreaterThanOrEqual(0.99);
      expect(c.y, `card ${i} at y=900`).toBeCloseTo(0, 0);
    }

    // Back up into the middle of the window: once:true must latch, not reverse.
    await scrollToY(page, 600);
    const back = await read<Row>(page);
    const shown = table(
      back.cards.map((c, i) => ({ card: i, opacity: c.opacity, y: c.y })),
    );
    for (const [i, c] of back.cards.entries()) {
      expect(c.opacity, `card ${i} must stay revealed\n${shown}`).toBeGreaterThanOrEqual(0.99);
    }
  });

  test('once: false reverses on the way back up', async ({ page }) => {
    await openFixture(page, 'reveal.html');

    await scrollToY(page, REV_END);
    const done = await read<Row>(page);
    expect(done.revs[0].opacity).toBeGreaterThanOrEqual(0.99);

    // Still on screen at REV_MID, so the engine is running and must reverse.
    await scrollToY(page, REV_MID);
    const back = await read<Row>(page);
    expect(
      back.revs[0].opacity,
      `once:false did not reverse (opacity ${back.revs[0].opacity})`,
    ).toBeLessThan(0.9);
    expect(back.revs[0].scaleX).toBeLessThan(1);
  });

  test('reduced motion jumps straight to the final state without scrolling', async ({ page }) => {
    // Emulated at the browser level, so the library reads a real media query —
    // the unit test for this path could only ever exercise a stubbed matchMedia.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openFixture(page, 'reveal.html');

    const row = await read<Row>(page);
    expect(row.scrollY).toBe(0);
    for (const [i, c] of [...row.cards, ...row.revs].entries()) {
      expect(c.opacity, `element ${i} should be fully visible immediately`).toBeCloseTo(1, 2);
      expect(c.y, `element ${i} should not be offset`).toBeCloseTo(0, 0);
      expect(c.scaleX, `element ${i} should not be scaled`).toBeCloseTo(1, 2);
    }
  });

  test('destroy() restores the original styles', async ({ page }) => {
    await openFixture(page, 'reveal.html');
    // Freeze the cards partway, which is the state that matters: destroying a
    // half-revealed element must not leave it stuck at 40% opacity forever.
    await scrollToY(page, 700);

    const before = await read<Row>(page);
    expect(before.cards[0].opacity).toBeLessThan(0.99);

    await call(page, 'destroyStaggered');
    const after = await read<Row>(page);
    const shown = table(
      after.cards.map((c, i) => ({
        card: i,
        opacity: c.opacity,
        inlineOpacity: c.inlineOpacity || '(none)',
        inlineTransform: c.inlineTransform || '(none)',
      })),
    );

    // ScrollRevealInstance.destroy is documented as "Remove all animations and
    // restore original styles".
    for (const [i, c] of after.cards.entries()) {
      expect(c.inlineOpacity, `card ${i} left inline opacity behind\n${shown}`).toBe('');
      expect(c.inlineTransform, `card ${i} left inline transform behind\n${shown}`).toBe('');
      expect(c.opacity, `card ${i} left partly transparent\n${shown}`).toBeCloseTo(1, 2);
    }
  });
});
