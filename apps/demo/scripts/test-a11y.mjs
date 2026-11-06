#!/usr/bin/env node
/**
 * Every page in the sitemap, in a real browser: axe's WCAG 2.1 A and AA rules,
 * and every internal link and #anchor resolved.
 *
 * Why: the page sweep proved each page loads without errors, not that a screen
 * reader can use it or that its links go anywhere. Search engines count both.
 * axe runs twice per page — as loaded, and after scrolling to the bottom,
 * since some of the site mounts as the reader scrolls — with reduced motion, so
 * every scroll effect is in its final state.
 *
 * Needs the site running (`next start`, as test-blocks does):
 *   BASE_URL=http://localhost:3100 node scripts/test-a11y.mjs
 *   ... --report      list everything and exit 0 (for triage)
 */
import { createRequire } from 'node:module';
import { chromium } from 'playwright';

const BASE = (process.env.BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
const REPORT = process.argv.includes('--report');
const require = createRequire(import.meta.url);
const AXE = require.resolve('axe-core/axe.min.js');

/**
 * Rules switched off, each with the reason. Keep this empty unless a rule
 * cannot be right here; a real finding gets fixed, not listed.
 */
const SKIP_RULES = {};

const sitemap = await (await fetch(`${BASE}/sitemap.xml`)).text();
const pages = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
if (!pages.length) {
  console.error(`✗ test-a11y: no URLs in ${BASE}/sitemap.xml`);
  process.exit(1);
}

const browser = await chromium.launch();
// Reduced motion: the library then shows every element in its final state, which
// is the one contrast has to hold for. With motion on, axe also measured elements
// half-way through a fade (a gold label at 30% opacity) and reported those.
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });

/** rule id → { impact, help, pages: Map(path → sample selector) } */
const violations = new Map();
/** target path (with #hash) → Set of pages linking to it */
const links = new Map();
const pageErrors = [];

async function audit(page, path) {
  await page.addScriptTag({ path: AXE });
  const result = await page.evaluate(async (skip) => {
    const rules = Object.fromEntries(skip.map((id) => [id, { enabled: false }]));
    // axe 4.14 treats `overflow: hidden` as hiding what it cuts off, but not
    // `overflow: clip` (checked with a two-card page: hidden → not flagged,
    // clip → flagged), so it measured the horizontal strip's off-stage cards
    // against the page behind the strip. Leave out what a clip box cuts off at
    // its centre (where axe samples the background, so the next card peeking
    // in at the edge counted too); the rest of the box is audited as usual.
    for (const box of document.querySelectorAll('*')) {
      const cs = getComputedStyle(box);
      if (cs.overflowX !== 'clip' && cs.overflowY !== 'clip') continue;
      const r = box.getBoundingClientRect();
      for (const el of box.querySelectorAll('*')) {
        const e = el.getBoundingClientRect();
        const x = e.left + e.width / 2;
        const y = e.top + e.height / 2;
        if (e.width && (x < r.left || x > r.right || y < r.top || y > r.bottom)) el.setAttribute('data-a11y-clipped', '');
      }
    }
    const out = await axe.run({ exclude: [['[data-a11y-clipped]']] }, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] }, rules });
    for (const el of document.querySelectorAll('[data-a11y-clipped]')) el.removeAttribute('data-a11y-clipped');
    return out;
  }, Object.keys(SKIP_RULES));
  for (const v of result.violations) {
    const entry = violations.get(v.id) ?? { impact: v.impact, help: v.help, pages: new Map() };
    if (!entry.pages.has(path)) entry.pages.set(path, `${v.nodes.length}× ${v.nodes[0]?.target?.join(' ')}`);
    violations.set(v.id, entry);
  }
}

for (const path of pages) {
  const page = await ctx.newPage();
  page.on('pageerror', (e) => pageErrors.push(`${path}: ${String(e).slice(0, 160)}`));
  const res = await page.goto(BASE + path, { waitUntil: 'load' });
  if (!res || res.status() !== 200) pageErrors.push(`${path}: HTTP ${res?.status()}`);
  await page.waitForTimeout(300);
  await audit(page, path);

  // Scroll through as a reader would, then audit the drawn state.
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += 700) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(40);
  }
  await page.waitForTimeout(300);
  await audit(page, path);

  // The attribute, resolved here: an SVG <a>'s .href is an object, not a string.
  const hrefs = await page.evaluate(() => [...document.querySelectorAll('a[href]')].map((a) => new URL(a.getAttribute('href'), location.href).href));
  for (const href of hrefs) {
    const u = new URL(href);
    if (!u.protocol.startsWith('http')) continue;
    if (u.origin !== new URL(BASE).origin) continue;
    const key = u.pathname + u.hash;
    if (!links.has(key)) links.set(key, new Set());
    links.get(key).add(path);
  }
  await page.close();
}
await browser.close();

// ── Links: every internal target loads, and every #anchor exists there ───────
const broken = [];
const htmlCache = new Map();
for (const [target, from] of links) {
  const [pathname, hash = ''] = target.split('#');
  if (!htmlCache.has(pathname)) {
    const r = await fetch(BASE + pathname, { redirect: 'follow' });
    htmlCache.set(pathname, { status: r.status, html: r.ok && (r.headers.get('content-type') ?? '').includes('html') ? await r.text() : '' });
  }
  const { status, html } = htmlCache.get(pathname);
  if (status !== 200) broken.push(`${target} → HTTP ${status} (from ${[...from].slice(0, 3).join(', ')})`);
  else if (hash && html && !new RegExp(`\\b(id|name)="${decodeURIComponent(hash).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`).test(html)) {
    broken.push(`${target} → no #${hash} on the page (from ${[...from].slice(0, 3).join(', ')})`);
  }
}

// ── Report ───────────────────────────────────────────────────────────────────
const order = { critical: 0, serious: 1, moderate: 2, minor: 3 };
const sorted = [...violations].sort((a, b) => order[a[1].impact] - order[b[1].impact] || b[1].pages.size - a[1].pages.size);
for (const [id, v] of sorted) {
  console.log(`${v.impact.padEnd(8)} ${id} — ${v.help} — ${v.pages.size} page(s)`);
  for (const [p, sample] of [...v.pages].slice(0, REPORT ? 6 : 3)) console.log(`           ${p}: ${sample}`);
}
for (const b of broken) console.log(`link     ${b}`);
for (const e of pageErrors) console.log(`page     ${e}`);

const failing = sorted.filter(([, v]) => v.impact === 'critical' || v.impact === 'serious');
console.log(`\n${pages.length} pages, ${links.size} internal link targets: ${violations.size} axe rule(s) violated (${failing.length} serious or critical), ${broken.length} broken link(s), ${pageErrors.length} page error(s).`);
if (!REPORT && (failing.length || broken.length || pageErrors.length)) process.exit(1);
