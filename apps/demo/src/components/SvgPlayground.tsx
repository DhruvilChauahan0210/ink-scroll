'use client';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createBounce, createElastic } from 'svg-scroll-draw';
import { CodeBox } from './site/CodeBox';
import { PlaygroundV2Content, V2_EXAMPLE_COUNT } from './PlaygroundV2Content';
import { CropMarks, GroundSwitch, PlayIcon, ResetIcon, fill, pad, type Ground } from './PlaygroundParts';

// ── Types ──────────────────────────────────────────────────────────────────────

type EasingName = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'spring' | 'bounce' | 'elastic';
type ClipDir    = 'left' | 'right' | 'top' | 'bottom' | 'center';
type Tab        = 'motion' | 'visual' | 'effects' | 'code';
type Mode       = 'v1' | 'v2';

interface PlayState {
  svg: string;
  easing: EasingName;
  speed: number;
  fade: boolean;
  stagger: number;
  direction: 'forward' | 'reverse';
  once: boolean;
  colorFrom: string;
  colorTo: string;
  useColor: boolean;
  widthFrom: number;
  widthTo: number;
  useWidth: boolean;
  fillOpacityFrom: number;
  fillOpacityTo: number;
  useFillOpacity: boolean;
  clipDir: ClipDir;
  useClip: boolean;
  morphTo: string;
  useMorphTo: boolean;
  springTension: number;
  springFriction: number;
  bounceBounces: number;
  bounceDecay: number;
  elasticAmplitude: number;
  elasticPeriod: number;
}

type ExamplePreset = {
  label: string;
  tag: string;
  svg: string;
  defaults?: Partial<PlayState>;
};

// ── Examples ───────────────────────────────────────────────────────────────────
// Rules for every SVG: every animated element must have a visible stroke.
// Fill-only elements (dots, labels) must be excluded or given a matching stroke.
// No decorative lines (grid, rules) — they eat stagger slots before the hero shapes.
// Ink is `currentColor`, so it follows the specimen's ground (paper or slate);
// the one accent is the site's red, the pencil its warm grey.

/** The Signature preset's stroke — also the opening figure's specimen. */
export const SIGNATURE_D = 'M 20 160 C 38 70 68 55 88 95 C 103 125 108 55 128 78 C 146 98 138 148 160 118 C 178 93 172 48 196 68 C 214 84 216 128 224 112';

