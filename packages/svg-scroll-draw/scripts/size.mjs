#!/usr/bin/env node
/**
 * Measures the real gzipped size of every built entry point.
 *
 *   node scripts/size.mjs            → print the table
 *   node scripts/size.mjs --write    → regenerate the size tables in both READMEs
 *   node scripts/size.mjs --check    → fail if an entry exceeds its budget, or if
 *                                      either README's table no longer matches
 *
 * An entry's size is its own file plus every shared chunk it imports, gzipped
 * together (see bundle-size.mjs) — the ESM entries share code through chunks, so
 * gzipping an entry file alone would report a few hundred bytes for the library.
 *
 * The budgets below exist so a size regression breaks the build instead of
 * quietly making the README's claims false — which is exactly what happened
 * between v1 and v2.9.0 (README said 4.4 KB; the real figure was 8.9 KB). The
 * README tables are written by this script for the same reason: the hand-pasted
 * one drifted, and missed three entries outright.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { findEntries, closure, measure, measureTogether, entryFile, CDN } from './bundle-size.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/*
 * Budget = current size + a little headroom. Tighten as the library shrinks.
 *
 * When the ESM build moved to shared chunks, an entry measured as shipped files
 * started paying for the `import … from './chunk-….mjs'` lines that join it to
 * its chunks, 0.1–0.5 KB gzipped, and the budgets moved with it. Through a
 * bundler nothing grew: esbuild-bundling `export *` from each entry measured
 * within 0.01 KB of the unsplit build, and pin 0.3 KB smaller.
 */
/*
 * 2.19.0 moved most budgets up 0.1–0.4 KB. Every scroll-linked engine follows
 * layout changes now (one shared ResizeObserver, core/layout-watch), not only
 * window resizes; the React, Vue, Astro and web-component wrappers follow their
 * options; an adversarial review before release added the reference counts and
 * transition handling. The main entry went 10.7 → 11.2 KB for that. Measured, not guessed:
 * each figure below is the 2.19.0 build rounded up to the next 0.1 KB.
 *
 * 2.19.1 moved the entries that carry the draw engine up 0.1–0.2 KB: a
 * staggered drawing fits its stagger to where the page ends and keeps
 * following the scroll off screen until its last path is done (it never
 * finished before), 0.14 KB gzipped on the main entry. Same rule as above.
 */
const BUDGETS_KB = {
  '.':              11.4,
  // The whole library in one IIFE, web component included — the single file a
  // `<script src>` user downloads. Not split, so unchanged by the chunks.
  cdn:              11.5,
  react:            12.9,
  vue:              12.9,
  nuxt:             13.0,
  svelte:           12.3,
  solid:            12.3,
  angular:          12.3,
  astro:            11.9,
  group:             10.1,
  'web-component':   7.6,
  reveal:            5.6,
  // The AOS drop-in, stylesheet included (AOS itself is 6.7 KB with aos.css).
  aos:               3.2,
  'cdn-aos':         3.4,
  // The ScrollReveal drop-in (ScrollReveal 4.0.9 itself is 5.6 KB).
  scrollreveal:      4.9,
  'cdn-scrollreveal': 4.9,
  // React hooks for the drop-ins. Each shares its drop-in's chunk, so an app
  // using AOS and useAOS ships the drop-in once (React is external).
  'aos/react':          3.6,
  'scrollreveal/react': 5.2,
  'vivus/react':        4.6,
  // The vivus drop-in (vivus 0.4.6 itself is 4.1 KB).
  vivus:             4.2,
  'cdn-vivus':       4.2,
  // 4.7 -> 5.0 in 2.18.1: it follows the layout (ResizeObserver, a rebuild only
  // when the travel or the runway moved) and measures against its sticky stage.
  horizontal:        5.5,
  timeline:          4.1,
  text:              3.1,
  video:             2.7,
  cinematic:         2.3,
  progress:          2.5,
  devtools:          1.9,
  snap:              2.0,
  // 1.39 once clamp got a file of its own; it used to drag every easing along.
  pin:               1.5,
  lenis:             0.5,
};

/*
 * Entries an app imports together. Before the chunks, each entry bundled its
 * own engine and these were close to the sum of their parts (main + react was
 * 18.1 KB); the budget is what keeps the sharing from quietly coming undone.
 */
const COMBINATIONS = [
  { names: ['.', 'react'], budget: 14.4 },
];

// ── Measure ──────────────────────────────────────────────────────────────────

const entries = findEntries();

if (entries.size === 0) {
  console.error('✗ No built entries found in dist/. Run `npm run build` first.');
  process.exit(1);
}

const rows = [...entries]
  .map(([name, file]) => ({ name, ...measure(closure(file)) }))
  .sort((a, b) => b.gzip - a.gzip || a.name.localeCompare(b.name));
const byName = new Map(rows.map((r) => [r.name, r]));

const combos = COMBINATIONS.map((c) => {
  const files = c.names.map((n) => entryFile(n));
  return { ...c, ...(files.every(Boolean) ? measureTogether(files) : { raw: NaN, gzip: NaN }) };
});

// ── README tables ────────────────────────────────────────────────────────────

const kb = (n) => `${n.toFixed(1)} KB`;
const label = (n) =>
  n === '.' ? '`svg-scroll-draw`'
  : n in CDN ? `\`dist/cdn/${CDN[n]}\``
  : `\`svg-scroll-draw/${n}\``;
