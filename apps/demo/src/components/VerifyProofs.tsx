'use client';

import { useEffect, useRef, useState } from 'react';
import { scrollDraw } from 'svg-scroll-draw';
import { Meter, Stat, Stats, Tag, Verdict } from './VerifyKit';

const PATH_D = 'M10 50 C 40 10, 80 10, 100 50 S 160 90, 190 50';

/* ────────────────────────────────────────────────────────────────────────────
   01 — The SVG attribute bug in `npx svg-scroll-draw init`
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * Both blocks are injected as raw HTML on purpose.
 *
 * If these were written as JSX, React would silently normalise `strokeWidth`
 * into `stroke-width` and the bug would vanish — exactly the reason it survived
 * review. Vue and Svelte templates are parsed as HTML, where `strokeWidth` is
 * an unknown attribute and gets dropped, so the path falls back to a 1px
 * butt-capped stroke. Injecting raw HTML reproduces what those users actually got.
 * Colour comes from the container (`currentColor`), which adds no attribute, so
 * the parsed-attribute readout below is exactly what those users' paths carried.
 */
const BROKEN_SVG = `<svg viewBox="0 0 200 100" width="100%" style="overflow:visible">
  <path d="${PATH_D}" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
</svg>`;

const FIXED_SVG = `<svg viewBox="0 0 200 100" width="100%" style="overflow:visible">
  <path d="${PATH_D}" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" fill="none" />
</svg>`;

