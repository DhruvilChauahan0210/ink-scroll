#!/usr/bin/env node
/**
 * GSAP vs svg-scroll-draw: the runtime benchmark behind
 * /benchmarks/gsap-vs-svg-scroll-draw.
 *
 * Loads each scenario page in public/benchmarks/gsap/ with ?lib=none|gsap|ours|ours-js,
 * scrolls it with the same gesture, and records what the main thread paid. The
 * pages point at pinned jsDelivr URLs; here those requests are answered from
 * node_modules/gsap/dist and packages/svg-scroll-draw/dist/cdn (unmodified files),
 * after checking the local versions are the ones the URLs name. The page a
 * reader opens and the page measured are the same file.
 *
 * Order of work, per browser:
 *   1. parity gate: every library must leave the same elements in the same state
 *      at the same scroll positions (1%), or the run stops; and svg-scroll-draw
 *      must have taken the engine (native CSS or JS) the cell is labelled with.
 *   2. timed runs: warm-up rounds discarded, then N rounds; each round runs every
 *      cell once in a seeded shuffle, in a fresh browser, one context per run.
 *   3. trace runs (Chromium): the paint / style / script split, and dropped frames.
 * Then medians, p90 and a bootstrap 95% CI of the difference in medians per metric;
 * a side "wins" a metric only when that interval excludes zero.
 *
 *   npm run bench:gsap                       # full run, all browsers (hours)
 *   npm run bench:gsap -- --quick            # 3 runs, one speed, marked provisional
 *   npm run bench:gsap -- --smoke            # parity gate and engine check only
 *   ... --browser=chromium --scenario=a-draw-one,b2-draw-stagger --runs=5 --out=/tmp/x.json
 *
 * The library must be built first (npm run build:lib); the root script does that.
 */
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { execFileSync } from 'node:child_process';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import { createRequire } from 'node:module';
import { chromium, firefox, webkit } from 'playwright';
import { closure, entryFile, measure } from '../../../packages/svg-scroll-draw/scripts/bundle-size.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const appDir = resolve(here, '..');
const repoRoot = resolve(appDir, '../..');
const pagesDir = resolve(appDir, 'public/benchmarks/gsap');
const require = createRequire(import.meta.url);

/* ── Options ─────────────────────────────────────────────────────────────── */

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(`--${name}`);
const opt = (name, fallback) => {
  const hit = argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};

const QUICK = flag('quick');
const SMOKE = flag('smoke');
const ALL_SCENARIOS = ['a-draw-one', 'b1-draw-many', 'b2-draw-stagger', 'c1-reveal-idiomatic', 'c2-reveal-matched', 'd-pin-scrub'];
const LIBS = {
  'a-draw-one': ['none', 'gsap', 'ours', 'ours-js'],
  'b1-draw-many': ['none', 'gsap', 'ours', 'ours-js'],
  'b2-draw-stagger': ['none', 'gsap', 'ours'],
  'c1-reveal-idiomatic': ['none', 'gsap', 'ours'],
  'c2-reveal-matched': ['none', 'gsap', 'ours'],
  'd-pin-scrub': ['none', 'gsap', 'ours'],
};
/** Scenarios whose default svg-scroll-draw setup can take the native CSS path. */
const NATIVE_ELIGIBLE = new Set(['a-draw-one', 'b1-draw-many']);

const browsersArg = opt('browser', 'all');
const BROWSERS = browsersArg === 'all' ? ['chromium', 'firefox', 'webkit'] : browsersArg.split(',');
const SCENARIOS = opt('scenario', ALL_SCENARIOS.join(',')).split(',');
for (const s of SCENARIOS) if (!LIBS[s]) die(`unknown scenario "${s}" (one of ${ALL_SCENARIOS.join(', ')})`);
for (const b of BROWSERS) if (!['chromium', 'firefox', 'webkit'].includes(b)) die(`unknown browser "${b}"`);

const RUNS = Number(opt('runs', QUICK ? 3 : 15));
const WARMUP = Number(opt('warmup', QUICK ? 1 : 2));
const TRACES = Number(opt('traces', QUICK ? 1 : 5));
const SPEEDS = opt('speeds', QUICK ? '3000' : '800,3000').split(',').map(Number);
const THROTTLES = opt('throttles', '1,4').split(',').map(Number);
const DPR = Number(opt('dpr', 1));
const SEED = Number(opt('seed', 20261113));
const IDLE_MS = 3000;
const PORT = Number(opt('port', process.env.BENCH_PORT ?? 4319));
const NETWORK = flag('network');
const PROVISIONAL = QUICK || flag('provisional') || RUNS < 10;
const OUT = resolve(opt('out', join(appDir, 'src/data/bench-gsap.json')));
const VIEWPORT = { width: 1280, height: 800 };
// The committed file holds every scenario in every browser: a partial run must
// write somewhere else, so no cell can be dropped from what the page renders.
const PARTIAL = SCENARIOS.length !== ALL_SCENARIOS.length || BROWSERS.length !== 3;
if (PARTIAL && !SMOKE && !argv.some((a) => a.startsWith('--out='))) {
  die('a run limited by --scenario or --browser needs --out=<file>; only a full run writes src/data/bench-gsap.json.');
}

