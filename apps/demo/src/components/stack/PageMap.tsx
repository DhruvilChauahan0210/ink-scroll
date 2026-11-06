'use client';

import { useSyncExternalStore, type CSSProperties } from 'react';
import { ScrollDraw } from 'svg-scroll-draw/react';

/**
 * The React page's opening drawing: the page the quick start builds, drawn as
 * a wireframe in a browser, with a balloon on each part pointing at the step
 * that animates it — an assembly drawing with its parts list underneath. The
 * wireframe and the leaders are inked by the library on load.
 */

type Part = { n: number; api: string; what: string; file: string; href: string; y: number; from: string };

/** Balloons sit outside the frame, on the right; each leader runs from its part. */
const BX = 590;
const PARTS: Part[] = [
  { n: 5, api: 'ScrollText', what: 'the headline, word by word', file: 'Headline.tsx', href: '#qs-5', y: 74, from: 'M398 74' },
  { n: 2, api: 'ScrollAnimate', what: 'the hero, faded up 40px', file: 'HeroSection.tsx', href: '#qs-2', y: 118, from: 'M300 118' },
  { n: 4, api: 'ScrollCounter', what: 'the stat, counted up', file: 'StatsSection.tsx', href: '#qs-4', y: 194, from: 'M162 194' },
  { n: 3, api: 'scrollPin', what: 'the product shot, held in place', file: 'ProductSection.tsx', href: '#qs-3', y: 244, from: 'M236 262 L254 244' },
  { n: 1, api: 'scrollReveal', what: 'the feature cards, staggered', file: 'FeaturesSection.tsx', href: '#qs-1', y: 322, from: 'M512 322' },
];
const LIST = [...PARTS].sort((a, b) => a.n - b.n);

const rect = (x: number, y: number, w: number, h: number) => `M${x} ${y} H${x + w} V${y + h} H${x} Z`;
const pill = (x: number, y: number, w: number, h: number) => {
  const r = h / 2;
  return `M${x + r} ${y} H${x + w - r} A${r} ${r} 0 0 1 ${x + w - r} ${y + h} H${x + r} A${r} ${r} 0 0 1 ${x + r} ${y} Z`;
};
const dot = (cx: number, cy: number, r: number) => `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${r * 2} 0 a${r} ${r} 0 1 0 ${-r * 2} 0`;

const HEADLINE = ['Animate', 'everything', 'on', 'scroll.'];
const noopSubscribe = () => () => {};

