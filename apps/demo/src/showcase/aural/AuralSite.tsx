'use client';

import './aural.css';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { scrollVideo } from 'svg-scroll-draw/video';
import { Site, Hero, Sec, Quote } from '../kit/Site';

/* Aural — the product page for a pair of over-ear headphones. The product
   film is one <video> that scrollVideo scrubs while its stage is pinned: the
   headphones turn, then the right ear cup comes apart, layer by layer.
   onProgress pins each callout to its part as the film moves and shows it
   once the part is clear. Four colourway stills ride in the same file after
   the film; `to` stops the scrub before them. */

const FILM = '/showcase/aural-fdc4222c.webm';
const FILM_END = 4.98; // seconds: the film is 150 frames at 30 fps, the stills follow

const COLOURS = [
  { k: 'sandstone', n: 'Sandstone', d: 'Champagne aluminium, umber leather', sw: '#cbb796', at: 5.017 },
  { k: 'graphite', n: 'Graphite', d: 'Graphite aluminium, black leather', sw: '#4b4c50', at: 5.117 },
  { k: 'fjord', n: 'Fjord', d: 'Blue-grey aluminium, navy leather', sw: '#5e7286', at: 5.217 },
  { k: 'chalk', n: 'Chalk', d: 'Silver aluminium, pale grey leather', sw: '#e0e0dc', at: 5.317 },
];

/* Where each part sits in the frame, 41 times through the film (per mille of
   its width and height), measured by the renderer that made it. */
const TRACK = {
  band: [500,118, 500,117, 500,116, 500,114, 500,112, 500,109, 500,106, 500,102, 500,99, 500,96, 500,94, 500,91, 500,90, 500,89, 499,89, 493,87, 481,85, 464,81, 442,76, 418,70, 390,64, 361,57, 332,50, 302,42, 273,35, 246,27, 220,20, 197,13, 177,6, 159,0, 145,-5, 134,-10, 128,-14, 125,-16, 126,-17, 126,-20, 123,-23, 120,-27, 116,-31, 113,-33, 112,-34],
  cushion: [694,776, 695,777, 697,778, 700,782, 703,786, 705,791, 706,798, 705,806, 702,814, 696,823, 688,832, 679,841, 669,848, 660,855, 651,859, 639,859, 624,854, 605,845, 582,835, 554,822, 524,809, 493,794, 460,778, 427,762, 394,746, 364,730, 335,714, 308,699, 285,685, 264,673, 247,662, 235,652, 226,645, 222,641, 221,639, 220,638, 217,636, 213,635, 209,634, 206,634, 204,633],
  cap: [728,606, 730,606, 736,607, 744,609, 754,612, 765,616, 775,621, 784,628, 791,636, 794,646, 795,656, 793,666, 788,676, 782,684, 776,691, 765,693, 750,689, 730,681, 705,672, 679,662, 657,651, 646,643, 650,637, 677,635, 732,638, 811,648, 863,653, 888,653, 891,650, 880,644, 860,637, 839,631, 822,626, 813,625, 810,626, 807,628, 804,629, 800,630, 797,630, 795,631, 794,631],
  shell: [711,801, 713,802, 717,804, 723,807, 730,812, 737,818, 744,826, 748,835, 751,845, 750,857, 748,868, 742,879, 736,889, 729,898, 721,905, 710,906, 695,901, 676,892, 652,881, 625,869, 595,855, 566,841, 543,828, 531,817, 534,809, 556,807, 601,811, 639,815, 657,814, 661,810, 654,804, 642,798, 629,792, 621,789, 619,789, 616,790, 613,791, 609,792, 605,793, 602,794, 601,794],
  board: [724,645, 726,645, 731,647, 738,649, 746,652, 755,657, 763,663, 770,670, 774,679, 775,688, 774,698, 769,709, 763,718, 757,727, 749,733, 738,735, 723,730, 703,723, 679,713, 650,702, 619,689, 586,676, 552,662, 521,649, 497,636, 482,625, 478,617, 489,613, 508,611, 516,607, 516,602, 510,598, 503,594, 498,591, 496,590, 494,590, 491,590, 487,590, 483,589, 480,589, 479,589],
  driver: [702,665, 704,665, 709,667, 716,669, 725,672, 734,676, 743,681, 751,688, 756,696, 759,705, 759,715, 757,724, 753,733, 747,741, 742,747, 731,749, 716,744, 697,737, 673,727, 646,716, 615,703, 582,690, 549,676, 515,662, 483,647, 455,633, 432,621, 418,610, 412,602, 417,597, 419,593, 417,588, 415,584, 413,582, 413,581, 411,581, 408,580, 404,579, 401,578, 398,578, 397,578],
};

/* The callouts: which part, what it says, and the stretch of film it is on
   screen and clear for. */