const EXAMPLES: ExamplePreset[] = [
  {
    // 3 concentric circles + 2 crosshair lines — 5 stroked elements, clean stagger reveal
    label: 'Scope',
    tag: 'basics',
    svg: `<svg width="240" height="240" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="120" cy="120" r="100" stroke="currentColor" stroke-width="2.5"/>
  <circle cx="120" cy="120" r="66"  stroke="#d9381e" stroke-width="2"/>
  <circle cx="120" cy="120" r="32"  stroke="#8c877e" stroke-width="2"/>
  <line x1="20"  y1="120" x2="220" y2="120" stroke="currentColor" stroke-width="1.5" stroke-dasharray="6 4" opacity="0.4"/>
  <line x1="120" y1="20"  x2="120" y2="220" stroke="currentColor" stroke-width="1.5" stroke-dasharray="6 4" opacity="0.4"/>
</svg>`,
    defaults: { stagger: 0.12, easing: 'ease-out' },
  },
  {
    // Single flowing signature path — easing makes it feel like a real pen stroke
    label: 'Signature',
    tag: 'easing',
    svg: `<svg width="240" height="240" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="${SIGNATURE_D}" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  <line x1="20" y1="175" x2="224" y2="175" stroke="#8c877e" stroke-width="1.5"/>
</svg>`,
    defaults: { easing: 'ease-in-out', speed: 0.75 },
  },
  {
    // 2 axes + 5 bars — stagger reveals axes first, then each bar in sequence
    label: 'Bar Chart',
    tag: 'stagger',
    svg: `<svg width="240" height="240" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
  <line x1="28" y1="16" x2="28"  y2="200" stroke="currentColor" stroke-width="2"/>
  <line x1="28" y1="200" x2="224" y2="200" stroke="currentColor" stroke-width="2"/>
  <rect x="40"  y="120" width="28" height="80"  stroke="#8c877e" stroke-width="2.5" fill="#8c877e" fill-opacity="0.1"/>
  <rect x="82"  y="76"  width="28" height="124" stroke="currentColor" stroke-width="2.5" fill="currentColor" fill-opacity="0.07"/>
  <rect x="124" y="148" width="28" height="52"  stroke="#8c877e" stroke-width="2.5" fill="#8c877e" fill-opacity="0.1"/>
  <rect x="166" y="56"  width="28" height="144" stroke="#d9381e" stroke-width="2.5" fill="#d9381e" fill-opacity="0.1"/>
  <rect x="208" y="100" width="16" height="100" stroke="currentColor" stroke-width="2"   fill="currentColor" fill-opacity="0.07"/>
</svg>`,
    defaults: { stagger: 0.12, easing: 'ease-out', speed: 1 },
  },
  {
    // Single continuous route path — no decorative dots eating stagger slots
    label: 'Route',
    tag: 'path',
    svg: `<svg width="240" height="240" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M 28 210 C 28 168 52 148 72 128 C 92 108 76 76 108 60 C 132 48 158 70 178 60 C 198 50 208 30 218 18" stroke="#d9381e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="28"  cy="210" r="7" stroke="currentColor" stroke-width="2" fill="#d9381e"/>
  <circle cx="218" cy="18"  r="7" stroke="currentColor" stroke-width="2" fill="currentColor"/>
  <circle cx="72"  cy="128" r="4" stroke="currentColor" stroke-width="1.5" fill="none"/>
  <circle cx="108" cy="60"  r="4" stroke="currentColor" stroke-width="1.5" fill="none"/>
  <circle cx="178" cy="60"  r="4" stroke="currentColor" stroke-width="1.5" fill="none"/>
</svg>`,
    defaults: { easing: 'ease-in-out', speed: 0.8, stagger: 0.04 },
  },
  {
    // 3 orbital ellipses + nucleus — ellipse is in SELECTOR so all 4 elements animate
    label: 'Orbit',
    tag: 'stagger',
    svg: `<svg width="240" height="240" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="120" cy="120" rx="100" ry="36" stroke="currentColor" stroke-width="2.5"/>
  <ellipse cx="120" cy="120" rx="100" ry="36" stroke="#d9381e" stroke-width="2"   transform="rotate(60 120 120)"/>
  <ellipse cx="120" cy="120" rx="100" ry="36" stroke="#8c877e" stroke-width="2"   transform="rotate(-60 120 120)"/>
  <circle  cx="120" cy="120" r="14"            stroke="currentColor" stroke-width="2.5" fill="none"/>
</svg>`,
    defaults: { stagger: 0.18, easing: 'ease-out', speed: 0.85 },
  },
  {
    // Star + inner ring both have fill + stroke — fillOpacity floods them as they draw
    // fill-opacity="0" on SVG attribute so they start invisible; JS overrides via style
    label: 'Emblem',
    tag: 'fillOpacity',
    svg: `<svg width="240" height="240" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M 120 18 L 144 90 L 222 90 L 159 136 L 182 210 L 120 163 L 58 210 L 81 136 L 18 90 L 96 90 Z"
        stroke="#d9381e" stroke-width="2.5" fill="#d9381e" fill-opacity="0"/>
  <circle cx="120" cy="120" r="32" stroke="currentColor" stroke-width="2" fill="#8c877e" fill-opacity="0"/>
</svg>`,
    defaults: { useFillOpacity: true, fillOpacityFrom: 0, fillOpacityTo: 1, stagger: 0.35, easing: 'ease-out' },
  },
  {
    // Circle morphs to sharp diamond — single path, 26 numeric tokens in both source and target
    // No second path so morphTo applies cleanly to the one element
    label: 'Morph',
    tag: 'morphTo',
    svg: `<svg width="240" height="240" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M 120 22 C 172 22 218 68 218 120 C 218 172 172 218 120 218 C 68 218 22 172 22 120 C 22 68 68 22 120 22 Z"
        stroke="currentColor" stroke-width="2.5"/>
</svg>`,
    defaults: {
      useMorphTo: true,
      morphTo: 'M 120 22 C 120 22 218 120 218 120 C 218 120 120 218 120 218 C 120 218 22 120 22 120 C 22 120 120 22 120 22 Z',
      easing: 'ease-in-out',
      speed: 0.8,
    },
  },
  {
    // 3 boxes + 2 connectors + 2 arrowheads — stagger builds the diagram step by step
    label: 'Flowchart',
    tag: 'multi-path',
    svg: `<svg width="240" height="240" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="14"  y="14"  width="72" height="44" rx="6" stroke="currentColor" stroke-width="2"/>
  <rect x="84"  y="98"  width="72" height="44" rx="6" stroke="#d9381e" stroke-width="2"/>
  <rect x="154" y="182" width="72" height="44" rx="6" stroke="#8c877e" stroke-width="2"/>
  <path d="M 50 58 L 50 78 L 120 78 L 120 98"   stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M 120 142 L 120 162 L 190 162 L 190 182" stroke="#d9381e" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M 113 94 L 120 98 L 127 94"  stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/>
  <path d="M 183 178 L 190 182 L 197 178" stroke="#8c877e" stroke-width="1.5" stroke-linecap="round" fill="none"/>
</svg>`,
    defaults: { stagger: 0.1, easing: 'ease-out', speed: 0.9 },
  },
];

// Morph target: same 26 numeric tokens as Morph example source path
const DEFAULT_MORPH = 'M 120 22 C 120 22 218 120 218 120 C 218 120 120 218 120 218 C 120 218 22 120 22 120 C 22 120 120 22 120 22 Z';

const DEFAULT_STATE: PlayState = {
  svg: EXAMPLES[0].svg,
  easing: 'ease-out',
  speed: 1,
  fade: false,
  stagger: 0,
  direction: 'forward',
  once: false,
  colorFrom: '#8c877e',
  colorTo: '#d9381e',
  useColor: false,
  widthFrom: 1,
  widthTo: 4,
  useWidth: false,
  fillOpacityFrom: 0,
  fillOpacityTo: 1,
  useFillOpacity: false,
  clipDir: 'left',
  useClip: false,
  morphTo: DEFAULT_MORPH,
  useMorphTo: false,
  springTension: 2.5,
  springFriction: 2.2,
  bounceBounces: 3,
  bounceDecay: 0.5,
  elasticAmplitude: 1,
  elasticPeriod: 0.4,
};

// ── Helpers ────────────────────────────────────────────────────────────────────

export const EASINGS: Record<EasingName, (t: number) => number> = {
  linear:        t => t,
  'ease-in':     t => t * t,
  'ease-out':    t => t * (2 - t),
  'ease-in-out': t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  spring:        t => 1 - Math.cos(t * Math.PI * 2.5) * Math.pow(1 - t, 2.2),
  bounce:        createBounce(),
  elastic:       createElastic(),
};
const EASING_NAMES = Object.keys(EASINGS) as EasingName[];

