import './reading.css';

/**
 * The reading-progress post's opening drawing: what the bar's CSS and the
 * fallback's arithmetic in the post work out for one page. The window can
 * travel scrollHeight − innerHeight; the bar's scaleX is scrollY over that
 * distance, so it is full when the window's bottom reaches the page's end,
 * not when its top does.
 */

const PAGE = 4000; // document.documentElement.scrollHeight
const VIEW = 800; // innerHeight
const MAX = PAGE - VIEW; // the distance the window can travel
const STOPS = [0, 800, 2000, MAX];

const px = (v: number) => ((v / PAGE) * 1000).toFixed(1);
const fmt = (p: number) => (p === 0 || p === 1 ? String(p) : p.toFixed(3).replace(/0+$/, ''));

export function ReadingFigure() {
  return (
    <div className="rf">
      <div className="rf-row rf-head" aria-hidden="true">
        <span className="rf-l">Page</span>
        <span className="rf-sum">
          {PAGE} − {VIEW} = <b>{MAX} px</b> to scroll
        </span>
      </div>
      {STOPS.map((y) => {
        const p = y / MAX;
        return (
          <div key={y} className="rf-row">
            <span className="rf-l">
              scrollY <b>{y}</b>
              <span className="rf-p">scaleX({fmt(p)})</span>
            </span>
            <span className="rf-track">
              <svg viewBox="0 0 1000 40" preserveAspectRatio="none" aria-hidden="true">
                <rect x="0" y="3" width="1000" height="12" className="rf-page" />
                <rect x={px(y)} y="1" width={px(VIEW)} height="16" className="rf-win" />
                <path d="M0 30 H1000" className="rf-base" />
                {p > 0 ? <path d={`M0 30 H${(p * 1000).toFixed(1)}`} className="rf-bar" /> : null}
              </svg>
            </span>
          </div>
        );
      })}
      <p className="rf-key" aria-hidden="true">
        <span><i className="is-page" />the page, {PAGE} px</span>
        <span><i className="is-win" />the window, {VIEW} px</span>
        <span><i className="is-bar" />the bar</span>
      </p>
    </div>
  );
}
