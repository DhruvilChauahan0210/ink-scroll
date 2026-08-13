'use client';

import { useEffect, useRef, useState } from 'react';
import { scrollAnimate } from 'svg-scroll-draw';
import { scrollSnap } from 'svg-scroll-draw/snap';
import { scrollHorizontal } from 'svg-scroll-draw/horizontal';

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
        style={{ color: tone === 'bad' ? '#dc3400' : tone === 'good' ? '#5c5e00' : undefined }}
      >
        {value}
      </p>
    </div>
  );
}

function Panel({ label, tone }: { label: string; tone: 'old' | 'new' }) {
  return (
    <p
      className="text-[10px] uppercase tracking-[0.16em] font-mono mb-2"
      style={{ color: tone === 'old' ? '#dc3400' : '#5c5e00' }}
    >
      {label}
    </p>
  );
}

/* ── 1. destroy() no longer abandons the element mid-animation ──────────────── */

/**
 * Both boxes are animated by the real engine and destroyed at the same progress.
 *
 * The left one reproduces the old teardown faithfully: the engine used to write
 * `opacity` and `transform` inline every frame and remove neither on destroy, so
 * whatever the last frame wrote stayed on the element forever. Reproducing it by
 * re-applying those exact two properties is honest — there is no flag to switch
 * the old behaviour back on, and the values shown are the ones the engine itself
 * had just written.
 */
export function DestroyRestoreProof() {
  const oldRef = useRef<HTMLDivElement>(null);
  const newRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<'idle' | 'mid' | 'destroyed'>('idle');
  const [css, setCss] = useState<{ old: string; new: string }>({ old: '', new: '' });

  function run() {
    const oldEl = oldRef.current;
    const newEl = newRef.current;
    if (!oldEl || !newEl) return;

    // Reset both, then animate to 40% and stop there.
    for (const el of [oldEl, newEl]) el.style.cssText = '';

    const opts = {
      props: {
        opacity: [0, 1] as [number, number],
        transform: ['translateY(24px)', 'translateY(0px)'] as [string, string],
      },
      native: false,
    };
    const a = scrollAnimate(oldEl, opts);
    const b = scrollAnimate(newEl, opts);
    a.seek(0.4);
    b.seek(0.4);

    setState('mid');
    setCss({ old: oldEl.style.cssText, new: newEl.style.cssText });

    // Destroy both after a beat, so the mid-animation state is visible first.
    window.setTimeout(() => {
      // What the old build did: the inline styles the last frame wrote survive.
      const abandoned = oldEl.style.cssText;
      a.destroy();
      oldEl.style.cssText = abandoned;

      // What it does now.
      b.destroy();

      setState('destroyed');
      setCss({ old: oldEl.style.cssText, new: newEl.style.cssText });
    }, 900);
  }

  const destroyed = state === 'destroyed';

  return (
    <div>
      <div className="grid sm:grid-cols-2 gap-5 mb-5">
        <div className="rounded-2xl border border-subtle-ash p-4">
          <Panel label="old teardown" tone="old" />
          <div className="h-20 flex items-center justify-center rounded-xl bg-marketplace-gray overflow-hidden">
            <div ref={oldRef} className="font-display font-bold text-sm">
              Still here?
            </div>
          </div>
          <p className="font-mono text-[10px] text-graphite-border mt-2 break-all min-h-[2.4em]">
            {css.old || 'style="" (nothing yet)'}
          </p>
        </div>

        <div className="rounded-2xl border border-subtle-ash p-4">
          <Panel label="after the fix" tone="new" />
          <div className="h-20 flex items-center justify-center rounded-xl bg-marketplace-gray overflow-hidden">
            <div ref={newRef} className="font-display font-bold text-sm">
              Still here?
            </div>
          </div>
          <p className="font-mono text-[10px] text-graphite-border mt-2 break-all min-h-[2.4em]">
            {/* An empty style attribute IS the result here, so say so rather than
                reusing the "nothing yet" placeholder. */}
            {css.new || (destroyed ? 'style="" — nothing left behind' : 'style="" (nothing yet)')}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={run}
        className="text-xs font-medium px-4 py-2 rounded-full border border-pitch-black hover:bg-pitch-black hover:text-light-linen transition-colors mb-5"
      >
        {state === 'idle' ? 'Animate to 40%, then destroy both' : 'Run again'}
      </button>

      <Verdict ok={destroyed ? true : null}>
        {destroyed ? (
          <>
            The left box is stranded at <code className="font-mono">opacity: 0.4</code> and still
            offset — permanently, because nothing will ever write to it again. The right box has no
            inline styles at all and renders at its natural state. Read the two{' '}
            <code className="font-mono">style</code> attributes above: the fix is the absence of
            the first one.
          </>
        ) : (
          <>
            Press the button. Both boxes are driven by the real engine and destroyed at the same
            progress — the difference is only what <code className="font-mono">destroy()</code>{' '}
            leaves behind.
          </>
        )}
      </Verdict>
    </div>
  );
}