const together = (names) => names.map(label).join(' + ');

/** The root README: every entry, largest first. */
function rootTable() {
  const pad = Math.max(...rows.map((r) => label(r.name).length));
  const lines = [
    `| ${'Entry point'.padEnd(pad)} | Raw | Gzipped |`,
    `|${'-'.repeat(pad + 2)}|----:|--------:|`,
    ...rows.map((r) => `| ${label(r.name).padEnd(pad)} | ${kb(r.raw)} | **${kb(r.gzip)}** |`),
    '',
    ...combos.map((c) =>
      `Entries share code through chunks instead of each carrying its own copy, so ` +
      `${together(c.names)} together is **${kb(c.gzip)}**, not ` +
      `${c.names.map((n) => kb(byName.get(n).gzip)).join(' + ')}.`),
  ];
  return lines.join('\n');
}

/*
 * The npm README: the entries people ask about, in the order they ask, with the
 * caveats that keep each figure honest. Same measurements, fewer rows.
 */
const NPM_ROWS = [
  { names: ['.'], before: '(main, every core API)' },
  { names: ['react'], before: '(includes the engine)' },
  { names: ['.', 'react'], before: '(together; the engine ships once)' },
  { names: ['reveal'] },
  { names: ['text'] },
  { names: ['video'] },
  { names: ['scrollreveal'] },
  { names: ['vivus'] },
  { names: ['aos'], before: '(styles included)' },
  { names: ['snap'] },
  { names: ['devtools'], after: '(dev only)' },
  { names: ['pin'] },
];

function npmTable() {
  const lines = ['| Entry | Gzipped |', '|---|---|'];
  for (const { names, before, after } of NPM_ROWS) {
    const gzip = names.length === 1
      ? byName.get(names[0])?.gzip
      : combos.find((c) => c.names.join() === names.join())?.gzip;
    if (gzip === undefined || Number.isNaN(gzip)) throw new Error(`size.mjs: no measurement for ${names.join(' + ')}`);
    lines.push(`| ${together(names)}${before ? ` ${before}` : ''} | ${kb(gzip)}${after ? ` ${after}` : ''} |`);
  }
  return lines.join('\n');
}

const START = '<!-- size-table:start -->';
const END = '<!-- size-table:end -->';

const READMES = [
  { file: join(ROOT, '..', '..', 'README.md'), name: 'README.md', table: rootTable },
  { file: join(ROOT, 'README.md'), name: 'packages/svg-scroll-draw/README.md', table: npmTable },
];

/** The README with its table replaced, or an error string. */
function withTable({ file, name, table }) {
  const src = readFileSync(file, 'utf8');
  const start = src.indexOf(START);
  const end = src.indexOf(END);
  if (start === -1 || end === -1 || end < start) {
    return { error: `${name} has no ${START} … ${END} block for the size table` };
  }
  const next = `${src.slice(0, start + START.length)}\n${table()}\n${src.slice(end)}`;
  return { src, next };
}

// ── Modes ────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

if (args.includes('--write')) {
  for (const readme of READMES) {
    if (!existsSync(readme.file)) continue;
    const { error, src, next } = withTable(readme);
    if (error) { console.error(`✗ ${error}`); process.exit(1); }
    if (next !== src) writeFileSync(readme.file, next);
    console.log(`${next === src ? '·' : '✓'} ${readme.name}${next === src ? ' (already current)' : ' size table written'}`);
  }
  process.exit(0);
}

if (args.includes('--check')) {
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

  for (const c of combos) {
    if (!(c.gzip <= c.budget)) {
      console.error(`✗ ${c.names.join(' + ')} together — ${c.gzip.toFixed(2)} KB gzip exceeds budget ${c.budget} KB`);
      failed++;
    }
  }

  if (failed > 0) {
    console.error(
      `\n${failed} ${failed === 1 ? 'entry' : 'entries'} over budget. ` +
      `Either shrink the code or raise the budget in scripts/size.mjs — ` +
      `then run \`npm run size -- --write\` and \`npm run check:claims\`.`
    );
    process.exit(1);
  }

  /*
   * The tables are generated, so a stale one is a forgotten `--write`, not a
   * judgement call. A README missing from disk (a packed tarball) is skipped.
   */
  const stale = [];
  for (const readme of READMES) {
    if (!existsSync(readme.file)) continue;
    const { error, src, next } = withTable(readme);
    if (error) stale.push(error);
    else if (next !== src) stale.push(`${readme.name}: the size table does not match the build`);
  }
  if (stale.length) {
    for (const s of stale) console.error(`✗ ${s}`);
    console.error('\nRegenerate with `npm run size -- --write`.');
    process.exit(1);
  }

  console.log(
    `✓ All ${rows.length} entries and ${combos.length} combination${combos.length === 1 ? '' : 's'} within budget` +
    (unbudgeted ? ` (${unbudgeted} unbudgeted)` : '') +
    '; README size tables current'
  );
  process.exit(0);
}

// Report mode — the root README's table, as it would be written.
console.log(rootTable());
console.log(`\nTotal entries: ${rows.length}. Write it into both READMEs with \`npm run size -- --write\`.`);
