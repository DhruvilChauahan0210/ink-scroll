import { smooth, type P } from '@/components/examples/ink/geo';

/* Everything on the Paygrid status page is computed here from fixed seeds,
   so the server and the browser render the same markup. "Now" is
   Sun 1 Nov 2026, 14:32 UTC. */

// ── Uptime: 90 days per component group ─────────────────────────────────
// Day 0 is Tue 4 Aug 2026, day 89 is today.
export type Day = 'ok' | 'minor' | 'partial' | 'major' | 'maint' | 'none';

const days = (events: Record<number, Day>, noDataBefore = 0): Day[] =>
  Array.from({ length: 90 }, (_, i) => (i < noDataBefore ? 'none' : events[i] ?? 'ok'));

export type Group = {
  name: string;
  uptime: string;
  days: Day[];
  open?: boolean;
  count: number;
  parts: { n: string; up: string }[];
};

export const GROUPS: Group[] = [
  {
    name: 'Payments API',
    uptime: '99.987%',
    days: days({ 69: 'partial', 52: 'minor' }),
    open: true,
    count: 6,
    parts: [
      { n: 'Charges', up: '99.982%' },
      { n: 'Payment intents', up: '99.986%' },
      { n: 'Refunds', up: '99.998%' },
      { n: 'Customers', up: '100%' },
      { n: 'Tokens & vault', up: '100%' },
      { n: 'Idempotency keys', up: '100%' },
    ],
  },
  { name: 'Dashboard', uptime: '99.971%', days: days({ 80: 'minor', 33: 'minor' }), count: 5, parts: [] },
  { name: 'Hosted checkout', uptime: '100%', days: days({}), count: 3, parts: [] },
  { name: 'Payouts', uptime: '99.962%', days: days({ 29: 'maint', 46: 'minor' }), count: 4, parts: [] },
  { name: 'Card issuing', uptime: '99.995%', days: days({ 85: 'maint' }, 26), count: 4, parts: [] },
  {
    name: 'Webhooks',
    uptime: '99.940%',
    days: days({ 89: 'minor', 61: 'minor' }),
    open: true,
    count: 4,
    parts: [
      { n: 'Event delivery', up: '99.931%' },
      { n: 'Automatic retries', up: '99.990%' },
      { n: 'Signing secrets', up: '100%' },
      { n: 'Event log', up: '100%' },
    ],
  },
];

export const DAY_LABEL: Record<Day, string> = {
  ok: 'Operational', minor: 'Degraded performance', partial: 'Partial outage',
  major: 'Major outage', maint: 'Maintenance', none: 'No data',
};

export const REGIONS = [
  { code: 'us-east-1', city: 'N. Virginia', ms: 82 },
  { code: 'us-west-2', city: 'Oregon', ms: 91 },
  { code: 'eu-west-1', city: 'Dublin', ms: 78 },
  { code: 'eu-central-1', city: 'Frankfurt', ms: 74 },
  { code: 'ap-southeast-1', city: 'Singapore', ms: 96 },
  { code: 'sa-east-1', city: 'São Paulo', ms: 118 },
];

// ── Response time: 97 points, one every 15 minutes, 14:30 yesterday → now ─
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const N = 97;
/** p50 then p99, in ms. Diurnal swell (busiest 14:00–19:00 UTC), smoothed noise, optional spikes. */
function series(seed: number, base: number, tail: number, spikes: Record<number, number> = {}) {
  const r = rng(seed);
  let a = 0, b = 0;
  const p50: number[] = [], p99: number[] = [];
  for (let i = 0; i < N; i++) {
    const hour = (14.5 + i / 4) % 24;
    const swell = 0.17 * Math.cos(((hour - 16.5) / 24) * Math.PI * 2);
    a = a * 0.72 + (r() - 0.5) * 0.11;
    b = b * 0.8 + (r() - 0.5) * 0.16;
    const k = spikes[i] ?? 1;
    p50.push(base * (1 + swell + a) * k);
    p99.push(base * tail * (1 + swell * 1.5 + b) * Math.max(1, k * 0.82));
  }
  return { p50, p99 };
}

export const CW = 480, CH = 132;

