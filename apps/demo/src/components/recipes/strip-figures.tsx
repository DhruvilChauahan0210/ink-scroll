'use client';

import { ScrollDraw } from 'svg-scroll-draw/react';

/*
 * The figures beside each step of the case-study strip. Every number is a
 * measurement of the recipe's own index.html in Chromium (2026-11-05): the
 * file as shipped, or the file with the one line a step changes put back.
 */

const INK = { start: 'top 85%', end: 'top 40%' };

/** Step 1: the runway, the stage stuck at its top, the track running past the stage's edge. */
export function FigLayers() {
  const cases = [26, 72, 118, 164];
  return (
    <ScrollDraw selector=".rf-ink" trigger={INK} easing="ease-out" stagger={0.15} once>
      <svg className="rf-svg" viewBox="0 0 250 210" role="img" aria-label="A tall runway; the stage, one screen, stuck at its top for the rest of the runway, which is the travel; the track, a row of four cases, two inside the stage and two past its right edge, moving left.">
        <rect className="rf-wrap" x="16" y="10" width="104" height="190" />
        <path className="rf-ink" d="M 20 14 h 96 v 62 h -96 Z" strokeWidth="1.4" />
        {cases.map((x, i) => (
          <rect key={x} className={i < 2 ? 'rf-view' : 'rf-wrap'} x={x} y="26" width="40" height="36" />
        ))}
        <text className="rf-t" x="164" y="18">.work-track</text>
        <path className="rf-dim" d="M 204 72 H 140 M 146 68 L 140 72 L 146 76" />
        <text className="rf-t" x="146" y="88">translateX</text>
        <text className="rf-t rf-t-ink" x="24" y="94">.work-stage</text>
        <text className="rf-t" x="24" y="106">sticky · clip</text>
        <text className="rf-t rf-t-ink" x="24" y="180">.work</text>
        <text className="rf-t" x="24" y="192">the runway</text>
        <path className="rf-dim" d="M 128 104 V 200 M 124 104 H 132 M 124 200 H 132" />
        <text className="rf-t" x="138" y="140">the stage is</text>
        <text className="rf-t" x="138" y="152">stuck for this:</text>
        <text className="rf-t rf-t-ink" x="138" y="164">the travel</text>
      </svg>
    </ScrollDraw>
  );
}

/** Step 2: what scrollHorizontal moves the track by — measured at 1280 × 800. */
export function FigTravel() {
  const k = 210 / 2152; // the track's 2,152 px across 210 units
  const x = (px: number) => 20 + px * k;
  const cases = [0, 1, 2, 3].map((i) => i * 544);
  return (
    <ScrollDraw selector=".rf-ink" trigger={INK} easing="ease-out" stagger={0.2} once>
      <svg className="rf-svg" viewBox="0 0 250 134" role="img" aria-label="The track is 2,152 px wide and the stage's content box 1,126 px, so the travel is 1,026 px.">
        <text className="rf-t" x="20" y="14">measured at 1280 × 800</text>
        <rect className="rf-view" x={x(0)} y="24" width={x(1126.4) - x(0)} height="40" />
        {cases.map((c, i) => (
          <rect key={c} className={i < 2 ? 'rf-view' : 'rf-wrap'} x={x(c)} y="30" width={520 * k} height="28" />
        ))}
        <path className="rf-dim" d={`M ${x(0)} 80 H ${x(2152)} M ${x(0)} 76 V 84 M ${x(2152)} 76 V 84`} />
        <text className="rf-t" x={x(1076)} y="94" textAnchor="middle">track 2,152 px</text>
        <path className="rf-dim" d={`M ${x(0)} 108 H ${x(1126.4)} M ${x(0)} 104 V 112`} />
        <text className="rf-t" x={x(563)} y="124" textAnchor="middle">stage 1,126 px</text>
        <path className="rf-ink" d={`M ${x(1126.4)} 108 H ${x(2152)} M ${x(1126.4)} 104 V 112 M ${x(2152)} 104 V 112`} strokeWidth="1.6" />
        <text className="rf-t rf-t-ink" x={x(1639)} y="124" textAnchor="middle">travel 1,026 px</text>
      </svg>
    </ScrollDraw>
  );
}

/** Step 3: pixels sideways per 100 px of scroll — a fixed runway against one matched to the travel. */
export function FigSpeed() {
  const v = (n: number) => 20 + n * 2; // 0–100 across 200 units
  const rows = [
    { k: '400vh runway · 1440 × 900', n: 32.8, y: 20 },
    { k: '400vh runway · 390 × 844', n: 31.6, y: 60 },
    { k: 'travel + one screen · both', n: 100, y: 100 },
  ];
  return (
    <ScrollDraw selector=".rf-ink" trigger={INK} easing="ease-out" stagger={0.15} once>
      <svg className="rf-svg" viewBox="0 0 250 170" role="img" aria-label="With a fixed 400vh runway the strip moved 32.8 px sideways per 100 px of scroll at 1440 wide and 31.6 px at 390. With the runway set to its travel plus one screen, 100 px at both.">
        {rows.map((r) => (
          <g key={r.k}>
            <text className="rf-t" x="20" y={r.y}>{r.k}</text>
            <text className={r.n === 100 ? 'rf-t rf-t-ink' : 'rf-t'} x="230" y={r.y} textAnchor="end">{r.n} px</text>
            <path className="rf-ink" d={`M ${v(0)} ${r.y + 12} H ${v(r.n)}`} strokeWidth="6" />
          </g>
        ))}
        <path className="rf-hit" d={`M ${v(100)} 124 V 140`} />
        <path className="rf-dim" d={`M ${v(0)} 132 H ${v(100)}`} />
        {[0, 50, 100].map((n) => (
          <g key={n}>
            <path className="rf-dim" d={`M ${v(n)} 128 V 136`} />
            <text className="rf-t" x={v(n)} y="150" textAnchor={n === 0 ? 'start' : n === 100 ? 'end' : 'middle'}>{n}</text>
          </g>
        ))}
        <text className="rf-t" x="125" y="164" textAnchor="middle">px sideways per 100 px of scroll</text>
      </svg>
    </ScrollDraw>
  );
}