function die(msg) {
  console.error(`✗ bench-gsap: ${msg}`);
  process.exit(1);
}

/* ── Versions: the URLs in shared.js must name the files served for them ── */

const shared = readFileSync(join(pagesDir, 'shared.js'), 'utf8');
const urlGsap = shared.match(/GSAP_VERSION = '([^']+)'/)?.[1];
const urlOurs = shared.match(/OURS_VERSION = '([^']+)'/)?.[1];
// The scenario pages carry svg-scroll-draw's no-flash.css inline: it has to be the shipped file.
const inlineNoFlash = JSON.parse(shared.match(/var NO_FLASH_CSS = ("(?:[^"\\]|\\.)*");/)?.[1] ?? 'null');
if (inlineNoFlash !== readFileSync(join(repoRoot, 'packages/svg-scroll-draw/no-flash.css'), 'utf8')) {
  die('shared.js NO_FLASH_CSS differs from packages/svg-scroll-draw/no-flash.css. Copy the file in again.');
}
const gsapPkg = JSON.parse(readFileSync(require.resolve('gsap/package.json'), 'utf8'));
const oursPkg = JSON.parse(readFileSync(join(repoRoot, 'packages/svg-scroll-draw/package.json'), 'utf8'));
const gsapDist = join(dirname(require.resolve('gsap/package.json')), 'dist');
const oursDist = join(repoRoot, 'packages/svg-scroll-draw/dist');

if (urlGsap !== gsapPkg.version) die(`shared.js loads gsap@${urlGsap} but node_modules has ${gsapPkg.version}.`);
if (!NETWORK && urlOurs !== oursPkg.version) {
  die(`shared.js loads svg-scroll-draw@${urlOurs} but the package is ${oursPkg.version}. Update OURS_VERSION in public/benchmarks/gsap/shared.js.`);
}
if (!existsSync(join(oursDist, 'index.mjs'))) die('packages/svg-scroll-draw/dist is missing: run npm run build:lib.');

/* ── Power: a laptop on battery throttles itself ─────────────────────────── */

let power = 'unknown';
if (process.platform === 'darwin') {
  try {
    const batt = execFileSync('pmset', ['-g', 'batt'], { encoding: 'utf8' });
    power = /AC Power/.test(batt) ? 'ac' : /Battery Power/.test(batt) ? 'battery' : 'unknown';
  } catch { /* not fatal */ }
}
if (power === 'battery' && !PROVISIONAL && !SMOKE && !flag('allow-battery')) {
  die('on battery power. Plug in, or pass --allow-battery (the results will say so).');
}

/* ── Static server: the scenario pages, gzip -9, no caching ──────────────── */

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };
const server = createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (url.pathname === '/__blank') {
    res.writeHead(200, { 'Content-Type': 'text/html' }).end('<!doctype html><title>blank</title>');
    return;
  }
  const rel = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '');
  const path = join(pagesDir, rel);
  if (!path.startsWith(pagesDir) || !existsSync(path) || statSync(path).isDirectory()) {
    res.writeHead(404).end('Not found');
    return;
  }
  const body = gzipSync(readFileSync(path), { level: 9 });
  res.writeHead(200, {
    'Content-Type': TYPES[extname(path)] ?? 'application/octet-stream',
    'Content-Encoding': 'gzip',
    'Content-Length': body.length,
    'Cache-Control': 'no-store',
  });
  res.end(body);
});
await new Promise((ok, fail) => server.listen(PORT, ok).on('error', fail));
const BASE = `http://localhost:${PORT}`;

/** jsDelivr URL → local file, unmodified. Records what each page loaded. */
const served = new Map();
function localFor(url) {
  const g = url.match(/\/npm\/gsap@([^/]+)\/dist\/([\w.]+\.js)$/);
  if (g) return join(gsapDist, g[2]);
  // no-flash.css sits at the package root, beside dist/ (2.28.0).
  if (/\/npm\/svg-scroll-draw@[^/]+\/no-flash\.css$/.test(url)) return join(oursDist, '..', 'no-flash.css');
  const o = url.match(/\/npm\/svg-scroll-draw@[^/]+\/dist\/([\w./-]+\.mjs)$/);
  if (o) {
    const file = join(oursDist, normalize(o[1]));
    return file.startsWith(oursDist + '/') ? file : null;
  }
  return null;
}
async function routeLibraries(context) {
  if (NETWORK) return;
  await context.route('https://cdn.jsdelivr.net/**', async (route) => {
    const file = localFor(route.request().url());
    if (!file) return route.abort();
    served.set(route.request().url(), file);
    const css = file.endsWith('.css');
    await route.fulfill({
      status: 200,
      contentType: css ? 'text/css; charset=utf-8' : 'text/javascript; charset=utf-8',
      // The pages read no-flash.css with a request from localhost: as jsDelivr does, allow it.
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: readFileSync(file),
    });
  });
}

