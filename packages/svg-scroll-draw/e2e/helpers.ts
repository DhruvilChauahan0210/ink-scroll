import type { Page } from '@playwright/test';

/**
 * Shared spec-side helpers for the real-browser suite.
 *
 * The pattern every spec here follows is the *deterministic sweep*: scroll to a
 * fixed offset, wait two frames, read already-parsed numbers out of the page.
 * Phase 1 established why: passive observation of a scrolling page produced both
 * false positives and false negatives, while the sweep found real bugs.
 *
 * Deliberately no `declare global` for `window.__probe` — `parity.spec.ts`
 * declares its own strongly-typed shape, and a second declaration of the same
 * property would be a type conflict. Each probe is reached through the narrow
 * casts below instead, and each spec supplies its own row type to `read`.
 */

type ProbeWindow = {
  __probe: Record<string, (...args: unknown[]) => unknown>;
  __ready?: boolean;
};

/** Settle two frames so the JS rAF loop has written for the current offset. */
export async function settle(page: Page): Promise<void> {
  await page.evaluate(
    () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))),
  );
}

/**
 * Load a fixture and wait until its probe is published.
 *
 * Call `page.emulateMedia({ reducedMotion: 'reduce' })` *before* this when
 * testing reduced motion — the engines read the media query once at construction.
 */
export async function openFixture(page: Page, file: string): Promise<void> {
  await page.goto(`/e2e/fixtures/${file}`);
  await page.waitForFunction(() => (window as unknown as ProbeWindow).__ready === true);
  await settle(page);
}

/** Collect page errors for the life of the page. Assert on it, don't just log it. */
export function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}

export async function scrollToY(page: Page, y: number): Promise<void> {
  await page.evaluate((to) => window.scrollTo(0, to), y);
  await settle(page);
}

/** Read one row from the fixture's probe. */
export function read<T>(page: Page): Promise<T> {
  return page.evaluate(() => (window as unknown as ProbeWindow).__probe.read()) as Promise<T>;
}

/** Call any other probe method by name, with arguments. */
export function call<T = void>(page: Page, method: string, ...args: unknown[]): Promise<T> {
  return page.evaluate(
    ([m, a]) => {
      const probe = (window as unknown as ProbeWindow).__probe;
      const fn = probe[m as string];
      if (typeof fn !== 'function') throw new Error(`probe has no method ${String(m)}`);
      return fn(...(a as unknown[]));
    },
    [method, args] as [string, unknown[]],
  ) as Promise<T>;
}

/** Scroll to each offset in turn and read a row at each. The core sweep. */
export async function sweep<T>(page: Page, offsets: number[]): Promise<T[]> {
  const rows: T[] = [];
  for (const y of offsets) {
    await scrollToY(page, y);
    rows.push(await read<T>(page));
  }
  return rows;
}

/**
 * Render a sweep as a table for failure messages.
 *
 * A bare `expected 0.42 to be less than 0.4` says nothing about where in the
 * scroll range it went wrong, and Phase 1 lost time to exactly that.
 */
export function table(rows: Record<string, unknown>[]): string {
  return rows
    .map((r) =>
      Object.entries(r)
        .map(([k, v]) => `${k}=${typeof v === 'number' ? v.toFixed(3) : String(v)}`)
        .join('  '),
    )
    .join('\n');
}
