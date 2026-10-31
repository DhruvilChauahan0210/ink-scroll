import { test, expect } from '@playwright/test';
import { collectErrors, openFixture, call } from './helpers';

/**
 * useAOS / <AOSInit>, useScrollReveal and useVivus in a real React 18 app under
 * StrictMode, built from dist/ like the other framework fixtures.
 *
 * StrictMode mounts, unmounts and remounts every effect, which is exactly what
 * breaks the hand-written `AOS.init()` / `ScrollReveal().reveal()` /
 * `new Vivus()` effects these hooks replace. A state change stands in for a
 * route change.
 */

type Read = {
  aosStyleTags: number;
  aos: { id: string; init: boolean; animated: boolean }[];
  srIds: (string | null)[];
  srVisible: string[];
  vivus: { status: string; done: number; paths: number; dashed: boolean } | null;
};

const read = (page: import('@playwright/test').Page) => call<Read>(page, 'read');

test('StrictMode double-mount leaves one clean instance of each', async ({ page }) => {
  const errors = collectErrors(page);
  const consoleErrors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  await openFixture(page, 'fw-dropins-react.html');

  await expect.poll(async () => (await read(page)).aos[0]?.animated).toBe(true);
  const r = await read(page);
  expect(r.aosStyleTags, 'AOS stylesheet injected more than once').toBe(1);
  expect(r.aos).toEqual([{ id: 'aos-a', init: true, animated: true }]);
  // Three cards, each with exactly one live ScrollReveal id.
  expect(r.srIds.every((id) => id !== null)).toBe(true);
  expect(new Set(r.srIds).size).toBe(3);
  await expect.poll(async () => (await read(page)).srVisible).toEqual(['visible', 'visible', 'visible']);
  // vivus turned the <rect> into a path, and every path has its dashes.
  expect(r.vivus).toMatchObject({ status: 'start', paths: 2, dashed: true });

  await call(page, 'play');
  await expect.poll(async () => (await read(page)).vivus?.status).toBe('end');
  expect((await read(page)).vivus?.done, 'callback should fire once, not once per StrictMode mount').toBe(1);

  expect(errors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test('a route change cleans up, and new [data-aos] content is picked up', async ({ page }) => {
  const errors = collectErrors(page);
  await openFixture(page, 'fw-dropins-react.html');
  await expect.poll(async () => (await read(page)).aos[0]?.animated).toBe(true);

  await call(page, 'page', 'b');
  await expect.poll(async () => (await read(page)).aos).toEqual([{ id: 'aos-b', init: true, animated: true }]);
  let r = await read(page);
  expect(r.srIds).toEqual([]);
  expect(r.vivus).toBeNull();

  // Back again: everything initialises afresh, still exactly once.
  await call(page, 'page', 'a');
  await expect.poll(async () => (await read(page)).srIds.filter(Boolean).length).toBe(3);
  await expect.poll(async () => (await read(page)).vivus?.dashed).toBe(true);
  r = await read(page);
  expect(r.aosStyleTags).toBe(1);
  expect(new Set(r.srIds).size).toBe(3);
  expect(errors).toEqual([]);
});

test('unmounting <AOSInit> removes AOS entirely', async ({ page }) => {
  await openFixture(page, 'fw-dropins-react.html');
  await expect.poll(async () => (await read(page)).aosStyleTags).toBe(1);
  await call(page, 'aos', false);
  await expect.poll(async () => (await read(page)).aosStyleTags).toBe(0);
});
