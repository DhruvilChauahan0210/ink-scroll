'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { createBounce, createElastic } from 'svg-scroll-draw';
import { MobileMenu } from './MobileMenu';
import { CopyButton } from './CopyButton';
import { PlaygroundV2Content } from './PlaygroundV2Content';

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

const EXAMPLES: ExamplePreset[] = [
  {
    // 3 concentric circles + 2 crosshair lines — 5 stroked elements, clean stagger reveal
    label: 'Scope',
    tag: 'basics',
    svg: `<svg width="240" height="240" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="120" cy="120" r="100" stroke="#000" stroke-width="2.5"/>
  <circle cx="120" cy="120" r="66"  stroke="#ff90e8" stroke-width="2"/>
  <circle cx="120" cy="120" r="32"  stroke="#ffc900" stroke-width="2"/>
  <line x1="20"  y1="120" x2="220" y2="120" stroke="#000" stroke-width="1.5" stroke-dasharray="6 4" opacity="0.4"/>
  <line x1="120" y1="20"  x2="120" y2="220" stroke="#000" stroke-width="1.5" stroke-dasharray="6 4" opacity="0.4"/>
</svg>`,
    defaults: { stagger: 0.12, easing: 'ease-out' },
  },
  {
    // Single flowing signature path — easing makes it feel like a real pen stroke
    label: 'Signature',
    tag: 'easing',
    svg: `<svg width="240" height="240" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M 20 160 C 38 70 68 55 88 95 C 103 125 108 55 128 78 C 146 98 138 148 160 118 C 178 93 172 48 196 68 C 214 84 216 128 224 112" stroke="#000" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  <line x1="20" y1="175" x2="224" y2="175" stroke="#d1d5dc" stroke-width="1.5"/>
</svg>`,
    defaults: { easing: 'ease-in-out', speed: 0.75 },
  },
  {
    // 2 axes + 5 bars — stagger reveals axes first, then each bar in sequence
    label: 'Bar Chart',
    tag: 'stagger',
    svg: `<svg width="240" height="240" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
  <line x1="28" y1="16" x2="28"  y2="200" stroke="#000" stroke-width="2"/>
  <line x1="28" y1="200" x2="224" y2="200" stroke="#000" stroke-width="2"/>
  <rect x="40"  y="120" width="28" height="80"  stroke="#ff90e8" stroke-width="2.5" fill="#ff90e8" fill-opacity="0.1"/>
  <rect x="82"  y="76"  width="28" height="124" stroke="#ffc900" stroke-width="2.5" fill="#ffc900" fill-opacity="0.1"/>
  <rect x="124" y="148" width="28" height="52"  stroke="#f1f333" stroke-width="2.5" fill="#f1f333" fill-opacity="0.1"/>
  <rect x="166" y="56"  width="28" height="144" stroke="#000"    stroke-width="2.5" fill="#000"    fill-opacity="0.07"/>
  <rect x="208" y="100" width="16" height="100" stroke="#ff90e8" stroke-width="2"   fill="#ff90e8" fill-opacity="0.1"/>
</svg>`,
    defaults: { stagger: 0.12, easing: 'ease-out', speed: 1 },
  },
  {
    // Single continuous route path — no decorative dots eating stagger slots
    label: 'Route',
    tag: 'path',
    svg: `<svg width="240" height="240" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M 28 210 C 28 168 52 148 72 128 C 92 108 76 76 108 60 C 132 48 158 70 178 60 C 198 50 208 30 218 18" stroke="#ff90e8" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="28"  cy="210" r="7" stroke="#000" stroke-width="2" fill="#ff90e8"/>
  <circle cx="218" cy="18"  r="7" stroke="#000" stroke-width="2" fill="#ffc900"/>
  <circle cx="72"  cy="128" r="4" stroke="#000" stroke-width="1.5" fill="none"/>
  <circle cx="108" cy="60"  r="4" stroke="#000" stroke-width="1.5" fill="none"/>
  <circle cx="178" cy="60"  r="4" stroke="#000" stroke-width="1.5" fill="none"/>
</svg>`,
    defaults: { easing: 'ease-in-out', speed: 0.8, stagger: 0.04 },
  },
  {
    // 3 orbital ellipses + nucleus — ellipse is in SELECTOR so all 4 elements animate
    label: 'Orbit',
    tag: 'stagger',
    svg: `<svg width="240" height="240" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="120" cy="120" rx="100" ry="36" stroke="#000"    stroke-width="2.5"/>
  <ellipse cx="120" cy="120" rx="100" ry="36" stroke="#ff90e8" stroke-width="2"   transform="rotate(60 120 120)"/>
  <ellipse cx="120" cy="120" rx="100" ry="36" stroke="#ffc900" stroke-width="2"   transform="rotate(-60 120 120)"/>
  <circle  cx="120" cy="120" r="14"            stroke="#000"    stroke-width="2.5" fill="none"/>
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
        stroke="#ff90e8" stroke-width="2.5" fill="#ff90e8" fill-opacity="0"/>
  <circle cx="120" cy="120" r="32" stroke="#ffc900" stroke-width="2" fill="#ffc900" fill-opacity="0"/>
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
        stroke="#000" stroke-width="2.5"/>
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
  <rect x="14"  y="14"  width="72" height="44" rx="6" stroke="#000"    stroke-width="2"/>
  <rect x="84"  y="98"  width="72" height="44" rx="6" stroke="#ff90e8" stroke-width="2"/>
  <rect x="154" y="182" width="72" height="44" rx="6" stroke="#ffc900" stroke-width="2"/>
  <path d="M 50 58 L 50 78 L 120 78 L 120 98"   stroke="#000"    stroke-width="1.5" stroke-linecap="round"/>
  <path d="M 120 142 L 120 162 L 190 162 L 190 182" stroke="#ff90e8" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M 113 94 L 120 98 L 127 94"  stroke="#000"    stroke-width="1.5" stroke-linecap="round" fill="none"/>
  <path d="M 183 178 L 190 182 L 197 178" stroke="#ffc900" stroke-width="1.5" stroke-linecap="round" fill="none"/>
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
  colorFrom: '#ff6b9d',
  colorTo: '#ffc900',
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

const EASINGS: Record<EasingName, (t: number) => number> = {
  linear:        t => t,
  'ease-in':     t => t * t,
  'ease-out':    t => t * (2 - t),
  'ease-in-out': t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  spring:        t => 1 - Math.cos(t * Math.PI * 2.5) * Math.pow(1 - t, 2.2),
  bounce:        createBounce(),
  elastic:       createElastic(),
};

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
  return <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-graphite-border font-mono">{children}</span>;
}

function Toggle({ on, onToggle, colorOn = 'bg-creator-pink border-creator-pink' }: { on: boolean; onToggle: () => void; colorOn?: string }) {
  return (
    <button
      onClick={onToggle}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 transition-colors ${on ? colorOn : 'bg-subtle-ash border-subtle-ash'}`}
    >
      <span className={`inline-block h-3 w-3 rounded-full bg-pitch-black transition-transform ${on ? 'translate-x-4' : 'translate-x-0.5'}`} />
    </button>
  );
}

