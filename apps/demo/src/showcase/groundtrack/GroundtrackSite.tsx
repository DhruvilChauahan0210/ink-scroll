'use client';

import './groundtrack.css';
import { useEffect, useRef } from 'react';
import { scrollFrames } from 'svg-scroll-draw/frames';
import { Site, Sec } from '../kit/Site';
import { LANDSAT_CREDIT } from '../index';

/* Groundtrack — a fictional exhibition of Earth-observing satellites, and the
   page for its Landsat 8 exhibit. One canvas, one scrollFrames instance: 71
   stills of NASA's Landsat 8 model (public domain), turned by the scroll from
   the top of the page to the end of the exhibit.

   The hero and the exhibit share one sticky stage inside a tall wrapper. The
   satellite starts beside the headline; over the first screen of scroll it
   grows until it fills the screen while the headline scrolls away, then
   holds there while onProgress lights each part, and the stage lets go at
   the end. The rotation never restarts: the instance measures the whole
   wrapper (triggerElement, 'top top' → 'bottom bottom'), and the same
   onProgress drives the growth, as a transform only. The page is black, as
   the frames are, so the canvas has no edge. */

const COUNT = 71;
const frameUrl = (i: number) => `/frames/landsat/frame_${String(i + 1).padStart(4, '0')}.webp`;

/** The wrapper is 500svh: the stage (100svh) plus 400svh of scroll, the first 100 of them the growth. */
const TRAVEL = 0.25;

/* The parts, what each does, and the stretch of the exhibit (after the
   travel, 0–1) its row is lit for. Every figure is Landsat 8's published one. */
const PARTS = [
  { k: 'array', t: 'Solar array', d: 'One deployable wing, folded for launch, powers everything on board', on: [0, 0.3] },
  { k: 'oli', t: 'Operational Land Imager', d: 'Nine bands of visible and infrared light, 30 m a pixel, 15 m in black and white', on: [0.26, 0.54] },
  { k: 'tirs', t: 'Thermal Infrared Sensor', d: 'Two thermal bands, 100 m a pixel: the temperature of the ground', on: [0.5, 0.78] },
  { k: 'xband', t: 'X-band antenna', d: 'Sends the pictures down to receiving stations at 384 Mbit/s', on: [0.74, 1] },
] as const;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

function Credit({ className }: { className?: string }) {
  return (
    <p className={className}>
      {LANDSAT_CREDIT.text}{' '}
      {LANDSAT_CREDIT.links.map((l, i) => (
        <span key={l.href}>
          {i > 0 && ' · '}
          <a href={l.href}>{l.label}</a>
        </span>
      ))}
    </p>
  );
}

