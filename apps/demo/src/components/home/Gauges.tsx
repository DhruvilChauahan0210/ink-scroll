'use client';

import './gauges.css';
import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore, type CSSProperties, type ReactNode } from 'react';
import { ScrollDraw } from 'svg-scroll-draw/react';
import {
  buildGauge,
  buildMeter,
  buildOdometer,
  buildPlate,
  type Instrument,
  type Piece,
} from './art/gauge-geometry';

/**
 * Chapter 06 — the proof, drawn as an instrument panel in two banks: three
 * matched sub-dials (one per browser engine), then the readings — an odometer
 * for the unit tests, a panel meter for the bundle budget and a maker's plate.
 *
 * Not pinned. Each bank is its own ScrollDraw with the same options, so each
 * one inks while it is on screen: between its top reaching 85% of the viewport
 * and its centre reaching 45%. One panel this tall cannot do that — its lower
 * half would be inked before it scrolled into view.
 *
 * Timing is the library's own: every stroke gets `1 / SPEED` of its bank's
 * window and stroke i starts `i × STAGGER` later, in document order — so the
 * dials ink left to right, then the odometer, the meter and the plate. Each
 * needle starts to sweep once its own stroke is mostly inked; `onProgress` is
 * the per-frame tick that moves the needles and rolls the drums.
 */
const STAGGER = 0.014;
const SPEED = 7;
const EASING = 'ease-in-out' as const;
const SELECTOR = '.ga-ink';
const TRIGGER = { start: 'top 85%', end: 'center 45%' };
/** Full scale of the budget meter, in KB. */
const FULL_KB = 12;

const doneAt = (i: number): number => Math.min(1, i * STAGGER + 1 / SPEED);
const startAt = (i: number): number => i * STAGGER;
const at = (n: number): string => n.toFixed(3);
/** Strokes of a bank of `n` fully inked at bank progress `p`. */
const inkedAt = (p: number, n: number): number =>
  p < 1 / SPEED ? 0 : Math.min(n, Math.floor((p - 1 / SPEED) / STAGGER + 1e-6) + 1);

const ENGINES = [
  { name: 'CHROMIUM', label: 'Chromium', device: 'Desktop Chrome', side: 'left', dim: 'start' },
  { name: 'FIREFOX', label: 'Firefox', device: 'Desktop Firefox', side: 'left', dim: 'mid' },
  { name: 'WEBKIT', label: 'WebKit', device: 'Desktop Safari', side: 'right', dim: 'end' },
] as const;

/** Digits round a drum: a 9 above the 0 and a 0, 1 after the 9, so a carry has something to roll to. */
const GLYPHS = ['9', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '1'];

const clamp01 = (n: number): number => Math.min(1, Math.max(0, n));
const easeInOut = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const smooth = (t: number): number => t * t * (3 - 2 * t);

/**
 * A needle's travel over its window, as a fraction of its reading: eased up to
 * a 1.6% overshoot, then a damped settle onto the mark.
 */
function needle(p: number, a: number, b: number): number {
  const t = clamp01((p - a) / (b - a));
  const K = 0.78;
  const OVER = 0.016;
  if (t <= K) return (1 + OVER) * easeInOut(t / K);
  const u = smooth((t - K) / (1 - K));
  return 1 + OVER * Math.cos(u * 1.5 * Math.PI) * (1 - u);
}

/** A bank's progress through the trigger window, read from its own rect: top at 85% → 0, centre at 45% → 1. */
function bankProgress(el: HTMLElement | null | undefined): number {
  if (!el) return 0;
  const r = el.getBoundingClientRect();
  const vh = window.innerHeight;
  const span = r.height / 2 + vh * 0.4;
  return span > 0 ? clamp01((vh * 0.85 - r.top) / span) : 1;
}

/** Where each instrument's strokes start inside its bank. */
function offsets(list: Instrument[]): { bases: number[]; total: number } {
  const bases: number[] = [];
  let n = 0;
  for (const ins of list) {
    bases.push(n);
    n += ins.pieces.length;
  }
  return { bases, total: n };
}