function SliderRow({ label, value, min, max, step, onChange, display }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; display?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <ControlLabel>{label}</ControlLabel>
        <span className="text-[11px] font-mono text-pitch-black font-semibold">{display ?? value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        aria-label={label}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full accent-pitch-black" />
    </div>
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
  const [error, setError]           = useState<string | null>(null);
  const [shareMsg, setShareMsg]     = useState('');
  const [activeExample, setActiveExample] = useState(0);
  const [activeTab, setActiveTab]   = useState<Tab>('motion');
  const [mode, setMode]             = useState<Mode>('v1');

  const previewRef   = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    const container = previewRef.current;
    if (!container) return;
    try {
      container.innerHTML = sanitizeSvg(ps.svg);
      origPathsRef.current = Array.from(container.querySelectorAll<SVGPathElement>('path')).map(p => p.getAttribute('d') ?? '');
      initElements(container, ps);
      applyProgress(progressRef.current, ps);
      setError(null);
    } catch (e) { setError((e as Error).message); }
  }, [ps, applyProgress]);

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
    setIsPlaying(false);
    progressRef.current = 0;
    setProgress(0);
  }

  function update<K extends keyof PlayState>(key: K, value: PlayState[K]) {
    setPs(s => {
      const next = { ...s, [key]: value };
      setTimeout(() => applyProgress(progressRef.current, next), 0);
      return next;
    });
  }

  const pct = Math.round(progress * 100);

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
    <div className="flex flex-col h-screen max-h-screen bg-light-linen text-pitch-black overflow-hidden">

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav className="shrink-0 border-b border-pitch-black flex items-center justify-between px-4 sm:px-6 h-12 bg-light-linen/95 backdrop-blur-sm z-40">
        <div className="flex items-center gap-3 min-w-0">
          <a href="/" className="flex items-center gap-2 shrink-0 group">
            <span className="text-graphite-border group-hover:text-pitch-black transition-colors text-sm">←</span>
            <span className="font-display font-bold text-sm tracking-tight">svg-scroll-draw</span>
          </a>
          <span className="text-subtle-ash text-sm hidden sm:inline">/</span>
          <h1 className="text-sm hidden sm:inline text-graphite-border font-medium m-0 p-0">Playground</h1>
          {mode === 'v1' && activeFeatureTags.length > 0 && (
            <div className="hidden md:flex items-center gap-1.5 ml-2">
              {activeFeatureTags.map(t => (
                <span key={t} className="text-[9px] font-mono font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-creator-pink/20 border border-creator-pink/40 text-pitch-black">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* v1 / v2 mode toggle */}
          <div className="flex items-center rounded-full border border-pitch-black overflow-hidden shadow-[1px_1px_0px_#000]">
            <button
              onClick={() => setMode('v1')}
              className={`px-3 py-1 text-[11px] font-bold font-mono transition-all ${
                mode === 'v1' ? 'bg-pitch-black text-light-linen' : 'text-graphite-border hover:text-pitch-black'
              }`}
            >
              v1
            </button>
            <button
              onClick={() => setMode('v2')}
              className={`px-3 py-1 text-[11px] font-bold font-mono transition-all ${
                mode === 'v2' ? 'bg-creator-pink text-pitch-black' : 'text-graphite-border hover:text-pitch-black'
              }`}
            >
              v2
            </button>
          </div>
          {mode === 'v1' && <span className="hidden sm:inline text-[11px] font-mono text-graphite-border">{pct}%</span>}
          {mode === 'v1' && (
            <button
              onClick={handleShare}
              className={`text-[12px] font-mono px-3 py-1.5 rounded-full border font-medium transition-all ${
                shareMsg ? 'bg-lime-glow border-lime-glow' : 'border-pitch-black hover:bg-pitch-black hover:text-light-linen'
              }`}
            >
              {shareMsg || 'Share ↗'}
            </button>
          )}
          <div className="lg:hidden"><MobileMenu /></div>
        </div>
      </nav>

      {/* ── v2 mode ─────────────────────────────────────────────────────── */}
      {mode === 'v2' && <PlaygroundV2Content />}

      {/* ── v1 Three-panel layout ───────────────────────────────────────── */}
      {mode === 'v1' && <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">

        {/* ── Panel 1: Editor ─────────────────────────────────────────── */}
        <div className="flex flex-col lg:w-[38%] xl:w-[36%] border-b lg:border-b-0 lg:border-r border-pitch-black min-h-0 max-h-[35vh] lg:max-h-none">
          {/* Editor header */}
          <div className="shrink-0 flex items-center justify-between px-4 py-2 bg-[#111] border-b border-[#2a2a2a]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
            </div>
            <span className="text-[10px] text-[#888] font-mono tracking-widest uppercase">SVG Editor</span>
            <span className="text-[10px] font-mono text-[#555]">{rawSvg.length.toLocaleString()} ch</span>
          </div>

          {/* Textarea */}
          <textarea
            value={rawSvg}
            onChange={e => handleSvgChange(e.target.value)}
            spellCheck={false}
            className="flex-1 resize-none bg-[#141412] text-[#e8e8e3] font-mono text-[12px] leading-[1.8] p-4 outline-none min-h-0"
            placeholder="Paste your SVG markup here…"
          />

          {/* Error bar */}
          {error && (
            <div className="shrink-0 flex items-center gap-2 px-4 py-2 bg-firecracker-orange/10 border-t border-firecracker-orange/30 text-[11px] font-mono text-firecracker-orange">
              <span>⚠</span>
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* ── Panel 2: Preview ────────────────────────────────────────── */}
        <div className="flex flex-col lg:w-[30%] xl:w-[32%] border-b lg:border-b-0 lg:border-r border-pitch-black min-h-0">
          {/* Preview area */}
          <div className="flex-1 flex items-center justify-center relative bg-[radial-gradient(circle_at_center,_#f0f0ea_0%,_#f4f4f0_100%)] min-h-[200px]">
            {/* Dot grid */}
            <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(circle, #c8c8c0 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
            <div ref={previewRef}
              className="relative z-10 w-full h-full max-w-[320px] max-h-[320px] flex items-center justify-center p-6 [&>svg]:max-w-full [&>svg]:max-h-full"
            />
          </div>

          {/* Scrubber + play controls */}
          <div className="shrink-0 border-t border-subtle-ash bg-light-linen px-4 py-3 space-y-2">
            {/* Progress track */}
            <div className="flex items-center gap-3">
              <button onClick={() => setIsPlaying(v => !v)}
                className="shrink-0 w-8 h-8 rounded-full bg-pitch-black text-light-linen flex items-center justify-center hover:bg-graphite-border transition-colors text-[13px] shadow-[1px_1px_0px_#000]"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? '⏸' : '▶'}
              </button>
              <div className="flex-1">
                <input type="range" min="0" max="1" step="0.001" value={progress}
                  aria-label="Animation progress"
                  onChange={handleSlider} className="w-full accent-pitch-black" />
              </div>
              <button onClick={handleReset}
                className="shrink-0 w-8 h-8 rounded-full border border-subtle-ash flex items-center justify-center hover:border-pitch-black transition-colors text-[13px]"
                aria-label="Reset"
              >↺</button>
            </div>
            {/* Progress pill */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 rounded-full bg-subtle-ash flex-1 w-24 overflow-hidden">
                  <div className="h-full bg-pitch-black rounded-full transition-none" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-[11px] font-mono font-semibold text-pitch-black w-8 text-right">{pct}%</span>
              </div>
              <span className="text-[10px] font-mono text-graphite-border">{ps.easing} · {ps.speed.toFixed(1)}×</span>
            </div>
          </div>
        </div>

        {/* ── Panel 3: Options ────────────────────────────────────────── */}
        <div className="flex flex-col lg:w-[32%] xl:w-[32%] min-h-0 overflow-hidden bg-marketplace-gray">

          {/* Examples grid */}
          <div className="shrink-0 border-b border-pitch-black px-4 pt-3 pb-3">
            <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-graphite-border mb-2.5 font-mono">Examples</p>
            <div className="grid grid-cols-4 gap-1.5">
              {EXAMPLES.map((ex, i) => (
                <button
                  key={ex.label}
                  onClick={() => loadExample(i)}
                  className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl border transition-all text-center ${
                    activeExample === i
                      ? 'bg-pitch-black border-pitch-black text-light-linen shadow-[2px_2px_0px_#000]'
                      : 'border-subtle-ash bg-light-linen hover:border-pitch-black hover:shadow-[1px_1px_0px_#000] text-graphite-border hover:text-pitch-black'
                  }`}
                >
                  <div
                    className={`w-full rounded-lg overflow-hidden flex items-center justify-center h-9 ${activeExample === i ? 'opacity-60' : 'opacity-100'}`}
                    dangerouslySetInnerHTML={{
                      __html: ex.svg.replace(/width="[^"]*"/, 'width="100%"').replace(/height="[^"]*"/, 'height="36"'),
                    }}
                  />
                  <span className="text-[9px] font-mono leading-tight font-semibold">{ex.label}</span>
                  <span className={`text-[8px] uppercase tracking-wide font-bold leading-none px-1 py-0.5 rounded-full ${
                    activeExample === i ? 'bg-creator-pink/30 text-creator-pink' : 'text-graphite-border/60'
                  }`}>{ex.tag}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className="shrink-0 flex border-b border-pitch-black">
            {(['motion', 'visual', 'effects', 'code'] as Tab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-[0.16em] transition-all border-r last:border-r-0 border-subtle-ash ${
                  activeTab === tab
                    ? 'bg-pitch-black text-light-linen border-pitch-black'
                    : 'text-graphite-border hover:text-pitch-black hover:bg-light-linen/60'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab content — scrollable */}
          <div className="flex-1 overflow-y-auto">

            {/* ── Motion tab ─────────────────────────────────────────── */}
            {activeTab === 'motion' && (
              <div className="p-4 space-y-4">
                {/* Preset shortcut */}
                <div className="space-y-1.5">
                  <ControlLabel>Preset</ControlLabel>
                  <select defaultValue="" onChange={e => {
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
                    className="w-full font-mono text-[12px] border border-pitch-black rounded-lg px-3 py-2 bg-light-linen appearance-none cursor-pointer focus:outline-none hover:bg-pitch-black hover:text-light-linen transition-colors shadow-[1px_1px_0px_#000]">
                    <option value="">— apply preset —</option>
                    <option value="sketch">sketch</option>
                    <option value="reveal">reveal</option>
                    <option value="typewriter">typewriter</option>
                    <option value="cinematic">cinematic</option>
                    <option value="spring">spring</option>
                  </select>
                </div>

                {/* Easing */}
                <div className="space-y-1.5">
                  <ControlLabel>Easing</ControlLabel>
                  <select value={ps.easing} onChange={e => update('easing', e.target.value as EasingName)}
                    className="w-full font-mono text-[12px] border border-pitch-black rounded-lg px-3 py-2 bg-light-linen appearance-none cursor-pointer focus:outline-none hover:bg-pitch-black hover:text-light-linen transition-colors shadow-[1px_1px_0px_#000]">
                    {(['linear', 'ease-in', 'ease-out', 'ease-in-out', 'spring', 'bounce', 'elastic'] as EasingName[]).map(e => (
                      <option key={e} value={e}>{e}</option>
                    ))}
                  </select>
                </div>

                {ps.easing === 'spring' && (
                  <div className="p-3 rounded-xl border border-creator-pink/30 bg-creator-pink/5 space-y-3">
                    <ControlLabel>Spring params</ControlLabel>
                    <SliderRow label="Tension" value={ps.springTension} min={0.5} max={6} step={0.1}
                      onChange={v => update('springTension', v)} display={ps.springTension.toFixed(1)} />
                    <SliderRow label="Friction" value={ps.springFriction} min={0.5} max={5} step={0.1}
                      onChange={v => update('springFriction', v)} display={ps.springFriction.toFixed(1)} />
                  </div>
                )}

                {ps.easing === 'bounce' && (
                  <div className="p-3 rounded-xl border border-[#ffc900]/40 bg-[#ffc900]/5 space-y-3">
                    <ControlLabel>Bounce params</ControlLabel>
                    <SliderRow label="Bounces" value={ps.bounceBounces} min={1} max={6} step={1}
                      onChange={v => update('bounceBounces', v)} display={String(Math.round(ps.bounceBounces))} />
                    <SliderRow label="Decay" value={ps.bounceDecay} min={0.1} max={0.9} step={0.05}
                      onChange={v => update('bounceDecay', v)} display={ps.bounceDecay.toFixed(2)} />
                  </div>
                )}

                {ps.easing === 'elastic' && (
                  <div className="p-3 rounded-xl border border-[#5865F2]/30 bg-[#5865F2]/5 space-y-3">
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
                <div className="space-y-1.5">
                  <ControlLabel>Direction</ControlLabel>
                  <div className="flex gap-2">
                    {(['forward', 'reverse'] as const).map(d => (
                      <button key={d} onClick={() => update('direction', d)}
                        className={`flex-1 py-1.5 text-[11px] font-mono rounded-lg border transition-all font-semibold ${
                          ps.direction === d
                            ? 'bg-pitch-black text-light-linen border-pitch-black shadow-[1px_1px_0px_#000]'
                            : 'border-subtle-ash text-graphite-border hover:border-pitch-black'
                        }`}>
                        {d === 'forward' ? '→ forward' : '← reverse'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fade + Once */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center justify-between p-3 rounded-xl border border-subtle-ash bg-light-linen">
                    <div>
                      <ControlLabel>Fade</ControlLabel>
                      <p className="text-[9px] text-graphite-border mt-0.5">opacity 0→1</p>
                    </div>
                    <Toggle on={ps.fade} onToggle={() => update('fade', !ps.fade)} colorOn="bg-creator-pink border-creator-pink" />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl border border-subtle-ash bg-light-linen">
                    <div>
                      <ControlLabel>Once</ControlLabel>
                      <p className="text-[9px] text-graphite-border mt-0.5">lock at 100%</p>
                    </div>
                    <Toggle on={ps.once} onToggle={() => update('once', !ps.once)} colorOn="bg-lime-glow border-lime-glow" />
                  </div>
                </div>
              </div>
            )}

            {/* ── Visual tab ─────────────────────────────────────────── */}
            {activeTab === 'visual' && (
              <div className="p-4 space-y-4">
                {/* Stroke Color */}
                <div className="p-3 rounded-xl border border-subtle-ash bg-light-linen space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <ControlLabel>Stroke Color</ControlLabel>
                      <p className="text-[9px] text-graphite-border mt-0.5">interpolate from → to</p>
                    </div>
                    <Toggle on={ps.useColor} onToggle={() => update('useColor', !ps.useColor)} colorOn="bg-creator-pink border-creator-pink" />
                  </div>
                  <div className={`flex items-center gap-3 transition-opacity ${ps.useColor ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                    <div className="flex flex-col items-center gap-1">
                      <input type="color" value={ps.colorFrom} onChange={e => update('colorFrom', e.target.value)}
                        className="w-10 h-10 rounded-lg cursor-pointer border-2 border-pitch-black p-0.5 bg-transparent" />
                      <span className="text-[9px] font-mono text-graphite-border">from</span>
                    </div>
                    <div className="flex-1 h-3 rounded-full border border-subtle-ash overflow-hidden" style={{ background: `linear-gradient(to right, ${ps.colorFrom}, ${ps.colorTo})` }} />
                    <div className="flex flex-col items-center gap-1">
                      <input type="color" value={ps.colorTo} onChange={e => update('colorTo', e.target.value)}
                        className="w-10 h-10 rounded-lg cursor-pointer border-2 border-pitch-black p-0.5 bg-transparent" />
                      <span className="text-[9px] font-mono text-graphite-border">to</span>
                    </div>
                  </div>
                </div>

                {/* Stroke Width */}
                <div className="p-3 rounded-xl border border-subtle-ash bg-light-linen space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <ControlLabel>Stroke Width</ControlLabel>
                      <p className="text-[9px] text-graphite-border mt-0.5">thin → thick</p>
                    </div>
                    <Toggle on={ps.useWidth} onToggle={() => update('useWidth', !ps.useWidth)} colorOn="bg-sunshine-yellow border-sunshine-yellow" />
                  </div>
                  <div className={`flex items-center gap-2 transition-opacity ${ps.useWidth ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                    <div className="flex flex-col items-center gap-1">
                      <input type="number" value={ps.widthFrom} min={0.5} max={10} step={0.5}
                        onChange={e => update('widthFrom', parseFloat(e.target.value))}
                        className="w-14 text-center font-mono text-[12px] border border-pitch-black rounded-lg px-2 py-1.5 focus:outline-none bg-light-linen" />
                      <span className="text-[9px] font-mono text-graphite-border">from</span>
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                      <span className="text-graphite-border text-sm">→</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <input type="number" value={ps.widthTo} min={0.5} max={20} step={0.5}
                        onChange={e => update('widthTo', parseFloat(e.target.value))}
                        className="w-14 text-center font-mono text-[12px] border border-pitch-black rounded-lg px-2 py-1.5 focus:outline-none bg-light-linen" />
                      <span className="text-[9px] font-mono text-graphite-border">to</span>
                    </div>
                  </div>
                </div>

                {/* Fill Opacity */}
                <div className="p-3 rounded-xl border border-subtle-ash bg-light-linen space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <ControlLabel>Fill Opacity</ControlLabel>
                      <p className="text-[9px] text-graphite-border mt-0.5">flood fill as stroke draws</p>
                    </div>
                    <Toggle on={ps.useFillOpacity} onToggle={() => update('useFillOpacity', !ps.useFillOpacity)} colorOn="bg-sunshine-yellow border-sunshine-yellow" />
                  </div>
                  <div className={`flex items-center gap-2 transition-opacity ${ps.useFillOpacity ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                    {[
                      { key: 'fillOpacityFrom' as const, label: 'from' },
                      { key: 'fillOpacityTo' as const, label: 'to' },
                    ].map(({ key, label }) => (
                      <div key={key} className="flex flex-col items-center gap-1 flex-1">
                        <input type="number" value={ps[key]} min={0} max={1} step={0.1}
                          onChange={e => update(key, parseFloat(e.target.value))}
                          className="w-full text-center font-mono text-[12px] border border-pitch-black rounded-lg px-2 py-1.5 focus:outline-none bg-light-linen" />
                        <span className="text-[9px] font-mono text-graphite-border">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Effects tab ────────────────────────────────────────── */}
            {activeTab === 'effects' && (
              <div className="p-4 space-y-4">
                {/* Clip */}
                <div className="p-3 rounded-xl border border-subtle-ash bg-light-linen space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <ControlLabel>Clip Reveal</ControlLabel>
                      <p className="text-[9px] text-graphite-border mt-0.5">clip-path instead of dashoffset</p>
                    </div>
                    <Toggle on={ps.useClip} onToggle={() => update('useClip', !ps.useClip)} colorOn="bg-creator-pink border-creator-pink" />
                  </div>
                  <div className={`space-y-2 transition-opacity ${ps.useClip ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                    <ControlLabel>Direction</ControlLabel>
                    <div className="grid grid-cols-5 gap-1">
                      {(['left', 'right', 'top', 'bottom', 'center'] as ClipDir[]).map(d => (
                        <button key={d} onClick={() => update('clipDir', d)}
                          className={`py-1.5 text-[9px] font-mono rounded-lg border transition-all font-bold uppercase tracking-wide ${
                            ps.clipDir === d
                              ? 'bg-pitch-black text-light-linen border-pitch-black'
                              : 'border-subtle-ash text-graphite-border hover:border-pitch-black'
                          }`}>
                          {d === 'center' ? '◎' : d === 'left' ? '←' : d === 'right' ? '→' : d === 'top' ? '↑' : '↓'}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2 text-[9px] font-mono text-graphite-border justify-between px-0.5">
                      <span>left</span><span>right</span><span>top</span><span>btm</span><span>ctr</span>
                    </div>
                  </div>
                </div>

                {/* MorphTo */}
                <div className="p-3 rounded-xl border border-subtle-ash bg-light-linen space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <ControlLabel>Path Morph</ControlLabel>
                      <p className="text-[9px] text-graphite-border mt-0.5">interpolate shape on scroll</p>
                    </div>
                    <Toggle on={ps.useMorphTo} onToggle={() => update('useMorphTo', !ps.useMorphTo)} colorOn="bg-lime-glow border-lime-glow" />
                  </div>
                  <div className={`space-y-1.5 transition-opacity ${ps.useMorphTo ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                    <ControlLabel>Target path d</ControlLabel>
                    <textarea
                      rows={3}
                      value={ps.morphTo}
                      onChange={e => update('morphTo', e.target.value)}
                      placeholder="M ... target path d attribute (must have same command count)"
                      className="w-full resize-none font-mono text-[10px] border border-pitch-black rounded-lg px-2.5 py-2 bg-[#f8f8f5] focus:outline-none focus:bg-light-linen transition-colors leading-relaxed"
                    />
                    <p className="text-[9px] text-graphite-border leading-relaxed">
                      Source and target must have the same number of numeric tokens. Try the <button className="underline hover:text-pitch-black transition-colors" onClick={() => loadExample(6)}>Morph example</button>.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ── Code tab ───────────────────────────────────────────── */}
            {activeTab === 'code' && (
              <div className="p-4 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <ControlLabel>Generated snippet</ControlLabel>
                    <CopyButton text={codeLines} />
                  </div>
                  <pre className="text-[11px] font-mono bg-[#141412] text-[#e8e8e3] rounded-xl p-4 overflow-x-auto leading-[1.8] whitespace-pre border border-pitch-black shadow-[2px_2px_0px_#000]">
                    {codeLines}
                  </pre>
                </div>

                <div className="space-y-2">
                  <ControlLabel>Active options</ControlLabel>
                  {activeFeatureTags.length === 0 ? (
                    <p className="text-[11px] text-graphite-border font-mono">Only core options active (easing, speed).</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {activeFeatureTags.map(t => (
                        <span key={t} className="text-[10px] font-mono font-bold uppercase tracking-wide px-2 py-1 rounded-full bg-creator-pink/20 border border-creator-pink/40 text-pitch-black">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-3 rounded-xl border border-sunshine-yellow/40 bg-sunshine-yellow/5 space-y-2">
                  <ControlLabel>Usage</ControlLabel>
                  <p className="text-[11px] text-graphite-border leading-relaxed">
                    This playground simulates scroll progress via a scrubber. In production, wrap your SVG with{' '}
                    <code className="font-mono bg-marketplace-gray px-1 rounded text-pitch-black">{'<ScrollDraw>'}</code>{' '}
                    and the animation follows the scroll position automatically.
                  </p>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>}
    </div>
  );
}