const PARTS = [
  { k: 'band', t: 'Stainless steel headband', d: 'Sprung, padded, 254 g all in', on: [0.04, 0.34] },
  { k: 'cushion', t: 'Memory-foam cushions', d: 'Protein leather, held on by magnets', on: [0.14, 0.4] },
  { k: 'cap', t: 'Spun-aluminium cap', d: 'Hides 3 of the 8 noise-cancelling mics', on: [0.62, 1] },
  { k: 'shell', t: 'Cup cut from one billet', d: 'Recycled aluminium, anodised', on: [0.68, 1] },
  { k: 'board', t: 'Aural H2 chip', d: 'Re-tunes noise cancelling 48,000× a second', on: [0.74, 1] },
  { k: 'driver', t: '40 mm dynamic driver', d: 'Beryllium-coated dome, 4 Hz to 40 kHz', on: [0.8, 1] },
] as const;

/** The part's position at film progress p, between the two nearest samples. */
function pinAt(track: readonly number[], p: number): [number, number] {
  const n = track.length / 2 - 1;
  const f = Math.min(Math.max(p, 0), 1) * n;
  const i = Math.min(Math.floor(f), n - 1), k = f - i;
  const lerp = (j: number) => (track[2 * i + j] + (track[2 * i + 2 + j] - track[2 * i + j]) * k) / 1000;
  return [lerp(0), lerp(1)];
}

/** A frame of the film, held: for the hero and the colourways. */
function Still({ at, label }: { at: number; label: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const show = () => { v.currentTime = at; };
    const broken = () => v.classList.add('is-broken'); // no WebM here: leave the space empty, not black
    if (v.readyState >= 1) show();
    else v.addEventListener('loadedmetadata', show, { once: true });
    v.addEventListener('error', broken);
    return () => {
      v.removeEventListener('loadedmetadata', show);
      v.removeEventListener('error', broken);
    };
  }, [at]);
  return <video ref={ref} className="au-still" src={FILM} muted playsInline preload="auto" aria-label={label} />;
}

function Film() {
  const track = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const pins = useRef<(HTMLElement | null)[]>([]);
  const rows = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const tr = track.current, st = stage.current, v = video.current;
    if (!tr || !st || !v) return;

    let last = -1;
    const onProgress = (p: number) => {
      if (p === last) return;
      last = p;
      st.style.setProperty('--p', p.toFixed(4));
      let newest = -1;
      PARTS.forEach((part, i) => {
        const on = p >= part.on[0] && p <= part.on[1];
        if (on) newest = i;
        const [x, y] = pinAt(TRACK[part.k], p);
        const pin = pins.current[i];
        pin?.classList.toggle('is-on', on);
        pin?.style.setProperty('--x', x.toFixed(4));
        pin?.style.setProperty('--y', y.toFixed(4));
        rows.current[i]?.classList.toggle('is-on', on);
      });
      // a phone has room for one row of the list: the newest part on screen
      rows.current.forEach((r, i) => r?.classList.toggle('is-new', i === newest));
    };

    /* scrollVideo measures the <video>'s own box. The stage is pinned with
       position: sticky; bottom: 0, so measure it where it sits in the flow —
       at the foot of the track — and reach back up the track from there:
       the film starts as the track's top meets the viewport's top and ends
       as the stage lets go. Drop the pin for the one call that measures; no
       frame paints in between. */
    let film: ReturnType<typeof scrollVideo> | undefined;
    const start = () => {
      film?.destroy();
      const vh = window.innerHeight;
      const run = tr.offsetHeight - st.offsetHeight;  // scroll the stage stays pinned for
      const pinned = vh - st.offsetHeight + v.getBoundingClientRect().top - st.getBoundingClientRect().top; // the video's top on screen while pinned
      const pct = (px: number) => `${(px / vh) * 100}%`;
      st.classList.add('is-measuring');
      film = scrollVideo(v, {
        to: FILM_END,
        trigger: { start: `top ${pct(run + pinned)}`, end: `top ${pct(pinned)}` },
        onReady: () => st.classList.add('is-ready'),
        onProgress,
      });
      st.classList.remove('is-measuring');
    };

    if (!v.canPlayType('video/webm; codecs="vp8"')) {
      tr.classList.add('no-film');
      onProgress(1);
      return;
    }
    // Measure once the video knows its length, so scrollVideo measures right away, inside start().
    if (v.readyState >= 1) start();
    else v.addEventListener('loadedmetadata', start, { once: true });

    // scrollVideo re-measures 150 ms after a resize, wherever the stage is
    // pinned; start over unpinned a little sooner (destroy() cancels its timer).
    // A phone's address bar showing or hiding is a resize too.
    let timer: ReturnType<typeof setTimeout>;
    const again = () => { clearTimeout(timer); timer = setTimeout(() => { if (film) start(); }, 100); };
    window.addEventListener('resize', again);
    const ro = new ResizeObserver(again);
    ro.observe(document.body);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', again);
      ro.disconnect();
      v.removeEventListener('loadedmetadata', start);
      film?.destroy();
    };
  }, []);

  return (
    <section className="au-film" ref={track} aria-label="Aural One, taken apart">
      <div className="au-stage" ref={stage}>
        <div className="au-side">
          <p className="sk-kick">Inside Aural One</p>
          <h2>Every layer, in the order we build it.</h2>
          <ol className="au-parts">
            {PARTS.map((part, i) => (
              <li key={part.k} ref={(el) => { rows.current[i] = el; }}>
                <i>{i + 1}</i><b>{part.t}</b><span>{part.d}</span>
              </li>
            ))}
          </ol>
          <div className="au-rail" aria-hidden="true">
            <i className="au-rail-fill" />
            <span style={{ left: 0 }}>The design</span>
            <span style={{ left: '44%' }}>The inside</span>
          </div>
        </div>
        <div className="au-frame">
          <video
            ref={video}
            src={FILM}
            muted
            playsInline
            preload="auto"
            aria-label="Aural One turns, then its right ear cup comes apart: cap, cup, chip, driver, fabric and cushion"
          />
          {PARTS.map((part, i) => (
            <i key={part.k} className="au-pin" aria-hidden="true" ref={(el) => { pins.current[i] = el; }}>{i + 1}</i>
          ))}
        </div>
      </div>
    </section>
  );
}

