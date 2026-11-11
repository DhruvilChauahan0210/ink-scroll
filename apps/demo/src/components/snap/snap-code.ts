/**
 * The CSS scroll snap generator's settings and everything it writes.
 *
 * Pure functions only, so the page (server) and the generator (client) quote
 * the same CSS, HTML and JavaScript. The preview injects css() with its own
 * selector, so what the visitor swipes is the stylesheet they copy.
 *
 * SNAP_DEFAULTS copies scrollSnap's defaults from
 * packages/svg-scroll-draw/src/snap/index.ts (the destructuring at lines
 * 72–80): the generated scrollSnap() call leaves out every option equal to one.
 */

export type Axis = 'x' | 'y' | 'both';
export type Strictness = 'mandatory' | 'proximity';
export type Align = 'start' | 'center' | 'end';
export type Stop = 'normal' | 'always';
export type Engine = 'css' | 'js';
export type SnapEasing = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'spring' | 'bounce' | 'elastic';

export type Settings = {
  axis: Axis;
  strictness: Strictness;
  align: Align;
  stop: Stop;
  /** scroll-padding on the snap axis, px. */
  padding: number;
  /** Each item's size along the axis, as a percentage of the scroll port. */
  size: number;
  /** gap between items, px. */
  gap: number;
  count: number;
  /** scrollSnap only. */
  duration: number;
  easing: SnapEasing;
  threshold: number;
};

/** scrollSnap's own defaults: snap/index.ts:72–80. */
export const SNAP_DEFAULTS = {
  direction: 'vertical',
  duration: 600,
  easing: 'ease-in-out' as SnapEasing,
  threshold: 0.3,
  respectReducedMotion: true,
} as const;

/** The named easings scrollSnap accepts (EasingName in core/types.ts). */
export const SNAP_EASINGS: readonly SnapEasing[] = ['linear', 'ease-in', 'ease-out', 'ease-in-out', 'spring', 'bounce', 'elastic'];

/** How long scrollSnap waits after the last scroll event before it snaps: snap/index.ts:214. */
export const SNAP_DEBOUNCE_MS = 100;

export const AXES: readonly Axis[] = ['x', 'y', 'both'];
export const STRICTNESS: readonly Strictness[] = ['mandatory', 'proximity'];
export const ALIGNS: readonly Align[] = ['start', 'center', 'end'];
export const STOPS: readonly Stop[] = ['normal', 'always'];

export const RANGES = {
  padding: { min: 0, max: 64, step: 4 },
  size: { min: 30, max: 100, step: 5 },
  gap: { min: 0, max: 48, step: 4 },
  count: { min: 2, max: 12, step: 1 },
  duration: { min: 100, max: 1500, step: 50 },
  threshold: { min: 0.05, max: 0.9, step: 0.05 },
} as const;

type Layout = Pick<Settings, 'axis' | 'strictness' | 'align' | 'stop' | 'padding' | 'size' | 'gap' | 'count'>;

export const PRESETS: { k: string; label: string; d: string; s: Layout }[] = [
  {
    k: 'carousel',
    label: 'carousel',
    d: 'A row of cards, the next one peeking in from the side.',
    s: { axis: 'x', strictness: 'mandatory', align: 'start', stop: 'normal', padding: 16, size: 80, gap: 16, count: 8 },
  },
  {
    k: 'sections',
    label: 'sections',
    d: 'Full-height panels, one per swipe.',
    s: { axis: 'y', strictness: 'mandatory', align: 'start', stop: 'always', padding: 0, size: 100, gap: 0, count: 5 },
  },
  {
    k: 'gallery',
    label: 'gallery',
    d: 'A grid of tiles that snaps both ways, each to the centre.',
    s: { axis: 'both', strictness: 'mandatory', align: 'center', stop: 'normal', padding: 0, size: 70, gap: 12, count: 9 },
  },
];

export const DEFAULTS: Settings = {
  ...PRESETS[0].s,
  duration: SNAP_DEFAULTS.duration,
  easing: SNAP_DEFAULTS.easing,
  threshold: SNAP_DEFAULTS.threshold,
};

/** The preset these settings are, or null once anything was changed by hand. */
export function presetOf(s: Settings): string | null {
  const keys = Object.keys(PRESETS[0].s) as (keyof Layout)[];
  return PRESETS.find((p) => keys.every((k) => p.s[k] === s[k]))?.k ?? null;
}

/** Columns in the gallery grid: as square as the count allows. */
export const gridColumns = (count: number) => Math.ceil(Math.sqrt(count));

/** What scrollSnap() can run: one axis, so not 'both'. */
export const libAxisOk = (s: Settings) => s.axis !== 'both';

/** The files a tab lists, in the order they are added to a page. */
export const OUTPUTS = ['index.html', 'snap.css', 'snap.js'] as const;

