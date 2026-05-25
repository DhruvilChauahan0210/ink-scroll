'use client';
import { useState, useRef, useEffect, useCallback } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────

type EasingName = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';

interface PlayState {
  svg: string;
  easing: EasingName;
  speed: number;
  fade: boolean;
  stagger: number;
  direction: 'forward' | 'reverse';
}

// ── Constants ──────────────────────────────────────────────────────────────────

const EASINGS: Record<EasingName, (t: number) => number> = {
  linear:       t => t,
  'ease-in':    t => t * t,
  'ease-out':   t => t * (2 - t),
  'ease-in-out':t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
};

const SELECTOR = 'path, polyline, line, polygon, rect, circle';

const EXAMPLES = [
  {
    label: 'Geometric',
    svg: `<svg width="300" height="300" viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="150" cy="150" r="120" stroke="#ff90e8" stroke-width="2.5"/>
  <path d="M 30 150 C 30 80 90 20 150 20 S 270 80 270 150" stroke="#000" stroke-width="2" stroke-linecap="round"/>
  <path d="M 60 210 Q 150 270 240 210" stroke="#ffc900" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="150" y1="30" x2="150" y2="270" stroke="#000" stroke-width="1" stroke-dasharray="6 4" opacity="0.25"/>
  <line x1="30" y1="150" x2="270" y2="150" stroke="#000" stroke-width="1" stroke-dasharray="6 4" opacity="0.25"/>
</svg>`,
  },
  {
    label: 'Signature',
    svg: `<svg width="300" height="140" viewBox="0 0 300 140" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M 15 105 C 30 15 75 15 95 75 C 110 125 130 45 155 75 C 175 105 195 25 225 65 C 255 105 265 88 285 82" stroke="#000" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`,
  },
  {
    label: 'Diagram',
    svg: `<svg width="300" height="200" viewBox="0 0 300 200" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="20" y="70" width="80" height="60" stroke="#000" stroke-width="2" rx="4"/>
  <rect x="200" y="70" width="80" height="60" stroke="#ff90e8" stroke-width="2" rx="4"/>
  <path d="M 100 100 L 188 100" stroke="#000" stroke-width="2" stroke-linecap="round"/>
  <path d="M 174 87 L 190 100 L 174 113" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M 60 70 C 60 28 240 28 240 70" stroke="#ffc900" stroke-width="1.5" stroke-dasharray="5 4" stroke-linecap="round"/>
</svg>`,
  },
  {
    label: 'Infinity',
    svg: `<svg width="300" height="160" viewBox="0 0 300 160" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M 150 80 C 150 80 115 22 65 22 C 15 22 15 138 65 138 C 115 138 150 80 150 80 C 150 80 185 22 235 22 C 285 22 285 138 235 138 C 185 138 150 80 150 80 Z" stroke="#000" stroke-width="3" stroke-linecap="round"/>
</svg>`,
  },
];