export function PageMap() {
  const ready = useSyncExternalStore(noopSubscribe, () => true, () => false);
  return (
    <figure className={`stk-fig pm${ready ? ' is-ready' : ''}`}>
      <div className="pm-sheet">
        {/* Pencil: the ghost positions each part animates from. */}
        <svg className="pm-pencil" viewBox="0 0 620 432" aria-hidden="true">
          <path d={pill(30, 144, 104, 28)} />
          <path d={rect(148, 154, 150, 8)} />
          <path d="M32 252 L248 410 M248 252 L32 410" />
        </svg>

        <ScrollDraw className="pm-draw" selector=".pm-ink" autoplay duration={650} delay={200} stagger={0.035} easing="ease-out" once>
          <svg viewBox="0 0 620 432" role="group" aria-label="A landing page wireframe: headline, hero, a stat, a pinned product shot and three feature cards, each numbered to the quick-start step that animates it">
            {/* The browser */}
            <path d={rect(0.5, 0.5, 540, 431)} className="pm-ink" stroke="currentColor" />
            <path d="M0.5 28 H540.5" className="pm-ink pm-thin" stroke="currentColor" />
            <path d={dot(16, 14, 3)} className="pm-ink pm-thin" stroke="currentColor" />
            <path d={dot(28, 14, 3)} className="pm-ink pm-thin" stroke="currentColor" />
            <path d={dot(40, 14, 3)} className="pm-ink pm-thin" stroke="currentColor" />
            <text x="62" y="18" className="pm-url" style={{ '--i': 0 } as CSSProperties}>localhost:3000</text>

            {/* 5 — the headline, split into words */}
            <text x="30" y="84" className="pm-h1">
              {HEADLINE.map((w, i) => (
                <tspan key={w} className="pm-word" style={{ '--i': i } as CSSProperties}>{w}{i < HEADLINE.length - 1 ? ' ' : ''}</tspan>
              ))}
            </text>

            {/* 2 — the hero, 40px below where it lands */}
            <path d={pill(30, 104, 104, 28)} className="pm-ink" stroke="currentColor" />
            <path d={rect(148, 114, 150, 8)} className="pm-ink pm-thin" stroke="currentColor" />
            <path d="M320 172 V132 M315.5 137 L320 131.5 L324.5 137" className="pm-ink pm-acc" stroke="currentColor" />
            <text x="330" y="157" className="pm-note" style={{ '--i': 2 } as CSSProperties}>40px</text>

            {/* 4 — the stat, counting */}
            <text x="30" y="205" className="pm-stat" style={{ '--i': 3 } as CSSProperties}>50,000+</text>
            <path d={rect(30, 213, 72, 5)} className="pm-ink pm-thin" stroke="currentColor" />
            <text x="112" y="219" className="pm-note" style={{ '--i': 4 } as CSSProperties}>counts 0 → 50,000</text>

            <path d="M30 234 H510" className="pm-ink pm-thin" stroke="currentColor" />

            {/* 3 — the product shot, pinned */}
            <path d={rect(32, 252, 216, 158)} className="pm-ink" stroke="currentColor" />
            <path d={`${dot(140, 252, 5)} M140 257 V270`} className="pm-ink pm-acc" stroke="currentColor" />
            <text x="44" y="400" className="pm-note" style={{ '--i': 5 } as CSSProperties}>pinned · top 80</text>

            {/* 1 — the feature cards, one after another */}
            {[252, 302, 352].map((y) => (
              <g key={y}>
                <path d={rect(282, y, 228, 40)} className="pm-ink" stroke="currentColor" />
                <path d={`M296 ${y + 14} H392 M296 ${y + 26} H470`} className="pm-ink pm-thin" stroke="currentColor" />
              </g>
            ))}
            <text x="282" y="412" className="pm-note" style={{ '--i': 6 } as CSSProperties}>stagger 0.1</text>

            {/* Leaders and balloons */}
            {PARTS.map((p) => (
              <g key={p.n}>
                <path d={`${p.from} H${BX - 13}`} className="pm-ink pm-lead" stroke="currentColor" />
                <path d={dot(BX, p.y, 12)} className="pm-ink pm-lead" stroke="currentColor" />
                <a href={p.href} className="pm-ball" aria-label={`Step ${p.n}: ${p.api}`}>
                  <text x={BX} y={p.y + 4.5} textAnchor="middle" style={{ '--i': p.n } as CSSProperties}>{p.n}</text>
                </a>
              </g>
            ))}
            {PARTS.map((p) => {
              const [x, y] = p.from.slice(1).split(' ').map(Number);
              return <path key={`d${p.n}`} d={dot(x, y, 2.4)} className="pm-dot" />;
            })}
          </svg>
        </ScrollDraw>
      </div>

      <ol className="pm-parts" aria-label="Parts list">
        <li className="pm-parts-h" aria-hidden="true"><span>no.</span><span>Api</span><span>animates</span><span>file</span></li>
        {LIST.map((p) => (
          <li key={p.n}>
            <a href={p.href}>
              <span className="pm-parts-n">{p.n}</span>
              <code>{p.api}</code>
              <span className="pm-parts-w">{p.what}</span>
              <span className="pm-parts-f">{p.file}</span>
            </a>
          </li>
        ))}
      </ol>
      <figcaption className="stk-cap">Fig. 1 — the page the quick start builds, one balloon per step</figcaption>
    </figure>
  );
}
