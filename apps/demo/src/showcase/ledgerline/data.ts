/*
 * Every number on the Ledgerline page comes from here, and most of them are
 * derived rather than typed: the workspace in the dashboard (Lumenstack, a
 * fictional docs platform) has twelve months of MRR movements, and the MRR
 * line, the KPI cards, the waterfall, ARPA, LTV, the quick ratio, the
 * forecast and the pricing readout are all computed from them. Fixed inputs
 * only, so the server and the client render the same markup.
 */

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** MRR on 31 Dec 2025, the start of the year the dashboard shows. */
export const START_MRR = 113_400;
export const START_CUSTOMERS = 535;

/** 2026, month by month: MRR from new customers, expansion, contraction and churn. */
export const MOVES = [
  { n: 4420, e: 2350, c: 610, x: 1520 },
  { n: 4980, e: 2540, c: 480, x: 1470 },
  { n: 4760, e: 2690, c: 560, x: 1650 },
  { n: 4390, e: 2610, c: 720, x: 2010 },
  { n: 6240, e: 3180, c: 530, x: 1530 },
  { n: 5310, e: 2880, c: 690, x: 2020 },
  { n: 5420, e: 3060, c: 740, x: 1970 },
  { n: 5690, e: 3240, c: 820, x: 2000 },
  { n: 5180, e: 3120, c: 880, x: 2110 },
  { n: 6050, e: 3560, c: 690, x: 2050 },
  { n: 6700, e: 3680, c: 510, x: 2890 },
  { n: 6560, e: 3810, c: 950, x: 2100 },
];
/** Customers won and lost each month. */
export const LOGOS_IN = [28, 30, 31, 27, 36, 31, 32, 33, 30, 35, 37, 50];
export const LOGOS_OUT = [11, 12, 13, 16, 12, 14, 13, 14, 14, 13, 17, 12];

export const NET = MOVES.map((m) => m.n + m.e - m.c - m.x);
const running = (start: number, deltas: number[]) => deltas.reduce<number[]>((a, d) => [...a, (a.at(-1) ?? start) + d], []);
/** MRR at the end of each month of 2026 — ends at $184,320. */
export const MRR = running(START_MRR, NET);
export const OPEN_MRR = [START_MRR, ...MRR.slice(0, 11)];
export const CUSTOMERS = running(START_CUSTOMERS, LOGOS_IN.map((v, i) => v - LOGOS_OUT[i]));
export const OPEN_CUSTOMERS = [START_CUSTOMERS, ...CUSTOMERS.slice(0, 11)];
/** The same months a year earlier, for the comparison line. */
export const MRR_2025 = [84_200, 86_100, 88_900, 90_400, 93_100, 95_800, 98_200, 100_900, 103_600, 106_800, 109_900, START_MRR];

export const ARPA = MRR.map((v, i) => v / CUSTOMERS[i]);
export const QUICK = MOVES.map((m) => (m.n + m.e) / (m.c + m.x));
export const GROSS_CHURN = MOVES.map((m, i) => (m.c + m.x) / OPEN_MRR[i]);
export const GROSS_MARGIN = 0.78;
/** Logo churn over the trailing three months (shorter at the start of the year). */
export const LOGO_CHURN_3M = LOGOS_OUT.map((_, i) => {
  const from = Math.max(0, i - 2);
  const lost = LOGOS_OUT.slice(from, i + 1).reduce((a, b) => a + b, 0);
  const base = OPEN_CUSTOMERS.slice(from, i + 1).reduce((a, b) => a + b, 0);
  return lost / base;
});
export const LTV = ARPA.map((a, i) => (a * GROSS_MARGIN) / LOGO_CHURN_3M[i]);

const sum = (k: 'n' | 'e' | 'c' | 'x') => MOVES.reduce((a, m) => a + m[k], 0);
export const YEAR = { n: sum('n'), e: sum('e'), c: sum('c'), x: sum('x') };
export const NRR = (START_MRR + YEAR.e - YEAR.c - YEAR.x) / START_MRR;

