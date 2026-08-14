'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/* ── Constants ───────────────────────────────────────────── */
const W = 88;   // mascot display width
const H = 100;  // mascot display height

/* ── Types ───────────────────────────────────────────────── */
type AnimState =
  | 'idle' | 'clicked'
  | 'shocked' | 'draw' | 'dance' | 'magic'
  | 'celebrate' | 'cheer' | 'think' | 'big-dance';

const ANIM_CLASS: Record<AnimState, string> = {
  idle:        'mascot-bob',
  clicked:     'mascot-clicked',
  shocked:     'mascot-shocked',
  draw:        'mascot-draw',
  dance:       'mascot-dance',
  magic:       'mascot-magic',
  celebrate:   'mascot-celebrate',
  cheer:       'mascot-cheer',
  think:       'mascot-think',
  'big-dance': 'mascot-big-dance',
};

const SECTION_MAP: Record<string, { anim: AnimState; duration: number; quip?: string; quipDelay?: number }> = {
  shocked:     { anim: 'shocked',    duration: 1300, quip: 'Those tools are rough! 😤', quipDelay: 200 },
  draw:        { anim: 'draw',       duration: 1200, quip: 'Watch me draw this! ✏️',    quipDelay: 300 },
  dance:       { anim: 'dance',      duration: 1700, quip: 'Ease-out is my jam! 🎵',    quipDelay: 400 },
  magic:       { anim: 'magic',      duration: 1600, quip: '✨ Now you see me…',         quipDelay: 350 },
  celebrate:   { anim: 'celebrate',  duration: 1700, quip: 'Found all your paths! 🎯',  quipDelay: 300 },
  cheer:       { anim: 'cheer',      duration: 1900, quip: 'onComplete fired! 🎉',       quipDelay: 500 },
  think:       { anim: 'think',      duration: 2000, quip: 'So many options… 📖',        quipDelay: 600 },
  'big-dance': { anim: 'big-dance',  duration: 2300, quip: 'npm i svg-scroll-draw 🚀',  quipDelay: 600 },
};

const CLICK_QUIPS = [
  'Scroll to see me draw! ✏️',
  'Zero deps. Just vibes ✨',
  '~10 KB — tiny but mighty!',
  'I animate SVGs 🎨',
  'Try scrolling slooowly…',
  'IntersectionObserver FTW',
  'requestAnimationFrame! 🚀',
  'SSR safe, I promise 🤝',
];

/* ── Bubble tail — 4 directional variants ────────────────── */
function Tail({ right, bottom }: { right: boolean; bottom: boolean }) {
  const c = '#ff90e8';
  const s = '#000';
  const size = { outer: 13, inner: 11 };

  if (bottom && right) return (
    <>
      <div className="absolute w-0 h-0" style={{ bottom: -size.outer, right: 20, borderLeft: `${size.outer}px solid transparent`, borderTop: `${size.outer}px solid ${s}` }} />
      <div className="absolute w-0 h-0" style={{ bottom: -(size.outer - 2), right: 22, borderLeft: `${size.inner}px solid transparent`, borderTop: `${size.inner}px solid ${c}` }} />
    </>
  );
  if (bottom && !right) return (
    <>
      <div className="absolute w-0 h-0" style={{ bottom: -size.outer, left: 20, borderRight: `${size.outer}px solid transparent`, borderTop: `${size.outer}px solid ${s}` }} />
      <div className="absolute w-0 h-0" style={{ bottom: -(size.outer - 2), left: 22, borderRight: `${size.inner}px solid transparent`, borderTop: `${size.inner}px solid ${c}` }} />
    </>
  );
  if (!bottom && right) return (
    <>
      <div className="absolute w-0 h-0" style={{ top: -size.outer, right: 20, borderLeft: `${size.outer}px solid transparent`, borderBottom: `${size.outer}px solid ${s}` }} />
      <div className="absolute w-0 h-0" style={{ top: -(size.outer - 2), right: 22, borderLeft: `${size.inner}px solid transparent`, borderBottom: `${size.inner}px solid ${c}` }} />
    </>
  );
  return (
    <>
      <div className="absolute w-0 h-0" style={{ top: -size.outer, left: 20, borderRight: `${size.outer}px solid transparent`, borderBottom: `${size.outer}px solid ${s}` }} />
      <div className="absolute w-0 h-0" style={{ top: -(size.outer - 2), left: 22, borderRight: `${size.inner}px solid transparent`, borderBottom: `${size.inner}px solid ${c}` }} />
    </>
  );
}