/* ── 2. onSnap fires once per snap ──────────────────────────────────────────── */

/**
 * Snapping inside a nested scroll container, so the page's own scroll is not
 * hijacked. The counter is the whole proof: one snap must produce exactly one
 * callback, and it used to produce two whenever the snap emitted a trailing
 * scroll event — guaranteed under reduced motion, intermittent otherwise.
 */
export function SnapCallbackProof() {
  const boxRef = useRef<HTMLDivElement>(null);
  const instRef = useRef<ReturnType<typeof scrollSnap> | null>(null);
  const [calls, setCalls] = useState<number[]>([]);
  const [snaps, setSnaps] = useState(0);
  const [reduced, setReduced] = useState<boolean | null>(null);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', onChange);

    const sections = Array.from(box.querySelectorAll('section'));
    instRef.current = scrollSnap(sections, {
      scrollContainer: box,
      duration: 260,
      onSnap: (i) => setCalls((c) => [...c, i]),
    });

    return () => {
      mq.removeEventListener('change', onChange);
      instRef.current?.destroy();
    };
  }, []);

  function snapTo(i: number) {
    setSnaps((n) => n + 1);
    instRef.current?.snapTo(i);
  }

  // Only judge once at least one snap has been requested.
  const ok = snaps === 0 ? null : calls.length === snaps;

  return (
    <div>
      <div className="grid sm:grid-cols-[1fr_auto] gap-6 items-start mb-5">
        <div
          ref={boxRef}
          className="rounded-2xl border border-subtle-ash overflow-y-auto"
          style={{ height: 168 }}
        >
          {['one', 'two', 'three'].map((n, i) => (
            <section
              key={n}
              className="flex items-center justify-center font-display font-bold text-lg"
              style={{ height: 168, background: i % 2 ? '#f4f4f2' : '#eceae4' }}
            >
              section {n}
            </section>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => snapTo(i)}
                className="text-xs font-mono px-3 py-1.5 rounded-full border border-pitch-black hover:bg-pitch-black hover:text-light-linen transition-colors"
              >
                snapTo({i})
              </button>
            ))}
          </div>
          <div className="flex gap-8">
            <Stat label="snaps requested" value={String(snaps)} />
            <Stat
              label="onSnap calls"
              value={String(calls.length)}
              tone={ok === false ? 'bad' : ok ? 'good' : undefined}
            />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.15em] text-graphite-border font-mono mb-0.5">
              your OS preference
            </p>
            <p className="font-mono text-[13px]">
              {reduced === null ? '…' : reduced ? 'reduce' : 'no-preference'}
            </p>
          </div>
        </div>
      </div>

      <Verdict ok={ok}>
        {ok === null ? (
          <>Press a <code className="font-mono">snapTo()</code> button. The two counters must stay equal.</>
        ) : ok ? (
          <>
            {calls.length} snap{calls.length === 1 ? '' : 's'}, {calls.length} callback
            {calls.length === 1 ? '' : 's'}. The library used to react to the scroll event its own
            snap produced, treating it as a fresh gesture and firing{' '}
            <code className="font-mono">onSnap</code> a second time for a snap it had already
            announced.{' '}
            {reduced
              ? 'You have reduce motion on, which is where it was guaranteed rather than intermittent — so this is the exact case that was broken.'
              : 'It was guaranteed under reduced motion and easing-dependent otherwise, which is worse than either.'}
          </>
        ) : (
          <>
            {snaps} snaps produced {calls.length} callbacks. That is the double-fire this section
            exists to catch.
          </>
        )}
      </Verdict>
    </div>
  );
}

/* ── 3. scrollHorizontal actually moves the track ───────────────────────────── */

const H_PANELS = ['01', '02', '03', '04', '05'];

/**
 * Panel width, in px. Must be wide enough that the strip is meaningfully wider
 * than the box — travel is `scrollWidth − clientWidth`, so panels narrower than
 * the container leave almost nothing to travel and the proof looks broken even
 * when the engine is correct. (First draft used 220px panels in an ~866px box:
 * 14px of total travel.)
 */
const H_PANEL_W = 320;

/**
 * Both strips use the documented CSS setup and the same scroll position. The left
 * one is given `triggerElement: <the track>`, which is exactly what the engine
 * measured before this fix — so this is a real before/after through the public
 * API, not a reproduction. The right one uses the new default.
 *
 * A sticky-pinned track is only ever one stage tall, so measuring `top top` →
 * `bottom bottom` against it collapses both ends onto the same scroll position.
 * Progress is then pinned at 0 forever and the track never moves.
 */
