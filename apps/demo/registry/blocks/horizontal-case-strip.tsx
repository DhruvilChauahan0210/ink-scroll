'use client';

/**
 * horizontal-case-strip — a row of case-study cards that slides sideways as the
 * reader scrolls down. The stage holds still while the row crosses it, and a
 * count and a progress rail show how far along the reader is.
 *
 * Built on svg-scroll-draw (MIT): https://svg-scroll-draw.vercel.app/blocks
 * Needs: react, svg-scroll-draw 2.18.1 or later (`scrollHorizontal` from
 * `svg-scroll-draw/horizontal`, measured against the sticky stage).
 * Styling: Tailwind CSS.
 *
 * Uses scrollHorizontal (svg-scroll-draw/horizontal) with no distance and no
 * trigger: it finds the sticky stage, moves the row by its width minus the
 * stage's, and measures again when the window, the page, the row or the section
 * changes size. Its onProgress drives the count and the rail. Before 2.18.1 the
 * row moved by its width minus the window's, so the stage's side padding left
 * the end of the last case off screen.
 *
 * The section is the row's travel plus one screen tall, so a pixel of scroll
 * moves the row a pixel at any width. The stage sticks with CSS
 * `position: sticky`: keep the block out of any ancestor with
 * `overflow: hidden`, and if a reset stops sideways scrolling on html or body,
 * use `overflow-x: clip` there instead. Cards are sized against the stage, not
 * the window, so the block works in a page container as well as full width.
 *
 * Tab reaches every case, including the ones still off to the right: the page
 * scrolls to the point where the focused case is in view.
 *
 * Reduced motion: scrollHorizontal keeps scrubbing on purpose, because holding
 * the row at its end would hide every case but the last. This block has a
 * layout that needs no movement, so visitors who ask for reduced motion get the
 * cases as a plain grid, with no sticky stage, and the block switches over if
 * the setting changes while the page is open.
 *
 * Props: heading, cases (client, title, text, meta, href, and cover: line-art
 * paths in a 200 × 150 box), linkLabel, className (on the outer section).
 */

import { useEffect, useId, useRef } from 'react';
import { scrollHorizontal } from 'svg-scroll-draw/horizontal';

export interface CaseStudy {
  /** Who the work was for. Shown before the title, and read after the link text. */
  client: string;
  title: string;
  /** One or two sentences. */
  text: string;
  /** Discipline and year, e.g. 'Packaging · 2025'. */
  meta: string;
  href: string;
  /** The cover's line drawing: SVG path `d` strings in a 200 × 150 box, stroked, not filled. */
  cover: string[];
}

export interface HorizontalCaseStripProps {
  heading?: string;
  cases?: CaseStudy[];
  /** Visible text of each case's link. Screen readers also hear the client's name. */
  linkLabel?: string;
  /** Classes for the outer section, e.g. a background colour. Not overflow-hidden: it unsticks the stage. */
  className?: string;
}

const DEFAULT_CASES: CaseStudy[] = [
  {
    client: 'Tidewater Ferries',
    title: 'A timetable you can read from the pier',
    text: 'Signs and a printed timetable for six crossings, set large enough to read with a bag in each hand.',
    meta: 'Wayfinding · 2025',
    href: '/work/tidewater-ferries',
    cover: [
      'M 40 92 L 160 92 L 148 108 L 52 108 Z',
      'M 70 92 V 76 H 128 V 92',
      'M 112 76 V 62 H 122 V 76',
      'M 20 122 q 10 -8 20 0 t 20 0 t 20 0 t 20 0 t 20 0 t 20 0 t 20 0 t 20 0',
    ],
  },
  {
    client: 'Hollow Oak Bakery',
    title: 'Boxes that survive the bike courier',
    text: 'A fold-flat box for loaves and tarts, tested on cobbles, that the bakery folds in eleven seconds.',
    meta: 'Packaging · 2025',
    href: '/work/hollow-oak-bakery',
    cover: [
      'M 60 62 L 100 46 L 140 62 L 140 108 L 100 124 L 60 108 Z',
      'M 60 62 L 100 78 L 140 62 M 100 78 V 124',
      'M 82 54 Q 100 34 118 54',
    ],
  },
  {
    client: 'Northfield Library',
    title: 'Late returns, without the guilt',
    text: 'Reminder letters and a returns page rewritten so that people come back instead of staying away.',
    meta: 'Service design · 2024',
    href: '/work/northfield-library',
    cover: [
      'M 58 50 V 112 H 74 V 50 Z',
      'M 78 42 V 112 H 92 V 42 Z',
      'M 100 56 L 113 52 L 130 110 L 117 114 Z',
      'M 44 112 H 156',
    ],
  },
  {
    client: 'Meridian Cycling Club',
    title: 'Route maps that fold into a jersey pocket',
    text: 'Twelve club routes on one sheet, with the climbs drawn to scale and the cafés where they matter.',
    meta: 'Print · 2024',
    href: '/work/meridian-cycling-club',
    cover: [
      'M 40 52 L 80 42 L 120 52 L 160 42 V 108 L 120 118 L 80 108 L 40 118 Z',
      'M 80 42 V 108 M 120 52 V 118',
      'M 52 100 C 70 80 90 96 104 76 S 138 72 148 58',
    ],
  },
];

