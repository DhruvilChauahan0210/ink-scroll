/**
 * `svg-scroll-draw/follow`: an element that travels along a path as the page
 * scrolls, GSAP's MotionPathPlugin on a scroll.
 *
 *   scrollFollow('#plane', '#route');                       // HTML over an SVG
 *   scrollFollow('#pen', '#route', { rotate: true, draw: true });
 *
 * The path's point at the current length is mapped to wherever the element
 * lives. An element inside the same <svg> (or any <svg>) is moved in its
 * parent's user units, through the transform attribute: the CTMs of its
 * parent and of the path, both read from the screen, cancel every viewBox,
 * group transform and CSS scale in between. Anything else (an HTML element, or
 * a whole <svg>) is moved with a CSS transform, the path's point mapped through
 * getScreenCTM() and taken relative to the element's own untransformed box,
 * both read at the same moment: what is kept is where the path is from the
 * element, which scrolling does not change, sticky stage or not.
 *
 * JS only. A native path (offset-path with a scroll-driven animation) was
 * weighed and left out: offset-path's path() is in the containing block's CSS
 * pixels, so a path in a scaled viewBox would need its data rewritten on every
 * resize, `rotate` there is the tangent in CSS space only, and the anchor and
 * start/end/easing would each have to be matched across three engines. One
 * transform write a frame, on the shared frame gate, costs little.
 *
 * Its own frame loop on core/frame-gate, as scrollWrite: a jump past the window
 * lands at the end and fires onComplete; a resize or layout change re-measures.
 * No DOM at import.
 */
import { finishWhenReduced } from '../core/motion-live';
import { parseTrigger, computeProgress, computeTriggers } from '../core/trigger';
import { frameGate } from '../core/frame-gate';
import { resolveEasing } from '../core/easing';
import { _register, _unregister } from '../core/registry';
import { warn } from '../core/env';
import type { Easing, ScrollDrawInstance, TriggerConfig } from '../core/types';

const clamp = (n: number) => Math.min(1, Math.max(0, n));

export interface ScrollFollowOptions {
  /**
   * Turn the element to the path's direction as it travels (CSS
   * `offset-rotate: auto`). Default false: it keeps its own orientation.
   */
  rotate?: boolean;
  /**
   * Degrees added to the rotation: with `rotate`, on top of the tangent (the
   * tangent points the element's right side along the path, so an arrow drawn
   * pointing up wants 90); without it, a fixed turn. As CSS
   * `offset-rotate: auto <angle>` and `<angle>`. Default 0.
   */
  angle?: number;
  /**
   * Which point of the element sits on the path, as fractions of its box:
   * `[0, 0]` the top left, `[1, 1]` the bottom right. Default `[0.5, 0.5]`,
   * the centre. For an SVG element, of its bounding box (getBBox()).
   */
  anchor?: [number, number];
  /**
   * Draw the path up to the element as it travels, so it looks like the tip of
   * a pen. Default false.
   */
  draw?: boolean;
  /** Where on the path the run starts, as a fraction of its length. Default 0. */
  start?: number;
  /**
   * Where it ends. Default 1. Less than `start` runs the path backwards.
   */
  end?: number;
  /**
   * The curve from the scroll to the distance travelled: a name, a CSS
   * `cubic-bezier()` or a function. Default `'linear'`.
   */
  easing?: Easing;
  /**
   * The scroll window, on the path's <svg>. Default: from its top at the
   * middle of the viewport to its bottom at the middle, so the element keeps
   * near the middle of the screen as a tall route scrolls past.
   */
  trigger?: TriggerConfig;
  /** Stay at the furthest point reached. Default false: scrolling back runs it back. */
  once?: boolean;
  /** Progress through the scroll window, 0–1, every frame it moves. */
  onProgress?: (progress: number) => void;
  /** When the element reaches the end; again after it is scrolled back and forward, unless `once`. */
  onComplete?: () => void;
  /** Write `--scroll-draw-progress` on the element every frame. Default true. */
  progressVar?: boolean;
}

/** Instances have the shared shape: pause, resume, seek, replay, getProgress, refresh, destroy. */
export type ScrollFollowInstance = ScrollDrawInstance & { refresh: () => void };

const NOOP: ScrollFollowInstance = {
  destroy: () => {}, replay: () => {}, pause: () => {}, resume: () => {},
  seek: () => {}, getProgress: () => 0, refresh: () => {},
};

