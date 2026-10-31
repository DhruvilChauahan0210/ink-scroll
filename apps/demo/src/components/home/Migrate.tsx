'use client';

import './migrate.css';
import Link from 'next/link';
import { useCallback, useRef, useState, type CSSProperties } from 'react';
import { ScrollDraw } from 'svg-scroll-draw/react';
import { CopyCommand } from './CopyCommand';
import { COMPETITORS, SELF_ENTRIES } from '@/data/competitors';

/**
 * Chapter 08 — switching, said literally: two browser windows, before and
 * after. The only difference is one import line; the page, its markup and its
 * animation are the same in both, and the file is smaller. The window frames
 * are drawn by the library as the section arrives; the mock pages play their
 * entrance together, and replay when you pick another library.
 */

type Key = 'aos' | 'scrollreveal' | 'vivus';
type Lib = {
  key: Key;
  name: string;
  ident: string;
  usage: string;
  attr: string;
  guide: string;
  guideLabel: string;
};

const LIBS: Lib[] = [
  { key: 'aos', name: 'AOS', ident: 'AOS', usage: 'AOS.init()', attr: 'data-aos="fade-up"', guide: '/guides/aos-nextjs', guideLabel: 'AOS in Next.js' },
  { key: 'scrollreveal', name: 'ScrollReveal', ident: 'ScrollReveal', usage: "ScrollReveal().reveal('.tile', { interval: 90 })", attr: 'class="tile"', guide: '/guides/scrollreveal-react', guideLabel: 'ScrollReveal in React' },
  { key: 'vivus', name: 'vivus', ident: 'Vivus', usage: "new Vivus('icon', { duration: 120 })", attr: 'id="icon"', guide: '/guides/vivus-react', guideLabel: 'vivus in React' },
];

const f = (n: number) => n.toFixed(1);
const rr = (x: number, y: number, w: number, h: number, r: number) =>
  `M${f(x + r)} ${f(y)} H${f(x + w - r)} A${r} ${r} 0 0 1 ${f(x + w)} ${f(y + r)} V${f(y + h - r)} A${r} ${r} 0 0 1 ${f(x + w - r)} ${f(y + h)} H${f(x + r)} A${r} ${r} 0 0 1 ${f(x)} ${f(y + h - r)} V${f(y + r)} A${r} ${r} 0 0 1 ${f(x + r)} ${f(y)} Z`;
const ring = (cx: number, cy: number, r: number) =>
  `M${f(cx - r)} ${f(cy)} A${r} ${r} 0 1 0 ${f(cx + r)} ${f(cy)} A${r} ${r} 0 1 0 ${f(cx - r)} ${f(cy)} Z`;

/* ── One browser window (viewBox 0 0 520 360) ──────────────────────────── */

/** The window frame: drawn by the library, so the section inks in as it arrives. */
function Frame() {
  return (
    <>
      <path className="mg-ink mg-w-p" d={rr(1, 1, 518, 358, 14)} />
      <path className="mg-ink mg-w-h" d="M1 40 H519" />
      <path className="mg-ink mg-w-h" d={`${ring(24, 21, 5)} ${ring(42, 21, 5)} ${ring(60, 21, 5)}`} />
      <path className="mg-ink mg-w-h" d={rr(160, 11, 200, 20, 10)} />
    </>
  );
}

/** The page inside the window: the same markup on both sides. */
function Page({ lib }: { lib: Lib }) {
  const heading = (
    <g>
      <path d="M28 76 H230" className="mg-bar mg-bar-l" />
      <path d="M28 96 H170" className="mg-bar" />
    </g>
  );
  if (lib.key === 'aos') {
    return (
      <>
        {heading}
        {[0, 1, 2].map((i) => {
          const x = 28 + i * 158;
          return (
            <g key={i} className="mg-anim mg-up" style={{ '--i': i } as CSSProperties}>
              <path d={rr(x, 128, 146, 196, 10)} className="mg-card" />
              <path d={rr(x + 12, 140, 122, 78, 6)} className="mg-img" />
              <path d={`M${x + 12} 236 H${x + 110} M${x + 12} 252 H${x + 86}`} className="mg-bar" />
              <text x={x + 12} y={300} className="mg-attr">{lib.attr}</text>
            </g>
          );
        })}
      </>
    );
  }
  if (lib.key === 'scrollreveal') {
    return (
      <>
        {heading}
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const x = 28 + (i % 3) * 158;
          const y = 128 + Math.floor(i / 3) * 102;
          return (
            <g key={i} className="mg-anim mg-pop" style={{ '--i': i, transformOrigin: `${x + 73}px ${y + 45}px` } as CSSProperties}>
              <path d={rr(x, y, 146, 90, 10)} className="mg-card" />
              <path d={`M${x + 14} ${y + 26} H${x + 96} M${x + 14} ${y + 42} H${x + 72}`} className="mg-bar" />
              <text x={x + 14} y={y + 72} className="mg-attr">{lib.attr}</text>
            </g>
          );
        })}
      </>
    );
  }
  // vivus: an SVG on the page that draws itself.
  const icon = [
    ring(352, 172, 26),
    'M120 300 L210 170 L262 236 L300 196 L392 300',
    'M196 191 L210 170 L226 192',
    'M90 300 H430',
  ];
  return (
    <>
      {heading}
      <path d={rr(60, 120, 400, 222, 12)} className="mg-card mg-frame-soft" />
      {icon.map((d, i) => (
        <path key={i} d={d} pathLength={1} className={`mg-line${i === 0 ? ' mg-line-sun' : ''}`} style={{ '--i': i } as CSSProperties} />
      ))}
      <text x={76} y={328} className="mg-attr">{lib.attr}</text>
    </>
  );
}

