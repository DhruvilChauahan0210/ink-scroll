export const EASINGS: Record<string, (t: number) => number> = {
  linear:        (t) => t,
  'ease-in':     (t) => t * t,
  'ease-out':    (t) => t * (2 - t),
  'ease-in-out': (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  spring:        (t) => 1 - Math.cos(t * Math.PI * 2.5) * Math.pow(1 - t, 2.2),
};

/**
 * Returns a custom spring easing function.
 * - `tension` controls oscillation frequency (default 2.5 — higher = more bouncy)
 * - `friction` controls damping (default 2.2 — higher = less bouncy)
 *
 * @example
 * scrollDraw('#svg', { easing: createSpring({ tension: 3, friction: 1.8 }) });
 */
export function createSpring({
  tension = 2.5,
  friction = 2.2,
}: { tension?: number; friction?: number } = {}): (t: number) => number {
  return (t: number) => 1 - Math.cos(t * Math.PI * tension) * Math.pow(1 - t, friction);
}

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

export function getElementLength(el: SVGElement): number {
  const tag = el.tagName.toLowerCase();
  if (tag === 'rect') {
    const w = parseFloat(el.getAttribute('width') ?? '0');
    const h = parseFloat(el.getAttribute('height') ?? '0');
    return 2 * (w + h);
  }
  if (tag === 'circle') {
    const r = parseFloat(el.getAttribute('r') ?? '0');
    return 2 * Math.PI * r;
  }
  return (el as SVGGeometryElement).getTotalLength();
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

// ── Color interpolation ──────────────────────────────────────────────────────

function parseColor(color: string): [number, number, number] | null {
  const short = /^#([a-f\d])([a-f\d])([a-f\d])$/i.exec(color);
  if (short) return [
    parseInt(short[1] + short[1], 16),
    parseInt(short[2] + short[2], 16),
    parseInt(short[3] + short[3], 16),
  ];
  const full = /^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
  if (full) return [parseInt(full[1], 16), parseInt(full[2], 16), parseInt(full[3], 16)];
  const rgb = /^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i.exec(color);
  if (rgb) return [parseInt(rgb[1]), parseInt(rgb[2]), parseInt(rgb[3])];
  return null;
}

export function lerpColor(from: string, to: string, t: number): string {
  const a = parseColor(from);
  const b = parseColor(to);
  if (!a || !b) return from;
  return `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)},${Math.round(a[1] + (b[1] - a[1]) * t)},${Math.round(a[2] + (b[2] - a[2]) * t)})`;
}
