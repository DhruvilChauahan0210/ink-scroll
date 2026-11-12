'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { CodeBox } from '@/components/site/CodeBox';
import { ToolExport } from '@/components/tool-kit/ToolExport';
import { progressAt, triggerAt } from '@/data/trigger';
import {
  CARETS, INITIAL, LIMITS, MAX_LEN, MAX_PHRASES, MODES, REACHES, SCROLL_START, TAB_LABEL, FILE_OF, TITLE,
  charCount, codeFor, cssLettersAt, cssTimes, endOf, firstLine, fmtS, followCaret, fullText, hasAstral, hasWide,
  phrasesOf, previewCss, reactProject, runnableHtml, scrollLetters, scrollShownAt, scrollSpan, scrollStagger,
  snapEasing, tabsOf, typerAt, typerLength, typerOptions,
  type Appear, type Caret, type CodeTab, type Mode, type Reach, type Settings,
} from './model';

/**
 * The typewriter effect generator. Each way's preview is the thing itself:
 *
 * - CSS: the generated rules, scoped to the stage, on a <p> of their own. The
 *   transport reads and sets the element's CSSAnimations (getAnimations).
 * - On scroll: scrollText on an element made here by hand (it rewrites its
 *   children, so React never renders into it), inside a small scroll box.
 *   scrollText reads only the window's scroll, so the box's scroll becomes a
 *   progress with the library's own trigger arithmetic (data/trigger.ts) and
 *   drives it through seek(). The caret is followCaret(), the generated one.
 * - JS typer: typerAt(), the generated typer's schedule as a function of time,
 *   on a clock the transport can pause and scrub.
 *
 * Under reduced motion nothing plays by itself: the CSS and the typer hold
 * still and the slider steps through them; scrollText does what it does for
 * every reader who asks, and shows the text whole.
 */

type TextInstance = ReturnType<typeof import('svg-scroll-draw/text').scrollText>;

const STAGE = '.site .typ-stage';
const SCROLL_MS = 2600;
/** The scroll box's height in typewriter.css, until it is measured. */
const VP = 280;

const RM = '(prefers-reduced-motion: reduce)';
const subscribeReduced = (cb: () => void) => {
  const mq = window.matchMedia(RM);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
};
const getReduced = () => window.matchMedia(RM).matches;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const secs = (ms: number) => `${(ms / 1000).toFixed(2)} s`;

