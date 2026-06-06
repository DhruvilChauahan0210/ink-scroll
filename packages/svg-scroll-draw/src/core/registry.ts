// Global instance registry — populated by engines, read by DevTools.
// Imported lazily so it adds zero bytes to bundles that don't need it.

export type InstanceType = 'draw' | 'animate' | 'counter' | 'video' | 'text' | 'pin' | 'snap';

export interface RegistryEntry {
  type: InstanceType;
  getProgress: () => number;
  getTrigger: () => { tStart: number; tEnd: number };
}

const _registry = new Map<Element, RegistryEntry>();

export function _register(el: Element, entry: RegistryEntry): void {
  _registry.set(el, entry);
}

export function _unregister(el: Element): void {
  _registry.delete(el);
}

export function _getRegistry(): ReadonlyMap<Element, RegistryEntry> {
  return _registry;
}
