import './timelines.css';

/**
 * The scroll-driven post's opening drawing: one page's scroll, and the
 * timelines CSS builds from it. A viewport of H = 800px on a page 3,200px
 * tall scrolls 0 → 2,400px. scroll(root) runs over all of it. Card A (top at
 * 1,000px, 200px tall) and card B (top at 2,000px) each get their own view()
 * timeline, from the scroll where their top meets the viewport's bottom
 * (top − H) to the scroll where their bottom meets its top (top + h), split
 * into entry, contain and exit. The accent bar is card A with
 * animation-range: entry 0% cover 50%.
 */

const H = 800;
const MAX = 2400;
const h = 200;
const CARDS = [
  { k: 'A', top: 1000 },
  { k: 'B', top: 2000 },
];

/** A scroll position to an x in the track's 0–1000 viewBox. */
const x = (s: number) => ((s / MAX) * 1000).toFixed(1);

type Seg = { from: number; to: number; cls: string };

function Track({ segs, label }: { segs: Seg[]; label?: string }) {
  return (
    <span className="tf-track">
      <svg viewBox="0 0 1000 14" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 7 H1000" className="tf-base" />
        {segs.map((s) => (
          <path key={`${s.from}-${s.cls}`} d={`M${x(s.from)} 7 H${x(s.to)}`} className={s.cls} />
        ))}
      </svg>
      {label ? <span className="tf-lab">{label}</span> : null}
    </span>
  );
}

function view(top: number): Seg[] {
  const a = top - H;
  return [
    { from: a, to: a + h, cls: 'tf-entry' },
    { from: a + h, to: top, cls: 'tf-contain' },
    { from: top, to: top + h, cls: 'tf-exit' },
  ];
}

export function TimelineFigure() {
  const [A, B] = CARDS;
  const rangeEnd = A.top - H + (H + h) / 2;
  return (
    <div className="tf">
      <div className="tf-row tf-axis" aria-hidden="true">
        <span className="tf-l">scrollY</span>
        <span className="tf-track tf-ticks">
          {[0, 600, 1200, 1800, 2400].map((s) => <span key={s}>{s}</span>)}
        </span>
      </div>
      <div className="tf-row">
        <span className="tf-l"><code>scroll(root)</code></span>
        <Track segs={[{ from: 0, to: MAX, cls: 'tf-scroll' }]} label="0% → 100% of the page" />
      </div>
      <div className="tf-row">
        <span className="tf-l"><code>view()</code> card A</span>
        <Track segs={view(A.top)} label={`cover: ${A.top - H} → ${A.top + h}`} />
      </div>
      <div className="tf-row is-range">
        <span className="tf-l">entry 0% cover 50%</span>
        <Track segs={[{ from: A.top - H, to: rangeEnd, cls: 'tf-range' }]} label={`${A.top - H} → ${rangeEnd}`} />
      </div>
      <div className="tf-row">
        <span className="tf-l"><code>view()</code> card B</span>
        <Track segs={view(B.top)} label={`cover: ${B.top - H} → ${B.top + h}`} />
      </div>
      <p className="tf-key" aria-hidden="true">
        <span><i className="tf-entry" />entry</span>
        <span><i className="tf-contain" />contain</span>
        <span><i className="tf-exit" />exit</span>
        <span>viewport {H}px · cards {h}px</span>
      </p>
    </div>
  );
}
