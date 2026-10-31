'use client';

import './hearth.css';
import { ScrollDraw } from 'svg-scroll-draw/react';
import { BuiltWith } from '../BuiltWith';

/*
 * Hearth & Field — a demo checkout for a fictional homeware shop, built with
 * svg-scroll-draw:
 *   · the progress stepper's icons and connectors ink in, step by step, up to
 *     the step the customer is on (selector + stagger)
 *   · each product in the order summary is a line drawing that inks in, one
 *     after another
 */

const STEPS = [
  { k: 'Bag', done: true, icon: ['M6 10h20l-2 16H8z', 'M11 10V8a5 5 0 0 1 10 0v2'] },
  { k: 'Shipping', done: true, icon: ['M3 9h16v13H3z', 'M19 13h6l4 5v4H19', 'M8 26a2.5 2.5 0 1 0 0.01 0M24 26a2.5 2.5 0 1 0 0.01 0'] },
  { k: 'Payment', done: false, now: true, icon: ['M3 8h26v17H3z', 'M3 13h26', 'M7 20h7'] },
  { k: 'Review', done: false, icon: ['M6 4h14l6 6v18H6z', 'M10 17l4 4 8-8'] },
];

const ITEMS = [
  {
    name: 'Stoneware mug, ash glaze', meta: '350 ml · set of 2', qty: 1, price: 58,
    draw: ['M18 24 H50 V52 A8 8 0 0 1 42 60 H26 A8 8 0 0 1 18 52 Z', 'M50 32 H56 A8 8 0 0 1 56 48 H50', 'M27 18 C 24 13 30 11 27 6 M35 18 C 32 13 38 11 35 6 M43 18 C 40 13 46 11 43 6'],
  },
  {
    name: 'Linen throw, moss', meta: '130 × 170 cm', qty: 1, price: 72,
    draw: ['M10 22 H62 V34 H10 Z', 'M14 34 H58 V46 H14 Z', 'M10 46 H62 V58 H10 Z', 'M14 58 V64 M20 58 V64 M26 58 V64 M32 58 V64 M38 58 V64 M44 58 V64 M50 58 V64 M56 58 V64'],
  },
  {
    name: 'Beeswax candle, juniper', meta: '220 g · 45 h burn', qty: 1, price: 18,
    draw: ['M22 30 H50 V62 H22 Z', 'M20 30 H52', 'M24 42 H48', 'M36 30 V22', 'M36 22 C 30 16 34 9 36 5 C 38 9 42 16 36 22'],
  },
];

const eur = (n: number) => `€${n.toFixed(2)}`;
const SUBTOTAL = ITEMS.reduce((s, i) => s + i.price * i.qty, 0);

