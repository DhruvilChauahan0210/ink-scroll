'use client';

import './ferrow.css';
import { useCallback, useRef, useState, type CSSProperties } from 'react';
import Image from 'next/image';
import { ScrollDraw } from 'svg-scroll-draw/react';
import { SIGNATURE } from '@/components/home/art/usecase-art';
import { BuiltWith } from '../BuiltWith';
import {
  ring, BEAN, CREASE, IMG, LABEL_EMBLEM, ORIGINS, MW, MH, proj, LAND, WATER, GRATICULE, LISBON, FARMS, routeD,
  RX0, RX1, RY0, RY1, rx, ry, BT_PATH, ROR_PATH, DEV_BAND, MILESTONES, readout,
  LOTS, GRINDS, FARM_STORIES, CUPPING, BREWS, REVIEWS, FAQ, type Lot,
} from './data';

/*
 * Ferrow Coffee Roasters — a demo site for a fictional small-lot roaster in
 * Lisbon, built with svg-scroll-draw. Everything that draws is the library:
 *   · the emblem inks itself onto the bag's label on load (autoplay), and
 *     onComplete floods it with the brand colours
 *   · each farm's origin drawing traces as its card scrolls in (stagger)
 *   · the farm-to-roastery routes draw across the map, one after another
 *   · the roast profile plots itself; its milestones and the live readout
 *     follow onProgress
 *   · the head roaster's signature writes itself under her note
 * The bags are stills from a WebGL scene of the pouch, rendered offline.
 */

const Star = () => <svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true"><path d="M10 1.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.6 7.7l5.8-.8z" fill="currentColor" /></svg>;
const Stars = ({ n = 5 }: { n?: number }) => (
  <span className="fr-stars" aria-label={`${n} out of 5 stars`}>{Array.from({ length: 5 }, (_, i) => <i key={i} className={i < n ? 'on' : ''}><Star /></i>)}</span>
);
const Ico = ({ d, s = 20 }: { d: string; s?: number }) => (
  <svg className="fr-ico" viewBox="0 0 24 24" width={s} height={s} aria-hidden="true"><path d={d} /></svg>
);
const ICONS = {
  flame: 'M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2.4 1.2-3.8 2.4-5 .2 1.6.9 2.6 2 3 0-3 .1-5.6.6-8z',
  truck: 'M2.5 6.5h11v9h-11zM13.5 9.5h4l3 3v3h-7zM6.5 18.5a1.6 1.6 0 1 0 0-.1M17 18.5a1.6 1.6 0 1 0 0-.1',
  leaf: 'M5 19c0-8 5-13 15-14-1 10-6 15-14 15M5 19l7-7',
  hand: 'M4 13.5l4.5 4.5c1 1 2.2 1.5 3.6 1.5H17a3 3 0 0 0 3-3v-5.5a1.5 1.5 0 0 0-3 0V12M17 11V7.5a1.5 1.5 0 0 0-3 0V11M14 10V6a1.5 1.5 0 0 0-3 0v5M11 10.5V8a1.5 1.5 0 0 0-3 0v6.5L6 12.5a1.6 1.6 0 0 0-2 1z',
  bag: 'M5.5 8h13l-1 12h-11zM9 8V6.5a3 3 0 0 1 6 0V8',
  search: 'M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM15.5 15.5l4.5 4.5',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20c1-4 4-5.5 7.5-5.5s6.5 1.5 7.5 5.5',
  pin: 'M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3.5 2',
  cup: 'M4.5 9h12v5a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5zM16.5 10.5h1.5a2.5 2.5 0 0 1 0 5h-1.6M8 3.5c-.8 1 .8 2-.1 3M12 3.5c-.8 1 .8 2-.1 3',
  check: 'M5 12.5l4.5 4.5L19 7.5',
};