/* ── Seeded randomness (shuffles and the bootstrap) ──────────────────────── */

function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(SEED);
const shuffle = (a) => {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
};

/* ── Statistics ──────────────────────────────────────────────────────────── */

const sorted = (xs) => xs.filter((x) => x != null && Number.isFinite(x)).sort((a, b) => a - b);
function quantile(s, q) {
  if (!s.length) return null;
  const pos = (s.length - 1) * q;
  const lo = Math.floor(pos), hi = Math.ceil(pos);
  return s[lo] + (s[hi] - s[lo]) * (pos - lo);
}
const round = (x, d = 3) => (x == null ? null : Math.round(x * 10 ** d) / 10 ** d);
function summarize(xs) {
  const s = sorted(xs);
  if (!s.length) return null;
  return {
    n: s.length,
    median: round(quantile(s, 0.5)),
    p90: round(quantile(s, 0.9)),
    min: round(s[0]),
    max: round(s.at(-1)),
    iqr: round(quantile(s, 0.75) - quantile(s, 0.25)),
  };
}
/** 95% bootstrap CI of median(a) − median(b), 10k resamples. */
function bootstrapDiff(a, b, reps = 10_000) {
  const A = sorted(a), B = sorted(b);
  if (A.length < 2 || B.length < 2) return null;
  const med = (xs, n) => {
    const r = Array.from({ length: n }, () => xs[Math.floor(rand() * n)]).sort((x, y) => x - y);
    return quantile(r, 0.5);
  };
  const diffs = new Float64Array(reps);
  for (let i = 0; i < reps; i++) diffs[i] = med(A, A.length) - med(B, B.length);
  diffs.sort();
  return [round(diffs[Math.floor(reps * 0.025)]), round(diffs[Math.floor(reps * 0.975)])];
}

/* ── The metrics ─────────────────────────────────────────────────────────── */

/** Every metric in the results; lower is better for all of them. */
const METRICS = {
  mainMs: { label: 'Main-thread script + style + layout during the scroll', unit: 'ms', browsers: ['chromium'] },
  scriptMs: { label: 'Script during the scroll', unit: 'ms', browsers: ['chromium'] },
  styleMs: { label: 'Style recalculation during the scroll', unit: 'ms', browsers: ['chromium'] },
  layoutMs: { label: 'Layout during the scroll', unit: 'ms', browsers: ['chromium'] },
  taskMs: { label: 'All main-thread tasks during the scroll', unit: 'ms', browsers: ['chromium'] },
  frameP50: { label: 'Frame interval, median', unit: 'ms', browsers: ['chromium', 'firefox', 'webkit'] },
  frameP95: { label: 'Frame interval, p95', unit: 'ms', browsers: ['chromium', 'firefox', 'webkit'] },
  frameP99: { label: 'Frame interval, p99', unit: 'ms', browsers: ['chromium', 'firefox', 'webkit'] },
  jankPct: { label: 'Frames longer than 1.5 × vsync', unit: '%', browsers: ['chromium', 'firefox', 'webkit'] },
  longestFrame: { label: 'Longest frame', unit: 'ms', browsers: ['chromium', 'firefox', 'webkit'] },
  longtaskCount: { label: 'Long tasks (> 50 ms)', unit: '', browsers: ['chromium'] },
  longtaskBlockMs: { label: 'Long-task blocking time', unit: 'ms', browsers: ['chromium'] },
  loafBlockMs: { label: 'Long-animation-frame blocking time', unit: 'ms', browsers: ['chromium'] },
  inputDelay: { label: 'Tap input delay during the scroll', unit: 'ms', browsers: ['chromium', 'firefox', 'webkit'] },
  tapToFrame: { label: 'Tap to next frame during the scroll', unit: 'ms', browsers: ['chromium', 'firefox', 'webkit'] },
  initMs: { label: 'Setup call', unit: 'ms', browsers: ['chromium', 'firefox', 'webkit'] },
  startupTaskMs: { label: 'Main-thread work from navigation to ready', unit: 'ms', browsers: ['chromium'] },
  firstCorrectMs: { label: 'First frame in the correct starting state', unit: 'ms', browsers: ['chromium', 'firefox', 'webkit'] },
  flash: { label: 'Runs that showed the finished state first', unit: 'share', browsers: ['chromium', 'firefox', 'webkit'] },
  idleTaskMs: { label: `Main-thread work while parked ${IDLE_MS / 1000} s`, unit: 'ms', browsers: ['chromium'] },
  idleRafCalls: { label: `requestAnimationFrame calls while parked ${IDLE_MS / 1000} s`, unit: '', browsers: ['chromium', 'firefox', 'webkit'] },
  heapMb: { label: 'JS heap after ready', unit: 'MB', browsers: ['chromium'] },
  tracePaintMs: { label: 'Paint, pre-paint, layerize and commit (trace)', unit: 'ms', browsers: ['chromium'], trace: true },
  traceStyleLayoutMs: { label: 'Style and layout (trace)', unit: 'ms', browsers: ['chromium'], trace: true },
  traceScriptMs: { label: 'Script, including rAF callbacks (trace)', unit: 'ms', browsers: ['chromium'], trace: true },
  droppedFrames: { label: 'Dropped frames (trace)', unit: '', browsers: ['chromium'], trace: true },
};

