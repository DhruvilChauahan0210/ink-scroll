'use client';

import { useState } from 'react';
import { ScrollDraw } from 'svg-scroll-draw/react';
import './logo-reveal.css';

/** A circle of radius r around (100, 100), as two arcs so it has a start point to draw from. */
const ring = (r: number) =>
  `M 100 ${100 - r} A ${r} ${r} 0 1 1 100 ${100 + r} A ${r} ${r} 0 1 1 100 ${100 - r}`;

const BEAN = 'M 100 58 C 124 58 132 84 130 104 C 128 126 114 142 100 142 C 76 142 68 116 70 96 C 72 74 86 58 100 58 Z';
const CREASE = 'M 101 60 C 86 84 116 114 99 140';

export function LogoReveal() {
  const [inked, setInked] = useState(false);

  return (
    <ScrollDraw
      className={inked ? 'logo is-inked' : 'logo'}
      selector=".logo-line"
      trigger={{ start: 'top 85%', end: 'top 35%' }}
      easing="ease-out"
      stagger={0.12}
      once
      onComplete={() => setInked(true)}
    >
      <svg viewBox="0 0 200 200" role="img" aria-label="Ferrow Coffee Roasters">
        {/* The colour: in place from the start, hidden until the outline is done. */}
        <path className="logo-fill logo-disc" d={ring(70)} />
        <path className="logo-fill logo-bean-fill" d={BEAN} />

        {/* The outline: what the library draws, in this order. */}
        <path className="logo-line logo-outer" d={ring(86)} />
        <path className="logo-line logo-inner" d={ring(70)} />
        <path className="logo-line logo-bean" d={BEAN} />
        <path className="logo-line logo-crease" d={CREASE} />
      </svg>
    </ScrollDraw>
  );
}