/* ── Smart bubble — anchors to the correct quadrant ─────── */
function Bubble({ text, isRight, isBottom }: { text: string; isRight: boolean; isBottom: boolean }) {
  const style: React.CSSProperties = {
    position: 'absolute',
    ...(isRight  ? { right: 0 }          : { left: 0 }),
    ...(isBottom ? { bottom: H + 14 }    : { top: H + 14 }),
    pointerEvents: 'none',
    zIndex: 10,
  };

  return (
    <div style={style}>
      <div className="relative bubble-pop">
        <div className="bg-creator-pink border-2 border-pitch-black rounded-2xl px-4 py-2.5 text-[12.5px] font-bold leading-snug shadow-[3px_3px_0px_#000] text-center w-max max-w-[200px] min-w-[120px] break-words whitespace-normal">
          {text}
        </div>
        <Tail right={isRight} bottom={isBottom} />
      </div>
    </div>
  );
}

/* ── Scrolly SVG ─────────────────────────────────────────── */
function ScrollySvg() {
  return (
    <svg width={W} height={H} viewBox="0 0 112 114" fill="none">
      <ellipse cx="56" cy="109" rx="30" ry="6" fill="#000" opacity="0.10" />
      <ellipse cx="43" cy="97" rx="13" ry="8" fill="#ff90e8" stroke="#000" strokeWidth="2.5" />
      <ellipse cx="69" cy="97" rx="13" ry="8" fill="#ff90e8" stroke="#000" strokeWidth="2.5" />
      <line x1="38" y1="98" x2="38" y2="101" stroke="#000" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      <line x1="43" y1="99" x2="43" y2="103" stroke="#000" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      <line x1="48" y1="98" x2="48" y2="101" stroke="#000" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      <circle cx="24" cy="24" r="12" fill="#ff90e8" stroke="#000" strokeWidth="2.5" />
      <circle cx="88" cy="24" r="12" fill="#ff90e8" stroke="#000" strokeWidth="2.5" />
      <circle cx="24" cy="24" r="6"  fill="#f050c4" opacity="0.55" />
      <circle cx="88" cy="24" r="6"  fill="#f050c4" opacity="0.55" />
      <circle cx="56" cy="58" r="42" fill="#ff90e8" stroke="#000" strokeWidth="3" />
      <ellipse cx="42" cy="40" rx="14" ry="10" fill="white" opacity="0.28" transform="rotate(-25 42 40)" />
      <ellipse cx="56" cy="64" rx="21" ry="16" fill="white" opacity="0.38" />
      <path d="M 56 16 Q 66 6 71 14 Q 75 21 69 24" stroke="#000" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <circle cx="69" cy="24" r="2" fill="#000" />
      <g className="eye-blink-l">
        <ellipse cx="38" cy="46" rx="12" ry="13" fill="white" stroke="#000" strokeWidth="2.5" />
        <circle cx="40" cy="47" r="7" fill="#1a1a1a" />
        <circle cx="43" cy="43" r="2.8" fill="white" />
        <circle cx="37" cy="51" r="1.5" fill="#333" />
      </g>
      <g className="eye-blink-r">
        <ellipse cx="74" cy="46" rx="12" ry="13" fill="white" stroke="#000" strokeWidth="2.5" />
        <circle cx="76" cy="47" r="7" fill="#1a1a1a" />
        <circle cx="79" cy="43" r="2.8" fill="white" />
        <circle cx="73" cy="51" r="1.5" fill="#333" />
      </g>
      <ellipse cx="25" cy="62" rx="10" ry="7" fill="#d040a8" opacity="0.30" />
      <ellipse cx="87" cy="62" rx="10" ry="7" fill="#d040a8" opacity="0.30" />
      <ellipse cx="56" cy="60" rx="3.5" ry="2.5" fill="#d040a8" opacity="0.65" />
      <path d="M 36 68 Q 56 84 76 68" stroke="#000" strokeWidth="3" fill="none" strokeLinecap="round" />
      <ellipse cx="16" cy="68" rx="10" ry="7" fill="#ff90e8" stroke="#000" strokeWidth="2.5" transform="rotate(-35 16 68)" />
      <ellipse cx="96" cy="68" rx="10" ry="7" fill="#ff90e8" stroke="#000" strokeWidth="2.5" transform="rotate(35 96 68)" />
      <rect x="84" y="56" width="22" height="28" rx="3.5" fill="white" stroke="#000" strokeWidth="2" />
      <rect x="84" y="56" width="22" height="7" rx="3.5" fill="#ff90e8" stroke="#000" strokeWidth="2" />
      <path d="M 87 72 Q 90.5 67 94 72 Q 97.5 77 94 77" stroke="#000" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <line x1="87" y1="81" x2="103" y2="81" stroke="#d1d5dc" strokeWidth="1.2" />
    </svg>
  );
}

