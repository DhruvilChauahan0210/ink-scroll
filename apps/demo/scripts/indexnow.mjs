#!/usr/bin/env node
/**
 * Tells the IndexNow search engines (Bing, Yandex, Seznam, Naver and the rest)
 * which pages changed, right after a production deploy.
 *
 * Why: on 2026-11-04 Search Console listed 35 of the site's pages as
 * "Discovered – not indexed": found in the sitemap, never crawled. IndexNow is
 * the push side of that for every engine but Google. One request names the
 * changed URLs; the engines fetch the key file below to check the site sent it.
 *
 * Which pages: every sitemap URL whose <lastmod> (the date of the last commit
 * behind the page, so a day, not a time) is on or after the day of the previous
 * production deploy. A day with several deploys sends that day's pages again;
 * IndexNow takes updated URLs more than once, and the list stays small.
 *
 *   node scripts/indexnow.mjs              # after a deploy (the workflow runs it)
 *   node scripts/indexnow.mjs --all        # every sitemap URL, once, to catch up
 *   node scripts/indexnow.mjs --dry-run    # print the request, send nothing
 *
 * It fails on what this repo controls (no key file, a key file the site does
 * not serve, an empty sitemap, a request IndexNow calls malformed) and only
 * warns when the engines refuse the site or are busy (403, 429, 5xx).
 *
 * GITHUB_TOKEN and GITHUB_REPOSITORY (set in Actions) find the previous
 * deploy; without them it falls back to the last day. SITEMAP_URL reads the
 * sitemap from somewhere else (a local `next start`) to try it before a deploy.
 */
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = 'https://svg-scroll-draw.vercel.app';
const KEY = 'cff7b1aad337fe3f2e7de7398f3b57b9';
const KEY_LOCATION = `${SITE}/${KEY}.txt`;
const ENDPOINT = 'https://api.indexnow.org/indexnow';

const args = new Set(process.argv.slice(2));
const ALL = args.has('--all');
const DRY = args.has('--dry-run');

const fail = (msg) => {
  console.error(`✗ indexnow: ${msg}`);
  process.exit(1);
};

// The key file ships with the site; a rename here without one there would send
// requests every engine rejects.
const here = dirname(fileURLToPath(import.meta.url));
if (!existsSync(join(here, '..', 'public', `${KEY}.txt`))) fail(`public/${KEY}.txt is missing`);

/** The live key file must answer with the key, or the engines refuse the request. */
async function keyIsLive() {
  for (let i = 0; i < 6; i++) {
    const res = await fetch(KEY_LOCATION, { cache: 'no-store' }).catch(() => null);
    if (res?.ok && (await res.text()).trim() === KEY) return true;
    await new Promise((r) => setTimeout(r, 10_000)); // a deploy can take a moment to reach the edge
  }
  return false;
}

/** Day (00:00 UTC) of the production deploy before this one, from GitHub's deployments. */
async function previousDeployDay() {
  const { GITHUB_TOKEN: token, GITHUB_REPOSITORY: repo } = process.env;
  if (token && repo) {
    const res = await fetch(`https://api.github.com/repos/${repo}/deployments?environment=Production&per_page=2`, {
      headers: { authorization: `Bearer ${token}`, accept: 'application/vnd.github+json' },
    });
    if (res.ok) {
      const list = await res.json();
      // [0] is the deploy that triggered this run; [1] the one before it.
      if (list[1]?.created_at) return new Date(`${list[1].created_at.slice(0, 10)}T00:00:00Z`);
    }
  }
  return new Date(Date.now() - 24 * 60 * 60 * 1000);
}

const xml = await (await fetch(process.env.SITEMAP_URL ?? `${SITE}/sitemap.xml`, { cache: 'no-store' })).text();
const entries = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(([, body]) => ({
  loc: /<loc>([^<]+)<\/loc>/.exec(body)?.[1]?.trim(),
  lastmod: /<lastmod>([^<]+)<\/lastmod>/.exec(body)?.[1]?.trim(),
}));
if (!entries.length) fail('the sitemap has no URLs');

const since = ALL ? null : await previousDeployDay();
const urlList = entries
  .filter((e) => e.loc?.startsWith(SITE))
  .filter((e) => ALL || (e.lastmod && new Date(e.lastmod) >= since))
  .map((e) => e.loc);

console.log(ALL
  ? `${urlList.length} of ${entries.length} sitemap URLs (--all)`
  : `${urlList.length} of ${entries.length} sitemap URLs changed on or after ${since.toISOString().slice(0, 10)}`);
if (!urlList.length) process.exit(0);

const body = { host: new URL(SITE).host, key: KEY, keyLocation: KEY_LOCATION, urlList };
if (DRY) {
  console.log(JSON.stringify(body, null, 2));
  process.exit(0);
}
if (!(await keyIsLive())) fail(`${KEY_LOCATION} does not answer with the key`);

const res = await fetch(ENDPOINT, {
  method: 'POST',
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify(body),
});
// 200: received. 202: received, the key is still being checked (first use).
// 400 and 422 say this request is wrong (its shape, or URLs off the host), so
// the run fails. Anything else is the engines' answer about the site: a 403
// (on 2026-11-06 Bing took two runs with 202, then refused the next two with
// "UserForbiddedToAccessSite", while the key file answered as above), a 429,
// a 5xx. No change here fixes those, so they warn instead of turning the
// deploy red.
if (res.status !== 200 && res.status !== 202) {
  const said = `IndexNow answered ${res.status}: ${(await res.text()).slice(0, 300)}`;
  if (res.status === 400 || res.status === 422) fail(said);
  const hint = res.status === 403
    ? ` The key file answers with the key, so the engine refused the site itself; adding the site to Bing Webmaster Tools and verifying it there is the first thing to try.`
    : '';
  console.warn(`⚠ indexnow: ${said}.${hint} None of the ${urlList.length} URL(s) were taken; a manual run with "all" sends every page again.`);
  if (process.env.GITHUB_ACTIONS) console.log(`::warning title=IndexNow refused the request::${said}.${hint}`);
  process.exit(0);
}
console.log(`✓ sent ${urlList.length} URL(s) to IndexNow (${res.status})`);
for (const u of urlList) console.log(`  ${u}`);
