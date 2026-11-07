'use client';

import './annotate.css';
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react';
import { ScrollDraw } from 'svg-scroll-draw/react';
import { SELF } from '@/data/competitors';
import {
  KEYS,
  SPEED,
  STAGGER,
  buildProof,
  noteSize,
  penSize,
  type Box,
  type Key,
  type Label,
  type Measure,
  type Proof,
  type Rect,
} from './art/proof-geometry';

/* ─────────────────────────────────────────────────────────────────────────────
   Chapter 03 — a printer's proof. The sheet is drawn first, as a technical
   drawing over its own pencil underdrawing: the trim, its offset shadow, crop
   marks, registration targets, a millimetre ruler, the compositor's guides and
   a colour bar. Then the editor marks it up in red, one pen, in order.

   The stage is tall; its child is sticky. The drawing is built in px measured
   off the live page, so it is client-only: once measured, a ScrollDraw that
   covers the whole stage (same box, so the same trigger) is mounted with its
   own sticky child holding the ink. A new measure — a resize, a font swap —
   mounts a fresh one.
   ──────────────────────────────────────────────────────────────────────────── */

const SELECTOR = '.an-ink';
const TRIGGER = { start: 'top top', end: 'bottom bottom' };
/** Underline, loop, double rule, box, margin arrow, stet, insert, sign-off. */
const MARKS = 8;

/* ── Measuring ────────────────────────────────────────────────────────────── */

const r1 = (v: number): number => Math.round(v * 2) / 2;

function rel(r: DOMRect, o: DOMRect): Rect {
  return { x: r1(r.left - o.left), y: r1(r.top - o.top), w: r1(r.width), h: r1(r.height) };
}

