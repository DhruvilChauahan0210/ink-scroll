/**
 * svg-scroll-draw/scrollreveal — a drop-in replacement for ScrollReveal.js 4.
 *
 * ScrollReveal is GPL-3.0 (with a paid commercial licence) and has not shipped
 * since 4.0.9. This entry speaks its API, so moving off it is an import change:
 * `ScrollReveal(options)`, `.reveal(target, options)`, `.clean()`, `.sync()`,
 * `.destroy()`, every option, sequences (`interval`), `reset`, `useDelay`,
 * `viewFactor` / `viewOffset`, custom containers and the four callbacks behave as
 * they do in 4.0.9, down to the inline styles written (`visibility`, `opacity`, a
 * `matrix3d()` transform, `transition`), the `data-sr-id` attribute and the `sr`
 * class on <html> that FOUC-hiding CSS keys off.
 *
 * This is an independent, MIT-licensed implementation written against
 * ScrollReveal's documented and observed behaviour; no ScrollReveal code is
 * included. The e2e suite runs the real library beside it to hold it to that.
 *
 * Deliberate differences:
 *   - Nothing runs on import. ScrollReveal mounts (adds `sr`, sets
 *     `body { height: 100% }`) when its module loads; this does so on the first
 *     `ScrollReveal()` call, which keeps the import side-effect free and SSR-safe.
 *   - `prefers-reduced-motion: reduce` shows every element in its final state
 *     with no transition.
 *   - A device switched off (`mobile: false` / `desktop: false`) on a re-reveal
 *     is cleaned; ScrollReveal leaves it.
 */
import { prefersReducedMotion } from '../core/motion';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ScrollRevealTarget = string | Element | ArrayLike<Element>;

export interface ScrollRevealOptions {
  delay?: number;
  /** A length with a unit: `'20px'`, `'2em'`, `'50%'`. */
  distance?: string;
  duration?: number;
  easing?: string;
  /** Ms between members of a sequence. Only read from `reveal()` options. */
  interval?: number;
  /** Starting opacity; `null` leaves opacity alone. */
  opacity?: number | null;
  origin?: 'top' | 'right' | 'bottom' | 'left';
  rotate?: { x?: number; y?: number; z?: number };
  scale?: number;
  cleanup?: boolean;
  container?: string | Element;
  desktop?: boolean;
  mobile?: boolean;
  reset?: boolean;
  useDelay?: 'always' | 'once' | 'onload';
  viewFactor?: number;
  viewOffset?: { top?: number; right?: number; bottom?: number; left?: number };
  afterReset?: (el: Element) => void;
  afterReveal?: (el: Element) => void;
  beforeReset?: (el: Element) => void;
  beforeReveal?: (el: Element) => void;
}

export interface ScrollRevealInstance {
  reveal(target: ScrollRevealTarget, options?: ScrollRevealOptions): void;
  clean(target: ScrollRevealTarget): void;
  destroy(): void;
  sync(): void;
  readonly defaults: Required<ScrollRevealOptions>;
  readonly version: string;
  readonly noop: boolean;
}

export interface ScrollRevealStatic {
  (options?: ScrollRevealOptions): ScrollRevealInstance;
  new (options?: ScrollRevealOptions): ScrollRevealInstance;
  isSupported(): boolean;
  debug: boolean;
}

type Config = Required<ScrollRevealOptions> & {
  rotate: { x: number; y: number; z: number };
  viewOffset: { top: number; right: number; bottom: number; left: number };
};

interface Styles {
  inline: { computed: string; generated: string };
  opacity: { computed: string; generated: string };
  position: string;
  transform: { initial: string; final: string };
  transition: { delayed: string; instant: string };
}

interface Bounds { top: number; right: number; bottom: number; left: number }
interface Geometry { bounds: Bounds; height: number; width: number }

interface Item {
  id: number;
  node: HTMLElement;
  config: Config;
  containerId: number;
  styles: Styles;
  seen: boolean;
  revealed: boolean;
  visible: boolean;
  geometry?: Geometry;
  sequence?: { id: number; index: number };
  timer?: { start: number; clock: ReturnType<typeof setTimeout> } | null;
}

