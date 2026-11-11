#!/usr/bin/env node
/**
 * Writes reports/numbers-<date>.md: where installs and visits come from this
 * week, from sources that need no tracking on the site.
 *
 *   - npm downloads per day for the last 30 days (api.npmjs.org)
 *   - jsDelivr requests for the package and its busiest files (data.jsdelivr.com)
 *     — the recipe files and the tools' HTML downloads load the library from it
 *   - GitHub: stars, views and clones for 14 days, the sites that send visitors
 *     to the repo, and its most viewed paths (needs `gh` signed in as an owner)
 *   - GitHub code search for the tools' source line (`Made with
 *     https://svg-scroll-draw.vercel.app/<tool>`, lib/tool-export.ts): which
 *     tools' code ended up in other people's repositories
 *
 * Search Console and Vercel Analytics have no free API for this, so their
 * figures are left for whoever reads the report to add.
 *
 * Every source is optional: one that fails is reported as failed and the rest
 * still print. Usage: node scripts/report-numbers.mjs   (or npm run report:numbers)
 * On a network that intercepts TLS, run it with NODE_OPTIONS=--use-system-ca.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PKG = 'svg-scroll-draw';
const REPO = 'DhruvilChauahan0210/ink-scroll';
const HOST = 'svg-scroll-draw.vercel.app';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const today = new Date().toISOString().slice(0, 10);

async function json(url) {
  const res = await fetch(url, { headers: { 'user-agent': `${PKG}-report` } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

function gh(path, ...args) {
  return JSON.parse(execFileSync('gh', ['api', path, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));
}

/** Runs one section; a failure becomes a line in the report instead of a crash. */
async function section(title, fn) {
  try {
    return [`## ${title}`, '', ...(await fn()), ''];
  } catch (e) {
    return [`## ${title}`, '', `_Not available: ${String(e.message ?? e).split('\n')[0]}_`, ''];
  }
}

const sum = (xs) => xs.reduce((a, b) => a + b, 0);
const table = (head, rows) => [
  `| ${head.join(' | ')} |`,
  `|${head.map(() => '---').join('|')}|`,
  ...rows.map((r) => `| ${r.join(' | ')} |`),
];

const out = [
  `# Numbers — ${today}`,
  '',
  'Written by `scripts/report-numbers.mjs`. Add Search Console (clicks and impressions per page) and Vercel Analytics (top pages, referrers) by hand.',
  '',
];

out.push(...(await section('npm downloads, last 30 days', async () => {
  const d = await json(`https://api.npmjs.org/downloads/range/last-month/${PKG}`);
  const days = d.downloads;
  const week = (n) => sum(days.slice(-7 * n, days.length - 7 * (n - 1)).map((x) => x.downloads));
  return [
    `Total ${sum(days.map((x) => x.downloads))} (${d.start} to ${d.end}). Last 7 days ${week(1)}, the 7 before ${week(2)}.`,
    '',
    ...table(['Day', 'Downloads'], days.slice(-14).map((x) => [x.day, String(x.downloads)])),
  ];
})));

out.push(...(await section('jsDelivr, last 30 days', async () => {
  const pkg = await json(`https://data.jsdelivr.com/v1/stats/packages/npm/${PKG}?period=month`);
  const versions = await json(`https://data.jsdelivr.com/v1/stats/packages/npm/${PKG}/versions?period=month&limit=5`);
  const lines = [`Requests ${pkg.hits?.total ?? '?'}, bandwidth ${Math.round((pkg.bandwidth?.total ?? 0) / 1024)} KB.`, ''];
  lines.push(...table(['Version', 'Requests'], versions.map((v) => [v.version, String(v.hits?.total ?? '?')])));
  const top = versions[0]?.version;
  if (top) {
    const files = await json(`https://data.jsdelivr.com/v1/stats/packages/npm/${PKG}@${top}/files?period=month&limit=8`);
    lines.push('', `Busiest files of ${top}:`, '', ...table(['File', 'Requests'], files.map((f) => [`\`${f.name}\``, String(f.hits?.total ?? '?')])));
  }
  return lines;
})));

out.push(...(await section('GitHub, last 14 days', async () => {
  const repo = gh(`repos/${REPO}`);
  const views = gh(`repos/${REPO}/traffic/views`);
  const clones = gh(`repos/${REPO}/traffic/clones`);
  const refs = gh(`repos/${REPO}/traffic/popular/referrers`);
  const paths = gh(`repos/${REPO}/traffic/popular/paths`);
  return [
    `Stars ${repo.stargazers_count}, forks ${repo.forks_count}. Views ${views.count} (${views.uniques} unique), clones ${clones.count} (${clones.uniques} unique).`,
    '',
    'Sites sending visitors:',
    '',
    ...table(['Referrer', 'Views', 'Unique'], refs.map((r) => [r.referrer, String(r.count), String(r.uniques)])),
    '',
    'Most viewed:',
    '',
    ...table(['Path', 'Views', 'Unique'], paths.slice(0, 8).map((p) => [`\`${p.path}\``, String(p.count), String(p.uniques)])),
  ];
})));

out.push(...(await section('Tool code in other repositories', async () => {
  // Code search needs a signed-in token; results lag the index by days.
  const res = gh('search/code', '-X', 'GET', '-f', `q="${HOST}/" -repo:${REPO}`, '-f', 'per_page=100');
  const byTool = new Map();
  for (const item of res.items ?? []) {
    const key = item.repository?.full_name ?? '?';
    byTool.set(key, (byTool.get(key) ?? 0) + 1);
  }
  return [
    `${res.total_count ?? 0} file(s) mention ${HOST}/ outside this repository (searching code only finds the tools' source line once GitHub has indexed it).`,
    ...(byTool.size ? ['', ...table(['Repository', 'Files'], [...byTool].map(([k, v]) => [k, String(v)]))] : []),
  ];
})));

const file = join(root, 'reports', `numbers-${today}.md`);
mkdirSync(dirname(file), { recursive: true });
writeFileSync(file, out.join('\n'));
console.log(`✓ wrote ${file}`);