export function HearthSite() {
  return (
    <div className="hf">
      <header className="hf-top">
        <a className="hf-brand" href="#top">Hearth <i>&amp;</i> Field</a>
        <span className="hf-secure">
          <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><path d="M4.5 7V5a3.5 3.5 0 0 1 7 0v2M3.5 7h9v7h-9z" fill="none" stroke="currentColor" strokeWidth="1.4" /></svg>
          Secure checkout
        </span>
      </header>

      <main className="hf-main" id="top">
        {/* The stepper: icons and connectors ink in up to the current step */}
        <ScrollDraw className="hf-steps" selector=".hf-ink" autoplay duration={600} delay={200} stagger={0.35} easing="ease-out" once>
          <ol>
            {STEPS.map((s, i) => (
              <li key={s.k} className={`${s.done ? 'is-done' : ''}${s.now ? ' is-now' : ''}`} aria-current={s.now ? 'step' : undefined}>
                <span className="hf-step-icon">
                  <svg viewBox="0 0 32 32" aria-hidden="true">
                    {s.icon.map((d, k) => <path key={k} className={s.done || s.now ? 'hf-ink' : 'hf-idle'} d={d} />)}
                  </svg>
                </span>
                <span className="hf-step-k">{s.k}</span>
                {i < STEPS.length - 1 && (
                  <svg className="hf-conn" viewBox="0 0 100 2" preserveAspectRatio="none" aria-hidden="true">
                    <path className={s.done ? 'hf-ink' : 'hf-idle'} d="M0 1 H100" />
                  </svg>
                )}
              </li>
            ))}
          </ol>
        </ScrollDraw>

        <div className="hf-grid">
          <div className="hf-form">
            <section className="hf-box">
              <div className="hf-row"><span className="hf-lab">Contact</span><span>ada.park@example.com</span><a href="#top">Change</a></div>
              <div className="hf-row"><span className="hf-lab">Ship to</span><span>Rua das Flores 112, 2º, 1200-195 Lisboa, Portugal</span><a href="#top">Change</a></div>
              <div className="hf-row"><span className="hf-lab">Delivery</span><span>Standard · 2–3 working days · <b>Free</b></span><a href="#top">Change</a></div>
            </section>

            <h1 className="hf-h">Payment</h1>
            <p className="hf-sub">All transactions are secure and encrypted.</p>
            <section className="hf-box hf-pay">
              <div className="hf-pay-head">
                <span><span className="hf-radio is-on" /> Credit or debit card</span>
                <span className="hf-cards" aria-hidden="true"><i>VISA</i><i>MC</i><i>AMEX</i></span>
              </div>
              <div className="hf-fields">
                <label className="hf-field hf-wide"><span>Card number</span><input readOnly value="4242 4242 4242 4242" aria-label="Card number" /></label>
                <label className="hf-field"><span>Expiry (MM / YY)</span><input readOnly value="09 / 28" aria-label="Expiry" /></label>
                <label className="hf-field"><span>Security code</span><input readOnly value="•••" aria-label="Security code" /></label>
                <label className="hf-field hf-wide"><span>Name on card</span><input readOnly value="Ada Park" aria-label="Name on card" /></label>
              </div>
              <div className="hf-pay-alt"><span className="hf-radio" /> Pay with MB WAY</div>
            </section>
            <label className="hf-check"><span className="hf-box-tick" /> Billing address is the same as shipping</label>
            <a className="hf-pay-btn" href="#top">Pay {eur(SUBTOTAL)}</a>
            <p className="hf-fine">Free returns within 30 days. Questions? hello@hearthandfield.example</p>
          </div>

          {/* The order: each product inks in, one after another */}
          <aside className="hf-sum" aria-label="Order summary">
            <ScrollDraw className="hf-items" selector=".hf-prod" autoplay duration={900} delay={700} stagger={0.12} easing="ease-out" once>
              {ITEMS.map((it) => (
                <div key={it.name} className="hf-item">
                  <span className="hf-thumb">
                    <svg viewBox="0 0 72 72" aria-hidden="true">{it.draw.map((d, k) => <path key={k} className="hf-prod" d={d} />)}</svg>
                    <b>{it.qty}</b>
                  </span>
                  <span className="hf-item-t"><b>{it.name}</b><span>{it.meta}</span></span>
                  <span className="hf-item-p">{eur(it.price)}</span>
                </div>
              ))}
            </ScrollDraw>
            <div className="hf-code"><input readOnly placeholder="Gift card or discount code" aria-label="Discount code" /><span>Apply</span></div>
            <dl className="hf-totals">
              <div><dt>Subtotal</dt><dd>{eur(SUBTOTAL)}</dd></div>
              <div><dt>Shipping</dt><dd>Free</dd></div>
              <div className="hf-total"><dt>Total</dt><dd><small>EUR</small> {eur(SUBTOTAL)}</dd></div>
            </dl>
            <p className="hf-vat">Including {eur(SUBTOTAL - SUBTOTAL / 1.23)} VAT</p>
          </aside>
        </div>
      </main>

      <footer className="hf-foot">
        <span>Refund policy</span><span>Shipping</span><span>Privacy</span><span>Terms</span>
        <span className="hf-legal">© 2026 Hearth &amp; Field — a fictional shop; this is a demo site.</span>
      </footer>

      <BuiltWith example="flowchart" apis="selector · stagger · autoplay" />
    </div>
  );
}
