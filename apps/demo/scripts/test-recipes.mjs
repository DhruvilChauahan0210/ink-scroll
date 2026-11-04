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
import http from 'node:http';
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

async function open(browser, html, { reducedMotion = 'no-preference', width = 1280, height = 800, url = null } = {}) {
  const page = await browser.newPage({ viewport: { width, height }, reducedMotion });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.route('https://unpkg.com/**', (r) => r.fulfill({ contentType: 'text/javascript', body: cdn }));
  await page.route('https://cdn.jsdelivr.net/npm/svg-scroll-draw@*/dist/**', (r) => {
    const file = resolve(dist, new URL(r.request().url()).pathname.split('/dist/')[1]);
    return r.fulfill({ contentType: 'text/javascript', body: readFileSync(file, 'utf8') });
  });
  if (url) {
    await page.goto(url);
  } else {
    await page.route('http://recipe.test/', (r) => r.fulfill({ contentType: 'text/html', body: html }));
    await page.goto('http://recipe.test/');
  }
  await page.waitForTimeout(150);
  return { page, errors };
}

/**
 * A local server for recipes that load media. Browsers seek a <video> only
 * when the server answers Range requests, so a route that hands back the whole
 * file would make a scrubbing recipe look broken when it is not.
 */
const MEDIA = { 'film.webm': resolve(here, '../public/showcase/aural-fdc4222c.webm') };
const server = http.createServer((req, res) => {
  const [, slug, file] = new URL(req.url, 'http://x').pathname.split('/');
  if (file in MEDIA) {
    const buf = readFileSync(MEDIA[file]);
    const m = /bytes=(\d+)-(\d*)/.exec(req.headers.range || '');
    if (!m) {
      res.writeHead(200, { 'content-type': 'video/webm', 'content-length': buf.length, 'accept-ranges': 'bytes' });
      return res.end(buf);
    }
    const a = Number(m[1]);
    const b = m[2] ? Number(m[2]) : buf.length - 1;
    res.writeHead(206, { 'content-type': 'video/webm', 'content-range': `bytes ${a}-${b}/${buf.length}`, 'content-length': b - a + 1, 'accept-ranges': 'bytes' });
    return res.end(buf.subarray(a, b + 1));
  }
  res.writeHead(200, { 'content-type': 'text/html' });
  res.end(readFileSync(resolve(recipes, slug, 'index.html')));
});
await new Promise((ok) => server.listen(0, ok));
const origin = `http://localhost:${server.address().port}`;

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

