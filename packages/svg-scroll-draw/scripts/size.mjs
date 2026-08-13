#!/usr/bin/env node
/**
 * Measures the real gzipped size of every built entry point.
 *
 * Two modes:
 *   node scripts/size.mjs          → print a markdown table (paste into README)
 *   node scripts/size.mjs --check  → fail if any entry exceeds its budget
 *
 * The budgets below exist so a size regression breaks the build instead of
 * quietly making the README's claims false — which is exactly what happened
 * between v1 and v2.9.0 (README said 4.4 KB; the real figure was 8.9 KB).
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');

// Budget = current size + ~15% headroom, rounded. Tighten as the library shrinks.
const BUDGETS_KB = {
  '.':              10.5,
  react:            11.5,
  vue:              11.5,
  nuxt:             11.5,
  svelte:           11.0,
  solid:            11.0,
  angular:          11.0,
  astro:            10.5,
  group:             9.0,
  'web-component':   6.5,
  reveal:            4.6,
  horizontal:        4.3,
  timeline:          3.5,
  text:              2.8,
  video:             2.2,
  cinematic:         2.1,
  progress:          2.0,
  devtools:          1.9,
  pin:               1.8,
  snap:              1.6,
  lenis:             0.5,
};

function gzipKb(file) {
  return gzipSync(readFileSync(file), { level: 9 }).length / 1024;
}

function rawKb(file) {
  return statSync(file).size / 1024;
}

/** Discover every built ESM entry as `name → path`. */
function findEntries() {
  const entries = new Map();
  const rootEsm = join(DIST, 'index.mjs');
  if (existsSync(rootEsm)) entries.set('.', rootEsm);

  for (const name of readdirSync(DIST)) {
    const candidate = join(DIST, name, 'index.mjs');
    if (existsSync(candidate)) entries.set(name, candidate);
  }
  return entries;
}

const entries = findEntries();

if (entries.size === 0) {
  console.error('✗ No built entries found in dist/. Run `npm run build` first.');
  process.exit(1);
}

const rows = [...entries]
  .map(([name, file]) => ({ name, raw: rawKb(file), gzip: gzipKb(file) }))
  .sort((a, b) => b.gzip - a.gzip);

const check = process.argv.includes('--check');

if (check) {
  let failed = 0;
  let unbudgeted = 0;

  for (const { name, gzip } of rows) {
    const budget = BUDGETS_KB[name];
    if (budget === undefined) {
      console.warn(`⚠ ${name} — ${gzip.toFixed(2)} KB gzip (no budget defined)`);
      unbudgeted++;
      continue;
    }
    if (gzip > budget) {
      console.error(`✗ ${name} — ${gzip.toFixed(2)} KB gzip exceeds budget ${budget} KB`);
      failed++;
    }
  }

  if (failed > 0) {
    console.error(
      `\n${failed} ${failed === 1 ? 'entry' : 'entries'} over budget. ` +
      `Either shrink the code or raise the budget in scripts/size.mjs — ` +
      `and update every size claim in README.md to match.`
    );
    process.exit(1);
  }

  console.log(
    `✓ All ${rows.length} entries within budget` +
    (unbudgeted ? ` (${unbudgeted} unbudgeted)` : '')
  );
  process.exit(0);
}

// Report mode — markdown, ready to paste into the README.
const label = (n) => (n === '.' ? '`svg-scroll-draw`' : `\`svg-scroll-draw/${n}\``);
const pad = Math.max(...rows.map((r) => label(r.name).length));

console.log(`| Entry point${' '.repeat(Math.max(0, pad - 11))} | Raw | Gzipped |`);
console.log(`|${'-'.repeat(pad + 2)}|----:|--------:|`);
for (const { name, raw, gzip } of rows) {
  console.log(
    `| ${label(name).padEnd(pad)} | ${raw.toFixed(1)} KB | **${gzip.toFixed(1)} KB** |`
  );
}
console.log(`\nTotal entries: ${rows.length}`);
