'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { scrollAnimate } from 'svg-scroll-draw';
import { scrollText } from 'svg-scroll-draw/text';
import { scrollCounter } from 'svg-scroll-draw';
import type { ScrollDrawInstance } from 'svg-scroll-draw';
import { CopyButton } from './CopyButton';

// ── Types ─────────────────────────────────────────────────────────────────────

type V2Tab      = 'options' | 'easing' | 'code';
type AnimEffect = 'Fade + Slide' | 'Scale + Fade' | 'Slide Left' | 'Rotate In' | 'Color Shift';
type TextSplit  = 'words' | 'chars' | 'lines';
type TextFrom   = 'Fade Up' | 'Rotate In' | 'Scale';
type EasingKey  = 'linear' | 'ease-out' | 'ease-in-out' | 'spring' | 'elastic';
type CounterFmt = 'currency' | 'integer' | 'percentage' | 'decimal';
type V2Api      = 'scrollAnimate' | 'scrollText' | 'scrollCounter';

interface V2Example {
  label: string;
  tag: string;
  api: V2Api;
  color: string;
  // API-specific defaults
  animEffect?:    AnimEffect;
  textSplit?:     TextSplit;
  textFrom?:      TextFrom;
  counterFmt?:    CounterFmt;
}

// ── Data ──────────────────────────────────────────────────────────────────────

const V2_EXAMPLES: V2Example[] = [
  { label: 'Fade Slide',  tag: 'opacity·y',    api: 'scrollAnimate', color: '#ff90e8', animEffect: 'Fade + Slide'  },
  { label: 'Scale Pop',   tag: 'scale·fade',   api: 'scrollAnimate', color: '#ff90e8', animEffect: 'Scale + Fade'  },
  { label: 'Slide Left',  tag: 'translateX',   api: 'scrollAnimate', color: '#ff90e8', animEffect: 'Slide Left'    },
  { label: 'Rotate In',   tag: 'rotate·fade',  api: 'scrollAnimate', color: '#ff90e8', animEffect: 'Rotate In'     },
  { label: 'Color Shift', tag: 'bg-color',     api: 'scrollAnimate', color: '#ffc900', animEffect: 'Color Shift'   },
  { label: 'Word Reveal', tag: 'split:words',  api: 'scrollText',    color: '#5865F2', textSplit: 'words', textFrom: 'Fade Up'   },
  { label: 'Char Flow',   tag: 'split:chars',  api: 'scrollText',    color: '#5865F2', textSplit: 'chars', textFrom: 'Rotate In' },
  { label: 'Line Drop',   tag: 'split:lines',  api: 'scrollText',    color: '#5865F2', textSplit: 'lines', textFrom: 'Fade Up'   },
  { label: '$Revenue',    tag: 'currency',     api: 'scrollCounter', color: '#22c55e', counterFmt: 'currency'    },
  { label: '50K+ Users',  tag: 'integer',      api: 'scrollCounter', color: '#22c55e', counterFmt: 'integer'     },
];

const ANIM_EFFECTS: Record<AnimEffect, Record<string, [string|number, string|number]>> = {
  'Fade + Slide':  { opacity: [0, 1], transform: ['translateY(40px)', 'translateY(0px)'] },
  'Scale + Fade':  { opacity: [0, 1], transform: ['scale(0.85) translateY(16px)', 'scale(1) translateY(0px)'] },
  'Slide Left':    { opacity: [0, 1], transform: ['translateX(-48px)', 'translateX(0px)'] },
  'Rotate In':     { opacity: [0, 1], transform: ['rotate(-6deg) translateY(24px)', 'rotate(0deg) translateY(0px)'] },
  'Color Shift':   { backgroundColor: ['#f4f4f0', '#0f172a'], color: ['#111111', '#e2e8f0'] },
};

const TEXT_FROMS: Record<TextFrom, object> = {
  'Fade Up':   { opacity: 0, y: 28 },
  'Rotate In': { opacity: 0, rotate: 12, y: 12 },
  'Scale':     { opacity: 0, scale: 0.7 },
};

