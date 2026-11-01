'use client';

import './caliber.css';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react';
import { ScrollDraw } from 'svg-scroll-draw/react';
import {
  BAL_DISC,
  BRIDGES,
  DIMENSION,
  DIMENSION_AT,
  FORK_REGION,
  LEADER_AT,
  NOTES,
  PIECES,
  countLayer,
  type Piece,
} from './art/caliber-geometry';

/**
 * Chapter 02 — a watchmaker's caseback drawing that inks itself as the page
 * scrolls. The stage is tall and is the ScrollDraw container; its child is
 * sticky, so the drawing holds still while the scroll scrubs it.
 *
 * Timing is the library's own: in scroll mode every stroke gets the same
 * window, `1 / SPEED` of the stage, and stroke i starts `i × STAGGER` later.
 * With PIECES.length strokes the last one lands at
 * `(n − 1) × STAGGER + 1 / SPEED` of the way through — about 0.87 — which
 * leaves a short hold on the finished drawing before the stage releases.
 */
const STAGGER = 0.009;
const SPEED = 8;
const EASING = 'ease-in-out' as const;
const SELECTOR = '.cal-ink';

/** Stage progress at which stroke `i` has finished drawing. */
const doneAt = (i: number): string => Math.min(1, i * STAGGER + 1 / SPEED).toFixed(3);
/** Stage progress at which stroke `i` starts. */
const startAt = (i: number): string => (i * STAGGER).toFixed(3);

const TOTAL = PIECES.length;
/** Strokes fully inked at stage progress `p`. */
const inkedAt = (p: number): number =>
  p < 1 / SPEED ? 0 : Math.min(TOTAL, Math.floor((p - 1 / SPEED) / STAGGER + 1e-6) + 1);
const pad = (n: number): string => String(n).padStart(String(TOTAL).length, '0');

const STEPS = [
  'Every path measured once',
  'Staggered in the order you wrote them',
  'Eased stroke by stroke',
  'No JavaScript per frame where the browser can',
];

/* Each label reads out a real number: the three options in the code line, and
   a count taken from the geometry. */
const VALUES: Record<(typeof NOTES)[number]['key'], string> = {
  bridge: `speed ${SPEED}`,
  train: `${countLayer('train')} paths`,
  escape: `stagger ${STAGGER}`,
  balance: EASING,
};

/* Consecutive pieces that share a mask or clip go in one group, so document
   order — which is the draw order — is kept exactly. */
type Group = { under: Piece['under']; items: { p: Piece; i: number }[] };
const GROUPS: Group[] = [];
PIECES.forEach((p, i) => {
  const last = GROUPS[GROUPS.length - 1];
  if (last && last.under === p.under) last.items.push({ p, i });
  else GROUPS.push({ under: p.under, items: [{ p, i }] });
});

const LEADERS = new Set<number>([...Object.values(LEADER_AT), DIMENSION_AT, DIMENSION_AT - 1, DIMENSION_AT - 2, DIMENSION_AT - 3]);

function groupAttrs(under: Piece['under'], id: string): { mask?: string; clipPath?: string } {
  if (under === 'bridges') return { mask: `url(#${id}-m-bridges)` };
  if (under === 'fork') return { mask: `url(#${id}-m-fork)` };
  if (under === 'balance') return { mask: `url(#${id}-m-lever)` };
  if (under === 'inside') return { clipPath: `url(#${id}-clip)` };
  return {};
}

/** Masks and the stripe clip, under an id prefix so each SVG owns its own. */
function Defs({ id }: { id: string }) {
  const plates = BRIDGES.map((b, k) => <path key={k} d={b.region} fill="#000" stroke="#000" strokeWidth="9" />);
  return (
    <defs>
      <mask id={`${id}-m-bridges`} maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="1000">
        <rect width="1000" height="1000" fill="#fff" />
        {plates}
      </mask>
      <mask id={`${id}-m-fork`} maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="1000">
        <rect width="1000" height="1000" fill="#fff" />
        {plates}
        <path d={FORK_REGION} fill="#000" stroke="#000" strokeWidth="5" />
      </mask>
      <mask id={`${id}-m-lever`} maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="1000">
        <rect width="1000" height="1000" fill="#fff" />
        {plates}
        <circle cx={BAL_DISC.c[0].toFixed(1)} cy={BAL_DISC.c[1].toFixed(1)} r={BAL_DISC.r.toFixed(1)} fill="#000" />
      </mask>
      <clipPath id={`${id}-clip`}>
        {BRIDGES.map((b, k) => (
          <path key={k} d={b.region} />
        ))}
      </clipPath>
    </defs>
  );
}

/** The movement's strokes in document order, each run under its mask. */
function Strokes({ id, ghost }: { id: string; ghost?: boolean }) {
  return (
    <>
      {GROUPS.map((g, gi) => {
        const items = ghost ? g.items.filter(({ p }) => p.layer !== 'note') : g.items;
        if (!items.length) return null;
        const paths = items.map(({ p, i }) => (
          <path
            key={i}
            className={
              ghost
                ? `cal-pencil cal-w-${p.w}`
                : `cal-ink cal-w-${p.w} cal-t-${p.tone}${LEADERS.has(i) ? ' cal-lead' : ''}`
            }
            d={p.d}
          />
        ));
        const attrs = groupAttrs(g.under, id);
        return attrs.mask || attrs.clipPath ? (
          <g key={gi} {...attrs}>
            {paths}
          </g>
        ) : (
          <g key={gi}>{paths}</g>
        );
      })}
    </>
  );
}

