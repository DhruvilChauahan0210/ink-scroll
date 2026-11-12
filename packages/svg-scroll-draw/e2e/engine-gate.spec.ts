import { test, expect, type Page } from '@playwright/test';
import { openFixture, collectErrors, scrollToY, read, call, table, settle } from './helpers';

/**
 * What runs every other engine's frames (animate-gate.spec.ts has scrollAnimate).
 *
 * Up to 2.23.4 scrollDraw's JS path, scrollCounter, scrollText, scrollVideo,
 * scrollProgress, scrollDrawTimeline and useScrollDrawProgress ran their frame
 * loop while an IntersectionObserver saw the element. A jump across the whole
 * trigger window never has it on screen: the End key, an anchor link, the
 * scroll a reload restores. The element kept its first frame and onComplete
 * never fired. The trigger window decides now (core/frame-gate).
 *
 * Each case starts on a page whose every window is below the fold, and ends
 * with every window above it, without a frame in between that sees one.
 */

type Row = {
  scrollY: number;
  draw: number;
  stagger: number[];
  counter: number;
  text: number[];
  video: number | null;
  progress: number;
  timeline: number;
  hook: number;
  completed: Record<string, number>;
  progresses: Record<string, number>;
};

/**
 * Every engine's last frame, and each onComplete exactly once. Soft, so a
 * failure names every engine that missed it, not only the first.
 */
async function expectFinished(page: Page, how: string): Promise<void> {
  // A reload restores the scroll when it likes, and the video loads when it
  // likes: wait for the finished frame rather than sample once.
  await page.waitForFunction(() => {
    const r = (window as unknown as { __probe: { read: () => Row } }).__probe.read();
    return r.video === 1 && r.counter === 100 && r.hook === 1 && r.draw > 0.999 && r.timeline > 0.999;
  }, undefined, { timeout: 5000 }).catch(() => {});
  const r = await read<Row>(page);
  const shown = table([{ how, ...r, stagger: r.stagger.join(' '), text: r.text.join(' '), completed: JSON.stringify(r.completed), progresses: JSON.stringify(r.progresses) }]);
  expect.soft(r.draw, `scrollDraw\n${shown}`).toBeCloseTo(1, 3);
  for (const s of r.stagger) expect.soft(s, `scrollDraw stagger\n${shown}`).toBeCloseTo(1, 3);
  expect.soft(r.counter, `scrollCounter\n${shown}`).toBe(100);
  expect.soft(r.text.length, shown).toBe(3);
  for (const o of r.text) expect.soft(o, `scrollText\n${shown}`).toBe(1);
  expect.soft(r.video, `scrollVideo\n${shown}`).toBeCloseTo(1, 3);
  expect.soft(r.progress, `scrollProgress\n${shown}`).toBe(1);
  expect.soft(r.timeline, `scrollDrawTimeline\n${shown}`).toBeCloseTo(1, 3);
  expect.soft(r.hook, `useScrollDrawProgress\n${shown}`).toBe(1);
  for (const [name, p] of Object.entries(r.progresses)) expect.soft(p, `${name}.getProgress()\n${shown}`).toBe(1);
  for (const [name, n] of Object.entries(r.completed)) expect.soft(n, `${name} onComplete\n${shown}`).toBe(1);
}