// ── scroll-counter (the stat row) ────────────────────────────────────────────
{
  const html = readFileSync(resolve(recipes, 'scroll-counter/index.html'), 'utf8');
  const name = 'scroll-counter/index.html';
  const FINAL = ['1,284,500', '3,410', '41.2', '86'];

  const read = (page) =>
    page.evaluate(() => ({
      run: [...document.querySelectorAll('.stat-run')].map((el) => el.textContent),
      sr: [...document.querySelectorAll('.stat-sr')].map((el) => el.textContent.replace(/\u00a0/g, ' ')),
      widths: [...document.querySelectorAll('.stat-num')].map((el) => el.getBoundingClientRect().width),
    }));
  /** Scroll so the row's bottom sits at `pct` of the viewport height. */
  const rowBottomAt = async (page, pct) => {
    await page.evaluate((pct) => {
      const r = document.querySelector('.stats').getBoundingClientRect();
      scrollTo(0, r.bottom + scrollY - innerHeight * pct);
    }, pct);
    await page.waitForTimeout(400);
  };

  check(FINAL.every((v) => html.includes(`>${v}</span>`)), `${name}: the HTML does not carry the real numbers`);

  const { page, errors } = await open(browser, html);
  const start = await read(page);
  check(start.run.join() === '0,0,0.0,0', `${name}: not counting from zero before the row arrives (${start.run})`);
  check(start.sr.join() === '1,284,500,3,410 ha,41.2k t,86%', `${name}: screen-reader text is not the final values (${start.sr})`);

  await rowBottomAt(page, 1.0); // top entered, bottom not yet in: part-way
  const mid = await read(page);
  const n = (t) => Number(t.replace(/,/g, ''));
  check(mid.run.every((t, i) => n(t) > 0 && n(t) < n(FINAL[i])), `${name}: not mid-count part-way in (${mid.run})`);

  await rowBottomAt(page, 0.88); // just fully in view
  const done = await read(page);
  check(done.run.join() === FINAL.join(), `${name}: not finished once the row is fully in view (${done.run})`);
  check(done.widths.every((w, i) => Math.abs(w - start.widths[i]) < 0.5), `${name}: the numbers changed width while counting (${start.widths} → ${done.widths})`);
  check(errors.length === 0, `${name}: page errors: ${errors.join(' | ')}`);
  await page.close();

  const rm = await open(browser, html, { reducedMotion: 'reduce' });
  check((await read(rm.page)).run.join() === FINAL.join(), `${name}: reduced motion did not show the final values at once`);
  await rm.page.close();

  const phone = await open(browser, html, { width: 390, height: 844 });
  const cols = await phone.page.evaluate(() => getComputedStyle(document.querySelector('.stats')).gridTemplateColumns.split(' ').length);
  const over = await phone.page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  check(cols === 2 && over === 0, `${name}: phone layout off (${cols} columns, ${over}px overflow)`);
  await phone.page.close();
}

// ── scroll-video (the pinned film) ───────────────────────────────────────────
{
  const name = 'scroll-video/index.html';
  const url = `${origin}/scroll-video/index.html`;

  const read = (page) =>
    page.evaluate(() => {
      const v = document.getElementById('film');
      const items = [...document.querySelectorAll('.film-copy li')];
      return {
        t: v.currentTime,
        d: Number.isFinite(v.duration) ? v.duration : null,
        top: Math.round(v.getBoundingClientRect().top),
        current: items.findIndex((li) => li.getAttribute('aria-current') === 'step'),
        shown: items.filter((li) => getComputedStyle(li).display !== 'none' && getComputedStyle(li).opacity === '1').length,
      };
    });
  /** Scroll to film progress p: the track's top at the viewport's top is 0, its bottom at the viewport's bottom is 1. */
  const toProgress = async (page, p) => {
    await page.evaluate((p) => {
      const t = document.getElementById('track');
      const top = t.getBoundingClientRect().top + scrollY;
      scrollTo(0, top + p * (t.offsetHeight - innerHeight));
    }, p);
    await page.waitForTimeout(450);
  };
  const ready = (page) => page.waitForFunction(() => document.getElementById('film').readyState >= 1, null, { timeout: 8000 });
  const near = (a, b) => Math.abs(a - b) <= 0.12;

  const { page, errors } = await open(browser, null, { url });
  await ready(page);
  await toProgress(page, 0);
  let s = await read(page);
  check(near(s.t, 0) && s.current === 0, `${name}: not at the start of the film (${s.t.toFixed(2)}s, chapter ${s.current})`);

  await toProgress(page, 0.3);
  const top30 = (await read(page)).top;
  await toProgress(page, 0.6);
  s = await read(page);
  check(near(s.t, 0.6 * s.d), `${name}: at 0.6 of the track the film is at ${s.t.toFixed(2)}s, not ${(0.6 * s.d).toFixed(2)}s`);
  check(s.current === 1, `${name}: chapter 2 not shown at 0.6 (${s.current})`);
  check(Math.abs(s.top - top30) <= 1, `${name}: the stage is not stuck (${top30}px → ${s.top}px)`);

  // A resize mid-pin must re-measure the track, not the stuck video.
  await page.setViewportSize({ width: 1240, height: 800 });
  await page.waitForTimeout(400);
  await toProgress(page, 0.8);
  s = await read(page);
  check(near(s.t, 0.8 * s.d) && s.current === 2, `${name}: after a resize, 0.8 of the track is ${s.t.toFixed(2)}s / chapter ${s.current}`);

  await toProgress(page, 1);
  s = await read(page);
  check(near(s.t, s.d), `${name}: not at the end of the film at the end of the track (${s.t.toFixed(2)}s of ${s.d.toFixed(2)}s)`);
  check(errors.length === 0, `${name}: page errors: ${errors.join(' | ')}`);
  await page.close();

  // Reduced motion: the last frame, and every chapter readable.
  const rm = await open(browser, null, { url, reducedMotion: 'reduce' });
  await ready(rm.page);
  await toProgress(rm.page, 0.2);
  s = await read(rm.page);
  check(near(s.t, s.d), `${name}: reduced motion did not show the last frame (${s.t.toFixed(2)}s)`);
  check(s.shown === 3, `${name}: under reduced motion ${s.shown} of 3 chapters are readable`);
  await rm.page.close();

  // A phone: one screen, one chapter, nothing wider than the screen.
  const phone = await open(browser, null, { url, width: 390, height: 844 });
  await ready(phone.page);
  await toProgress(phone.page, 0.5);
  const fit = await phone.page.evaluate(() => {
    const stage = document.querySelector('.film-stage').getBoundingClientRect();
    const shown = [...document.querySelectorAll('.film-copy li')].filter((li) => getComputedStyle(li).display !== 'none').length;
    return { h: stage.height, vh: innerHeight, shown, over: document.documentElement.scrollWidth - innerWidth };
  });
  check(fit.h <= fit.vh + 1 && fit.shown === 1 && fit.over === 0, `${name}: phone layout off (${JSON.stringify(fit)})`);
  await phone.page.close();
}