/** Custom property on the section that holds the row's travel, in px. */
const TRAVEL = '--case-strip-travel';

/** How far the row travels: its width minus the stage's content box. */
function travelOf(stage: HTMLElement, track: HTMLElement): number {
  const cs = getComputedStyle(stage);
  const seen = stage.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  return Math.max(0, track.scrollWidth - seen);
}

/** Focus from the keyboard or a screen reader, not from a pointer. */
function isKeyboardFocus(el: Element): boolean {
  try {
    return el.matches(':focus-visible');
  } catch {
    // A browser without :focus-visible: keep the keyboard path working.
    return true;
  }
}

/** Starts the strip: runway height, scrub, count, rail and keyboard. Returns its cleanup. */
function startStrip(
  runway: HTMLElement,
  stage: HTMLElement,
  track: HTMLElement,
  count: HTMLElement | null,
  fill: HTMLElement | null,
): () => void {
  const last = Math.max(0, track.children.length - 1);

  // A pixel of scroll moves the row a pixel: the runway is the row's travel
  // plus the one screen the stage stays stuck for. Set before scrollHorizontal,
  // so its first measurement already sees the right runway; after that the
  // observer keeps the height current, and the strip follows it on its own.
  const fit = () => runway.style.setProperty(TRAVEL, `${travelOf(stage, track)}px`);
  fit();
  const resize = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(fit);
  resize?.observe(track);
  resize?.observe(stage);

  // -1, not 0, so the first call always writes the count, even when a re-run
  // finds another number left on screen.
  let shown = -1;
  const strip = scrollHorizontal(track, {
    onProgress: (p) => {
      if (fill) fill.style.transform = `scaleX(${p})`;
      // The nearest case: with four, it ticks over at 1/6, 1/2 and 5/6.
      const i = Math.round(p * last);
      if (i !== shown && count) {
        count.textContent = String(i + 1).padStart(2, '0');
        shown = i;
      }
    },
  });

  // The stage cannot scroll (overflow: clip), so a case reached with Tab is
  // brought into view by scrolling the page to it, on the next frame: the
  // browser runs its own scroll to the focused link after focusin, and undoes
  // one made inside the handler.
  let frame = 0;
  const onFocus = (e: FocusEvent) => {
    const target = e.target as Element;
    // Keyboard focus only. Chrome focuses a link on mousedown, and a row that
    // moves before mouseup puts the click on the row instead of the link, so
    // clicking the second case's link did nothing.
    if (!isKeyboardFocus(target)) return;
    const item = target.closest('li');
    if (!item || item.parentElement !== track) return;
    const travel = travelOf(stage, track);
    // How far into the row the case starts. Both boxes carry the same
    // translateX, so it cancels out.
    const at = item.getBoundingClientRect().left - track.getBoundingClientRect().left;
    const p = travel > 0 ? Math.min(1, at / travel) : 0;
    const top = runway.getBoundingClientRect().top + window.scrollY + p * (runway.offsetHeight - window.innerHeight);
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => window.scrollTo({ top }));
  };
  track.addEventListener('focusin', onFocus);

  return () => {
    cancelAnimationFrame(frame);
    track.removeEventListener('focusin', onFocus);
    resize?.disconnect();
    // Puts the row's own inline transform back.
    strip.destroy();
    runway.style.removeProperty(TRAVEL);
  };
}

