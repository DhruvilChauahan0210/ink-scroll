'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type KeyboardEvent, type ReactNode } from 'react';
import { CodeBox } from '@/components/site/CodeBox';
import {
  ALIGNS, AXES, DEFAULTS, PRESETS, RANGES, SNAP_DEFAULTS, SNAP_EASINGS, STOPS, STRICTNESS,
  css, html, js, libAxisOk, libJs, presetOf, snapPosition,
  type Align, type Axis, type Engine, type Settings, type SnapEasing, type Stop, type Strictness,
} from './snap-code';

/**
 * The CSS scroll snap generator. The preview is the generated code:
 *
 * - CSS: its stylesheet is css() from ./snap-code with the preview's class as
 *   the selector, injected as it is, so the box snaps by the rules the listing
 *   shows. Previous and Next run the same sums as the copied snap.js, and the
 *   readout and the rulers use them too: every item's snap position, read from
 *   the layout and the computed scroll-padding, clamped to the scroll range.
 * - scrollSnap(): css() without the snap properties, and scrollSnap from
 *   svg-scroll-draw/snap with the box as its scrollContainer. Buttons call
 *   snapTo(), and onSnap feeds the readout.
 *
 * Scroll positions are written to the DOM, never to state: the box can scroll
 * every frame, and the page should not re-render every frame. The readout of
 * which item is snapped is state, set when a scroll ends.
 */

type Instance = ReturnType<typeof import('svg-scroll-draw/snap').scrollSnap>;
type Pos = { x: number; y: number };
type Geo = { pos: Pos[]; maxX: number; maxY: number };
type Read = { snapped: number[]; x: number; y: number; maxX: number; maxY: number };

const SEL = 'snp-x';
const REDUCED = '(prefers-reduced-motion: reduce)';
const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia(REDUCED).matches;
const subscribeNever = () => () => {};
/** Whether this browser fires scrollend: read on the client only, null while server rendering. */
const useScrollEnd = () => useSyncExternalStore(subscribeNever, () => 'onscrollend' in window, () => null);

const ENGINES: { k: Engine; label: string }[] = [
  { k: 'css', label: 'CSS scroll snap' },
  { k: 'js', label: 'scrollSnap()' },
];

const NOTE: Record<Engine, string> = {
  css: 'No library: scroll-snap-type on the box and scroll-snap-align on its children do the snapping. snap.js is only for the buttons.',
  js: 'When a scroll stops, scrollSnap glides on to the next section or back to this one, over your duration and easing. The stylesheet has no snap properties, so the two never pull against each other.',
};

/** Every item's snap position, read from the layout the way snap.js reads it. */
function measure(port: HTMLElement, s: Settings, engine: Engine): Geo {
  const items = [...port.children] as HTMLElement[];
  const box = port.getBoundingClientRect();
  const maxX = Math.max(0, port.scrollWidth - port.clientWidth);
  const maxY = Math.max(0, port.scrollHeight - port.clientHeight);
  // scrollSnap lines each section's start edge up with the box's start, and
  // reads no scroll-padding: snap/index.ts:117–130. The padding is the one
  // css() writes, on the snap axis only; it is taken from the settings, not
  // from getComputedStyle as snap.js does, because under reduced motion
  // globals.css gives it a 0.01ms transition and a read can still see the
  // old value.
  const align: Align = engine === 'js' ? 'start' : s.align;
  const p = engine === 'js' ? 0 : s.padding;
  const [l, r] = s.axis === 'y' ? [0, 0] : [p, p];
  const [t, b] = s.axis === 'x' ? [0, 0] : [p, p];
  const pos = items.map((item) => {
    const rect = item.getBoundingClientRect();
    const atX = rect.left - box.left - port.clientLeft + port.scrollLeft;
    const atY = rect.top - box.top - port.clientTop + port.scrollTop;
    return {
      x: snapPosition(align, atX, rect.width, port.clientWidth, l, r, maxX),
      y: snapPosition(align, atY, rect.height, port.clientHeight, t, b, maxY),
    };
  });
  return { pos, maxX, maxY };
}

/** Which items sit on their snap position now, on the axes that snap. */
function readOf(port: HTMLElement, geo: Geo, axis: Axis): Read {
  const x = port.scrollLeft;
  const y = port.scrollTop;
  const snapped = geo.pos.flatMap((p, i) => {
    const okX = axis === 'y' || Math.abs(p.x - x) < 1;
    const okY = axis === 'x' || Math.abs(p.y - y) < 1;
    return okX && okY ? [i] : [];
  });
  return { snapped, x, y, maxX: geo.maxX, maxY: geo.maxY };
}

