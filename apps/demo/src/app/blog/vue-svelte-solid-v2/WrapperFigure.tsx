'use client';

import { ScrollDraw } from 'svg-scroll-draw/react';
import './wrappers.css';

export type WrapperRow = {
  /** The framework, as a reader names it. */
  fw: string;
  /** The subpath the wrapper ships in. */
  from: string;
  /** What you write in a component. */
  write: string;
  /** What that hands you back. */
  gives: string;
  /** Where the wrapper creates the engine. */
  start: string;
  /** Where it destroys it. */
  stop: string;
  /** Set when new options tear the engine down and build a fresh one. */
  update?: string;
};

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * The framework guide's opening drawing: what each wrapper actually does.
 * Every row is one framework's scrollAnimate wrapper, read from its source —
 * what you write, what it hands back, and the bar is the engine's lifetime:
 * created in the framework's mount hook, destroyed in its cleanup. Svelte's
 * action rebuilds the engine when its options change, so its bar breaks at
 * update(). All four bars are the same call, createAnimateEngine(el, options),
 * which is what the plain scrollAnimate() runs too.
 */
export function WrapperFigure({ rows }: { rows: WrapperRow[] }) {
  return (
    <ScrollDraw className="wf" selector=".wf-ink" autoplay duration={700} delay={300} stagger={0.1} easing="ease-out" once>
      <p className="wf-hd">
        <span>you write</span>
        <span>engine: created → destroyed</span>
      </p>
      <ol className="wf-list">
        {rows.map((r, i) => (
          <li key={r.fw} className={`wf-row${r.update ? ' is-upd' : ''}`}>
            <span className="wf-n">{pad(i + 1)}</span>
            <div className="wf-main">
              <p className="wf-rh">
                <span className="wf-fw">{r.fw}</span>
                <span className="wf-from">{r.from}</span>
              </p>
              <p className="wf-write">
                <code>{r.write}</code>
                <span>→ {r.gives}</span>
              </p>
              <div className="wf-life">
                <span className="wf-start">{r.start}</span>
                <span className="wf-bar">
                  <svg viewBox="0 0 1000 12" preserveAspectRatio="none" aria-hidden="true">
                    <path d="M0 6 H1000" className="wf-base" />
                    {r.update ? (
                      <>
                        <path d="M0 6 H470" className="wf-ink wf-run" stroke="currentColor" />
                        <path d="M530 6 H1000" className="wf-ink wf-run" stroke="currentColor" />
                      </>
                    ) : (
                      <path d="M0 6 H1000" className="wf-ink wf-run" stroke="currentColor" />
                    )}
                  </svg>
                  {r.update ? <span className="wf-upd">{r.update}</span> : null}
                </span>
                <span className="wf-stop">{r.stop}</span>
              </div>
            </div>
          </li>
        ))}
      </ol>
      <p className="wf-foot">
        <span>every bar</span> is one call to <code>createAnimateEngine(el, options)</code> — the same engine the plain{' '}
        <code>scrollAnimate()</code> runs
      </p>
    </ScrollDraw>
  );
}
