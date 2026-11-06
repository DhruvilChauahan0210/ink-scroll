#!/usr/bin/env node
/**
 * Runs the /blocks page in a real browser and checks each block does what its
 * card says, scrolled through the way a reader scrolls.
 *
 * Why: the registry check (build-registry --check) proves the published JSON
 * matches the source, not that the source works; until this script no block was
 * ever run in a browser. The page renders the exact files the registry ships.
 *
 * Needs the site running: `npm run dev` (or `next start`) in apps/demo, then
 *   node scripts/test-blocks.mjs            # http://localhost:3000
 *   BASE_URL=https://… node scripts/test-blocks.mjs
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const failures = [];
const check = (ok, msg) => { if (!ok) failures.push(msg); };

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });

await page.goto(`${BASE}/blocks`, { waitUntil: 'networkidle' });
await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' });

/** Document top and height of a block's section. */
const box = (name) =>
  page.evaluate((n) => {
    const el = document.getElementById(n);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { top: r.top + scrollY, height: r.height };
  }, name);

/** Scroll through a block's section in steps, reading `probe` at each. */
async function sweep(name, probe, steps = 24) {
  const b = await box(name);
  check(!!b, `#${name}: no section on /blocks`);
  if (!b) return [];
  const rows = [];
  for (let i = 0; i <= steps; i++) {
    await page.evaluate((y) => scrollTo(0, y), b.top - 200 + (i / steps) * b.height);
    await page.waitForTimeout(140);
    rows.push(await page.evaluate(probe, name));
  }
  return rows;
}

// ── Every block is on the page ─────────────────────────────────────────────
const names = await page.evaluate(() => [...document.querySelectorAll('section.bk')].map((s) => s.id));
for (const n of ['signature-draw', 'reveal-cards', 'stat-counter-row', 'sticky-feature', 'headline-text-reveal',
  'pinned-feature-tour', 'horizontal-case-strip', 'video-scrub', 'reading-progress']) {
  check(names.includes(n), `#${n}: missing from /blocks (found ${names.join(', ')})`);
}

// ── pinned-feature-tour: the stage pins, and every feature takes its turn ──
{
  const rows = await sweep('pinned-feature-tour', (n) => {
    const s = document.getElementById(n);
    const current = s.querySelector('[aria-current="step"]');
    const pinned = [...s.querySelectorAll('*')].some((el) => getComputedStyle(el).position === 'fixed');
    return { current: current?.textContent?.trim().slice(0, 30) ?? null, pinned, on: s.querySelectorAll('[data-tour-art][data-on]').length };
  });
  const seen = new Set(rows.map((r) => r.current).filter(Boolean));
  check(seen.size >= 3, `pinned-feature-tour: ${seen.size} features took a turn, not 3 (${[...seen].join(' | ')})`);
  check(rows.some((r) => r.pinned), 'pinned-feature-tour: the stage never pinned');
  check(rows.every((r) => r.on <= 1), 'pinned-feature-tour: more than one drawing shown at once');
}

