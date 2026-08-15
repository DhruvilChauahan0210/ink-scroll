#!/usr/bin/env node
/**
 * Verifies that the numbers quoted in user-facing docs match reality.
 *
 * The README spent several releases claiming "~4.4 KB gzipped" and "272 tests"
 * when the real figures were 8.9 KB and 423 — directly above a bundlephobia
 * badge that showed the true size. This script makes that class of drift a
 * build failure instead of a credibility problem discovered by a stranger.
 *
 * Checked:
 *   - "<N> tests" in README + demo strings  == actual vitest test count
 *   - "<N> browser tests" in the same docs  == actual Playwright test count
 *   - "<N> Examples" in README              == entries in ExamplesPage EXAMPLES
 *   - the main entry's size claim            == the real gzipped size of dist
 *
 * size.mjs enforces the size *budget*; this enforces the size *claim*. Those are
 * different jobs, and the gap between them shipped: 2.10.0 grew the main entry
 * from 9.0 to 10.0 KB, comfortably inside the 10.5 KB budget, while the README,
 * STATUS and 21 files across the demo went on advertising 9 KB. Exactly the drift
 * this script exists to prevent, in the one dimension it was not looking at.
 *
 * Historical CHANGELOG entries are intentionally exempt: they record what was
 * true at the time of a release and must not be rewritten.
 */
import { readFileSync, existsSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const FILES_WITH_TEST_COUNTS = [
  'README.md',
  'STATUS.md',
  'apps/demo/src/app/opengraph-image.tsx',
  'apps/demo/src/app/react-scroll-animation/page.tsx',
  // The homepage was the one place quoting a test count that nothing checked:
  // it sat at "423 tests" through five releases while the size claim beside it
  // stayed current, because page.tsx was listed in SIZE_CLAIM_FILES below but
  // not here. Same file, two claim types, one of them unguarded.
  'apps/demo/src/app/page.tsx',
];

/** Everywhere the main entry's size is advertised in round numbers. */
const SIZE_CLAIM_FILES = [
  'README.md',
  'STATUS.md',
  'apps/demo/src/app/layout.tsx',
  'apps/demo/src/app/page.tsx',
  'apps/demo/src/app/opengraph-image.tsx',
  'apps/demo/src/components/MobileMenu.tsx',
];

const failures = [];

// ── Actual test count, straight from vitest ──────────────────────────────────

function actualTestCount() {
  const out = execFileSync(
    'npx',
    ['vitest', 'run', '--reporter=json', '--silent'],
    { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] },
  );
  // The JSON report may be preceded by unrelated stdout noise; take the object.
  const json = JSON.parse(out.slice(out.indexOf('{')));
  return json.numTotalTests;
}

/**
 * Browser tests per engine, straight from Playwright's own collection.
 *
 * One project only: the three projects run the same specs, so "per engine" is the
 * meaningful figure and multiplying by the project count would just invite a
 * different flavour of wrong number in the docs. `--list` collects without
 * launching a browser or the fixture server, so this costs well under a second.
 *
 * Returns null when Playwright is not installed, since the unit-test claims are
 * still worth checking on a machine that cannot run the browser suite.
 */
function actualBrowserTestCount() {
  try {
    const out = execFileSync(
      'npx',
      [
        'playwright', 'test',
        '--config', 'e2e/playwright.config.ts',
        '--project=chromium',
        '--list', '--reporter=json',
      ],
      {
        cwd: join(ROOT, 'packages/svg-scroll-draw'),
        encoding: 'utf8',
        maxBuffer: 64 * 1024 * 1024,
        stdio: ['ignore', 'pipe', 'ignore'],
      },
    );
    const json = JSON.parse(out.slice(out.indexOf('{')));
    let n = 0;
    const walk = (suite) => {
      n += (suite.specs ?? []).length;
      (suite.suites ?? []).forEach(walk);
    };
    (json.suites ?? []).forEach(walk);
    return n;
  } catch {
    return null;
  }
}

/**
 * Real gzipped size of the main entry, in KB to one decimal.
 *
 * Returns null when dist/ has not been built — the count claims are still worth
 * checking on a machine that has not run a build.
 */
function actualMainEntryKb() {
  const dist = join(ROOT, 'packages/svg-scroll-draw/dist/index.mjs');
  if (!existsSync(dist)) return null;
  return Math.round((gzipSync(readFileSync(dist), { level: 9 }).length / 1024) * 10) / 10;
}

// ── Actual example count, straight from the demo source ──────────────────────