export function TypewriterGenerator({ version }: { version: string }) {
  const [s, setS] = useState<Settings>(INITIAL);
  const [pick, setPick] = useState<CodeTab>('css');
  const reduced = useSyncExternalStore(subscribeReduced, getReduced, () => false);
  const update = (patch: Partial<Settings>) => setS((p) => ({ ...p, ...patch }));

  const phrases = useMemo(() => phrasesOf(s.text), [s.text]);
  const line = phrases[0];
  const tabs = tabsOf(s);
  const tab: CodeTab = tabs.includes(pick) ? pick : 'css';
  const code = useMemo(() => codeFor(s, tab), [s, tab]);
  const html = useMemo(() => runnableHtml(s, version), [s, version]);
  const react = useMemo(() => reactProject(s, version), [s, version]);
  const css = useMemo(() => previewCss(s, STAGE), [s]);
  const mode = MODES.find((m) => m.key === s.mode) ?? MODES[0];
  const timed = s.mode !== 'scroll';
  const eraseUsed = s.loop || (s.mode === 'typer' && phrases.length > 1);
  const holdUsed = eraseUsed;

  return (
    <div className="typ">
      <div className="typ-panel">
        <div className="typ-mode">
          <span className="typ-k">Way to type</span>
          <Seg
            label="Way to type"
            value={s.mode}
            options={MODES.map((m) => ({ key: m.key, label: m.label }))}
            onChange={(v) => update({ mode: v as Mode })}
          />
          <p className="typ-mode-d">{mode.what}</p>
        </div>

        <div className="typ-view">
          <style>{css}</style>
          {s.mode === 'css' ? (
            <CssStage s={s} css={css} reduced={reduced} />
          ) : s.mode === 'scroll' ? (
            <ScrollStage s={s} reduced={reduced} />
          ) : (
            <TyperStage s={s} reduced={reduced} />
          )}
        </div>

        <div className="typ-controls">
          <fieldset className="typ-group">
            <legend>Text</legend>
            <label className="typ-field">
              <span>One phrase per line <em>· up to {MAX_PHRASES}, {MAX_LEN} characters each</em></span>
              <textarea
                value={s.text}
                rows={4}
                maxLength={MAX_PHRASES * (MAX_LEN + 1)}
                spellCheck={false}
                onChange={(e) => update({ text: e.target.value })}
              />
            </label>
            <p className="typ-help">
              {phrases.length} {phrases.length === 1 ? 'phrase' : 'phrases'} · the first is {charCount(line)} characters.{' '}
              {s.mode === 'typer' ? 'The typer types each in turn.' : 'This way types the first line only.'}
            </p>
          </fieldset>

          {timed ? (
            <fieldset className="typ-group">
              <legend>Timing</legend>
              <Range
                label="Typing speed" unit="ms per letter" value={s.speed} min={LIMITS.speed[0]} max={LIMITS.speed[1]} step={5}
                onChange={(v) => update({ speed: v })}
              />
              <Range
                label="Delete speed" unit="ms per letter" value={s.erase} min={LIMITS.erase[0]} max={LIMITS.erase[1]} step={5}
                disabled={!eraseUsed} onChange={(v) => update({ erase: v })}
              />
              <Range
                label="Hold" unit="ms with the whole phrase" value={s.hold} min={LIMITS.hold[0]} max={LIMITS.hold[1]} step={100}
                disabled={!holdUsed} onChange={(v) => update({ hold: v })}
              />
              <div className="typ-field">
                <span>Loop</span>
                <Seg
                  label="Loop"
                  value={s.loop ? 'on' : 'off'}
                  options={[{ key: 'on', label: 'delete and retype' }, { key: 'off', label: 'type once' }]}
                  onChange={(v) => update({ loop: v === 'on' })}
                />
              </div>
              <p className="typ-help">
                {s.mode === 'css'
                  ? s.loop
                    ? 'The CSS types the line, holds it, deletes it, leaves a short blank and starts again.'
                    : 'The CSS types the line once and stops; nothing is deleted.'
                  : s.loop
                    ? 'Every phrase is typed, held, deleted, and the next one typed, for ever.'
                    : phrases.length > 1
                      ? 'Each phrase is typed and deleted in turn; the last one stays.'
                      : 'The phrase is typed once and stays.'}
              </p>
              <div className="typ-field">
                <span>Start</span>
                <Seg
                  label="Start"
                  value={s.start}
                  options={[{ key: 'load', label: 'on load' }, { key: 'scroll', label: 'when scrolled into view' }]}
                  onChange={(v) => update({ start: v as Settings['start'] })}
                />
              </div>
              {s.start === 'scroll' ? (
                <p className="typ-help">
                  {s.mode === 'css'
                    ? 'CSS cannot wait for the reader: a few lines of JavaScript hold the animation paused until the line’s top is 85% of the way down the window. The preview plays as if it had.'
                    : 'The typer waits until the text’s top is 85% of the way down the window. The preview plays as if it had.'}
                </p>
              ) : null}
            </fieldset>
          ) : (
            <fieldset className="typ-group">
              <legend>Scroll · scrollText</legend>
              <div className="typ-field">
                <span>Scroll it takes · starts at {SCROLL_START}, ends at {endOf(s.reach)}</span>
                <Seg
                  label="Scroll it takes"
                  value={s.reach}
                  options={REACHES.map((r) => ({ key: r.key, label: r.label }))}
                  onChange={(v) => update({ reach: v as Reach })}
                />
              </div>
              <div className="typ-field">
                <span>Each letter</span>
                <Seg
                  label="Each letter"
                  value={s.appear}
                  options={[{ key: 'snap', label: 'appears whole' }, { key: 'fade', label: 'fades in' }]}
                  onChange={(v) => update({ appear: v as Appear })}
                />
              </div>
              <div className="typ-field">
                <span>Scrolling back up</span>
                <Seg
                  label="Scrolling back up"
                  value={s.once ? 'stay' : 'untype'}
                  options={[{ key: 'stay', label: 'stays typed' }, { key: 'untype', label: 'un-types it' }]}
                  onChange={(v) => update({ once: v === 'stay' })}
                />
              </div>
              <p className="typ-help">
                scrollText follows the scroll position, so it has no speed of its own: the letters share the scroll
                between the start and end lines.{' '}
                {s.once ? 'once: true (its default) keeps the furthest point reached.' : 'once: false un-types it as you scroll back.'}
              </p>
            </fieldset>
          )}

          <fieldset className="typ-group">
            <legend>Caret</legend>
            <div className="typ-field">
              <span>Style</span>
              <Seg
                label="Caret style"
                value={s.caret}
                options={CARETS.map((c) => ({ key: c.key, label: c.label }))}
                onChange={(v) => update({ caret: v as Caret })}
              />
            </div>
            <div className="typ-field">
              <span>Blink</span>
              <Seg
                label="Blink"
                value={s.blink ? 'on' : 'off'}
                options={[{ key: 'on', label: 'blinks' }, { key: 'off', label: 'steady' }]}
                disabled={s.caret === 'none'}
                onChange={(v) => update({ blink: v === 'on' })}
              />
            </div>
            <p className="typ-help">
              {s.mode === 'css'
                ? 'A border on the line itself: overflow: hidden clips the letters, never the border.'
                : 'An empty ::after, as wide as the caret and pulled back by the same, so the text never moves.'}
              {s.mode === 'typer' && s.blink && s.caret !== 'none' ? ' It holds still while letters come and go, and blinks in the pauses.' : ''}
            </p>
          </fieldset>
        </div>

        <Messages s={s} phrases={phrases} reduced={reduced} />
      </div>

      <div className="typ-code">
        <div className="typ-tabs" role="tablist" aria-label="Code">
          {tabs.map((t) => (
            <button key={t} type="button" role="tab" aria-selected={tab === t} className="typ-tab" onClick={() => setPick(t)}>
              {TAB_LABEL[t]}
            </button>
          ))}
        </div>
        <CodeBox file={FILE_OF[tab]}>{code}</CodeBox>
        <p className="typ-hint">
          {s.mode === 'css'
            ? `No library. The CSS is cut to this line’s ${charCount(line)} letters: a new line needs it made again.`
            : s.mode === 'scroll'
              ? 'Options at scrollText’s defaults are left out; from is always written, since its default also moves each letter 24px.'
              : 'No library: the typer is the function at the end of the script. Options at its defaults are left out of the call.'}
        </p>
        <ToolExport title={TITLE} filename="typewriter.html" html={html} react={react} />
      </div>
    </div>
  );
}

