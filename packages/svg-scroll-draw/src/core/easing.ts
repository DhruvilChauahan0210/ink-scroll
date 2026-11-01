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
