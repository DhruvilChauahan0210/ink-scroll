import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import Vivus from '../vivus';

/*
 * The real-browser parity spec (e2e/vivus.spec.ts) holds the SVG markup and
 * frame maths to vivus 0.4.6 exactly. These cover the API around them in jsdom:
 * validation, the shape-to-path strings, the frame loop, callbacks and
 * lifecycle, with getTotalLength stubbed.
 */

class RafQueue {
  queue: Array<[number, FrameRequestCallback]> = [];
  id = 0;
  schedule = vi.fn((cb: FrameRequestCallback) => { this.queue.push([++this.id, cb]); return this.id; });
  cancel = vi.fn((id: number) => { this.queue = this.queue.filter(([i]) => i !== id); });
  tick() { const next = this.queue.shift(); next?.[1](performance.now()); }
  run(max = 1000) { for (let i = 0; i < max && this.queue.length; i++) this.tick(); }
}

let raf: RafQueue;

beforeAll(() => {
  (SVGElement.prototype as unknown as { getTotalLength: () => number }).getTotalLength = () => 99.2;
});

beforeEach(() => {
  raf = new RafQueue();
  vi.stubGlobal('requestAnimationFrame', raf.schedule);
  vi.stubGlobal('cancelAnimationFrame', raf.cancel);
  document.body.innerHTML = `<svg id="s" viewBox="0 0 200 200">
    <path d="M0 0 L100 0"/><path d="M0 10 L100 10"/><path d="M0 20 L100 20" data-ignore="true"/>
  </svg>`;
});

afterEach(() => vi.unstubAllGlobals());

const paths = () => Array.from(document.querySelectorAll('#s path')) as SVGPathElement[];

describe('vivus drop-in: construction', () => {
  it('rejects what vivus rejects, with the same messages', () => {
    expect(() => new Vivus(undefined as unknown as string)).toThrow('"element" parameter is required');
    expect(() => new Vivus('nope')).toThrow('not related to an existing ID');
    expect(() => new Vivus(document.body)).toThrow('"element" parameter is not valid');
    expect(() => new Vivus('s', { type: 'wiggle' as never })).toThrow('wiggle is not an existing animation `type`');
    expect(() => new Vivus('s', { start: 'later' as never })).toThrow('later is not an existing `start` option');
    expect(() => new Vivus('s', { duration: 50, delay: 50 })).toThrow('delay must be shorter than duration');
    expect(() => new Vivus('s', [] as never)).toThrow('"options" parameter must be an object');
    expect(() => new Vivus('s', {}, 'cb' as never)).toThrow('"callback" parameter must be a function');
  });

  it('takes an id, an <svg> or a <g>', () => {
    const svg = document.getElementById('s')!;
    expect(new Vivus('s', { start: 'manual' }).el).toBe(svg);
    expect(new Vivus(svg, { start: 'manual' }).el).toBe(svg);
  });

  it('measures paths, skips data-ignore, and sets vivus dashes', () => {
    const v = new Vivus('s', { start: 'manual' });
    expect(v.map).toHaveLength(2);
    const [p] = paths();
    // ceil(99.2) = 100, then dasharray "100 102", dashoffset 100 + dashGap 1.
    expect(p.style.strokeDasharray).toBe('100 102');
    expect(p.style.strokeDashoffset).toBe('101');
    expect(paths()[2].style.strokeDasharray).toBe('');
    // delayed: delay = 120 / 3 = 40, spread over all three <path>s → 20 per step.
    expect(v.delayUnit).toBe(20);
    expect(v.map.map((m) => m.startAt)).toEqual([0, 20]);
    expect(v.frameLength).toBe(120);
  });

  it('calls onReady once ready', () => {
    const onReady = vi.fn();
    const v = new Vivus('s', { start: 'manual', onReady });
    expect(onReady).toHaveBeenCalledWith(v);
  });
});

