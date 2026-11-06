import { unstable_cache } from 'next/cache';

/**
 * The figures behind the homepage's live chapter and /api/stars, each kept in
 * Next's data cache for an hour, and each kept when a refresh fails.
 *
 * A plain `fetch(url, { next: { revalidate } })` does not keep it: when an ISR
 * regeneration finds the cached response stale, Next fetches again in the
 * foreground and hands the page whatever came back, and it caches only 200s.
 * So a 403 from GitHub's anonymous limit (60 calls an hour per IP, and Vercel's
 * build and function IPs are shared) reached the page as "—" and stayed there
 * until the next regeneration. `unstable_cache` returns its last value when a
 * revalidation throws, so `load` throws on anything but a good answer.
 *
 * GITHUB_TOKEN, when set, is sent to GitHub and lifts the limit to 5,000 an
 * hour. It is never part of a cache key, so setting it keeps the cached figures.
 */

export const GH_REPO = 'DhruvilChauahan0210/ink-scroll';
export const NPM_PKG = 'svg-scroll-draw';
const REVALIDATE = 3600;

/** A figure and when its source answered (its `Date` header, in ms). */
export type Got<T> = { data: T; at: number };
export type Repo = { stars: number; forks: number; issues: number; pushed: string };
export type Day = { day: string; downloads: number };

async function getJSON<T>(url: string, headers?: Record<string, string>): Promise<Got<T>> {
  // Not cached here: the `unstable_cache` around each figure is the cache.
  const r = await fetch(url, { cache: 'no-store', headers });
  if (!r.ok) {
    const limited = r.headers.get('x-ratelimit-remaining') === '0' ? ', rate limit reached' : '';
    throw new Error(`${new URL(url).host} answered ${r.status}${limited}`);
  }
  const at = Date.parse(r.headers.get('date') ?? '');
  return { data: (await r.json()) as T, at: Number.isFinite(at) ? at : Date.now() };
}

/**
 * `load`, cached under `key`. A failure gives the last good value; null only
 * when there has never been one (a fresh cache and a source that refuses).
 */
function keep<A extends unknown[], T>(
  key: string,
  load: (...args: A) => Promise<Got<T>>,
  revalidate: number | false = REVALIDATE,
) {
  const cached = unstable_cache(load, ['live', key], { revalidate });
  return async (...args: A): Promise<Got<T> | null> => {
    try {
      return await cached(...args);
    } catch (err) {
      console.error(`[live] ${key}: ${err instanceof Error ? err.message : String(err)}`);
      return null;
    }
  };
}

export const getRepo = keep('github', async (): Promise<Got<Repo>> => {
  const token = process.env.GITHUB_TOKEN;
  const got = await getJSON<Record<string, unknown>>(`https://api.github.com/repos/${GH_REPO}`, {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  });
  const { stargazers_count: stars, forks_count: forks, open_issues_count: issues, pushed_at: pushed } = got.data;
  if (typeof stars !== 'number' || typeof forks !== 'number' || typeof issues !== 'number' || typeof pushed !== 'string') {
    throw new Error('api.github.com: the repo answer is missing a field');
  }
  return { data: { stars, forks, issues, pushed }, at: got.at };
});

const point = (period: 'last-week' | 'last-month') =>
  keep(`npm-${period}`, async (): Promise<Got<number>> => {
    const got = await getJSON<{ downloads?: unknown }>(`https://api.npmjs.org/downloads/point/${period}/${NPM_PKG}`);
    if (typeof got.data.downloads !== 'number') throw new Error(`api.npmjs.org: no ${period} count`);
    return { data: got.data.downloads, at: got.at };
  });

export const getWeek = point('last-week');
export const getMonth = point('last-month');

export const getDays = keep('npm-days', async (): Promise<Got<Day[]>> => {
  const got = await getJSON<{ downloads?: unknown }>(`https://api.npmjs.org/downloads/range/last-month/${NPM_PKG}`);
  const days = got.data.downloads;
  if (!Array.isArray(days) || !days.every((d) => typeof d?.day === 'string' && typeof d?.downloads === 'number')) {
    throw new Error('api.npmjs.org: no daily counts');
  }
  return { data: days as Day[], at: got.at };
});

/** The first publish, from the registry. It never changes, so it is fetched once (the document is ~300 KB). */
const getCreated = keep('npm-created', async (): Promise<Got<string>> => {
  const got = await getJSON<{ time?: { created?: unknown } }>(`https://registry.npmjs.org/${NPM_PKG}`);
  const created = got.data.time?.created;
  if (typeof created !== 'string' || !/^\d{4}-\d{2}-\d{2}/.test(created)) throw new Error('registry.npmjs.org: no time.created');
  return { data: created.slice(0, 10), at: got.at };
}, false);

const DAY = 86_400_000;
const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/**
 * Every download from `since` to today. npm answers at most 18 months per
 * request and quietly drops the oldest days of a longer range, so it is asked a
 * year at a time, and an answer that starts on another day is refused.
 */
const getTotalSince = keep('npm-total', async (since: string): Promise<Got<number>> => {
  const end = Date.parse(`${iso(Date.now())}T00:00:00Z`);
  const spans: [string, string][] = [];
  for (let a = Date.parse(`${since}T00:00:00Z`); a <= end; a += 365 * DAY) spans.push([iso(a), iso(Math.min(a + 364 * DAY, end))]);
  const answers = await Promise.all(
    spans.map(async ([from, to]) => {
      const got = await getJSON<{ downloads?: unknown; start?: unknown }>(`https://api.npmjs.org/downloads/point/${from}:${to}/${NPM_PKG}`);
      if (typeof got.data.downloads !== 'number' || got.data.start !== from) throw new Error(`api.npmjs.org: no count for ${from}:${to}`);
      return { n: got.data.downloads, at: got.at };
    }),
  );
  return { data: answers.reduce((s, x) => s + x.n, 0), at: Math.min(...answers.map((x) => x.at)) };
});

/** Lifetime npm downloads: summed from the first publish, refreshed hourly like the rest. */
export async function getLifetime(): Promise<Got<number> | null> {
  const created = await getCreated();
  return created ? getTotalSince(created.data) : null;
}