const SELECTOR = 'path, polyline, line, polygon, rect, circle, ellipse';

function parseRgb(c: string): [number, number, number] | null {
  const s = /^#([a-f\d])([a-f\d])([a-f\d])$/i.exec(c);
  if (s) return [parseInt(s[1] + s[1], 16), parseInt(s[2] + s[2], 16), parseInt(s[3] + s[3], 16)];
  const f = /^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(c);
  if (f) return [parseInt(f[1], 16), parseInt(f[2], 16), parseInt(f[3], 16)];
  return null;
}

function lerpColor(a: string, b: string, t: number): string {
  const ca = parseRgb(a), cb = parseRgb(b);
  if (!ca || !cb) return a;
  return `rgb(${Math.round(ca[0] + (cb[0] - ca[0]) * t)},${Math.round(ca[1] + (cb[1] - ca[1]) * t)},${Math.round(ca[2] + (cb[2] - ca[2]) * t)})`;
}

function lerpPath(from: string, to: string, t: number): string {
  const fn = from.match(/-?[\d.]+/g)?.map(Number) ?? [];
  const tn = to.match(/-?[\d.]+/g)?.map(Number) ?? [];
  if (fn.length !== tn.length) return from;
  let i = 0;
  return from.replace(/-?[\d.]+/g, () => {
    const v = fn[i] + (tn[i] - fn[i]) * t;
    i++;
    return parseFloat(v.toFixed(3)).toString();
  });
}

function clipPath(dir: ClipDir, alpha: number): string {
  const p = (1 - alpha) * 100;
  switch (dir) {
    case 'left':   return `inset(0 ${p.toFixed(1)}% 0 0)`;
    case 'right':  return `inset(0 0 0 ${p.toFixed(1)}%)`;
    case 'top':    return `inset(0 0 ${p.toFixed(1)}% 0)`;
    case 'bottom': return `inset(${p.toFixed(1)}% 0 0 0)`;
    case 'center': return `circle(${(alpha * 150).toFixed(1)}% at center)`;
  }
}

function getLen(el: SVGElement): number {
  const tag = el.tagName.toLowerCase();
  if (tag === 'rect') { const w = parseFloat(el.getAttribute('width') ?? '0'), h = parseFloat(el.getAttribute('height') ?? '0'); return 2 * (w + h); }
  if (tag === 'circle') { const r = parseFloat(el.getAttribute('r') ?? '0'); return 2 * Math.PI * r; }
  try { return (el as SVGGeometryElement).getTotalLength(); } catch { return 0; }
}

function sanitizeSvg(code: string): string {
  const doc = new DOMParser().parseFromString(code.trim(), 'image/svg+xml');
  if (doc.querySelector('parsererror')) throw new Error('Invalid SVG — check your syntax.');
  const svg = doc.documentElement;
  svg.querySelectorAll('script, foreignObject').forEach(el => el.remove());
  svg.querySelectorAll('*').forEach(el => Array.from(el.attributes).forEach(a => { if (a.name.startsWith('on')) el.removeAttribute(a.name); }));
  svg.setAttribute('width', '100%'); svg.setAttribute('height', '100%');
  if (!svg.hasAttribute('preserveAspectRatio')) svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  return svg.outerHTML;
}

function encodeState(s: PlayState): string { try { return btoa(encodeURIComponent(JSON.stringify(s))); } catch { return ''; } }
function decodeState(str: string): PlayState | null { try { return JSON.parse(decodeURIComponent(atob(str))); } catch { return null; } }