interface Container { id: number; node: Element; geometry?: Geometry; scroll?: { top: number; left: number } }

interface Seq {
  id: number;
  interval: number;
  members: number[];
  blocked: { head: boolean; foot: boolean };
}

// ── Small helpers ─────────────────────────────────────────────────────────────

/** The ScrollReveal API version this entry matches. */
const VERSION = '4.0.9';

const hasDom = (): boolean => typeof window !== 'undefined' && typeof document !== 'undefined';

const isPlain = (x: unknown): x is Record<string, unknown> =>
  x !== null && typeof x === 'object' && Object.prototype.toString.call(x) === '[object Object]';

/** Merge plain objects recursively; everything else (nodes, functions) is assigned. */
function merge<T extends Record<string, unknown>>(target: T, ...sources: unknown[]): T {
  for (const source of sources) {
    if (!isPlain(source)) continue;
    for (const key of Object.keys(source)) {
      const value = source[key];
      if (isPlain(value)) {
        if (!isPlain(target[key])) (target as Record<string, unknown>)[key] = {};
        merge(target[key] as Record<string, unknown>, value);
      } else {
        (target as Record<string, unknown>)[key] = value;
      }
    }
  }
  return target;
}

function query(target: unknown): HTMLElement[] {
  if (typeof target === 'string') {
    try {
      return Array.from(document.querySelectorAll<HTMLElement>(target));
    } catch {
      return [];
    }
  }
  if (target instanceof Element) return [target as HTMLElement];
  if (target && typeof (target as ArrayLike<unknown>).length === 'number') {
    return Array.from(target as ArrayLike<unknown>).filter((n): n is HTMLElement => n instanceof Element);
  }
  return [];
}

const isMobile = (agent = navigator.userAgent): boolean => /Android|iPhone|iPad|iPod/i.test(agent);

let debug = false;
function log(message: string, ...details: string[]): void {
  if (debug && typeof console !== 'undefined') {
    console.log(`%cScrollReveal: ${message}${details.map((d) => `\n — ${d}`).join('')}`, 'color: #ea654b;');
  }
}

// ── 4×4 matrices, column-major as in CSS matrix3d() ──────────────────────────

type Matrix = number[];
const identity = (): Matrix => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

/** `a × b`: the transform list "a b". */
function times(a: Matrix, b: Matrix): Matrix {
  const out: Matrix = [];
  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 4; row++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) sum += a[row + 4 * k] * b[4 * col + k];
      out[row + 4 * col] = sum;
    }
  }
  return out;
}

/** A computed `transform` value as a 4×4 matrix (identity for `none`). */
function toMatrix(value: string): Matrix {
  const m = /matrix(3d)?\(([^)]+)\)/.exec(value || '');
  if (!m) return identity();
  const v = m[2].split(', ').map(parseFloat);
  if (v.length === 16) return v;
  const out = identity();
  [out[0], out[1], out[4], out[5], out[12], out[13]] = v;
  return out;
}

function rotation(axis: 'x' | 'y' | 'z', degrees: number): Matrix {
  const theta = (Math.PI / 180) * degrees;
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  const m = identity();
  // [cos, sin, −sin] slots for each axis, in column-major order.
  const [a, b, sinAt, negSinAt] = axis === 'x' ? [5, 10, 6, 9] : axis === 'y' ? [0, 10, 8, 2] : [0, 5, 1, 4];
  m[a] = m[b] = c;
  m[sinAt] = s;
  m[negSinAt] = -s;
  return m;
}

function translation(axis: 'X' | 'Y', d: number): Matrix {
  const m = identity();
  m[axis === 'X' ? 12 : 13] = d;
  return m;
}

function scaling(f: number): Matrix {
  const m = identity();
  m[0] = m[5] = f;
  return m;
}

// ── Styles ────────────────────────────────────────────────────────────────────

/** Apply "prop: value; prop: value;" through the CSSOM (CSP-safe, unlike setAttribute). */
function apply(el: HTMLElement, declaration: string): void {
  for (const pair of declaration.split(';')) {
    const at = pair.indexOf(':');
    if (at < 1) continue;
    const prop = pair.slice(0, at).trim();
    const value = pair.slice(at + 1).trim();
    if (prop && value) el.style.setProperty(prop, value);
  }
}