const LABEL: Record<Axis, string> = { x: 'Carousel', y: 'Sections', both: 'Gallery' };

/**
 * The stylesheet. `sel` is the container's selector ('.snap' in the copied
 * code, the preview's own class in the preview). With engine 'js' the snap
 * properties are left out, since scrollSnap does the snapping and the two
 * would pull toward different places; items then fill the scroll port.
 */
export function css(s: Settings, engine: Engine = 'css', sel = '.snap'): string {
  const lib = engine === 'js';
  const size = lib ? 100 : s.size;
  const box: string[] = [];
  const item: string[] = [];

  if (s.axis === 'x') {
    box.push('display: flex;');
  } else if (s.axis === 'y') {
    box.push('display: flex;', 'flex-direction: column;');
  } else {
    box.push(
      'display: grid;',
      `grid-template-columns: repeat(${gridColumns(s.count)}, ${size}%);`,
      `grid-auto-rows: ${size}%;`,
    );
  }
  if (s.gap > 0) box.push(`gap: ${s.gap}px;`);
  if (s.axis !== 'x') box.push(`height: ${size === 100 ? '100dvh' : '480px'}; /* the scroll port needs a height */`);
  box.push(`overflow${s.axis === 'x' ? '-x' : s.axis === 'y' ? '-y' : ''}: auto;`);
  if (lib) {
    box.push('scroll-behavior: auto; /* scrollSnap moves it frame by frame */');
  } else {
    box.push(`scroll-snap-type: ${s.axis} ${s.strictness};`);
    if (s.padding > 0) {
      const prop = s.axis === 'x' ? 'scroll-padding-inline' : s.axis === 'y' ? 'scroll-padding-block' : 'scroll-padding';
      box.push(`${prop}: ${s.padding}px;`);
    }
  }

  if (s.axis !== 'both') item.push(`flex: 0 0 ${size}%;`);
  if (!lib) {
    item.push(`scroll-snap-align: ${s.align};`);
    if (s.stop === 'always') item.push('scroll-snap-stop: always;');
  }

  const head = lib ? '/* No scroll-snap-type: scrollSnap() does the snapping. */\n' : '';
  const block = (selector: string, lines: string[]) => `${selector} {\n${lines.map((l) => `  ${l}`).join('\n')}\n}`;
  return `${head}${block(sel, box)}${item.length ? `\n\n${block(`${sel} > *`, item)}` : ''}\n`;
}

/** The markup: a focusable, labelled scroll container, its items, and the two buttons. */
export function html(s: Settings): string {
  const items = Array.from({ length: s.count }, (_, i) => `  <div>${i + 1}</div>`).join('\n');
  return `<div class="snap" tabindex="0" role="region" aria-label="${LABEL[s.axis]}">
${items}
</div>

<button type="button" data-snap="prev">Previous</button>
<button type="button" data-snap="next">Next</button>
`;
}

/**
 * Previous and next for CSS scroll snap. The buttons do the snap maths
 * themselves and scroll to an exact snap position: WebKit leaves a
 * programmatic scrollBy() where it lands instead of snapping it, so "one item
 * along" is off by the scroll-padding there once the first item was clamped.
 */
