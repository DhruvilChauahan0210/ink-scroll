'use client';

import { ScrollText } from 'svg-scroll-draw/react';

const LINES = [
  'Scroll is the most honest input a page has.',
  'We treat it as a timeline, not a trigger.',
  'Every stroke, word and number on this page is placed by your thumb.',
];

/** Three statements whose words arrive as they cross the viewport. */
export function Manifesto() {
  return (
    <div className="manifesto">
      {LINES.map((line, i) => (
        <ScrollText
          key={i}
          as="p"
          className={`manifesto-line ${i === 1 ? 'is-accent' : ''}`}
          split="words"
          stagger={0.08}
          from={{ opacity: 0.08, y: 18 }}
          easing="ease-out"
          trigger={{ start: 'top 88%', end: 'center 48%' }}
        >
          {line}
        </ScrollText>
      ))}
    </div>
  );
}
