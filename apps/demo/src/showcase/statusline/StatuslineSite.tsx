'use client';

import './statusline.css';
import type { ReactNode } from 'react';
import { ScrollDraw } from 'svg-scroll-draw/react';
import { Site } from '../kit/Site';
import { CH, CW, DAY_LABEL, GROUPS, HISTORY, REGIONS, SERVICES, X_TICKS, fmtMs, type Incident, type Service } from './data';

/* Paygrid status — the public status page of a payments API, hosted on
   Statusline (built with Solid in real life; the snippet is Solid). Each
   service's 24-hour response-time chart draws its p50 and p99 lines as the
   card scrolls in, the webhook incident spike included. */

const Mark = () => (
  <svg className="sl-mark" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
    <rect width="24" height="24" rx="6.5" fill="#4338ca" />
    <rect x="6" y="6" width="5" height="5" rx="1.2" fill="#fff" />
    <rect x="13" y="6" width="5" height="5" rx="1.2" fill="#fff" opacity="0.55" />
    <rect x="6" y="13" width="5" height="5" rx="1.2" fill="#fff" opacity="0.55" />
    <path d="M13.2 15.5h4.6M15.5 13.2v4.6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const I = {
  check: <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5.5 10.5l3 3 6-7" /></svg>,
  chev: <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7.5 5l5 5-5 5" /></svg>,
  down: <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6 8l4 4 4-4" /></svg>,
  mail: <svg viewBox="0 0 20 20" aria-hidden="true"><rect x="3" y="5" width="14" height="10" rx="2" /><path d="M3.5 6l6.5 5 6.5-5" /></svg>,
  sms: <svg viewBox="0 0 20 20" aria-hidden="true"><rect x="6" y="2.5" width="8" height="15" rx="2" /><path d="M9 15h2" /></svg>,
  chat: <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 5.5h12v7.5H9l-3.5 3v-3H4z" /><path d="M7.5 9.2h5" /></svg>,
  hook: <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="6" cy="14" r="2" /><circle cx="14" cy="14" r="2" /><circle cx="10" cy="6" r="2" /><path d="M8.9 7.7L6.6 12M11.1 7.7l2.3 4.3M8 14h4" /></svg>,
  rss: <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 4.5a10.5 10.5 0 0 1 10.5 10.5M5 9a6 6 0 0 1 6 6" /><circle cx="5.8" cy="14.2" r="1.3" /></svg>,
  cal: <svg viewBox="0 0 20 20" aria-hidden="true"><rect x="3.5" y="4.5" width="13" height="12" rx="2" /><path d="M3.5 8.5h13M7 3v3M13 3v3" /></svg>,
  bell: <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5.5 13.5V9a4.5 4.5 0 0 1 9 0v4.5l1.5 1.5h-12z" /><path d="M8.5 17h3" /></svg>,
};

function Now() {
  const api = SERVICES[0];
  return (
    <section className="sl-hero">
      <div className="sl-wrap">
        <div className="sl-now">
          <div className="sl-now-main">
            <span className="sl-now-icon">{I.check}</span>
            <div>
              <h1>All systems operational</h1>
              <p>We’re not aware of any issues affecting Paygrid right now. This morning’s webhook delays in eu-west are resolved.</p>
            </div>
          </div>
          <div className="sl-now-meta">
            <span className="sl-live"><i />Live</span>
            <span>Checked <b>14:32:08 UTC</b></span>
            <span className="sl-sel">All regions{I.down}</span>
          </div>
        </div>

        <a className="sl-maint" href="#history">
          <span className="sl-maint-tag">{I.cal}Scheduled</span>
          <span className="sl-maint-t"><b>SEPA payouts processor upgrade</b> <span>Wed 4 Nov · 02:00–03:30 UTC</span></span>
          <span className="sl-maint-more">Payouts in the window are queued, not failed →</span>
        </a>

        <dl className="sl-kpis">
          <div><dt>API uptime · 90 days</dt><dd>99.987%</dd><small>Contracted SLA 99.95%</small></div>
          <div><dt>API latency · p50 now</dt><dd>{fmtMs(api.now)}</dd><small>p99 {fmtMs(api.p99)}</small></div>
          <div><dt>Webhooks under 5 s</dt><dd>99.62%</dd><small>Last 30 days</small></div>
          <div><dt>Incidents · 90 days</dt><dd>7</dd><small>Median time to resolve 41 min</small></div>
        </dl>
      </div>
    </section>
  );
}

