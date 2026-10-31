/**
 * Build the library from tsup.config.ts with bounded parallelism.
 *
 * `tsup` builds every config in the array at once, and each one with `dts`
 * runs its own TypeScript program. With ~40 entries that peak is enough to
 * exhaust an 8 GB build container: Vercel killed the build with an OOM (exit
 * 137) on 2026-10-31 while a laptop sails through. This runs the very same
 * configs — same options, same output — a few at a time instead.
 *
 *   node scripts/build-lowmem.mjs            (from the package directory)
 *   TSUP_CONCURRENCY=6 node scripts/build-lowmem.mjs
 *
 * The first config owns `clean: true`, so it runs alone before the rest.
 * Releases still use plain `tsup`; this is for memory-capped builders.
 */
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { bundleRequire } from 'bundle-require';
import { build } from 'tsup';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(ROOT);

const { mod } = await bundleRequire({ filepath: join(ROOT, 'tsup.config.ts') });
const configs = [].concat(mod.default ?? mod);
const concurrency = Math.max(1, Number(process.env.TSUP_CONCURRENCY) || 4);

const run = (c) => build({ ...c, config: false });

const started = Date.now();
const [first, ...rest] = configs;
await run(first);
for (let i = 0; i < rest.length; i += concurrency) {
  await Promise.all(rest.slice(i, i + concurrency).map(run));
}
console.log(`build-lowmem: ${configs.length} configs, ${concurrency} at a time, ${((Date.now() - started) / 1000).toFixed(1)}s`);
