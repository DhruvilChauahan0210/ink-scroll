import { clamp } from './math';

// ── Trigger parsing ───────────────────────────────────────────────────────────

export function parseTrigger(str = 'top bottom'): { element: string; viewport: string } {
  const trimmed = str.trim();
  if (/^\d+(\.\d+)?%$/.test(trimmed)) return { element: 'top', viewport: trimmed };
  const [element = 'top', viewport = 'bottom'] = trimmed.split(/\s+/).filter(Boolean);
  return { element, viewport };
}

export function elementAnchorY(top: number, height: number, scrollY: number, anchor: string): number {
  switch (anchor) {
    case 'top':    return top + scrollY;
    case 'center': return top + scrollY + height / 2;
    case 'bottom': return top + scrollY + height;
    default:       return top + scrollY;
  }
}

export function viewportAnchorY(anchor: string, vpHeight: number): number {
  if (/^\d+(\.\d+)?%$/.test(anchor)) return vpHeight * (parseFloat(anchor) / 100);
  switch (anchor) {
    case 'top':    return 0;
    case 'center': return vpHeight / 2;
    case 'bottom': return vpHeight;
    default:       return vpHeight;
  }
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