/* ── A product card: size, grind, add to bag ─────────────────────────── */
function LotCard({ lot, onAdd }: { lot: Lot; onAdd: () => void }) {
  const [kilo, setKilo] = useState(false);
  const [grind, setGrind] = useState(GRINDS[0]);
  const [added, setAdded] = useState(false);
  const img = IMG[lot.id];
  return (
    <article className="fr-card">
      <div className="fr-card-plate" style={{ '--plate': lot.plate } as CSSProperties}>
        {lot.badge && <span className="fr-badge">{lot.badge}</span>}
        <span className="fr-score"><b>{lot.score}</b>SCA</span>
        <Image src={img.src} width={img.w} height={img.h} alt={`A 250 g bag of Ferrow ${lot.name}, ${lot.region}`} sizes="(max-width: 700px) 80vw, (max-width: 1200px) 40vw, 300px" />
      </div>
      <div className="fr-card-body">
        <p className="fr-card-region">{lot.region}</p>
        <h3 className="fr-card-name">{lot.name}</h3>
        <p className="fr-card-meta">{lot.process} · {lot.variety} · {lot.alt}</p>
        <ul className="fr-notes" aria-label="Tasting notes">
          {lot.notes.map(([n, c]) => <li key={n}><i style={{ background: c }} />{n}</li>)}
        </ul>
        <div className="fr-roastlvl" aria-label={`Roast level ${lot.roast} of 5`}>
          <span>Roast</span>
          <span className="fr-roastlvl-bar">{[1, 2, 3, 4, 5].map((n) => <i key={n} className={n <= lot.roast ? 'on' : ''} />)}</span>
          <span>{['', 'Light', 'Light-medium', 'Medium', 'Medium-dark', 'Dark'][lot.roast]}</span>
        </div>
        <div className="fr-opts">
          <div className="fr-seg" role="radiogroup" aria-label="Size">
            <button type="button" role="radio" aria-checked={!kilo} className={!kilo ? 'on' : ''} onClick={() => setKilo(false)}>250 g</button>
            <button type="button" role="radio" aria-checked={kilo} className={kilo ? 'on' : ''} onClick={() => setKilo(true)}>1 kg</button>
          </div>
          <label className="fr-select">
            <span className="fr-vh">Grind</span>
            <select value={grind} onChange={(e) => setGrind(e.target.value)}>
              {GRINDS.map((g) => <option key={g}>{g}</option>)}
            </select>
          </label>
        </div>
        <div className="fr-card-buy">
          <span className="fr-card-price"><b>€{kilo ? lot.p1k : lot.p250}</b>{kilo ? '1 kg' : '250 g'}</span>
          <button type="button" className={`fr-btn fr-btn-sm${added ? ' is-added' : ''}`} onClick={() => { onAdd(); setAdded(true); }}>
            {added ? <><Ico d={ICONS.check} s={16} />Added</> : 'Add to bag'}
          </button>
        </div>
      </div>
    </article>
  );
}

