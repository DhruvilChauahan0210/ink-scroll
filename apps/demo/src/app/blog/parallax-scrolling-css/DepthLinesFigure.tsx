import { screenRate } from '@/data/parallax';
import './depth-lines.css';

/**
 * The parallax post's opening drawing: what its scene CSS and parallax CSS do.
 * Each layer moves from translateY(0) to translateY(−speed × 100%) of its own
 * height while it crosses the window, so its line runs from 0 to −speed × 100.
 *
 * These values are the ones in the post's listings (SCENE_HTML: the three
 * --speed values; SCENE_CSS: height 70vh and inset −40% 0). The browser check
 * for the post reads both files and fails if they disagree.
 */

export const LAYERS = [
  { name: 'Far', speed: -0.2, cls: 'is-far' },
  { name: 'Middle', speed: -0.1, cls: 'is-mid' },
  { name: 'Near', speed: 0.1, cls: 'is-near' },
] as const;

/** The scene is 70vh; each layer reaches 40% of the scene past its top and bottom. */
export const SCENE_VH = 70;
export const INSET_PCT = 40;

/** A layer's height as a share of the window: 70% × (1 + 2 × 40%) = 1.26. */
const LAYER_OF_WINDOW = (SCENE_VH / 100) * (1 + (2 * INSET_PCT) / 100);

/** The plot's vertical range, in % of the layer's height, either side of 0. */
const RANGE = 25;
const W = 400;
const H = 200;
/** Down (a positive translateY) is drawn down, as on screen. */
const yOf = (pct: number) => H / 2 + (pct / RANGE) * (H / 2);

const fmt = (n: number) => (n < 0 ? `−${Math.abs(n)}` : String(n));

export function DepthLinesFigure() {
  return (
    <div className="dl">
      <div className="dl-plot">
        <span className="dl-yk is-up" aria-hidden="true">↑ up {RANGE}%</span>
        <span className="dl-yk is-down" aria-hidden="true">↓ down {RANGE}%</span>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
          {[-20, -10, 10, 20].map((p) => (
            <path key={p} d={`M0 ${yOf(p)} H${W}`} className="dl-grid" />
          ))}
          {[0.25, 0.5, 0.75].map((f) => (
            <path key={f} d={`M${W * f} 0 V${H}`} className="dl-grid" />
          ))}
          <path d={`M0 ${yOf(0)} H${W}`} className="dl-zero" />
          {LAYERS.map((l) => (
            <path key={l.name} d={`M0 ${yOf(0)} L${W} ${yOf(-l.speed * 100)}`} className={`dl-line ${l.cls}`} />
          ))}
        </svg>
        {LAYERS.map((l) => (
          <span
            key={l.name}
            className={`dl-end ${l.cls}`}
            style={{ top: `${(yOf(-l.speed * 100) / H) * 100}%` }}
            aria-hidden="true"
          >
            {l.name}
          </span>
        ))}
      </div>
      <div className="dl-x" aria-hidden="true">
        <span>its top meets the window’s bottom</span>
        <span>its bottom leaves the top</span>
      </div>
      <dl className="dl-key">
        {LAYERS.map((l) => (
          <div key={l.name} className={l.cls}>
            <dt>
              <i aria-hidden="true" />
              {l.name} <code>--speed: {fmt(l.speed)}</code>
            </dt>
            <dd>
              {l.speed < 0 ? 'down' : 'up'} {Math.abs(l.speed * 100)}% of its height ·{' '}
              {screenRate(l.speed, LAYER_OF_WINDOW, 1).toFixed(2)}× the scroll on screen
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
