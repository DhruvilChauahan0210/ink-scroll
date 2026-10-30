/**
 * svg-scroll-draw/aos — a drop-in replacement for AOS (Animate On Scroll).
 *
 * AOS is the most-installed reveal-on-scroll library and has not shipped since
 * 2.3.4. This entry speaks its API and its markup, so moving off it is an import
 * change: `AOS.init()`, `AOS.refresh()`, `AOS.refreshHard()`, every `data-aos-*`
 * attribute, the `aos-init` / `aos-animate` classes and the `aos:in` / `aos:out`
 * events behave as they do in AOS. The stylesheet ships inside the module, so
 * `aos.css` goes away too.
 *
 * Trigger maths follow AOS (positions from the offsetTop chain, so the initial
 * transform does not move the trigger), including its quirk that an inline
 * `data-aos-anchor-placement` without `data-aos-offset` uses offset 0.
 *
 * Deliberate differences, all documented:
 *   - `prefers-reduced-motion: reduce` shows every element in its final state.
 *   - `disable: 'phone' | 'tablet' | 'mobile'` uses viewport width, not a UA sniff.
 *   - `throttleDelay` / `debounceDelay` are accepted and ignored: scroll work is
 *     batched per animation frame.
 *   - `destroy()` exists, for single-page apps.
 */
import { prefersReducedMotion } from '../core/motion';
import { warn } from '../core/env';

// ── Types ─────────────────────────────────────────────────────────────────────

export type AOSAnchorPlacement =
  | 'top-bottom' | 'top-center' | 'top-top'
  | 'center-bottom' | 'center-center' | 'center-top'
  | 'bottom-bottom' | 'bottom-center' | 'bottom-top';

export interface AOSOptions {
  /** Px from the trigger point before the animation starts. Default 120. */
  offset?: number;
  /** Ms to wait before animating in. Default 0. */
  delay?: number;
  /** Animation length in ms. Default 400. */
  duration?: number;
  /** An AOS easing name (`'ease-out-back'`…) or any CSS timing function. Default `'ease'`. */
  easing?: string;
  /** Animate only the first time the element scrolls in. Default false. */
  once?: boolean;
  /** Animate out again when the element scrolls past the top. Default false. */
  mirror?: boolean;
  /** Which edge of the element meets which edge of the window. Default `'top-bottom'`. */
  anchorPlacement?: AOSAnchorPlacement;
  /** Skip animations entirely: a boolean, a predicate, or a viewport class. */
  disable?: boolean | 'phone' | 'tablet' | 'mobile' | (() => boolean);
  /** Document event that starts AOS. Default `'DOMContentLoaded'`. */
  startEvent?: string;
  /** Do not watch the DOM for new `[data-aos]` elements. Default false. */
  disableMutationObserver?: boolean;
  /** Class added at init. Default `'aos-init'`. */
  initClassName?: string;
  /** Class added while animated in. Default `'aos-animate'`. */
  animatedClassName?: string;
  /** Also add the `data-aos` value as classes (for animate.css-style sets). Default false. */
  useClassNames?: boolean;
  /** Accepted for compatibility; scroll handling is batched per frame instead. */
  throttleDelay?: number;
  /** Accepted for compatibility; resize handling is debounced internally. */
  debounceDelay?: number;
}