/* ── The subscription builder ─────────────────────────────────────────── */
const STYLES = ['Filter', 'Espresso', 'Roaster’s choice'];
const BAGS = [1, 2, 3];
const EVERY = [['2 weeks', 2], ['4 weeks', 4]] as const;
const SUB_BAG = 13.5;
function Opt({ on, label, sub, onClick }: { on: boolean; label: string; sub?: string; onClick: () => void }) {
  return (
    <button type="button" role="radio" aria-checked={on} className={`fr-opt${on ? ' on' : ''}`} onClick={onClick}>
      <b>{label}</b>{sub && <small>{sub}</small>}
    </button>
  );
}
function Builder() {
  const [style, setStyle] = useState(2);
  const [bags, setBags] = useState(2);
  const [every, setEvery] = useState(1);
  const [grind, setGrind] = useState(0);
  const price = bags * SUB_BAG;
  const perCup = price / (bags * 16);
  return (
    <div className="fr-builder">
      <div className="fr-steps">
        <fieldset>
          <legend><i>1</i>What do you brew?</legend>
          <div className="fr-opt-row" role="radiogroup" aria-label="Coffee style">
            {STYLES.map((s, i) => <Opt key={s} on={style === i} label={s} sub={['Lighter, fruit-led', 'Sweet, for milk too', 'Whatever we’re proudest of'][i]} onClick={() => setStyle(i)} />)}
          </div>
        </fieldset>
        <fieldset>
          <legend><i>2</i>How many bags?</legend>
          <div className="fr-opt-row" role="radiogroup" aria-label="Bags per delivery">
            {BAGS.map((b) => <Opt key={b} on={bags === b} label={`${b} × 250 g`} sub={`about ${b * 16} cups`} onClick={() => setBags(b)} />)}
          </div>
        </fieldset>
        <fieldset>
          <legend><i>3</i>How often?</legend>
          <div className="fr-opt-row" role="radiogroup" aria-label="Delivery frequency">
            {EVERY.map(([l], i) => <Opt key={l} on={every === i} label={`Every ${l}`} onClick={() => setEvery(i)} />)}
          </div>
        </fieldset>
        <fieldset>
          <legend><i>4</i>Grind</legend>
          <div className="fr-chips" role="radiogroup" aria-label="Grind">
            {GRINDS.map((g, i) => (
              <button key={g} type="button" role="radio" aria-checked={grind === i} className={grind === i ? 'on' : ''} onClick={() => setGrind(i)}>{g}</button>
            ))}
          </div>
        </fieldset>
      </div>
      <aside className="fr-summary" aria-label="Your subscription">
        <Image src={IMG.duo.src} width={IMG.duo.w} height={IMG.duo.h} alt="Two Ferrow bags, Konga and La Esperanza, with roasted beans" sizes="(max-width: 900px) 90vw, 440px" />
        <div className="fr-sum-body">
          <p className="fr-sum-k">Your box</p>
          <p className="fr-sum-t">{bags} × 250 g · {STYLES[style]} · {GRINDS[grind]}</p>
          <dl className="fr-sum-dl">
            <div><dt>Next roast</dt><dd>Tue 4 Nov</dd></div>
            <div><dt>Arrives</dt><dd>Thu 6 Nov</dd></div>
            <div><dt>Then</dt><dd>every {EVERY[every][0]}</dd></div>
          </dl>
          <div className="fr-sum-price">
            <span><b>€{price.toFixed(2)}</b> a delivery</span>
            <small>€{perCup.toFixed(2)} a cup · <s>€{(bags * 16).toFixed(2)}</s> in the shop · free delivery</small>
          </div>
          <a className="fr-btn fr-btn-block" href="#subscribe">Start for €{price.toFixed(2)}</a>
          <p className="fr-sum-fine">Skip, swap or cancel before any Sunday. No fees.</p>
        </div>
      </aside>
    </div>
  );
}