function measure(pin: HTMLElement, sheet: HTMLElement, para: HTMLElement): Measure | null {
  const o = pin.getBoundingClientRect();
  if (o.width === 0) return null;
  const pr = para.getBoundingClientRect();
  const cs = getComputedStyle(para);
  const fs = parseFloat(cs.fontSize);
  const lh = parseFloat(cs.lineHeight) || fs * 1.28;
  // The face as the browser resolved it: the first family named, and the weight.
  const family = cs.fontFamily.split(',')[0].replace(/["']/g, '').trim();
  const face = `${family} ${cs.fontWeight}`;
  const block = rel(pr, o);
  const box = {} as Record<Key, Box>;
  for (const k of KEYS) {
    const el = para.querySelector<HTMLElement>(`[data-an="${k}"]`);
    const probe = el?.querySelector<HTMLElement>('.an-bl');
    if (!el || !probe) return null;
    const r = el.getBoundingClientRect();
    box[k] = {
      l: r1(r.left - o.left),
      r: r1(r.right - o.left),
      t: r1(r.top - o.top),
      b: r1(r.bottom - o.top),
      base: r1(probe.getBoundingClientRect().top - o.top),
    };
  }
  // Each line's left and right edge, from the text's own client rects.
  const lines = Math.max(1, Math.round(pr.height / lh));
  const lineL = new Array<number>(lines).fill(Infinity);
  const lineR = new Array<number>(lines).fill(-Infinity);
  const range = document.createRange();
  range.selectNodeContents(para);
  for (const r of Array.from(range.getClientRects())) {
    if (r.width === 0) continue;
    const k = Math.floor(((r.top + r.bottom) / 2 - pr.top) / lh);
    if (k < 0 || k >= lines) continue;
    lineL[k] = Math.min(lineL[k], r1(r.left - o.left));
    lineR[k] = Math.max(lineR[k], r1(r.right - o.left));
  }
  for (let k = 0; k < lines; k++) {
    if (!Number.isFinite(lineL[k])) lineL[k] = block.x;
    if (!Number.isFinite(lineR[k])) lineR[k] = block.x + block.w;
  }
  const kbLine = Math.floor((box.kb.base - block.y) / lh);
  const base0 = r1(box.kb.base - kbLine * lh);
  const W = r1(o.width), H = r1(o.height);
  const compact = W < 900;
  const notes = W >= 1180;
  const sheetR = rel(sheet.getBoundingClientRect(), o);
  const sig = JSON.stringify([W, H, face, fs, lh, sheetR, block, base0, lineL, lineR, box]);
  return { W, H, sheet: sheetR, block, face, fs, lh, base0, lineL, lineR, box, compact, notes, sig };
}

/* ── Reduced motion, as an external store ─────────────────────────────────── */

const REDUCED = '(prefers-reduced-motion: reduce)';
function subscribeReduced(cb: () => void): () => void {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}
const getReduced = (): boolean => window.matchMedia(REDUCED).matches;
const getReducedOnServer = (): boolean => false;

/* ── Pieces of the page ───────────────────────────────────────────────────── */

/** Which of the editor's marks lands on each phrase; the phrase lights when it does. */
const MARK_OF: Record<Key, number> = { kb: 0, deps: 1, native: 2, mit: 3, frame: 5, yours: 6 };

function Mk({ k, lit, children }: { k: Key; lit: number; children: ReactNode }) {
  return (
    <span className={`an-mk an-mk--${k}${lit > MARK_OF[k] ? ' is-on' : ''}`} data-an={k}>
      {children}
      <i className="an-bl" aria-hidden="true" />
    </span>
  );
}

const at = (v: number): CSSProperties => ({ '--an-at': v.toFixed(4) }) as CSSProperties;

function Text({ l, nfs }: { l: Label; nfs: number }) {
  const x = l.x.toFixed(1);
  if (l.kind === 'note') {
    return (
      <text className="an-lab an-note" x={x} y={l.y.toFixed(1)} textAnchor={l.anchor} style={at(l.at)}>
        <tspan className="an-note-t" x={x} dy={(-1.25 * nfs).toFixed(1)}>
          {l.title}
        </tspan>
        <tspan className="an-note-v" x={x} dy={(1.32 * nfs).toFixed(1)}>
          {l.text}
        </tspan>
      </text>
    );
  }
  if (l.kind === 'pen') {
    return (
      <text
        className="an-lab an-pen-note"
        x={x}
        y={l.y.toFixed(1)}
        textAnchor={l.anchor}
        dominantBaseline="central"
        style={at(l.at)}
      >
        {l.text2 ? (
          <>
            <tspan x={x} dy="-0.62em">
              {l.text}
            </tspan>
            <tspan x={x} dy="1.3em">
              {l.text2}
            </tspan>
          </>
        ) : (
          l.text
        )}
      </text>
    );
  }
  return (
    <text
      className={`an-lab an-${l.kind}`}
      x={x}
      y={l.y.toFixed(1)}
      textAnchor={l.anchor}
      style={at(l.at)}
    >
      {l.text}
    </text>
  );
}

const WIDTH = { p: 'an-w-p', s: 'an-w-s', h: 'an-w-h', pen: 'an-w-pen', thin: 'an-w-thin', dot: 'an-w-dot' } as const;

/* Memoised: the phrases re-render as each mark lands; the ~200 paths the
   engine is driving must not. */
const Ink = memo(function Ink({ m, proof, nib }: { m: Measure; proof: Proof; nib: RefObject<SVGGElement | null> }) {
  const sw = Math.min(2.2, Math.max(1.6, (2.2 * m.fs) / 46));
  const nfs = noteSize(m.fs, m.compact);
  /* Type sizes come from the same functions the layout used to fit them. */
  const style = {
    '--an-pen': sw.toFixed(2),
    '--an-thin': Math.max(1.1, sw * 0.66).toFixed(2),
    '--an-nfs': `${nfs.toFixed(2)}px`,
    '--an-pfs': `${penSize(m.fs, m.compact).toFixed(2)}px`,
    '--an-dfs': `${Math.max(11, 0.8 * nfs).toFixed(2)}px`,
  } as CSSProperties;
  return (
    <svg
      className="an-svg"
      width={m.W}
      height={m.H}
      viewBox={`0 0 ${m.W} ${m.H}`}
      style={style}
      aria-hidden="true"
      focusable="false"
    >
      <rect
        className="an-patch an-lab"
        x={proof.patch.x.toFixed(1)}
        y={proof.patch.y.toFixed(1)}
        width={proof.patch.w.toFixed(1)}
        height={proof.patch.h.toFixed(1)}
        style={at(proof.patch.at)}
      />
      {/* `stroke` is set as an attribute too: the library's dev check reads the
          attribute, not the cascade, and would warn once per path (some 230
          here, again on every re-measure). The tone class wins over it. */}
      {proof.slots.map((s, i) =>
        s ? (
          <path
            key={i}
            className={`an-ink ${WIDTH[s.w]} an-t-${s.tone}${s.lead || s.butt ? ' an-butt' : ''}`}
            d={s.d}
            stroke="currentColor"
            data-i={s.tone === 'accent' ? i : undefined}
          />
        ) : (
          <path key={i} className="an-ink an-rest" d="M0 0h1" stroke="currentColor" />
        ),
      )}
      {proof.dots.map((d, i) => (
        <circle
          key={i}
          className="an-lab an-dot"
          cx={d.x.toFixed(1)}
          cy={d.y.toFixed(1)}
          r="2.6"
          style={at(d.at)}
        />
      ))}
      {/* The nib: rides the end of whichever red stroke is being drawn. Not
          an .an-ink, so the engine never sees it. */}
      <defs>
        <radialGradient id="an-glow">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.85" />
          <stop offset="40%" stopColor="var(--accent)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g ref={nib} className="an-nib" style={{ opacity: '0' }}>
        <circle r="11" fill="url(#an-glow)" />
        <circle r="1.9" className="an-nib-core" />
      </g>
      {proof.labels.map((l, i) => (
        <Text key={i} l={l} nfs={nfs} />
      ))}
    </svg>
  );
});

export function Annotate() {
  const stageRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const paraRef = useRef<HTMLParagraphElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const countVal = useRef(0);
  const nibRef = useRef<SVGGElement>(null);
  const nibAt = useRef<{ i: number; el: SVGPathElement | null; len: number }>({ i: -1, el: null, len: 0 });
  const [m, setM] = useState<Measure | null>(null);
  const [lit, setLit] = useState(0);

  /* Measure once laid out, again on any resize of the frame or the text, and
     again when the web font lands — the marks are only as good as the boxes. */
  useEffect(() => {
    const pin = pinRef.current, sheet = sheetRef.current, para = paraRef.current;
    if (!pin || !sheet || !para) return;
    let raf = 0;
    let alive = true;
    const run = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (!alive) return;
        const next = measure(pin, sheet, para);
        if (next) setM((prev) => (prev && prev.sig === next.sig ? prev : next));
      });
    };
    const ro = new ResizeObserver(run);
    ro.observe(pin);
    ro.observe(sheet);
    ro.observe(para);
    const fonts = document.fonts;
    fonts?.ready.then(run);
    fonts?.addEventListener('loadingdone', run);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      fonts?.removeEventListener('loadingdone', run);
    };
  }, []);

  const proof = useMemo(() => (m ? buildProof(m) : null), [m]);

  /* The engine reports stroke 0's alpha, which finishes early, so the callback
     is the per-frame tick and the stage position is read here instead. One
     style write per frame; the count is written only when it changes. */
  const onProgress = useCallback(() => {
    const stage = stageRef.current;
    if (!stage || !proof) return;
    const r = stage.getBoundingClientRect();
    const span = r.height - window.innerHeight;
    const p = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 1;
    stage.style.setProperty('--an-p', p.toFixed(4));
    let n = 0;
    for (const t of proof.markDone) if (p >= t) n++;
    if (n !== countVal.current && countRef.current) {
      countVal.current = n;
      countRef.current.textContent = String(n);
      setLit(n);
    }
    // The nib sits on the end of the red stroke in flight, if one is.
    const g = nibRef.current;
    if (!g) return;
    const pen = proof.pen;
    let j = pen.length - 1;
    while (j >= 0 && pen[j] * STAGGER > p) j--;
    const t = j >= 0 ? (p - pen[j] * STAGGER) * SPEED : 1;
    if (j < 0 || t >= 1) {
      g.style.opacity = '0';
      return;
    }
    const cur = nibAt.current;
    if (cur.i !== pen[j]) {
      const el = g.ownerSVGElement?.querySelector<SVGPathElement>(`[data-i="${pen[j]}"]`) ?? null;
      nibAt.current = { i: pen[j], el, len: el ? el.getTotalLength() : 0 };
    }
    const { el, len } = nibAt.current;
    if (!el) return;
    const pt = el.getPointAtLength(Math.max(0, t) * len);
    g.setAttribute('transform', `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})`);
    g.style.opacity = '1';
  }, [proof]);

  /* Reduced motion: the library draws everything at once and never ticks, so
     show the finished state. */
  const reduced = useSyncExternalStore(subscribeReduced, getReduced, getReducedOnServer);
  const shown = reduced ? MARKS : lit;
  useEffect(() => {
    if (!reduced) return;
    stageRef.current?.style.setProperty('--an-p', '1');
    if (countRef.current) countRef.current.textContent = String(MARKS);
  }, [reduced]);

  const folioAt = proof ? proof.labels.find((l) => l.kind === 'num')?.at ?? 0 : -1;

  return (
    <div className="an-stage" ref={stageRef}>
      <div className="an-pin" ref={pinRef}>
        {m && proof && (
          /* The pencil underdrawing: static, in its own SVG under the text, so
             the per-frame ink updates never repaint it. */
          <svg
            className="an-svg an-svg-pencil"
            width={m.W}
            height={m.H}
            viewBox={`0 0 ${m.W} ${m.H}`}
            aria-hidden="true"
            focusable="false"
          >
            {proof.pencil.map((s, i) => (
              <path key={i} className="an-pencil" d={s.d} />
            ))}
          </svg>
        )}
        <div className="an-frame">
          <header className="an-head">
            <p className="an-kicker">
              <span>03 / annotations, drawn in order</span>
              <span className="an-count" aria-hidden="true">
                <span ref={countRef}>0</span> / {MARKS} marks
              </span>
            </p>
            <h2 className="an-title" id="an-title">
              Notes in the margin, drawn as you read
            </h2>
          </header>
          <div className="an-plate">
            <div className="an-sheet" id="proof" ref={sheetRef}>
              <p className="an-folio" style={at(folioAt)} aria-hidden="true">
                <span>PROOF 03 · README.md · REV {SELF.version}</span>
                <span>SHEET 1 / 1</span>
              </p>
              <p className="an-p" ref={paraRef}>
                svg-scroll-draw is <Mk k="kb" lit={shown}>10&nbsp;KB</Mk> gzipped with <Mk k="deps" lit={shown}>zero dependencies</Mk>. It
                draws on the browser’s <Mk k="native" lit={shown}>native scroll timeline</Mk> where one exists and falls back
                to <Mk k="frame" lit={shown}>a frame loop</Mk> where it doesn’t — and it is <Mk k="mit" lit={shown}>MIT</Mk>, so it
                is <Mk k="yours" lit={shown}>Yours</Mk>.
              </p>
            </div>
          </div>
          {/* Broken like real code: the options on their own line on a phone,
              on one line where the column is wide enough. */}
          <code className="an-code">
            <span className="an-c-call">
              <span className="an-c-l">
                <span className="an-c-fn">scrollDraw</span>(<span className="an-c-str">&apos;#proof&apos;</span>, {'{'}
              </span>
              <span className="an-c-l an-c-in">
                stagger: <span className="an-c-num">{STAGGER}</span>, speed: <span className="an-c-num">{SPEED}</span>
              </span>
              <span className="an-c-l">{'})'}</span>
            </span>
            {/* Counted off the drawing as built for this screen. */}
            {proof && (
              <span className="an-c-cm">
                {'// '}
                {proof.sheetStrokes} sheet strokes, {proof.penStrokes} in red
              </span>
            )}
          </code>
        </div>
      </div>
      {m && proof && (
        <ScrollDraw
          key={m.sig}
          className="an-draw"
          selector={SELECTOR}
          trigger={TRIGGER}
          stagger={STAGGER}
          speed={SPEED}
          onProgress={onProgress}
        >
          <div className="an-draw-pin">
            <Ink m={m} proof={proof} nib={nibRef} />
          </div>
        </ScrollDraw>
      )}
    </div>
  );
}
