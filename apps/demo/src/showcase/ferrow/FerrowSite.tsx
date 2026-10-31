'use client';

import './ferrow.css';
import { useCallback, useRef, useState } from 'react';
import { ScrollDraw } from 'svg-scroll-draw/react';
import { SIGNATURE } from '@/components/home/art/usecase-art';
import { smooth, type P } from '@/components/examples/ink/geo';
import { BuiltWith } from '../BuiltWith';

/*
 * Ferrow Coffee Roasters — a demo site for a fictional small-lot roaster in
 * Lisbon, built with svg-scroll-draw. Everything that draws is the library:
 *   · the emblem inks in on load (autoplay) and onComplete floods its fill
 *   · each lot's origin drawing traces as its card scrolls in (stagger)
 *   · the farm-to-roastery routes draw across the map, one after another
 *   · the roast profile plots itself, its milestones following onProgress
 *   · the head roaster's signature writes itself under her note
 */

/* ── Geometry ─────────────────────────────────────────────────────────── */

const ring = (r: number, cx = 100, cy = 100) =>
  `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx} ${cy + r} A ${r} ${r} 0 1 1 ${cx} ${cy - r}`;
const BEAN = 'M 100 58 C 124 58 132 84 130 104 C 128 126 114 142 100 142 C 76 142 68 116 70 96 C 72 74 86 58 100 58 Z';
const CREASE = 'M 101 60 C 86 84 116 114 99 140';

/* Origin drawings, 240 × 150 each. */
const ORIGINS: Record<string, { ink: string[]; sun: string }> = {
  yirgacheffe: {
    sun: ring(13, 186, 40),
    ink: [
      smooth([[0, 112], [40, 98], [80, 104], [120, 90], [160, 96], [200, 84], [240, 90]]),
      smooth([[0, 126], [44, 114], [92, 120], [138, 106], [182, 112], [240, 104]]),
      smooth([[0, 140], [50, 130], [100, 136], [150, 124], [200, 130], [240, 122]]),
      'M 52 98 V 86 M 46 90 A 6 6 0 1 1 58 90 A 6 6 0 1 1 46 90 M 96 101 V 89 M 90 93 A 6 6 0 1 1 102 93 A 6 6 0 1 1 90 93 M 140 92 V 80 M 134 84 A 6 6 0 1 1 146 84 A 6 6 0 1 1 134 84',
    ],
  },
  tarrazu: {
    sun: ring(11, 52, 36),
    ink: [
      'M 20 132 L 104 50 Q 118 42 132 50 L 220 132',
      'M 106 52 Q 118 60 130 52',
      smooth([[70, 44], [86, 36], [100, 40], [114, 30], [132, 34], [150, 26]]),
      'M 34 140 H 206 M 56 132 l 6 -8 l 6 8 M 84 132 l 6 -8 l 6 8 M 144 132 l 6 -8 l 6 8 M 172 132 l 6 -8 l 6 8',
    ],
  },
  huila: {
    sun: ring(12, 196, 34),
    ink: [
      'M 0 108 L 40 70 L 66 90 L 104 46 L 140 84 L 168 62 L 210 100 L 240 84',
      'M 104 46 L 96 58 M 104 46 L 112 60 M 168 62 L 162 72',
      smooth([[10, 140], [60, 124], [104, 132], [150, 118], [200, 126], [236, 114]]),
      smooth([[22, 146], [70, 134], [118, 142], [170, 130], [226, 136]]),
    ],
  },
};

/* The farm-to-roastery map: an equirectangular sketch, lon −100…60, lat −12…50. */
const MW = 800, MH = 400;
const proj = (lon: number, lat: number): P => [((lon + 100) / 160) * MW, ((50 - lat) / 62) * MH];
const LISBON = proj(-9.14, 38.72);
const FARMS = [
  { id: 'yirgacheffe', name: 'Yirgacheffe', at: proj(38.2, 6.16), km: '6,900 km', days: '19 days' },
  { id: 'tarrazu', name: 'Tarrazú', at: proj(-84.0, 9.66), km: '8,300 km', days: '23 days' },
  { id: 'huila', name: 'Huila', at: proj(-75.6, 2.5), km: '8,000 km', days: '22 days' },
];
const arc = (a: P, b: P, lift: number) => {
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 - lift;
  return `M ${a[0].toFixed(1)} ${a[1].toFixed(1)} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${b[0].toFixed(1)} ${b[1].toFixed(1)}`;
};
const GRATICULE = [
  ...[-80, -60, -40, -20, 0, 20, 40].map((lon) => `M ${proj(lon, 50)[0].toFixed(1)} 0 V ${MH}`),
  ...[40, 20, 0].map((lat) => `M 0 ${proj(-100, lat)[1].toFixed(1)} H ${MW}`),
].join(' ');

