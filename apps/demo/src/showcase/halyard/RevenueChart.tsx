'use client';

import { useEffect, useRef } from 'react';
import { scrollDrawTimeline } from 'svg-scroll-draw/timeline';
import { smooth, type P } from '@/components/examples/ink/geo';
import { QUARTERS } from './data';

/* The report's centrepiece: net revenue by quarter. One scrollDrawTimeline
   call gives every part its own slice of the same scroll range — the
   gridlines and baseline first, then each FY2026 bar rising from the axis in
   turn (a vertical stroke as wide as the bar, so it grows like a real bar),
   then the trend line through the tops. Last year's bars stay put for
   comparison; the white value labels only show once their bar is under them.
   The figure is the container, so the year finishes drawing while the whole
   card — title, legend and plot — is on screen. */

const X0 = 54, X1 = 628, TOP = 30, Y1 = 316, MAX = 600;
const GW = (X1 - X0) / QUARTERS.length;
const CUR = 52, PY = 18, GAP = 6;
const y = (v: number) => Y1 - (v / MAX) * (Y1 - TOP);
const mid = (i: number) => X0 + GW * i + GW / 2;
const pyX = (i: number) => mid(i) - (CUR + GAP + PY) / 2;
const curX = (i: number) => pyX(i) + PY + GAP + CUR / 2;
const f = (v: number) => v.toFixed(1);

const TREND = smooth(QUARTERS.map((d, i) => [curX(i), y(d.v) - 20] as P));

export function RevenueChart() {
  const fig = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = fig.current;
    if (!el) return;
    const t = scrollDrawTimeline(el, {
      trigger: { start: 'top 80%', end: 'top 15%' },
      tracks: [
        { selector: '.hy-axis', from: 0, to: 0.25, easing: 'ease-out' },
        { selector: '.hy-b0', from: 0.12, to: 0.4, easing: 'ease-out' },
        { selector: '.hy-b1', from: 0.26, to: 0.54, easing: 'ease-out' },
        { selector: '.hy-b2', from: 0.4, to: 0.68, easing: 'ease-out' },
        { selector: '.hy-b3', from: 0.54, to: 0.82, easing: 'ease-out' },
        { selector: '.hy-trend', from: 0.74, to: 1, easing: 'ease-in-out' },
      ],
    });
    return () => t.destroy();
  }, []);

  return (
    <figure className="hy-chart" id="revenue" ref={fig}>
      <div className="hy-chart-top">
        <div>
          <p className="hy-chart-eyebrow">Figure 3.1</p>
          <h3 className="hy-chart-title">Net revenue by quarter</h3>
          <p className="hy-chart-sub">€ million · FY 2026 against the same quarter of FY 2025</p>
        </div>
        <div className="hy-seg" aria-hidden="true"><span className="on">Quarterly</span><span>Annual</span></div>
      </div>
      <ul className="hy-legend" aria-hidden="true">
        <li><i className="sw-cur" />FY 2026</li>
        <li><i className="sw-key" />Record quarter</li>
        <li><i className="sw-py" />FY 2025</li>
        <li><i className="sw-trend" />Trend</li>
      </ul>

      <div className="hy-plot">
        <svg viewBox="0 0 640 372" role="img" aria-label="Net revenue by quarter in 2026 against 2025: Q1 €412m (€371m), Q2 €468m (€409m), Q3 €451m (€398m), Q4 €539m (€463m). Every quarter grew; the trend rises through the year.">
          {[150, 300, 450, 600].map((v) => (
            <g key={v}>
              <path className="hy-axis hy-gl" d={`M ${X0} ${f(y(v))} H ${X1}`} />
              <text className="hy-tick" x={X0 - 12} y={y(v) + 4} textAnchor="end">{v}</text>
            </g>
          ))}
          <text className="hy-tick" x={X0 - 12} y={Y1 + 4} textAnchor="end">0</text>

          {QUARTERS.map((d, i) => (
            <g key={d.q}>
              <rect className="hy-py" x={f(pyX(i))} y={f(y(d.py))} width={PY} height={f(Y1 - y(d.py))} />
              <path className={`hy-bar hy-b${i}${i === 3 ? ' is-key' : ''}`} d={`M ${f(curX(i))} ${Y1} V ${f(y(d.v))}`} />
              <text className="hy-val" x={f(curX(i))} y={f(y(d.v) + 21)} textAnchor="middle">{d.v}</text>
              <text className="hy-q" x={f(mid(i))} y={Y1 + 28} textAnchor="middle">{d.q}</text>
              <text className="hy-qm" x={f(mid(i))} y={Y1 + 47} textAnchor="middle">{d.months}</text>
            </g>
          ))}

          <path className="hy-axis hy-base" d={`M ${X0} ${Y1} H ${X1}`} />
          <path className="hy-trend hy-trend-line" d={TREND} />
        </svg>
      </div>

      <figcaption className="hy-chart-foot">
        <span>Source: consolidated financial statements, note 4 (segment information). Quarterly split unaudited.</span>
        <span className="hy-chart-total">FY 2026 <b>€1,870m</b> <em>+14.0%</em></span>
      </figcaption>
    </figure>
  );
}