export function HorizontalCaseStrip({
  heading = 'Selected work',
  cases = DEFAULT_CASES,
  linkLabel = 'Read the case study',
  className = '',
}: HorizontalCaseStripProps) {
  const headingId = useId();
  const runwayRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLOListElement>(null);
  const countRef = useRef<HTMLElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const runway = runwayRef.current;
    const stage = stageRef.current;
    const track = trackRef.current;
    if (!runway || !stage || !track) return;

    // No strip when reduced motion is asked for: the motion-safe: classes
    // below already leave the cases as a grid. Follows the setting live.
    const reduce = typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)')
      : null;
    let stop: (() => void) | undefined;
    const sync = () => {
      stop?.();
      stop = reduce?.matches
        ? undefined
        : startStrip(runway, stage, track, countRef.current, fillRef.current);
    };
    sync();
    reduce?.addEventListener('change', sync);

    // StrictMode mounts effects twice in development: the cleanup restores the
    // row's transform and the section's height, so the second run starts clean.
    return () => {
      reduce?.removeEventListener('change', sync);
      stop?.();
    };
    // Re-run only when the number of cases changes: a new array with the same
    // cases changes nothing the strip measured, and a resize is followed anyway.
  }, [cases.length]);

  const total = String(cases.length).padStart(2, '0');

  return (
    // The runway: the scroll room the stage sticks inside. Its height is the
    // row's travel (set from the effect) plus one screen; svh where supported,
    // so a phone's collapsing toolbar does not change it.
    <section
      ref={runwayRef}
      aria-labelledby={headingId}
      className={`text-neutral-950 dark:text-neutral-50 motion-safe:h-[calc(var(--case-strip-travel,200vh)_+_100vh)] motion-safe:supports-[height:100svh]:h-[calc(var(--case-strip-travel,200vh)_+_100svh)] ${className}`}
    >
      {/* The stage. overflow-clip, not overflow-hidden: a hidden box can still
          be scrolled by focus, which shifts the whole row and leaves it
          shifted. minmax(0,1fr) columns: an auto column would grow to the
          row's full width and take the header with it. container-type lets the
          cards size against the stage rather than the window. */}
      <div
        ref={stageRef}
        className="box-border grid grid-cols-[minmax(0,1fr)] gap-[clamp(20px,4vh,40px)] px-[6vw] py-[clamp(24px,7vh,72px)] [container-type:inline-size] motion-safe:sticky motion-safe:top-0 motion-safe:h-screen motion-safe:supports-[height:100svh]:h-[100svh] motion-safe:grid-rows-[auto_minmax(0,1fr)] motion-safe:overflow-clip"
      >
        <header className="flex items-center gap-4">
          <h2 id={headingId} className="text-[clamp(24px,3vw,36px)] font-semibold leading-[1.1] tracking-[-0.01em]">
            {heading}
          </h2>
          {/* Both aria-hidden: the list already tells a screen reader how many
              cases there are. */}
          <p
            aria-hidden="true"
            className="ml-auto flex-none whitespace-nowrap font-mono text-[13px] font-medium leading-none tabular-nums motion-reduce:hidden"
          >
            <b ref={countRef}>01</b> / {total}
          </p>
          <span
            aria-hidden="true"
            className="relative h-0.5 flex-[0_0_min(24vw,200px)] bg-neutral-200 motion-reduce:hidden dark:bg-neutral-800"
          >
            <span ref={fillRef} className="absolute inset-0 origin-left bg-current [transform:scaleX(0)]" />
          </span>
        </header>

        {/* The row: as wide as its cases (w-max), so it can be measured and
            moved, and never narrower than the stage (min-w-full), so a row that
            already fits is not pushed the wrong way. role="list": Safari drops
            the list role from a list styled list-style: none, and the count
            above is hidden on the promise that the list gives it. */}
        <ol
          ref={trackRef}
          role="list"
          className="m-0 grid list-none gap-6 p-0 sm:grid-cols-2 motion-safe:flex motion-safe:w-max motion-safe:min-w-full"
        >
          {cases.map((c, i) => (
            // Narrower than the stage (cqw: the stage's width, wherever it is
            // placed), so the next case shows at the edge and the reader can
            // tell the row goes on.
            <li
              key={`${c.client}-${c.title}`}
              className="flex min-h-0 flex-col motion-safe:w-[min(78cqw,520px)]"
            >
              {/* Fills the height the text leaves, down to nothing on a short screen. */}
              <svg
                viewBox="0 0 200 150"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="box-border aspect-[4/3] w-full rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950 motion-safe:aspect-auto motion-safe:min-h-0 motion-safe:flex-[1_1_auto]"
              >
                {c.cover.map((d, j) => (
                  <path key={j} d={d} />
                ))}
              </svg>
              <p className="mt-4 font-mono text-xs font-semibold leading-none text-[#3056d3] dark:text-[#8aa4ff]">
                {String(i + 1).padStart(2, '0')} · {c.client}
              </p>
              <h3 className="mb-1.5 mt-2 text-[clamp(19px,2vw,24px)] font-semibold leading-[1.2]">{c.title}</h3>
              <p className="max-w-[44ch] text-[15px] leading-[1.55] text-neutral-700 dark:text-neutral-300">{c.text}</p>
              <p className="mt-2 text-[13px] leading-[1.4] text-neutral-600 dark:text-neutral-400">{c.meta}</p>
              <a
                href={c.href}
                className="mt-2.5 self-start text-[15px] font-medium leading-[1.4] underline underline-offset-[3px] focus-visible:outline-offset-[3px] focus-visible:[outline:2px_solid_#3056d3] dark:focus-visible:[outline-color:#8aa4ff]"
              >
                {linkLabel}
                <span className="sr-only">: {c.client}</span>
              </a>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export default HorizontalCaseStrip;
