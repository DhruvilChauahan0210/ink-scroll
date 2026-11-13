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
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
// The same measurement size.mjs budgets: an entry plus every chunk it imports.
import { entryKb } from '../packages/svg-scroll-draw/scripts/bundle-size.mjs';

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
  // The homepage's figures moved here so every page's sign-off can quote them.
  'apps/demo/src/data/facts.ts',
];

/** Everywhere the main entry's size is advertised in round numbers. */
const SIZE_CLAIM_FILES = [
  'README.md',
  'STATUS.md',
  'apps/demo/src/app/layout.tsx',
  'apps/demo/src/app/page.tsx',
  'apps/demo/src/app/opengraph-image.tsx',
  // The README npm renders is a different file from the root one, and it went a
  // whole release advertising "~9 KB" because nothing here read it.
  'packages/svg-scroll-draw/README.md',
  'apps/demo/src/app/llms.txt/route.ts',
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
 * Real gzipped size of the main entry, in KB to one decimal: dist/index.mjs and
 * the shared chunks it imports. Alone, that file is a page of re-exports.
 *
 * Returns null when dist/ has not been built — the count claims are still worth
 * checking on a machine that has not run a build.
 */
function actualMainEntryKb() {
  return entryKb('.');
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

/*
 * Per-entry sizes ("scrollReveal is 3.9 KB", "`svg-scroll-draw/text` | 2.5 KB").
 *
 * The main-entry check above never looked at these, so after 2.10.0 the site
 * advertised reveal at 3.9, pin at 1.5 and snap at 1.3 against 4.4 / 1.6 / 1.5
 * in a dozen files. Each figure is compared to its built entry, to one decimal.
 */
const API_ENTRY = {
  scrollReveal: 'reveal', scrollPin: 'pin', scrollSnap: 'snap', scrollText: 'text',
  scrollVideo: 'video', scrollFrames: 'frames', scrollHorizontal: 'horizontal', scrollProgress: 'progress',
};

/** Every file a reader can see: both READMEs, the whole demo source, the launch drafts. */
function publicFiles() {
  const out = ['README.md', 'packages/svg-scroll-draw/README.md'];
  const walk = (dir) => {
    for (const name of readdirSync(join(ROOT, dir))) {
      const rel = `${dir}/${name}`;
      if (statSync(join(ROOT, rel)).isDirectory()) walk(rel);
      else if (/\.(tsx?|md|mdx|txt)$/.test(name)) out.push(rel);
    }
  };
  walk('apps/demo/src');
  if (existsSync(join(ROOT, 'launch'))) walk('launch');
  // The agent skill is read by coding tools and copied into other projects.
  if (existsSync(join(ROOT, 'skills'))) walk('skills');
  return out;
}

/*
 * Pages whose job is to quote the old, wrong figures as history — the /verify
 * before/after table and the changelog. Like CHANGELOG.md, they stay as written.
 */
const HISTORICAL = ['apps/demo/src/app/verify/page.tsx', 'apps/demo/src/app/changelog/page.tsx'];

const PUBLIC = publicFiles().filter((rel) => !HISTORICAL.includes(rel));

for (const rel of PUBLIC) {
  const src = readFileSync(join(ROOT, rel), 'utf8');

  for (const [api, entry] of Object.entries(API_ENTRY)) {
    const real = entryKb(entry);
    if (real === null) continue;
    // `\\?` covers the escaped backticks inside template literals (llms.txt route).
    const re = new RegExp(`${api}\\\\?\\\`?\\)?\\s*(?:alone\\s*)?(?:is\\s*|\\(\\s*)?(\\d+\\.\\d)\\s?KB`, 'g');
    for (const [, n] of src.matchAll(re)) {
      if (Number(n) !== real) failures.push(`${rel}: claims ${api} is ${n} KB but the built entry is ${real.toFixed(1)} KB`);
    }
    // A table row's last size is the gzipped one; the root README also has a raw column.
    const row = new RegExp(`\\|\\s*\\\`svg-scroll-draw/${entry}\\\`[^\\n]*`, 'g');
    for (const [line] of src.matchAll(row)) {
      const sizes = [...line.matchAll(/(\d+\.\d)\s?KB/g)];
      if (!sizes.length) continue;
      const n = sizes[sizes.length - 1][1];
      if (Number(n) !== real) failures.push(`${rel}: lists svg-scroll-draw/${entry} at ${n} KB but it is ${real.toFixed(1)} KB`);
    }
  }
}

const entries = readFileSync(join(ROOT, 'apps/demo/src/data/competitors.ts'), 'utf8')
  .match(/SELF_ENTRIES[^{]*\{([^}]*)\}/);
if (entries) {
  for (const [, entry, n] of entries[1].matchAll(/(\w+):\s*(\d+\.\d)/g)) {
    const real = entryKb(entry);
    if (real !== null && Number(n) !== real) {
      failures.push(`apps/demo/src/data/competitors.ts: SELF_ENTRIES.${entry} is ${n} but the built entry is ${real} KB`);
    }
  }
}

/*
 * scrollReveal's preset names. /vs-aos listed "zoomIn, slideIn, flipIn" — names
 * the library never had — so the site reads them from facts.ts, and this keeps
 * facts.ts in step with the library's own REVEAL_PRESETS table.
 */
{
  const lib = readFileSync(join(ROOT, 'packages/svg-scroll-draw/src/reveal/index.ts'), 'utf8')
    .match(/REVEAL_PRESETS[^=]*=\s*\{([\s\S]*?)\n\};/);
  const site = readFileSync(join(ROOT, 'apps/demo/src/data/facts.ts'), 'utf8')
    .match(/REVEAL_PRESETS\s*=\s*\[([^\]]*)\]/);
  const libNames = lib ? [...lib[1].matchAll(/^\s*(\w+):/gm)].map((m) => m[1]) : [];
  const siteNames = site ? [...site[1].matchAll(/'(\w+)'/g)].map((m) => m[1]) : [];
  if (!libNames.length || libNames.join() !== siteNames.join()) {
    failures.push(`apps/demo/src/data/facts.ts: REVEAL_PRESETS is [${siteNames.join(', ')}] but the library defines [${libNames.join(', ')}]`);
  }
}

/*
 * Claims that are wrong whatever the build says. Each one shipped: "9× smaller"
 * (measured 4.5–4.75×), "covers 95% of use cases" (never measured), SplitText
 * "+18 KB" (it is 3.6 KB in gsap 3.15.0), the paid-plugin claim (free since
 * 2025), and Firefox 110 / Safari 18 for the native path (Firefox 159, Safari 26).
 */
const BANNED = [
  [/\b9×\s*smaller/, '"9× smaller" — measured is about 4.5× (vs core + ScrollTrigger) to 4.75× (with DrawSVG)'],
  [/\b95%\s+of\s+(?:ScrollTrigger|scroll|those|real-world|the)/i, '"95% of … use cases" — never measured'],
  [/\+\s?18\s?KB|adds\s+~?18\s?KB/, 'SplitText "+18 KB" — gsap 3.15.0 SplitText is 3.6 KB gzipped'],
  [/requires? (?:a )?(?:paid|\$150)|\$150\+?\/yr Club/i, 'GSAP plugins as paid — all free since 2025'],
  [/Firefox 110\+/, 'Firefox 110+ for the native path — Firefox ships it from 159'],
  [/Safari 18\+/, 'Safari 18+ for the native path — WebKit ships it from 26'],
];
for (const rel of PUBLIC) {
  const lines = readFileSync(join(ROOT, rel), 'utf8').split('\n');
  for (const [i, line] of lines.entries()) {
    for (const [re, why] of BANNED) {
      if (re.test(line)) failures.push(`${rel}:${i + 1}: ${why}`);
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
