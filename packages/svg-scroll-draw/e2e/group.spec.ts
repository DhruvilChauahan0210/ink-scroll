import { test, expect } from '@playwright/test';
import { openFixture, collectErrors, scrollToY, read, call, table } from './helpers';

/**
 * `svg-scroll-draw/group` in real browsers.
 *
 * The weakest module in the library by coverage — 50% of lines — and the jsdom
 * half of that was measuring nothing: `getTotalLength()` is stubbed to a
 * constant, so a draw group could not be seen drawing, and `getBoundingClientRect`
 * returns zeros, so `scrollParallaxGroup`'s whole contract (travel = speed x the
 * element's own height) was exercised against a height of 0.
 *
 * Every entry point here is a fan-out over per-element engines, which makes one
 * failure mode structural and shared: an operation that reaches only the first
 * member. `seek`, `destroy` and `replay` are each checked against every member
 * rather than the group's own report of itself.
 *
 * Fixture geometry — group.html (viewport 900x800):
 *   3 draw-group boxes side by side at top 1000, 300 tall → window 200 → 1300
 *   3 sequence steps stacked at 2200 / 2900 / 3600, 300 tall
 *
 * Fixture geometry — animate-group.html:
 *   3 cards at 1000 / 1400 / 1800, 200 tall
 *   3 sequence cards at 2600 / 3000 / 3400, 200 tall
 *   3 parallax boxes sharing top 4200, 100 / 200 / 300 tall
 */

type DrawRow = {
  scrollY: number;
  group: number[];
  steps: number[];
  groupProgress: number;
  sequenceProgress: number;
  completions: number;
};

type AnimRow = {
  scrollY: number;
  group: number[];
  sequence: number[];
  parallax: number[];
  groupProgress: number;
  sequenceProgress: number;
  completions: number;
  groupInline: string[];
  groupRects: { top: number; bottom: number }[];
};

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const linear = (top: number, height: number, y: number) => clamp01((y - (top - 800)) / (top + height - (top - 800)));
const easeOut = (t: number) => t * (2 - t);

