'use client';

import { ScrollDraw } from 'svg-scroll-draw/react';

type Row = { name: string; detail: string; kb: number; ours?: boolean };

const GSAP_CODE = `import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';

gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin);

gsap.from('#logo path', {
  drawSVG: 0,
  stagger: 0.1,
  ease: 'power1.out',
  scrollTrigger: {
    trigger: '#logo',
    start: 'top 80%',
    end: 'top 30%',
    scrub: true,
  },
});`;

const OURS_CODE = `import { scrollDraw } from 'svg-scroll-draw';

scrollDraw('#logo', {
  stagger: 0.1,
  easing: 'ease-out',
  trigger: { start: 'top 80%', end: 'top 30%' },
});`;

/**
 * The same effect written both ways, then the weight of each as a line the
 * library draws to length. GSAP is the incumbent; the comparison is the code
 * a reader would actually write for this one effect.
 */
export function Versus({ rows, measuredOn }: { rows: Row[]; measuredOn: string }) {
  const max = Math.max(...rows.map((r) => r.kb));
  return (
    <div className="vs">
      <div className="vs-code">
        <figure className="vs-pane">
          <figcaption><span>GSAP · ScrollTrigger · DrawSVG</span><span>17 lines</span></figcaption>
          <pre>{GSAP_CODE}</pre>
        </figure>
        <figure className="vs-pane is-ours">
          <figcaption><span>svg-scroll-draw</span><span>7 lines</span></figcaption>
          <pre>{OURS_CODE}</pre>
        </figure>
      </div>

      <div className="vs-bars">
        {rows.map((r) => (
          <div className={`vs-row ${r.ours ? 'is-ours' : ''}`} key={r.name}>
            <div className="vs-meta">
              <span className="vs-name">{r.name}</span>
              <span className="vs-detail">{r.detail}</span>
            </div>
            <span className="vs-kb">{r.kb.toFixed(1)}<small> KB</small></span>
            <ScrollDraw className="vs-track" trigger={{ start: 'top 92%', end: 'top 60%' }} easing="ease-out" once>
              <svg viewBox="0 0 100 2" preserveAspectRatio="none" aria-hidden="true">
                <line x1="0" y1="1" x2={((r.kb / max) * 100).toFixed(2)} y2="1" />
              </svg>
            </ScrollDraw>
          </div>
        ))}
        <p className="vs-note">
          Minified and gzipped at level 9, measured {measuredOn}. GSAP has been free since 2025 and does far
          more than scroll; for the scroll effects here, this is the difference you ship.
        </p>
      </div>
    </div>
  );
}