export function SnapGenerator() {
  const [s, setS] = useState<Settings>(DEFAULTS);
  const [chosen, setChosen] = useState<Engine>('css');
  const [read, setRead] = useState<Read | null>(null);
  const [geo, setGeo] = useState<Geo | null>(null);
  const [lastSnap, setLastSnap] = useState<{ key: string; i: number } | null>(null);
  const hasScrollEnd = useScrollEnd();
  const engine: Engine = chosen === 'js' && libAxisOk(s) ? 'js' : 'css';
  const lib = engine === 'js';

  const port = useRef<HTMLDivElement>(null);
  const over = useRef<HTMLDivElement>(null);
  const markX = useRef<HTMLSpanElement>(null);
  const markY = useRef<HTMLSpanElement>(null);
  const inst = useRef<Instance | null>(null);

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setS((p) => ({ ...p, [k]: v }));
  const preset = presetOf(s);
  const previewCss = useMemo(() => css(s, engine, `.${SEL}`), [s, engine]);
  const files = useMemo(
    () => [
      { file: 'index.html', code: html(s) },
      { file: 'snap.css', code: css(s, engine) },
      { file: 'snap.js', code: lib ? libJs(s) : js(s) },
    ],
    [s, engine, lib],
  );
  const layoutKey = `${engine}|${s.axis}|${s.count}|${s.size}|${s.gap}`;
  // One scrollSnap instance per key: its onSnap readout belongs to it alone.
  const instKey = `${lib}|${s.axis}|${s.count}|${s.gap}|${s.duration}|${s.easing}|${s.threshold}`;
  const snapIndex = lastSnap?.key === instKey ? lastSnap.i : null;

  // A new layout starts at the top. scrollSnap needs it too: it counts from the
  // first section whatever the scroll position (snap/index.ts:99).
  useEffect(() => {
    port.current?.scrollTo({ left: 0, top: 0, behavior: 'instant' });
  }, [layoutKey]);

  // Measure on every change and resize, and read again whenever a scroll ends.
  useEffect(() => {
    const el = port.current;
    if (!el) return;
    let frame = 0;     // the markers, on scroll
    let sizing = 0;    // a new measurement, on any change or resize: never cancelled by a scroll
    let timer: ReturnType<typeof setTimeout> | undefined;
    let g: Geo | null = null;
    // Where scrollend is missing, a short pause after the last scroll stands in for it.
    const endless = !('onscrollend' in window);

    const moveMarks = () => {
      if (!g) return;
      if (markX.current) markX.current.style.left = `${g.maxX ? (el.scrollLeft / g.maxX) * 100 : 0}%`;
      if (markY.current) markY.current.style.left = `${g.maxY ? (el.scrollTop / g.maxY) * 100 : 0}%`;
    };
    // Measured again whenever a scroll ends as well: it is a dozen rects.
    const remeasure = () => {
      g = measure(el, s, engine);
      setGeo(g);
      if (over.current) {
        over.current.style.setProperty('--snp-w', `${el.clientWidth}px`);
        over.current.style.setProperty('--snp-h', `${el.clientHeight}px`);
      }
      moveMarks();
      setRead(readOf(el, g, s.axis));
    };
    const settle = remeasure;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(moveMarks);
      if (endless) {
        clearTimeout(timer);
        timer = setTimeout(settle, 150);
      }
    };

    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(sizing);
      sizing = requestAnimationFrame(remeasure);
    });
    // The items too: under reduced motion globals.css gives every element a
    // 0.01ms transition, so a new item size lands a frame after the port's
    // own observation, and only the items' observer sees it.
    ro.observe(el);
    for (const item of el.children) ro.observe(item);
    el.addEventListener('scroll', onScroll, { passive: true });
    el.addEventListener('scrollend', settle);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(frame);
      cancelAnimationFrame(sizing);
      clearTimeout(timer);
      el.removeEventListener('scroll', onScroll);
      el.removeEventListener('scrollend', settle);
    };
  }, [s, engine]);

  // scrollSnap, made again on any of its settings and destroyed on unmount.
  useEffect(() => {
    const el = port.current;
    if (!el || !lib) return;
    let live = true;
    import('svg-scroll-draw/snap').then(({ scrollSnap }) => {
      if (!live) return;
      el.scrollTo({ left: 0, top: 0, behavior: 'instant' });
      inst.current = scrollSnap([...el.children], {
        direction: s.axis === 'x' ? 'horizontal' : 'vertical',
        duration: s.duration,
        easing: s.easing,
        threshold: s.threshold,
        scrollContainer: el,
        onSnap: (i) => setLastSnap({ key: instKey, i }),
      });
    });
    return () => {
      live = false;
      inst.current?.destroy();
      inst.current = null;
    };
  }, [instKey, lib, s.axis, s.count, s.gap, s.duration, s.easing, s.threshold]);

  /** Previous and next: the copied snap.js, or snapTo() for scrollSnap. */
  function go(step: number) {
    const el = port.current;
    if (!el) return;
    if (lib) {
      const i = inst.current;
      i?.snapTo(i.getCurrentIndex() + step);
      return;
    }
    const all = measure(el, s, engine).pos;
    const behavior: ScrollBehavior = reducedMotion() ? 'auto' : 'smooth';
    if (s.axis === 'both') {
      const far = (p: Pos) => Math.hypot(p.x - el.scrollLeft, p.y - el.scrollTop);
      let i = all.indexOf(all.reduce((a, b) => (far(b) < far(a) ? b : a)));
      do i += step; while (all[i] && far(all[i]) < 1);
      if (all[i]) el.scrollTo({ left: all[i].x, top: all[i].y, behavior });
      return;
    }
    const k = s.axis === 'x' ? 'x' : 'y';
    const now = s.axis === 'x' ? el.scrollLeft : el.scrollTop;
    const list = all.map((p) => p[k]);
    const to = step > 0 ? list.find((p) => p > now + 1) : list.findLast((p) => p < now - 1);
    if (to !== undefined) el.scrollTo({ [s.axis === 'x' ? 'left' : 'top']: to, behavior });
  }

  function applyPreset(k: string) {
    const p = PRESETS.find((x) => x.k === k);
    if (p) setS((prev) => ({ ...prev, ...p.s }));
  }

  const items = Array.from({ length: s.count }, (_, i) => i);
  const snappedText = read == null
    ? '—'
    : read.snapped.length === 0
      ? 'none · between snap positions'
      : read.snapped.length === 1
        ? `item ${read.snapped[0] + 1} of ${s.count}`
        : `items ${read.snapped.map((i) => i + 1).join(' + ')} of ${s.count} · same position`;
  const nothingToScroll = read != null && read.maxX < 1 && read.maxY < 1;

  return (
    <div className="snp">
      <style>{previewCss}</style>
      <div className="snp-panel">
        <div className="snp-controls">
          <Field label={`layout${preset ? '' : ' · custom'}`} wide>
            <span className="snp-seg" role="group" aria-label="Layout preset">
              {PRESETS.map((p) => (
                <button key={p.k} type="button" aria-pressed={preset === p.k} title={p.d} onClick={() => applyPreset(p.k)}>{p.label}</button>
              ))}
            </span>
          </Field>
          <Field label="snaps with" wide>
            <Seg
              value={chosen}
              options={ENGINES.map((e) => e.k)}
              labels={ENGINES.map((e) => e.label)}
              onChange={(v) => setChosen(v as Engine)}
              label="Snaps with"
            />
          </Field>
          <Field label="axis">
            <Seg value={s.axis} options={AXES} onChange={(v) => set('axis', v as Axis)} label="Axis" />
          </Field>
          <Field label="scroll-snap-type" off={lib} phoneWide>
            <Seg value={s.strictness} options={STRICTNESS} onChange={(v) => set('strictness', v as Strictness)} label="Strictness" disabled={lib} />
          </Field>
          <Field label="scroll-snap-align" off={lib} phoneWide>
            <Seg value={s.align} options={ALIGNS} onChange={(v) => set('align', v as Align)} label="Align" disabled={lib} />
          </Field>
          <Field label="scroll-snap-stop" off={lib}>
            <Seg value={s.stop} options={STOPS} onChange={(v) => set('stop', v as Stop)} label="Snap stop" disabled={lib} />
          </Field>
          <Range k="padding" label={`scroll-padding · ${s.padding}px`} s={s} set={set} disabled={lib} />
          <Range k="size" label={`item size · ${lib ? 100 : s.size}%`} s={s} set={set} disabled={lib} value={lib ? 100 : undefined} />
          <Range k="gap" label={`gap · ${s.gap}px`} s={s} set={set} />
          <Range k="count" label={`items · ${s.count}`} s={s} set={set} />
          {lib && (
            <>
              <Range k="duration" label={`duration · ${s.duration}ms`} s={s} set={set} />
              <Field label="easing">
                <select value={s.easing} aria-label="Easing" onChange={(e) => set('easing', e.target.value as SnapEasing)}>
                  {SNAP_EASINGS.map((e) => <option key={e} value={e}>{e}{e === SNAP_DEFAULTS.easing ? ' (default)' : ''}</option>)}
                </select>
              </Field>
              <Range k="threshold" label={`threshold · ${s.threshold.toFixed(2)}`} s={s} set={set} />
            </>
          )}
        </div>
        {chosen === 'js' && !libAxisOk(s) && (
          <p className="snp-warn" role="status">
            scrollSnap moves on one axis, vertical or horizontal, so the gallery’s two-way grid stays on CSS scroll snap.
            Pick x or y to try it.
          </p>
        )}
        {lib && (
          <p className="snp-warn" role="status">
            scrollSnap lines each section’s start edge up with the start of the box, so align, padding and strictness
            do not apply, and each section fills the box: with smaller ones the last few could never reach the start.
          </p>
        )}

        <div className="snp-stage">
          <p className="snp-stage-k">
            <span>preview · {lib ? 'scrollSnap() with this box as scrollContainer' : 'the generated CSS, as it is'}</span>
            <span>swipe, scroll, or focus it and use the arrow keys</span>
          </p>
          <div className="snp-frame">
            <div
              ref={port}
              className={`${SEL} snp-port is-${s.axis}`}
              tabIndex={0}
              role="region"
              aria-label={`Preview: ${s.count} items. Scroll it.`}
            >
              {items.map((i) => (
                <div key={i} className={read?.snapped.includes(i) ? 'is-snapped' : undefined}>
                  <span>{i + 1}</span>
                </div>
              ))}
            </div>
            <Overlay ref={over} s={s} lib={lib} />
          </div>
          {geo && s.axis !== 'y' && <Ruler label="x" pos={geo.pos.map((p) => p.x)} max={geo.maxX} snapped={read?.snapped ?? []} mark={markX} single={s.axis === 'x'} />}
          {geo && s.axis !== 'x' && <Ruler label="y" pos={geo.pos.map((p) => p.y)} max={geo.maxY} snapped={read?.snapped ?? []} mark={markY} single={s.axis === 'y'} />}
        </div>

        <div className="snp-transport">
          <span className="snp-pair">
            <button type="button" className="snp-btn" onClick={() => go(-1)}>← Previous</button>
            <button type="button" className="snp-btn" onClick={() => go(1)}>Next →</button>
          </span>
          <dl className="snp-read">
            <div><dt>snapped</dt><dd aria-live="polite">{nothingToScroll ? 'all of them · nothing to scroll' : snappedText}</dd></div>
            {s.axis !== 'y' && <div><dt>scrollLeft</dt><dd>{read ? `${Math.round(read.x)} / ${Math.round(read.maxX)}` : '—'}</dd></div>}
            {s.axis !== 'x' && <div><dt>scrollTop</dt><dd>{read ? `${Math.round(read.y)} / ${Math.round(read.maxY)}` : '—'}</dd></div>}
            {lib && <div><dt>onSnap</dt><dd>{snapIndex == null ? '—' : `(${snapIndex})`}</dd></div>}
            <div><dt>read on</dt><dd>{hasScrollEnd === false ? 'scroll + 150ms pause' : 'scrollend'}</dd></div>
          </dl>
        </div>
      </div>

      <div className="snp-code">
        <p className="snp-code-note">{NOTE[engine]}</p>
        {files.map((f) => <CodeBox key={f.file} file={f.file}>{f.code}</CodeBox>)}
      </div>
    </div>
  );
}