function computeStyles(item: Pick<Item, 'node' | 'config'>): Styles {
  const { node, config } = item;
  const cs = window.getComputedStyle(node);

  // Inline: what the author wrote, and that plus `visibility: visible`.
  const written = (node.getAttribute('style') || '').match(/[\w-]+\s*:\s*[^;]+\s*/gi) || [];
  const trimmed = written.map((d) => d.trim());
  const inlineComputed = `${trimmed.join('; ')};`;
  const inlineGenerated = written.some((d) => /visibility\s?:\s?visible/i.test(d))
    ? inlineComputed
    : `${[...trimmed, 'visibility: visible'].join('; ')};`;

  // Opacity: only written when the configured start differs from the computed value.
  const current = parseFloat(cs.opacity);
  const start = config.opacity !== null && !isNaN(parseFloat(String(config.opacity))) ? parseFloat(String(config.opacity)) : current;
  const opacity =
    current !== start
      ? { computed: `opacity: ${current};`, generated: `opacity: ${start};` }
      : { computed: '', generated: '' };

  // Transform: the computed matrix, then translate, rotate X/Y/Z and scale.
  const steps: Matrix[] = [];
  if (parseFloat(config.distance)) {
    const axis = config.origin === 'top' || config.origin === 'bottom' ? 'Y' : 'X';
    let distance = config.distance;
    if (config.origin === 'top' || config.origin === 'left') {
      distance = distance.startsWith('-') ? distance.slice(1) : `-${distance}`;
    }
    // ScrollReveal reads the number with at most one decimal place ("12.25px" → 12.2).
    const parts = distance.match(/(^-?\d+\.?\d?)|(em$|px$|%$)/g) || [];
    const value = Number(parts[0]);
    const unit = parts[1];
    let px: number;
    if (unit === 'em') px = parseInt(cs.fontSize, 10) * value;
    else if (unit === 'px') px = value;
    else if (unit === '%') {
      const rect = node.getBoundingClientRect();
      px = ((axis === 'Y' ? rect.height : rect.width) * value) / 100;
    } else throw new RangeError('Unrecognized or missing distance unit.');
    steps.push(translation(axis, px));
  }
  if (config.rotate.x) steps.push(rotation('x', config.rotate.x));
  if (config.rotate.y) steps.push(rotation('y', config.rotate.y));
  if (config.rotate.z) steps.push(rotation('z', config.rotate.z));
  // A zero scale is not invertible, so browsers will not transition it.
  if (config.scale !== 1) steps.push(scaling(config.scale === 0 ? 0.0002 : config.scale));

  let transform = { initial: '', final: '' };
  if (steps.length) {
    const base = toMatrix(cs.transform);
    const product = steps.reduce(times, base);
    transform = {
      initial: `transform: matrix3d(${product.join(', ')});`,
      final: `transform: matrix3d(${base.join(', ')});`,
    };
  }

  // Transition: one fragment per animated property, keeping any the author set.
  let transition = { delayed: '', instant: '' };
  if (opacity.generated || transform.initial) {
    const time = (ms: number) => `${ms / 1000}s`;
    const fragments: Array<{ delayed: string; instant: string }> = [];
    const frag = (prop: string) => ({
      delayed: `${prop} ${time(config.duration)} ${config.easing} ${time(config.delay)}`,
      instant: `${prop} ${time(config.duration)} ${config.easing} 0s`,
    });
    if (cs.transition && !/all 0s|none 0s/.test(cs.transition)) {
      fragments.push({ delayed: cs.transition, instant: cs.transition });
    }
    if (opacity.generated) fragments.push(frag('opacity'));
    if (transform.initial) fragments.push(frag('transform'));
    transition = {
      delayed: `transition: ${fragments.map((f) => f.delayed).join(', ')};`,
      instant: `transition: ${fragments.map((f) => f.instant).join(', ')};`,
    };
  }

  return {
    inline: { computed: inlineComputed, generated: inlineGenerated },
    opacity,
    position: cs.position,
    transform,
    transition,
  };
}