/** An affine matrix as [a, b, c, d, e, f]: x' = a x + c y + e, y' = b x + d y + f. */
type M = number[];
const ID: M = [1, 0, 0, 1, 0, 0];
const mat = (m: DOMMatrixReadOnly | SVGMatrix | null): M => (m ? [m.a, m.b, m.c, m.d, m.e, m.f] : ID);
/** p · q: q first, then p. */
const mul = (p: M, q: M): M => [
  p[0] * q[0] + p[2] * q[1], p[1] * q[0] + p[3] * q[1],
  p[0] * q[2] + p[2] * q[3], p[1] * q[2] + p[3] * q[3],
  p[0] * q[4] + p[2] * q[5] + p[4], p[1] * q[4] + p[3] * q[5] + p[5],
];
const inv = ([a, b, c, d, e, f]: M): M => {
  const k = a * d - b * c || 1;
  return [d / k, -b / k, -c / k, a / k, (c * f - d * e) / k, (b * e - a * f) / k];
};

const num = (n: number) => String(Math.round(n * 1000) / 1000);

type Styled = Element & ElementCSSInlineStyle;

/**
 * Remember `props` in `el`'s inline style, and a function that puts them back:
 * the same values with the same priority, removed where there were none, and
 * no empty `style=""` left on an element that had no style attribute.
 */
function keepStyle(el: Styled, props: string[]): () => void {
  const had = el.hasAttribute('style');
  const saved = props.map((p) => [p, el.style.getPropertyValue(p), el.style.getPropertyPriority(p)]);
  return () => {
    for (const [p, v, priority] of saved) v ? el.style.setProperty(p, v, priority) : el.style.removeProperty(p);
    if (!had && !el.getAttribute('style')) el.removeAttribute('style');
  };
}

/**
 * Move `target` along `path` as the page scrolls, from `start` to `end` of the
 * path's length (by default all of it) over the scroll window. `target` is a
 * selector or an element, HTML or SVG; `path` a selector or any SVG shape with
 * a length (<path>, <polyline>, <circle>, …).
 *
 * Under `prefers-reduced-motion: reduce` the element is placed at the end at
 * once (the path drawn, with `draw`); turned on mid-visit, it goes there then.
 * `destroy()` puts back the element's inline style (or, for an SVG element,
 * its transform attribute) and the path's exactly. Without a DOM it does nothing.
 */
export function scrollFollow(
  target: string | Element,
  path: string | Element,
  options: ScrollFollowOptions = {},
): ScrollFollowInstance {
  if (typeof window === 'undefined') return NOOP;
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  const line = typeof path === 'string' ? document.querySelector(path) : path;
  if (!el || !line || !('getPointAtLength' in line)) {
    warn('scrollFollow: element or path not found:', el ? path : target);
    return NOOP;
  }
  return finishWhenReduced(options, (opts, reduced) =>
    buildFollow(el as Styled, line as SVGGeometryElement, opts, reduced),
  );
}

