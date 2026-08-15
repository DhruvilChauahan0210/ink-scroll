#!/usr/bin/env node
/**
 * Fails the build when competitor figures go stale, or when a comparison page
 * hand-types a size instead of reading it from src/data/competitors.ts.
 *
 * CLAIMS-AUDIT.md C1/C2: competitor numbers used to be inline prose with no
 * source and no expiry, and several were wrong for about a year. This is the
 * guard that stops that recurring.
 *
 *   node scripts/check-competitors.mjs
 *   TODAY=2027-03-01 node scripts/check-competitors.mjs   # test the expiry
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const appDir = resolve(here, '../src/app');
const dataFile = resolve(here, '../src/data/competitors.ts');

const src = readFileSync(dataFile, 'utf8');
const measuredOn = src.match(/MEASURED_ON = '([\d-]+)'/)?.[1];
const maxAgeDays = Number(src.match(/MAX_AGE_DAYS = (\d+)/)?.[1]);

const failures = [];

if (!measuredOn || !Number.isFinite(maxAgeDays)) {
  failures.push('competitors.ts: could not read MEASURED_ON / MAX_AGE_DAYS.');
} else {
  const today = process.env.TODAY ?? new Date().toISOString().slice(0, 10);
  const ageDays = Math.floor(
    (Date.parse(today) - Date.parse(measuredOn)) / 86_400_000,
  );
  if (ageDays > maxAgeDays) {
    failures.push(
      `Competitor figures are ${ageDays} days old (limit ${maxAgeDays}, measured ${measuredOn}).\n` +
        `  Re-run each 'command' in src/data/competitors.ts, update the figures, and bump MEASURED_ON.\n` +
        `  A stale comparison is a slow-motion false claim — see CLAIMS-AUDIT.md.`,
    );
  } else {
    console.log(
      `✓ competitor figures measured ${measuredOn} (${ageDays}d old, limit ${maxAgeDays}d)`,
    );
  }
}

// Every figure in competitors.ts must carry the command that produced it.
let entriesChecked = 0;
for (const match of src.matchAll(/^  (\w+): \{([\s\S]*?)^  \},$/gm)) {
  const [, key, block] = match;
  entriesChecked++;
  if (!/command:/.test(block)) {
    failures.push(`competitors.ts: "${key}" has no 'command' — every figure needs its source.`);
  }
  if (!/version:/.test(block)) {
    failures.push(`competitors.ts: "${key}" has no 'version' — a figure without a version cannot be rechecked.`);
  }
}
if (entriesChecked === 0) {
  failures.push('competitors.ts: parsed 0 entries — the check is not actually reading the file.');
} else {
  console.log(`✓ ${entriesChecked} competitor entries each cite a version and a command`);
}

// Claims we know were wrong before. If any reappears anywhere under src/app, fail.
const BANNED = [
  { re: /Club GreenSock/i, why: 'GSAP has been free for everyone since 2025 (CLAIMS-AUDIT A1).' },
  { re: /\$150\s*\+?\s*\/?\s*yr/i, why: 'There is no GSAP subscription to pay (CLAIMS-AUDIT A1).' },
  { re: /scroll-svg[^.]{0,40}abandoned/i, why: 'scroll-svg was published 2026-02-01 (CLAIMS-AUDIT A3).' },
  { re: /5\.5×\s*smaller/i, why: 'The measured ratio is 4.75× (CLAIMS-AUDIT B2).' },
];

// Pages that intentionally discuss the old claim in order to correct it.
const CORRECTION_PAGES = ['vs-gsap', 'gsap-drawsvg-alternative'];

const repoRoot = resolve(here, '../../..');

// Docs that exist to record the retired claims are exempt by design.
const EXEMPT_FILES = ['CLAIMS-AUDIT.md', 'CHANGELOG.md', 'NEXT-SESSION-PLAN.md'];

function walk(dir, base, exts) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.next' || entry === '.git') continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, base, exts);
    else if (exts.test(entry)) check(full, base);
  }
}

function check(file, base) {
  const rel = file.slice(base.length + 1);
  if (CORRECTION_PAGES.some((p) => rel.includes(p))) return;
  if (EXEMPT_FILES.some((f) => rel.endsWith(f))) return;
  const text = readFileSync(file, 'utf8');
  for (const { re, why } of BANNED) {
    if (re.test(text)) failures.push(`${rel}: matches /${re.source}/ — ${why}`);
  }
}

walk(appDir, appDir, /\.tsx?$/);
// Markdown too — the launch drafts carried the same retired claims for a year.
for (const md of ['README.md', 'PRD-v2.md', 'plan2-authenticity.md']) {
  try {
    check(join(repoRoot, md), repoRoot);
  } catch {
    /* file may not exist in every checkout */
  }
}
try {
  walk(join(repoRoot, 'launch'), repoRoot, /\.md$/);
} catch {
  /* no launch dir */
}
try {
  check(join(repoRoot, 'packages/svg-scroll-draw/README.md'), repoRoot);
} catch {
  /* no package readme */
}

if (failures.length) {
  console.error('\n✗ competitor-claim check failed:\n');
  for (const f of failures) console.error('  • ' + f + '\n');
  process.exit(1);
}
console.log('✓ no retired claims found under src/app');
