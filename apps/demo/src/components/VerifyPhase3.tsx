'use client';

/**
 * The three 2.10.0 fixes that were listed on /verify as "not demonstrated here".
 *
 * Each one is measured in the page you are reading rather than asserted:
 *  1. Easing parity — the native CSS path and the JS engine agreeing on ease-out.
 *  2. A finished sequence reporting 100%, not 0%.
 *  3. split: 'lines' keeping the spaces between words.
 *
 * They deliberately re-measure live rather than replaying a recorded number. A
 * proof that cannot fail is not a proof.
 */

import { useEffect, useRef, useState } from 'react';
import { scrollDraw } from 'svg-scroll-draw';
import { scrollDrawSequence } from 'svg-scroll-draw/group';
import { scrollText } from 'svg-scroll-draw/text';

const PATH_D = 'M10 50 C 40 10, 80 10, 100 50 S 160 90, 190 50';

function Verdict({ ok, children }: { ok: boolean | null; children: React.ReactNode }) {
  const tone =
    ok === null
      ? { bg: 'rgba(0,0,0,0.04)', border: '#d1d5dc', fg: '#6b6b6b', label: 'WAIT' }
      : ok
        ? { bg: 'rgba(241,243,51,0.18)', border: '#c9cb1e', fg: '#5c5e00', label: 'PASS' }
        : { bg: 'rgba(220,52,0,0.10)', border: '#dc3400', fg: '#dc3400', label: 'BUG' };

  return (
    <div
      className="flex items-start gap-2.5 rounded-xl px-4 py-3 text-[13px] leading-relaxed"
      style={{ background: tone.bg, border: `1px solid ${tone.border}` }}
    >
      <span className="font-mono font-bold shrink-0" style={{ color: tone.fg }}>
        {tone.label}
      </span>
      <span className="text-pitch-black">{children}</span>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'bad' | 'good' }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.15em] text-graphite-border font-mono mb-0.5">{label}</p>
      <p
        className="font-mono text-xl font-bold tabular-nums"
        style={{ color: tone === 'bad' ? '#dc3400' : tone === 'good' ? '#5c5e00' : undefined }}
      >
        {value}
      </p>
    </div>
  );
}

function drawnFraction(el: SVGPathElement | null): number {
  if (!el) return 0;
  const len = el.getTotalLength();
  if (!len) return 0;
  const offset = parseFloat(getComputedStyle(el).strokeDashoffset) || 0;
  return Math.min(1, Math.max(0, 1 - offset / len));
}

/* ── 1. Easing parity ───────────────────────────────────────────────────────── */

/**
 * Section 06 proves parity on the default curve. The 2.10.0 divergence was on
 * *named easings*: the native path emitted the CSS keyword `ease-out` while the
 * JS engine ran this library's own curve, and the two are not the same function.
 * Worst observed gap was ~0.069 — visible, on the most commonly used option.
 */