describe('vivus drop-in: shapes become paths', () => {
  it('writes the same d strings as vivus', () => {
    document.body.innerHTML = `<svg id="s">
      <line x1="1" y1="2" x2="3" y2="4"/>
      <rect x="1" y="2" width="10" height="20"/>
      <rect x="0" y="0" width="40" height="20" rx="5" class="keep"/>
      <circle cx="10" cy="10" r="5"/>
      <ellipse cx="10" cy="10" rx="8" ry="4"/>
      <polyline points="1 2 3 4 5 6"/>
      <polygon points="1,2 3,4 5,6"/>
    </svg>`;
    new Vivus('s', { start: 'manual' });
    const ds = paths().map((p) => p.getAttribute('d'));
    expect(ds).toEqual([
      'M1,2L3,4',
      'M1 2 L11 2 L11 22 L1 22 Z',
      'M 5,0 L 35,0 A 5,5,0,0,1,40,5 L 40,15 A 5,5,0,0,1,35,20 L 5,20 A 5,5,0,0,1,0,15 L 0,5 A 5,5,0,0,1,5,0',
      'M5,10A5,5 0,1,1 15,10A5,5 0,1,1 5,10',
      'M2,10A8,4 0,1,1 18,10A8,4 0,1,1 2,10',
      'M1,2L3,4L5,6',
      'M1,2L3,4L5,6Z',
    ]);
    // Non-geometry attributes carry over; geometry ones do not.
    const rounded = document.querySelector('.keep')!;
    expect(rounded.tagName.toLowerCase()).toBe('path');
    expect(rounded.hasAttribute('rx')).toBe(false);
    expect(rounded.getAttribute('width')).toBe('40');
  });

  it('refuses percentage geometry, as vivus does', () => {
    document.body.innerHTML = '<svg id="s"><circle cx="50%" cy="10" r="5"/></svg>';
    expect(() => new Vivus('s', { start: 'manual' })).toThrow('values in percentage');
  });
});

describe('vivus drop-in: playing', () => {
  it('advances one frame per animation frame and calls back at the end', () => {
    const done = vi.fn();
    const v = new Vivus('s', { start: 'manual', duration: 10, delay: 2 }, done);
    v.play();
    expect(v.currentFrame).toBe(1); // play() draws its first frame immediately
    expect(v.getStatus()).toBe('progress');
    raf.run();
    expect(v.getStatus()).toBe('end');
    expect(v.currentFrame).toBe(10);
    expect(done).toHaveBeenCalledTimes(1);
    expect(paths()[0].style.strokeDashoffset).toBe('0');
  });

  it('play(speed, cb), play(cb) and negative speeds', () => {
    const v = new Vivus('s', { start: 'manual', duration: 10, delay: 2 });
    const first = vi.fn();
    v.play(5, first);
    raf.run();
    expect(first).toHaveBeenCalledTimes(1);
    const back = vi.fn();
    v.play(-5, back);
    raf.run();
    expect(v.getStatus()).toBe('start');
    expect(back).toHaveBeenCalledTimes(1);
    const only = vi.fn();
    v.play(only);
    raf.run();
    expect(only).toHaveBeenCalledTimes(1);
    expect(() => v.play('fast' as never)).toThrow('invalid speed');
  });

  it('stop() pauses mid-way; finish(), reset() and setFrameProgress() jump', () => {
    const v = new Vivus('s', { start: 'manual', duration: 10, delay: 2 });
    v.play();
    raf.tick();
    v.stop();
    raf.run();
    expect(v.currentFrame).toBe(2);
    v.finish();
    expect(v.getStatus()).toBe('end');
    v.reset();
    expect(v.getStatus()).toBe('start');
    v.setFrameProgress(0.5);
    expect(v.currentFrame).toBe(5);
  });

  it('autostart plays at once; selfDestroy removes the dashes at the end', () => {
    const v = new Vivus('s', { start: 'autostart', duration: 6, delay: 2, selfDestroy: true });
    expect(v.getStatus()).toBe('progress');
    raf.run();
    expect(paths()[0].style.strokeDasharray).toBe('');
    expect(paths()[0].style.strokeDashoffset).toBe('');
  });

  it("inViewport waits for the element's full height to be in view", () => {
    const svg = document.getElementById('s')!;
    let top = 1000;
    vi.spyOn(svg, 'getBoundingClientRect').mockImplementation(() => ({ top, height: 200 }) as DOMRect);
    vi.stubGlobal('innerHeight', 800);
    const v = new Vivus('s', { duration: 6, delay: 2 });
    expect(v.getStatus()).toBe('start');
    top = 700; // bottom at 900: not all of it is in view
    window.dispatchEvent(new Event('scroll'));
    expect(v.getStatus()).toBe('start');
    top = 600;
    window.dispatchEvent(new Event('scroll'));
    expect(v.getStatus()).toBe('progress');
  });

  it('reduced motion: play() goes straight to the end and still calls back', () => {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('reduce'), addEventListener() {}, removeEventListener() {} }));
    const done = vi.fn();
    const v = new Vivus('s', { start: 'manual', type: 'scenario' }, done);
    v.play();
    expect(v.getStatus()).toBe('end');
    expect(done).toHaveBeenCalledTimes(1);
    expect(raf.schedule).not.toHaveBeenCalled();
  });

  it('exposes vivus’s timing functions', () => {
    expect(Vivus.LINEAR(0.3)).toBe(0.3);
    expect(Vivus.EASE(0.5)).toBeCloseTo(0.5);
    expect(Vivus.EASE_IN(0.5)).toBe(0.125);
    expect(Vivus.EASE_OUT(0.5)).toBe(0.875);
    expect(Vivus.EASE_OUT_BOUNCE(1)).toBeCloseTo(1);
  });
});
