'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { scrollText } from 'svg-scroll-draw/text';
import type { ScrollDrawInstance } from 'svg-scroll-draw';
import { CopyButton } from './CopyButton';

type SplitMode = 'words' | 'chars' | 'lines';
type FromPreset = 'Fade Up' | 'Rotate In' | 'Scale';

const HEADLINE_TEXT = 'Scroll-driven text animation. Every word, every letter, every line.';

const FROM_PRESETS: Record<FromPreset, { opacity?: number; y?: number; rotate?: number; scale?: number; hint: string }> = {
  'Fade Up':   { opacity: 0, y: 28,  hint: 'opacity + translateY — the default entrance' },
  'Rotate In': { opacity: 0, rotate: 12, y: 16, hint: 'rotate + translateY — dramatic, editorial' },
  'Scale':     { opacity: 0, scale: 0.7, hint: 'scale + opacity — zooms in from below 1' },
};

const SPLIT_MODES: SplitMode[] = ['words', 'chars', 'lines'];

function buildCode(split: SplitMode, stagger: number, preset: FromPreset): string {
  const from = FROM_PRESETS[preset];
  const fromLines = Object.entries(from)
    .filter(([k]) => k !== 'hint')
    .map(([k, v]) => `    ${k}: ${v},`)
    .join('\n');
  return `import { scrollText } from 'svg-scroll-draw/text';

scrollText('#headline', {
  split:   '${split}',
  stagger: ${stagger.toFixed(2)},
  from: {
${fromLines}
  },
  once: true,
});`;
}

