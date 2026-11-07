/**
 * svg-scroll-draw/vivus — a drop-in replacement for vivus 0.4.
 *
 * vivus draws SVG strokes over time and has not shipped since 0.4.6 (April 2021).
 * This entry speaks its API, so moving off it is an import change:
 * `new Vivus(element, options, callback)`, `play` / `stop` / `reset` /
 * `finish` / `setFrameProgress` / `getStatus` / `destroy` / `recalc`, every
 * animation type (delayed, sync, async, nsync, oneByOne, scenario,
 * scenario-sync), the `start` modes, `file` and `<object>` loading, the
 * `data-start` / `data-duration` / `data-delay` / `data-async` / `data-ignore`
 * attributes and the timing functions. Shapes are turned into <path> elements
 * with the same `d` strings, and the dash values are the same numbers, so the
 * rendered strokes match frame for frame.
 *
 * Like vivus, the clock is the animation frame: `duration` and `delay` are
 * counted in frames, and each frame advances by `speed`.
 *
 * Deliberate difference: under `prefers-reduced-motion: reduce`, `play()`
 * jumps straight to the end it was heading for and still fires its callbacks.
 */
import { prefersReducedMotion } from '../core/motion';
import { watchReducedMotion } from '../core/motion-watch';
import { warn } from '../core/env';

// ── Types ─────────────────────────────────────────────────────────────────────

export type VivusType = 'delayed' | 'sync' | 'async' | 'nsync' | 'oneByOne' | 'scenario' | 'scenario-sync';
export type VivusStart = 'inViewport' | 'manual' | 'autostart';
export type VivusTiming = (x: number) => number;
export type VivusCallback = (instance: Vivus) => void;

export interface VivusOptions {
  type?: VivusType;
  /** Load the SVG from this URL into `element` instead of using markup. */
  file?: string;
  start?: VivusStart;
  /** Animation length in frames. Default 120. */
  duration?: number;
  /** For `delayed`: frames between the first and last path starting. Default duration / 3. */
  delay?: number;
  /** Extra gap in the dash pattern, so the line start never shows early. Default 1. */
  dashGap?: number;
  /** Clone-and-replace each path after every update (an old IE/Edge repaint hack). */
  forceRender?: boolean;
  reverseStack?: boolean;
  selfDestroy?: boolean;
  onReady?: VivusCallback;
  ignoreInvisible?: boolean;
  pathTimingFunction?: VivusTiming;
  animTimingFunction?: VivusTiming;
}

interface PathRecord {
  el: SVGPathElement;
  length: number;
  startAt: number;
  duration: number;
  isResizeSensitive: boolean;
  progress?: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const TYPES: VivusType[] = ['delayed', 'sync', 'async', 'nsync', 'oneByOne', 'scenario', 'scenario-sync'];
const STARTS: VivusStart[] = ['inViewport', 'manual', 'autostart'];

/** vivus's integer parse: a non-negative integer, otherwise the fallback. */
function positiveInt<T>(value: unknown, fallback: T): number | T {
  const n = parseInt(value as string, 10);
  return n >= 0 ? n : fallback;
}

/** vivus accepts an <svg>, a <g>, or a plain SVGElement. Checked per class, since not every DOM defines all three. */
function isSvgElement(el: unknown): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as unknown as Record<string, unknown>;
  const is = (name: string) => typeof w[name] === 'function' && el instanceof (w[name] as typeof Element);
  return is('SVGSVGElement') || is('SVGGElement') || (el as Element)?.constructor === w.SVGElement;
}

// ── Shapes to paths (vivus's Pathformer, same output) ────────────────────────

/** Geometry attributes a shape loses when it becomes a path. */
const GEOMETRY = ['cx', 'cy', 'points', 'r', 'rx', 'ry', 'x', 'x1', 'x2', 'y', 'y1', 'y2'];
const SHAPES = ['line', 'ellipse', 'circle', 'polygon', 'polyline', 'rect'];
const SVG_NS = 'http://www.w3.org/2000/svg';