export function js(s: Settings): string {
  const behavior = `matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'`;
  const what = s.align === 'center' ? 'its centre' : `its ${s.align} edge`;
  const where = s.align === 'center' ? 'centre' : s.align;
  if (s.axis === 'both') {
    return `const snap = document.querySelector('.snap');
const items = [...snap.children];

// Each item's snap position: the scroll offsets that put ${what}
// on the ${where} of the snapport, clamped to how far the box can scroll.
function positions() {
  const box = snap.getBoundingClientRect();
  const css = getComputedStyle(snap);
  const pad = (side) => parseFloat(css['scrollPadding' + side]) || 0;
  const lineX = ${lineFor(s.align, 'x')};
  const lineY = ${lineFor(s.align, 'y')};
  const maxX = snap.scrollWidth - snap.clientWidth;
  const maxY = snap.scrollHeight - snap.clientHeight;
  const clamp = (v, max) => Math.min(max, Math.max(0, v));
  return items.map((item) => {
    const r = item.getBoundingClientRect();
    return {
      x: clamp(snap.scrollLeft + ${edge(s.align, 'x')} - lineX, maxX),
      y: clamp(snap.scrollTop + ${edge(s.align, 'y')} - lineY, maxY),
    };
  });
}

// One item along in reading order, skipping any that share this position.
function go(step) {
  const all = positions();
  const far = (p) => Math.hypot(p.x - snap.scrollLeft, p.y - snap.scrollTop);
  let i = all.indexOf(all.reduce((a, b) => (far(b) < far(a) ? b : a)));
  do i += step; while (all[i] && far(all[i]) < 1);
  if (!all[i]) return;
  snap.scrollTo({ left: all[i].x, top: all[i].y, behavior: ${behavior} });
}

document.querySelector('[data-snap="prev"]').addEventListener('click', () => go(-1));
document.querySelector('[data-snap="next"]').addEventListener('click', () => go(1));
`;
  }
  const a = s.axis;
  const scroll = a === 'x' ? 'scrollLeft' : 'scrollTop';
  const max = a === 'x' ? 'snap.scrollWidth - snap.clientWidth' : 'snap.scrollHeight - snap.clientHeight';
  return `const snap = document.querySelector('.snap');
const items = [...snap.children];

// Each item's snap position: the scroll offset that puts ${what}
// on the ${where} of the snapport, clamped to how far the box can scroll.
function positions() {
  const box = snap.getBoundingClientRect();
  const css = getComputedStyle(snap);
  const pad = (side) => parseFloat(css['scrollPadding' + side]) || 0;
  const line = ${lineFor(s.align, a)};
  const max = ${max};
  return items.map((item) => {
    const r = item.getBoundingClientRect();
    return Math.min(max, Math.max(0, snap.${scroll} + ${edge(s.align, a)} - line));
  });
}

// The next snap position past this one, or the last before it.
function go(step) {
  const now = snap.${scroll};
  const all = positions();
  const to = step > 0 ? all.find((p) => p > now + 1) : all.findLast((p) => p < now - 1);
  if (to === undefined) return;
  snap.scrollTo({ ${a === 'x' ? 'left' : 'top'}: to, behavior: ${behavior} });
}

document.querySelector('[data-snap="prev"]').addEventListener('click', () => go(-1));
document.querySelector('[data-snap="next"]').addEventListener('click', () => go(1));
`;
}

/** The snap line on one axis, in viewport pixels: the snapport's start, centre or end. */
function lineFor(align: Align, axis: 'x' | 'y'): string {
  const [pos, client, size, a, b] = axis === 'x'
    ? ['box.left', 'snap.clientLeft', 'snap.clientWidth', "pad('Left')", "pad('Right')"]
    : ['box.top', 'snap.clientTop', 'snap.clientHeight', "pad('Top')", "pad('Bottom')"];
  if (align === 'start') return `${pos} + ${client} + ${a}`;
  if (align === 'end') return `${pos} + ${client} + ${size} - ${b}`;
  return `${pos} + ${client} + ${a} + (${size} - ${a} - ${b}) / 2`;
}

/** The item's matching edge, in viewport pixels. */
function edge(align: Align, axis: 'x' | 'y'): string {
  const [start, end, size] = axis === 'x' ? ['r.left', 'r.right', 'r.width'] : ['r.top', 'r.bottom', 'r.height'];
  if (align === 'start') return start;
  if (align === 'end') return end;
  return `${start} + ${size} / 2`;
}

/** scrollSnap() for the same markup, with the box as its scroll container. */
export function libJs(s: Settings): string {
  const opts: string[] = [];
  if (s.axis === 'x') opts.push(`direction: 'horizontal',`);
  if (s.duration !== SNAP_DEFAULTS.duration) opts.push(`duration: ${s.duration},`);
  if (s.easing !== SNAP_DEFAULTS.easing) opts.push(`easing: '${s.easing}',`);
  if (s.threshold !== SNAP_DEFAULTS.threshold) opts.push(`threshold: ${Math.round(s.threshold * 100) / 100},`);
  opts.push(`scrollContainer: '.snap', // leave it out to snap sections of the page itself`);
  opts.push(`onSnap: (index) => console.log('snapped to', index),`);
  return `import { scrollSnap } from 'svg-scroll-draw/snap';

const snap = scrollSnap('.snap > *', {
${opts.map((o) => `  ${o}`).join('\n')}
});

// Previous and next: glide one section along.
document.querySelector('[data-snap="prev"]').addEventListener('click', () => snap.snapTo(snap.getCurrentIndex() - 1));
document.querySelector('[data-snap="next"]').addEventListener('click', () => snap.snapTo(snap.getCurrentIndex() + 1));
`;
}

/**
 * Where one item snaps on one axis, as a scroll offset: the item's edge minus
 * the snap line, clamped to the scroll range. `at` is the item's start in the
 * scroll content, `len` its size; `port` the scroll port's size and `a`, `b`
 * the scroll-padding at its start and end.
 */
export function snapPosition(align: Align, at: number, len: number, port: number, a: number, b: number, max: number): number {
  const line = align === 'start' ? a : align === 'end' ? port - b : a + (port - a - b) / 2;
  const edgeAt = align === 'start' ? at : align === 'end' ? at + len : at + len / 2;
  return Math.min(max, Math.max(0, edgeAt - line));
}
