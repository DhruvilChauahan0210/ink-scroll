'use client';

import './live.css';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { ScrollDraw } from 'svg-scroll-draw/react';

export type LiveCell = {
  icon: 'star' | 'fork' | 'issue' | 'commit' | 'down' | 'sum';
  value: string;
  label: string;
  source: 'github' | 'npm';
};

export type Spark = {
  box: { W: number; H: number; X0: number; X1: number; Y0: number; Y1: number };
  line: string;
  area: string;
  peak: { x: number; y: number };
  last: { x: number; y: number };
  /** Each day's point on the line, oldest first. */
  pts: [number, number][];
};

export type Chart = {
  wide: Spark;
  narrow: Spark;
  max: number;
  peak: { value: number; day: string };
  total: number;
  from: string;
  to: string;
  /** Each day, oldest first: "Thu, Oct 30" and its downloads. */
  days: { label: string; value: number }[];
};

const f = (n: number) => n.toFixed(1);

/* Line glyphs, 24 × 24, drawn by the library like everything else. */
const ICONS: Record<LiveCell['icon'], string[]> = {
  star: ['M12 2.8 L14.8 8.6 L21.2 9.4 L16.5 13.8 L17.7 20.2 L12 17.1 L6.3 20.2 L7.5 13.8 L2.8 9.4 L9.2 8.6 Z'],
  fork: [
    'M6 3.5 A2.5 2.5 0 1 0 6 8.5 A2.5 2.5 0 1 0 6 3.5 Z',
    'M18 3.5 A2.5 2.5 0 1 0 18 8.5 A2.5 2.5 0 1 0 18 3.5 Z',
    'M12 15.5 A2.5 2.5 0 1 0 12 20.5 A2.5 2.5 0 1 0 12 15.5 Z',
    'M6 8.5 V10 A3 3 0 0 0 9 13 H15 A3 3 0 0 0 18 10 V8.5 M12 13 V15.5',
  ],
  issue: ['M12 2.5 A9.5 9.5 0 1 0 12 21.5 A9.5 9.5 0 1 0 12 2.5 Z', 'M12 9.5 A2.5 2.5 0 1 0 12 14.5 A2.5 2.5 0 1 0 12 9.5 Z'],
  commit: ['M2.5 12 H8.5', 'M15.5 12 H21.5', 'M12 8.5 A3.5 3.5 0 1 0 12 15.5 A3.5 3.5 0 1 0 12 8.5 Z'],
  down: ['M12 3 V15.5', 'M6.5 10.5 L12 16 L17.5 10.5', 'M4 20.5 H20'],
  sum: ['M17.5 4.5 H6.5 L12.5 12 L6.5 19.5 H17.5'],
};

/* Phones get the taller plate. The server renders the wide one; a phone swaps
   after hydration, far below the fold, and the draw is keyed to remount. */
const NARROW_Q = '(max-width: 719px)';
const subscribeNarrow = (cb: () => void) => {
  const m = window.matchMedia(NARROW_Q);
  m.addEventListener('change', cb);
  return () => m.removeEventListener('change', cb);
};
const isNarrow = () => window.matchMedia(NARROW_Q).matches;

/** Arrow keys step a day, Page keys a week (a slider's keys). */
const STEP: Record<string, number> = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1, PageDown: -7, PageUp: 7 };

