// Shared by the framework wrappers so a changed option rebuilds the engine.
//
// The engines read their options once. The wrappers used to as well, so a prop
// changed after mount (speed, easing, a trigger) did nothing. They now rebuild
// the engine when an option really changes — and only then: a component that
// re-renders with an equal inline `trigger={{ start: 'top 80%' }}` or a fresh
// `onProgress` arrow must not tear its animation down every render.

const ids = new WeakMap<object, number>();
let nextId = 0;

/**
 * A fingerprint of a wrapper's options: equal for equal values, so it changes
 * only when an option does. Functions count as present or absent, never by
 * identity (`liveFns` keeps calling the latest one). Elements, which JSON would
 * flatten to `{}`, are told apart by identity.
 */
export function optionsKey(options: object): string {
  return JSON.stringify(options, (_k, v: unknown) => {
    if (typeof v === 'function') return 'ƒ';
    if (typeof Element !== 'undefined' && v instanceof Element) {
      let id = ids.get(v);
      if (id === undefined) ids.set(v, (id = ++nextId));
      return `el#${id}`;
    }
    return v;
  });
}

/**
 * A copy of `options` whose top-level functions call through to the latest
 * options' function of the same name, so a callback or custom easing that
 * changes between renders takes effect without rebuilding the engine.
 */
export function liveFns<T extends object>(options: T, latest: () => T): T {
  const out = { ...options } as Record<string, unknown>;
  for (const k of Object.keys(out)) {
    if (typeof out[k] === 'function') {
      out[k] = (...args: unknown[]) =>
        (latest() as Record<string, ((...a: unknown[]) => unknown) | undefined>)[k]?.(...args);
    }
  }
  return out as T;
}
