'use client';

import './balance.css';
import { useCallback, useEffect, useRef, useSyncExternalStore, type CSSProperties, type ReactNode, type RefObject } from 'react';
import { ScrollDraw } from 'svg-scroll-draw/react';
import { COMPETITORS, MEASURED_ON, SELF } from '@/data/competitors';
import {
  DEG_PER_KB,
  DELTA_KB,
  DIMENSION,
  ENGRAVINGS,
  KB,
  NOTES,
  NUMERALS,
  PIECES,
  PIVOT,
  SCALE_TICKS_AT,
  TILT_DEG,
  VIEW,
  WINDOW,
  WINDOW_AT,
  WINDOW_NUMERALS,
  hookShift,
  type Note,
  type Numeral,
  type Part,
  type Piece,
} from './art/balance-geometry';

/**
 * Chapter 04 — the same drawing in GSAP and in svg-scroll-draw, put on a
 * balance. The stage is tall and is the ScrollDraw container; its child is
 * sticky, so the instrument holds still while the scroll scrubs it.
 *
 * The first part of the stage inks the balance over its pencil underdrawing,
 * in the library's own timing: every stroke gets `1 / SPEED` of the stage and
 * stroke i starts `i × STAGGER` later, so the last one lands at INK_END. Then
 * the load is released: the beam tips toward the heavier pan, the pans follow
 * the beam ends and stay plumb, and the pointer swings across the scale to
 * read the difference, while the magnified strip in the plinth's reading
 * window slides the same difference under its index — the pencil keeps the
 * level it started from.
 */
const SPEED = 8;
const INK_END = 0.6;
const TOTAL = PIECES.length;
const STAGGER = Number(((INK_END - 1 / SPEED) / (TOTAL - 1)).toFixed(4));
const SELECTOR = '.bal-ink';
const TILT_FROM = 0.64;
const TILT_TO = 0.93;

const doneAt = (i: number): string => Math.min(1, i * STAGGER + 1 / SPEED).toFixed(3);
const startAt = (i: number): string => (i * STAGGER).toFixed(3);
const inkedAt = (p: number): number =>
  p < 1 / SPEED ? 0 : Math.min(TOTAL, Math.floor((p - 1 / SPEED) / STAGGER + 1e-6) + 1);
const pad = (n: number): string => String(n).padStart(String(TOTAL).length, '0');

/**
 * A released balance does not glide to rest: it swings a little past and
 * settles. This is the step response of a lightly damped pendulum (5–6 %
 * overshoot), normalised so it ends exactly on the reading.
 */
const W = 5.7;
const DAMP = 5.2;
const step = (x: number): number => 1 - Math.exp(-DAMP * x) * (Math.cos(W * x) + (DAMP / W) * Math.sin(W * x));
const settle = (u: number): number => (u <= 0 ? 0 : u >= 1 ? 1 : step(u) / step(1));

const tiltText = (t: number): string => `${(Math.min(1, t) * TILT_DEG).toFixed(2)}°`;
const readText = (t: number): string => `Δ ${(Math.min(1, t) * DELTA_KB).toFixed(1)} KB`;

/* ── The code, both ways ──────────────────────────────────────────────────── */

const GSAP_CODE = `import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';

gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin);

gsap.from('#logo path', {
  drawSVG: 0,
  stagger: 0.1,
  ease: 'power1.out',
  scrollTrigger: {
    trigger: '#logo',
    start: 'top 80%',
    end: 'top 30%',
    scrub: true,
  },
});`;

const OURS_CODE = `import { scrollDraw } from 'svg-scroll-draw';

scrollDraw('#logo', {
  stagger: 0.1,
  easing: 'ease-out',
  trigger: { start: 'top 80%', end: 'top 30%' },
});`;

const lines = (code: string): number => code.split('\n').length;

const TOKEN = /('[^']*')|([A-Za-z_$][\w$]*)(?=\()|\b(import|from|true)\b|\b(\d+(?:\.\d+)?)\b/g;
/** Just enough colour to read: calls, strings, numbers, keywords. */
function highlight(code: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of code.matchAll(TOKEN)) {
    const i = m.index ?? 0;
    if (i > last) out.push(code.slice(last, i));
    const cls = m[1] ? 'str' : m[2] ? 'fn' : m[3] ? 'kw' : 'num';
    out.push(
      <span key={i} className={`bal-c-${cls}`}>
        {m[0]}
      </span>,
    );
    last = i + m[0].length;
  }
  if (last < code.length) out.push(code.slice(last));
  return out;
}

