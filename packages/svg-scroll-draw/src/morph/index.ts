/**
 * `svg-scroll-draw/morph`: any SVG shape morphs into any other as the page
 * scrolls.
 *
 *   scrollMorph('#icon', { to: '#star' });
 *   scrollMorph('#blob', { to: ['M…', '#logo-letter'] });   // a sequence
 *   const at = interpolatePaths(circleD, starD);            // no scroll, no DOM
 *   at(0.5);                                                 // path data halfway
 *
 * The main entry's `morphTo` pairs the numbers of two path strings in order,
 * so it needs both drawn with the same commands. This entry matches the
 * outlines themselves (./geometry): rings paired by place and size, each
 * pair cut into the same number of cubics by arc length, turned and run the
 * way that moves the points least. Unlike shapes, unlike command lists, any
 * number of subpaths.
 *
 * An entry of its own, like write and subpaths, so the main bundle carries
 * none of it. Its frames run on the shared trigger window (core/frame-gate).
 * No DOM at import.
 */
import { finishWhenReduced } from '../core/motion-live';
import { parseTrigger, computeProgress, computeTriggers } from '../core/trigger';
import { frameGate } from '../core/frame-gate';
import { resolveEasing } from '../core/easing';
import { _register, _unregister } from '../core/registry';
import { warn } from '../core/env';
import type { Easing, ScrollDrawInstance, TriggerConfig } from '../core/types';
import { parsePath, pairRings, matchPair } from './geometry';

const clamp = (n: number) => Math.min(1, Math.max(0, n));

// ── Shapes as path data ───────────────────────────────────────────────────────

const SHAPES = ['path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon'];

/** The attributes a shape's geometry is in, which its <path> stand-in does not carry. */
const GEOMETRY = ['x', 'y', 'width', 'height', 'rx', 'ry', 'cx', 'cy', 'r', 'x1', 'y1', 'x2', 'y2', 'points'];

/**
 * An element's outline as path data, in its own coordinates (a `transform`
 * is not applied): a `<path>`'s `d`; `<rect>` (rounded too), `<circle>`,
 * `<ellipse>`, `<line>`, `<polyline>` and `<polygon>` as the browser draws
 * them, from the same point and in the same direction. Any other element —
 * a `<g>`, an `<svg>`, a `<symbol>` — gives every shape inside it, one after
 * another. Reads attributes only, so it works without layout.
 */
export function shapeToPath(el: Element): string {
  const n = (name: string) => parseFloat(el.getAttribute(name) ?? '') || 0;
  const tag = el.localName;
  if (tag === 'path') return el.getAttribute('d') ?? '';
  if (tag === 'rect') {
    const [x, y, w, h] = [n('x'), n('y'), n('width'), n('height')];
    if (w <= 0 || h <= 0) return '';
    // SVG 2: either radius stands for both when the other is auto.
    const has = (name: string) => el.hasAttribute(name) && el.getAttribute(name) !== 'auto';
    let rx = has('rx') ? n('rx') : has('ry') ? n('ry') : 0;
    let ry = has('ry') ? n('ry') : rx;
    rx = Math.min(Math.abs(rx), w / 2);
    ry = Math.min(Math.abs(ry), h / 2);
    if (!rx || !ry) return `M${x} ${y}H${x + w}V${y + h}H${x}Z`;
    const a = (ex: number, ey: number) => `A${rx} ${ry} 0 0 1 ${ex} ${ey}`;
    return `M${x + rx} ${y}H${x + w - rx}${a(x + w, y + ry)}V${y + h - ry}${a(x + w - rx, y + h)}` +
      `H${x + rx}${a(x, y + h - ry)}V${y + ry}${a(x + rx, y)}Z`;
  }
  if (tag === 'circle' || tag === 'ellipse') {
    const [cx, cy] = [n('cx'), n('cy')];
    const rx = tag === 'circle' ? n('r') : n('rx');
    const ry = tag === 'circle' ? rx : n('ry');
    if (rx <= 0 || ry <= 0) return '';
    const a = (ex: number) => `A${rx} ${ry} 0 0 1 ${ex} ${cy}`;
    return `M${cx + rx} ${cy}${a(cx - rx)}${a(cx + rx)}Z`;
  }
  if (tag === 'line') return `M${n('x1')} ${n('y1')}L${n('x2')} ${n('y2')}`;
  if (tag === 'polyline' || tag === 'polygon') {
    const v = (el.getAttribute('points') ?? '').trim().split(/[\s,]+/).filter(Boolean).map(Number);
    if (v.length < 4) return '';
    let d = '';
    for (let i = 0; i + 1 < v.length; i += 2) d += `${i ? 'L' : 'M'}${v[i]} ${v[i + 1]}`;
    return tag === 'polygon' ? `${d}Z` : d;
  }
  return Array.from(el.querySelectorAll(SHAPES.join())).map(shapeToPath).join('');
}

