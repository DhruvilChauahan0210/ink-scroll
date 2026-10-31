'use client';

import { useSyncExternalStore } from 'react';
import { ScrollDraw } from 'svg-scroll-draw/react';

/**
 * The docs' opening drawing: one real `scrollDraw()` call, set in type, with a
 * leader from each part to the section that documents it. The leaders are
 * inked by the library on load over a pencil underdrawing; each label is a
 * link into the page.
 */

const CH = 9; // Geist Mono at 15px: 0.6em a character.
const X0 = 24;
const LABEL_X = 404;
const LINES: { code: string; y: number; note?: { k: string; v: string; href: string } }[] = [
  { code: "scrollDraw('#logo', {", y: 64, note: { k: 'the target', v: 'any SVG or its container', href: '#quick-start' } },
  { code: '  speed: 1.2,', y: 108, note: { k: 'core options', v: 'how much scroll it takes', href: '#core-options' } },
  { code: "  trigger: { start: 'top 85%' },", y: 152, note: { k: 'trigger', v: 'when the draw begins', href: '#trigger' } },
  { code: "  strokeColor: ['#ccc', '#e33'],", y: 196, note: { k: 'visual', v: 'colour, width, fill, clip', href: '#visual' } },
  { code: '  onComplete: () => {},', y: 240, note: { k: 'callbacks', v: 'start, progress, complete', href: '#callbacks' } },
  { code: '});', y: 284, note: { k: 'returns', v: 'pause, seek, replay, destroy', href: '#instance-methods' } },
];

const f = (n: number) => n.toFixed(1);
/** Leader from the end of a code line to its label: out, then an elbow to the label's baseline. */
function leader(code: string, y: number): string {
  const x1 = X0 + code.length * CH + 12;
  const xe = LABEL_X - 34;
  return `M${f(x1)} ${f(y - 5)} H${f(xe)} L${f(LABEL_X - 12)} ${f(y - 5)}`;
}

const noopSubscribe = () => () => {};

export function DocsAnatomy() {
  const ready = useSyncExternalStore(noopSubscribe, () => true, () => false);
  return (
    <figure className={`an${ready ? ' is-ready' : ''}`} aria-label="Anatomy of a scrollDraw() call, with links to each part's section">
      <svg className="an-pencil" viewBox="0 0 640 330" aria-hidden="true">
        <path d="M8 22 H632 M8 316 H632" className="an-frame" />
        <path d={`M${LABEL_X - 34} 30 V300`} className="an-frame" />
        {LINES.map((l) => l.note && <path key={l.y} d={leader(l.code, l.y)} />)}
      </svg>
      <ScrollDraw className="an-draw" selector=".an-ink" autoplay duration={900} delay={300} stagger={0.12} easing="ease-out" once>
        <svg viewBox="0 0 640 330">
          {LINES.map((l, i) => (
            <g key={l.y} style={{ '--i': i } as React.CSSProperties}>
              <text x={X0} y={l.y} className="an-code" xmlSpace="preserve">{l.code}</text>
              {l.note && (
                <>
                  <path d={leader(l.code, l.y)} className="an-ink" stroke="currentColor" />
                  <circle cx={f(X0 + l.code.length * CH + 12)} cy={f(l.y - 5)} r="2.6" className="an-dot" />
                  <a href={l.note.href} className="an-link">
                    <text x={LABEL_X} y={l.y - 8} className="an-k">{l.note.k}</text>
                    <text x={LABEL_X} y={l.y + 9} className="an-v">{l.note.v} →</text>
                  </a>
                </>
              )}
            </g>
          ))}
        </svg>
      </ScrollDraw>
      <figcaption className="an-cap">fig. 1 — one call, and where each part is documented</figcaption>
    </figure>
  );
}