test.describe('every engine follows its trigger window, not the screen', () => {
  test('at the top, every engine is on its first frame', async ({ page }) => {
    const errors = collectErrors(page);
    await openFixture(page, 'engine-gate.html');
    await expect.poll(() => call<boolean>(page, 'ready'), { timeout: 5000 }).toBe(true);
    const r = await read<Row>(page);
    expect(errors).toEqual([]);
    expect(r.draw).toBeCloseTo(0, 3);
    expect(r.counter).toBe(0);
    expect(r.progress).toBe(0);
    expect(r.timeline).toBeCloseTo(0, 3);
    expect(r.hook).toBe(0);
    expect(Object.values(r.completed).every((n) => n === 0)).toBe(true);
  });

  test('a jump to the end paints every last frame and completes, and back', async ({ page }) => {
    await openFixture(page, 'engine-gate.html');
    await expect.poll(() => call<boolean>(page, 'ready'), { timeout: 5000 }).toBe(true);
    const end = await call<number>(page, 'maxScroll');
    expect(end).toBeGreaterThan(4700); // every window ends by 4600

    await scrollToY(page, end); // the End key
    await expectFinished(page, 'jump');

    // Back to the top: what does not hold at the end (once) goes back to 0.
    await scrollToY(page, 0);
    await expect.poll(async () => (await read<Row>(page)).hook).toBe(0);
    const back = await read<Row>(page);
    expect(back.draw).toBeCloseTo(0, 3);
    expect(back.stagger.every((s) => Math.abs(s) < 1e-3)).toBe(true);
    expect(back.video).toBeCloseTo(0, 3);
    expect(back.progress).toBe(0);
    expect(back.timeline).toBeCloseTo(0, 3);
    // scrollCounter and scrollText default to once: they hold.
    expect(back.counter).toBe(100);
    expect(back.text.every((o) => o === 1)).toBe(true);
  });

  test('an anchor link past every window', async ({ page }) => {
    await openFixture(page, 'engine-gate.html');
    await page.evaluate(() => { location.hash = '#end'; });
    await expectFinished(page, 'anchor');
  });

  test('a page loaded on an anchor past every window', async ({ page }) => {
    await page.goto('/e2e/fixtures/engine-gate.html#end');
    await page.waitForFunction(() => (window as unknown as { __ready?: boolean }).__ready === true);
    await expectFinished(page, 'loaded on #end');
  });

  test('the scroll a reload restores', async ({ page, browserName }) => {
    // Measured: Playwright's WebKit reloads at the top, so there is nothing to test.
    test.skip(browserName === 'webkit', 'Playwright WebKit does not restore the scroll on reload');
    await openFixture(page, 'engine-gate.html');
    const end = await call<number>(page, 'maxScroll');
    await scrollToY(page, end);
    await page.reload();
    await page.waitForFunction(() => (window as unknown as { __ready?: boolean }).__ready === true);
    await expect.poll(() => page.evaluate(() => window.scrollY), { message: 'the browser did not restore the scroll', timeout: 5000 })
      .toBeGreaterThan(4700);
    await expectFinished(page, 'reload');
  });
});

/**
 * A repeat restarts only while the scroll is inside the trigger window
 * (fixtures/repeat-gate.html). The gate above made every repeat timer repaint
 * wherever the scroll was: past the window that frame is drawn whole, so it
 * completed, started the next timer, and did it again. Measured in Chromium on
 * the 2.23.5 tree before the fix, at rest below the drawings: repeat 'infinite'
 * with repeatDelay 0 ran 60 frames and 60 onComplete calls a second, forever
 * (2.23.4: none), repeatDelay 500 two a second, and `repeat: 2` spent both
 * repeats at once.
 */
