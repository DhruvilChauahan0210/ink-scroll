'use client';

import './frames.css';
import './chart.css';
import { useCallback, useRef } from 'react';
import { ScrollDraw } from 'svg-scroll-draw/react';
import { Browser } from './frames';
import { smooth, type P } from '../ink/geo';

/* Ledgerline — a subscription-billing dashboard. The MRR lines plot
   themselves as the card scrolls in; the fill and the tooltip follow. */

const THIS_YEAR = [118, 124, 129, 133, 141, 146, 152, 158, 163, 170, 177, 184.3];
const LAST_YEAR = [96, 99, 103, 104, 108, 112, 115, 119, 121, 125, 128, 131];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const X0 = 8, X1 = 512, Y0 = 14, Y1 = 186, LO = 80, HI = 200;
const px = (i: number) => X0 + (i * (X1 - X0)) / 11;
const py = (v: number) => Y1 - ((v - LO) / (HI - LO)) * (Y1 - Y0);
const pts = (vals: number[]): P[] => vals.map((v, i) => [px(i), py(v)]);
const NOW = smooth(pts(THIS_YEAR));
const PREV = smooth(pts(LAST_YEAR));
const AREA = `${NOW} L ${X1} ${Y1} L ${X0} ${Y1} Z`;
const GRID = [100, 140, 180].map((v) => `M ${X0} ${py(v).toFixed(1)} H ${X1}`).join(' ');
const END: P = [px(11), py(184.3)];

export function ChartScene() {
  const box = useRef<HTMLDivElement>(null);
  const onProgress = useCallback((p: number) => box.current?.style.setProperty('--lx-p', p.toFixed(3)), []);
  return (
    <Browser url="app.ledgerline.io/revenue" tone="dark">
      <div className="lx" ref={box}>
        <header className="lx-top">
          <span className="lx-brand">
            <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="M4 15V5M4 15h12M8 12V9M12 12V6M16 12V8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            Ledgerline
          </span>
          <span className="lx-crumb">Revenue <i>/</i> <b>MRR</b></span>
          <span className="lx-range">Last 12 months</span>
        </header>

        <div className="lx-kpis">
          <div><span>MRR</span><b>$184,320</b><em className="up">▲ 40.7% YoY</em></div>
          <div><span>Net new MRR</span><b>$7,320</b><em className="up">▲ 3.1%</em></div>
          <div><span>Churn</span><b>1.8%</b><em className="down">▼ 0.4 pt</em></div>
        </div>

        <div className="lx-card">
          <div className="lx-legend">
            <span><i className="lx-sw now" /> 2026</span>
            <span><i className="lx-sw prev" /> 2025</span>
          </div>
          <div className="lx-plot">
            <div className="lx-y" aria-hidden="true">
              {[180, 140, 100].map((v) => <span key={v} style={{ top: `${(py(v) / 200) * 100}%` }}>${v}k</span>)}
            </div>
            <ScrollDraw
              className="lx-draw"
              selector=".lx-line"
              trigger={{ start: 'top 85%', end: 'top 40%' }}
              stagger={0.18}
              easing="ease-out"
              once
              onProgress={onProgress}
            >
              <svg viewBox="0 0 520 200" preserveAspectRatio="none" role="img" aria-label="Monthly recurring revenue, 2025 against 2026: from $118k in January to $184.3k in December">
                <defs>
                  <linearGradient id="lx-fade" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#7c8cff" stopOpacity="0.32" />
                    <stop offset="1" stopColor="#7c8cff" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path className="lx-grid" d={GRID} />
                <path className="lx-area" d={AREA} fill="url(#lx-fade)" />
                <path className="lx-line prev" d={PREV} />
                <path className="lx-line now" d={NOW} />
              </svg>
            </ScrollDraw>
            <span className="lx-dot" style={{ left: `${(END[0] / 520) * 100}%`, top: `${(END[1] / 200) * 100}%` }} aria-hidden="true" />
            <span className="lx-tip" style={{ top: `${(END[1] / 200) * 100}%` }} aria-hidden="true"><b>$184.3k</b> Dec</span>
          </div>
          <div className="lx-x" aria-hidden="true">{MONTHS.map((m, i) => <span key={m} className={i % 3 === 0 || i === 11 ? 'k' : ''}>{m}</span>)}</div>
        </div>
      </div>
    </Browser>
  );
}
