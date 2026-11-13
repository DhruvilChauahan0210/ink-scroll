import './seek.css';
import { ENCODES, FILM, type Encode } from '@/data/videoscrub';

/**
 * The scroll-video post's opening drawing: how long a seek took against how
 * often the film has a keyframe. Every value is read from data/videoscrub.ts,
 * the timings measured for /scroll-video-scrub-generator: the site's film
 * re-encoded with only -g changed, then sought to every frame in Chromium,
 * Firefox and WebKit. Each line runs from the median seek (the dot) to the
 * 95th percentile (the end). The dashed line is one frame at 60 fps.
 */

const BROWSERS = ['chromium', 'firefox', 'webkit'] as const;
const NAMES = { chromium: 'Chromium', firefox: 'Firefox', webkit: 'WebKit' } as const;
const CODECS = ['H.264', 'VP9'] as const;
const INTERVALS = [1, 3, 15, null] as const;

const rows = CODECS.flatMap((codec) =>
  INTERVALS.map((g) => ENCODES.find((e) => e.codec === codec && e.g === g)).filter((e): e is Encode => !!e),
);
const STEP_MS = 30;
const AXIS_MS = Math.ceil(Math.max(...rows.flatMap((e) => BROWSERS.map((b) => e[b][1]))) / STEP_MS) * STEP_MS;
const TICKS = Array.from({ length: AXIS_MS / STEP_MS + 1 }, (_, i) => i * STEP_MS);
const FRAME_60 = 1000 / 60;

/** The grid behind each track: one line per tick. */
const GRID = { backgroundSize: `${100 / (TICKS.length - 1)}% 100%` };

const x = (ms: number) => ((ms / AXIS_MS) * 1000).toFixed(1);
const interval = (e: Encode) => (e.g === null ? 'default' : `-g ${e.g}`);

export function SeekFigure() {
  return (
    <div className="ksf">
      <div className="ksf-row ksf-axis" aria-hidden="true">
        <span className="ksf-l">Seek</span>
        <span className="ksf-track ksf-ticks">
          {TICKS.map((t) => <span key={t}>{t} ms</span>)}
        </span>
      </div>
      {rows.map((e, i) => (
        <div key={`${e.codec}-${e.g}`} className={`ksf-row${i > 0 && rows[i - 1].codec !== e.codec ? ' is-new' : ''}`}>
          <span className="ksf-l">
            <b>{e.codec} {interval(e)}</b>
            <span className="ksf-k">{e.keyframes} of {FILM.frames} keyframes</span>
          </span>
          <span className="ksf-track" style={GRID}>
            <svg viewBox="0 0 1000 30" preserveAspectRatio="none" aria-hidden="true">
              <path d={`M${x(FRAME_60)} 0 V30`} className="ksf-frame" />
              {BROWSERS.map((b, j) => {
                const [median, p95] = e[b];
                const y = 5 + j * 10;
                return (
                  <g key={b}>
                    <path d={`M${x(median)} ${y} H${x(p95)}`} className="ksf-bar" />
                    <path d={`M${x(median)} ${y} h0.01`} className="ksf-dot" />
                  </g>
                );
              })}
            </svg>
            <span className="ksf-sr">
              {BROWSERS.map((b) => `${NAMES[b]} median ${e[b][0]} ms, slowest 5% ${e[b][1]} ms`).join('; ')}
            </span>
          </span>
        </div>
      ))}
      <p className="ksf-key" aria-hidden="true">
        <span><i className="is-bar" />median to 95th percentile</span>
        <span>rows: Chromium, Firefox, WebKit</span>
        <span><i className="is-frame" />one frame at 60 fps, {FRAME_60.toFixed(1)} ms</span>
      </p>
    </div>
  );
}