/* ── The drawing ──────────────────────────────────────────────────────────── */

/* Consecutive pieces that move together share one group, so document order —
   which is the draw order — is kept exactly. */
type Run = { part: Part; items: { p: Piece; i: number }[] };
const RUNS: Run[] = [];
PIECES.forEach((p, i) => {
  const last = RUNS[RUNS.length - 1];
  if (last && last.part === p.part) last.items.push({ p, i });
  else RUNS.push({ part: p.part, items: [{ p, i }] });
});

const VALUES: Record<Note['key'], string> = {
  gsap: `${COMPETITORS.gsapStack.version} · ${KB.stack.toFixed(1)} KB`,
  draw: `${KB.draw.toFixed(1)} KB`,
  self: `${SELF.version} · ${KB.self.toFixed(1)} KB`,
  framer: `${COMPETITORS.framerMotion.version} · ${KB.framer.toFixed(1)} KB`,
  tilt: tiltText(0),
  reading: readText(0),
};

const at = (v: string): CSSProperties => ({ '--bal-at': v }) as CSSProperties;

function inkClass(p: Piece): string {
  return `bal-ink bal-w-${p.w} bal-t-${p.tone}${p.layer === 'note' ? ' bal-lead' : ''}${p.layer === 'ghost' ? ' bal-ghost' : ''}`;
}

type Refs = {
  beam: RefObject<SVGGElement | null>;
  left: RefObject<SVGGElement | null>;
  right: RefObject<SVGGElement | null>;
  strip: RefObject<SVGGElement | null>;
  tilt: RefObject<SVGTSpanElement | null>;
  reading: RefObject<SVGTSpanElement | null>;
  /** The phone's readout, which stands in for the labels it cannot show. */
  tiltOut: RefObject<HTMLElement | null>;
  readOut: RefObject<HTMLElement | null>;
};

function Labels({ part, refs }: { part: Part; refs?: Refs }) {
  return (
    <>
      {ENGRAVINGS.filter((e) => e.part === part).map((e) => (
        <text
          key={`e${e.at}${e.text}`}
          className={`bal-note bal-txt bal-eng bal-eng-${e.tone}${e.small ? ' bal-eng-name' : ''}${e.tone === 'faint' ? ' bal-ghost' : ''}`}
          x={e.x.toFixed(1)}
          y={e.y.toFixed(1)}
          textAnchor="middle"
          style={at(doneAt(e.at))}
        >
          {e.text}
        </text>
      ))}
      {NOTES.filter((n) => n.part === part).map((n) => {
        const live = n.key === 'tilt' ? refs?.tilt : n.key === 'reading' ? refs?.reading : undefined;
        return (
          <g key={n.key} className={n.key === 'framer' ? 'bal-ghost bal-off' : undefined}>
            {n.dot && (
              <circle
                className={`bal-note bal-txt bal-dot${n.accent ? ' bal-dot-accent' : ''}`}
                cx={n.dot[0].toFixed(1)}
                cy={n.dot[1].toFixed(1)}
                r="3.2"
                style={at(startAt(n.at))}
              />
            )}
            <text
              className="bal-note bal-txt bal-label"
              x={n.text[0].toFixed(1)}
              y={n.text[1].toFixed(1)}
              textAnchor={n.anchor}
              style={at(doneAt(n.at))}
            >
              <tspan className="bal-label-t" x={n.text[0].toFixed(1)} dy="-21">
                {n.title}
              </tspan>
              <tspan className="bal-label-v" x={n.text[0].toFixed(1)} dy="23" ref={live}>
                {VALUES[n.key]}
              </tspan>
            </text>
          </g>
        );
      })}
    </>
  );
}

function Figures({ list, at: when, className }: { list: readonly Numeral[]; at: number; className: string }) {
  return (
    <>
      {list.map((n) => (
        <text
          key={n.x.toFixed(1)}
          className={`bal-note bal-txt ${className}`}
          x={n.x.toFixed(1)}
          y={n.y.toFixed(1)}
          textAnchor="middle"
          style={at(doneAt(when))}
        >
          {n.text}
        </text>
      ))}
    </>
  );
}

/** The reading window's aperture, under an id prefix so each SVG owns its own. */
function WindowClip({ id }: { id: string }) {
  const { x0, x1, y0, y1 } = WINDOW;
  return (
    <defs>
      <clipPath id={`${id}-win`}>
        <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} rx="2" />
      </clipPath>
    </defs>
  );
}

