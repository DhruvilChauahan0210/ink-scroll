'use client';

import {
  useEffect, useMemo, useReducer, useRef, useState, useSyncExternalStore,
  type KeyboardEvent, type PointerEvent, type ReactNode,
} from 'react';
import { CodeBox } from '@/components/site/CodeBox';
import { CopyButton } from '@/components/CopyButton';
import { ToolExport } from '@/components/tool-kit/ToolExport';
import { sanitizeSvg } from '@/lib/svg-sanitize';
import {
  ARG_NAMES, COMMAND_LETTERS, COMMAND_NAMES, arcCenter, arcPoint, bounds, convertAll, geometry, insertSeg, isLower,
  movePoint, newSeg, num, parsePath, placesOf, readNumber, removeSeg, reversePath, roundPath, roundTo, segmentD,
  setValue, skeleton, toggleCase, transformPath, upper, writeD,
  type Box, type Geo, type Handle, type ParseError, type Pt, type Seg, type Upper,
} from './path-data';
import { DEFAULT_SAMPLE, SAMPLES } from './samples';
import { htmlPage, jsCode, jsMarkup, reactCode, reactProject, svgFile, type Settings } from './code';
import { DrawPreview } from './DrawPreview';
import { measureLength } from './measure';

/**
 * The SVG path editor.
 *
 * - The path is kept as the numbers written (path-data.ts), with an undo
 *   history of whole paths. Every edit goes through one reducer action.
 * - What the canvas draws is the d string this page wrote, in the browser's
 *   own <path>; the points and handles are worked out from the same numbers.
 * - A pasted SVG goes through sanitizeSvg before any of it is read; only the
 *   d values of its paths are taken.
 * - The drawing preview is scrollDraw itself, moved with seek() (DrawPreview).
 */

// ── History ──────────────────────────────────────────────────────────────────

type History = { past: Seg[][]; doc: Seg[]; future: Seg[][]; key: string | null; at: number };
type Action =
  | { type: 'edit'; next: Seg[]; key?: string; at: number }
  | { type: 'undo' }
  | { type: 'redo' };

const MAX_HISTORY = 200;
/** When an edit happens, for merging a run of them into one undo step. Only ever called from event handlers. */
const stamp = () => Date.now();

/**
 * An edit with the same key as the last one, a drag or a run of key presses
 * or typing within a second, replaces it instead of adding a step.
 */
function reducer(s: History, a: Action): History {
  if (a.type === 'undo') {
    if (!s.past.length) return s;
    return { past: s.past.slice(0, -1), doc: s.past[s.past.length - 1], future: [s.doc, ...s.future], key: null, at: 0 };
  }
  if (a.type === 'redo') {
    if (!s.future.length) return s;
    return { past: [...s.past, s.doc], doc: s.future[0], future: s.future.slice(1), key: null, at: 0 };
  }
  if (a.next === s.doc || writeD(a.next) === writeD(s.doc)) return s.key === a.key ? { ...s, at: a.at } : s;
  const merge = a.key != null && a.key === s.key && (a.key.startsWith('drag:') || a.at - s.at < 1000);
  return {
    past: merge ? s.past : [...s.past, s.doc].slice(-MAX_HISTORY),
    doc: a.next,
    future: [],
    key: a.key ?? null,
    at: a.at,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const RM = '(prefers-reduced-motion: reduce)';
const subscribeReduced = (cb: () => void) => {
  const mq = window.matchMedia(RM);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
};
const getReduced = () => window.matchMedia(RM).matches;
const subscribeNever = () => () => {};

/** A number for a readout: at most `p` decimals, no trailing zeros. */
const fx = (n: number, p = 2) => num(roundTo(n, p));

/** A step of 1, 2 or 5 × 10ⁿ that splits `size` into about `parts`. */
function niceStep(size: number, parts: number): number {
  const raw = size / parts;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const m = raw / pow;
  return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * pow;
}

/** The view that fits every point and handle of the path, with a margin. */
function fitFrame(geo: Geo[]): Box {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const take = (p: Pt) => {
    x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]);
    x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]);
  };
  for (const g of geo) {
    take(g.end);
    if (g.c1) take(g.c1);
    if (g.c2) take(g.c2);
  }
  const b = bounds(geo);
  if (b) { take([b.x, b.y]); take([b.x + b.w, b.y + b.h]); }
  if (x0 === Infinity) return { x: 0, y: 0, w: 100, h: 100 };
  const size = Math.max(x1 - x0, y1 - y0, 1);
  const pad = size * 0.12;
  return { x: x0 - pad, y: y0 - pad, w: x1 - x0 + pad * 2, h: y1 - y0 + pad * 2 };
}

/** Where a handle is, in path units. */
function handleAt(g: Geo, h: Handle): Pt | null {
  if (h === 'end') return g.type === 'Z' ? null : g.end;
  if (h === 'c1') return g.c1 && !g.implicit ? g.c1 : null;
  return g.c2 ?? null;
}

type HandleRef = { i: number; h: Handle };
const handleKey = (r: HandleRef) => `${r.i}:${r.h}`;

/** Every handle the canvas shows, in path order: each segment's controls, then its end. */
function handlesOf(geo: Geo[]): HandleRef[] {
  const out: HandleRef[] = [];
  geo.forEach((g, i) => {
    if (g.c1 && !g.implicit) out.push({ i, h: 'c1' });
    if (g.c2) out.push({ i, h: 'c2' });
    if (g.type !== 'Z') out.push({ i, h: 'end' });
  });
  return out;
}

const HANDLE_NAME: Record<Handle, string> = { end: 'end point', c1: 'first control point', c2: 'second control point' };

