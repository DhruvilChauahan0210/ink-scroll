'use client';

import { useEffect, useRef } from 'react';
import { scrollCounter } from 'svg-scroll-draw';
import { ScrollDraw } from 'svg-scroll-draw/react';

/*
 * The figures beside each step of the stat-row recipe: the three copies of a
 * number, why the row would jump, a live count with its raw value beside the
 * formatted one, and where the counting window ends.
 */

const INK = { start: 'top 85%', end: 'top 40%' };
const nf = new Intl.NumberFormat('en-US');

/** Step 1: one stat, written three times — each copy with its own job. */
export function FigThreeCopies() {
  const rows = [
    { cls: '.stat-sr', value: '1,284,500', job: 'read once by screen readers', y: 26 },
    { cls: '.stat-hold', value: '1,284,500', job: 'invisible — holds the width', y: 74 },
    { cls: '.stat-run', value: '0 → 1,284,500', job: 'what you see count', y: 122 },
  ];
  return (
    <ScrollDraw selector=".rf-ink" trigger={INK} easing="ease-out" stagger={0.2} once>
      <svg className="rf-svg" viewBox="0 0 300 150" role="img" aria-label="Three copies: one for screen readers, one invisible to hold the width, one that counts.">
        {rows.map((r, i) => (
          <g key={r.cls}>
            <path
              className={i === 1 ? 'rf-ink rf-ink-dash' : 'rf-ink'}
              d={`M 8 ${r.y - 18} H 140 V ${r.y + 8} H 8 Z`}
              strokeWidth="1.2"
            />
            <text className="rf-t rf-t-big" x="16" y={r.y}>{r.value}</text>
            <text className="rf-t" x="150" y={r.y - 6}>{r.cls}</text>
            <text className="rf-t" x="150" y={r.y + 6}>{r.job}</text>
          </g>
        ))}
      </svg>
    </ScrollDraw>
  );
}

/**
 * Step 2: why the row jumps. Proportional digits and a growing number push the
 * unit along every frame; tabular digits in a cell held at the final width do
 * not move it at all.
 */
export function FigWidth() {
  const frames = ['0', '12,480', '1,284,500'];
  const grow = [14, 46, 70];
  return (
    <ScrollDraw selector=".rf-ink" trigger={INK} easing="ease-out" stagger={0.12} once>
      <svg className="rf-svg" viewBox="0 0 284 150" role="img" aria-label="Without a held width the unit moves as the number grows; with it, the unit stays put.">
        <text className="rf-t" x="8" y="14">growing width</text>
        {frames.map((f, i) => (
          <g key={f} transform={`translate(${8 + i * 92} 24)`}>
            <path className="rf-ink" d={`M 0 0 H ${grow[i]} V 22 H 0 Z`} strokeWidth="1" />
            <text className="rf-t" x="3" y="15">{f}</text>
            <text className="rf-t rf-t-acc" x={grow[i] + 3} y="15">ha</text>
          </g>
        ))}
        <text className="rf-t" x="8" y="90">held width · tabular-nums</text>
        {frames.map((f, i) => (
          <g key={`h${f}`} transform={`translate(${8 + i * 92} 100)`}>
            <path className="rf-ink" d="M 0 0 H 70 V 22 H 0 Z" strokeWidth="1" />
            <text className="rf-t" x="67" y="15" textAnchor="end">{f}</text>
            <text className="rf-t" x="73" y="15">ha</text>
          </g>
        ))}
      </svg>
    </ScrollDraw>
  );
}

/** Step 3: a real counter — the raw value scrollCounter hands to format, beside what format writes. */
export function FigFormat() {
  const out = useRef<HTMLSpanElement>(null);
  const raw = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!out.current) return;
    const c = scrollCounter(out.current, {
      to: 1284500,
      format: (n) => {
        if (raw.current) raw.current.textContent = n.toFixed(3);
        return nf.format(n);
      },
      trigger: { start: 'top bottom', end: 'bottom 60%' },
    });
    return () => c.destroy();
  }, []);
  return (
    <div className="rf-count">
      <p className="rf-count-row"><span className="rf-count-k">format(</span><span ref={raw} className="rf-count-raw">1284500.000</span><span className="rf-count-k">)</span></p>
      <p className="rf-count-row rf-count-out"><span ref={out}>1,284,500</span></p>
      <p className="rf-k">the same formatter wrote the final value, so the separators never move</p>
    </div>
  );
}

/**
 * Step 4: where the window ends. With a footer below it, a row near the end of
 * the page stops with its top at 69% of the screen (measured) — the default
 * end, its top at 20%, is never reached; `bottom 90%` is.
 */
export function FigReach() {
  return (
    <ScrollDraw selector=".rf-ink" trigger={INK} easing="ease-out" once>
      <svg className="rf-svg" viewBox="0 0 260 202" role="img" aria-label="At the end of the page the row's top stops at 69% of the screen: top 20% is never reached, bottom 90% is.">
        <defs>
          <pattern id="rf-hatch-foot" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line className="rf-hatch-line" x1="0" y1="0" x2="0" y2="6" />
          </pattern>
        </defs>
        <rect className="rf-frame" x="40" y="10" width="130" height="170" />
        <text className="rf-t" x="34" y="20" textAnchor="end">screen</text>
        {/* the row, where the page lets it stop */}
        <path className="rf-ink" d="M 48 127 H 162 V 151 H 48 Z" strokeWidth="1.6" />
        <text className="rf-t" x="105" y="143" textAnchor="middle">stat row</text>
        <rect className="rf-foot" x="48" y="151" width="114" height="29" />
        <text className="rf-t" x="105" y="196" textAnchor="middle">footer, then the page ends</text>
        {/* default end: top 20% */}
        <path className="rf-miss" d="M 40 44 H 170" />
        <text className="rf-t rf-t-acc" x="176" y="42">top 20%</text>
        <text className="rf-t rf-t-acc" x="176" y="52">never reached</text>
        {/* the recipe's end: bottom 90% */}
        <path className="rf-hit" d="M 40 163 H 170" />
        <text className="rf-t" x="176" y="161">bottom 90%</text>
        <text className="rf-t" x="176" y="171">reached</text>
        <path className="rf-dim" d="M 30 127 V 180" />
        <text className="rf-t" x="26" y="130" textAnchor="end">69%</text>
      </svg>
    </ScrollDraw>
  );
}