// ── Messages ─────────────────────────────────────────────────────────────────

function Messages({ s, phrases, reduced }: { s: Settings; phrases: string[]; reduced: boolean }) {
  const line = phrases[0];
  const out: ReactNode[] = [];
  if (s.mode !== 'typer' && phrases.length > 1) {
    out.push(
      <p key="one" className="typ-note">
        {s.mode === 'css' ? 'CSS types one line, so this way uses the first.' : 'This way types one text: the first line.'} To
        type the others in turn, use the JS typer.
      </p>,
    );
  }
  if (s.mode === 'css' && hasWide(line)) {
    out.push(
      <p key="wide" className="typ-warn" role="status">
        This line has characters wider than 1ch, such as emoji or Chinese, Japanese or Korean, so the width in ch runs out
        before the last letters: they never show. Use the JS typer for this text.
      </p>,
    );
  }
  if (s.mode === 'scroll' && hasAstral(line)) {
    out.push(
      <p key="astral" className="typ-warn" role="status">
        scrollText 2.23.3 splits the text into UTF-16 units, so an emoji, or any character outside the Basic Multilingual
        Plane, becomes two halves that show as �. Leave them out of this way, or use the JS typer, which counts characters
        with Array.from.
      </p>,
    );
  }
  if (reduced) {
    out.push(
      <p key="rm" className="typ-note">
        {s.mode === 'scroll'
          ? 'Your system asks for reduced motion, so scrollText shows the text whole at once, as it does for every reader who asks.'
          : s.mode === 'css'
            ? 'Your system asks for reduced motion, so the preview holds still: drag the time slider to step through it. The CSS’s own reduced-motion rule shows readers who ask the whole line.'
            : 'Your system asks for reduced motion, so the preview holds still on what those readers get, every phrase: drag the time slider to step through the typing.'}
      </p>,
    );
  }
  return out.length ? <div className="typ-msgs">{out}</div> : null;
}

