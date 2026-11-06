#!/usr/bin/env node
/**
 * Short labels that start with a lowercase letter, on every sitemap page.
 *
 * Why: the site's labels were set in uppercase with wide tracking, which
 * heydamir/unslop lists as a sign of AI-looking UI; they are sentence case now.
 * The CSS transform hid how each label was written, so a label written in
 * lowercase showed up lowercase once it went. This lists the ones left, so each
 * can be given a capital at its source. Code (package names, `.track`, `v2`,
 * `npm`) is meant to stay lowercase: read the list, don't apply it blindly.
 *
 *   BASE_URL=http://localhost:3200 node scripts/find-lowercase-labels.mjs
 */
import { chromium } from 'playwright';

const BASE = (process.env.BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
const sitemap = await (await fetch(`${BASE}/sitemap.xml`)).text();
const pages = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
const found = new Map(); // text → Set of pages

for (const path of pages) {
  const page = await ctx.newPage();
  await page.goto(BASE + path, { waitUntil: 'load' });
  const labels = await page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll('body *')) {
      if (el.closest('pre, code, kbd, samp, svg, [data-showcase], .pl-ed, textarea, script, style')) continue;
      // Own text only: the label itself, not a paragraph that contains one.
      const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim();
      if (!own || own.length > 48 || !/^[a-z]/.test(own)) continue;
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      if (!r.width || cs.visibility === 'hidden') continue;
      // Labels, not prose: a short line in the mono face, or a short block of its own.
      if (!/mono/i.test(cs.fontFamily) && parseFloat(cs.fontSize) > 13) continue;
      out.push(own.replace(/\s+/g, ' '));
    }
    return out;
  });
  for (const t of labels) {
    if (!found.has(t)) found.set(t, new Set());
    found.get(t).add(path);
  }
  await page.close();
}
await browser.close();

const rows = [...found].sort((a, b) => b[1].size - a[1].size);
for (const [t, ps] of rows) console.log(`${String(ps.size).padStart(3)}  ${t}   (${[...ps].slice(0, 2).join(', ')})`);
console.log(`\n${rows.length} distinct lowercase label(s) across ${pages.length} pages`);
