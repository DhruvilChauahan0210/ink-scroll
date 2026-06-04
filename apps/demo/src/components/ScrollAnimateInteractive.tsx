'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { scrollAnimate } from 'svg-scroll-draw';
import type { ScrollDrawInstance } from 'svg-scroll-draw';
import { CopyButton } from './CopyButton';

// ── Types ──────────────────────────────────────────────────────────────────────

type EffectKey = 'Fade + Slide' | 'Color Shift' | 'Scale + Fade' | 'Slide In';
type EasingKey = 'linear' | 'ease-out' | 'ease-in-out' | 'spring' | 'elastic';

// Color Shift targets the WRAPPER (background box) to show a section-level theme
// change — not the inner card, so fixed-color children (badge, pills) stay clean.
const COLOR_SHIFT_TARGET = 'wrapper' as const;

interface Effect {
  props: Record<string, string | number | [string | number, string | number]>;
  hint: string;
  target?: typeof COLOR_SHIFT_TARGET;
}

const EFFECTS: Record<EffectKey, Effect> = {
  'Fade + Slide': {
    props: { opacity: [0, 1], transform: ['translateY(36px)', 'translateY(0px)'] },
    hint: 'opacity + translateY — the most common scroll entrance',
  },
  'Color Shift': {
    // Applied to the preview wrapper, not the card — shows a section background change
    props: {
      backgroundColor: ['#f4f4f0', '#0f172a'],
      color:           ['#111111', '#e2e8f0'],
    },
    hint: 'background-color + color — section-level theme as you scroll',
    target: COLOR_SHIFT_TARGET,
  },
  'Scale + Fade': {
    props: { opacity: [0, 1], transform: ['scale(0.88) translateY(20px)', 'scale(1) translateY(0px)'] },
    hint: 'scale + opacity — cards, modals, feature highlights',
  },
  'Slide In': {
    props: { opacity: [0, 1], transform: ['translateX(-44px)', 'translateX(0px)'] },
    hint: 'translateX + opacity — sidebar items, list entries',
  },
};

const EASINGS: EasingKey[] = ['linear', 'ease-out', 'ease-in-out', 'spring', 'elastic'];

// ── Code builder ───────────────────────────────────────────────────────────────

function buildCode(effect: EffectKey, easing: EasingKey): string {
  const props = EFFECTS[effect].props;
  const lines = Object.entries(props).map(([k, v]) =>
    Array.isArray(v) ? `    ${k}: ['${v[0]}', '${v[1]}'],` : `    ${k}: '${v}',`
  );
  const selector = effect === 'Color Shift' ? '#section' : '#element';
  return `import { scrollAnimate } from 'svg-scroll-draw';

scrollAnimate('${selector}', {
  props: {
${lines.join('\n')}
  },
  easing: '${easing}',
  once:   true,
});`;
}

// ── Preview card (used for Fade+Slide, Scale+Fade, Slide In) ──────────────────

