'use client';

import { ScrollDraw } from 'svg-scroll-draw/react';

/**
 * The hero's sheet of paper, drawn by the library itself: `autoplay` draws it
 * once on load, staggered path by path. Reduced motion shows it fully drawn.
 */
export function HeroInk() {
  return (
    <div className="sheet" aria-hidden="true">
      <div className="sheet-bar">
        <div className="dots"><i /><i /><i /></div>
        <span className="eyebrow">hero.svg</span>
      </div>
      <ScrollDraw className="sheet-svg" autoplay duration={2600} stagger={0.12} easing="ease-out">
        <svg viewBox="0 0 500 380" fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* ruled guide lines */}
          <path className="stroke-faint" strokeWidth="1" d="M40 300 H460" />
          <path className="stroke-faint" strokeWidth="1" d="M40 250 H460" />
          {/* the signature stroke */}
          <path
            className="stroke-accent"
            strokeWidth="5"
            d="M48 214 C 78 120, 120 92, 136 132 C 150 168, 102 238, 118 246 C 134 254, 166 160, 196 150 C 222 142, 214 210, 236 214 C 262 218, 274 150, 300 148 C 330 146, 318 214, 346 218 C 372 222, 392 160, 420 132 C 436 116, 452 112, 462 118"
          />
          {/* geometry, in ink */}
          <path className="stroke-ink" strokeWidth="2" d="M378 70 a 34 34 0 1 1 -0.1 0" />
          <path className="stroke-ink" strokeWidth="2" d="M60 70 L 120 70 L 120 110" />
          <path className="stroke-ink" strokeWidth="2" d="M200 300 Q 250 262 300 300 T 400 300" />
        </svg>
      </ScrollDraw>
      <div className="snippet">
        <span className="k">import</span> {'{ scrollDraw }'} <span className="k">from</span> <span className="s">&apos;svg-scroll-draw&apos;</span>;<br />
        <br />
        scrollDraw(<span className="s">&apos;#hero&apos;</span>, {'{ '}easing: <span className="s">&apos;ease-out&apos;</span>{' }'});
        <br />
        <span className="c">{'// that is the whole setup'}</span>
      </div>
    </div>
  );
}
