import { resolveEasing } from '../core/easing';
import { warn } from '../core/env';
import { _register, _unregister } from '../core/registry';
import { watchReducedMotion } from '../core/motion-watch';
import { frameGate } from '../core/frame-gate';
import { computeProgress } from '../core/trigger';
import type { Story, StoryEasing, StoryAnimation } from './story';

export type { Story } from './story';
export type {
  DrawAnimation,
  FadeAnimation,
  StoryAnimation,
  StoryScene,
  StoryEasing,
} from './story';

const SVGNS = 'http://www.w3.org/2000/svg';
const PHOTO_ID = 'cinematic-photo';

export interface CinematicOptions {
  /** Mount point — a selector or element. Becomes the scroll wrapper. */
  wrapper: string | HTMLElement;
}

export interface CinematicInstance {
  /** Stop the scroll loop and detach its listeners (built DOM is left in place). */
  destroy: () => void;
  /** Current global scroll progress through the story (0–1). */
  getProgress: () => number;
}

type AnimRecord =
  | { kind: 'draw'; el: SVGElement; start: number; end: number; ease: (t: number) => number; length: number }
  | { kind: 'fade'; el: HTMLElement | SVGElement; start: number; end: number; ease: (t: number) => number; from: number; to: number };

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

function parsePercent(v: string): number {
  const n = parseFloat(v);
  return Number.isFinite(n) ? clamp01(n / 100) : 0;
}

function easeOf(name: StoryEasing): (t: number) => number {
  return resolveEasing(name);
}

/** An instance with nothing running: no mount (progress 0) or reduced motion (1). */
const still = (progress: number): CinematicInstance => ({ destroy() {}, getProgress: () => progress });

/**
 * The viral loader. Reads a Cinematic Story (authored in the Studio) and wires
 * a scroll-scrubbed timeline: paths stroke themselves on and layers fade in as
 * the user scrolls, all driven off the wrapper's scroll progress.
 *
 *   import { Cinematic } from "svg-scroll-draw";
 *   import story from "./story.json";
 *   new Cinematic({ wrapper: "#app" }).loadStory(story);
 */
export class Cinematic {
  private mount: HTMLElement | null;

  constructor(options: CinematicOptions) {
    if (typeof document === 'undefined') {
      this.mount = null;
      return;
    }
    this.mount =
      typeof options.wrapper === 'string'
        ? document.querySelector<HTMLElement>(options.wrapper)
        : options.wrapper;
    if (!this.mount) warn('Cinematic: wrapper not found:', options.wrapper);
  }

