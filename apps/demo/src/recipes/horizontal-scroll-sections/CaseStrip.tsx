'use client';

import { useEffect, useRef } from 'react';
import { scrollHorizontal } from 'svg-scroll-draw/horizontal';
import './case-strip.css';

export type Case = { client: string; title: string; text: string; meta: string; href: string; cover: string[] };

export const CASES: Case[] = [
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

/** How far the strip travels: its width minus the stage's content box. */
function travelOf(stage: HTMLElement, track: HTMLElement): number {
  const cs = getComputedStyle(stage);
  const seen = stage.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  return Math.max(0, track.scrollWidth - seen);
}

export function CaseStrip({ cases = CASES }: { cases?: Case[] }) {
  const work = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLOListElement>(null);
  const count = useRef<HTMLElement>(null);
  const fill = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const runway = work.current, st = stage.current, tr = track.current;
    if (!runway || !st || !tr) return;
    const n = tr.children.length;

    // A pixel of scroll moves the strip a pixel: the runway is the strip's
    // travel plus the one screen the stage stays stuck for.
    const fit = () => runway.style.setProperty('--travel', `${travelOf(st, tr)}px`);
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(tr);
    ro.observe(st);

    let shown = 0;
    const strip = scrollHorizontal(tr, {
      onProgress: (p) => {
        if (fill.current) fill.current.style.transform = `scaleX(${p})`;
        const i = Math.round(p * (n - 1));
        if (i !== shown && count.current) {
          count.current.textContent = String(i + 1).padStart(2, '0');
          shown = i;
        }
      },
    });

    // The stage cannot scroll (overflow: clip), so a case reached with Tab is
    // brought into view by scrolling the page to it — on the next frame, after
    // the browser's own scroll to the focused link.
    const onFocus = (e: FocusEvent) => {
      const item = (e.target as Element).closest('li');
      if (!item) return;
      const travel = travelOf(st, tr);
      // How far into the track the case starts. Both boxes carry the same
      // translateX, so it cancels out.
      const at = item.getBoundingClientRect().left - tr.getBoundingClientRect().left;
      const p = travel > 0 ? Math.min(1, at / travel) : 0;
      const top = runway.getBoundingClientRect().top + window.scrollY + p * (runway.offsetHeight - window.innerHeight);
      requestAnimationFrame(() => window.scrollTo({ top }));
    };
    tr.addEventListener('focusin', onFocus);

    return () => {
      tr.removeEventListener('focusin', onFocus);
      ro.disconnect();
      strip.destroy();
    };
  }, [cases]);

  return (
    <section ref={work} className="work" aria-labelledby="work-h">
      <div ref={stage} className="work-stage">
        <header className="work-head">
          <h2 id="work-h" className="work-h">Selected work</h2>
          <p className="work-count" aria-hidden="true">
            <b ref={count}>01</b> / {String(cases.length).padStart(2, '0')}
          </p>
          <span className="work-rail" aria-hidden="true"><span ref={fill} /></span>
        </header>
        <ol ref={track} className="work-track">
          {cases.map((c, i) => (
            <li key={c.client} className="work-case">
              <svg className="work-cover" viewBox="0 0 200 150" aria-hidden="true">
                {c.cover.map((d) => <path key={d} d={d} />)}
              </svg>
              <p className="work-n">{String(i + 1).padStart(2, '0')} · {c.client}</p>
              <h3 className="work-title">{c.title}</h3>
              <p className="work-text">{c.text}</p>
              <p className="work-meta">{c.meta}</p>
              <a className="work-link" href={c.href}>Read the case study</a>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
