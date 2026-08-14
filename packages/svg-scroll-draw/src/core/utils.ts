// ── Easing factories ─────────────────────────────────────────────────────────

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

/**
 * Returns a bounce-out easing function.
 * The animation rises to 1 and then makes `bounces` dips below 1 that settle.
 * - `bounces` — number of bounces after the initial approach (default 3)
 * - `decay`   — amplitude reduction per bounce (0–1, default 0.5)
 *
 * @example
 * scrollDraw('#svg', { easing: createBounce() });
 * scrollDraw('#svg', { easing: createBounce({ bounces: 5, decay: 0.4 }) });
 */
export function createBounce({
  bounces = 3,
  decay = 0.5,
}: { bounces?: number; decay?: number } = {}): (t: number) => number {
  const n = Math.max(1, Math.round(bounces));
  const d = Math.max(0.01, Math.min(0.99, decay));
  const sqrtD = Math.sqrt(d);

  // Segment time widths proportional to sqrtD^i so that
  // higher-amplitude (earlier) bounces get more time.
  let totalW = 0;
  const rawWidths: number[] = [];
  for (let i = 0; i < n; i++) {
    const w = Math.pow(sqrtD, i);
    rawWidths.push(w);
    totalW += w;
  }

  const boundaries = [0];
  let cum = 0;
  for (let i = 0; i < n; i++) {
    cum += rawWidths[i] / totalW;
    boundaries.push(cum);
  }

  return (t: number): number => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    for (let i = 0; i < n; i++) {
      if (t <= boundaries[i + 1]) {
        const u = (t - boundaries[i]) / (boundaries[i + 1] - boundaries[i]);
        if (i === 0) {
          // Initial approach: ease-out quadratic (0 → 1)
          return u * (2 - u);
        }
        // Bounce i: upward parabola from 1 → trough → 1
        // trough = 1 - d^i, so each successive bounce dips less
        const trough = 1 - Math.pow(d, i);
        return trough + (1 - trough) * (2 * u - 1) * (2 * u - 1);
      }
    }
    return 1;
  };
}

/**
 * Returns an elastic-out easing function.
 * The animation overshoots past 1 and oscillates back, settling at 1.
 * Can produce values outside [0, 1] — the overshoot is the effect.
 * - `amplitude` — overshoot magnitude (>=1, default 1 → overshoots to ~1.25)
 * - `period`    — oscillation period in [0, 1] time (default 0.4)
 *
 * @example
 * scrollDraw('#svg', { easing: createElastic() });
 * scrollDraw('#svg', { easing: createElastic({ amplitude: 1.5, period: 0.3 }) });
 */
export function createElastic({
  amplitude = 1,
  period = 0.4,
}: { amplitude?: number; period?: number } = {}): (t: number) => number {
  const a = Math.max(1, amplitude);
  const p = Math.max(0.1, period);
  // Phase shift so that f(0) = 0 exactly.
  const s = a <= 1 ? p / 4 : (p / (2 * Math.PI)) * Math.asin(1 / a);

  return (t: number): number => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    return a * Math.pow(2, -10 * t) * Math.sin((t - s) * (2 * Math.PI) / p) + 1;
  };
}

// ── Named easing map (used by the engine for string easing values) ────────────

export const EASINGS: Record<string, (t: number) => number> = {
  linear:        (t) => t,
  'ease-in':     (t) => t * t,
  'ease-out':    (t) => t * (2 - t),
  'ease-in-out': (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  spring:        (t) => 1 - Math.cos(t * Math.PI * 2.5) * Math.pow(1 - t, 2.2),
  bounce:        createBounce(),
  elastic:       createElastic(),
};

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

/**
 * Measure the element a trigger window is computed from, in the coordinate space
 * `computeTriggers` expects — which is not the same space in both cases.
 *
 * Scrolling the window: `getBoundingClientRect()` is viewport-relative, so the
 * scroll position has to be added back to reach a document position, and
 * `elementAnchorY` does exactly that.
 *
 * Scrolling a container: the offset inside the scroll content is
 * `rect.top - containerRect.top + container.scrollTop`, which **already includes**
 * the scroll position. Handing that to `elementAnchorY` with the live scroll
 * position counted it twice, so any re-measure while scrolled moved the trigger
 * window by however far the user had scrolled. At scrollTop 0 the two agree, which
 * is why it survived: the first measurement happens at construction, and only a
 * later resize or `refresh()` exposes it. Measured: a `scrollHorizontal` strip
 * scrubbed halfway snapped back to its first panel on a resize, without the user
 * scrolling at all.
 *
 * The returned `scroll` is what to pass as `computeTriggers`' scroll argument —
 * the live position for the window, zero for a container, where it is already
 * baked in. Three engines each had their own copy of this arithmetic, and
 * therefore three copies of the same defect.
 */
export function measureTriggerFrame(
  el: Element,
  scrollEl: Element | null,
  axis: 'x' | 'y'
): { top: number; height: number; scroll: number } {
  const rect = el.getBoundingClientRect();
  const size = axis === 'x' ? rect.width : rect.height;

  if (scrollEl) {
    const top =
      axis === 'x'
        ? rect.left - scrollEl.getBoundingClientRect().left + scrollEl.scrollLeft
        : rect.top - scrollEl.getBoundingClientRect().top + scrollEl.scrollTop;
    return { top, height: size, scroll: 0 };
  }

  return {
    top: axis === 'x' ? rect.left : rect.top,
    height: size,
    scroll: axis === 'x' ? window.scrollX : window.scrollY,
  };
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

// ── Color interpolation ───────────────────────────────────────────────────────

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