test.describe('scrollDrawGroup', () => {
  test('the fixture loads and its geometry is what the offsets assume', async ({ page }) => {
    const errors = collectErrors(page);
    await openFixture(page, 'group.html');
    expect(errors).toEqual([]);

    const geo = await call<{
      viewportHeight: number;
      group: { top: number; height: number }[];
      steps: { top: number; height: number }[];
      pathLength: number;
    }>(page, 'geometry');

    expect(geo.viewportHeight).toBe(800);
    expect(geo.group).toEqual([
      { top: 1000, height: 300 },
      { top: 1000, height: 300 },
      { top: 1000, height: 300 },
    ]);
    expect(geo.steps).toEqual([
      { top: 2200, height: 300 },
      { top: 2900, height: 300 },
      { top: 3600, height: 300 },
    ]);
    // The whole suite is meaningless if the paths have no length — which is the
    // state jsdom tested this module in.
    expect(geo.pathLength).toBeGreaterThan(100);
  });

  test('every member draws together and matches the single-element engine', async ({ page }) => {
    await openFixture(page, 'group.html');

    const offsets = [200, 400, 600, 750, 900, 1100, 1300];
    const rows: DrawRow[] = [];
    for (const y of offsets) {
      await scrollToY(page, y);
      rows.push(await read<DrawRow>(page));
    }

    const shown = table(
      rows.map((r) => ({ y: r.scrollY, g0: r.group[0], g1: r.group[1], g2: r.group[2], want: linear(1000, 300, r.scrollY) })),
    );

    for (const r of rows) {
      const want = linear(1000, 300, r.scrollY);
      for (const [i, got] of r.group.entries()) {
        expect(got, `member ${i} at y=${r.scrollY}\n${shown}`).toBeCloseTo(want, 1);
      }
    }
    // Not vacuous: the sweep must include genuinely partial draws.
    expect(rows.filter((r) => r.group[0] > 0.05 && r.group[0] < 0.95).length, shown).toBeGreaterThanOrEqual(3);
  });

  test('getProgress() reports the group, not a member that never moved', async ({ page }) => {
    await openFixture(page, 'group.html');
    await scrollToY(page, 750);

    const row = await read<DrawRow>(page);
    expect(row.groupProgress).toBeCloseTo(0.5, 1);
  });

  test('seek() moves every member, not just the first', async ({ page }) => {
    await openFixture(page, 'group.html');
    await scrollToY(page, 400);

    await call(page, 'seekGroup', 0.5);
    const row = await read<DrawRow>(page);
    for (const [i, got] of row.group.entries()) {
      expect(got, `member ${i} did not respond to the group's seek()`).toBeCloseTo(0.5, 2);
    }
  });

  /**
   * A fan-out `destroy()` that loops over the members but exits after the first
   * leaves live rAF loops behind, and nothing about the group's own API would
   * show it. So the check is per member and behavioural.
   *
   * Teardown looks different on the two engines — the JS engine leaves the last
   * frame it wrote, the native path drops its class and the paths paint fully
   * drawn — so the assertion is what both share: no member is still tracking
   * the scroll position, and they are all in the same state as each other.
   */
  /**
   * `refresh()` exists for the layout changes nothing else notices: the engine
   * re-measures on resize, on orientationchange, and through a ResizeObserver on
   * the document element, and a path changing shape inside a fixed-height box
   * fires none of them. Without it the dasharray keeps the old length and the
   * draw stops short of the end of the path.
   *
   * `scrollPin` and `scrollHorizontal` have had this; `scrollDraw` had not.
   */
  test('refresh() re-measures a path that changed length, on every member', async ({ page }) => {
    await openFixture(page, 'group.html');

    const r = await call<{
      before: number;
      grown: number;
      dasharrays: number[];
      lenVars: number[];
    }>(page, 'growThenRefreshGroup');

    expect(r.grown, 'the fixture did not actually lengthen the path').toBeGreaterThan(r.before + 10);

    /*
     * The two engines record the length in two places, and on the native path
     * both matter: `stroke-dasharray` is what renders, and `--ssd-len` is what
     * the generated keyframes interpolate from. Updating only one leaves the
     * animation running to the old length, so both are asserted rather than
     * whichever happens to be set.
     */
    const nativePath = r.lenVars[0] > 0;
    expect(
      r.dasharrays[0],
      `member 0 dasharray is ${r.dasharrays[0]}, path is now ${r.grown}`,
    ).toBeCloseTo(r.grown, 0);
    if (nativePath) {
      expect(
        r.lenVars[0],
        `member 0 --ssd-len is ${r.lenVars[0]}, path is now ${r.grown}`,
      ).toBeCloseTo(r.grown, 0);
    }

    // The untouched members must be re-measured too, and left at their own length.
    for (const i of [1, 2]) {
      expect(r.dasharrays[i], `member ${i} lost its length on refresh`).toBeCloseTo(r.before, 0);
      if (nativePath) {
        expect(r.lenVars[i], `member ${i} lost its --ssd-len on refresh`).toBeCloseTo(r.before, 0);
      }
    }

    await scrollToY(page, 1300);
    expect((await read<DrawRow>(page)).group[0], 'the lengthened path never finishes').toBeCloseTo(1, 1);

    // The two engines record the length in different places and refresh through
    // different code, so the JS path is checked separately rather than assumed.
    const js = await call<{ before: number; grown: number; dasharray: number }>(
      page,
      'growThenRefreshSingle',
    );
    expect(js.grown).toBeGreaterThan(js.before + 10);
    expect(js.dasharray, `JS-engine dasharray still ${js.dasharray}, path is ${js.grown}`).toBeCloseTo(
      js.grown,
      0,
    );
  });

  test('destroy() tears down every member', async ({ page }) => {
    await openFixture(page, 'group.html');

    await scrollToY(page, 750);
    const before = await read<DrawRow>(page);
    for (const v of before.group) expect(v).toBeCloseTo(0.5, 1);

    await call(page, 'destroyGroup');
    await scrollToY(page, 1080); // live, this would be 0.8

    const after = await read<DrawRow>(page);
    const spread = Math.max(...after.group) - Math.min(...after.group);
    expect(spread, `members disagree after destroy: ${after.group.join(', ')}`).toBeLessThan(0.02);
    for (const [i, v] of after.group.entries()) {
      expect(
        Math.abs(v - 0.8),
        `member ${i} is still tracking scroll after destroy (${v.toFixed(3)})`,
      ).toBeGreaterThan(0.05);
    }
  });
});