/* ── Browsers ────────────────────────────────────────────────────────────── */

const ENGINES = { chromium, firefox, webkit };
async function launch(name) {
  if (name === 'chromium') {
    return chromium.launch({
      // New headless: the full browser, which paces frames like a headed one
      // (the old headless shell does not).
      channel: 'chromium',
      args: ['--disable-renderer-backgrounding', '--disable-background-timer-throttling', '--disable-backgrounding-occluded-windows'],
    });
  }
  if (name === 'firefox') return firefox.launch({ firefoxUserPrefs: { 'general.smoothScroll': false } });
  return ENGINES[name].launch();
}

async function newPage(browser) {
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: DPR,
    reducedMotion: 'no-preference',
    locale: 'en-US',
  });
  await routeLibraries(context);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  return { context, page, errors };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const frames = (page, n = 2) => page.evaluate((k) => new Promise((ok) => {
  const step = () => (k-- > 0 ? requestAnimationFrame(step) : ok());
  step();
}), n);

async function load(page, scenario, lib) {
  await page.goto(`${BASE}/${scenario}.html?lib=${lib}`, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  // GSAP's load-time refresh and svg-scroll-draw's debounced measure both settle.
  await sleep(1000);
  await frames(page);
  await page.evaluate(() => window.bench.ready());
}

function expectedPath(scenario, lib, native) {
  if (lib === 'none' || lib === 'gsap') return null;
  if (lib === 'ours-js') return 'js';
  return NATIVE_ELIGIBLE.has(scenario) && native ? 'native' : 'js';
}

/* ── Parity gate ─────────────────────────────────────────────────────────── */

const POSITIONS = Array.from({ length: 11 }, (_, i) => i / 10);
const TOLERANCE = { draw: 0.01, opacity: 0.01, ty: 0.32 };

async function sampleLib(browser, scenario, lib) {
  const { context, page, errors } = await newPage(browser);
  await load(page, scenario, lib);
  const info = await page.evaluate(() => ({
    path: window.bench.path(),
    kind: window.bench.kind,
    maxScroll: window.bench.maxScroll(),
    initial: window.bench.sample(),
  }));
  const samples = [];
  for (const p of POSITIONS) {
    await page.evaluate((y) => window.scrollTo(0, y), Math.round(p * info.maxScroll));
    await frames(page, 3);
    await sleep(50);
    samples.push(await page.evaluate(() => window.bench.sample()));
  }
  // One more look once every tween has had time to end: C1's timed tweens
  // stagger across a batch, so give them up to 10 s.
  let settled = null;
  for (const until = Date.now() + 10_000; ;) {
    await sleep(250);
    settled = await page.evaluate(() => window.bench.sample());
    const done = info.kind === 'draw' || settled.every(([o, y]) => o > 0.99 && Math.abs(y) < 0.5);
    if (done || Date.now() > until) break;
  }
  await context.close();
  return { ...info, samples, settled, errors };
}

function compareStates(kind, a, b) {
  let max = 0;
  for (let i = 0; i < a.length; i++) {
    if (kind === 'draw') max = Math.max(max, Math.abs(a[i] - b[i]) / TOLERANCE.draw);
    else max = Math.max(max, Math.abs(a[i][0] - b[i][0]) / TOLERANCE.opacity, Math.abs(a[i][1] - b[i][1]) / TOLERANCE.ty);
  }
  return max; // in units of the tolerance: ≤ 1 passes
}

async function parity(browser, browserName, native) {
  const results = [];
  for (const scenario of SCENARIOS) {
    const libs = LIBS[scenario].filter((l) => l !== 'none');
    const got = {};
    for (const lib of libs) got[lib] = await sampleLib(browser, scenario, lib);
    const entry = { browser: browserName, scenario, pairs: [], paths: {}, errors: [] };
    for (const lib of libs) {
      entry.paths[lib] = got[lib].path;
      const want = expectedPath(scenario, lib, native);
      if (got[lib].path !== want) entry.errors.push(`${lib} ran the ${got[lib].path} engine; the cell expects ${want}`);
      if (got[lib].errors.length) entry.errors.push(`${lib}: ${got[lib].errors.join(' | ')}`);
    }
    const kind = got.gsap.kind;
    if (process.env.BENCH_DEBUG) {
      for (const lib of libs) {
        const fmt = (st) => JSON.stringify(st.slice(0, 9).map((x) => (Array.isArray(x) ? x.map((v) => round(v, 2)) : round(x, 3))));
        console.log(`    ${lib} initial ${fmt(got[lib].initial)}`);
        got[lib].samples.forEach((smp, i) => console.log(`    ${lib} @${POSITIONS[i]} ${fmt(smp)}`));
        console.log(`    ${lib} settled ${fmt(got[lib].settled)}`);
      }
    }
    for (const lib of libs.filter((l) => l !== 'gsap')) {
      if (scenario === 'c1-reveal-idiomatic') {
        // Each library's own reveal: the motion differs by design. Both must hide
        // the cards before they enter, and show every one once it has.
        const hidden = (s) => s.every(([o]) => o < 0.01);
        const shown = (s) => s.every(([o, y]) => o > 0.99 && Math.abs(y) < 0.5);
        const pass = hidden(got.gsap.initial) && hidden(got[lib].initial) && shown(got.gsap.settled) && shown(got[lib].settled);
        entry.pairs.push({ a: 'gsap', b: lib, rule: 'start hidden, end shown', maxDiff: null, pass });
        if (!pass) entry.errors.push(`gsap vs ${lib}: cards not hidden at the start or not all shown at the end`);
        continue;
      }
      if (Math.abs(got.gsap.maxScroll - got[lib].maxScroll) > 2) {
        entry.errors.push(`gsap vs ${lib}: page heights differ (${got.gsap.maxScroll} vs ${got[lib].maxScroll})`);
      }
      let worst = compareStates(kind, got.gsap.initial, got[lib].initial);
      for (let i = 0; i < POSITIONS.length; i++) worst = Math.max(worst, compareStates(kind, got.gsap.samples[i], got[lib].samples[i]));
      const pass = worst <= 1;
      entry.pairs.push({ a: 'gsap', b: lib, rule: kind === 'draw' ? 'drawn share within 1%' : 'opacity within 0.01, translateY within 0.32px', maxDiff: round(worst, 3), pass });
      if (!pass) entry.errors.push(`gsap vs ${lib}: states differ by ${round(worst, 2)}× the tolerance`);
    }
    entry.pass = entry.errors.length === 0;
    console.log(`  parity ${browserName} ${scenario}: ${entry.pass ? 'pass' : 'FAIL'} ${entry.pairs.map((p) => `${p.b} ${p.maxDiff ?? p.rule}`).join(', ')}`);
    if (!entry.pass) console.log(`    ${entry.errors.join('\n    ')}`);
    results.push(entry);
  }
  return results;
}

/* ── One timed run ───────────────────────────────────────────────────────── */

const metricMap = (list) => Object.fromEntries(list.metrics.map((m) => [m.name, m.value]));

async function timedRun(browser, browserName, cell, native, trace) {
  const { context, page, errors } = await newPage(browser);
  const isChromium = browserName === 'chromium';
  let cdp = null;
  if (isChromium) {
    cdp = await context.newCDPSession(page);
    await page.goto(`${BASE}/__blank`);
    await cdp.send('Performance.enable');
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: cell.throttle });
  }
  const before = cdp ? metricMap(await cdp.send('Performance.getMetrics')) : null;
  await load(page, cell.scenario, cell.lib);
  const atReady = cdp ? metricMap(await cdp.send('Performance.getMetrics')) : null;

  const start = await page.evaluate(() => ({
    path: window.bench.path(),
    initMs: window.bench.initMs,
    firstCorrectMs: window.bench.firstCorrectMs,
    flash: window.bench.flash,
    maxScroll: window.bench.maxScroll(),
  }));
  const want = expectedPath(cell.scenario, cell.lib, native);
  if (start.path !== want) throw new Error(`${cell.scenario} ${cell.lib}: ran ${start.path}, expected ${want}`);

  const D = start.maxScroll;
  const expectedMs = (D / cell.speed) * 1000;
  const btn = await page.locator('#probe-btn').boundingBox();
  const bx = btn.x + btn.width / 2, by = btn.y + btn.height / 2;

  if (trace) await browser.startTracing(page, {
    categories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'disabled-by-default-devtools.timeline.frame', 'blink.user_timing', 'benchmark', 'loading'],
  });
  await page.evaluate(() => window.bench.startRecord());
  const m0 = cdp ? metricMap(await cdp.send('Performance.getMetrics')) : null;
  const t0 = Date.now();

  if (isChromium) {
    const clicks = [0.25, 0.5, 0.75].map((q) => sleep(expectedMs * q).then(() => page.mouse.click(bx, by)));
    await cdp.send('Input.synthesizeScrollGesture', {
      x: 640, y: 400, yDistance: -D, speed: cell.speed, gestureSourceType: 'mouse', preventFling: true,
    });
    await Promise.all(clicks);
  } else {
    // No synthetic gesture outside Chromium: fixed wheel steps at the same speed.
    const step = 100, steps = Math.ceil(D / step), every = (step / cell.speed) * 1000;
    const clickAt = new Set([0.25, 0.5, 0.75].map((q) => Math.floor(steps * q)));
    await page.mouse.move(640, 400);
    for (let i = 0; i < steps; i++) {
      await page.mouse.wheel(0, step);
      if (clickAt.has(i)) {
        await page.mouse.click(bx, by);
        await page.mouse.move(640, 400);
      }
      await sleep(every);
    }
  }
  await frames(page, 2);
  const gestureMs = Date.now() - t0;
  const m1 = cdp ? metricMap(await cdp.send('Performance.getMetrics')) : null;
  const rec = await page.evaluate(() => window.bench.stopRecord());
  let traceBuf = null;
  if (trace) traceBuf = await browser.stopTracing();
  await sleep(200);
  const probes = await page.evaluate(() => ({
    longtasks: window.bench.longtasks, loafs: window.bench.loafs, clicks: window.bench.clicks,
    noLongtask: !!window.bench.noLongtask, noLoaf: !!window.bench.noLoaf,
  }));

  // Parked mid-page: what each library costs when nothing moves.
  await page.evaluate((y) => window.scrollTo(0, y), Math.round(D / 2));
  await sleep(500);
  const r0 = await page.evaluate(() => window.bench.rafCalls());
  const i0 = cdp ? metricMap(await cdp.send('Performance.getMetrics')) : null;
  await sleep(IDLE_MS);
  const r1 = await page.evaluate(() => window.bench.rafCalls());
  const i1 = cdp ? metricMap(await cdp.send('Performance.getMetrics')) : null;

  await context.close();
  if (errors.length) throw new Error(`${cell.scenario} ${cell.lib}: page errors: ${errors.join(' | ')}`);

  const d = (a, b, k) => (a && b ? (b[k] - a[k]) * 1000 : null);
  const out = {};
  if (trace) Object.assign(out, parseTrace(traceBuf));
  else {
    const deltas = [];
    for (let i = 1; i < rec.frames.length; i++) deltas.push(rec.frames[i] - rec.frames[i - 1]);
    const s = sorted(deltas);
    const vsync = quantile(s, 0.5);
    const inWin = (t) => t >= rec.start && t <= rec.end;
    const lts = probes.longtasks.filter(([t]) => inWin(t));
    const loafs = probes.loafs.filter(([t]) => inWin(t));
    Object.assign(out, {
      mainMs: m0 ? d(m0, m1, 'ScriptDuration') + d(m0, m1, 'RecalcStyleDuration') + d(m0, m1, 'LayoutDuration') : null,
      scriptMs: d(m0, m1, 'ScriptDuration'),
      styleMs: d(m0, m1, 'RecalcStyleDuration'),
      layoutMs: d(m0, m1, 'LayoutDuration'),
      taskMs: d(m0, m1, 'TaskDuration'),
      frameP50: quantile(s, 0.5),
      frameP95: quantile(s, 0.95),
      frameP99: quantile(s, 0.99),
      jankPct: s.length ? (100 * s.filter((x) => x > 1.5 * vsync).length) / s.length : null,
      longestFrame: s.at(-1) ?? null,
      longtaskCount: probes.noLongtask ? null : lts.length,
      longtaskBlockMs: probes.noLongtask ? null : lts.reduce((a, [, dur]) => a + Math.max(0, dur - 50), 0),
      loafBlockMs: probes.noLoaf ? null : loafs.reduce((a, [, , b]) => a + b, 0),
      inputDelay: probes.clicks.length ? probes.clicks.reduce((a, [x]) => a + x, 0) / probes.clicks.length : null,
      tapToFrame: probes.clicks.length ? probes.clicks.reduce((a, [, x]) => a + x, 0) / probes.clicks.length : null,
      initMs: start.initMs,
      startupTaskMs: d(before, atReady, 'TaskDuration'),
      firstCorrectMs: start.firstCorrectMs,
      flash: cell.lib === 'none' ? null : start.flash ? 1 : 0,
      idleTaskMs: d(i0, i1, 'TaskDuration'),
      idleRafCalls: r1 - r0,
      heapMb: atReady ? atReady.JSHeapUsedSize / 1048576 : null,
      vsyncMs: vsync,
      gestureMs,
      clicks: probes.clicks.length,
    });
  }
  return { path: start.path, scroll: D, metrics: out };
}