// ── horizontal-scroll-sections (the case-study strip) ────────────────────────
{
  const name = 'horizontal-scroll-sections/index.html';
  const url = `${origin}/horizontal-scroll-sections/index.html`;

  const read = (page) =>
    page.evaluate(() => {
      const work = document.getElementById('work');
      const stage = work.querySelector('.work-stage');
      const track = work.querySelector('.work-track');
      const cs = getComputedStyle(stage);
      const box = stage.getBoundingClientRect();
      const left = box.left + parseFloat(cs.paddingLeft);
      const right = box.right - parseFloat(cs.paddingRight);
      const cases = [...track.children].map((li) => li.getBoundingClientRect());
      return {
        x: new DOMMatrix(getComputedStyle(track).transform).m41,
        travel: track.scrollWidth - (right - left),
        runway: work.offsetHeight - innerHeight,
        firstL: cases[0].left - left,
        lastR: cases[cases.length - 1].right - right,
        stageTop: Math.round(box.top),
        count: work.querySelector('.work-count b').textContent,
        fill: new DOMMatrix(getComputedStyle(work.querySelector('.work-rail span')).transform).a,
        over: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        // The count and the rail stay on screen while the track overflows the stage.
        headIn: ['.work-count', '.work-rail'].every((sel) => work.querySelector(sel).getBoundingClientRect().right <= right + 0.5),
      };
    });
  /** Scroll to strip progress p: the runway's top at the viewport's top is 0, its bottom at the viewport's bottom is 1. */
  const toProgress = async (page, p) => {
    await page.evaluate((p) => {
      const w = document.getElementById('work');
      const top = w.getBoundingClientRect().top + scrollY;
      scrollTo(0, top + p * (w.offsetHeight - innerHeight));
    }, p);
    await page.waitForTimeout(300);
  };
  const px = (a, b) => Math.abs(a - b) <= 1.5;

  for (const [width, height] of [[1280, 800], [390, 844]]) {
    const at = `${name} at ${width}px`;
    const { page, errors } = await open(browser, null, { url, width, height });
    let s = await read(page);
    check(s.travel > 0 && px(s.runway, s.travel), `${at}: the runway (${s.runway}px) is not the strip's travel (${s.travel}px)`);
    check(s.over === 0, `${at}: the page scrolls sideways by ${s.over}px`);
    check(s.headIn, `${at}: the count or the rail is past the stage's edge`);

    await toProgress(page, 0);
    s = await read(page);
    check(px(s.x, 0) && px(s.firstL, 0) && s.count === '01', `${at}: not on the first case at the start (${JSON.stringify(s)})`);

    // A pixel of scroll moves the strip a pixel, while the stage stays stuck.
    await toProgress(page, 0.4);
    const a = await read(page);
    await page.evaluate(() => scrollBy(0, 100));
    await page.waitForTimeout(300);
    const b = await read(page);
    check(px(a.x - b.x, 100), `${at}: 100px of scroll moved the strip ${(a.x - b.x).toFixed(1)}px`);
    check(a.stageTop === 0 && b.stageTop === 0, `${at}: the stage is not stuck (${a.stageTop}, ${b.stageTop})`);

    await toProgress(page, 1);
    s = await read(page);
    check(px(s.lastR, 0), `${at}: the last case ends ${s.lastR.toFixed(1)}px from the stage's edge`);
    check(s.count === '04' && px(s.fill, 1), `${at}: at the end the count reads ${s.count} and the rail ${s.fill.toFixed(2)}`);
    check(errors.length === 0, `${at}: page errors: ${errors.join(' | ')}`);
    await page.close();
  }

  // Keyboard: Tab from the top through every case. Each link lands in view,
  // and the stage itself never scrolls (it would, with overflow: hidden).
  {
    const { page } = await open(browser, null, { url });
    for (let i = 0; i < 4; i++) {
      for (let k = 0; k < 3; k++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(350);
        const at = await page.evaluate(() => [...document.querySelectorAll('.work-link')].indexOf(document.activeElement));
        if (at === i) break;
      }
      const f = await page.evaluate(() => {
        const a = document.activeElement;
        const r = a.getBoundingClientRect();
        return {
          link: [...document.querySelectorAll('.work-link')].indexOf(a),
          inView: r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight,
          scrollLeft: document.querySelector('.work-stage').scrollLeft,
        };
      });
      check(f.link === i && f.inView && f.scrollLeft === 0, `${name}: case ${i + 1}'s link, reached with Tab: ${JSON.stringify(f)}`);
    }
    await page.close();
  }

  // A narrower window part-way along: the runway and the travel are re-measured.
  {
    const { page } = await open(browser, null, { url });
    await toProgress(page, 0.5);
    await page.setViewportSize({ width: 820, height: 800 });
    await page.waitForTimeout(450);
    let s = await read(page);
    check(px(s.runway, s.travel), `${name}: after a resize the runway (${s.runway}px) is not the travel (${s.travel}px)`);
    await toProgress(page, 1);
    s = await read(page);
    check(px(s.lastR, 0), `${name}: after a resize the last case ends ${s.lastR.toFixed(1)}px from the stage's edge`);
    await page.close();
  }

  // Reduced motion: it still scrubs, so every case can be reached.
  {
    const { page } = await open(browser, null, { url, reducedMotion: 'reduce' });
    await toProgress(page, 0);
    const first = await read(page);
    await toProgress(page, 1);
    const last = await read(page);
    check(px(first.firstL, 0) && px(last.lastR, 0), `${name}: under reduced motion the strip does not run from the first case to the last`);
    await page.close();
  }
}

await browser.close();
server.close();

if (failures.length) {
  console.error(`✗ ${failures.length} recipe check(s) failed:\n` + failures.map((f) => `  ${f}`).join('\n'));
  process.exit(1);
}
console.log('✓ every recipe file works in a browser (logo-reveal, scroll-pin, scroll-counter, scroll-video, horizontal-scroll-sections)');