test.describe('scrollDrawSequence', () => {
  /**
   * The whole point of a sequence: a step must not start until the one before it
   * has finished, even though its own scroll window has already opened. The steps
   * are stacked 700px apart against an 800px viewport, so every window overlaps
   * its neighbour — without the gate, all three would be advancing at once.
   */
  test('a step does not start until the previous one has completed', async ({ page }) => {
    await openFixture(page, 'group.html');

    // Step 0's window is 1400 → 2500. Mid-way through it, and well inside step
    // 1's own window (2100 → 3200), step 1 must still be untouched.
    await scrollToY(page, 2200);
    const mid = await read<DrawRow>(page);
    expect(mid.steps[0], 'step 0 should be part-way through').toBeGreaterThan(0.4);
    expect(mid.steps[0]).toBeLessThan(1);
    expect(mid.steps[1], 'step 1 started before step 0 finished').toBeCloseTo(0, 2);
    expect(mid.steps[2], 'step 2 started before step 0 finished').toBeCloseTo(0, 2);

    // Past the end of step 0's window: it completes and hands over.
    await scrollToY(page, 2600);
    const handoff = await read<DrawRow>(page);
    expect(handoff.steps[0]).toBeCloseTo(1, 2);
    expect(handoff.completions, 'onComplete did not fire for the finished step').toBeGreaterThan(0);
    expect(handoff.steps[1], 'step 1 never picked up the chain').toBeGreaterThan(0);
    expect(handoff.steps[2], 'step 2 started out of order').toBeCloseTo(0, 2);
  });

  /**
   * Documented behaviour, and the reason each step is internally forced to
   * `once: true`: scrolling back must not un-complete a step, because that would
   * restart the chain from the middle.
   */
  test('a completed step stays completed when you scroll back up', async ({ page }) => {
    await openFixture(page, 'group.html');

    // Scrolled through, not jumped past. The JS engine only writes while the
    // element is intersecting, so a single jump to 2600 would leave step 0
    // undrawn — the documented asymmetry in parity.spec.ts, not this behaviour.
    await scrollToY(page, 2200);
    await scrollToY(page, 2600);
    expect((await read<DrawRow>(page)).steps[0]).toBeCloseTo(1, 2);

    await scrollToY(page, 1800); // back inside step 0's window
    const back = await read<DrawRow>(page);
    expect(back.steps[0], 'scrolling back un-completed a finished step').toBeCloseTo(1, 2);
  });

  test('the whole chain completes, and reports itself complete afterwards', async ({ page }) => {
    await openFixture(page, 'group.html');

    // Walk the chain rather than jumping: each step only starts once its
    // predecessor has been seen finishing.
    for (let y = 1400; y <= 3900; y += 100) await scrollToY(page, y);

    const done = await read<DrawRow>(page);
    expect(done.steps, `chain did not finish: ${done.steps.join(', ')}`).toEqual([
      expect.closeTo(1, 2),
      expect.closeTo(1, 2),
      expect.closeTo(1, 2),
    ]);
    // A sequence that has finished is at 100%, not back at zero.
    expect(done.sequenceProgress, 'a finished sequence reports 0% progress').toBeCloseTo(1, 2);
  });
});

