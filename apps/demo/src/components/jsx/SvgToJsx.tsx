'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import type { ScrollDrawOptions } from 'svg-scroll-draw';
import { CodeBox } from '@/components/site/CodeBox';
import { EASING_NAMES } from '@/data/easing';
import {
  COMPONENT_NAME, WRAP_DEFAULTS, drawPlan, missingFrom, toComponent, toPascalCase, type Change, type Size, type WrapOptions,
} from './convert';
import { readSvg } from './read-svg';
import { SAMPLE, SAMPLE_NAME } from './sample';

/**
 * The SVG to JSX converter.
 *
 * - The paste is read as data (read-svg.ts: DOMParser, inert) and converted
 *   by pure functions (convert.ts) into text. Nothing pasted runs, and the
 *   generated code is only ever shown as text.
 * - The preview is sanitizeSvg's rebuild of the paste (drawing elements
 *   only), never the generated code. With "Wrap in ScrollDraw" on it becomes
 *   a little scroll box and the drawing is run by scrollDraw with the same
 *   options as the code, plus scrollContainer, so it draws as that box
 *   scrolls without the page moving.
 *
 * Parsing needs DOMParser, so it starts after mount: the server render and
 * the first client render are the same empty state.
 */

type Instance = ReturnType<typeof import('svg-scroll-draw').scrollDraw>;
type Mode = 'all' | 'drawing';

/** Where the drawing finishes: trigger.end. The first is ScrollDraw's default. */
const ENDS: readonly [string, string][] = [
  [WRAP_DEFAULTS.end, 'its bottom leaves the top'],
  ['center center', 'its middle reaches the middle'],
  ['bottom bottom', 'it is wholly in view'],
];
const SIZES: readonly [Size, string][] = [['keep', 'as is'], ['1em', '1em'], ['none', 'none']];
/** Easings that overshoot or dip, which `once` handled wrongly up to 2.23.2. */
const LIVELY = new Set(['spring', 'elastic', 'bounce']);
/** Names the generated file imports, which the component cannot also take. */
const TAKEN = ['ScrollDraw', 'SVGProps', 'CSSProperties'];
const MAX_LISTED = 8;
/** Where the scroll box starts when the wrap is turned on. */
const START_AT = 0.4;

const subscribeReduced = (cb: () => void) => {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
};
const reducedNow = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const listOf = (items: string[]) =>
  items.length > MAX_LISTED ? `${items.slice(0, MAX_LISTED).join(', ')} and ${items.length - MAX_LISTED} more` : items.join(', ');