function Drawing() {
  return (
    <>
      {/* The pencil underdrawing: static, in its own SVG so the per-frame ink
          updates never repaint it. The ink traces exactly over it. */}
      <svg className="cal-svg cal-svg-pencil" viewBox="0 0 1000 1000" aria-hidden="true" focusable="false">
        <Defs id="cal-p" />
        <Strokes id="cal-p" ghost />
      </svg>
      <svg className="cal-svg" viewBox="0 0 1000 1000" role="img" aria-label="Technical drawing of a hand-wound watch movement seen through the caseback">
        <Defs id="cal-i" />
        <Strokes id="cal-i" />

        <g className="cal-notes" aria-hidden="true">
          <text
            className="cal-note cal-dim"
            x={DIMENSION.x}
            y={DIMENSION.y}
            textAnchor="middle"
            style={{ '--cal-at': doneAt(DIMENSION_AT) } as CSSProperties}
          >
            {DIMENSION.text}
          </text>
          {NOTES.map((n) => {
            const at = LEADER_AT[n.key];
            return (
              <g key={n.key}>
                <circle
                  className={`cal-note cal-dot${n.accent ? ' cal-dot-accent' : ''}`}
                  cx={n.dot[0].toFixed(1)}
                  cy={n.dot[1].toFixed(1)}
                  r="3.2"
                  style={{ '--cal-at': startAt(at) } as CSSProperties}
                />
                <text
                  className="cal-note cal-label"
                  x={n.text[0]}
                  y={n.text[1]}
                  textAnchor={n.anchor}
                  style={{ '--cal-at': doneAt(at) } as CSSProperties}
                >
                  <tspan className="cal-label-t" x={n.text[0]} dy="-19">
                    {n.title}
                  </tspan>
                  <tspan className="cal-label-v" x={n.text[0]} dy="21">
                    {VALUES[n.key]}
                  </tspan>
                </text>
              </g>
            );
          })}
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

export function Caliber() {
  const pinRef = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const inkedRef = useRef(0);
  const stepRef = useRef(0);
  const [step, setStep] = useState(0);

  /* The engine reports stroke 0's eased alpha, which finishes early, so the
     callback is used as the per-frame tick and the stage position is read
     here instead. One style write per frame; React only hears about a step
     change. */
  const onProgress = useCallback(() => {
    const stage = pinRef.current?.parentElement;
    if (!stage) return;
    const r = stage.getBoundingClientRect();
    const span = r.height - window.innerHeight;
    const p = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 1;
    stage.style.setProperty('--cal-p', p.toFixed(4));
    const inked = inkedAt(p);
    if (inked !== inkedRef.current && countRef.current) {
      inkedRef.current = inked;
      countRef.current.textContent = pad(inked);
    }
    const next = p >= 0.75 ? 3 : p >= 0.5 ? 2 : p >= 0.25 ? 1 : 0;
    if (next !== stepRef.current) {
      stepRef.current = next;
      setStep(next);
    }
  }, []);

  /* Reduced motion: the library draws everything at once and never ticks,
     so show the finished state. The preference is read as an external store
     (false on the server, so hydration matches) rather than set in an effect. */
  const reduced = useSyncExternalStore(subscribeReduced, getReduced, getReducedOnServer);
  const shown = reduced ? STEPS.length - 1 : step;
  useEffect(() => {
    if (!reduced) return;
    pinRef.current?.parentElement?.style.setProperty('--cal-p', '1');
    if (countRef.current) countRef.current.textContent = pad(TOTAL);
  }, [reduced]);

  return (
    <ScrollDraw
      className="cal-stage"
      selector={SELECTOR}
      trigger={{ start: 'top top', end: 'bottom bottom' }}
      stagger={STAGGER}
      speed={SPEED}
      easing={EASING}
      onProgress={onProgress}
    >
      <div className="cal-pin" ref={pinRef}>
        <div className="cal-copy">
          <p className="cal-kicker">
            <span>02 / scrollDraw, scrubbed</span>
            <span className="cal-count" aria-hidden="true">
              <span ref={countRef}>{pad(0)}</span> / {TOTAL} strokes
            </span>
          </p>
          <h2 className="cal-title">A watchmaker’s drawing, inked by your scroll.</h2>
          <ol className="cal-steps">
            {STEPS.map((s, i) => (
              <li key={s} className={`cal-step${i === shown ? ' is-on' : ''}${i < shown ? ' is-done' : ''}`}>
                <span className="cal-step-n">{String(i + 1).padStart(2, '0')}</span>
                <span className="cal-step-t">{s}</span>
              </li>
            ))}
          </ol>
          {/* Broken like real code: one option per line on a phone, the three
              options on one line where the column is wide enough. */}
          <code className="cal-code">
            <span className="cal-c-l">
              <span className="cal-c-fn">scrollDraw</span>(<span className="cal-c-str">&apos;#caliber&apos;</span>, {'{'}
            </span>
            <span className="cal-c-l cal-c-in">
              <span className="cal-c-o">
                stagger: <span className="cal-c-num">{STAGGER}</span>,
              </span>{' '}
              <span className="cal-c-o">
                speed: <span className="cal-c-num">{SPEED}</span>,
              </span>{' '}
              <span className="cal-c-o">
                easing: <span className="cal-c-str">&apos;{EASING}&apos;</span>,
              </span>
            </span>
            <span className="cal-c-l">{'})'}</span>
          </code>
        </div>
        <div className="cal-art" id="caliber">
          <Drawing />
        </div>
      </div>
    </ScrollDraw>
  );
}
