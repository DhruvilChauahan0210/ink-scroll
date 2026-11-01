'use client';

import { EASINGS, SIGNATURE_D } from './SvgPlayground';

/**
 * The playground's opening drawing: the bench's Signature preset at four scrub
 * positions, each frame inked as far as the playground's own ease-out curve
 * takes it, over a pencil underdrawing of the whole stroke. The readings are
 * computed from that curve, not typed — a quarter of the scrub draws 44%.
 */
const STOPS = [0.25, 0.5, 0.75, 1];
const ease = EASINGS['ease-out'];

export function PlaygroundPlot() {
  return (
    <figure className="pl-plot" aria-label="The Signature preset at 25, 50, 75 and 100 percent scrub, with how much of its stroke ease-out has drawn at each">
      <div className="pl-plot-grid">
        {STOPS.map((p, i) => {
          const drawn = ease(p);
          return (
            <div key={p} className="pl-fr">
              <div className="pl-fr-k"><b>1{'abcd'[i]}</b><span>scrub {Math.round(p * 100)}%</span></div>
              <svg viewBox="10 40 224 146" aria-hidden="true">
                <line x1="20" y1="175" x2="224" y2="175" className="pl-fr-base" />
                <path d={SIGNATURE_D} className="pl-fr-pencil" />
                <path
                  d={SIGNATURE_D}
                  pathLength={1}
                  className="pl-fr-ink"
                  style={{ '--off': (1 - drawn).toFixed(4), '--i': i } as React.CSSProperties}
                />
              </svg>
              <div className="pl-fr-track" aria-hidden="true">
                <i style={{ width: `${p * 100}%` }} />
                <b style={{ left: `${p * 100}%` }} />
              </div>
              <div className="pl-fr-v"><span>drawn</span><b>{Math.round(drawn * 100)}%</b></div>
            </div>
          );
        })}
      </div>
      <figcaption className="pl-plot-cap">fig. 1 — one stroke, four scrub positions, ease-out: the curve front-loads the ink</figcaption>
    </figure>
  );
}