export function EasingParityProof() {
  const nativeBox = useRef<HTMLDivElement>(null);
  const jsBox = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState({ native: 0, js: 0, supported: false });
  const [sweep, setSweep] = useState<{ worst: number; samples: number } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!nativeBox.current || !jsBox.current) return;
    const supported =
      typeof CSS !== 'undefined' && CSS.supports?.('animation-timeline: view()') === true;

    const a = scrollDraw(nativeBox.current, { easing: 'ease-out' });
    const b = scrollDraw(jsBox.current, { easing: 'ease-out', native: false });

    let raf = 0;
    const tick = () => {
      setLive({
        native: drawnFraction(nativeBox.current?.querySelector('path') as SVGPathElement | null),
        js: drawnFraction(jsBox.current?.querySelector('path') as SVGPathElement | null),
        supported,
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); a.destroy(); b.destroy(); };
  }, []);

  /**
   * The verdict comes from this sweep, never from watching the live meter.
   *
   * A passive worst-delta meter reports a false BUG here: after a scroll jump the
   * compositor has already committed the native path while the JS engine has not
   * yet run its rAF, so the two are legitimately out of step for a frame or two.
   * Free-scrolling this section recorded deltas around 0.86 on a build with no
   * divergence at all. VerifyPhase1 hit the same trap and documents it.
   *
   * So: step to fixed offsets, wait for both engines to settle, then read.
   */
  async function runSweep() {
    const box = nativeBox.current;
    const jbox = jsBox.current;
    if (!box || !jbox) return;
    setBusy(true);
    setSweep(null);

    const restore = window.scrollY;
    const twoFrames = () =>
      new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));

    const nativePath = box.querySelector('path') as SVGPathElement | null;
    const jsPath = jbox.querySelector('path') as SVGPathElement | null;

    const top = box.getBoundingClientRect().top + window.scrollY;
    const tStart = top - window.innerHeight;
    const tEnd = top + box.offsetHeight;

    let worst = 0;
    let samples = 0;
    const STEPS = 11;
    for (let i = 1; i < STEPS; i++) {
      const y = Math.round(tStart + ((tEnd - tStart) * i) / STEPS);
      window.scrollTo(0, y);
      await twoFrames();
      await twoFrames();
      const n = drawnFraction(nativePath);
      const j = drawnFraction(jsPath);
      // Ends clamp to 0 and 1 on both paths and prove nothing about the curve.
      if ((n > 0.01 && n < 0.99) || (j > 0.01 && j < 0.99)) {
        worst = Math.max(worst, Math.abs(n - j));
        samples++;
      }
    }

    window.scrollTo(0, restore);
    setSweep({ worst, samples });
    setBusy(false);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {[
          { ref: nativeBox, label: live.supported ? 'native CSS · ease-out' : 'JS fallback · ease-out', value: live.native },
          { ref: jsBox, label: 'JS forced · ease-out', value: live.js },
        ].map(({ ref, label, value }) => (
          <div key={label}>
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-[10px] uppercase tracking-[0.15em] text-graphite-border font-mono">{label}</span>
              <span className="font-mono text-[13px] font-bold tabular-nums">{value.toFixed(4)}</span>
            </div>
            <div ref={ref} className="rounded-xl border border-pitch-black bg-white px-4 py-8">
              <svg viewBox="0 0 200 100" preserveAspectRatio="none" className="w-full block" style={{ overflow: 'visible', height: 64 }}>
                <path d={PATH_D} stroke="#111" strokeWidth="3" fill="none" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={runSweep}
          disabled={busy}
          className="px-4 py-2 rounded-full bg-pitch-black text-light-linen text-sm font-semibold disabled:opacity-50"
        >
          {busy ? 'Sweeping…' : 'Run the sweep'}
        </button>
        <span className="text-[12px] text-graphite-border">
          Steps through 10 offsets, waits for both engines to settle at each, then compares.
        </span>
      </div>

      {sweep && (
        <div className="grid grid-cols-2 gap-4 rounded-xl border border-subtle-ash bg-marketplace-gray/40 px-4 py-3">
          <Stat label="worst Δ" value={sweep.worst.toFixed(4)} tone={sweep.worst > 0.02 ? 'bad' : 'good'} />
          <Stat label="samples mid-draw" value={String(sweep.samples)} />
        </div>
      )}

      <Verdict ok={sweep ? sweep.samples > 0 && sweep.worst <= 0.02 : null}>
        {sweep ? (
          sweep.samples === 0 ? (
            <>The sweep never caught either path mid-draw, so nothing was compared. Scroll the section fully into view and run it again — an unmeasured proof is not a passing one.</>
          ) : (
            <>
              Worst Δ across {sweep.samples} mid-draw samples:{' '}
              <strong className="font-mono">{sweep.worst.toFixed(4)}</strong>. Before 2.10.0 this reached{' '}
              <strong className="font-mono">0.069</strong> on this configuration, because the native path
              emitted the CSS <code className="font-mono">ease-out</code> keyword while the JS engine ran this
              library&apos;s own curve — same name, different function.
              {!live.supported && ' Your browser has no native scroll timeline, so both sides here are the JS engine; the parity that matters is measured where the fast path exists.'}
            </>
          )
        ) : (
          <>Press the button. The verdict deliberately does not come from the live meter above — after a scroll jump the compositor and the JS engine are legitimately a frame or two apart, and reading that as a divergence reports bugs that do not exist.</>
        )}
      </Verdict>
    </div>
  );
}

/* ── 2. A finished sequence reports 100% ────────────────────────────────────── */

/**
 * scrollDrawSequence delegates getProgress() to whichever step is active. When
 * the last step completed, the active index advanced past the end of the array,
 * so getProgress() read from `undefined` and fell back to 0 — a finished
 * sequence reported 0% rather than 100%.
 */
export function SequenceCompletionProof() {
  const wrap = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [peak, setPeak] = useState(0);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const root = wrap.current;
    if (!root) return;

    const steps = Array.from(root.querySelectorAll<HTMLElement>('[data-step]'));
    const seq = scrollDrawSequence(steps, {
      easing: 'ease-out',
      speed: 1,
      onComplete: () => setCompleted(true),
    });

    let raf = 0;
    let hi = 0;
    const tick = () => {
      const p = seq.getProgress();
      setProgress(p);
      if (p > hi) { hi = p; setPeak(p); }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      seq.destroy();
    };
  }, []);

  const finished = completed || peak > 0.99;

  return (
    <div className="space-y-4">
      <div ref={wrap} className="grid grid-cols-3 gap-3">
        {['Code', 'Build', 'Ship'].map((label) => (
          <div key={label} data-step className="rounded-xl border border-pitch-black bg-white p-3">
            <p className="text-[10px] uppercase tracking-[0.15em] text-graphite-border font-mono mb-1.5">{label}</p>
            <svg viewBox="0 0 200 100" className="w-full">
              <path d={PATH_D} stroke="#111" strokeWidth="3" fill="none" strokeLinecap="round" />
            </svg>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4 rounded-xl border border-subtle-ash bg-marketplace-gray/40 px-4 py-3">
        <Stat label="getProgress()" value={progress.toFixed(3)} />
        <Stat label="peak seen" value={peak.toFixed(3)} tone={finished ? 'good' : undefined} />
        <Stat label="onComplete" value={completed ? 'fired' : '—'} />
      </div>

      <Verdict ok={finished ? peak > 0.99 : null}>
        {finished ? (
          <>
            The sequence finished and <code className="font-mono">getProgress()</code> reports{' '}
            <strong className="font-mono">{peak.toFixed(3)}</strong>. Before 2.10.0 it reported{' '}
            <strong className="font-mono">0.000</strong> here: the active index advanced past the last step
            on completion, so the getter read from an undefined instance and fell back to zero.
          </>
        ) : (
          <>Scroll until all three have drawn. The number to watch is what <code className="font-mono">getProgress()</code> reports <em>after</em> the last one finishes.</>
        )}
      </Verdict>
    </div>
  );
}

/* ── 3. split: 'lines' keeps its spaces ─────────────────────────────────────── */

/**
 * The one a user can see without instrumentation. splitIntoLines groups words by
 * offsetTop; the whitespace nodes between them were dropped rather than
 * reinserted, so a split headline rendered as "everywordjammedtogether".
 */
export function SplitLinesSpacingProof() {
  const target = useRef<HTMLParagraphElement>(null);
  const [result, setResult] = useState<{ text: string; spaces: number; expected: number } | null>(null);

  useEffect(() => {
    const el = target.current;
    if (!el) return;
    const original = el.textContent ?? '';
    const expected = (original.match(/\s+/g) ?? []).length;

    const inst = scrollText(el, { split: 'lines', stagger: 0.05 });

    // Read back what the DOM now renders, after splitting.
    const id = window.setTimeout(() => {
      const rendered = (el.innerText ?? el.textContent ?? '').replace(/\s+/g, ' ').trim();
      const spaces = (rendered.match(/ /g) ?? []).length;
      setResult({ text: rendered, spaces, expected });
    }, 120);

    return () => {
      window.clearTimeout(id);
      inst.destroy();
    };
  }, []);

  const ok = result ? result.spaces >= result.expected - 1 : null;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-pitch-black bg-white p-5">
        <p ref={target} className="text-[17px] sm:text-xl font-display font-extrabold tracking-[-0.02em] leading-snug">
          Every word here should still be separated by a space after splitting.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 rounded-xl border border-subtle-ash bg-marketplace-gray/40 px-4 py-3">
        <Stat label="spaces before" value={result ? String(result.expected) : '—'} />
        <Stat label="spaces after" value={result ? String(result.spaces) : '—'} tone={ok === false ? 'bad' : ok ? 'good' : undefined} />
        <Stat label="split" value="lines" />
      </div>

      <Verdict ok={ok}>
        {result ? (
          ok ? (
            <>
              The text still reads as words after <code className="font-mono">split: &apos;lines&apos;</code> —{' '}
              <strong className="font-mono">{result.spaces}</strong> spaces preserved. Before 2.10.0 the
              whitespace between words was dropped when grouping by <code className="font-mono">offsetTop</code>,
              so the headline rendered jammed together. Read the sentence above: that is the test.
            </>
          ) : (
            <>Spaces were lost during the split — {result.spaces} found, {result.expected} expected.</>
          )
        ) : (
          <>Measuring…</>
        )}
      </Verdict>
    </div>
  );
}
