'use client';

import './tidewater.css';
import type { CSSProperties, ReactNode } from 'react';
import { Site } from '../kit/Site';
import { EstuaryBackdrop, Sloop } from './Sloop';
import { SeasonCalendar } from './Calendar';

/*
 * Tidewater Sailing School, Falmouth — built with Vue in real life (the
 * example card shows the Vue version). The svg-scroll-draw effect is the
 * hero's line-drawn sloop (Sloop.tsx): ScrollDraw · fade · stagger 0.07 ·
 * ease-out · once. Everything else is HTML, CSS and static inline SVG.
 */

const Mark = ({ size = 24 }: { size?: number }) => (
  <svg className="tw-mark" viewBox="0 0 28 28" width={size} height={size} aria-hidden="true">
    <circle cx="14" cy="14" r="13" fill="var(--ink)" />
    <path d="M14.5 5.5 V18 H21 C 20 13, 17.6 8.6, 14.5 5.5 Z" fill="#f4efe6" />
    <path d="M13 8.5 C 10.6 11.5, 9 14.6, 8.4 18 H13 Z" fill="var(--signal)" />
    <path d="M6.5 20.6 C 9 19.6, 11.4 21.6, 14 20.6 S 19 19.6, 21.5 20.6" fill="none" stroke="#f4efe6" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

const Stars = ({ n = 5, size = 14 }: { n?: number; size?: number }) => (
  <span className="tw-stars" role="img" aria-label={`${n} out of 5 stars`}>
    {Array.from({ length: 5 }, (_, i) => (
      <svg key={i} viewBox="0 0 20 20" width={size} height={size} aria-hidden="true" className={i < n ? 'on' : ''}><path d="M10 1.6 L12.6 7 L18.5 7.7 L14.1 11.7 L15.3 17.6 L10 14.6 L4.7 17.6 L5.9 11.7 L1.5 7.7 L7.4 7 Z" /></svg>
    ))}
  </span>
);

/* ── Course cards ────────────────────────────────────────────────────── */
type Course = { t: string; lvl: 'Beginner' | 'Intermediate' | 'Advanced' | 'Ages 8–16'; dur: string; boat: string; max: string; price: string; dates: string[]; seats: { t: string; tone: 'ok' | 'low' | 'full' }; scene: string; art: ReactNode; blurb: string };

/* Small line drawings for the course and instructor "photographs": hulls
   filled with ink, sails with sailcloth, and a few details. */
const YACHT_BODY = <><path className="hull" d="M16 61 C 36 65, 70 65, 94 57 L 92 54 L 18 56 Z" /><path d="M52 12 C 44 26, 38 40, 33 52 L52 52 Z" /><path d="M56 12 L 86 54 Q 72 54, 59 52 C 60 40, 58 26, 56 12 Z" /><path d="M54 56 V7 M54 49 L 32 51" fill="none" /><path d="M54 7 l7 2.2 l-7 2.2 Z" className="flag" /></>;
const REFLECT = <path d="M26 66 h14 M48 67.5 h24 M78 66 h10" fill="none" className="soft" />;
const ART = {
  yacht: <>{YACHT_BODY}{REFLECT}</>,
  taster: <>{YACHT_BODY}{REFLECT}<path d="M8 24 q4 -4 8 0 q4 -4 8 0 M22 14 q3 -3 6 0 q3 -3 6 0" fill="none" /></>,
  dinghy: <><path className="hull" d="M30 62 L80 62 L74 69 L36 69 Z" /><path d="M55 61 V18 M55 52 L 40 54" fill="none" /><path d="M54 20 C 47 32, 42 44, 40 52 L54 52 Z" /><path d="M57 24 L 73 60 H58 Z" /><circle cx="46" cy="57" r="2.6" /><circle cx="64" cy="57" r="2.6" /><path d="M28 72 h12 M50 73 h22" fill="none" className="soft" /></>,
  harbour: <><path d="M-6 58 H 30 V 54 H 40 V 58 H 46 V 70 H -6 Z" className="wall" /><path d="M2 54 V 44 h4 v10" fill="none" className="soft" />{YACHT_BODY}{REFLECT}</>,
  night: <><path d="M90 30 L 140 10 L 140 46 Z" className="beam" /><path d="M86 52 h8 l-1.4 -20 h-5.2 Z" className="tower" />{YACHT_BODY}<circle cx="54" cy="6" r="1.8" className="lamp" />{REFLECT}</>,
  toppers: <><path className="hull" d="M10 64 L34 64 L31 68 L13 68 Z" /><path d="M22 63 V36 M23 38 C 29 46, 31 54, 32 61 H23 Z" /><path className="hull" d="M44 58 L64 58 L61 62 L47 62 Z" /><path d="M54 57 V30 M55 32 C 61 40, 63 48, 64 55 H55 Z" className="red" /><path className="hull" d="M76 66 L100 66 L97 70 L79 70 Z" /><path d="M88 65 V40 M89 42 C 94 50, 96 56, 97 63 H89 Z" /></>,
};

const COURSES: Course[] = [
  { t: 'Taster sail', lvl: 'Beginner', dur: '4 hours', boat: '36ft keelboat', max: 'Up to 6', price: '£95', dates: ['Sat 3 Apr', 'Sat 10 Apr', 'Sat 17 Apr'], seats: { t: '6 places', tone: 'ok' }, scene: 'dawn', art: ART.taster, blurb: 'A morning on the Carrick Roads with a skipper. Take the helm, hoist a sail, see if it’s for you.' },
  { t: 'RYA Start Sailing', lvl: 'Beginner', dur: '2 days', boat: 'Wayfarer dinghy', max: 'Up to 4', price: '£265', dates: ['10–11 Apr', '24–25 Apr'], seats: { t: '3 places left', tone: 'low' }, scene: 'noon', art: ART.dinghy, blurb: 'Rig, launch, tack, gybe and capsize on purpose — in the sheltered water off Mylor.' },
  { t: 'RYA Competent Crew', lvl: 'Beginner', dur: '5 days aboard', boat: 'Sun Odyssey 36i', max: 'Up to 5', price: '£640', dates: ['12–16 Apr', '26–30 Apr', '10–14 May'], seats: { t: '2 places left', tone: 'low' }, scene: 'blue', art: ART.yacht, blurb: 'Live aboard for five days and leave able to helm, trim, tie the knots that matter and stand a watch.' },
  { t: 'RYA Day Skipper', lvl: 'Intermediate', dur: '5 days aboard', boat: 'Sun Odyssey 36i', max: 'Up to 5', price: '£720', dates: ['5–9 Apr', '3–7 May'], seats: { t: 'Full · join waitlist', tone: 'full' }, scene: 'dusk', art: ART.harbour, blurb: 'Take charge of a yacht by day in waters you know: passage planning, pilotage and berthing under power.' },
  { t: 'RYA Coastal Skipper', lvl: 'Advanced', dur: '5 days + night passage', boat: 'Hanse 418', max: 'Up to 4', price: '£860', dates: ['19–23 Apr', '17–21 May'], seats: { t: '4 places', tone: 'ok' }, scene: 'night', art: ART.night, blurb: 'Skipper longer passages, by night, to the Helford, Fowey and — weather allowing — the Scillies.' },
  { t: 'Youth sailing club', lvl: 'Ages 8–16', dur: '6 Saturdays', boat: 'Topper dinghies', max: 'Up to 10', price: '£180', dates: ['From 1 May', 'From 12 Jun'], seats: { t: '8 places', tone: 'ok' }, scene: 'teal', art: ART.toppers, blurb: 'RYA Youth Stages 1–2 with our dinghy team. Buoyancy aids, wetsuits and hot chocolate included.' },
];

/* ── Instructors ─────────────────────────────────────────────────────── */
const CREW: { n: string; r: string; i: string; q: string; miles: string; since: string; place: string; scene: string; art: ReactNode }[] = [
  { n: 'Tamsin Rowe', r: 'Principal · Yachtmaster Ocean Instructor', i: 'TR', q: 'Two Atlantic crossings, and I still think the Carrick Roads at dawn is the best sailing there is.', miles: '41,000 miles', since: 'With us since 2009', place: 'Helford River, 6 am', scene: 'dawn', art: ART.taster },
  { n: 'Joe Pascoe', r: 'Chief Dinghy Instructor', i: 'JP', q: 'Capsizing is part of the course. People laugh far more than they expect to.', miles: '22 seasons', since: 'Grew up in Flushing', place: 'Mylor Creek, low water', scene: 'teal', art: ART.dinghy },
  { n: 'Priya Nair', r: 'Yachtmaster Offshore · Cruising Instructor', i: 'PN', q: 'Night passages are where people grow up as sailors. I love watching it click.', miles: '18,500 miles', since: 'With us since 2017', place: 'Off St Anthony Head', scene: 'night', art: ART.night },
  { n: 'Kit Hambly', r: 'Youth Lead · Powerboat Instructor', i: 'KH', q: 'Half our juniors come back as instructors. That’s the bit I’m proudest of.', miles: '12 seasons', since: 'Ex–junior member', place: 'Gyllyngvase, Saturday', scene: 'noon', art: ART.toppers },
];

/* ── Reviews ─────────────────────────────────────────────────────────── */
const REVIEWS = [
  { t: 'Went from terrified to helming at night', b: 'I booked Competent Crew having never been on a yacht. By Thursday I was on the helm crossing to Fowey in the dark with Priya talking me through the lights. Patient, funny, and the food aboard was better than at home.', n: 'Hannah M.', c: 'Competent Crew', d: 'September 2026', s: 5 },
  { t: 'Proper teaching, not just a jolly', b: 'Joe had both our kids (9 and 12) capsizing and righting a Wayfarer by lunchtime. They now ask for sailing instead of screens. The Saturday club is brilliant value.', n: 'Rob & Elin T.', c: 'Start Sailing + Youth club', d: 'August 2026', s: 5 },
  { t: 'The best-run school I’ve sailed with', b: 'Third school I’ve trained with, and the first where the boats were immaculate and the briefings genuinely useful. Day Skipper was hard work and I passed knowing I’d earned it.', n: 'Marcus A.', c: 'Day Skipper', d: 'June 2026', s: 5 },
];

/* ── Tide (semi-diurnal, HW 06:42 and 19:05) ──────────────────────────── */
const TIDE = (() => {
  const W = 320;
  const H = 92;
  const at = (h: number) => 2.95 + 2.05 * Math.cos(((h - 6.7) / 12.38) * Math.PI * 2);
  const x = (h: number) => (h / 24) * W;
  const y = (v: number) => H - 8 - (v / 5.4) * (H - 18);
  const pts = Array.from({ length: 49 }, (_, i) => `${x(i / 2).toFixed(1)} ${y(at(i / 2)).toFixed(1)}`);
  const now = 9 + 40 / 60;
  return { W, H, line: `M ${pts.join(' L ')}`, fill: `M 0 ${H} L ${pts.join(' L ')} L ${W} ${H} Z`, nx: x(now), ny: y(at(now)), hw1: [x(6.7), y(at(6.7))], lw: [x(12.97), y(at(12.97))], hw2: [x(19.08), y(at(19.08))] };
})();

function Conditions() {
  return (
    <div className="tw-wx" role="img" aria-label="Today's conditions in Falmouth: wind 14 knots from the south-west gusting 19, high water 06:42 at 4.9 metres, low water 12:58, sea 11 degrees">
      <div className="tw-wx-h"><b>Falmouth Harbour</b><span>Sat 3 Apr 2027 · 09:40</span></div>
      <div className="tw-wx-main">
        <svg className="tw-compass" viewBox="0 0 120 120" aria-hidden="true">
          <circle cx="60" cy="60" r="52" className="c-ring" />
          {Array.from({ length: 36 }, (_, i) => {
            const a = (i * 10 * Math.PI) / 180;
            const r1 = i % 9 === 0 ? 42 : 47;
            return <path key={i} className="c-tick" d={`M ${(60 + Math.sin(a) * r1).toFixed(1)} ${(60 - Math.cos(a) * r1).toFixed(1)} L ${(60 + Math.sin(a) * 51).toFixed(1)} ${(60 - Math.cos(a) * 51).toFixed(1)}`} />;
          })}
          <text x="60" y="27" className="c-n">N</text>
          <g transform="rotate(225 60 60)"><path className="c-arrow" d="M 60 30 L 67 13 L 60 17 L 53 13 Z" /></g>
          <text x="60" y="66" className="c-v">14</text>
          <text x="60" y="80" className="c-u">knots</text>
        </svg>
        <div className="tw-wx-read">
          <p className="tw-wx-big">SW 14 kn <em>gusts 19</em></p>
          <p className="tw-wx-bf"><span>Force 4</span>Moderate breeze</p>
          <p className="tw-go"><i />Sailing today — sheltered in the Carrick Roads</p>
        </div>
      </div>
      <div className="tw-hours">
        {[['09', 225, 14], ['12', 230, 16], ['15', 240, 17], ['18', 250, 12], ['21', 260, 9]].map(([h, a, k]) => (
          <span key={h as string}><em>{h}:00</em><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3 L14 12 L10 10 L6 12 Z" transform={`rotate(${(a as number) + 180} 10 10)`} /></svg><b>{k}</b></span>
        ))}
      </div>
      <div className="tw-tide">
        <div className="tw-tide-h"><b>Tide</b><span>Falmouth · heights above chart datum</span></div>
        <svg viewBox={`0 0 ${TIDE.W} ${TIDE.H + 16}`} aria-hidden="true">
          <path className="t-fill" d={TIDE.fill} />
          <path className="t-line" d={TIDE.line} />
          <path className="t-now" d={`M ${TIDE.nx.toFixed(1)} 6 V ${TIDE.H}`} />
          <circle className="t-dot" cx={TIDE.nx.toFixed(1)} cy={TIDE.ny.toFixed(1)} r="4" />
          <text className="t-lab" x={TIDE.hw1[0]} y={TIDE.hw1[1] - 8}>HW 06:42 · 4.9 m</text>
          <text className="t-lab" x={TIDE.lw[0]} y={TIDE.lw[1] + 16}>LW 12:58 · 0.9 m</text>
          <text className="t-lab" x={Math.min(TIDE.hw2[0], TIDE.W - 50)} y={TIDE.hw2[1] - 8}>HW 19:05 · 5.0 m</text>
          {['00', '06', '12', '18', '24'].map((h, i) => <text key={h} className="t-ax" x={(i / 4) * TIDE.W} y={TIDE.H + 14}>{h}</text>)}
        </svg>
      </div>
      <dl className="tw-wx-stats">
        <div><dt>Sea</dt><dd>11 °C</dd></div>
        <div><dt>Sunrise</dt><dd>06:49</dd></div>
        <div><dt>Sunset</dt><dd>19:47</dd></div>
        <div><dt>Visibility</dt><dd>Good</dd></div>
      </dl>
    </div>
  );
}

function Booking() {
  const first = new Date(Date.UTC(2027, 3, 1)).getUTCDay(); // April 2027 starts on a Thursday
  const lead = (first + 6) % 7; // Monday-first grid
  return (
    <div className="tw-book" role="img" aria-label="Booking Competent Crew, 12 to 16 April 2027 aboard Kittiwake: £640 plus oilskin hire, £150 deposit today">
      <div className="tw-book-h">
        <span className="tw-book-art tw-scene s-blue" aria-hidden="true"><svg viewBox="0 0 110 80">{ART.yacht}</svg></span>
        <span><b>RYA Competent Crew</b><em>5 days aboard · Beginner</em><Stars size={12} /></span>
      </div>
      <div className="tw-book-cols">
        <div className="tw-mini-cal" aria-hidden="true">
          <div className="tw-mc-h"><span>‹</span><b>April 2027</b><span>›</span></div>
          <div className="tw-mc-g">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <em key={i}>{d}</em>)}
            {Array.from({ length: lead }, (_, i) => <i key={`l${i}`} />)}
            {Array.from({ length: 30 }, (_, i) => {
              const d = i + 1;
              const cls = d === 12 ? 'sel s0' : d === 16 ? 'sel s1' : d > 12 && d < 16 ? 'mid' : [26, 5].includes(d) ? 'run' : '';
              return <span key={d} className={cls}>{d}</span>;
            })}
          </div>
          <p className="tw-mc-f"><span className="tw-mc-run">5</span> Other Competent Crew starts · <b>Day Skipper</b> runs the same weeks</p>
        </div>
        <div className="tw-book-side">
          <dl className="tw-book-rows">
            <div><dt>Dates</dt><dd>Mon 12 – Fri 16 Apr</dd></div>
            <div><dt>Yacht</dt><dd>Kittiwake · Sun Odyssey 36i</dd></div>
            <div><dt>Skipper</dt><dd>Tamsin Rowe</dd></div>
            <div><dt>Berths</dt><dd><span className="tw-low">2 of 5 left</span></dd></div>
          </dl>
          <div className="tw-extras">
            <label><span className="tw-check on" />Oilskins and boots hire<b>+£35</b></label>
            <label><span className="tw-check" />Parking at Port Pendennis<b>+£40</b></label>
          </div>
          <div className="tw-total">
            <span>Total <em>incl. VAT</em></span><b>£675</b>
          </div>
          <span className="tw-btn tw-btn-block">Reserve my place · £150 deposit</span>
          <p className="tw-book-f">Free to move your dates until 15 March. Meals aboard included.</p>
        </div>
      </div>
    </div>
  );
}