const nice = (v: number) => {
  const steps = [40, 60, 80, 100, 150, 200, 250, 300, 400, 500, 600, 800, 1000, 1200, 1500, 2000, 2500, 3000];
  return steps.find((s) => s >= v) ?? Math.ceil(v / 1000) * 1000;
};
export const fmtMs = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(v % 1000 ? 1 : 0)} s` : `${Math.round(v)} ms`);

function chart(p50: number[], p99: number[], spikes: Record<number, number>) {
  // A spike may run off the top of the chart, as it would on a real one.
  const max = nice(Math.max(...p99.filter((_, i) => !(i in spikes))) * 1.08);
  const y = (v: number) => Math.max(3, CH - 4 - (Math.min(v, max * 0.985) / max) * (CH - 8));
  const x = (i: number) => (i * CW) / (N - 1);
  return {
    max,
    p50: smooth(p50.map((v, i) => [x(i), y(v)] as P)),
    p99: smooth(p99.map((v, i) => [x(i), y(v)] as P)),
  };
}

export type Service = {
  id: string;
  name: string;
  host: string;
  state: 'ok' | 'recovered';
  note: string;
  now: number;
  p95: number;
  p99: number;
  up: string;
  delta: string;
  max: number;
  d50: string;
  d99: string;
  incident?: { from: number; to: number; label: string };
};

function svc(id: string, name: string, host: string, seed: number, base: number, tail: number, extra: Partial<Service> & { spikes?: Record<number, number> } = {}): Service {
  const { spikes = {}, ...rest } = extra;
  const { p50, p99 } = series(seed, base, tail, spikes);
  const c = chart(p50, p99, spikes);
  return {
    id, name, host, state: 'ok', note: 'Operational', up: '100%', delta: '',
    now: p50[N - 1], p95: p99[N - 1] * 0.62, p99: p99[N - 1],
    max: c.max, d50: c.p50, d99: c.p99,
    ...rest,
  };
}

// The webhook incident: 09:12–09:41 UTC is points 75–77 (09:15, 09:30, 09:45).
export const SERVICES: Service[] = [
  svc('api', 'Payments API', 'api.paygrid.example', 11, 84, 3.4, { up: '100%', delta: '−4% vs last week' }),
  svc('dash', 'Dashboard', 'dashboard.paygrid.example', 23, 212, 2.6, { up: '100%', delta: '+2% vs last week' }),
  svc('hooks', 'Webhooks', 'Event dispatch, eu-west-1', 7, 61, 3.1, {
    state: 'recovered', note: 'Recovered 09:58', up: '99.80%', delta: '29 min degraded',
    spikes: { 74: 1.4, 75: 3.6, 76: 4.6, 77: 2.4, 78: 1.25 },
    incident: { from: 74.6, to: 78, label: 'Incident · 09:12–09:41' },
  }),
  svc('checkout', 'Hosted checkout', 'pay.paygrid.example', 41, 138, 2.2, { up: '100%', delta: '−1% vs last week' }),
  svc('payouts', 'Payouts', 'POST /v2/payouts', 5, 412, 2.4, { up: '100%', delta: 'No change' }),
  svc('issuing', 'Card issuing', 'Authorization decisions', 19, 42, 2.9, { up: '100%', delta: '−7% vs last week' }),
];
export const X_TICKS = ['14:30', '20:30', '02:30', '08:30', 'Now'];

// ── Incident history ────────────────────────────────────────────────────
export type Update = { s: 'Resolved' | 'Monitoring' | 'Identified' | 'Investigating' | 'Completed' | 'In progress' | 'Scheduled'; at: string; t: string };
export type Incident = {
  title: string;
  kind: 'minor' | 'partial' | 'maint';
  impact: string;
  dur: string;
  parts: string[];
  updates: Update[];
  post?: boolean;
};
export const HISTORY: { date: string; items: Incident[] }[] = [
  {
    date: 'Sun 1 Nov 2026',
    items: [{
      title: 'Webhook deliveries delayed in eu-west',
      kind: 'minor', impact: 'Degraded performance', dur: '29 min',
      parts: ['Webhooks › Event delivery', 'Webhooks › Automatic retries'],
      updates: [
        { s: 'Resolved', at: '09:58 UTC', t: 'Every delayed event has been delivered and delivery times are back to normal (p95 1.2 s). No events were lost or sent twice. We’ll publish a postmortem within five working days.' },
        { s: 'Monitoring', at: '09:41 UTC', t: 'The fix is out. The backlog is draining at about 18,000 events a minute and new events are delivered on time.' },
        { s: 'Identified', at: '09:26 UTC', t: 'A queue consumer in eu-west-1 stopped acknowledging messages after this morning’s deploy. We’re rolling the deploy back.' },
        { s: 'Investigating', at: '09:14 UTC', t: 'Some webhook deliveries to accounts in the EU are delayed by up to 4 minutes. API requests and payments are not affected.' },
      ],
    }],
  },
  { date: 'Sat 31 Oct 2026', items: [] },
  { date: 'Fri 30 Oct 2026', items: [] },
  {
    date: 'Wed 28 Oct 2026',
    items: [{
      title: 'Card issuing — HSM firmware upgrade',
      kind: 'maint', impact: 'Scheduled maintenance', dur: '1 h 12 min',
      parts: ['Card issuing › Card creation'],
      updates: [
        { s: 'Completed', at: '03:12 UTC', t: 'Maintenance is complete. Card creation is back on the upgraded hardware security modules.' },
        { s: 'In progress', at: '02:00 UTC', t: 'Card creation is paused; authorizations on existing cards are not affected.' },
      ],
    }],
  },
  {
    date: 'Fri 23 Oct 2026',
    items: [{
      title: 'CSV exports slow to generate in the Dashboard',
      kind: 'minor', impact: 'Degraded performance', dur: '47 min',
      parts: ['Dashboard › Exports'],
      updates: [
        { s: 'Resolved', at: '16:40 UTC', t: 'Exports are generating in under 30 seconds again. Queued exports were emailed as soon as they finished.' },
        { s: 'Identified', at: '16:05 UTC', t: 'A reporting replica fell behind after a long-running query. We’ve moved exports to a fresh replica.' },
      ],
    }],
  },
  {
    date: 'Mon 12 Oct 2026',
    items: [{
      title: 'Elevated 5xx errors on the Charges API in us-east-1',
      kind: 'partial', impact: 'Partial outage', dur: '11 min', post: true,
      parts: ['Payments API › Charges', 'Payments API › Payment intents'],
      updates: [
        { s: 'Resolved', at: '18:22 UTC', t: 'Error rates are back to baseline. About 0.8% of charge requests in us-east-1 failed with a 503 and were safe to retry with the same idempotency key.' },
        { s: 'Investigating', at: '18:13 UTC', t: 'We’re seeing elevated error rates on charge creation in us-east-1.' },
      ],
    }],
  },
];