/** Step 4: where the count ticks over along the strip's progress. */
export function FigCount() {
  const x = (p: number) => 20 + p * 210;
  const marks = [
    { p: 0, n: '01', l: '0' },
    { p: 1 / 6, n: '02', l: '1/6' },
    { p: 1 / 2, n: '03', l: '1/2' },
    { p: 5 / 6, n: '04', l: '5/6' },
  ];
  return (
    <ScrollDraw selector=".rf-ink" trigger={INK} easing="linear" once>
      <svg className="rf-svg" viewBox="0 0 250 110" role="img" aria-label="Progress from 0 to 1; the count reads 01, then 02 from 1/6, 03 from 1/2 and 04 from 5/6.">
        <path className="rf-dim" d={`M ${x(0)} 56 H ${x(1)}`} />
        <path className="rf-ink" d={`M ${x(0)} 56 H ${x(1)}`} strokeWidth="3" />
        {marks.map((m) => (
          <g key={m.n}>
            <path className="rf-dim" d={`M ${x(m.p)} 44 V 68`} />
            <text className="rf-t rf-t-ink" x={x(m.p) + 4} y="36">{m.n}</text>
            <text className="rf-t" x={x(m.p)} y="84" textAnchor={m.p === 0 ? 'start' : 'middle'}>{m.l}</text>
          </g>
        ))}
        <text className="rf-t" x={x(1)} y="84" textAnchor="end">1</text>
        <text className="rf-t" x="125" y="104" textAnchor="middle">round(p × 3) + 1 · the rail is scaleX(p)</text>
      </svg>
    </ScrollDraw>
  );
}

/** Step 5: tab to case 4, scroll back to the start — what the stage shows. Measured at 1280 × 800. */
export function FigFocus() {
  // The stage's 1,126 px content box across 104 units; cases 520 px with 24 px gaps.
  const k = 104 / 1126.4;
  const shown = (from: number, x0: number) =>
    [0, 1, 2, 3]
      .map((i) => ({ n: i + 1, a: i * 544 - from, b: i * 544 + 520 - from }))
      .filter((c) => c.b > 0 && c.a < 1126.4)
      .map((c) => ({ n: c.n, x: x0 + Math.max(0, c.a) * k, w: (Math.min(1126.4, c.b) - Math.max(0, c.a)) * k }));
  const rows = [
    { y: 0, title: 'overflow: hidden', from: 615, ok: false, lines: ['tab to case 4, then', 'back to the start:', 'it opens on case 2', 'scrollLeft 615 px'] },
    { y: 104, title: 'overflow: clip + focusin', from: 0, ok: true, lines: ['tab to case 4: the', 'page scrolls to it', 'back to the start:', 'it opens on case 1'] },
  ];
  return (
    <ScrollDraw selector=".rf-ink" trigger={INK} easing="ease-out" stagger={0.2} once>
      <svg className="rf-svg" viewBox="0 0 250 200" role="img" aria-label="With overflow: hidden, tabbing to case 4 scrolled the stage 615 px sideways and it stayed scrolled, so the start of the strip opened on case 2. With overflow: clip and the focus handler, the stage never scrolls and the start shows case 1.">
        {rows.map((r) => (
          <g key={r.title}>
            <text className={r.ok ? 'rf-t rf-t-ink' : 'rf-t rf-t-acc'} x="10" y={r.y + 14}>{r.title}</text>
            <rect className="rf-view" x="10" y={r.y + 22} width="104" height="50" />
            {shown(r.from, 10).map((c) => (
              <g key={c.n}>
                <path className="rf-ink" d={`M ${c.x + 1} ${r.y + 30} h ${c.w - 2} v 34 h ${-(c.w - 2)} Z`} strokeWidth="1.2" />
                {c.w > 16 && <text className="rf-t" x={c.x + c.w / 2} y={r.y + 50} textAnchor="middle">0{c.n}</text>}
              </g>
            ))}
            {r.lines.map((l, i) => (
              <text key={l} className={!r.ok && i === 3 ? 'rf-t rf-t-acc' : 'rf-t'} x="124" y={r.y + 32 + i * 12}>{l}</text>
            ))}
          </g>
        ))}
      </svg>
    </ScrollDraw>
  );
}
