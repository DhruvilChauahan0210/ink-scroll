#!/usr/bin/env node
/**
 * Builds the shadcn registry for /blocks.
 *
 *   registry/registry.json          (source of truth: names, titles, file paths)
 *   registry/blocks/<name>.tsx      (block sources)
 *     → public/r/<name>.json        (one registry-item per block, file content inlined)
 *     → public/r/registry.json      (the index, same shape as the source)
 *
 * so `npx shadcn@latest add https://svg-scroll-draw.vercel.app/r/<name>.json` works.
 *
 * Deterministic: no timestamps, keys in a fixed order, LF line endings, one
 * trailing newline. Running it twice produces byte-identical output.
 *
 *   node scripts/build-registry.mjs           write public/r/*
 *   node scripts/build-registry.mjs --check   exit 1 if public/r/* is stale
 *
 * The /blocks page imports public/r/<name>.json directly, so the source shown on
 * the site is exactly what the CLI installs.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const APP = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = join(APP, 'registry/registry.json');
const OUT = join(APP, 'public/r');
const CHECK = process.argv.includes('--check');

const ITEM_SCHEMA = 'https://ui.shadcn.com/schema/registry-item.json';
const REGISTRY_SCHEMA = 'https://ui.shadcn.com/schema/registry.json';

const registry = JSON.parse(readFileSync(SOURCE, 'utf8'));
const errors = [];

/** Fixed key order for a registry item, so output never depends on source order. */
function orderItem(item, withContent) {
  const out = {};
  if (withContent) out.$schema = ITEM_SCHEMA;
  for (const key of ['name', 'type', 'title', 'description', 'author', 'dependencies', 'devDependencies', 'registryDependencies']) {
    if (item[key] !== undefined) out[key] = item[key];
  }
  out.files = item.files.map((file) => {
    const f = { path: file.path };
    if (withContent) {
      const abs = join(APP, file.path);
      if (!existsSync(abs)) {
        errors.push(`${item.name}: missing file ${file.path}`);
        f.content = '';
      } else {
        f.content = readFileSync(abs, 'utf8').replace(/\r\n/g, '\n');
      }
    }
    f.type = file.type;
    if (file.target !== undefined) f.target = file.target;
    return f;
  });
  for (const key of ['cssVars', 'css', 'tailwind', 'meta', 'docs', 'categories']) {
    if (item[key] !== undefined) out[key] = item[key];
  }
  return out;
}

const stringify = (value) => JSON.stringify(value, null, 2) + '\n';

// ── Validate ─────────────────────────────────────────────────────────────────

const names = new Set();
for (const item of registry.items) {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(item.name)) errors.push(`${item.name}: name must be kebab-case`);
  if (names.has(item.name)) errors.push(`${item.name}: duplicate name`);
  names.add(item.name);
  if (item.type !== 'registry:block') errors.push(`${item.name}: type must be registry:block`);
  if (!item.dependencies?.includes('svg-scroll-draw')) errors.push(`${item.name}: must depend on svg-scroll-draw`);
  if (!item.files?.length) errors.push(`${item.name}: no files`);
  for (const file of item.files ?? []) {
    const abs = join(APP, file.path);
    if (!existsSync(abs)) continue;
    const src = readFileSync(abs, 'utf8');
    if (!src.startsWith("'use client';")) errors.push(`${file.path}: must start with 'use client';`);
    // Blocks are copy-paste: they may import only react and svg-scroll-draw.
    for (const [, spec] of src.matchAll(/^import[^'"]*['"]([^'"]+)['"]/gm)) {
      if (spec !== 'react' && spec !== 'svg-scroll-draw' && !spec.startsWith('svg-scroll-draw/')) {
        errors.push(`${file.path}: imports "${spec}" (only react and svg-scroll-draw allowed)`);
      }
    }
  }
}

// ── Build ────────────────────────────────────────────────────────────────────

const outputs = new Map();
for (const item of registry.items) {
  outputs.set(`${item.name}.json`, stringify(orderItem(item, true)));
}
const index = { $schema: REGISTRY_SCHEMA, name: registry.name, homepage: registry.homepage };
index.items = registry.items.map((item) => orderItem(item, false));
outputs.set('registry.json', stringify(index));

if (errors.length) {
  console.error('build-registry: failed\n  ' + errors.join('\n  '));
  process.exit(1);
}

// Files in public/r that no item produces any more.
const stale = existsSync(OUT)
  ? readdirSync(OUT).filter((f) => f.endsWith('.json') && !outputs.has(f))
  : [];

if (CHECK) {
  const drift = [];
  for (const [file, content] of outputs) {
    const abs = join(OUT, file);
    if (!existsSync(abs) || readFileSync(abs, 'utf8') !== content) drift.push(file);
  }
  drift.push(...stale.map((f) => `${f} (orphan)`));
  if (drift.length) {
    console.error(`build-registry --check: public/r is stale: ${drift.join(', ')}\nRun: npm run registry:build --workspace=apps/demo`);
    process.exit(1);
  }
  console.log(`build-registry --check: ${outputs.size} files up to date`);
} else {
  mkdirSync(OUT, { recursive: true });
  for (const [file, content] of outputs) writeFileSync(join(OUT, file), content);
  if (stale.length) console.warn(`build-registry: orphan files in public/r (not deleted): ${stale.join(', ')}`);
  console.log(`build-registry: wrote ${outputs.size} files to public/r (${registry.items.length} blocks + index)`);
}