// ── Interpolating ─────────────────────────────────────────────────────────────

export interface MorphOptions {
  /**
   * Cuts spaced evenly along every outline, besides each shape's own corners
   * and curve joins. More make the in-between shapes follow each outline's
   * length more closely point for point. Default 24.
   */
  points?: number;
  /** Decimal places in the path data written. Default 2. */
  precision?: number;
}

/**
 * Path data from `from` to `to` as `t` goes 0 → 1, for shapes with nothing in
 * common: any commands, any number of subpaths, open or closed. At exactly 0
 * and 1 it returns the two strings as given. `to` may be a list, a sequence
 * each step of which takes an equal share of `t`, landing on every shape in
 * it exactly. Pure — no DOM — so it runs on a server or in a test.
 *
 *   const at = interpolatePaths('M0 0H10V10H0Z', 'M5 0L10 10H0Z');
 *   at(0.5); // halfway from the square to the triangle
 */
export function interpolatePaths(
  from: string,
  to: string | readonly string[],
  options: MorphOptions = {},
): (t: number) => string {
  return sequence([from, ...(typeof to === 'string' ? [to] : to)], options, (t) => t);
}

function sequence(shapes: string[], options: MorphOptions, ease: (t: number) => number): (t: number) => string {
  const legs = shapes.slice(1).map((s, i) => leg(shapes[i], s, options));
  if (!legs.length) return () => shapes[0];
  return (t) => {
    const k = t * legs.length;
    const i = Math.max(0, Math.min(legs.length - 1, Math.floor(k)));
    return legs[i](ease(k - i));
  };
}

/** One shape to the next: the outlines matched once, then numbers mixed per call. */
function leg(from: string, to: string, options: MorphOptions): (t: number) => string {
  const points = Math.max(0, Math.round(options.points ?? 24));
  const scale = 10 ** Math.max(0, Math.min(8, Math.round(options.precision ?? 2)));
  const pairs = pairRings(parsePath(from), parsePath(to)).map(([a, b]) => {
    const [na, nb] = matchPair(a, b, points);
    return { na, nb, z: a.closed && b.closed };
  });
  const r = (v: number) => String(Math.round(v * scale) / scale);
  return (t) => {
    if (t === 0) return from;
    if (t === 1) return to;
    let d = '';
    for (const { na, nb, z } of pairs) {
      const v = (k: number) => r(na[k] + (nb[k] - na[k]) * t);
      d += `M${v(0)} ${v(1)}C`;
      for (let k = 2; k < na.length; k += 2) d += `${k > 2 ? ' ' : ''}${v(k)} ${v(k + 1)}`;
      if (z) d += 'Z';
    }
    return d;
  };
}

// ── scrollMorph ───────────────────────────────────────────────────────────────

/** A shape: path data, a selector, or an element (see shapeToPath). */
export type MorphShape = string | Element;

export interface ScrollMorphOptions extends MorphOptions {
  /**
   * The shape to morph into, or a list of shapes to morph through in turn,
   * each taking an equal share of the scroll window. Each one is path data
   * (a string starting with a moveto), a selector, or an element: a `<path>`,
   * any basic shape, or a `<g>` of them. The element can sit in a hidden
   * `<defs>` or `<template>` — only its attributes are read.
   */
  to: MorphShape | readonly MorphShape[];
  /**
   * The scroll window, on the shape's `<svg>`. Default: from its top 85% down
   * the viewport to its centre at the viewport's centre.
   */
  trigger?: TriggerConfig;
  /** On each step of the sequence. Default `'linear'`. */
  easing?: Easing;
  /** Stay morphed once there. Default false: scrolling back morphs it back. */
  once?: boolean;
  /** Every frame the progress changes, with the progress through the window, 0–1. */
  onProgress?: (progress: number) => void;
  /** When the last shape is reached. Again after scrolling back, unless `once`. */
  onComplete?: () => void;
  /** Write `--scroll-draw-progress` on the shape every frame. Default true. */
  progressVar?: boolean;
}

const NOOP: ScrollDrawInstance = {
  destroy: () => {}, replay: () => {}, pause: () => {},
  resume: () => {}, seek: () => {}, getProgress: () => 0,
};

const $ = (s: string | Element | null | undefined): Element | null =>
  typeof s === 'string' ? document.querySelector(s) : s ?? null;

/** A string that starts with a moveto is path data; any other is a selector. */
const isPathData = (s: string) => /^\s*[Mm]\s*[-+.\d]/.test(s) || !s.trim();