const L = 11;
export const NOW = {
  mrr: MRR[L],
  prevMrr: MRR[L - 1],
  yoy: MRR[L] / START_MRR - 1,
  net: NET[L],
  netMoM: NET[L] / NET[L - 1] - 1,
  customers: CUSTOMERS[L],
  netLogos: LOGOS_IN[L] - LOGOS_OUT[L],
  arpa: ARPA[L],
  arpaYoY: ARPA[L] / (START_MRR / START_CUSTOMERS) - 1,
  gross: GROSS_CHURN[L],
  grossPrev: GROSS_CHURN[L - 1],
  quick: QUICK[L],
  ltv: LTV[L],
  logoChurn: LOGOS_OUT[L] / OPEN_CUSTOMERS[L],
  move: MOVES[L],
};

/* ── Plans: customers and MRR add up to the totals above ──────────────── */
export const PLANS = [
  { k: 'Starter', c: 352, m: 17_248, tone: 'p0' },
  { k: 'Team', c: 268, m: 48_240, tone: 'p1' },
  { k: 'Business', c: 132, m: 71_280, tone: 'p2' },
  { k: 'Enterprise', c: 22, m: 47_552, tone: 'p3' },
];

/* ── December's movements, as the activity feed and the trace show them ─ */
export type Move = { who: string; i: string; a: string; b: string; kind: 'new' | 'exp' | 'con' | 'churn'; what: string; amt: number; when: string };
export const ACTIVITY: Move[] = [
  { who: 'Quarryline', i: 'Q', a: '#f59e0b', b: '#b45309', kind: 'exp', what: 'Team → Business, annual', amt: 470, when: '14 Dec' },
  { who: 'Halden & Co', i: 'H', a: '#7c8cff', b: '#4338ca', kind: 'exp', what: 'Added 18 seats on Enterprise', amt: 1150, when: '12 Dec' },
  { who: 'Fernway', i: 'F', a: '#34d399', b: '#0e7490', kind: 'new', what: 'Started on Team, monthly', amt: 180, when: '11 Dec' },
  { who: 'Brightwell', i: 'B', a: '#fb7185', b: '#be123c', kind: 'churn', what: 'Cancelled Team · “moved to an in-house wiki”', amt: -240, when: '10 Dec' },
  { who: 'Oxbow Health', i: 'O', a: '#60a5fa', b: '#1d4ed8', kind: 'con', what: 'Removed 9 seats on Enterprise', amt: -360, when: '9 Dec' },
];

export const ACCOUNTS = [
  { who: 'Halden & Co', i: 'H', a: '#7c8cff', b: '#4338ca', plan: 'Enterprise', mrr: 5200, chg: 1150, seats: 140, since: 'Mar 2024', bill: 'Annual' },
  { who: 'Northbeam', i: 'N', a: '#a78bfa', b: '#6d28d9', plan: 'Enterprise', mrr: 4600, chg: 0, seats: 122, since: 'Aug 2023', bill: 'Annual' },
  { who: 'Paygrid', i: 'P', a: '#818cf8', b: '#3730a3', plan: 'Enterprise', mrr: 3850, chg: 0, seats: 96, since: 'Jan 2025', bill: 'Annual' },
  { who: 'Mint & Co', i: 'M', a: '#34d399', b: '#047857', plan: 'Enterprise', mrr: 3400, chg: 0, seats: 88, since: 'Jun 2024', bill: 'Monthly' },
  { who: 'Oxbow Health', i: 'O', a: '#60a5fa', b: '#1d4ed8', plan: 'Enterprise', mrr: 2480, chg: -360, seats: 61, since: 'Nov 2024', bill: 'Annual' },
  { who: 'Kestrel Labs', i: 'K', a: '#f472b6', b: '#be185d', plan: 'Business', mrr: 1240, chg: 0, seats: 31, since: 'Feb 2026', bill: 'Monthly' },
];