/* ── Rendering ────────────────────────────────────────────────────────────── */

type Values = Record<string, { t: string; v: string }>;

function inkClass(p: Piece): string {
  const solid = p.solid === 'accent' ? ' ga-solid ga-solid-a' : p.solid ? ' ga-solid' : '';
  return `ga-ink ga-w-${p.w} ga-t-${p.tone}${p.lead ? ' ga-lead' : ''}${solid}`;
}

/** Pieces `from`–`to` in order, consecutive pieces of one group in one `<g>`. */
function Strokes({
  ins,
  base,
  from,
  to,
  id,
  needleRef,
}: {
  ins: Instrument;
  base: number;
  from: number;
  to: number;
  id: string;
  needleRef?: (el: SVGGElement | null) => void;
}) {
  const runs: { g: Piece['g']; items: number[] }[] = [];
  for (let i = from; i < to; i++) {
    const g = ins.pieces[i].g;
    const last = runs[runs.length - 1];
    if (last && last.g === g) last.items.push(i);
    else runs.push({ g, items: [i] });
  }
  return (
    <>
      {runs.map((r) => {
        const paths = r.items.map((i) => {
          const p = ins.pieces[i];
          return (
            <path
              key={i}
              className={inkClass(p)}
              d={p.d}
              style={p.solid ? ({ '--ga-at': at(doneAt(base + i)) } as CSSProperties) : undefined}
            />
          );
        });
        if (r.g === 'needle')
          return (
            <g key={`n${r.items[0]}`} ref={needleRef} className="ga-needle">
              {paths}
            </g>
          );
        if (r.g === 'clip')
          return (
            <g key={`c${r.items[0]}`} clipPath={`url(#${id}-clip)`}>
              {paths}
            </g>
          );
        return paths;
      })}
    </>
  );
}

