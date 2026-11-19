import { test, expect, type Page } from '@playwright/test';
import { openFixture, collectErrors, scrollToY, read, call, settle, table } from './helpers';

/**
 * A jump straight past a whole trigger window ends where a slow scroll to the
 * same place ends (fixtures/jump-past.html).
 *
 * engine-gate.spec.ts checks every engine's default options after a jump; this
 * one checks the options that change what the end of a jump should be: `once`,
 * `direction: 'reverse'`, `waypoints`, `once: false` on scrollCounter and
 * scrollText (back to the start when jumped back above), the native CSS path,
 * and a drawing inside a scrolling container. Up to 2.23.4 each one kept the
 * frame it last painted, typically nothing, and fired no onComplete; written
 * for 2.30.0 to reproduce that report on the 2.29.0 build, where it passes:
 * the frame gate (core/frame-gate) has decided since 2.23.5.
 *
 * The reference is the same page scrolled there in small steps, so the rule
 * holds for every option without restating each option's semantics here.
 */

type Row = {
  plain: number; once: number; reverse: number; waypoints: number; native: number;
  counter: number; text: number[]; inbox: number;
  fired: Record<string, number | number[]>;
  progresses: Record<string, number>;
};

const round = (r: Row) => ({
  ...r,
  plain: +r.plain.toFixed(3), once: +r.once.toFixed(3), reverse: +r.reverse.toFixed(3),
  waypoints: +r.waypoints.toFixed(3), native: +r.native.toFixed(3), inbox: +r.inbox.toFixed(3),
});

async function steps(page: Page, from: number, to: number, set: (y: number) => Promise<void>): Promise<void> {
  const n = 60;
  for (let k = 1; k <= n; k++) await set(from + ((to - from) * k) / n);
}

const windowTo = (page: Page) => (y: number) => scrollToY(page, y);
const boxTo = (page: Page) => async (y: number) => { await call(page, 'boxTo', y); await settle(page); };

/** Settled: two frames, then wait until two reads agree (the native path is on the compositor). */
async function steady(page: Page): Promise<Row> {
  let last = '';
  for (let k = 0; k < 20; k++) {
    await settle(page);
    const r = JSON.stringify(round(await read<Row>(page)));
    if (r === last) return JSON.parse(r) as Row;
    last = r;
  }
  return JSON.parse(last) as Row;
}

test.describe('a jump past a whole window ends where a slow scroll does', () => {
  test('down past every window, then back above them', async ({ page: jump, context }) => {
    const slow = await context.newPage();
    const errors = [...collectErrors(jump), ...collectErrors(slow)];
    await openFixture(jump, 'jump-past.html');
    await openFixture(slow, 'jump-past.html');
    const end = await call<number>(jump, 'maxScroll');
    const boxEnd = await call<number>(jump, 'boxMax');

    // The window first, then the container, each straight to its end.
    await scrollToY(jump, end);
    await call(jump, 'boxTo', boxEnd);
    await steps(slow, 0, end, windowTo(slow));
    await steps(slow, 0, boxEnd, boxTo(slow));
    const [jd, sd] = [await steady(jump), await steady(slow)];

    // And straight back above every window.
    await call(jump, 'boxTo', 0);
    await scrollToY(jump, 0);
    await steps(slow, boxEnd, 0, boxTo(slow));
    await steps(slow, end, 0, windowTo(slow));
    const [ju, su] = [await steady(jump), await steady(slow)];

    const shown = table([
      { how: 'jump down', ...jd, text: jd.text.join(' '), fired: JSON.stringify(jd.fired), progresses: JSON.stringify(jd.progresses) },
      { how: 'slow down', ...sd, text: sd.text.join(' '), fired: JSON.stringify(sd.fired), progresses: JSON.stringify(sd.progresses) },
      { how: 'jump up', ...ju, text: ju.text.join(' '), fired: JSON.stringify(ju.fired), progresses: JSON.stringify(ju.progresses) },
      { how: 'slow up', ...su, text: su.text.join(' '), fired: JSON.stringify(su.fired), progresses: JSON.stringify(su.progresses) },
    ]);
    expect(errors).toEqual([]);

    // The finished state, said outright so a test that agrees with a broken
    // slow scroll still fails.
    expect.soft(jd.plain, shown).toBeCloseTo(1, 2);
    expect.soft(jd.once, shown).toBeCloseTo(1, 2);
    expect.soft(jd.reverse, shown).toBeCloseTo(0, 2);
    expect.soft(jd.waypoints, shown).toBeCloseTo(1, 2);
    expect.soft(jd.native, shown).toBeCloseTo(1, 2);
    expect.soft(jd.counter, shown).toBe(100);
    for (const o of jd.text) expect.soft(o, shown).toBe(1);
    expect.soft(jd.inbox, shown).toBeCloseTo(1, 2);
    expect.soft(jd.fired.wp, shown).toEqual([0.25, 0.5, 1]);
    for (const k of ['plain', 'once', 'reverse', 'waypoints', 'counter', 'text', 'inbox'])
      expect.soft(jd.fired[k], `${k} onComplete once on the jump\n${shown}`).toBe(1);

    // Back above: the start, except what `once` holds.
    expect.soft(ju.plain, shown).toBeCloseTo(0, 2);
    expect.soft(ju.once, shown).toBeCloseTo(1, 2);
    expect.soft(ju.reverse, shown).toBeCloseTo(1, 2);
    expect.soft(ju.native, shown).toBeCloseTo(0, 2);
    expect.soft(ju.counter, shown).toBe(0);
    for (const o of ju.text) expect.soft(o, shown).toBe(0);
    expect.soft(ju.inbox, shown).toBeCloseTo(0, 2);

    // And everything, callbacks included, as the slow scroll left it.
    expect.soft(jd, `down\n${shown}`).toEqual(sd);
    expect.soft(ju, `up\n${shown}`).toEqual(su);

    await slow.close();
  });
});
