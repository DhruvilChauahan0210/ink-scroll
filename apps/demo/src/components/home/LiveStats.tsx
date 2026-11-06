import { LiveBoard, type Chart, type LiveCell, type Spark } from './LiveBoard';
import { GH_REPO, NPM_PKG, getDays, getHistory, getMonth, getRepo, getWeek, type Day } from '@/lib/live-data';

/**
 * Chapter 09 — the project, counted live: GitHub and npm numbers, refreshed
 * hourly (ISR), and the last 30 days of npm downloads drawn as a line the
 * library inks as you scroll, or every day since the first publish. A server component: the fetches run on the
 * server and the page is regenerated at most once an hour.
 *
 * Each figure is cached on its own (lib/live-data), and a refused refresh
 * keeps the last good one, so the chapter shows when its numbers were fetched
 * (the oldest `Date` header among them) rather than claiming they are current.
 * Set GITHUB_TOKEN to lift GitHub's 60-an-hour anonymous limit, which shared
 * build and function IPs run into.
 */

function relTime(iso: string): string {
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)}d ago`;
  return `${Math.floor(s / (86400 * 30))}mo ago`;
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m`;
  if (n >= 10_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString('en-US');
}

const f = (n: number) => n.toFixed(1);
const day = (iso: string, weekday?: 'short', year?: 'numeric') =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', { weekday, year, month: 'short', day: 'numeric', timeZone: 'UTC' });
const stamp = (ms: number) =>
  `${new Date(ms).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' })} UTC`;

type Box = { W: number; H: number; X0: number; X1: number; Y0: number; Y1: number };
/** Wide plate for tablets and up; a taller one so phones keep readable labels. */
const WIDE: Box = { W: 1000, H: 240, X0: 48, X1: 972, Y0: 36, Y1: 196 };
const NARROW: Box = { W: 400, H: 300, X0: 34, X1: 388, Y0: 30, Y1: 244 };

/** The 30-day line in `box`, as a smooth path plus its labels. */
function spark(days: Day[], box: Box): Spark {
  const { X0, X1, Y0, Y1 } = box;
  const max = Math.max(1, ...days.map((d) => d.downloads));
  const pts = days.map((d, i) => [
    X0 + (i * (X1 - X0)) / (days.length - 1),
    Y1 - (d.downloads / max) * (Y1 - Y0),
  ] as [number, number]);
  // Catmull-Rom → cubic Bézier, control points clamped so the curve never dips under zero.
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, Math.min(Y1, p1[1] + (p2[1] - p0[1]) / 6)];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, Math.min(Y1, p2[1] - (p3[1] - p1[1]) / 6)];
    d += ` C${f(c1[0])} ${f(c1[1])}, ${f(c2[0])} ${f(c2[1])}, ${f(p2[0])} ${f(p2[1])}`;
  }
  const peakIdx = days.reduce((best, x, i) => (x.downloads > days[best].downloads ? i : best), 0);
  return {
    box,
    line: d,
    area: `${d} L${f(X1)} ${Y1} L${f(X0)} ${Y1} Z`,
    peak: { x: pts[peakIdx][0], y: pts[peakIdx][1] },
    last: { x: pts[pts.length - 1][0], y: pts[pts.length - 1][1] },
    pts: pts.map(([x, y]) => [Number(f(x)), Number(f(y))]),
  };
}

/**
 * The plot of `days` (oldest first), in both plates, or null with fewer than
 * two. `dated` puts the year on the first day's label (the all-time plot).
 */
function plot(days: Day[], span: string, dated = false): Chart | null {
  if (days.length < 2) return null;
  const peak = days.reduce((a, x) => (x.downloads > a.downloads ? x : a), days[0]);
  return {
    span,
    wide: spark(days, WIDE),
    narrow: spark(days, NARROW),
    max: Math.max(1, peak.downloads),
    peak: { value: peak.downloads, day: day(peak.day) },
    total: days.reduce((s, x) => s + x.downloads, 0),
    from: day(days[0].day, undefined, dated ? 'numeric' : undefined),
    to: day(days[days.length - 1].day),
    days: days.map((x) => ({ label: day(x.day, 'short'), value: x.downloads })),
  };
}

export async function LiveStats() {
  const [gh, week, month, history, range] = await Promise.all([getRepo(), getWeek(), getMonth(), getHistory(), getDays()]);
  const total = history && { data: history.data.reduce((s, x) => s + x.downloads, 0), at: history.at };

  const g = gh?.data;
  const n = (x: { data: number } | null) => (x ? fmt(x.data) : '—');
  const cells: LiveCell[] = [
    { icon: 'star', value: g ? fmt(g.stars) : '—', label: 'GitHub stars', source: 'github' },
    { icon: 'fork', value: g ? fmt(g.forks) : '—', label: 'Forks', source: 'github' },
    { icon: 'issue', value: g ? fmt(g.issues) : '—', label: 'Open issues', source: 'github' },
    { icon: 'commit', value: g ? relTime(g.pushed) : '—', label: 'Last commit', source: 'github' },
    { icon: 'down', value: n(week), label: 'npm / week', source: 'npm' },
    { icon: 'down', value: n(month), label: 'npm / month', source: 'npm' },
    { icon: 'sum', value: n(total), label: 'npm / all time', source: 'npm' },
  ];

  const fetched = [gh, week, month, history, range].filter((x) => x !== null).map((x) => x.at);
  const checked = fetched.length ? stamp(Math.min(...fetched)) : null;

  const charts = { all: plot(history?.data ?? [], 'all time', true), month: plot(range?.data ?? [], 'last 30 days') };

  return <LiveBoard cells={cells} charts={charts} checked={checked} repo={GH_REPO} pkg={NPM_PKG} />;
}
