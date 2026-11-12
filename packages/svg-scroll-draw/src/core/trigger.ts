import { clamp } from './math';

// ── Trigger parsing ───────────────────────────────────────────────────────────

export function parseTrigger(str = 'top bottom'): { element: string; viewport: string } {
  const trimmed = str.trim();
  if (/^\d+(\.\d+)?%$/.test(trimmed)) return { element: 'top', viewport: trimmed };
  const [element = 'top', viewport = 'bottom'] = trimmed.split(/\s+/).filter(Boolean);
  return { element, viewport };
}

/**
 * How far down its box a named anchor sits, as a fraction: `top` 0, `center`
 * 0.5, `bottom` 1, anything else `other`. A size times 0.5 is exactly the size
 * over 2, so these are the values the switch statements here used to return.
 */
const anchorAt = (anchor: string, other: number): number =>
  anchor === 'top' ? 0 : anchor === 'center' ? 0.5 : anchor === 'bottom' ? 1 : other;

export function elementAnchorY(top: number, height: number, scrollY: number, anchor: string): number {
  return top + scrollY + height * anchorAt(anchor, 0);
}

export function viewportAnchorY(anchor: string, vpHeight: number): number {
  return vpHeight * (/^\d+(\.\d+)?%$/.test(anchor) ? parseFloat(anchor) / 100 : anchorAt(anchor, 1));
}

export function computeProgress(
  scrollY: number,
  tStart: number,
  tEnd: number,
  speed: number
): number {
  if (tEnd === tStart) return 0;
  return clamp(((scrollY - tStart) / (tEnd - tStart)) * speed, 0, 1);
}

// measureTriggerFrame, the other half of this arithmetic, is in ./trigger-frame.

export function computeTriggers(
  rect: { top: number; height: number },
  scrollY: number,
  vpHeight: number,
  startConfig: { element: string; viewport: string },
  endConfig: { element: string; viewport: string }
): { tStart: number; tEnd: number } {
  const tStart =
    elementAnchorY(rect.top, rect.height, scrollY, startConfig.element) -
    viewportAnchorY(startConfig.viewport, vpHeight);
  const tEnd =
    elementAnchorY(rect.top, rect.height, scrollY, endConfig.element) -
    viewportAnchorY(endConfig.viewport, vpHeight);
  return { tStart, tEnd };
}