/** The scroll-padding bands and the snap line, over the scroll port and not scrolling with it. */
function Overlay({ ref, s, lib }: { ref: React.Ref<HTMLDivElement>; s: Settings; lib: boolean }) {
  const pad = lib ? 0 : s.padding;
  const align: Align = lib ? 'start' : s.align;
  const at = (size: string) => (align === 'start' ? `${pad}px` : align === 'end' ? `calc(${size} - ${pad}px)` : `calc(${size} / 2)`);
  const x = s.axis !== 'y';
  const y = s.axis !== 'x';
  return (
    <div ref={ref} className="snp-over" aria-hidden="true">
      {pad > 0 && x && (
        <>
          <span className="snp-band is-x" style={{ left: 0, width: pad }} />
          <span className="snp-band is-x" style={{ left: `calc(var(--snp-w, 100%) - ${pad}px)`, width: pad }} />
        </>
      )}
      {pad > 0 && y && (
        <>
          <span className="snp-band is-y" style={{ top: 0, height: pad }} />
          <span className="snp-band is-y" style={{ top: `calc(var(--snp-h, 100%) - ${pad}px)`, height: pad }} />
        </>
      )}
      {x && <span className="snp-line is-x" style={{ left: at('var(--snp-w, 100%)') }}><b>snap line · {align}</b></span>}
      {y && <span className="snp-line is-y" style={{ top: at('var(--snp-h, 100%)') }}>{!x && <b>snap line · {align}</b>}</span>}
    </div>
  );
}