function Window({ lib, side }: { lib: Lib; side: 'before' | 'after' }) {
  const kb = side === 'before' ? COMPETITORS[lib.key].gzipKb : SELF_ENTRIES[lib.key];
  return (
    <figure className={`mg-win mg-win-${side}`}>
      <figcaption className="mg-cap">
        <span className="mg-side">{side === 'before' ? 'Before' : 'After'}</span>
        <code className="mg-imp">
          <span className="mg-k">import</span> {lib.ident} <span className="mg-k">from</span>{' '}
          {side === 'before' ? (
            <span className="mg-pkg">&apos;{lib.key}&apos;</span>
          ) : (
            <mark className="mg-pkg mg-pkg-new">&apos;svg-scroll-draw/{lib.key}&apos;</mark>
          )}
        </code>
      </figcaption>
      <svg className="mg-svg" viewBox="0 0 520 360" role="img"
        aria-label={`${side === 'before' ? lib.name : `svg-scroll-draw/${lib.key}`}: the same page and the same animation`}>
        <Frame />
        <text x="260" y="25" textAnchor="middle" className="mg-url">your-site.com</text>
        <g key={lib.key}>
          <Page lib={lib} />
        </g>
      </svg>
      <div className={`mg-size mg-size-${side}`}>
        <span className="mg-size-kb">{kb.toFixed(1)} KB</span>
        <span className="mg-size-track"><i style={{ '--w': (kb / COMPETITORS[lib.key].gzipKb).toFixed(3) } as CSSProperties} /></span>
        <span className="mg-size-note">{side === 'before' ? `${lib.name} ${COMPETITORS[lib.key].version} · gzip` : 'drop-in · gzip'}</span>
      </div>
    </figure>
  );
}

export function Migrate() {
  const [active, setActive] = useState(0);
  const lib = LIBS[active];
  const stage = useRef<HTMLDivElement>(null);

  // The pages play their entrance once the frames are mostly inked — read
  // from the library's own progress, so it cannot miss. The attribute stays,
  // and a new tab remounts the pages, which replays the entrance.
  const onProgress = useCallback((p: number) => {
    if (p > 0.55) stage.current?.setAttribute('data-play', '');
  }, []);

  const oldKb = COMPETITORS[lib.key].gzipKb;
  const newKb = SELF_ENTRIES[lib.key];

  return (
    <div className="mg-stage">
      <header className="mg-head">
        <div>
          <p className="mg-kicker">08 / switching</p>
          <h2 id="mg-title" className="mg-title">Already on AOS? Change one import.</h2>
        </div>
        <p className="mg-body">
          Your markup and your calls stay exactly as they are. Only the import changes — and the page does the
          same thing, in fewer bytes.
        </p>
      </header>

      <div className="mg-tabs" role="tablist" aria-label="Library you use today">
        {LIBS.map((l, i) => (
          <button key={l.key} type="button" role="tab" aria-selected={i === active} className="mg-tab" onClick={() => setActive(i)}>
            {l.name} <small>{COMPETITORS[l.key].version}</small>
          </button>
        ))}
      </div>

      <ScrollDraw
        className="mg-pair"
        selector=".mg-ink"
        trigger={{ start: 'top 95%', end: 'top 60%' }}
        stagger={0.04}
        easing="ease-out"
        onProgress={onProgress}
      >
        <div ref={stage} className="mg-pair-in">
          <Window lib={lib} side="before" />
          <div className="mg-eq" aria-hidden="true"><span>=</span><small>same page</small></div>
          <Window lib={lib} side="after" />
        </div>
      </ScrollDraw>

      <div className="mg-foot">
        <p className="mg-summary">
          <code>{lib.usage}</code> keeps working. {oldKb.toFixed(1)} KB → <b>{newKb.toFixed(1)} KB</b>, matched against
          the original in Chromium, Firefox and WebKit.
        </p>
        <div className="mg-actions">
          <Link href={lib.guide} className="mg-link">{lib.guideLabel} guide <span aria-hidden="true">→</span></Link>
          <CopyCommand command="npx svg-scroll-draw migrate" />
        </div>
      </div>
    </div>
  );
}
