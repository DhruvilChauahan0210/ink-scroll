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

/* ── Ink bottle SVG ───────────────────────────────────────
   An ink bottle holding a quill. The drawing is the artwork supplied for the
   project; what is added here is the rigging that lets it move:

   · Gradient ids are namespaced (`mascot-glass`, `mascot-cork`). Bare ids like
     `glass` are document-global once the SVG is inlined, so any other inline
     SVG declaring the same id would silently repaint this one.
   · The eyes sit in `.eye-blink-l` / `.eye-blink-r` so the existing blink
     keyframe drives them, with each pupil and catchlight inside the group so
     they shut together rather than sliding.
   · The quill sits in `.mascot-quill`, rotating about the glove so it sways
     while idle instead of being a static prop.

   The source viewBox is 800×900, an aspect of 0.889 against the component's
   88×100 frame at 0.88, so it drops in without letterboxing. */
function ScrollySvg() {
  /* Every ink-coloured outline in the artwork resolves through one token, so
     the character re-inks itself for the dark theme instead of relying on a
     glow to rescue a near-black bottle on a near-black page. */
  const outline = 'var(--mascot-outline)';

  return (
    <svg width={W} height={H} viewBox="0 0 800 900" className="mascot-art">
      <defs>
        <linearGradient id="mascot-glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="var(--mascot-glass-a)" />
          <stop offset="55%"  stopColor="var(--mascot-glass-b)" />
          <stop offset="100%" stopColor="var(--mascot-glass-c)" />
        </linearGradient>
        <linearGradient id="mascot-cork" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="#ffc86f" />
          <stop offset="100%" stopColor="#d96d35" />
        </linearGradient>
      </defs>

      {/* Contact shadow. Kept separate from the body so the body can squash
          against it without the shadow squashing too. */}
      <ellipse className="mascot-shadow" cx="420" cy="842" rx="250" ry="28" fill="var(--mascot-shadow)" />

      {/* Left arm assembly. Rotates about the SHOULDER at 300,480 — the
          previous version pivoted about the glove, which swung the shoulder
          off the bottle and detached the arm. */}
      <g className="mascot-arm-l">
        {/* The quill gets its own smaller counter-rotation about the grip, so
            it lags the hand rather than moving rigidly with it. That drag is
            what stops the swing reading as one flat rotating sticker. */}
        <g className="mascot-quill">
          <g stroke={outline} strokeWidth="10" strokeLinejoin="round" strokeLinecap="round">
            <path d="M160 350 C95 260 120 120 275 55 C245 165 225 260 160 350 Z" fill="#8fb2ff" />
            <path d="M160 350 C190 255 220 160 275 55" fill="none" />
            <path d="M175 285 L120 245 M190 245 L140 205 M205 205 L160 165 M220 165 L190 125" fill="none" />
            <path d="M165 350 L145 420" fill="none" />
            <path d="M145 420 l-8 25 16 -7 12 13 5 -30 z" fill="#d9ecff" />
          </g>
        </g>

        <path d="M300 480 C240 485 205 455 175 420" fill="none" stroke="var(--mascot-limb)" strokeWidth="34" strokeLinecap="round" />

        <g stroke={outline} strokeWidth="8" strokeLinejoin="round">
          <path
            d="M164 390 C135 372 115 392 118 420 C95 423 94 457 117 466 C101 490 127 510 146 497 C157 519 188 510 190 485 C212 477 209 447 190 438 C202 412 186 390 164 390 Z"
            fill="#ffe98f"
          />
          <path d="M132 430 C150 417 168 426 174 442 M122 458 C144 451 161 458 166 475" fill="none" />
        </g>
      </g>

      {/* bottle body */}
      <g stroke={outline} strokeWidth="12" strokeLinejoin="round">
        <path
          d="M300 300 C330 282 338 252 338 220 L338 190 L585 190 L585 225 C585 260 598 286 625 306 C670 340 690 420 682 548 C676 654 621 704 515 710 L360 710 C260 705 215 650 220 548 C226 430 247 338 300 300 Z"
          fill="url(#mascot-glass)"
        />
        <path d="M330 216 C390 232 535 232 595 216 L610 165 C540 142 380 142 315 165 Z" fill="#8de6ef" />
        <path d="M340 188 C405 201 530 201 588 188" fill="none" stroke="#ffffff" strokeWidth="10" opacity=".85" />
        <path
          d="M320 270 C390 295 548 295 610 270 C624 264 632 281 621 295 C555 328 385 328 310 296 C298 283 305 267 320 270 Z"
          fill="#f19a45"
        />
      </g>

      {/* cork */}
      <g stroke={outline} strokeWidth="10" strokeLinejoin="round">
        <path d="M370 80 L550 90 L570 180 L355 170 Z" fill="url(#mascot-cork)" />
        <path d="M530 96 L610 125 L575 190 L540 180 Z" fill="#c95c3c" />
        <g fill="#c95c3c">
          <circle cx="395" cy="115" r="10" /><circle cx="455" cy="120" r="8" />
          <circle cx="510" cy="145" r="7" /><circle cx="415" cy="150" r="6" />
          <circle cx="560" cy="130" r="7" /><circle cx="585" cy="155" r="6" />
        </g>
      </g>

      {/* glass highlights */}
      <path d="M285 355 C260 440 262 580 292 628" fill="none" stroke="#b8fbff" strokeWidth="16" strokeLinecap="round" />
      <path d="M615 340 C650 390 655 455 650 500" fill="none" stroke="#7ae6ef" strokeWidth="14" strokeLinecap="round" />

      {/* face */}
      <g stroke={outline} strokeWidth="9" strokeLinejoin="round">
        <g className="eye-blink-l">
          <ellipse cx="390" cy="455" rx="55" ry="88" fill="#fff" />
          <ellipse cx="405" cy="480" rx="24" ry="50" fill="#121a31" />
          <circle cx="397" cy="461" r="8" fill="#fff" stroke="none" />
        </g>
        <g className="eye-blink-r">
          <ellipse cx="520" cy="455" rx="55" ry="88" fill="#fff" />
          <ellipse cx="505" cy="480" rx="24" ry="50" fill="#121a31" />
          <circle cx="497" cy="461" r="8" fill="#fff" stroke="none" />
        </g>
        <path d="M350 555 C385 610 515 610 550 550 C516 582 386 586 350 555 Z" fill="#0b1020" />
        <path d="M415 579 C445 562 485 565 505 585 C478 606 440 608 415 579 Z" fill="#ef5c50" />
      </g>

      {/* Right arm assembly, pivoting about its own shoulder at 635,470 */}
      <g className="mascot-arm-r">
        <path d="M635 470 C710 490 728 548 744 610" fill="none" stroke="var(--mascot-limb)" strokeWidth="34" strokeLinecap="round" />
        <g className="wave-arm" stroke={outline} strokeWidth="8" strokeLinejoin="round">
          <path
            d="M718 605 C738 585 766 593 773 618 C795 615 807 642 791 659 C806 677 790 704 767 698 C757 722 724 716 720 691 C697 688 691 659 708 646 C697 631 704 615 718 605 Z"
            fill="#ffe98f"
          />
          <path d="M744 630 L747 668 M767 628 L770 663" fill="none" strokeLinecap="round" />
        </g>
      </g>

      {/* legs */}
      <g stroke="var(--mascot-limb)" strokeWidth="28" fill="none" strokeLinecap="round">
        <path d="M390 708 C360 748 330 775 302 804" />
        <path d="M525 710 C548 748 565 770 596 795" />
      </g>

      {/* shoes */}
      <g stroke={outline} strokeWidth="10" strokeLinejoin="round">
        <path d="M305 778 C278 765 245 781 228 806 C210 833 226 861 267 864 C309 867 338 844 335 813 C333 797 323 785 305 778 Z" fill="#1d2948" />
        <path d="M592 778 C620 770 655 783 670 811 C686 841 664 866 621 866 C577 866 552 843 556 813 C558 796 570 784 592 778 Z" fill="#1d2948" />
        <path d="M242 814 C275 822 306 836 326 851" fill="none" stroke="#3a4f7c" strokeWidth="7" />
        <path d="M573 817 C603 810 636 812 661 827" fill="none" stroke="#3a4f7c" strokeWidth="7" />
      </g>
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