const COUNTER_CONFIGS: Record<CounterFmt, { to: number; format: (n: number) => string; label: string }> = {
  currency:   { to: 1250000, format: n => '$' + Math.round(n).toLocaleString(),  label: 'Revenue'      },
  integer:    { to: 50000,   format: n => Math.round(n).toLocaleString() + '+',  label: 'Users'        },
  percentage: { to: 94.7,    format: n => n.toFixed(1) + '%',                    label: 'Satisfaction' },
  decimal:    { to: 9.0,     format: n => '~' + n.toFixed(1) + ' KB',            label: 'Bundle size'  },
};

const EASINGS: EasingKey[] = ['linear', 'ease-out', 'ease-in-out', 'spring', 'elastic'];

const TEXT_HEADLINE = 'Scroll-driven text animation. Every word. Every letter.';

// ── Code generator ────────────────────────────────────────────────────────────

function buildCode(ex: V2Example, easing: EasingKey, stagger: number): string {
  if (ex.api === 'scrollAnimate') {
    const effect = ex.animEffect ?? 'Fade + Slide';
    const props = ANIM_EFFECTS[effect];
    const lines = Object.entries(props).map(([k, [a, b]]) => `    ${k}: ['${a}', '${b}'],`).join('\n');
    return `import { scrollAnimate } from 'svg-scroll-draw';

scrollAnimate('#element', {
  props: {
${lines}
  },
  easing: '${easing}',
  once:   true,
});`;
  }
  if (ex.api === 'scrollText') {
    const from = TEXT_FROMS[ex.textFrom ?? 'Fade Up'] as Record<string, number>;
    const fromLines = Object.entries(from).map(([k, v]) => `    ${k}: ${v},`).join('\n');
    return `import { scrollText } from 'svg-scroll-draw/text';

scrollText('#headline', {
  split:   '${ex.textSplit ?? 'words'}',
  stagger: ${stagger.toFixed(2)},
  from: {
${fromLines}
  },
  once: true,
});`;
  }
  const fmt = ex.counterFmt ?? 'currency';
  const cc  = COUNTER_CONFIGS[fmt];
  return `import { scrollCounter } from 'svg-scroll-draw';

scrollCounter('#number', {
  to:     ${cc.to},
  format: n => '${fmt === 'currency' ? '$' : ''}' + ${
    fmt === 'currency' ? "Math.round(n).toLocaleString()"
    : fmt === 'integer' ? "Math.round(n).toLocaleString() + '+'"
    : fmt === 'percentage' ? "n.toFixed(1) + '%'"
    : "n.toFixed(1) + ' KB'"
  },
  easing: '${easing}',
  once:   true,
});`;
}

// ── Thumbnail mini-previews ───────────────────────────────────────────────────

