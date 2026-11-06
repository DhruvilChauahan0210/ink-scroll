#!/usr/bin/env node
/**
 * Builds the shadcn registry for /blocks.
 *
 *   registry/registry.json          (source of truth: names, titles, file paths)
 *   registry/blocks/<name>.tsx      (block sources)
 *     → public/r/<name>.json        (one registry-item per block, file content inlined)
 *     → public/r/registry.json      (the index, same shape as the source)
 *   registry/vue/<name>.vue         (the Vue version of a block, where there is one)
 *     → public/r/vue/<name>.json    (a shadcn-vue registry-item)
 *     → public/r/vue/registry.json
 *
 * so `npx shadcn@latest add https://svg-scroll-draw.vercel.app/r/<name>.json` and
 * `npx shadcn-vue@latest add https://svg-scroll-draw.vercel.app/r/vue/<name>.json`
 * work. Each framework gets its own item at its own URL: the file, its type and
 * its dependencies differ, and shadcn-svelte's schema forbids the `path` the
 * other two require.
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
  // A block may ask for a minimum version (`svg-scroll-draw@^2.20.0`) when it
  // uses something newer than what an older installed copy understands.
  if (!item.dependencies?.some((d) => d === 'svg-scroll-draw' || d.startsWith('svg-scroll-draw@'))) errors.push(`${item.name}: must depend on svg-scroll-draw`);
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

// ── Other frameworks ─────────────────────────────────────────────────────────

/** A block's Vue version, if registry/vue/<name>.vue exists: same item, its own file. */
const pascal = (name) => name.replace(/(^|-)([a-z0-9])/g, (_, __, c) => c.toUpperCase());
const FRAMEWORKS = [
  {
    dir: 'vue',
    ext: '.vue',
    allowed: (spec) => spec === 'vue' || spec === 'svg-scroll-draw' || spec.startsWith('svg-scroll-draw/'),
    itemSchema: 'https://shadcn-vue.com/schema/registry-item.json',
    registrySchema: 'https://shadcn-vue.com/schema/registry.json',
    target: (name) => `components/scroll/${pascal(name)}.vue`,
  },
  {
    // shadcn-svelte's item schema requires content, type and target on every
    // file and forbids `path`, so its items carry no path.
    dir: 'svelte',
    ext: '.svelte',
    allowed: (spec) => spec === 'svelte' || spec.startsWith('svelte/') || spec === 'svg-scroll-draw' || spec.startsWith('svg-scroll-draw/'),
    itemSchema: 'https://shadcn-svelte.com/schema/registry-item.json',
    registrySchema: 'https://shadcn-svelte.com/schema/registry.json',
    target: (name) => `src/lib/components/scroll/${pascal(name)}.svelte`,
    noPath: true,
  },
];

/** shadcn-svelte rejects `path`: drop it from every file of an item. */
const withoutPath = (item) => ({
  ...item,
  files: item.files.map((f) => {
    const copy = { ...f };
    delete copy.path;
    return copy;
  }),
});

function frameworkItem(fw, item) {
  const path = `registry/${fw.dir}/${item.name}${fw.ext}`;
  const abs = join(APP, path);
  if (!existsSync(abs)) return null;
  const src = readFileSync(abs, 'utf8');
  for (const [, spec] of src.matchAll(/^import[^'"]*['"]([^'"]+)['"]/gm)) {
    if (!fw.allowed(spec)) errors.push(`${path}: imports "${spec}" (only ${fw.dir} and svg-scroll-draw allowed)`);
  }
  return { ...item, files: [{ path, type: 'registry:component', target: fw.target(item.name) }] };
}

// ── Build ────────────────────────────────────────────────────────────────────

const outputs = new Map();
for (const item of registry.items) {
  outputs.set(`${item.name}.json`, stringify(orderItem(item, true)));
}
const index = { $schema: REGISTRY_SCHEMA, name: registry.name, homepage: registry.homepage };
index.items = registry.items.map((item) => orderItem(item, false));
outputs.set('registry.json', stringify(index));

for (const fw of FRAMEWORKS) {
  const items = registry.items.map((item) => frameworkItem(fw, item)).filter(Boolean);
  if (!items.length) continue;
  for (const item of items) {
    let out = orderItem(item, true);
    out.$schema = fw.itemSchema;
    if (fw.noPath) out = withoutPath(out);
    outputs.set(`${fw.dir}/${item.name}.json`, stringify(out));
  }
  const fwIndex = { $schema: fw.registrySchema, name: registry.name, homepage: registry.homepage };
  fwIndex.items = items.map((item) => (fw.noPath ? withoutPath(orderItem(item, false)) : orderItem(item, false)));
  outputs.set(`${fw.dir}/registry.json`, stringify(fwIndex));
}

if (errors.length) {
  console.error('build-registry: failed\n  ' + errors.join('\n  '));
  process.exit(1);
}

// Files in public/r (and its framework folders) that no item produces any more.
const listed = (dir) => (existsSync(join(OUT, dir)) ? readdirSync(join(OUT, dir)).filter((f) => f.endsWith('.json')).map((f) => (dir ? `${dir}/${f}` : f)) : []);
const stale = ['', ...FRAMEWORKS.map((fw) => fw.dir)].flatMap(listed).filter((f) => !outputs.has(f));

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
  for (const [file, content] of outputs) {
    mkdirSync(dirname(join(OUT, file)), { recursive: true });
    writeFileSync(join(OUT, file), content);
  }
  if (stale.length) console.warn(`build-registry: orphan files in public/r (not deleted): ${stale.join(', ')}`);
  console.log(`build-registry: wrote ${outputs.size} files to public/r (${registry.items.length} blocks + index, and their framework versions)`);
}
