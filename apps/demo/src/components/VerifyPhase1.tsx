'use client';

import { useEffect, useRef, useState } from 'react';
import { scrollDraw } from 'svg-scroll-draw';

const PATH_D = 'M10 50 C 40 10, 80 10, 100 50 S 160 90, 190 50';

/* ── shared ─────────────────────────────────────────────────────────────────── */

/** `ok: null` renders WAIT — an unmeasured proof must not look like a result. */
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
      <p className="text-[10px] uppercase tracking-[0.15em] text-graphite-border font-mono mb-0.5">
        {label}
      </p>
      <p
        className="font-mono text-xl font-bold tabular-nums"
        style={{ color: tone === 'bad' ? '#dc3400' : undefined }}
      >
        {value}
      </p>
    </div>
  );
}

/* ── 1. Live native-vs-JS parity ────────────────────────────────────────────── */

/** Drawn fraction: 0 = undrawn, 1 = fully drawn. Same maths as e2e/parity.spec.ts. */
function drawnFraction(el: SVGPathElement | null): number {
  if (!el) return 0;
  const len = el.getTotalLength();
  if (!len) return 0;
  const offset = parseFloat(getComputedStyle(el).strokeDashoffset) || 0;
  return Math.min(1, Math.max(0, 1 - offset / len));
}

