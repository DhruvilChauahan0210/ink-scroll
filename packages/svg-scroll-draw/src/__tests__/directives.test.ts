// @vitest-environment node
/**
 * The "use client" directive, checked on the files that ship.
 *
 * Next.js reads the directive from the first statement of the file it imports:
 * with it, a Server Component can render <ScrollDraw> or <AOSInit /> directly;
 * without it, the build fails on the hooks inside. tsup strips directives from
 * source, so tsup.config.ts writes it onto the React entries after the build.
 *
 * It must not reach anything else: a shared chunk carrying it would turn every
 * entry that imports the chunk (the plain `svg-scroll-draw`, say) into a client
 * module, which would break calling it from server code.
 *
 * This reads dist/, so it checks the last build — `npm run build:lib` first,
 * as `npm run verify` and CI do.
 */
import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const DIST = join(__dirname, '../../dist');
const DIRECTIVE = '"use client";';

/** Entries that render React: the components and each drop-in's hooks. */
const CLIENT_ENTRIES = ['react/index', 'aos/react/index', 'scrollreveal/react/index', 'vivus/react/index'];

function jsFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return jsFiles(p);
    return /\.(mjs|cjs)$/.test(name) ? [p] : [];
  });
}

describe('"use client" on the built files', () => {
  it('dist exists (run npm run build:lib first)', () => {
    expect(existsSync(join(DIST, 'index.mjs'))).toBe(true);
  });

  it.each(CLIENT_ENTRIES.flatMap((e) => [`${e}.mjs`, `${e}.cjs`]))('%s starts with the directive', (file) => {
    expect(readFileSync(join(DIST, file), 'utf8').startsWith(DIRECTIVE)).toBe(true);
  });

  it('no other built file carries it', () => {
    const allowed = new Set(CLIENT_ENTRIES.flatMap((e) => [`${e}.mjs`, `${e}.cjs`]));
    const leaked = jsFiles(DIST)
      .map((p) => relative(DIST, p))
      .filter((rel) => !allowed.has(rel))
      .filter((rel) => readFileSync(join(DIST, rel), 'utf8').startsWith(DIRECTIVE));
    expect(leaked).toEqual([]);
  });
});