function initElements(container: HTMLDivElement, ps: PlayState) {
  if (ps.useClip) {
    Array.from(container.querySelectorAll<SVGElement>(SELECTOR)).forEach(el => { el.style.strokeDasharray = ''; el.style.strokeDashoffset = ''; el.style.opacity = ''; });
    container.style.clipPath = clipPath(ps.clipDir, ps.direction === 'reverse' ? 1 : 0);
    return;
  }
  container.style.clipPath = '';
  Array.from(container.querySelectorAll<SVGElement>(SELECTOR)).forEach(el => {
    const len = getLen(el);
    if (!len) return;
    el.style.strokeDasharray = `${len}`;
    el.style.strokeDashoffset = ps.direction === 'reverse' ? '0' : `${len}`;
    el.style.opacity = ps.fade ? (ps.direction === 'reverse' ? '1' : '0') : '';
  });
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function ControlLabel({ children }: { children: React.ReactNode }) {
  return <span className="pl-lab-k">{children}</span>;
}

function Toggle({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  return <button type="button" role="switch" aria-checked={on} aria-label={label} className="pl-switch" onClick={onToggle} />;
}

function SliderRow({ label, value, min, max, step, onChange, display }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; display?: string;
}) {
  return (
    <div className="pl-field">
      <div className="pl-lab">
        <ControlLabel>{label}</ControlLabel>
        <span className="pl-lab-v">{display ?? value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        aria-label={label}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="pl-range" style={fill(value, min, max)} />
    </div>
  );
}

/** The opening's fact cells, counted from the playground's own preset lists. */
export function PlaygroundFacts({ gzipKb }: { gzipKb: number }) {
  return (
    <dl className="pg-facts">
      <div><dt>Draw presets</dt><dd>{EXAMPLES.length}</dd></div>
      <div><dt>v2 presets</dt><dd>{V2_EXAMPLE_COUNT}</dd></div>
      <div><dt>Easings</dt><dd>{EASING_NAMES.length}</dd></div>
      <div><dt>Gzipped</dt><dd>{gzipKb} KB</dd></div>
    </dl>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function SvgPlayground() {
  const [ps, setPs] = useState<PlayState>(() => {
    if (typeof window === 'undefined') return DEFAULT_STATE;
    const m = window.location.hash.slice(1).match(/^p=(.+)$/);
    if (m) { const d = decodeState(m[1]); if (d) return { ...DEFAULT_STATE, ...d }; }
    return DEFAULT_STATE;
  });

  const [rawSvg, setRawSvg]         = useState(ps.svg);
  const [progress, setProgress]     = useState(0);
  const [isPlaying, setIsPlaying]   = useState(false);
  const [shareMsg, setShareMsg]     = useState('');
  const [activeExample, setActiveExample] = useState(0);
  const [activeTab, setActiveTab]   = useState<Tab>('motion');
  const [mode, setMode]             = useState<Mode>('v1');
  const [ground, setGround]         = useState<Ground>('paper');

  const previewRef   = useRef<HTMLDivElement>(null);
  const gutterRef    = useRef<HTMLPreElement>(null);
  const psRef        = useRef(ps);
  const progressRef  = useRef(0);
  const playingRef   = useRef(false);
  const rafRef       = useRef(0);
  const startTimeRef = useRef(0);
  const debounceRef  = useRef<ReturnType<typeof setTimeout>>(undefined);
  const origPathsRef = useRef<string[]>([]);

  useEffect(() => { psRef.current = ps; }, [ps]);

  const applyProgress = useCallback((p: number, state: PlayState) => {
    const container = previewRef.current;
    if (!container) return;
    if (state.useClip) {
      const a0 = state.direction === 'reverse' ? 1 - p : p;
      container.style.clipPath = clipPath(state.clipDir, a0);
      return;
    }
    container.style.clipPath = '';
    Array.from(container.querySelectorAll<SVGElement>(SELECTOR)).forEach((el, i) => {
      const len = getLen(el);
      if (!len) return;
      const shifted = Math.min(1, Math.max(0, p - i * state.stagger));
      const easeFn =
        state.easing === 'spring'   ? (t: number) => 1 - Math.cos(t * Math.PI * state.springTension) * Math.pow(1 - t, state.springFriction)
        : state.easing === 'bounce'  ? createBounce({ bounces: state.bounceBounces, decay: state.bounceDecay })
        : state.easing === 'elastic' ? createElastic({ amplitude: state.elasticAmplitude, period: state.elasticPeriod })
        : EASINGS[state.easing];
      const alpha = easeFn(state.direction === 'reverse' ? 1 - shifted : shifted);
      el.style.strokeDashoffset = `${len * (1 - alpha)}`;
      el.style.opacity = state.fade ? `${alpha}` : '';
      el.style.stroke = state.useColor ? lerpColor(state.colorFrom, state.colorTo, alpha) : '';
      el.style.strokeWidth = state.useWidth ? `${state.widthFrom + (state.widthTo - state.widthFrom) * alpha}` : '';
      el.style.fillOpacity = state.useFillOpacity ? `${state.fillOpacityFrom + (state.fillOpacityTo - state.fillOpacityFrom) * alpha}` : '';
      if (state.useMorphTo && el.tagName.toLowerCase() === 'path') {
        const orig = origPathsRef.current[i];
        if (orig) el.setAttribute('d', lerpPath(orig, state.morphTo, alpha));
      }
    });
  }, []);

  // Parse once per markup change; invalid markup keeps the last good drawing
  // mounted and shows the parser's complaint under the source.
  const parsed = useMemo<{ html: string | null; error: string | null }>(() => {
    if (typeof window === 'undefined') return { html: null, error: null };
    try { return { html: sanitizeSvg(ps.svg), error: null }; }
    catch (e) { return { html: null, error: (e as Error).message }; }
  }, [ps.svg]);
  const error = parsed.error;

  useEffect(() => {
    const container = previewRef.current;
    if (!container || parsed.html === null) return;
    container.innerHTML = parsed.html;
    origPathsRef.current = Array.from(container.querySelectorAll<SVGPathElement>('path')).map(p => p.getAttribute('d') ?? '');
    initElements(container, ps);
    applyProgress(progressRef.current, ps);
  }, [ps, parsed, applyProgress, mode]);

  /** One pass from 0 to 100% — when the bench first comes into view and when a
      preset loads — so the specimen never sits blank. Any scrub, play or reset
      takes over: the pass stops the moment progress is not what it last wrote. */
  const sweepRef = useRef(0);
  const sweep = useCallback(() => {
    cancelAnimationFrame(sweepRef.current);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dur = reduce ? 0 : 1600;
    const t0 = performance.now();
    let last = progressRef.current;
    const step = (now: number) => {
      if (playingRef.current || progressRef.current !== last) return;
      const p = dur ? Math.min(1, (now - t0) / dur) : 1;
      last = p; progressRef.current = p; setProgress(p); applyProgress(p, psRef.current);
      if (p < 1) sweepRef.current = requestAnimationFrame(step);
    };
    sweepRef.current = requestAnimationFrame(step);
  }, [applyProgress]);

  const toolRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = toolRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      if (!playingRef.current && progressRef.current === 0) sweep();
    }, { threshold: 0.2 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(sweepRef.current); };
  }, [sweep]);

  useEffect(() => {
    playingRef.current = isPlaying;
    cancelAnimationFrame(rafRef.current);
    if (!isPlaying) return;
    const duration = 2000 / psRef.current.speed;
    startTimeRef.current = performance.now() - progressRef.current * duration;
    function tick(now: number) {
      if (!playingRef.current) return;
      const p = Math.min(1, (now - startTimeRef.current) / duration);
      progressRef.current = p; setProgress(p); applyProgress(p, psRef.current);
      if (p < 1) { rafRef.current = requestAnimationFrame(tick); }
      else { setTimeout(() => { if (!playingRef.current) return; progressRef.current = 0; setProgress(0); startTimeRef.current = performance.now(); rafRef.current = requestAnimationFrame(tick); }, 700); }
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying, applyProgress]);

  function handleSvgChange(code: string) {
    setRawSvg(code);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setPs(s => ({ ...s, svg: code })); setActiveExample(-1); }, 450);
  }

  function handleSlider(e: React.ChangeEvent<HTMLInputElement>) {
    setIsPlaying(false);
    const p = parseFloat(e.target.value);
    progressRef.current = p; setProgress(p); applyProgress(p, ps);
  }

  function handleReset() {
    setIsPlaying(false); progressRef.current = 0; setProgress(0); applyProgress(0, ps);
  }

  function handleShare() {
    const encoded = encodeState({ ...ps, svg: rawSvg });
    const url = `${window.location.origin}${window.location.pathname}#p=${encoded}`;
    window.history.replaceState(null, '', `#p=${encoded}`);
    navigator.clipboard?.writeText(url)
      .then(() => { setShareMsg('Copied!'); setTimeout(() => setShareMsg(''), 2500); })
      .catch(() => { setShareMsg('URL updated'); setTimeout(() => setShareMsg(''), 3000); });
    if (!navigator.clipboard) { setShareMsg('URL updated'); setTimeout(() => setShareMsg(''), 3000); }
  }

  function loadExample(idx: number) {
    const ex = EXAMPLES[idx];
    setActiveExample(idx);
    const nextState: PlayState = {
      ...DEFAULT_STATE,
      morphTo: DEFAULT_MORPH,
      svg: ex.svg,
      ...(ex.defaults ?? {}),
    };
    setRawSvg(ex.svg);
    setPs(nextState);
    psRef.current = nextState;
    setIsPlaying(false);
    playingRef.current = false;
    progressRef.current = 0;
    setProgress(0);
    sweep();
  }

  function update<K extends keyof PlayState>(key: K, value: PlayState[K]) {
    setPs(s => {
      const next = { ...s, [key]: value };
      setTimeout(() => applyProgress(progressRef.current, next), 0);
      return next;
    });
  }

  const pct = Math.round(progress * 100);
  const lineCount = rawSvg.split('\n').length;

  const activeFeatureTags = [
    ps.fade && 'fade',
    ps.once && 'once',
    ps.useColor && 'color',
    ps.useWidth && 'width',
    ps.useFillOpacity && 'fill-opacity',
    ps.useClip && `clip:${ps.clipDir}`,
    ps.useMorphTo && 'morphTo',
    ps.stagger > 0 && `stagger:${ps.stagger.toFixed(2)}`,
  ].filter(Boolean) as string[];

  const easingSnippet =
    ps.easing === 'bounce'
      ? `{createBounce({ bounces: ${ps.bounceBounces}, decay: ${ps.bounceDecay.toFixed(2)} })}`
      : ps.easing === 'elastic'
      ? `{createElastic({ amplitude: ${ps.elasticAmplitude.toFixed(2)}, period: ${ps.elasticPeriod.toFixed(2)} })}`
      : `"${ps.easing}"`;

  const physicsImport =
    ps.easing === 'bounce'  ? `import { createBounce } from 'svg-scroll-draw';\n\n`
    : ps.easing === 'elastic' ? `import { createElastic } from 'svg-scroll-draw';\n\n`
    : '';

  const codeLines = [
    physicsImport ? physicsImport + `<ScrollDraw` : `<ScrollDraw`,
    `  easing=${easingSnippet}`,
    ps.speed !== 1 ? `  speed={${ps.speed.toFixed(2)}}` : null,
    ps.fade ? `  fade` : null,
    ps.stagger > 0 ? `  stagger={${ps.stagger.toFixed(2)}}` : null,
    ps.direction === 'reverse' ? `  direction="reverse"` : null,
    ps.once ? `  once` : null,
    ps.useColor ? `  strokeColor={['${ps.colorFrom}', '${ps.colorTo}']}` : null,
    ps.useWidth ? `  strokeWidth={[${ps.widthFrom}, ${ps.widthTo}]}` : null,
    ps.useFillOpacity ? `  fillOpacity={[${ps.fillOpacityFrom}, ${ps.fillOpacityTo}]}` : null,
    ps.useClip ? `  clip="${ps.clipDir}"` : null,
    ps.useMorphTo ? `  morphTo="..."` : null,
    `>`,
    `  <svg>...</svg>`,
    `</ScrollDraw>`,
  ].filter(Boolean).join('\n');

  return (
    <div className="pl-tool" ref={toolRef}>

      {/* ── The bench's title strip: figure, mode, live options, share ─── */}
      <div className="pl-bar">
        <span className="pl-bar-n">fig. 2</span>
        <span className="pl-bar-mode" role="group" aria-label="Playground mode">
          <button type="button" className="pl-mode" aria-pressed={mode === 'v1'} onClick={() => setMode('v1')}>
            v1 <span>scrollDraw</span>
          </button>
          <button type="button" className="pl-mode" aria-pressed={mode === 'v2'} onClick={() => setMode('v2')}>
            v2 <span>animate · text · counter</span>
          </button>
        </span>
        <span className="pl-bar-tags">
          {mode === 'v1' && activeFeatureTags.map(t => <span key={t} className="tag">{t}</span>)}
          {mode === 'v1' && activeFeatureTags.length === 0 && <span className="pl-bar-empty">core options only — easing, speed</span>}
          {mode === 'v2' && <span className="pl-bar-empty">driven by instance.seek(p)</span>}
        </span>
        {mode === 'v1' && <span className="pl-bar-pct" aria-label="Progress">{String(pct).padStart(3, '0')}%</span>}
        {mode === 'v1' && (
          <button type="button" onClick={handleShare} className={`pl-share${shareMsg ? ' is-done' : ''}`}>
            {shareMsg || 'Share ↗'}
          </button>
        )}
      </div>

      {/* ── v2 mode ─────────────────────────────────────────────────────── */}
      {mode === 'v2' && <PlaygroundV2Content ground={ground} onGround={setGround} />}

      {/* ── v1: A source · B specimen · C options ───────────────────────── */}
      {mode === 'v1' && <div className="pl-bench">

        {/* ── A: the source ───────────────────────────────────────────── */}
        <div className="pl-panel pl-panel-a">
          <div className="pl-ph">
            <span className="pl-ph-z">A</span>
            <span className="pl-ph-t">source · svg</span>
            <span className="pl-ph-m">{lineCount} ln · {rawSvg.length.toLocaleString()} ch</span>
          </div>
          <div className="pl-ed">
            <pre ref={gutterRef} className="pl-ed-gutter" aria-hidden="true">
              {Array.from({ length: lineCount }, (_, i) => i + 1).join('\n')}
              {'\n\n'}
            </pre>
            <textarea
              value={rawSvg}
              onChange={e => handleSvgChange(e.target.value)}
              onScroll={e => { if (gutterRef.current) gutterRef.current.scrollTop = e.currentTarget.scrollTop; }}
              spellCheck={false}
              wrap="off"
              aria-label="SVG markup"
              className="pl-ed-ta"
              placeholder="Paste your SVG markup here…"
            />
          </div>
          {error && (
            <div className="pl-err" role="alert">
              <span>error</span>
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* ── B: the specimen ─────────────────────────────────────────── */}
        <div className="pl-panel pl-panel-b">
          <div className="pl-ph">
            <span className="pl-ph-z">B</span>
            <span className="pl-ph-t">specimen</span>
            <GroundSwitch ground={ground} onChange={setGround} />
          </div>
          <div className="pl-spec" data-ground={ground}>
            <CropMarks />
            <div ref={previewRef} className="pl-specimen" />
          </div>
          <div className="pl-scrub">
            <div className="pl-scrub-row">
              <button type="button" onClick={() => setIsPlaying(v => !v)} className="pl-play" aria-label={isPlaying ? 'Pause' : 'Play'}>
                <PlayIcon playing={isPlaying} />
              </button>
              <input type="range" min="0" max="1" step="0.001" value={progress}
                aria-label="Animation progress"
                onChange={handleSlider} className="pl-range" style={fill(progress, 0, 1)} />
              <button type="button" onClick={handleReset} className="pl-reset" aria-label="Reset">
                <ResetIcon />
              </button>
            </div>
            <div className="pl-read">
              <span>progress <b>{pct}%</b></span>
              <span><b>{ps.easing}</b> · {ps.speed.toFixed(1)}×</span>
            </div>
          </div>
        </div>

        {/* ── C: the options ──────────────────────────────────────────── */}
        <div className="pl-panel pl-panel-c">
          <div className="pl-ph">
            <span className="pl-ph-z">C</span>
            <span className="pl-ph-t">options</span>
            <span className="pl-ph-m">{activeFeatureTags.length} on</span>
          </div>

          {/* Presets, as a parts list */}
          <div className="pl-ex">
            <p className="pl-k"><span>Examples</span><span>{EXAMPLES.length} presets</span></p>
            <div className="pl-ex-grid">
              {EXAMPLES.map((ex, i) => (
                <button key={ex.label} type="button" onClick={() => loadExample(i)} className="pl-exb" aria-pressed={activeExample === i}>
                  <span className="pl-exb-n">{pad(i + 1)}</span>
                  <span
                    className="pl-exb-art"
                    aria-hidden="true"
                    dangerouslySetInnerHTML={{
                      __html: ex.svg.replace(/width="[^"]*"/, 'width="100%"').replace(/height="[^"]*"/, 'height="34"'),
                    }}
                  />
                  <span className="pl-exb-l">{ex.label}</span>
                  <span className="pl-exb-t">{ex.tag}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className="pl-tabs" role="tablist" aria-label="Options">
            {(['motion', 'visual', 'effects', 'code'] as Tab[]).map(tab => (
              <button key={tab} type="button" role="tab" aria-selected={activeTab === tab} onClick={() => setActiveTab(tab)} className="pl-tab">
                {tab}
              </button>
            ))}
          </div>

          {/* Tab content — scrollable */}
          <div className="pl-tab-body" role="tabpanel" aria-label={activeTab}>

            {/* ── Motion tab ─────────────────────────────────────────── */}
            {activeTab === 'motion' && (
              <div className="pl-stack">
                {/* Preset shortcut */}
                <div className="pl-field">
                  <ControlLabel>Preset</ControlLabel>
                  <div className="pl-sel">
                    <select defaultValue="" aria-label="Preset" onChange={e => {
                      const presets: Record<string, Partial<typeof ps>> = {
                        sketch:     { easing: 'ease-in',     stagger: 0.10, speed: 0.90, fade: false, once: false },
                        reveal:     { easing: 'ease-out',    stagger: 0,    speed: 1.20, fade: true,  once: true  },
                        typewriter: { easing: 'linear',      stagger: 0.05, speed: 1.50, fade: false, once: false },
                        cinematic:  { easing: 'ease-in-out', stagger: 0,    speed: 0.75, fade: true,  once: false },
                        spring:     { easing: 'spring',      stagger: 0,    speed: 1.10, fade: false, once: false },
                      };
                      const p = presets[e.target.value];
                      if (p) setPs(prev => ({ ...prev, ...p }));
                      e.target.value = '';
                    }}
                      className="pl-select">
                      <option value="">— apply preset —</option>
                      <option value="sketch">sketch</option>
                      <option value="reveal">reveal</option>
                      <option value="typewriter">typewriter</option>
                      <option value="cinematic">cinematic</option>
                      <option value="spring">spring</option>
                    </select>
                  </div>
                </div>

                {/* Easing */}
                <div className="pl-field">
                  <ControlLabel>Easing</ControlLabel>
                  <div className="pl-sel">
                    <select value={ps.easing} aria-label="Easing" onChange={e => update('easing', e.target.value as EasingName)} className="pl-select">
                      {EASING_NAMES.map(e => (
                        <option key={e} value={e}>{e}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {ps.easing === 'spring' && (
                  <div className="pl-sub">
                    <ControlLabel>Spring params</ControlLabel>
                    <SliderRow label="Tension" value={ps.springTension} min={0.5} max={6} step={0.1}
                      onChange={v => update('springTension', v)} display={ps.springTension.toFixed(1)} />
                    <SliderRow label="Friction" value={ps.springFriction} min={0.5} max={5} step={0.1}
                      onChange={v => update('springFriction', v)} display={ps.springFriction.toFixed(1)} />
                  </div>
                )}

                {ps.easing === 'bounce' && (
                  <div className="pl-sub">
                    <ControlLabel>Bounce params</ControlLabel>
                    <SliderRow label="Bounces" value={ps.bounceBounces} min={1} max={6} step={1}
                      onChange={v => update('bounceBounces', v)} display={String(Math.round(ps.bounceBounces))} />
                    <SliderRow label="Decay" value={ps.bounceDecay} min={0.1} max={0.9} step={0.05}
                      onChange={v => update('bounceDecay', v)} display={ps.bounceDecay.toFixed(2)} />
                  </div>
                )}

                {ps.easing === 'elastic' && (
                  <div className="pl-sub">
                    <ControlLabel>Elastic params</ControlLabel>
                    <SliderRow label="Amplitude" value={ps.elasticAmplitude} min={1} max={2.5} step={0.05}
                      onChange={v => update('elasticAmplitude', v)} display={ps.elasticAmplitude.toFixed(2)} />
                    <SliderRow label="Period" value={ps.elasticPeriod} min={0.1} max={0.8} step={0.05}
                      onChange={v => update('elasticPeriod', v)} display={ps.elasticPeriod.toFixed(2)} />
                  </div>
                )}

                <SliderRow label="Speed" value={ps.speed} min={0.1} max={3} step={0.05}
                  onChange={v => update('speed', v)} display={`${ps.speed.toFixed(2)}×`} />

                <SliderRow label="Stagger" value={ps.stagger} min={0} max={0.5} step={0.01}
                  onChange={v => update('stagger', v)} display={ps.stagger.toFixed(2)} />

                {/* Direction */}
                <div className="pl-field">
                  <ControlLabel>Direction</ControlLabel>
                  <div className="pl-seg" role="group" aria-label="Direction">
                    {(['forward', 'reverse'] as const).map(d => (
                      <button key={d} type="button" aria-pressed={ps.direction === d} onClick={() => update('direction', d)}>
                        {d === 'forward' ? '→ forward' : '← reverse'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fade + Once */}
                <div className="pl-pair">
                  <div className="pl-card">
                    <div className="pl-card-h">
                      <div>
                        <ControlLabel>Fade</ControlLabel>
                        <p>opacity 0→1</p>
                      </div>
                      <Toggle label="Fade" on={ps.fade} onToggle={() => update('fade', !ps.fade)} />
                    </div>
                  </div>
                  <div className="pl-card">
                    <div className="pl-card-h">
                      <div>
                        <ControlLabel>Once</ControlLabel>
                        <p>lock at 100%</p>
                      </div>
                      <Toggle label="Once" on={ps.once} onToggle={() => update('once', !ps.once)} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Visual tab ─────────────────────────────────────────── */}
            {activeTab === 'visual' && (
              <div className="pl-stack">
                {/* Stroke Color */}
                <div className="pl-card">
                  <div className="pl-card-h">
                    <div>
                      <ControlLabel>Stroke Color</ControlLabel>
                      <p>interpolate from → to</p>
                    </div>
                    <Toggle label="Stroke color" on={ps.useColor} onToggle={() => update('useColor', !ps.useColor)} />
                  </div>
                  <div className={`pl-colors${ps.useColor ? '' : ' is-off'}`}>
                    <label className="pl-swatch">
                      <input type="color" value={ps.colorFrom} onChange={e => update('colorFrom', e.target.value)} className="pl-color" aria-label="Stroke color from" />
                      from
                    </label>
                    <div className="pl-grad" style={{ background: `linear-gradient(to right, ${ps.colorFrom}, ${ps.colorTo})` }} />
                    <label className="pl-swatch">
                      <input type="color" value={ps.colorTo} onChange={e => update('colorTo', e.target.value)} className="pl-color" aria-label="Stroke color to" />
                      to
                    </label>
                  </div>
                </div>

                {/* Stroke Width */}
                <div className="pl-card">
                  <div className="pl-card-h">
                    <div>
                      <ControlLabel>Stroke Width</ControlLabel>
                      <p>thin → thick</p>
                    </div>
                    <Toggle label="Stroke width" on={ps.useWidth} onToggle={() => update('useWidth', !ps.useWidth)} />
                  </div>
                  <div className={`pl-nums${ps.useWidth ? '' : ' is-off'}`}>
                    <label className="pl-num-w">
                      <input type="number" value={ps.widthFrom} min={0.5} max={10} step={0.5}
                        onChange={e => update('widthFrom', parseFloat(e.target.value))} className="pl-num" aria-label="Stroke width from" />
                      from
                    </label>
                    <span className="pl-to" aria-hidden="true">→</span>
                    <label className="pl-num-w">
                      <input type="number" value={ps.widthTo} min={0.5} max={20} step={0.5}
                        onChange={e => update('widthTo', parseFloat(e.target.value))} className="pl-num" aria-label="Stroke width to" />
                      to
                    </label>
                  </div>
                </div>

                {/* Fill Opacity */}
                <div className="pl-card">
                  <div className="pl-card-h">
                    <div>
                      <ControlLabel>Fill Opacity</ControlLabel>
                      <p>flood fill as stroke draws</p>
                    </div>
                    <Toggle label="Fill opacity" on={ps.useFillOpacity} onToggle={() => update('useFillOpacity', !ps.useFillOpacity)} />
                  </div>
                  <div className={`pl-nums${ps.useFillOpacity ? '' : ' is-off'}`}>
                    {[
                      { key: 'fillOpacityFrom' as const, label: 'from' },
                      { key: 'fillOpacityTo' as const, label: 'to' },
                    ].map(({ key, label }) => (
                      <label key={key} className="pl-num-w">
                        <input type="number" value={ps[key]} min={0} max={1} step={0.1}
                          onChange={e => update(key, parseFloat(e.target.value))} className="pl-num" aria-label={`Fill opacity ${label}`} />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Effects tab ────────────────────────────────────────── */}
            {activeTab === 'effects' && (
              <div className="pl-stack">
                {/* Clip */}
                <div className="pl-card">
                  <div className="pl-card-h">
                    <div>
                      <ControlLabel>Clip Reveal</ControlLabel>
                      <p>clip-path instead of dashoffset</p>
                    </div>
                    <Toggle label="Clip reveal" on={ps.useClip} onToggle={() => update('useClip', !ps.useClip)} />
                  </div>
                  <div className={`pl-field${ps.useClip ? '' : ' is-off'}`}>
                    <ControlLabel>Direction</ControlLabel>
                    <div className="pl-seg pl-seg-sm" role="group" aria-label="Clip direction">
                      {(['left', 'right', 'top', 'bottom', 'center'] as ClipDir[]).map(d => (
                        <button key={d} type="button" aria-pressed={ps.clipDir === d} onClick={() => update('clipDir', d)}>
                          <span className="pl-seg-arrow" aria-hidden="true">{d === 'center' ? '◎' : d === 'left' ? '←' : d === 'right' ? '→' : d === 'top' ? '↑' : '↓'}</span>
                          {d === 'bottom' ? 'btm' : d === 'center' ? 'ctr' : d}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* MorphTo */}
                <div className="pl-card">
                  <div className="pl-card-h">
                    <div>
                      <ControlLabel>Path Morph</ControlLabel>
                      <p>interpolate shape on scroll</p>
                    </div>
                    <Toggle label="Path morph" on={ps.useMorphTo} onToggle={() => update('useMorphTo', !ps.useMorphTo)} />
                  </div>
                  <div className={`pl-field${ps.useMorphTo ? '' : ' is-off'}`}>
                    <ControlLabel>Target path d</ControlLabel>
                    <textarea
                      rows={3}
                      value={ps.morphTo}
                      onChange={e => update('morphTo', e.target.value)}
                      aria-label="Target path d"
                      placeholder="M ... target path d attribute (must have same command count)"
                      className="pl-morph"
                    />
                    <p className="pl-hint">
                      Source and target must have the same number of numeric tokens. Try the <button type="button" className="pl-inline" onClick={() => loadExample(6)}>Morph example</button>.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ── Code tab ───────────────────────────────────────────── */}
            {activeTab === 'code' && (
              <div className="pl-stack">
                <div className="pl-field">
                  <ControlLabel>Generated snippet</ControlLabel>
                  <CodeBox file="Drawing.tsx">{codeLines}</CodeBox>
                </div>

                <div className="pl-field">
                  <ControlLabel>Active options</ControlLabel>
                  {activeFeatureTags.length === 0 ? (
                    <p className="pl-muted">Only core options active (easing, speed).</p>
                  ) : (
                    <div className="pl-tags">
                      {activeFeatureTags.map(t => <span key={t} className="tag">{t}</span>)}
                    </div>
                  )}
                </div>

                <div className="pl-note">
                  <span className="pl-note-k">Usage</span>
                  This playground simulates scroll progress via a scrubber. In production, wrap your SVG with{' '}
                  <code>{'<ScrollDraw>'}</code>{' '}
                  and the animation follows the scroll position automatically.
                </div>
              </div>
            )}

          </div>
        </div>

      </div>}
    </div>
  );
}
