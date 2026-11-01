'use client';

import './hearth.css';
import Image from 'next/image';
import type { CSSProperties, ReactNode } from 'react';
import { ScrollDraw } from 'svg-scroll-draw/react';
import { BuiltWith } from '../BuiltWith';

/*
 * Hearth & Field — the order page a fictional Porto homeware shop shows after
 * checkout, the day the parcel is on the road. Built with svg-scroll-draw:
 *   · the confirmation check draws itself as the page opens (autoplay)
 *   · the delivery journey draws in order — each station, then the road on
 *     to the next — up to where the parcel is now (selector + stagger); the
 *     stretch still to come stays dashed. Phones get it upright, on scroll.
 *   · each product's drawing-to-size inks in as its card arrives
 * The product stills are renders made for this page.
 */

const IMG = '/showcase/hearth';

/* The journey, in a 1000 × 220 box: a gentle road through four stations. */
const ST = [
  { x: 90, y: 150, k: 'Ordered', when: 'Mon 3 Nov, 14:02', d: 'Paid by Visa', done: true, icon: ['M-14 -8h28l-3 22h-22z', 'M-7 -8v-4a7 7 0 0 1 14 0v4'] },
  { x: 370, y: 96, k: 'Packed', when: 'Tue 4 Nov, 16:40', d: 'By Inês, in Porto', done: true, icon: ['M-15 -6 L0 -14 L15 -6 V12 L0 20 L-15 12 Z', 'M-15 -6 L0 2 L15 -6 M0 2 V20', 'M-8 -10 L8 -2'] },
  { x: 640, y: 132, k: 'On its way', when: 'Now · past Leiria', d: 'CTT Expresso', now: true, icon: ['M-18 -8h20v16h-20z', 'M2 -3h8l7 7v4H2', 'M-10 12a3.5 3.5 0 1 0 .01 0M10 12a3.5 3.5 0 1 0 .01 0'] },
  { x: 910, y: 82, k: 'Delivered', when: 'Thu 6 Nov', d: '10:00–12:00', icon: ['M-15 0 L0 -13 L15 0', 'M-11 -3 V15 H11 V-3', 'M-4 15 V6 H4 V15'] },
];
/* Phones: the same journey, upright — stations down the left, labels beside them. */
const TALL = ST.map((s, i) => ({ ...s, x: 54, y: 46 + i * 118 }));
const segTall = (a: (typeof TALL)[number], b: (typeof TALL)[number]) =>
  `M ${a.x} ${a.y + 34} C ${a.x + 10} ${a.y + 60}, ${b.x - 10} ${b.y - 60}, ${b.x} ${b.y - 34}`;
const seg = (a: (typeof ST)[number], b: (typeof ST)[number]) => {
  const mx = (a.x + b.x) / 2;
  return `M ${a.x + 34} ${a.y} C ${mx} ${a.y}, ${mx} ${b.y}, ${b.x - 34} ${b.y}`;
};

const EVENTS = [
  { t: 'Wed 5 Nov · 09:12', e: 'In transit to CTT Lisboa (MARL)', p: 'Passed Leiria · 212 of 313 km', now: true },
  { t: 'Wed 5 Nov · 07:15', e: 'Left the CTT hub in Maia', p: 'Porto' },
  { t: 'Tue 4 Nov · 19:40', e: 'Collected from our studio', p: 'Rua do Bonjardim, Porto' },
  { t: 'Tue 4 Nov · 16:40', e: 'Packed by Inês', p: '1 box · 3.4 kg · recycled card, paper tape' },
  { t: 'Mon 3 Nov · 14:02', e: 'Order placed', p: 'Payment confirmed · Visa ··4242' },
];

