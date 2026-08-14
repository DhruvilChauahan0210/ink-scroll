/**
 * Guards the browser-safety of the dev-warning system.
 *
 * A bare `process.env.NODE_ENV !== 'production'` guarded every dev warning in the
 * library. `process` does not exist in a browser without a bundler, so any code
 * path that reached one of those guards threw `ReferenceError: process is not
 * defined` — breaking the CDN / `<script type="module">` usage the README
 * advertises. Repro: style a path's stroke with CSS instead of a `stroke`
 * attribute, and the engine's "no stroke" warning takes the whole call down.
 *
 * The source-level test below is the important one: it fails if anyone
 * reintroduces a bare `process` reference anywhere in src/.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { IS_DEV, warn } from '../core/env';

const SRC = join(__dirname, '..');

function tsFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      return name === '__tests__' ? [] : tsFiles(path);
    }
    return /\.tsx?$/.test(name) ? [path] : [];
  });
}

afterEach(() => vi.restoreAllMocks());

describe('dev-warning environment guard', () => {
  it('no browser-shipped module references process', () => {
    const offenders = tsFiles(SRC)
      // core/env.ts owns the single guarded access.
      .filter((f) => !f.endsWith(join('core', 'env.ts')))
      // src/cli runs under Node, where process.cwd()/stdin/exit are legitimate.
      // It is never bundled for the browser.
      .filter((f) => !f.includes(`${join('src', 'cli')}`) && !f.includes(`/cli/`))
      .filter((f) => /(^|[^.\w])process\s*\./.test(readFileSync(f, 'utf8')))
      .map((f) => f.slice(SRC.length + 1));

    expect(
      offenders,
      'These files reference `process` directly. In a browser without a bundler ' +
        'that throws ReferenceError. Import { IS_DEV, warn } from core/env instead.',
    ).toEqual([]);
  });

  /**
   * Every diagnostic has to go through `warn()`, or it cannot be turned off in
   * production and cannot be turned *on* for the CDN dev build — which is the
   * whole point of shipping one. Two modules were calling `console.warn`
   * directly, so their "container not found" message shipped to every production
   * user and was the only thing a `<script src>` user could ever see.
   */
  it('no module calls console.warn directly', () => {
    const offenders = tsFiles(SRC)
      .filter((f) => !f.endsWith(join('core', 'env.ts')))
      .filter((f) => !f.includes(`${join('src', 'cli')}`) && !f.includes(`/cli/`))
      .filter((f) => /console\s*\.\s*warn/.test(readFileSync(f, 'utf8')))
      .map((f) => f.slice(SRC.length + 1));

    expect(
      offenders,
      'These files call console.warn directly, so the warning cannot be stripped ' +
        'from production or enabled in the dev CDN build. Use warn() from core/env.',
    ).toEqual([]);
  });

  it('core/env.ts guards its process access with typeof', () => {
    const src = readFileSync(join(SRC, 'core', 'env.ts'), 'utf8');
    expect(src).toMatch(/typeof process !== 'undefined'/);
    expect(src).toMatch(/typeof process\.env !== 'undefined'/);
  });

  it('evaluates IS_DEV without throwing when process is absent', () => {
    // Re-evaluate the guard expression with `process` shadowed as undefined,
    // which is what a browser sees.
    const evaluate = new Function(
      'process',
      "return typeof process !== 'undefined' && typeof process.env !== 'undefined' && process.env.NODE_ENV !== 'production';",
    );
    expect(() => evaluate(undefined)).not.toThrow();
    expect(evaluate(undefined)).toBe(false);
  });

  it('IS_DEV is true under the test runner', () => {
    expect(IS_DEV).toBe(true);
  });

  it('warn() prefixes the package name and forwards extra args', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const el = { tag: 'path' };
    warn('scrollDraw: something is off:', el);
    expect(spy).toHaveBeenCalledWith('[svg-scroll-draw] scrollDraw: something is off:', el);
  });
});
