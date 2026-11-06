#!/usr/bin/env node
/**
 * Compiles each Vue block (registry/vue/<name>.vue) and runs it in Chromium,
 * scrolled through the way a reader scrolls.
 *
 * Why: the site renders the React blocks, so nothing on /blocks would notice a
 * Vue version that does not compile or never starts its engine. Each SFC is
 * compiled with @vue/compiler-sfc, bundled with esbuild against this repo's
 * built library (dist/, so run `npm run build:lib` first), styled with the
 * Tailwind 4 CSS its own classes produce, and mounted with its default props.
 *
 *   node scripts/test-vue-blocks.mjs
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import http from 'node:http';
import { chromium } from 'playwright';

const here = dirname(fileURLToPath(import.meta.url));
const APP = resolve(here, '..');
const ROOT = resolve(APP, '../..');
const DIST = resolve(ROOT, 'packages/svg-scroll-draw/dist');
const VUE_DIR = join(APP, 'registry/vue');
const require = createRequire(join(ROOT, 'package.json'));
const { parse, compileScript } = require('@vue/compiler-sfc');
const { build } = require('esbuild');
const { compile } = require('@tailwindcss/node');

if (!existsSync(join(DIST, 'index.mjs'))) {
  console.error('✗ test-vue-blocks: no dist build — run `npm run build:lib` first.');
  process.exit(1);
}
const files = existsSync(VUE_DIR) ? readdirSync(VUE_DIR).filter((f) => f.endsWith('.vue')).sort() : [];
if (!files.length) {
  console.error('✗ test-vue-blocks: no registry/vue/*.vue files');
  process.exit(1);
}

/** esbuild: .vue through compiler-sfc; svg-scroll-draw and its subpaths to dist. */
const plugin = {
  name: 'vue-sfc',
  setup(b) {
    b.onResolve({ filter: /^svg-scroll-draw(\/.*)?$/ }, (args) => {
      const sub = args.path.slice('svg-scroll-draw'.length) || '';
      return { path: join(DIST, sub ? `${sub.slice(1)}/index.mjs` : 'index.mjs') };
    });
    b.onLoad({ filter: /\.vue$/ }, (args) => {
      const { descriptor, errors } = parse(readFileSync(args.path, 'utf8'), { filename: args.path });
      if (errors.length) throw new Error(errors.map(String).join('\n'));
      const script = compileScript(descriptor, { id: 'v' + args.path.length, inlineTemplate: true });
      return { contents: script.content, loader: 'ts', resolveDir: dirname(args.path) };
    });
  },
};

/** Props a block cannot run without; the rest use their defaults. */
const PROPS = {
  'video-scrub': { src: '/film.webm', to: 4.98 },
};

async function bundle(file) {
  const props = PROPS[file.replace(/\.vue$/, '')] ?? {};
  const entry = `import { createApp } from 'vue'; import C from ${JSON.stringify(join(VUE_DIR, file))};
    createApp(C, ${JSON.stringify(props)}).mount('#app'); window.__ready = true;`;
  const out = await build({
    stdin: { contents: entry, resolveDir: APP, loader: 'js' },
    bundle: true, write: false, format: 'iife', platform: 'browser', plugins: [plugin],
    nodePaths: [join(ROOT, 'node_modules')],
    define: { __VUE_OPTIONS_API__: 'true', __VUE_PROD_DEVTOOLS__: 'false', __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false', 'process.env.NODE_ENV': '"production"' },
    logLevel: 'silent',
  });
  return out.outputFiles[0].text;
}

/** Tailwind 4 CSS for the classes the file uses. */
async function css(file) {
  const src = readFileSync(join(VUE_DIR, file), 'utf8');
  const compiler = await compile('@import "tailwindcss";', { base: APP, onDependency: () => {} });
  // Whitespace and quotes only: an arbitrary value such as
  // [transform:scaleX(var(--p,0))] keeps its commas and brackets.
  return compiler.build(src.split(/[\s"'`]+/).filter(Boolean));
}

/**
 * The page and the film, from a local server that answers Range requests:
 * browsers seek a <video> only when the server does.
 */
const FILM = readFileSync(join(APP, 'public/showcase/aural-fdc4222c.webm'));
const PAGE = '<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0}</style></head>' +
  '<body><div style="height:100vh"></div><div id="app"></div><div style="height:150vh"></div></body></html>';
const server = http.createServer((req, res) => {
  if (req.url !== '/film.webm') {
    res.writeHead(200, { 'content-type': 'text/html' });
    return res.end(PAGE);
  }
  const m = /bytes=(\d+)-(\d*)/.exec(req.headers.range || '');
  if (!m) {
    res.writeHead(200, { 'content-type': 'video/webm', 'content-length': FILM.length, 'accept-ranges': 'bytes' });
    return res.end(FILM);
  }
  const a = Number(m[1]);
  const z = m[2] ? Number(m[2]) : FILM.length - 1;
  res.writeHead(206, { 'content-type': 'video/webm', 'content-range': `bytes ${a}-${z}/${FILM.length}`, 'content-length': z - a + 1, 'accept-ranges': 'bytes' });
  res.end(FILM.subarray(a, z + 1));
});
await new Promise((ok) => server.listen(0, ok));
const origin = `http://localhost:${server.address().port}`;

const failures = [];
const check = (ok, msg) => { if (!ok) failures.push(msg); };
const browser = await chromium.launch();

for (const file of files) {
  const name = file.replace(/\.vue$/, '');
  let js;
  try { js = await bundle(file); } catch (e) { check(false, `${name}: does not compile — ${String(e).slice(0, 300)}`); continue; }
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
  await page.goto(origin);
  await page.addStyleTag({ content: await css(file) });
  await page.addScriptTag({ content: js });
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 5000 }).catch(() => check(false, `${name}: never mounted`));

  // Everything the library writes while the page scrolls: inline styles and
  // custom properties on any element, and text it counts or splits.
  const snapshot = () => page.evaluate(() => [...document.querySelectorAll('#app *')]
    .map((el) => `${el.getAttribute('style') ?? ''}|${el.children.length ? '' : el.textContent}`).join('\n'));
  const before = await snapshot();
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  let changed = false;
  for (let y = 0; y <= height; y += 200) {
    await page.evaluate((v) => scrollTo(0, v), y);
    await page.waitForTimeout(60);
    if ((await snapshot()) !== before) { changed = true; break; }
  }
  check(changed, `${name}: scrolling through it changed nothing the library writes`);
  check(errors.length === 0, `${name}: errors: ${errors.join(' | ')}`);
  await page.close();
}

await browser.close();
server.close();
if (failures.length) {
  console.error(`✗ ${failures.length} Vue block check(s) failed:\n` + failures.map((f) => `  ${f}`).join('\n'));
  process.exit(1);
}
console.log(`✓ every Vue block compiles, mounts and runs (${files.map((f) => f.replace(/\.vue$/, '')).join(', ')})`);
