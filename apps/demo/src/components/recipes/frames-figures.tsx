'use client';

import { ScrollDraw } from 'svg-scroll-draw/react';

/*
 * The figures beside each step of the image-sequence recipe. The load order in
 * fig. 1.1 is the one packages/svg-scroll-draw/src/frames/index.ts computes
 * (loadOrder): the first frame, the last, then the middle of every gap.
 */

const INK = { start: 'top 85%', end: 'top 40%' };
const COUNT = 71;

/** loadOrder() from frames/index.ts, for the figure: the first `take` frames it asks for. */
function firstLoads(n: number, take: number): number[] {
  const order = n > 1 ? [0, n - 1] : [0];
  const gaps: [number, number][] = [[0, n - 1]];
  for (let g = 0; g < gaps.length && order.length < take; g++) {
    const [lo, hi] = gaps[g];
    if (hi - lo < 2) continue;
    const mid = (lo + hi) >> 1;
    order.push(mid);
    gaps.push([lo, mid], [mid, hi]);
  }
  return order.slice(0, take);
}

/** Step 1: index → file name, and the order the frames load in. */
export function FigLoadOrder() {
  const x = (i: number) => 14 + (i / (COUNT - 1)) * 222;
  const first = firstLoads(COUNT, 9);
  return (
    <ScrollDraw selector=".rf-ink" trigger={INK} easing="ease-out" stagger={0.06} once>
      <svg className="rf-svg" viewBox="0 0 250 150" role="img" aria-label="71 frames, index 0 to 70, named frame_0001 to frame_0071. The first nine requested: frames 0, 70, 35, 17, 52, 8, 26, 43 and 61.">
        <text className="rf-t" x="14" y="14">index 0 → frame_0001.webp</text>
        <text className="rf-t" x="236" y="14" textAnchor="end">70 → frame_0071.webp</text>
        {Array.from({ length: COUNT }, (_, i) => (
          <path key={i} className="rf-dim" d={`M ${x(i).toFixed(2)} 74 V ${i % 10 === 0 || i === COUNT - 1 ? 88 : 82}`} />
        ))}
        {first.map((f, k) => (
          <g key={f}>
            <path className="rf-ink" d={`M ${x(f).toFixed(2)} 70 V ${46 - (k % 2) * 12}`} strokeWidth="1.6" />
            <text className={k < 2 ? 'rf-t rf-t-acc' : 'rf-t rf-t-ink'} x={x(f)} y={40 - (k % 2) * 12} textAnchor="middle">{k + 1}</text>
          </g>
        ))}
        {[0, 35, 70].map((i) => (
          <text key={i} className="rf-t" x={x(i)} y="102" textAnchor={i === 0 ? 'start' : i === 70 ? 'end' : 'middle'}>{i}</text>
        ))}
        <text className="rf-t" x="125" y="126" textAnchor="middle">above: the order the first nine are requested,</text>
        <text className="rf-t" x="125" y="139" textAnchor="middle">six in flight at once; the rest fill the gaps</text>
      </svg>
    </ScrollDraw>
  );
}

/** Step 2: the track holds the scroll room; the stage is stuck for all but one screen of it. */
export function FigTurnTrack() {
  return (
    <ScrollDraw selector=".rf-ink" trigger={INK} easing="ease-out" once>
      <svg className="rf-svg" viewBox="0 0 250 220" role="img" aria-label="A track four screens tall; the sticky stage, one screen, stays stuck for three, and the 71 frames are spread over those three: about 4.3 vh of scroll each.">
        <rect className="rf-wrap" x="70" y="10" width="90" height="200" />
        <text className="rf-t" x="64" y="20" textAnchor="end">.turn-track</text>
        <text className="rf-t" x="64" y="32" textAnchor="end">400vh</text>
        <path className="rf-ink" d="M 74 14 h 82 v 46 h -82 Z" strokeWidth="1.4" />
        <path className="rf-ink" d="M 74 160 h 82 v 46 h -82 Z" strokeWidth="1.4" />
        <text className="rf-t" x="115" y="41" textAnchor="middle">frame 1</text>
        <text className="rf-t" x="115" y="187" textAnchor="middle">frame 71</text>
        <path className="rf-dim" d="M 176 37 V 183 M 172 37 H 180 M 172 183 H 180" />
        <text className="rf-t" x="186" y="100">stuck</text>
        <text className="rf-t" x="186" y="112">300vh</text>
        <text className="rf-t" x="186" y="124">≈ 4.3vh</text>
        <text className="rf-t" x="186" y="136">a frame</text>
      </svg>
    </ScrollDraw>
  );
}

/** Step 3: measure the canvas and the window rides along with it; measure the track and it holds. */
export function FigMeasureCanvas() {
  const cols = [
    { x: 20, label: 'measure the canvas', note: 'moves with the scroll', win: [62, 92], ok: false },
    { x: 140, label: 'measure the track', note: 'the whole pin', win: [20, 164], ok: true },
  ];
  return (
    <ScrollDraw selector=".rf-ink" trigger={INK} easing="ease-out" stagger={0.2} once>
      <svg className="rf-svg" viewBox="0 0 250 218" role="img" aria-label="Measured from the stuck canvas, the window moves with the scroll; measured from the track, it spans the whole pin.">
        {cols.map((c) => (
          <g key={c.label}>
            <rect className="rf-wrap" x={c.x} y="20" width="70" height="164" />
            <path className="rf-ink" d={`M ${c.x + 6} 60 h 58 v 33 h -58 Z`} strokeWidth="1.2" />
            <text className="rf-t" x={c.x + 35} y="80" textAnchor="middle">canvas</text>
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

/** Step 4: progress, the frame it calls for, and where each chapter takes over. */
export function FigTurnChapters() {
  const x = (p: number) => 20 + p * 210;
  const marks = [
    { p: 0, n: '01' },
    { p: 0.4, n: '02' },
    { p: 0.72, n: '03' },
  ];
  return (
    <ScrollDraw selector=".rf-ink" trigger={INK} easing="linear" once>
      <svg className="rf-svg" viewBox="0 0 250 124" role="img" aria-label="Progress from 0 to 1 calls for frames 1 to 71; chapter 2 from 0.4 (frame 29), chapter 3 from 0.72 (frame 51).">
        <path className="rf-dim" d={`M ${x(0)} 56 H ${x(1)}`} />
        <path className="rf-ink" d={`M ${x(0)} 56 H ${x(1)}`} strokeWidth="3" />
        {marks.map((m) => (
          <g key={m.n}>
            <path className="rf-dim" d={`M ${x(m.p)} 44 V 68`} />
            <text className="rf-t rf-t-ink" x={x(m.p) + 4} y="36">{m.n}</text>
            <text className="rf-t" x={x(m.p)} y="84" textAnchor={m.p === 0 ? 'start' : 'middle'}>{m.p}</text>
            <text className="rf-t" x={x(m.p)} y="98" textAnchor={m.p === 0 ? 'start' : 'middle'}>
              frame {Math.round(m.p * (COUNT - 1)) + 1}
            </text>
          </g>
        ))}
        <text className="rf-t" x={x(1)} y="84" textAnchor="end">1</text>
        <text className="rf-t" x={x(1)} y="98" textAnchor="end">frame 71</text>
        <text className="rf-t" x="125" y="118" textAnchor="middle">the copy follows the turn, not the page</text>
      </svg>
    </ScrollDraw>
  );
}
