'use client';

import './frames.css';
import './logo-reveal.css';
import { useState } from 'react';
import { ScrollDraw } from 'svg-scroll-draw/react';
import { Browser } from './frames';

/* Ferrow — a small-lot coffee roaster's launch page. The emblem inks itself
   in as the page scrolls; onComplete floods it with the brand colours. */

const ring = (r: number) => `M 100 ${100 - r} A ${r} ${r} 0 1 1 100 ${100 + r} A ${r} ${r} 0 1 1 100 ${100 - r}`;
const BEAN = 'M 100 58 C 124 58 132 84 130 104 C 128 126 114 142 100 142 C 76 142 68 116 70 96 C 72 74 86 58 100 58 Z';
const CREASE = 'M 101 60 C 86 84 116 114 99 140';

export function LogoRevealScene() {
  const [done, setDone] = useState(false);
  return (
    <Browser url="ferrow.coffee">
      <div className={`fw${done ? ' is-done' : ''}`}>
        <header className="fw-nav">
          <span className="fw-word">Ferrow</span>
          <nav className="fw-links" aria-label="Ferrow">
            <span>Shop</span><span>Subscribe</span><span>Wholesale</span><span>Visit</span>
          </nav>
          <span className="fw-bag" aria-label="Bag, 2 items">
            <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="M4.5 7h11l-1 10h-9zM7.5 7V5.5a2.5 2.5 0 0 1 5 0V7" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /></svg>
            <b>2</b>
          </span>
        </header>

        <div className="fw-hero">
          <div className="fw-copy">
            <p className="fw-kick">June lots · roasted Tuesday</p>
            <h3 className="fw-h">Coffee from three farms, roasted the week you drink it.</h3>
            <p className="fw-sub">A washed Yirgacheffe, a honey Tarrazú and a natural from Huila. 250 g bags from €14.</p>
            <div className="fw-ctas">
              <span className="fw-cta">Shop the June lots</span>
              <span className="fw-more">How we roast →</span>
            </div>
          </div>

          <ScrollDraw
            className="fw-mark"
            selector="path:not(.fw-fill)"
            trigger={{ start: 'top 88%', end: 'top 45%' }}
            easing="ease-out"
            speed={0.95}
            stagger={0.12}
            once
            onComplete={() => setDone(true)}
          >
            <svg viewBox="0 0 200 200" role="img" aria-label="The Ferrow emblem: a coffee bean inside a ring">
              <defs><path id="fw-arc" d={ring(78)} /></defs>
              <path className="fw-fill fw-disc" d={ring(70)} />
              <path className="fw-fill fw-beanfill" d={BEAN} />
              <path className="fw-ink fw-outer" d={ring(86)} />
              <path className="fw-ink fw-inner" d={ring(70)} />
              <path className="fw-ink fw-bean" d={BEAN} />
              <path className="fw-ink fw-crease" d={CREASE} />
              <text className="fw-ringtext"><textPath href="#fw-arc" startOffset="0" textLength="484" lengthAdjust="spacing">FERROW · COFFEE ROASTERS · LISBON · EST. 2019 ·</textPath></text>
            </svg>
          </ScrollDraw>
        </div>

        <ul className="fw-facts">
          <li>Roasted in Lisbon</li>
          <li>Free shipping over €40</li>
          <li>Home-compostable bags</li>
        </ul>
      </div>
    </Browser>
  );
}