export function ScrollTextInteractive() {
  const textRef      = useRef<HTMLHeadingElement>(null);
  const instanceRef  = useRef<ScrollDrawInstance | null>(null);
  const rafRef       = useRef(0);
  const hasPlayedRef = useRef(false);
  const isMountRef   = useRef(true);

  const [split,    setSplit]    = useState<SplitMode>('words');
  const [stagger,  setStagger]  = useState(0.05);
  const [preset,   setPreset]   = useState<FromPreset>('Fade Up');
  const [progress, setProgress] = useState(0);
  const [playing,  setPlaying]  = useState(false);

  const buildEngine = useCallback((s: SplitMode, st: number, p: FromPreset) => {
    instanceRef.current?.destroy();
    instanceRef.current = null;

    const el = textRef.current;
    if (!el) return;

    // Restore original text before re-splitting
    el.textContent = HEADLINE_TEXT;

    const { hint: _h, ...fromOpts } = FROM_PRESETS[p];
    instanceRef.current = scrollText(el, {
      split:   s,
      stagger: st,
      from:    fromOpts,
      once:    true,
      trigger: { start: 'top bottom', end: 'bottom top' },
    });
    instanceRef.current.seek(0);
  }, []);

  const autoPlay = useCallback(() => {
    if (!instanceRef.current) return;
    cancelAnimationFrame(rafRef.current);
    const start = performance.now();
    const dur   = 1200;
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

  // Mount: init + auto-play on viewport entry
  useEffect(() => {
    buildEngine('words', 0.05, 'Fade Up');

    const sentinel = textRef.current;
    if (!sentinel) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasPlayedRef.current) {
          hasPlayedRef.current = true;
          autoPlay();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(sentinel);
    return () => io.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Rebuild on setting change (skip first render)
  useEffect(() => {
    if (isMountRef.current) { isMountRef.current = false; return; }
    buildEngine(split, stagger, preset);
    setProgress(0);
    setTimeout(autoPlay, 60);
  }, [split, stagger, preset]); // eslint-disable-line react-hooks/exhaustive-deps

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
    buildEngine(split, stagger, preset);
    setProgress(0);
    setTimeout(autoPlay, 30);
  };

  const code = buildCode(split, stagger, preset);

  return (
    <section className="relative border-b border-pitch-black bg-marketplace-gray overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-12 py-12 sm:py-16 md:py-24">

        {/* Header */}
        <div className="mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-graphite-border border border-subtle-ash rounded-full px-3 py-1.5 font-medium mb-4 bg-light-linen">
            <span className="w-1.5 h-1.5 rounded-full bg-creator-pink animate-pulse" />
            v2.2.0 · scrollText · interactive
          </div>
          <h2 className="font-display font-extrabold text-[clamp(26px,5vw,52px)] leading-[0.95] tracking-[-0.03em]">
            Split text, stagger animate.<br />
            <span className="text-graphite-border">Free GSAP SplitText replacement.</span>
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">

          {/* ── Left: controls ── */}
          <div className="flex flex-col gap-5">

            {/* Split mode */}
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] font-semibold text-graphite-border mb-2.5">Split by</p>
              <div className="flex gap-2">
                {SPLIT_MODES.map((m) => (
                  <button
                    key={m}
                    onClick={() => setSplit(m)}
                    className={`text-[12px] font-mono px-4 py-2.5 rounded-xl border transition-all ${
                      split === m
                        ? 'bg-pitch-black text-light-linen border-pitch-black shadow-[2px_2px_0px_rgba(0,0,0,0.25)]'
                        : 'bg-light-linen text-graphite-border border-subtle-ash hover:border-pitch-black hover:text-pitch-black'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* From preset */}
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] font-semibold text-graphite-border mb-2.5">Animation preset</p>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(FROM_PRESETS) as FromPreset[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPreset(p)}
                    className={`text-[12px] font-mono px-3 py-2.5 rounded-xl border transition-all text-left ${
                      preset === p
                        ? 'bg-pitch-black text-light-linen border-pitch-black shadow-[2px_2px_0px_rgba(0,0,0,0.25)]'
                        : 'bg-light-linen text-graphite-border border-subtle-ash hover:border-pitch-black hover:text-pitch-black'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-graphite-border mt-2 font-mono">{FROM_PRESETS[preset].hint}</p>
            </div>

            {/* Stagger slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] uppercase tracking-[0.22em] font-semibold text-graphite-border">Stagger</p>
                <span className="text-[11px] font-mono text-pitch-black font-bold">{stagger.toFixed(2)}</span>
              </div>
              <input
                type="range" min={0} max={0.1} step={0.005} value={stagger}
                aria-label="Stagger between units"
                onChange={(e) => setStagger(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-graphite-border mt-1">
                <span>0 (all at once)</span>
                <span>0.10 (slowest cascade)</span>
              </div>
            </div>

            {/* Progress scrubber */}
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
                <span>hidden</span>
                <span>fully revealed</span>
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
                <span className="text-[11px] text-[#888] font-mono">scroll-text.js</span>
                <CopyButton text={code} />
              </div>
              <pre className="bg-[#1c1c1c] text-[#e8e8e3] px-4 py-4 text-[11px] sm:text-[12px] font-mono leading-[1.8] overflow-x-auto">
                {code}
              </pre>
            </div>

          </div>

          {/* ── Right: live preview ── */}
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="rounded-2xl border border-pitch-black bg-light-linen shadow-[4px_4px_0px_#000] w-full min-h-[360px] overflow-hidden">
              <div className="w-full h-full min-h-[360px] flex flex-col items-center justify-center p-8 sm:p-12 gap-6">
                {/* Badge */}
                <div className="flex items-center gap-2 bg-creator-pink border border-pitch-black rounded-full px-3 py-1 self-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-pitch-black" />
                  <span className="text-[10px] font-mono font-bold uppercase tracking-[0.14em]">scrollText</span>
                </div>

                {/* The animated headline */}
                <h3
                  ref={textRef}
                  className="font-display font-extrabold text-[clamp(22px,3.5vw,34px)] leading-[1.1] tracking-[-0.03em] text-pitch-black w-full"
                >
                  {HEADLINE_TEXT}
                </h3>

                {/* Split mode indicator */}
                <div className="flex items-center gap-2 self-start mt-auto">
                  <span className="text-[10px] font-mono text-graphite-border uppercase tracking-[0.14em]">split:</span>
                  <span className="text-[11px] font-mono bg-marketplace-gray border border-subtle-ash px-2 py-0.5 rounded-md text-pitch-black">{split}</span>
                  <span className="text-[10px] font-mono text-graphite-border uppercase tracking-[0.14em] ml-2">stagger:</span>
                  <span className="text-[11px] font-mono bg-marketplace-gray border border-subtle-ash px-2 py-0.5 rounded-md text-pitch-black">{stagger.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <p className="text-[11px] font-mono text-graphite-border text-center">
              Drag scrubber · switch split mode · change preset · adjust stagger
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}