const join = (...parts: string[]): string => parts.filter((p) => p !== '').join(' ');

// ── State (a singleton, like ScrollReveal) ────────────────────────────────────

const defaults = (): Config => ({
  delay: 0,
  distance: '0',
  duration: 600,
  easing: 'cubic-bezier(0.5, 0, 0, 1)',
  interval: 0,
  opacity: 0,
  origin: 'bottom',
  rotate: { x: 0, y: 0, z: 0 },
  scale: 1,
  cleanup: false,
  container: document.documentElement,
  desktop: true,
  mobile: true,
  reset: false,
  useDelay: 'always',
  viewFactor: 0,
  viewOffset: { top: 0, right: 0, bottom: 0, left: 0 },
  afterReset: () => {},
  afterReveal: () => {},
  beforeReset: () => {},
  beforeReveal: () => {},
});

let config: Config | null = null;
let instance: ScrollRevealInstance | null = null;
let store = { containers: {} as Record<number, Container>, elements: {} as Record<number, Item>, history: [] as Array<{ target: ScrollRevealTarget; options: ScrollRevealOptions }>, sequences: {} as Record<number, Seq> };
let pristine = true;
let initTimer: ReturnType<typeof setTimeout> | null = null;
let frame = 0;
let staleFrame = false;
let uid = 0;
const nextId = (): number => uid++;

// ── Geometry & visibility ─────────────────────────────────────────────────────

function geometry(node: Element, isContainer = false): Geometry {
  const el = node as HTMLElement;
  const height = isContainer ? el.clientHeight : el.offsetHeight;
  const width = isContainer ? el.clientWidth : el.offsetWidth;
  let top = 0;
  let left = 0;
  let n: HTMLElement | null = el;
  while (n) {
    if (!isNaN(n.offsetTop)) top += n.offsetTop;
    if (!isNaN(n.offsetLeft)) left += n.offsetLeft;
    n = n.offsetParent as HTMLElement | null;
  }
  return { bounds: { top, right: left + width, bottom: top + height, left }, height, width };
}

const scrolled = (c: Container) =>
  c.node === document.documentElement
    ? { top: window.pageYOffset, left: window.pageXOffset }
    : { top: (c.node as HTMLElement).scrollTop, left: (c.node as HTMLElement).scrollLeft };

function isVisible(item: Item): boolean {
  const c = store.containers[item.containerId];
  if (!c || !c.geometry || !c.scroll || !item.geometry) return false;
  const vf = Math.max(0, Math.min(1, item.config.viewFactor));
  const off = item.config.viewOffset;
  const g = item.geometry;
  const el = {
    top: g.bounds.top + g.height * vf,
    right: g.bounds.right - g.width * vf,
    bottom: g.bounds.bottom - g.height * vf,
    left: g.bounds.left + g.width * vf,
  };
  const view = {
    top: c.geometry.bounds.top + c.scroll.top + off.top,
    right: c.geometry.bounds.right + c.scroll.left - off.right,
    bottom: c.geometry.bounds.bottom + c.scroll.top - off.bottom,
    left: c.geometry.bounds.left + c.scroll.left + off.left,
  };
  return (
    (el.top < view.bottom && el.right > view.left && el.bottom > view.top && el.left < view.right) ||
    item.styles.position === 'fixed'
  );
}

// ── Animation ─────────────────────────────────────────────────────────────────

function callbacks(item: Item, delayed = false): void {
  const duration = delayed ? item.config.duration + item.config.delay : item.config.duration;
  let elapsed = 0;
  if (item.timer) {
    elapsed = Date.now() - item.timer.start;
    clearTimeout(item.timer.clock);
  }
  (item.revealed ? item.config.beforeReveal : item.config.beforeReset)(item.node);
  item.timer = {
    start: Date.now(),
    clock: setTimeout(() => {
      (item.revealed ? item.config.afterReveal : item.config.afterReset)(item.node);
      item.timer = null;
      if (item.revealed && !item.config.reset && item.config.cleanup) clean(item.node);
    }, duration - elapsed),
  };
}

