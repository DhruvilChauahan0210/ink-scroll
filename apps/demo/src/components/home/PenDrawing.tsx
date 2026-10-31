'use client';

import { useCallback, useEffect, useRef, useSyncExternalStore, type CSSProperties } from 'react';
import { ScrollDraw } from 'svg-scroll-draw/react';
import { scrollAnimate } from 'svg-scroll-draw';
import {
  ASSEMBLY_GUIDES, AXIS, NOTES, PARTS, PLACE_TRANSFORM, VIEWBOX, toSheet, type Part, type Stroke,
} from './art/pen-geometry';

/**
 * Chapter 00 — the hero's drawing: an exploded fountain pen. On load the
 * library inks every part over a pencil underdrawing; then, as the pinned
 * hero is scrolled, the parts slide home along their assembly guides into one
 * pen. `--asm` (0 exploded → 1 assembled) is written by the library's own
 * scrollAnimate onProgress, measured on the tall stage.
 */

const f = (n: number) => n.toFixed(1);
const TOTAL = PARTS.reduce((n, p) => n + p.strokes.length, 0) + 1;

const RM = '(prefers-reduced-motion: reduce)';
const subscribeReduced = (cb: () => void) => {
  const mq = window.matchMedia(RM);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
};
const getReduced = () => window.matchMedia(RM).matches;
const noopSubscribe = () => () => {};

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

function PartStrokes({ part, pencil }: { part: Part; pencil?: boolean }) {
  return (
    <>
      {part.strokes.map((s: Stroke, i) => (
        <path
          key={i}
          d={s.d}
          stroke="currentColor"
          className={pencil ? 'pe-pencil' : `pe-ink pe-w-${s.w} pe-t-${s.t}${s.fill ? ' pe-fill' : ''}`}
        />
      ))}
    </>
  );
}

export function PenDrawing({ stageSelector, className }: { stageSelector: string; className?: string }) {
  const root = useRef<HTMLDivElement>(null);
  const count = useRef<HTMLSpanElement>(null);
  const ready = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const reduced = useSyncExternalStore(subscribeReduced, getReduced, () => false);

  // Inking on load: the stroke counter and the moment the notes may show.
  const onDraw = useCallback((p: number) => {
    if (count.current) count.current.textContent = String(Math.round(p * TOTAL)).padStart(2, '0');
    if (p >= 0.999) root.current?.setAttribute('data-drawn', '');
  }, []);

  // Assembly by scroll, measured on the pinned stage.
  useEffect(() => {
    const el = root.current;
    const stage = el?.closest<HTMLElement>(stageSelector);
    if (!el || !stage) return;
    const inst = scrollAnimate(el, {
      props: { opacity: [1, 1] },
      trigger: { start: 'top top', end: 'bottom bottom' },
      triggerElement: stage,
      easing: 'linear',
      onProgress: (p: number) => {
        const t = easeInOut(Math.min(1, Math.max(0, (p - 0.05) / 0.75)));
        el.style.setProperty('--asm', t.toFixed(4));
        el.toggleAttribute('data-assembled', t > 0.97);
      },
    });
    return () => inst.destroy();
  }, [stageSelector]);

  return (
    <div
      ref={root}
      className={`pe${ready ? ' is-ready' : ''}${className ? ` ${className}` : ''}`}
      data-drawn={reduced ? '' : undefined}
    >
      <p className="pe-count" aria-hidden="true">
        <span ref={count}>{reduced ? String(TOTAL) : '00'}</span> / {TOTAL} strokes
      </p>
      <div className="pe-stage">
        {/* The pencil underdrawing: the exploded view, static. */}
        <svg className="pe-svg pe-svg-pencil" viewBox={VIEWBOX} aria-hidden="true" focusable="false">
          <g transform={PLACE_TRANSFORM}>
            <path d={AXIS} className="pe-pencil" stroke="currentColor" />
            <path d={ASSEMBLY_GUIDES} className="pe-pencil" stroke="currentColor" />
            {PARTS.map((p) => (
              <g key={p.key} transform={`translate(${p.dx} ${p.dy})`}>
                <PartStrokes part={p} pencil />
              </g>
            ))}
          </g>
        </svg>

        <ScrollDraw className="pe-ink-layer" selector=".pe-ink" autoplay duration={1500} stagger={0.028} delay={250} easing="ease-out" once onProgress={onDraw}>
          <svg className="pe-svg" viewBox={VIEWBOX} role="img"
            aria-label="An exploded technical drawing of a fountain pen — nib, feed, section, converter, barrel and cap — that assembles as the page scrolls">
            <g transform={PLACE_TRANSFORM}>
              <path d={AXIS} className="pe-ink pe-w-h pe-t-mute pe-axis" stroke="currentColor" />
              {/* Back to front for the assembled pen: what goes inside comes first. */}
              {(['feed', 'converter', 'barrel', 'section', 'nib', 'cap'] as const).map((k) => {
                const p = PARTS.find((q) => q.key === k)!;
                return (
                  <g key={k} className={`pe-part pe-part-${k}`} style={{ '--dx': p.dx, '--dy': p.dy } as CSSProperties}>
                    <PartStrokes part={p} />
                    {p.engraving?.map((e, i) => (
                      <text key={i} x={f(e.x)} y={f(e.y)} className="pe-engrave" style={{ fontSize: `${e.size}px` }}>{e.text}</text>
                    ))}
                  </g>
                );
              })}
            </g>

            {/* Notes for the exploded view; they step aside as it assembles. */}
            <g className="pe-notes" aria-hidden="true">
              {NOTES.map((n) => {
                const [ax, ay] = toSheet(n.at[0], n.at[1]);
                const [ex, ey] = n.elbow;
                return (
                  <g key={n.key}>
                    <path d={`M${f(ax)} ${f(ay)} L${f(ex)} ${f(ey)} H${f(n.end)}`} className="pe-lead" />
                    <circle cx={f(ax)} cy={f(ay)} r="3.2" className={n.accent ? 'pe-dot-accent' : 'pe-dot'} />
                    <text x={f(n.end)} y={f(ey - 26)} textAnchor={n.anchor} className="pe-lt">{n.title}</text>
                    <text x={f(n.end)} y={f(ey - 8)} textAnchor={n.anchor} className={n.accent ? 'pe-lv pe-lv-accent' : 'pe-lv'}>{n.value}</text>
                  </g>
                );
              })}
            </g>

            {/* Once assembled: the pen's length, dimensioned. */}
            {(() => {
              const [x0, y0] = toSheet(0, 70);
              const [x1, y1] = toSheet(880, 70);
              const [mx, my] = toSheet(440, 92);
              return (
                <g className="pe-done" aria-hidden="true">
                  <path d={`M${f(x0)} ${f(y0)} L${f(x1)} ${f(y1)}`} className="pe-lead" />
                  <text x={f(mx)} y={f(my)} textAnchor="middle" className="pe-lv" transform={`rotate(-14 ${f(mx)} ${f(my)})`}>
                    assembled · 6 parts · one import
                  </text>
                </g>
              );
            })()}
          </svg>
        </ScrollDraw>
      </div>
    </div>
  );
}
