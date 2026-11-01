#!/usr/bin/env node
/**
 * Fails when a top-level page has no link in the site's chrome.
 *
 * Why: the nav linked five sections and the footer twelve links, so nine
 * framework pages and four comparisons were reachable only through one blog
 * post and each other — React and Next.js sat four clicks from the homepage.
 * components/site/sitemap.ts now feeds the nav's "More" menu, the phone menu
 * and the footer index. Framework and comparison pages generated from data
 * are listed automatically; this catches a new top-level route folder that
 * nobody added there.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = resolve(here, '../src');
const appDir = resolve(src, 'app');

const sitemap = readFileSync(resolve(src, 'components/site/sitemap.ts'), 'utf8');
const versus = readFileSync(resolve(src, 'data/versus.ts'), 'utf8');

// Hand-listed links, then the comparison pages sitemap.ts generates from VERSUS.
const linked = new Set([...sitemap.matchAll(/href: '(\/[a-z0-9-]+)'/g)].map((m) => m[1]));
for (const m of versus.matchAll(/^ {4}slug: '(vs-[a-z0-9-]+)',$/gm)) linked.add(`/${m[1]}`);

// Static top-level routes: a folder under app/ with its own page.tsx. Dynamic
// segments ([framework]) are covered by the data that generates them.
const routes = readdirSync(appDir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && !d.name.startsWith('_') && !d.name.startsWith('['))
  .filter((d) => existsSync(resolve(appDir, d.name, 'page.tsx')))
  .map((d) => `/${d.name}`);

if (linked.size < 10 || routes.length < 10) {
  console.error(`✗ check-nav read ${linked.size} links and ${routes.length} routes — it is not reading the files.`);
  process.exit(1);
}

const missing = routes.filter((r) => !linked.has(r));
if (missing.length) {
  console.error(
    `✗ ${missing.length} page(s) have no link in the nav, phone menu or footer index:\n` +
      missing.map((r) => `  ${r}`).join('\n') +
      '\n  Add each to components/site/sitemap.ts.',
  );
  process.exit(1);
}

console.log(`✓ every top-level page is in the site's navigation (${routes.length} routes)`);