  loadStory(story: Story): CinematicInstance {
    const mount = this.mount;
    if (typeof window === 'undefined' || !mount) return still(0);

    // ── Build the scroll structure ───────────────────────────────────────────
    mount.style.position = 'relative';
    mount.style.height = story.totalHeight;
    mount.style.display = 'block';

    const stage = document.createElement('div');
    stage.setAttribute('data-cinematic-stage', '');
    stage.style.cssText =
      'position:sticky;top:0;height:100vh;width:100%;overflow:hidden;display:block;';
    mount.appendChild(stage);

    const records: AnimRecord[] = [];

    for (const scene of story.scenes) {
      if (scene.background) {
        const img = document.createElement('img');
        img.id = PHOTO_ID;
        img.src = scene.background;
        img.alt = '';
        img.style.cssText =
          'position:absolute;inset:0;width:100%;height:100%;object-fit:contain;opacity:0;pointer-events:none;';
        stage.appendChild(img);
      }

      const drawAnims = scene.animations.filter((a): a is Extract<StoryAnimation, { type: 'draw' }> => a.type === 'draw');
      if (drawAnims.length) {
        const svg = document.createElementNS(SVGNS, 'svg');
        svg.setAttribute('viewBox', `0 0 ${story.canvas.width} ${story.canvas.height}`);
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;overflow:visible;';
        stage.appendChild(svg);

        for (const a of drawAnims) {
          const path = document.createElementNS(SVGNS, 'path');
          path.id = a.target.replace(/^#/, '');
          path.setAttribute('d', a.d);
          path.setAttribute('fill', 'none');
          path.setAttribute('stroke', a.stroke);
          path.setAttribute('stroke-width', String(a.strokeWidth));
          path.setAttribute('stroke-linecap', 'round');
          path.setAttribute('stroke-linejoin', 'round');
          const len = a.length || path.getTotalLength?.() || 0;
          path.style.strokeDasharray = String(len);
          path.style.strokeDashoffset = String(len);
          svg.appendChild(path);
          records.push({
            kind: 'draw',
            el: path,
            start: parsePercent(a.start),
            end: parsePercent(a.end),
            ease: easeOf(a.easing),
            length: len,
          });
        }
      }

      // Fades bind to elements that already exist in the stage (e.g. the photo).
      for (const a of scene.animations) {
        if (a.type !== 'fade') continue;
        const el = stage.querySelector<HTMLElement>(a.target) ?? document.querySelector<HTMLElement>(a.target);
        if (!el) continue;
        el.style.opacity = String(a.from);
        records.push({
          kind: 'fade',
          el,
          start: parsePercent(a.start),
          end: parsePercent(a.end),
          ease: easeOf('ease-in-out'),
          from: a.from,
          to: a.to,
        });
      }
    }

    // ── Progress + apply ──────────────────────────────────────────────────────
    let progress = 0;

    // What scrolls the story: the nearest ancestor that is a scroll container
    // and overflows (a scrolling div, or the body under html { overflow: hidden }),
    // else the window. Up to 2.23.6 progress came from the mount's live rect,
    // which followed any scroller; the window alone left those stories on their
    // first frame. The body's own overflow is the viewport's while html's is
    // visible: then the window scrolls and body.scrollTop stays 0.
    // /[ao]/ is auto, scroll or overlay: not visible, hidden or clip.
    let sc: HTMLElement | null = null;
    // Up to <html>, which has no parent: its scroll is the window's.
    for (let n = mount.parentElement; n?.parentElement; n = n.parentElement) {
      if (
        /[ao]/.test(getComputedStyle(n).overflowY) &&
        n.scrollHeight > n.clientHeight &&
        (n !== document.body || /[aoh]/.test(getComputedStyle(n.parentElement).overflowY))
      ) {
        sc = n;
        break;
      }
    }

    // The scroll window is the mount's own scrollable span: progress runs 0 → 1
    // from its top reaching the scrollport top until its bottom reaches the
    // bottom. Measured once and kept (core/frame-gate re-measures it on a resize
    // or a layout change): reading the mount's rect every frame forces layout.
    // In a container, the offset inside its content, from inside its border
    // (core/trigger-frame), already includes its scroll position.
    let tStart = 0;
    let tEnd = 0;
    const measure = (): void => {
      const top = mount.getBoundingClientRect().top;
      tStart = sc ? top - sc.getBoundingClientRect().top - sc.clientTop + sc.scrollTop : top + window.scrollY;
      tEnd = tStart + Math.max(0, mount.offsetHeight - (sc ? sc.clientHeight : window.innerHeight));
    };
    /** Where the scroll is through the window, from the cache: no layout read. */
    const at = (): number => {
      const y = sc ? sc.scrollTop : window.scrollY;
      // No scroll room: done once its top passes the scrollport top.
      return tEnd <= tStart ? (y >= tStart ? 1 : 0) : computeProgress(y, tStart, tEnd, 1);
    };

    const apply = (global: number): void => {
      for (const r of records) {
        const span = r.end - r.start;
        const local = span <= 0 ? (global >= r.end ? 1 : 0) : clamp01((global - r.start) / span);
        const alpha = r.ease(local);
        if (r.kind === 'draw') {
          r.el.style.strokeDashoffset = String(r.length * (1 - alpha));
        } else {
          r.el.style.opacity = String(r.from + (r.to - r.from) * alpha);
        }
      }
    };

    // ── Reduced motion: jump to the finished frame, no scrubbing ──────────────
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      apply(1);
      return still(1);
    }

    // ── Frames from the scroll window ─────────────────────────────────────────
    // Up to 2.23.6 the frames ran while an IntersectionObserver saw the sticky
    // stage. A jump past the mount (the End key, an anchor link, the scroll a
    // reload restores) never had the stage on screen, so the story kept its
    // first frame. The window decides now, as for every other engine.
    const frame = (): void => {
      progress = at();
      apply(progress);
    };
    measure();
    // Paint the correct frame immediately (in case we load mid-scroll).
    frame();
    const gate = frameGate(sc || window, [mount], at, frame, measure);

    _register(mount, {
      type: 'draw',
      getProgress: () => progress,
      getTrigger: () => ({ tStart, tEnd }),
    });

    // Reduced motion turned on mid-visit: the finished frame, no more scrubbing,
    // as a page loaded under it would show. One way (core/motion-live).
    const unwatchMotion = watchReducedMotion((reduced) => {
      if (!reduced) return;
      unwatchMotion();
      gate.off();
      _unregister(mount);
      progress = 1;
      apply(1);
    });

    return {
      destroy() {
        unwatchMotion();
        gate.off();
        _unregister(mount);
      },
      getProgress: () => progress,
    };
  }
}
