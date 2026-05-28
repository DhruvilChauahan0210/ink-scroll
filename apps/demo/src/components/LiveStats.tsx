import { Suspense } from 'react';

const GH_REPO  = 'DhruvilChauahan0210/ink-scroll';
const NPM_PKG  = 'svg-scroll-draw';
const GH_URL   = `https://github.com/${GH_REPO}`;
const NPM_URL  = `https://www.npmjs.com/package/${NPM_PKG}`;

/* ── Data fetchers ───────────────────────────────────────── */
async function fetchGH() {
  try {
    const r = await fetch(`https://api.github.com/repos/${GH_REPO}`, {
      next: { revalidate: 3600 },
      headers: { Accept: 'application/vnd.github.v3+json' },
    });
    return r.ok ? r.json() : null;
  } catch { return null; }
}

async function fetchNpm(period: 'last-week' | 'last-month') {
  try {
    const r = await fetch(
      `https://api.npmjs.org/downloads/point/${period}/${NPM_PKG}`,
      { next: { revalidate: 3600 } }
    );
    return r.ok ? r.json() : null;
  } catch { return null; }
}

function relTime(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60)           return 'just now';
  if (s < 3600)         return `${Math.floor(s / 60)}m ago`;
  if (s < 86400)        return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 30)   return `${Math.floor(s / 86400)}d ago`;
  return `${Math.floor(s / (86400 * 30))}mo ago`;
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
  return `${n}`;
}

/* ── Icons ───────────────────────────────────────────────── */
const StarIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
);
const ForkIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="6" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="12" cy="18" r="2"/>
    <path d="M6 8v2a4 4 0 0 0 4 4h4a4 4 0 0 0 4-4V8"/><line x1="12" y1="14" x2="12" y2="16"/>
  </svg>
);
const IssueIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/>
  </svg>
);
const CommitIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.41"/>
  </svg>
);
const DownloadIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M12 2v13M5 15l7 7 7-7"/><line x1="2" y1="22" x2="22" y2="22"/>
  </svg>
);

/* ── Skeleton ────────────────────────────────────────────── */
function Skeleton() {
  return (
    <div className="border border-pitch-black rounded-2xl overflow-hidden shadow-[4px_4px_0px_#000] bg-light-linen">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={`p-4 sm:p-6 ${i % 2 !== 1 || i < 5 ? 'border-r border-subtle-ash' : ''} ${i < 4 ? 'border-b sm:border-b-0' : ''}`}>
            <div className="w-4 h-4 rounded bg-subtle-ash mb-3 animate-pulse" />
            <div className="w-12 h-8 rounded bg-subtle-ash mb-2 animate-pulse" />
            <div className="w-16 h-3 rounded bg-subtle-ash animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Stat cell ───────────────────────────────────────────── */
function Cell({
  icon, value, label, last = false,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  last?: boolean;
}) {
  return (
    <div className={`p-4 sm:p-6 bg-light-linen flex flex-col gap-1.5 sm:gap-2 group hover:bg-creator-pink/10 transition-colors ${!last ? 'border-r border-subtle-ash' : ''}`}>
      <div className="text-graphite-border group-hover:text-pitch-black transition-colors">
        {icon}
      </div>
      <div className="font-display font-extrabold text-[clamp(18px,3vw,34px)] leading-none tracking-tight text-pitch-black">
        {value}
      </div>
      <div className="text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.15em] sm:tracking-[0.2em] text-graphite-border">
        {label}
      </div>
    </div>
  );
}

/* ── Async data component ────────────────────────────────── */
async function StatsData() {
  const [gh, week, month] = await Promise.all([
    fetchGH(),
    fetchNpm('last-week'),
    fetchNpm('last-month'),
  ]);

  const cells = [
    { icon: <StarIcon />,     value: gh    ? fmt(gh.stargazers_count)    : '—', label: 'GH Stars'    },
    { icon: <ForkIcon />,     value: gh    ? fmt(gh.forks_count)         : '—', label: 'Forks'       },
    { icon: <IssueIcon />,    value: gh    ? fmt(gh.open_issues_count)   : '—', label: 'Open Issues' },
    { icon: <CommitIcon />,   value: gh    ? relTime(gh.pushed_at)       : '—', label: 'Last Commit'  },
    { icon: <DownloadIcon />, value: week  ? fmt(week.downloads  ?? 0)   : '—', label: 'NPM / Week'  },
    { icon: <DownloadIcon />, value: month ? fmt(month.downloads ?? 0)   : '—', label: 'NPM / Month' },
  ];

  return (
    <div className="border border-pitch-black rounded-2xl overflow-hidden shadow-[4px_4px_0px_#000]">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-x divide-subtle-ash">
        {cells.map((c, i) => (
          <Cell key={c.label} {...c} last={i === cells.length - 1} />
        ))}
      </div>
    </div>
  );
}

/* ── Exported section ────────────────────────────────────── */
export function LiveStats() {
  return (
    <section className="border-b border-pitch-black bg-marketplace-gray px-4 sm:px-6 md:px-12 py-12 sm:py-16 md:py-20">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-2 mb-8">
          <span
            className="w-2 h-2 rounded-full bg-lime-glow"
            style={{ boxShadow: '0 0 8px #f1f333' }}
          />
          <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-graphite-border font-medium">
            Live Project Stats
          </p>
        </div>

        {/* Stats grid */}
        <Suspense fallback={<Skeleton />}>
          <StatsData />
        </Suspense>

        {/* CTAs */}
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={GH_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-full border-2 border-pitch-black bg-light-linen shadow-[2px_2px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
          >
            <StarIcon /> Star on GitHub
          </a>
          <a
            href={NPM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors"
          >
            View on npm →
          </a>
        </div>

      </div>
    </section>
  );
}
