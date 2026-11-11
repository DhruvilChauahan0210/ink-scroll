import { test, expect, type Page } from '@playwright/test';
import { openFixture, collectErrors, settle, call, read, table, NATIVE_PROJECTS } from './helpers';

/**
 * A `scrollContainer` with a border (container-border.html: 30px border, 20px
 * top padding, a cell 620px down its scroll content). CSS view() and the JS
 * engine's own viewport size (clientHeight) both measure the scrollport, the
 * padding box; up to 2.23.2 the JS engine measured the element's offset from
 * the container's border box, so every trigger window sat one border width
 * (30px here, 0.068 of a 440px window) late. Since 2.23.3 it counts from inside
 * the border.
 *
 * Window, from layout: [620 − 340, 620 + 100] = [280, 720].
 */

type Row = { scrollY: number; js: number; css: number | null; expected: number };

const OFFSETS = [200, 280, 340, 400, 460, 500, 560, 620, 680, 720, 800];
const TOLERANCE = 0.02;

async function sweepBox(page: Page): Promise<Row[]> {
  const rows: Row[] = [];
  for (const y of OFFSETS) {
    await call(page, 'scrollTo', y);
    await settle(page);
    rows.push(await read<Row>(page));
  }
  return rows;
}

test('the trigger window in a bordered scroll container is the scrollport’s, as CSS view() measures it', async ({ page }, info) => {
  const errors = collectErrors(page);
  await openFixture(page, 'container-border.html');
  const rows = await sweepBox(page);
  const shown = table(rows);

  for (const r of rows) {
    expect(Math.abs(r.js - r.expected), `y=${r.scrollY}\n${shown}`).toBeLessThan(TOLERANCE);
  }
  if (NATIVE_PROJECTS.includes(info.project.name)) {
    for (const r of rows) {
      expect(r.css, 'view() unsupported').not.toBeNull();
      expect(Math.abs(r.js - (r.css as number)), `y=${r.scrollY}: JS against view()\n${shown}`).toBeLessThan(TOLERANCE);
    }
  }
  // Genuinely mid-window somewhere, so the comparison measured something.
  expect(rows.some((r) => r.js > 0.2 && r.js < 0.8), shown).toBe(true);
  expect(errors).toEqual([]);
});
