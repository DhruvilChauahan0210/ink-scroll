'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore, type ReactNode, type RefObject } from 'react';
import { CodeBox } from '@/components/site/CodeBox';
import { ToolExport } from '@/components/tool-kit/ToolExport';
import {
  DIRECTIONS, FILLS, GROUPS, JUMPS, LIMITS, TIMING_KINDS, presetOf, presetsIn,
  type Direction, type Fill, type Iterations, type Jump, type TimingKind,
} from '@/data/keyframes';
import {
  CLASS_RE, INITIAL, MAX_CLASS, OUTPUTS, REVEAL_DEFAULTS, EXIT_TRIGGER, cssCode, cyclePath, cyclePoints, draftOf,
  easingFn, fillsAfter, fillsBefore, firstFrame, jsCode, lastFrame, libMapOf, libPreviewOptions, phaseText,
  previewCss, rangeOf, reversedAt, runnable, scrollCssCode, scrollPreviewCss, settingsFor, shorthandCode, spanOf,
  timingFromDraft,
  type OutputKey, type Settings, type Span, type TimeSettings, type TimingDraft,
} from './code';

/**
 * The CSS keyframes animation generator. What it shows is the CSS it writes:
 *
 * - The preview card runs the CSS tab's @keyframes and animation, renamed and
 *   scoped to this generator, in a <style> element it creates and removes. A
 *   timing function is checked with CSS.supports before it gets there.
 * - The transport reads the card's own CSSAnimation (getAnimations): the
 *   playhead follows its currentTime, and the slider sets it, paused.
 * - The scroll box runs the two scroll versions in a box of its own, so
 *   nothing needs the page to scroll: the On scroll · CSS tab on a view()
 *   timeline (the box is the nearest scroller), and the On scroll · JS tab
 *   through scrollAnimate with the box as its scrollContainer.
 * - Under reduced motion nothing plays by itself: the card is held paused and
 *   the slider steps through it; the scroll versions do what they would do
 *   for a reader who asked for less motion.
 * - Under the code, the export row runs the tab on show outside the site: the
 *   CSS on a card with a Replay button, or a page to scroll for the scroll
 *   versions, the JS one with svg-scroll-draw from jsDelivr at `version`
 *   (SELF.version, passed down by the page).
 */

type Instance = ReturnType<typeof import('svg-scroll-draw').scrollAnimate>;

const RM = '(prefers-reduced-motion: reduce)';
function subscribeRM(cb: () => void) {
  const m = window.matchMedia(RM);
  m.addEventListener('change', cb);
  return () => m.removeEventListener('change', cb);
}
const noSubscribe = () => () => {};
const useReducedMotion = () => useSyncExternalStore(subscribeRM, () => window.matchMedia(RM).matches, () => false);
const useViewTimelines = () => useSyncExternalStore(noSubscribe, () => CSS.supports('animation-timeline: view()'), () => true);
const supportsTiming = (css: string) => typeof CSS === 'undefined' || CSS.supports('animation-timing-function', css);

/** How long "Scroll it" takes to scroll the box. */
const SCROLL_MS = 1800;
const COUNTS: Iterations[] = [...Array.from({ length: LIMITS.maxCount }, (_, i) => i + 1), 'infinite'];
const TIMING_LABEL = (k: TimingKind) => (k === 'cubic-bezier' ? 'cubic-bezier(…)' : k === 'steps' ? 'steps(…)' : k);
const FILE: Record<OutputKey, (s: Settings) => string> = {
  css: (s) => `${s.cls}.css`,
  shorthand: () => 'animation.css',
  'scroll-css': (s) => `${s.cls}-scroll.css`,
  'scroll-js': () => 'main.js',
};

