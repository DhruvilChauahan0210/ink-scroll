#!/usr/bin/env node
/**
 * Keeps src/data/examples-index.ts in sync with the real EXAMPLES array, and
 * keeps examples-seo.ts honest about which slugs exist.
 *
 * Why: ExamplesPage.tsx is a client module. A server component that imports
 * EXAMPLES gets a client-reference proxy, so `.length` reads 0 rather than
 * throwing — the ItemList schema on /examples claimed 0 items and the build was
 * perfectly happy. Anything server-side must read examples-index.ts, and this
 * check is what stops the two drifting apart.
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = resolve(here, '../src');

const examplesPage = readFileSync(resolve(src, 'components/ExamplesPage.tsx'), 'utf8');
const indexFile = readFileSync(resolve(src, 'data/examples-index.ts'), 'utf8');
const seoFile = readFileSync(resolve(src, 'data/examples-seo.ts'), 'utf8');

// ids as written in the EXAMPLES array literal (4-space indented `id: '...'`)
const realIds = [...examplesPage.matchAll(/^ {4}id: '([a-z0-9-]+)',$/gm)].map((m) => m[1]);
const indexIds = [...indexFile.matchAll(/^ {2}'([a-z0-9-]+)',$/gm)].map((m) => m[1]);
const seoSlugs = [...seoFile.matchAll(/^ {4}slug: '([a-z0-9-]+)',$/gm)].map((m) => m[1]);

const failures = [];

if (realIds.length === 0) failures.push('Parsed 0 ids from ExamplesPage.tsx — the check is not reading the file.');

const missing = realIds.filter((id) => !indexIds.includes(id));
const extra = indexIds.filter((id) => !realIds.includes(id));
if (missing.length) failures.push(`examples-index.ts is missing: ${missing.join(', ')}`);
if (extra.length) failures.push(`examples-index.ts lists ids that no longer exist: ${extra.join(', ')}`);

const orphanSeo = seoSlugs.filter((s) => !realIds.includes(s));
if (orphanSeo.length) {
  failures.push(
    `examples-seo.ts has entries with no matching example: ${orphanSeo.join(', ')}\n` +
      `  Each would generate a page rendering nothing.`,
  );
}

if (failures.length) {
  console.error('\n✗ examples check failed:\n');
  for (const f of failures) console.error('  • ' + f + '\n');
  process.exit(1);
}

console.log(
  `✓ ${realIds.length} examples, index in sync, ${seoSlugs.length} with standalone pages ` +
    `(${realIds.length - seoSlugs.length} still index-only)`,
);

// ── HTML entities inside plain TS strings ────────────────────────────────────
// A string like 'Lenis&rsquo;s' is rendered as JSX *text*, so React escapes it
// and the page shows the literal "&rsquo;". This has bitten three separate
// files now (examples-seo, framework-landings, the Lenis page), so it is a
// check rather than a habit. Entities inside JSX markup are fine — those decode.
{
  const DATA_AND_PAGES = [
    'data/examples-seo.ts',
    'data/framework-landings.ts',
    'data/versus.ts',
    'data/blog-posts.ts',
    'data/competitors.ts',
  ];
  const ENTITY = /&(?:rsquo|lsquo|apos|quot|ldquo|rdquo|amp|mdash|ndash|nbsp);/;
  const entityHits = [];
  for (const rel of DATA_AND_PAGES) {
    let text;
    try { text = readFileSync(resolve(src, rel), 'utf8'); } catch { continue; }
    text.split('\n').forEach((line, i) => {
      if (ENTITY.test(line)) entityHits.push(`${rel}:${i + 1} — ${line.trim().slice(0, 70)}`);
    });
  }
  if (entityHits.length) {
    console.error('\n✗ HTML entity inside a data string (renders literally as text):\n');
    for (const h of entityHits) console.error('  • ' + h);
    console.error('\n  Use the real character instead — ’ “ ” — & —\n');
    process.exit(1);
  }
  console.log('✓ no HTML entities in data strings');
}