export function AttributeProof() {
  const brokenRef = useRef<HTMLDivElement>(null);
  const fixedRef = useRef<HTMLDivElement>(null);
  const [read, setRead] = useState<{ broken: string[]; fixed: string[] } | null>(null);

  useEffect(() => {
    // Read back what the HTML parser actually stored on each <path>.
    const names = (root: HTMLElement | null) => {
      const p = root?.querySelector('path');
      return p ? Array.from(p.attributes).map((a) => a.name) : [];
    };
    setRead({ broken: names(brokenRef.current), fixed: names(fixedRef.current) });
  }, []);

  const cell = (
    title: string,
    sub: string,
    html: string,
    ref: React.RefObject<HTMLDivElement | null>,
    attrs: string[] | undefined,
    bad: boolean,
  ) => (
    <div className="vf-cell">
      <div className="vf-cell-head">
        <code className="vf-cell-t">{title}</code>
        <Tag tone={bad ? 'old' : 'new'}>{bad ? 'before' : 'after'}</Tag>
      </div>
      <p className="vf-cell-sub">{sub}</p>
      <div
        ref={ref}
        className={`vf-spec vf-spec-pad${bad ? ' is-bad' : ''}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <p className="vf-attrs">
        <span className="vf-attrs-k">parsed attributes</span>
        {attrs?.length
          ? attrs.map((a) => (
              <span key={a} className={a === 'strokewidth' || a === 'strokelinecap' ? 'is-dropped' : undefined}>
                {a}
              </span>
            ))
          : <span>…</span>}
      </p>
    </div>
  );

  // Proven when the parser demonstrably dropped the camelCase attribute AND
  // kept the hyphenated one. Before the read-back it is unmeasured, not failed.
  const proven = read
    ? read.broken.includes('strokewidth') &&
      !read.broken.includes('stroke-width') &&
      read.fixed.includes('stroke-width')
    : null;

  return (
    <div>
      <div className="vf-pair">
        {cell(
          'strokeWidth="2.5"',
          'what Vue / Svelte users generated',
          BROKEN_SVG,
          brokenRef,
          read?.broken,
          true,
        )}
        {cell(
          'stroke-width="2.5"',
          'what they get now',
          FIXED_SVG,
          fixedRef,
          read?.fixed,
          false,
        )}
      </div>
      <Verdict ok={proven}>
        The left path asked for a <strong>2.5px round</strong> stroke and rendered a{' '}
        <strong>1px butt-capped hairline</strong>. The HTML parser lowercased{' '}
        <code>strokeWidth</code> to{' '}
        <code className="is-bad">strokewidth</code>, which is not an SVG
        attribute, so it was discarded. Every Vue and Svelte starter file from{' '}
        <code>npx svg-scroll-draw init</code> shipped this.
      </Verdict>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   02 — getProgress() during an autoplay run
   ──────────────────────────────────────────────────────────────────────────── */

export function GetProgressProof() {
  const boxRef = useRef<HTMLDivElement>(null);
  const instRef = useRef<ReturnType<typeof scrollDraw> | null>(null);
  const [progress, setProgress] = useState(0);
  const [peak, setPeak] = useState(0);
  const [runs, setRuns] = useState(0);

  useEffect(() => {
    if (!boxRef.current) return;

    const inst = scrollDraw(boxRef.current, {
      autoplay: true,
      duration: 2200,
      easing: 'ease-in-out',
      repeat: 'infinite',
      repeatDelay: 400,
    });
    instRef.current = inst;

    let raf = 0;
    const poll = () => {
      const p = inst.getProgress();
      setProgress(p);
      setPeak((prev) => Math.max(prev, p));
      raf = requestAnimationFrame(poll);
    };
    raf = requestAnimationFrame(poll);

    return () => {
      cancelAnimationFrame(raf);
      inst.destroy();
    };
  }, []);

  return (
    <div>
      <div className="vf-split">
        <div ref={boxRef} className="vf-spec vf-spec-pad is-accent">
          <svg viewBox="0 0 200 100" width="100%" style={{ overflow: 'visible' }}>
            <path d={PATH_D} stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
          </svg>
        </div>

        <div className="vf-side">
          <Stats cols={2}>
            <Stat label="getProgress()" value={progress.toFixed(3)} />
            <Stat label="peak seen" value={peak.toFixed(3)} />
          </Stats>
          <Meter value={progress} />
          <button
            type="button"
            onClick={() => {
              instRef.current?.replay();
              setPeak(0);
              setRuns((r) => r + 1);
            }}
            className="btn btn-sm btn-solid vf-btn"
          >
            replay() {runs > 0 && <span className="vf-btn-n">· {runs}</span>}
          </button>
        </div>
      </div>

      <Verdict ok={peak > 0.01 ? true : null}>
        {peak > 0.01 ? (
          <>
            <code>getProgress()</code> is tracking the autoplay run — peak{' '}
            <strong>{peak.toFixed(3)}</strong>. Before the fix this readout sat at{' '}
            <strong>0.000</strong> for the entire life of every autoplay stroke animation, because{' '}
            <code>currentAlpha</code> was only ever assigned on the clip-path
            branch. Press <code>replay()</code> and watch it snap back to 0 —
            that reset was also missing.
          </>
        ) : (
          <>
            Not measured yet — this autoplay only starts once its container enters the
            viewport. Scroll it fully into view and the readout above will begin ticking.
          </>
        )}
      </Verdict>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   03 — pause()/resume() while off-screen
   ──────────────────────────────────────────────────────────────────────────── */

export function OffScreenProof() {
  const boxRef = useRef<HTMLDivElement>(null);
  const instRef = useRef<ReturnType<typeof scrollDraw> | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [completed, setCompleted] = useState(false);

  const push = (line: string) => setLog((l) => [...l, line]);

  useEffect(() => {
    if (!boxRef.current) return;
    const inst = scrollDraw(boxRef.current, {
      autoplay: true,
      duration: 3000,
      onComplete: () => setCompleted(true),
    });
    instRef.current = inst;
    return () => inst.destroy();
  }, []);

  const run = () => {
    const inst = instRef.current;
    if (!inst) return;
    setLog([]);
    setCompleted(false);
    setDone(false);

    push('replay()            → fresh run starts');
    inst.replay();

    // Simulate the sequence that used to burn the animation out invisibly:
    // the element scrolls out of view, then something calls pause()/resume()
    // (a tab-visibility handler, a carousel, a route transition).
    setTimeout(() => {
      push('element scrolls off-screen');
      push('pause()             → while off-screen');
      inst.pause();
      push('resume()            → while still off-screen');
      inst.resume();
      setTimeout(() => {
        const p = inst.getProgress();
        push(`getProgress()       → ${p.toFixed(3)}`);
        setDone(true);
      }, 350);
    }, 500);
  };

  return (
    <div>
      <div className="vf-split is-wide-side">
        <div ref={boxRef} className="vf-spec vf-spec-pad">
          <svg viewBox="0 0 200 100" width="100%" style={{ overflow: 'visible' }}>
            <path d={PATH_D} stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
          </svg>
        </div>

        <div className="vf-side">
          <button type="button" onClick={run} className="btn btn-sm btn-solid vf-btn">
            Run the off-screen sequence
          </button>
          <pre className="vf-log" aria-live="polite">
            {log.length ? log.join('\n') : 'idle — press the button'}
          </pre>
        </div>
      </div>

      {done && (
        <Verdict ok={!completed}>
          {completed ? (
            <>
              The draw completed while off-screen — this is the old broken behaviour.
            </>
          ) : (
            <>
              The run did <strong>not</strong> complete. Previously,{' '}
              <code>startTime = null</code> coerced to <code>0</code>, so{' '}
              <code>pause()</code> recorded the whole timestamp since page load
              as elapsed time and <code>resume()</code> began a run already past
              its own duration — the SVG finished drawing invisibly and the visitor scrolled down to a
              static, already-complete graphic.
            </>
          )}
        </Verdict>
      )}
    </div>
  );
}