function Exhibit() {
  const wrap = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const slot = useRef<HTMLDivElement>(null);
  const sat = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const count = useRef<HTMLSpanElement>(null);
  const rows = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const wr = wrap.current, st = stage.current, sl = slot.current, sa = sat.current, c = canvas.current;
    if (!wr || !st || !sl || !sa || !c) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

    /* The canvas's layout box is its final one (the whole stage, or a band
       across the top of a portrait screen); in the hero a transform shrinks
       it into the slot beside the headline. Both boxes are layout boxes,
       which a transform does not move, so this is measured on resize only:
       every scroll frame after that is the transform running out. */
    const measure = () => {
      const w = sa.offsetWidth, h = sa.offsetHeight, sw = sl.offsetWidth, sh = sl.offsetHeight;
      if (!w || !h || !sw || !sh) return;
      st.style.setProperty('--dx', `${(sl.offsetLeft + sw / 2 - (sa.offsetLeft + w / 2)).toFixed(1)}px`);
      st.style.setProperty('--dy', `${(sl.offsetTop + sh / 2 - (sa.offsetTop + h / 2)).toFixed(1)}px`);
      st.style.setProperty('--s', (sw / w).toFixed(4));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(st);
    ro.observe(sl);
    ro.observe(sa);

    let last = -1;
    const turn = scrollFrames(c, {
      frames: frameUrl,
      count: COUNT,
      // Full screen it fills the screen; on a portrait screen its box is 16:9,
      // the frames' own shape, so nothing is cut off.
      fit: 'cover',
      // The canvas rides in a sticky stage: measure the wrapper that holds the
      // whole scroll, hero to the end of the exhibit.
      triggerElement: wr,
      trigger: { start: 'top top', end: 'bottom bottom' },
      onReady: () => st.classList.add('is-ready'),
      onProgress: (p, frame) => {
        if (frame !== last && count.current) {
          last = frame;
          count.current.textContent = `${String(frame + 1).padStart(2, '0')} / ${COUNT}`;
        }
        // Reduced motion: no growth (the CSS lays the hero out without it).
        const t = reduced.matches ? 0 : clamp01(p / TRAVEL);
        const q = clamp01((p - TRAVEL) / (1 - TRAVEL));
        st.style.setProperty('--t', t.toFixed(4));
        st.style.setProperty('--b', clamp01((t - 0.6) / 0.4).toFixed(4));
        st.style.setProperty('--q', q.toFixed(4));
        st.classList.toggle('is-away', t > 0.5);
        let newest = -1;
        PARTS.forEach((part, i) => {
          const on = t >= 1 && q >= part.on[0] && q <= part.on[1];
          if (on) newest = i;
          rows.current[i]?.classList.toggle('is-on', on);
        });
        // a phone has room for one row: the newest part lit
        rows.current.forEach((r, i) => r?.classList.toggle('is-new', i === newest));
      },
    });
    return () => {
      ro.disconnect();
      turn.destroy();
    };
  }, []);

  return (
    <div className="gt-show" ref={wrap}>
      <div className="gt-stage" ref={stage}>
        <section className="gt-hero" aria-labelledby="gt-h1">
          <div className="gt-copy">
            <p className="sk-kick">Earth-observing satellites, up close</p>
            <h1 className="sk-h1" id="gt-h1">The camera that maps the land</h1>
            <p className="sk-lede">
              Landsat 8 has photographed the land of the whole planet since 2013, one 185 km strip at a time.
              Scroll, and its model turns a full circle for you, part by part.
            </p>
            <div className="sk-ctas">
              <a className="sk-btn" href="#visit">Plan a visit</a>
              <a className="sk-btn sk-btn-ghost" href="#exhibit">See it turn</a>
            </div>
          </div>
          <div className="gt-slot" ref={slot} aria-hidden="true" />
          <figure className="gt-sat" ref={sat}>
            <canvas
              ref={canvas}
              role="img"
              aria-label="NASA's Landsat 8 satellite model turning through a full circle on a turntable as you scroll"
            />
          </figure>
        </section>

        <div className="gt-band" id="exhibit">
          <div className="gt-parts-wrap">
            <p className="sk-kick">Exhibit 08 · Landsat 8</p>
            <ol className="gt-parts">
              {PARTS.map((part, i) => (
                <li key={part.k} ref={(el) => { rows.current[i] = el; }}>
                  <i>{i + 1}</i><b>{part.t}</b><span>{part.d}</span>
                </li>
              ))}
            </ol>
            <div className="gt-rail" aria-hidden="true"><i className="gt-rail-fill" /></div>
          </div>
          <div className="gt-cap">
            <Credit className="gt-credit" />
            <span className="gt-count" ref={count} aria-hidden="true">01 / {COUNT}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const SPECS = [
  { k: 'Launched', v: '2013', d: 'On 11 February, on an Atlas V from Vandenberg, as the Landsat Data Continuity Mission.' },
  { k: 'Altitude', v: '705 km', d: 'A sun-synchronous orbit: it crosses the equator at about 10 a.m. local time on every pass.' },
  { k: 'Orbit', v: '99 min', d: 'Fourteen and a half times round the Earth a day, pole to pole.' },
  { k: 'Repeat', v: '16 days', d: 'The same ground track again, so every scene can be compared with the last.' },
  { k: 'Swath', v: '185 km', d: 'The width of the strip of land each pass photographs.' },
  { k: 'Bands', v: '11', d: 'Nine from the Operational Land Imager and two from the Thermal Infrared Sensor.' },
];

const VISIT = [
  { k: 'Open', v: 'Tuesday to Sunday, 10:00 to 18:00' },
  { k: 'Late opening', v: 'Thursdays until 21:00, with a talk at 19:00' },
  { k: 'Tickets', v: 'Free for under-18s; the turntable hall is step-free' },
];

export function GroundtrackSite() {
  return (
    <Site
      className="gt"
      brand={<><span className="gt-mark" aria-hidden="true" />Groundtrack</>}
      links={['Exhibits', 'Visit', 'Learn', 'Archive']}
      cta="Plan a visit"
      example="scroll-frames"
      apis="scrollFrames · triggerElement · onProgress"
      footnote={<Credit className="gt-foot-credit" />}
    >
      <Exhibit />

      <Sec kicker="The mission" title="Eleven bands, every sixteen days">
        <div className="gt-specs">
          {SPECS.map((s) => (
            <div key={s.k} className="gt-spec">
              <span>{s.k}</span>
              <b>{s.v}</b>
              <p>{s.d}</p>
            </div>
          ))}
        </div>
      </Sec>

      <Sec kicker="Visit" title="The turntable hall" tone="alt" id="visit">
        <div className="gt-visit">
          <dl>
            {VISIT.map((v) => (
              <div key={v.k}>
                <dt>{v.k}</dt>
                <dd>{v.v}</dd>
              </div>
            ))}
          </dl>
          <a className="sk-btn" href="#top">Book a free ticket</a>
        </div>
      </Sec>
    </Site>
  );
}
