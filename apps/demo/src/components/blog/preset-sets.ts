import { PRESETS, type PresetName } from 'svg-scroll-draw';

/**
 * A preset's option bag as one line — "ease-out · speed 1.2 · fade · once" —
 * read from the library's own `PRESETS`, so the post can never list a value
 * the preset does not set.
 */
export function presetSets(name: PresetName): string {
  const o = PRESETS[name];
  const parts: string[] = [];
  if (o.easing) parts.push(String(o.easing));
  if (o.speed != null && o.speed !== 1) parts.push(`speed ${o.speed}`);
  if (o.stagger) parts.push(`stagger ${o.stagger}`);
  if (o.fade) parts.push('fade');
  if (o.once) parts.push('once');
  return parts.join(' · ');
}

/** The same bag as code: "easing: 'ease-out', fade: true, speed: 1.2, once: true". */
export function presetCode(name: PresetName): string {
  return Object.entries(PRESETS[name])
    .map(([k, v]) => `${k}: ${typeof v === 'string' ? `'${v}'` : String(v)}`)
    .join(', ');
}