function showItem(item: Item, delayed: boolean): void {
  const s = item.styles;
  item.revealed = item.seen = true;
  apply(item.node, join(s.inline.generated, s.opacity.computed, s.transform.final, delayed ? s.transition.delayed : s.transition.instant));
  callbacks(item, delayed);
}

function resetItem(item: Item): void {
  const s = item.styles;
  item.revealed = false;
  apply(item.node, join(s.inline.generated, s.opacity.generated, s.transform.initial, s.transition.instant));
  callbacks(item);
}

function animate(item: Item, force: { reveal?: boolean; reset?: boolean; pristine?: boolean } = {}): void {
  const fresh = force.pristine || pristine;
  const use = item.config.useDelay;
  const delayed = use === 'always' || (use === 'onload' && fresh) || (use === 'once' && !item.seen);
  if (force.reveal || (item.visible && !item.revealed)) return showItem(item, delayed);
  if (force.reset || (!item.visible && item.revealed && item.config.reset)) return resetItem(item);
}

// ── Sequences ─────────────────────────────────────────────────────────────────

/** Member indices split around the first run of members that have `prop`. */
function model(seq: Seq, prop: 'visible' | 'revealed') {
  const head: number[] = [];
  const body: number[] = [];
  const foot: number[] = [];
  seq.members.forEach((id, i) => {
    if (store.elements[id]?.[prop]) body.push(i);
  });
  if (body.length) {
    seq.members.forEach((id, i) => {
      const el = store.elements[id];
      if (el && !el[prop]) (i < body[0] ? head : foot).push(i);
    });
  }
  return { head, body, foot };
}

function cue(seq: Seq, i: number, direction: -1 | 1, fresh: boolean): void {
  const side = direction < 0 ? 'head' : 'foot';
  const next = store.elements[seq.members[i + direction]];
  seq.blocked[side] = true;
  setTimeout(() => {
    seq.blocked[side] = false;
    if (next) sequence(next, fresh);
  }, seq.interval);
}

function sequence(item: Item, fresh = pristine): void {
  if (!item.visible && item.revealed && item.config.reset) return animate(item, { reset: true });
  const seq = item.sequence && store.sequences[item.sequence.id];
  if (!seq || !item.sequence) return;
  const i = item.sequence.index;
  const visible = model(seq, 'visible');
  const revealed = model(seq, 'revealed');

  // Nothing revealed yet: start from the first visible member, outward both ways.
  if (!revealed.body.length) {
    const first = visible.body[0];
    const next = store.elements[seq.members[first]];
    if (next) {
      cue(seq, first, -1, fresh);
      cue(seq, first, +1, fresh);
      return animate(next, { reveal: true, pristine: fresh });
    }
  }
  const last = <T>(a: T[]): T | undefined => a[a.length - 1];
  if (!seq.blocked.head && i === last(revealed.head) && i >= (visible.body[0] ?? Infinity)) {
    cue(seq, i, -1, fresh);
    return animate(item, { reveal: true, pristine: fresh });
  }
  if (!seq.blocked.foot && i === revealed.foot[0] && i <= (last(visible.body) ?? -Infinity)) {
    cue(seq, i, +1, fresh);
    return animate(item, { reveal: true, pristine: fresh });
  }
}

// ── The update loop ───────────────────────────────────────────────────────────

function run(): void {
  frame = 0;
  const stale = staleFrame;
  staleFrame = false;
  for (const c of Object.values(store.containers)) {
    if (stale || !c.geometry) c.geometry = geometry(c.node, true);
    c.scroll = scrolled(c);
  }
  // Every element's state first: the sequencer reads its neighbours'.
  const items = Object.values(store.elements);
  for (const item of items) {
    if (stale || !item.geometry) item.geometry = geometry(item.node);
    item.visible = isVisible(item);
  }
  for (const item of items) {
    if (item.sequence) sequence(item);
    else animate(item);
  }
  pristine = false;
}

function delegate(event?: Event | { type: string }): void {
  const type = event ? event.type : 'init';
  if (type === 'init' || type === 'resize') staleFrame = true;
  if (!frame) frame = requestAnimationFrame(run);
}

