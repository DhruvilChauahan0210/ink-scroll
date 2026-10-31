'use client';

import './ui-b.css';
import { useEffect, useRef, type CSSProperties } from 'react';

/**
 * The product-page scrub, drawn as a blueprint: a phone inks itself in, its
 * screen and home screen come up, then dimensions and numbered callouts land
 * on its real parts. Scroll position is the playhead, as with scrollVideo on
 * a <video>: the preview stands 180 frames of drawing in for the footage and
 * says which frame it is on. Progress is written to CSS custom properties on
 * every scroll tick; the stylesheet turns them into stroke offsets.
 */

const TOTAL_FRAMES = 180;
const DURATION_S = 9;

const f = (n: number) => n.toFixed(1);
const rr = (x: number, y: number, w: number, h: number, r: number) =>
  `M${f(x + r)} ${f(y)} H${f(x + w - r)} A${r} ${r} 0 0 1 ${f(x + w)} ${f(y + r)} V${f(y + h - r)} A${r} ${r} 0 0 1 ${f(x + w - r)} ${f(y + h)} H${f(x + r)} A${r} ${r} 0 0 1 ${f(x)} ${f(y + h - r)} V${f(y + r)} A${r} ${r} 0 0 1 ${f(x + r)} ${f(y)} Z`;
const ring = (cx: number, cy: number, r: number) =>
  `M${f(cx - r)} ${f(cy)} A${r} ${r} 0 1 0 ${f(cx + r)} ${f(cy)} A${r} ${r} 0 1 0 ${f(cx - r)} ${f(cy)} Z`;

/* The home screen: a widget, three rows of apps, the dock. Order = the order they come up. */
const COLS = [103.5, 123.5, 143.5, 163.5];
const APPS = [98, 119, 140].flatMap((y) => COLS.map((x) => ({ x, y })));
const DOCK = COLS.map((x) => ({ x, y: 186 }));

/* Numbered callouts: the part's point, the leader's elbow, the balloon. */
const CALLOUTS = [
  { at: [148.5, 41.5], elbow: [214, 18], y: 18 },
  { at: [190.6, 91], elbow: [214, 76], y: 76 },
  { at: [160, 136], elbow: [214, 134], y: 134 },
  { at: [152, 207], elbow: [214, 192], y: 192 },
];

const PARTS = [
  { name: 'Front camera', spec: '12 MP · in the island' },
  { name: 'Side button', spec: 'lock · wake' },
  { name: 'Display', spec: '6.1 in · 460 ppi' },
  { name: 'Gesture bar', spec: 'home · switch apps' },
];

const vars = (o: Record<string, string | number>) => o as CSSProperties;