test.describe('scrollAnimateGroup', () => {
  test('the fixture geometry is what the offsets assume', async ({ page }) => {
    const errors = collectErrors(page);
    await openFixture(page, 'animate-group.html');
    expect(errors).toEqual([]);

    const geo = await call<{
      group: { top: number; height: number }[];
      sequence: { top: number; height: number }[];
      parallax: { top: number; height: number; expectedTravel: number }[];
    }>(page, 'geometry');

    expect(geo.group.map((g) => g.top)).toEqual([1000, 1400, 1800]);
    expect(geo.sequence.map((g) => g.top)).toEqual([2600, 3000, 3400]);
    expect(geo.parallax).toEqual([
      { top: 4200, height: 100, expectedTravel: 40 },
      { top: 4200, height: 200, expectedTravel: 80 },
      { top: 4200, height: 300, expectedTravel: 120 },
    ]);
  });

  /**
   * Each member tracks its own scroll position — which is what turns a column of
   * cards into a cascade without any stagger option. Asserted as a strict
   * ordering, so a group that drove every member from one shared window (the
   * obvious wrong implementation) fails.
   */
  test('members animate on their own windows, producing a cascade', async ({ page }) => {
    await openFixture(page, 'animate-group.html');
    // 1050 is inside all three windows at once (200–1200, 600–1600, 1000–2000),
    // so every member is mid-animation and the ordering is a real cascade rather
    // than an artefact of some members having finished.
    await scrollToY(page, 1050);

    const row = await read<AnimRow>(page);
    const [a0, a1, a2] = row.group;
    const shown = `opacities: ${row.group.map((v) => v.toFixed(3)).join(', ')}`;

    expect(a0, shown).toBeGreaterThan(a1);
    expect(a1, shown).toBeGreaterThan(a2);

    // And each against its own trigger window, with the default `ease-out`.
    const tops = [1000, 1400, 1800];
    for (const [i, want] of tops.map((t) => easeOut(linear(t, 200, 1050))).entries()) {
      expect(row.group[i], `member ${i} — ${shown}`).toBeCloseTo(want, 1);
    }
  });

  /**
   * A real cross-browser difference in the native fast path, pinned by the one
   * property that makes it harmless rather than by a per-browser value.
   *
   * Once an element has scrolled past `cover 100%`, Chromium and WebKit hold the
   * animation's end state (`animation-fill-mode: both`), while Firefox treats the
   * now-inactive `view()` timeline as unresolved and holds the *start* state
   * instead — so the same card reads 1 in Chrome and 0 in Firefox.
   *
   * It cannot be seen: the `cover` range spans exactly the offsets where any part
   * of the element is in the scrollport, so the two only disagree while the
   * element is off-screen entirely — which is what this test asserts, along with
   * the recovery that keeps it invisible. Asserting `0` for Firefox by name would
   * pin a browser bug instead of the library's contract.
   */
  test('past the end of its range, a member is off-screen wherever engines differ', async ({
    page,
  }) => {
    await openFixture(page, 'animate-group.html');

    await scrollToY(page, 1100);
    const inRange = await read<AnimRow>(page);
    expect(inRange.group[0]).toBeCloseTo(easeOut(linear(1000, 200, 1100)), 1);

    await scrollToY(page, 1300);
    const past = await read<AnimRow>(page);
    expect(
      past.groupRects[0].bottom,
      `member 0 reads ${past.group[0].toFixed(3)} while still on screen`,
    ).toBeLessThanOrEqual(0);

    // Scrolling back into view is correct on the frame it becomes visible, which
    // is what keeps the difference off the screen.
    await scrollToY(page, 1100);
    const back = await read<AnimRow>(page);
    expect(back.group[0], 'did not recover on re-entering the range').toBeCloseTo(
      easeOut(linear(1000, 200, 1100)),
      1,
    );
  });

  test('seek() and destroy() reach every member', async ({ page }) => {
    await openFixture(page, 'animate-group.html');
    await scrollToY(page, 1300);

    await call(page, 'seekGroup', 0.25);
    const sought = await read<AnimRow>(page);
    for (const [i, v] of sought.group.entries()) {
      expect(v, `member ${i} ignored the group's seek()`).toBeCloseTo(0.25, 2);
    }

    // destroy() restores the inline styles it wrote — on all three, not one.
    await call(page, 'destroyGroup');
    const gone = await read<AnimRow>(page);
    expect(gone.groupInline, 'destroy() left inline styles on some members').toEqual(['', '', '']);
    for (const [i, v] of gone.group.entries()) {
      expect(v, `member ${i} was not restored by destroy()`).toBeCloseTo(1, 2);
    }
  });
});