function ExThumb({ ex, active }: { ex: V2Example; active: boolean }) {
  const col = active ? '#fff' : ex.color;
  if (ex.api === 'scrollAnimate') {
    return (
      <div style={{ width: '100%', height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 28, height: 20, borderRadius: 4, border: `1.5px solid ${col}`, opacity: 0.8 }} />
      </div>
    );
  }
  if (ex.api === 'scrollText') {
    return (
      <div style={{ width: '100%', height: 36, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', gap: 3, padding: '0 6px' }}>
        {[100, 80, 90].map((w, i) => (
          <div key={i} style={{ height: 2, width: `${w}%`, background: col, borderRadius: 1, opacity: active ? 0.8 : 0.6 }} />
        ))}
      </div>
    );
  }
  // scrollCounter
  return (
    <div style={{ width: '100%', height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 13, color: col, opacity: 0.9 }}>42</span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function PlaygroundV2Content() {
  const previewRef  = useRef<HTMLDivElement>(null);
  const instRef     = useRef<ScrollDrawInstance | null>(null);
  const rafRef      = useRef(0);
  const progressRef = useRef(0);
  const playingRef  = useRef(false);

  const [activeIdx,     setActiveIdx]     = useState(0);
  const [easing,        setEasing]        = useState<EasingKey>('ease-out');
  const [stagger,       setStagger]       = useState(0.05);
  const [activeTab,     setActiveTab]     = useState<V2Tab>('options');
  const [progress,      setProgress]      = useState(0);
  const [isPlaying,     setIsPlaying]     = useState(false);

  const pct = Math.round(progress * 100);
  const ex  = V2_EXAMPLES[activeIdx];

  // ── Build & initialise ─────────────────────────────────────────────────────

  const rebuild = useCallback((idx: number, eas: EasingKey, stag: number) => {
    instRef.current?.destroy();
    instRef.current = null;

    const wrap = previewRef.current;
    if (!wrap) return;
    wrap.innerHTML = '';

    const cur = V2_EXAMPLES[idx];
    const TR  = { start: 'top bottom', end: 'bottom top' };

    if (cur.api === 'scrollAnimate') {
      const isColor = cur.animEffect === 'Color Shift';
      const inner   = document.createElement('div');

      if (isColor) {
        inner.style.cssText = 'width:100%;border-radius:12px;border:1.5px solid #111;padding:24px 20px;background:#f4f4f0;will-change:background-color,color;';
        inner.innerHTML = '<div style="font-family:var(--font-syne,system-ui);font-weight:800;font-size:18px;letter-spacing:-0.03em;line-height:1.1;margin-bottom:8px;">Background + text<br>animate together.</div><div style="font-family:monospace;font-size:10px;opacity:0.4;">Scrub to 100% → dark mode</div>';
      } else {
        inner.style.cssText = 'background:#fff;border:1.5px solid #111;border-radius:14px;padding:20px 18px;box-shadow:3px 3px 0 #111;width:100%;max-width:240px;will-change:transform,opacity;';
        inner.innerHTML = '<div style="display:inline-flex;align-items:center;gap:5px;background:#ffeaa7;border:1px solid #e6c300;border-radius:20px;padding:3px 10px;margin-bottom:10px;"><span style="font-family:monospace;font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;">scrollAnimate</span></div><div style="font-family:var(--font-syne,system-ui);font-weight:800;font-size:17px;letter-spacing:-0.03em;line-height:1.1;margin-bottom:8px;">Any CSS property.<br><span style=\'color:#888\'>Any element.</span></div><div style="display:flex;gap:5px;flex-wrap:wrap;">' + ['opacity','transform','color'].map(p => `<span style="font-family:monospace;font-size:9px;background:#f4f4f0;border:1px solid #ddd;border-radius:4px;padding:2px 6px;color:#666">${p}</span>`).join('') + '</div>';
      }

      wrap.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;padding:24px;';
      wrap.appendChild(inner);

      instRef.current = scrollAnimate(isColor ? inner : inner, {
        props:   ANIM_EFFECTS[cur.animEffect ?? 'Fade + Slide'] as any,
        easing:  eas,
        native:  false,
        trigger: TR,
      });
    } else if (cur.api === 'scrollText') {
      wrap.style.cssText = 'width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;gap:16px;padding:28px;background:#0d0d0d;';
      const badge = document.createElement('div');
      badge.style.cssText = 'display:inline-flex;align-items:center;gap:5px;background:rgba(255,144,232,0.15);border:1px solid rgba(255,144,232,0.3);border-radius:20px;padding:3px 10px;width:fit-content;';
      badge.innerHTML = '<span style="font-family:monospace;font-size:9px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#ff90e8;">scrollText</span>';
      const h = document.createElement('h3');
      h.textContent = TEXT_HEADLINE;
      h.style.cssText = 'font-family:var(--font-syne,system-ui);font-weight:800;font-size:clamp(16px,2.5vw,22px);letter-spacing:-0.03em;line-height:1.1;color:#f5f5f5;margin:0;';
      wrap.appendChild(badge);
      wrap.appendChild(h);

      instRef.current = scrollText(h, {
        split:   cur.textSplit ?? 'words',
        stagger: stag,
        from:    TEXT_FROMS[cur.textFrom ?? 'Fade Up'] as any,
        once:    true,
        trigger: TR,
      });
    } else {
      wrap.style.cssText = 'width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;padding:28px;background:#fafaf8;';
      const fmt = cur.counterFmt ?? 'currency';
      const cc  = COUNTER_CONFIGS[fmt];
      const lbl = document.createElement('div');
      lbl.style.cssText = 'font-family:monospace;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:#999;margin-bottom:8px;';
      lbl.textContent = cc.label;
      const num = document.createElement('span');
      num.style.cssText = 'font-family:var(--font-syne,system-ui);font-weight:800;font-size:clamp(36px,5vw,54px);letter-spacing:-0.05em;line-height:1;display:block;';
      num.textContent = cc.format(0);
      wrap.appendChild(lbl);
      wrap.appendChild(num);

      instRef.current = scrollCounter(num, {
        to: cc.to, format: cc.format, easing: eas, once: true, trigger: TR,
      });
    }

    instRef.current?.seek(0);
    progressRef.current = 0;
    setProgress(0);
  }, []);

  // Init
  useEffect(() => { rebuild(0, 'ease-out', 0.05); return () => instRef.current?.destroy(); }, []); // eslint-disable-line

  // Rebuild on example / easing / stagger change
  const prevIdxRef    = useRef(-1);
  const prevEasRef    = useRef<EasingKey>('ease-out');
  const prevStagRef   = useRef(0.05);
  useEffect(() => {
    if (prevIdxRef.current === activeIdx && prevEasRef.current === easing && prevStagRef.current === stagger) return;
    prevIdxRef.current  = activeIdx;
    prevEasRef.current  = easing;
    prevStagRef.current = stagger;
    setIsPlaying(false);
    cancelAnimationFrame(rafRef.current);
    rebuild(activeIdx, easing, stagger);
  }, [activeIdx, easing, stagger, rebuild]);

  // Autoplay loop
  useEffect(() => {
    playingRef.current = isPlaying;
    cancelAnimationFrame(rafRef.current);
    if (!isPlaying) return;
    const dur   = 1200;
    const start = performance.now() - progressRef.current * dur;
    function tick(now: number) {
      if (!playingRef.current) return;
      const p = Math.min((now - start) / dur, 1);
      progressRef.current = p; setProgress(p); instRef.current?.seek(p);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
      else { setTimeout(() => { if (!playingRef.current) return; progressRef.current = 0; const s2 = performance.now(); function t2(n2: number) { if (!playingRef.current) return; const p2 = Math.min((n2 - s2) / dur, 1); progressRef.current = p2; setProgress(p2); instRef.current?.seek(p2); if (p2 < 1) rafRef.current = requestAnimationFrame(t2); else setIsPlaying(false); } rafRef.current = requestAnimationFrame(t2); }, 600); setIsPlaying(false); }
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying]);

  function handleSlider(e: React.ChangeEvent<HTMLInputElement>) {
    setIsPlaying(false);
    const p = parseFloat(e.target.value);
    progressRef.current = p; setProgress(p); instRef.current?.seek(p);
  }

  function handleReset() {
    setIsPlaying(false); progressRef.current = 0; setProgress(0); instRef.current?.seek(0);
  }

  function loadExample(i: number) {
    setActiveIdx(i);
    setIsPlaying(false);
    cancelAnimationFrame(rafRef.current);
  }

  const code = buildCode(ex, easing, stagger);

  return (
    <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">

      {/* ── Panel 1: v2 Options ─────────────────────────────────────────── */}
      <div className="flex flex-col lg:w-[38%] xl:w-[36%] border-b lg:border-b-0 lg:border-r border-pitch-black min-h-0 max-h-[35vh] lg:max-h-none">

        {/* Header — matches v1 SVG editor header */}
        <div className="shrink-0 flex items-center justify-between px-4 py-2 bg-[#111] border-b border-[#2a2a2a]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
          </div>
          <span className="text-[10px] text-[#888] font-mono tracking-widest uppercase">
            {ex.api}
          </span>
          <span className="text-[10px] font-mono" style={{ color: ex.color + 'aa' }}>{ex.tag}</span>
        </div>

        {/* Options content */}
        <div className="flex-1 overflow-y-auto bg-[#18181b] text-[#e8e8e3] p-4 space-y-5">

          {/* scrollAnimate: effect info */}
          {ex.api === 'scrollAnimate' && (
            <div>
              <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-[#666] mb-2">Effect — {ex.animEffect}</p>
              <div className="space-y-1.5">
                {Object.entries(ANIM_EFFECTS[ex.animEffect ?? 'Fade + Slide']).map(([k, [a, b]]) => (
                  <div key={k} className="font-mono text-[11px] leading-relaxed">
                    <span className="text-[#7dd3fc]">{k}</span>
                    <span className="text-[#94a3b8]">: [</span>
                    <span className="text-[#86efac]">&apos;{a}&apos;</span>
                    <span className="text-[#94a3b8]">, </span>
                    <span className="text-[#86efac]">&apos;{b}&apos;</span>
                    <span className="text-[#94a3b8]">]</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* scrollText: split + stagger controls */}
          {ex.api === 'scrollText' && (
            <>
              <div>
                <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-[#666] mb-2">Split mode</p>
                <div className="flex gap-2">
                  {(['words', 'chars', 'lines'] as TextSplit[]).map(m => (
                    <button key={m} onClick={() => {
                      // Update stagger when split changes (chars need smaller stagger)
                      if (m === 'chars') setStagger(0.02);
                      else setStagger(0.05);
                    }}
                      className={`text-[10px] font-mono px-2.5 py-1 rounded-lg border transition-all ${
                        ex.textSplit === m ? 'bg-[#7dd3fc]/20 border-[#7dd3fc]/40 text-[#7dd3fc]' : 'border-[#333] text-[#555] hover:border-[#555] hover:text-[#888]'
                      }`}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1.5">
                  <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-[#666]">Stagger</p>
                  <span className="text-[10px] font-mono text-[#888]">{stagger.toFixed(2)}</span>
                </div>
                <input type="range" min={0} max={0.1} step={0.005} value={stagger}
                  onChange={e => setStagger(parseFloat(e.target.value))} className="w-full" />
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-[#666] mb-2">From preset</p>
                <div className="space-y-1">
                  {(Object.keys(TEXT_FROMS) as TextFrom[]).map(fp => (
                    <div key={fp} className="font-mono text-[11px]">
                      <span className={fp === ex.textFrom ? 'text-[#86efac]' : 'text-[#555]'}>{fp === ex.textFrom ? '▶ ' : '  '}{fp}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* scrollCounter: config info */}
          {ex.api === 'scrollCounter' && (
            <div>
              <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-[#666] mb-2">Counter config</p>
              {(() => {
                const cc = COUNTER_CONFIGS[ex.counterFmt ?? 'currency'];
                return (
                  <div className="space-y-1.5 font-mono text-[11px]">
                    <div><span className="text-[#7dd3fc]">to</span><span className="text-[#94a3b8]">: </span><span className="text-[#fbbf24]">{cc.to.toLocaleString()}</span></div>
                    <div><span className="text-[#7dd3fc]">format</span><span className="text-[#94a3b8]">: </span><span className="text-[#c084fc] text-[10px]">n → {cc.format(cc.to)}</span></div>
                    <div><span className="text-[#7dd3fc]">easing</span><span className="text-[#94a3b8]">: </span><span className="text-[#86efac]">&apos;{easing}&apos;</span></div>
                    <div><span className="text-[#7dd3fc]">once</span><span className="text-[#94a3b8]">: </span><span className="text-[#fbbf24]">true</span></div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Easing — shown for all */}
          <div>
            <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-[#666] mb-2">Easing</p>
            <div className="flex flex-wrap gap-1.5">
              {EASINGS.map(e => (
                <button key={e} onClick={() => setEasing(e)}
                  className={`text-[10px] font-mono px-2.5 py-1 rounded-lg border transition-all ${
                    easing === e ? 'bg-creator-pink/20 border-creator-pink/50 text-creator-pink' : 'border-[#333] text-[#555] hover:border-[#555] hover:text-[#888]'
                  }`}>
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Generated code snippet (mini) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-[#666]">Generated code</p>
              <CopyButton text={code} />
            </div>
            <pre className="text-[10px] font-mono leading-[1.7] text-[#e8e8e3] whitespace-pre-wrap break-all">
              {code}
            </pre>
          </div>

        </div>
      </div>

      {/* ── Panel 2: Preview ─────────────────────────────────────────────── */}
      <div className="flex flex-col lg:w-[30%] xl:w-[32%] border-b lg:border-b-0 lg:border-r border-pitch-black min-h-0">

        {/* Preview area */}
        <div className="flex-1 flex items-center justify-center relative overflow-hidden min-h-[200px]"
          style={{ background: ex.api === 'scrollText' ? '#0d0d0d' : ex.api === 'scrollCounter' ? '#fafaf8' : 'radial-gradient(circle at center, #f0f0ea 0%, #f4f4f0 100%)' }}>
          {ex.api !== 'scrollText' && (
            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle, #c8c8c0 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          )}
          <div ref={previewRef} className="relative z-10 w-full h-full flex items-center justify-center" />
        </div>

        {/* Scrubber — identical to v1 */}
        <div className="shrink-0 border-t border-subtle-ash bg-light-linen px-4 py-3 space-y-2">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsPlaying(v => !v)}
              className="shrink-0 w-8 h-8 rounded-full bg-pitch-black text-light-linen flex items-center justify-center hover:bg-graphite-border transition-colors text-[13px] shadow-[1px_1px_0px_#000]"
              aria-label={isPlaying ? 'Pause' : 'Play'}>
              {isPlaying ? '⏸' : '▶'}
            </button>
            <div className="flex-1">
              <input type="range" min="0" max="1" step="0.001" value={progress}
                aria-label="Animation progress"
                onChange={handleSlider} className="w-full accent-pitch-black" />
            </div>
            <button onClick={handleReset}
              className="shrink-0 w-8 h-8 rounded-full border border-subtle-ash flex items-center justify-center hover:border-pitch-black transition-colors text-[13px]"
              aria-label="Reset">↺</button>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 rounded-full bg-subtle-ash flex-1 w-24 overflow-hidden">
                <div className="h-full bg-pitch-black rounded-full transition-none" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-[11px] font-mono font-semibold text-pitch-black w-8 text-right">{pct}%</span>
            </div>
            <span className="text-[10px] font-mono text-graphite-border">{ex.api} · {easing}</span>
          </div>
        </div>
      </div>

      {/* ── Panel 3: Examples + Tabs ──────────────────────────────────────── */}
      <div className="flex flex-col lg:w-[32%] xl:w-[32%] min-h-0 overflow-hidden bg-marketplace-gray">

        {/* Examples grid — identical structure to v1 */}
        <div className="shrink-0 border-b border-pitch-black px-4 pt-3 pb-3">
          <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-graphite-border mb-2.5 font-mono">v2 Examples</p>
          <div className="grid grid-cols-4 gap-1.5">
            {V2_EXAMPLES.map((e, i) => (
              <button key={e.label} onClick={() => loadExample(i)}
                className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl border transition-all text-center ${
                  activeIdx === i
                    ? 'border-pitch-black text-light-linen shadow-[2px_2px_0px_#000]'
                    : 'border-subtle-ash bg-light-linen hover:border-pitch-black hover:shadow-[1px_1px_0px_#000] text-graphite-border hover:text-pitch-black'
                }`}
                style={{ background: activeIdx === i ? e.color : undefined }}>
                <ExThumb ex={e} active={activeIdx === i} />
                <span className="text-[9px] font-mono leading-tight font-semibold">{e.label}</span>
                <span className={`text-[8px] uppercase tracking-wide font-bold leading-none px-1 py-0.5 rounded-full ${
                  activeIdx === i ? 'bg-black/20 text-white' : 'text-graphite-border/60'
                }`}>{e.api.replace('scroll', '')}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tabs — same structure as v1 */}
        <div className="shrink-0 flex border-b border-pitch-black">
          {(['options', 'easing', 'code'] as V2Tab[]).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-[0.16em] transition-all border-r last:border-r-0 border-subtle-ash ${
                activeTab === tab
                  ? 'bg-pitch-black text-light-linen border-pitch-black'
                  : 'text-graphite-border hover:text-pitch-black hover:bg-light-linen/60'
              }`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto">

          {/* Options tab */}
          {activeTab === 'options' && (
            <div className="p-4 space-y-4">
              <p className="text-[11px] text-graphite-border leading-relaxed">
                Use the <strong>left panel</strong> to adjust settings for{' '}
                <code className="font-mono text-[10px] bg-marketplace-gray border border-subtle-ash px-1 py-0.5 rounded-md">{ex.api}</code>.
                Drag the scrubber in the preview to manually drive the animation progress.
              </p>
              <div className="space-y-2">
                <p className="text-[9px] uppercase tracking-[0.2em] font-semibold text-graphite-border">Active example</p>
                <div className="rounded-xl border border-subtle-ash bg-light-linen p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[12px]">{ex.label}</span>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full" style={{ background: ex.color + '25', color: ex.color }}>{ex.api}</span>
                  </div>
                  <p className="text-[11px] text-graphite-border font-mono">{ex.tag}</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[9px] uppercase tracking-[0.2em] font-semibold text-graphite-border">Instance API</p>
                <div className="rounded-xl border border-subtle-ash bg-[#111] p-3">
                  <pre className="text-[10px] font-mono text-[#e8e8e3] leading-[1.8]">{`const inst = ${ex.api}(el, opts);

inst.pause();
inst.resume();
inst.seek(0.5);   // jump to 50%
inst.replay();
inst.getProgress(); // → 0–1
inst.destroy();`}</pre>
                </div>
              </div>
            </div>
          )}

          {/* Easing tab */}
          {activeTab === 'easing' && (
            <div className="p-4 space-y-4">
              <p className="text-[9px] uppercase tracking-[0.2em] font-semibold text-graphite-border mb-1">Easing curve</p>
              <div className="space-y-1.5">
                {EASINGS.map(e => (
                  <button key={e} onClick={() => setEasing(e)}
                    className={`w-full text-left flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all text-[12px] font-mono ${
                      easing === e ? 'bg-pitch-black text-light-linen border-pitch-black shadow-[2px_2px_0px_rgba(0,0,0,0.2)]' : 'border-subtle-ash bg-light-linen text-graphite-border hover:border-pitch-black hover:text-pitch-black'
                    }`}>
                    <span>{e}</span>
                    {easing === e && <span className="text-[9px] opacity-60">active</span>}
                  </button>
                ))}
              </div>
              <div className="p-3 rounded-xl border border-sunshine-yellow/40 bg-sunshine-yellow/5">
                <p className="text-[11px] text-graphite-border leading-relaxed">
                  All v2 APIs share the same easing system as <code className="font-mono text-[10px]">scrollDraw</code> —
                  named strings, custom <code className="font-mono text-[10px]">(t: number) =&gt; number</code> functions,
                  and <code className="font-mono text-[10px]">createSpring</code> / <code className="font-mono text-[10px]">createElastic</code> factories.
                </p>
              </div>
            </div>
          )}

          {/* Code tab */}
          {activeTab === 'code' && (
            <div className="p-4 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[9px] uppercase tracking-[0.2em] font-semibold text-graphite-border">Generated snippet</p>
                  <CopyButton text={code} />
                </div>
                <pre className="text-[11px] font-mono bg-[#141412] text-[#e8e8e3] rounded-xl p-4 overflow-x-auto leading-[1.8] whitespace-pre border border-pitch-black shadow-[2px_2px_0px_#000]">
                  {code}
                </pre>
              </div>
              <div className="p-3 rounded-xl border border-subtle-ash bg-light-linen space-y-2">
                <p className="text-[9px] uppercase tracking-[0.2em] font-semibold text-graphite-border">Usage</p>
                <p className="text-[11px] text-graphite-border leading-relaxed">
                  In production, the animation follows actual scroll position — no scrubber needed. This playground drives it manually via <code className="font-mono bg-marketplace-gray px-1 rounded text-pitch-black">seek(p)</code>.
                </p>
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