const listenTarget = (c: Container): EventTarget => (c.node === document.documentElement ? window : c.node);

/** Drop records for nodes that lost their id, and containers / sequences nothing uses. */
function rinse(): void {
  const live = new Set(
    Array.from(document.querySelectorAll('[data-sr-id]')).map((n) => parseInt(n.getAttribute('data-sr-id') || '', 10)),
  );
  for (const item of Object.values(store.elements)) if (!live.has(item.id)) delete store.elements[item.id];
  const containers = new Set<number>();
  const sequences = new Set<number>();
  for (const item of Object.values(store.elements)) {
    containers.add(item.containerId);
    if (item.sequence) sequences.add(item.sequence.id);
  }
  for (const c of Object.values(store.containers)) {
    if (containers.has(c.id)) continue;
    listenTarget(c).removeEventListener('scroll', delegate);
    listenTarget(c).removeEventListener('resize', delegate);
    delete store.containers[c.id];
  }
  for (const s of Object.values(store.sequences)) if (!sequences.has(s.id)) delete store.sequences[s.id];
}

function initialize(): void {
  initTimer = null;
  rinse();
  const reduced = prefersReducedMotion();
  for (const item of Object.values(store.elements)) {
    const s = item.styles;
    if (reduced) {
      // Final state, no transition: there is nothing to animate.
      item.visible = item.revealed = item.seen = true;
      apply(item.node, join(s.inline.generated, s.opacity.computed, s.transform.final, 'transition: none;'));
    } else if (item.visible) {
      item.revealed = true;
      apply(item.node, join(s.inline.generated, s.opacity.computed, s.transform.final));
    } else {
      item.revealed = false;
      apply(item.node, join(s.inline.generated, s.opacity.generated, s.transform.initial));
    }
  }
  if (reduced) return;
  for (const c of Object.values(store.containers)) {
    listenTarget(c).addEventListener('scroll', delegate);
    listenTarget(c).addEventListener('resize', delegate);
  }
  delegate();
}

// ── Public methods ────────────────────────────────────────────────────────────

function reveal(target: ScrollRevealTarget, options: ScrollRevealOptions = {}, syncing = false): void {
  if (!config) return;
  const containerBuffer: Container[] = [];
  const interval = options.interval || 0;
  let seq: Seq | undefined;
  let created: Item[];

  try {
    if (interval) {
      const ms = Math.abs(interval);
      if (isNaN(ms)) throw new RangeError('Invalid sequence interval.');
      seq = { id: nextId(), interval: Math.max(ms, 16), members: [], blocked: { head: false, foot: false } };
    }
    const nodes = query(target);
    if (!nodes.length) throw new Error('Invalid reveal target.');

    created = [];
    for (const node of nodes) {
      const existing = node.getAttribute('data-sr-id');
      const prior = existing !== null ? store.elements[Number(existing)] : undefined;
      const item = (prior ? merge({}, prior as unknown as Record<string, unknown>) : { id: nextId(), node, seen: false, revealed: false, visible: false }) as Item;
      // Back to the author's own inline styles before measuring again.
      if (prior) apply(node, prior.styles.inline.computed);

      const itemConfig = merge({}, (prior ? prior.config : config) as unknown as Record<string, unknown>, options) as Config;
      if ((!itemConfig.mobile && isMobile()) || (!itemConfig.desktop && !isMobile())) {
        if (prior) clean(node);
        continue;
      }
      const containerNode = query(itemConfig.container)[0];
      if (!containerNode) throw new Error('Invalid container.');
      if (!containerNode.contains(node)) continue;

      let containerId = [...containerBuffer, ...Object.values(store.containers)].find((c) => c.node === containerNode)?.id;
      if (containerId === undefined) {
        containerId = nextId();
        containerBuffer.push({ id: containerId, node: containerNode });
      }

      item.config = itemConfig;
      item.containerId = containerId;
      item.styles = computeStyles(item);
      if (seq) {
        item.sequence = { id: seq.id, index: seq.members.length };
        seq.members.push(item.id);
      }
      created.push(item);
    }
    // Writes after all the reads, so the browser can batch them.
    for (const item of created) {
      store.elements[item.id] = item;
      item.node.setAttribute('data-sr-id', String(item.id));
    }
  } catch (e) {
    return log('Reveal failed.', (e as Error).message);
  }

  for (const c of containerBuffer) store.containers[c.id] = c;
  if (seq) store.sequences[seq.id] = seq;

  if (!syncing) {
    store.history.push({ target, options });
    // Let several reveal() calls in a row land before the first paint.
    if (initTimer) clearTimeout(initTimer);
    initTimer = setTimeout(initialize, 0);
  }
}

