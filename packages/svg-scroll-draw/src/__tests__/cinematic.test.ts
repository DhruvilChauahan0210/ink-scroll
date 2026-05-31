import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Cinematic } from '../cinematic';
import type { Story } from '../cinematic/story';

// ── fakes ──────────────────────────────────────────────────────────────────────

class FakeIO {
  static instances: FakeIO[] = [];
  cb: IntersectionObserverCallback;
  observe = vi.fn();
  disconnect = vi.fn();
  constructor(cb: IntersectionObserverCallback) {
    this.cb = cb;
    FakeIO.instances.push(this);
  }
  trigger(isIntersecting: boolean) {
    this.cb([{ isIntersecting } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
  }
}

/** A Studio-shaped story: a photo that fades in plus two traced draw paths. */
function makeStory(): Story {
  return {
    version: 1,
    totalHeight: '400vh',
    canvas: { width: 1200, height: 800 },
    scenes: [
      {
        id: 'scene-1',
        background: 'data:image/png;base64,AAAA',
        animations: [
          { type: 'fade', target: '#cinematic-photo', start: '45%', end: '70%', from: 0, to: 1 },
          { type: 'draw', target: '#path-a', d: 'M0 0 L100 0', length: 100, start: '10%', end: '40%', stroke: '#fff', strokeWidth: 3, easing: 'linear' },
          { type: 'draw', target: '#path-b', d: 'M0 0 L50 0', length: 50, start: '60%', end: '90%', stroke: '#0ff', strokeWidth: 2, easing: 'linear' },
        ],
      },
    ],
  };
}

/** Make the mount report a given scroll progress for computeProgress(). */
function stubScroll(mount: HTMLElement, top: number) {
  Object.defineProperty(mount, 'offsetHeight', { value: 1768, configurable: true });
  vi.spyOn(mount, 'getBoundingClientRect').mockReturnValue({
    top, height: 768, left: 0, width: 1000, right: 1000, bottom: top + 768, x: 0, y: top, toJSON: () => {},
  } as DOMRect);
}

let reduced = false;

beforeEach(() => {
  FakeIO.instances = [];
  reduced = false;
  vi.stubGlobal('IntersectionObserver', FakeIO);
  vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1));
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  Object.defineProperty(window, 'innerHeight', { value: 768, configurable: true });
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: reduced, media: query, addEventListener: vi.fn(), removeEventListener: vi.fn(),
  }));
});

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// ── tests ──────────────────────────────────────────────────────────────────────

describe('Cinematic', () => {
  it('warns and no-ops when the wrapper is missing', () => {
    const inst = new Cinematic({ wrapper: '#nope' }).loadStory(makeStory());
    expect(inst.getProgress()).toBe(0);
  });

  it('builds the sticky stage, photo, and traced paths from the story', () => {
    const mount = document.createElement('div');
    document.body.appendChild(mount);
    stubScroll(mount, 0);

    new Cinematic({ wrapper: mount }).loadStory(makeStory());

    expect(mount.style.height).toBe('400vh');
    const stage = mount.querySelector('[data-cinematic-stage]') as HTMLElement;
    expect(stage).toBeTruthy();
    expect(stage.style.position).toBe('sticky');

    const photo = stage.querySelector('#cinematic-photo') as HTMLImageElement;
    expect(photo).toBeTruthy();
    expect(photo.tagName).toBe('IMG');

    const svg = stage.querySelector('svg')!;
    expect(svg.getAttribute('viewBox')).toBe('0 0 1200 800');
    const paths = svg.querySelectorAll('path');
    expect(paths.length).toBe(2);
    expect(svg.querySelector('#path-a')).toBeTruthy();
    expect(svg.querySelector('#path-b')).toBeTruthy();

    // dasharray initialised to the measured length (undrawn until scrolled)
    const a = svg.querySelector('#path-a') as SVGPathElement;
    expect(a.style.strokeDasharray).toBe('100');
  });

  it('scrubs draw + fade to the right frame at 50% scroll', () => {
    const mount = document.createElement('div');
    document.body.appendChild(mount);
    // top = -500, scrollable = 1768 - 768 = 1000  →  progress = 0.5
    stubScroll(mount, -500);

    const inst = new Cinematic({ wrapper: mount }).loadStory(makeStory());
    expect(inst.getProgress()).toBeCloseTo(0.5, 5);

    const a = mount.querySelector('#path-a') as SVGPathElement; // 10%→40%: done at 0.5
    const b = mount.querySelector('#path-b') as SVGPathElement; // 60%→90%: not started at 0.5
    const photo = mount.querySelector('#cinematic-photo') as HTMLElement; // 45%→70%

    expect(Number(a.style.strokeDashoffset)).toBeCloseTo(0, 5); // fully drawn
    expect(Number(b.style.strokeDashoffset)).toBeCloseTo(50, 5); // undrawn (length 50)
    // photo: local = (0.5-0.45)/0.25 = 0.2, ease-in-out → 0.08
    expect(Number(photo.style.opacity)).toBeGreaterThan(0);
    expect(Number(photo.style.opacity)).toBeLessThan(0.2);
  });

  it('jumps to the finished frame under reduced motion (no rAF)', () => {
    reduced = true;
    const mount = document.createElement('div');
    document.body.appendChild(mount);
    stubScroll(mount, 0);

    const inst = new Cinematic({ wrapper: mount }).loadStory(makeStory());
    expect(inst.getProgress()).toBe(1);

    const a = mount.querySelector('#path-a') as SVGPathElement;
    const photo = mount.querySelector('#cinematic-photo') as HTMLElement;
    expect(Number(a.style.strokeDashoffset)).toBeCloseTo(0, 5); // fully drawn
    expect(Number(photo.style.opacity)).toBeCloseTo(1, 5); // fully visible
    // reduced-motion path never schedules a frame
    expect(requestAnimationFrame).not.toHaveBeenCalled();
  });

  it('observes the stage and disconnects on destroy', () => {
    const mount = document.createElement('div');
    document.body.appendChild(mount);
    stubScroll(mount, 0);

    const inst = new Cinematic({ wrapper: mount }).loadStory(makeStory());
    const io = FakeIO.instances.at(-1)!;
    expect(io.observe).toHaveBeenCalledOnce();

    // becoming visible starts the loop
    io.trigger(true);
    expect(requestAnimationFrame).toHaveBeenCalled();

    inst.destroy();
    expect(io.disconnect).toHaveBeenCalledOnce();
  });
});