type Attrs = Record<string, string>;

function polyline(a: Attrs): string {
  let points = a.points.trim().split(' ');
  if (a.points.indexOf(',') === -1) {
    const paired: string[] = [];
    for (let i = 0; i < points.length; i += 2) paired.push(`${points[i]},${points[i + 1]}`);
    points = paired;
  }
  let d = `M${points[0]}`;
  for (let i = 1; i < points.length; i++) if (points[i].indexOf(',') !== -1) d += `L${points[i]}`;
  return d;
}

function ellipse(cxRaw: string, cyRaw: string, rxRaw: string, ryRaw: string): string {
  const rx = parseFloat(rxRaw) || 0;
  const ry = parseFloat(ryRaw) || 0;
  const cx = parseFloat(cxRaw) || 0;
  const cy = parseFloat(cyRaw) || 0;
  const startX = cx - rx;
  const endX = cx + rx;
  return `M${startX},${cy}A${rx},${ry} 0,1,1 ${endX},${cy}A${rx},${ry} 0,1,1 ${startX},${cy}`;
}

const TO_PATH: Record<string, (a: Attrs) => string> = {
  line: (a) => `M${a.x1 || 0},${a.y1 || 0}L${a.x2 || 0},${a.y2 || 0}`,
  rect(a) {
    const x = parseFloat(a.x) || 0;
    const y = parseFloat(a.y) || 0;
    const w = parseFloat(a.width) || 0;
    const h = parseFloat(a.height) || 0;
    if (a.rx || a.ry) {
      let rx = parseInt(a.rx, 10) || -1;
      let ry = parseInt(a.ry, 10) || -1;
      rx = Math.min(Math.max(rx < 0 ? ry : rx, 0), w / 2);
      ry = Math.min(Math.max(ry < 0 ? rx : ry, 0), h / 2);
      const arc = `A ${rx},${ry},0,0,1,`;
      return (
        `M ${x + rx},${y} L ${x + w - rx},${y} ${arc}${x + w},${y + ry} ` +
        `L ${x + w},${y + h - ry} ${arc}${x + w - rx},${y + h} ` +
        `L ${x + rx},${y + h} ${arc}${x},${y + h - ry} ` +
        `L ${x},${y + ry} ${arc}${x + rx},${y}`
      );
    }
    return `M${x} ${y} L${x + w} ${y} L${x + w} ${y + h} L${x} ${y + h} Z`;
  },
  polyline,
  polygon: (a) => `${polyline(a)}Z`,
  ellipse: (a) => ellipse(a.cx, a.cy, a.rx, a.ry),
  circle: (a) => ellipse(a.cx, a.cy, a.r, a.r),
};

/** Replace every line, ellipse, circle, polygon, polyline and rect with an equivalent <path>. */
function shapesToPaths(svg: Element): void {
  for (const shape of Array.from(svg.querySelectorAll(SHAPES.join(',')))) {
    const attrs: Attrs = {};
    for (const { name, value } of Array.from(shape.attributes)) {
      if (GEOMETRY.indexOf(name) !== -1 && value.indexOf('%') !== -1) {
        throw new Error(
          "Pathformer [parseAttr]: a SVG shape got values in percentage. This cannot be transformed into 'path' tags. Please use 'viewBox'.",
        );
      }
      attrs[name] = value;
    }
    const d = TO_PATH[shape.tagName.toLowerCase()](attrs);
    const path = document.createElementNS(SVG_NS, 'path');
    for (const { name, value } of Array.from(shape.attributes)) {
      if (GEOMETRY.indexOf(name) === -1) path.setAttribute(name, value);
    }
    path.setAttribute('d', d);
    shape.parentNode?.replaceChild(path, shape);
  }
}

// ── Vivus ─────────────────────────────────────────────────────────────────────

