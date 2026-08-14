import { test, expect } from '@playwright/test';
import { openFixture, collectErrors, scrollToY, read, call, table } from './helpers';

/**
 * `scrollText` in real browsers.
 *
 * Splitting text is the most destructive thing this library does — it throws away
 * the author's markup and rebuilds it out of spans. jsdom can check that spans
 * appear, but not the two things that decide whether that is acceptable: that the
 * rendered text is unchanged, and that assistive technology still reads the
 * sentence once rather than word-by-word or twice over. `split: 'lines'` in
 * particular depends on `offsetTop`, which is 0 for everything in jsdom, so the
 * line grouping has never been exercised against real layout at all.
 *
 * Fixture geometry (viewport 900x800): #words at document top 1200, so with the
 * default `top 85%` → `top 40%` window the animation runs from y=520 to y=880.
 */

type Unit = {
  text: string;
  ariaLabel: string | null;
  unitCount: number;
  allHidden: boolean;
  opacities: number[];
  firstY: number;
  height: number;
};

type Row = { scrollY: number; words: Unit; chars: Unit };

const MID = 700;
const DONE = 900;

test.describe('scrollText', () => {
  test('splitting preserves the rendered text exactly', async ({ page }) => {
    const errors = collectErrors(page);
    await openFixture(page, 'text.html');
    expect(errors).toEqual([]);

    expect(await call<{ wordsTop: number; viewport: number }>(page, 'geometry')).toEqual({
      wordsTop: 1200,
      viewport: 800,
    });

    const original = await call<{ wordsHTML: string; wordsText: string; charsText: string }>(
      page,
      'original',
    );
    const row = await read<Row>(page);

    // Not "contains" — exactly. A dropped space or a doubled word is precisely
    // the kind of damage a splitter does, and it is invisible in a screenshot.
    expect(row.words.text).toBe(original.wordsText);
    expect(row.chars.text).toBe(original.charsText);

    // 'Ship real browser tests' → 4 animated word units, plus a span per gap to
    // hold the spacing open (which the engine deliberately never animates).
    expect(row.words.unitCount).toBe(4);
    expect(row.words.spanCount).toBe(7);
    // 'Phase two' → 8 animated characters plus one space span.
    expect(row.chars.unitCount).toBe(8);
    expect(row.chars.spanCount).toBe(9);
  });

  test('keeps the sentence readable to assistive technology', async ({ page }) => {
    await openFixture(page, 'text.html');
    const original = await call<{ wordsText: string }>(page, 'original');
    const row = await read<Row>(page);

    // The element carries the whole sentence as its accessible name...
    expect(row.words.ariaLabel).toBe(original.wordsText);
    // ...and every generated span is hidden, so it is announced once, not twice.
    expect(row.words.allHidden, 'a split span was left visible to screen readers').toBe(true);
    expect(row.chars.allHidden).toBe(true);
  });

  test('units start hidden and animate in a stagger cascade', async ({ page }) => {
    await openFixture(page, 'text.html');

    const start = await read<Row>(page);
    for (const [i, o] of start.words.opacities.entries()) {
      expect(o, `word ${i} should start hidden`).toBeLessThanOrEqual(0.01);
    }
    // Default `from` is { opacity: 0, y: 24 }.
    expect(start.words.firstY).toBeCloseTo(24, 0);

    await scrollToY(page, MID);
    const mid = await read<Row>(page);
    const shown = table(mid.words.opacities.map((o, i) => ({ word: i, opacity: o })));

    // Earlier units must lead later ones, and the range must be partial —
    // all-zero or all-one would pass a naive monotonicity check vacuously.
    const first = mid.words.opacities[0];
    const last = mid.words.opacities[mid.words.opacities.length - 1];
    expect(first, `no cascade\n${shown}`).toBeGreaterThan(last);
    expect(first, `nothing animated\n${shown}`).toBeGreaterThan(0.05);
    expect(last, `everything already finished\n${shown}`).toBeLessThan(0.95);

    await scrollToY(page, DONE);
    const done = await read<Row>(page);
    for (const [i, o] of done.words.opacities.entries()) {
      expect(o, `word ${i} should finish visible`).toBeGreaterThanOrEqual(0.99);
    }
    expect(done.words.firstY).toBeCloseTo(0, 0);
  });

  test('does not re-split or reflow itself over time', async ({ page }) => {
    await openFixture(page, 'text.html');
    // Park mid-animation, where the rAF loop is running every frame.
    await scrollToY(page, MID);

    const samples = await call<
      { units: number; spans: number; height: number; text: string }[]
    >(page, 'stability', 30);

    const units = new Set(samples.map((s) => s.units));
    const spans = new Set(samples.map((s) => s.spans));
    const heights = new Set(samples.map((s) => s.height));
    const texts = new Set(samples.map((s) => s.text));

    expect(samples.length).toBe(30);
    expect(units, `unit count changed across frames: ${[...units].join(',')}`).toEqual(new Set([4]));
    // A re-split loop would grow the DOM every frame, so total spans matters too.
    expect(spans, `span count changed across frames: ${[...spans].join(',')}`).toEqual(new Set([7]));
    expect(heights, `height changed across frames: ${[...heights].join(',')}`).toEqual(
      new Set([40]),
    );
    expect(texts.size, 'text changed across frames').toBe(1);
  });

  test('reduced motion shows the finished text immediately', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openFixture(page, 'text.html');

    const row = await read<Row>(page);
    expect(row.scrollY).toBe(0);
    for (const [i, o] of row.words.opacities.entries()) {
      expect(o, `word ${i} should be visible without scrolling`).toBeCloseTo(1, 2);
    }
    expect(row.words.firstY).toBeCloseTo(0, 0);
    // Still labelled and still hidden from duplicate announcement.
    expect(row.words.allHidden).toBe(true);
  });

  test('destroy() restores the original markup exactly', async ({ page }) => {
    await openFixture(page, 'text.html');
    await scrollToY(page, MID); // destroy mid-animation, the awkward case

    const original = await call<{ wordsHTML: string; wordsText: string }>(page, 'original');
    const after = await call<{
      html: string;
      text: string;
      ariaLabel: string | null;
      spanCount: number;
      strongCount: number;
    }>(page, 'destroyText');

    expect(after.html, 'markup not restored byte-for-byte').toBe(original.wordsHTML);
    expect(after.text).toBe(original.wordsText);
    expect(after.spanCount, 'split spans left behind').toBe(0);
    // The nested element the splitter flattened has to come back.
    expect(after.strongCount, '<strong> not restored').toBe(1);
    // aria-label was added by the library, so it must not outlive it.
    expect(after.ariaLabel).toBeNull();
  });
});

