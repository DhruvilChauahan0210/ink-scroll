'use client';

import { ScrollDraw } from 'svg-scroll-draw/react';

/*
 * The figures beside each step of the scrubbed-film recipe. Fig. 1.1 is a
 * measurement, not an illustration: 40 random seeks in Chromium on the same
 * 5-second film, encoded twice (2026-11-05).
 */

const INK = { start: 'top 85%', end: 'top 40%' };

/** Step 1: keyframes and what a seek costs — measured. */
export function FigKeyframes() {
  const ms = (v: number) => 24 + (v / 60) * 200; // 0–60 ms across the chart
  const rows = [
    { k: 'a keyframe every 3 frames', p90: 6.5, worst: 7.3, y: 22, every: 3 },
    { k: 'one keyframe for the whole clip', p90: 48.8, worst: 53.6, y: 98, every: 0 },
  ];
  return (
    <ScrollDraw selector=".rf-ink" trigger={INK} easing="ease-out" stagger={0.15} once>
      <svg className="rf-svg" viewBox="0 0 250 200" role="img" aria-label="Seeking a film with a keyframe every 3 frames took at most 7.3 ms; with one keyframe for the whole clip, up to 53.6 ms. One frame lasts 16.7 ms.">
        {rows.map((r) => (
          <g key={r.k}>
            <text className="rf-t" x="24" y={r.y}>{r.k}</text>
            {/* frames: filled ones are keyframes */}
            {Array.from({ length: 18 }, (_, i) => {
              const key = r.every ? i % r.every === 0 : i === 0;
              return <rect key={i} className={key ? 'rf-key' : 'rf-frm'} x={24 + i * 10} y={r.y + 8} width="8" height="9" />;
            })}
            <path className="rf-ink" d={`M ${ms(0)} ${r.y + 34} H ${ms(r.p90)}`} strokeWidth="6" />
            <text className="rf-t" x="24" y={r.y + 54}>90th percentile {r.p90} ms · worst {r.worst} ms</text>
          </g>
        ))}
        {/* the one-frame budget, marked where it meets each bar and the axis */}
        <path className="rf-miss" d={`M ${ms(16.7)} 48 V 64 M ${ms(16.7)} 124 V 140 M ${ms(16.7)} 170 V 182`} />
        <text className="rf-t rf-t-acc" x={ms(16.7) + 4} y="166">one frame, 16.7 ms</text>
        <path className="rf-dim" d={`M ${ms(0)} 176 H ${ms(60)}`} />
        {[0, 20, 40, 60].map((v) => (
          <g key={v}>
            <path className="rf-dim" d={`M ${ms(v)} 172 V 180`} />
            <text className="rf-t" x={ms(v)} y="192" textAnchor="middle">{v} ms</text>
          </g>
        ))}
      </svg>
    </ScrollDraw>
  );
}

/** Step 2: the track holds the scroll room; the stage is stuck for all but one screen of it. */
export function FigTrack() {
  return (
    <ScrollDraw selector=".rf-ink" trigger={INK} easing="ease-out" once>
      <svg className="rf-svg" viewBox="0 0 250 220" role="img" aria-label="A track four screens tall; the sticky stage, one screen, stays stuck for three.">
        <rect className="rf-wrap" x="70" y="10" width="90" height="200" />
        <text className="rf-t" x="64" y="20" textAnchor="end">.film-track</text>
        <text className="rf-t" x="64" y="32" textAnchor="end">400vh</text>
        <path className="rf-ink" d="M 74 14 h 82 v 46 h -82 Z" strokeWidth="1.4" />
        <path className="rf-ink" d="M 74 160 h 82 v 46 h -82 Z" strokeWidth="1.4" />
        <text className="rf-t" x="115" y="41" textAnchor="middle">stage</text>
        <text className="rf-t" x="115" y="187" textAnchor="middle">stage</text>
        <path className="rf-dim" d="M 176 37 V 183 M 172 37 H 180 M 172 183 H 180" />
        <text className="rf-t" x="186" y="106">stuck</text>
        <text className="rf-t" x="186" y="118">300vh</text>
        <text className="rf-t" x="186" y="130">= the film</text>
      </svg>
    </ScrollDraw>
  );
}

/** Step 3: measure the video and the window rides along with it; measure the track and it holds. */
export function FigMeasure() {
  const cols = [
    { x: 20, label: 'measure the video', note: 'moves with the scroll', win: [62, 92], ok: false },
    { x: 140, label: 'measure the track', note: 'the whole pin', win: [20, 164], ok: true },
  ];
  return (
    <ScrollDraw selector=".rf-ink" trigger={INK} easing="ease-out" stagger={0.2} once>
      <svg className="rf-svg" viewBox="0 0 250 218" role="img" aria-label="Measured from the stuck video, the window moves with the scroll; measured from the track, it spans the whole pin.">
        {cols.map((c) => (
          <g key={c.label}>
            <rect className="rf-wrap" x={c.x} y="20" width="70" height="164" />
            <path className="rf-ink" d={`M ${c.x + 6} 56 h 58 v 44 h -58 Z`} strokeWidth="1.2" />
            <text className="rf-t" x={c.x + 35} y="82" textAnchor="middle">video</text>
            <path className={c.ok ? 'rf-hit' : 'rf-miss'} d={`M ${c.x + 80} ${c.win[0]} V ${c.win[1]} M ${c.x + 76} ${c.win[0]} h 8 M ${c.x + 76} ${c.win[1]} h 8`} />
            <text className="rf-t" x={c.x + 35} y="200" textAnchor="middle">{c.label}</text>
            <text className={c.ok ? 'rf-t' : 'rf-t rf-t-acc'} x={c.x + 35} y="212" textAnchor="middle">{c.note}</text>
          </g>
        ))}
        <text className="rf-t" x="20" y="12">dashed: the track · bracket: the window</text>
      </svg>
    </ScrollDraw>
  );
}

/** Step 4: the film's progress, and where each chapter takes over. */
export function FigChapters() {
  const x = (p: number) => 20 + p * 210;
  const marks = [
    { p: 0, n: '01' },
    { p: 0.45, n: '02' },
    { p: 0.75, n: '03' },
  ];
  return (
    <ScrollDraw selector=".rf-ink" trigger={INK} easing="linear" once>
      <svg className="rf-svg" viewBox="0 0 250 110" role="img" aria-label="Progress from 0 to 1; chapter 2 from 0.45, chapter 3 from 0.75.">
        <path className="rf-dim" d={`M ${x(0)} 56 H ${x(1)}`} />
        <path className="rf-ink" d={`M ${x(0)} 56 H ${x(1)}`} strokeWidth="3" />
        {marks.map((m) => (
          <g key={m.n}>
            <path className="rf-dim" d={`M ${x(m.p)} 44 V 68`} />
            <text className="rf-t rf-t-ink" x={x(m.p) + 4} y="36">{m.n}</text>
            <text className="rf-t" x={x(m.p)} y="84" textAnchor={m.p === 0 ? 'start' : 'middle'}>{m.p}</text>
          </g>
        ))}
        <text className="rf-t" x={x(1)} y="84" textAnchor="end">1</text>
        <text className="rf-t" x="125" y="104" textAnchor="middle">the copy follows the film, not the page</text>
      </svg>
    </ScrollDraw>
  );
}