export class Vivus {
  static LINEAR: VivusTiming = (x) => x;
  static EASE: VivusTiming = (x) => -Math.cos(x * Math.PI) / 2 + 0.5;
  static EASE_OUT: VivusTiming = (x) => 1 - Math.pow(1 - x, 3);
  static EASE_IN: VivusTiming = (x) => Math.pow(x, 3);
  static EASE_OUT_BOUNCE: VivusTiming = (x) => {
    const base = -Math.cos(x * (0.5 * Math.PI)) + 1;
    const rate = Math.pow(base, 1.5);
    const rateR = Math.pow(1 - x, 2);
    const progress = -Math.abs(Math.cos(rate * (2.5 * Math.PI))) + 1;
    return 1 - rateR + progress * rateR;
  };

  el!: Element;
  parentEl!: Element;
  isReady = false;
  type: VivusType = 'delayed';
  start: VivusStart = 'inViewport';
  duration = 120;
  delay: number | null = null;
  dashGap = 1;
  forceRender = false;
  reverseStack = false;
  selfDestroy = false;
  ignoreInvisible = false;
  onReady?: VivusCallback;
  animTimingFunction: VivusTiming = Vivus.LINEAR;
  pathTimingFunction: VivusTiming = Vivus.LINEAR;
  callback: VivusCallback = () => {};
  map: PathRecord[] = [];
  frameLength = 0;
  currentFrame = 0;
  delayUnit = 0;
  speed = 1;
  handle: number | null = null;
  private instanceCallback: VivusCallback | null = null;
  private mustRecalcScale: number | null = null;
  private viewportListener: (() => void) | null = null;
  private unwatchMotion: () => void = () => {};

  constructor(element: string | Element, options?: VivusOptions, callback?: VivusCallback) {
    this.setElement(element, options);
    this.setOptions(options);
    this.setCallback(callback);
    if (this.isReady) this.init();
    // play() reads the preference each time it runs; this covers a drawing that
    // is mid-play when the reader turns reduced motion on: it ends at once, as
    // play() would have ended it (core/motion-live).
    this.unwatchMotion = watchReducedMotion((r) => {
      if (r && this.handle) this.endNow();
    });
  }

  /** The exact end (or start, playing backwards), the callbacks, as under reduced motion. */
  private endNow(): void {
    this.stop();
    // The exact end frame: setFrameProgress(1) rounds, and a scenario's frame
    // length can be fractional, which would leave getStatus() at 'progress'.
    this.currentFrame = this.speed < 0 ? 0 : this.frameLength;
    this.trace();
    if (this.speed > 0 && this.selfDestroy) this.destroy();
    this.finished();
  }

  private setElement(element: string | Element, options?: VivusOptions): void {
    if (element === undefined) throw new Error('Vivus [constructor]: "element" parameter is required');
    let target = element;
    if (typeof target === 'string') {
      const found = document.getElementById(target);
      if (!found) throw new Error('Vivus [constructor]: "element" parameter is not related to an existing ID');
      target = found;
    }
    this.parentEl = target;

    if (options && options.file) {
      const req = new XMLHttpRequest();
      req.addEventListener('load', () => {
        const sandbox = document.createElement('div');
        sandbox.innerHTML = req.responseText;
        const svg = sandbox.querySelector('svg');
        if (!svg) throw new Error(`Vivus [load]: Cannot find the SVG in the loaded file : ${options.file}`);
        this.el = svg;
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        this.parentEl.appendChild(svg);
        this.isReady = true;
        this.init();
      });
      req.open('GET', options.file);
      req.send();
      return;
    }

    if (isSvgElement(target)) {
      this.el = target;
      this.isReady = true;
      return;
    }

    if (target instanceof HTMLObjectElement) {
      const object = target;
      const onLoad = (e?: Event): void => {
        if (this.isReady) return;
        const svg = object.contentDocument && object.contentDocument.querySelector('svg');
        if (!svg && e) throw new Error('Vivus [constructor]: object loaded does not contain any SVG');
        if (!svg) return;
        if (object.getAttribute('built-by-vivus')) {
          this.parentEl.insertBefore(svg, object);
          this.parentEl.removeChild(object);
          svg.setAttribute('width', '100%');
          svg.setAttribute('height', '100%');
        }
        this.el = svg;
        this.isReady = true;
        this.init();
      };
      onLoad();
      if (!this.isReady) object.addEventListener('load', onLoad);
      return;
    }

    throw new Error('Vivus [constructor]: "element" parameter is not valid (or miss the "file" attribute)');
  }