/**
 * `split: 'lines'`, which nothing covered until now.
 *
 * It is the only mode whose units depend on layout — it splits into words, reads
 * each word's `offsetTop`, and regroups them per visual line. In jsdom every
 * `offsetTop` is 0, so there is exactly one line and nothing to get wrong; the
 * regrouping only has real work to do in a browser.
 *
 * It moved the word spans into their line span and left behind the whitespace
 * spans that `splitIntoWords` emits to hold the gaps open, then cleared the
 * element — so every space inside a line was discarded and
 * "Every word here…" rendered as "Everywordhere…".
 */
test.describe('scrollText — split: lines', () => {
  type LinesReport = {
    text: string;
    originalText: string;
    lineSpans: number;
    ariaLabel: string | null;
    height: number;
    progress: number;
  };

  test('the fixture really wraps onto more than one line', async ({ page }) => {
    await openFixture(page, 'text.html');
    const r = await call<LinesReport>(page, 'linesReport');
    expect(
      r.lineSpans,
      'the paragraph fits on one line, so the grouping is never exercised',
    ).toBeGreaterThan(1);
  });

  test('preserves the spaces between words on a line', async ({ page }) => {
    await openFixture(page, 'text.html');
    const r = await call<LinesReport>(page, 'linesReport');

    expect(r.text, `split: 'lines' changed the rendered text`).toBe(r.originalText);
    expect(r.ariaLabel, 'the accessible name was not set from the original text').toBe(
      r.originalText,
    );
  });

  test('destroy() puts the paragraph back', async ({ page }) => {
    await openFixture(page, 'text.html');
    const before = await call<LinesReport>(page, 'linesReport');

    const after = await call<{ text: string; html: string }>(page, 'destroyLines');
    expect(after.text).toBe(before.originalText);
    expect(after.html, 'spans were left behind').not.toContain('<span');
  });
});
