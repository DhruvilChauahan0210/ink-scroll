#!/usr/bin/env node
/**
 * Every showcase site, in a real browser: it answers 200, throws nothing while
 * the reader scrolls through it, and passes axe's colour-contrast rule.
 *
 * Why: the showcase sites are left out of the sitemap (they are noindex demos),
 * so test-a11y and test-seo never open them. Their colours and type changed in
 * the unslop pass (gradients, glows, glass, weights), and contrast is what a
 * changed background breaks first.
 *
 *   BASE_URL=http://localhost:3200 node scripts/test-showcase.mjs
 */
import { readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const BASE = (process.env.BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
const HERE = dirname(fileURLToPath(import.meta.url));
const AXE = createRequire(import.meta.url).resolve('axe-core/axe.min.js');
const sites = readdirSync(join(HERE, '..', 'src', 'app', 'showcase'), { withFileTypes: true })
  .filter((d) => d.isDirectory()).map((d) => d.name);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
const problems = [];

for (const site of sites) {
  const page = await ctx.newPage();
  page.on('pageerror', (e) => problems.push(`${site}: ${String(e).slice(0, 140)}`));
  const res = await page.goto(`${BASE}/showcase/${site}`, { waitUntil: 'load' });
  if (!res || res.status() !== 200) problems.push(`${site}: HTTP ${res?.status()}`);
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += 800) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(30);
  }
  await page.addScriptTag({ path: AXE });
  const v = await page.evaluate(async () => (await axe.run(document, { runOnly: { type: 'rule', values: ['color-contrast'] } })).violations);
  for (const x of v) if (x.impact === 'serious' || x.impact === 'critical') problems.push(`${site}: ${x.id} ×${x.nodes.length} — ${x.nodes[0]?.target?.join(' ')}`);
  await page.close();
}
await browser.close();

for (const p of problems) console.log(`  ${p}`);
console.log(`\n${sites.length} showcase sites: ${problems.length} problem(s).`);
if (problems.length) process.exit(1);
