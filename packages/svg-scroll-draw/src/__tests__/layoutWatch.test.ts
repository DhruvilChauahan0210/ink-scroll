import { describe, it, expect, vi, afterEach } from 'vitest';
import { watchLayout } from '../core/layout-watch';

/**
 * The one ResizeObserver every engine shares to hear about layout changes that
 * fire no window resize. jsdom has no ResizeObserver, so each test installs a
 * fake that records what is observed and lets the test report a resize.
 */

class FakeRO {
  static last: FakeRO | undefined;
  static made = 0;
  observed = new Set<Element>();
  disconnected = false;
  constructor(private cb: ResizeObserverCallback) { FakeRO.last = this; FakeRO.made++; }
  observe = (t: Element) => { this.observed.add(t); };
  unobserve = (t: Element) => { this.observed.delete(t); };
  disconnect = () => { this.disconnected = true; this.observed.clear(); };
  report(...targets: Element[]) {
    this.cb(targets.map((target) => ({ target }) as ResizeObserverEntry), this as unknown as ResizeObserver);
  }
}

const stops: Array<() => void> = [];
function watch(targets: Element[], fn: () => void): () => void {
  const stop = watchLayout(targets, fn);
  stops.push(stop);
  return stop;
}

function box(): HTMLElement {
  const el = document.createElement('div');
  document.body.appendChild(el);
  return el;
}

afterEach(() => {
  stops.splice(0).forEach((stop) => stop());
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

describe('watchLayout', () => {
  it('does nothing where ResizeObserver does not exist', () => {
    vi.stubGlobal('ResizeObserver', undefined);
    const stop = watch([box()], vi.fn());
    expect(() => stop()).not.toThrow();
  });

  it('observes the page and each engine’s elements with one observer', () => {
    vi.stubGlobal('ResizeObserver', FakeRO);
    const made = FakeRO.made;
    const a = box();
    const b = box();
    watch([a], vi.fn());
    watch([b], vi.fn());
    expect(FakeRO.made).toBe(made + 1);
    expect([...FakeRO.last!.observed]).toEqual(expect.arrayContaining([document.body, document.documentElement, a, b]));
  });

  it('skips the report every target gets when it is first observed', () => {
    vi.stubGlobal('ResizeObserver', FakeRO);
    const a = box();
    const fn = vi.fn();
    watch([a], fn);
    FakeRO.last!.report(document.body, document.documentElement, a);
    expect(fn).not.toHaveBeenCalled();
    FakeRO.last!.report(a);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('any change reaches every engine; each one decides whether it moved', () => {
    vi.stubGlobal('ResizeObserver', FakeRO);
    const a = box();
    const b = box();
    const onA = vi.fn();
    const onB = vi.fn();
    watch([a], onA);
    watch([b], onB);
    const ro = FakeRO.last!;
    ro.report(document.body, document.documentElement, a, b); // first reports
    onA.mockClear(); // body was seen by an earlier test: the page is one page
    onB.mockClear();

    ro.report(a);
    expect(onA).toHaveBeenCalledTimes(1);
    expect(onB).toHaveBeenCalledTimes(1);

    ro.report(document.body);
    expect(onA).toHaveBeenCalledTimes(2);
    expect(onB).toHaveBeenCalledTimes(2);
  });

  it('stopping one engine unobserves its elements and keeps watching the page', () => {
    vi.stubGlobal('ResizeObserver', FakeRO);
    watch([box()], vi.fn()); // the survivor comes first, so nothing of it sits below a
    const a = box();
    const stop1 = watch([a], vi.fn());
    const ro = FakeRO.last!;
    stop1();
    stop1(); // twice is harmless
    expect(ro.observed.has(a)).toBe(false);
    expect(ro.observed.has(document.body)).toBe(true);
    expect(ro.disconnected).toBe(false);
  });

  it('watches the boxes above an element: its previous siblings and its ancestors\u2019', () => {
    vi.stubGlobal('ResizeObserver', FakeRO);
    const section = box();
    const hero = document.createElement('img');
    const target = document.createElement('div');
    section.append(hero, target);
    const before = box();
    document.body.insertBefore(before, section);
    watch([target], vi.fn());
    const seen = FakeRO.last!.observed;
    // A late image above the target, inside a container whose own box keeps its
    // size, changes neither body nor the target: only the image reports it.
    expect(seen.has(hero)).toBe(true);
    expect(seen.has(before)).toBe(true);
    expect(seen.has(section)).toBe(true);
  });

  it('never unobserves the page because one engine watched it as its own element', () => {
    vi.stubGlobal('ResizeObserver', FakeRO);
    const stop = watch([document.body], vi.fn());
    watch([box()], vi.fn());
    stop();
    expect(FakeRO.last!.observed.has(document.body)).toBe(true);
  });

  it('lets the observer go when nothing is left, and makes a new one when needed', () => {
    vi.stubGlobal('ResizeObserver', FakeRO);
    const stop = watch([box()], vi.fn());
    const first = FakeRO.last!;
    stop();
    expect(first.disconnected).toBe(true);

    const made = FakeRO.made;
    const a = box();
    const fn = vi.fn();
    watch([a], fn);
    expect(FakeRO.made).toBe(made + 1);
    // A target observed again is reported once again on observe; still skipped.
    FakeRO.last!.report(a);
    expect(fn).not.toHaveBeenCalled();
  });
});
