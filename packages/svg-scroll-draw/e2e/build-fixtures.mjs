#!/usr/bin/env node
/**
 * Bundle the framework fixture entries for the browser suite.
 *
 * Four of the eight wrappers need nothing: Svelte's are plain action functions,
 * Angular's are framework-agnostic classes, Astro's are DOM scanners and the web
 * component is a custom element. Those fixtures import `/dist/<name>/index.mjs`
 * straight from the static server, like every other fixture here.
 *
 * React, Vue, Solid and Nuxt do need their framework at runtime, and none of
 * them can be loaded from a plain `<script type="module">`: React publishes no
 * browser ESM build at all, and resolving a bare `import 'vue'` needs a
 * resolver. So those four get bundled — from the built `dist/` output, not from
 * `src/`, because the point of this suite is to test the thing that ships.
 *
 * esbuild comes with tsup, which the package already depends on, so this adds no
 * dependency. Output is gitignored and rebuilt on every run: it is a build
 * artefact of a build artefact.
 */
import { build } from 'esbuild';
import { existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const OUT = join(HERE, 'fixtures', 'build');

const ENTRIES = [
  { name: 'react' },
  { name: 'vue' },
  { name: 'solid' },
  {
    name: 'nuxt',
    // The Nuxt fixture uses the components by name in a template, which is the
    // only way to prove the plugin registered them globally — and that needs
    // Vue's runtime compiler, which the default bundler build leaves out.
    alias: { vue: 'vue/dist/vue.esm-bundler.js' },
  },
];

if (!existsSync(join(ROOT, 'dist', 'index.mjs'))) {
  console.error(
    '✗ dist/ is missing. The fixtures load the built bundle, so run `npm run build` first.',
  );
  process.exit(1);
}

mkdirSync(OUT, { recursive: true });

await Promise.all(
  ENTRIES.map(({ name, alias }) =>
    build({
      entryPoints: [join(HERE, 'frameworks', `${name}.entry.js`)],
      outfile: join(OUT, `${name}.mjs`),
      bundle: true,
      format: 'esm',
      platform: 'browser',
      ...(alias ? { alias } : {}),
      // The frameworks ship separate development and production builds behind
      // this flag. Development is the right one here: it is what a developer
      // runs, and it is the build that reports misuse.
      define: { 'process.env.NODE_ENV': '"development"' },
      logLevel: 'warning',
    }),
  ),
);

console.log(`✓ Bundled ${ENTRIES.length} framework fixtures → e2e/fixtures/build/`);