function Uptime() {
  return (
    <section className="sl-sec" id="uptime">
      <div className="sl-wrap">
        <div className="sl-sec-h">
          <div>
            <h2>System status</h2>
            <p>Uptime over the last 90 days, by product. Expand a product to see its components.</p>
          </div>
          <ul className="sl-legend" aria-label="Legend">
            <li><i className="ok" />Operational</li>
            <li><i className="minor" />Degraded</li>
            <li><i className="partial" />Partial outage</li>
            <li><i className="maint" />Maintenance</li>
            <li><i className="none" />No data</li>
          </ul>
        </div>

        <div className="sl-card sl-groups">
          {GROUPS.map((g) => {
            const tip = g.name === 'Webhooks';
            return (
              <div key={g.name} className={`sl-group${g.open ? ' is-open' : ''}${tip ? ' has-tip' : ''}`}>
                <div className="sl-group-h">
                  <span className="sl-chev">{I.chev}</span>
                  <b>{g.name}</b>
                  <span className="sl-count">{g.count} components</span>
                  <span className="sl-group-up">{g.uptime}<span> uptime</span></span>
                  <span className="sl-pill ok"><i />Operational</span>
                </div>
                <div className="sl-bars-wrap">
                  <div className="sl-bars" role="img" aria-label={`${g.name}: ${g.uptime} uptime over 90 days`}>
                    {g.days.map((d, i) => <i key={i} className={`${d}${tip && i === 89 ? ' hover' : ''}`} title={i === 89 ? DAY_LABEL[d] : undefined} />)}
                  </div>
                  {tip && (
                    <div className="sl-tip" aria-hidden="true">
                      <b>Sun 1 Nov 2026</b>
                      <span className="sl-tip-row"><i className="minor" />Degraded performance<em>29 min</em></span>
                      <span className="sl-tip-inc">Webhook deliveries delayed in eu-west</span>
                    </div>
                  )}
                </div>
                <div className="sl-bars-f"><span className="d90">90 days ago</span><span className="d30">30 days ago</span><span>Today</span></div>
                {g.open && g.parts.length > 0 && (
                  <ul className="sl-parts">
                    {g.parts.map((p) => <li key={p.n}><i />{p.n}<em>{p.up}</em></li>)}
                  </ul>
                )}
              </div>
            );
          })}
          <div className="sl-regions">
            <p>Regions</p>
            <ul>
              {REGIONS.map((r) => (
                <li key={r.code}><i /><span><b>{r.code}</b>{r.city} · <em>{r.ms} ms</em></span></li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function Chart({ s }: { s: Service }) {
  const inc = s.incident;
  const a = inc ? ((inc.from / 96) * 100).toFixed(2) : '0';
  const b = inc ? ((inc.to / 96) * 100).toFixed(2) : '0';
  const stops = (calm: string, hot: string) => inc && (
    <>
      <stop offset={`${a}%`} stopColor={calm} />
      <stop offset={`${a}%`} stopColor={hot} />
      <stop offset={`${b}%`} stopColor={hot} />
      <stop offset={`${b}%`} stopColor={calm} />
    </>
  );
  return (
    <article className={`sl-chart${s.state === 'recovered' ? ' is-rec' : ''}`}>
      <header className="sl-chart-h">
        <div>
          <h3>{s.name}</h3>
          <span className="sl-host">{s.host}</span>
        </div>
        <span className={`sl-pill ${s.state === 'ok' ? 'ok' : 'warn'}`}><i />{s.note}</span>
      </header>
      <div className="sl-chart-n">
        <p><b>{fmtMs(s.now)}</b><span>p50 now</span></p>
        <dl>
          <div><dt>p95</dt><dd>{fmtMs(s.p95)}</dd></div>
          <div><dt>p99</dt><dd>{fmtMs(s.p99)}</dd></div>
          <div><dt>Uptime 24 h</dt><dd>{s.up}</dd></div>
        </dl>
      </div>
      <div className="sl-plot">
        <div className="sl-yax" aria-hidden="true"><span>{fmtMs(s.max)}</span><span>{fmtMs(s.max / 2)}</span><span>0</span></div>
        <div className="sl-area">
          {inc && <div className="sl-band" style={{ left: `${a}%`, width: `${(Number(b) - Number(a)).toFixed(2)}%` }}><span>{inc.label}</span></div>}
          <ScrollDraw className="sl-spark" trigger={{ start: 'top 92%', end: 'top 55%' }} easing="ease-out" once>
            <svg viewBox={`0 0 ${CW} ${CH}`} role="img" aria-label={`${s.name}: median and p99 response time over the last 24 hours`}>
              {inc && (
                <defs>
                  <linearGradient id={`sl-g50-${s.id}`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={CW} y2="0">{stops('#4338ca', '#d97706')}</linearGradient>
                  <linearGradient id={`sl-g99-${s.id}`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={CW} y2="0">{stops('#b4b8f5', '#f5c97a')}</linearGradient>
                </defs>
              )}
              <path className="sl-p99" d={s.d99} style={inc ? { stroke: `url(#sl-g99-${s.id})` } : undefined} />
              <path className="sl-p50" d={s.d50} style={inc ? { stroke: `url(#sl-g50-${s.id})` } : undefined} />
            </svg>
          </ScrollDraw>
        </div>
        <div className="sl-xax" aria-hidden="true">{X_TICKS.map((t) => <span key={t}>{t}</span>)}</div>
      </div>
      <footer className="sl-chart-f">
        <span className="sl-key"><i className="k50" />p50</span>
        <span className="sl-key"><i className="k99" />p99</span>
        <span className="sl-delta">{s.delta}</span>
      </footer>
    </article>
  );
}

function Latency() {
  return (
    <section className="sl-sec sl-lat" id="latency">
      <div className="sl-wrap">
        <div className="sl-sec-h">
          <div>
            <h2>Response times</h2>
            <p>Synthetic checks every 15 seconds from six regions, blended with real traffic. The dark line is the median request; the light one is the slowest 1%.</p>
          </div>
          <div className="sl-seg" aria-hidden="true"><span className="on">24 hours</span><span>7 days</span><span>30 days</span></div>
        </div>
        <div className="sl-charts">
          {SERVICES.map((s) => <Chart key={s.id} s={s} />)}
        </div>
      </div>
    </section>
  );
}

const slug = (s: string) => s.toLowerCase().replace(/\s+/g, '-');

function IncidentCard({ inc }: { inc: Incident }) {
  return (
    <article className={`sl-inc is-${inc.kind}`}>
      <header>
        <h4>{inc.title}</h4>
        <span className={`sl-badge is-${inc.kind}`}>{inc.impact}</span>
      </header>
      <div className="sl-inc-meta">
        <span className="sl-dur">{inc.dur}</span>
        {inc.parts.map((p) => <span key={p} className="sl-chip">{p}</span>)}
        {inc.post && <a className="sl-pm" href="#history">Read the postmortem →</a>}
      </div>
      <ol className="sl-updates">
        {inc.updates.map((u) => (
          <li key={u.s + u.at} className={`u-${slug(u.s)}`}>
            <span className="sl-u-h"><b>{u.s}</b><time>{u.at}</time></span>
            <p>{u.t}</p>
          </li>
        ))}
      </ol>
    </article>
  );
}

function History() {
  return (
    <section className="sl-sec" id="history">
      <div className="sl-wrap sl-hist">
        <aside className="sl-hist-side">
          <h2>Incident history</h2>
          <p>Every incident and maintenance window, with each update as we posted it. Anything rated partial outage or worse gets a public postmortem.</p>
          <div className="sl-seg sl-filter" aria-hidden="true"><span className="on">All</span><span>Incidents</span><span>Maintenance</span></div>
          <p className="sl-mini-h">Upcoming</p>
          <div className="sl-mcard">
            <span className="sl-calday"><b>Nov</b><i>04</i></span>
            <div>
              <b>SEPA payouts processor upgrade</b>
              <span className="sl-mcard-w">Wed · 02:00–03:30 UTC</span>
              <span className="sl-chip">Payouts › SEPA Credit Transfer</span>
              <p>Payouts submitted during the window are queued and sent at 03:30. Nothing fails, and no retries are needed.</p>
              <div className="sl-mcard-a"><a href="#history">{I.cal}Add to calendar</a><a href="#subscribe">{I.bell}Remind me</a></div>
            </div>
          </div>
          <a className="sl-more" href="#history">Full history since 2021 →</a>
        </aside>
        <ol className="sl-days">
          {HISTORY.map((d) => (
            <li key={d.date} className="sl-day">
              <h3>{d.date}</h3>
              {d.items.length === 0
                ? <p className="sl-quiet">No incidents reported.</p>
                : d.items.map((inc) => <IncidentCard key={inc.title} inc={inc} />)}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const J = ({ k, children, last }: { k: string; children: ReactNode; last?: boolean }) => (
  <><span className="jk">&quot;{k}&quot;</span>: {children}{last ? '' : ','}{'\n'}</>
);
const S = ({ v }: { v: string }) => <span className="js">&quot;{v}&quot;</span>;

function Subscribe() {
  const follow: [string, boolean][] = [['Payments API', true], ['Webhooks', true], ['Payouts', true], ['Dashboard', false], ['Hosted checkout', false], ['Card issuing', false]];
  return (
    <section className="sl-sec sl-sub" id="subscribe">
      <div className="sl-wrap sl-sub-grid">
        <div className="sl-card sl-subcard">
          <h2>Get told before your customers notice</h2>
          <p>The first update goes out within 10 minutes of us detecting a problem, and every update after that until it’s resolved.</p>
          <div className="sl-tabs" aria-hidden="true">
            <span className="on">{I.mail}Email</span>
            <span>{I.sms}SMS</span>
            <span>{I.chat}Slack</span>
            <span>{I.hook}Webhook</span>
            <span>{I.rss}RSS</span>
          </div>
          <div className="sl-form" aria-hidden="true">
            <span className="sl-label">Work email</span>
            <span className="sl-input">ops@lumafoods.example<span className="sl-caret" /></span>
            <span className="sl-label">Notify me about</span>
            <ul className="sl-checks">
              {follow.map(([n, on]) => <li key={n} className={on ? 'on' : ''}><i>{on && I.check}</i>{n}</li>)}
            </ul>
            <span className="sl-btn">Subscribe to 3 products</span>
            <small>One click to unsubscribe from any email. We never send marketing.</small>
          </div>
        </div>

        <div className="sl-api">
          <h3>Status API</h3>
          <p>Poll the same data this page is built from — no key needed, 60 requests a minute. Or point an incident webhook at your on-call tool.</p>
          <div className="sl-code">
            <div className="sl-code-bar"><b>GET</b><span>/api/v2/summary.json</span><em>200 · 38 ms</em></div>
            <pre>{'{\n'}
{'  '}<J k="status"><S v="operational" /></J>
{'  '}<J k="updated_at"><S v="2026-11-01T14:32:08Z" /></J>
{'  '}<J k="components">[{'\n'}
{'    '}{'{ '}<span className="jk">&quot;id&quot;</span>: <S v="payments_api" />, <span className="jk">&quot;status&quot;</span>: <S v="operational" />{' },\n'}
{'    '}{'{ '}<span className="jk">&quot;id&quot;</span>: <S v="webhooks" />, <span className="jk">&quot;status&quot;</span>: <S v="operational" />{' },\n'}
{'    '}<span className="jc">{'// …4 more'}</span>{'\n'}
{'  '}]</J>
{'  '}<J k="incidents">[]</J>
{'  '}<J k="maintenance" last>[{'{ '}<span className="jk">&quot;starts&quot;</span>: <S v="2026-11-04T02:00Z" />{' }'}]</J>
{'}'}</pre>
          </div>
          <ul className="sl-feeds">
            <li>{I.rss}<span><b>RSS</b>/history.rss</span></li>
            <li>{I.rss}<span><b>Atom</b>/history.atom</span></li>
            <li>{I.cal}<span><b>iCal</b>/maintenance.ics</span></li>
          </ul>
        </div>
      </div>
    </section>
  );
}

export function StatuslineSite() {
  return (
    <Site
      className="sl"
      brand={<><Mark />Paygrid<span className="sl-brand-tag">Status</span></>}
      links={['Incident history', 'Uptime', 'Status API', 'paygrid.example ↗']}
      cta="Subscribe to updates"
      example="solid"
      apis="useScrollDraw · createScrollDraw"
      footnote="status.paygrid.example · Powered by Statusline"
    >
      <Now />
      <Uptime />
      <Latency />
      <History />
      <Subscribe />
    </Site>
  );
}
