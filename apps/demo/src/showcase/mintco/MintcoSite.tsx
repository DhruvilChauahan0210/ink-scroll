'use client';

import './mintco.css';
import { useEffect, useRef } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { scrollAnimate, scrollDraw } from 'svg-scroll-draw';
import { Site } from '../kit/Site';
import { Logo, Phone, Card, Notification, Icon, Merchant, Stars, QR } from './MintcoParts';

/* Mint & Co — a UK challenger bank's "switch your current account" page.
   The four switching steps slide in one after another (scrollAnimate, each
   row's trigger 5% lower than the last) while scrollDraw inks in every line
   drawing in the list: each step's icon and the rail that joins them. */

const STEPS: { who: string; t: string; d: string; icon: string[]; ui: ReactNode }[] = [
  {
    who: 'You · about 4 minutes',
    t: 'Download Mint and open an account',
    d: 'Your phone number, a photo of your passport or driving licence and a five-second selfie video. No branch, no letters, no credit check that leaves a mark.',
    icon: ['M10 3.5h12a2 2 0 0 1 2 2v21a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-21a2 2 0 0 1 2-2z', 'M14 6.5h4', 'M12 12v-1.5h1.5M20 12v-1.5h-1.5M12 18v1.5h1.5M20 18v1.5h-1.5', 'M14.2 16.2c1 .9 2.6.9 3.6 0', 'M14.5 13.4v.4M17.5 13.4v.4', 'M14.5 24.5h3'],
    ui: (
      <div className="mc-sui mc-sui-id">
        <p className="mc-sui-h"><b>Identity check</b><em>Approved in 3m 52s</em></p>
        {['Phone number', 'Passport or licence', 'Selfie video'].map((x) => <span key={x} className="mc-ok">{x}</span>)}
      </div>
    ),
  },
  {
    who: 'Instant',
    t: 'Get your account details straight away',
    d: 'A sort code and account number the moment you’re approved. Give them to work for this month’s salary and add your card to your phone’s wallet before the plastic one arrives.',
    icon: ['M4 8.5h24v15H4z', 'M4 13h24', 'M8 18h5M8 20.5h3', 'M20.5 17h4v3.5h-4z', 'M26 4.5l1.5-1.5M28.5 7.5h1.5M23 3V1.5'],
    ui: (
      <div className="mc-sui mc-sui-acct">
        <span><small>Sort code</small><b>04-12-87</b></span>
        <span><small>Account number</small><b>31926819</b></span>
        <span className="mc-copy">Copy details</span>
      </div>
    ),
  },
  {
    who: 'You · about 1 minute',
    t: 'Pick your old bank and a switch date',
    d: 'Any of the 40+ UK banks and building societies in the Current Account Switch Service. Choose any working day at least seven days away — we’ll suggest the one before payday.',
    icon: ['M3.5 12L15 5l11.5 7z', 'M6 12.5v9M11 12.5v9M19 12.5v9M24 12.5v9', 'M3.5 24.5h23', 'M2 27.5h26', 'M15 9.2v.1'],
    ui: (
      <div className="mc-sui mc-sui-date">
        <span className="mc-select"><Merchant l="B&L" c="#fff" bg="#7a1f3d" /><b>Barrow &amp; Lyle</b><small>Classic Account ··4471</small><i>▾</i></span>
        <span className="mc-week">
          {[['Mon', '10'], ['Tue', '11'], ['Wed', '12'], ['Thu', '13'], ['Fri', '14']].map(([d, n]) => (
            <span key={n} className={n === '13' ? 'on' : ''}><small>{d}</small><b>{n}</b></span>
          ))}
        </span>
      </div>
    ),
  },
  {
    who: 'Us · 7 working days',
    t: 'We move everything and close the old account',
    d: 'Your salary, direct debits and standing orders come across. Any balance lands in Mint on switch day, and payments sent to your old details are redirected to you automatically.',
    icon: ['M16 28.5c6.9 0 12.5-5.6 12.5-12.5S22.9 3.5 16 3.5 3.5 9.1 3.5 16 9.1 28.5 16 28.5z', 'M10 16.5l4.2 4.2L22.5 12', 'M27 3.5l2-2M29 8h2'],
    ui: (
      <div className="mc-sui mc-sui-done">
        {[['Salary · Oakline Studio', 'Redirected'], ['14 direct debits', 'Moved'], ['3 standing orders', 'Moved'], ['£318.22 balance', 'Thu 13 Nov']].map(([a, b]) => (
          <span key={a} className="mc-ok"><b>{a}</b><em>{b}</em></span>
        ))}
      </div>
    ),
  },
];

