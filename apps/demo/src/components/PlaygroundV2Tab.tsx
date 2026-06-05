'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { scrollAnimate } from 'svg-scroll-draw';
import { scrollText } from 'svg-scroll-draw/text';
import { scrollCounter } from 'svg-scroll-draw';
import type { ScrollDrawInstance } from 'svg-scroll-draw';
import { CopyButton } from './CopyButton';

// ── Types ─────────────────────────────────────────────────────────────────────

type V2Api     = 'scrollAnimate' | 'scrollText' | 'scrollCounter';
type AnimEffect = 'Fade + Slide' | 'Scale + Fade' | 'Slide Left' | 'Rotate In' | 'Color Shift';
type TextSplit  = 'words' | 'chars' | 'lines';
type TextFrom   = 'Fade Up' | 'Rotate In' | 'Scale';
type EasingKey  = 'linear' | 'ease-out' | 'ease-in-out' | 'spring' | 'elastic';
type CounterPreset = 'users' | 'revenue' | 'satisfaction' | 'tests';

// ── Helpers ───────────────────────────────────────────────────────────────────

const EASINGS: EasingKey[] = ['linear', 'ease-out', 'ease-in-out', 'spring', 'elastic'];

const ANIM_EFFECTS: Record<AnimEffect, { props: Record<string, [string|number, string|number]>; hint: string }> = {
  'Fade + Slide':  { props: { opacity: [0, 1], transform: ['translateY(40px)', 'translateY(0px)'] }, hint: 'opacity + translateY — the most common entrance' },
  'Scale + Fade':  { props: { opacity: [0, 1], transform: ['scale(0.85) translateY(16px)', 'scale(1) translateY(0px)'] }, hint: 'scale + opacity — cards, modals, feature tiles' },
  'Slide Left':    { props: { opacity: [0, 1], transform: ['translateX(-48px)', 'translateX(0px)'] }, hint: 'translateX + opacity — sidebar items, list rows' },
  'Rotate In':     { props: { opacity: [0, 1], transform: ['rotate(-6deg) translateY(24px)', 'rotate(0deg) translateY(0px)'] }, hint: 'rotate + opacity — playful, editorial feel' },
  'Color Shift':   { props: { backgroundColor: ['#f4f4f0', '#0f172a'], color: ['#111111', '#e2e8f0'] }, hint: 'background-color + color — section-level dark mode' },
};

const TEXT_FROMS: Record<TextFrom, { from: object; hint: string }> = {
  'Fade Up':   { from: { opacity: 0, y: 28  }, hint: 'opacity + translateY — default' },
  'Rotate In': { from: { opacity: 0, rotate: 12, y: 12 }, hint: 'rotate + translateY — dramatic' },
  'Scale':     { from: { opacity: 0, scale: 0.7 }, hint: 'scale + opacity — zooms in' },
};

const COUNTER_PRESETS: Record<CounterPreset, { to: number; format: (n: number) => string; label: string; code: string }> = {
  users:        { to: 50000,   format: n => Math.round(n).toLocaleString() + '+',           label: 'Users',        code: "format: n => Math.round(n).toLocaleString() + '+'" },
  revenue:      { to: 1250000, format: n => '$' + Math.round(n).toLocaleString(),            label: 'Revenue',      code: "format: n => '$' + Math.round(n).toLocaleString()" },
  satisfaction: { to: 94.7,    format: n => n.toFixed(1) + '%',                              label: 'Satisfaction', code: "format: n => n.toFixed(1) + '%'" },
  tests:        { to: 358,     format: n => Math.round(n).toString(),                        label: 'Tests',        code: "format: n => Math.round(n).toString()" },
};

// ── Code generators ───────────────────────────────────────────────────────────

function buildAnimateCode(effect: AnimEffect, easing: EasingKey): string {
  const p = ANIM_EFFECTS[effect].props;
  const lines = Object.entries(p).map(([k, [a, b]]) => `    ${k}: ['${a}', '${b}'],`).join('\n');
  return `import { scrollAnimate } from 'svg-scroll-draw';

scrollAnimate('#element', {
  props: {
${lines}
  },
  easing: '${easing}',
  once:   true,
});`;
}