type PasteRead = { error: string | null; paths: { d: string; label: string }[]; notes: string[] };

/** A pasted d value or SVG: the d of every path in it, read through sanitizeSvg. */
function readPaste(text: string): PasteRead {
  const t = text.trim();
  if (!t) return { error: 'Paste an SVG, or a path’s d value.', paths: [], notes: [] };
  if (!t.includes('<')) {
    const d = t.replace(/^d\s*=\s*["']?/, '').replace(/["']\s*\/?>?\s*$/, '');
    return { error: null, paths: [{ d, label: 'd value' }], notes: [] };
  }
  const s = sanitizeSvg(t);
  if (!s.ok) return { error: s.error, paths: [], notes: [] };
  const els = Array.from(s.svg.querySelectorAll('path')).filter((p) => (p.getAttribute('d') ?? '').trim());
  const notes: string[] = [];
  const shapes = s.svg.querySelectorAll('rect, circle, ellipse, line, polyline, polygon').length;
  if (shapes) notes.push(`${shapes} shape${shapes > 1 ? 's are' : ' is'} not a path (rect, circle and so on). The SVG shape to path converter turns them into paths.`);
  const dropped = Object.keys(s.removed).filter((k) => k.startsWith('<'));
  if (dropped.length) notes.push(`Left out, as nothing here runs or loads: ${dropped.join(', ')}.`);
  const paths = els.map((p, k) => {
    let el: Element | null = p;
    let moved = false;
    while (el) {
      if (el.hasAttribute('transform')) moved = true;
      el = el.parentElement;
    }
    const d = p.getAttribute('d') ?? '';
    const r = parsePath(d);
    return { d, label: `Path ${k + 1} · ${r.segs.length} commands${moved ? ' · has a transform, left out' : ''}${r.error ? ' · has an error' : ''}` };
  });
  if (!paths.length) return { error: 'No <path> with a d value in that SVG.', paths, notes };
  return { error: null, paths, notes };
}

/** The text around an error, with the character marked. */
function around(d: string, at: number): { before: string; ch: string; after: string } {
  const from = Math.max(0, at - 24);
  return {
    before: (from > 0 ? '…' : '') + d.slice(from, at),
    ch: at < d.length ? d[at] : '␄',
    after: d.slice(at + 1, at + 20) + (at + 20 < d.length ? '…' : ''),
  };
}

const isNumberText = (t: string) => {
  const s = t.trim();
  const r = readNumber(s, 0);
  return r && r.end === s.length ? r.value : null;
};

type Tab = 'svg' | 'js' | 'react';
const TABS: readonly [Tab, string][] = [['svg', 'SVG'], ['js', 'JavaScript'], ['react', 'React']];
const DECIMALS = [0, 1, 2, 3] as const;
let dragSeq = 0;

// ── The editor ───────────────────────────────────────────────────────────────

export function PathEditor({ version }: { version: string }) {
  const [hist, dispatch] = useReducer(reducer, null, () => ({
    past: [], doc: parsePath(DEFAULT_SAMPLE.d).segs, future: [], key: null, at: 0,
  }));
  const doc = hist.doc;
  /** What the visitor is typing in the d field, until it is left. */
  const [draft, setDraft] = useState<string | null>(null);
  const [compact, setCompact] = useState(false);
  const [sel, setSel] = useState<HandleRef | null>({ i: 1, h: 'end' });
  const [frame, setFrame] = useState<Box>(() => fitFrame(geometry(parsePath(DEFAULT_SAMPLE.d).segs)));
  const [sample, setSample] = useState<string | null>(DEFAULT_SAMPLE.key);
  const [pasteText, setPasteText] = useState('');
  const [pasted, setPasted] = useState<PasteRead | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [places, setPlaces] = useState<number>(1);
  const [dx, setDx] = useState('10');
  const [dy, setDy] = useState('0');
  const [sx, setSx] = useState('2');
  const [sy, setSy] = useState('2');
  const [lock, setLock] = useState(true);
  const [origin, setOrigin] = useState<'zero' | 'centre'>('centre');
  const [showBox, setShowBox] = useState(true);
  const [showHandles, setShowHandles] = useState(true);
  const [addType, setAddType] = useState<Upper>('L');
  const [tab, setTab] = useState<Tab>('js');
  const [strokeSet, setStrokeSet] = useState<number | null>(null);
  const [round, setRound] = useState(true);
  const [fade, setFade] = useState(false);
  const [once, setOnce] = useState(false);
  const [canvasPx, setCanvasPx] = useState<[number, number]>([600, 420]);
  /** Where the path as it was opened reads differently in Firefox (the d written here does not). */
  const [loadNotes, setLoadNotes] = useState<ParseError[]>([]);
  const mounted = useSyncExternalStore(subscribeNever, () => true, () => false);
  const reduced = useSyncExternalStore(subscribeReduced, getReduced, () => false);

  const svgRef = useRef<SVGSVGElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const handleEls = useRef(new Map<string, SVGCircleElement>());
  const focusNext = useRef<string | null>(null);
  const drag = useRef<{ id: number; key: string; i: number; h: Handle; off: Pt; start: Seg[]; places: number } | null>(null);

  // ── What is shown ──────────────────────────────────────────────────────────
  const draftRead = useMemo(() => (draft === null ? null : parsePath(draft)), [draft]);
  const locked = !!draftRead?.error;
  const shown = locked && draftRead ? draftRead.segs : doc;
  const geo = useMemo(() => geometry(shown), [shown]);
  const box = useMemo(() => bounds(geo), [geo]);
  const dOut = useMemo(() => writeD(doc, compact), [doc, compact]);
  const dShown = useMemo(() => writeD(shown), [shown]);
  const length = useMemo(() => (mounted ? measureLength(dShown) : null), [mounted, dShown]);
  const handles = useMemo(() => handlesOf(geo), [geo]);
  const selOk = sel && sel.i < geo.length && handleAt(geo[sel.i], sel.h) ? sel : null;
  const selSeg = sel && sel.i < geo.length ? sel.i : null;

  // Units per screen pixel: the viewBox is fitted inside the canvas (meet).
  const upp = Math.max(frame.w / Math.max(1, canvasPx[0]), frame.h / Math.max(1, canvasPx[1]));
  const snapPlaces = Math.min(4, Math.max(0, -Math.floor(Math.log10(upp))));
  const size = box ? Math.max(box.w, box.h) : 100;
  const autoStroke = size <= 48 ? 2 : Math.max(1, Math.round(size / 80));
  const strokeWidth = strokeSet ?? autoStroke;

  // The canvas's size in pixels, for the handles' size and the snap.
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setCanvasPx([e.contentRect.width, e.contentRect.height]));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // A touch that starts on a handle drags it instead of scrolling the page.
  // touch-action on the handle would say so, but Chromium does not apply
  // touch-action to SVG shapes, so the touch is stopped here; a touch on the
  // canvas around the handles still scrolls the page.
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const stop = (e: TouchEvent) => {
      if ((e.target as Element).closest?.('.ped-hit')) e.preventDefault();
    };
    el.addEventListener('touchstart', stop, { passive: false });
    return () => el.removeEventListener('touchstart', stop);
  }, []);

  // A handle chosen with [ or ] takes the focus once it has rendered.
  useEffect(() => {
    if (!focusNext.current) return;
    handleEls.current.get(focusNext.current)?.focus();
    focusNext.current = null;
  }, [sel]);

  // Keep the selected row in view in the command list, without moving the page.
  // Not while the list has the focus: a row chosen there is in view already, and
  // scrolling under a press would move the button away before the click lands.
  useEffect(() => {
    const list = listRef.current;
    if (!list || selSeg === null || list.contains(document.activeElement)) return;
    const row = list.children[selSeg] as HTMLElement | undefined;
    if (!row) return;
    const top = row.offsetTop - list.offsetTop;
    if (top < list.scrollTop) list.scrollTop = top;
    else if (top + row.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTop = top + row.offsetHeight - list.clientHeight;
  }, [selSeg]);

  // ── Edits ──────────────────────────────────────────────────────────────────
  function edit(next: Seg[], key?: string) {
    dispatch({ type: 'edit', next, key, at: stamp() });
    setSample(null);
  }
  function load(d: string, key: string | null) {
    const r = parsePath(d);
    setSample(key);
    setLoadNotes(r.error ? [] : r.notes);
    if (r.error) {
      // Shown as typed, with the error, until it is fixed.
      setDraft(d);
      return;
    }
    dispatch({ type: 'edit', next: r.segs, at: stamp() });
    setDraft(null);
    setSel(r.segs.length > 1 ? { i: 1, h: 'end' } : r.segs.length ? { i: 0, h: 'end' } : null);
    setFrame(fitFrame(geometry(r.segs)));
  }
  function refit(next: Seg[]) {
    setFrame(fitFrame(geometry(next)));
  }
  function undo() {
    setDraft(null);
    // A d that does not read yet was never applied: undo just drops it.
    if (locked) return;
    dispatch({ type: 'undo' });
  }
  function redo() {
    setDraft(null);
    dispatch({ type: 'redo' });
  }
  function onText(t: string) {
    setDraft(t);
    const r = parsePath(t);
    if (!r.error) {
      dispatch({ type: 'edit', next: r.segs, key: 'text', at: stamp() });
      setSample(null);
    }
  }
  function op(next: Seg[], fit = true) {
    edit(next);
    if (fit) refit(next);
  }

  // ── Dragging and nudging ───────────────────────────────────────────────────
  function toUser(e: PointerEvent): Pt | null {
    const svg = svgRef.current;
    const m = svg?.getScreenCTM();
    if (!m) return null;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    return [p.x, p.y];
  }
  function onDown(e: PointerEvent<SVGCircleElement>, r: HandleRef) {
    if (locked || e.button > 0) return;
    const at = handleAt(geo[r.i], r.h);
    const p = toUser(e);
    if (!at || !p) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    e.currentTarget.focus({ preventScroll: true });
    drag.current = {
      id: e.pointerId,
      key: `drag:${++dragSeq}`,
      i: r.i,
      h: r.h,
      off: [p[0] - at[0], p[1] - at[1]],
      start: doc,
      places: Math.max(placesOf(doc), snapPlaces),
    };
    setSel(r);
  }
  function onMove(e: PointerEvent<SVGCircleElement>) {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const p = toUser(e);
    if (!p) return;
    const q: Pt = [roundTo(p[0] - d.off[0], snapPlaces), roundTo(p[1] - d.off[1], snapPlaces)];
    edit(movePoint(d.start, d.i, d.h, q, d.places), d.key);
  }
  function onUp(e: PointerEvent<SVGCircleElement>) {
    if (drag.current?.id === e.pointerId) drag.current = null;
  }
  function onHandleKey(e: KeyboardEvent<SVGCircleElement>, r: HandleRef) {
    if (locked) return;
    const k = e.key;
    if (k === '[' || k === ']') {
      e.preventDefault();
      const at = handles.findIndex((x) => x.i === r.i && x.h === r.h);
      const next = handles[(at + (k === ']' ? 1 : -1) + handles.length) % handles.length];
      if (next) {
        focusNext.current = handleKey(next);
        setSel(next);
      }
      return;
    }
    const dirs: Record<string, Pt> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    const dir = dirs[k];
    if (!dir) return;
    e.preventDefault();
    const step = e.shiftKey ? 10 : e.altKey ? 0.1 : 1;
    const at = handleAt(geo[r.i], r.h);
    if (!at) return;
    const q: Pt = [roundTo(at[0] + dir[0] * step, 10), roundTo(at[1] + dir[1] * step, 10)];
    edit(movePoint(doc, r.i, r.h, q, Math.max(placesOf(doc), e.altKey ? 1 : 0)), `nudge:${handleKey(r)}`);
    setSel(r);
  }
  function onRootKey(e: KeyboardEvent<HTMLDivElement>) {
    const t = e.target as HTMLElement;
    if (t.closest('input, textarea, select')) return;
    if ((e.metaKey || e.ctrlKey) && (e.key === 'z' || e.key === 'Z' || e.key === 'y')) {
      e.preventDefault();
      if (e.key === 'y' || e.shiftKey) redo();
      else undo();
    }
  }

  // ── Whole-path operations ──────────────────────────────────────────────────
  const n = (t: string) => isNumberText(t);
  const moveOk = n(dx) !== null && n(dy) !== null;
  const scaleOk = n(sx) !== null && n(sy) !== null && n(sx) !== 0 && n(sy) !== 0;
  // The box's centre, to one decimal more than the path has, so scaled numbers stay short.
  const cp = placesOf(doc) + 1;
  const centre: Pt = box ? [roundTo(box.x + box.w / 2, cp), roundTo(box.y + box.h / 2, cp)] : [0, 0];
  function scale(fx0: number, fy0: number) {
    op(transformPath(doc, fx0, fy0, 0, 0, origin === 'centre' ? centre : [0, 0]));
  }
  function flip(axis: 'x' | 'y') {
    // About the box's centre, so the drawing stays where it is.
    op(transformPath(doc, axis === 'x' ? -1 : 1, axis === 'y' ? -1 : 1, 0, 0, centre), false);
  }
  function addSeg() {
    const after = selSeg ?? doc.length - 1;
    const type: Upper = doc.length === 0 ? 'M' : addType;
    const rel = after >= 0 && doc[after] ? isLower(doc[after].c) : false;
    const u = niceStep(size, 8);
    const seg = newSeg(doc, after, type, rel, u);
    edit(insertSeg(doc, after, seg));
    setSel({ i: after + 1, h: 'end' });
  }
  const canDelete = (i: number) => !(i === 0 && doc.length > 1 && upper(doc[1].c) !== 'M');

  // ── Output ─────────────────────────────────────────────────────────────────
  const viewBox = useMemo(() => {
    if (!box) return '0 0 100 100';
    const pad = strokeWidth;
    const p = Math.min(2, placesOf(doc));
    const k = 10 ** p;
    const x = Math.floor((box.x - pad) * k) / k;
    const y = Math.floor((box.y - pad) * k) / k;
    const w = Math.ceil((box.x + box.w + pad - x) * k) / k;
    const h = Math.ceil((box.y + box.h + pad - y) * k) / k;
    return [x, y, w, h].map(num).join(' ');
  }, [box, strokeWidth, doc]);

  const code = useMemo(() => {
    const s: Settings = { d: dOut, viewBox, strokeWidth, round, fade, once };
    const tabs: Record<Tab, [string, string][]> = {
      svg: [['drawing.svg', svgFile(s)]],
      js: [['index.html', jsMarkup(s)], ['main.js', jsCode(s)]],
      react: [['Drawing.jsx', reactCode(s)]],
    };
    return { tabs, html: htmlPage(s, version), react: reactProject(s, version) };
  }, [dOut, viewBox, strokeWidth, round, fade, once, version]);

  // ── Canvas pieces ──────────────────────────────────────────────────────────
  const r = 4.5 * upp;
  const hit = 13 * upp;
  const grid = useMemo(() => {
    const step = niceStep(Math.max(frame.w, frame.h), 10);
    const xs: number[] = [];
    const ys: number[] = [];
    // The visible area is wider or taller than the frame where the canvas is.
    const vw = Math.max(frame.w, frame.h * (canvasPx[0] / Math.max(1, canvasPx[1])));
    const vh = Math.max(frame.h, frame.w * (canvasPx[1] / Math.max(1, canvasPx[0])));
    const cx = frame.x + frame.w / 2;
    const cy = frame.y + frame.h / 2;
    for (let x = Math.ceil((cx - vw / 2) / step) * step; x <= cx + vw / 2 && xs.length < 80; x += step) xs.push(x);
    for (let y = Math.ceil((cy - vh / 2) / step) * step; y <= cy + vh / 2 && ys.length < 80; y += step) ys.push(y);
    return { step, xs, ys, x0: cx - vw / 2, x1: cx + vw / 2, y0: cy - vh / 2, y1: cy + vh / 2 };
  }, [frame, canvasPx]);

  const selGeo = selSeg !== null ? geo[selSeg] : null;
  const selArc = selGeo?.type === 'A' && selGeo.arc ? arcCenter(selGeo.start, selGeo.end, selGeo.arc) : null;
  const selPt = selOk ? handleAt(geo[selOk.i], selOk.h) : null;
  const first = geo.find((g) => g.type !== 'M') ? geo[0] : null;
  const tabStop = selOk ? handleKey(selOk) : handles[0] ? handleKey(handles[0]) : null;

  const vb = `${frame.x} ${frame.y} ${frame.w} ${frame.h}`;
  const subpaths = geo.filter((g) => g.type === 'M').length;
  const last = geo.length ? geo[geo.length - 1].end : null;
  const err = draftRead?.error ?? null;
  const ctx = err && draft !== null ? around(draft, err.at) : null;

  // ── Messages ───────────────────────────────────────────────────────────────
  const msgs: { k: string; text: ReactNode }[] = [];
  if (draftRead) {
    for (const nt of draftRead.notes) msgs.push({ k: 'Browsers', text: `At character ${nt.at + 1}: ${nt.message}` });
  } else {
    for (const nt of loadNotes) {
      msgs.push({ k: 'Browsers', text: `The path as opened, at character ${nt.at + 1}: ${nt.message} The d written here has no such comma.` });
    }
  }
  if (pasted) for (const nt of pasted.notes) msgs.push({ k: 'Paste', text: nt });
  if (reduced) {
    msgs.push({
      k: 'Reduced motion',
      text: 'Your system asks for reduced motion, so on a real page scrollDraw draws the path whole at once and seek() does nothing. Here the preview sets the dash itself, so you can still step through it.',
    });
  }

  return (
    // Focusable by click (not by Tab), so Ctrl+Z works after clicking anywhere in the editor.
    <div className="ped" tabIndex={-1} onKeyDown={onRootKey}>
      <div className="ped-panel">
        {/* ── Open ── */}
        <div className="ped-open">
          <div className="ped-field">
            <span className="ped-k">Start from</span>
            <div className="ped-chips" role="group" aria-label="Sample paths">
              {SAMPLES.map((s) => (
                <button key={s.key} type="button" className="ped-chip" aria-pressed={sample === s.key} onClick={() => load(s.d, s.key)}>
                  <svg viewBox={vbOf(s.d)} aria-hidden="true">
                    <path d={s.d} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
                  </svg>
                  <span>{s.name}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="ped-field ped-paste">
            <label htmlFor="ped-paste" className="ped-k">Or paste an SVG, or a d value</label>
            <textarea
              id="ped-paste"
              rows={3}
              spellCheck={false}
              value={pasteText}
              placeholder={'<svg …><path d="M…"/></svg>'}
              onChange={(e) => setPasteText(e.target.value)}
            />
            <div className="ped-row-btns">
              <button
                type="button"
                className="ped-btn"
                onClick={() => {
                  const r0 = readPaste(pasteText);
                  setPasted(r0);
                  setPicked(null);
                  if (!r0.error && r0.paths.length === 1) {
                    setPicked(0);
                    load(r0.paths[0].d, null);
                  }
                }}
              >
                Open it
              </button>
            </div>
            {pasted?.error ? <p className="ped-err" role="status">{pasted.error}</p> : null}
            {pasted && !pasted.error && pasted.paths.length > 1 ? (
              <div className="ped-picks" role="group" aria-label="Paths in the pasted SVG">
                {pasted.paths.map((p, k) => (
                  <button
                    key={k}
                    type="button"
                    className="ped-pick"
                    aria-pressed={picked === k}
                    onClick={() => {
                      setPicked(k);
                      load(p.d, null);
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {/* ── The d string ── */}
        <div className="ped-dfield">
          <div className="ped-dhead">
            <label htmlFor="ped-d" className="ped-k">Path data · d · {draft !== null ? 'as typed' : compact ? 'compact' : 'one letter per command'}</label>
            <span className="ped-dcopy"><CopyButton text={draft ?? dOut} /></span>
          </div>
          <textarea
            id="ped-d"
            className={err ? 'is-error' : undefined}
            rows={3}
            spellCheck={false}
            value={draft ?? dOut}
            aria-invalid={err ? true : undefined}
            aria-describedby={err ? 'ped-d-err' : undefined}
            onChange={(e) => onText(e.target.value)}
            onBlur={() => { if (draftRead && !draftRead.error) setDraft(null); }}
          />
          {err && ctx ? (
            <div id="ped-d-err" className="ped-err" role="status">
              <p>
                Stopped at character {err.at + 1}: {err.message}{' '}
                {draftRead && draftRead.segs.length ? `The browser draws the ${draftRead.segs.length} command${draftRead.segs.length > 1 ? 's' : ''} before it, as the canvas shows; editing waits until it reads.` : ''}
              </p>
              <code className="ped-around">
                {ctx.before}<mark>{ctx.ch}</mark>{ctx.after}
              </code>
            </div>
          ) : null}
        </div>

        {/* ── Canvas and commands ── */}
        <div className="ped-work">
          <div className="ped-stage">
            <div className="ped-canvas-wrap">
              <svg
                ref={svgRef}
                className={`ped-canvas${locked ? ' is-locked' : ''}`}
                viewBox={vb}
                role="group"
                aria-label={`The path, ${geo.length} commands, with ${handles.length} points and handles to move. Tab to the selected point; arrow keys move it, Shift for 10, Alt for 0.1; [ and ] step to the previous or next point.`}
              >
                <g className="ped-grid" aria-hidden="true">
                  {grid.xs.map((x) => <line key={`x${x}`} x1={x} x2={x} y1={grid.y0} y2={grid.y1} className={Math.abs(x) < grid.step / 1e6 ? 'is-axis' : undefined} />)}
                  {grid.ys.map((y) => <line key={`y${y}`} y1={y} y2={y} x1={grid.x0} x2={grid.x1} className={Math.abs(y) < grid.step / 1e6 ? 'is-axis' : undefined} />)}
                </g>
                {showBox && box ? (
                  <rect className="ped-bbox" x={box.x} y={box.y} width={box.w} height={box.h} aria-hidden="true" />
                ) : null}
                {selArc ? (
                  <g className="ped-ellipse" aria-hidden="true">
                    <ellipse
                      cx={selArc.cx}
                      cy={selArc.cy}
                      rx={selArc.rx}
                      ry={selArc.ry}
                      transform={`rotate(${(selArc.phi * 180) / Math.PI} ${selArc.cx} ${selArc.cy})`}
                    />
                    <line x1={selArc.cx} y1={selArc.cy} x2={arcPoint(selArc, 0)[0]} y2={arcPoint(selArc, 0)[1]} />
                    <line x1={selArc.cx} y1={selArc.cy} x2={arcPoint(selArc, Math.PI / 2)[0]} y2={arcPoint(selArc, Math.PI / 2)[1]} />
                    <circle cx={selArc.cx} cy={selArc.cy} r={r * 0.6} />
                  </g>
                ) : null}
                <path className="ped-path" d={dShown} aria-hidden="true" />
                {selGeo && selGeo.type !== 'M' ? <path className="ped-sel" d={segmentD(selGeo)} aria-hidden="true" /> : null}
                {showHandles && !locked ? (
                  <g aria-hidden="true">
                    {geo.map((g, i) => (
                      <g key={`l${i}`} className="ped-arm">
                        {g.c1 ? <line x1={g.start[0]} y1={g.start[1]} x2={g.c1[0]} y2={g.c1[1]} className={g.implicit ? 'is-implied' : undefined} /> : null}
                        {g.c2 ? <line x1={g.c2[0]} y1={g.c2[1]} x2={g.end[0]} y2={g.end[1]} /> : null}
                        {(g.type === 'Q' || g.type === 'T') && g.c1 ? <line x1={g.c1[0]} y1={g.c1[1]} x2={g.end[0]} y2={g.end[1]} className={g.implicit ? 'is-implied' : undefined} /> : null}
                        {g.implicit && g.c1 ? <circle cx={g.c1[0]} cy={g.c1[1]} r={r * 0.8} className="ped-implied" /> : null}
                      </g>
                    ))}
                  </g>
                ) : null}
                {first ? (
                  <g className="ped-start" aria-hidden="true">
                    <circle cx={first.end[0]} cy={first.end[1]} r={r * 2.1} />
                    <text x={first.end[0]} y={first.end[1] + r * 2.1 + 13 * upp} fontSize={11 * upp} textAnchor="middle">start</text>
                  </g>
                ) : null}
                {!locked
                  ? handles.map((hr) => {
                      const g = geo[hr.i];
                      const at = handleAt(g, hr.h)!;
                      const isSel = selOk?.i === hr.i && selOk.h === hr.h;
                      const key = handleKey(hr);
                      const ctrl = hr.h !== 'end';
                      if (ctrl && !showHandles) return null;
                      return (
                        <g key={key} className={`ped-h${ctrl ? ' is-ctrl' : ''}${isSel ? ' is-sel' : ''}${selSeg === hr.i ? ' in-sel' : ''}`}>
                          {ctrl ? (
                            <rect x={at[0] - r * 0.85} y={at[1] - r * 0.85} width={r * 1.7} height={r * 1.7} className="ped-mark" />
                          ) : (
                            <circle cx={at[0]} cy={at[1]} r={r} className="ped-mark" />
                          )}
                          <circle
                            ref={(el) => {
                              if (el) handleEls.current.set(key, el);
                              else handleEls.current.delete(key);
                            }}
                            className="ped-hit"
                            cx={at[0]}
                            cy={at[1]}
                            r={hit}
                            tabIndex={key === tabStop ? 0 : -1}
                            role="button"
                            aria-label={`Command ${hr.i + 1}, ${shown[hr.i].c}: ${HANDLE_NAME[hr.h]} at ${fx(at[0])}, ${fx(at[1])}`}
                            onPointerDown={(e) => onDown(e, hr)}
                            onPointerMove={onMove}
                            onPointerUp={onUp}
                            onPointerCancel={onUp}
                            onKeyDown={(e) => onHandleKey(e, hr)}
                            onFocus={() => { if (!isSel) setSel(hr); }}
                          />
                        </g>
                      );
                    })
                  : null}
              </svg>
              <p className="ped-scale" aria-hidden="true">grid {fx(grid.step, 4)}</p>
            </div>
            <p className="ped-hint">
              Drag a point (●) or a control (■). Dashed arms are implied by S and T, mirrored from the curve before.
              With a point focused, arrow keys move it: Shift ×10, Alt ×0.1; [ and ] step through the points.
            </p>
          </div>

          <div className="ped-cmds">
            <p className="ped-k">Commands · {shown.length} · {skeleton(shown) || 'none'}</p>
            <ol ref={listRef} className="ped-list" aria-label="Commands">
              {shown.map((s, i) => {
                const U = upper(s.c);
                const lower = isLower(s.c);
                return (
                  <li key={i} className={`ped-cmd${selSeg === i ? ' is-sel' : ''}`} onFocusCapture={() => { if (selSeg !== i) setSel({ i, h: 'end' }); }}>
                    <span className="ped-cmd-n">{i + 1}</span>
                    <button
                      type="button"
                      className="ped-letter"
                      disabled={locked}
                      title={`${COMMAND_NAMES[U]}, ${lower ? 'relative' : 'absolute'}`}
                      aria-label={`${s.c}: ${COMMAND_NAMES[U]}, ${lower ? 'relative' : 'absolute'}. Write it ${lower ? 'absolute' : 'relative'}`}
                      onClick={() => edit(toggleCase(doc, i))}
                    >
                      {s.c}
                    </button>
                    <span className="ped-args">
                      {s.v.map((v, k) =>
                        U === 'A' && (k === 3 || k === 4) ? (
                          <label key={k} className="ped-flag">
                            <input
                              type="checkbox"
                              checked={!!v}
                              disabled={locked}
                              onChange={(e) => edit(setValue(doc, i, k, e.target.checked ? 1 : 0))}
                            />
                            <span>{ARG_NAMES.A[k]}</span>
                          </label>
                        ) : (
                          <NumField
                            key={k}
                            label={ARG_NAMES[U][k]}
                            value={v}
                            disabled={locked}
                            onCommit={(x) => edit(setValue(doc, i, k, x), `field:${i}:${k}`)}
                          />
                        ),
                      )}
                      {U === 'Z' ? <span className="ped-z">back to the subpath’s start</span> : null}
                    </span>
                    <button
                      type="button"
                      className="ped-del"
                      disabled={locked || !canDelete(i)}
                      aria-label={`Delete command ${i + 1}, ${s.c}`}
                      onClick={() => {
                        edit(removeSeg(doc, i));
                        setSel(null);
                      }}
                    >
                      ×
                    </button>
                  </li>
                );
              })}
            </ol>
            <div className="ped-add">
              <label className="ped-field">
                <span className="ped-k">Add {doc.length ? `after ${(selSeg ?? doc.length - 1) + 1}` : 'the first'}</span>
                <select value={doc.length ? addType : 'M'} disabled={locked || !doc.length} onChange={(e) => setAddType(e.target.value as Upper)}>
                  {COMMAND_LETTERS.map((c) => <option key={c} value={c}>{c} · {COMMAND_NAMES[c]}</option>)}
                </select>
              </label>
              <button type="button" className="ped-btn" disabled={locked} onClick={addSeg}>+ Add</button>
            </div>
          </div>
        </div>

        {/* ── Operations ── */}
        <div className="ped-ops">
          <fieldset className="ped-group">
            <legend>History · view</legend>
            <div className="ped-row-btns">
              <button type="button" className="ped-btn" onClick={undo} disabled={!hist.past.length && draft === null}>↶ Undo</button>
              <button type="button" className="ped-btn" onClick={redo} disabled={!hist.future.length}>↷ Redo</button>
              <button type="button" className="ped-btn" onClick={() => refit(shown)}>Fit view</button>
            </div>
            <label className="ped-check"><input type="checkbox" checked={showHandles} onChange={(e) => setShowHandles(e.target.checked)} /> Control handles</label>
            <label className="ped-check"><input type="checkbox" checked={showBox} onChange={(e) => setShowBox(e.target.checked)} /> Bounding box</label>
          </fieldset>

          <fieldset className="ped-group" disabled={locked}>
            <legend>Write as</legend>
            <div className="ped-row-btns">
              <button type="button" className="ped-btn" onClick={() => op(convertAll(doc, false), false)}>Absolute</button>
              <button type="button" className="ped-btn" onClick={() => op(convertAll(doc, true), false)}>Relative</button>
              <button type="button" className="ped-btn" onClick={() => op(reversePath(doc), false)}>⇄ Reverse</button>
            </div>
            <label className="ped-check"><input type="checkbox" checked={compact} onChange={(e) => setCompact(e.target.checked)} /> Compact d (as a minifier writes it)</label>
            <div className="ped-inline">
              <label className="ped-field">
                <span className="ped-k">Decimals</span>
                <select value={places} onChange={(e) => setPlaces(Number(e.target.value))}>
                  {DECIMALS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </label>
              <button type="button" className="ped-btn" onClick={() => op(roundPath(doc, places), false)}>Round</button>
            </div>
          </fieldset>

          <fieldset className="ped-group" disabled={locked}>
            <legend>Move · scale</legend>
            <div className="ped-inline">
              <NumText label="dx" value={dx} onChange={setDx} />
              <NumText label="dy" value={dy} onChange={setDy} />
              <button type="button" className="ped-btn" disabled={!moveOk} onClick={() => op(transformPath(doc, 1, 1, n(dx)!, n(dy)!), true)}>Move</button>
            </div>
            <div className="ped-inline">
              <NumText label="sx" value={sx} onChange={(v) => { setSx(v); if (lock) setSy(v); }} />
              <NumText label="sy" value={sy} onChange={(v) => { setSy(v); if (lock) setSx(v); }} />
              <button type="button" className="ped-btn" disabled={!scaleOk} onClick={() => scale(n(sx)!, n(sy)!)}>Scale</button>
            </div>
            <label className="ped-check"><input type="checkbox" checked={lock} onChange={(e) => { setLock(e.target.checked); if (e.target.checked) setSy(sx); }} /> Same for x and y</label>
            <div className="ped-field">
              <span className="ped-k">Scale about</span>
              <Seg2
                label="Scale about"
                value={origin}
                options={[['centre', 'Box centre'], ['zero', '0, 0']]}
                onChange={(v) => setOrigin(v as 'zero' | 'centre')}
              />
            </div>
            <div className="ped-row-btns">
              <button type="button" className="ped-btn" onClick={() => flip('x')}>Flip ↔</button>
              <button type="button" className="ped-btn" onClick={() => flip('y')}>Flip ↕</button>
            </div>
          </fieldset>
        </div>

        {/* ── Readouts ── */}
        <dl className="ped-read">
          <div><dt>Length</dt><dd>{length === null ? '…' : `${fx(length)} · getTotalLength()`}</dd></div>
          <div>
            <dt>Box</dt>
            <dd>{box ? `x ${fx(box.x)} · y ${fx(box.y)} · ${fx(box.w)} × ${fx(box.h)}` : 'nothing drawn'}</dd>
          </div>
          <div><dt>Subpaths</dt><dd>{subpaths} · {geo.length} commands · {dShown.length} characters</dd></div>
          <div>
            <dt>Ends</dt>
            <dd>{first && last ? `starts ${fx(first.end[0])}, ${fx(first.end[1])} · ends ${fx(last[0])}, ${fx(last[1])}` : '—'}</dd>
          </div>
          <div>
            <dt>Selected</dt>
            <dd>
              {selOk && selPt
                ? `command ${selOk.i + 1} (${shown[selOk.i]?.c}) · ${HANDLE_NAME[selOk.h]} · ${fx(selPt[0], 4)}, ${fx(selPt[1], 4)}`
                : selSeg !== null && shown[selSeg]
                  ? `command ${selSeg + 1} (${shown[selSeg].c})`
                  : 'nothing'}
            </dd>
          </div>
        </dl>

        {msgs.length > 0 ? (
          <ul className="ped-msgs" aria-live="polite">
            {msgs.map((m) => (
              <li key={m.k + String(m.text)}>
                <span className="ped-msg-k">{m.k}</span>
                <span>{m.text}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {/* ── Draw it on scroll ── */}
      <div className="ped-out">
        <div className="ped-out-top">
          <DrawPreview d={dShown} viewBox={viewBox} strokeWidth={strokeWidth} round={round} fade={fade} once={once} reduced={reduced} />
          <fieldset className="ped-group ped-settings">
            <legend>The drawing</legend>
            <label className="ped-field">
              <span className="ped-k">Stroke width{strokeSet === null ? ' · auto' : ''}</span>
              <span className="ped-inline">
                <input
                  type="number"
                  min={0.1}
                  step={0.5}
                  value={strokeWidth}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (e.target.value !== '' && Number.isFinite(v) && v > 0) setStrokeSet(v);
                  }}
                />
                <button type="button" className="ped-btn" aria-pressed={strokeSet === null} onClick={() => setStrokeSet(null)}>Auto</button>
              </span>
            </label>
            <label className="ped-check"><input type="checkbox" checked={round} onChange={(e) => setRound(e.target.checked)} /> Round caps and joins</label>
            <label className="ped-check"><input type="checkbox" checked={fade} onChange={(e) => setFade(e.target.checked)} /> Fade in as it draws (fade)</label>
            <label className="ped-check"><input type="checkbox" checked={once} onChange={(e) => setOnce(e.target.checked)} /> Stay drawn (once)</label>
          </fieldset>
        </div>

        <div className="ped-code">
          <div className="ped-tabs" role="tablist" aria-label="Generated code">
            {TABS.map(([t, label]) => (
              <button
                key={t}
                type="button"
                role="tab"
                id={`ped-tab-${t}`}
                aria-controls="ped-tabpanel"
                aria-selected={tab === t}
                className="ped-tab"
                onClick={() => setTab(t)}
              >
                {label}
              </button>
            ))}
          </div>
          <div role="tabpanel" id="ped-tabpanel" aria-labelledby={`ped-tab-${tab}`} className="ped-tabpanel">
            {code.tabs[tab].map(([file, text]) => <CodeBox key={file} file={file}>{text}</CodeBox>)}
            <p className="ped-hint">
              {tab === 'svg'
                ? 'The path on its own, in an SVG whose viewBox fits it with room for the stroke.'
                : 'Only options that differ from scrollDraw’s defaults are written. Leave fill as none: the drawing is the stroke.'}
            </p>
            <ToolExport title="SVG path drawn on scroll" filename="svg-path.html" html={code.html} react={code.react} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Pieces ───────────────────────────────────────────────────────────────────

/** A sample's own viewBox, for its chip. */
function vbOf(d: string): string {
  const b = bounds(geometry(parsePath(d).segs));
  if (!b) return '0 0 10 10';
  const s = Math.max(b.w, b.h);
  const pad = s * 0.08;
  return `${b.x - pad - (s - b.w) / 2} ${b.y - pad - (s - b.h) / 2} ${s + pad * 2} ${s + pad * 2}`;
}

/** One number of a command: typed as text, applied whenever it reads as a number. */
function NumField({ label, value, disabled, onCommit }: { label: string; value: number; disabled: boolean; onCommit: (n: number) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  const text = draft ?? num(value);
  const ok = draft === null || isNumberText(draft) !== null;
  return (
    <label className="ped-num">
      <span>{label}</span>
      <input
        type="text"
        inputMode="decimal"
        spellCheck={false}
        autoComplete="off"
        value={text}
        disabled={disabled}
        aria-invalid={ok ? undefined : true}
        size={Math.max(3, Math.min(9, text.length + 1))}
        onChange={(e) => {
          setDraft(e.target.value);
          const v = isNumberText(e.target.value);
          if (v !== null) onCommit(v);
        }}
        onBlur={() => setDraft(null)}
      />
    </label>
  );
}

/** A labelled text box for a number an operation takes. */
function NumText({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="ped-num">
      <span>{label}</span>
      <input
        type="text"
        inputMode="decimal"
        spellCheck={false}
        autoComplete="off"
        value={value}
        size={5}
        aria-invalid={isNumberText(value) === null ? true : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function Seg2({ label, value, options, onChange }: { label: string; value: string; options: readonly (readonly [string, string])[]; onChange: (v: string) => void }) {
  return (
    <span className="ped-seg" role="radiogroup" aria-label={label}>
      {options.map(([v, text]) => (
        <button key={v} type="button" role="radio" aria-checked={value === v} onClick={() => onChange(v)}>{text}</button>
      ))}
    </span>
  );
}