test.describe('repeat restarts inside the trigger window only', () => {
  type RepeatRow = {
    frames: number;
    completed: Record<string, number>;
    drawn: Record<string, number>;
    clip: string;
  };

  test('a jump past every window completes each once, then the page rests', async ({ page }) => {
    const errors = collectErrors(page);
    await openFixture(page, 'repeat-gate.html');
    const end = await call<number>(page, 'maxScroll');
    expect(end).toBeGreaterThan(4900); // every window ends by 4200

    await page.evaluate((y) => window.scrollTo(0, y), end);
    await page.waitForTimeout(150);
    const before = await read<RepeatRow>(page);
    await page.waitForTimeout(1000); // repeatDelay 500 fires in here, twice over
    const after = await read<RepeatRow>(page);
    const shown = table([{ when: 'jump', ...before, completed: JSON.stringify(before.completed), drawn: JSON.stringify(before.drawn) },
      { when: '+1s', ...after, completed: JSON.stringify(after.completed), drawn: JSON.stringify(after.drawn) }]);

    expect(errors).toEqual([]);
    expect(after.frames - before.frames, `frames requested at rest past every window\n${shown}`).toBe(0);
    for (const [name, n] of Object.entries(after.completed)) expect.soft(n, `${name} onComplete\n${shown}`).toBe(1);
    for (const [name, d] of Object.entries(after.drawn)) expect.soft(d, `${name} drawn\n${shown}`).toBeCloseTo(1, 3);
    expect(after.clip, shown).toBe('inset(0px 0% 0px 0px)');
  });

  test('inside its window a repeat still restarts, and resting past it stops', async ({ page }) => {
    await openFixture(page, 'repeat-gate.html');
    // #fast (speed 2) is drawn whole halfway through its window: rest at 3900.
    await scrollToY(page, 3900);
    const at = (await read<RepeatRow>(page)).completed.fast;
    await page.waitForTimeout(1000);
    const later = await read<RepeatRow>(page);
    expect(later.completed.fast - at, 'repeatDelay 100 inside the window: about one a frame plus 100ms').toBeGreaterThan(4);

    // Out past its window, it stops on the frame the scroll calls for.
    await scrollToY(page, 5000);
    await page.waitForTimeout(150);
    const parked = await read<RepeatRow>(page);
    await page.waitForTimeout(600);
    const rest = await read<RepeatRow>(page);
    expect(rest.completed.fast).toBe(parked.completed.fast);
    expect(rest.frames - parked.frames).toBe(0);
    expect(rest.drawn.fast).toBeCloseTo(1, 3);
  });

  test('back inside the window, a parked repeat restarts: `once` lets go', async ({ page }) => {
    await openFixture(page, 'repeat-gate.html');
    await scrollToY(page, 5000);
    await page.waitForTimeout(150); // the repeat's delay (0) is up, past the window
    expect((await read<RepeatRow>(page)).drawn.once).toBeCloseTo(1, 3);
    expect((await read<RepeatRow>(page)).drawn.timeline).toBeCloseTo(1, 3);

    // #once runs 2400 → 3400 and the timeline 2800 → 3800: 3000 is inside both.
    // Without the repeat, `once` would hold them drawn whole here.
    await scrollToY(page, 3000);
    await settle(page);
    const back = await read<RepeatRow>(page);
    expect(back.drawn.once).toBeCloseTo(0.6, 1);
    expect(back.drawn.timeline).toBeCloseTo(0.2, 1);
  });
});

test.describe('trigger window edges', () => {
  type EdgeRow = { neg: number[]; negCompleted: number; log: Record<'draw' | 'animate', string[]> };

  test("a negative range ('bottom top' → 'top top') with stagger 0.5 completes when scrolled through", async ({ page }) => {
    await openFixture(page, 'gate-edges.html');
    await scrollToY(page, 2400); // below every path's window: undrawn
    const below = await read<EdgeRow>(page);
    for (const d of below.neg) expect(d).toBeCloseTo(0, 3);

    // Up through the window, a reader's steps.
    for (let y = 2300; y >= 1200; y -= 50) await scrollToY(page, y);
    const above = await read<EdgeRow>(page);
    const shown = table([{ when: 'below', ...below, neg: below.neg.join(' ') }, { when: 'above', ...above, neg: above.neg.join(' ') }]);
    for (const d of above.neg) expect.soft(d, shown).toBeCloseTo(1, 3);
    expect(above.negCompleted - below.negCompleted, shown).toBe(1);

    // And back down through it, the same.
    for (let y = 1250; y <= 2400; y += 50) await scrollToY(page, y);
    for (const d of (await read<EdgeRow>(page)).neg) expect(d).toBeCloseTo(0, 3);
  });

  test('a jump back across a whole window fires onEnterBack before onLeaveBack', async ({ page }) => {
    await openFixture(page, 'gate-edges.html');
    const end = await call<number>(page, 'maxScroll');
    await scrollToY(page, end); // past both windows in one jump
    await scrollToY(page, 0);   // and before them in one
    const { log } = await read<EdgeRow>(page);
    expect(log.draw, 'scrollDraw').toEqual(['enter', 'leave', 'enterBack', 'leaveBack']);
    expect(log.animate, 'scrollAnimate').toEqual(['enter', 'leave', 'enterBack', 'leaveBack']);
  });
});
