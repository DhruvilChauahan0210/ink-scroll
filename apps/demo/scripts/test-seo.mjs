#!/usr/bin/env node
/**
 * What a crawler reads on every page in the sitemap: the server-rendered HTML,
 * checked for the things search results are built from.
 *
 * Why: titles were fixed by hand once (2026-10-30, all ≤ 60 characters) and
 * nothing kept them there; descriptions, canonicals and preview images were
 * never checked at all. Search Console listed 35 of the 64 pages as
 * "Discovered – not indexed", so every page has to give a crawler its best.
 *
 * Per page: a <title> of at most 60 characters and unique; a meta description
 * of 50–160 characters and unique; a canonical that is the page's own absolute
 * URL; exactly one <h1>; <html lang>; no noindex; og:title, og:description and
 * an og:image that loads as an image; twitter:card; JSON-LD that parses and
 * names a @type. Across pages: every page linked from at least two others.
 *
 * Needs the site running (`next start`, as test-blocks does):
 *   BASE_URL=http://localhost:3100 node scripts/test-seo.mjs
 *   ... --report      list everything and exit 0 (for triage)
 */
const BASE = (process.env.BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
const SITE = 'https://svg-scroll-draw.vercel.app';
const REPORT = process.argv.includes('--report');

/** The production URL a page claims, read from this server instead. */
const local = (url) => url.replace(SITE, BASE);

const sitemap = await (await fetch(`${BASE}/sitemap.xml`)).text();
const pages = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
if (!pages.length) {
  console.error(`✗ test-seo: no URLs in ${BASE}/sitemap.xml`);
  process.exit(1);
}

const decode = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const meta = (html, attr, key) =>
  decode(new RegExp(`<meta[^>]*${attr}="${key}"[^>]*content="([^"]*)"`, 'i').exec(html)?.[1]
    ?? new RegExp(`<meta[^>]*content="([^"]*)"[^>]*${attr}="${key}"`, 'i').exec(html)?.[1] ?? '');

const problems = [];
const add = (path, msg) => problems.push(`${path}: ${msg}`);
const titles = new Map();
const descriptions = new Map();
const inbound = new Map(pages.map((p) => [p, new Set()]));
const images = new Set();

for (const path of pages) {
  const res = await fetch(BASE + path);
  const html = await res.text();
  if (res.status !== 200) { add(path, `HTTP ${res.status}`); continue; }
  const head = html.slice(0, html.indexOf('</head>') + 7);

  const title = decode(/<title>([^<]*)<\/title>/i.exec(head)?.[1] ?? '');
  if (!title) add(path, 'no <title>');
  else if (title.length > 60) add(path, `title is ${title.length} characters (max 60): "${title}"`);
  titles.set(title, [...(titles.get(title) ?? []), path]);

  const desc = meta(head, 'name', 'description');
  if (!desc) add(path, 'no meta description');
  else if (desc.length < 50 || desc.length > 160) add(path, `description is ${desc.length} characters (50–160): "${desc.slice(0, 80)}…"`);
  descriptions.set(desc, [...(descriptions.get(desc) ?? []), path]);

  const canonical = /<link[^>]*rel="canonical"[^>]*href="([^"]*)"/i.exec(head)?.[1] ?? '';
  const want = SITE + (path === '/' ? '' : path);
  if (!canonical) add(path, 'no canonical');
  else if (canonical.replace(/\/$/, '') !== want.replace(/\/$/, '')) add(path, `canonical is ${canonical}, not ${want}`);

  const h1 = (html.match(/<h1[\s>]/gi) ?? []).length;
  if (h1 !== 1) add(path, `${h1} <h1> elements (want 1)`);
  if (!/<html[^>]*\slang="[a-z-]+"/i.test(html)) add(path, 'no <html lang>');
  if (/<meta[^>]*name="robots"[^>]*content="[^"]*noindex/i.test(head)) add(path, 'noindex on a sitemap page');

  for (const key of ['og:title', 'og:description', 'og:image']) if (!meta(head, 'property', key)) add(path, `no ${key}`);
  if (!meta(head, 'name', 'twitter:card')) add(path, 'no twitter:card');
  const ogImage = meta(head, 'property', 'og:image');
  if (ogImage) images.add(ogImage);

  for (const [, json] of html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const data = JSON.parse(json);
      const items = Array.isArray(data) ? data : data['@graph'] ?? [data];
      if (!items.every((i) => i['@type'])) add(path, 'JSON-LD item without @type');
    } catch (e) {
      add(path, `JSON-LD does not parse: ${String(e).slice(0, 80)}`);
    }
  }

  // Internal links out of this page, for the inbound count.
  for (const [, href] of html.matchAll(/<a[^>]*\shref="([^"#?]*)[^"]*"/gi)) {
    if (!href.startsWith('/') || href.startsWith('//')) continue;
    const target = href.replace(/\/$/, '') || '/';
    if (target !== path && inbound.has(target)) inbound.get(target).add(path);
  }
}

for (const [t, ps] of titles) if (t && ps.length > 1) add(ps.join(', '), `share the title "${t}"`);
for (const [d, ps] of descriptions) if (d && ps.length > 1) add(ps.join(', '), `share the description "${d.slice(0, 60)}…"`);

for (const url of images) {
  const r = await fetch(local(url));
  const type = r.headers.get('content-type') ?? '';
  if (r.status !== 200 || !type.startsWith('image/')) add(url, `og:image answers ${r.status} ${type}`);
}

const thin = [...inbound].filter(([p, from]) => p !== '/' && from.size < 2);
for (const [p, from] of thin) add(p, `linked from ${from.size} other page(s) (want 2+)`);

for (const p of problems) console.log(`  ${p}`);
console.log(`\n${pages.length} pages, ${images.size} distinct preview image(s): ${problems.length} problem(s).`);
if (!REPORT && problems.length) process.exit(1);
