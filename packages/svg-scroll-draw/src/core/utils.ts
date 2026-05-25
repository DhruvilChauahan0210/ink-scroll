export const EASINGS: Record<string, (t: number) => number> = {
  linear: (t) => t,
  'ease-in': (t) => t * t,
  'ease-out': (t) => t * (2 - t),
  'ease-in-out': (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
};

export function parseTrigger(str = 'top bottom'): { element: string; viewport: string } {
  const parts = str.trim().split(/\s+/).filter(Boolean);
  const [element = 'top', viewport = 'bottom'] = parts;
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
  switch (anchor) {
    case 'top':    return 0;
    case 'center': return vpHeight / 2;
    case 'bottom': return vpHeight;
    default:       return vpHeight;
  }
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
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