test.describe('scrollAnimateSequence', () => {
  test('a card does not start until the previous one has completed', async ({ page }) => {
    await openFixture(page, 'animate-group.html');

    // Card 0's window is 1800 → 2800; card 1's is 2200 → 3200 and already open.
    await scrollToY(page, 2500);
    const mid = await read<AnimRow>(page);
    expect(mid.sequence[0]).toBeGreaterThan(0.4);
    expect(mid.sequence[0]).toBeLessThan(1);
    expect(mid.sequence[1], 'card 1 started before card 0 finished').toBeCloseTo(0, 2);
    expect(mid.sequence[2], 'card 2 started before card 0 finished').toBeCloseTo(0, 2);

    await scrollToY(page, 2900);
    const handoff = await read<AnimRow>(page);
    expect(handoff.sequence[0]).toBeCloseTo(1, 2);
    expect(handoff.sequence[1], 'card 1 never picked up the chain').toBeGreaterThan(0);
  });

  test('the whole chain completes, and reports itself complete afterwards', async ({ page }) => {
    await openFixture(page, 'animate-group.html');
    for (let y = 1800; y <= 3600; y += 100) await scrollToY(page, y);

    const done = await read<AnimRow>(page);
    expect(done.sequence, `chain did not finish: ${done.sequence.join(', ')}`).toEqual([
      expect.closeTo(1, 2),
      expect.closeTo(1, 2),
      expect.closeTo(1, 2),
    ]);
    expect(done.sequenceProgress, 'a finished sequence reports 0% progress').toBeCloseTo(1, 2);
  });
});

test.describe('scrollParallaxGroup', () => {
  /**
   * The contract jsdom could never check: each member travels
   * `speed x its own height`, so three boxes of different heights must move
   * different distances from the same scroll.
   */
  test('each member travels speed x its own height', async ({ page }) => {
    await openFixture(page, 'animate-group.html');

    const heights = [100, 200, 300];
    const y = 4300;
    await scrollToY(page, y);
    const row = await read<AnimRow>(page);

    const shown = `translateY: ${row.parallax.map((v) => v.toFixed(1)).join(', ')}`;
    for (const [i, h] of heights.entries()) {
      const alpha = linear(4200, h, y);
      expect(row.parallax[i], `member ${i} (${h}px tall) — ${shown}`).toBeCloseTo(
        -0.4 * h * alpha,
        0,
      );
    }

    // Moving at all, and in the documented direction (upward as you scroll down).
    expect(row.parallax[2], shown).toBeLessThan(-10);
  });

  test('destroy() stops every member', async ({ page }) => {
    await openFixture(page, 'animate-group.html');

    await scrollToY(page, 4300);
    const moved = await read<AnimRow>(page);
    expect(Math.min(...moved.parallax.map(Math.abs))).toBeGreaterThan(1);

    await call(page, 'destroyParallax');
    const restored = await read<AnimRow>(page);
    for (const [i, v] of restored.parallax.entries()) {
      expect(v, `member ${i} left displaced after destroy`).toBeCloseTo(0, 1);
    }
  });
});