function Art({
  ins,
  base,
  id,
  label,
  values,
  needleRef,
  slot,
  defs,
}: {
  ins: Instrument;
  base: number;
  id: string;
  label: string;
  values: Values;
  needleRef?: (el: SVGGElement | null) => void;
  slot?: ReactNode;
  defs?: ReactNode;
}) {
  const box = `0 0 ${ins.w} ${ins.h}`;
  const clip = ins.clip ? (
    <clipPath id={`${id}-clip`}>
      <path d={ins.clip} clipRule="evenodd" />
    </clipPath>
  ) : null;
  return (
    <div
      className="ga-art"
      style={
        {
          '--ga-ar': `${ins.w} / ${ins.h}`,
          '--ga-crop': `${((ins.top / ins.w) * 100).toFixed(3)}%`,
          '--ga-cropb': `${((ins.bottom / ins.w) * 100).toFixed(3)}%`,
          '--ga-gx': `${(ins.glow[0] * 100).toFixed(1)}%`,
          '--ga-gy': `${(ins.glow[1] * 100).toFixed(1)}%`,
        } as CSSProperties
      }
    >
      {/* The pencil underdrawing: static, in its own SVG, so the per-frame ink
          never repaints it. Moving parts are shown at rest as phantom lines. */}
      <svg className="ga-svg ga-svg-pencil" viewBox={box} aria-hidden="true" focusable="false">
        {ins.clip ? (
          <defs>
            <clipPath id={`${id}-pclip`}>
              <path d={ins.clip} clipRule="evenodd" />
            </clipPath>
          </defs>
        ) : null}
        {ins.pieces.map((p, i) =>
          p.lead || p.moving ? null : (
            <path
              key={i}
              className="ga-pencil"
              d={p.d}
              clipPath={p.g === 'clip' ? `url(#${id}-pclip)` : undefined}
            />
          ),
        )}
        {ins.needle ? <path className="ga-pencil ga-phantom" d={ins.needle.phantom} /> : null}
      </svg>
      <svg className="ga-svg" viewBox={box} role="img" aria-label={label}>
        {clip || defs ? (
          <defs>
            {clip}
            {defs}
          </defs>
        ) : null}
        <Strokes ins={ins} base={base} from={0} to={ins.layerAt} id={id} />
        {ins.engr.map((e, k) => (
          <text
            key={k}
            className={`ga-e ga-e-${e.kind}${e.key ? ' ga-e-key' : ''}`}
            x={e.x.toFixed(1)}
            y={e.y.toFixed(1)}
            dy="0.36em"
            textAnchor={e.anchor}
            style={{ '--ga-at': at(doneAt(base + e.at)) } as CSSProperties}
          >
            {e.text}
          </text>
        ))}
        {slot}
        <Strokes ins={ins} base={base} from={ins.layerAt} to={ins.pieces.length} id={id} needleRef={needleRef} />
        <g className="ga-notes" aria-hidden="true">
          {ins.dims.map((d) => (
            <text
              key={d.key}
              className="ga-note ga-dim"
              x={d.x.toFixed(1)}
              y={d.y.toFixed(1)}
              dy="0.36em"
              textAnchor="middle"
              style={{ '--ga-at': at(doneAt(base + d.at)) } as CSSProperties}
            >
              {values[d.key]?.v}
            </text>
          ))}
          {ins.notes.map((n) => (
            <g key={n.key}>
              <circle
                className={`ga-note ga-dot${n.accent ? ' ga-dot-accent' : ''}`}
                cx={n.dot[0].toFixed(1)}
                cy={n.dot[1].toFixed(1)}
                r="3"
                style={{ '--ga-at': at(startAt(base + n.at)) } as CSSProperties}
              />
              <text
                className="ga-note ga-label"
                x={n.text[0].toFixed(1)}
                y={n.text[1].toFixed(1)}
                textAnchor={n.anchor}
                style={{ '--ga-at': at(doneAt(base + n.at)) } as CSSProperties}
              >
                <tspan className="ga-label-t" x={n.text[0].toFixed(1)} dy="-1.5em">
                  {values[n.key]?.t}
                </tspan>
                <tspan className="ga-label-v" x={n.text[0].toFixed(1)} dy="1.2em">
                  {values[n.key]?.v}
                </tspan>
              </text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}

/* ── Reduced motion, read as an external store ────────────────────────────── */

const REDUCED = '(prefers-reduced-motion: reduce)';
function subscribeReduced(cb: () => void): () => void {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}
const getReduced = (): boolean => window.matchMedia(REDUCED).matches;
const getReducedOnServer = (): boolean => false;

/* ── The chapter ──────────────────────────────────────────────────────────── */

type Props = { unitTests: number; browserTests: number; gzipKb: number; budgetKb: number };

const pad = (n: number, w: number): string => String(n).padStart(w, '0');

export function Gauges({ unitTests, browserTests, gzipKb, budgetKb }: Props) {
  const m = useMemo(() => {
    const gauges = ENGINES.map((e) => buildGauge(browserTests, e.name, e.side, e.dim));
    const drums = Math.max(5, String(unitTests).length + 2);
    const odo = buildOdometer(drums);
    const meter = buildMeter(FULL_KB, budgetKb);
    const plate = buildPlate();
    const dials = offsets(gauges);
    const reads = offsets([odo, meter, plate]);
    /* Windows are in each bank's own progress. A needle starts once its
       stroke is 60% inked; the three sweeps are the same length, the last one
       landing as its bank reaches the end of its window. The drums roll once
       the last drum is drawn, the meter once its needle is. */
    const lead = 0.6 / SPEED;
    const gaugeWin = gauges.map((g, k): [number, number] => {
      const a = startAt(dials.bases[k] + (g.needle?.at ?? 0)) + lead;
      return [a, Math.min(1, a + 0.36)];
    });
    const odoWin: [number, number] = [doneAt(reads.bases[0] + (odo.odo?.at ?? 0)) + 0.02, 1];
    const meterWin: [number, number] = [startAt(reads.bases[1] + (meter.needle?.at ?? 0)) + lead, 1];
    return { gauges, odo, meter, plate, dials, reads, gaugeWin, odoWin, meterWin, drums };
  }, [unitTests, browserTests, budgetKb]);

  const { drums } = m;
  const total = m.dials.total + m.reads.total;
  const digits = String(unitTests).length;
  const tw = String(browserTests).length;

  const dialsRef = useRef<HTMLDivElement>(null);
  const readsRef = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const needleRefs = useRef<(SVGGElement | null)[]>([]);
  const readRefs = useRef<(HTMLElement | null)[]>([]);
  const drumRefs = useRef<(SVGGElement | null)[]>([]);
  const last = useRef<string[]>([]);

  const apply = useCallback(
    (p1: number, p2: number) => {
      const bank1 = dialsRef.current?.parentElement;
      const bank2 = readsRef.current?.parentElement;
      /** Write an attribute or text only when it changes. */
      const write = (slot: number, value: string, fn: () => void): void => {
        if (last.current[slot] === value) return;
        last.current[slot] = value;
        fn();
      };
      const v1 = p1.toFixed(4);
      const v2 = p2.toFixed(4);
      write(40, v1, () => bank1?.style.setProperty('--ga-p', v1));
      write(41, v2, () => bank2?.style.setProperty('--ga-p', v2));

      const inked = inkedAt(p1, m.dials.total) + inkedAt(p2, m.reads.total);
      write(0, String(inked), () => {
        if (countRef.current) countRef.current.textContent = pad(inked, String(total).length);
      });

      m.gauges.forEach((g, k) => {
        const [a, b] = m.gaugeWin[k];
        const frac = needle(p1, a, b);
        const c = g.needle!.c;
        const deg = (frac * g.needle!.sweep).toFixed(2);
        const el = needleRefs.current[k];
        write(1 + k, deg, () => el?.setAttribute('transform', `rotate(${deg} ${c[0]} ${c[1]})`));
        const n = Math.min(browserTests, Math.round(frac * browserTests));
        const r = readRefs.current[k];
        write(10 + k, String(n), () => {
          if (r) r.textContent = pad(n, tw);
        });
      });

      {
        const [a, b] = m.meterWin;
        const frac = needle(p2, a, b);
        const kb = frac * gzipKb;
        const c = m.meter.needle!.c;
        const deg = ((kb / FULL_KB) * m.meter.needle!.sweep).toFixed(2);
        const el = needleRefs.current[3];
        write(4, deg, () => el?.setAttribute('transform', `rotate(${deg} ${c[0]} ${c[1]})`));
        const shown = Math.min(gzipKb, kb).toFixed(1);
        const r = readRefs.current[3];
        write(13, shown, () => {
          if (r) r.textContent = shown;
        });
      }

      {
        const [a, b] = m.odoWin;
        const v = easeInOut(clamp01((p2 - a) / (b - a))) * unitTests;
        const pitch = m.odo.odo!.pitch;
        for (let i = 0; i < drums; i++) {
          // Drum i shows 10^k; it turns only while every drum below it rolls 9 → 0.
          const k = drums - 1 - i;
          const unit = 10 ** k;
          const whole = Math.floor(v / unit) % 10;
          const rest = v % unit;
          const carry = k === 0 ? v % 1 : Math.max(0, rest - (unit - 1));
          const pos = (whole + carry).toFixed(3);
          const el = drumRefs.current[i];
          write(20 + i, pos, () => el?.setAttribute('transform', `translate(0 ${(-(whole + carry) * pitch).toFixed(2)})`));
        }
      }
    },
    [m, total, drums, browserTests, gzipKb, unitTests, tw],
  );

  /* The engine reports stroke 0's eased alpha, which finishes early, so the
     callback is the per-frame tick, and both banks' own progress through the
     trigger window is read here. Either bank's engine may be the one ticking;
     both readings are kept current from whichever does. */
  const readNeedles = useCallback(() => {
    apply(bankProgress(dialsRef.current?.parentElement), bankProgress(readsRef.current?.parentElement));
  }, [apply]);

  /* Reduced motion: the library draws everything at once and never ticks, so
     the finished panel is set directly. */
  const reduced = useSyncExternalStore(subscribeReduced, getReduced, getReducedOnServer);
  useEffect(() => {
    if (reduced) apply(1, 1);
  }, [reduced, apply]);

  const zeros = drums - digits;
  const ob = m.reads.bases[0];
  const mb = m.reads.bases[1];
  const pb = m.reads.bases[2];

  const odoDefs = (
    <>
      <linearGradient id="ga-odo-fade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#000" />
        <stop offset="0.26" stopColor="#fff" />
        <stop offset="0.74" stopColor="#fff" />
        <stop offset="1" stopColor="#000" />
      </linearGradient>
      <mask id="ga-odo-win" maskUnits="userSpaceOnUse" x="0" y="0" width={m.odo.w} height={m.odo.h}>
        <rect
          x={m.odo.odo!.drums[0].x.toFixed(1)}
          y={m.odo.odo!.y.toFixed(1)}
          width={(m.odo.odo!.drums[drums - 1].x + m.odo.odo!.drums[drums - 1].w - m.odo.odo!.drums[0].x).toFixed(1)}
          height={m.odo.odo!.h.toFixed(1)}
          fill="url(#ga-odo-fade)"
        />
      </mask>
    </>
  );

  const odoDigits = (
    <g
      className="ga-digits"
      mask="url(#ga-odo-win)"
      style={{ '--ga-at': at(doneAt(ob + m.odo.odo!.at)) } as CSSProperties}
    >
      {m.odo.odo!.drums.map((d, i) => (
        <g
          key={i}
          ref={(el) => {
            drumRefs.current[i] = el;
          }}
          className={i < zeros ? 'ga-drum ga-drum-lead' : 'ga-drum'}
        >
          {GLYPHS.map((g, k) => (
            <text key={k} x={(d.x + d.w / 2).toFixed(1)} y={(m.odo.odo!.base + (k - 1) * m.odo.odo!.pitch).toFixed(1)} textAnchor="middle">
              {g}
            </text>
          ))}
        </g>
      ))}
    </g>
  );

  const capAt = (a: number): CSSProperties => ({ '--ga-at': at(Math.max(0, a - 0.03)) }) as CSSProperties;

  return (
    <section className="sec ga-stage" aria-labelledby="ga-title">
      <div className="ga-head">
        <p className="ga-kicker">
          <span>06 / proof</span>
          <span className="ga-count" aria-hidden="true">
            <span ref={countRef}>{pad(0, String(total).length)}</span> / {total} strokes
          </span>
        </p>
        <h2 className="ga-title" id="ga-title">
          Tested in real browsers, not just in theory.
        </h2>
        {/* Broken like real code: one key per line on a phone. */}
        <code className="ga-code">
          <span className="ga-c-l">
            <span className="ga-c-k">const</span> opts = {'{'}
          </span>
          <span className="ga-c-l ga-c-in">
            trigger: {'{'} start: <span className="ga-c-str">&apos;{TRIGGER.start}&apos;</span>,{' '}
            <span className="ga-c-t">
              end: <span className="ga-c-str">&apos;{TRIGGER.end}&apos;</span> {'}'},
            </span>
          </span>
          <span className="ga-c-l ga-c-in">
            <span className="ga-c-o">
              stagger: <span className="ga-c-num">{STAGGER}</span>, speed: <span className="ga-c-num">{SPEED}</span>,
            </span>{' '}
            <span className="ga-c-o">
              onProgress: <span className="ga-c-fn">readNeedles</span>,
            </span>
          </span>
          <span className="ga-c-l">{'}'}</span>
          <span className="ga-c-l">
            <span className="ga-c-fn">scrollDraw</span>(<span className="ga-c-str">&apos;#dials&apos;</span>, opts)
          </span>
          <span className="ga-c-l">
            <span className="ga-c-fn">scrollDraw</span>(<span className="ga-c-str">&apos;#readings&apos;</span>, opts)
          </span>
        </code>
      </div>

      {/* Bank 1 — the three engines. */}
      <ScrollDraw
        className="ga-bank ga-bank-dials"
        selector={SELECTOR}
        trigger={TRIGGER}
        stagger={STAGGER}
        speed={SPEED}
        easing={EASING}
        onProgress={readNeedles}
      >
        <div className="ga-grid ga-grid-dials" ref={dialsRef} id="dials">
          {m.gauges.map((g, k) => {
            const e = ENGINES[k];
            return (
              <figure className="ga-fig ga-fig-gauge" key={e.name}>
                <Art
                  ins={g}
                  base={m.dials.bases[k]}
                  id={`ga-g${k}`}
                  label={`Dial for ${e.label}: ${browserTests} of ${browserTests} browser tests passing`}
                  values={{
                    engine: { t: 'PLAYWRIGHT', v: e.device },
                    dim: { t: '', v: `${ENGINES.length} × ${browserTests} = ${ENGINES.length * browserTests}` },
                  }}
                  needleRef={(el) => {
                    needleRefs.current[k] = el;
                  }}
                />
                <figcaption className="ga-cap" aria-hidden="true" style={capAt(m.gaugeWin[k][0])}>
                  <span className="ga-cap-v">
                    <b
                      ref={(el) => {
                        readRefs.current[k] = el;
                      }}
                    >
                      {pad(0, tw)}
                    </b>{' '}
                    / {browserTests} passing
                  </span>
                </figcaption>
              </figure>
            );
          })}
        </div>
      </ScrollDraw>

      {/* Bank 2 — the readings. */}
      <ScrollDraw
        className="ga-bank ga-bank-reads"
        selector={SELECTOR}
        trigger={TRIGGER}
        stagger={STAGGER}
        speed={SPEED}
        easing={EASING}
        onProgress={readNeedles}
      >
        <div className="ga-grid ga-grid-reads" ref={readsRef} id="readings">
          <figure className="ga-fig ga-fig-odo">
            <Art
              ins={m.odo}
              base={ob}
              id="ga-odo"
              label={`Odometer reading ${unitTests} unit tests`}
              values={{
                drums: { t: 'DRUMS', v: `${drums}, carry on 9` },
                env: { t: 'ENVIRONMENTS', v: 'jsdom · node' },
              }}
              slot={odoDigits}
              defs={odoDefs}
            />
            <figcaption className="ga-cap" aria-hidden="true" style={capAt(m.odoWin[0])}>
              <span className="ga-cap-t">Unit tests</span>
              <span className="ga-cap-v">incl. a no-DOM SSR suite</span>
            </figcaption>
          </figure>

          <figure className="ga-fig ga-fig-meter">
            <Art
              ins={m.meter}
              base={mb}
              id="ga-m"
              label={`Meter reading ${gzipKb} KB gzipped, under a ${budgetKb} KB budget`}
              values={{
                scale: { t: 'SCALE', v: `0–${FULL_KB} KB gzip` },
                budget: { t: 'CI BUDGET', v: `${budgetKb} KB` },
              }}
              needleRef={(el) => {
                needleRefs.current[3] = el;
              }}
            />
            <figcaption className="ga-cap" aria-hidden="true" style={capAt(m.meterWin[0])}>
              <span className="ga-cap-t">Main entry</span>
              <span className="ga-cap-v">
                <b
                  ref={(el) => {
                    readRefs.current[3] = el;
                  }}
                >
                  0.0
                </b>{' '}
                KB · budget enforced in CI
              </span>
            </figcaption>
          </figure>

          <figure className="ga-fig ga-fig-plate" style={{ '--ga-at': at(startAt(pb)) } as CSSProperties}>
            <Art ins={m.plate} base={pb} id="ga-pl" label="Zero runtime dependencies" values={{}} />
          </figure>
        </div>
      </ScrollDraw>
    </section>
  );
}