interface Item {
  node: HTMLElement;
  in: number;
  out: number;
  once: boolean;
  mirror: boolean;
  animated: boolean;
  classes: string[];
  id: string | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const DEFAULTS: Required<Omit<AOSOptions, 'disable'>> & { disable: AOSOptions['disable'] } = {
  offset: 120,
  delay: 0,
  duration: 400,
  easing: 'ease',
  once: false,
  mirror: false,
  anchorPlacement: 'top-bottom',
  disable: false,
  startEvent: 'DOMContentLoaded',
  disableMutationObserver: false,
  initClassName: 'aos-init',
  animatedClassName: 'aos-animate',
  useClassNames: false,
  throttleDelay: 99,
  debounceDelay: 50,
};

/** AOS's named easings, as the cubic-béziers its stylesheet uses. */
const EASINGS: Record<string, string> = {
  'ease-in-back': 'cubic-bezier(.6,-.28,.735,.045)',
  'ease-out-back': 'cubic-bezier(.175,.885,.32,1.275)',
  'ease-in-out-back': 'cubic-bezier(.68,-.55,.265,1.55)',
  'ease-in-sine': 'cubic-bezier(.47,0,.745,.715)',
  'ease-out-sine': 'cubic-bezier(.39,.575,.565,1)',
  'ease-in-out-sine': 'cubic-bezier(.445,.05,.55,.95)',
  'ease-in-quad': 'cubic-bezier(.55,.085,.68,.53)',
  'ease-out-quad': 'cubic-bezier(.25,.46,.45,.94)',
  'ease-in-out-quad': 'cubic-bezier(.455,.03,.515,.955)',
  'ease-in-cubic': 'cubic-bezier(.55,.055,.675,.19)',
  'ease-out-cubic': 'cubic-bezier(.215,.61,.355,1)',
  'ease-in-out-cubic': 'cubic-bezier(.645,.045,.355,1)',
  'ease-in-quart': 'cubic-bezier(.895,.03,.685,.22)',
  'ease-out-quart': 'cubic-bezier(.165,.84,.44,1)',
  'ease-in-out-quart': 'cubic-bezier(.77,0,.175,1)',
};

const STYLE_ID = 'svg-scroll-draw-aos';

/*
 * The animations, mirroring aos.css 2.3.4 rule for rule: the same selectors (and
 * so the same specificity), the same transforms, the same end states —
 * `translateZ(0)` included, since it creates a stacking context a layout may
 * depend on. Custom animations written against AOS's docs keep working. Timing
 * comes from custom properties set per element instead of AOS's 60 generated
 * duration/delay rules; the delay applies only on the way in, as in AOS.
 */
const T = (x: string, y: string) => `translate3d(${x},${y},0)`;
const FROM: Array<[string, string]> = [
  ['fade-up', T('0', '100px')], ['fade-down', T('0', '-100px')],
  ['fade-right', T('-100px', '0')], ['fade-left', T('100px', '0')],
  ['fade-up-right', T('-100px', '100px')], ['fade-up-left', T('100px', '100px')],
  ['fade-down-right', T('-100px', '-100px')], ['fade-down-left', T('100px', '-100px')],
  ['zoom-in', 'scale(.6)'], ['zoom-out', 'scale(1.2)'],
  ['zoom-in-up', `${T('0', '100px')} scale(.6)`], ['zoom-in-down', `${T('0', '-100px')} scale(.6)`],
  ['zoom-in-right', `${T('-100px', '0')} scale(.6)`], ['zoom-in-left', `${T('100px', '0')} scale(.6)`],
  ['zoom-out-up', `${T('0', '100px')} scale(1.2)`], ['zoom-out-down', `${T('0', '-100px')} scale(1.2)`],
  ['zoom-out-right', `${T('-100px', '0')} scale(1.2)`], ['zoom-out-left', `${T('100px', '0')} scale(1.2)`],
  ['slide-up', T('0', '100%')], ['slide-down', T('0', '-100%')],
  ['slide-right', T('-100%', '0')], ['slide-left', T('100%', '0')],
  ['flip-left', 'perspective(2500px) rotateY(-100deg)'], ['flip-right', 'perspective(2500px) rotateY(100deg)'],
  ['flip-up', 'perspective(2500px) rotateX(-100deg)'], ['flip-down', 'perspective(2500px) rotateX(100deg)'],
];

function css(animated: string): string {
  const a = `.${animated}`;
  const fam = (f: string) => `[data-aos^=${f}][data-aos^=${f}]`;
  return [
    '[data-aos][data-aos]{transition-duration:var(--aos-duration,400ms);transition-timing-function:var(--aos-easing,ease);transition-delay:0s}',
    `[data-aos][data-aos]${a}{transition-delay:var(--aos-delay,0ms)}`,
    `${fam('fade')}{opacity:0;transition-property:opacity,transform}`,
    `${fam('fade')}${a}{opacity:1;transform:translateZ(0)}`,
    `${fam('zoom')}{opacity:0;transition-property:opacity,transform}`,
    `${fam('zoom')}${a}{opacity:1;transform:translateZ(0) scale(1)}`,
    `${fam('slide')}{transition-property:transform}`,
    `${fam('slide')}${a}{transform:translateZ(0)}`,
    `${fam('flip')}{backface-visibility:hidden;transition-property:transform}`,
    ...FROM.map(([name, t]) => `[data-aos=${name}]{transform:${t}}`),
    ...['left', 'right'].map((d) => `[data-aos=flip-${d}]${a}{transform:perspective(2500px) rotateY(0)}`),
    ...['up', 'down'].map((d) => `[data-aos=flip-${d}]${a}{transform:perspective(2500px) rotateX(0)}`),
    '[data-aos-instant][data-aos-instant]{transition:none!important}',
  ].join('\n');
}

// ── State (a singleton, like AOS) ─────────────────────────────────────────────

let opts: typeof DEFAULTS = { ...DEFAULTS };
let items: Item[] = [];
let started = false;
let rafId = 0;
let resizeTimer: ReturnType<typeof setTimeout> | undefined;
let observer: MutationObserver | null = null;
let startListener: { target: EventTarget; type: string; fn: () => void } | null = null;
let reduced = false;

const hasDom = (): boolean => typeof window !== 'undefined' && typeof document !== 'undefined';

// ── Geometry ──────────────────────────────────────────────────────────────────

/** Document top via the offsetTop chain, so the element's own transform is ignored (as in AOS). */
function docTop(el: Element): number {
  if (!(el instanceof HTMLElement)) return el.getBoundingClientRect().top + window.scrollY;
  let y = 0;
  let node: HTMLElement | null = el;
  while (node) {
    y += node.offsetTop - (node.tagName !== 'BODY' ? node.scrollTop : 0);
    node = node.offsetParent as HTMLElement | null;
  }
  return y;
}

const height = (el: Element): number => (el instanceof HTMLElement ? el.offsetHeight : el.getBoundingClientRect().height);

function attr(el: Element, name: string): string | null {
  return el.getAttribute(`data-aos-${name}`);
}

/** As AOS reads `data-aos-once`: only "true" and "false" override the global option. */
function bool(el: Element, name: string, fallback: boolean): boolean {
  const v = attr(el, name);
  return v === 'true' ? true : v === 'false' ? false : fallback;
}

/**
 * AOS 2.3.4's offset rule, quirks included: a numeric `data-aos-offset` wins; an
 * inline offset or anchor placement without a usable number means 0; only with
 * neither does the global offset apply.
 */
function offsetFor(el: Element, placementAttr: string | null): number {
  const v = attr(el, 'offset');
  if (v && !isNaN(Number(v))) return parseInt(v, 10);
  return v || placementAttr ? 0 : opts.offset;
}

function positionIn(el: HTMLElement): number {
  const vh = window.innerHeight;
  const placementAttr = attr(el, 'anchor-placement') as AOSAnchorPlacement | null;
  const offset = offsetFor(el, placementAttr);
  const anchorSel = attr(el, 'anchor');
  const found = anchorSel ? document.querySelector(anchorSel) : null;
  if (anchorSel && !found) warn(`aos: data-aos-anchor="${anchorSel}" matches nothing; using the element itself`);
  const anchor = found || el;
  const h = height(anchor);
  let p = docTop(anchor) - vh;
  switch (placementAttr || opts.anchorPlacement) {
    case 'center-bottom': p += h / 2; break;
    case 'bottom-bottom': p += h; break;
    case 'top-center': p += vh / 2; break;
    case 'center-center': p += vh / 2 + h / 2; break;
    case 'bottom-center': p += vh / 2 + h; break;
    case 'top-top': p += vh; break;
    case 'bottom-top': p += vh + h; break;
    case 'center-top': p += vh + h / 2; break;
    default: break; // top-bottom
  }
  return p + offset;
}

/** Where a `mirror` element animates out: its bottom, less the offset, reaching the top. */
function positionOut(el: HTMLElement): number {
  return docTop(el) + height(el) - offsetFor(el, null);
}

// ── Elements ──────────────────────────────────────────────────────────────────

function timing(el: HTMLElement): void {
  const duration = attr(el, 'duration') ?? String(opts.duration);
  const delay = attr(el, 'delay') ?? String(opts.delay);
  const easing = attr(el, 'easing') ?? opts.easing;
  el.style.setProperty('--aos-duration', `${parseFloat(duration) || 0}ms`);
  el.style.setProperty('--aos-delay', `${parseFloat(delay) || 0}ms`);
  el.style.setProperty('--aos-easing', EASINGS[easing] ?? easing);
}

function collect(): void {
  items = Array.from(document.querySelectorAll<HTMLElement>('[data-aos]')).map((node) => {
    const prev = items.find((i) => i.node === node);
    return {
      node,
      in: 0,
      out: 0,
      once: bool(node, 'once', opts.once),
      mirror: bool(node, 'mirror', opts.mirror),
      animated: prev ? prev.animated : node.classList.contains(opts.animatedClassName),
      classes: opts.useClassNames ? (node.getAttribute('data-aos') || '').split(' ').filter(Boolean) : [],
      id: attr(node, 'id'),
    };
  });
  for (const it of items) {
    timing(it.node);
    it.node.classList.add(opts.initClassName);
  }
}

function measure(): void {
  for (const it of items) {
    it.in = positionIn(it.node);
    it.out = positionOut(it.node);
  }
}

function emit(type: 'in' | 'out', it: Item): void {
  document.dispatchEvent(new CustomEvent(`aos:${type}`, { detail: it.node }));
  if (it.id) document.dispatchEvent(new CustomEvent(`aos:${type}:${it.id}`, { detail: it.node }));
}

function show(it: Item): void {
  if (it.animated) return;
  it.animated = true;
  it.node.classList.add(opts.animatedClassName, ...it.classes);
  emit('in', it);
}

function hide(it: Item): void {
  if (!it.animated) return;
  it.animated = false;
  it.node.classList.remove(opts.animatedClassName, ...it.classes);
  emit('out', it);
}

function apply(): void {
  rafId = 0;
  const y = window.scrollY;
  for (const it of items) {
    if (reduced) { show(it); continue; }
    // Strictly past the trigger, as AOS 2.3.4 compares (`scrollY + vh > position`).
    if (it.mirror && !it.once && y > it.out) hide(it);
    else if (y > it.in) show(it);
    else if (!it.once) hide(it);
  }
}

const schedule = (): void => {
  if (!rafId) rafId = requestAnimationFrame(apply);
};

function onResize(): void {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(refresh, 50);
}

const onLoad = (): void => refresh();

function isDisabled(): boolean {
  const d = opts.disable;
  if (typeof d === 'function') return d();
  if (d === true) return true;
  const w = window.innerWidth;
  if (d === 'phone') return w < 768;
  if (d === 'tablet') return w >= 768 && w < 1024;
  if (d === 'mobile') return w < 1024;
  return false;
}

/** As AOS does when disabled: drop the attributes so nothing stays hidden. */
function strip(): void {
  document.querySelectorAll<HTMLElement>('[data-aos]').forEach((el) => {
    for (const name of ['data-aos', 'data-aos-easing', 'data-aos-duration', 'data-aos-delay']) el.removeAttribute(name);
  });
}

function injectStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = css(opts.animatedClassName);
  document.head.appendChild(style);
}

