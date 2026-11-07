'use client';

import { ScrollDraw } from 'svg-scroll-draw/react';
import './morph.css';

/**
 * The post's own compatible pair: a square and a diamond, 8 numbers each.
 * `Z` closes both shapes; it carries no numbers, so the pairing is unchanged.
 */
const FROM = 'M10 10 L90 10 L90 90 L10 90 Z';
const TO = 'M50 10 L90 50 L50 90 L10 50 Z';

/** The number pattern and the interpolation the engine runs (core/engine.ts → morphPath). */
const NUM = /[-+]?(?:\d*\.)?\d+(?:[eE][-+]?\d+)?/g;
function morphPath(from: string, to: string, t: number): string {
  const toNums = (to.match(NUM) ?? []).map(Number);
  let idx = 0;
  return from.replace(NUM, (match) => {
    const f = parseFloat(match);
    const target = toNums[idx++] ?? f;
    return String(+(f + (target - f) * t).toFixed(4));
  });
}

/** A path string split into its command letters and numbers, in order. */
const tokens = (d: string) => d.match(/[A-Za-z]|[-+]?(?:\d*\.)?\d+(?:[eE][-+]?\d+)?/g) ?? [];
const isNum = (tok: string) => !/^[A-Za-z]$/.test(tok);

/** The vertices of a path, as [x, y] pairs. */
function points(d: string): [number, number][] {
  const n = (d.match(NUM) ?? []).map(Number);
  const out: [number, number][] = [];
  for (let i = 0; i + 1 < n.length; i += 2) out.push([n[i], n[i + 1]]);
  return out;
}

const FRAMES: { t: number; k: string }[] = [
  { t: 0, k: 'Source d' },
  { t: 0.5, k: 'morphPath()' },
  { t: 1, k: 'morphTo' },
];

const ROWS: { label: string; d: string; kind: 'from' | 'mid' | 'to' }[] = [
  { label: 'source', d: FROM, kind: 'from' },
  { label: 't = 0.5', d: morphPath(FROM, TO, 0.5), kind: 'mid' },
  { label: 'morphTo', d: TO, kind: 'to' },
];

/**
 * The morphing post's opening drawing: what morphTo does to the post's own
 * square → diamond pair. Three frames along the scroll — the source path, the
 * engine's morphPath() at t = 0.5, and the target, each with the other two
 * dashed behind it. Under them, the two `d` strings token by token: numbers pair
 * up by position, and the command letters only ever come from the source.
 * Every shape and number here is computed, not drawn by hand.
 */
export function MorphFigure() {
  const fromToks = tokens(FROM);
  const toToks = tokens(TO);
  const cols = { gridTemplateColumns: `var(--mf-label) repeat(${fromToks.length}, minmax(0, 1fr))` };

  return (
    <ScrollDraw className="mf" selector=".mf-ink" autoplay duration={900} delay={300} stagger={0.12} easing="ease-out" once>
      <div className="mf-frames">
        {FRAMES.map(({ t, k }) => {
          const d = morphPath(FROM, TO, t);
          const now = points(d);
          return (
            <div key={t} className={`mf-frame${t > 0 && t < 1 ? ' is-mid' : ''}`}>
              <p className="mf-fk"><span>t = {t}</span><span>{k}</span></p>
              <svg viewBox="-8 -8 116 116" role="img" aria-label={`The path at t = ${t}: ${d}`}>
                <rect x="0" y="0" width="100" height="100" className="mf-box" />
                {t > 0 ? <path d={FROM} className="mf-ghost" /> : null}
                {t < 1 ? <path d={TO} className="mf-ghost is-to" /> : null}
                <path d={d} className="mf-ink mf-shape" stroke="currentColor" />
                {now.map(([x, y], i) => (
                  <circle key={i} cx={x} cy={y} r="2.6" className="mf-dot" />
                ))}
              </svg>
            </div>
          );
        })}
      </div>

      <div className="mf-axis" aria-hidden="true">
        <svg viewBox="0 0 1000 12" preserveAspectRatio="none">
          <path d="M0 6 H1000" className="mf-ink mf-axis-line" stroke="currentColor" />
        </svg>
        <span>scroll progress 0 → 1 drives t</span>
      </div>

      <div className="mf-tok" role="table" aria-label="The two d strings, token by token">
        {ROWS.map((r) => (
          <div key={r.label} role="row" className={`mf-tr is-${r.kind}`} style={cols}>
            <span role="rowheader" className="mf-tl">{r.label}</span>
            {tokens(r.d).map((tok, i) => {
              const num = isNum(tok);
              const moves = num && r.kind === 'mid' && fromToks[i] !== toToks[i];
              return (
                <span key={i} role="cell" className={`mf-t${num ? ' is-num' : ' is-cmd'}${moves ? ' is-moved' : ''}`}>
                  {tok}
                </span>
              );
            })}
          </div>
        ))}
      </div>
      <p className="mf-key">
        <span><i className="is-num" aria-hidden="true" />Numbers pair up by position</span>
        <span><i className="is-cmd" aria-hidden="true" />Letters come from the source only</span>
      </p>
    </ScrollDraw>
  );
}
