#!/usr/bin/env node
/**
 * The Nuxt module in a real Nuxt app, as a user installs it.
 *
 * The unit test (nuxtModule.test.ts) checks what the module hands Nuxt's hooks,
 * and the e2e Nuxt fixture bundles the plugin with esbuild. Neither runs Nuxt,
 * so neither would notice Nuxt reading a component entry differently in a new
 * release. This does: pack the library, install the tarball and Nuxt into a
 * scratch app that uses the components and a composable with no imports,
 * `nuxt build` it, serve the output, and check
 *   - the server HTML: the auto-imported components rendered (the counter with
 *     its final number) and the composable resolved;
 *   - in Chromium: the line draws and the counter counts as the page scrolls,
 *     with no page error and no hydration or "failed to resolve" warning.
 *
 *   node scripts/nuxt-module-check.mjs              # Nuxt ^4
 *   node scripts/nuxt-module-check.mjs --nuxt=^3    # any npm range or version
 *
 * Build the library first (npm run build:lib). It installs Nuxt from npm, so it
 * runs in its own CI job rather than in `verify`.
 */
import { execFileSync, spawn } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const NUXT = (process.argv.find((a) => a.startsWith('--nuxt=')) ?? '--nuxt=^4').slice(7);
const PORT = 3460 + Math.floor(Math.random() * 30);
const require = createRequire(join(ROOT, 'package.json'));
const { chromium } = require('playwright');

const fail = (msg) => { console.error(`✗ nuxt-module-check (nuxt ${NUXT}): ${msg}`); process.exit(1); };
const run = (cmd, args, cwd) => execFileSync(cmd, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' });

if (!existsSync(join(ROOT, 'dist', 'nuxt', 'index.mjs'))) fail('dist/ is missing: run `npm run build:lib` first.');

const app = join(tmpdir(), `svg-scroll-draw-nuxt-${NUXT.replace(/[^\w.]/g, '_')}`);
rmSync(app, { recursive: true, force: true });
mkdirSync(app, { recursive: true });

// The library as npm would ship it.
run('npm', ['pack', '--silent', '--pack-destination', app], ROOT);
const tarball = readdirSync(app).find((f) => f.endsWith('.tgz'));

writeFileSync(join(app, 'package.json'), JSON.stringify({
  name: 'nuxt-module-check', private: true, type: 'module',
  dependencies: { nuxt: NUXT, vue: '^3.5.0', 'svg-scroll-draw': `file:./${tarball}` },
}, null, 2));
writeFileSync(join(app, 'nuxt.config.ts'), `export default defineNuxtConfig({
  modules: ['svg-scroll-draw/nuxt'],
  devtools: { enabled: false },
  telemetry: false,
});
`);
writeFileSync(join(app, 'app.vue'), `<script setup lang="ts">
// No imports: the module auto-imports the components and the composables.
const composable = typeof useScrollCounter;
</script>

<template>
  <main>
    <p id="composable">{{ composable }}</p>
    <div style="height: 1600px"></div>
    <ScrollDraw id="draw" :once="false">
      <svg viewBox="0 0 200 20" width="400" height="40"><path id="line" d="M0 10 L200 10" stroke="black" stroke-width="4" fill="none" /></svg>
    </ScrollDraw>
    <ScrollCounter id="count" :to="1250" :once="false" />
    <div style="height: 1600px"></div>
  </main>
</template>
`);

console.log(`· installing nuxt@${NUXT} and the packed library…`);
try { run('npm', ['install', '--no-audit', '--no-fund'], app); }
catch (e) { fail(`npm install failed\n${e.stderr || e.message}`); }
const version = JSON.parse(run('node', ['-p', 'JSON.stringify(require("nuxt/package.json").version)'], app));

console.log(`· nuxt ${version}: building…`);
try { run('npx', ['nuxt', 'build'], app); }
catch (e) { fail(`nuxt build failed\n${(e.stdout || '') + (e.stderr || '')}`.slice(-4000)); }

const server = spawn('node', [join(app, '.output', 'server', 'index.mjs')], {
  env: { ...process.env, PORT: String(PORT), HOST: '127.0.0.1' }, stdio: 'ignore',
});
const base = `http://127.0.0.1:${PORT}/`;
const problems = [];

try {
  let html = '';
  for (let i = 0; i < 60 && !html; i++) {
    html = await fetch(base).then((r) => r.text()).catch(() => '');
    if (!html) await new Promise((r) => setTimeout(r, 500));
  }
  if (!html) throw new Error('the server never answered');

  if (!/<p id="composable">function<\/p>/.test(html)) problems.push('server HTML: the auto-imported composable did not resolve');
  if (!/<div id="draw"><svg/.test(html)) problems.push('server HTML: <ScrollDraw> did not render its <div> and SVG');
  if (!/<span id="count">1250<\/span>/.test(html)) problems.push('server HTML: <ScrollCounter> did not render its final number');

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 900, height: 800 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error' || /hydrat|failed to resolve component/i.test(m.text())) errors.push(m.text());
  });
  await page.goto(base);
  await page.waitForLoadState('networkidle');
  const read = () => page.evaluate(() => ({
    count: document.querySelector('#count').textContent,
    dash: parseFloat(getComputedStyle(document.querySelector('#line')).strokeDashoffset),
  }));
  const top = await read();
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(800);
  const end = await read();
  await browser.close();

  if (top.count !== '0' || !(top.dash > 0)) problems.push(`top of the page: want an undrawn line and 0, got dash ${top.dash} and ${top.count}`);
  if (end.count !== '1250' || end.dash !== 0) problems.push(`end of the page: want a drawn line and 1250, got dash ${end.dash} and ${end.count}`);
  for (const e of errors) problems.push(`browser: ${e}`);
} catch (e) {
  problems.push(e.message);
} finally {
  server.kill();
}

if (problems.length) fail(`\n  ${problems.join('\n  ')}`);
rmSync(app, { recursive: true, force: true });
console.log(`✓ nuxt-module-check: nuxt ${version} builds with the module, renders on the server, and draws and counts in Chromium`);
