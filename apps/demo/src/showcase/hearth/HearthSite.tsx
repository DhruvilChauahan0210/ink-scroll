'use client';

import './hearth.css';
import { ScrollDraw } from 'svg-scroll-draw/react';
import { BuiltWith } from '../BuiltWith';

/*
 * Hearth & Field — a demo order-confirmation page for a fictional homeware
 * shop, built with svg-scroll-draw:
 *   · the confirmation check draws itself as the page opens (autoplay)
 *   · the delivery journey draws in order — the road from one station to the
 *     next, then each station's icon — up to where the parcel is now
 *     (selector + stagger); the stretch still to come stays dashed
 *   · each product is a large line drawing that inks in as its card arrives
 */

/* The journey, in a 1000 × 220 box: a gentle road through four stations. */
const ST = [
  { x: 90, y: 150, k: 'Ordered', when: 'Today, 14:02', done: true, icon: ['M-14 -8h28l-3 22h-22z', 'M-7 -8v-4a7 7 0 0 1 14 0v4'] },
  { x: 370, y: 96, k: 'Packed', when: 'Tomorrow', done: true, icon: ['M-15 -6 L0 -14 L15 -6 V12 L0 20 L-15 12 Z', 'M-15 -6 L0 2 L15 -6 M0 2 V20', 'M-8 -10 L8 -2'] },
  { x: 640, y: 132, k: 'On its way', when: 'Wed 5 Nov', now: true, icon: ['M-18 -8h20v16h-20z', 'M2 -3h8l7 7v4H2', 'M-10 12a3.5 3.5 0 1 0 .01 0M10 12a3.5 3.5 0 1 0 .01 0'] },
  { x: 910, y: 82, k: 'Delivered', when: 'Thu 6 Nov', icon: ['M-15 0 L0 -13 L15 0', 'M-11 -3 V15 H11 V-3', 'M-4 15 V6 H4 V15'] },
];
/* Phones: the same journey, upright — stations down the left, labels beside them. */
const TALL = ST.map((s, i) => ({ ...s, x: 54, y: 46 + i * 118 }));
const segTall = (a: (typeof TALL)[number], b: (typeof TALL)[number]) =>
  `M ${a.x} ${a.y + 34} C ${a.x + 10} ${a.y + 60}, ${b.x - 10} ${b.y - 60}, ${b.x} ${b.y - 34}`;

const seg = (a: (typeof ST)[number], b: (typeof ST)[number]) => {
  const mx = (a.x + b.x) / 2;
  return `M ${a.x + 34} ${a.y} C ${mx} ${a.y}, ${mx} ${b.y}, ${b.x - 34} ${b.y}`;
};

const ITEMS = [
  {
    name: 'Stoneware mug, ash glaze', meta: '350 ml · set of 2', price: '€58.00', tone: 'clay',
    draw: ['M30 46 H96 V104 A16 16 0 0 1 80 120 H46 A16 16 0 0 1 30 104 Z', 'M96 60 H108 A16 16 0 0 1 108 92 H96', 'M48 36 C 42 26 54 22 48 12 M64 36 C 58 26 70 22 64 12 M80 36 C 74 26 86 22 80 12', 'M22 128 H106'],
  },
  {
    name: 'Linen throw, moss', meta: '130 × 170 cm', price: '€72.00', tone: 'sage',
    draw: ['M14 40 H114 V62 H14 Z', 'M22 62 H106 V84 H22 Z', 'M14 84 H114 V106 H14 Z', 'M20 106 V118 M30 106 V118 M40 106 V118 M50 106 V118 M60 106 V118 M70 106 V118 M80 106 V118 M90 106 V118 M100 106 V118 M108 106 V118'],
  },
  {
    name: 'Beeswax candle, juniper', meta: '220 g · 45 h burn', price: '€18.00', tone: 'oat',
    draw: ['M38 56 H90 V120 H38 Z', 'M34 56 H94', 'M42 78 H86', 'M64 56 V42', 'M64 42 C 52 30 60 16 64 6 C 68 16 76 30 64 42'],
  },
];

