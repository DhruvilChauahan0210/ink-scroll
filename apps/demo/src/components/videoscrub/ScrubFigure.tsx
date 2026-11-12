import { FILM } from '@/data/videoscrub';

/**
 * How scrollVideo turns a scroll position into a frame, drawn to scale for the
 * site's own film (data/videoscrub.ts). Top: the trigger window on the scroll
 * axis, progress 0 to 1. Middle: the same window mapped straight onto the
 * film's timeline from `from` to `to` (video/index.ts applyAlpha:
 * from + (to − from) × progress), with the film's keyframes ticked, one every
 * 3 frames. Bottom: one seek, frame by frame. A seek decodes from the keyframe
 * before the frame it lands on: 2 frames in this film, 14 had it a keyframe
 * every 60.
 */

const P = 0.49;                 // where the drawing catches the scroll
const SPARSE = 60;              // the other GOP drawn: a keyframe every 2 s at 30 fps

const AX = 78;                  // the scroll axis
const SX0 = 110;                // the window's start and end on it
const SX1 = 410;
const TL = 196;                 // the film's timeline
const TX0 = 40;
const TX1 = 480;
const BOX = 26;                 // one frame in the zoom
const STEP = 30;
const ZX = 60;
const R1 = 268;                 // the zoom's two rows
const R2 = 340;

const tx = (t: number) => TX0 + (t / FILM.duration) * (TX1 - TX0);
const f1 = (n: number) => Math.round(n * 10) / 10;

