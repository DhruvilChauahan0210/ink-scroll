/**
 * The four AOS families as technical drawings: where an element starts
 * (dashed, the pencil) and where it ends (solid, the ink), with the numbers
 * the stylesheet uses. Static: the live versions are in the gallery below.
 */

const PANELS = [
  {
    key: 'fade-up',
    note: 'opacity 0 → 1 · y +100px → 0',
    start: <rect x="62" y="70" width="76" height="52" strokeDasharray="4 4" />,
    arrow: 'M100 66 V 46',
  },
  {
    key: 'zoom-in',
    note: 'opacity 0 → 1 · scale 0.6 → 1',
    start: <rect x="77" y="42" width="46" height="31" strokeDasharray="4 4" />,
    arrow: 'M128 50 L 136 42',
  },
  {
    key: 'slide-left',
    note: 'x +100% → 0 · no fade',
    start: <rect x="140" y="32" width="76" height="52" strokeDasharray="4 4" />,
    arrow: 'M150 58 H 142',
  },
  {
    key: 'flip-up',
    note: 'rotateX −100° → 0 · back face hidden',
    start: <path d="M62 84 L 74 62 H 126 L 138 84 Z" strokeDasharray="4 4" />,
    arrow: 'M100 90 V 98',
  },
];

export function AosFamilies() {
  return (
    <figure className="stk-fig aosf">
      <div className="aosf-grid">
        {PANELS.map((p) => (
          <div key={p.key} className="aosf-panel">
            <svg viewBox="0 0 200 116" aria-hidden="true" focusable="false">
              <g fill="none" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke">
                <g className="aosf-pencil">{p.start}</g>
                <rect className="aosf-ink" x="62" y="32" width="76" height="52" />
                <path className="aosf-arrow" d={p.arrow} />
              </g>
            </svg>
            <p className="aosf-k"><code>{p.key}</code><span>{p.note}</span></p>
          </div>
        ))}
      </div>
      <figcaption className="stk-cap">Fig. 1 — the four families, start state dashed, end state solid.</figcaption>
    </figure>
  );
}