/** Snap positions along one scroll axis, 0 to max, with the scroll position on it. */
function Ruler({ label, pos, max, snapped, mark, single }: {
  label: string; pos: number[]; max: number; snapped: number[]; mark: React.RefObject<HTMLSpanElement | null>; single: boolean;
}) {
  const ticks = pos.reduce<{ p: number; items: number[] }[]>((all, p, i) => {
    const same = all.find((t) => Math.abs(t.p - p) < 1);
    if (same) same.items.push(i + 1);
    else all.push({ p, items: [i + 1] });
    return all;
  }, []).sort((a, b) => a.p - b.p);
  return (
    <div className="snp-ruler">
      <span className="snp-ruler-k">{label} · snap positions</span>
      {max < 1 ? (
        <span className="snp-ruler-none">nothing to scroll: the items fit in the box</span>
      ) : (
        <span className="snp-ruler-track">
          {ticks.map((t) => {
            const on = t.items.some((n) => snapped.includes(n - 1));
            const edge = t.p < 1 ? ' is-first' : t.p > max - 1 ? ' is-last' : '';
            return (
              <span key={t.p} className={`snp-tick${on ? ' is-on' : ''}${edge}`} style={{ left: `${(t.p / max) * 100}%` }}>
                {single && <i>{t.items.length > 2 ? `${t.items[0]}–${t.items[t.items.length - 1]}` : t.items.join('+')}</i>}
              </span>
            );
          })}
          <span ref={mark} className="snp-mark" />
        </span>
      )}
      {max >= 1 && <span className="snp-ruler-end">{Math.round(max)}</span>}
    </div>
  );
}