export function KeyframesGenerator({ version }: { version: string }) {
  const uid = useId().replace(/[^A-Za-z0-9_-]/g, '');
  const scope = `kfg-s-${uid}`;
  const [s, setS] = useState<Settings>(INITIAL);
  const [draft, setDraft] = useState<TimingDraft>(() => draftOf(INITIAL.timing));
  const [timingError, setTimingError] = useState<string | null>(null);
  const [clsDraft, setClsDraft] = useState(INITIAL.cls);
  const [clsTouched, setClsTouched] = useState(false);
  const [tab, setTab] = useState<OutputKey>('css');
  const [playing, setPlaying] = useState(false);
  const reduced = useReducedMotion();
  const viewOk = useViewTimelines();
  const preset = presetOf(s.preset);
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setS((p) => ({ ...p, [k]: v }));

  // ── The time preview ──────────────────────────────────────────────────────

  const cardRef = useRef<HTMLDivElement>(null);
  const styleRef = useRef<HTMLStyleElement | null>(null);
  const animRef = useRef<Animation | null>(null);
  const raf = useRef(0);
  const playingRef = useRef(false);
  const headRef = useRef<HTMLDivElement>(null);
  const scrubRef = useRef<HTMLInputElement>(null);
  const readRef = useRef<HTMLParagraphElement>(null);

  const tm = useMemo<TimeSettings>(
    () => ({ delay: s.delay, duration: s.duration, iterations: s.iterations, direction: s.direction, fill: s.fill }),
    [s.delay, s.duration, s.iterations, s.direction, s.fill],
  );
  const span = useMemo(() => spanOf(tm), [tm]);
  const css = useMemo(
    () => `${previewCss(s, scope, `${scope}-t-${s.preset}`)}\n${scrollPreviewCss(s, scope, `${scope}-s-${s.preset}`)}`,
    [s, scope],
  );

  /** Put the playhead, the slider and the readout at time t of the card's animation. */
  const paint = useCallback((t: number) => {
    const shown = span.infinite && t > span.delay
      ? span.delay + ((t - span.delay) % span.active)
      : Math.min(Math.max(t, 0), span.total);
    if (headRef.current) headRef.current.style.left = `${(shown / span.total) * 100}%`;
    if (scrubRef.current) {
      scrubRef.current.value = String(shown);
      scrubRef.current.setAttribute('aria-valuetext', `${Math.round(t)} ms`);
    }
    if (readRef.current) readRef.current.textContent = phaseText(tm, t);
  }, [span, tm]);

  /** Follow the animation each frame while it runs; paint once when it does not. */
  const follow = useCallback(() => {
    cancelAnimationFrame(raf.current);
    const step = () => {
      const a = animRef.current;
      const running = !!a && a.playState === 'running';
      if (a) paint(Number(a.currentTime ?? 0));
      if (running !== playingRef.current) {
        playingRef.current = running;
        setPlaying(running);
      }
      raf.current = running ? requestAnimationFrame(step) : 0;
    };
    raf.current = requestAnimationFrame(step);
  }, [paint]);

  /** Start the card's animation again from 0: off, a forced style read, on. */
  const restart = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    card.classList.remove('is-run');
    void card.offsetWidth;
    card.classList.add('is-run');
    const a = card.getAnimations()[0] ?? null;
    animRef.current = a;
    if (a && reduced) {
      a.pause();
      a.currentTime = span.infinite ? span.delay : span.delay + span.active;
    }
    follow();
  }, [reduced, span, follow]);

  useEffect(() => {
    const st = document.createElement('style');
    st.setAttribute('data-kfg', scope);
    document.head.appendChild(st);
    styleRef.current = st;
    return () => {
      st.remove();
      styleRef.current = null;
    };
  }, [scope]);

  // New CSS: inject it and play it from the start (held still under reduced motion).
  useEffect(() => {
    if (styleRef.current) styleRef.current.textContent = css;
    restart();
    const id = raf;
    return () => cancelAnimationFrame(id.current);
  }, [css, restart]);

  function togglePlay() {
    const a = animRef.current;
    if (!a) return restart();
    if (a.playState === 'running') a.pause();
    else a.play();
    follow();
  }

  function scrub(t: number) {
    const a = animRef.current;
    if (!a) return;
    a.pause();
    a.currentTime = t;
    follow();
  }

  // ── Settings ──────────────────────────────────────────────────────────────

  function pickPreset(key: string) {
    // The delay is the page's, not the effect's: it stays.
    const next = { ...settingsFor(key, clsTouched ? s.cls : key), delay: s.delay };
    setS(next);
    setDraft(draftOf(next.timing));
    setTimingError(null);
    if (!clsTouched) setClsDraft(key);
  }

  function editTiming(next: TimingDraft) {
    setDraft(next);
    const r = timingFromDraft(next);
    if ('error' in r) return setTimingError(r.error);
    if (!supportsTiming(r.css)) return setTimingError(`This browser does not accept ${r.css} as a timing function.`);
    setTimingError(null);
    set('timing', r.css);
  }

  function editClass(v: string) {
    setClsDraft(v);
    setClsTouched(true);
    if (CLASS_RE.test(v)) set('cls', v);
  }
  const clsError = CLASS_RE.test(clsDraft) ? null : 'A class name here starts with a letter or _, then letters, digits, - or _.';

  // ── The code ──────────────────────────────────────────────────────────────

  const out = useMemo(() => {
    if (tab === 'css') return { code: cssCode(s), why: '' };
    if (tab === 'shorthand') return { code: shorthandCode(s), why: '' };
    if (tab === 'scroll-css') return { code: scrollCssCode(s), why: '' };
    return jsCode(s);
  }, [s, tab]);
  const run = useMemo(() => runnable(s, tab, version), [s, tab, version]);

  // ── The scroll box ────────────────────────────────────────────────────────

  const boxRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const libRef = useRef<HTMLDivElement>(null);
  const inst = useRef<Instance | null>(null);
  const tween = useRef(0);
  const map = libMapOf(preset);
  const exit = preset.group === 'exit';
  const libOpts = useMemo(() => libPreviewOptions(s.preset, s.timing), [s.preset, s.timing]);
  // The JS tab leaves an exit off under reduced motion; so does the box.
  const libOn = !!libOpts && !(exit && reduced);

  useEffect(() => {
    const el = libRef.current;
    const box = boxRef.current;
    if (!el || !box || !libOpts || !libOn) return;
    let live = true;
    const ref = inst;
    import('svg-scroll-draw').then(({ scrollAnimate }) => {
      if (!live) return;
      ref.current = scrollAnimate(el, { ...libOpts, scrollContainer: box });
    });
    return () => {
      live = false;
      ref.current?.destroy();
      ref.current = null;
    };
  }, [libOpts, libOn]);

  useEffect(() => {
    const id = tween;
    return () => cancelAnimationFrame(id.current);
  }, []);

  /** Scroll the box from the top to where the version has played, once. */
  function runScroll() {
    const box = boxRef.current;
    const row = rowRef.current;
    if (!box || !row) return;
    cancelAnimationFrame(tween.current);
    const target = exit
      ? box.scrollHeight - box.clientHeight
      : row.offsetTop - (box.clientHeight - row.offsetHeight) / 2;
    box.scrollTop = 0;
    inst.current?.replay();
    if (reduced) {
      box.scrollTop = target;
      return;
    }
    const t0 = performance.now();
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / SCROLL_MS);
      box.scrollTop = target * (0.5 - Math.cos(Math.PI * k) / 2);
      if (k < 1) tween.current = requestAnimationFrame(step);
    };
    tween.current = requestAnimationFrame(step);
  }
  const stopScroll = () => cancelAnimationFrame(tween.current);

  const libName = map.kind === 'reveal' ? 'scrollReveal' : map.kind === 'animate' ? 'scrollAnimate' : 'svg-scroll-draw';
  const libWindow = exit ? `${EXIT_TRIGGER.start} → ${EXIT_TRIGGER.end}` : `${REVEAL_DEFAULTS.start} → ${REVEAL_DEFAULTS.end}`;

  return (
    <div className={`kfg ${scope}`}>
      <div className="kfg-panel">
        <div className="kfg-presets">
          {GROUPS.map((g) => (
            <div key={g.key} className="kfg-group" role="group" aria-labelledby={`${scope}-${g.key}`}>
              <p id={`${scope}-${g.key}`} className="kfg-group-k">{g.label} · {presetsIn(g.key).length}</p>
              <div className="kfg-chips">
                {presetsIn(g.key).map((p) => (
                  <button key={p.key} type="button" aria-pressed={s.preset === p.key} onClick={() => pickPreset(p.key)}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <p className="kfg-hint">
            <b>{preset.label}.</b> {preset.d} Picking an effect sets the timing it is meant for; change any of it below,
            or pick it again to go back.
          </p>
        </div>

        <div className="kfg-controls">
          <Field label={`animation-duration · ${s.duration}ms`}>
            <input
              type="range" min={LIMITS.duration.min} max={LIMITS.duration.max} step={LIMITS.duration.step} value={s.duration}
              onChange={(e) => set('duration', Number(e.target.value))}
            />
          </Field>
          <Field label={`animation-delay · ${s.delay}ms`}>
            <input
              type="range" min={LIMITS.delay.min} max={LIMITS.delay.max} step={LIMITS.delay.step} value={s.delay}
              onChange={(e) => set('delay', Number(e.target.value))}
            />
          </Field>
          <Field label="animation-iteration-count">
            <select value={String(s.iterations)} onChange={(e) => set('iterations', e.target.value === 'infinite' ? 'infinite' : Number(e.target.value))}>
              {COUNTS.map((c) => <option key={c} value={String(c)}>{c}</option>)}
            </select>
          </Field>
          <Field label="animation-direction">
            <select value={s.direction} onChange={(e) => set('direction', e.target.value as Direction)}>
              {DIRECTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>
          <Field label="animation-fill-mode">
            <select value={s.fill} onChange={(e) => set('fill', e.target.value as Fill)}>
              {FILLS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </Field>
          <Field label="animation-timing-function">
            <select value={draft.kind} onChange={(e) => editTiming({ ...draft, kind: e.target.value as TimingKind })}>
              {TIMING_KINDS.map((k) => <option key={k} value={k}>{TIMING_LABEL(k)}</option>)}
            </select>
          </Field>
          {draft.kind === 'cubic-bezier' && (
            <Field label="cubic-bezier · x1, y1, x2, y2" param>
              <input
                type="text" inputMode="decimal" spellCheck={false} value={draft.bezier} maxLength={60}
                aria-invalid={!!timingError}
                onChange={(e) => editTiming({ ...draft, bezier: e.target.value })}
              />
            </Field>
          )}
          {draft.kind === 'steps' && (
            <Field label="steps · count, position" group param>
              <span className="kfg-pair">
                <input
                  type="number" min={1} max={LIMITS.maxSteps} step={1} value={draft.steps} aria-label="Number of steps"
                  aria-invalid={!!timingError}
                  onChange={(e) => editTiming({ ...draft, steps: Number(e.target.value) })}
                />
                <select value={draft.jump} aria-label="Step position" onChange={(e) => editTiming({ ...draft, jump: e.target.value as Jump })}>
                  {JUMPS.map((j) => <option key={j} value={j}>{j}</option>)}
                </select>
              </span>
            </Field>
          )}
          <Field label="class name">
            <input
              type="text" spellCheck={false} autoCapitalize="off" value={clsDraft} maxLength={MAX_CLASS}
              aria-invalid={!!clsError}
              onChange={(e) => editClass(e.target.value.trim())}
            />
          </Field>
        </div>
        {(timingError || clsError) && (
          <p className="kfg-warn" role="status">
            {timingError ?? clsError} {timingError ? `The preview and the code keep ${s.timing}.` : `The code keeps .${s.cls}.`}
          </p>
        )}

        <div className="kfg-stage">
          <div ref={cardRef} className="kfg-card" aria-hidden="true">
            <span className="kfg-card-k">.{s.cls}</span>
            <span className="kfg-card-l" />
            <span className="kfg-card-l is-2" />
            <span className="kfg-card-l is-3" />
          </div>
        </div>

        <div className="kfg-transport">
          {reduced ? (
            <p className="kfg-rm">
              Your system asks for less motion, so the preview holds still: drag the time slider to step through it.
            </p>
          ) : (
            <span className="kfg-btns">
              <button type="button" className="kfg-btn" onClick={restart}>↺ Replay</button>
              <button type="button" className="kfg-btn" onClick={togglePlay}>{playing ? '❚❚ Pause' : '▶ Play'}</button>
            </span>
          )}
          <Timeline tm={tm} span={span} timing={s.timing} headRef={headRef} />
          <label className="kfg-scrub">
            <span>time · 0 to {span.total} ms{span.infinite ? `, ${span.count} of its cycles` : ''}</span>
            <input
              ref={scrubRef} type="range" min={0} max={span.total} step={10} defaultValue={0}
              aria-describedby={`${scope}-read`}
              onChange={(e) => scrub(Number(e.target.value))}
            />
          </label>
          <p id={`${scope}-read`} ref={readRef} className="kfg-read" />
        </div>
      </div>

      <div className="kfg-code">
        <p className="kfg-code-k">
          On load or when a class is added: CSS, or the same as a shorthand. When it scrolls into view: CSS on a scroll
          timeline, or svg-scroll-draw in every browser.
        </p>
        <div className="kfg-tabs" role="tablist" aria-label="Code">
          {OUTPUTS.map((o) => (
            <button key={o.key} type="button" role="tab" aria-selected={tab === o.key} className="kfg-tab" onClick={() => setTab(o.key)}>
              {o.label}
            </button>
          ))}
        </div>
        <div role="tabpanel" aria-label={OUTPUTS.find((o) => o.key === tab)?.label}>
          {out.code !== null ? (
            <CodeBox file={FILE[tab](s)}>{out.code}</CodeBox>
          ) : (
            <div className="kfg-nomap">
              <p className="kfg-nomap-k">No svg-scroll-draw version</p>
              <p>
                {out.why} The On scroll · CSS tab plays every frame of it, in browsers with scroll timelines, and
                the row below runs that version.
              </p>
            </div>
          )}
        </div>
        <ToolExport title={run.title} filename={run.filename} html={run.html} />
      </div>

      <div className="kfg-live">
        <div className="kfg-live-head">
          <p className="kfg-live-k">When it scrolls into view · scroll the box, not the page</p>
          <button type="button" className="kfg-btn" onClick={runScroll}>▼ Scroll it</button>
        </div>
        <div
          ref={boxRef}
          className="kfg-sbox"
          tabIndex={0}
          role="region"
          aria-label="A box that scrolls: scroll it to run the two scroll versions"
          onWheel={stopScroll}
          onPointerDown={stopScroll}
          onKeyDown={stopScroll}
        >
          <div className="kfg-strack">
            <div className="kfg-spacer" aria-hidden="true"><span>scroll ↓</span></div>
            <div ref={rowRef} className="kfg-srow">
              <div className="kfg-scol">
                <div className="kfg-scard is-css" aria-hidden="true">
                  <span className="kfg-card-k">CSS</span>
                  <span className="kfg-card-l" />
                  <span className="kfg-card-l is-2" />
                </div>
                <p className="kfg-scap">view() · {rangeOf(preset)}</p>
              </div>
              <div className="kfg-scol">
                <div ref={libRef} className={`kfg-scard is-lib${libOpts ? '' : ' is-off'}`} aria-hidden="true">
                  <span className="kfg-card-k">{libName}</span>
                  <span className="kfg-card-l" />
                  <span className="kfg-card-l is-2" />
                </div>
                <p className="kfg-scap">{libOpts ? libWindow : 'no library version'}</p>
              </div>
            </div>
            <div className="kfg-spacer" aria-hidden="true" />
          </div>
        </div>
        <ul className="kfg-live-notes">
          <li>
            <b>CSS</b> The On scroll · CSS tab, scoped to this box, which is the card’s nearest scroller and so its
            view() timeline.
            {!viewOk && ' This browser has no animation-timeline: view(), so the card stays as it is, which is what the @supports does for your readers in such a browser.'}
          </li>
          <li>
            <b>{libName}</b>{' '}
            {map.kind === 'reveal' && 'scrollReveal has no scrollContainer option, so the box runs the same from and to through scrollAnimate, the engine scrollReveal is built on, with the box as its scrollContainer.'}
            {map.kind === 'animate' && 'The On scroll · JS tab’s scrollAnimate call, with the box as its scrollContainer.'}
            {map.kind === 'none' && map.why}
          </li>
          {reduced && (
            <li>
              <b>Less motion</b> The CSS card stays as it is and the library card shows its end state{exit ? ' (an exit is left off, as the JS tab’s check does)' : ''},
              as both would for your readers.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

function Field({ label, group, param, children }: { label: string; group?: boolean; param?: boolean; children: ReactNode }) {
  const cls = `kfg-field${param ? ' is-param' : ''}`;
  // A pair of inputs carries its own labels, so the field names them as a group.
  if (group) {
    return (
      <div className={cls} role="group" aria-label={label}>
        <span>{label}</span>
        {children}
      </div>
    );
  }
  return (
    <label className={cls}>
      <span>{label}</span>
      {children}
    </label>
  );
}

/**
 * The current settings on a time axis: the delay, each cycle drawn with the
 * easing and the way it runs, the time after; the held frame where the fill
 * mode keeps the keyframes applied. The playhead is positioned by the parent.
 */
function Timeline({ tm, span, timing, headRef }: { tm: TimeSettings; span: Span; timing: string; headRef: RefObject<HTMLDivElement | null> }) {
  const fn = useMemo(() => easingFn(timing), [timing]);
  const [lo, hi] = useMemo(() => {
    let a = 0;
    let b = 1;
    for (let i = 0; i <= 64; i++) {
      const v = fn(i / 64);
      a = Math.min(a, v);
      b = Math.max(b, v);
    }
    return [a, b];
  }, [fn]);
  const yOf = (v: number) => 4 + (1 - (v - lo) / (hi - lo)) * 32;
  type Seg = { key: string; w: number; label: string; ramp?: boolean; back?: boolean; hold?: number | null };
  const segs: Seg[] = [];
  if (span.delay > 0) segs.push({ key: 'delay', w: span.delay, label: 'delay', hold: fillsBefore(tm.fill) ? firstFrame(tm.direction) / 100 : null });
  for (let i = 0; i < span.count; i++) {
    segs.push({ key: `c${i}`, w: span.duration, label: `${i + 1}${span.infinite && i === span.count - 1 ? ' …' : ''}`, ramp: true, back: reversedAt(i, tm.direction) });
  }
  if (span.after > 0) segs.push({ key: 'after', w: span.after, label: 'after', hold: fillsAfter(tm.fill) ? lastFrame(span.count, tm.direction) / 100 : null });

  return (
    <div className="kfg-tl" aria-hidden="true">
      <div className="kfg-tl-track">
        {segs.map((sg) => (
          <div key={sg.key} className={`kfg-tl-seg${sg.ramp ? ' is-cycle' : ''}`} style={{ flexGrow: sg.w }}>
            <svg viewBox="0 0 100 40" preserveAspectRatio="none" focusable="false">
              {sg.ramp && <path d={cyclePath(cyclePoints(fn, !!sg.back), 0, 100, 4, 32, lo, hi)} vectorEffect="non-scaling-stroke" />}
              {sg.hold != null && <line x1={0} x2={100} y1={yOf(sg.hold)} y2={yOf(sg.hold)} vectorEffect="non-scaling-stroke" />}
            </svg>
          </div>
        ))}
        <div ref={headRef} className="kfg-tl-head" />
      </div>
      <div className="kfg-tl-labels">
        {segs.map((sg) => <span key={sg.key} style={{ flexGrow: sg.w }}>{sg.label}</span>)}
      </div>
    </div>
  );
}
