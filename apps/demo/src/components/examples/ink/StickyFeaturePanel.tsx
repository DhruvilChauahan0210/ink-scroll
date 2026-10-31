'use client';

import './ui-b.css';
import { useEffect, useRef, useState } from 'react';

/**
 * The product walkthrough: a camera, drawn in ink, stays pinned while its
 * features scroll past, and the part each one describes is marked in the
 * accent. The preview pins with CSS `position: sticky` inside its own scroll
 * area (scrollPin pins with position: fixed, which would escape the plate);
 * the pill and the callback line report the same lifecycle scrollPin fires.
 */

type Stage = 'before' | 'pinned' | 'after';

const STAGE_LABEL: Record<Stage, string> = { before: 'Before', pinned: 'Pinned', after: 'Released' };

/** Which scrollPin callback a change of stage corresponds to. */
const CALLBACK: Record<string, string> = {
  'before>pinned': 'onEnter',
  'pinned>after': 'onLeave',
  'after>pinned': 'onEnterBack',
  'pinned>before': 'onLeaveBack',
  'before>after': 'onLeave',
  'after>before': 'onLeaveBack',
};

const FEATURES = [
  { part: 'Lens', title: 'A lens that sees in the dark.', body: '35 mm at f/1.4, sharp from edge to edge wide open.' },
  { part: 'Shutter', title: 'A shutter you won’t hear.', body: 'Silent electronic shutter, up to 1/16000 s.' },
  { part: 'Battery', title: 'A battery for the whole trip.', body: 'Around 600 frames a charge, topped up over USB-C.' },
];

const SPECS = [
  ['Sensor', '24 MP, full frame'],
  ['Lens', '35 mm, f/1.4'],
  ['Shutter', 'to 1/16000 s, silent'],
  ['Battery', '~600 frames, USB-C'],
  ['Weight', '482 g with battery'],
];

const f = (n: number) => n.toFixed(1);
const ring = (cx: number, cy: number, r: number) =>
  `M${f(cx - r)} ${f(cy)} A${r} ${r} 0 1 0 ${f(cx + r)} ${f(cy)} A${r} ${r} 0 1 0 ${f(cx - r)} ${f(cy)} Z`;
const rr = (x: number, y: number, w: number, h: number, r: number) =>
  `M${f(x + r)} ${f(y)} H${f(x + w - r)} A${r} ${r} 0 0 1 ${f(x + w)} ${f(y + r)} V${f(y + h - r)} A${r} ${r} 0 0 1 ${f(x + w - r)} ${f(y + h)} H${f(x + r)} A${r} ${r} 0 0 1 ${f(x)} ${f(y + h - r)} V${f(y + r)} A${r} ${r} 0 0 1 ${f(x + r)} ${f(y)} Z`;

/* The focus ring's knurling: short radial ticks between r 25.5 and 29. */
const KNURL = Array.from({ length: 28 }, (_, i) => {
  const a = (i / 28) * Math.PI * 2;
  const c = Math.cos(a), s = Math.sin(a);
  return `M${f(100 + c * 25.5)} ${f(80 + s * 25.5)} L${f(100 + c * 29)} ${f(80 + s * 29)}`;
}).join(' ');

function Camera({ part }: { part: number }) {
  return (
    <svg className="xb-pin-svg" data-part={part} viewBox="0 0 200 140" role="img"
      aria-label="Line drawing of a camera, front view; the part the current feature describes is marked">
      {/* Body, prism hump, hot shoe, strap lugs */}
      <path className="xb-ink xb-ink-p" d="M20 46 A6 6 0 0 1 26 40 H76 L84 24 H116 L124 40 H174 A6 6 0 0 1 180 46 V112 A6 6 0 0 1 174 118 H26 A6 6 0 0 1 20 112 Z" />
      <path className="xb-ink xb-ink-s" d="M92 24 V20 H108 V24" />
      <path className="xb-ink xb-ink-s" d="M20 50 H16 V58 H20 M180 50 H184 V58 H180" />
      {/* Mode dial, left */}
      <path className="xb-ink xb-ink-s" d="M32 40 V35 H52 V40" />
      {/* Grip edge and self-timer lamp */}
      <path className="xb-ink xb-ink-h" d="M152 40 C146.5 62 146.5 96 152 118" />
      <path className="xb-ink xb-ink-h" d={ring(138, 52, 2.5)} />

      {/* 01 — the lens */}
      <g className="xb-pin-part xb-pin-p0">
        <path className="xb-ink xb-ink-p" d={ring(100, 80, 30)} />
        <path className="xb-ink xb-ink-s" d={ring(100, 80, 24)} />
        <path className="xb-ink xb-ink-h" d={KNURL} />
        <path className="xb-ink xb-ink-s" d={ring(100, 80, 15)} />
        <path className="xb-ink xb-ink-h" d={ring(100, 80, 7)} />
        <path className="xb-ink xb-ink-h" d="M92.5 75 A9.5 9.5 0 0 1 99 70.6" />
      </g>

      {/* 02 — shutter release and command dial, top right */}
      <g className="xb-pin-part xb-pin-p1">
        <path className="xb-ink xb-ink-s" d="M134 40 V34 H154 V40" />
        <path className="xb-ink xb-ink-s" d="M138 34 V40 M142 34 V40 M146 34 V40 M150 34 V40" />
        <path className="xb-ink xb-ink-p" d="M160 40 V35.5 H170 V40 M161.5 35.5 V33 H168.5 V35.5" />
      </g>

      {/* 03 — the battery, hidden inside the grip (dashed: a hidden line) */}
      <g className="xb-pin-part xb-pin-p2">
        <path className="xb-ink xb-ink-s xb-ink-hidden" d={rr(156, 52, 18, 54, 2)} />
        <path className="xb-ink xb-ink-s" d="M180 90 V100" />
      </g>
    </svg>
  );
}