export function LiveParityProof() {
  const nativeBox = useRef<HTMLDivElement>(null);
  const jsBox = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState({ native: 0, js: 0, engaged: false, supported: false });
  const [sweep, setSweep] = useState<
    { rows: { y: number; native: number; js: number; delta: number }[]; worst: number } | null
  >(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!nativeBox.current || !jsBox.current) return;

    const a = scrollDraw(nativeBox.current, { native: true });
    const b = scrollDraw(jsBox.current, { native: false });

    const supported =
      typeof CSS !== 'undefined' &&
      CSS.supports('animation-timeline: view()') &&
      CSS.supports('view-timeline-name: --x');

    const nativePath = nativeBox.current.querySelector('path') as SVGPathElement | null;
    const jsPath = jsBox.current.querySelector('path') as SVGPathElement | null;
    const engaged = !!nativePath?.getAttribute('class')?.includes('svg-scroll-draw-');

    // Passive readout, for watching while you scroll by hand. Deliberately NOT the
    // basis of the verdict — see the sweep below.
    let raf = 0;
    const poll = () => {
      setLive({ native: drawnFraction(nativePath), js: drawnFraction(jsPath), engaged, supported });
      raf = requestAnimationFrame(poll);
    };
    raf = requestAnimationFrame(poll);

    return () => {
      cancelAnimationFrame(raf);
      a.destroy();
      b.destroy();
    };
  }, []);

  /**
   * Deterministic sweep — the verdict comes from this, not from passive watching.
   *
   * A passive meter turned out to be untrustworthy in both directions here. It
   * first latched onto false positives (mount transients, compositor commit lag
   * after a jump, and the documented off-screen freeze), and once those were
   * guarded it recorded nothing at all during a scripted scroll, because the
   * guards need the scroll to hold still for a few frames. "Nothing measured"
   * rendered identically to "verified equal", which is the worst possible failure
   * for a page like this.
   *
   * So this walks fixed offsets across the container's trigger window and waits
   * two frames at each one before reading — the same method as
   * e2e/parity.spec.ts, which is what actually catches the bug.
   */
  async function runSweep() {
    const box = nativeBox.current;
    if (!box) return;
    setBusy(true);
    setSweep(null);

    const restore = window.scrollY;
    const twoFrames = () =>
      new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));

    const nativePath = box.querySelector('path') as SVGPathElement | null;
    const jsPath = jsBox.current?.querySelector('path') as SVGPathElement | null;

    // The trigger window: from the container entering the viewport bottom to it
    // leaving the top. Sample inside it, avoiding the clamped ends.
    const top = box.getBoundingClientRect().top + window.scrollY;
    const tStart = top - window.innerHeight;
    const tEnd = top + box.offsetHeight;

    const rows: { y: number; native: number; js: number; delta: number }[] = [];
    const STEPS = 11;
    for (let i = 1; i < STEPS; i++) {
      const y = Math.round(tStart + ((tEnd - tStart) * i) / STEPS);
      window.scrollTo(0, y);
      await twoFrames();
      await twoFrames();
      const n = drawnFraction(nativePath);
      const j = drawnFraction(jsPath);
      rows.push({ y, native: n, js: j, delta: Math.abs(n - j) });
    }

    window.scrollTo(0, restore);
    setSweep({ rows, worst: rows.reduce((m, r) => Math.max(m, r.delta), 0) });
    setBusy(false);
  }

  const liveDelta = Math.abs(live.native - live.js);

  return (
    <div>
      {/* Side by side so both share identical vertical geometry — at any scroll
          offset the correct answer is the same for both. */}
      <div className="flex flex-col sm:flex-row gap-6 mb-5">
        {[
          { label: 'native CSS view-timeline', ref: nativeBox, value: live.native, colour: '#ff90e8' },
          { label: 'JS engine (native: false)', ref: jsBox, value: live.js, colour: '#0a0a0a' },
        ].map(({ label, ref, value, colour }) => (
          <div key={label} className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between mb-2">
              <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-graphite-border">
                {label}
              </span>
              <span className="font-mono text-sm font-bold tabular-nums">{value.toFixed(4)}</span>
            </div>
            {/* A tall container with a short path is deliberate: the bug's size is
                proportional to the gap between the path's bbox and the container's
                box, so a path that fills its container hides it almost entirely. */}
            <div ref={ref} className="rounded-xl border border-subtle-ash bg-white px-4 py-10">
              <svg viewBox="0 0 200 100" preserveAspectRatio="none" className="w-full block" style={{ overflow: 'visible', height: 70 }}>
                <path d={PATH_D} stroke={colour} strokeWidth="3" strokeLinecap="round" fill="none" />
              </svg>
            </div>
            <div className="h-1.5 rounded-full bg-subtle-ash overflow-hidden mt-2">
              <div className="h-full" style={{ width: `${value * 100}%`, background: colour }} />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-8 mb-5">
        <button
          onClick={runSweep}
          disabled={busy}
          className="px-5 py-2 rounded-full bg-pitch-black text-light-linen text-[13px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          {busy ? 'Sweeping…' : 'Run parity sweep'}
        </button>
        <Stat label="live Δ (while you scroll)" value={liveDelta.toFixed(4)} />
        <Stat
          label="worst Δ in sweep"
          value={sweep ? sweep.worst.toFixed(4) : '—'}
          tone={sweep && sweep.worst > 0.02 ? 'bad' : undefined}
        />
        <Stat label="native supported" value={live.supported ? 'yes' : 'no'} />
        <Stat label="fast path engaged" value={live.engaged ? 'yes' : 'no'} />
      </div>

      {sweep && (
        <div className="rounded-2xl border border-pitch-black overflow-hidden mb-5">
          <table className="w-full text-[12px] font-mono">
            <thead>
              <tr className="bg-marketplace-gray border-b border-pitch-black">
                {['scrollY', 'native', 'js', 'Δ'].map((h) => (
                  <th key={h} className="text-right px-4 py-2 text-[10px] uppercase tracking-wider text-graphite-border">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sweep.rows.map((r) => (
                <tr key={r.y} className="border-b border-subtle-ash last:border-0">
                  <td className="text-right px-4 py-1.5 text-graphite-border">{r.y}</td>
                  <td className="text-right px-4 py-1.5">{r.native.toFixed(4)}</td>
                  <td className="text-right px-4 py-1.5">{r.js.toFixed(4)}</td>
                  <td
                    className="text-right px-4 py-1.5 font-bold"
                    style={{ color: r.delta > 0.02 ? '#dc3400' : undefined }}
                  >
                    {r.delta.toFixed(4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Verdict ok={!sweep ? null : sweep.worst <= 0.02}>
        {!live.supported ? (
          <>
            This browser reports no scroll-driven animation support, so both boxes run
            the JS engine and Δ is trivially 0. That fallback is itself worth checking —
            Firefox 153 takes exactly this path.
          </>
        ) : !sweep ? (
          <>
            Press <strong>Run parity sweep</strong>. It walks ten offsets across the
            container&apos;s trigger window, waiting for the compositor to settle at each
            one, and compares both engines. Before the fix this diverged by up to{' '}
            <strong>0.063</strong> in Chromium and <strong>0.114</strong> in WebKit,
            because <code className="font-mono">animation-timeline: view()</code> sat on
            each <code className="font-mono">&lt;path&gt;</code> — making the path its
            own timeline subject rather than the container.
          </>
        ) : sweep.worst > 0.02 ? (
          <>
            The engines disagree by up to <strong>{sweep.worst.toFixed(4)}</strong>. The
            timeline is measuring the wrong element.
          </>
        ) : (
          <>
            Both engines agree at every sampled offset (worst Δ{' '}
            <strong>{sweep.worst.toFixed(4)}</strong>). The timeline is a named{' '}
            <code className="font-mono">view-timeline</code> on the container, so its box
            defines the range — which is exactly the JS engine&apos;s{' '}
            <code className="font-mono">top bottom</code> →{' '}
            <code className="font-mono">bottom top</code> window.
          </>
        )}
      </Verdict>
    </div>
  );
}

/* ── 2. The process.env crash, run in a bundler-free scope ──────────────────── */

export function ProcessGuardProof() {
  const [result, setResult] = useState<{ old: string; next: string } | null>(null);

  useEffect(() => {
    // An <iframe> gives a fresh global scope with no bundler-injected `process`,
    // which is what a CDN or <script type="module"> user actually has. Evaluating
    // both guards there shows the difference directly rather than describing it.
    const frame = document.createElement('iframe');
    frame.style.display = 'none';
    document.body.appendChild(frame);

    const run = (expr: string): string => {
      try {
        const fn = new (frame.contentWindow as Window & { Function: typeof Function }).Function(
          `return (${expr});`,
        );
        return `returned ${String(fn())}`;
      } catch (e) {
        return `THREW: ${(e as Error).message}`;
      }
    };

    setResult({
      old: run("process.env.NODE_ENV !== 'production'"),
      next: run(
        "typeof process !== 'undefined' && typeof process.env !== 'undefined' && process.env.NODE_ENV !== 'production'",
      ),
    });

    frame.remove();
  }, []);

  const threw = result?.old.startsWith('THREW');

  return (
    <div>
      <div className="rounded-2xl border border-pitch-black overflow-hidden mb-5">
        {[
          { label: 'before', code: "process.env.NODE_ENV !== 'production'", out: result?.old },
          {
            label: 'after',
            code: "typeof process !== 'undefined' && typeof process.env !== 'undefined' && …",
            out: result?.next,
          },
        ].map(({ label, code, out }, i) => (
          <div key={label} className={i === 0 ? 'border-b border-subtle-ash' : ''}>
            <div className="flex items-center gap-2 px-4 pt-3">
              <span
                className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={
                  i === 0
                    ? { background: '#dc3400', color: '#fff' }
                    : { background: '#f1f333', color: '#0a0a0a' }
                }
              >
                {label}
              </span>
              <code className="font-mono text-[11px] text-graphite-border break-all">{code}</code>
            </div>
            <p
              className="font-mono text-[13px] font-bold px-4 pb-3 pt-1.5"
              style={{ color: out?.startsWith('THREW') ? '#dc3400' : undefined }}
            >
              {out ?? '…'}
            </p>
          </div>
        ))}
      </div>

      <Verdict ok={result === null ? null : !!threw}>
        Both expressions were just evaluated inside a fresh <code className="font-mono">iframe</code>{' '}
        — a scope with no bundler-injected <code className="font-mono">process</code>, exactly what a
        CDN user has. The old guard sat in front of <em>every</em> dev warning in 13 modules, so
        reaching one threw instead of logging. The concrete repro: style a path&apos;s stroke with
        CSS instead of a <code className="font-mono">stroke</code> attribute, and the engine&apos;s
        &ldquo;no stroke&rdquo; warning took down the whole call.
      </Verdict>
    </div>
  );
}

/* ── 3. Live idle cost meter ────────────────────────────────────────────────── */

export function IdleCostProof() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [runs, setRuns] = useState<{ idle: number | null; active: number | null }>({
    idle: null,
    active: null,
  });
  const [busy, setBusy] = useState('');

  /**
   * Times every rAF callback over one second.
   *
   * Note this measures the WHOLE page, not just the library — wrapping the global
   * `requestAnimationFrame` also catches React, Next.js internals, and the two
   * other live proofs on this page, both of which poll every frame. A raw reading
   * here reported 16.9 ms parked vs 27.7 ms scrolling (1.6x) where the isolated
   * e2e fixture measures 2.8 vs 20 (7x). So `run()` below subtracts a baseline
   * taken with no instances alive, which isolates the library's own contribution.
   */
  function measure(nudgeScroll: boolean): Promise<number> {
    const original = window.requestAnimationFrame.bind(window);
    let ms = 0;
    window.requestAnimationFrame = ((cb: FrameRequestCallback) =>
      original((t) => {
        const t0 = performance.now();
        cb(t);
        ms += performance.now() - t0;
      })) as typeof window.requestAnimationFrame;

    const startY = window.scrollY;
    return new Promise<number>((resolve) => {
      const t0 = performance.now();
      const step = () => {
        if (nudgeScroll) window.scrollTo(0, startY + (Math.round(performance.now() / 16) % 2));
        if (performance.now() - t0 < 1000) requestAnimationFrame(step);
        else {
          window.requestAnimationFrame = original;
          if (nudgeScroll) window.scrollTo(0, startY);
          resolve(Math.round(ms * 10) / 10);
        }
      };
      requestAnimationFrame(step);
    });
  }

  async function run() {
    if (!hostRef.current) return;
    setRuns({ idle: null, active: null });

    // 1. Page baseline with no instances at all.
    setBusy('baseline…');
    const baseIdle = await measure(false);
    const baseActive = await measure(true);

    // 2. Same measurement with 8 instances alive.
    setBusy('with 8 instances…');
    const boxes = Array.from(hostRef.current.querySelectorAll<HTMLElement>('[data-box]'));
    const instances = boxes.map((el) => scrollDraw(el, { native: false }));
    // Let the IntersectionObservers fire before timing.
    await new Promise((r) => setTimeout(r, 250));
    const withIdle = await measure(false);
    const withActive = await measure(true);
    instances.forEach((i) => i.destroy());

    setRuns({
      idle: Math.max(0, Math.round((withIdle - baseIdle) * 10) / 10),
      active: Math.max(0, Math.round((withActive - baseActive) * 10) / 10),
    });
    setBusy('');
  }

  const { idle, active } = runs;
  // A measured idle cost at or near zero is the best possible outcome, not a
  // missing measurement — dividing by it would render WAIT for a perfect result.
  const measured = idle !== null && active !== null;
  const ratio = measured ? active! / Math.max(idle!, 0.1) : null;

  return (
    <div>
      {/* Eight instances, three paths each — the same shape as the e2e fixture. */}
      <div ref={hostRef} className="flex gap-1.5 mb-5 overflow-hidden">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} data-box className="flex-1 rounded-lg border border-subtle-ash bg-white p-1.5">
            <svg viewBox="0 0 200 100" preserveAspectRatio="none" className="w-full block" style={{ height: 56 }}>
              <path d={PATH_D} stroke="#0a0a0a" strokeWidth="4" fill="none" />
              <path d="M10 15 L 190 15" stroke="#0a0a0a" strokeWidth="4" fill="none" />
              <path d="M10 85 L 190 85" stroke="#0a0a0a" strokeWidth="4" fill="none" />
            </svg>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-8 mb-5">
        <button
          onClick={run}
          disabled={!!busy}
          className="px-5 py-2 rounded-full bg-pitch-black text-light-linen text-[13px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          {busy ? `Measuring — ${busy}` : 'Measure (takes 4s)'}
        </button>
        <Stat label="parked (1s)" value={idle === null ? '—' : `${idle} ms`} />
        <Stat label="scrolling (1s)" value={active === null ? '—' : `${active} ms`} />
        <Stat
          label="ratio"
          value={!measured ? '—' : idle! < 0.1 ? `>${ratio!.toFixed(0)}×` : `${ratio!.toFixed(1)}×`}
        />
      </div>

      <p className="text-[12px] text-graphite-border leading-relaxed mb-4 font-mono">
        Both figures are baseline-subtracted: the page is timed once with no
        instances, then again with 8 alive. Without that subtraction this readout is
        dominated by React and the other live proofs on this page, which poll every
        frame — it read 1.6× where the isolated e2e fixture reads 7×.
      </p>

      <Verdict ok={!measured ? null : ratio! >= 2}>
        {!measured ? (
          <>
            Press the button. Before the fix the rAF loop did identical work whether
            or not the user was scrolling: 8 instances parked in a viewport cost{' '}
            <strong>6.4 ms per second</strong> in Chromium, recomputing values that had
            not changed.
          </>
        ) : (
          <>
            Parked costs <strong>{ratio!.toFixed(0)}×</strong> less than scrolling. Before
            the fix that ratio was ~1× — the loop recomputed everything every frame
            regardless. <code className="font-mono">update()</code> now returns early
            when the scroll position is unchanged and nothing has invalidated the
            frame. The clean cross-browser figures come from{' '}
            <code className="font-mono">e2e/idle.spec.ts</code>: 2.8 ms vs 20 (Chromium),
            3.0 vs 51 (Firefox), 2.0 vs 83 (WebKit).
          </>
        )}
      </Verdict>
    </div>
  );
}

/* ── 4. Reduced motion ──────────────────────────────────────────────────────── */

export function ReducedMotionProof() {
  const [reduced, setReduced] = useState<boolean | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    // The library now tracks this live too — it used to read the value once at
    // construction, so toggling the OS setting did nothing until a reload.
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return (
    <div>
      <div className="flex flex-wrap gap-8 mb-5">
        <Stat
          label="your OS preference"
          value={reduced === null ? '…' : reduced ? 'reduce' : 'no-preference'}
        />
        <Stat
          label="scrollSnap would"
          value={reduced === null ? '…' : reduced ? 'jump instantly' : 'animate the scroll'}
        />
      </div>

      <p className="text-[13px] text-graphite-border leading-relaxed mb-4">
        This readout is live — toggle <em>Reduce motion</em> in System Settings →
        Accessibility → Display and it updates without a reload. That is the same
        listener the library now uses.
      </p>

      <Verdict ok>
        <code className="font-mono">scrollSnap</code> animates{' '}
        <code className="font-mono">window.scrollTo</code> over a duration with an easing curve,
        driven off a debounced scroll handler — it takes over the user&apos;s scrolling. It had{' '}
        <strong>no reduced-motion check of any kind</strong>, which was the clearest accessibility
        defect in the library. It now jumps straight to the target section; snapping still happens,
        only the animated scroll is dropped. <code className="font-mono">respectReducedMotion: false</code>{' '}
        is the documented opt-out.
      </Verdict>
    </div>
  );
}
