#!/usr/bin/env node
/**
 * Fails the build when the GSAP benchmark's results cannot be trusted as shown.
 *
 * /benchmarks/gsap-vs-svg-scroll-draw renders src/data/bench-gsap.json and
 * nothing else, so this checks that file the way check-competitors.mjs checks
 * the size figures:
 *   - it has every scenario in every browser (no cell left out);
 *   - every scenario in every browser passed the parity gate;
 *   - it measured the GSAP version competitors.ts quotes, and the scenario
 *     pages load that version too;
 *   - the files it served weigh what competitors.ts says they weigh;
 *   - it is no older than competitors.ts's MAX_AGE_DAYS.
 * A results file from an older svg-scroll-draw is a notice, not a failure: the
 * page says which version it measured. So is a provisional (short) run.
 *
 *   node scripts/check-bench.mjs
 *   TODAY=2027-06-01 node scripts/check-bench.mjs   # test the expiry
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const app = resolve(here, '..');
const failures = [];
const notices = [];

let bench;
try {
  bench = JSON.parse(readFileSync(resolve(app, 'src/data/bench-gsap.json'), 'utf8'));
} catch (e) {
  console.error(`✗ check-bench: src/data/bench-gsap.json is missing or not JSON (${e.message}). Run npm run bench:gsap.`);
  process.exit(1);
}

const comp = readFileSync(resolve(app, 'src/data/competitors.ts'), 'utf8');
const block = (key) => comp.match(new RegExp(`^  ${key}: \\{([\\s\\S]*?)^  \\},$`, 'm'))?.[1] ?? '';
const num = (src, field) => Number(src.match(new RegExp(`${field}: ([\\d.]+)`))?.[1]);
const gsapVersion = block('gsapStack').match(/version: '([^']+)'/)?.[1];
const selfBlock = comp.match(/export const SELF: Competitor = \{([\s\S]*?)^\};/m)?.[1] ?? '';
const selfVersion = selfBlock.match(/version: '([^']+)'/)?.[1];
const maxAgeDays = Number(comp.match(/MAX_AGE_DAYS = (\d+)/)?.[1]);

// Shape.
const SCENARIOS = ['a-draw-one', 'b1-draw-many', 'b2-draw-stagger', 'c1-reveal-idiomatic', 'c2-reveal-matched', 'd-pin-scrub'];
const BROWSERS = ['chromium', 'firefox', 'webkit'];
for (const key of ['meta', 'metrics', 'scenarios', 'parity', 'sizes', 'cells', 'comparisons']) {
  if (bench[key] == null) failures.push(`bench-gsap.json has no "${key}".`);
}
if (typeof bench.provisional !== 'boolean') failures.push('bench-gsap.json has no boolean "provisional".');
if (failures.length) finish();

// Complete: every scenario × browser has cells and a passing parity entry.
for (const s of SCENARIOS) {
  for (const b of BROWSERS) {
    if (!bench.cells.some((c) => c.scenario === s && c.browser === b)) failures.push(`no results for ${s} in ${b}.`);
    const p = bench.parity.find((x) => x.scenario === s && x.browser === b);
    if (!p) failures.push(`no parity check for ${s} in ${b}.`);
    else if (!p.pass) failures.push(`${s} in ${b} failed the parity gate.`);
  }
}
for (const c of bench.cells) {
  if (!c.summary || !Object.keys(c.summary).length) failures.push(`${c.scenario} ${c.lib} ${c.browser}: no summary.`);
}

// The GSAP measured is the GSAP quoted, and the one readers' pages load.
if (bench.meta.versions?.gsap !== gsapVersion) {
  failures.push(`measured gsap ${bench.meta.versions?.gsap}, but competitors.ts quotes ${gsapVersion}: re-run npm run bench:gsap after a GSAP refresh.`);
}
const shared = readFileSync(resolve(app, 'public/benchmarks/gsap/shared.js'), 'utf8');
const pageGsap = shared.match(/GSAP_VERSION = '([^']+)'/)?.[1];
if (pageGsap !== gsapVersion) failures.push(`public/benchmarks/gsap/shared.js loads gsap ${pageGsap}, competitors.ts quotes ${gsapVersion}.`);

// Bytes: each GSAP file as competitors.ts itemises it.
const core = num(block('gsapCore'), 'gzipKb');
const scroll = num(block('gsapScroll'), 'gzipKb');
const stack = num(block('gsapStack'), 'gzipKb');
const expect = {
  'gsap.min.js': core,
  'ScrollTrigger.min.js': Math.round((scroll - core) * 10) / 10,
  'DrawSVGPlugin.min.js': Math.round((stack - scroll) * 10) / 10,
};
for (const [file, kb] of Object.entries(expect)) {
  const got = bench.sizes.gsap?.kib?.[file];
  if (got == null || Math.abs(got - kb) > 0.05) failures.push(`${file} measured ${got} KB in the benchmark, competitors.ts says ${kb} KB.`);
}
if (bench.meta.versions?.svgScrollDraw === selfVersion) {
  const main = num(selfBlock, 'gzipKb');
  if (Math.abs(bench.sizes.ours.main - main) > 0.05) failures.push(`svg-scroll-draw main entry measured ${bench.sizes.ours.main} KB, competitors.ts says ${main} KB.`);
} else {
  notices.push(`results measured svg-scroll-draw ${bench.meta.versions?.svgScrollDraw}; the package is ${selfVersion} (the page says so).`);
}

// Age.
const today = process.env.TODAY ?? new Date().toISOString().slice(0, 10);
const measured = String(bench.meta.date).slice(0, 10);
const age = Math.floor((Date.parse(today) - Date.parse(measured)) / 86_400_000);
if (!(age >= 0) || age > maxAgeDays) failures.push(`results are ${age} days old (limit ${maxAgeDays}): re-run npm run bench:gsap.`);
if (bench.provisional) notices.push('results are marked provisional; the page shows a provisional note until a full run replaces them.');

finish();

function finish() {
  for (const n of notices) console.log(`  notice: ${n}`);
  if (failures.length) {
    console.error(`✗ check-bench: ${failures.length} problem(s) with src/data/bench-gsap.json:\n  ${failures.join('\n  ')}`);
    process.exit(1);
  }
  console.log(`✓ benchmark results: ${bench.cells.length} cells, every scenario in every browser, parity passed, gsap ${gsapVersion}, ${age}d old (limit ${maxAgeDays}d)`);
  process.exit(0);
}