function Plot({ s, chart, pkg }: { s: Spark; chart: Chart; pkg: string }) {
  const { W, H, X0, X1, Y0, Y1 } = s.box;
  const right = s.peak.x > W * 0.78;
  const n = s.pts.length;

  /* The day being read: hover, a tap, or the keys on the focused plot. */
  const [at, setAt] = useState<number | null>(null);
  const pad = useRef<HTMLDivElement>(null);
  const touch = useRef(false);
  const dayAt = (clientX: number) => {
    const r = pad.current!.getBoundingClientRect();
    const x = ((clientX - r.left) / r.width) * W;
    return Math.min(n - 1, Math.max(0, Math.round(((x - X0) / (X1 - X0)) * (n - 1))));
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setAt(null);
      return;
    }
    const step = Object.hasOwn(STEP, e.key) ? STEP[e.key] : null;
    const next = e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : step === null ? null : (at ?? n - 1) + step;
    if (next === null) return;
    e.preventDefault();
    touch.current = false;
    setAt(Math.min(n - 1, Math.max(0, next)));
  };
  // A tap keeps its day after the finger lifts; a tap anywhere else puts it away.
  const shown = at !== null;
  useEffect(() => {
    if (!shown) return;
    const away = (e: PointerEvent) => {
      if (touch.current && !pad.current?.contains(e.target as Node)) setAt(null);
    };
    document.addEventListener('pointerdown', away);
    return () => document.removeEventListener('pointerdown', away);
  }, [shown]);

  const cur = at ?? n - 1;
  const read = `${chart.days[cur].label}: ${chart.days[cur].value.toLocaleString('en-US')} downloads`;
  const [mx, my] = s.pts[cur];

  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" data-reading={shown || undefined}
        aria-label={`Daily npm downloads of ${pkg} from ${chart.from} to ${chart.to}: ${chart.total} in total, peaking at ${chart.peak.value} on ${chart.peak.day}`}>
        {[0.25, 0.5, 0.75].map((t) => (
          <path key={t} d={`M${X0} ${f(Y1 - t * (Y1 - Y0))} H${X1}`} className="lv-grid-line" />
        ))}
        <path d={`M${X0} ${Y1} H${X1}`} className="lv-base" />
        <text x={X0 - 10} y={Y0 + 4} textAnchor="end" className="lv-axis">{chart.max}</text>
        <text x={X0 - 10} y={Y1 + 4} textAnchor="end" className="lv-axis">0</text>
        <text x={X0} y={Y1 + 30} className="lv-axis">{chart.from}</text>
        <text x={X1} y={Y1 + 30} textAnchor="end" className="lv-axis">{chart.to}</text>

        <path d={s.area} className="lv-area" />
        <path d={s.line} className="lv-line" stroke="currentColor" />

        <g className="lv-note">
          <circle cx={f(s.peak.x)} cy={f(s.peak.y)} r="4.5" className="lv-dot" />
          <text x={f(s.peak.x + (right ? -12 : 12))} y={f(s.peak.y + 5)} textAnchor={right ? 'end' : 'start'} className="lv-peak">
            peak · {chart.peak.value} on {chart.peak.day}
          </text>
          <circle cx={f(s.last.x)} cy={f(s.last.y)} r="3.5" className="lv-dot lv-dot-last" />
        </g>

        {shown && (
          <g className="lv-mark">
            {/* Keyed by day, so each new day's rule is inked up from the base again. */}
            <path key={cur} d={`M${mx} ${Y1} V${my}`} pathLength={1} className="lv-rule" />
            <circle cx={mx} cy={my} r="5.5" className="lv-mark-dot" />
          </g>
        )}
      </svg>

      <div ref={pad} className="lv-pad" role="slider" tabIndex={0}
        aria-label="Downloads by day" aria-valuemin={0} aria-valuemax={n - 1} aria-valuenow={cur} aria-valuetext={read}
        onPointerDown={(e) => { touch.current = e.pointerType === 'touch'; setAt(dayAt(e.clientX)); }}
        onPointerMove={(e) => setAt(dayAt(e.clientX))}
        onPointerLeave={(e) => { if (e.pointerType !== 'touch') setAt(null); }}
        onFocus={() => setAt((a) => a ?? n - 1)}
        onBlur={() => setAt(null)}
        onKeyDown={onKey} />

      {/* The slider already says it (aria-valuetext); this is the same words, seen. */}
      {shown && (
        <div className="lv-tip" aria-hidden="true" data-left={mx > W / 2 || undefined} data-below={my < Y0 + (Y1 - Y0) * 0.45 || undefined}
          style={{ left: `${f((mx / W) * 100)}%`, top: `${f((my / H) * 100)}%` }}>
          <span>{chart.days[cur].label}</span>
          <span><b>{chart.days[cur].value.toLocaleString('en-US')}</b> downloads</span>
        </div>
      )}
    </>
  );
}

export function LiveBoard({ cells, chart, checked, repo, pkg }: {
  cells: LiveCell[];
  chart: Chart | null;
  checked: string | null;
  repo: string;
  pkg: string;
}) {
  const narrow = useSyncExternalStore(subscribeNarrow, isNarrow, () => false);
  const fig = useRef<HTMLElement>(null);
  // The fill and the labels wait for the line: they key off its progress.
  const onProgress = useCallback((p: number) => {
    fig.current?.style.setProperty('--lv-p', p.toFixed(3));
  }, []);

  return (
    <div className="lv-stage">
      <header className="lv-head">
        <div>
          <p className="lv-kicker"><span>09 / in the open</span></p>
          <h2 id="lv-title" className="lv-title">Built in the open. Counted live.</h2>
        </div>
        <p className="lv-live">
          <i aria-hidden="true" /> live · refreshed hourly{checked && <> · checked {checked}</>}
        </p>
      </header>

      <ScrollDraw className="lv-grid" selector=".lv-ink" trigger={{ start: 'top 88%', end: 'top 50%' }} stagger={0.03} easing="ease-out" once>
        {cells.map((c) => (
          <div className="lv-cell" key={c.label}>
            <svg className="lv-icon" viewBox="0 0 24 24" aria-hidden="true">
              {ICONS[c.icon].map((d, k) => <path key={k} d={d} className="lv-ink" stroke="currentColor" />)}
            </svg>
            <span className="lv-value">{c.value}</span>
            <span className="lv-label">{c.label}</span>
            <span className="lv-src">{c.source === 'github' ? 'api.github.com' : 'api.npmjs.org'}</span>
          </div>
        ))}
      </ScrollDraw>

      {chart && (
        <figure className="lv-chart" ref={fig}>
          <figcaption className="lv-chart-head">
            <span>npm downloads · last 30 days</span>
            <span><b>{chart.total.toLocaleString('en-US')}</b> total · peak <b>{chart.peak.value}</b> on {chart.peak.day}</span>
          </figcaption>
          <ScrollDraw key={narrow ? 'n' : 'w'} className="lv-plot" selector=".lv-line"
            trigger={{ start: 'top 85%', end: 'top 35%' }} easing="ease-in-out" onProgress={onProgress}>
            <Plot s={narrow ? chart.narrow : chart.wide} chart={chart} pkg={pkg} />
          </ScrollDraw>
        </figure>
      )}

      <div className="lv-cta">
        <a href={`https://github.com/${repo}`} target="_blank" rel="noopener noreferrer" className="btn btn-solid" data-magnetic>
          <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true" fill="currentColor"><path d={ICONS.star[0]} /></svg>
          Star on GitHub
        </a>
        <a href={`https://www.npmjs.com/package/${pkg}`} target="_blank" rel="noopener noreferrer" className="btn" data-magnetic>View on npm ↗</a>
      </div>
    </div>
  );
}