/**
 * The main thread's split from a trace: inclusive durations of the top-level
 * events on the renderer main thread between the two user-timing marks.
 */
function parseTrace(buf) {
  const { traceEvents } = JSON.parse(buf.toString('utf8'));
  const markStart = traceEvents.find((e) => e.name === 'bench-gesture-start');
  const markEnd = traceEvents.find((e) => e.name === 'bench-gesture-end');
  if (!markStart || !markEnd) return { tracePaintMs: null, traceStyleLayoutMs: null, traceScriptMs: null, droppedFrames: null };
  const pid = markStart.pid;
  const mainTid = traceEvents.find((e) => e.pid === pid && e.name === 'thread_name' && e.args?.name === 'CrRendererMain')?.tid;
  const lo = markStart.ts, hi = markEnd.ts;
  const sum = (names) => traceEvents
    .filter((e) => e.pid === pid && e.tid === mainTid && e.ph === 'X' && e.ts >= lo && e.ts <= hi && names.includes(e.name))
    .reduce((a, e) => a + (e.dur ?? 0) / 1000, 0);
  const reporters = traceEvents.filter((e) => e.name === 'PipelineReporter' && e.ts >= lo && e.ts <= hi);
  const dropped = reporters.filter((e) => /DROPPED/.test(e.args?.chrome_frame_reporter?.state ?? '')).length;
  return {
    tracePaintMs: sum(['Paint', 'PrePaint', 'Layerize', 'Commit']),
    traceStyleLayoutMs: sum(['UpdateLayoutTree', 'Layout']),
    traceScriptMs: sum(['FunctionCall', 'EvaluateScript', 'FireAnimationFrame', 'TimerFire']),
    // Only counted when the build emits PipelineReporter events at all.
    droppedFrames: reporters.length ? dropped : null,
  };
}