function actualExampleCount() {
  const file = join(ROOT, 'apps/demo/src/components/ExamplesPage.tsx');
  const src = readFileSync(file, 'utf8');
  const start = src.indexOf('const EXAMPLES = [');
  if (start === -1) throw new Error('Could not locate `const EXAMPLES = [` in ExamplesPage.tsx');

  // Walk to the matching close bracket so nested arrays don't end it early.
  let depth = 0;
  let end = -1;
  for (let i = src.indexOf('[', start); i < src.length; i++) {
    if (src[i] === '[') depth++;
    else if (src[i] === ']' && --depth === 0) { end = i; break; }
  }
  if (end === -1) throw new Error('Unterminated EXAMPLES array in ExamplesPage.tsx');

  return (src.slice(start, end).match(/^\s*id:\s*'/gm) ?? []).length;
}

// ── Checks ───────────────────────────────────────────────────────────────────

const tests = actualTestCount();
const browserTests = actualBrowserTestCount();
const examples = actualExampleCount();
const mainKb = actualMainEntryKb();

console.log(
  `Reality: ${tests} tests, ` +
    `${browserTests ?? 'unknown'} browser tests per engine, ` +
    `${examples} examples, ` +
    `main entry ${mainKb ?? 'unbuilt'} KB gzipped`,
);

for (const rel of FILES_WITH_TEST_COUNTS) {
  const path = join(ROOT, rel);
  if (!existsSync(path)) continue;
  const src = readFileSync(path, 'utf8');

  for (const [, n] of src.matchAll(/(\d{2,4})\s+tests\b/g)) {
    if (Number(n) !== tests) {
      failures.push(`${rel}: claims "${n} tests" but the suite has ${tests}`);
    }
  }
  for (const [, n] of src.matchAll(/\*\*(\d{2,4})\s+passing\*\*/g)) {
    if (Number(n) !== tests) {
      failures.push(`${rel}: claims "**${n} passing**" but the suite has ${tests}`);
    }
  }
  // "browser tests" is a separate figure and must not be conflated with the unit
  // count — the two differ by an order of magnitude, and quoting either one as
  // "tests" is how a reader ends up with the wrong impression of the coverage.
  if (browserTests !== null) {
    for (const [, n] of src.matchAll(/(\d{2,4})\s+browser tests\b/g)) {
      if (Number(n) !== browserTests) {
        failures.push(
          `${rel}: claims "${n} browser tests" but the suite has ${browserTests} per engine`,
        );
      }
    }
  }
}

const readme = readFileSync(join(ROOT, 'README.md'), 'utf8');
for (const [, n] of readme.matchAll(/\[(\d{1,3})\s+Examples\]/gi)) {
  if (Number(n) !== examples) {
    failures.push(`README.md: links to "${n} Examples" but the demo has ${examples}`);
  }
}

// Any resurrected 4.4 KB claim is an instant fail.
for (const rel of ['README.md', 'packages/svg-scroll-draw/package.json']) {
  const src = readFileSync(join(ROOT, rel), 'utf8');
  if (/~4\.4\s?KB|4\.4\s?KB gzipped/.test(src)) {
    failures.push(
      `${rel}: contains the stale "4.4 KB" size claim (real main entry is ${mainKb ?? '?'} KB)`,
    );
  }
}

/*
 * The main entry's size, claimed two ways.
 *
 * The exact form ("10.0 KB gzipped") has to match to a decimal; the approximate
 * one the marketing copy uses ("~10 KB") has to match when rounded. Both are
 * checked because both were wrong at once, in 21 files, through a release.
 */
if (mainKb !== null) {
  const approx = Math.round(mainKb);

  for (const rel of ['README.md', 'STATUS.md']) {
    const src = readFileSync(join(ROOT, rel), 'utf8');
    for (const [, n] of src.matchAll(/\*\*(\d+\.\d)\s?KB gzipped\*\*/g)) {
      if (Number(n) !== mainKb) {
        failures.push(`${rel}: claims the main entry is "${n} KB gzipped" but it is ${mainKb} KB`);
      }
    }
  }

  for (const rel of SIZE_CLAIM_FILES) {
    const path = join(ROOT, rel);
    if (!existsSync(path)) continue;
    const src = readFileSync(path, 'utf8');
    const lines = src.split('\n');
    const COMPETITOR = /gsap|greensock|framer|motion|aos\b|scroll-svg|scrollreveal|drawsvg/i;

    for (const [i, line] of lines.entries()) {
      /*
       * Competitor sizes live in these same files — comparison tables, bar
       * charts, the "why this exists" cards — and are not ours to derive. The
       * name is often a few lines above the size in an object literal, so the
       * window covers the surrounding entry rather than the single line.
       */
      if (lines.slice(Math.max(0, i - 4), i + 2).some((l) => COMPETITOR.test(l))) continue;

      for (const [, n] of line.matchAll(/~(\d{1,3})\s?KB/g)) {
        if (Number(n) !== approx) {
          failures.push(
            `${rel}: claims "~${n} KB" but the main entry is ${mainKb} KB (~${approx} KB)`,
          );
        }
      }
    }
  }
}

if (failures.length) {
  console.error(`\n✗ ${failures.length} doc claim${failures.length === 1 ? '' : 's'} out of sync:\n`);
  for (const f of failures) console.error(`  • ${f}`);
  console.error('\nUpdate the docs, or the number, so they agree.');
  process.exit(1);
}

console.log('✓ All doc claims match reality');
