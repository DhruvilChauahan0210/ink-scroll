'use client';

import './linework.css';
import type { ReactNode } from 'react';
import { ScrollDraw } from 'svg-scroll-draw/react';
import { PRESETS } from 'svg-scroll-draw';
import { Site } from '../kit/Site';
import { POSTER, CELLAR, NORTHBEAM, KILN, HEADLAND, STRIDE, ROUGHS } from './art';

/*
 * Linework — the portfolio of an illustration and motion studio in Ghent.
 * Five client pieces, each shown where it lives (a wine label, a business
 * card, a website hero, a pitch-deck slide, an App Store listing), and each
 * one draws with a different one-word preset: sketch, reveal, cinematic,
 * typewriter, spring. The settings printed under every piece are read from
 * PRESETS, so they are the ones actually running. The poster in the hero
 * draws itself once on load (autoplay).
 */

type PresetName = keyof typeof PRESETS;

const settings = (name: PresetName) => {
  const p = PRESETS[name] as Record<string, unknown>;
  return [p.easing, p.speed !== undefined ? `${p.speed}×` : null, p.stagger !== undefined ? `stagger ${p.stagger}` : null, p.fade ? 'fade' : null, p.once ? 'once' : null].filter(Boolean).join(' · ');
};

/* Every client piece is the same call: one preset, drawn as it scrolls in. */
function Piece({ preset, className, viewBox, label, children }: { preset: PresetName; className: string; viewBox: string; label: string; children: ReactNode }) {
  return (
    <ScrollDraw className={`lw-piece ${className}`} preset={preset} trigger={{ start: 'top 90%', end: 'top 40%' }} once>
      <svg viewBox={viewBox} role="img" aria-label={label}>{children}</svg>
    </ScrollDraw>
  );
}
const paths = (ds: string[], cls?: string) => ds.map((d, i) => <path key={i} className={cls} d={d} />);

/* ── The five pieces, in context ──────────────────────────────────────── */

/* The label face, used twice: on the bottle and on the flat proof. */
function LabelFace({ big = false }: { big?: boolean }) {
  return (
    <div className="lw-face">
      <span className="lw-face-top">Orchard <i>&amp;</i> Vine</span>
      <Piece preset="sketch" className="lw-p-cellar" viewBox="16 30 168 192" label={big ? 'A cellar door under a grapevine, drawn in pen' : 'The same drawing, on the bottle'}>
        {paths(CELLAR)}
      </Piece>
      <span className="lw-face-name">Cellar Door</span>
      <span className="lw-face-sub">Pinot Noir · Hageland</span>
      <span className="lw-face-foot"><b>2024</b><b>75 cl · 12.5% vol</b></span>
    </div>
  );
}

function WineLabel() {
  return (
    <div className="lw-stage lw-st-wine">
      <span className="lw-spec">Label · 90 × 120 mm · two-colour letterpress</span>
      <div className="lw-wine">
      <div className="lw-bottle">
        <svg className="lw-glass" viewBox="0 0 240 600" aria-hidden="true">
          <defs>
            <linearGradient id="lw-glass-g" x1="0" x2="1">
              <stop offset="0" stopColor="#0b130e" />
              <stop offset="0.22" stopColor="#2a3d2d" />
              <stop offset="0.36" stopColor="#15211a" />
              <stop offset="0.8" stopColor="#0d1510" />
              <stop offset="1" stopColor="#070c09" />
            </linearGradient>
            <linearGradient id="lw-foil-g" x1="0" x2="1">
              <stop offset="0" stopColor="#4a1219" />
              <stop offset="0.3" stopColor="#8e2a35" />
              <stop offset="1" stopColor="#3a0e14" />
            </linearGradient>
          </defs>
          <path d="M98 20 Q98 6 112 6 H128 Q142 6 142 20 V170 C142 215 210 225 210 290 V572 Q210 590 192 590 H48 Q30 590 30 572 V290 C30 225 98 215 98 170 Z" fill="url(#lw-glass-g)" />
          <path d="M97 18 Q97 4 112 4 H128 Q143 4 143 18 V104 H97 Z" fill="url(#lw-foil-g)" />
          <path d="M97 92 H143" stroke="#c9a24a" strokeWidth="2" />
          <rect x="50" y="300" width="9" height="250" rx="4.5" fill="#fff" opacity="0.07" />
          <rect x="106" y="112" width="5" height="70" rx="2.5" fill="#fff" opacity="0.08" />
        </svg>
        <div className="lw-bottle-label"><LabelFace /></div>
      </div>
      <div className="lw-proof">
        <span className="lw-crop" aria-hidden="true"><i /><i /><i /><i /></span>
        <LabelFace big />
        <span className="lw-proof-note" aria-hidden="true"><i className="a" />Ink 1 · oxblood <i className="b" />Ink 2 · black</span>
      </div>
      </div>
    </div>
  );
}

