/**
 * `svg-scroll-draw/write`: writePaths (the layout, pure), penTimes (the pen's
 * timing) and scrollWrite (the element, the frames, reduced motion, destroy).
 *
 * jsdom has no geometry: every stroke measures 100 here, which is all the
 * offsets below need. Real lengths, real scrolling and the order strokes
 * appear on screen are in e2e/write.spec.ts; no DOM at all in ssr.test.ts.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { scrollWrite, writePaths, penTimes } from '../write';

class RafQueue {
  private queue: { id: number; cb: FrameRequestCallback }[] = [];
  private id = 0;
  schedule = vi.fn((cb: FrameRequestCallback): number => { this.queue.push({ id: ++this.id, cb }); return this.id; });
  cancel = vi.fn((id: number) => { this.queue = this.queue.filter((f) => f.id !== id); });
  tick() { const frame = this.queue; this.queue = []; for (const f of frame) f.cb(performance.now()); }
}

/** Scroll the page as a browser does: the offset, then a scroll event, then a frame. */
function scroll(y: number): void {
  vi.stubGlobal('scrollY', y);
  window.dispatchEvent(new Event('scroll'));
  raf.tick();
}

let raf: RafQueue;
let reduce = false;

/** The line's top is at 1000: the window runs from scroll 320 (top 85% of 800) to 720 (top 35%). */
beforeEach(() => {
  reduce = false;
  raf = new RafQueue();
  vi.stubGlobal('requestAnimationFrame', raf.schedule);
  vi.stubGlobal('cancelAnimationFrame', raf.cancel);
  vi.stubGlobal('matchMedia', () => ({ matches: reduce, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
    top: 1000, height: 60, left: 0, width: 400, right: 400, bottom: 1060, x: 0, y: 1000, toJSON: () => ({}),
  });
  (SVGElement.prototype as unknown as { getTotalLength: () => number }).getTotalLength = () => 100;
  vi.stubGlobal('scrollY', 0);
  vi.stubGlobal('innerHeight', 800);
});

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function heading(text = 'Hello'): HTMLHeadingElement {
  const el = document.createElement('h2');
  el.innerHTML = text;
  document.body.appendChild(el);
  return el;
}

const offsets = (el: Element) =>
  Array.from(el.querySelectorAll('path')).map((p) => parseFloat(p.style.strokeDashoffset));

describe('writePaths', () => {
  it('sets every stroke in writing order, letter by letter, on a one-em line', () => {
    const laid = writePaths('Hi you', { size: 64 });
    expect(laid.text).toBe('Hi you');
    expect(laid.height).toBe(64);
    // Hershey's baseline is 9 units below the em's middle: (9 + 16) / 32.
    expect(laid.baseline).toBe(50);
    expect(laid.width).toBeGreaterThan(0);
    const letters = laid.strokes.map((s) => s.letter);
    expect(letters).toEqual([...letters].sort((a, b) => a - b));
    // H i y o u: five letters, two words; the space draws nothing.
    expect(new Set(letters).size).toBe(5);
    expect(laid.strokes.at(-1)!.word).toBe(1);
    for (const s of laid.strokes) {
      expect(s.d).toMatch(/^M[\d.-]+ [\d.-]+/);
      expect(s.length).toBeGreaterThan(0);
    }
  });

  it('scales with size', () => {
    const a = writePaths('Ada', { size: 32 });
    const b = writePaths('Ada', { size: 64 });
    expect(b.width).toBeCloseTo(a.width * 2, 6);
    b.strokes.forEach((s, i) => expect(s.length).toBeCloseTo(a.strokes[i].length * 2, 6));
  });

  it('straightens typography, drops accents, collapses whitespace and lists what it cannot set', () => {
    const laid = writePaths('Café “ok” —\n\tdone ✓');
    expect(laid.text).toBe('Cafe "ok" - done ');
    expect(laid.missing).toEqual(['✓']);
  });

  it('roman is upright print and italic slants it to the right above the baseline', () => {
    const roman = writePaths('l', { font: 'roman', size: 32 });
    const italic = writePaths('l', { font: 'italic', size: 32 });
    const script = writePaths('l', { font: 'script', size: 32 });
    expect(italic.strokes.length).toBe(roman.strokes.length);
    expect(italic.strokes[0].d).not.toBe(roman.strokes[0].d);
    expect(script.strokes[0].d).not.toBe(roman.strokes[0].d);
    // An upright stroke: its top and its foot share an x in roman, not in italic.
    const xs = (d: string) => [...d.matchAll(/[ML]([\d.-]+) /g)].map((m) => +m[1]);
    const [r0, r1] = xs(roman.strokes[0].d);
    const [i0, i1] = xs(italic.strokes[0].d);
    expect(r0).toBe(r1);
    expect(i0).toBeGreaterThan(i1);
  });

  it('an empty text sets nothing', () => {
    expect(writePaths('').strokes).toEqual([]);
    expect(writePaths('   ').width).toBeGreaterThan(0);
  });
});

describe('penTimes', () => {
  const s = (length: number, letter: number, word: number) => ({ d: '', length, letter, word });

  it('gives each stroke a slice in proportion to its length, one after another', () => {
    const t = penTimes([s(10, 0, 0), s(30, 0, 0)], 10, 0, 0);
    expect(t).toEqual([[0, 0.25], [0.25, 1]]);
  });

  it('lifts the pen between letters, and longer at a space', () => {
    // 1 em of ink each, a 0.5 em lift between letters and 2 at the space.
    const t = penTimes([s(10, 0, 0), s(10, 1, 0), s(10, 2, 1)], 10, 0.5, 2);
    // 0..1, lift 0.5, 1.5..2.5, lift 2, 4.5..5.5: over 5.5.
    const at = t.map(([a, b]) => [a * 5.5, b * 5.5].map((n) => Math.round(n * 1000) / 1000));
    expect(at).toEqual([[0, 1], [1.5, 2.5], [4.5, 5.5]]);
  });

  it('nothing to write is a run of nothing', () => {
    expect(penTimes([], 10, 1, 1)).toEqual([]);
  });
});

describe('scrollWrite', () => {
  it('without the element it warns and does nothing', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const inst = scrollWrite('#missing');
    expect(inst.getProgress()).toBe(0);
    expect(() => inst.destroy()).not.toThrow();
    warnSpy.mockRestore();
  });

  it("writes the element's own text as an <svg> hidden from screen readers, with a readable copy", () => {
    const el = heading('Hello  <em>there</em>');
    scrollWrite(el, { size: 48 });
    const svg = el.querySelector('svg')!;
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.getAttribute('height')).toBe('48');
    expect(svg.getAttribute('stroke')).toBe('currentColor');
    expect(svg.querySelectorAll('path').length).toBe(writePaths('Hello there', { size: 48 }).strokes.length);
    const copy = el.querySelector('span')!;
    expect(copy.textContent).toBe('Hello there');
    expect(copy.style.position).toBe('absolute');
  });

  it('text, color and strokeWidth options', () => {
    const el = heading('ignored');
    scrollWrite(el, { text: 'Hi', size: 56, color: '#c00', strokeWidth: 3 });
    const svg = el.querySelector('svg')!;
    expect(svg.getAttribute('stroke')).toBe('#c00');
    expect(svg.getAttribute('stroke-width')).toBe('3');
    expect(el.querySelector('span')!.textContent).toBe('Hi');
    // size / 28 when not given.
    const el2 = heading('Hi');
    scrollWrite(el2, { size: 56 });
    expect(el2.querySelector('svg')!.getAttribute('stroke-width')).toBe('2');
  });

  it('writes one stroke at a time in order as the page scrolls, and unwrites on the way back', () => {
    const el = heading('Hello');
    const done = vi.fn();
    scrollWrite(el, { onComplete: done });
    raf.tick();
    const n = el.querySelectorAll('path').length;
    expect(offsets(el)).toEqual(Array(n).fill(100));
    for (const y of [400, 520, 640]) {
      scroll(y);
      const o = offsets(el);
      // Written strokes, then at most one under the pen, then unwritten ones.
      const first = o.findIndex((v) => v > 0);
      expect(o.slice(0, first).every((v) => v === 0)).toBe(true);
      expect(o.slice(first + 1).every((v) => v === 100)).toBe(true);
    }
    expect(done).not.toHaveBeenCalled();
    scroll(720);
    expect(offsets(el)).toEqual(Array(n).fill(0));
    expect(done).toHaveBeenCalledTimes(1);
    scroll(0);
    expect(offsets(el)).toEqual(Array(n).fill(100));
  });

  it('with once it stays written', () => {
    const el = heading('Hi');
    const inst = scrollWrite(el, { once: true });
    scroll(800);
    expect(inst.getProgress()).toBe(1);
    scroll(0);
    expect(inst.getProgress()).toBe(1);
    expect(offsets(el).every((v) => v === 0)).toBe(true);
  });

  it('a custom trigger moves the window', () => {
    const el = heading('Hi');
    const inst = scrollWrite(el, { trigger: { start: 'top bottom', end: 'top top' } });
    // From 1000 - 800 = 200 to 1000: 600 is half way.
    scroll(600);
    expect(inst.getProgress()).toBeCloseTo(0.5, 5);
  });

  it('seek, pause, resume and replay', () => {
    const el = heading('Hello');
    const inst = scrollWrite(el);
    inst.seek(1);
    expect(offsets(el).every((v) => v === 0)).toBe(true);
    scroll(320);
    expect(inst.getProgress()).toBe(1);
    inst.resume();
    raf.tick();
    expect(inst.getProgress()).toBe(0);
    inst.pause();
    scroll(720);
    expect(inst.getProgress()).toBe(0);
    inst.replay();
    raf.tick();
    expect(inst.getProgress()).toBe(1);
  });

  it('progressVar: written on the <svg> by default, not with false', () => {
    const a = heading('Hi');
    scrollWrite(a);
    scroll(520);
    expect(a.querySelector('svg')!.style.getPropertyValue('--scroll-draw-progress')).toBe('0.5');
    const b = heading('Hi');
    scrollWrite(b, { progressVar: false });
    scroll(520);
    expect(b.querySelector('svg')!.style.getPropertyValue('--scroll-draw-progress')).toBe('');
  });

  it('destroy() puts the content back exactly', () => {
    const el = heading('Sign <b>here</b>');
    const before = el.innerHTML;
    const inst = scrollWrite(el);
    scroll(500);
    inst.destroy();
    expect(el.innerHTML).toBe(before);
  });

  it('under reduced motion the text is written at once', () => {
    reduce = true;
    const el = heading('Hello');
    const done = vi.fn();
    const inst = scrollWrite(el, { onComplete: done });
    raf.tick();
    expect(inst.getProgress()).toBe(1);
    expect(done).toHaveBeenCalledTimes(1);
    el.querySelectorAll('path').forEach((p) => expect(p.style.strokeDasharray).toBe(''));
    inst.destroy();
    expect(el.innerHTML).toBe('Hello');
  });

  it('warns about characters it cannot write', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    scrollWrite(heading('ok ✓'));
    expect(warnSpy.mock.calls.flat().join(' ')).toContain('✓');
    warnSpy.mockRestore();
  });
});
