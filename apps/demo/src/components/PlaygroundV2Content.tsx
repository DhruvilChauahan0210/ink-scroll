'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { scrollAnimate } from 'svg-scroll-draw';
import { scrollText } from 'svg-scroll-draw/text';
import { scrollCounter } from 'svg-scroll-draw';
import type { ScrollDrawInstance } from 'svg-scroll-draw';
import { CodeBox } from './site/CodeBox';
import { CropMarks, GroundSwitch, PlayIcon, ResetIcon, fill, pad, type Ground } from './PlaygroundParts';

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
  // API-specific defaults
  animEffect?:    AnimEffect;
  textSplit?:     TextSplit;
  textFrom?:      TextFrom;
  counterFmt?:    CounterFmt;
}

// ── Data ──────────────────────────────────────────────────────────────────────

const V2_EXAMPLES: V2Example[] = [
  { label: 'Fade Slide',  tag: 'opacity·y',    api: 'scrollAnimate', animEffect: 'Fade + Slide'  },
  { label: 'Scale Pop',   tag: 'scale·fade',   api: 'scrollAnimate', animEffect: 'Scale + Fade'  },
  { label: 'Slide Left',  tag: 'translateX',   api: 'scrollAnimate', animEffect: 'Slide Left'    },
  { label: 'Rotate In',   tag: 'rotate·fade',  api: 'scrollAnimate', animEffect: 'Rotate In'     },
  { label: 'Color Shift', tag: 'bg-color',     api: 'scrollAnimate', animEffect: 'Color Shift'   },
  { label: 'Word Reveal', tag: 'split:words',  api: 'scrollText',    textSplit: 'words', textFrom: 'Fade Up'   },
  { label: 'Char Flow',   tag: 'split:chars',  api: 'scrollText',    textSplit: 'chars', textFrom: 'Rotate In' },
  { label: 'Line Drop',   tag: 'split:lines',  api: 'scrollText',    textSplit: 'lines', textFrom: 'Fade Up'   },
  { label: '$Revenue',    tag: 'currency',     api: 'scrollCounter', counterFmt: 'currency'    },
  { label: '50K+ Users',  tag: 'integer',      api: 'scrollCounter', counterFmt: 'integer'     },
];

/** How many v2 presets the bench offers — the opening's fact cell reads this. */
export const V2_EXAMPLE_COUNT = V2_EXAMPLES.length;