/* ── Cohorts: net revenue retention by signup month ───────────────────── */
// Early churn pulls each cohort under 100% in the first months; expansion
// lifts it back. April's cohort onboarded badly and never quite recovers.
const COHORT_SHAPE = [
  { a: 0.1, g: 0.0125 }, { a: 0.09, g: 0.012 }, { a: 0.11, g: 0.0128 }, { a: 0.17, g: 0.009 },
  { a: 0.085, g: 0.013 }, { a: 0.08, g: 0.0135 }, { a: 0.075, g: 0.014 }, { a: 0.07, g: 0.0138 },
  { a: 0.072, g: 0.0142 }, { a: 0.066, g: 0.0145 }, { a: 0.064, g: 0.015 }, { a: 0.06, g: 0.015 },
];
const wobble = (r: number, k: number) => (k === 0 ? 0 : Math.sin(r * 12.9898 + k * 78.233) * 0.55);
export const COHORTS = MONTHS.map((name, r) => {
  const { a, g } = COHORT_SHAPE[r];
  const vals = Array.from({ length: 12 - r }, (_, k) => 100 * (1 - a * (1 - Math.exp(-k / 1.25)) + g * k) + wobble(r, k));
  return { name, size: LOGOS_IN[r], mrr: MOVES[r].n, vals };
});

/* ── Forecast: the next six months from the trailing quarter ──────────── */
const q = [9, 10, 11];
const base = q.reduce((a, i) => a + OPEN_MRR[i], 0);
// Rates rounded to the two decimals the inputs show, so the forecast is
// computed from exactly what the reader sees.
const rate = (k: 'e' | 'c' | 'x') => Math.round((q.reduce((a, i) => a + MOVES[i][k], 0) / base) * 1e4) / 1e4;
export const ASSUME = {
  newMrr: Math.round(q.reduce((a, i) => a + MOVES[i].n, 0) / 3),
  newGrowth: 0.02,
  exp: rate('e'),
  con: rate('c'),
  churn: rate('x'),
  interval: 0.8,
};
export const FC_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
export const FORECAST = (() => {
  const keep = 1 + ASSUME.exp - ASSUME.con - ASSUME.churn;
  const out = [MRR[L]];
  for (let t = 1; t <= 6; t++) out.push(out[t - 1] * keep + ASSUME.newMrr * (1 + ASSUME.newGrowth) ** t);
  return out;
})();
/** Half-width of the 80% interval, t months out. */
export const SPREAD = (t: number) => (t === 0 ? 0 : 0.012 + 0.013 * t);
export const FC_END = FORECAST[6];
export const FC_CROSS = FORECAST.findIndex((v) => v >= 200_000); // months after Dec

/* ── Pricing: by the MRR you track ────────────────────────────────────── */
export const BANDS = [
  { lo: 0, hi: 10_000, plan: 'Starter', price: 0, refresh: 'Daily', seats: '3 seats' },
  { lo: 10_000, hi: 50_000, plan: 'Growth', price: 99, refresh: 'Hourly', seats: 'Unlimited' },
  { lo: 50_000, hi: 250_000, plan: 'Growth', price: 249, refresh: 'Hourly', seats: 'Unlimited' },
  { lo: 250_000, hi: 1_000_000, plan: 'Scale', price: 599, refresh: 'Every 15 min', seats: 'Unlimited' },
  { lo: 1_000_000, hi: Infinity, plan: 'Scale', price: -1, refresh: 'Every 15 min', seats: 'Unlimited' },
];

/* ── Formatting ───────────────────────────────────────────────────────── */
export const usd = (v: number) => `$${Math.round(v).toLocaleString('en-US')}`;
export const usdSigned = (v: number) => `${v < 0 ? '−' : '+'}$${Math.abs(Math.round(v)).toLocaleString('en-US')}`;
export const k1 = (v: number) => `$${(v / 1000).toFixed(1)}k`;
export const pct = (v: number, d = 1) => `${v < 0 ? '−' : ''}${Math.abs(v * 100).toFixed(d)}%`;