function PreviewCard({ cardRef }: { cardRef: React.RefObject<HTMLDivElement | null> }) {
  return (
    <div
      ref={cardRef}
      style={{
        borderRadius: 16,
        border: '1.5px solid #111',
        boxShadow: '4px 4px 0 #111',
        padding: '28px 24px',
        background: '#fff',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        width: '100%',
        maxWidth: 300,
        willChange: 'transform, opacity',
      }}
    >
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#ffeaa7', border: '1px solid #e6c300', borderRadius: 20, padding: '4px 12px', width: 'fit-content' }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#111' }} />
        <span style={{ fontFamily: 'var(--font-geist-mono, monospace)', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>scrollAnimate</span>
      </div>
      <div>
        <div style={{ fontFamily: 'var(--font-syne, system-ui)', fontWeight: 800, fontSize: 22, letterSpacing: '-0.03em', lineHeight: 1.1 }}>Any CSS property.</div>
        <div style={{ fontFamily: 'var(--font-syne, system-ui)', fontWeight: 800, fontSize: 22, letterSpacing: '-0.03em', lineHeight: 1.1, color: '#888' }}>Any element.</div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {['opacity', 'transform', 'color', 'background'].map(p => (
          <span key={p} style={{ fontFamily: 'var(--font-geist-mono, monospace)', fontSize: 10, background: '#f4f4f0', border: '1px solid #ddd', borderRadius: 6, padding: '2px 8px', color: '#555' }}>
            {p}
          </span>
        ))}
      </div>
      <div style={{ height: 36, borderRadius: 8, background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'var(--font-geist-mono, monospace)', fontSize: 11, color: '#fff', fontWeight: 600 }}>npm i svg-scroll-draw</span>
      </div>
    </div>
  );
}

// ── Color Shift preview — full-width section look ─────────────────────────────

function ColorShiftPreview({ wrapperRef }: { wrapperRef: React.RefObject<HTMLDivElement | null> }) {
  return (
    <div
      ref={wrapperRef}
      style={{
        width: '100%',
        borderRadius: 16,
        border: '1.5px solid #111',
        boxShadow: '4px 4px 0 #111',
        padding: '32px 28px',
        background: '#f4f4f0',
        willChange: 'background-color, color',
        transition: 'none',
      }}
    >
      {/* eyebrow */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', opacity: 0.4 }} />
        <span style={{ fontFamily: 'var(--font-geist-mono, monospace)', fontSize: 10, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', opacity: 0.5 }}>
          Section theme
        </span>
      </div>
      {/* headline */}
      <div style={{ fontFamily: 'var(--font-syne, system-ui)', fontWeight: 800, fontSize: 'clamp(20px,3vw,28px)', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 10 }}>
        Background + text
        <br />animate together.
      </div>
      {/* descriptor */}
      <div style={{ fontFamily: 'var(--font-geist-mono, monospace)', fontSize: 11, opacity: 0.4, letterSpacing: '0.04em', marginBottom: 20 }}>
        Scroll to 100% to see dark mode →
      </div>
      {/* mock code line */}
      <div style={{ borderRadius: 8, border: '1px solid', borderColor: 'currentColor', opacity: 0.15, padding: '10px 14px', fontFamily: 'var(--font-geist-mono, monospace)', fontSize: 11 }}>
        backgroundColor: [&apos;#f4f4f0&apos;, &apos;#0f172a&apos;]
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function ScrollAnimateInteractive() {
  const cardRef       = useRef<HTMLDivElement>(null);
  const wrapperRef    = useRef<HTMLDivElement>(null);
  const instanceRef   = useRef<ScrollDrawInstance | null>(null);
  const prevPropsRef  = useRef<{ el: HTMLElement; props: string[] } | null>(null);
  const rafRef        = useRef(0);
  const hasPlayedRef  = useRef(false);

  const [effect,   setEffect]   = useState<EffectKey>('Fade + Slide');
  const [easing,   setEasing]   = useState<EasingKey>('ease-out');
  const [progress, setProgress] = useState(0);
  const [playing,  setPlaying]  = useState(false);

  // Convert camelCase prop name to CSS kebab-case
  const toKebab = (k: string) => k.replace(/([A-Z])/g, m => `-${m.toLowerCase()}`);

  // Reset all inline styles from the previous effect's element
  const resetPrevStyles = useCallback(() => {
    if (!prevPropsRef.current) return;
    const { el, props } = prevPropsRef.current;
    props.forEach(p => el.style.removeProperty(p));
    el.style.removeProperty('--scroll-draw-progress');
    // Also explicitly restore background/color to empty so CSS rules take over
    el.style.removeProperty('background-color');
    el.style.removeProperty('color');
    el.style.removeProperty('opacity');
    el.style.removeProperty('transform');
  }, []);

  const buildEngine = useCallback((eff: EffectKey, eas: EasingKey) => {
    instanceRef.current?.destroy();
    instanceRef.current = null;
    resetPrevStyles();

    const isColorShift = EFFECTS[eff].target === COLOR_SHIFT_TARGET;
    const el = (isColorShift ? wrapperRef.current : cardRef.current);
    if (!el) return;

    // Track which props + element we're animating so we can reset later
    prevPropsRef.current = {
      el,
      props: Object.keys(EFFECTS[eff].props).map(toKebab),
    };

    instanceRef.current = scrollAnimate(el, {
      props:   EFFECTS[eff].props,
      easing:  eas,
      native:  false,
      trigger: { start: 'top bottom', end: 'bottom top' },
    });
    // Force from-state immediately
    instanceRef.current.seek(0);
  }, [resetPrevStyles]);

  // Animate progress from 0 → 1 over ~1000 ms
  const autoPlay = useCallback(() => {
    if (!instanceRef.current) return;
    cancelAnimationFrame(rafRef.current);
    const start = performance.now();
    const dur   = 1000;
    setPlaying(true);

    function tick(now: number) {
      const p = Math.min((now - start) / dur, 1);
      instanceRef.current?.seek(p);
      setProgress(p);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
      else setPlaying(false);
    }
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const isMountRef = useRef(true);

  // Mount: build initial engine + auto-play on viewport entry
  useEffect(() => {
    buildEngine('Fade + Slide', 'ease-out');

    const sentinel = cardRef.current;
    if (!sentinel) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasPlayedRef.current) {
          hasPlayedRef.current = true;
          autoPlay();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(sentinel);
    return () => io.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Effect / easing change: rebuild + replay (skip the very first render)
  useEffect(() => {
    if (isMountRef.current) { isMountRef.current = false; return; }
    buildEngine(effect, easing);
    setProgress(0);
    setTimeout(autoPlay, 60);
  }, [effect, easing]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount
  useEffect(() => () => {
    cancelAnimationFrame(rafRef.current);
    instanceRef.current?.destroy();
  }, []);

  const handleScrub = (p: number) => {
    cancelAnimationFrame(rafRef.current);
    setPlaying(false);
    setProgress(p);
    instanceRef.current?.seek(p);
  };

  const handleReplay = () => {
    if (playing) return;
    instanceRef.current?.seek(0);
    setProgress(0);
    autoPlay();
  };

  const isColorShift = effect === 'Color Shift';
  const code = buildCode(effect, easing);

  return (
    <section className="relative border-b border-pitch-black overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-12 py-12 sm:py-16 md:py-24">

        {/* Header */}
        <div className="mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-graphite-border border border-subtle-ash rounded-full px-3 py-1.5 font-medium mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-lime-glow animate-pulse" />
            v2.0.0 · scrollAnimate · interactive
          </div>
          <h2 className="font-display font-extrabold text-[clamp(26px,5vw,52px)] leading-[0.95] tracking-[-0.03em]">
            Animate any CSS property.<br />
            <span className="text-graphite-border">Try it live.</span>
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">

          {/* ── Left: controls ── */}
          <div className="flex flex-col gap-5">

            {/* Effect selector */}
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] font-semibold text-graphite-border mb-2.5">Effect</p>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(EFFECTS) as EffectKey[]).map((e) => (
                  <button
                    key={e}
                    onClick={() => setEffect(e)}
                    className={`text-[12px] font-mono px-3 py-2.5 rounded-xl border transition-all text-left ${
                      effect === e
                        ? 'bg-pitch-black text-light-linen border-pitch-black shadow-[2px_2px_0px_rgba(0,0,0,0.25)]'
                        : 'bg-transparent text-graphite-border border-subtle-ash hover:border-pitch-black hover:text-pitch-black'
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-graphite-border mt-2 font-mono">{EFFECTS[effect].hint}</p>
            </div>

            {/* Easing */}
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] font-semibold text-graphite-border mb-2.5">Easing</p>
              <div className="flex flex-wrap gap-1.5">
                {EASINGS.map((e) => (
                  <button
                    key={e}
                    onClick={() => setEasing(e)}
                    className={`text-[11px] font-mono px-3 py-1.5 rounded-full border transition-all ${
                      easing === e
                        ? 'bg-pitch-black text-light-linen border-pitch-black shadow-[2px_2px_0px_rgba(0,0,0,0.25)]'
                        : 'bg-transparent text-graphite-border border-subtle-ash hover:border-pitch-black hover:text-pitch-black'
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrubber */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] uppercase tracking-[0.22em] font-semibold text-graphite-border">Progress</p>
                <span className="text-[11px] font-mono text-pitch-black font-bold">{Math.round(progress * 100)}%</span>
              </div>
              <input
                type="range" min={0} max={1} step={0.01} value={progress}
                aria-label="Animation progress"
                onChange={(e) => handleScrub(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-graphite-border mt-1">
                <span>from state</span>
                <span>to state</span>
              </div>
            </div>

            {/* Replay */}
            <button
              onClick={handleReplay}
              disabled={playing}
              className={`text-[12px] font-bold px-5 py-2.5 rounded-full border-2 border-pitch-black transition-all w-fit ${
                playing
                  ? 'bg-subtle-ash text-graphite-border cursor-not-allowed opacity-60'
                  : 'bg-creator-pink text-pitch-black shadow-[2px_2px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none active:scale-95'
              }`}
            >
              {playing ? 'Playing…' : '↺  Replay'}
            </button>

            {/* Code */}
            <div className="rounded-xl overflow-hidden border border-pitch-black mt-auto">
              <div className="bg-[#111] flex items-center justify-between px-4 py-2">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#444]" />
                  <span className="w-2 h-2 rounded-full bg-[#444]" />
                  <span className="w-2 h-2 rounded-full bg-[#444]" />
                </div>
                <span className="text-[11px] text-[#888] font-mono">scroll-animate.js</span>
                <CopyButton text={code} />
              </div>
              <pre className="bg-[#1c1c1c] text-[#e8e8e3] px-4 py-4 text-[11px] sm:text-[12px] font-mono leading-[1.8] overflow-x-auto">
                {code}
              </pre>
            </div>

          </div>

          {/* ── Right: preview ── */}
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="rounded-2xl border border-pitch-black bg-[#f4f4f0] shadow-[4px_4px_0px_#000] w-full min-h-[360px] overflow-hidden relative">
              {/* Card preview — always mounted so cardRef stays valid */}
              <div
                style={{ display: isColorShift ? 'none' : 'flex' }}
                className="w-full h-full min-h-[360px] items-center justify-center p-8"
              >
                <PreviewCard cardRef={cardRef} />
              </div>

              {/* Color Shift preview — always mounted so wrapperRef stays valid */}
              <div
                style={{ display: isColorShift ? 'block' : 'none' }}
                className="w-full h-full min-h-[360px] p-8 flex items-center"
              >
                <ColorShiftPreview wrapperRef={wrapperRef} />
              </div>
            </div>
            <p className="text-[11px] font-mono text-graphite-border text-center">
              Drag the scrubber · switch effects · change easing
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}