function buildFollow(
  el: Styled,
  path: SVGGeometryElement,
  options: ScrollFollowOptions,
  reduced: boolean,
): ScrollFollowInstance {
  const {
    rotate = false,
    angle = 0,
    anchor: [fx, fy] = [0.5, 0.5],
    draw = false,
    start = 0,
    end = 1,
    trigger = {},
    once = false,
    onProgress,
    onComplete,
    progressVar,
  } = options;
  const ease = resolveEasing(options.easing);
  const from = clamp(start);
  const to = clamp(end);
  // An SVG element inside an <svg> moves in its parent's user units; an HTML
  // element, or an outer <svg>, in CSS pixels.
  const inSvg = !!(el as unknown as SVGElement).ownerSVGElement;
  const box = path.ownerSVGElement ?? path;
  const startConfig = parseTrigger(trigger.start || 'top center');
  const endConfig = parseTrigger(trigger.end || 'bottom center');

  const savedTransform = el.getAttribute('transform');
  const restoreEl = keepStyle(el, ['transform', 'transform-origin', '--scroll-draw-progress']);
  // Only with draw: another instance on the same path may be drawing it.
  const restorePath = draw ? keepStyle(path, ['stroke-dasharray', 'stroke-dashoffset']) : () => {};
  if (!inSvg) el.style.transformOrigin = '0 0';

  /** The path's user units → the element's: its parent's units, or px from its box's top left. */
  let m: M = ID;
  /** The anchor, in the element's own units. */
  let ax = 0;
  let ay = 0;
  let len = 0;
  /** Dash units per user unit: pathLength over the real length, or 1. */
  let unit = 1;
  let tStart = 0;
  let tEnd = 0;
  let frozen = -1;
  let current = 0;
  let completed = false;

  function measure(): void {
    len = path.getTotalLength();
    const declared = parseFloat(path.getAttribute('pathLength') ?? '');
    unit = declared > 0 && len > 0 ? declared / len : 1;
    const toScreen = mat(path.getScreenCTM());
    if (inSvg) {
      const parent = el.parentNode as SVGGraphicsElement;
      m = mul(inv(mat(parent.getScreenCTM())), toScreen);
      const b = (el as unknown as SVGGraphicsElement).getBBox();
      ax = b.x + b.width * fx;
      ay = b.y + b.height * fy;
    } else {
      // The box without the transform this writes: apply() puts it back.
      el.style.transform = 'none';
      const r = el.getBoundingClientRect();
      m = mul([1, 0, 0, 1, -r.left, -r.top], toScreen);
      ax = r.width * fx;
      ay = r.height * fy;
    }
    ({ tStart, tEnd } = computeTriggers(box.getBoundingClientRect(), window.scrollY, window.innerHeight, startConfig, endConfig));
  }

  /** The element at `progress` of the window: on the path, turned, and the path drawn up to it. */
  function apply(progress: number): void {
    current = progress;
    if (progressVar !== false) el.style.setProperty('--scroll-draw-progress', String(progress));
    const u = clamp(from + (to - from) * ease(progress));
    const at = u * len;
    const p = path.getPointAtLength(at);
    const x = m[0] * p.x + m[2] * p.y + m[4];
    const y = m[1] * p.x + m[3] * p.y + m[5];
    let turn = angle;
    if (rotate && len > 0) {
      // The tangent from points either side, mapped through the matrix's
      // linear part: a scaled or skewed viewBox turns it too.
      const d = Math.max(len / 1e4, 0.01);
      const a = path.getPointAtLength(Math.max(0, at - d));
      const b = path.getPointAtLength(Math.min(len, at + d));
      const vx = b.x - a.x;
      const vy = b.y - a.y;
      turn += (Math.atan2(m[1] * vx + m[3] * vy, m[0] * vx + m[2] * vy) * 180) / Math.PI;
    }
    // The point on the path, turned about the anchor: the anchor lands on it.
    // The attribute takes bare user units; CSS wants px and deg.
    const move = (a: number, b: number) => (inSvg ? `translate(${num(a)} ${num(b)})` : `translate(${num(a)}px,${num(b)}px)`);
    const t = `${move(x, y)} rotate(${num(turn)}${inSvg ? '' : 'deg'}) ${move(-ax, -ay)}`;
    if (inSvg) el.setAttribute('transform', t);
    else el.style.transform = t;
    if (draw) {
      // core/dash's convention: a gap twice the length, so nothing else of the
      // pattern lands on the path. Drawn is the stretch between the start and
      // the element; with none, the whole dash sits before the path's start.
      const drawn = Math.abs(u - from) * len;
      const gap = num(len * 2 * unit);
      path.style.strokeDasharray = `${num((drawn > 0 ? drawn : len) * unit)} ${gap}`;
      path.style.strokeDashoffset = num((drawn > 0 ? -Math.min(u, from) * len : len) * unit);
    }
    onProgress?.(progress);
  }

  const at = (): number => (reduced ? 1 : computeProgress(window.scrollY, tStart, tEnd, 1));

  function frame(): void {
    // With `once`, held at the furthest point.
    const progress = once ? (frozen = Math.max(frozen, at())) : at();
    apply(progress);
    if (progress >= 1 && !completed) {
      completed = true;
      onComplete?.();
    } else if (progress < 1 && !once) completed = false;
  }

  measure();
  frame();
  // The frames follow the trigger window (core/frame-gate): a jump past it
  // lands at the end and fires onComplete. A resize or a layout change
  // re-measures the path, the element and the window, and puts it back where
  // it was. Under reduced motion at() is 1 throughout: no frames, but the
  // re-measure still keeps the element on the path's end as the <svg> scales.
  const gate = frameGate(window, box === el ? [box] : [box, el], at, frame, () => {
    measure();
    apply(current);
  });
  _register(el, { type: 'animate', getProgress: () => current, getTrigger: () => ({ tStart, tEnd }) });
  const resume = (): void => gate.hold(false);

  return {
    destroy() {
      gate.off();
      _unregister(el);
      restoreEl();
      restorePath();
      if (inSvg) savedTransform === null ? el.removeAttribute('transform') : el.setAttribute('transform', savedTransform);
    },
    replay() {
      if (reduced) return;
      frozen = -1;
      completed = false;
      apply(0);
      resume();
    },
    pause: () => reduced || gate.hold(true),
    resume: () => reduced || resume(),
    seek(p: number) {
      if (reduced) return;
      gate.hold(true);
      apply((frozen = clamp(p)));
    },
    getProgress: () => current,
    refresh: gate.remeasure,
  };
}