function start(): void {
  if (started) return;
  started = true;
  startListener = null;
  collect();
  if (reduced) {
    // Final state with no transition, then hand back normal transitions.
    for (const it of items) it.node.setAttribute('data-aos-instant', '');
  }
  measure();
  apply();
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', onResize);
  window.addEventListener('load', onLoad);
  if (!opts.disableMutationObserver && typeof MutationObserver !== 'undefined') {
    observer = new MutationObserver((records) => {
      const touched = records.some((r) =>
        [...Array.from(r.addedNodes), ...Array.from(r.removedNodes)].some(
          (n) => n instanceof Element && (n.hasAttribute('data-aos') || n.querySelector('[data-aos]')),
        ),
      );
      if (touched) refreshHard();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Start animating every `[data-aos]` element. Same options as AOS. */
export function init(options: AOSOptions = {}): HTMLElement[] {
  if (!hasDom()) return [];
  if (started || startListener) destroy();
  opts = { ...DEFAULTS, ...options };
  if (isDisabled()) {
    strip();
    return [];
  }
  reduced = prefersReducedMotion();
  injectStyles();

  const ready = document.readyState !== 'loading';
  if (opts.startEvent === 'DOMContentLoaded' && ready) start();
  else if (opts.startEvent === 'load' && document.readyState === 'complete') start();
  else {
    const target: EventTarget = opts.startEvent === 'load' ? window : document;
    const fn = () => start();
    target.addEventListener(opts.startEvent, fn, { once: true });
    startListener = { target, type: opts.startEvent, fn };
  }
  return Array.from(document.querySelectorAll<HTMLElement>('[data-aos]'));
}

/** Recalculate every trigger position (after a layout change). */
export function refresh(): void {
  if (!started) return;
  measure();
  apply();
}

/** Find `[data-aos]` elements again (after adding or removing some), then refresh. */
export function refreshHard(): void {
  if (!started) return;
  if (isDisabled()) {
    strip();
    return;
  }
  collect();
  refresh();
}

/**
 * Stop listening and remove the injected stylesheet. Not in AOS — added for
 * single-page apps that unmount the page AOS was started on. Elements keep
 * whatever classes they have.
 */
export function destroy(): void {
  if (!hasDom()) return;
  if (startListener) startListener.target.removeEventListener(startListener.type, startListener.fn);
  startListener = null;
  cancelAnimationFrame(rafId);
  rafId = 0;
  clearTimeout(resizeTimer);
  window.removeEventListener('scroll', schedule);
  window.removeEventListener('resize', onResize);
  window.removeEventListener('orientationchange', onResize);
  window.removeEventListener('load', onLoad);
  observer?.disconnect();
  observer = null;
  for (const it of items) it.node.removeAttribute('data-aos-instant');
  items = [];
  started = false;
  document.getElementById(STYLE_ID)?.remove();
}

const AOS = { init, refresh, refreshHard, destroy };
export default AOS;

