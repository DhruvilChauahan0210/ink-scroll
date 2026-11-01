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