export function HorizontalTriggerProof() {
  const boxRef = useRef<HTMLDivElement>(null);
  const oldTrackRef = useRef<HTMLDivElement>(null);
  const newTrackRef = useRef<HTMLDivElement>(null);
  const [p, setP] = useState({ old: 0, new: 0 });
  /**
   * Both readouts stay blank until the box has actually been scrolled.
   *
   * The engine writes an initial value at construction, and for the deliberately
   * broken strip that window is inverted (tEnd < tStart), so it reports a small
   * non-zero number at rest — which reads as "slightly working" and undercuts the
   * point. Nothing here is measured until the user scrolls, so nothing is shown
   * until then either.
   */
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const box = boxRef.current;
    const oldTrack = oldTrackRef.current;
    const newTrack = newTrackRef.current;
    if (!box || !oldTrack || !newTrack) return;

    let oldInst: ReturnType<typeof scrollHorizontal> | null = null;
    let newInst: ReturnType<typeof scrollHorizontal> | null = null;

    // Construct after a frame, once layout has settled. Measuring immediately on
    // mount reads a half-laid-out box, which produced both a wrong travel distance
    // and a misleading non-zero first reading on the "old" strip.
    const raf = requestAnimationFrame(() => {
      // Explicit distance: the default subtracts window.innerWidth, which is the
      // wrong measure inside a nested scroll container.
      const distance = (track: HTMLDivElement) => track.scrollWidth - box.clientWidth;

      oldInst = scrollHorizontal(oldTrack, {
        distance: distance(oldTrack),
        scrollContainer: box,
        triggerElement: oldTrack, // exactly what the engine measured before the fix
        onProgress: (v) => setP((s) => ({ ...s, old: v })),
      });

      newInst = scrollHorizontal(newTrack, {
        distance: distance(newTrack),
        scrollContainer: box,
        onProgress: (v) => setP((s) => ({ ...s, new: v })),
      });
    });

    const onScroll = () => setScrolled(true);
    box.addEventListener('scroll', onScroll, { passive: true, once: true });

    return () => {
      cancelAnimationFrame(raf);
      box.removeEventListener('scroll', onScroll);
      oldInst?.destroy();
      newInst?.destroy();
    };
  }, []);

  const strip = (
    ref: React.RefObject<HTMLDivElement | null>,
    tone: 'old' | 'new',
  ) => (
    <div className="overflow-hidden rounded-xl border border-subtle-ash" style={{ height: 64 }}>
      <div ref={ref} className="flex h-full" style={{ width: 'max-content' }}>
        {H_PANELS.map((n) => (
          <div
            key={n}
            className="flex items-center justify-center font-display font-extrabold text-xl shrink-0"
            style={{
              width: H_PANEL_W,
              background: tone === 'old' ? '#f7ece9' : '#f2f4e4',
            }}
          >
            {n}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <div
        ref={boxRef}
        className="rounded-2xl border border-pitch-black overflow-y-auto mb-5"
        style={{ height: 260 }}
      >
        {/* The documented setup: tall outer, sticky stage, max-content track. */}
        <div style={{ height: 1040 }}>
          <div style={{ position: 'sticky', top: 0, height: 260, overflow: 'hidden' }}>
            <div className="p-4 space-y-3">
              <div>
                <Panel label="old — trigger measured on the pinned track" tone="old" />
                {strip(oldTrackRef, 'old')}
              </div>
              <div>
                <Panel label="new — trigger measured on the container that holds the scroll" tone="new" />
                {strip(newTrackRef, 'new')}
              </div>
              <p className="text-[11px] text-graphite-border font-mono pt-1">
                scroll inside this box ↕
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-8 mb-5">
        <Stat
          label="old progress"
          value={scrolled ? p.old.toFixed(3) : '—'}
          tone={scrolled ? 'bad' : undefined}
        />
        <Stat
          label="new progress"
          value={scrolled ? p.new.toFixed(3) : '—'}
          tone={scrolled && p.new > 0 ? 'good' : undefined}
        />
      </div>

      <Verdict ok={scrolled && p.new > 0.01 ? true : null}>
        Scroll inside the box. The lower strip travels through all five panels; the upper one never
        moves at all, and its progress readout stays at <code className="font-mono">0.000</code> no
        matter how far you scroll. That upper strip is not a mock-up — it is the current library
        with <code className="font-mono">triggerElement</code> pointed at the track, which is
        precisely what the engine measured before this fix. The API had{' '}
        <strong>100% line coverage in jsdom</strong> the whole time it was broken: every rect there
        is <code className="font-mono">0</code>, so the window is equally degenerate and looks
        identical to a working one.
      </Verdict>
    </div>
  );
}