export function HearthSite() {
  return (
    <div className="hf">
      <header className="hf-top">
        <a className="hf-brand" href="#top">Hearth <i>&amp;</i> Field</a>
        <nav className="hf-nav" aria-label="Shop"><a href="#items">Home</a><a href="#items">Kitchen</a><a href="#items">Textiles</a><a href="#items">Candles</a></nav>
        <span className="hf-order">Order <b>#HF-20481</b></span>
      </header>

      <main id="top">
        {/* ── Confirmation: the check draws as the page opens ── */}
        <section className="hf-hero">
          <ScrollDraw className="hf-check" autoplay duration={900} delay={200} stagger={0.4} easing="ease-out" once>
            <svg viewBox="0 0 96 96" aria-hidden="true">
              <path className="hf-check-ring" d="M48 6 A42 42 0 1 1 47.99 6" />
              <path className="hf-check-tick" d="M28 49 L42 63 L69 34" />
            </svg>
          </ScrollDraw>
          <p className="hf-kick">Order confirmed</p>
          <h1 className="hf-h1">Thank you, Ada.</h1>
          <p className="hf-lede">We&apos;re packing your order in our Porto studio. You&apos;ll get an email with tracking the moment it leaves — expected on your doorstep <b>Thursday 6 November</b>.</p>
        </section>

        {/* ── The journey: road and stations draw in order, up to now ── */}
        <section className="hf-journey" aria-label="Delivery progress">
          <ScrollDraw className="hf-road hf-road-wide" selector=".hf-go" autoplay duration={700} delay={900} stagger={0.32} easing="ease-in-out" once>
            <svg viewBox="0 0 1000 220" role="img" aria-label="Ordered today, packed tomorrow, on its way Wednesday, delivered Thursday">
              <path className="hf-road-bed" d={`${seg(ST[0], ST[1])} ${seg(ST[1], ST[2])} ${seg(ST[2], ST[3])}`} />
              {/* DOM order is drawing order: each station, then the road on to the next. */}
              {ST.map((s, i) => {
                const next = ST[i + 1];
                const reached = next && (next.done || next.now);
                return (
                  <g key={s.k}>
                    <g transform={`translate(${s.x} ${s.y})`} className={`hf-st${s.done ? ' is-done' : ''}${s.now ? ' is-now' : ''}`}>
                      <circle className="hf-st-disc" r="32" />
                      {s.icon.map((d, k) => <path key={k} className={s.done || s.now ? 'hf-go hf-st-ink' : 'hf-st-idle'} d={d} />)}
                    </g>
                    {next && <path className={reached ? 'hf-go hf-road-done' : 'hf-road-next'} d={seg(s, next)} />}
                  </g>
                );
              })}
            </svg>
          </ScrollDraw>
          <ScrollDraw className="hf-road hf-road-tall" selector=".hf-go" trigger={{ start: 'top 85%', end: 'top 30%' }} stagger={0.32} easing="ease-in-out" once>
            <svg viewBox="0 0 300 450" role="img" aria-label="Ordered today, packed tomorrow, on its way Wednesday, delivered Thursday">
              {TALL.map((s, i) => {
                const next = TALL[i + 1];
                const reached = next && (next.done || next.now);
                return (
                  <g key={s.k}>
                    <g transform={`translate(${s.x} ${s.y})`} className={`hf-st${s.done ? ' is-done' : ''}${s.now ? ' is-now' : ''}`}>
                      <circle className="hf-st-disc" r="32" />
                      {s.icon.map((d, k) => <path key={k} className={s.done || s.now ? 'hf-go hf-st-ink' : 'hf-st-idle'} d={d} />)}
                    </g>
                    <text className={`hf-tall-k${s.done || s.now ? ' on' : ''}`} x={s.x + 52} y={s.y - 2}>{s.k}</text>
                    <text className={`hf-tall-w${s.now ? ' now' : ''}`} x={s.x + 52} y={s.y + 20}>{s.when}</text>
                    {next && <path className={reached ? 'hf-go hf-road-done' : 'hf-road-next'} d={segTall(s, next)} />}
                  </g>
                );
              })}
            </svg>
          </ScrollDraw>
          <ol className="hf-labels">
            {ST.map((s) => (
              <li key={s.k} className={`${s.done ? 'is-done' : ''}${s.now ? ' is-now' : ''}`} style={{ '--x': s.x / 1000 } as React.CSSProperties}>
                <b>{s.k}</b><span>{s.when}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* ── The order: each product inks in as its card arrives ── */}
        <section className="hf-items" id="items">
          <h2 className="hf-h2">In your parcel</h2>
          <div className="hf-grid">
            {ITEMS.map((it) => (
              <article key={it.name} className={`hf-card tone-${it.tone}`}>
                <ScrollDraw className="hf-art" trigger={{ start: 'top 92%', end: 'top 55%' }} stagger={0.1} easing="ease-out" once>
                  <svg viewBox="0 0 128 132" aria-hidden="true">{it.draw.map((d, k) => <path key={k} className="hf-prod" d={d} />)}</svg>
                </ScrollDraw>
                <div className="hf-card-body">
                  <h3>{it.name}</h3>
                  <p>{it.meta}</p>
                  <span>{it.price}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="hf-details">
          <div><h3>Delivering to</h3><p>Ada Park<br />Rua das Flores 112, 2º<br />1200-195 Lisboa, Portugal</p></div>
          <div><h3>Paid with</h3><p>Visa ending 4242<br />€148.00 · incl. €27.67 VAT</p></div>
          <div><h3>Need to change something?</h3><p>Reply to your confirmation email before Wednesday and we&apos;ll sort it.</p><a href="#top">Manage order →</a></div>
        </section>
      </main>

      <footer className="hf-foot">
        <span className="hf-brand">Hearth <i>&amp;</i> Field</span>
        <span>Made slowly in Porto · Free returns within 30 days</span>
        <span className="hf-legal">© 2026 Hearth &amp; Field — a fictional shop; this is a demo site.</span>
      </footer>

      <BuiltWith example="flowchart" apis="selector · stagger · autoplay" />
    </div>
  );
}