export function TidewaterSite() {
  return (
    <Site
      className="tw"
      brand={<><Mark />Tidewater</>}
      links={['Courses', 'Calendar', 'Instructors', 'Membership', 'Visit']}
      cta="Book a course"
      example="vue"
      apis="ScrollDraw component · useScrollDraw"
      footnote="RYA Training Centre · Port Pendennis, Falmouth TR11 3TF"
    >
      {/* ── Hero ── */}
      <section className="tw-hero">
        <div className="tw-hero-top">
          <div>
            <p className="tw-kick">Sailing school · Falmouth, Cornwall<span className="tw-est"> · Est. 1987</span></p>
            <h1 className="tw-h1">Learn to sail on the water <em>we grew up on.</em></h1>
          </div>
          <div className="tw-hero-side">
            <p className="tw-lede">Small crews, patient instructors and the sheltered water of the Carrick Roads — from your first tack to your Coastal Skipper ticket, March to October.</p>
            <div className="tw-ctas">
              <a className="tw-btn" href="#courses">See the 2027 courses</a>
              <a className="tw-link" href="#courses">Try a £95 taster sail →</a>
            </div>
            <p className="tw-rating"><Stars /> <b>4.9</b> from 1,214 reviews</p>
          </div>
        </div>
        <div className="tw-scene-hero">
          <EstuaryBackdrop />
          <Sloop />
          <p className="tw-caption">Kittiwake, close-hauled off Pendennis Point</p>
        </div>
        <form className="tw-search" onSubmit={(e) => e.preventDefault()} aria-label="Find a course">
          <label><span>Course</span><b>Competent Crew</b><i aria-hidden="true">▾</i></label>
          <label><span>When</span><b>12 – 16 Apr 2027</b><i aria-hidden="true">▾</i></label>
          <label><span>Sailors</span><b>2 adults</b><i aria-hidden="true">▾</i></label>
          <button type="submit" className="tw-btn">Check availability</button>
        </form>
      </section>

      {/* ── Trust ── */}
      <section className="tw-trust" aria-label="About the school">
        <span><b>RYA</b>Recognised Training Centre</span>
        <span><Stars size={13} /><b>4.9</b>1,214 Google reviews</span>
        <span><b>23</b>boats in the fleet</span>
        <span><b>38</b>seasons on the Fal</span>
        <span><b>1 : 5</b>instructor ratio</span>
      </section>

      {/* ── Courses ── */}
      <section className="tw-sec" id="courses">
        <div className="tw-head tw-head-row">
          <div>
            <p className="tw-kick">Courses</p>
            <h2 className="tw-h2">Start wherever you are.</h2>
          </div>
          <div className="tw-filters" aria-label="Filter courses">
            {['All courses', 'Never sailed', 'Some experience', 'Skippers', 'Under 16s'].map((f, i) => <span key={f} className={i === 0 ? 'on' : ''}>{f}</span>)}
          </div>
        </div>
        <div className="tw-courses">
          {COURSES.map((c) => (
            <article key={c.t} className="tw-course">
              <div className={`tw-scene s-${c.scene}`}>
                <svg viewBox="0 0 110 80" aria-hidden="true">{c.art}</svg>
                <span className={`tw-seats is-${c.seats.tone}`}>{c.seats.t}</span>
              </div>
              <div className="tw-course-b">
                <span className="tw-lvl">{c.lvl}</span>
                <h3>{c.t}</h3>
                <p>{c.blurb}</p>
                <ul className="tw-meta"><li>{c.dur}</li><li>{c.boat}</li><li>{c.max}</li></ul>
                <div className="tw-dates">{c.dates.map((d, i) => <span key={d} className={i === 0 ? 'on' : ''}>{d}</span>)}</div>
                <div className="tw-course-f"><p><em>from</em> <b>{c.price}</b></p><a href="#calendar">{c.seats.tone === 'full' ? 'Join waitlist' : 'Book'} →</a></div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── Calendar ── */}
      <section className="tw-sec tw-alt" id="calendar">
        <div className="tw-head tw-head-row">
          <div>
            <p className="tw-kick">The 2027 season</p>
            <h2 className="tw-h2">Every course, every week, March to October.</h2>
          </div>
          <p className="tw-p">Bookings for 2027 open on 1 November. Courses run with three or more crew — if yours doesn’t, we’ll move you for free or refund in full.</p>
        </div>
        <SeasonCalendar />
      </section>

      {/* ── Booking + conditions ── */}
      <section className="tw-sec" id="plan">
        <div className="tw-head tw-head-row">
          <div>
            <p className="tw-kick">Before you come</p>
            <h2 className="tw-h2">Book in a minute. We watch the weather for you.</h2>
          </div>
          <div>
            <p className="tw-p">Pick your dates and pay a £150 deposit. The week before, your skipper sends a kit list and the plan; each evening, we check the forecast and the tide and tell you where we’re heading.</p>
            <ul className="tw-ticks">
              <li>Food, berth and lifejackets included aboard</li>
              <li>If it’s blowing over force 6, we train ashore or rebook you</li>
            </ul>
          </div>
        </div>
        <div className="tw-plan-ui">
          <Booking />
          <Conditions />
        </div>
      </section>

      {/* ── Instructors ── */}
      <section className="tw-sec tw-alt" id="instructors">
        <div className="tw-head">
          <p className="tw-kick">Instructors</p>
          <h2 className="tw-h2">The people you’ll be at sea with.</h2>
          <p className="tw-p">Eleven RYA instructors, most of them local, all of them sailors first. Here are four — and the stretch of water each of them would take you to first.</p>
        </div>
        <div className="tw-crew">
          {CREW.map((p) => (
            <article key={p.n} className="tw-person">
              <div className={`tw-portrait tw-scene s-${p.scene}`}>
                <svg viewBox="0 0 110 80" aria-hidden="true">{p.art}</svg>
                <span className="tw-place">{p.place}</span>
              </div>
              <div className="tw-person-b">
                <span className="tw-avatar">{p.i}</span>
                <h3>{p.n}</h3>
                <p className="tw-role">{p.r}</p>
                <blockquote>“{p.q}”</blockquote>
                <p className="tw-facts"><span>{p.miles}</span><span>{p.since}</span></p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── Reviews ── */}
      <section className="tw-sec" id="reviews">
        <div className="tw-reviews">
          <div className="tw-score">
            <p className="tw-kick">Reviews</p>
            <p className="tw-score-n">4.9</p>
            <Stars size={20} />
            <p className="tw-score-c">From 1,214 reviews on Google and the RYA</p>
            <ul className="tw-dist">
              {[[5, 93], [4, 5], [3, 1], [2, 0.5], [1, 0.5]].map(([s, p]) => (
                <li key={s}><span>{s}★</span><i style={{ '--w': `${p}%` } as CSSProperties} /><em>{p}%</em></li>
              ))}
            </ul>
          </div>
          <div className="tw-rev-list">
            {REVIEWS.map((r) => (
              <article key={r.n} className="tw-review">
                <div className="tw-review-h"><Stars n={r.s} /><span>{r.d}</span></div>
                <h3>{r.t}</h3>
                <p>{r.b}</p>
                <p className="tw-who"><span className="tw-rav">{r.n.split(' ').map((w) => w[0]).join('').replace('&', '').slice(0, 2)}</span><b>{r.n}</b><span>{r.c}</span><em>Verified booking</em></p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Membership ── */}
      <section className="tw-sec tw-ink" id="membership">
        <div className="tw-head tw-head-c">
          <p className="tw-kick">Membership</p>
          <h2 className="tw-h2">Passed your course? Keep sailing with us.</h2>
          <p className="tw-p">Members sail the school fleet on club evenings, charter at cost on weekdays, and get first pick of next year’s courses.</p>
        </div>
        <div className="tw-tiers">
          {[
            { n: 'Crew', p: '£18', f: ['Two club sails a month', 'Thursday members’ evenings', '10% off every course'] },
            { n: 'Skipper', p: '£42', f: ['Charter the fleet on weekdays', 'Unlimited club sails', '20% off every course', 'Priority booking from 1 Oct'], hot: true },
            { n: 'Family', p: '£64', f: ['Up to four sailors', 'Youth club included', 'Summer regatta entry', '15% off every course'] },
          ].map((t) => (
            <div key={t.n} className={`tw-tier${t.hot ? ' is-hot' : ''}`}>
              {t.hot && <span className="tw-tier-tag">Most popular</span>}
              <h3>{t.n}</h3>
              <p className="tw-price"><b>{t.p}</b> <span>a month</span></p>
              <ul>{t.f.map((x) => <li key={x}>{x}</li>)}</ul>
              <a className={`tw-btn${t.hot ? '' : ' tw-btn-line'}`} href="#top">Join as {t.n}</a>
            </div>
          ))}
        </div>
      </section>

      {/* ── Visit ── */}
      <section className="tw-sec" id="visit">
        <div className="tw-visit">
          <div className="tw-chart" role="img" aria-label="A chart of Falmouth harbour showing the school at Port Pendennis, the Carrick Roads to the north and St Anthony Head across the bay">
            <svg viewBox="0 0 520 400" aria-hidden="true">
              <rect width="520" height="400" className="ch-sea" />
              <path className="ch-deep" d="M 300 400 C 320 330, 360 280, 352 210 C 346 150, 380 90, 420 0 L 520 0 L 520 400 Z" />
              <path className="ch-contour" d="M 260 400 C 290 330, 320 280, 316 210 C 312 150, 340 90, 372 0" />
              <path className="ch-contour" d="M 222 400 C 250 330, 280 270, 280 210 C 280 150, 300 90, 330 0" />
              <path className="ch-land" d="M 0 0 H 300 C 290 40, 270 70, 250 96 C 232 120, 236 150, 214 176 C 196 198, 210 226, 196 250 C 184 272, 150 280, 140 304 C 128 332, 92 352, 60 362 C 36 370, 14 380, 0 384 Z" />
              <path className="ch-land" d="M 520 220 C 492 226, 470 240, 452 262 C 440 278, 446 300, 430 318 C 418 330, 400 336, 396 352 C 392 372, 420 392, 440 400 H 520 Z" />
              <path className="ch-coast" d="M 300 0 C 290 40, 270 70, 250 96 C 232 120, 236 150, 214 176 C 196 198, 210 226, 196 250 C 184 272, 150 280, 140 304 C 128 332, 92 352, 60 362 C 36 370, 14 380, 0 384" />
              <path className="ch-coast" d="M 520 220 C 492 226, 470 240, 452 262 C 440 278, 446 300, 430 318 C 418 330, 400 336, 396 352 C 392 372, 420 392, 440 400" />
              <path className="ch-town" d="M 236 0 H 300 C 290 40, 270 70, 250 96 C 232 120, 236 150, 214 176 C 196 198, 210 226, 196 250 C 184 266, 166 274, 152 286 C 140 270, 150 252, 160 236 C 176 206, 170 180, 186 150 C 200 120, 204 96, 218 66 C 228 44, 234 20, 236 0 Z" />
              <path className="ch-chan" d="M 380 400 C 372 340, 340 300, 330 250 C 322 200, 332 140, 352 60" />
              {[[338, 300, 'r'], [372, 292, 'g'], [324, 230, 'r'], [356, 224, 'g'], [332, 160, 'r'], [366, 156, 'g']].map(([x, y, c], i) => <circle key={i} cx={x} cy={y} r="5" className={`ch-buoy ${c}`} />)}
              {[[300, 360, '12'], [420, 140, '24'], [420, 70, '31'], [290, 120, '8'], [260, 300, '6'], [400, 220, '18'], [356, 380, '15'], [470, 180, '27']].map(([x, y, t]) => <text key={`${x}-${y}`} x={x} y={y} className="ch-sound">{t}</text>)}
              <text x="60" y="120" className="ch-name">FALMOUTH</text>
              <text x="380" y="40" className="ch-name ch-it">Carrick Roads</text>
              <text x="440" y="380" className="ch-name">St Anthony Head</text>
              <text x="40" y="300" className="ch-name ch-it">Pendennis Point</text>
              <g className="ch-pin" transform="translate(206 214)"><circle r="16" /><circle r="6" /></g>
              <g className="ch-rose" transform="translate(474 96)"><circle r="20" /><circle r="14" /><path d="M 0 -24 L 4 0 L 0 -4 L -4 0 Z" /><path d="M 0 24 L 4 0 L 0 4 L -4 0 Z" className="s" /><text y="-28">N</text></g>
            </svg>
            <span className="tw-chart-tag"><Mark size={18} />Tidewater · Port Pendennis, pontoon C</span>
          </div>
          <div className="tw-visit-copy">
            <p className="tw-kick">Visit</p>
            <h2 className="tw-h2">Find us on pontoon C.</h2>
            <p className="tw-p">Port Pendennis Marina, Challenger Quay, Falmouth TR11 3TF. Ten minutes’ walk from Falmouth Docks station; parking at the marina.</p>
            <dl className="tw-hours-list">
              <div><dt>Office</dt><dd>Daily 08:30 – 17:30, March to October</dd></div>
              <div><dt>Winter</dt><dd>Mon – Fri 09:00 – 16:00</dd></div>
              <div><dt>Phone</dt><dd>01326 000 487</dd></div>
            </dl>
            <div className="tw-faq">
              {[
                ['What should I bring?', 'Soft bag (no suitcases), warm layers, a hat, suncream and soft-soled shoes. We lend lifejackets, and oilskins for £35.'],
                ['What if the weather is bad?', 'We sail in most conditions inside the harbour. Above force 6 we train ashore or move you to another date at no cost.'],
                ['Can I come on my own?', 'Most of our crew do. Courses mix solo sailors, friends and couples — you’ll share a cabin with someone of your choosing.'],
              ].map(([q, a], i) => (
                <details key={q} open={i === 0}><summary>{q}</summary><p>{a}</p></details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Sign-up ── */}
      <section className="tw-final">
        <div className="tw-final-in">
          <h2 className="tw-h2">The 2027 season opens on 1 March.</h2>
          <p className="tw-p">One email a month: new dates, the odd last-minute place, and tide times for the weekend.</p>
          <form className="tw-news" onSubmit={(e) => e.preventDefault()}>
            <input type="email" placeholder="you@example.com" aria-label="Email address" />
            <button type="submit" className="tw-btn">Sign up</button>
          </form>
        </div>
      </section>
    </Site>
  );
}