  private setOptions(options?: VivusOptions): void {
    if (options !== undefined && (options === null || options.constructor !== Object)) {
      throw new Error('Vivus [constructor]: "options" parameter must be an object');
    }
    const o: VivusOptions = options || {};
    if (o.type && TYPES.indexOf(o.type) === -1) {
      throw new Error(`Vivus [constructor]: ${o.type} is not an existing animation \`type\``);
    }
    if (o.start && STARTS.indexOf(o.start) === -1) {
      throw new Error(`Vivus [constructor]: ${o.start} is not an existing \`start\` option`);
    }
    this.type = o.type || 'delayed';
    this.start = o.start || 'inViewport';
    const ua = navigator.userAgent;
    const isIE = ua.indexOf('MSIE') !== -1 || ua.indexOf('Trident/') !== -1 || ua.indexOf('Edge/') !== -1;
    this.duration = positiveInt(o.duration, 120) as number;
    this.delay = positiveInt(o.delay, null);
    this.dashGap = positiveInt(o.dashGap, 1) as number;
    this.forceRender = Object.prototype.hasOwnProperty.call(o, 'forceRender') ? !!o.forceRender : isIE;
    this.reverseStack = !!o.reverseStack;
    this.selfDestroy = !!o.selfDestroy;
    this.onReady = o.onReady;
    this.map = [];
    this.ignoreInvisible = Object.prototype.hasOwnProperty.call(o, 'ignoreInvisible') ? !!o.ignoreInvisible : false;
    this.animTimingFunction = o.animTimingFunction || Vivus.LINEAR;
    this.pathTimingFunction = o.pathTimingFunction || Vivus.LINEAR;
    if (this.delay !== null && this.delay >= this.duration) {
      throw new Error('Vivus [constructor]: delay must be shorter than duration');
    }
  }

  private setCallback(callback?: VivusCallback): void {
    if (callback && typeof callback !== 'function') {
      throw new Error('Vivus [constructor]: "callback" parameter must be a function');
    }
    this.callback = callback || (() => {});
  }