export function StickyFeaturePanel() {
  const rootRef  = useRef<HTMLDivElement>(null);
  const wrapRef  = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const listRef  = useRef<HTMLOListElement>(null);
  const pctRef   = useRef<HTMLSpanElement>(null);
  const [stage, setStage]   = useState<Stage>('before');
  const [active, setActive] = useState(0);
  const [last, setLast]     = useState<string | null>(null);

  // CSS sticky does the pinning; a scroll listener on the preview's own
  // scroll area reads where the panel is and reports it.
  useEffect(() => {
    const root = rootRef.current, wrap = wrapRef.current, track = trackRef.current;
    const panel = panelRef.current, list = listRef.current;
    if (!root || !wrap || !track || !panel || !list) return;
    let prev: Stage = 'before';

    const onScroll = () => {
      const s = wrap.scrollTop;
      const top = track.offsetTop;
      const end = top + track.offsetHeight - panel.offsetHeight;
      const next: Stage = s < top - 0.5 ? 'before' : s > end + 0.5 ? 'after' : 'pinned';
      if (next !== prev) {
        setLast(CALLBACK[`${prev}>${next}`] ?? null);
        setStage(next);
        prev = next;
      }

      // onProgress: 0 where the pin starts, 1 where it lets go.
      const p = Math.min(1, Math.max(0, (s - top) / Math.max(1, end - top)));
      root.style.setProperty('--xb-pin-p', p.toFixed(3));
      if (pctRef.current) pctRef.current.textContent = p.toFixed(2);

      // The feature under the middle of what is visible beside (or below) the panel.
      const beside = list.offsetLeft > 0;
      const view = wrap.clientHeight;
      const line = beside ? s + view / 2 : s + panel.offsetHeight + (view - panel.offsetHeight) / 2;
      let a = 0;
      Array.from(list.children).forEach((el, i) => {
        if ((el as HTMLElement).offsetTop <= line) a = i;
      });
      setActive(a);
    };

    wrap.addEventListener('scroll', onScroll, { passive: true });
    return () => wrap.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div ref={rootRef} className="xb-pin">
      <div className="xb-pin-chrome" data-stage={stage}>
        <span className="xb-pin-dots" aria-hidden="true"><i /><i /><i /></span>
        <span className="xb-pin-url" aria-hidden="true">camera.example/overview</span>
        <span className="xb-pin-state" aria-live="polite">{STAGE_LABEL[stage]}</span>
      </div>

      <div ref={wrapRef} className="xb-pin-scroll" tabIndex={0} aria-label="Product walkthrough, scrollable">
        <div className="xb-pin-intro">
          <span className="xb-label">Overview</span>
          <span className="xb-pin-hint" aria-hidden="true">scroll inside ↓</span>
          <span className="xb-pin-lede">Small enough to carry everywhere.</span>
        </div>

        <div ref={trackRef} className="xb-pin-track">
          <aside ref={panelRef} className="xb-pin-panel">
            <div className="xb-pin-meta">
              <span className="xb-label xb-pin-part-name">{FEATURES[active].part}</span>
              <span className="xb-pin-count">
                <b>{String(active + 1).padStart(2, '0')}</b> / {String(FEATURES.length).padStart(2, '0')}
              </span>
            </div>
            <div className="xb-pin-art">
              <Camera part={active} />
            </div>
            <div className="xb-pin-foot">
              <span className="xb-pin-cb">
                {last ? <><span className="xb-pin-cb-k">last</span> {last}()</> : <span className="xb-pin-cb-k">no callback yet</span>}
              </span>
              <span className="xb-pin-prog">
                <span className="xb-pin-rule" aria-hidden="true"><i /></span>
                <span ref={pctRef} className="xb-pin-pct">0.00</span>
              </span>
            </div>
          </aside>

          <ol ref={listRef} className="xb-pin-list">
            {FEATURES.map((ft, i) => (
              <li key={ft.title} className={`xb-pin-feat${i === active ? ' is-on' : ''}`}>
                <span className="xb-pin-fn">{String(i + 1).padStart(2, '0')}</span>
                <span className="xb-pin-ft">{ft.title}</span>
                <span className="xb-pin-fb">{ft.body}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* What follows the pinned section: once it scrolls up, the panel lets go. */}
        <div className="xb-pin-outro">
          <span className="xb-label">Next</span>
          <span className="xb-pin-lede">Tech specs</span>
          <dl className="xb-pin-specs">
            {SPECS.map(([k, v]) => (
              <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