// ── CSS ──────────────────────────────────────────────────────────────────────

function CssStage({ s, css, reduced }: { s: Settings; css: string; reduced: boolean }) {
  const el = useRef<HTMLParagraphElement>(null);
  const raf = useRef(0);
  const [now, setNow] = useState(0);
  const [playing, setPlaying] = useState(false);
  /** Under reduced motion: where the slider was last set, for this CSS. */
  const [still, setStill] = useState({ css: '', t: 0 });
  const line = firstLine(s);
  const t = cssTimes(s);
  const span = t.total;
  // The moment the line is whole, where the preview rests under reduced motion.
  const whole = s.loop ? t.type + s.hold / 2 : t.type;

  const anims = () => el.current?.getAnimations() ?? [];

  /** Read the typing animation's clock into the transport, every frame while it runs. */
  const follow = useCallback(() => {
    cancelAnimationFrame(raf.current);
    const tick = () => {
      const a = el.current?.getAnimations()[0];
      if (!a) return;
      setNow(Number(a.currentTime ?? 0));
      const running = a.playState === 'running';
      setPlaying(running);
      if (running) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  }, []);

  // New CSS mounts a new line (keyed on it), whose animations start from 0.
  useEffect(() => {
    if (!reduced) follow();
    return () => cancelAnimationFrame(raf.current);
  }, [css, reduced, follow]);

  function replay() {
    for (const a of anims()) {
      a.currentTime = 0;
      a.play();
    }
    follow();
  }

  function toggle() {
    const list = anims();
    if (!list.length) return;
    const running = list[0].playState === 'running';
    for (const a of list) {
      if (running) a.pause();
      else a.play();
    }
    follow();
  }

  function scrub(v: number) {
    if (reduced) return setStill({ css, t: v });
    for (const a of anims()) {
      a.pause();
      a.currentTime = v;
    }
    // Now, not on the next frame: the slider is controlled, and React puts back
    // the value it last rendered when the state has not moved with it.
    setNow(v);
    setPlaying(false);
    follow();
  }

  // Under reduced motion the site stops every CSS animation, so the stage is
  // drawn from the same numbers instead: the width the CSS has at that moment,
  // and a steady caret. It rests where the line is whole.
  const clock = reduced ? (still.css === css ? still.t : whole) : now;
  const at = s.loop ? ((clock % span) + span) % span : Math.min(clock, span);
  const shown = cssLettersAt(s, clock);
  const held = reduced ? { animation: 'none', width: `${shown}ch` } : undefined;

  return (
    <>
      <p className="typ-k">Preview · the CSS itself, {t.n} letters</p>
      <div className="typ-stage is-css">
        <p key={css} ref={el} className="typewriter" style={held}>{line}</p>
      </div>
      <div className="typ-transport">
        {reduced ? null : (
          <span className="typ-btns">
            <button type="button" className="typ-btn" onClick={replay}>↺ Replay</button>
            <button type="button" className="typ-btn" onClick={toggle}>{playing ? '❚❚ Pause' : '▶ Play'}</button>
          </span>
        )}
        <label className="typ-scrub">
          <span>Time · {secs(at)} of {secs(span)} · {shown} of {t.n} letters</span>
          <input type="range" min={0} max={span} step={10} value={Math.round(at)} onChange={(e) => scrub(Number(e.target.value))} />
        </label>
      </div>
      <dl className="typ-facts">
        <div><dt>Typing</dt><dd>{t.n} × {s.speed} ms = {fmtS(t.type)}, in steps({t.n})</dd></div>
        {s.loop ? (
          <div><dt>One loop</dt><dd>{fmtS(t.type)} + {fmtS(s.hold)} held + {fmtS(t.erase)} deleting + a short blank = {fmtS(t.total)}</dd></div>
        ) : (
          <div><dt>Then</dt><dd>{s.caret === 'none' ? 'it stays' : s.blink ? 'it stays, and the caret starts to blink' : 'it stays, with a steady caret'}</dd></div>
        )}
        <div><dt>Width</dt><dd>0 → {t.n}ch, one 1ch step per letter</dd></div>
      </dl>
    </>
  );
}

// ── JS typer ─────────────────────────────────────────────────────────────────

function TyperStage({ s, reduced }: { s: Settings; reduced: boolean }) {
  const phrases = useMemo(() => phrasesOf(s.text), [s.text]);
  const o = typerOptions(s);
  const len = typerLength(phrases, o);
  const key = JSON.stringify([phrases, o]);
  const raf = useRef(0);
  const origin = useRef(0);
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  /** Under reduced motion: the settings the slider was last moved for. */
  const [scrubbed, setScrubbed] = useState('');

  const run = useCallback((from: number) => {
    cancelAnimationFrame(raf.current);
    origin.current = performance.now() - from;
    const tick = (now: number) => {
      const tt = now - origin.current;
      const more = o.loop || tt < len;
      setT(more ? tt : len);
      setPlaying(more);
      if (more) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  }, [o.loop, len]);

  // New settings start the typer again; under reduced motion nothing plays by itself.
  useEffect(() => {
    if (!reduced) run(0);
    return () => cancelAnimationFrame(raf.current);
  }, [key, reduced, run]);

  function stop() {
    cancelAnimationFrame(raf.current);
    setPlaying(false);
  }

  function scrub(v: number) {
    stop();
    setT(v);
    setScrubbed(key);
  }

  const still = reduced && scrubbed !== key;
  const at = o.loop ? t % len : Math.min(t, len);
  const frame = still ? { text: fullText(phrases), busy: false, done: true, phrase: 0 } : typerAt(phrases, o, at);

  return (
    <>
      <p className="typ-k">Preview · the typer’s clock, {phrases.length} {phrases.length === 1 ? 'phrase' : 'phrases'}</p>
      <div className="typ-stage is-typer">
        <p className={`typer${frame.busy ? ' is-typing' : ''}`}>
          <span className="typer-copy">{fullText(phrases)}</span>
          <span className="typer-text" aria-hidden="true">{frame.text}</span>
        </p>
      </div>
      <div className="typ-transport">
        {reduced ? null : (
          <span className="typ-btns">
            <button type="button" className="typ-btn" onClick={() => run(0)}>↺ Replay</button>
            <button type="button" className="typ-btn" onClick={() => (playing ? stop() : run(at >= len && !o.loop ? 0 : at))}>
              {playing ? '❚❚ Pause' : '▶ Play'}
            </button>
          </span>
        )}
        <label className="typ-scrub">
          <span>
            Time · {secs(at)} of {secs(len)}
            {still ? ' · held still' : frame.done ? ' · done' : ` · phrase ${frame.phrase + 1} of ${phrases.length}`}
          </span>
          <input type="range" min={0} max={len} step={10} value={Math.round(at)} onChange={(e) => scrub(Number(e.target.value))} />
        </label>
      </div>
      <dl className="typ-facts">
        <div><dt>Each phrase</dt><dd>{fmtS(o.pause)} blank, a letter every {s.speed} ms, held {fmtS(s.hold)}, a letter gone every {s.erase} ms</dd></div>
        <div>
          <dt>{s.loop ? 'One round' : 'Done after'}</dt>
          <dd>{fmtS(len)}{s.loop ? ` for ${phrases.length === 1 ? 'the phrase' : `all ${phrases.length} phrases`}, then again` : ', on the last phrase'}</dd>
        </div>
      </dl>
    </>
  );
}

// ── On scroll ────────────────────────────────────────────────────────────────

type Geo = { top: number; height: number; vp: number; max: number };

function ScrollStage({ s, reduced }: { s: Settings; reduced: boolean }) {
  const line = firstLine(s);
  const n = scrollLetters(line);
  const end = endOf(s.reach);
  const instKey = `${line}|${s.appear}|${end}|${s.once}`;
  const boxRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const inst = useRef<TextInstance | null>(null);
  const shownRef = useRef(0);
  const raf = useRef(0);
  const [geo, setGeo] = useState<Geo | null>(null);
  const [scroll, setScroll] = useState(0);
  const [kept, setKept] = useState({ key: '', p: 0 });

  const tS = geo ? triggerAt(SCROLL_START, geo.top, geo.height, geo.vp) : 0;
  const tE = geo ? triggerAt(end, geo.top, geo.height, geo.vp) : 0;
  const raw = geo ? progressAt(scroll, tS, tE) : 0;
  const keptP = kept.key === instKey ? kept.p : 0;
  const shown = s.once ? Math.max(keptP, raw) : raw;

  // The box and the text's place in it.
  useEffect(() => {
    const box = boxRef.current;
    const host = hostRef.current;
    if (!box || !host) return;
    const measure = () => {
      const r = host.getBoundingClientRect();
      const b = box.getBoundingClientRect();
      setGeo({
        top: r.top - b.top - box.clientTop + box.scrollTop,
        height: r.height,
        vp: box.clientHeight || VP,
        max: Math.max(0, box.scrollHeight - box.clientHeight),
      });
    };
    const ro = new ResizeObserver(measure);
    ro.observe(box);
    ro.observe(host);
    return () => ro.disconnect();
  }, []);

  // scrollText on a fresh element, driven by seek(); the caret follows it.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let live = true;
    let made: TextInstance | null = null;
    let unfollow = () => {};
    const el = document.createElement('p');
    el.className = 'typed';
    el.textContent = line;
    host.replaceChildren(el);
    import('svg-scroll-draw/text').then(({ scrollText }) => {
      if (!live) return;
      made = scrollText(el, {
        split: 'chars',
        stagger: scrollStagger(n),
        easing: appearEasing(s.appear),
        from: { opacity: 0 },
      });
      made.seek(shownRef.current);
      inst.current = made;
      unfollow = followCaret(el);
    });
    return () => {
      live = false;
      unfollow();
      made?.destroy();
      inst.current = null;
      el.remove();
    };
  }, [line, n, s.appear]);

  useEffect(() => {
    shownRef.current = shown;
    inst.current?.seek(shown);
  }, [shown]);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const play = useCallback(() => {
    cancelAnimationFrame(raf.current);
    const box = boxRef.current;
    if (!box || !geo) return;
    const lead = geo.vp * 0.12;
    const from = clamp(Math.min(tS, tE) - lead, 0, geo.max);
    const to = clamp(Math.max(tS, tE) + lead, 0, geo.max);
    setKept({ key: instKey, p: 0 });
    box.scrollTop = from;
    if (getReduced()) {
      box.scrollTop = to;
      return;
    }
    let t0 = -1;
    const tick = (now: number) => {
      if (t0 < 0) t0 = now;
      const k = Math.min(1, (now - t0) / SCROLL_MS);
      box.scrollTop = from + (to - from) * k;
      if (k < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  }, [geo, tS, tE, instKey]);

  // Kept current for the timer below, which outlives the render that set it.
  const playRef = useRef(play);
  const midRef = useRef(0);
  useEffect(() => {
    playRef.current = play;
    midRef.current = (tS + tE) / 2;
  }, [play, tS, tE]);

  // A new text or setting plays the scroll through once, so the change shows;
  // under reduced motion the box rests half way through the window instead.
  const ready = geo != null;
  useEffect(() => {
    if (!ready) return;
    const id = setTimeout(() => {
      const box = boxRef.current;
      if (!getReduced()) playRef.current();
      else if (box) box.scrollTop = midRef.current;
    }, 120);
    return () => clearTimeout(id);
  }, [ready, instKey]);

  function stop() {
    cancelAnimationFrame(raf.current);
  }

  function jump(y: number) {
    stop();
    const box = boxRef.current;
    if (!box) return;
    box.scrollTop = clamp(y, 0, geo?.max ?? 0);
    // The scroll event comes a frame later; the controlled slider needs it now.
    onScroll(box.scrollTop);
  }

  function onScroll(y: number) {
    setScroll(y);
    if (geo) {
      const p = progressAt(y, tS, tE);
      setKept((k) => ({ key: instKey, p: Math.max(k.key === instKey ? k.p : 0, p) }));
    }
  }

  const letters = reduced ? n : scrollShownAt(n, shown);
  const startPct = SCROLL_START.split(' ')[1];
  const endPct = end.split(' ')[1];
  const span = scrollSpan(s);

  return (
    <>
      <p className="typ-k">Preview · a {Math.round(geo?.vp ?? VP)}px window · scroll it</p>
      <div className="typ-frame">
        <div
          ref={boxRef}
          className="typ-box typ-stage is-scroll"
          tabIndex={0}
          role="region"
          aria-label="Preview window: scroll it to type the text"
          onScroll={(e) => onScroll(e.currentTarget.scrollTop)}
          onWheel={stop}
          onTouchStart={stop}
          onPointerDown={stop}
          onKeyDown={stop}
        >
          <div className="typ-room" />
          <div ref={hostRef} className="typ-host" />
          <div className="typ-room" />
        </div>
        <div className="typ-overlay" aria-hidden="true">
          <span className="typ-line is-start" style={{ top: startPct }}><i>start {startPct}</i></span>
          <span className="typ-line is-end" style={{ top: endPct }}><i>end {endPct}</i></span>
        </div>
      </div>
      <div className="typ-transport">
        <span className="typ-btns">
          <button type="button" className="typ-btn" onClick={play}>↺ Replay</button>
        </span>
        <label className="typ-scrub">
          <span>Scroll · {Math.round(scroll)}px · progress {shown.toFixed(2)} · {letters} of {n} letters</span>
          <input
            type="range" min={0} max={Math.round(geo?.max ?? 0)} step={1} value={Math.round(clamp(scroll, 0, geo?.max ?? 0))}
            onChange={(e) => jump(Number(e.target.value))}
          />
        </label>
      </div>
      <dl className="typ-facts">
        <div><dt>stagger</dt><dd>1 ÷ {n} letters = {scrollStagger(n).toFixed(4)}: each letter its own share, one after another</dd></div>
        <div>
          <dt>Scroll</dt>
          <dd>
            {span}% of the window’s height for {n} letters: {(span / Math.max(1, n)).toFixed(2)}% each, about{' '}
            {Math.round((span / 100) * 900 / Math.max(1, n))}px on a 900px-tall window
          </dd>
        </div>
        <div><dt>Progress</dt><dd>{s.once && keptP > raw ? `kept at ${keptP.toFixed(2)}: once holds the furthest point` : `${raw.toFixed(2)}, from the box’s scroll`}</dd></div>
      </dl>
    </>
  );
}

const appearEasing = (a: Appear) => (a === 'snap' ? snapEasing : undefined);

// ── Pieces ───────────────────────────────────────────────────────────────────

function Seg({
  label, value, options, onChange, disabled = false,
}: {
  label: string;
  value: string;
  options: { key: string; label: string }[];
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <span className="typ-seg" role="radiogroup" aria-label={label} aria-disabled={disabled || undefined}>
      {options.map((o) => (
        <button key={o.key} type="button" role="radio" aria-checked={value === o.key} disabled={disabled} onClick={() => onChange(o.key)}>
          {o.label}
        </button>
      ))}
    </span>
  );
}

function Range({
  label, unit, value, min, max, step, onChange, disabled = false,
}: {
  label: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <label className={`typ-field${disabled ? ' is-off' : ''}`}>
      <span>{label} · {value} {unit}</span>
      <input type="range" min={min} max={max} step={step} value={value} disabled={disabled} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}
