// Global instance registry — populated by engines, read by DevTools.
//
// Shared through `globalThis`, not a module-local variable. Every built entry
// point (`svg-scroll-draw`, `/devtools`, `/group`, …) is bundled on its own and
// inlines its own copy of this file, so a module-local Map meant instances
// created through the main entry registered into one Map while
// `svg-scroll-draw/devtools` read another, and `devtools.enable()` reported
// "No active instances" on a page full of them. `Symbol.for` returns the same
// symbol from every copy — and from every version of the library on the page —
// so they all land in one Map.

export type InstanceType = 'draw' | 'animate' | 'counter' | 'video' | 'frames' | 'text' | 'pin' | 'snap';

export interface RegistryEntry {
  type: InstanceType;
  getProgress: () => number;
  getTrigger: () => { tStart: number; tEnd: number };
}

const KEY = Symbol.for('svg-scroll-draw.registry');

/**
 * The one Map every bundled copy of this module shares, created on first use.
 * Nothing runs at import time, and `globalThis` exists in every runtime (Node
 * included) without touching `window` or `document`, so this is SSR-safe.
 */
function registry(): Map<Element, RegistryEntry> {
  const g = globalThis as unknown as Record<symbol, Map<Element, RegistryEntry> | undefined>;
  return g[KEY] || (g[KEY] = new Map());
}

export function _register(el: Element, entry: RegistryEntry): void {
  registry().set(el, entry);
}

export function _unregister(el: Element): void {
  registry().delete(el);
}

export function _getRegistry(): ReadonlyMap<Element, RegistryEntry> {
  return registry();
}