function Drawing({ refs }: { refs: Refs }) {
  const vb = `0 ${VIEW.y} ${VIEW.w} ${VIEW.h}`;
  return (
    <>
      {/* The pencil underdrawing: static and level, in its own SVG so the
          per-frame ink updates never repaint it. When the beam tips, the
          pencil beam stays behind as the level it is measured from; the
          pencil pans and strip fade, so they never show through the ink. */}
      <svg className="bal-svg bal-svg-pencil" viewBox={vb} aria-hidden="true" focusable="false">
        <WindowClip id="bal-p" />
        {RUNS.map((run, k) => {
          const paths = run.items.map(({ p, i }) =>
            p.layer === 'note' ? null : (
              <path key={i} className={`bal-pencil bal-w-${p.w}${p.layer === 'ghost' ? ' bal-ghost' : ''}`} d={p.d} />
            ),
          );
          if (run.part === 'window')
            return (
              <g key={k} clipPath="url(#bal-p-win)" className="bal-pencil-hung">
                {paths}
              </g>
            );
          return (
            <g key={k} className={run.part === 'left' || run.part === 'right' ? 'bal-pencil-hung' : undefined}>
              {paths}
            </g>
          );
        })}
      </svg>
      <svg
        className="bal-svg"
        viewBox={vb}
        role="img"
        aria-label={`Technical drawing of a beam balance: GSAP with ScrollTrigger and DrawSVG, ${KB.stack} KB, outweighs svg-scroll-draw, ${KB.self} KB, by ${DELTA_KB} KB`}
      >
        <WindowClip id="bal-i" />
        {RUNS.map((run, k) => {
          const paths = run.items.map(({ p, i }) => <path key={i} className={inkClass(p)} d={p.d} />);
          if (run.part === 'window')
            return (
              <g key={k} clipPath="url(#bal-i-win)">
                <g ref={refs.strip}>
                  {paths}
                  <Figures list={WINDOW_NUMERALS} at={WINDOW_AT} className="bal-win-num" />
                </g>
              </g>
            );
          const ref = run.part === 'beam' ? refs.beam : run.part === 'left' ? refs.left : run.part === 'right' ? refs.right : undefined;
          return (
            <g key={k} ref={ref}>
              {paths}
              {run.part === 'left' || run.part === 'right' ? <Labels part={run.part} /> : null}
            </g>
          );
        })}
        <g className="bal-notes" aria-hidden="true">
          <Figures list={NUMERALS} at={SCALE_TICKS_AT} className="bal-num" />
          <text className="bal-note bal-txt bal-dim" x={DIMENSION.x} y={DIMENSION.y} textAnchor="middle" style={at(doneAt(DIMENSION.at))}>
            {DIMENSION.text}
          </text>
          <Labels part="frame" refs={refs} />
        </g>
      </svg>
    </>
  );
}

const REDUCED = '(prefers-reduced-motion: reduce)';
function subscribeReduced(cb: () => void): () => void {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}
const getReduced = (): boolean => window.matchMedia(REDUCED).matches;
const getReducedOnServer = (): boolean => false;