/* ── Environment ─────────────────────────────────────────────────────────── */

async function environment(browser, name) {
  const { context, page } = await newPage(browser);
  await page.goto(`${BASE}/__blank`);
  const env = await page.evaluate(async () => {
    let gpu = null;
    try {
      const gl = document.createElement('canvas').getContext('webgl');
      const ext = gl && gl.getExtension('WEBGL_debug_renderer_info');
      gpu = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl ? gl.getParameter(gl.RENDERER) : null;
    } catch { /* none */ }
    const ts = [];
    await new Promise((ok) => {
      const step = (t) => { ts.push(t); if (ts.length < 61) requestAnimationFrame(step); else ok(); };
      requestAnimationFrame(step);
    });
    const d = ts.slice(1).map((t, i) => t - ts[i]).sort((a, b) => a - b);
    return {
      ua: navigator.userAgent,
      gpu,
      vsyncHz: Math.round(1000 / d[Math.floor(d.length / 2)]),
      nativeScrollTimeline: CSS.supports('animation-timeline: view()'),
    };
  });
  await context.close();
  return { name, version: browser.version(), ...env };
}

/* ── Main ────────────────────────────────────────────────────────────────── */

const gitSha = (() => {
  try {
    const sha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).trim();
    const dirty = execFileSync('git', ['status', '--porcelain'], { cwd: repoRoot, encoding: 'utf8' }).trim() !== '';
    return { sha, dirty };
  } catch {
    return { sha: null, dirty: null };
  }
})();