function buildTextCode(split: TextSplit, stagger: number, fromPreset: TextFrom): string {
  const { from } = TEXT_FROMS[fromPreset];
  const fromLines = Object.entries(from).map(([k, v]) => `    ${k}: ${v},`).join('\n');
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

function buildCounterCode(preset: CounterPreset): string {
  const cp = COUNTER_PRESETS[preset];
  return `import { scrollCounter } from 'svg-scroll-draw';

scrollCounter('#number', {
  to:     ${cp.to},
  ${cp.code},
  easing: 'ease-out',
  once:   true,
});`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-graphite-border mb-2">{children}</p>;
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`text-[11px] font-mono px-3 py-1.5 rounded-full border transition-all ${
      active ? 'bg-pitch-black text-light-linen border-pitch-black' : 'bg-transparent text-graphite-border border-subtle-ash hover:border-pitch-black hover:text-pitch-black'
    }`}>
      {children}
    </button>
  );
}

// ── scrollAnimate panel ───────────────────────────────────────────────────────

function AnimatePanel() {
  const cardRef    = useRef<HTMLDivElement>(null);
  const wrapRef    = useRef<HTMLDivElement>(null);
  const instRef    = useRef<ScrollDrawInstance | null>(null);
  const rafRef     = useRef(0);
  const isMntRef   = useRef(true);
  const playedRef  = useRef(false);

  const [effect,   setEffect]   = useState<AnimEffect>('Fade + Slide');
  const [easing,   setEasing]   = useState<EasingKey>('ease-out');
  const [progress, setProgress] = useState(0);
  const [playing,  setPlaying]  = useState(false);

  const isColorShift = effect === 'Color Shift';

  const rebuild = useCallback((eff: AnimEffect, eas: EasingKey) => {
    instRef.current?.destroy();
    instRef.current = null;
    const el = isColorShift ? wrapRef.current : cardRef.current;
    if (!el) return;
    instRef.current = scrollAnimate(el, {
      props:   ANIM_EFFECTS[eff].props as any,
      easing:  eas,
      native:  false,
      trigger: { start: 'top bottom', end: 'bottom top' },
    });
    instRef.current.seek(0);
  }, [isColorShift]);

  const autoPlay = useCallback(() => {
    if (!instRef.current) return;
    cancelAnimationFrame(rafRef.current);
    const start = performance.now();
    setPlaying(true);
    function tick(now: number) {
      const p = Math.min((now - start) / 1000, 1);
      instRef.current?.seek(p);
      setProgress(p);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
      else setPlaying(false);
    }
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    rebuild('Fade + Slide', 'ease-out');
    const io = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !playedRef.current) {
        playedRef.current = true;
        autoPlay();
      }
    }, { threshold: 0.3 });
    if (cardRef.current) io.observe(cardRef.current);
    return () => io.disconnect();
  }, []); // eslint-disable-line

  useEffect(() => {
    if (isMntRef.current) { isMntRef.current = false; return; }
    rebuild(effect, easing);
    setProgress(0);
    setTimeout(autoPlay, 50);
  }, [effect, easing]); // eslint-disable-line

  useEffect(() => () => { cancelAnimationFrame(rafRef.current); instRef.current?.destroy(); }, []);

  const scrub = (p: number) => { cancelAnimationFrame(rafRef.current); setPlaying(false); setProgress(p); instRef.current?.seek(p); };
  const replay = () => { rebuild(effect, easing); setProgress(0); setTimeout(autoPlay, 30); };

  return (
    <div className="flex flex-col gap-4 h-full">
      <div>
        <Label>Effect</Label>
        <div className="grid grid-cols-2 gap-1.5">
          {(Object.keys(ANIM_EFFECTS) as AnimEffect[]).map(e => (
            <Pill key={e} active={effect === e} onClick={() => setEffect(e)}>{e}</Pill>
          ))}
        </div>
        <p className="text-[10px] font-mono text-graphite-border mt-1.5">{ANIM_EFFECTS[effect].hint}</p>
      </div>

      <div>
        <Label>Easing</Label>
        <div className="flex flex-wrap gap-1.5">
          {EASINGS.map(e => <Pill key={e} active={easing === e} onClick={() => setEasing(e)}>{e}</Pill>)}
        </div>
      </div>

      <div>
        <div className="flex justify-between mb-1.5">
          <Label>Scrub</Label>
          <span className="text-[11px] font-mono font-bold">{Math.round(progress * 100)}%</span>
        </div>
        <input type="range" min={0} max={1} step={0.01} value={progress}
          onChange={e => scrub(parseFloat(e.target.value))} className="w-full" />
      </div>

      <button onClick={replay} disabled={playing}
        className={`text-[11px] font-bold px-4 py-2 rounded-full border-2 border-pitch-black w-fit transition-all ${
          playing ? 'opacity-50 cursor-not-allowed bg-subtle-ash' : 'bg-creator-pink text-pitch-black shadow-[2px_2px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'
        }`}>
        {playing ? 'Playing…' : '↺ Replay'}
      </button>

      {/* Preview */}
      <div className="rounded-xl border border-pitch-black overflow-hidden flex-1 min-h-[200px] bg-[#f4f4f0]">
        <div className="w-full h-full min-h-[200px] p-6 flex items-center justify-center" style={{ display: isColorShift ? 'none' : 'flex' }}>
          <div ref={cardRef} style={{ background: '#fff', border: '1.5px solid #111', borderRadius: 14, padding: '20px 18px', boxShadow: '3px 3px 0 #111', width: '100%', maxWidth: 240, willChange: 'transform, opacity' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#ffeaa7', border: '1px solid #e6c300', borderRadius: 20, padding: '3px 10px', marginBottom: 10 }}>
              <span style={{ fontFamily: 'monospace', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>scrollAnimate</span>
            </div>
            <div style={{ fontFamily: 'var(--font-syne, system-ui)', fontWeight: 800, fontSize: 18, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 8 }}>Any CSS property.<br /><span style={{ color: '#888' }}>Any element.</span></div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['opacity', 'transform', 'color'].map(p => (
                <span key={p} style={{ fontFamily: 'monospace', fontSize: 9, background: '#f4f4f0', border: '1px solid #ddd', borderRadius: 5, padding: '2px 7px', color: '#666' }}>{p}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="w-full h-full min-h-[200px] p-6 flex items-center" style={{ display: isColorShift ? 'flex' : 'none' }}>
          <div ref={wrapRef} style={{ width: '100%', borderRadius: 12, border: '1.5px solid #111', padding: '24px 20px', background: '#f4f4f0', willChange: 'background-color, color' }}>
            <div style={{ fontFamily: 'var(--font-syne, system-ui)', fontWeight: 800, fontSize: 18, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 8 }}>Background + text<br />animate together.</div>
            <div style={{ fontFamily: 'monospace', fontSize: 10, opacity: 0.4 }}>Scrub to 100% → dark mode</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── scrollText panel ──────────────────────────────────────────────────────────

const TEXT_HEADLINE = 'Words reveal one by one as you scroll.';

function TextPanel() {
  const headRef   = useRef<HTMLHeadingElement>(null);
  const instRef   = useRef<ScrollDrawInstance | null>(null);
  const rafRef    = useRef(0);
  const isMntRef  = useRef(true);
  const playedRef = useRef(false);

  const [split,    setSplit]    = useState<TextSplit>('words');
  const [stagger,  setStagger]  = useState(0.05);
  const [fromPr,   setFromPr]   = useState<TextFrom>('Fade Up');
  const [progress, setProgress] = useState(0);
  const [playing,  setPlaying]  = useState(false);

  const rebuild = useCallback((s: TextSplit, st: number, fp: TextFrom) => {
    instRef.current?.destroy();
    instRef.current = null;
    const el = headRef.current;
    if (!el) return;
    el.textContent = TEXT_HEADLINE;
    instRef.current = scrollText(el, {
      split: s, stagger: st,
      from: TEXT_FROMS[fp].from as any,
      once: true,
      trigger: { start: 'top bottom', end: 'bottom top' },
    });
    instRef.current.seek(0);
  }, []);

  const autoPlay = useCallback(() => {
    if (!instRef.current) return;
    cancelAnimationFrame(rafRef.current);
    const start = performance.now();
    setPlaying(true);
    function tick(now: number) {
      const p = Math.min((now - start) / 1200, 1);
      instRef.current?.seek(p);
      setProgress(p);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
      else setPlaying(false);
    }
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    rebuild('words', 0.05, 'Fade Up');
    const io = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !playedRef.current) { playedRef.current = true; autoPlay(); }
    }, { threshold: 0.3 });
    if (headRef.current) io.observe(headRef.current);
    return () => io.disconnect();
  }, []); // eslint-disable-line

  useEffect(() => {
    if (isMntRef.current) { isMntRef.current = false; return; }
    rebuild(split, stagger, fromPr);
    setProgress(0);
    setTimeout(autoPlay, 50);
  }, [split, stagger, fromPr]); // eslint-disable-line

  useEffect(() => () => { cancelAnimationFrame(rafRef.current); instRef.current?.destroy(); }, []);

  const scrub = (p: number) => { cancelAnimationFrame(rafRef.current); setPlaying(false); setProgress(p); instRef.current?.seek(p); };
  const replay = () => { rebuild(split, stagger, fromPr); setProgress(0); setTimeout(autoPlay, 30); };

  return (
    <div className="flex flex-col gap-4 h-full">
      <div>
        <Label>Split by</Label>
        <div className="flex gap-1.5">
          {(['words', 'chars', 'lines'] as TextSplit[]).map(m => <Pill key={m} active={split === m} onClick={() => setSplit(m)}>{m}</Pill>)}
        </div>
      </div>

      <div>
        <Label>Animation preset</Label>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(TEXT_FROMS) as TextFrom[]).map(p => <Pill key={p} active={fromPr === p} onClick={() => setFromPr(p)}>{p}</Pill>)}
        </div>
        <p className="text-[10px] font-mono text-graphite-border mt-1.5">{TEXT_FROMS[fromPr].hint}</p>
      </div>

      <div>
        <div className="flex justify-between mb-1.5">
          <Label>Stagger</Label>
          <span className="text-[11px] font-mono font-bold">{stagger.toFixed(2)}</span>
        </div>
        <input type="range" min={0} max={0.1} step={0.005} value={stagger}
          onChange={e => setStagger(parseFloat(e.target.value))} className="w-full" />
      </div>

      <div>
        <div className="flex justify-between mb-1.5">
          <Label>Scrub</Label>
          <span className="text-[11px] font-mono font-bold">{Math.round(progress * 100)}%</span>
        </div>
        <input type="range" min={0} max={1} step={0.01} value={progress}
          onChange={e => scrub(parseFloat(e.target.value))} className="w-full" />
      </div>

      <button onClick={replay} disabled={playing}
        className={`text-[11px] font-bold px-4 py-2 rounded-full border-2 border-pitch-black w-fit transition-all ${
          playing ? 'opacity-50 cursor-not-allowed bg-subtle-ash' : 'bg-creator-pink text-pitch-black shadow-[2px_2px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'
        }`}>
        {playing ? 'Playing…' : '↺ Replay'}
      </button>

      {/* Preview */}
      <div className="rounded-xl border border-pitch-black bg-[#0d0d0d] flex-1 min-h-[180px] p-6 flex flex-col justify-center gap-4">
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,144,232,0.15)', border: '1px solid rgba(255,144,232,0.3)', borderRadius: 20, padding: '3px 10px', width: 'fit-content' }}>
          <span style={{ fontFamily: 'monospace', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#ff90e8' }}>scrollText</span>
        </div>
        <h3 ref={headRef}
          style={{ fontFamily: 'var(--font-syne, system-ui)', fontWeight: 800, fontSize: 'clamp(16px,2.5vw,24px)', letterSpacing: '-0.03em', lineHeight: 1.1, color: '#f5f5f5', margin: 0 }}>
          {TEXT_HEADLINE}
        </h3>
        <div className="flex gap-2 flex-wrap">
          <span style={{ fontFamily: 'monospace', fontSize: 9, color: '#555', background: '#1a1a1a', padding: '2px 8px', borderRadius: 4 }}>split: {split}</span>
          <span style={{ fontFamily: 'monospace', fontSize: 9, color: '#555', background: '#1a1a1a', padding: '2px 8px', borderRadius: 4 }}>stagger: {stagger.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

// ── scrollCounter panel ───────────────────────────────────────────────────────

function CounterPanel() {
  const numRef    = useRef<HTMLSpanElement>(null);
  const instRef   = useRef<ScrollDrawInstance | null>(null);
  const rafRef    = useRef(0);
  const isMntRef  = useRef(true);
  const playedRef = useRef(false);

  const [preset,   setPreset]   = useState<CounterPreset>('revenue');
  const [progress, setProgress] = useState(0);
  const [playing,  setPlaying]  = useState(false);

  const rebuild = useCallback((p: CounterPreset) => {
    instRef.current?.destroy();
    instRef.current = null;
    const el = numRef.current;
    if (!el) return;
    const cp = COUNTER_PRESETS[p];
    instRef.current = scrollCounter(el, {
      to: cp.to, format: cp.format, easing: 'ease-out', once: true,
      trigger: { start: 'top bottom', end: 'bottom top' },
    });
    instRef.current.seek(0);
  }, []);

  const autoPlay = useCallback(() => {
    if (!instRef.current) return;
    cancelAnimationFrame(rafRef.current);
    const start = performance.now();
    setPlaying(true);
    function tick(now: number) {
      const p = Math.min((now - start) / 1400, 1);
      instRef.current?.seek(p);
      setProgress(p);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
      else setPlaying(false);
    }
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    rebuild('revenue');
    const io = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !playedRef.current) { playedRef.current = true; autoPlay(); }
    }, { threshold: 0.3 });
    if (numRef.current) io.observe(numRef.current);
    return () => io.disconnect();
  }, []); // eslint-disable-line

  useEffect(() => {
    if (isMntRef.current) { isMntRef.current = false; return; }
    rebuild(preset);
    setProgress(0);
    setTimeout(autoPlay, 50);
  }, [preset]); // eslint-disable-line

  useEffect(() => () => { cancelAnimationFrame(rafRef.current); instRef.current?.destroy(); }, []);

  const scrub = (p: number) => { cancelAnimationFrame(rafRef.current); setPlaying(false); setProgress(p); instRef.current?.seek(p); };
  const replay = () => { rebuild(preset); setProgress(0); setTimeout(autoPlay, 30); };

  return (
    <div className="flex flex-col gap-4 h-full">
      <div>
        <Label>Counter preset</Label>
        <div className="grid grid-cols-2 gap-1.5">
          {(Object.keys(COUNTER_PRESETS) as CounterPreset[]).map(p => (
            <Pill key={p} active={preset === p} onClick={() => setPreset(p)}>{COUNTER_PRESETS[p].label}</Pill>
          ))}
        </div>
        <p className="text-[10px] font-mono text-graphite-border mt-1.5">{COUNTER_PRESETS[preset].code}</p>
      </div>

      <div>
        <div className="flex justify-between mb-1.5">
          <Label>Scrub</Label>
          <span className="text-[11px] font-mono font-bold">{Math.round(progress * 100)}%</span>
        </div>
        <input type="range" min={0} max={1} step={0.01} value={progress}
          onChange={e => scrub(parseFloat(e.target.value))} className="w-full" />
      </div>

      <button onClick={replay} disabled={playing}
        className={`text-[11px] font-bold px-4 py-2 rounded-full border-2 border-pitch-black w-fit transition-all ${
          playing ? 'opacity-50 cursor-not-allowed bg-subtle-ash' : 'bg-creator-pink text-pitch-black shadow-[2px_2px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'
        }`}>
        {playing ? 'Playing…' : '↺ Replay'}
      </button>

      {/* Preview */}
      <div className="rounded-xl border border-pitch-black bg-marketplace-gray flex-1 min-h-[180px] p-6 flex flex-col justify-center gap-3">
        <div style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#999', marginBottom: 4 }}>
          {COUNTER_PRESETS[preset].label}
        </div>
        <span ref={numRef}
          style={{ fontFamily: 'var(--font-syne, system-ui)', fontWeight: 800, fontSize: 'clamp(36px,5vw,56px)', letterSpacing: '-0.05em', lineHeight: 1, display: 'block' }}>
          {COUNTER_PRESETS[preset].format(0)}
        </span>
        <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#bbb' }}>scrollCounter · easing: ease-out · once: true</div>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function PlaygroundV2Tab() {
  const [api, setApi] = useState<V2Api>('scrollAnimate');

  const code =
    api === 'scrollAnimate' ? buildAnimateCode('Fade + Slide', 'ease-out')
    : api === 'scrollText'  ? buildTextCode('words', 0.05, 'Fade Up')
    :                          buildCounterCode('revenue');

  const APIS: { id: V2Api; label: string; badge: string }[] = [
    { id: 'scrollAnimate', label: 'scrollAnimate', badge: 'css · any element' },
    { id: 'scrollText',    label: 'scrollText',    badge: 'split · stagger'    },
    { id: 'scrollCounter', label: 'scrollCounter', badge: 'numbers · format'   },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* API selector */}
      <div className="shrink-0 border-b border-pitch-black px-4 py-3 flex flex-wrap gap-2">
        {APIS.map(a => (
          <button key={a.id} onClick={() => setApi(a.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[11px] font-mono transition-all ${
              api === a.id
                ? 'bg-pitch-black text-light-linen border-pitch-black shadow-[2px_2px_0px_rgba(0,0,0,0.2)]'
                : 'bg-transparent text-graphite-border border-subtle-ash hover:border-pitch-black hover:text-pitch-black'
            }`}>
            <span className="font-bold">{a.label}</span>
            <span className={`text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded-full ${api === a.id ? 'bg-white/10' : 'bg-marketplace-gray'}`}>
              {a.badge}
            </span>
          </button>
        ))}
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          {api === 'scrollAnimate' && <AnimatePanel />}
          {api === 'scrollText'    && <TextPanel />}
          {api === 'scrollCounter' && <CounterPanel />}

          {/* Generated code */}
          <div className="mt-4 rounded-xl overflow-hidden border border-pitch-black">
            <div className="bg-[#111] flex items-center justify-between px-4 py-2">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#444]" />
                <span className="w-2 h-2 rounded-full bg-[#444]" />
                <span className="w-2 h-2 rounded-full bg-[#444]" />
              </div>
              <span className="text-[10px] text-[#888] font-mono">{api}.js</span>
              <CopyButton text={code} />
            </div>
            <pre className="bg-[#1c1c1c] text-[#e8e8e3] px-4 py-3 text-[10px] sm:text-[11px] font-mono leading-[1.8] overflow-x-auto">
              {code}
            </pre>
          </div>

          {/* Note */}
          <div className="mt-3 p-3 rounded-xl border border-sunshine-yellow/40 bg-sunshine-yellow/5">
            <p className="text-[11px] text-graphite-border leading-relaxed">
              This playground drives animations via a scrubber. In production, the animation follows actual scroll position — no scrubber needed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