/* Roast profile: 0–12 min × 80–230 °C, in a 640 × 280 box. */
const RX0 = 46, RX1 = 620, RY0 = 18, RY1 = 250;
const rx = (min: number) => RX0 + (min / 12) * (RX1 - RX0);
const ry = (c: number) => RY1 - ((c - 80) / 150) * (RY1 - RY0);
const ror = (v: number) => RY1 - (v / 25) * (RY1 - RY0) * 0.55;
const BT: [number, number][] = [[0, 200], [0.6, 138], [1.5, 95], [3, 128], [4.5, 158], [6, 176], [7.5, 188], [8.67, 196], [10, 205], [10.92, 211]];
const ROR: [number, number][] = [[1.5, 21], [3, 17.5], [4.5, 14], [6, 11], [7.5, 8.6], [8.67, 7], [10, 5.2], [10.92, 4.2]];
const BT_PATH = smooth(BT.map(([m, c]) => [rx(m), ry(c)] as P));
const ROR_PATH = smooth(ROR.map(([m, v]) => [rx(m), ror(v)] as P));
/* dx/dy place each label clear of the curve and of its neighbours. */
const MILESTONES = [
  { at: 1.5, c: 95, label: 'Turning point', note: '1:30 · 95 °C', p: 0.18, dx: 12, dy: 4, end: false },
  { at: 4.5, c: 158, label: 'Drying ends', note: '4:30 · 158 °C', p: 0.45, dx: 12, dy: 18, end: false },
  { at: 8.67, c: 196, label: 'First crack', note: '8:40 · 196 °C', p: 0.78, dx: -12, dy: -12, end: true },
  { at: 10.92, c: 211, label: 'Drop', note: '10:55 · 211 °C', p: 0.97, dx: 8, dy: -16, end: true },
];

/* ── Page ─────────────────────────────────────────────────────────────── */

const LOTS = [
  { id: 'yirgacheffe', farm: 'Konga Cooperative', region: 'Yirgacheffe, Ethiopia', process: 'Washed', alt: '1,950–2,100 m', notes: 'Bergamot · white peach · jasmine', price: '€16' },
  { id: 'tarrazu', farm: 'Finca El Alto', region: 'Tarrazú, Costa Rica', process: 'Honey', alt: '1,600 m', notes: 'Cane sugar · red apple · cocoa', price: '€15' },
  { id: 'huila', farm: 'Finca La Esperanza', region: 'Huila, Colombia', process: 'Natural', alt: '1,750 m', notes: 'Strawberry · dark chocolate · rum', price: '€17' },
];