  /** Measure every path, set its dashes, and work out when each one draws. */
  mapping(): void {
    let timePoint = 0;
    let totalLength = 0;
    let lengthMeter = 0;
    let hasNonScale = false;
    const paths = Array.from(this.el.querySelectorAll('path'));

    paths.forEach((path, i) => {
      if (this.isInvisible(path)) return;
      const record: PathRecord = { el: path, length: 0, startAt: 0, duration: 0, isResizeSensitive: false };
      let scale = 1;
      if (path.getAttribute('vector-effect') === 'non-scaling-stroke') {
        const rect = path.getBoundingClientRect();
        const box = path.getBBox();
        scale = Math.max(rect.width / box.width, rect.height / box.height);
        record.isResizeSensitive = true;
        hasNonScale = true;
      }
      record.length = Math.ceil(path.getTotalLength() * scale);
      if (isNaN(record.length)) {
        warn('vivus: cannot retrieve a path element length', path);
        return;
      }
      this.map.push(record);
      path.style.strokeDasharray = `${record.length} ${record.length + this.dashGap * 2}`;
      path.style.strokeDashoffset = String(record.length + this.dashGap);
      record.length += this.dashGap;
      totalLength += record.length;
      this.renderPath(i);
    });

    // Development builds only, like every other warning in this library.
    if (hasNonScale) {
      warn('vivus: this SVG contains non-scaling-strokes. Call instance.recalc() when the SVG is resized.');
    }

    totalLength = totalLength === 0 ? 1 : totalLength;
    this.delay = this.delay === null ? this.duration / 3 : this.delay;
    // As in vivus: spread over every <path>, including any that were ignored.
    this.delayUnit = this.delay / (paths.length > 1 ? paths.length - 1 : 1);
    if (this.reverseStack) this.map.reverse();

    this.map.forEach((record, i) => {
      const attrs = (): Attrs => {
        const out: Attrs = {};
        for (const { name, value } of Array.from(record.el.attributes)) out[name] = value;
        return out;
      };
      switch (this.type) {
        case 'delayed':
          record.startAt = this.delayUnit * i;
          record.duration = this.duration - (this.delay as number);
          break;
        case 'oneByOne':
          record.startAt = (lengthMeter / totalLength) * this.duration;
          record.duration = (record.length / totalLength) * this.duration;
          break;
        case 'sync':
        case 'async':
        case 'nsync':
          record.startAt = 0;
          record.duration = this.duration;
          break;
        case 'scenario-sync': {
          const a = attrs();
          record.startAt = timePoint + ((positiveInt(a['data-delay'], this.delayUnit) as number) || 0);
          record.duration = positiveInt(a['data-duration'], this.duration) as number;
          timePoint = a['data-async'] !== undefined ? record.startAt : record.startAt + record.duration;
          this.frameLength = Math.max(this.frameLength, record.startAt + record.duration);
          break;
        }
        case 'scenario': {
          const a = attrs();
          record.startAt = (positiveInt(a['data-start'], this.delayUnit) as number) || 0;
          record.duration = positiveInt(a['data-duration'], this.duration) as number;
          this.frameLength = Math.max(this.frameLength, record.startAt + record.duration);
          break;
        }
      }
      lengthMeter += record.length;
      this.frameLength = this.frameLength || this.duration;
    });
  }

  /** Re-measure `vector-effect: non-scaling-stroke` paths on the next frame (after a resize). */
  recalc(): void {
    if (this.mustRecalcScale) return;
    this.mustRecalcScale = requestAnimationFrame(() => this.performLineRecalc());
  }

  performLineRecalc(): void {
    for (const record of this.map) {
      if (!record.isResizeSensitive) continue;
      const rect = record.el.getBoundingClientRect();
      const box = record.el.getBBox();
      const scale = Math.max(rect.width / box.width, rect.height / box.height);
      record.length = Math.ceil(record.el.getTotalLength() * scale);
      record.el.style.strokeDasharray = `${record.length} ${record.length + this.dashGap * 2}`;
    }
    this.trace();
    this.mustRecalcScale = null;
  }

  /** One frame: advance by `speed`, render, and finish at either end. */
  draw(): void {
    this.currentFrame += this.speed;
    if (this.currentFrame <= 0) {
      this.stop();
      this.reset();
    } else if (this.currentFrame >= this.frameLength) {
      this.stop();
      this.currentFrame = this.frameLength;
      this.trace();
      if (this.selfDestroy) this.destroy();
    } else {
      this.trace();
      this.handle = requestAnimationFrame(() => this.draw());
      return;
    }
    this.finished();
  }

  private finished(): void {
    this.callback(this);
    if (this.instanceCallback) {
      const cb = this.instanceCallback;
      this.instanceCallback = null;
      cb(this);
    }
  }

  /** Render the current frame to every path's dash offset. */
  trace(): void {
    const frame = this.animTimingFunction(this.currentFrame / this.frameLength) * this.frameLength;
    this.map.forEach((record, i) => {
      const progress = this.pathTimingFunction(Math.max(0, Math.min(1, (frame - record.startAt) / record.duration)));
      if (record.progress !== progress) {
        record.progress = progress;
        record.el.style.strokeDashoffset = String(Math.floor(record.length * (1 - progress)));
        this.renderPath(i);
      }
    });
  }