function clean(target: ScrollRevealTarget): void {
  let dirty = false;
  for (const node of query(target)) {
    const id = node.getAttribute('data-sr-id');
    if (id === null) continue;
    dirty = true;
    const item = store.elements[Number(id)];
    if (item) {
      if (item.timer) clearTimeout(item.timer.clock);
      apply(item.node, item.styles.inline.generated);
      delete store.elements[item.id];
    }
    node.removeAttribute('data-sr-id');
  }
  if (dirty) rinse();
}

function destroy(): void {
  for (const item of Object.values(store.elements)) {
    apply(item.node, item.styles.inline.generated);
    item.node.removeAttribute('data-sr-id');
  }
  for (const c of Object.values(store.containers)) {
    listenTarget(c).removeEventListener('scroll', delegate);
    listenTarget(c).removeEventListener('resize', delegate);
  }
  if (frame) cancelAnimationFrame(frame);
  frame = 0;
  store = { containers: {}, elements: {}, history: [], sequences: {} };
}

/** Run every past reveal() again, for content added to the page since. */
function sync(): void {
  for (const record of store.history) reveal(record.target, record.options, true);
  initialize();
}

// ── The factory ───────────────────────────────────────────────────────────────

const failure = (): ScrollRevealInstance => {
  if (hasDom()) document.documentElement.classList.remove('sr');
  return { reveal() {}, clean() {}, destroy() {}, sync() {}, defaults: {} as Config, version: VERSION, noop: true };
};

function isSupported(): boolean {
  if (!hasDom()) return false;
  const s = document.documentElement.style as unknown as Record<string, unknown>;
  return ('transform' in s || 'WebkitTransform' in s) && ('transition' in s || 'WebkitTransition' in s);
}

function mount(): void {
  document.documentElement.classList.add('sr');
  // ScrollReveal does this too; layouts that ship with it may rely on it.
  if (document.body) document.body.style.height = '100%';
  else document.addEventListener('DOMContentLoaded', () => { document.body.style.height = '100%'; }, { once: true });
}

/**
 * Configure and return the ScrollReveal instance. Works with or without `new`;
 * later calls merge their options into the defaults and return the same instance.
 */
function ScrollRevealFactory(options: ScrollRevealOptions = {}): ScrollRevealInstance {
  if (!hasDom() || !isSupported()) return failure();

  let next: Config;
  try {
    next = merge({}, (config ?? defaults()) as unknown as Record<string, unknown>, options) as Config;
    if (!query(next.container)[0]) throw new Error('Invalid container.');
  } catch (e) {
    log('Invalid configuration.', (e as Error).message);
    return failure();
  }
  config = next;

  if ((!config.mobile && isMobile()) || (!config.desktop && !isMobile())) {
    log('This device is disabled.', `desktop: ${config.desktop}`, `mobile: ${config.mobile}`);
    return failure();
  }
  mount();

  if (!instance) {
    instance = {
      reveal: (target, opts) => reveal(target, opts),
      clean,
      destroy,
      sync,
      get defaults() { return config as Config; },
      version: VERSION,
      noop: false,
    };
    Object.defineProperty(instance, 'delegate', { value: delegate });
  }
  return instance;
}

const ScrollReveal = ScrollRevealFactory as unknown as ScrollRevealStatic;
ScrollReveal.isSupported = isSupported;
Object.defineProperty(ScrollReveal, 'debug', {
  get: () => debug,
  set: (value: unknown) => { if (typeof value === 'boolean') debug = value; },
});

export { ScrollReveal };
export default ScrollReveal;