export function ScrubFigure() {
  const t = P * FILM.to;
  const frame = Math.floor(t * FILM.fps);
  const key = Math.floor(frame / FILM.keyEvery) * FILM.keyEvery;
  const far = Math.floor(frame / SPARSE) * SPARSE;
  const first = key - 6;
  const frames = Array.from({ length: 13 }, (_, i) => first + i);
  const bx = (n: number) => ZX + (n - first) * STEP;
  const mid = (n: number) => bx(n) + BOX / 2;
  const px = SX0 + P * (SX1 - SX0);
  const zoomL = tx(first / FILM.fps);
  const zoomR = tx((first + frames.length) / FILM.fps);
  const toX = tx(FILM.to);

  return (
    <figure className="stk-fig vsgf">
      <svg
        viewBox="0 0 520 440"
        role="img"
        aria-label={`The scroll axis with a trigger window from progress 0 to 1, mapped straight onto the film’s timeline from 0 to ${FILM.to} seconds, with a keyframe ticked every ${FILM.keyEvery} frames. Progress ${P} lands on frame ${frame}. Below, that seek frame by frame: with a keyframe every ${FILM.keyEvery} frames it decodes ${frame - key + 1} frames from frame ${key}; with one every ${SPARSE} frames it would decode ${frame - far + 1}, from frame ${far}.`}
      >
        <text className="vsgf-code" x={TX0} y={24}>scrollVideo(video, {'{'} trigger, from, to {'}'})</text>

        {/* The scroll axis, and the trigger window on it. */}
        <text className="vsgf-k" x={TX0} y={AX - 28}>scroll position · progress</text>
        <g fill="none" stroke="currentColor" strokeWidth="1">
          <line className="vsgf-axis" x1={TX0} x2={TX1} y1={AX} y2={AX} />
          <line className="vsgf-win" x1={SX0} x2={SX1} y1={AX} y2={AX} strokeWidth="4" />
          <line className="vsgf-axis" x1={SX0} x2={SX0} y1={AX - 6} y2={AX + 6} />
          <line className="vsgf-axis" x1={SX1} x2={SX1} y1={AX - 6} y2={AX + 6} />

          {/* The window mapped onto the film: its ends onto from and to, the scroll onto a time. */}
          <line className="vsgf-map" x1={SX0} y1={AX + 6} x2={tx(0)} y2={TL - 14} strokeDasharray="2 4" />
          <line className="vsgf-map" x1={SX1} y1={AX + 6} x2={toX} y2={TL - 14} strokeDasharray="2 4" />
          <line className="vsgf-now" x1={px} y1={AX} x2={tx(t)} y2={TL} />

          {/* The film, and the stills after `to`: not scrubbed. */}
          <line className="vsgf-axis" x1={TX0} x2={TX1} y1={TL} y2={TL} />
          {Array.from({ length: Math.ceil((TX1 - toX) / 5) }, (_, i) => (
            <line key={i} className="vsgf-hatch" x1={toX + i * 5} y1={TL} x2={Math.min(TX1, toX + i * 5 + 8)} y2={TL - 8} />
          ))}
          {Array.from({ length: Math.floor(FILM.duration) + 1 }, (_, s) => (
            <line key={s} className="vsgf-axis" x1={tx(s)} x2={tx(s)} y1={TL} y2={TL + 5} />
          ))}

          {/* The zoom: frames around the one the scroll asked for. */}
          <path className="vsgf-dim" d={`M${zoomL} ${TL + 18} L${ZX} ${R1 - 8} M${zoomR} ${TL + 18} L${bx(first + frames.length - 1) + BOX} ${R1 - 8}`} strokeDasharray="1 3" />
          <path className="vsgf-dim" d={`M${zoomL} ${TL + 2} V${TL + 18} M${zoomR} ${TL + 2} V${TL + 18}`} />
        </g>
        <rect className="vsgf-range" x={tx(0)} y={TL - 12} width={toX - tx(0)} height={12} />
        {Array.from({ length: FILM.keyframes }, (_, k) => (
          <line key={k} className="vsgf-key" stroke="currentColor" x1={tx((k * FILM.keyEvery) / FILM.fps)} x2={tx((k * FILM.keyEvery) / FILM.fps)} y1={TL} y2={TL - 7} />
        ))}
        <circle className="vsgf-dot" cx={px} cy={AX} r="3.5" />
        <circle className="vsgf-dot" cx={tx(t)} cy={TL} r="3" />

        <text className="vsgf-n" x={SX0} y={AX - 10} textAnchor="middle">start · 0</text>
        <text className="vsgf-n" x={SX1} y={AX - 10} textAnchor="middle">end · 1</text>
        <text className="vsgf-l" x={px} y={AX - 10} textAnchor="middle">{P}</text>
        <text className="vsgf-n" x={px + 14} y={128}>time = from +</text>
        <text className="vsgf-n" x={px + 14} y={142}>(to − from) × {P}</text>
        <text className="vsgf-n" x={TX0 + 4} y={TL - 18}>from 0</text>
        <text className="vsgf-n" x={toX - 4} y={TL - 18} textAnchor="end">to {FILM.to}</text>
        {Array.from({ length: Math.floor(FILM.duration) + 1 }, (_, s) => (
          <text key={s} className="vsgf-s" x={tx(s)} y={TL + 17} textAnchor="middle">{s}</text>
        ))}
        <text className="vsgf-s" x={TX1} y={TL + 17} textAnchor="end">s</text>
        <text className="vsgf-l" x={tx(t) + 8} y={TL - 18}>{f1(t)} s · frame {frame}</text>
        <text className="vsgf-s" x={TX1} y={TL + 30} textAnchor="end">keyframes: 1 frame in {FILM.keyEvery}</text>

        {/* Row 1: this film. Row 2: the same seek with a keyframe every 60 frames. */}
        {[{ y: R1, k: (n: number) => n % FILM.keyEvery === 0, from: key }, { y: R2, k: (n: number) => n % SPARSE === 0, from: far }].map((row) => (
          <g key={row.y}>
            {frames.map((n) => {
              const cls = row.k(n) ? 'is-key' : n === frame ? 'is-target' : n >= row.from && n < frame ? 'is-dec' : '';
              return (
                <g key={n}>
                  <rect className={`vsgf-frame ${cls}`} x={bx(n)} y={row.y} width={BOX} height={22} />
                  <text
                    className="vsgf-s" x={mid(n)} y={row.y + 15} textAnchor="middle"
                    style={row.k(n) ? { fill: 'var(--bg)' } : n === frame ? { fill: 'var(--fg)' } : undefined}
                  >
                    {n}
                  </text>
                </g>
              );
            })}
          </g>
        ))}
        <g fill="none" stroke="currentColor" strokeWidth="1">
          <path className="vsgf-arrow" d={`M${mid(key)} ${R1 + 30} H${mid(frame) - 2} M${mid(frame) - 7} ${R1 + 26} L${mid(frame) - 2} ${R1 + 30} L${mid(frame) - 7} ${R1 + 34}`} />
          <path className="vsgf-arrow" d={`M${ZX - 24} ${R2 + 30} H${mid(frame) - 2} M${mid(frame) - 7} ${R2 + 26} L${mid(frame) - 2} ${R2 + 30} L${mid(frame) - 7} ${R2 + 34}`} />
          <line className="vsgf-dim" x1={ZX - 24} x2={ZX - 6} y1={R2 + 11} y2={R2 + 11} strokeDasharray="2 3" />
        </g>
        <text className="vsgf-s" x={ZX - 26} y={R2 + 15} textAnchor="end">{far}</text>
        <text className="vsgf-l" x={ZX} y={R1 + 50}>
          -g {FILM.keyEvery} · this film: {frame - key + 1} frames decoded, from frame {key}
        </text>
        <text className="vsgf-l" x={ZX} y={R2 + 50}>
          -g {SPARSE} · one every 2 s: {frame - far + 1} frames decoded, from frame {far}
        </text>

        <rect className="vsgf-frame is-key" x={ZX} y={418} width={10} height={10} />
        <text className="vsgf-s" x={ZX + 16} y={427}>keyframe</text>
        <rect className="vsgf-frame is-dec" x={ZX + 92} y={418} width={10} height={10} />
        <text className="vsgf-s" x={ZX + 108} y={427}>decoded on the way</text>
        <rect className="vsgf-frame is-target" x={ZX + 252} y={418} width={10} height={10} />
        <text className="vsgf-s" x={ZX + 268} y={427}>the frame asked for</text>
      </svg>
      <figcaption className="stk-cap">
        Fig. 1 — The trigger window maps straight onto the film, from to to. Every new scroll position is a seek,
        and a seek decodes from the keyframe before the frame it lands on: with one every {FILM.keyEvery} frames, never
        more than {FILM.keyEvery} frames.
      </figcaption>
    </figure>
  );
}