const POTS = [
  { n: 'Lisbon in May', v: '£640.00', of: 'of £1,200', p: 53, c: '#f2b84b' },
  { n: 'Rainy day', v: '£2,150.00', of: '4.10% AER', p: 100, c: '#45dd9c', earn: '+£7.21 this month' },
  { n: 'Bills', v: '£412.00', of: 'Locked to payday', p: 100, c: '#8fb8ff' },
  { n: 'New bike', v: '£180.00', of: 'of £900', p: 20, c: '#ff8f6b' },
];

const BILLS = [
  ['Rent', 'Mon 1 Dec', '£1,150.00'],
  ['Council tax', 'Mon 1 Dec', '£148.00'],
  ['Broadband', 'Wed 3 Dec', '£32.00'],
  ['Mobile', 'Mon 8 Dec', '£18.00'],
];

const SPEND = [
  ['Groceries', 312, '#45dd9c'],
  ['Eating out', 146, '#f2b84b'],
  ['Transport', 98, '#8fb8ff'],
  ['Shopping', 87, '#ff8f6b'],
  ['Entertainment', 41, '#c4a6ff'],
] as const;

const REVIEWS = [
  { n: 'Hannah O.', d: '2 days ago', s: 5, t: 'Switched on a Tuesday, salary landed in Mint on the Friday',
    b: 'Genuinely did nothing after picking the date. Every direct debit came across, even the gym one I’d forgotten about.' },
  { n: 'Dev P.', d: '1 week ago', s: 5, t: 'Pots changed how I save',
    b: 'Bills go into a locked pot the day I’m paid, and the rest is mine. First time I’ve not been overdrawn by the 20th.' },
  { n: 'Moira K.', d: '3 weeks ago', s: 4, t: 'Support actually answers',
    b: 'Lost my card in Porto at midnight. Froze it in the app and a real person had a new one on its way in four minutes.' },
];

const FAQ = [
  ['Will my direct debits and standing orders move?', 'Yes — all of them. The Current Account Switch Service moves every direct debit and standing order on your old account, and tells the companies that collect them about your new details. You don’t need to contact anyone.'],
  ['What happens to payments sent to my old account?', 'They’re redirected to your Mint account automatically, and we let the sender know your new details so the next payment comes straight to us.'],
  ['Can I switch an account I share with someone?', 'Yes. Open a joint account in the app, invite the other person, and switch your old joint account into it once you’ve both signed up.'],
  ['What if something goes wrong?', 'The Current Account Switch Guarantee covers you: if any payment is missed or late because of the switch, we refund any interest and charges on either account.'],
  ['Do I have to close my old account?', 'No. Choose a partial switch to move only the payments you pick and keep the old account open. A full switch closes it for you on switch day.'],
];

