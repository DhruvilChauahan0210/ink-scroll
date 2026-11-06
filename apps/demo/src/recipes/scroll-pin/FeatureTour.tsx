'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { scrollDraw } from 'svg-scroll-draw';
import { scrollPin } from 'svg-scroll-draw/pin';
import './feature-tour.css';

/** The height of your sticky header, so the stage pins just below it. */
const HEADER = 64;

const FEATURES = [
  {
    title: 'From three farms',
    body: 'A washed Yirgacheffe, a honey Tarrazú and a natural from Huila, bought direct from the people who grow them.',
    art: [
      'M 8 112 C 44 84 78 88 104 98 S 160 80 192 92',
      'M 8 138 C 58 116 122 132 192 120',
      'M 30 104 q 7 -11 14 0 q 7 -11 14 0 q 7 -11 14 0 q 7 -11 14 0',
      'M 150 26 A 16 16 0 1 1 150 58 A 16 16 0 1 1 150 26',
    ],
  },
  {
    title: 'Roasted on Tuesday',
    body: 'Small batches in Lisbon every Tuesday, so the bag you open was roasted days ago, not months.',
    art: [
      'M 64 46 H 136 A 32 32 0 0 1 136 110 H 64 A 32 32 0 0 1 64 46 Z',
      'M 100 62 A 16 16 0 1 1 100 94 A 16 16 0 1 1 100 62',
      'M 120 46 V 24 H 132 V 46',
      'M 70 110 V 128 M 130 110 V 128',
      'M 100 152 C 88 142 92 132 100 124 C 108 132 112 142 100 152 Z',
    ],
  },
  {
    title: 'At your door in two days',
    body: 'Packed the morning after roasting and shipped free over €40, in bags you can compost.',
    art: [
      'M 50 62 L 100 42 L 150 62 L 150 118 L 100 138 L 50 118 Z',
      'M 50 62 L 100 82 L 150 62 M 100 82 V 138',
      'M 76 52 L 126 72',
      'M 18 96 H 38 M 24 110 H 40',
    ],
  },
];

export function FeatureTour() {
  const stage = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const n = FEATURES.length;

    // One drawing per feature, moved by the pin rather than by its own position.
    const drawings = Array.from(el.querySelectorAll('.tour-art'), (svg) => scrollDraw(svg));
    drawings.forEach((d) => d.seek(0));

    const pin = scrollPin(el, {
      top: HEADER,
      pinDistance: `${(n - 1) * 100}vh`, // three features, two screens of scroll
      onProgress: (p) => {
        const i = Math.min(n - 1, Math.floor(p * n));
        setActive(i);
        drawings.forEach((d, j) => d.seek(j < i ? 1 : j > i ? 0 : p * n - i));
      },
    });

    return () => {
      pin.destroy();
      drawings.forEach((d) => d.destroy());
    };
  }, []);

  return (
    // scrollPin moves .tour-stage into a wrapper of its own, so the stage must
    // not be this component's root: React looks for its root where it left it.
    <section className="tour">
      <div ref={stage} className="tour-stage" style={{ '--header': `${HEADER}px` } as CSSProperties}>
        <div className="tour-art-box">
          {FEATURES.map((f, i) => (
            <svg key={f.title} className="tour-art" data-on={i === active || undefined} viewBox="0 0 200 160" aria-hidden="true">
              {f.art.map((d) => <path key={d} d={d} />)}
            </svg>
          ))}
        </div>
        <ol className="tour-copy">
          {FEATURES.map((f, i) => (
            <li key={f.title} aria-current={i === active ? 'step' : undefined}>
              <span className="tour-n">0{i + 1}</span>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