export function VideoScrubDemo() {
  const wrapRef  = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLSpanElement>(null);
  const timeRef  = useRef<HTMLSpanElement>(null);
  const tcRef    = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    // ── helpers ────────────────────────────────────────────────────────────
    const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
    const ease  = (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);
    // scene(progress, rangeStart, rangeEnd) → 0..1 within that range
    const sc = (p: number, a: number, b: number) => ease(clamp((p - a) / (b - a), 0, 1));
    const tc = (s: number) => `00:${s.toFixed(1).padStart(4, '0')}`;
    let lastFrame = -1;

    // ── render — called every scroll tick ─────────────────────────────────
    // 0.00–0.20  outline inks in
    // 0.15–0.45  screen, island and status bar come up
    // 0.35–0.65  home screen renders, app by app
    // 0.50–0.80  dimensions are drawn
    // 0.70–1.00  callouts land on their parts
    const render = (p: number) => {
      const p3 = sc(p, 0.35, 0.65);
      const p5 = sc(p, 0.70, 1.00);
      const s = wrap.style;
      s.setProperty('--p', p.toFixed(4));
      s.setProperty('--p1', sc(p, 0.00, 0.20).toFixed(4));
      s.setProperty('--p2', sc(p, 0.15, 0.45).toFixed(4));
      s.setProperty('--g', Math.max(0, (p3 - 0.15) / 0.85).toFixed(4));
      s.setProperty('--p4', sc(p, 0.50, 0.80).toFixed(4));
      CALLOUTS.forEach((_, k) => s.setProperty(`--c${k + 1}`, clamp((p5 - k * 0.18) / 0.46, 0, 1).toFixed(4)));

      const frame = Math.round(p * TOTAL_FRAMES);
      if (frame !== lastFrame) {
        lastFrame = frame;
        const secs = p * DURATION_S;
        if (frameRef.current) frameRef.current.textContent = `frame ${frame} / ${TOTAL_FRAMES}`;
        if (timeRef.current) timeRef.current.textContent = `${secs.toFixed(1)} s`;
        if (tcRef.current) tcRef.current.textContent = tc(secs);
      }
    };

    // ── drive render from scroll ──────────────────────────────────────────
    const onScroll = () => {
      const rect  = wrap.getBoundingClientRect();
      const vh    = window.innerHeight;
      const start = vh * 0.85, end = vh * 0.18;
      render(clamp((start - rect.top) / (start - end), 0, 1));
    };

    render(0);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div ref={wrapRef} className="xb-vd">
      <div className="xb-vd-bar">
        <span className="xb-label">{TOTAL_FRAMES} frames · scroll is the playhead</span>
        <span className="xb-vd-tc"><span ref={tcRef}>00:00.0</span> / {`00:0${DURATION_S}.0`}</span>
      </div>

      <div className="xb-vd-stage">
        <svg className="xb-vd-svg" viewBox="46 6 212 258" role="img"
          aria-label="Blueprint of a phone, front view, drawn as you scroll: outline, screen, home screen, dimensions, then four numbered callouts">
          {/* Outline and buttons */}
          <g className="xb-vd-k1">
            <path className="xb-vd-d xb-vd-w-p" pathLength={1} d={rr(92, 24, 96, 196, 16)} />
            <path className="xb-vd-d xb-vd-w-s" pathLength={1} d="M188 74 H190.6 V108 H188" />
            <path className="xb-vd-d xb-vd-w-s" pathLength={1} d="M92 58 H89.4 V70 H92" />
            <path className="xb-vd-d xb-vd-w-s" pathLength={1} d="M92 82 H89.4 V100 H92" />
            <path className="xb-vd-d xb-vd-w-s" pathLength={1} d="M92 106 H89.4 V124 H92" />
          </g>

          {/* Screen, island, camera */}
          <g className="xb-vd-k2">
            <path className="xb-vd-d xb-vd-w-s" pathLength={1} d={rr(98, 30, 84, 184, 11)} />
            <path className="xb-vd-d xb-vd-w-s" pathLength={1} d={rr(126, 37, 28, 9, 4.5)} />
            <path className="xb-vd-d xb-vd-w-h" pathLength={1} d={ring(148.5, 41.5, 1.9)} />
          </g>
          <g className="xb-vd-fade2">
            <path className="xb-vd-w-h" d="M104 41.5 H114" />
            <path className="xb-vd-w-h" d={`${rr(163, 39, 10, 5, 1.2)} M174.6 40.6 V42.4`} />
            <path className="xb-vd-w-h" d="M104 180 H176" />
            <path className="xb-vd-w-s" d="M128 207 H152" />
          </g>

          {/* Home screen, app by app */}
          <g className="xb-vd-app" style={vars({ '--i': 0 })}>
            <path className="xb-vd-w-h" d={rr(103.5, 56, 73, 34, 5)} />
            <path className="xb-vd-w-h" d="M110 63 H128" />
            <path className="xb-vd-w-s" d="M110 83 L118 77 L126 80 L134 71 L142 74 L150 67 L158 70 L169 63" />
          </g>
          {[...APPS, ...DOCK].map(({ x, y }, i) => (
            <path key={`${x}-${y}`} className="xb-vd-app xb-vd-w-h" style={vars({ '--i': i + 1 })} d={rr(x, y, 13, 13, 3.5)} />
          ))}

          {/* Dimensions */}
          <g className="xb-vd-k4">
            <path className="xb-vd-d xb-vd-w-d" pathLength={1} style={vars({ '--d': 0 })} d="M86 24 H58" />
            <path className="xb-vd-d xb-vd-w-d" pathLength={1} style={vars({ '--d': 0 })} d="M86 220 H58" />
            <path className="xb-vd-d xb-vd-w-d" pathLength={1} style={vars({ '--d': 1 })} d="M64 24 V220" />
            <path className="xb-vd-d xb-vd-w-d" pathLength={1} style={vars({ '--d': 2 })} d="M61.5 30.5 L64 24 L66.5 30.5" />
            <path className="xb-vd-d xb-vd-w-d" pathLength={1} style={vars({ '--d': 2 })} d="M61.5 213.5 L64 220 L66.5 213.5" />
            <path className="xb-vd-d xb-vd-w-d" pathLength={1} style={vars({ '--d': 0 })} d="M92 226 V250" />
            <path className="xb-vd-d xb-vd-w-d" pathLength={1} style={vars({ '--d': 0 })} d="M188 226 V250" />
            <path className="xb-vd-d xb-vd-w-d" pathLength={1} style={vars({ '--d': 1 })} d="M92 244 H188" />
            <path className="xb-vd-d xb-vd-w-d" pathLength={1} style={vars({ '--d': 2 })} d="M98.5 241.5 L92 244 L98.5 246.5" />
            <path className="xb-vd-d xb-vd-w-d" pathLength={1} style={vars({ '--d': 2 })} d="M181.5 241.5 L188 244 L181.5 246.5" />
            <text className="xb-vd-dim" x="56" y="122" textAnchor="middle" transform="rotate(-90 56 122)">146.6</text>
            <text className="xb-vd-dim" x="140" y="259" textAnchor="middle">71.5</text>
          </g>

          {/* Callouts */}
          {CALLOUTS.map((c, k) => (
            <g key={k} className="xb-vd-call" style={vars({ '--k': `var(--c${k + 1})` })}>
              <path className="xb-vd-d xb-vd-w-l" pathLength={1}
                d={`M${c.at[0]} ${c.at[1]} L${c.elbow[0]} ${c.elbow[1]} H235`} />
              <circle className="xb-vd-pt" cx={c.at[0]} cy={c.at[1]} r="1.7" />
              <g className="xb-vd-balloon">
                <path className="xb-vd-w-s" d={ring(244, c.y, 9)} />
                <text className="xb-vd-bn" x="244" y={c.y + 3.3} textAnchor="middle">{k + 1}</text>
              </g>
            </g>
          ))}
        </svg>

        <div className="xb-vd-legend">
          <div className="xb-vd-legend-head">
            <span className="xb-label">Callouts</span>
            <span className="xb-label">dims in mm</span>
          </div>
          <ol className="xb-vd-parts">
            {PARTS.map((pt, k) => (
              <li key={pt.name} style={vars({ '--k': `var(--c${k + 1})` })}>
                <span className="xb-vd-pb">{k + 1}</span>
                <span className="xb-vd-pn">{pt.name}</span>
                <span className="xb-vd-ps">{pt.spec}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="xb-vd-scrub">
        <div className="xb-vd-track" aria-hidden="true"><i className="xb-vd-fill" /><i className="xb-vd-head" /></div>
        <div className="xb-vd-ruler" aria-hidden="true">
          {Array.from({ length: DURATION_S + 1 }, (_, i) => <i key={i} />)}
        </div>
        <div className="xb-vd-read">
          <span ref={timeRef}>0.0 s</span>
          <span ref={frameRef}>{`frame 0 / ${TOTAL_FRAMES}`}</span>
        </div>
      </div>
    </div>
  );
}