const SPECS = [
  { k: 'Battery', v: '40 h', d: 'With noise cancelling on. Five minutes on USB-C buys four more hours.' },
  { k: 'Noise cancelling', v: '8 mics', d: 'Adaptive ANC on the Aural H2 chip, with a transparency mode that keeps voices clear.' },
  { k: 'Weight', v: '254 g', d: 'A sprung stainless band and aluminium cups. Light enough for a long-haul flight.' },
  { k: 'Codecs', v: 'LDAC · aptX', d: 'aptX Adaptive, LDAC, AAC and SBC over Bluetooth 5.4, with multipoint for two devices.' },
  { k: 'Driver', v: '40 mm', d: 'A beryllium-coated dome on a bio-cellulose cone, from 4 Hz to 40 kHz.' },
  { k: 'Wired', v: '24-bit', d: 'Lossless 96 kHz audio over USB-C, or the 3.5 mm cable in the box.' },
];

export function AuralSite() {
  const [colour, setColour] = useState(0);
  const c = COLOURS[colour];
  return (
    <Site
      className="au"
      brand="Aural"
      links={['Headphones', 'Earbuds', 'Speakers', 'Support']}
      cta="Buy"
      example="scroll-video"
      apis="scrollVideo · to · onProgress"
      footnote="Designed and tuned in Copenhagen"
    >
      <Hero
        kicker="New · Aural One"
        title="Silence, engineered."
        lede={<>Over-ear headphones with adaptive noise cancelling, a 40 mm beryllium-coated driver and 40 hours on a charge. <span className="au-price">$449</span></>}
        actions={['Buy Aural One', 'Watch it come apart']}
        art={<Still at={COLOURS[0].at} label="Aural One headphones in Sandstone" />}
      />

      <Film />

      <Sec kicker="Tech specs" title="Forty hours. Two hundred and fifty-four grams.">
        <div className="au-specs">
          {SPECS.map((s) => (
            <div key={s.k} className="au-spec">
              <span>{s.k}</span>
              <b>{s.v}</b>
              <p>{s.d}</p>
            </div>
          ))}
        </div>
      </Sec>

      <Quote text="The quietest pair I have worn on a long-haul flight, and the first I forgot I had on." who="Ines Moreau, Field Audio" />

      <Sec kicker="Colourways" title="Four finishes. One sound." tone="alt">
        <div className="au-colours">
          <Still at={c.at} label={`Aural One in ${c.n}`} />
          <div className="au-swatches" role="radiogroup" aria-label="Colourway">
            {COLOURS.map((x, i) => (
              <button
                key={x.k}
                type="button"
                role="radio"
                aria-checked={i === colour}
                className={i === colour ? 'is-on' : ''}
                onClick={() => setColour(i)}
              >
                <i style={{ '--sw': x.sw } as CSSProperties} />
                <b>{x.n}</b>
                <span>{x.d}</span>
              </button>
            ))}
          </div>
        </div>
      </Sec>

      <Sec kicker="Buy" title="Aural One." id="buy">
        <div className="au-buy">
          <div className="au-buy-box">
            <p className="au-buy-price"><b>$449</b> or $37.42 a month for 12 months</p>
            <p className="au-buy-pick"><i style={{ '--sw': c.sw } as CSSProperties} />{c.n} · {c.d}</p>
            <a className="sk-btn" href="#top">Add to bag</a>
            <ul>
              <li>Free delivery in 2–3 days</li>
              <li>60 nights to try them at home</li>
              <li>Two-year warranty, cushions included</li>
            </ul>
          </div>
          <div className="au-box">
            <h3>In the box</h3>
            <ul>
              <li>Aural One headphones</li>
              <li>Folding travel case in felt and leather</li>
              <li>USB-C to USB-C cable, 1.2 m</li>
              <li>3.5 mm audio cable, 1.2 m</li>
              <li>Flight adapter</li>
            </ul>
          </div>
        </div>
      </Sec>
    </Site>
  );
}
