#!/usr/bin/env node
/**
 * Runs each recipe's plain-HTML file in a real browser and checks it does what
 * the page says it does.
 *
 * Why: a recipe's whole promise is "paste this and it works", and a listing
 * nobody ran is the easiest thing on a site to get wrong. The page shows the
 * file from disk (src/recipes/<slug>/), so the file tested here is the file a
 * reader copies. The CDN script tag is served from this repo's built
 * dist/cdn/, so the check runs offline against the code about to ship — run
 * `npm run build:lib` first.
 *
 * The React file is the same component the page renders live; tsc and the
 * demo build check that it compiles.
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const here = dirname(fileURLToPath(import.meta.url));
const recipes = resolve(here, '../src/recipes');
const cdnFile = resolve(here, '../../../packages/svg-scroll-draw/dist/cdn/svg-scroll-draw.global.js');

if (!existsSync(cdnFile)) {
  console.error('✗ test-recipes: no dist/cdn build — run `npm run build:lib` first.');
  process.exit(1);
}
const cdn = readFileSync(cdnFile, 'utf8');

const failures = [];
const check = (ok, msg) => { if (!ok) failures.push(msg); };

/** Drawn fraction of each outline path, in document order. */
const drawn = (page) =>
  page.evaluate(() =>
    [...document.querySelectorAll('.logo-line')].map((el) => {
      const len = el.getTotalLength();
      return 1 - parseFloat(getComputedStyle(el).strokeDashoffset) / len;
    }),
  );

async function open(browser, html, { reducedMotion = 'no-preference' } = {}) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, reducedMotion });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.route('https://unpkg.com/**', (r) => r.fulfill({ contentType: 'text/javascript', body: cdn }));
  await page.route('http://recipe.test/', (r) => r.fulfill({ contentType: 'text/html', body: html }));
  await page.goto('http://recipe.test/');
  await page.waitForTimeout(150);
  return { page, errors };
}

const browser = await chromium.launch();

// ── logo-reveal ──────────────────────────────────────────────────────────────
{
  const html = readFileSync(resolve(recipes, 'logo-reveal/index.html'), 'utf8');
  const name = 'logo-reveal/index.html';

  const { page, errors } = await open(browser, html);
  const before = await drawn(page);
  check(before.length === 4, `${name}: expected 4 outline paths, found ${before.length}`);
  check(before.every((f) => f < 0.01), `${name}: drawn before any scroll (${before.map((f) => f.toFixed(2))})`);

  // The logo's top at 50% of the viewport: part-way through every window.
  const top = await page.evaluate(() => document.getElementById('logo').getBoundingClientRect().top + scrollY);
  await page.evaluate((y) => scrollTo(0, y), top - 400);
  await page.waitForTimeout(300);
  const mid = await drawn(page);
  check(mid[0] > 0.5 && mid[0] < 1, `${name}: first stroke not part-drawn mid-scroll (${mid[0].toFixed(2)})`);
  check(
    mid.every((f, i) => i === 0 || f < mid[i - 1] - 0.05),
    `${name}: strokes not staggered mid-scroll (${mid.map((f) => f.toFixed(2))}) — once must keep the stagger`,
  );
  check(!(await page.evaluate(() => document.getElementById('logo').classList.contains('is-inked'))), `${name}: inked before the outline finished`);

  await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1200);
  const end = await drawn(page);
  check(end.every((f) => f > 0.99), `${name}: not fully drawn at the end (${end.map((f) => f.toFixed(2))})`);
  const fills = await page.evaluate(() => [...document.querySelectorAll('.logo-fill')].map((el) => +getComputedStyle(el).opacity));
  check(fills.every((o) => o > 0.99), `${name}: colour did not arrive after onComplete (${fills})`);

  // once: scrolling back up keeps the finished logo.
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(300);
  check((await drawn(page)).every((f) => f > 0.99), `${name}: once did not hold the drawing on the way back`);
  check(errors.length === 0, `${name}: page errors: ${errors.join(' | ')}`);
  await page.close();

  // Reduced motion: finished and coloured on load, with no scroll at all.
  const rm = await open(browser, html, { reducedMotion: 'reduce' });
  await rm.page.waitForTimeout(900);
  check((await drawn(rm.page)).every((f) => f > 0.99), `${name}: reduced motion did not show the finished outline`);
  check(await rm.page.evaluate(() => document.getElementById('logo').classList.contains('is-inked')), `${name}: reduced motion never called onComplete`);
  await rm.page.close();
}

await browser.close();

if (failures.length) {
  console.error(`✗ ${failures.length} recipe check(s) failed:\n` + failures.map((f) => `  ${f}`).join('\n'));
  process.exit(1);
}
console.log('✓ every recipe file works in a browser (logo-reveal)');
