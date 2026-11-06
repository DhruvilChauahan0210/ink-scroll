#!/usr/bin/env node
/**
 * Rewrites the `lastModified` values in src/app/sitemap.ts to each route's real
 * last-commit date. A file with uncommitted changes counts as changed today, so
 * running this just before a commit gives the dates that commit will have.
 *
 *   npm run sitemap:dates                        # rewrite
 *   node scripts/refresh-sitemap-dates.mjs --check   # fail if any date is stale
 *
 * `--check` runs in `npm run verify` and CI (which checks out full history):
 * the dates are what Google and IndexNow (scripts/indexnow.mjs) read to tell
 * which pages changed, and they sat at one day for a whole day of releases
 * before this was enforced.
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

const CHECK = process.argv.includes('--check');

/**
 * Routes whose page.tsx is a thin wrapper: what they say lives in these files
 * too (paths relative to src/, a directory counts as every file in it).
 */
const ALSO = {
  '/docs': ['components/DocsPage.tsx'],
  '/examples': ['components/ExamplesPage.tsx'],
  '/blocks': ['../registry'],
  '/blog/horizontal-scroll-sections': ['components/recipes', 'recipes/horizontal-scroll-sections'],
};

/** Map a sitemap URL path to the source files that render it. */
function sourcesFor(urlPath) {
  const slug = urlPath.replace(/^\/+/, '');
  const page = resolve(appDir, slug === '' ? 'page.tsx' : `${slug}/page.tsx`);
  return [page, ...(ALSO[`/${slug}`] ?? []).map((f) => resolve(appDir, '..', f))];
}

/** Today in local time, the way `git log --format=%cs` prints a commit made now. */
const today = new Date().toLocaleDateString('en-CA');

function lastCommitDate(file) {
  try {
    const dirty = execFileSync('git', ['status', '--porcelain', '--', file], { cwd: repoRoot, encoding: 'utf8' }).trim();
    if (dirty) return today;
    const out = execFileSync('git', ['log', '-1', '--format=%cs', '--', file], {
      cwd: repoRoot,
      encoding: 'utf8',
    }).trim();
    return out || null;
  } catch {
    return null;
  }
}

/** The newest date across files, or null when none has a commit. */
const newest = (files) => files.map(lastCommitDate).filter(Boolean).sort().at(-1) ?? null;

const src = readFileSync(sitemapPath, 'utf8');
const skipped = [];
const stale = [];
let changed = 0;

// Each entry is `url: \`${SITE_URL}<path>\`,` followed by `lastModified: new Date("...")`.
const entry = /url: `\$\{SITE_URL\}([^`]*)`,\s*\n(\s*)lastModified: new Date\("([\d-]+)"\)/g;

const next = src.replace(entry, (whole, urlPath, indent, currentDate) => {
  const date = newest(sourcesFor(urlPath));
  if (!date) {
    skipped.push(urlPath || '/');
    return whole;
  }
  if (date !== currentDate) {
    changed++;
    stale.push(`${urlPath || '/'} ${currentDate} → ${date}`);
  }
  return whole.replace(`new Date("${currentDate}")`, `new Date("${date}")`);
});

// Pages generated from data: one date per group, the newest commit across the
// files that decide what those pages say. Paths are relative to src/.
const srcDir = resolve(appDir, '..');
const groups = {
  FRAMEWORK_PAGES_DATE: ['app/[framework]/page.tsx', 'data/framework-landings.ts', 'data/framework-guides'],
  VERSUS_PAGES_DATE: ['components/VersusPage.tsx', 'data/versus.ts'],
  // The recipes are printed on their example pages (components/recipes).
  EXAMPLE_PAGES_DATE: ['app/examples/[slug]/page.tsx', 'components/ExampleDetail.tsx', 'data/examples-seo.ts', 'components/recipes', 'recipes'],
  GUIDE_PAGES_DATE: ['app/guides/[slug]/page.tsx', 'components/GuidePage.tsx', 'data/guides.ts'],
};

let final = next;
for (const [name, files] of Object.entries(groups)) {
  const date = newest(files.map((f) => resolve(srcDir, f)));
  const decl = new RegExp(`const ${name} = "([\\d-]+)";`);
  const current = final.match(decl);
  if (!current) {
    console.error(`✗ ${name} is not declared in sitemap.ts`);
    process.exit(1);
  }
  if (!date) {
    skipped.push(name);
    continue;
  }
  if (date !== current[1]) {
    changed++;
    stale.push(`${name} ${current[1]} → ${date}`);
  }
  final = final.replace(decl, `const ${name} = "${date}";`);
}

if (CHECK) {
  if (stale.length) {
    console.error(`✗ sitemap.ts has ${stale.length} stale date(s). Run: npm run sitemap:dates --workspace=apps/demo\n  ${stale.join('\n  ')}`);
    process.exit(1);
  }
  console.log('✓ sitemap.ts dates match git');
  process.exit(0);
}

writeFileSync(sitemapPath, final);

console.log(`sitemap.ts — ${changed} date(s) updated from git.`);
if (skipped.length) {
  console.log(`No commit found, left unchanged: ${skipped.join(', ')}`);
}