// ── horizontal-case-strip: a pixel of scroll moves it a pixel, and it ends flush ──
{
  const read = (n) => {
    const s = document.getElementById(n);
    const list = s.querySelector('[role="list"]');
    let stage = list.parentElement;
    while (stage && getComputedStyle(stage).position !== 'sticky') stage = stage.parentElement;
    const cs = getComputedStyle(stage);
    const r = stage.getBoundingClientRect();
    const right = r.right - parseFloat(cs.paddingRight);
    const items = list.querySelectorAll(':scope > *');
    return {
      x: new DOMMatrix(getComputedStyle(list).transform).m41,
      lastR: items[items.length - 1].getBoundingClientRect().right - right,
      stageTop: Math.round(r.top),
    };
  };
  const b = await box('horizontal-case-strip');
  // The runway is the sticky stage's parent; find its document top and height.
  const runway = await page.evaluate((n) => {
    const s = document.getElementById(n);
    let stage = s.querySelector('[role="list"]').parentElement;
    while (stage && getComputedStyle(stage).position !== 'sticky') stage = stage.parentElement;
    const r = stage.parentElement.getBoundingClientRect();
    return { top: r.top + scrollY, height: r.height };
  }, 'horizontal-case-strip');
  check(!!b && runway.height > 800, 'horizontal-case-strip: no runway taller than the screen');
  await page.evaluate((y) => scrollTo(0, y), runway.top + 0.4 * (runway.height - 800));
  await page.waitForTimeout(250);
  const a = await page.evaluate(read, 'horizontal-case-strip');
  await page.evaluate(() => scrollBy(0, 100));
  await page.waitForTimeout(250);
  const c = await page.evaluate(read, 'horizontal-case-strip');
  check(Math.abs(a.x - c.x - 100) <= 1.5, `horizontal-case-strip: 100px of scroll moved it ${(a.x - c.x).toFixed(1)}px`);
  check(a.stageTop === 0 && c.stageTop === 0, `horizontal-case-strip: the stage is not stuck (${a.stageTop}, ${c.stageTop})`);
  await page.evaluate((y) => scrollTo(0, y), runway.top + runway.height - 800);
  await page.waitForTimeout(250);
  const end = await page.evaluate(read, 'horizontal-case-strip');
  check(Math.abs(end.lastR) <= 1.5, `horizontal-case-strip: the last card ends ${end.lastR.toFixed(1)}px from the stage's edge`);
}

// ── video-scrub: the film follows the scroll, and the chapters follow the film ──
{
  await page.waitForFunction(() => {
    const v = document.querySelector('#video-scrub video');
    return v && v.readyState >= 1;
  }, null, { timeout: 15000 }).catch(() => check(false, 'video-scrub: the film never loaded its metadata'));
  const rows = await sweep('video-scrub', (n) => {
    const s = document.getElementById(n);
    const v = s.querySelector('video');
    return { t: v.currentTime, chapter: s.querySelector('[aria-current="step"]')?.textContent?.trim().slice(0, 24) ?? null };
  }, 30);
  const ts = rows.map((r) => r.t);
  check(Math.max(...ts) > 3, `video-scrub: the film never got past ${Math.max(...ts).toFixed(2)}s`);
  check(ts.every((t, i) => i === 0 || t >= ts[i - 1] - 0.05), `video-scrub: the film ran backwards while scrolling down (${ts.map((t) => t.toFixed(2)).join(' ')})`);
  check(new Set(rows.map((r) => r.chapter).filter(Boolean)).size >= 3, 'video-scrub: fewer than three chapters took a turn');
}

// ── reading-progress: the bar fills with the article ─────────────────────────
{
  const rows = await sweep('reading-progress', (n) => {
    const s = document.getElementById(n);
    const bar = s.querySelector('[class*="reading-progress"]');
    return bar ? new DOMMatrix(getComputedStyle(bar).transform).a : null;
  }, 20);
  const fills = rows.filter((v) => v !== null);
  check(fills.length > 0, 'reading-progress: no bar found');
  check(Math.max(...fills) > 0.9, `reading-progress: the bar never filled (max ${Math.max(...fills).toFixed(2)})`);
  check(fills.some((v) => v > 0.2 && v < 0.8), 'reading-progress: the bar jumped instead of filling');
  check(fills.every((v, i) => i === 0 || v >= fills[i - 1] - 0.01), 'reading-progress: the bar emptied while reading down');
}

check(errors.length === 0, `console or page errors: ${errors.join(' | ')}`);
await browser.close();

if (failures.length) {
  console.error(`✗ ${failures.length} block check(s) failed:\n` + failures.map((f) => `  ${f}`).join('\n'));
  process.exit(1);
}
console.log('✓ the blocks work on /blocks (pinned-feature-tour, horizontal-case-strip, video-scrub, reading-progress)');