/* What's in the parcel. Each drawing is the piece to size, with its dimensions. */
const ITEMS = [
  {
    name: 'Stoneware mug', variant: 'Ash glaze · 350 ml', qty: 'Set of 2', price: '€58.00', tone: 'clay',
    img: `${IMG}/mug-df3db6f3.webp`, alt: 'Two speckled ash-glaze stoneware mugs with raw clay feet',
    note: 'Thrown in Barcelos. The speckles and the raw foot differ on every mug.',
    dims: [['Ø 8.6 cm', 70, 121], ['9.5 cm', 17, 59]] as const,
    draw: [
      'M40 22 H100 V88 A8 8 0 0 1 92 96 H48 A8 8 0 0 1 40 88 Z', 'M40 86 C 52 84, 60 88, 70 85 S 90 84, 100 86',
      'M100 36 C 128 36, 130 82, 100 84', 'M100 44 C 118 46, 118 74, 100 76',
      'M40 108 H100', 'M40 103 V113 M100 103 V113', 'M26 22 V96', 'M21 22 H31 M21 96 H31',
    ],
  },
  {
    name: 'Linen throw', variant: 'Moss · stonewashed', qty: '1', price: '€72.00', tone: 'sage',
    img: `${IMG}/throw-143dd23d.webp`, alt: 'A moss-green linen throw, folded, its fringe falling to one side',
    note: 'European flax, woven in Guimarães. Softer with every wash.',
    dims: [['130 cm', 80, 121], ['170 cm', 27, 54]] as const,
    draw: [
      'M50 16 H110 V92 H50 Z', 'M54 16 V9 M60 16 V9 M66 16 V9 M72 16 V9 M78 16 V9 M84 16 V9 M90 16 V9 M96 16 V9 M102 16 V9 M106 16 V9',
      'M54 92 V99 M60 92 V99 M66 92 V99 M72 92 V99 M78 92 V99 M84 92 V99 M90 92 V99 M96 92 V99 M102 92 V99 M106 92 V99',
      'M50 108 H110', 'M50 103 V113 M110 103 V113', 'M36 16 V92', 'M31 16 H41 M31 92 H41',
    ],
  },
  {
    name: 'Beeswax candle', variant: 'Juniper · 220 g', qty: '1', price: '€18.00', tone: 'oat',
    img: `${IMG}/candle-0248fca4.webp`, alt: 'A beeswax candle in a juniper-green ceramic vessel with a paper label',
    note: 'Poured in Porto from Alentejo beeswax. About 45 hours of light.',
    dims: [['Ø 8 cm', 80, 121], ['9 cm', 31, 65]] as const,
    draw: [
      'M52 34 H108 V90 A6 6 0 0 1 102 96 H58 A6 6 0 0 1 52 90 Z', 'M56 42 H104', 'M60 56 H100 V78 H60 Z',
      'M80 42 V33', 'M80 33 C 73 25, 77 16, 80 9 C 83 16, 87 25, 80 33',
      'M52 108 H108', 'M52 103 V113 M108 103 V113', 'M40 34 V96', 'M35 34 H45 M35 96 H45',
    ],
  },
];

const RECS = [
  { n: 'Stoneware mug', v: 'Iron glaze · 350 ml', p: '€29.00', img: `${IMG}/mug-iron-705561dc.webp`, alt: 'A dark iron-glaze stoneware mug, its rim breaking to amber', tag: 'Pairs with your set' },
  { n: 'Stoneware tumblers', v: 'Moss glaze · set of 2', p: '€42.00', img: `${IMG}/tumbler-moss-6412604c.webp`, alt: 'Two moss-green stoneware tumblers with raw clay feet' },
  { n: 'Beeswax candle', v: 'Fig & cedar · 220 g', p: '€18.00', img: `${IMG}/candle-fig-e165a27e.webp`, alt: 'A beeswax candle in a terracotta vessel labelled Fig', tag: 'New for autumn' },
  { n: 'Linen throw', v: 'Clay · stonewashed', p: '€72.00', img: `${IMG}/throw-clay-00eb2347.webp`, alt: 'A clay-pink linen throw, folded, with a fringe' },
];