export function MintcoSite() {
  const list = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const rows = Array.from(list.current!.querySelectorAll('li'));
    const inst = rows.map((row, i) => scrollAnimate(row, {
      props: { opacity: [0, 1], transform: ['translateX(-28px)', 'translateX(0)'] },
      trigger: { start: `top ${90 - i * 5}%`, end: `top ${60 - i * 5}%` },
      easing: 'ease-out', once: true,
    }));
    const icons = scrollDraw(list.current!, { stagger: 0.06, once: true, trigger: { start: 'top 85%', end: 'bottom 60%' } });
    return () => { inst.forEach((x) => x.destroy()); icons.destroy(); };
  }, []);

  return (
    <Site
      className="mc"
      brand={<><Logo />Mint &amp; Co</>}
      links={['Current account', 'Savings', 'Joint', 'Business', 'Help']}
      cta="Open an account"
      example="scroll-text-lines"
      apis="scrollAnimate · rows one after another · scrollDraw"
      footnote="The current account that does the boring bits for you"
    >
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="mc-hero">
        <div className="mc-hero-copy">
          <p className="mc-kick">Switched in 7 working days, guaranteed</p>
          <h1 className="mc-h1">Switch in four minutes. <em>We’ll do the other seven days.</em></h1>
          <p className="mc-lede">Open a Mint account in the app, pick your old bank and a date. We move your salary, direct debits and standing orders across, close the old account and catch anything still sent to it.</p>
          <div className="mc-ctas">
            <a className="mc-btn" href="#top">Start your switch</a>
            <a className="mc-btn mc-btn-ghost" href="#switch">How switching works</a>
          </div>
          <div className="mc-proof">
            <span className="mc-proof-r"><Stars /><b>4.8</b><small>212,418 ratings</small></span>
            <span className="mc-proof-f"><Icon name="shield" size={18} /><span><b>FSCS protected</b><small>Eligible deposits up to £120,000</small></span></span>
          </div>
        </div>

        <div className="mc-stage">
          <div className="mc-stage-bg" aria-hidden="true" />
          <Card className="mc-hero-card" />
          <Phone />
          <Notification className="mc-hero-notif" title="Salary arrived" body={<>£2,140.00 from Oakline Studio. £412 is already in your Bills pot.</>} />
          <div className="mc-chip-float" aria-hidden="true"><i><Icon name="check" size={14} /></i><span><b>Direct debits moved</b><small>14 of 14 · Barrow &amp; Lyle</small></span></div>
        </div>
      </section>

      {/* ── Trust strip ──────────────────────────────────────────────── */}
      <section className="mc-trust" aria-label="Why people switch">
        {([
          ['shield', 'FSCS protected', 'up to £120,000'],
          ['clock', 'Switch Guarantee', '7 working days'],
          ['pot', 'No monthly fee', 'not now, not ever'],
          ['chat', 'Real people, 24/7', 'in Leeds and Glasgow'],
        ] as const).map(([k, a, b]) => (
          <span key={a}><i><Icon name={k} size={20} /></i><span><b>{a}</b><small>{b}</small></span></span>
        ))}
      </section>

      {/* ── Switching: the effect ────────────────────────────────────── */}
      <section className="mc-sec mc-switch" id="switch">
        <div className="mc-switch-aside">
          <p className="mc-kick">How switching works</p>
          <h2 className="mc-h2">Four steps. You do two of them, on your phone.</h2>
          <p className="mc-lede">The switch runs through the Current Account Switch Service, the same one every major UK bank uses. You pick the date — we handle the rest and keep you posted in the app.</p>
          <div className="mc-guarantee">
            <span className="mc-g-badge"><Icon name="shield" size={22} /></span>
            <div>
              <b>Current Account Switch Guarantee</b>
              <ul>
                <li>Your switch is done on the date you choose</li>
                <li>Payments to your old account are redirected</li>
                <li>Any interest or charges from a missed payment are refunded</li>
              </ul>
            </div>
          </div>
        </div>

        <ol className="mc-steps" ref={list}>
          {STEPS.map((s, i) => (
            <li key={s.t}>
              <span className="mc-step-ico">
                <svg viewBox="0 0 32 32" aria-hidden="true">{s.icon.map((d) => <path key={d} d={d} />)}</svg>
              </span>
              {i < STEPS.length - 1 && (
                <svg className="mc-rail" viewBox="0 0 2 100" preserveAspectRatio="none" aria-hidden="true"><path d="M1 0 V100" /></svg>
              )}
              <div className="mc-step-body">
                <p className="mc-step-who"><em>0{i + 1}</em>{s.who}</p>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
                {s.ui}
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ── The app ──────────────────────────────────────────────────── */}
      <section className="mc-sec mc-app" id="app">
        <header className="mc-sec-head mc-sec-head-split">
          <div>
            <p className="mc-kick">What you’re switching to</p>
            <h2 className="mc-h2">A current account that sorts your money before you’ve thought about it.</h2>
          </div>
          <p className="mc-lede">Everything below is in the free account. No paid tier to unlock pots, no fee for spending abroad, and no charge to switch — now or later.</p>
        </header>

        <div className="mc-bento">
          <article className="mc-tile mc-t-pots">
            <div className="mc-t-copy">
              <h3>Pots for everything</h3>
              <p>Split your balance into pots for bills, trips and the rainy day. Savings Pots earn 4.10% AER variable, paid monthly — no notice, no bonus hoops.</p>
              <span className="mc-t-stat"><b>£3,382</b> in 4 pots</span>
            </div>
            <div className="mc-pots" aria-hidden="true">
              {POTS.map((p) => (
                <div key={p.n} className="mc-pot" style={{ '--c': p.c } as CSSProperties}>
                  <span className="mc-pot-ico"><Icon name="pot" size={16} /></span>
                  <span className="mc-pot-n"><b>{p.n}</b><small>{p.earn ?? p.of}</small></span>
                  <span className="mc-pot-v">{p.v}</span>
                  <span className="mc-pot-bar"><i style={{ width: `${p.p}%` }} /></span>
                </div>
              ))}
            </div>
          </article>

          <article className="mc-tile mc-t-early">
            <div className="mc-viz mc-viz-early" aria-hidden="true">
              <div className="mc-cal">
                {[['Wed', '26'], ['Thu', '27'], ['Fri', '28']].map(([d, n]) => (
                  <span key={n} className={n === '27' ? 'on' : n === '28' ? 'pay' : ''}><small>{d}</small><b>{n}</b>{n === '27' && <em>Paid 09:02</em>}{n === '28' && <em>Payday</em>}</span>
                ))}
              </div>
              <Notification className="mc-n-sm" title="Salary arrived" body="£2,140.00 · a day early" time="Thu" />
            </div>
            <h3>Get paid a day early</h3>
            <p>When your employer sends your salary early, it’s yours the moment we see it — not on payday.</p>
          </article>

          <article className="mc-tile">
            <div className="mc-viz mc-viz-bills" aria-hidden="true">
              <p className="mc-viz-h"><b>Due before payday</b><span className="mc-good">All covered</span></p>
              {BILLS.map(([n, d, a]) => <span key={n}><b>{n}</b><small>{d}</small><em>{a}</em></span>)}
            </div>
            <h3>Bills, sorted on payday</h3>
            <p>We set aside what’s due before your next payday into a Bills pot, so the rest of your balance is safe to spend.</p>
          </article>

          <article className="mc-tile">
            <div className="mc-viz mc-viz-fx" aria-hidden="true">
              <span className="mc-fx-row"><Merchant l="CL" c="#fff" bg="#c2453a" /><span><b>Café Lisboa</b><small>Porto · 13:20</small></span><em>€4.20<small>£3.63</small></em></span>
              <span className="mc-fx-rate"><span>€1 = £0.8642</span><span>Fee <b>£0.00</b></span></span>
              <span className="mc-fx-atm"><span>Free cash abroad</span><span className="mc-meter"><i style={{ width: '35%' }} /></span><small>£140 of £400 this month</small></span>
            </div>
            <h3>Spend abroad, fee-free</h3>
            <p>No fees on card payments anywhere in the world, at the network rate. Take out up to £400 a month in cash, free.</p>
          </article>

          <article className="mc-tile">
            <div className="mc-viz mc-viz-freeze" aria-hidden="true">
              <Card frozen className="mc-card-sm" />
              <div className="mc-toggles">
                {[['Freeze card', true], ['Online payments', true], ['Contactless', true], ['Gambling block', true]].map(([n, on]) => (
                  <span key={n as string}><b>{n}</b><i className={on ? 'on' : ''} /></span>
                ))}
              </div>
            </div>
            <h3>Freeze it in a tap</h3>
            <p>Lost your card? Freeze it, then unfreeze it when it turns up in your coat. Block gambling or online payments any time.</p>
          </article>

          <article className="mc-tile mc-t-wide">
            <div className="mc-viz mc-viz-spend" aria-hidden="true">
              <p className="mc-viz-h"><b>October</b><span>£684 spent · <em>£126 less than September</em></span></p>
              <div className="mc-spend">
                {SPEND.map(([n, v, c]) => (
                  <span key={n} style={{ '--c': c, '--w': `${(v / 312) * 100}%` } as CSSProperties}><b>{n}</b><i /><em>£{v}</em></span>
                ))}
              </div>
            </div>
            <h3>See where it all went</h3>
            <p>Every payment is sorted into a category with the merchant’s name and logo, so you can see October at a glance and set a budget for November.</p>
          </article>

          <article className="mc-tile mc-t-wide">
            <div className="mc-viz mc-viz-payee" aria-hidden="true">
              <div className="mc-payee">
                <span className="mc-payee-h">New payee</span>
                <span><small>Name</small><b>Tomás Reis</b></span>
                <span><small>Sort code</small><b>20-45-18</b></span>
                <span><small>Account</small><b>55120934</b></span>
                <span className="mc-payee-ok"><Icon name="check" size={14} />Name matches the account</span>
              </div>
              <div className="mc-scam">
                <b>Is someone telling you to move money?</b>
                <span>Mint will never ask you to move money to a “safe account”. If anyone does, stop and call us from the app.</span>
                <em>Call Mint from the app</em>
              </div>
            </div>
            <h3>Checks before every new payee</h3>
            <p>We check the name against the account before you send a penny, and step in when a payment looks like a scam.</p>
          </article>
        </div>
      </section>

      {/* ── Savings rates ────────────────────────────────────────────── */}
      <section className="mc-sec mc-save" id="savings">
        <div className="mc-save-copy">
          <p className="mc-kick">Savings</p>
          <h2 className="mc-h2">Rates that don’t drop after the first year.</h2>
          <p className="mc-lede">Open a Savings Pot next to your current account and move money in and out instantly. Interest is calculated daily and paid on the first of the month.</p>
          <table className="mc-rates">
            <thead><tr><th>Account</th><th>Rate</th><th>Access</th></tr></thead>
            <tbody>
              <tr><td><b>Savings Pot</b></td><td><b>4.10%</b> AER variable</td><td>Instant</td></tr>
              <tr><td><b>Cash ISA Pot</b></td><td><b>4.00%</b> AER variable</td><td>Instant, tax-free</td></tr>
              <tr><td><b>1-year Fixed Pot</b></td><td><b>4.35%</b> AER fixed</td><td>At maturity</td></tr>
            </tbody>
          </table>
          <p className="mc-fine">Rates correct on 1 November 2026. AER stands for Annual Equivalent Rate and shows what the interest rate would be if interest was paid and compounded once each year.</p>
        </div>
        <div className="mc-calc" aria-hidden="true">
          <p className="mc-calc-h">If you save</p>
          <p className="mc-calc-v">£5,000</p>
          <span className="mc-slider"><i style={{ width: '25%' }} /><b style={{ left: '25%' }} /></span>
          <span className="mc-slider-l"><span>£100</span><span>£20,000</span></span>
          <div className="mc-calc-out">
            <span><small>You’d earn in a year</small><b>£209.08</b></span>
            <span><small>That’s about</small><b>£17.42</b><small>a month</small></span>
          </div>
          <div className="mc-growth">
            {Array.from({ length: 12 }, (_, i) => <i key={i} style={{ height: `${46 + i * 4.6}%` }} />)}
          </div>
          <span className="mc-growth-l"><span>Dec</span><span>Jun</span><span>Nov</span></span>
        </div>
      </section>

      {/* ── Reviews ──────────────────────────────────────────────────── */}
      <section className="mc-sec mc-reviews" id="reviews">
        <div className="mc-score">
          <p className="mc-kick">Reviews</p>
          <p className="mc-score-n">4.8<small>/5</small></p>
          <Stars />
          <p className="mc-score-c">From 212,418 ratings on iPhone and Android</p>
          <div className="mc-dist">
            {[[5, 86], [4, 9], [3, 2], [2, 1], [1, 2]].map(([s, p]) => (
              <span key={s}><b>{s}</b><i><em style={{ width: `${p}%` }} /></i><small>{p}%</small></span>
            ))}
          </div>
        </div>
        <div className="mc-revs">
          {REVIEWS.map((r) => (
            <figure key={r.n} className="mc-rev">
              <Stars n={r.s} />
              <b>{r.t}</b>
              <blockquote>{r.b}</blockquote>
              <figcaption><span className="mc-rev-a">{r.n.split(' ').map((x) => x[0]).join('')}</span>{r.n}<small>{r.d} · switched from another bank</small></figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      <section className="mc-sec mc-faq" id="faq">
        <div>
          <p className="mc-kick">Switching questions</p>
          <h2 className="mc-h2">The things people ask before they switch.</h2>
          <p className="mc-lede">Still unsure? Chat to us in the app, any time — the average wait is 1 minute 40 seconds.</p>
        </div>
        <div className="mc-qs">
          {FAQ.map(([q, a], i) => (
            <details key={q} open={i === 0}>
              <summary>{q}<i aria-hidden="true" /></summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section className="mc-cta">
        <div className="mc-cta-copy">
          <h2 className="mc-h2">Start today. Be switched by Thursday week.</h2>
          <p>Scan to download the app — opening an account takes about four minutes, and your sort code and account number arrive the moment you’re approved.</p>
          <div className="mc-ctas">
            <a className="mc-btn mc-btn-mint" href="#top">Open an account</a>
            <a className="mc-btn mc-btn-line" href="#faq">Read the switching FAQ</a>
          </div>
        </div>
        <div className="mc-qr-card">
          <QR />
          <span><b>Scan to get Mint</b><small>iPhone and Android · 4.8 rated</small></span>
        </div>
      </section>

      <section className="mc-small" aria-label="Small print">
        <p>Mint &amp; Co is a trading name of Mint &amp; Co Bank Ltd, registered in England and Wales (company no. 10482316), 2 Tanner Yard, London SE1 3LD. Your eligible deposits with Mint &amp; Co are protected up to a total of £120,000 by the Financial Services Compensation Scheme. Any deposits you hold above the limit are unlikely to be covered.</p>
        <p>Switching uses the Current Account Switch Service and is covered by the Current Account Switch Guarantee. Fee-free spending abroad is subject to the fair-use limits in our Tariff. Savings rates are variable unless marked fixed. You must be 18 or over and live in the UK to open an account.</p>
      </section>
    </Site>
  );
}
