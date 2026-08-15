#!/usr/bin/env node
/**
 * Rewrites the `lastModified` values in src/app/sitemap.ts to each route's real
 * last-commit date.
 *
 * The sitemap is `force-static`, and Vercel builds from a shallow clone where
 * `git log` for an arbitrary path is not reliable — so the dates are baked into
 * the file here rather than read at build time. Run this before a release:
 *
 *   npm run sitemap:dates
 *
 * A route with no commits yet (or an untracked file) keeps whatever date is
 * already in the sitemap, and is reported at the end.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const appDir = resolve(here, '../src/app');
const sitemapPath = resolve(appDir, 'sitemap.ts');
const repoRoot = execFileSync('git', ['rev-parse', '--show-toplevel'], {
  encoding: 'utf8',
}).trim();

/** Map a sitemap URL path to the source file that renders it. */
function sourceFor(urlPath) {
  const slug = urlPath.replace(/^\/+/, '');
  return resolve(appDir, slug === '' ? 'page.tsx' : `${slug}/page.tsx`);
}

function lastCommitDate(file) {
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%cs', '--', file], {
      cwd: repoRoot,
      encoding: 'utf8',
    }).trim();
    return out || null;
  } catch {
    return null;
  }
}

const src = readFileSync(sitemapPath, 'utf8');
const skipped = [];
let changed = 0;

// Each entry is `url: \`${SITE_URL}<path>\`,` followed by `lastModified: new Date("...")`.
const entry = /url: `\$\{SITE_URL\}([^`]*)`,\s*\n(\s*)lastModified: new Date\("([\d-]+)"\)/g;

const next = src.replace(entry, (whole, urlPath, indent, currentDate) => {
  const date = lastCommitDate(sourceFor(urlPath));
  if (!date) {
    skipped.push(urlPath || '/');
    return whole;
  }
  if (date !== currentDate) changed++;
  return whole.replace(`new Date("${currentDate}")`, `new Date("${date}")`);
});

writeFileSync(sitemapPath, next);

console.log(`sitemap.ts — ${changed} date(s) updated from git.`);
if (skipped.length) {
  console.log(`No commit found, left unchanged: ${skipped.join(', ')}`);
}