export function FerrowSite() {
  const [sealed, setSealed] = useState(false);
  const roast = useRef<HTMLDivElement>(null);
  const onRoast = useCallback((p: number) => roast.current?.style.setProperty('--fr-p', p.toFixed(3)), []);

  return (
    <div className={`fr${sealed ? ' is-sealed' : ''}`}>
      <header className="fr-nav">
        <a className="fr-brand" href="#top" aria-label="Ferrow, home">
          <svg viewBox="0 0 200 200" width="26" height="26" aria-hidden="true">
            <path d={ring(86)} fill="none" stroke="currentColor" strokeWidth="10" />
            <path d={BEAN} fill="currentColor" />
          </svg>
          Ferrow
        </a>
        <nav className="fr-links" aria-label="Main">
          <a href="#lots">Shop</a>
          <a href="#subscribe">Subscriptions</a>
          <a href="#roast">How we roast</a>
          <a href="#map">Our farms</a>
        </nav>
        <a className="fr-bag" href="#lots">Bag <b>2</b></a>
      </header>

      {/* ── Hero: the emblem draws on load, then the fill floods in ── */}
      <section className="fr-hero" id="top">
        <div className="fr-hero-copy">
          <p className="fr-kick">June lots · roasted Tuesday, shipped Wednesday</p>
          <h1 className="fr-h1">Coffee from three farms, roasted the week you drink it.</h1>
          <p className="fr-lede">
            We buy from three families, roast in small batches in Marvila, Lisbon, and ship within a day of roasting.
            This month: a washed Yirgacheffe, a honey Tarrazú and a natural from Huila.
          </p>
          <div className="fr-ctas">
            <a className="fr-btn" href="#lots">Shop the June lots</a>
            <a className="fr-text" href="#roast">How we roast →</a>
          </div>
        </div>
        <ScrollDraw
          className="fr-emblem"
          selector="path:not(.fr-fill)"
          autoplay
          duration={1700}
          delay={250}
          stagger={0.14}
          easing="ease-out"
          once
          onComplete={() => setSealed(true)}
        >
          <svg viewBox="0 0 200 200" role="img" aria-label="The Ferrow emblem: a coffee bean inside a ring">
            <defs><path id="fr-arc" d={ring(78)} /></defs>
            <path className="fr-fill fr-disc" d={ring(70)} />
            <path className="fr-fill fr-beanfill" d={BEAN} />
            <path className="fr-ink fr-outer" d={ring(86)} />
            <path className="fr-ink fr-inner" d={ring(70)} />
            <path className="fr-ink fr-bean" d={BEAN} />
            <path className="fr-ink fr-crease" d={CREASE} />
            <text className="fr-ringtext">
              <textPath href="#fr-arc" textLength="484" lengthAdjust="spacing">FERROW · COFFEE ROASTERS · LISBON · EST. 2019 ·</textPath>
            </text>
          </svg>
        </ScrollDraw>
      </section>

      <ul className="fr-strip" aria-label="Why Ferrow">
        <li>Roasted every Tuesday in Marvila</li>
        <li>Free shipping over €40</li>
        <li>Home-compostable bags</li>
        <li>Direct trade since 2019</li>
      </ul>

      {/* ── Lots: each origin's drawing traces as its card arrives ── */}
      <section className="fr-sec" id="lots">
        <div className="fr-sec-head">
          <p className="fr-kick">This month</p>
          <h2 className="fr-h2">Three lots, one roast day.</h2>
        </div>
        <div className="fr-lots">
          {LOTS.map((l) => (
            <article key={l.id} className="fr-lot">
              <ScrollDraw className="fr-origin" trigger={{ start: 'top 90%', end: 'top 45%' }} stagger={0.12} easing="ease-out" once>
                <svg viewBox="0 0 240 150" role="img" aria-label={`A line drawing of ${l.region}`}>
                  <path className="fr-ink fr-sun" d={ORIGINS[l.id].sun} />
                  {ORIGINS[l.id].ink.map((d, i) => <path key={i} className="fr-ink fr-land" d={d} />)}
                </svg>
              </ScrollDraw>
              <div className="fr-lot-body">
                <p className="fr-lot-region">{l.region}</p>
                <h3 className="fr-lot-farm">{l.farm}</h3>
                <dl className="fr-lot-meta">
                  <div><dt>Process</dt><dd>{l.process}</dd></div>
                  <div><dt>Altitude</dt><dd>{l.alt}</dd></div>
                </dl>
                <p className="fr-lot-notes">{l.notes}</p>
                <div className="fr-lot-buy">
                  <span><b>{l.price}</b> / 250 g</span>
                  <a className="fr-btn fr-btn-sm" href="#lots">Add to bag</a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── Map: the routes from each farm draw to Lisbon ── */}
      <section className="fr-sec fr-sec-dark" id="map">
        <div className="fr-sec-head">
          <p className="fr-kick">Farm to Marvila</p>
          <h2 className="fr-h2">Every lot, traced to the roastery door.</h2>
        </div>
        <ScrollDraw className="fr-map" selector=".fr-route" trigger={{ start: 'top 80%', end: 'top 20%' }} stagger={0.3} easing="ease-in-out" once>
          <svg viewBox={`0 0 ${MW} ${MH}`} role="img" aria-label="Routes from Yirgacheffe, Tarrazú and Huila to Lisbon">
            <path className="fr-grat" d={GRATICULE} />
            <path className="fr-equator" d={`M 0 ${proj(-100, 0)[1].toFixed(1)} H ${MW}`} />
            <text className="fr-map-t" x="8" y={proj(-100, 0)[1] - 6}>Equator</text>
            {FARMS.map((f, i) => (
              <path key={f.id} className="fr-route" d={arc(f.at, LISBON, 70 + i * 30)} />
            ))}
            {FARMS.map((f) => (
              <g key={`${f.id}-pin`}>
                <circle className="fr-farm" cx={f.at[0]} cy={f.at[1]} r="5" />
                <text className="fr-map-t fr-map-name" x={f.at[0] + 10} y={f.at[1] + 4}>{f.name}</text>
                <text className="fr-map-t" x={f.at[0] + 10} y={f.at[1] + 19}>{f.km} · {f.days}</text>
              </g>
            ))}
            <circle className="fr-home" cx={LISBON[0]} cy={LISBON[1]} r="7" />
            <text className="fr-map-t fr-map-name fr-home-t" x={LISBON[0] + 12} y={LISBON[1] - 8}>Marvila, Lisbon</text>
          </svg>
        </ScrollDraw>
        <ul className="fr-routes">
          {FARMS.map((f) => (
            <li key={f.id}><b>{f.name}</b> → Lisbon <span>{f.km} · {f.days} by sea</span></li>
          ))}
        </ul>
      </section>

      {/* ── Roast: the profile plots itself, milestones follow progress ── */}
      <section className="fr-sec" id="roast">
        <div className="fr-roast-grid">
          <div className="fr-sec-head">
            <p className="fr-kick">How we roast</p>
            <h2 className="fr-h2">Ten minutes and fifty-five seconds, logged every time.</h2>
            <p className="fr-lede">
              Every batch is roasted to a curve and logged. This is Tuesday&apos;s Konga: a gentle drying phase,
              first crack at 8:40, and out of the drum two minutes later, before the floral notes cook off.
            </p>
          </div>
          <div className="fr-roast" ref={roast}>
            <ScrollDraw selector=".fr-curve" trigger={{ start: 'top 80%', end: 'top 25%' }} stagger={0.2} easing="linear" once onProgress={onRoast}>
              <svg viewBox="0 0 640 280" role="img" aria-label="Roast profile: bean temperature from 95 °C at the turning point to 211 °C at drop, with the rate of rise falling">
                {[100, 140, 180, 220].map((c) => (
                  <g key={c}>
                    <path className="fr-rgrid" d={`M ${RX0} ${ry(c).toFixed(1)} H ${RX1}`} />
                    <text className="fr-axis" x={RX0 - 8} y={ry(c) + 4} textAnchor="end">{c}°</text>
                  </g>
                ))}
                {[0, 2, 4, 6, 8, 10, 12].map((m) => (
                  <text key={m} className="fr-axis" x={rx(m)} y={RY1 + 22} textAnchor="middle">{m}:00</text>
                ))}
                <path className="fr-curve fr-ror" d={ROR_PATH} />
                <path className="fr-curve fr-bt" d={BT_PATH} />
                {MILESTONES.map((m) => (
                  <g key={m.label} className="fr-ms" style={{ '--at': m.p } as React.CSSProperties}>
                    <circle cx={rx(m.at)} cy={ry(m.c)} r="5" />
                    <text x={rx(m.at) + m.dx} y={ry(m.c) + m.dy} textAnchor={m.end ? 'end' : 'start'}>
                      <tspan className="fr-ms-l">{m.label}</tspan>
                      <tspan className="fr-ms-n" dx="6">{m.note}</tspan>
                    </text>
                  </g>
                ))}
              </svg>
            </ScrollDraw>
            <div className="fr-roast-key">
              <span><i className="bt" /> Bean temperature</span>
              <span><i className="ror" /> Rate of rise, °C / min</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Subscribe: the head roaster signs her note ── */}
      <section className="fr-sec fr-sub" id="subscribe">
        <div className="fr-sub-offer">
          <p className="fr-kick">Subscription</p>
          <h2 className="fr-h2">Two bags a month, chosen for you.</h2>
          <p className="fr-price"><b>€26</b> a month · skip or cancel any time</p>
          <ul className="fr-list">
            <li>Two 250 g bags of whatever we&apos;re proudest of</li>
            <li>Shipped the day after roasting</li>
            <li>Brew guide and farm notes with every bag</li>
          </ul>
          <a className="fr-btn" href="#subscribe">Start a subscription</a>
        </div>
        <figure className="fr-note">
          <blockquote>
            Every lot is cupped three times before it ships. If a bag doesn&apos;t taste like the notes on its label,
            write to me and I&apos;ll send another.
          </blockquote>
          <ScrollDraw className="fr-sign" trigger={{ start: 'top 85%', end: 'top 45%' }} easing="ease-out" once>
            <svg viewBox="0 30 400 200" role="img" aria-label="Ada Park's signature">
              <path className="fr-sig" d={SIGNATURE} />
            </svg>
          </ScrollDraw>
          <figcaption>Ada Park · head roaster</figcaption>
        </figure>
      </section>

      <footer className="fr-foot">
        <div>
          <span className="fr-brand fr-brand-foot">Ferrow</span>
          <p>Rua do Açúcar 89, Marvila, Lisboa<br />Roastery bar open Thursday–Sunday, 9:00–17:00</p>
        </div>
        <form className="fr-news" onSubmit={(e) => e.preventDefault()}>
          <label htmlFor="fr-email">Roast-day letters, twice a month</label>
          <div><input id="fr-email" type="email" placeholder="you@example.com" /><button type="submit">Join</button></div>
        </form>
        <p className="fr-legal">© 2026 Ferrow Coffee Roasters — a fictional company; this is a demo site.</p>
      </footer>

      <BuiltWith example="logo-reveal" apis="autoplay · onComplete · stagger · onProgress" />
    </div>
  );
}