function BusinessCard() {
  return (
    <div className="lw-stage lw-st-card">
      <span className="lw-spec">Mark construction · business cards</span>
      <div className="lw-cards">
        <div className="lw-card lw-card-back" aria-hidden="true">
          <b>Ines Varga</b>
          <span>Head of platform</span>
          <span className="lw-card-mono">ines@northbeam.dev<br />+31 20 794 1180</span>
          <span className="lw-card-mono lw-card-addr">Keizersgracht 221 · Amsterdam</span>
        </div>
        <div className="lw-card lw-card-front">
          <Piece preset="reveal" className="lw-p-mark" viewBox="0 0 160 160" label="The Northbeam mark, a peak and a beam, with its construction circles">
            {paths(NORTHBEAM.guides, 'g')}
            {paths(NORTHBEAM.mark, 'm')}
          </Piece>
          <span className="lw-card-word">Northbeam</span>
          <span className="lw-card-tag">Edge cloud · Amsterdam</span>
        </div>
      </div>
    </div>
  );
}

function SiteHero() {
  return (
    <div className="lw-stage lw-st-web">
      <span className="lw-spec">Hero illustration · tidewater-sailing.co.uk</span>
      <div className="lw-browser">
        <div className="lw-browser-bar" aria-hidden="true">
          <span className="lw-lights"><i /><i /><i /></span>
          <span className="lw-url"><svg viewBox="0 0 12 12" width="10" height="10"><path d="M3.5 5.5V4a2.5 2.5 0 0 1 5 0v1.5M2.5 5.5h7v5h-7z" fill="none" stroke="currentColor" strokeWidth="1.2" /></svg>tidewater-sailing.co.uk</span>
        </div>
        <div className="lw-tw">
          <div className="lw-tw-nav" aria-hidden="true">
            <b><svg viewBox="0 0 24 24" width="17" height="17"><path d="M12 3 V17 M12 4 C 15 8 17 12 18 16 H12 M3 19 C 8 21 16 21 21 19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>Tidewater</b>
            <span>Courses</span><span>Calendar</span><span>Our boats</span><span>Visit</span>
            <em>Book a course</em>
          </div>
          <div className="lw-tw-hero">
            <div className="lw-tw-copy">
              <span className="lw-tw-kick">Sailing school · Falmouth, Cornwall</span>
              <span className="lw-tw-h">Learn to sail where the river meets the bay.</span>
              <span className="lw-tw-p">Taster days, five-day courses and Day Skipper, aboard our own fleet out of Custom House Quay.</span>
              <span className="lw-tw-ctas"><em>Book a taster day — £95</em><u>See the 2027 calendar</u></span>
            </div>
            <Piece preset="cinematic" className="lw-p-headland" viewBox="0 20 600 330" label="A sailing boat in a bay below a headland with a lighthouse">
              {paths(HEADLAND)}
            </Piece>
          </div>
          <div className="lw-tw-cards" aria-hidden="true">
            {[['Taster day', '1 day · from 12', '£95'], ['Competent Crew', '5 days · no experience', '£540'], ['Day Skipper', '5 days · some miles', '£620']].map(([t, s, p]) => (
              <span key={t}><b>{t}</b><i>{s}</i><em>{p}</em></span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DeckSlide() {
  return (
    <div className="lw-stage lw-st-deck">
      <span className="lw-spec">Slide 07 of 24 · series A deck</span>
      <div className="lw-slide">
        <div className="lw-slide-in">
        <div className="lw-slide-top"><b>Kiln <i>&amp;</i> Co</b><span>07</span></div>
        <span className="lw-slide-h">From clay to counter in twelve days.</span>
        <Piece preset="typewriter" className="lw-p-kiln" viewBox="14 0 612 172" label="A process diagram: a lump of clay, the potter's wheel, the kiln and a glazed vase">
          {paths(KILN)}
        </Piece>
        <div className="lw-slide-steps">
          {[['Day 1', 'Wedge'], ['Day 2', 'Throw'], ['Day 6', 'Fire'], ['Day 9', 'Glaze']].map(([d, s]) => <span key={s}><i>{d}</i>{s}</span>)}
        </div>
        <span className="lw-slide-foot">Every piece made to order in our Leith workshop · 4,200 pieces shipped in 2026</span>
        </div>
      </div>
      <div className="lw-strip" aria-hidden="true">{[0, 1, 2, 3, 4].map((i) => <i key={i} className={i === 2 ? 'on' : undefined} />)}</div>
    </div>
  );
}

function AppListing() {
  return (
    <div className="lw-stage lw-st-app">
      <span className="lw-spec">App icon · iOS and Android</span>
      <div className="lw-phone">
        <div className="lw-phone-status" aria-hidden="true"><b>9:41</b><span /></div>
        <div className="lw-store">
          <div className="lw-store-top">
            <div className="lw-icon">
              <Piece preset="spring" className="lw-p-icon" viewBox="8 8 184 184" label="The Stride app icon: a running route from a start ring to a flag">
                {paths(STRIDE)}
              </Piece>
            </div>
            <div className="lw-store-id">
              <b>Stride</b>
              <span>Runs that draw themselves</span>
              <span className="lw-store-get"><em>Get</em><i>In-app purchases</i></span>
            </div>
          </div>
          <div className="lw-store-stats" aria-hidden="true">
            <span><i>21K ratings</i><b>4.8</b><s>★★★★★</s></span>
            <span><i>Chart</i><b>No. 3</b><s>Health &amp; Fitness</s></span>
            <span><i>Age</i><b>4+</b><s>Years old</s></span>
          </div>
          <div className="lw-store-shots" aria-hidden="true">
            {['M8 70 C 20 60 18 40 34 36 C 48 32 44 14 60 10', 'M8 20 C 24 30 30 18 40 34 C 48 46 56 40 60 64', 'M10 40 C 20 20 40 64 50 30 C 54 18 58 24 60 20'].map((d, i) => (
              <span key={i}><svg viewBox="0 0 68 80"><path d={d} /></svg><b>{['12.4 km', '5:12 /km', '41 runs'][i]}</b></span>
            ))}
          </div>
          <div className="lw-store-new" aria-hidden="true">
            <p><b>What’s New</b><i>Version 6.2 · 3d ago</i></p>
            <span>Your route now draws itself the moment you finish a run. Share the animation to your club in one tap.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const WORK: { id: string; preset: PresetName; client: string; title: string; year: string; tags: string[]; wide?: boolean; stage: ReactNode }[] = [
  { id: 'orchard', preset: 'sketch', client: 'Orchard & Vine', title: 'A cellar door for a Hageland pinot noir — label art drawn in one pen, printed in two colours.', year: '2026', tags: ['Packaging', 'Illustration'], stage: <WineLabel /> },
  { id: 'northbeam', preset: 'reveal', client: 'Northbeam', title: 'An identity for an edge cloud: a peak and a beam, built on two circles.', year: '2026', tags: ['Identity', 'Motion'], stage: <BusinessCard /> },
  { id: 'tidewater', preset: 'cinematic', client: 'Tidewater', title: 'Hero illustration and site art for a sailing school on the Fal — the bay, the boat and St Anthony light.', year: '2026', tags: ['Web', 'Illustration', 'Motion'], wide: true, stage: <SiteHero /> },
  { id: 'kiln', preset: 'typewriter', client: 'Kiln & Co', title: 'Twenty-four slides of process diagrams for a ceramics studio’s series A.', year: '2026', tags: ['Editorial', 'Information design'], stage: <DeckSlide /> },
  { id: 'stride', preset: 'spring', client: 'Stride', title: 'An app icon and route animations for a running app.', year: '2025', tags: ['Product', 'Icons'], stage: <AppListing /> },
];

/* ── Process: a motion comp, mid-edit ─────────────────────────────────── */

const LAYERS = [
  { n: 'sun', c: '#e2a93b', s: 0, e: 38, k: [0, 34] },
  { n: 'gulls', c: '#7fa7c4', s: 22, e: 100, k: [22, 58, 96] },
  { n: 'lighthouse_beam', c: '#e8471c', s: 36, e: 100, k: [36, 64, 92] },
  { n: 'sail_main', c: '#3f8a63', s: 18, e: 64, k: [18, 41, 64] },
  { n: 'boat', c: '#3f8a63', s: 8, e: 92, k: [8, 50, 92] },
  { n: 'waves_front', c: '#4c72b0', s: 0, e: 100, k: [0, 25, 50, 75, 100] },
  { n: 'headland', c: '#9a8668', s: 0, e: 30, k: [0, 30] },
];

function MotionComp() {
  return (
    <div className="lw-app" role="img" aria-label="The studio's animation software mid-edit: the Tidewater hero in the viewer, the main sail's trim path at 64 percent, and a timeline of seven layers with keyframes">
      <div className="lw-app-bar">
        <span className="lw-lights"><i /><i /><i /></span>
        <span className="lw-app-file">tidewater_hero_loop.lw <i>— Comp 1</i></span>
        <span className="lw-app-tc">00:00:02:14 <i>25 fps</i></span>
      </div>
      <div className="lw-app-top">
        <div className="lw-viewer">
          <svg viewBox="0 20 600 330" aria-hidden="true">{paths(HEADLAND)}</svg>
          <span className="lw-viewer-sel" />
          <span className="lw-viewer-zoom">50% · Full · 1920 × 1080</span>
        </div>
        <div className="lw-props">
          <p className="lw-props-h">sail_main <i>· Shape layer</i></p>
          <dl>
            <div><dt>Position</dt><dd>312.0, 204.0</dd></div>
            <div><dt>Rotation</dt><dd>−4.0°</dd></div>
            <div><dt>Stroke width</dt><dd>2.4 px</dd></div>
            <div className="on"><dt>Trim paths · End</dt><dd>64%</dd></div>
          </dl>
          <div className="lw-graph">
            <svg viewBox="0 0 200 90" aria-hidden="true">
              <path className="lw-graph-grid" d="M0 22 H200 M0 45 H200 M0 68 H200 M50 0 V90 M100 0 V90 M150 0 V90" />
              <path className="lw-graph-curve" d="M8 82 C 80 82, 120 8, 192 8" />
              <path className="lw-graph-handle" d="M8 82 H80 M192 8 H120" />
              <circle cx="80" cy="82" r="3.5" /><circle cx="120" cy="8" r="3.5" />
            </svg>
            <span>Ease in-out · 72% influence</span>
          </div>
        </div>
      </div>
      <div className="lw-tl">
        <div className="lw-tl-head"><span>Layer</span><div className="lw-ruler">{['0s', '1s', '2s', '3s', '4s', '5s', '6s'].map((t) => <i key={t}>{t}</i>)}</div></div>
        {LAYERS.map((l, i) => (
          <div key={l.n} className={`lw-tl-row${l.n === 'sail_main' ? ' on' : ''}`}>
            <span className="lw-tl-name"><i style={{ background: l.c }} /><em>{i + 1}</em>{l.n}</span>
            <div className="lw-tl-track">
              <span className="lw-tl-bar" style={{ left: `${l.s}%`, width: `${l.e - l.s}%`, background: l.c }} />
              {l.k.map((k) => <b key={k} style={{ left: `${k}%` }} />)}
            </div>
          </div>
        ))}
        <span className="lw-playhead" aria-hidden="true" />
      </div>
    </div>
  );
}

const STEPS = [
  { w: 'Week 1', t: 'Brief and references', d: 'A morning with your team, then a mood wall: the pens, the papers, the colours, the brands we will not look like.' },
  { w: 'Weeks 2–3', t: 'Pencil roughs', d: 'Thirty to sixty thumbnails, then three routes drawn up properly. You pick one; we push it.' },
  { w: 'Week 4', t: 'Ink and colour', d: 'Every line inked by hand and redrawn as clean vectors, on a grid your printer and developers can use.' },
  { w: 'Weeks 5–6', t: 'Motion and handover', d: 'The drawing learns to move: stings, loops, Lottie and SVG that draws itself — with the files and a guide.' },
];

/* ── Services ─────────────────────────────────────────────────────────── */

const SERVICES = [
  { t: 'Brand illustration', d: 'Illustrated identities, mascots and the drawings a brand keeps coming back to.', x: ['Identity worlds', 'Mascots', 'Campaign art'], icon: 'M6 26 C 10 14, 16 8, 26 6 C 24 14, 18 20, 8 24 M6 26 l4 -1' },
  { t: 'Packaging', d: 'Labels, boxes and tins, drawn to the dieline and proofed with your printer.', x: ['Labels', 'Dielines', 'Print proofing'], icon: 'M8 10 h16 v18 h-16 z M8 10 l3 -5 h10 l3 5 M12 17 h8' },
  { t: 'Motion', d: 'Logo stings, explainer films and product animation, from storyboard to final render.', x: ['Logo stings', 'Explainers', 'UI motion'], icon: 'M6 8 h20 v16 h-20 z M13 12 v8 l7 -4 z' },
  { t: 'Editorial and information design', d: 'Covers, spot illustration, maps and diagrams that make a hard idea easy.', x: ['Covers', 'Maps', 'Diagrams'], icon: 'M6 6 h9 v20 h-9 z M17 6 h9 v20 h-9 z M9 11 h3 M20 11 h3 M9 15 h3 M20 15 h3' },
  { t: 'Icon systems', d: 'Twenty-four to four hundred icons on one grid, one stroke and one set of rules.', x: ['Product icons', 'Pictograms', 'Wayfinding'], icon: 'M6 6 h8 v8 h-8 z M18 6 h8 v8 h-8 z M6 18 h8 v8 h-8 z M22 18 a4 4 0 1 0 0.01 0' },
  { t: 'Web and product', d: 'Hero art, onboarding and empty states, shipped as SVG that draws itself on scroll.', x: ['Hero art', 'Onboarding', 'Scroll-drawn SVG'], icon: 'M5 7 h22 v18 h-22 z M5 11 h22 M9 21 c 3 -6 6 -6 8 -2 s 5 2 7 -4' },
];

const CLIENTS = ['Orchard & Vine', 'Northbeam', 'Tidewater', 'Kiln & Co', 'Stride', 'Ferrow Coffee Roasters', 'Hearth & Field', 'Fieldnotes', 'Greenline', 'Mint & Co', 'Atelier Nord', 'Folio', 'Quillmark', 'Parcelry', 'Halyard Capital', 'Maison Calder', 'Brasserie Ottilie', 'Fjell Outdoor', 'Kade Brewing', 'Sora Ceramics'];

export function LineworkSite() {
  return (
    <Site
      className="lw"
      brand={<>Linework<span className="lw-dot">.</span></>}
      links={['Work', 'Studio', 'Services', 'Journal', 'Contact']}
      cta="Start a project"
      example="presets"
      apis="preset option · one-liner setup"
      footnote="Illustration and motion studio · Oude Houtlei 104, Ghent"
    >
      {/* ── Hero: a statement, and the studio poster drawing itself ── */}
      <section className="lw-hero">
        <div className="lw-hero-meta">
          <span>Illustration &amp; motion studio</span>
          <span>Ghent, Belgium · since 2014</span>
          <span className="lw-open"><i />Booking projects from February 2027</span>
        </div>
        <h1 className="lw-h1">We draw brands, then <em>teach them to move</em></h1>
        <div className="lw-hero-sub">
          <p>Linework is twenty-three illustrators, animators and designers on a canal in Ghent. We make the drawings behind labels, logos, apps and campaigns — and the motion that brings them to life on screen.</p>
          <div className="lw-hero-ctas">
            <a className="lw-btn" href="#work">See selected work</a>
            <a className="lw-link" href="#contact">hello@linework.studio</a>
          </div>
        </div>
        <figure className="lw-poster">
          <ScrollDraw className="lw-poster-art" autoplay duration={1300} delay={250} stagger={0.03} easing="ease-in-out" once>
            <svg viewBox="0 0 1200 380" role="img" aria-label="The Graslei in Ghent at dusk: stepped-gable guild houses on the quay, the towers of Saint Nicholas, the Belfry and Saint Bavo behind them, a tour boat on the canal">
              {paths(POSTER.towers, 'p-tower')}
              {POSTER.houses.map((h, i) => (
                <g key={i}>
                  <path className="p-shell" d={h.shell} />
                  <path className="p-win" d={h.win} />
                  <path className="p-detail" d={h.detail} />
                </g>
              ))}
              {paths(POSTER.water, 'p-water')}
              {paths(POSTER.boat, 'p-boat')}
              {paths(POSTER.sky, 'p-sky')}
            </svg>
          </ScrollDraw>
          <figcaption>
            <span><b>Graslei at dusk</b> — studio poster, 2026</span>
            <span>Screenprint, 70 × 100 cm, edition of 120</span>
          </figcaption>
        </figure>
      </section>

      {/* ── Selected work: five pieces, five presets ── */}
      <section className="lw-sec" id="work">
        <header className="lw-head">
          <span className="lw-label">(01) Selected work</span>
          <h2 className="lw-h2">Five commissions from this year, each one draws itself as you reach it</h2>
          <a className="lw-more" href="#work">All 48 projects <span aria-hidden="true">→</span></a>
        </header>
        <div className="lw-works">
          {WORK.map((w) => (
            <article key={w.id} className={`lw-work lw-w-${w.id}${w.wide ? ' is-wide' : ''}`}>
              {w.stage}
              <div className="lw-cap">
                <div className="lw-cap-main">
                  <h3>{w.client}</h3>
                  <p>{w.title}</p>
                </div>
                <div className="lw-cap-side">
                  <span className="lw-year">{w.year}</span>
                  <span className="lw-tags">{w.tags.map((t) => <i key={t}>{t}</i>)}</span>
                </div>
              </div>
              <code className="lw-preset">preset: &apos;{w.preset}&apos; <i>{settings(w.preset)}</i></code>
            </article>
          ))}
        </div>
      </section>

      {/* ── Studio ── */}
      <section className="lw-sec lw-studio" id="studio">
        <span className="lw-label">(02) Studio</span>
        <p className="lw-statement">We started as two illustrators sharing a desk above a bakery on the Kraanlei. Twelve years on we are twenty-three people — and every line still starts <em>on paper,</em> before it ever moves.</p>
        <figure className="lw-roughs">
          <div className="lw-roughs-sheet">
            {ROUGHS.map((r, i) => (
              <span key={i} className={`lw-rough${r.pick ? ' is-pick' : ''}`}>
                <i>{i + 1}</i>
                <svg viewBox={r.vb} aria-hidden="true">{r.d.map((d, k) => <path key={k} d={d} />)}</svg>
                {r.pick && <>
                  <svg className="lw-ring" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M50 4 C82 2 98 26 96 52 C94 82 70 97 44 96 C16 94 3 72 4 46 C5 22 24 6 56 5" /></svg>
                  <em>this one — SDC</em>
                </>}
              </span>
            ))}
          </div>
          <figcaption>Roughs for Orchard &amp; Vine, week two. Number four became the label.</figcaption>
        </figure>
        <dl className="lw-nums">
          <div><dt>Founded</dt><dd>2014</dd><span>by Saar De Clercq and Jonas Verhaeghe</span></div>
          <div><dt>In the studio</dt><dd>23</dd><span>illustrators, animators, one type designer, one producer</span></div>
          <div><dt>Brands drawn for</dt><dd>140+</dd><span>in 19 countries, from breweries to banks</span></div>
          <div><dt>A typical commission</dt><dd>6 wk</dd><span>from the first call to the files on your server</span></div>
        </dl>
      </section>

      {/* ── Process ── */}
      <section className="lw-sec lw-process" id="process">
        <header className="lw-head">
          <span className="lw-label">(03) Process</span>
          <h2 className="lw-h2">Pencil first, then pen, then it moves</h2>
        </header>
        <ol className="lw-steps">
          {STEPS.map((s, i) => (
            <li key={s.t}><span className="lw-step-w"><b>0{i + 1}</b>{s.w}</span><h3>{s.t}</h3><p>{s.d}</p></li>
          ))}
        </ol>
        <figure className="lw-comp">
          <MotionComp />
          <figcaption>Week five on Tidewater: the main sail draws on a trim path, eased in and out, two seconds into a six-second loop.</figcaption>
        </figure>
      </section>

      {/* ── Services ── */}
      <section className="lw-sec lw-services" id="services">
        <header className="lw-head">
          <span className="lw-label">(04) Services</span>
          <h2 className="lw-h2">What we are asked to draw</h2>
        </header>
        <ul className="lw-svc">
          {SERVICES.map((s, i) => (
            <li key={s.t}>
              <span className="lw-svc-n">0{i + 1}</span>
              <svg className="lw-svc-icon" viewBox="0 0 32 32" aria-hidden="true"><path d={s.icon} /></svg>
              <h3>{s.t}</h3>
              <p>{s.d}</p>
              <span className="lw-svc-x">{s.x.map((x) => <i key={x}>{x}</i>)}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Clients and a word from one ── */}
      <section className="lw-sec lw-clients">
        <div className="lw-quotes">
        <figure className="lw-quote">
          <blockquote>“They drew our whole range in six weeks and the labels sold the wine before anyone had tasted it. The cellar door is on every bottle, every crate and the sign over the actual door.”</blockquote>
          <figcaption><span className="lw-avatar" aria-hidden="true">EM</span><span><b>Elise Maes</b>Founder, Orchard &amp; Vine</span></figcaption>
        </figure>
        <figure className="lw-quote is-small">
          <blockquote>“Three of our investors asked who made the deck. The diagrams did more for the round than our spreadsheet did.”</blockquote>
          <figcaption><span className="lw-avatar is-clay" aria-hidden="true">CR</span><span><b>Callum Reid</b>Co-founder, Kiln &amp; Co</span></figcaption>
        </figure>
        </div>
        <div className="lw-list">
          <span className="lw-label">Selected clients</span>
          <ul>{CLIENTS.map((c) => <li key={c}>{c}</li>)}</ul>
        </div>
      </section>

      {/* ── Contact ── */}
      <section className="lw-contact" id="contact">
        <span className="lw-label">(05) Contact</span>
        <p className="lw-contact-lede">Have something that needs drawing?</p>
        <a className="lw-mail" href="#contact">hello@linework.studio</a>
        <div className="lw-contact-grid">
          <div><span className="lw-label">New business</span><p><b>Saar De Clercq</b>Studio director<br />saar@linework.studio</p></div>
          <div><span className="lw-label">Studio</span><p>Oude Houtlei 104<br />9000 Gent, Belgium<br />+32 9 233 41 70</p></div>
          <div><span className="lw-label">Open studio</span><p>First Thursday of the month, 18:00.<br />Next: Thursday 4 December.</p></div>
          <div><span className="lw-label">Careers</span><p><span className="lw-open"><i />Hiring</span> A senior motion designer, Ghent or remote in CET.</p></div>
        </div>
      </section>
    </Site>
  );
}
