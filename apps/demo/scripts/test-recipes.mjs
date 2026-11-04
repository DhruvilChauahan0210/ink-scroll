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
 * Script tags (dist/cdn/*.global.js) and ES module imports from jsDelivr
 * (dist/**) are both served from the local build.
 *
 * The React files are the components the pages render live; tsc and the demo
 * build check that they compile.
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const here = dirname(fileURLToPath(import.meta.url));
const recipes = resolve(here, '../src/recipes');
const dist = resolve(here, '../../../packages/svg-scroll-draw/dist');
const cdnFile = resolve(dist, 'cdn/svg-scroll-draw.global.js');

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

async function open(browser, html, { reducedMotion = 'no-preference', width = 1280, height = 800 } = {}) {
  const page = await browser.newPage({ viewport: { width, height }, reducedMotion });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.route('https://unpkg.com/**', (r) => r.fulfill({ contentType: 'text/javascript', body: cdn }));
  await page.route('https://cdn.jsdelivr.net/npm/svg-scroll-draw@*/dist/**', (r) => {
    const file = resolve(dist, new URL(r.request().url()).pathname.split('/dist/')[1]);
    return r.fulfill({ contentType: 'text/javascript', body: readFileSync(file, 'utf8') });
  });
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

// ── scroll-pin (the feature tour) ────────────────────────────────────────────
{
  const html = readFileSync(resolve(recipes, 'scroll-pin/index.html'), 'utf8');
  const name = 'scroll-pin/index.html';
  const HEADER = 64;

  /** The stage's position, the active feature and each drawing's drawn fraction. */
  const state = (page) =>
    page.evaluate(() => {
      const stage = document.getElementById('stage');
      const cs = getComputedStyle(stage);
      return {
        position: cs.position,
        top: cs.top,
        on: [...document.querySelectorAll('.tour-art')].findIndex((a) => a.hasAttribute('data-on')),
        current: [...document.querySelectorAll('.tour-copy li')].findIndex((li) => li.getAttribute('aria-current') === 'step'),
        drawn: [...document.querySelectorAll('.tour-art')].map((svg) => {
          const ps = [...svg.querySelectorAll('path')];
          const f = ps.map((el) => 1 - parseFloat(getComputedStyle(el).strokeDashoffset) / el.getTotalLength());
          return f.reduce((a, b) => a + b, 0) / f.length;
        }),
      };
    });
  /** Scroll so the pin is at progress p (the wrapper is what scrollPin measures). */
  const scrollToProgress = async (page, p) => {
    await page.evaluate(([p, top]) => {
      const w = document.querySelector('[data-ssd-pin-wrapper]');
      const docTop = w.getBoundingClientRect().top + scrollY;
      scrollTo(0, docTop - top + p * innerHeight * 2);
    }, [p, HEADER]);
    await page.waitForTimeout(250);
  };
  const near = (a, b, tol = 0.06) => Math.abs(a - b) <= tol;

  const { page, errors } = await open(browser, html);
  let s = await state(page);
  check(s.position === 'static', `${name}: pinned before reaching it (${s.position})`);
  check(s.on === 0 && s.current === 0, `${name}: first feature not active at the start`);
  check(s.drawn.every((f) => f < 0.01), `${name}: drawn before the tour (${s.drawn.map((f) => f.toFixed(2))})`);

  await scrollToProgress(page, 0.5);
  s = await state(page);
  check(s.position === 'fixed' && s.top === `${HEADER}px`, `${name}: not pinned ${HEADER}px down mid-tour (${s.position} ${s.top})`);
  check(s.on === 1 && s.current === 1, `${name}: feature 2 not active at progress 0.5 (art ${s.on}, copy ${s.current})`);
  check(near(s.drawn[0], 1) && near(s.drawn[1], 0.5) && near(s.drawn[2], 0), `${name}: drawings not 1 / 0.5 / 0 at progress 0.5 (${s.drawn.map((f) => f.toFixed(2))})`);

  await scrollToProgress(page, 1.2);
  s = await state(page);
  check(s.position === 'absolute', `${name}: still pinned after the tour (${s.position})`);
  check(s.on === 2 && s.drawn.every((f) => near(f, 1)), `${name}: last feature not active and drawn at the end (${s.on}, ${s.drawn.map((f) => f.toFixed(2))})`);

  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(250);
  s = await state(page);
  check(s.position === 'static' && s.on === 0 && s.drawn.every((f) => f < 0.01), `${name}: not reset after scrolling back (${s.position}, ${s.on}, ${s.drawn.map((f) => f.toFixed(2))})`);
  check(errors.length === 0, `${name}: page errors: ${errors.join(' | ')}`);
  await page.close();

  // A phone: the pinned stage must fit below the header, one feature at a time.
  const phone = await open(browser, html, { width: 390, height: 844 });
  await scrollToProgress(phone.page, 0.5);
  const fit = await phone.page.evaluate(() => {
    const stage = document.getElementById('stage');
    const shown = [...document.querySelectorAll('.tour-copy li')].filter((li) => getComputedStyle(li).display !== 'none').length;
    return { bottom: stage.getBoundingClientRect().bottom, vh: innerHeight, shown, overflow: document.documentElement.scrollWidth - innerWidth };
  });
  check(fit.bottom <= fit.vh + 1, `${name}: the pinned stage runs off a 390×844 screen (bottom ${fit.bottom}px)`);
  check(fit.shown === 1, `${name}: ${fit.shown} features shown on a phone, expected 1`);
  check(fit.overflow === 0, `${name}: horizontal overflow on a phone (${fit.overflow}px)`);
  await phone.page.close();

  // Reduced motion: the drawings are simply finished; the pin and the features still work.
  const rm = await open(browser, html, { reducedMotion: 'reduce' });
  await scrollToProgress(rm.page, 0.5);
  s = await state(rm.page);
  check(s.drawn.every((f) => f > 0.99), `${name}: reduced motion did not show the finished drawings (${s.drawn.map((f) => f.toFixed(2))})`);
  check(s.position === 'fixed' && s.on === 1, `${name}: under reduced motion the pin or the features stopped working`);
  await rm.page.close();
}

await browser.close();

if (failures.length) {
  console.error(`✗ ${failures.length} recipe check(s) failed:\n` + failures.map((f) => `  ${f}`).join('\n'));
  process.exit(1);
}
console.log('✓ every recipe file works in a browser (logo-reveal, scroll-pin)');
