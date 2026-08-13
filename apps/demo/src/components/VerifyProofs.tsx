'use client';

import { useEffect, useRef, useState } from 'react';
import { scrollDraw } from 'svg-scroll-draw';

/* ────────────────────────────────────────────────────────────────────────────
   Shared bits
   ──────────────────────────────────────────────────────────────────────────── */

const PATH_D = 'M10 50 C 40 10, 80 10, 100 50 S 160 90, 190 50';

function Verdict({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <div
      className="flex items-start gap-2.5 rounded-xl px-4 py-3 text-[13px] leading-relaxed"
      style={{
        background: ok ? 'rgba(241,243,51,0.18)' : 'rgba(220,52,0,0.10)',
        border: `1px solid ${ok ? '#c9cb1e' : '#dc3400'}`,
      }}
    >
      <span className="font-mono font-bold shrink-0" style={{ color: ok ? '#5c5e00' : '#dc3400' }}>
        {ok ? 'PASS' : 'BUG'}
      </span>
      <span className="text-pitch-black">{children}</span>
    </div>
  );
}

function Readout({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2 font-mono">
      <span className="text-[11px] uppercase tracking-[0.15em] text-graphite-border">{label}</span>
      <span className="text-2xl font-bold tabular-nums">{value}</span>
    </div>
  );
}

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
 */
const BROKEN_SVG = `<svg viewBox="0 0 200 100" width="100%" style="overflow:visible">
  <path d="${PATH_D}" stroke="#dc3400" strokeWidth="2.5" strokeLinecap="round" fill="none" />
</svg>`;

const FIXED_SVG = `<svg viewBox="0 0 200 100" width="100%" style="overflow:visible">
  <path d="${PATH_D}" stroke="#0a0a0a" stroke-width="2.5" stroke-linecap="round" fill="none" />
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
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-1">
        <span className="font-display font-bold text-sm">{title}</span>
        {bad && (
          <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-firecracker-orange text-white">
            before
          </span>
        )}
        {!bad && (
          <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-lime-glow text-pitch-black">
            after
          </span>
        )}
      </div>
      <p className="text-[12px] text-graphite-border font-mono mb-3">{sub}</p>
      <div
        ref={ref}
        className="rounded-xl border border-subtle-ash bg-white p-4 mb-3"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <p className="text-[11px] font-mono text-graphite-border break-words">
        parsed attributes:{' '}
        {attrs?.length
          ? attrs.map((a) => (
              <span
                key={a}
                className={
                  a === 'strokewidth' || a === 'strokelinecap'
                    ? 'text-firecracker-orange font-bold'
                    : ''
                }
              >
                {a}{' '}
              </span>
            ))
          : '…'}
      </p>
    </div>
  );

  // Proven when the parser demonstrably dropped the camelCase attribute AND
  // kept the hyphenated one.
  const proven = read
    ? read.broken.includes('strokewidth') &&
      !read.broken.includes('stroke-width') &&
      read.fixed.includes('stroke-width')
    : false;

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-8 mb-6">
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
        <code className="font-mono">strokeWidth</code> to{' '}
        <code className="font-mono text-firecracker-orange">strokewidth</code>, which is not an SVG
        attribute, so it was discarded. Every Vue and Svelte starter file from{' '}
        <code className="font-mono">npx svg-scroll-draw init</code> shipped this.
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
      <div className="flex flex-col sm:flex-row gap-6 items-center mb-6">
        <div
          ref={boxRef}
          className="rounded-xl border border-subtle-ash bg-white p-4 flex-1 w-full min-w-0"
        >
          <svg viewBox="0 0 200 100" width="100%" style={{ overflow: 'visible' }}>
            <path
              d={PATH_D}
              stroke="#ff90e8"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </div>

        <div className="shrink-0 space-y-3 w-full sm:w-56">
          <Readout label="getProgress()" value={progress.toFixed(3)} />
          <Readout label="peak seen" value={peak.toFixed(3)} />
          <div className="h-2 rounded-full bg-subtle-ash overflow-hidden">
            <div
              className="h-full bg-creator-pink transition-none"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <button
            onClick={() => {
              instRef.current?.replay();
              setPeak(0);
              setRuns((r) => r + 1);
            }}
            className="w-full px-4 py-2 rounded-full bg-pitch-black text-light-linen text-[13px] font-semibold hover:opacity-90 transition-opacity"
          >
            replay() {runs > 0 && <span className="opacity-60">· {runs}</span>}
          </button>
        </div>
      </div>

      <Verdict ok={peak > 0.01}>
        {peak > 0.01 ? (
          <>
            <code className="font-mono">getProgress()</code> is tracking the autoplay run — peak{' '}
            <strong>{peak.toFixed(3)}</strong>. Before the fix this readout sat at{' '}
            <strong>0.000</strong> for the entire life of every autoplay stroke animation, because{' '}
            <code className="font-mono">currentAlpha</code> was only ever assigned on the clip-path
            branch. Press <code className="font-mono">replay()</code> and watch it snap back to 0 —
            that reset was also missing.
          </>
        ) : (
          <>Waiting for the first frame…</>
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
      <div className="flex flex-col sm:flex-row gap-6 mb-6">
        <div
          ref={boxRef}
          className="rounded-xl border border-subtle-ash bg-white p-4 flex-1 min-w-0"
        >
          <svg viewBox="0 0 200 100" width="100%" style={{ overflow: 'visible' }}>
            <path
              d={PATH_D}
              stroke="#0a0a0a"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </div>

        <div className="shrink-0 w-full sm:w-72">
          <button
            onClick={run}
            className="w-full px-4 py-2 mb-3 rounded-full bg-pitch-black text-light-linen text-[13px] font-semibold hover:opacity-90 transition-opacity"
          >
            Run the off-screen sequence
          </button>
          <pre className="text-[11px] font-mono leading-relaxed bg-marketplace-gray rounded-xl border border-subtle-ash p-3 h-40 overflow-auto whitespace-pre-wrap">
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
              <code className="font-mono">startTime = null</code> coerced to <code className="font-mono">0</code>, so{' '}
              <code className="font-mono">pause()</code> recorded the whole timestamp since page load
              as elapsed time and <code className="font-mono">resume()</code> began a run already past
              its own duration — the SVG finished drawing invisibly and the visitor scrolled down to a
              static, already-complete graphic.
            </>
          )}
        </Verdict>
      )}
    </div>
  );
}
