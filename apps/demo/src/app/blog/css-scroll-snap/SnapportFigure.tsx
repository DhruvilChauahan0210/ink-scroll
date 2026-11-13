import './snapport.css';

/**
 * The scroll snap post's opening drawing, worked out from the post's
 * carousel.css for a carousel 360px wide: padding-inline and
 * scroll-padding-inline 24px, gap 16px, each slide flex: 0 0 80% of the
 * content box, five slides, scroll-snap-align: start. Each slide's snap
 * position is the scrollLeft that puts its left edge on the snap line, clamped
 * to how far the box can scroll; the last one cannot reach the line, so it
 * shares the end. The post's checks build this carousel and read the same
 * numbers back from Chromium, Firefox and WebKit.
 */

const BOX = 360;
const PAD = 24;
const GAP = 16;
const SIZE = 0.8;
const COUNT = 5;

const SLIDE = (BOX - 2 * PAD) * SIZE;
const STEP = SLIDE + GAP;
const MAX = PAD + COUNT * SLIDE + (COUNT - 1) * GAP + PAD - BOX;
const AXIS = 1100;

const fmt = (n: number) => String(Math.round(n * 10) / 10);
const pct = (n: number, of: number) => `${((n / of) * 100).toFixed(3)}%`;

export function SnapportFigure() {
  const slides = Array.from({ length: COUNT }, (_, i) => {
    const want = i * STEP;
    return { i, want, at: Math.min(MAX, want) };
  });
  return (
    <div className="ssf">
      <div className="ssf-port" aria-hidden="true">
        <span className="ssf-pad" style={{ left: 0, width: pct(PAD, BOX) }} />
        <span className="ssf-pad" style={{ right: 0, width: pct(PAD, BOX) }} />
        <span className="ssf-slide" style={{ left: pct(PAD, BOX), width: pct(SLIDE, BOX) }}>1</span>
        <span className="ssf-slide" style={{ left: pct(PAD + STEP, BOX), width: pct(SLIDE, BOX) }}>2</span>
        <span className="ssf-line" style={{ left: pct(PAD, BOX) }} />
      </div>
      <p className="ssf-key" aria-hidden="true">
        <span><i className="is-pad" />scroll-padding-inline: {PAD}px</span>
        <span><i className="is-line" />snap line</span>
        <span>box {BOX}px · slide {fmt(SLIDE)}px · gap {GAP}px</span>
      </p>

      <div className="ssf-row ssf-axis" aria-hidden="true">
        <span className="ssf-l">scrollLeft</span>
        <span className="ssf-track ssf-ticks">
          {[0, 275, 550, 825, 1100].map((t) => <span key={t}>{t}</span>)}
        </span>
      </div>
      {slides.map((s) => (
        <div key={s.i} className={`ssf-row${s.at < s.want ? ' is-clamped' : ''}`}>
          <span className="ssf-l">
            <b>Slide {s.i + 1}</b> {s.at < s.want ? `${fmt(s.want)} → ${fmt(s.at)}` : fmt(s.at)}
          </span>
          <span className="ssf-track">
            {s.at < s.want ? (
              <span className="ssf-want" style={{ left: pct(s.at, AXIS), width: pct(s.want - s.at, AXIS) }} />
            ) : null}
            <span className="ssf-dot" style={{ left: pct(s.at, AXIS) }} />
          </span>
        </div>
      ))}
      <div className="ssf-row is-max">
        <span className="ssf-l">
          <b>Max</b> {fmt(MAX)}
        </span>
        <span className="ssf-track">
          <span className="ssf-max" style={{ width: pct(MAX, AXIS) }} />
        </span>
      </div>
    </div>
  );
}