const Ic = ({ d, size = 20 }: { d: string; size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" className="hf-ic"><path d={d} /></svg>
);
const I = {
  search: 'M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM15.5 15.5 20 20',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20c1.2-3.6 4-5 7.5-5s6.3 1.4 7.5 5',
  bag: 'M5 8h14l-1 12H6zM9 8V6.5a3 3 0 0 1 6 0V8',
  copy: 'M9 9h10v10H9zM5 15V5h10',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  pin: 'M12 21s-6.5-6.1-6.5-11a6.5 6.5 0 0 1 13 0c0 4.9-6.5 11-6.5 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  return: 'M9 7 4.5 11.5 9 16M5 11.5h9.5a5 5 0 0 1 0 10H11',
  chat: 'M4.5 5.5h15v10h-8l-4.5 3.5v-3.5H4.5z',
  doc: 'M7 3.5h7l4 4v13H7zM14 3.5v4h4M9.5 12h6M9.5 15.5h6',
  leaf: 'M5 19c0-8 5-13 14-14-1 9-6 14-14 14zM5 19l7-7',
};

function Check() {
  return (
    <ScrollDraw className="hf-check" autoplay duration={900} delay={200} stagger={0.4} easing="ease-out" once>
      <svg viewBox="0 0 96 96" aria-hidden="true">
        <path className="hf-check-ring" d="M48 6 A42 42 0 1 1 47.99 6" />
        <path className="hf-check-tick" d="M28 49 L42 63 L69 34" />
      </svg>
    </ScrollDraw>
  );
}

function Station({ s }: { s: (typeof ST)[number] }) {
  return (
    <g transform={`translate(${s.x} ${s.y})`} className={`hf-st${s.done ? ' is-done' : ''}${s.now ? ' is-now' : ''}`}>
      <circle className="hf-st-disc" r="32" />
      {s.icon.map((d, k) => <path key={k} className={s.done || s.now ? 'hf-go hf-st-ink' : 'hf-st-idle'} d={d} />)}
    </g>
  );
}

function Journey() {
  return (
    <>
      <ScrollDraw className="hf-road hf-road-wide" selector=".hf-go" autoplay duration={700} delay={900} stagger={0.32} easing="ease-in-out" once>
        <svg viewBox="0 0 1000 220" role="img" aria-label="Ordered Monday, packed Tuesday, on its way now, delivered Thursday between 10:00 and 12:00">
          <path className="hf-road-bed" d={`${seg(ST[0], ST[1])} ${seg(ST[1], ST[2])} ${seg(ST[2], ST[3])}`} />
          {/* DOM order is drawing order: each station, then the road on to the next. */}
          {ST.map((s, i) => {
            const next = ST[i + 1];
            const reached = next && (next.done || next.now);
            return (
              <g key={s.k}>
                <Station s={s} />
                {next && <path className={reached ? 'hf-go hf-road-done' : 'hf-road-next'} d={seg(s, next)} />}
              </g>
            );
          })}
        </svg>
      </ScrollDraw>
      <ScrollDraw className="hf-road hf-road-tall" selector=".hf-go" trigger={{ start: 'top 85%', end: 'top 30%' }} stagger={0.32} easing="ease-in-out" once>
        <svg viewBox="0 0 300 450" role="img" aria-label="Ordered Monday, packed Tuesday, on its way now, delivered Thursday between 10:00 and 12:00">
          {TALL.map((s, i) => {
            const next = TALL[i + 1];
            const reached = next && (next.done || next.now);
            return (
              <g key={s.k}>
                <Station s={s} />
                <text className={`hf-tall-k${s.done || s.now ? ' on' : ''}`} x={s.x + 52} y={s.y - 6}>{s.k}</text>
                <text className={`hf-tall-w${s.now ? ' now' : ''}`} x={s.x + 52} y={s.y + 16}>{s.when}</text>
                <text className="hf-tall-d" x={s.x + 52} y={s.y + 36}>{s.d}</text>
                {next && <path className={reached ? 'hf-go hf-road-done' : 'hf-road-next'} d={segTall(s, next)} />}
              </g>
            );
          })}
        </svg>
      </ScrollDraw>
      <ol className="hf-labels">
        {ST.map((s) => (
          <li key={s.k} className={`${s.done ? 'is-done' : ''}${s.now ? ' is-now' : ''}`} style={{ '--x': s.x / 1000 } as CSSProperties}>
            <b>{s.k}</b><span>{s.when}</span><small>{s.d}</small>
          </li>
        ))}
      </ol>
    </>
  );
}

/* A street-map snippet of the delivery address, drawn flat. */
function MapSnippet() {
  return (
    <svg className="hf-map" viewBox="0 0 520 300" role="img" aria-label="Map: Rua das Flores 112 in Chiado, Lisbon, two streets up from the river">
      <rect width="520" height="300" className="hf-map-land" />
      <path className="hf-map-park" d="M362 34 h88 l14 52 h-96 z" />
      <path className="hf-map-water" d="M0 248 C 120 236, 260 252, 520 226 V300 H0 Z" />
      <g className="hf-map-blocks">
        <path d="M24 30 h96 l-8 64 h-92z M140 26 h86 l-6 70 h-86z M246 22 h96 l-4 76 h-96z M20 118 h88 l-6 70 h-86z M128 116 h70 l-4 72 h-70z M262 120 h84 l-2 80 h-90z M366 110 h120 l-4 92 h-118z M20 206 h80 l-4 24 h-78z M118 208 h90 l-2 22 h-90z" />
      </g>
      <path className="hf-map-street" d="M0 104 C 140 108, 300 100, 520 96 M232 0 C 236 90, 238 180, 246 250 M118 0 L 104 240 M352 0 C 356 100, 352 160, 356 236 M0 196 C 160 200, 340 206, 520 208" />
      <path className="hf-map-route" d="M246 250 C 240 200, 236 150, 234 104" />
      <text className="hf-map-t" x="368" y="64">Jardim do</text>
      <text className="hf-map-t" x="368" y="78">Príncipe Real</text>
      <text className="hf-map-t hf-map-w" x="300" y="276">Rio Tejo</text>
      <text className="hf-map-t" x="250" y="166" transform="rotate(-86 250 166)">R. das Flores</text>
      <text className="hf-map-t" x="20" y="98">R. do Loreto</text>
      <g transform="translate(234 104)">
        <circle className="hf-map-halo" r="22" />
        <path className="hf-map-pin" d="M0 0 C -11 -14, -13 -20, -13 -25 a13 13 0 0 1 26 0 c0 5 -2 11 -13 25z" />
        <circle r="5" cy="-25" fill="#fff" />
      </g>
    </svg>
  );
}

function Sec({ id, kick, title, lede, aside, children, tone }: { id?: string; kick: string; title: ReactNode; lede?: ReactNode; aside?: ReactNode; children: ReactNode; tone?: 'alt' }) {
  return (
    <section className={`hf-sec${tone ? ' hf-sec-alt' : ''}`} id={id}>
      <div className="hf-in">
        <header className="hf-head">
          <div>
            <p className="hf-kick">{kick}</p>
            <h2 className="hf-h2">{title}</h2>
          </div>
          {lede && <p className="hf-head-lede">{lede}</p>}
          {aside}
        </header>
        {children}
      </div>
    </section>
  );
}

export function HearthSite() {
  return (
    <div className="hf">
      <p className="hf-bar"><span>Free delivery over €120</span><i>·</i><span>Free returns for 30 days</span><i className="hf-bar-x">·</i><span className="hf-bar-x">Made slowly in Porto</span></p>
      <header className="hf-top">
        <a className="hf-brand" href="#top">Hearth <i>&amp;</i> Field</a>
        <nav className="hf-nav" aria-label="Shop"><a href="#recs">Kitchen</a><a href="#recs">Textiles</a><a href="#recs">Candles</a><a href="#care">Journal</a><a href="#help">Studio</a></nav>
        <span className="hf-tools">
          <a href="#top" aria-label="Search"><Ic d={I.search} /></a>
          <a href="#help" aria-label="Account"><Ic d={I.user} /></a>
          <a href="#recs" aria-label="Bag, empty" className="hf-bag"><Ic d={I.bag} /><em>0</em></a>
        </span>
      </header>

      <main id="top">
        {/* ── Confirmation: the check draws as the page opens ── */}
        <section className="hf-hero">
          <div className="hf-hero-copy">
            <div className="hf-conf">
              <Check />
              <span><b>Order confirmed</b><small>#HF-20481 · placed Mon 3 Nov</small></span>
            </div>
            <h1 className="hf-h1">Thank you, Ada.</h1>
            <p className="hf-lede">Your parcel left our Porto studio on Tuesday evening and is on the A1 to Lisbon with CTT. It reaches Rua das Flores on <b>Thursday 6 November, between 10:00 and 12:00</b>.</p>
            <div className="hf-ctas">
              <a className="hf-btn" href="#journey">Track your parcel</a>
              <a className="hf-btn hf-btn-ghost" href="#summary"><Ic d={I.doc} size={18} />Receipt</a>
            </div>
            <dl className="hf-facts">
              <div><dt>Delivering to</dt><dd>Rua das Flores 112, 2º · Lisboa</dd></div>
              <div><dt>Confirmation sent to</dt><dd>ada.park@correio.pt</dd></div>
              <div><dt>Total paid</dt><dd>€148.00 <small>incl. VAT</small></dd></div>
            </dl>
          </div>
          <figure className="hf-hero-art">
            <Image src={`${IMG}/hero-e7e7089c.webp`} width={1600} height={1200} priority sizes="(max-width: 900px) 100vw, 56vw"
              alt="Ada's order on the studio table: a folded moss linen throw with an ash-glaze mug on top, the second mug beside it and a juniper beeswax candle in front" />
            <figcaption><span className="hf-dot" />Photographed on the packing table before it went into the box · Tue 4 Nov</figcaption>
          </figure>
        </section>

        {/* ── The journey: road and stations draw in order, up to now ── */}
        <section className="hf-journey" id="journey" aria-labelledby="hf-journey-h">
          <div className="hf-in">
            <header className="hf-head">
              <div>
                <p className="hf-kick"><span className="hf-live" />Live · updated 2 min ago</p>
                <h2 className="hf-h2" id="hf-journey-h">On the road to Lisbon.</h2>
              </div>
              <p className="hf-head-lede">Packed and collected on Tuesday, it left the CTT hub in Maia at 07:15 this morning. Next stop: the Lisbon sorting centre, then a van to your door.</p>
            </header>
            <div className="hf-journey-map"><Journey /></div>

            <div className="hf-track">
              <article className="hf-eta">
                <p className="hf-card-k">Arriving</p>
                <p className="hf-eta-day">Thursday 6 Nov</p>
                <p className="hf-eta-win">10:00 – 12:00</p>
                <div className="hf-eta-bar" aria-hidden="true"><i style={{ width: '68%' }} /><b style={{ left: '68%' }} /></div>
                <p className="hf-eta-km"><span>Porto</span><span>212 of 313 km</span><span>Lisboa</span></p>
                <p className="hf-eta-note">We&apos;ll text a one-hour slot to +351 ··· ··· 418 at 08:00 on the day.</p>
              </article>
              <article className="hf-courier">
                <div className="hf-courier-h">
                  <span className="hf-ctt" aria-hidden="true">ctt</span>
                  <span><b>CTT Expresso</b><small>Next day · signed for</small></span>
                </div>
                <dl>
                  <div><dt>Tracking number</dt><dd className="hf-mono">EA 482 109 375 PT <button type="button" aria-label="Copy tracking number"><Ic d={I.copy} size={15} /></button></dd></div>
                  <div><dt>Parcel</dt><dd>1 box · 3.4 kg · 40 × 30 × 22 cm</dd></div>
                  <div><dt>If you&apos;re out</dt><dd>Left with the porter at no. 110</dd></div>
                </dl>
                <a className="hf-link" href="#delivery">Change delivery →</a>
              </article>
              <article className="hf-log">
                <p className="hf-card-k">Parcel history</p>
                <ol>
                  {EVENTS.map((e) => (
                    <li key={e.t} className={e.now ? 'is-now' : ''}>
                      <time>{e.t}</time><b>{e.e}</b><span>{e.p}</span>
                    </li>
                  ))}
                </ol>
              </article>
            </div>
          </div>
        </section>

        {/* ── The order: each product's drawing inks in as its card arrives ── */}
        <Sec id="items" kick="In your parcel" title="Three things, four pieces." lede="Each one made in small batches in the north of Portugal, and drawn here to size so you know where it’ll go before it arrives.">
          <div className="hf-grid">
            {ITEMS.map((it) => (
              <article key={it.name} className={`hf-card tone-${it.tone}`}>
                <div className="hf-shot">
                  <Image src={it.img} width={960} height={960} alt={it.alt} sizes="(max-width: 900px) 100vw, 33vw" />
                  <span className="hf-qty">{it.qty === '1' ? 'Qty 1' : it.qty}</span>
                </div>
                <div className="hf-card-body">
                  <div className="hf-card-top">
                    <h3>{it.name}</h3>
                    <span className="hf-price">{it.price}</span>
                  </div>
                  <p className="hf-variant">{it.variant}</p>
                  <p className="hf-note">{it.note}</p>
                </div>
                <div className="hf-size">
                  <ScrollDraw className="hf-art" trigger={{ start: 'top 92%', end: 'top 55%' }} stagger={0.1} easing="ease-out" once>
                    <svg viewBox="0 0 160 126" aria-hidden="true">
                      {it.draw.map((d, k) => <path key={k} className="hf-prod" d={d} />)}
                      <text className="hf-dim" x={it.dims[0][1]} y={it.dims[0][2]} textAnchor="middle">{it.dims[0][0]}</text>
                      <text className="hf-dim" x={it.dims[1][1]} y={it.dims[1][2]} textAnchor="middle" transform={`rotate(-90 ${it.dims[1][1]} ${it.dims[1][2]})`}>{it.dims[1][0]}</text>
                    </svg>
                  </ScrollDraw>
                  <p className="hf-size-k"><b>Drawn to size</b>{it.dims.map((d) => d[0]).join(' × ')}</p>
                </div>
              </article>
            ))}
          </div>
        </Sec>

        {/* ── Order summary and payment ── */}
        <Sec id="summary" kick="Order summary" title="€148.00, all in." tone="alt">
          <div className="hf-sum">
            <div className="hf-receipt">
              <p className="hf-receipt-h"><b>Order #HF-20481</b><span>Mon 3 Nov 2026, 14:02</span></p>
              <ul>
                {ITEMS.map((it) => (
                  <li key={it.name}>
                    <span className={`hf-thumb tone-${it.tone}`}><Image src={it.img} width={96} height={96} alt="" /></span>
                    <span className="hf-li"><b>{it.name}</b><small>{it.variant} · {it.qty === '1' ? 'Qty 1' : it.qty}</small></span>
                    <span className="hf-li-p">{it.price}</span>
                  </li>
                ))}
              </ul>
              <dl className="hf-totals">
                <div><dt>Subtotal</dt><dd>€148.00</dd></div>
                <div><dt>Delivery <small>CTT Expresso, next day</small></dt><dd className="hf-free">Free</dd></div>
                <div><dt>Gift wrap</dt><dd>—</dd></div>
                <div className="hf-total"><dt>Total</dt><dd>€148.00</dd></div>
                <div className="hf-vat"><dt>Includes VAT at 23%</dt><dd>€27.67</dd></div>
              </dl>
            </div>
            <div className="hf-sum-side">
              <article className="hf-pay">
                <p className="hf-card-k">Paid with</p>
                <div className="hf-visa" aria-hidden="true">
                  <span className="hf-chip" />
                  <span className="hf-visa-n">•••• •••• •••• 4242</span>
                  <span className="hf-visa-f"><span>ADA PARK</span><b>VISA</b></span>
                </div>
                <p className="hf-pay-l">Visa ending 4242 · charged €148.00 on Mon 3 Nov</p>
              </article>
              <article className="hf-mini">
                <span className="hf-mini-ic"><Ic d={I.doc} /></span>
                <span><b>Fatura FT 2026/20481</b><small>Invoice with NIF 245 118 907 · PDF, 48 KB</small></span>
                <a className="hf-link" href="#summary">Download</a>
              </article>
              <article className="hf-mini">
                <span className="hf-mini-ic is-leaf"><Ic d={I.leaf} /></span>
                <span><b>Plastic-free parcel</b><small>Recycled card, paper tape, wool padding you can compost</small></span>
              </article>
            </div>
          </div>
        </Sec>

        {/* ── Delivery details with a map snippet ── */}
        <Sec id="delivery" kick="Delivery" title="Rua das Flores, Thursday morning." lede="Change any of this until 20:00 tonight — after that the van’s loaded.">
          <div className="hf-deliv">
            <div className="hf-map-card">
              <MapSnippet />
              <div className="hf-map-foot">
                <Ic d={I.pin} />
                <span><b>Ada Park</b>Rua das Flores 112, 2º · 1200-195 Lisboa</span>
                <a className="hf-link" href="#delivery">Edit</a>
              </div>
            </div>
            <div className="hf-opts">
              <p className="hf-card-k">If nobody&apos;s home</p>
              {[
                ['Leave with the porter at no. 110', 'Chosen at checkout', true],
                ['CTT locker, Largo do Chiado', '180 m away · open 24 h'],
                ['Deliver another day', 'Friday 7 or Monday 10 Nov'],
              ].map(([t, s, on]) => (
                <label key={t as string} className={`hf-opt${on ? ' is-on' : ''}`}>
                  <input type="radio" name="hf-away" defaultChecked={Boolean(on)} />
                  <span><b>{t}</b><small>{s}</small></span>
                </label>
              ))}
              <div className="hf-instr">
                <p className="hf-card-k">Note for the driver</p>
                <p>“Green door, buzzer 2º. The lift is small — the stairs are quicker.”</p>
              </div>
            </div>
          </div>
        </Sec>

        {/* ── While you wait: care ── */}
        <Sec id="care" kick="While you wait" title="How to look after them." lede="Three short notes from the people who made your things. They’re in the box too, printed on seed paper." tone="alt">
          <div className="hf-care">
            <article>
              <div className="hf-care-viz hf-care-mug" aria-hidden="true">
                {[['Dishwasher', true], ['Microwave', true], ['Oven to 200 °C', true], ['Hob or flame', false]].map(([t, ok]) => (
                  <span key={t as string} className={ok ? 'ok' : 'no'}><i>{ok ? '✓' : '×'}</i>{t}</span>
                ))}
              </div>
              <h3>Stoneware mugs</h3>
              <p>Wash them by hand the first time to settle the glaze. After that the dishwasher is fine. The raw foot can mark a glass table, so give it a felt coaster.</p>
            </article>
            <article>
              <div className="hf-care-viz hf-care-linen" aria-hidden="true">
                <svg viewBox="0 0 300 64">
                  <g className="hf-sym">
                    <path d="M8 18 l6 30 h28 l6 -30 M4 18 c6 -6 10 6 16 0 s10 -6 16 0 s10 6 16 0" /><text x="28" y="40" textAnchor="middle">40</text>
                    <path d="M70 48 l17 -30 l17 30 z M76 22 l22 22 M98 22 l-22 22" />
                    <path d="M126 18 h34 v30 h-34 z M143 33 m-10 0 a10 10 0 1 0 20 0 a10 10 0 1 0 -20 0" /><circle cx="143" cy="33" r="1.8" />
                    <path d="M186 44 h40 l-4 -18 c-2 -6 -8 -8 -14 -8 h-14 c-6 0 -8 6 -8 12 z" /><circle cx="203" cy="36" r="1.8" /><circle cx="211" cy="36" r="1.8" />
                    <path d="M260 33 m-15 0 a15 15 0 1 0 30 0 a15 15 0 1 0 -30 0 M249 22 l22 22 M271 22 l-22 22" />
                  </g>
                </svg>
                <p><span>Wash 40°</span><span>No bleach</span><span>Low tumble</span><span>Warm iron</span><span>No dry clean</span></p>
              </div>
              <h3>Linen throw</h3>
              <p>It softens with every wash. Line-dry it in the shade and shake it out while it&apos;s damp. The creases are part of linen, so there&apos;s no need to iron them out.</p>
            </article>
            <article>
              <div className="hf-care-viz hf-care-candle" aria-hidden="true">
                <svg viewBox="0 0 300 96">
                  <g className="hf-burn">
                    <path d="M40 22 V84 H110 V22" /><path className="hf-pool" d="M42 30 H108 V40 H42 Z" /><path d="M75 30 V20" /><path className="hf-flame" d="M75 20 c-5 -6 -2 -12 0 -16 c2 4 5 10 0 16z" />
                    <path d="M190 22 V84 H260 V22" /><path className="hf-pool hf-pool-bad" d="M215 30 H235 V52 H215 Z" /><path d="M225 52 V42" /><path className="hf-flame" d="M225 42 c-5 -6 -2 -12 0 -16 c2 4 5 10 0 16z" />
                  </g>
                </svg>
                <p><span className="ok">2 hours: an even pool</span><span className="no">30 minutes: a tunnel</span></p>
              </div>
              <h3>Beeswax candle</h3>
              <p>Let the first burn run for two hours, until the melted wax reaches the edge. That stops it tunnelling. Trim the wick to 5 mm before each lighting.</p>
            </article>
          </div>
        </Sec>

        {/* ── Recommended ── */}
        <Sec id="recs" kick="Goes with what you bought" title="Picked for your table." aside={<a className="hf-link hf-head-link" href="#recs">Shop all kitchen →</a>}>
          <div className="hf-recs">
            {RECS.map((r) => (
              <article key={r.n + r.v} className="hf-rec">
                <div className="hf-rec-shot">
                  <Image src={r.img} width={720} height={720} alt={r.alt} sizes="(max-width: 900px) 50vw, 25vw" />
                  {r.tag && <span className="hf-tag">{r.tag}</span>}
                </div>
                <h3>{r.n}</h3>
                <p>{r.v}</p>
                <div className="hf-rec-f"><b>{r.p}</b><button type="button" aria-label={`Add ${r.n}, ${r.v} to bag`}>Add</button></div>
              </article>
            ))}
          </div>
        </Sec>

        {/* ── Help ── */}
        <section className="hf-help" id="help">
          <div className="hf-in hf-help-grid">
            <article>
              <span className="hf-help-ic"><Ic d={I.return} /></span>
              <h3>Free returns for 30 days</h3>
              <p>Changed your mind? Start a return here and show the code at any CTT shop. There&apos;s nothing to print.</p>
              <div className="hf-code" aria-hidden="true"><span>RET-20481</span><i /></div>
            </article>
            <article>
              <span className="hf-help-ic"><Ic d={I.user} /></span>
              <h3>Keep this order in an account</h3>
              <p>Set a password and this order, the invoice and your care notes stay in one place, along with the next one.</p>
              <div className="hf-acct" aria-hidden="true"><span>ada.park@correio.pt</span><b>Set password</b></div>
            </article>
            <article>
              <span className="hf-help-ic"><Ic d={I.chat} /></span>
              <h3>Ask the studio</h3>
              <p>Marta answers every message herself, usually within two hours, Monday to Saturday from 9:00 to 18:00.</p>
              <div className="hf-who" aria-hidden="true"><i>M</i><span><b>Marta Alves</b><small>Studio, Porto · online now</small></span></div>
            </article>
          </div>
        </section>
      </main>

      <footer className="hf-foot">
        <div className="hf-in hf-foot-grid">
          <div className="hf-foot-brand">
            <span className="hf-brand">Hearth <i>&amp;</i> Field</span>
            <p>Things for the table, the sofa and the windowsill, made slowly by people we know in the north of Portugal.</p>
          </div>
          <div><h4>Shop</h4><a href="#recs">Kitchen</a><a href="#recs">Textiles</a><a href="#recs">Candles</a><a href="#recs">Gift cards</a></div>
          <div><h4>Help</h4><a href="#help">Delivery</a><a href="#help">Returns</a><a href="#care">Care guides</a><a href="#help">Contact</a></div>
          <div className="hf-news">
            <h4>The studio letter</h4>
            <p>New makers and seconds sales, once a month.</p>
            <span className="hf-news-f" aria-hidden="true"><span>Your email</span><b>Sign up</b></span>
          </div>
        </div>
        <div className="hf-in hf-foot-low">
          <span>Hearth &amp; Field, Rua do Bonjardim 501, Porto</span>
          <span className="hf-legal">© 2026 Hearth &amp; Field — a fictional shop; this is a demo site.</span>
        </div>
      </footer>

      <BuiltWith example="flowchart" apis="selector · stagger · autoplay" />
    </div>
  );
}