/* ── Main component ──────────────────────────────────────── */
export function Mascot() {
  const [pos,       setPos]       = useState<{ x: number; y: number } | null>(null);
  const [winSize,   setWinSize]   = useState({ w: 0, h: 0 });
  const [quip,      setQuip]      = useState<string | null>(null);
  const [animState, setAnimState] = useState<AnimState>('idle');
  const [dragging,  setDragging]  = useState(false);

  // Refs — avoid stale closures in event handlers
  const posRef      = useRef({ x: 0, y: 0 });
  const animRef     = useRef<AnimState>('idle');
  const dragOffset  = useRef({ x: 0, y: 0 });
  const dragStart   = useRef({ x: 0, y: 0 });
  const didDrag     = useRef(false);
  const isDragging  = useRef(false);

  /* ── setAnim helper ── */
  const setAnim = useCallback((s: AnimState) => {
    animRef.current = s;
    setAnimState(s);
  }, []);

  /* ── Init position + window size ── */
  useEffect(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    setWinSize({ w, h });
    const init = { x: w - W - 40, y: h - H - 24 };
    posRef.current = init;
    setPos(init);

    const onResize = () => {
      setWinSize({ w: window.innerWidth, h: window.innerHeight });
      setPos(prev => {
        if (!prev) return prev;
        const clamped = {
          x: Math.min(prev.x, window.innerWidth  - W),
          y: Math.min(prev.y, window.innerHeight - H),
        };
        posRef.current = clamped;
        return clamped;
      });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  /* ── Quip auto-dismiss ── */
  useEffect(() => {
    if (!quip) return;
    const t = setTimeout(() => setQuip(null), 3000);
    return () => clearTimeout(t);
  }, [quip]);

  /* ── Narrative IntersectionObserver ── */
  useEffect(() => {
    const seen = new Set<string>();

    const trigger = (action: string) => {
      const cfg = SECTION_MAP[action];
      if (!cfg || animRef.current !== 'idle') return;
      setAnim(cfg.anim);
      if (cfg.quip) setTimeout(() => setQuip(cfg.quip!), cfg.quipDelay ?? 300);
      setTimeout(() => setAnim('idle'), cfg.duration);
    };

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const el = entry.target as HTMLElement;
        if ('mascotReset' in el.dataset) {
          if (entry.isIntersecting) seen.clear();
          return;
        }
        if (!entry.isIntersecting) return;
        const action = el.dataset.mascot;
        if (!action || seen.has(action)) return;
        seen.add(action);
        setTimeout(() => trigger(action), 400);
      });
    }, { threshold: 0.25 });

    const observe = () => {
      document.querySelectorAll<HTMLElement>('[data-mascot],[data-mascot-reset]')
              .forEach(el => observer.observe(el));
    };
    observe();
    const mo = new MutationObserver(observe);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => { observer.disconnect(); mo.disconnect(); };
  }, [setAnim]);

  /* ── Drag handlers (pointer events + capture) ── */
  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    isDragging.current = true;
    didDrag.current    = false;
    dragStart.current  = { x: e.clientX, y: e.clientY };
    dragOffset.current = { x: e.clientX - posRef.current.x, y: e.clientY - posRef.current.y };
    setDragging(true);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    const dist = Math.hypot(e.clientX - dragStart.current.x, e.clientY - dragStart.current.y);
    if (dist > 4) didDrag.current = true;
    const next = {
      x: Math.max(0, Math.min(window.innerWidth  - W, e.clientX - dragOffset.current.x)),
      y: Math.max(0, Math.min(window.innerHeight - H, e.clientY - dragOffset.current.y)),
    };
    posRef.current = next;
    setPos(next);
  }, []);

  const onPointerUp = useCallback(() => {
    isDragging.current = false;
    setDragging(false);
  }, []);

  /* ── Click (only fires if no drag happened) ── */
  const onClick = useCallback(() => {
    if (didDrag.current) return;
    if (animRef.current !== 'idle') return;
    setAnim('clicked');
    setTimeout(() => setQuip(CLICK_QUIPS[Math.floor(Math.random() * CLICK_QUIPS.length)]), 340);
    setTimeout(() => setAnim('idle'), 680);
  }, [setAnim]);

  if (!pos) return null;

  /* ── Bubble placement: which quadrant is the mascot in? ── */
  const isRight  = pos.x + W / 2 > winSize.w / 2;
  const isBottom = pos.y + H / 2 > winSize.h / 2;

  return (
    <div
      className="fixed z-50 select-none"
      style={{ left: pos.x, top: pos.y, width: W, height: H, touchAction: 'none' }}
    >
      {/* Smart bubble */}
      {quip && <Bubble text={quip} isRight={isRight} isBottom={isBottom} />}

      {/* Mascot body */}
      <div
        className={`${dragging ? 'cursor-grabbing' : 'cursor-grab'} mascot-wave ${dragging ? '' : ANIM_CLASS[animState]}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onClick={onClick}
        title="Drag me anywhere!"
      >
        <ScrollySvg />
      </div>
    </div>
  );
}