  renderPath(index: number): void {
    const record = this.forceRender && this.map && this.map[index];
    if (!record) return;
    const clone = record.el.cloneNode(true) as SVGPathElement;
    record.el.parentNode?.replaceChild(clone, record.el);
    record.el = clone;
  }

  init(): void {
    this.frameLength = 0;
    this.currentFrame = 0;
    this.map = [];
    shapesToPaths(this.el);
    this.mapping();
    this.starter();
    if (this.onReady) this.onReady(this);
  }

  private starter(): void {
    if (this.start === 'manual') return;
    if (this.start === 'autostart') {
      this.play();
      return;
    }
    const listener = (): void => {
      if (this.isInViewport(this.parentEl, 1)) {
        this.play();
        window.removeEventListener('scroll', listener);
        this.viewportListener = null;
      }
    };
    this.viewportListener = listener;
    window.addEventListener('scroll', listener);
    listener();
  }

  /** `'start'`, `'progress'` or `'end'`. */
  getStatus(): 'start' | 'progress' | 'end' {
    return this.currentFrame === 0 ? 'start' : this.currentFrame === this.frameLength ? 'end' : 'progress';
  }

  reset(): this {
    return this.setFrameProgress(0);
  }

  finish(): this {
    return this.setFrameProgress(1);
  }

  /** Jump to a point (0–1) and render it. */
  setFrameProgress(progress: number): this {
    const p = Math.min(1, Math.max(0, progress));
    this.currentFrame = Math.round(this.frameLength * p);
    this.trace();
    return this;
  }

  /**
   * Animate at `speed` frames per frame (negative plays backwards). The callback
   * may be given alone, as the first argument.
   */
  play(speed?: number | VivusCallback, callback?: VivusCallback): this {
    this.instanceCallback = null;
    let s = speed;
    if (s && typeof s === 'function') {
      this.instanceCallback = s;
      s = undefined;
    } else if (s && typeof s !== 'number') {
      throw new Error('Vivus [play]: invalid speed');
    }
    if (callback && typeof callback === 'function' && !this.instanceCallback) this.instanceCallback = callback;
    this.speed = (s as number) || 1;

    if (prefersReducedMotion()) {
      this.endNow();
      return this;
    }
    if (!this.handle) this.draw();
    return this;
  }

  stop(): this {
    if (this.handle) {
      cancelAnimationFrame(this.handle);
      this.handle = null;
    }
    return this;
  }

  /** Stop and remove every dash style vivus set. */
  destroy(): void {
    this.stop();
    this.unwatchMotion();
    if (this.viewportListener) {
      window.removeEventListener('scroll', this.viewportListener);
      this.viewportListener = null;
    }
    this.map.forEach((record, i) => {
      record.el.style.strokeDashoffset = '';
      record.el.style.strokeDasharray = '';
      this.renderPath(i);
    });
  }

  isInvisible(el: Element): boolean {
    const ignore = el.getAttribute('data-ignore');
    if (ignore !== null) return ignore !== 'false';
    if (this.ignoreInvisible) {
      const rect = el.getBoundingClientRect();
      return !rect.width && !rect.height;
    }
    return false;
  }

  /** Whether `el` is in view; with `h` = 1 its whole height must fit above the fold. */
  isInViewport(el: Element, h = 0): boolean {
    const scrolled = window.pageYOffset || document.documentElement.scrollTop;
    const viewed = scrolled + Math.max(document.documentElement.clientHeight, window.innerHeight);
    const rect = el.getBoundingClientRect();
    const top = scrolled + rect.top;
    return top + rect.height * (h || 0) <= viewed && top + rect.height >= scrolled;
  }
}

export default Vivus;
