/**
 * What an entry point costs the person who imports it.
 *
 * The ESM build shares code between entries through chunks (`dist/chunk-*.mjs`),
 * so an entry's own file can be a handful of `export … from './chunk-….mjs'`
 * lines. Gzipping that file alone would report a few hundred bytes for the whole
 * library. An entry's size is therefore its file plus every chunk it imports,
 * transitively, concatenated and gzipped together — what a bundler pulls in for
 * `import * as x from '<entry>'`.
 *
 * Shared by scripts/size.mjs (budgets, the README tables) and the repo's
 * scripts/check-claims.mjs (every size quoted in the docs), so the two cannot
 * disagree about what "the size of an entry" means.
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');

/*
 * Static imports and re-exports with a relative specifier, in the forms the
 * build emits: `import'./a.mjs'`, `import{a as b}from'./a.mjs'`,
 * `export{a}from'./a.mjs'`. Package imports (`react`, `vue`) are peer
 * dependencies the app already has, so they are not counted.
 */
const RELATIVE_IMPORT = /\b(?:import|export)\s*(?:[\w$*{},\s]*?\bfrom\s*)?(['"])(\.\.?\/[^'"]+)\1/g;
const DYNAMIC_IMPORT = /\bimport\s*\(\s*['"`]\.\.?\//;

/** The entry file followed by every file it imports, depth first, each once. */
export function closure(file) {
  const seen = new Set();
  const visit = (path) => {
    if (seen.has(path)) return;
    if (!existsSync(path)) throw new Error(`${file} imports ${path}, which does not exist`);
    seen.add(path);
    const code = readFileSync(path, 'utf8');
    // A lazy chunk is not part of the initial download, and nothing here
    // decides how to count one. Fail rather than quietly guess.
    if (DYNAMIC_IMPORT.test(code)) throw new Error(`${path} has a dynamic import; teach bundle-size.mjs how to count it`);
    for (const m of code.matchAll(RELATIVE_IMPORT)) visit(resolve(dirname(path), m[2]));
  };
  visit(resolve(file));
  return [...seen];
}

/** Raw and gzipped KB of the given files, concatenated in order. */
export function measure(files) {
  const buf = Buffer.concat(files.map((f) => readFileSync(f)));
  return { raw: buf.length / 1024, gzip: gzipSync(buf, { level: 9 }).length / 1024 };
}

/** Several entries imported by one app: the union of their closures, shared chunks once. */
export function measureTogether(entryFiles) {
  return measure([...new Set(entryFiles.flatMap(closure))]);
}

/** The built ESM file for a package entry name (`.`, `react`, `aos/react`), or null if unbuilt. */
export function entryFile(name, dist = DIST) {
  const file = name === '.' ? join(dist, 'index.mjs') : join(dist, name, 'index.mjs');
  return existsSync(file) ? file : null;
}

/** Gzipped KB of a package entry to one decimal, as the docs quote it; null if unbuilt. */
export function entryKb(name, dist = DIST) {
  const file = entryFile(name, dist);
  return file === null ? null : Math.round(measure(closure(file)).gzip * 10) / 10;
}

/*
 * The script-tag builds. IIFEs, so the index.mjs scan never finds them, and
 * self-contained, so their closure is the file alone. The dev twin of the main
 * one stays out: unminified on purpose, and nobody should be shipping it.
 */
export const CDN = {
  cdn: 'svg-scroll-draw.global.js',
  'cdn-aos': 'aos.global.js',
  'cdn-scrollreveal': 'scrollreveal.global.js',
  'cdn-vivus': 'vivus.global.js',
};

/** Every built entry as `name → file`: `.`, `react`, `aos/react`, …, then the CDN builds. */
export function findEntries(dist = DIST) {
  const entries = new Map();
  if (!existsSync(dist)) return entries;
  const root = entryFile('.', dist);
  if (root) entries.set('.', root);

  for (const name of readdirSync(dist)) {
    const sub = join(dist, name);
    if (!statSync(sub).isDirectory()) continue;
    const file = entryFile(name, dist);
    if (file) entries.set(name, file);
    // Nested entries, e.g. aos/react.
    for (const child of readdirSync(sub)) {
      const nested = entryFile(`${name}/${child}`, dist);
      if (nested) entries.set(`${name}/${child}`, nested);
    }
  }

  for (const [name, file] of Object.entries(CDN)) {
    const path = join(dist, 'cdn', file);
    if (existsSync(path)) entries.set(name, path);
  }
  return entries;
}