export function FerrowSite() {
  const [sealed, setSealed] = useState(false);
  const [bag, setBag] = useState(2);
  const [use, setUse] = useState<'all' | 'filter' | 'espresso'>('all');
  const roast = useRef<HTMLDivElement>(null);
  const out = useRef<(HTMLElement | null)[]>([]);
  const onRoast = useCallback((p: number) => {
    roast.current?.style.setProperty('--fr-p', p.toFixed(3));
    const r = readout(p);
    [r.time, r.bt, r.ror, r.phase].forEach((v, i) => { const el = out.current[i]; if (el && el.textContent !== v) el.textContent = v; });
  }, []);
  const end = readout(1);
  const lots = LOTS.filter((l) => use === 'all' || l.use === use || l.use === 'omni');
  const add = useCallback(() => setBag((n) => n + 1), []);
  const box = (k: number) => 2 * 100 / 86 * k; // the emblem's 200-unit box, from its outer ring radius

  return (
    <div className={`fr${sealed ? ' is-sealed' : ''}`}>
      <p className="fr-announce">Roast day is Tuesday — order by <b>Monday 23:59</b> for this week’s batch · Free delivery in Portugal over €40</p>
      <header className="fr-nav">
        <a className="fr-brand" href="#top" aria-label="Ferrow, home">
          <svg viewBox="0 0 200 200" width="28" height="28" aria-hidden="true">
            <path d={ring(86)} fill="none" stroke="currentColor" strokeWidth="11" />
            <path d={ring(66)} fill="currentColor" />
            <path d={BEAN} fill="var(--terra)" transform="translate(30 30) scale(.7)" />
          </svg>
          Ferrow
        </a>
        <nav className="fr-links" aria-label="Main">
          <a href="#shop">Shop</a>
          <a href="#subscribe">Subscriptions</a>
          <a href="#farms">Our farms</a>
          <a href="#roast">How we roast</a>
          <a href="#brew">Brew guides</a>
          <a href="#visit">Visit</a>
        </nav>
        <div className="fr-tools">
          <a href="#shop" aria-label="Search"><Ico d={ICONS.search} /></a>
          <a href="#top" aria-label="Account"><Ico d={ICONS.user} /></a>
          <a className="fr-bagbtn" href="#shop" aria-label={`Bag, ${bag} items`}><Ico d={ICONS.bag} /><b key={bag}>{bag}</b></a>
        </div>
      </header>

      {/* ── Hero: the emblem inks itself onto the bag's label, then floods ── */}
      <section className="fr-hero" id="top">
        <div className="fr-hero-copy">
          <p className="fr-kick">Batch 412 · roasted Tuesday 28 October</p>
          <h1 className="fr-h1">Coffee from three farms, roasted the week you drink it.</h1>
          <p className="fr-lede">
            We buy from the same three families every year, roast in 15 kg batches in Marvila, Lisbon, and ship within a day
            of roasting. This month: a washed Yirgacheffe, a honey Tarrazú and a Pink Bourbon from Huila.
          </p>
          <div className="fr-ctas">
            <a className="fr-btn" href="#shop">Shop the November lots</a>
            <a className="fr-btn fr-btn-ghost" href="#subscribe">Build a subscription</a>
          </div>
          <div className="fr-proof">
            <span><Stars /><b>4.9</b><small>1,286 reviews</small></span>
            <span><b>24 h</b><small>roaster to courier</small></span>
            <span><b>2.6×</b><small>the Fairtrade price</small></span>
          </div>
        </div>
        <div className="fr-stage">
          <div className="fr-shot" style={{ aspectRatio: `${IMG.hero.w} / ${IMG.hero.h}` }}>
            <Image src={IMG.hero.src} width={IMG.hero.w} height={IMG.hero.h} alt="A 250 g bag of Ferrow Konga, Yirgacheffe, with roasted beans spilled in front" sizes="(max-width: 900px) 92vw, 46vw" priority />
            <ScrollDraw
              className="fr-emblem"
              style={{ left: `${LABEL_EMBLEM.x * 100}%`, top: `${LABEL_EMBLEM.y * 100}%`, width: `${box(LABEL_EMBLEM.r) * 100}%` }}
              selector="path:not(.fill)"
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
                <path className="fill fr-disc" d={ring(70)} />
                <path className="fill fr-beanfill" d={BEAN} />
                <path className="fr-ink fr-outer" d={ring(86)} />
                <path className="fr-ink fr-inner" d={ring(70)} />
                <path className="fr-ink fr-bean" d={BEAN} />
                <path className="fr-ink fr-crease" d={CREASE} />
                <text className="fr-ringtext">
                  <textPath href="#fr-arc" textLength="484" lengthAdjust="spacing">FERROW · COFFEE ROASTERS · LISBON · EST. 2019 ·</textPath>
                </text>
              </svg>
            </ScrollDraw>
          </div>
          <div className="fr-float fr-float-a">
            <i><Ico d={ICONS.flame} s={18} /></i>
            <span><b>Roasted 28.10 · batch 412</b><small>Loring S15 · 10 min 55 s</small></span>
          </div>
          <div className="fr-float fr-float-b">
            <span className="fr-float-score">88.5</span>
            <span><b>Konga, washed</b><small>Cupped three times · SCA score</small></span>
          </div>
        </div>
      </section>

      <ul className="fr-strip" aria-label="Why Ferrow">
        {([
          [ICONS.flame, 'Roasted every Tuesday', 'in 15 kg batches'],
          [ICONS.truck, 'Shipped within 24 h', 'free over €40 in Portugal'],
          [ICONS.hand, 'Direct trade since 2019', 'same three farms'],
          [ICONS.leaf, 'Home-compostable bags', 'paper, plant lining, valve'],
        ] as const).map(([d, a, b]) => <li key={a}><i><Ico d={d} /></i><span><b>{a}</b><small>{b}</small></span></li>)}
      </ul>

      {/* ── Shop ── */}
      <section className="fr-sec" id="shop">
        <div className="fr-sec-head fr-split">
          <div>
            <p className="fr-kick">Shop · November lots</p>
            <h2 className="fr-h2">Four coffees on the roaster this month.</h2>
          </div>
          <div className="fr-filter" role="radiogroup" aria-label="Brew method">
            {([['all', 'All coffee'], ['filter', 'Filter'], ['espresso', 'Espresso']] as const).map(([k, l]) => (
              <button key={k} type="button" role="radio" aria-checked={use === k} className={use === k ? 'on' : ''} onClick={() => setUse(k)}>{l}</button>
            ))}
          </div>
        </div>
        <div className="fr-grid">
          {lots.map((l) => <LotCard key={l.id} lot={l} onAdd={add} />)}
        </div>
        <p className="fr-shop-note"><Ico d={ICONS.clock} s={16} />Next roast <b>Tuesday 4 November</b>. Order in the next 2 days to be in it.</p>
      </section>

      {/* ── Farms: each origin's drawing traces as its card arrives ── */}
      <section className="fr-sec fr-farms" id="farms">
        <div className="fr-sec-head">
          <p className="fr-kick">Our farms</p>
          <h2 className="fr-h2">Three families. The same coffee, bought every year.</h2>
          <p className="fr-lede">We visit at harvest, agree the price before the cherries are picked, and pay before the coffee ships. Here’s what we paid this year.</p>
        </div>
        <div className="fr-farm-grid">
          {FARM_STORIES.map((f) => (
            <article key={f.id} className="fr-farm">
              <div className="fr-farm-plate">
                <span className="fr-farm-co">{f.coords}</span>
                <span className="fr-farm-alt">{f.alt}</span>
                <ScrollDraw className="fr-origin" trigger={{ start: 'top 90%', end: 'top 45%' }} stagger={0.12} easing="ease-out" once>
                  <svg viewBox="0 0 240 150" role="img" aria-label={`A line drawing of ${f.where}`}>
                    <path className="fr-ink fr-sun" d={ORIGINS[f.id].sun} />
                    {ORIGINS[f.id].ink.map((d, i) => <path key={i} className="fr-ink fr-land" d={d} />)}
                  </svg>
                </ScrollDraw>
              </div>
              <div className="fr-farm-body">
                <p className="fr-card-region">{f.where} · since {f.since}</p>
                <h3 className="fr-farm-who">{f.who}</h3>
                <dl className="fr-farm-dl">
                  <div><dt>We paid</dt><dd>{f.paid}</dd></div>
                  <div><dt>That’s</dt><dd>{f.premium}</dd></div>
                  <div><dt>Harvest</dt><dd>{f.harvest}</dd></div>
                  <div><dt>This year</dt><dd>{f.lot2}</dd></div>
                </dl>
                <blockquote>“{f.quote}”<cite>{f.by}</cite></blockquote>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── Map: the routes from each farm draw to Lisbon ── */}
      <section className="fr-sec fr-dark" id="map">
        <div className="fr-sec-head fr-split">
          <div>
            <p className="fr-kick">Farm to Marvila</p>
            <h2 className="fr-h2">Every lot, traced to the roastery door.</h2>
          </div>
          <p className="fr-lede">Green coffee travels in GrainPro-lined jute, by truck to the port and by sea to Lisbon, then twenty minutes up the river to us.</p>
        </div>
        <ScrollDraw className="fr-map" selector=".fr-route" trigger={{ start: 'top 80%', end: 'top 20%' }} stagger={0.3} easing="ease-in-out" once>
          <svg viewBox={`0 0 ${MW} ${MH}`} role="img" aria-label="Routes from Yirgacheffe, Tarrazú and Huila to Lisbon">
            <path className="fr-grat" d={GRATICULE} />
            <path className="fr-landmass" d={LAND} />
            <path className="fr-water" d={WATER} />
            <path className="fr-equator" d={`M 0 ${proj(-100, 0)[1].toFixed(1)} H ${MW}`} />
            <text className="fr-map-t fr-map-eq" x="8" y={proj(-100, 0)[1] - 6}>Equator</text>
            {FARMS.map((f) => <path key={f.id} className="fr-route" d={routeD(f)} />)}
            {FARMS.map((f) => (
              <g key={`${f.id}-pin`}>
                <circle className="fr-port" cx={f.port[0]} cy={f.port[1]} r="2.6" />
                <circle className="fr-farm-dot" cx={f.at[0]} cy={f.at[1]} r="5" />
                <text className="fr-map-t fr-map-name" x={f.at[0] + f.dx} y={f.at[1] + f.dy} textAnchor={f.dx < 0 ? 'end' : 'start'}>{f.name}</text>
              </g>
            ))}
            <circle className="fr-home" cx={LISBON[0]} cy={LISBON[1]} r="6.5" />
            <text className="fr-map-t fr-map-name fr-home-t" x={LISBON[0] - 10} y={LISBON[1] - 12} textAnchor="end">Marvila, Lisbon</text>
          </svg>
        </ScrollDraw>
        <ul className="fr-routes">
          {FARMS.map((f, i) => (
            <li key={f.id}>
              <span className="fr-routes-n">0{i + 1}</span>
              <b>{f.name} → Lisbon</b>
              <span>Trucked to {f.portName}, then {f.km} by sea</span>
              <em>{f.days} at sea</em>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Roast: the profile plots itself, milestones follow progress ── */}
      <section className="fr-sec" id="roast">
        <div className="fr-roast-grid">
          <div className="fr-roast-copy">
            <p className="fr-kick">How we roast</p>
            <h2 className="fr-h2">Ten minutes and fifty-five seconds, logged every time.</h2>
            <p className="fr-lede">
              Every batch is roasted to a curve and logged. This is Tuesday’s Konga: a gentle drying phase, first crack at 8:40,
              and out of the drum 2 minutes 15 seconds later, before the jasmine cooks off.
            </p>
            <dl className="fr-log">
              <div><dt>Charge</dt><dd>15.0 kg at 200 °C</dd></div>
              <div><dt>Out</dt><dd>12.9 kg · 14.2% loss</dd></div>
              <div><dt>Development</dt><dd>2:15 · 20.6%</dd></div>
              <div><dt>Colour</dt><dd>Agtron 72 · light</dd></div>
            </dl>
          </div>
          <div className="fr-roast" ref={roast}>
            <div className="fr-roast-top">
              <span className="fr-live"><i />Batch 412 · Konga</span>
              <div className="fr-readout" aria-live="off">
                <span><small>Time</small><b ref={(el) => { out.current[0] = el; }}>{end.time}</b></span>
                <span><small>Bean</small><b ref={(el) => { out.current[1] = el; }}>{end.bt}</b></span>
                <span><small>Rate of rise</small><b ref={(el) => { out.current[2] = el; }}>{end.ror}</b></span>
                <span><small>Phase</small><b ref={(el) => { out.current[3] = el; }}>{end.phase}</b></span>
              </div>
            </div>
            <ScrollDraw selector=".fr-curve" trigger={{ start: 'top 80%', end: 'top 25%' }} stagger={0.2} easing="linear" once onProgress={onRoast}>
              <svg viewBox="0 0 640 280" role="img" aria-label="Roast profile: bean temperature from 95 °C at the turning point to 211 °C at drop, with the rate of rise falling">
                <path className="fr-dev" d={DEV_BAND} />
                <text className="fr-axis fr-dev-t" x={(rx(8.67) + rx(10.92)) / 2} y={RY1 - 8} textAnchor="middle">Development</text>
                {[100, 140, 180, 220].map((c) => (
                  <g key={c}>
                    <path className="fr-rgrid" d={`M ${RX0} ${ry(c).toFixed(1)} H ${RX1}`} />
                    <text className="fr-axis" x={RX0 - 8} y={ry(c) + 4} textAnchor="end">{c}°</text>
                  </g>
                ))}
                <path className="fr-rgrid" d={`M ${RX0} ${RY0} V ${RY1} H ${RX1}`} />
                {[0, 2, 4, 6, 8, 10, 12].map((m) => (
                  <text key={m} className="fr-axis" x={rx(m)} y={RY1 + 22} textAnchor="middle">{m}:00</text>
                ))}
                <path className="fr-curve fr-ror" d={ROR_PATH} />
                <path className="fr-curve fr-bt" d={BT_PATH} />
                {MILESTONES.map((m) => (
                  <g key={m.label} className="fr-ms" style={{ '--at': m.p } as CSSProperties}>
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
              <span><i className="dev" /> Development</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Cupping + the head roaster's note, signed ── */}
      <section className="fr-sec fr-cup" id="cupping">
        <div className="fr-sheet">
          <div className="fr-sheet-h">
            <span><small>Cupping sheet</small><b>Konga · washed</b></span>
            <span className="fr-sheet-score"><b>88.5</b><small>of 100</small></span>
          </div>
          <ul>
            {CUPPING.map(([k, v]) => (
              <li key={k}><span>{k}</span><i><em style={{ width: `${((v - 6) / 4) * 100}%` }} /></i><b>{v.toFixed(2)}</b></li>
            ))}
          </ul>
          <p className="fr-sheet-f">Cupped 27 Oct · 3 tables · Ada Park, Rui Tavares, Lena Ott</p>
        </div>
        <figure className="fr-note">
          <p className="fr-kick">A note from the roaster</p>
          <blockquote>
            Every lot is cupped three times before it ships. If a bag doesn’t taste like the notes on its label,
            write to me and I’ll send another.
          </blockquote>
          <ScrollDraw className="fr-sign" trigger={{ start: 'top 85%', end: 'top 45%' }} easing="ease-out" once>
            <svg viewBox="0 30 400 200" role="img" aria-label="Ada Park's signature">
              <path className="fr-sig" d={SIGNATURE} />
            </svg>
          </ScrollDraw>
          <figcaption>Ada Park · head roaster, Q Grader</figcaption>
        </figure>
      </section>

      {/* ── Subscription builder ── */}
      <section className="fr-sec fr-subsec" id="subscribe">
        <div className="fr-sec-head fr-split">
          <div>
            <p className="fr-kick">Subscriptions</p>
            <h2 className="fr-h2">Fresh coffee on your doorstep, the Thursday after roast day.</h2>
          </div>
          <p className="fr-lede">Subscribers pay €13.50 a bag instead of €16, get first pick of small lots and never pay for delivery.</p>
        </div>
        <Builder />
      </section>

      {/* ── Brew guides ── */}
      <section className="fr-sec" id="brew">
        <div className="fr-sec-head">
          <p className="fr-kick">Brew guides</p>
          <h2 className="fr-h2">The recipes we use on the bar.</h2>
        </div>
        <div className="fr-brews">
          {BREWS.map((b) => (
            <article key={b.k} className="fr-brew">
              <div className="fr-brew-h">
                <h3>{b.k}</h3>
                <span>{b.ratio}</span>
              </div>
              <p>{b.d}</p>
              <dl>
                <div><dt>Coffee</dt><dd>{b.dose}</dd></div>
                <div><dt>Water</dt><dd>{b.water}</dd></div>
                <div><dt>Temp</dt><dd>{b.temp}</dd></div>
                <div><dt>Time</dt><dd>{b.time}</dd></div>
              </dl>
              <ol>{b.steps.map((s) => <li key={s}>{s}</li>)}</ol>
              <span className="fr-brew-g">Grind: <b>{b.grind}</b></span>
            </article>
          ))}
        </div>
      </section>

      {/* ── Reviews ── */}
      <section className="fr-sec fr-reviews" id="reviews">
        <div className="fr-rscore">
          <p className="fr-kick">Reviews</p>
          <p className="fr-rscore-n">4.9<small>/5</small></p>
          <Stars />
          <p className="fr-rscore-c">From 1,286 verified orders</p>
          <div className="fr-dist">
            {[[5, 91], [4, 7], [3, 1], [2, 0], [1, 1]].map(([s, p]) => (
              <span key={s}><b>{s}</b><i><em style={{ width: `${p}%` }} /></i><small>{p}%</small></span>
            ))}
          </div>
        </div>
        <div className="fr-revs">
          {REVIEWS.map((r) => (
            <figure key={r.n} className="fr-rev">
              <Stars n={r.s} />
              <b>{r.t}</b>
              <blockquote>{r.b}</blockquote>
              <figcaption><span className="fr-rev-a">{r.n[0]}</span><span>{r.n} · {r.where}<small>Bought {r.lot} · {r.d}</small></span></figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ── Visit ── */}
      <section className="fr-sec fr-visit" id="visit">
        <div className="fr-visit-copy">
          <p className="fr-kick">Visit the roastery</p>
          <h2 className="fr-h2">Coffee at the bar, two metres from the drum.</h2>
          <p className="fr-lede">A former cork warehouse in Marvila. Come for a flat white, or join the free public cupping every Saturday at 11:00 — eight seats, first come.</p>
          <ul className="fr-visit-list">
            <li><Ico d={ICONS.pin} /><span><b>Rua do Açúcar 89, 1950-010 Lisboa</b><small>6 min walk from Braço de Prata station</small></span></li>
            <li><Ico d={ICONS.clock} /><span><b>Thursday – Sunday</b><small>Thu–Fri 8:00–17:00 · Sat–Sun 9:00–17:00 · roasting Mon–Wed</small></span></li>
            <li><Ico d={ICONS.cup} /><span><b>Public cupping</b><small>Saturdays 11:00 · free · 8 seats</small></span></li>
          </ul>
        </div>
        <div className="fr-menu">
          <div className="fr-menu-h"><b>On the bar this week</b><small>Prices in €</small></div>
          <ul>
            {[['Espresso', 'Marvila', '1.30'], ['Cortado', 'Marvila', '1.80'], ['Flat white', 'Marvila, oat +0.40', '2.80'], ['Batch brew', 'El Alto', '2.50'], ['V60 of the week', 'Konga', '3.80'], ['Pastel de nata', 'from Manteigaria', '1.40']].map(([n, s, p]) => (
              <li key={n}><span><b>{n}</b><small>{s}</small></span><i /><em>{p}</em></li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="fr-sec fr-faq" id="faq">
        <div>
          <p className="fr-kick">Questions</p>
          <h2 className="fr-h2">Before you order.</h2>
          <p className="fr-lede">Anything else? Write to hello@ferrow.example — Ada or Rui answers within a working day.</p>
        </div>
        <div className="fr-qs">
          {FAQ.map(([q, a], i) => (
            <details key={q} open={i === 0}>
              <summary>{q}<i aria-hidden="true" /></summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="fr-foot">
        <div className="fr-foot-top">
          <div className="fr-foot-brand">
            <span className="fr-brand">Ferrow</span>
            <p>Small-lot coffee, roasted every Tuesday in Marvila, Lisbon.</p>
            <form className="fr-news" onSubmit={(e) => e.preventDefault()}>
              <label htmlFor="fr-email">Roast-day letters, twice a month</label>
              <div><input id="fr-email" type="email" placeholder="you@example.com" /><button type="submit">Join</button></div>
            </form>
          </div>
          {([
            ['Shop', ['November lots', 'Espresso', 'Gift cards', 'Equipment']],
            ['Subscriptions', ['Build a box', 'Gift a subscription', 'Office coffee', 'Manage yours']],
            ['Learn', ['Brew guides', 'Our farms', 'Roast logs', 'Wholesale']],
          ] as const).map(([h, ls]) => (
            <div key={h} className="fr-foot-col"><b>{h}</b>{ls.map((l) => <a key={l} href="#top">{l}</a>)}</div>
          ))}
        </div>
        <div className="fr-foot-base">
          <span>© 2026 Ferrow Coffee Roasters — a fictional company; this is a demo site.</span>
          <span className="fr-pay">{['Visa', 'Mastercard', 'MB Way', 'Multibanco'].map((p) => <i key={p}>{p}</i>)}</span>
        </div>
      </footer>

      <BuiltWith example="logo-reveal" apis="autoplay · onComplete · stagger · onProgress" />
    </div>
  );
}
