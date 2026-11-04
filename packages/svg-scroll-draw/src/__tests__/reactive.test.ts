import { describe, it, expect, vi } from 'vitest';
import { optionsKey, liveFns } from '../core/reactive';

// The two helpers every framework wrapper uses to decide whether a changed
// option should rebuild the engine. Getting either wrong is invisible in a demo
// and expensive in an app: too eager and every render tears the animation
// down, too lax and a changed prop never lands.

describe('optionsKey', () => {
  it('is equal for equal options built as fresh objects', () => {
    const a = { speed: 1, trigger: { start: 'top 80%' } };
    const b = { speed: 1, trigger: { start: 'top 80%' } };
    expect(a).not.toBe(b);
    expect(optionsKey(a)).toBe(optionsKey(b));
  });

  it('changes when an option value changes', () => {
    expect(optionsKey({ speed: 1 })).not.toBe(optionsKey({ speed: 2 }));
    expect(optionsKey({ trigger: { start: 'top 80%' } })).not.toBe(
      optionsKey({ trigger: { start: 'top 60%' } }),
    );
  });

  it('counts a function as present or absent, never by identity', () => {
    const onProgress = () => {};
    expect(optionsKey({ onProgress })).toBe(optionsKey({ onProgress: () => {} }));
    expect(optionsKey({ onProgress })).not.toBe(optionsKey({}));
  });

  it('tells elements apart by identity, which JSON alone would flatten to {}', () => {
    const one = document.createElement('div');
    const two = document.createElement('div');
    expect(optionsKey({ scrollContainer: one })).toBe(optionsKey({ scrollContainer: one }));
    expect(optionsKey({ scrollContainer: one })).not.toBe(optionsKey({ scrollContainer: two }));
  });
});

describe('liveFns', () => {
  it('calls the latest function of the same name, with the arguments given', () => {
    const first = vi.fn();
    const second = vi.fn();
    let latest: { onProgress?: (p: number) => void } = { onProgress: first };
    const live = liveFns(latest, () => latest);

    live.onProgress!(0.25);
    latest = { onProgress: second };
    live.onProgress!(0.5);

    expect(first).toHaveBeenCalledWith(0.25);
    expect(second).toHaveBeenCalledWith(0.5);
    expect(first).toHaveBeenCalledTimes(1);
  });

  it('returns what the latest function returns', () => {
    const latest = { easing: (t: number) => t * t };
    expect(liveFns(latest, () => latest).easing(0.5)).toBe(0.25);
  });

  it('is a no-op once the latest options drop the function', () => {
    let latest: { onComplete?: () => void } = { onComplete: vi.fn() };
    const live = liveFns(latest, () => latest);
    latest = {};
    expect(() => live.onComplete!()).not.toThrow();
  });

  it('copies other values as they are, without touching the original', () => {
    const options = { speed: 2, trigger: { start: 'top' }, onStart: () => {} };
    const live = liveFns(options, () => options);
    expect(live).not.toBe(options);
    expect(live.speed).toBe(2);
    expect(live.trigger).toBe(options.trigger);
    expect(live.onStart).not.toBe(options.onStart);
  });
});
