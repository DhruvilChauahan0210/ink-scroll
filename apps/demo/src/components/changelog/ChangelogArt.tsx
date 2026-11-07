'use client';

import { ScrollDraw } from 'svg-scroll-draw/react';

/** One release in fig. 1: its anchor, its version and how many entries it logged. */
export type ChartBar = { id: string; v: string; fix: number; rest: number };

// The plot box, in viewBox units.
const W = 560;
const H = 300;
const L = 34;
const R = 10;
const T = 40;
const B = 250;
const f = (n: number) => n.toFixed(1);
const major = (v: string) => v.split('.')[0];

/**
 * The changelog's opening drawing: every release on this page as a column,
 * oldest to newest, as tall as the entries it logged, with the fixes inked in
 * red on top. Measured from the release data the page renders, so it moves
 * when a release is added. The columns are inked by the library on load and
 * each one links to its release.
 */
export function ReleaseChart({ bars }: { bars: ChartBar[] }) {
  const max = Math.max(...bars.map((b) => b.fix + b.rest));
  const top = Math.max(5, Math.ceil(max / 5) * 5);
  const y = (n: number) => B - (n / top) * (B - T);
  const step = (W - L - R) / bars.length;
  const bw = Math.min(9, step * 0.58);
  const x = (i: number) => L + step * (i + 0.5);
  const ticks = Array.from({ length: top / 5 + 1 }, (_, i) => i * 5);
  const breaks = bars.flatMap((b, i) => (i > 0 && major(b.v) !== major(bars[i - 1].v) ? [i] : []));
  const peak = bars.reduce((p, b, i) => (b.fix + b.rest > bars[p].fix + bars[p].rest ? i : p), 0);
  const pk = bars[peak];
  const last = bars.length - 1;
  const peakY = y(pk.fix + pk.rest);
  const fixTotal = bars.reduce((n, b) => n + b.fix, 0);

  return (
    <figure className="rc" aria-label={`Entries per release across ${bars.length} releases, oldest to newest; each column links to its release`}>
      <div className="rc-plate">
        <ScrollDraw className="rc-draw" selector=".rc-ink" autoplay duration={520} delay={300} stagger={0.045} easing="ease-out" once>
          <svg viewBox={`0 0 ${W} ${H}`} className="rc-svg">
            {/* Pencil: the grid, the axis, the major-version boundaries. */}
            <g className="rc-pencil" aria-hidden="true">
              {ticks.map((t) => (
                <g key={t}>
                  <path d={`M${L} ${f(y(t))} H${W - R}`} className={t === 0 ? 'rc-base' : 'rc-grid'} />
                  <text x={L - 8} y={f(y(t) + 3.5)} className={`rc-t rc-tick${t === 0 || t === top ? ' is-key' : ''}`} textAnchor="end">{t}</text>
                </g>
              ))}
              {breaks.map((i) => (
                <g key={i}>
                  <path d={`M${f(L + step * i)} ${T - 22} V${B + 6}`} className="rc-break" />
                  <text x={f(L + step * i + 5)} y={T - 14} className="rc-t rc-era">v{major(bars[i].v)}</text>
                </g>
              ))}
              <text x={f(L + 4)} y={T - 14} className="rc-t rc-era">v{major(bars[0].v)}</text>
              <text x={f(x(0) - bw / 2)} y={B + 22} className="rc-t rc-x">{bars[0].v}</text>
              <text x={f(x(last) + bw / 2)} y={B + 22} className="rc-t rc-x" textAnchor="end">{bars[last].v}</text>
              <text x={f(x(peak) + bw / 2 + 16)} y={f(peakY + 4)} className="rc-t rc-note">
                <tspan>v{pk.v}</tspan>
                <tspan x={f(x(peak) + bw / 2 + 16)} dy="1.4em" className="rc-note-sub">{pk.fix + pk.rest} entries</tspan>
                {pk.fix > 0 && <tspan x={f(x(peak) + bw / 2 + 16)} dy="1.4em" className="rc-note-fix">{pk.fix} fixed</tspan>}
              </text>
            </g>

            {/* Ink: one column per release, fixes on top in red. */}
            {bars.map((b, i) => (
              <a key={b.id} href={`#${b.id}`} className="rc-col">
                <title>{`v${b.v} — ${b.fix + b.rest} entries, ${b.fix} fixed`}</title>
                <rect x={f(L + step * i)} y={T - 4} width={f(step)} height={B - T + 4} className="rc-hit" />
                {b.rest > 0 && <path d={`M${f(x(i))} ${B} V${f(y(b.rest))}`} className="rc-ink rc-rest" stroke="currentColor" strokeWidth={f(bw)} />}
                {b.fix > 0 && <path d={`M${f(x(i))} ${f(y(b.rest))} V${f(y(b.rest + b.fix))}`} className="rc-ink rc-fix" stroke="currentColor" strokeWidth={f(bw)} />}
              </a>
            ))}
            <path d={`M${f(x(peak) + bw / 2 + 3)} ${f(peakY)} H${f(x(peak) + bw / 2 + 11)}`} className="rc-ink rc-lead" stroke="currentColor" />
          </svg>
        </ScrollDraw>
      </div>
      <figcaption className="rc-cap">
        <span>Fig. 1 — entries per release, oldest → newest</span>
        <span className="rc-key"><i className="is-rest" />Added, tests, site</span>
        <span className="rc-key"><i className="is-fix" />fixed · {fixTotal}</span>
      </figcaption>
    </figure>
  );
}

/**
 * Drafting's break line, between two eras of the log: a long rule with the
 * zigzag that marks a drawing as broken there. Inked by the library as it
 * scrolls into view.
 */
export function BreakLine() {
  return (
    <ScrollDraw className="cl-break" selector=".cl-break-ink" trigger={{ start: 'top 90%', end: 'top 55%' }} easing="ease-out">
      <svg className="cl-break-run" viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 10 H100" className="cl-break-ink" stroke="currentColor" />
      </svg>
      <svg className="cl-break-zig" viewBox="0 0 44 20" aria-hidden="true">
        <path d="M0 10 H12 L17 2 L27 18 L32 10 H44" className="cl-break-ink" stroke="currentColor" />
      </svg>
      <svg className="cl-break-run" viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 10 H100" className="cl-break-ink" stroke="currentColor" />
      </svg>
    </ScrollDraw>
  );
}
