#!/usr/bin/env node
/**
 * Runs every tool's "Run it" page in a real browser and checks the effect runs.
 *
 * Why: each tool hands out a complete HTML file for its current
 * settings (lib/tool-export.ts htmlFile()), downloaded or opened in
 * StackBlitz. Nothing else on the site runs those files, so a tool whose page
 * throws, imports the wrong entry or animates nothing would ship unnoticed.
 *
 * How: scripts/tool-pages.ts builds each page from the tool's own code module
 * with the settings the tool starts with. It is bundled with esbuild and run in
 * Chromium, because several tools read the drawing with DOMParser and measure
 * it laid out before they write the page. Each page is then loaded with the
 * library's jsDelivr URLs served from this repo's packages/svg-scroll-draw/dist
 * (as test-recipes.mjs does), scrolled top to bottom in steps, and checked:
 *
 *   - one or two assertions that the effect ran (a dash drawn part-way and then
 *     fully, a transform or an opacity that moves with the scroll, a CSS
 *     animation that exists and runs, an SVG that renders);
 *   - no page errors and no console errors;
 *   - no request anywhere but the page, the routed library files, the
 *     site's own demo film (served from apps/demo/public), and the image
 *     sequence page's frames/ (drawn as WebP in the builder page below).
 *
 * Every slug in data/tools.ts must have a case here, so a new tool cannot be
 * skipped. Run `npm run build:lib` first: the pages load the built dist/.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { chromium } from 'playwright';

const here = dirname(fileURLToPath(import.meta.url));
const demo = resolve(here, '..');
const dist = resolve(here, '../../../packages/svg-scroll-draw/dist');
const version = JSON.parse(readFileSync(resolve(here, '../../../packages/svg-scroll-draw/package.json'), 'utf8')).version;
const FILM = { url: 'https://svg-scroll-draw.vercel.app/showcase/aural-fdc4222c.webm', file: resolve(demo, 'public/showcase/aural-fdc4222c.webm') };
const ORIGIN = 'http://tools.test';

if (!existsSync(resolve(dist, 'index.mjs'))) {
  console.error('✗ test-tools: no dist/ build — run `npm run build:lib` first.');
  process.exit(1);
}

const started = Date.now();
const failures = [];
const fail = (name, msg) => failures.push(`${name}: ${msg}`);

// ── Build every page in the browser ──────────────────────────────────────────

const bundle = await build({
  entryPoints: [resolve(here, 'tool-pages.ts')],
  bundle: true,
  format: 'iife',
  globalName: 'toolPages',
  platform: 'browser',
  write: false,
  tsconfig: resolve(demo, 'tsconfig.json'),
  logLevel: 'warning',
});

const browser = await chromium.launch();
/** The image sequence page's frames, by URL. */
const STILLS = new Map();
let slugs;
let pages;
{
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.setContent('<!doctype html><html><body></body></html>');
  await page.addScriptTag({ content: bundle.outputFiles[0].text });
  ({ slugs, pages } = await page.evaluate((v) => ({ slugs: window.toolPages.slugs, pages: window.toolPages.build(v) }), version));
  // The frames the image sequence page's video variant asks for
  // (frames/frame_0001.webp …): 24 stills, each a different picture.
  const stills = await page.evaluate(async () => {
    const c = document.createElement('canvas');
    c.width = 320;
    c.height = 240;
    const ctx = c.getContext('2d');
    const out = {};
    for (let i = 0; i < 24; i++) {
      ctx.fillStyle = `hsl(${i * 15} 70% 45%)`;
      ctx.fillRect(0, 0, 320, 240);
      ctx.fillStyle = '#fff';
      ctx.fillRect(20 + i * 11, 100, 24, 40);
      const blob = await new Promise((done) => c.toBlob(done, 'image/webp', 0.8));
      const bytes = new Uint8Array(await blob.arrayBuffer());
      out[`frame_${String(i + 1).padStart(4, '0')}.webp`] = Array.from(bytes);
    }
    return out;
  });
  for (const [name, bytes] of Object.entries(stills)) STILLS.set(`${ORIGIN}/frames/${name}`, Buffer.from(bytes));
  await page.close();
  if (errors.length) {
    console.error(`✗ test-tools: building the pages threw:\n  ${errors.join('\n  ')}`);
    process.exit(1);
  }
}

// ── Serving: the page, the library from dist/, the film with Range support ──

const TYPES = { '.mjs': 'text/javascript', '.js': 'text/javascript', '.css': 'text/css', '.map': 'application/json' };
const film = readFileSync(FILM.file);