const results = { cells: [], parity: [], browsers: [] };
const started = Date.now();
let failed = false;

for (const browserName of BROWSERS) {
  const throttles = browserName === 'chromium' ? THROTTLES : [1];
  console.log(`\n${browserName}`);
  let browser = await launch(browserName);
  const env = await environment(browser, browserName);
  results.browsers.push(env);
  console.log(`  ${env.version}, ${env.vsyncHz} Hz, native scroll timelines: ${env.nativeScrollTimeline}, GPU: ${env.gpu}`);

  const gate = await parity(browser, browserName, env.nativeScrollTimeline);
  results.parity.push(...gate);
  if (gate.some((g) => !g.pass)) {
    failed = true;
    await browser.close();
    continue;
  }
  if (SMOKE) {
    await browser.close();
    continue;
  }

  const cells = [];
  for (const scenario of SCENARIOS) for (const lib of LIBS[scenario]) for (const throttle of throttles) for (const speed of SPEEDS) {
    cells.push({ browser: browserName, scenario, lib, throttle, speed, path: undefined, runs: [], traces: [] });
  }

  const rounds = WARMUP + RUNS + (browserName === 'chromium' ? TRACES : 0);
  for (let round = 0; round < rounds; round++) {
    const trace = round >= WARMUP + RUNS;
    const kind = round < WARMUP ? 'warm-up' : trace ? 'trace' : 'timed';
    // A fresh browser per round; every cell once, in a seeded order.
    await browser.close();
    browser = await launch(browserName);
    const order = shuffle(cells);
    let done = 0;
    for (const cell of order) {
      const res = await timedRun(browser, browserName, cell, env.nativeScrollTimeline, trace);
      cell.path = res.path;
      cell.scroll = res.scroll;
      if (kind === 'timed') cell.runs.push(res.metrics);
      if (kind === 'trace') cell.traces.push(res.metrics);
      done++;
      process.stdout.write(`\r  round ${round + 1}/${rounds} (${kind}) ${done}/${order.length}   `);
    }
  }
  process.stdout.write('\n');
  await browser.close();
  results.cells.push(...cells);
}

await new Promise((ok) => server.close(ok));

if (failed) die('the parity gate failed; nothing was written. See the lines above.');
if (SMOKE) {
  console.log(`\n✓ bench-gsap --smoke: parity and engine checks pass (${results.parity.length} scenario × browser pairs)`);
  process.exit(0);
}