export function Balance() {
  const pinRef = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const inkedRef = useRef(0);
  const tiltRef = useRef(0);
  const refs: Refs = {
    beam: useRef<SVGGElement>(null),
    left: useRef<SVGGElement>(null),
    right: useRef<SVGGElement>(null),
    strip: useRef<SVGGElement>(null),
    tilt: useRef<SVGTSpanElement>(null),
    reading: useRef<SVGTSpanElement>(null),
    tiltOut: useRef<HTMLElement>(null),
    readOut: useRef<HTMLElement>(null),
  };
  const { beam, left, right, strip, tilt, reading, tiltOut, readOut } = refs;

  /* Four attribute writes per frame while the beam moves, none while it
     rests; the readouts are rewritten only when their text changes. The strip
     follows the beam, overshoot and all: it is the beam's reading, projected. */
  const apply = useCallback(
    (t: number) => {
      if (Math.abs(t - tiltRef.current) < 1e-5) return;
      tiltRef.current = t;
      pinRef.current?.parentElement?.style.setProperty('--bal-t', Math.min(1, t).toFixed(3));
      const a = -TILT_DEG * t;
      beam.current?.setAttribute('transform', `rotate(${a.toFixed(3)} ${PIVOT[0]} ${PIVOT[1]})`);
      const [lx, ly] = hookShift(a, -1);
      const [rx, ry] = hookShift(a, 1);
      left.current?.setAttribute('transform', `translate(${lx.toFixed(2)} ${ly.toFixed(2)})`);
      right.current?.setAttribute('transform', `translate(${rx.toFixed(2)} ${ry.toFixed(2)})`);
      strip.current?.setAttribute('transform', `translate(${(-WINDOW.u * DELTA_KB * t).toFixed(2)} 0)`);
      const th = tiltText(t);
      const rd = readText(t);
      for (const [el, text] of [
        [tilt.current, th],
        [tiltOut.current, th],
        [reading.current, rd],
        [readOut.current, rd],
      ] as const) {
        if (el && el.textContent !== text) el.textContent = text;
      }
    },
    [beam, left, right, strip, tilt, reading, tiltOut, readOut],
  );

  /* The engine reports stroke 0's eased alpha, which finishes early, so the
     callback is the per-frame tick and the stage position is read here. */
  const onProgress = useCallback(() => {
    const stage = pinRef.current?.parentElement;
    if (!stage) return;
    const r = stage.getBoundingClientRect();
    const span = r.height - window.innerHeight;
    const p = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 1;
    stage.style.setProperty('--bal-p', p.toFixed(4));
    const inked = inkedAt(p);
    if (inked !== inkedRef.current && countRef.current) {
      inkedRef.current = inked;
      countRef.current.textContent = pad(inked);
    }
    apply(settle((p - TILT_FROM) / (TILT_TO - TILT_FROM)));
  }, [apply]);

  /* Reduced motion: the library draws everything at once and never ticks, so
     show the finished, settled state. */
  const reduced = useSyncExternalStore(subscribeReduced, getReduced, getReducedOnServer);
  useEffect(() => {
    if (!reduced) return;
    pinRef.current?.parentElement?.style.setProperty('--bal-p', '1');
    if (countRef.current) countRef.current.textContent = pad(TOTAL);
    apply(1);
  }, [reduced, apply]);

  const gsapLines = lines(GSAP_CODE);
  const oursLines = lines(OURS_CODE);

  return (
    <ScrollDraw
      className="bal-stage"
      selector={SELECTOR}
      trigger={{ start: 'top top', end: 'bottom bottom' }}
      stagger={STAGGER}
      speed={SPEED}
      easing="ease-in-out"
      onProgress={onProgress}
    >
      <div className="bal-pin" ref={pinRef}>
        <div className="bal-art">
          <div className="bal-figure">
            <Drawing refs={refs} />
          </div>
        </div>
        <div className="bal-copy">
          <p className="bal-kicker">
            <span>04 / against the incumbent</span>
            <span className="bal-count" aria-hidden="true">
              <span ref={countRef}>{pad(0)}</span> / {TOTAL} strokes
            </span>
          </p>
          <h2 id="bal-title" className="bal-title">
            The same drawing in a fifth of the bytes
          </h2>
          <div className="bal-cards">
            <figure className="bal-card bal-card-them">
              <figcaption className="bal-cap">
                <span>
                  GSAP {COMPETITORS.gsapStack.version}
                  <span className="bal-cap-more"> · ScrollTrigger · DrawSVG</span>
                </span>
                <span className="bal-cap-n">
                  {gsapLines} lines · {KB.stack.toFixed(1)} KB
                </span>
              </figcaption>
              <pre className="bal-code">
                <code>{highlight(GSAP_CODE)}</code>
              </pre>
            </figure>
            <figure className="bal-card bal-card-ours">
              <figcaption className="bal-cap">
                <span>svg-scroll-draw {SELF.version}</span>
                <span className="bal-cap-n">
                  {oursLines} lines · {KB.self.toFixed(1)} KB
                </span>
              </figcaption>
              <pre className="bal-code">
                <code>{highlight(OURS_CODE)}</code>
              </pre>
            </figure>
          </div>
          <dl className="bal-read">
            <div>
              <dt>Reading</dt>
              <dd ref={readOut}>{readText(0)}</dd>
            </div>
            <div>
              <dt>Tilt · {DEG_PER_KB}°/KB</dt>
              <dd ref={tiltOut}>{tiltText(0)}</dd>
            </div>
          </dl>
          <p className="bal-note-copy">
            Minified and gzipped at level 9, measured {MEASURED_ON}. GSAP has been free since 2025 and does far more
            than scroll; for the scroll effects here, this is the difference you ship.
          </p>
        </div>
      </div>
    </ScrollDraw>
  );
}
