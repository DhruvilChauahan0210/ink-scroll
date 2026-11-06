'use client';

import './toolkit.css';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { scrollAnimate, scrollDraw, type ScrollDrawInstance } from 'svg-scroll-draw';
import { SELF } from '@/data/competitors';
import { PLATES, PlateArt, SPEED, staggerFor, type PlateKey } from './art/toolkit-art';

/**
 * Chapter 05 — the eight instruments as one long blueprint sheet on a pinned
 * horizontal rail. The stage is as tall as the rail is wide (plus a held
 * beat at each end), so one pixel of wheel moves the sheet one pixel
 * sideways on a desktop; the translate is the library's own scrollAnimate,
 * measured on the tall stage, never on the sticky child.
 *
 * Each plate is inked by its own scrollDraw instance as it crosses the middle
 * of the screen. A plate inside a sticky track never moves vertically, so its
 * trigger cannot be measured on the plate: every instance is built on the
 * stage instead, with a window placed exactly where that plate's centre
 * passes from 90% to 40% of the viewport width — expressed in the library's
 * own trigger grammar as `bottom <n>%` and rebuilt whenever the layout moves.
 */

type Item = { key: PlateKey; name: string; desc: string; entry: string; href: string };

const ITEMS: Item[] = [
  { key: 'draw', name: 'scrollDraw', desc: 'Draw any SVG path from scroll.', entry: 'svg-scroll-draw', href: '/docs#core-options' },
  { key: 'animate', name: 'scrollAnimate', desc: 'Any CSS property, scrubbed by position.', entry: 'svg-scroll-draw', href: '/docs#scroll-animate' },
  { key: 'text', name: 'scrollText', desc: 'Split headlines into words, characters or lines.', entry: 'svg-scroll-draw/text', href: '/docs#scroll-text' },
  { key: 'pin', name: 'scrollPin', desc: 'Hold a section while the page keeps moving.', entry: 'svg-scroll-draw/pin', href: '/docs#scroll-pin' },
  { key: 'parallax', name: 'scrollParallax', desc: 'Layers at their own fraction of the scroll.', entry: 'svg-scroll-draw', href: '/docs#scroll-parallax' },
  { key: 'video', name: 'scrollVideo', desc: 'Tie a video’s current time to scroll.', entry: 'svg-scroll-draw/video', href: '/docs#scroll-video' },
  { key: 'counter', name: 'scrollCounter', desc: 'Numbers that count up as they arrive.', entry: 'svg-scroll-draw', href: '/docs#scroll-counter' },
  { key: 'snap', name: 'scrollSnap', desc: 'Snap between sections with thresholds.', entry: 'svg-scroll-draw/snap', href: '/docs#scroll-snap' },
];

const N = ITEMS.length;
const COUNTS = ITEMS.map((it) => PLATES[it.key].strokes.length);
const STAGGERS = COUNTS.map(staggerFor);
const EASING = 'ease-in-out' as const;
/** Wide: a plate starts inking with its centre here, and is finished by here. */
const FROM = 0.9;
const TO = 0.4;
/** Held beats, in viewport heights: before the sheet moves, after, and (on a
    phone) at each plate. */
const LEAD = 0.45;
const TAIL = 0.3;
const HOLD = 0.6;

const pad2 = (n: number): string => String(n).padStart(2, '0');
const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
/** Piecewise-linear through [scroll, translate] knots, held flat at the ends. */
type Knot = [number, number];
function along(knots: Knot[], s: number): number {
  if (s <= knots[0][0]) return knots[0][1];
  for (let i = 1; i < knots.length; i++) {
    const [s1, t1] = knots[i];
    if (s <= s1) {
      const [s0, t0] = knots[i - 1];
      return s1 === s0 ? t1 : t0 + ((t1 - t0) * (s - s0)) / (s1 - s0);
    }
  }
  return knots[knots.length - 1][1];
}
/** Strokes fully inked at plate progress `p`. */
const inkedAt = (p: number, i: number): number =>
  p < 1 / SPEED ? 0 : Math.min(COUNTS[i], Math.floor((p - 1 / SPEED) / STAGGERS[i] + 1e-6) + 1);