function Range<K extends 'padding' | 'size' | 'gap' | 'count' | 'duration' | 'threshold'>({ k, label, s, set, disabled = false, value }: {
  k: K; label: string; s: Settings; set: <T extends keyof Settings>(k: T, v: Settings[T]) => void; disabled?: boolean; value?: number;
}) {
  const r = RANGES[k];
  return (
    <Field label={label} off={disabled}>
      <input
        type="range" min={r.min} max={r.max} step={r.step} value={value ?? s[k]} disabled={disabled}
        aria-label={label.split(' · ')[0]}
        onChange={(e) => set(k, Number(e.target.value) as Settings[K])}
      />
    </Field>
  );
}

/**
 * A labelled control. `wide` takes the whole row, `phoneWide` only on a phone
 * (where the rest pair up); `off` dims one that does not apply.
 */
function Field({ label, wide = false, phoneWide = false, off = false, children }: {
  label: string; wide?: boolean; phoneWide?: boolean; off?: boolean; children: ReactNode;
}) {
  return (
    <div className={`snp-field${wide ? ' is-wide' : ''}${phoneWide ? ' is-phone-wide' : ''}${off ? ' is-off' : ''}`}>
      <span>{label}{off ? ' · CSS only' : ''}</span>
      {children}
    </div>
  );
}

/**
 * A segmented control with radio semantics: one tab stop (the checked option),
 * and the arrow keys move the choice.
 */
function Seg({ value, options, labels, onChange, label, disabled = false }: {
  value: string; options: readonly string[]; labels?: string[]; onChange: (v: string) => void; label: string; disabled?: boolean;
}) {
  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, i: number) {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    const to = e.key === 'Home' ? 0 : e.key === 'End' ? options.length - 1 : step == null ? -1 : (i + step + options.length) % options.length;
    if (to < 0) return;
    e.preventDefault();
    onChange(options[to]);
    (e.currentTarget.parentElement?.children[to] as HTMLElement | undefined)?.focus();
  }
  return (
    <span className="snp-seg" role="radiogroup" aria-label={label} aria-disabled={disabled || undefined}>
      {options.map((o, i) => (
        <button
          key={o} type="button" role="radio" aria-checked={value === o} tabIndex={value === o ? 0 : -1} disabled={disabled}
          onClick={() => onChange(o)} onKeyDown={(e) => onKeyDown(e, i)}
        >
          {labels?.[i] ?? o}
        </button>
      ))}
    </span>
  );
}