/* ── Sizes: what the pages loaded, gzip -9 ───────────────────────────────── */

const gz = (file) => gzipSync(readFileSync(file), { level: 9 }).length;
const kib = (b) => Math.round((b / 1024) * 10) / 10;
const gsapFiles = Object.fromEntries(['gsap.min.js', 'ScrollTrigger.min.js', 'DrawSVGPlugin.min.js'].map((f) => [f, gz(join(gsapDist, f))]));
/** svg-scroll-draw's entries as `npm run size` measures them: each closure, concatenated, gzip -9. */
const oursKb = (...names) => Math.round(measure([...new Set(names.flatMap((n) => closure(entryFile(n, oursDist))))]).gzip * 10) / 10;
const sizes = {
  method: 'gzip level 9 (Node zlib). GSAP: each dist file the pages load. svg-scroll-draw: each ES module entry with every chunk it imports, as npm run size measures it.',
  gsap: { files: gsapFiles, kib: Object.fromEntries(Object.entries(gsapFiles).map(([k, v]) => [k, kib(v)])) },
  ours: { main: oursKb('.'), reveal: oursKb('reveal'), mainPlusPin: oursKb('.', 'pin') },
  loaded: [...new Set([...served.values()].map((f) => f.replace(repoRoot + '/', '').replace(/^.*node_modules\//, 'node_modules/')))].sort(),
};

/* ── Summaries and comparisons ───────────────────────────────────────────── */

const outCells = results.cells.map((c) => {
  const samples = {};
  for (const m of Object.keys(METRICS)) {
    const from = METRICS[m].trace ? c.traces : c.runs;
    const xs = from.map((r) => r[m]).filter((x) => x != null);
    if (xs.length) samples[m] = xs.map((x) => round(x, 3));
  }
  const summary = Object.fromEntries(Object.entries(samples).map(([m, xs]) => [m, summarize(xs)]));
  const extras = {
    vsyncMs: summarize(c.runs.map((r) => r.vsyncMs)),
    gestureMs: summarize(c.runs.map((r) => r.gestureMs)),
  };
  return { scenario: c.scenario, lib: c.lib, browser: c.browser, throttle: c.throttle, speed: c.speed, path: c.path ?? null, scroll: c.scroll, samples, summary, extras };
});

const comparisons = [];
for (const a of outCells.filter((c) => c.lib === 'gsap')) {
  for (const b of outCells.filter((c) => ['ours', 'ours-js'].includes(c.lib) && c.scenario === a.scenario && c.browser === a.browser && c.throttle === a.throttle && c.speed === a.speed)) {
    for (const m of Object.keys(METRICS)) {
      if (!a.samples[m] || !b.samples[m]) continue;
      const ci = bootstrapDiff(a.samples[m], b.samples[m]);
      const diff = round(a.summary[m].median - b.summary[m].median);
      // Lower is better: a CI wholly above zero means GSAP cost more.
      const winner = !ci ? 'none' : ci[0] > 0 ? b.lib : ci[1] < 0 ? 'gsap' : 'none';
      comparisons.push({ scenario: a.scenario, browser: a.browser, throttle: a.throttle, speed: a.speed, a: 'gsap', b: b.lib, metric: m, diff, ci, winner });
    }
  }
}

const out = {
  provisional: PROVISIONAL,
  meta: {
    date: new Date().toISOString(),
    git: gitSha,
    machine: {
      cpu: os.cpus()[0]?.model ?? null,
      cores: os.cpus().length,
      memGb: Math.round(os.totalmem() / 1073741824),
      os: `${os.platform()} ${os.release()}`,
      power,
    },
    node: process.version,
    playwright: require('playwright/package.json').version,
    browsers: results.browsers,
    versions: { gsap: gsapPkg.version, svgScrollDraw: oursPkg.version, oursDistSha256: createHash('sha256').update(Buffer.concat(closure(entryFile('.', oursDist)).concat(closure(entryFile('reveal', oursDist)), closure(entryFile('pin', oursDist))).map((f) => readFileSync(f)))).digest('hex').slice(0, 16) },
    settings: {
      viewport: VIEWPORT, dpr: DPR, runs: RUNS, warmup: WARMUP, traces: TRACES, speeds: SPEEDS,
      throttles: THROTTLES, idleMs: IDLE_MS, seed: SEED, wheelStepPx: 100, network: NETWORK,
      args: argv,
    },
    durationMin: Math.round((Date.now() - started) / 6000) / 10,
  },
  metrics: METRICS,
  scenarios: SCENARIOS,
  parity: results.parity,
  sizes,
  cells: outCells,
  comparisons,
};

writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n');
console.log(`\n✓ bench-gsap: ${outCells.length} cells, ${comparisons.length} comparisons → ${OUT.replace(repoRoot + '/', '')}${PROVISIONAL ? ' (provisional)' : ''} in ${out.meta.durationMin} min`);
