#!/usr/bin/env node
/**
 * Every code sample on the framework pages and guides, run in its framework.
 *
 * The site type-checks these samples as strings, which is to say not at all.
 * On 2026-11-14 eight of 36 did nothing or crashed as printed: three passed
 * scrollAnimate `from` (scrollText's option), which threw; two destructured
 * createScrollDraw as an array; Astro's attribute version of the `from` bug;
 * an Angular "component" with no decorator or imports; a Nuxt page with three
 * roots. And every Vue sample bound its ref with `:ref`, which is null in
 * <script setup>.
 *
 * So: pack the library, write each sample as a file into a scratch app per
 * framework (Vue, Svelte, Solid, Angular with its runtime compiler, Astro),
 * mount it between two spacers, scroll to the end in Chromium, and read the
 * library's instance registry. A sample passes when it mounted, at least one
 * engine registered and ran to the end, and nothing was logged as an error or
 * warning. The Nuxt samples are the Vue ones through the module, which
 * scripts/nuxt-module-check.mjs builds in a real Nuxt app.
 *
 *   node apps/demo/scripts/test-framework-samples.mjs            # all
 *   node apps/demo/scripts/test-framework-samples.mjs vue solid  # some
 *
 * Installs each framework from npm, so it runs weekly in CI (examples.yml),
 * not in `verify`. Build the library first (npm run build:lib).
 */
import { execFileSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { chromium } from 'playwright';

const here = dirname(fileURLToPath(import.meta.url));
const demo = resolve(here, '..');
const pkg = resolve(here, '../../../packages/svg-scroll-draw');
const ONLY = process.argv.slice(2);
// A fresh folder each run: deleting the last one races any server still letting go.
const work = mkdtempSync(join(tmpdir(), 'svg-scroll-draw-framework-samples-'));

/**
 * Samples that cannot pass alone, and why. Each one is still mounted and must
 * not error; it is only excused from drawing to the end.
 */
const PARTIAL = {
  'vue-scroll-animation guide:fw-vue-getters': 'a wrapper: it draws the SVG passed in its slot',
  'solid-scroll-animation guide:fw-solid-accessor': 'a wrapper: it draws the SVG passed as children',
  'solid-scroll-animation guide:fw-solid-owner': 'the drawing mounts when its button is pressed',
  'astro-scroll-animation landing#2': 'a layout script with nothing of its own to animate',
};

if (!existsSync(join(pkg, 'dist', 'index.mjs'))) {
  console.error('✗ test-framework-samples: no dist/ build — run `npm run build:lib` first.');
  process.exit(1);
}

// ── The samples, read from the site's own data ───────────────────────────────

const guides = readdirSync(join(demo, 'src/data/framework-guides')).filter((f) => f.endsWith('.ts') && !['types.ts', 'index.ts'].includes(f));
const entry = `
import { FRAMEWORK_LANDINGS } from './src/data/framework-landings';
${guides.map((g, i) => `import { GUIDE as G${i} } from './src/data/framework-guides/${g.replace(/\.ts$/, '')}';`).join('\n')}
export const samples = [];
for (const f of FRAMEWORK_LANDINGS) f.samples.forEach((s, i) => samples.push({ slug: f.slug, src: 'landing#' + (i + 1), file: s.file, code: s.code }));
for (const g of [${guides.map((_, i) => `G${i}`).join(', ')}]) for (const sec of g.sections) if (sec.sample) samples.push({ slug: g.slug, src: 'guide:' + sec.id, file: sec.sample.file, code: sec.sample.code });
`;
const out = join(work, 'samples.mjs');
await build({ stdin: { contents: entry, resolveDir: demo, loader: 'ts' }, bundle: true, format: 'esm', platform: 'node', outfile: out, tsconfig: join(demo, 'tsconfig.json'), logLevel: 'warning' });
const { samples } = await import(pathToFileURL(out));

execFileSync('npm', ['pack', '--silent', '--pack-destination', work], { cwd: pkg, stdio: ['ignore', 'pipe', 'pipe'] });
const tarball = `file:${join(work, readdirSync(work).find((f) => f.endsWith('.tgz')))}`;

// ── One scratch app per framework ────────────────────────────────────────────

const SPACERS = ['<div style="height:1200px"></div>', '<div style="height:2400px"></div>'];
const page = (body, script) => `<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0">${SPACERS[0]}${body}${SPACERS[1]}<script type="module" src="${script}"></script></body></html>`;
const loader = (glob, mount) => `const s = new URLSearchParams(location.search).get('s');
const mods = import.meta.glob('${glob}');
mods[Object.keys(mods).find((k) => k.includes('/s' + s + '.'))]()
  .then((m) => ${mount})
  .then(() => { window.__mounted = true; }, (e) => { window.__mountError = String(e); window.__mounted = true; });
`;

const VITE = '^8.3.8';
const APPS = {
  vue: {
    slug: 'vue-scroll-animation', ext: '.vue',
    deps: { vue: '^3.5.0' }, dev: { '@vitejs/plugin-vue': '^6.0.0', vite: VITE },
    files: {
      'vite.config.js': "import vue from '@vitejs/plugin-vue';\nexport default { plugins: [vue()] };\n",
      'index.html': page('<div id="app"></div>', '/main.js'),
      'main.js': `import { createApp } from 'vue';\n${loader('./samples/*.vue', "createApp(m.default).mount('#app')")}`,
    },
  },
  svelte: {
    slug: 'svelte-scroll-animation', ext: '.svelte',
    deps: { svelte: '^5.0.0' }, dev: { '@sveltejs/vite-plugin-svelte': '^7.0.0', vite: VITE },
    files: {
      'vite.config.js': "import { svelte } from '@sveltejs/vite-plugin-svelte';\nexport default { plugins: [svelte()] };\n",
      'index.html': page('<div id="app"></div>', '/main.js'),
      'main.js': `import { mount } from 'svelte';\n${loader('./samples/*.svelte', "mount(m.default, { target: document.getElementById('app') })")}`,
    },
  },
  solid: {
    slug: 'solid-scroll-animation', ext: '.tsx',
    deps: { 'solid-js': '^1.9.0' }, dev: { 'vite-plugin-solid': '^2.11.0', vite: VITE, typescript: '^5.9.0' },
    files: {
      'vite.config.js': "import solid from 'vite-plugin-solid';\nexport default { plugins: [solid()] };\n",
      'index.html': page('<div id="app"></div>', '/main.js'),
      'main.js': `import { render } from 'solid-js/web';\n${loader('./samples/*.tsx', "render(() => (m.default ?? Object.values(m).find((v) => typeof v === 'function'))({}), document.getElementById('app'))")}`,
    },
  },
  angular: {
    slug: 'angular-scroll-animation', ext: '.ts',
    deps: { '@angular/core': 'latest', '@angular/common': 'latest', '@angular/compiler': 'latest', '@angular/platform-browser': 'latest', rxjs: '^7.8.0' },
    dev: { vite: VITE, typescript: '^5.9.0' },
    // The runtime compiler, so each sample compiles as printed; the samples use
    // decorators, hence the legacy decorator settings Angular needs.
    files: {
      'tsconfig.json': JSON.stringify({ compilerOptions: { target: 'ES2022', module: 'ESNext', moduleResolution: 'bundler', experimentalDecorators: true, useDefineForClassFields: false } }),
      'index.html': page('<app-root></app-root>', '/main.ts'),
      // hosts.json: each sample's tag, written below from its source.
      'main.ts': `import '@angular/compiler';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import HOSTS from './hosts.json';
${loader('./samples/*.ts', `{
    const Cmp: any = Object.values(m).find((v) => typeof v === 'function');
    @Component({ selector: 'app-root', standalone: true, imports: [Cmp], template: (HOSTS as Record<string, string>)[s!] })
    class Host {}
    return bootstrapApplication(Host);
  }`)}`,
    },
  },
  astro: {
    slug: 'astro-scroll-animation', ext: '.astro', astro: true,
    deps: { astro: '>=6.0.0' }, dev: {},
    files: { 'astro.config.mjs': "import { defineConfig } from 'astro/config';\nexport default defineConfig({});\n" },
  },
};

const results = [];
/** One line per sample as it finishes, so a hang shows where it stopped. */
function report(r) {
  const tag = r.problems.length ? '✗' : r.partial ? '·' : '✓';
  console.log(`${tag} ${r.key} (${r.file})${r.partial && !r.problems.length ? ` — ${r.partial}` : ''}`);
  for (const p of r.problems) console.log(`    ${p}`);
}
const servers = [];
const browser = await chromium.launch();
/** A port nothing is listening on, so a server left over from another run cannot answer for this one. */
const freePort = () => new Promise((ok) => { const srv = createServer().listen(0, () => { const { port } = srv.address(); srv.close(() => ok(port)); }); });

try {
  for (const [fw, app] of Object.entries(APPS)) {
    if (ONLY.length && !ONLY.includes(fw)) continue;
    const list = samples.filter((s) => s.slug === app.slug);
    const dir = join(work, fw);
    mkdirSync(join(dir, app.astro ? 'src/pages' : 'samples'), { recursive: true });
    if (app.astro) mkdirSync(join(dir, 'src/components'), { recursive: true });
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: `samples-${fw}`, private: true, type: 'module', dependencies: { ...app.deps, 'svg-scroll-draw': tarball }, devDependencies: app.dev }));
    for (const [f, c] of Object.entries(app.files)) writeFileSync(join(dir, f), c);

    if (fw === 'angular') {
      // The tag each sample renders as. A required input gets a value, as the
      // parent in the guide would pass one.
      const hosts = Object.fromEntries(list.map((s, n) => {
        const tag = /selector:\s*'([^']+)'/.exec(s.code)?.[1] ?? 'missing-selector';
        const input = /required: true[^)]*\)\s*(\w+)/.exec(s.code)?.[1];
        return [String(n), `<${tag}${input ? ` [${input}]="1250"` : ''}></${tag}>`];
      }));
      writeFileSync(join(dir, 'hosts.json'), JSON.stringify(hosts));
    }
    list.forEach((s, n) => {
      if (!app.astro) return writeFileSync(join(dir, 'samples', `s${n}${app.ext}`), s.code);
      // Astro: the sample as a component in a page. A layout wraps a drawing;
      // the Features sample gets the layout script it is written to sit under.
      writeFileSync(join(dir, 'src/components', `S${n}.astro`), s.code);
      const mark = '<script is:inline>addEventListener("load",()=>{window.__mounted=true})</script>';
      const init = s.src === 'landing#3' ? '<script>import { initAll } from "svg-scroll-draw/astro"; initAll();</script>' : '';
      const body = s.file.endsWith('layouts/Layout.astro')
        ? `<S>${SPACERS[0]}<div data-scroll-draw><svg viewBox="0 0 200 100"><path d="M10 50 Q 100 10 190 50" stroke="#111" fill="none" /></svg></div>${SPACERS[1]}${mark}</S>`
        : `<html><head><meta charset="utf-8"></head><body style="margin:0">${SPACERS[0]}<S />${SPACERS[1]}${init}${mark}</body></html>`;
      writeFileSync(join(dir, 'src/pages', `s${n}.astro`), `---\nimport S from '../components/S${n}.astro';\n---\n${body}\n`);
    });

    console.log(`· ${fw}: installing, ${list.length} samples…`);
    execFileSync('npm', ['install', '--no-audit', '--no-fund'], { cwd: dir, stdio: ['ignore', 'pipe', 'pipe'] });

    const p = await freePort();
    // Its own process group: npx starts the server as a child, and killing npx
    // alone left that child running.
    const server = app.astro
      ? spawn('npx', ['astro', 'dev', '--port', String(p)], { cwd: dir, stdio: 'ignore', detached: true })
      : spawn('npx', ['vite', '--port', String(p), '--strictPort'], { cwd: dir, stdio: 'ignore', detached: true });
    servers.push(server);
    const base = `http://localhost:${p}/`;
    for (let i = 0; i < 120 && !(await fetch(base).then(() => true, () => false)); i++) await new Promise((r) => setTimeout(r, 500));

    // A first visit to every page lets Vite finish optimising dependencies,
    // which otherwise answers 504 to the requests of the first page or two.
    const url = (n) => (app.astro ? `${base}s${n}` : `${base}?s=${n}`);
    for (let n = 0; n < list.length; n++) await fetch(url(n)).catch(() => {});
    {
      const warm = await browser.newPage();
      for (let n = 0; n < list.length; n++) await warm.goto(url(n)).catch(() => {});
      await warm.waitForTimeout(1500);
      await warm.close();
    }

    for (const [n, s] of list.entries()) {
      const tab = await browser.newPage({ viewport: { width: 1000, height: 800 } });
      const errors = [];
      tab.on('pageerror', (e) => errors.push(e.message));
      tab.on('console', (m) => {
        const t = m.text();
        if (/\[vite\]|Vue Devtools|Angular is running in development mode/.test(t)) return;
        if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${t.slice(0, 240)}`);
      });
      await tab.goto(url(n), { timeout: 30000 }).catch((e) => errors.push(`did not load: ${e.message.split('\n')[0]}`));
      await tab.waitForFunction(() => window.__mounted, null, { timeout: 20000 }).catch(() => errors.push('never mounted'));
      await tab.waitForTimeout(300);
      for (let y = 0; y <= 5000; y += 250) { await tab.evaluate((v) => window.scrollTo(0, v), y); await tab.waitForTimeout(50); }
      await tab.waitForTimeout(600);
      const engines = await tab.evaluate(() => {
        const m = globalThis[Symbol.for('svg-scroll-draw.registry')];
        return m ? [...m.values()].map((e) => ({ type: e.type, p: e.getProgress() })) : [];
      });
      const mountError = await tab.evaluate(() => window.__mountError);
      await tab.close();

      const key = `${s.slug} ${s.src}`;
      const ran = engines.some((e) => e.p > 0.9);
      const problems = [...(mountError ? [`did not mount: ${mountError}`] : []), ...errors];
      if (!PARTIAL[key] && !ran) problems.push(engines.length ? `never ran to the end (${engines.map((e) => `${e.type} ${e.p.toFixed(2)}`).join(', ')})` : 'no engine started');
      const r = { key, file: s.file, problems, partial: PARTIAL[key], engines };
      results.push(r);
      report(r);
    }
  }
} finally {
  await browser.close();
  for (const s of servers) { try { process.kill(-s.pid, 'SIGTERM'); } catch { /* already gone */ } }
}

const failed = results.filter((r) => r.problems.length);
if (failed.length) {
  console.error(`\n✗ ${failed.length} of ${results.length} framework samples failed.`);
  process.exit(1);
}
await new Promise((r) => setTimeout(r, 1000));
try { rmSync(work, { recursive: true, force: true }); } catch { /* the OS cleans tmp; a server may still be letting go */ }
console.log(`\n✓ every framework sample runs as printed: ${results.length} samples in ${new Set(results.map((r) => r.key.split(' ')[0])).size} frameworks`);