export function SvgToJsx() {
  const [input, setInput] = useState(SAMPLE);
  const [source, setSource] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('all');
  const [name, setName] = useState(SAMPLE_NAME);
  const [ts, setTs] = useState(true);
  const [spread, setSpread] = useState(true);
  const [size, setSize] = useState<Size>('keep');
  const [title, setTitle] = useState('');
  const [wrap, setWrap] = useState(false);
  const [w, setW] = useState<WrapOptions>(WRAP_DEFAULTS);
  const [invert, setInvert] = useState(false);
  /** A bare path's viewBox, measured from the preview, for the paste it was measured on. */
  const [bounds, setBounds] = useState<{ source: string; viewBox: string } | null>(null);
  const reduced = useSyncExternalStore(subscribeReduced, reducedNow, () => false);
  const host = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const slider = useRef<HTMLInputElement>(null);
  const scrollOut = useRef<HTMLSpanElement>(null);
  const drawnOut = useRef<HTMLSpanElement>(null);
  const first = useRef(true);
  /** Whether the scroll box has been placed since the wrap was turned on. */
  const placed = useRef(false);
  const setWrapOpt = <K extends keyof WrapOptions>(k: K, v: WrapOptions[K]) => setW((p) => ({ ...p, [k]: v }));

  // The first parse at once, then debounced so a half-pasted SVG is not parsed on every key.
  useEffect(() => {
    const id = setTimeout(() => setSource(input), first.current ? 0 : 250);
    first.current = false;
    return () => clearTimeout(id);
  }, [input]);

  const read = useMemo(() => (source === null ? null : readSvg(source)), [source]);
  const ok = read?.ok ? read : null;

  const valid = COMPONENT_NAME.test(name) && !(TAKEN.includes(name));
  const component = valid ? name : TAKEN.includes(toPascalCase(name)) ? `${toPascalCase(name)}Icon` : toPascalCase(name);

  const result = useMemo(() => {
    if (!ok) return null;
    const options = {
      name: component, ts, spread, size, title, wrap: wrap ? w : null,
      boundsViewBox: bounds && bounds.source === source ? bounds.viewBox : null,
    };
    // Both trees, converted the same way: the difference is what the preview leaves out.
    const all = toComponent(ok.all, options, ok.prolog);
    const drawing = ok.drawing ? toComponent(ok.drawing, options, ok.prolog) : null;
    const out = mode === 'drawing' ? drawing : all;
    if (!out) return { error: 'The drawing-only subset is empty: this SVG has no paths or shapes. Switch to everything.' };
    if ('error' in out) return out;
    const missing = drawing && !('error' in drawing) && !('error' in all) ? missingFrom(all.root, drawing.root) : [];
    const leftRows: Change[] = mode === 'drawing' ? missing.map((k) => {
      const [what, n] = k.split(' ×');
      return { from: what, to: what === 'gradient or pattern paint' ? 'currentColor' : 'left out', why: 'drawing only: not in what the preview draws', n: Number(n ?? 1) };
    }) : [];
    return { ...out, changes: [...out.changes, ...leftRows], plan: drawPlan(out.root), notPreviewed: mode === 'all' ? missing : [] };
  }, [ok, mode, component, ts, spread, size, title, wrap, w, bounds, source]);
  const code = result && 'code' in result ? result : null;
  /** What the code keeps that the preview does not draw. */
  const notPreviewed = code?.notPreviewed ?? [];

  useEffect(() => {
    const h = host.current;
    const b = box.current;
    if (!h || !b) return;
    h.replaceChildren();
    if (!read?.ok || !read.preview) return;
    const svg = read.preview.cloneNode(true) as SVGSVGElement;
    svg.classList.add('jx-svg');
    h.appendChild(svg);

    // A bare path has no viewBox: frame it from its own bounds, here and in the code.
    let framed: string | null = null;
    if (!svg.getAttribute('viewBox')) {
      try {
        const bb = svg.getBBox();
        const pad = Math.max(bb.width, bb.height) * 0.06 + 2;
        const r = (n: number) => String(Math.round(n * 100) / 100);
        framed = [bb.x - pad, bb.y - pad, bb.width + pad * 2, bb.height + pad * 2].map(r).join(' ');
        svg.setAttribute('viewBox', framed);
      } catch { /* nothing drawable */ }
    }
    let live = true;
    let inst: Instance | null = null;
    const frame = requestAnimationFrame(() => {
      if (live && read.bare && framed && source !== null) setBounds({ source, viewBox: framed });
    });
    if (!wrap) placed.current = false;
    else {
      // First time on: scroll the box part-way in, so the drawing shows half drawn
      // instead of an empty box with the drawing still below it.
      if (!placed.current) {
        placed.current = true;
        b.scrollTop = START_AT * (b.scrollHeight - b.clientHeight);
        onBoxScroll();
      }
      import('svg-scroll-draw').then(({ scrollDraw }) => {
        if (!live) return;
        // The code's options, plus the box this preview scrolls instead of the page.
        inst = scrollDraw(h, {
          easing: w.easing as ScrollDrawOptions['easing'],
          stagger: w.stagger,
          once: w.once,
          trigger: { end: w.end },
          ...(w.fillFade ? { fillOpacity: [0, 1] as [number, number] } : {}),
          scrollContainer: b,
          onProgress: (p) => { if (drawnOut.current) drawnOut.current.textContent = p.toFixed(2); },
        });
        if (drawnOut.current) drawnOut.current.textContent = inst.getProgress().toFixed(2);
      });
    }
    return () => {
      live = false;
      cancelAnimationFrame(frame);
      inst?.destroy();
    };
  }, [read, wrap, w, source]);

  function onBoxScroll() {
    const b = box.current;
    if (!b) return;
    const max = b.scrollHeight - b.clientHeight;
    const f = max > 0 ? b.scrollTop / max : 0;
    if (slider.current) slider.current.value = String(f);
    if (scrollOut.current) scrollOut.current.textContent = f.toFixed(2);
  }
  function onSlide(f: number) {
    const b = box.current;
    if (b) b.scrollTop = f * (b.scrollHeight - b.clientHeight);
  }

  const error = read && !read.ok ? read.error : result && 'error' in result ? result.error : '';
  const plan = code?.plan;
  const warnings: ReactNode[] = [];
  if (!valid) {
    warnings.push(
      <>“{name || ' '}” cannot name a component: it must start with a capital letter and use only letters, digits, _ or ${TAKEN.includes(name) ? ', and not be a name the file imports' : ''}. Using {component}.</>,
    );
  }
  code?.warnings.forEach((t) => warnings.push(t));
  if (wrap && plan) {
    if (!plan.shapes) warnings.push('Nothing for ScrollDraw to draw: it draws path, line, polyline, polygon, rect and circle elements, and there are none outside <defs>.');
    if (plan.fillOnly && !w.fillFade) {
      warnings.push(`${plan.fillOnly} of ${plan.shapes} shapes have a fill and no stroke. ScrollDraw draws strokes, so ${plan.fillOnly === 1 ? 'it shows' : 'they show'} at once: turn on “fill fades in”, or give ${plan.fillOnly === 1 ? 'it' : 'them'} a stroke.`);
    }
    if (plan.ellipses) {
      warnings.push(<>{plan.ellipses} {'<ellipse>'} {plan.ellipses === 1 ? 'is' : 'are'} not in ScrollDraw’s default selector, so {plan.ellipses === 1 ? 'it shows' : 'they show'} whole. Turn {plan.ellipses === 1 ? 'it' : 'them'} into paths with the <Link href="/svg-shape-to-path-converter">shape to path converter</Link>.</>);
    }
    if (w.once && LIVELY.has(w.easing)) {
      warnings.push(`once with ${w.easing}: on 2.23.2 and earlier, once held the eased value, so spring and elastic stopped on their overshoot and bounce lost its dips. Fixed in 2.23.3, which holds the scroll progress and eases after.`);
    }
  }

  return (
    <div className="jx">
      <div className="jx-panel">
        <label className="jx-input">
          <span>Paste an SVG, or one path’s d value</span>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} rows={8} aria-label="SVG markup" />
        </label>
        {input !== SAMPLE && (
          <div className="jx-bar">
            <button type="button" className="jx-btn" onClick={() => { setInput(SAMPLE); setName(SAMPLE_NAME); }}>Load the sample</button>
          </div>
        )}
        {error && <p className="jx-error" role="alert">{error}</p>}

        <div className="jx-controls">
          <Field label="Component name">
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} spellCheck={false} aria-invalid={!valid} />
          </Field>
          <Field label="Language" group>
            <Seg value={ts ? 'ts' : 'js'} options={[['ts', 'TypeScript'], ['js', 'JavaScript']]} onChange={(v) => setTs(v === 'ts')} label="Language" />
          </Field>
          <Field label="Convert" group>
            <Seg value={mode} options={[['all', 'everything'], ['drawing', 'drawing only']]} onChange={(v) => setMode(v as Mode)} label="What to convert" />
          </Field>
          <Field label="Width and height" group>
            <Seg value={size} options={SIZES} onChange={(v) => setSize(v as Size)} label="Width and height" />
          </Field>
          <Field label="Accessible title (role=“img” + <title>)">
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="none" maxLength={120} />
          </Field>
          <div className="jx-checks">
            <Check checked={spread} onChange={setSpread}>Spread {'{...props}'} on the {'<svg>'}</Check>
            <Check checked={wrap} onChange={setWrap}>Wrap in {'<ScrollDraw>'} to draw on scroll</Check>
          </div>
        </div>

        {wrap && (
          <div className="jx-controls jx-wrap" role="group" aria-label="ScrollDraw options">
            <Field label="easing">
              <select value={w.easing} onChange={(e) => setWrapOpt('easing', e.target.value)}>
                {EASING_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </Field>
            <Field label={`stagger · ${w.stagger.toFixed(2)}`}>
              <input type="range" min={0} max={0.5} step={0.05} value={w.stagger} onChange={(e) => setWrapOpt('stagger', Number(e.target.value))} />
            </Field>
            <Field label="done when (trigger.end)">
              <select value={w.end} onChange={(e) => setWrapOpt('end', e.target.value)}>
                {ENDS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </Field>
            <div className="jx-checks">
              <Check checked={w.once} onChange={(v) => setWrapOpt('once', v)}>once: stays drawn</Check>
              <Check checked={w.fillFade} onChange={(v) => setWrapOpt('fillFade', v)}>fill fades in</Check>
            </div>
          </div>
        )}

        <div className="jx-stage-k">
          <span>{wrap ? 'Preview · scroll the box' : 'Preview'} · drawing elements only</span>
          <Check checked={invert} onChange={setInvert}>invert backdrop</Check>
        </div>
        <div className={`jx-stage${wrap ? ' is-scroll' : ''}${invert ? ' is-invert' : ''}`}>
          <div
            ref={box}
            className="jx-scroller"
            onScroll={wrap ? onBoxScroll : undefined}
            tabIndex={wrap ? 0 : undefined}
            role={wrap ? 'region' : undefined}
            aria-label={wrap ? 'Preview: scroll this box to draw' : undefined}
          >
            <div className="jx-pad" aria-hidden="true">scroll ↓</div>
            <div ref={host} className="jx-host" />
            <div className="jx-pad" aria-hidden="true" />
          </div>
        </div>
        {wrap && (
          <div className="jx-transport">
            <label className="jx-scrub">
              <span>scroll · <span ref={scrollOut}>0.00</span> · progress <span ref={drawnOut}>0.00</span></span>
              <input ref={slider} type="range" min={0} max={1} step={0.01} defaultValue={0} onChange={(e) => onSlide(Number(e.target.value))} aria-label="Scroll position" />
            </label>
          </div>
        )}
        {ok && (ok.previewNote || notPreviewed.length > 0 || (wrap && reduced)) && (
          <ul className="jx-notes">
            {ok.previewNote && <li>{ok.previewNote}</li>}
            {notPreviewed.length > 0 && <li>The preview draws shapes only. The code also keeps {listOf(notPreviewed)}.</li>}
            {wrap && reduced && <li>Reduced motion is on, so ScrollDraw shows the drawing whole, as it will for visitors who have it on.</li>}
          </ul>
        )}
      </div>

      {code && (
        <div className="jx-out">
          {warnings.length > 0 && (
            <ul className="jx-warn" role="status">
              {warnings.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          )}
          <CodeBox file={`${component}.${ts ? 'tsx' : 'jsx'}`}>{code.code}</CodeBox>
          <p className="jx-use">
            Use it as <code>{`<${component}${spread ? ' className="icon"' : ''} />`}</code>
            {spread ? ': className, width, aria-label and any other prop you pass land on the <svg>.' : '.'}
            {wrap ? ' No “use client” needed: svg-scroll-draw/react ships with one, so a Server Component can render this file.' : ''}
          </p>

          <div className="jx-scroll" tabIndex={0} role="region" aria-label="What changed">
            <table className="jx-table">
              <caption className="jx-cap">{code.changes.length} kinds of change</caption>
              <thead><tr><th>In the SVG</th><th>In the JSX</th><th>×</th><th>Why</th></tr></thead>
              <tbody>
                {code.changes.map((c) => (
                  <tr key={`${c.from}|${c.to}`} className={c.to === 'removed' || c.to === 'left out' ? 'is-out' : undefined}>
                    <td>{c.from}</td>
                    <td>{c.to}</td>
                    <td data-k="×">{c.n}</td>
                    <td className="jx-why">{c.why[0].toUpperCase() + c.why.slice(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, group, children }: { label: string; group?: boolean; children: ReactNode }) {
  // A segmented control is a group of buttons, not one input a label can name.
  if (group) {
    return (
      <div className="jx-field">
        <span>{label}</span>
        {children}
      </div>
    );
  }
  return (
    <label className="jx-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Seg({ value, options, onChange, label }: { value: string; options: readonly (readonly [string, string])[]; onChange: (v: string) => void; label: string }) {
  return (
    <span className="jx-seg" role="radiogroup" aria-label={label}>
      {options.map(([v, l]) => (
        <button key={v} type="button" role="radio" aria-checked={value === v} onClick={() => onChange(v)}>{l}</button>
      ))}
    </span>
  );
}

function Check({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <label className="jx-check">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{children}</span>
    </label>
  );
}