const METHODS = ['destroy', 'replay', 'pause', 'resume', 'seek', 'getProgress'];

export function Toolkit() {
  const stageRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const rail = railRef.current;
    const list = listRef.current;
    const pin = stage?.firstElementChild as HTMLElement | null;
    if (!stage || !rail || !list || !pin) return;

    const cards = Array.from(list.querySelectorAll<HTMLElement>('.tk-card[data-i]'));
    const strokeCounts = cards.map((c) => c.querySelector<HTMLElement>('.tk-strokes-n'));
    const totals = Array.from(stage.querySelectorAll<HTMLElement>('.tk-total-n'));
    const stations = Array.from(stage.querySelectorAll<HTMLElement>('.tk-st'));
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let mover: ScrollDrawInstance | null = null;
    let inks: ScrollDrawInstance[] = [];
    /** Each plate's window, in px of stage scroll. */
    let wins: { a: number; b: number }[] = [];
    /** Where the sheet stands for each px of stage scroll. */
    let knots: Knot[] = [[0, 0]];
    let travel = 0;
    let last = NaN;
    const shownP = cards.map(() => -1);
    const shownInked = cards.map(() => -1);
    let shownDone = -1;

    const paint = (scrolled: number) => {
      let done = 0;
      cards.forEach((card, i) => {
        const w = wins[i];
        const p = reduced ? 1 : clamp01((scrolled - w.a) / (w.b - w.a));
        const q = Math.round(p * 1000) / 1000;
        if (q !== shownP[i]) {
          // The plate being inked right now is marked, like chapter 02's step.
          if ((q > 0 && q < 1) !== (shownP[i] > 0 && shownP[i] < 1)) card.classList.toggle('is-live', q > 0 && q < 1);
          shownP[i] = q;
          card.style.setProperty('--tk-p', q.toFixed(3));
        }
        const inked = inkedAt(p, i);
        if (inked !== shownInked[i]) {
          shownInked[i] = inked;
          const el = strokeCounts[i];
          if (el) el.textContent = pad2(inked);
          card.classList.toggle('is-inked', inked === COUNTS[i]);
        }
        if (inked === COUNTS[i]) done++;
      });
      if (done !== shownDone) {
        shownDone = done;
        totals.forEach((t) => (t.textContent = pad2(done)));
        stations.forEach((s, i) => s.classList.toggle('is-on', i < done));
      }
      stage.style.setProperty('--tk-rail', (travel > 0 ? clamp01(along(knots, scrolled) / travel) : 1).toFixed(4));
    };

    /* scrollAnimate calls back every frame while the rail is on screen; the
       stage position is read once and nothing is written unless it moved. */
    const tick = () => {
      const scrolled = -stage.getBoundingClientRect().top;
      if (scrolled === last) return;
      last = scrolled;
      paint(scrolled);
    };

    const build = () => {
      mover?.destroy();
      inks.forEach((d) => d.destroy());
      inks = [];

      const wide = window.matchMedia('(min-width: 900px)').matches;
      // Wide: the heading is the first panel of the sheet and travels with it.
      // Narrow: it stays put above the rail and only the plates travel.
      const moving = wide ? rail : list;
      const vw = pin.clientWidth;
      const vh = window.innerHeight;
      travel = Math.max(0, Math.ceil(moving.scrollWidth - vw));
      // Natural centres, read through offsetLeft so a live transform never
      // skews them: card → list → rail → pin.
      const listLeft = list.offsetLeft + (list.offsetParent === rail ? rail.offsetLeft : 0);
      const centres = cards.map((c) => listLeft + c.offsetLeft + c.offsetWidth / 2);
      const tail = Math.round(vh * TAIL);

      if (wide) {
        /* The stage opens and closes on a held sheet, as chapter 02 does: the
           first plate is a pencil drawing when the stage pins and inks before
           the sheet moves; the last is finished before the stage releases.
           In between, 1 px of scroll moves the sheet 1 px, and a plate's
           centre reaches viewport line x at `lead + cx − x`. */
        const lead = Math.round(vh * LEAD);
        knots = [[0, 0], [lead, 0], [lead + travel, travel], [lead + travel + tail, travel]];
        const end = lead + travel + tail - 0.04 * vh;
        const minWin = (FROM - TO) * vw * 0.8;
        wins = centres.map((cx) => {
          const b = Math.min(lead + cx - TO * vw, end);
          return { a: Math.max(Math.min(lead + cx - FROM * vw, b - minWin), 0.04 * vh), b };
        });
      } else {
        /* A phone shows one plate at a time, so the sheet goes station to
           station: it brings each plate to the middle and holds it there
           while it inks, then moves on at 1 px per px. */
        const hold = Math.round(vh * HOLD);
        const stops = centres.map((cx) => Math.min(travel, Math.max(0, cx - vw / 2)));
        let sc = 0;
        knots = [[0, stops[0]]];
        wins = stops.map((t, i) => {
          const move = i > 0 ? t - stops[i - 1] : 0;
          sc += move;
          if (move > 0) knots.push([sc, t]);
          const a = Math.max(sc + 0.04 * vh - 0.15 * move, 0.04 * vh);
          sc += hold;
          knots.push([sc, t]);
          return { a, b: sc - 0.06 * vh };
        });
        // on to the title block, then a last held beat
        sc += travel - stops[stops.length - 1];
        knots.push([sc, travel]);
        knots.push([sc + tail, travel]);
      }
      const span = knots[knots.length - 1][0];
      const height = vh + span;
      stage.style.height = `${height}px`;

      mover = scrollAnimate(moving, {
        props: { transform: ['translateX(0px)', `translateX(${-travel}px)`] },
        trigger: { start: 'top top', end: 'bottom bottom' },
        triggerElement: stage,
        // The holds, as the library's own custom easing: stage progress in,
        // the sheet's share of its travel out.
        easing: (t: number) => (travel > 0 ? along(knots, t * span) / travel : 0),
        // Scrubbing is direct manipulation, 1:1 with the wheel; jumping to
        // the end would strand every plate but the last off screen.
        respectReducedMotion: false,
        onProgress: tick,
      });

      /* The stage's bottom edge sits `height` below its top, so a window
         starting `a` px into the stage is the viewport line `height − a` px
         above that edge: `bottom <(height − a) / vh>%`. */
      const at = (px: number): string => `${Math.max(0, ((height - px) / vh) * 100).toFixed(3)}%`;
      inks = cards.map((_, i) =>
        scrollDraw(stage, {
          selector: `.tk-ink-${i}`,
          stagger: STAGGERS[i],
          speed: SPEED,
          easing: EASING,
          trigger: { start: `bottom ${at(wins[i].a)}`, end: `bottom ${at(wins[i].b)}` },
        }),
      );

      last = NaN;
      tick();
    };
    build();

    let timer: ReturnType<typeof setTimeout>;
    let lastW = window.innerWidth;
    let lastH = window.innerHeight;
    const onResize = () => {
      // A phone's toolbar sliding away changes the height by a few dozen px;
      // only a real change of layout is worth a rebuild.
      if (window.innerWidth === lastW && Math.abs(window.innerHeight - lastH) < 120) return;
      lastW = window.innerWidth;
      lastH = window.innerHeight;
      clearTimeout(timer);
      timer = setTimeout(build, 140);
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      clearTimeout(timer);
      mover?.destroy();
      inks.forEach((d) => d.destroy());
      stage.style.removeProperty('height');
    };
  }, []);

  return (
    <div className="tk-stage" ref={stageRef}>
      <div className="tk-pin">
        <div className="tk-rail" ref={railRef}>
          <header className="tk-head">
            <p className="tk-kicker">
              <span>05 / the toolkit</span>
              <span className="tk-count" aria-hidden="true">
                <span className="tk-total-n">00</span> / {pad2(N)} inked
              </span>
            </p>
            <h2 className="tk-title" id="tk-title">
              Eight instruments. One instance shape.
            </h2>
            <p className="tk-lede">destroy, replay, pause, resume, seek, getProgress — learn one, know them all.</p>
            <code className="tk-code">
              {/* scrollText, not scrollPin: the pin and snap instances have
                  their own smaller shapes, and this line has to be true. */}
              <span className="tk-c-l">
                <span className="tk-c-k">const</span> it = <span className="tk-c-fn">scrollText</span>(
                <span className="tk-c-str">&apos;h1&apos;</span>, {'{ '}split: <span className="tk-c-str">&apos;chars&apos;</span>
                {' })'}
              </span>
              <span className="tk-c-l tk-c-methods">
                {METHODS.map((m) => (
                  <span key={m} className="tk-c-m">
                    it.<span className="tk-c-fn">{m}</span>({m === 'seek' ? <span className="tk-c-num">0.5</span> : null})
                  </span>
                ))}
              </span>
            </code>
            <p className="tk-hint" aria-hidden="true">
              <span>keep scrolling, the sheet runs sideways</span>
              <svg viewBox="0 0 40 10" className="tk-hint-arrow">
                <path d="M0 5H38M33 1.5L38 5L33 8.5" />
              </svg>
            </p>
          </header>

          <div className="tk-list" ref={listRef}>
            {ITEMS.map((it, i) => (
              <Link href={it.href} className="tk-card" key={it.key} data-i={i} data-cursor="open">
                <div className="tk-plate" id={`tk-plate-${it.key}`}>
                  <PlateArt plate={PLATES[it.key]} ink={`tk-ink-${i}`} stagger={STAGGERS[i]} />
                </div>
                <span className="tk-meta">
                  <span className="tk-n">
                    {pad2(i + 1)} / {pad2(N)}
                  </span>
                  <span className="tk-strokes" aria-hidden="true">
                    <span className="tk-strokes-n">00</span> / {pad2(COUNTS[i])} strokes
                  </span>
                </span>
                <span className="tk-name">{it.name}</span>
                <span className="tk-desc">{it.desc}</span>
                <span className="tk-entry">{it.entry}</span>
              </Link>
            ))}

            <Link href="/docs" className="tk-card tk-end" data-cursor="docs">
              <span className="tk-end-k">sheet 05 · title block</span>
              <span className="tk-end-title">
                Every option, <em>documented.</em>
                <svg viewBox="0 0 40 10" className="tk-end-arrow" aria-hidden="true">
                  <path d="M0 5H38M33 1.5L38 5L33 8.5" />
                </svg>
              </span>
              <span className="tk-block" aria-hidden="true">
                <span className="tk-block-r">
                  <span>instruments</span>
                  <span>{pad2(N)}</span>
                </span>
                <span className="tk-block-r">
                  <span>one shape</span>
                  <span>{METHODS.length} methods</span>
                </span>
                <span className="tk-block-r">
                  <span>drawn with</span>
                  <span>scrollDraw · speed {SPEED}</span>
                </span>
                <span className="tk-block-r">
                  <span>version</span>
                  <span>{SELF.version}</span>
                </span>
                <span className="tk-block-r">
                  <span>reference</span>
                  <span>/docs</span>
                </span>
              </span>
            </Link>
          </div>
        </div>

        <div className="tk-foot" aria-hidden="true">
          <span className="tk-foot-l">sheet 05</span>
          <span className="tk-stations">
            {ITEMS.map((it, i) => (
              <span key={it.key} className="tk-st">
                <i />
                <b>{pad2(i + 1)}</b>
              </span>
            ))}
            <span className="tk-st-fill" />
          </span>
          <span className="tk-foot-r">
            <span className="tk-total-n">00</span> / {pad2(N)}
          </span>
        </div>
      </div>
    </div>
  );
}