/**
 * Morph `target` — a `<path>`, or any basic shape — into `options.to` as the
 * page scrolls, and back when it scrolls back. A shape other than a `<path>`
 * is swapped for a `<path>` with the same attributes while it runs (a
 * `<circle>` has no `d`); `destroy()` puts the element back as it was, `d`
 * and all.
 *
 * Under `prefers-reduced-motion: reduce` it shows the last shape at once;
 * turned on mid-visit, it jumps there then. Without a DOM it does nothing.
 */
export function scrollMorph(target: string | Element, options: ScrollMorphOptions): ScrollDrawInstance {
  if (typeof window === 'undefined') return NOOP;
  const el = $(target);
  if (!el || !SHAPES.includes(el.localName)) {
    warn(el ? `scrollMorph: not a path or a basic shape: <${el.localName}>` : 'scrollMorph: element not found:', target);
    return NOOP;
  }
  const to = options?.to;
  const list: readonly MorphShape[] = to == null ? [] : Array.isArray(to) ? to : [to as MorphShape];
  const shapes: string[] = [];
  for (const s of list) {
    const found = typeof s === 'string' && isPathData(s) ? s : $(s);
    if (found == null) warn('scrollMorph: shape not found:', s);
    else shapes.push(typeof found === 'string' ? found : shapeToPath(found));
  }
  if (!shapes.length) {
    warn('scrollMorph: nothing to morph to: pass `to`.');
    return NOOP;
  }
  return finishWhenReduced(options, (opts, reduced) => buildMorph(el as SVGElement, shapes, opts, reduced));
}

function buildMorph(el: SVGElement, shapes: string[], options: ScrollMorphOptions, reduced: boolean): ScrollDrawInstance {
  const { trigger = {}, once = false, onProgress, onComplete, progressVar } = options;

  // The shape that morphs: the target, or a <path> standing in for it.
  let path = el;
  if (el.localName !== 'path') {
    path = el.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'path');
    for (const { name, value } of Array.from(el.attributes)) if (!GEOMETRY.includes(name)) path.setAttribute(name, value);
    path.setAttribute('d', shapeToPath(el));
    el.replaceWith(path);
  }
  const d0 = path.getAttribute('d');
  const style0 = path.getAttribute('style');
  const setAttr = (name: string, value: string | null) =>
    value == null ? path.removeAttribute(name) : path.setAttribute(name, value);
  const restore = () => {
    if (path !== el) path.replaceWith(el);
    else {
      setAttr('d', d0);
      setAttr('style', style0);
    }
  };

  const at = sequence([d0 ?? '', ...shapes], options, resolveEasing(options.easing));
  let written = '';
  const draw = (p: number) => {
    const d = at(p);
    if (d !== written) path.setAttribute('d', (written = d));
  };

  if (reduced) {
    draw(1);
    onProgress?.(1);
    onComplete?.();
    return { ...NOOP, destroy: restore, getProgress: () => 1 };
  }

  // The <svg> is the box the window is measured on: the shape's own box
  // changes as it morphs.
  const box = (path as SVGGraphicsElement).ownerSVGElement ?? path;
  const startConfig = parseTrigger(trigger.start || 'top 85%');
  const endConfig = parseTrigger(trigger.end || 'center center');
  let tStart = 0;
  let tEnd = 0;
  let frozen = -1;
  let current = -1;
  let completed = false;

  function measure(): void {
    ({ tStart, tEnd } = computeTriggers(box.getBoundingClientRect(), window.scrollY, window.innerHeight, startConfig, endConfig));
  }

  function apply(p: number): void {
    if (p === current) return;
    current = p;
    if (progressVar !== false) path.style.setProperty('--scroll-draw-progress', String(p));
    draw(p);
    onProgress?.(p);
  }

  const progress = (): number => computeProgress(window.scrollY, tStart, tEnd, 1);

  function frame(): void {
    // With `once`, held at the furthest point.
    const p = once ? (frozen = Math.max(frozen, progress())) : progress();
    apply(p);
    if (p >= 1 && !completed) {
      completed = true;
      onComplete?.();
    } else if (p < 1 && !once) completed = false;
  }

  measure();
  apply(0);
  // A jump past the window still lands on the last shape and fires onComplete.
  const gate = frameGate(window, [box], progress, frame, measure);
  _register(path, { type: 'draw', getProgress: () => current, getTrigger: () => ({ tStart, tEnd }) });
  const resume = (): void => gate.hold(false);

  return {
    destroy() {
      gate.off();
      _unregister(path);
      restore();
    },
    replay() {
      frozen = -1;
      completed = false;
      apply(0);
      resume();
    },
    pause: () => gate.hold(true),
    resume,
    seek(p: number) {
      gate.hold(true);
      apply((frozen = clamp(p)));
    },
    getProgress: () => current,
    refresh: () => gate.remeasure(),
  };
}