const DEFAULT_STATE: PlayState = {
  svg: EXAMPLES[0].svg,
  easing: 'ease-out',
  speed: 1,
  fade: false,
  stagger: 0,
  direction: 'forward',
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function getLen(el: SVGElement): number {
  const tag = el.tagName.toLowerCase();
  if (tag === 'rect') {
    const w = parseFloat(el.getAttribute('width') ?? '0');
    const h = parseFloat(el.getAttribute('height') ?? '0');
    return 2 * (w + h);
  }
  if (tag === 'circle') {
    const r = parseFloat(el.getAttribute('r') ?? '0');
    return 2 * Math.PI * r;
  }
  try { return (el as SVGGeometryElement).getTotalLength(); }
  catch { return 0; }
}

function sanitizeSvg(code: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(code.trim(), 'image/svg+xml');
  const err = doc.querySelector('parsererror');
  if (err) throw new Error('Invalid SVG — check your syntax.');
  const svg = doc.documentElement;
  svg.querySelectorAll('script, foreignObject').forEach(el => el.remove());
  svg.querySelectorAll('*').forEach(el => {
    Array.from(el.attributes).forEach(a => {
      if (a.name.startsWith('on')) el.removeAttribute(a.name);
    });
  });
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  if (!svg.hasAttribute('preserveAspectRatio')) {
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  }
  return svg.outerHTML;
}

function encodeState(s: PlayState): string {
  try { return btoa(encodeURIComponent(JSON.stringify(s))); }
  catch { return ''; }
}

function decodeState(str: string): PlayState | null {
  try { return JSON.parse(decodeURIComponent(atob(str))); }
  catch { return null; }
}

function initElements(container: HTMLDivElement, ps: PlayState) {
  const els = Array.from(container.querySelectorAll<SVGElement>(SELECTOR));
  els.forEach(el => {
    const len = getLen(el);
    if (!len) return;
    el.style.strokeDasharray = `${len}`;
    el.style.strokeDashoffset = ps.direction === 'reverse' ? '0' : `${len}`;
    if (ps.fade) el.style.opacity = ps.direction === 'reverse' ? '1' : '0';
    else el.style.opacity = '';
  });
}

// ── Component ──────────────────────────────────────────────────────────────────

export function SvgPlayground() {
  // Load state from URL hash on first render
  const [ps, setPs] = useState<PlayState>(() => {
    if (typeof window === 'undefined') return DEFAULT_STATE;
    const m = window.location.hash.slice(1).match(/^p=(.+)$/);
    if (m) { const decoded = decodeState(m[1]); if (decoded) return decoded; }
    return DEFAULT_STATE;
  });

  const [rawSvg, setRawSvg] = useState(ps.svg);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareMsg, setShareMsg] = useState('');
  const [activeExample, setActiveExample] = useState(0);

  // Refs to avoid stale closures in rAF loop
  const previewRef   = useRef<HTMLDivElement>(null);
  const psRef        = useRef(ps);
  const progressRef  = useRef(0);
  const playingRef   = useRef(false);
  const rafRef       = useRef(0);
  const startTimeRef = useRef(0);
  const debounceRef  = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Keep psRef in sync
  useEffect(() => { psRef.current = ps; }, [ps]);

  // ── Apply current progress to DOM ──────────────────────────────────────────

  const applyProgress = useCallback((p: number, state: PlayState) => {
    const container = previewRef.current;
    if (!container) return;
    const els = Array.from(container.querySelectorAll<SVGElement>(SELECTOR));
    els.forEach((el, i) => {
      const len = getLen(el);
      if (!len) return;
      const shifted = Math.min(1, Math.max(0, p - i * state.stagger));
      const alpha = EASINGS[state.easing](shifted);
      el.style.strokeDashoffset =
        state.direction === 'reverse' ? `${len * alpha}` : `${len * (1 - alpha)}`;
      if (state.fade) {
        el.style.opacity = state.direction === 'reverse' ? `${1 - alpha}` : `${alpha}`;
      }
    });
  }, []);

  // ── Re-inject SVG when ps changes ─────────────────────────────────────────

  useEffect(() => {
    const container = previewRef.current;
    if (!container) return;
    try {
      container.innerHTML = sanitizeSvg(ps.svg);
      initElements(container, ps);
      applyProgress(progressRef.current, ps);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [ps, applyProgress]);

  // ── rAF play loop ──────────────────────────────────────────────────────────

  useEffect(() => {
    playingRef.current = isPlaying;
    cancelAnimationFrame(rafRef.current);
    if (!isPlaying) return;

    const duration = 2000 / psRef.current.speed;
    startTimeRef.current = performance.now() - progressRef.current * duration;

    function tick(now: number) {
      if (!playingRef.current) return;
      const elapsed = now - startTimeRef.current;
      const p = Math.min(1, elapsed / duration);
      progressRef.current = p;
      setProgress(p);
      applyProgress(p, psRef.current);
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setTimeout(() => {
          if (!playingRef.current) return;
          progressRef.current = 0;
          setProgress(0);
          startTimeRef.current = performance.now();
          rafRef.current = requestAnimationFrame(tick);
        }, 700);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying, applyProgress]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleSvgChange(code: string) {
    setRawSvg(code);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPs(s => ({ ...s, svg: code }));
      setActiveExample(-1);
    }, 450);
  }

  function handleSlider(e: React.ChangeEvent<HTMLInputElement>) {
    setIsPlaying(false);
    const p = parseFloat(e.target.value);
    progressRef.current = p;
    setProgress(p);
    applyProgress(p, ps);
  }

  function togglePlay() { setIsPlaying(v => !v); }

  function handleReset() {
    setIsPlaying(false);
    progressRef.current = 0;
    setProgress(0);
    applyProgress(0, ps);
  }

  function handleShare() {
    const encoded = encodeState({ ...ps, svg: rawSvg });
    const url = `${window.location.origin}${window.location.pathname}#p=${encoded}`;
    window.history.replaceState(null, '', `#p=${encoded}`);
    navigator.clipboard.writeText(url).then(() => {
      setShareMsg('Link copied!');
      setTimeout(() => setShareMsg(''), 2500);
    });
  }

  function loadExample(idx: number) {
    const ex = EXAMPLES[idx];
    setActiveExample(idx);
    setRawSvg(ex.svg);
    setPs(s => ({ ...s, svg: ex.svg }));
    handleReset();
  }

  function update<K extends keyof PlayState>(key: K, value: PlayState[K]) {
    setPs(s => {
      const next = { ...s, [key]: value };
      // Apply immediately to current progress
      setTimeout(() => applyProgress(progressRef.current, next), 0);
      return next;
    });
  }

  const pct = Math.round(progress * 100);

  return (
    <div className="flex flex-col min-h-screen bg-light-linen text-pitch-black">

      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-light-linen/95 backdrop-blur-sm border-b border-pitch-black flex items-center justify-between px-6 h-14 shrink-0">
        <div className="flex items-center gap-4">
          <a href="/" className="flex items-center gap-1.5 text-sm font-medium text-graphite-border hover:text-pitch-black transition-colors">
            <span>←</span>
            <span className="font-display font-bold text-sm tracking-tight text-pitch-black">svg-scroll-draw</span>
          </a>
          <span className="text-subtle-ash">/</span>
          <span className="text-sm font-medium">Playground</span>
        </div>
        <button
          onClick={handleShare}
          className={`text-sm px-4 py-1.5 rounded-full border font-medium transition-all ${
            shareMsg
              ? 'bg-lime-glow border-lime-glow text-pitch-black'
              : 'border-pitch-black bg-light-linen hover:bg-pitch-black hover:text-light-linen'
          }`}
        >
          {shareMsg || 'Share ↗'}
        </button>
      </nav>

      {/* ── Examples bar ────────────────────────────────────────────── */}
      <div className="border-b border-pitch-black px-6 py-3 flex items-center gap-2 overflow-x-auto shrink-0 bg-marketplace-gray">
        <span className="text-[11px] uppercase tracking-[0.18em] text-graphite-border font-medium shrink-0 mr-1">Examples</span>
        {EXAMPLES.map((ex, i) => (
          <button
            key={ex.label}
            onClick={() => loadExample(i)}
            className={`shrink-0 text-[12px] font-mono px-3 py-1 rounded-full border transition-all ${
              activeExample === i
                ? 'bg-pitch-black text-light-linen border-pitch-black'
                : 'border-subtle-ash hover:border-pitch-black text-graphite-border hover:text-pitch-black'
            }`}
          >
            {ex.label}
          </button>
        ))}
        <span className="text-subtle-ash shrink-0">·</span>
        <span className="text-[11px] text-graphite-border font-mono shrink-0">or paste your own SVG →</span>
      </div>

      {/* ── Main panels ─────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row flex-1 min-h-0 border-b border-pitch-black">

        {/* Editor */}
        <div className="flex flex-col lg:w-[45%] border-b lg:border-b-0 lg:border-r border-pitch-black">
          <div className="bg-[#111] dark:bg-[#1a1a1a] flex items-center justify-between px-4 py-2.5 border-b border-[#2a2a2a] shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#444]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#444]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#444]" />
            </div>
            <span className="text-[11px] text-[#666] font-mono tracking-wide">SVG Editor</span>
            <span className="text-[11px] font-mono text-[#555]">
              {rawSvg.length.toLocaleString()} chars
            </span>
          </div>
          <textarea
            value={rawSvg}
            onChange={e => handleSvgChange(e.target.value)}
            spellCheck={false}
            className="flex-1 resize-none bg-[#1a1a18] text-[#e8e8e3] font-mono text-[13px] leading-[1.75] p-5 outline-none min-h-[240px] lg:min-h-0"
            placeholder="Paste your SVG code here…"
          />
          {error && (
            <div className="shrink-0 px-4 py-2.5 bg-firecracker-orange/10 border-t border-firecracker-orange/30 text-[12px] font-mono text-firecracker-orange">
              ⚠ {error}
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 flex items-center justify-center p-8 min-h-[260px]">
            <div
              ref={previewRef}
              className="w-full h-full max-w-[400px] max-h-[400px] flex items-center justify-center [&>svg]:max-w-full [&>svg]:max-h-full"
            />
          </div>

          {/* Progress bar + play controls */}
          <div className="border-t border-subtle-ash px-6 py-4 shrink-0 space-y-3">
            {/* Scrubber */}
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="shrink-0 w-9 h-9 rounded-full border border-pitch-black flex items-center justify-center hover:bg-pitch-black hover:text-light-linen transition-colors font-mono text-sm"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? '⏸' : '▶'}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.001"
                value={progress}
                onChange={handleSlider}
                className="flex-1 accent-pitch-black h-1.5 cursor-pointer"
              />
              <button
                onClick={handleReset}
                className="shrink-0 w-9 h-9 rounded-full border border-subtle-ash flex items-center justify-center hover:border-pitch-black transition-colors text-sm"
                aria-label="Reset"
              >
                ↺
              </button>
              <span className="shrink-0 w-10 text-right font-mono text-[13px] text-graphite-border">
                {pct}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Controls ────────────────────────────────────────────────── */}
      <div className="px-6 py-5 bg-marketplace-gray border-b border-pitch-black shrink-0">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">

          {/* Easing */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase tracking-[0.18em] font-medium text-graphite-border">Easing</label>
            <select
              value={ps.easing}
              onChange={e => update('easing', e.target.value as EasingName)}
              className="font-mono text-[13px] border border-pitch-black rounded-lg px-2.5 py-1.5 bg-light-linen appearance-none cursor-pointer focus:outline-none hover:bg-pitch-black hover:text-light-linen transition-colors"
            >
              {(['linear', 'ease-in', 'ease-out', 'ease-in-out'] as EasingName[]).map(e => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>

          {/* Speed */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase tracking-[0.18em] font-medium text-graphite-border">
              Speed <span className="font-mono normal-case">{ps.speed.toFixed(1)}×</span>
            </label>
            <input
              type="range"
              min="0.25"
              max="3"
              step="0.05"
              value={ps.speed}
              onChange={e => update('speed', parseFloat(e.target.value))}
              className="accent-pitch-black h-1.5 cursor-pointer mt-1"
            />
          </div>

          {/* Stagger */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase tracking-[0.18em] font-medium text-graphite-border">
              Stagger <span className="font-mono normal-case">{ps.stagger.toFixed(2)}</span>
            </label>
            <input
              type="range"
              min="0"
              max="0.5"
              step="0.01"
              value={ps.stagger}
              onChange={e => update('stagger', parseFloat(e.target.value))}
              className="accent-pitch-black h-1.5 cursor-pointer mt-1"
            />
          </div>

          {/* Direction */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase tracking-[0.18em] font-medium text-graphite-border">Direction</label>
            <div className="flex gap-1">
              {(['forward', 'reverse'] as const).map(d => (
                <button
                  key={d}
                  onClick={() => update('direction', d)}
                  className={`flex-1 text-[11px] font-mono py-1.5 rounded-lg border transition-all ${
                    ps.direction === d
                      ? 'bg-pitch-black text-light-linen border-pitch-black'
                      : 'border-subtle-ash text-graphite-border hover:border-pitch-black'
                  }`}
                >
                  {d === 'forward' ? '→' : '←'}
                </button>
              ))}
            </div>
          </div>

          {/* Fade */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase tracking-[0.18em] font-medium text-graphite-border">Fade</label>
            <button
              onClick={() => update('fade', !ps.fade)}
              className={`text-[12px] font-mono py-1.5 px-3 rounded-lg border transition-all text-left ${
                ps.fade
                  ? 'bg-creator-pink border-creator-pink text-pitch-black'
                  : 'border-subtle-ash text-graphite-border hover:border-pitch-black'
              }`}
            >
              {ps.fade ? '✓ on' : '○ off'}
            </button>
          </div>

          {/* Generated code snippet */}
          <div className="flex flex-col gap-1.5 col-span-2 sm:col-span-3 lg:col-span-1">
            <label className="text-[10px] uppercase tracking-[0.18em] font-medium text-graphite-border">Code</label>
            <div className="relative">
              <pre className="text-[10px] font-mono bg-[#1a1a18] text-[#e8e8e3] rounded-lg px-2.5 py-2 overflow-x-auto leading-relaxed whitespace-pre-wrap break-all">
{`<ScrollDraw
  easing="${ps.easing}"
  speed={${ps.speed.toFixed(1)}}${ps.fade ? '\n  fade' : ''}${ps.stagger > 0 ? `\n  stagger={${ps.stagger.toFixed(2)}}` : ''}${ps.direction === 'reverse' ? '\n  direction="reverse"' : ''}
>`}
              </pre>
            </div>
          </div>

        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="px-6 py-4 text-center text-[11px] font-mono text-graphite-border">
        Paste any SVG · tweak controls · hit Share to get a link ·{' '}
        <a href="/" className="underline underline-offset-2 hover:text-pitch-black transition-colors">back to docs</a>
      </footer>

    </div>
  );
}