// Color Shift runs from the site's paper and ink to its night: the same pair
// the theme toggle flips between.
const ANIM_EFFECTS: Record<AnimEffect, Record<string, [string|number, string|number]>> = {
  'Fade + Slide':  { opacity: [0, 1], transform: ['translateY(40px)', 'translateY(0px)'] },
  'Scale + Fade':  { opacity: [0, 1], transform: ['scale(0.85) translateY(16px)', 'scale(1) translateY(0px)'] },
  'Slide Left':    { opacity: [0, 1], transform: ['translateX(-48px)', 'translateX(0px)'] },
  'Rotate In':     { opacity: [0, 1], transform: ['rotate(-6deg) translateY(24px)', 'rotate(0deg) translateY(0px)'] },
  'Color Shift':   { backgroundColor: ['#f3f0e9', '#0b0b0c'], color: ['#121110', '#ece8e0'] },
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

function ExThumb({ ex }: { ex: V2Example }) {
  if (ex.api === 'scrollAnimate') {
    return <span className="v2-thumb" aria-hidden="true"><span className="v2-thumb-box" /></span>;
  }
  if (ex.api === 'scrollText') {
    return (
      <span className="v2-thumb" aria-hidden="true">
        <span className="v2-thumb-lines">
          {[100, 80, 90].map((w, i) => <i key={i} style={{ width: `${w}%` }} />)}
        </span>
      </span>
    );
  }
  // scrollCounter
  return <span className="v2-thumb" aria-hidden="true"><span className="v2-thumb-num">42</span></span>;
}

// ── Main component ────────────────────────────────────────────────────────────

export function PlaygroundV2Content({ ground, onGround }: { ground: Ground; onGround: (g: Ground) => void }) {
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
  // Each specimen is built from the page's own classes (playground.css), so it
  // takes the ground's ink — paper or slate — instead of hard-coded colours.

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
        inner.className = 'v2-shift';
        inner.style.backgroundColor = '#f3f0e9';
        inner.style.color = '#121110';
        inner.innerHTML = '<p class="v2-t">Background + text<br>animate together.</p><div class="v2-shift-n">Scrub to 100% → dark mode</div>';
      } else {
        inner.className = 'v2-card';
        inner.innerHTML = '<span class="v2-k">scrollAnimate</span><p class="v2-t">Any CSS property.<br><span>Any element.</span></p><div class="v2-chips">' + ['opacity', 'transform', 'color'].map(p => `<span>${p}</span>`).join('') + '</div>';
      }

      wrap.className = 'v2-wrap';
      wrap.appendChild(inner);

      instRef.current = scrollAnimate(inner, {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        props:   ANIM_EFFECTS[cur.animEffect ?? 'Fade + Slide'] as any,
        easing:  eas,
        native:  false,
        trigger: TR,
      });
    } else if (cur.api === 'scrollText') {
      wrap.className = 'v2-wrap is-col';
      const badge = document.createElement('span');
      badge.className = 'v2-k';
      badge.textContent = 'scrollText';
      const h = document.createElement('h3');
      h.className = 'v2-h';
      h.textContent = TEXT_HEADLINE;
      wrap.appendChild(badge);
      wrap.appendChild(h);

      instRef.current = scrollText(h, {
        split:   cur.textSplit ?? 'words',
        stagger: stag,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        from:    TEXT_FROMS[cur.textFrom ?? 'Fade Up'] as any,
        once:    true,
        trigger: TR,
      });
    } else {
      wrap.className = 'v2-wrap is-col';
      const fmt = cur.counterFmt ?? 'currency';
      const cc  = COUNTER_CONFIGS[fmt];
      const lbl = document.createElement('div');
      lbl.className = 'v2-lab';
      lbl.textContent = cc.label;
      const num = document.createElement('span');
      num.className = 'v2-num';
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
  const cc = COUNTER_CONFIGS[ex.counterFmt ?? 'currency'];

  return (
    <div className="pl-bench">

      {/* ── A: this API's options ───────────────────────────────────────── */}
      <div className="pl-panel pl-panel-a">
        <div className="pl-ph">
          <span className="pl-ph-z">A</span>
          <span className="pl-ph-t">{ex.api}</span>
          <span className="pl-ph-m">{ex.tag}</span>
        </div>

        <div className="pl-tab-body">
          <div className="pl-stack">

            {/* scrollAnimate: effect info */}
            {ex.api === 'scrollAnimate' && (
              <div className="pl-field">
                <span className="pl-lab-k">Effect — {ex.animEffect}</span>
                <dl className="pl-spec-list">
                  {Object.entries(ANIM_EFFECTS[ex.animEffect ?? 'Fade + Slide']).map(([k, [a, b]]) => (
                    <div key={k}>
                      <dt>{k}</dt>
                      <dd>&apos;{a}&apos; <span>→</span> &apos;{b}&apos;</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {/* scrollText: split + stagger controls */}
            {ex.api === 'scrollText' && (
              <>
                <div className="pl-field">
                  <span className="pl-lab-k">Split mode</span>
                  <div className="pl-pills">
                    {(['words', 'chars', 'lines'] as TextSplit[]).map(m => (
                      <button key={m} type="button" className="pill" aria-pressed={ex.textSplit === m} onClick={() => {
                        // Update stagger when split changes (chars need smaller stagger)
                        if (m === 'chars') setStagger(0.02);
                        else setStagger(0.05);
                      }}>
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="pl-field">
                  <div className="pl-lab">
                    <span className="pl-lab-k">Stagger</span>
                    <span className="pl-lab-v">{stagger.toFixed(2)}</span>
                  </div>
                  <input type="range" min={0} max={0.1} step={0.005} value={stagger} aria-label="Stagger"
                    onChange={e => setStagger(parseFloat(e.target.value))} className="pl-range" style={fill(stagger, 0, 0.1)} />
                </div>
                <div className="pl-field">
                  <span className="pl-lab-k">From preset</span>
                  <ul className="pl-list">
                    {(Object.keys(TEXT_FROMS) as TextFrom[]).map(fp => (
                      <li key={fp} className={fp === ex.textFrom ? 'is-on' : undefined}>{fp}</li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {/* scrollCounter: config info */}
            {ex.api === 'scrollCounter' && (
              <div className="pl-field">
                <span className="pl-lab-k">Counter config</span>
                <dl className="pl-spec-list">
                  <div><dt>to</dt><dd>{cc.to.toLocaleString()}</dd></div>
                  <div><dt>format</dt><dd>n <span>→</span> {cc.format(cc.to)}</dd></div>
                  <div><dt>easing</dt><dd>&apos;{easing}&apos;</dd></div>
                  <div><dt>once</dt><dd>true</dd></div>
                </dl>
              </div>
            )}

            {/* Easing — shown for all */}
            <div className="pl-field">
              <span className="pl-lab-k">Easing</span>
              <div className="pl-pills">
                {EASINGS.map(e => (
                  <button key={e} type="button" className="pill" aria-pressed={easing === e} onClick={() => setEasing(e)}>{e}</button>
                ))}
              </div>
            </div>

            {/* Generated code snippet */}
            <div className="pl-field">
              <span className="pl-lab-k">Generated code</span>
              <CodeBox file={`${ex.api}.js`}>{code}</CodeBox>
            </div>

          </div>
        </div>
      </div>

      {/* ── B: the specimen ───────────────────────────────────────────────── */}
      <div className="pl-panel pl-panel-b">
        <div className="pl-ph">
          <span className="pl-ph-z">B</span>
          <span className="pl-ph-t">specimen</span>
          <GroundSwitch ground={ground} onChange={onGround} />
        </div>

        <div className="pl-spec" data-ground={ground}>
          <CropMarks />
          <div ref={previewRef} className="v2-wrap" />
        </div>

        {/* Scrubber — identical to v1 */}
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
            <span>Progress <b>{pct}%</b></span>
            <span><b>{ex.api}</b> · {easing}</span>
          </div>
        </div>
      </div>

      {/* ── C: presets + tabs ─────────────────────────────────────────────── */}
      <div className="pl-panel pl-panel-c">
        <div className="pl-ph">
          <span className="pl-ph-z">C</span>
          <span className="pl-ph-t">presets</span>
          <span className="pl-ph-m">{pad(activeIdx + 1)} / {pad(V2_EXAMPLES.length)}</span>
        </div>

        {/* Presets, as a parts list */}
        <div className="pl-ex">
          <p className="pl-k"><span>v2 Examples</span><span>{V2_EXAMPLES.length} presets</span></p>
          <div className="pl-ex-grid is-v2">
            {V2_EXAMPLES.map((e, i) => (
              <button key={e.label} type="button" onClick={() => loadExample(i)} className="pl-exb" aria-pressed={activeIdx === i}>
                <span className="pl-exb-n">{pad(i + 1)}</span>
                <ExThumb ex={e} />
                <span className="pl-exb-l">{e.label}</span>
                <span className="pl-exb-t">{e.api.replace('scroll', '')}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tabs — same structure as v1 */}
        <div className="pl-tabs" role="tablist" aria-label="Details">
          {(['options', 'easing', 'code'] as V2Tab[]).map(tab => (
            <button key={tab} type="button" role="tab" aria-selected={activeTab === tab} onClick={() => setActiveTab(tab)} className="pl-tab">
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="pl-tab-body" role="tabpanel" aria-label={activeTab}>

          {/* Options tab */}
          {activeTab === 'options' && (
            <div className="pl-stack">
              <p className="pl-muted">
                Use panel <b>A</b> to adjust settings for <code className="pl-c">{ex.api}</code>.
                Drag the scrubber in the preview to manually drive the animation progress.
              </p>
              <div className="pl-field">
                <span className="pl-lab-k">Active example</span>
                <dl className="pl-spec-list">
                  <div><dt>{pad(activeIdx + 1)}</dt><dd>{ex.label} <span>·</span> {ex.api}</dd></div>
                  <div><dt>tag</dt><dd>{ex.tag}</dd></div>
                </dl>
              </div>
              <div className="pl-field">
                <span className="pl-lab-k">Instance API</span>
                <CodeBox file="instance.js">{`const inst = ${ex.api}(el, opts);

inst.pause();
inst.resume();
inst.seek(0.5);   // jump to 50%
inst.replay();
inst.getProgress(); // → 0–1
inst.destroy();`}</CodeBox>
              </div>
            </div>
          )}

          {/* Easing tab */}
          {activeTab === 'easing' && (
            <div className="pl-stack">
              <div className="pl-field">
                <span className="pl-lab-k">Easing curve</span>
                <div className="pl-rows">
                  {EASINGS.map(e => (
                    <button key={e} type="button" className="pl-row" aria-pressed={easing === e} onClick={() => setEasing(e)}>
                      <span>{e}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="pl-note">
                All v2 APIs share the same easing system as <code>scrollDraw</code> —
                named strings, custom <code>(t: number) =&gt; number</code> functions,
                and <code>createSpring</code> / <code>createElastic</code> factories.
              </div>
            </div>
          )}

          {/* Code tab */}
          {activeTab === 'code' && (
            <div className="pl-stack">
              <div className="pl-field">
                <span className="pl-lab-k">Generated snippet</span>
                <CodeBox file={`${ex.api}.js`}>{code}</CodeBox>
              </div>
              <div className="pl-note">
                <span className="pl-note-k">Usage</span>
                In production, the animation follows actual scroll position — no scrubber needed. This playground drives it manually via <code>seek(p)</code>.
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