/** A page with every request answered here, and anything else refused and recorded. */
async function open(name, html, { reducedMotion = 'no-preference' } = {}) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion });
  const page = await context.newPage();
  const problems = [];
  page.on('pageerror', (e) => problems.push(`page error: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') problems.push(`console error: ${m.text()}`); });

  await context.route('**/*', async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    if (req.url() === `${ORIGIN}/`) return route.fulfill({ contentType: 'text/html', body: html });
    const lib = /^https:\/\/cdn\.jsdelivr\.net\/npm\/svg-scroll-draw@[^/]+\/dist\/(.+)$/.exec(req.url());
    if (lib) {
      const file = resolve(dist, lib[1]);
      if (!file.startsWith(dist + sep) || !existsSync(file)) {
        problems.push(`asked for ${req.url()}, which dist/ does not have`);
        return route.fulfill({ status: 404, body: '' });
      }
      const ext = file.slice(file.lastIndexOf('.'));
      return route.fulfill({ contentType: TYPES[ext] ?? 'application/octet-stream', body: readFileSync(file) });
    }
    if (url.origin === ORIGIN && url.pathname.startsWith('/frames/')) {
      const still = STILLS.get(req.url());
      if (!still) problems.push(`asked for ${req.url()}, which is not one of the frames`);
      return still ? route.fulfill({ contentType: 'image/webp', body: still }) : route.fulfill({ status: 404, body: '' });
    }
    if (req.url() === FILM.url) {
      // A browser seeks a <video> only when the server answers Range requests.
      const m = /bytes=(\d+)-(\d*)/.exec(req.headers().range ?? '');
      const headers = { 'content-type': 'video/webm', 'accept-ranges': 'bytes', 'access-control-allow-origin': '*' };
      if (!m) return route.fulfill({ status: 200, headers, body: film });
      const a = Number(m[1]);
      const b = m[2] ? Math.min(Number(m[2]), film.length - 1) : film.length - 1;
      return route.fulfill({ status: 206, headers: { ...headers, 'content-range': `bytes ${a}-${b}/${film.length}` }, body: film.subarray(a, b + 1) });
    }
    if (url.protocol === 'data:' || url.protocol === 'blob:') return route.continue();
    problems.push(`request outside the routed CDN: ${req.method()} ${req.url()}`);
    return route.abort();
  });

  await page.goto(`${ORIGIN}/`);
  await settle(page);
  return { page, problems, close: () => context.close() };
}

// ── Helpers, run in the page ─────────────────────────────────────────────────

/** Two frames: whatever the library queued on the last scroll has run. */
const settle = (page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));

/** Scroll the window to `f` of the way down (0 top, 1 bottom) and let it settle. */
async function scrollTo(page, f) {
  await page.evaluate((f) => scrollTo(0, f * (document.documentElement.scrollHeight - innerHeight)), f);
  await settle(page);
}

/** Read `expr` (a function in the page) at each of `steps` + 1 scroll positions, top to bottom. */
async function walk(page, expr, steps = 12) {
  const seen = [];
  for (let i = 0; i <= steps; i++) {
    await scrollTo(page, i / steps);
    seen.push(await page.evaluate(expr));
  }
  return seen;
}

/** Wait, a frame at a time, until `pred(expr())` holds; the last value if it never does. */
async function until(page, expr, pred, ms = 5000) {
  const end = Date.now() + ms;
  let v;
  for (;;) {
    v = await page.evaluate(expr);
    if (pred(v)) return { ok: true, v };
    if (Date.now() > end) return { ok: false, v };
    await settle(page);
  }
}

/** How much of each matched stroke is drawn (1 − dashoffset ÷ dash length); 1 where there is no dash. */
const drawn = (sel) => `(() => [...document.querySelectorAll(${JSON.stringify(sel)})].map((el) => {
  const cs = getComputedStyle(el);
  const len = parseFloat(cs.strokeDasharray);
  return Number.isFinite(len) && len > 0 ? 1 - parseFloat(cs.strokeDashoffset) / len : 1;
}))()`;
/** One computed property of each match. */
const styles = (sel, prop) => `[...document.querySelectorAll(${JSON.stringify(sel)})].map((el) => getComputedStyle(el).getPropertyValue(${JSON.stringify(prop)}))`;
/** The running animations on each match (CSS animations, transitions and Web Animations). */
const animations = (sel) => `[...document.querySelectorAll(${JSON.stringify(sel)})].map((el) => el.getAnimations().map((a) => a.animationName ?? a.constructor.name))`;
/** translateX of each match's transform. */
const shiftX = (sel) => `[...document.querySelectorAll(${JSON.stringify(sel)})].map((el) => new DOMMatrix(getComputedStyle(el).transform).m41)`;
/** scaleX (the matrix's a) of each match's transform. */
const scaleX = (sel) => `[...document.querySelectorAll(${JSON.stringify(sel)})].map((el) => new DOMMatrix(getComputedStyle(el).transform).a)`;

const f2 = (xs) => xs.map((x) => (typeof x === 'number' ? x.toFixed(2) : x)).join(' ');
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / (xs.length || 1);

// ── Shared checks ────────────────────────────────────────────────────────────

/**
 * A line drawn by the scroll: undrawn at the top, part-drawn somewhere on the
 * way down (so it follows the scroll and does not just jump), drawn at the end.
 */
async function drawsOnScroll(t, sel, { min = 1 } = {}) {
  const top = await t.page.evaluate(drawn(sel));
  if (top.length < min) return t.fail(`expected at least ${min} shape(s) at ${sel}, found ${top.length}`);
  if (!top.every((f) => f < 0.02)) t.fail(`${sel} drawn before any scroll (${f2(top)})`);
  const seen = (await walk(t.page, drawn(sel))).map(mean);
  if (!seen.some((f) => f > 0.05 && f < 0.95)) t.fail(`${sel} never part-drawn while scrolling (${f2(seen)})`);
  const end = await until(t.page, drawn(sel), (v) => v.every((f) => f > 0.99));
  if (!end.ok) t.fail(`${sel} not fully drawn at the bottom (${f2(end.v)})`);
}

/** A number that moves with the scroll: `read` at the top, then different somewhere on the way down. */
async function movesOnScroll(t, expr, what) {
  const top = JSON.stringify(await t.page.evaluate(expr));
  const seen = (await walk(t.page, expr)).map((v) => JSON.stringify(v));
  if (!seen.some((v) => v !== top)) t.fail(`${what} never changed while scrolling (stayed ${top})`);
  return seen;
}

/**
 * Stacking cards: walked top to bottom, every card is seen stuck at its own
 * stepped offset, the first one shrinks once the next lands on it, and the
 * last one never does.
 */
async function stackingCards(t) {
  const read = () => [...document.querySelectorAll('.stack-card')].map((c) => {
    const cs = getComputedStyle(c);
    return { at: c.getBoundingClientRect().top, top: parseFloat(cs.top), scale: cs.scale === 'none' ? 1 : Number(cs.scale) };
  });
  const top = await t.page.evaluate(read);
  if (top.length < 2) return t.fail(`expected the cards, found ${top.length}`);
  if (!top.every((c) => c.scale === 1)) t.fail(`a card is shrunk before the stack arrives (${f2(top.map((c) => c.scale))})`);
  const seen = await walk(t.page, read, 24);
  const stuck = top.map((_, i) => seen.some((s) => Math.abs(s[i].at - s[i].top) < 1));
  if (!stuck.every(Boolean)) t.fail(`not every card stuck at its own top (${stuck.join(' ')})`);
  if (new Set(top.map((c) => c.top)).size !== top.length) t.fail(`the cards do not stick at stepped offsets (${f2(top.map((c) => c.top))})`);
  if (!seen.some((s) => s[0].scale < 0.95)) t.fail(`the first card never shrank (${f2(seen.map((s) => s[0].scale))})`);
  if (seen.some((s) => s[s.length - 1].scale !== 1)) t.fail('the last card shrank, with nothing landing on it');
}

// ── Known failures ───────────────────────────────────────────────────────────

/**
 * Bugs in a tool's page that this check found, by key, with what is wrong.
 * Their failures are printed but do not fail the run; once the page is fixed
 * the run fails until the entry is taken out, so the fix is noticed.
 */
const KNOWN = {};

// ── One case per tool ────────────────────────────────────────────────────────
// Keys are slugs, or `slug:variant` for a second output of the same tool. Each
// case gets t = { page, fail }; the page is open at the top and settled.

const CASES = {
  'text-animation-generator': async (t) => {
    // scrollText's word pieces (the spaces between are pieces of their own, never hidden).
    const words = '#headline [style*="inline-block"]';
    const n = await t.page.evaluate((sel) => document.querySelectorAll(sel).length, words);
    if (n !== 6) t.fail(`the headline was not split into its 6 words (${n} pieces)`);
    const op = styles(words, 'opacity');
    const top = (await t.page.evaluate(op)).map(Number);
    if (!top.every((o) => o < 0.05)) t.fail(`words visible before the headline arrives (${f2(top)})`);
    await walk(t.page, op);
    const end = await until(t.page, op, (v) => v.every((o) => Number(o) > 0.99));
    if (!end.ok) t.fail(`words not all shown at the bottom (${end.v.join(' ')})`);
  },
  'text-fill-scroll-generator': async (t) => {
    const anims = await t.page.evaluate(animations('.text-fill > span'));
    if (!anims[0]?.includes('text-fill')) t.fail(`no text-fill animation on the text (${JSON.stringify(anims)})`);
    await movesOnScroll(t, styles('.text-fill > span', 'background-size'), 'the fill');
  },
  'text-fill-scroll-generator:text': async (t) => {
    const op = styles('.text-fill [style]', 'opacity');
    const n = (await t.page.evaluate(op)).length;
    if (n < 2) t.fail(`the text was not split (${n} styled pieces)`);
    await movesOnScroll(t, op, 'the words’ opacity');
  },
  'text-fill-scroll-generator:progress': async (t) => {
    const p = () => Number(getComputedStyle(document.querySelector('.text-fill')).getPropertyValue('--scroll-progress'));
    const seen = await walk(t.page, p);
    if (!seen.some((v) => v > 0.1 && v < 0.9)) t.fail(`--scroll-progress never part-way (${f2(seen)})`);
    await movesOnScroll(t, styles('.text-fill > span', 'background-size'), 'the fill');
  },
  'typewriter-effect-generator': async (t) => {
    const anims = (await t.page.evaluate(animations('.typewriter')))[0] ?? [];
    if (!anims.includes('typing') || !anims.includes('caret')) t.fail(`expected the typing and caret animations, found ${JSON.stringify(anims)}`);
    const w = () => document.querySelector('.typewriter').getBoundingClientRect().width;
    const a = await t.page.evaluate(w);
    const moved = await until(t.page, w, (v) => Math.abs(v - a) > 5);
    if (!moved.ok) t.fail(`the line did not type (width stayed ${a.toFixed(1)}px)`);
  },
  'typewriter-effect-generator:scroll': async (t) => {
    // The letters: scrollText wraps each word in a piece of its own, which stays shown.
    const op = styles('.typed [style*="inline-block"]:not(:has(*))', 'opacity');
    const top = (await t.page.evaluate(op)).map(Number);
    if (top.length < 20) t.fail(`the line was not split into letters (${top.length} pieces)`);
    if (!top.every((o) => o === 0)) t.fail('letters typed before scrolling');
    const seen = (await walk(t.page, op, 16)).map((v) => v.filter((o) => Number(o) === 1).length);
    if (!seen.some((k) => k > 0 && k < top.length)) t.fail(`never part-typed while scrolling (${seen.join(' ')} of ${top.length})`);
    const end = await until(t.page, op, (v) => v.every((o) => Number(o) === 1));
    if (!end.ok) t.fail('not every letter typed at the bottom');
  },
  'typewriter-effect-generator:typer': async (t) => {
    const text = () => document.querySelector('.typer-text').textContent;
    const a = await t.page.evaluate(text);
    const typed = await until(t.page, text, (v) => v !== a);
    if (!typed.ok) t.fail(`the typer typed nothing (text stayed ${JSON.stringify(a)})`);
    const next = await until(t.page, text, (v) => v.startsWith('I type'), 8000);
    if (!next.ok) t.fail(`the typer never got to the second phrase (${JSON.stringify(next.v)})`);
  },
  'counter-animation-generator': async (t) => {
    const text = () => document.querySelector('#stat').textContent;
    const top = await t.page.evaluate(text);
    if (top !== '0') t.fail(`not counting from 0 before the number arrives (${top})`);
    await walk(t.page, text);
    const end = await until(t.page, text, (v) => v === '1,250,000');
    if (!end.ok) t.fail(`did not count to 1,250,000 (${end.v})`);
  },
  'scroll-reveal-generator': async (t) => {
    const op = styles('.card', 'opacity');
    const top = (await t.page.evaluate(op)).map(Number);
    if (!top.every((o) => o < 0.05)) t.fail(`cards visible before they arrive (${f2(top)})`);
    await walk(t.page, op);
    const end = await until(t.page, op, (v) => v.every((o) => Number(o) > 0.99));
    if (!end.ok) t.fail(`cards not all revealed at the bottom (${end.v.join(' ')})`);
  },
  'parallax-scrolling-generator': async (t) => {
    const layers = ['#sky', '#mountains', '#hills', '#ground'];
    const ys = (sels) => sels.map((s) => new DOMMatrix(getComputedStyle(document.querySelector(s)).transform).m42);
    const top = await t.page.evaluate(ys, layers);
    const seen = [];
    for (let i = 0; i <= 12; i++) {
      await scrollTo(t.page, i / 12);
      seen.push(await t.page.evaluate(ys, layers));
    }
    const still = layers.filter((_, k) => seen.every((v) => Math.abs(v[k] - top[k]) < 1));
    if (still.length) t.fail(`${still.join(', ')} never moved while scrolling`);
    // Each at its own speed: somewhere on the way they are apart.
    if (!seen.some((v) => new Set(v.map((y) => Math.round(y))).size === layers.length)) t.fail('the layers moved together: no depth');
  },
  'scroll-progress-bar-generator': async (t) => progressBar(t),
  'scroll-progress-bar-generator:css': async (t) => progressBar(t),
  'css-scroll-driven-animation-generator': async (t) => {
    const anims = await t.page.evaluate(animations('.reveal'));
    if (!anims.every((a) => a.length > 0)) t.fail(`a card has no scroll-driven animation (${JSON.stringify(anims)})`);
    await movesOnScroll(t, styles('.reveal', 'opacity'), 'the cards’ opacity');
  },
  'css-scroll-driven-animation-generator:js': async (t) => {
    const op = styles('.reveal', 'opacity');
    const top = (await t.page.evaluate(op)).map(Number);
    if (top[0] > 0.05) t.fail(`the first card is shown before it arrives (${f2(top)})`);
    await movesOnScroll(t, op, 'the cards’ opacity');
  },
  'css-keyframes-animation-generator': async (t) => {
    const anims = (await t.page.evaluate(animations('.demo-card')))[0] ?? [];
    const finished = await t.page.evaluate(async () => {
      const a = document.querySelector('.demo-card').getAnimations()[0];
      if (!a) return null;
      await a.finished;
      return getComputedStyle(document.querySelector('.demo-card')).opacity;
    });
    if (!anims.length || finished === null) return t.fail('the card has no animation');
    if (Number(finished) < 0.99) t.fail(`the card did not end visible (opacity ${finished})`);
    // Replay runs it again.
    await t.page.click('.demo-replay');
    const again = await t.page.evaluate(() => document.querySelector('.demo-card').getAnimations().filter((a) => a.playState === 'running').length);
    if (!again) t.fail('Replay did not run the animation again');
  },
  'css-scroll-snap-generator': async (t) => snapNext(t),
  'css-scroll-snap-generator:js': async (t) => {
    await snapNext(t);
    // The previous glide must be over, or the nudge below joins it.
    await t.page.evaluate(() => new Promise((done) => {
      const box = document.querySelector('.snap');
      let last = box.scrollLeft, still = 0;
      const tick = () => {
        still = box.scrollLeft === last ? still + 1 : 0;
        last = box.scrollLeft;
        if (still >= 10) setTimeout(done, 150); else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }));
    // Stopped part-way past 30% of a section: it glides on to the next one.
    const step = await t.page.evaluate(offAt(2));
    await t.page.evaluate((x) => document.querySelector('.snap').scrollBy(x, 0), step * 0.45);
    const at = await until(t.page, offAt(2), (v) => Math.abs(v) < 2);
    if (!at.ok) t.fail(`scrollSnap did not glide on to section 3 after stopping 45% of the way to it (it starts ${at.v}px from the edge)`);
  },
  'horizontal-scroll-generator': async (t) => horizontal(t),
  'horizontal-scroll-generator:css': async (t) => horizontal(t),
  'scroll-marquee-generator': async (t) => marquee(t),
  'scroll-marquee-generator:css': async (t) => marquee(t),
  'scroll-pin-generator': async (t) => {
    const read = () => {
      const stage = document.querySelector('.tour-stage');
      return { pos: getComputedStyle(stage).position, current: [...document.querySelectorAll('.tour-step')].findIndex((s) => s.getAttribute('aria-current') === 'step') };
    };
    const seen = await walk(t.page, read);
    if (!seen.some((s) => s.pos === 'fixed')) t.fail(`the stage never pinned (${seen.map((s) => s.pos).join(' ')})`);
    if (!seen.some((s) => s.current === 3)) t.fail(`never reached the last step (${seen.map((s) => s.current).join(' ')})`);
    const d = await t.page.evaluate(drawn('.tour-step path'));
    if (!d.every((f) => f > 0.99)) t.fail(`the steps’ lines not drawn after the tour (${f2(d)})`);
  },
  'scroll-pin-generator:css': async (t) => {
    const anims = await t.page.evaluate(animations('.tour-step'));
    if (!anims.every((a) => a.length > 0)) t.fail(`a step has no scroll-driven animation (${JSON.stringify(anims)})`);
    const seen = await walk(t.page, () => [...document.querySelectorAll('.tour-step')].map((s) => getComputedStyle(s).opacity).join(), 24);
    if (new Set(seen).size < 3) t.fail(`the steps did not take turns while scrolling (${[...new Set(seen)].join(' | ')})`);
  },
  'stacking-cards-scroll-generator': async (t) => stackingCards(t),
  'stacking-cards-scroll-generator:js': async (t) => stackingCards(t),
  'scroll-video-scrub-generator': async (t) => {
    const ready = await until(t.page, () => document.querySelector('#film').readyState, (v) => v >= 1, 8000);
    if (!ready.ok) return t.fail('the film never loaded its metadata');
    const time = () => document.querySelector('#film').currentTime;
    if ((await t.page.evaluate(time)) > 0.05) t.fail('the film is not at its start before scrolling');
    const seen = await walk(t.page, time);
    if (!seen.some((s) => s > 0.5 && s < 4.5)) t.fail(`the film never scrubbed part-way (${f2(seen)})`);
    const end = await until(t.page, time, (v) => Math.abs(v - 4.98) < 0.1);
    if (!end.ok) t.fail(`the film did not reach 4.98s at the end of the track (${end.v})`);
  },
  'scroll-image-sequence-generator': async (t) => frameScrub(t),
  'scroll-image-sequence-generator:video': async (t) => frameScrub(t),
  'cubic-bezier-generator': async (t) => {
    await easingRun(t);
    // The CSS tab's card: Play moves it along its transition.
    const x = () => document.querySelector('.card').getBoundingClientRect().left;
    await scrollTo(t.page, 0);
    const a = await t.page.evaluate(x);
    await t.page.click('#play');
    const moved = await until(t.page, x, (v) => Math.abs(v - a) > 5);
    if (!moved.ok) t.fail('Play did not move the card');
  },
  'easing-visualizer': async (t) => easingRun(t),
  'svg-path-viewer': async (t) => drawsOnScroll(t, '#drawing svg > *', { min: 4 }),
  'svg-path-editor': async (t) => drawsOnScroll(t, '#drawing path'),
  'svg-line-drawing-generator': async (t) => {
    // The CSS drawing on load: every shape animates and ends drawn.
    const css = '.line-drawing > *';
    const n = (await t.page.evaluate(animations(css))).filter((a) => a.includes('line-drawing-draw')).length;
    if (n < 10) t.fail(`only ${n} shapes carry the CSS draw animation`);
    const done = await t.page.evaluate(async () => {
      await Promise.all(document.querySelector('.line-drawing').getAnimations({ subtree: true }).map((a) => a.finished));
    }).then(() => t.page.evaluate(drawn('.line-drawing > *')));
    if (!done.every((f) => f > 0.99)) t.fail(`the CSS drawing did not finish drawn (${f2(done)})`);
    // The scroll version under it.
    await drawsOnScroll(t, '#drawing svg > *', { min: 10 });
  },
  'svg-morph-generator': async (t) => {
    const d = () => getComputedStyle(document.querySelector('#morph path')).d;
    const seen = await movesOnScroll(t, d, 'the path’s shape');
    if (new Set(seen).size < 3) t.fail('the path jumped between two shapes instead of morphing through the scroll');
  },
  'svg-shape-to-path-converter': async (t) => drawsOnScroll(t, '#drawing path', { min: 5 }),
  'svg-to-jsx-converter': async (t) => rendersSvg(t, '#drawing svg'),
  'svg-to-jsx-converter:wrap': async (t) => drawsOnScroll(t, '#drawing path', { min: 4 }),
  'svg-wave-generator': async (t) => {
    await rendersSvg(t, 'svg[viewBox="0 0 1440 200"]');
    const bg = await t.page.evaluate(() => getComputedStyle(document.querySelector('.wave-divider')).backgroundImage);
    if (!bg.startsWith('url("data:image/svg+xml')) t.fail(`the CSS divider has no SVG background (${bg.slice(0, 60)})`);
    const h = await t.page.evaluate(() => document.querySelector('.wave-divider').getBoundingClientRect().height);
    if (h < 10) t.fail(`the CSS divider has no height (${h}px)`);
  },
  'svg-wave-generator:line': async (t) => drawsOnScroll(t, '#wave path', { min: 3 }),
  'svg-blob-generator': async (t) => {
    await rendersSvg(t, '.intro svg');
    await drawsOnScroll(t, '#blob path');
  },
  'scroll-trigger-visualizer': async (t) => {
    await drawsOnScroll(t, '#drawing path');
    const n = await t.page.evaluate(() => document.querySelector('.readout b').textContent);
    if (n !== '1.00') t.fail(`the readout does not say 1.00 at the bottom (${n})`);
  },
  'aos-animation': async (t) => {
    const n = await t.page.evaluate(() => document.querySelectorAll('[data-aos]').length);
    if (n !== 27) t.fail(`expected 27 [data-aos] cards, found ${n}`);
    const shown = () => document.querySelectorAll('[data-aos].aos-animate').length;
    const atTop = await t.page.evaluate(shown);
    if (atTop >= n) t.fail('every card animated in before scrolling');
    await walk(t.page, shown);
    const last = '[data-aos="flip-right"]';
    const end = await until(t.page, `document.querySelector('${last}').classList.contains('aos-animate')`, (v) => v);
    if (!end.ok) t.fail('the last card never got aos-animate');
    const op = await until(t.page, styles('[data-aos="fade-up"]', 'opacity'), (v) => Number(v[0]) > 0.99);
    if (!op.ok) t.fail(`fade-up did not fade in (opacity ${op.v[0]})`);
  },
};

/** The canvas's picture, as a number: drawn down to 24×16 and hashed ('' before anything is drawn). */
const canvasHash = `(() => {
  const c = document.querySelector('#frames');
  if (!c || !c.width) return '';
  const s = document.createElement('canvas');
  s.width = 24;
  s.height = 16;
  const x = s.getContext('2d');
  x.drawImage(c, 0, 0, 24, 16);
  const d = x.getImageData(0, 0, 24, 16).data;
  let h = 0;
  for (let i = 0; i < d.length; i += 4) h = (h * 31 + d[i] + d[i + 1] * 3 + d[i + 2] * 7) >>> 0;
  return h;
})()`;
const framesProgress = `Number(document.querySelector('#frames').style.getPropertyValue('--scroll-draw-progress') || -1)`;

/** scrollFrames: a first frame drawn, the picture changing frame by frame down the page, progress 1 at the end. */
async function frameScrub(t) {
  const a11y = await t.page.evaluate(() => {
    const c = document.querySelector('#frames');
    return c ? { role: c.getAttribute('role'), label: c.getAttribute('aria-label') } : null;
  });
  if (!a11y) return t.fail('no canvas#frames');
  if (a11y.role !== 'img' || !a11y.label) t.fail(`the canvas has no role="img" and aria-label (${JSON.stringify(a11y)})`);
  const first = await until(t.page, framesProgress, (v) => v >= 0, 10000);
  if (!first.ok) return t.fail('scrollFrames never ran (no --scroll-draw-progress on the canvas)');
  // Every frame in: on a page this short, the last loads within a second.
  await until(t.page, canvasHash, (v) => v !== '', 5000);
  const seen = [];
  for (let i = 0; i <= 16; i++) {
    await scrollTo(t.page, i / 16);
    await t.page.waitForTimeout(60);
    await settle(t.page);
    seen.push({ p: await t.page.evaluate(framesProgress), h: await t.page.evaluate(canvasHash) });
  }
  const pictures = new Set(seen.map((s) => s.h)).size;
  if (pictures < 6) t.fail(`the canvas showed only ${pictures} different pictures over 17 scroll positions`);
  if (!seen.some((s) => s.p > 0.2 && s.p < 0.8)) t.fail(`progress never part-way (${f2(seen.map((s) => s.p))})`);
  const end = await until(t.page, framesProgress, (v) => v > 0.999);
  if (!end.ok) t.fail(`progress not 1 at the bottom (${end.v})`);
}

async function progressBar(t) {
  const bar = scaleX('.progress-bar');
  const top = (await t.page.evaluate(bar))[0];
  if (!(top < 0.02)) t.fail(`the bar is not empty at the top (scaleX ${top})`);
  const seen = (await walk(t.page, bar)).map((v) => v[0]);
  if (!seen.some((s) => s > 0.3 && s < 0.7)) t.fail(`the bar never part-full (${f2(seen)})`);
  const end = await until(t.page, bar, (v) => v[0] > 0.99);
  if (!end.ok) t.fail(`the bar not full at the bottom (${end.v[0]})`);
}

/** The scroll marquee: rows that move apart with the scroll, a drift, a copy screen readers skip, a pause that holds. */
async function marquee(t) {
  const shift = shiftX('.mq-shift');
  const top = await t.page.evaluate(shift);
  if (top.length !== 2) return t.fail(`expected 2 rows, found ${top.length}`);
  const seen = await walk(t.page, shift);
  if (!seen.some((v) => v[0] < top[0] - 5 && v[1] > top[1] + 5)) t.fail(`the rows never moved opposite ways with the scroll (${seen.map(f2).join(' | ')})`);
  const copies = await t.page.evaluate(() => [...document.querySelectorAll('.mq-row')].every((r) =>
    r.querySelectorAll('.mq-set').length === 2 && r.querySelectorAll('.mq-set[aria-hidden="true"]').length === 1));
  if (!copies) t.fail('a row does not hold its items twice, the copy aria-hidden');
  const anims = await t.page.evaluate(animations('.mq-track'));
  if (!anims.every((a) => a.includes('mq-drift'))) t.fail(`a track does not drift (${JSON.stringify(anims)})`);
  const x = shiftX('.mq-track');
  const a = await t.page.evaluate(x);
  const moving = await until(t.page, x, (v) => v.every((n, i) => Math.abs(n - a[i]) > 2));
  if (!moving.ok) t.fail(`the drift does not move (${f2(a)} → ${f2(moving.v)})`);
  await t.page.click('.mq-pause');
  await settle(t.page);
  const p0 = await t.page.evaluate(x);
  await t.page.waitForTimeout(300);
  const p1 = await t.page.evaluate(x);
  if (p0.some((n, i) => Math.abs(n - p1[i]) > 0.01)) t.fail(`Pause motion did not stop the drift (${f2(p0)} → ${f2(p1)})`);
}

async function horizontal(t) {
  const x = shiftX('.hs-track');
  const seen = (await walk(t.page, x, 16)).map((v) => v[0]);
  if (!(seen[0] > -1)) t.fail(`the strip has moved before scrolling (${seen[0]})`);
  const travel = await t.page.evaluate(() => {
    const track = document.querySelector('.hs-track');
    return track.scrollWidth - track.parentElement.clientWidth;
  });
  if (!seen.some((v) => v < -travel * 0.2 && v > -travel * 0.8)) t.fail(`the strip never part-way along (${f2(seen)}, travel ${travel})`);
  if (!seen.some((v) => Math.abs(v + travel) < 2)) t.fail(`the strip never reached its end (${f2(seen)}, travel ${travel})`);
}

/** How far section `i` starts from the snapport's start edge, in px. */
const offAt = (i) => `(() => {
  const snap = document.querySelector('.snap');
  const box = snap.getBoundingClientRect();
  const line = box.left + snap.clientLeft + (parseFloat(getComputedStyle(snap).scrollPaddingLeft) || 0);
  return snap.children[${i}].getBoundingClientRect().left - line;
})()`;

async function snapNext(t) {
  await t.page.click('[data-snap="next"]');
  const at = await until(t.page, offAt(1), (v) => Math.abs(v) < 2);
  if (!at.ok) t.fail(`Next did not land on section 2 (it starts ${at.v}px from the snapport's edge)`);
}

/** The bezier and easing pages: two lines drawn and two dots moved through #run, the readout counting. */
async function easingRun(t) {
  await drawsOnScroll(t, '.ink', { min: 2 });
  await scrollTo(t.page, 0);
  await movesOnScroll(t, styles('.dot', 'left'), 'the dots');
  const out = await t.page.evaluate(() => document.querySelector('#in').textContent);
  if (out !== '1.000') t.fail(`the progress readout does not say 1.000 at the bottom (${out})`);
}

/** A still drawing: the SVG has a size, and every shape in it has a box. */
async function rendersSvg(t, sel) {
  const r = await t.page.evaluate((sel) => {
    const svg = document.querySelector(sel);
    if (!svg) return null;
    const box = svg.getBoundingClientRect();
    const shapes = [...svg.querySelectorAll('path, line, polyline, polygon, rect, circle, ellipse')].map((el) => {
      const b = el.getBBox();
      return b.width + b.height;
    });
    return { w: box.width, h: box.height, shapes };
  }, sel);
  if (!r) return t.fail(`no ${sel}`);
  if (r.w < 10 || r.h < 10) t.fail(`${sel} renders ${r.w}×${r.h}`);
  if (!r.shapes.length || r.shapes.some((s) => !(s > 0))) t.fail(`${sel} has an empty shape (${r.shapes.join(' ')})`);
}

// ── Run ──────────────────────────────────────────────────────────────────────

const missing = slugs.filter((s) => !CASES[s]);
if (missing.length) {
  console.error(`✗ test-tools: no case for ${missing.join(', ')} — add one to scripts/test-tools.mjs (and its page to tool-pages.ts).`);
  process.exit(1);
}
const unbuilt = Object.keys(CASES).filter((k) => !(k in pages));
const unchecked = Object.keys(pages).filter((k) => !(k in CASES));
if (unbuilt.length || unchecked.length) {
  console.error(`✗ test-tools: tool-pages.ts and the cases disagree — not built: ${unbuilt.join(', ') || 'none'}; no case: ${unchecked.join(', ') || 'none'}`);
  process.exit(1);
}

const ran = [];
const known = [];
await Promise.all(
  chunk(Object.keys(CASES), 4).map(async (keys) => {
    for (const key of keys) {
      const t0 = Date.now();
      const { page, problems, close } = await open(key, pages[key]);
      const found = [];
      const t = { page, fail: (msg) => found.push(msg) };
      try {
        await CASES[key](t);
      } catch (e) {
        found.push(`threw: ${e.message.split('\n')[0]}`);
      }
      // Errors and stray requests from anywhere in the run, scroll included.
      found.push(...new Set(problems));
      await close();
      if (KNOWN[key]) {
        if (found.length) known.push(`${key}: ${KNOWN[key]}\n    ${found.join('\n    ')}`);
        else fail(key, 'passes now: take it out of KNOWN in scripts/test-tools.mjs');
      } else {
        found.forEach((msg) => fail(key, msg));
      }
      ran.push(`${key} ${Date.now() - t0}ms`);
    }
  }),
);

await browser.close();

/** `xs` dealt into `n` lists, round robin, for that many pages at once. */
function chunk(xs, n) {
  const out = Array.from({ length: n }, () => []);
  xs.forEach((x, i) => out[i % n].push(x));
  return out;
}

const secs = ((Date.now() - started) / 1000).toFixed(1);
if (process.env.TOOLS_VERBOSE) console.log(ran.join('\n'));
if (known.length) console.warn(`! ${known.length} known tool page bug(s), not failing the run:\n  ${known.join('\n  ')}`);
if (failures.length) {
  console.error(`✗ ${failures.length} tool page check(s) failed (${secs}s):\n` + failures.map((f) => `  ${f}`).join('\n'));
  process.exit(1);
}
console.log(`✓ every tool's Run it page works in a browser: ${slugs.length} tools, ${Object.keys(CASES).length} pages (${secs}s)`);
