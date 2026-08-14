import { EASINGS } from '../core/utils';
import { warn } from '../core/env';
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
  /** Stop the scroll loop and detach observers (built DOM is left in place). */
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
  return EASINGS[name] ?? EASINGS.linear;
}

const noop: CinematicInstance = { destroy: () => {}, getProgress: () => 0 };

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
    if (typeof window === 'undefined' || !mount) return noop;

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
          ease: EASINGS['ease-in-out'] ?? EASINGS.linear,
          from: a.from,
          to: a.to,
        });
      }
    }

    // ── Progress + apply ──────────────────────────────────────────────────────
    let progress = 0;

    const computeProgress = (): number => {
      const scrollable = mount.offsetHeight - window.innerHeight;
      if (scrollable <= 0) return mount.getBoundingClientRect().top <= 0 ? 1 : 0;
      return clamp01(-mount.getBoundingClientRect().top / scrollable);
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
      return { destroy: () => {}, getProgress: () => 1 };
    }

    // ── rAF loop, gated by visibility ─────────────────────────────────────────
    let rafId = 0;
    let running = false;
    let visible = false;

    const tick = (): void => {
      progress = computeProgress();
      apply(progress);
      if (running) rafId = requestAnimationFrame(tick);
    };
    const start = (): void => {
      if (running) return;
      running = true;
      rafId = requestAnimationFrame(tick);
    };
    const stop = (): void => {
      running = false;
      cancelAnimationFrame(rafId);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          visible = e.isIntersecting;
          if (visible) start();
          else stop();
        }
      },
      { threshold: 0 }
    );
    observer.observe(stage);

    // Paint the correct frame immediately (in case we load mid-scroll).
    progress = computeProgress();
    apply(progress);

    return {
      destroy() {
        stop();
        observer.disconnect();
      },
      getProgress: () => progress,
    };
  }
}
