'use client';

import { useState, useRef, useEffect } from 'react';
import { ScrollDraw } from 'svg-scroll-draw/react';
import { scrollDrawGroup, scrollDrawSequence } from 'svg-scroll-draw/group';
import { scrollDrawTimeline } from 'svg-scroll-draw/timeline';
import Link from 'next/link';
import { CopyButton } from './CopyButton';

function CodeBlock({ filename, children }: { filename: string; children: string }) {
  return (
    <div className="rounded-xl overflow-hidden border border-pitch-black text-sm">
      <div className="bg-[#111] flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#444]" />
          <span className="w-2 h-2 rounded-full bg-[#444]" />
          <span className="w-2 h-2 rounded-full bg-[#444]" />
        </div>
        <span className="text-[11px] text-[#666] font-mono">{filename}</span>
        <CopyButton text={children} />
      </div>
      <pre className="bg-[#242423] text-[#e8e8e3] px-3 sm:px-5 py-4 text-[10px] sm:text-[12px] font-mono leading-[1.75] overflow-x-auto">
        {children}
      </pre>
    </div>
  );
}

/* ── Individual examples ──────────────────────────────────── */

const TRIGGER = { start: 'top 88%', end: 'top 25%' } as const;

function LogoReveal() {
  const [blinking, setBlinking] = useState(false);
  const [wordmark, setWordmark] = useState(false);

  function handleComplete() {
    setWordmark(true);
    const blink = (delay: number) => {
      setTimeout(() => setBlinking(true),  delay);
      setTimeout(() => setBlinking(false), delay + 130);
    };
    blink(500);
    blink(950);
  }

  return (
    <div style={{
      background: '#1e1f22',
      width: '100%',
      minHeight: '260px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '20px',
      padding: '36px 24px',
    }}>
      {/* fillOpacity={[0, 1]} floods the body fill in sync with the stroke draw —
          no onComplete hack, no React state for the fill */}
      <ScrollDraw
        easing="ease-out"
        speed={0.95}
        once
        trigger={TRIGGER}
        fillOpacity={[0, 1]}
        onComplete={handleComplete}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="-6 -6 140 110"
          style={{ width: '100%', maxWidth: '220px', display: 'block' }}
          overflow="visible"
        >
          <path
            d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,53.22,6.83,77.19,77.19,0,0,0,49.88,0,105.15,105.15,0,0,0,19.44,8.07C3.66,31.58-1.86,54.65,1,77.53A105.73,105.73,0,0,0,32,96.36a74.37,74.37,0,0,0,6.72-10.93,68.6,68.6,0,0,1-10.64-5.12c.91-.67,1.81-1.37,2.65-2.1a75.22,75.22,0,0,0,72.76,0c.84.73,1.74,1.43,2.65,2.1a68.86,68.86,0,0,1-10.64,5.12,74.74,74.74,0,0,0,6.72,10.93,105.73,105.73,0,0,0,31-18.83C130.1,49.22,123.33,26.54,107.7,8.07Z"
            fill="#5865F2"
            stroke="#5865F2"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Eye holes — white ellipses always on top */}
          <ellipse cx="42.45" cy="53.03" rx="11.42" ry="12.67" fill="white" />
          <ellipse
            cx="84.69" cy="53.03" rx="11.42" ry="12.67" fill="white"
            style={{
              transformBox: 'fill-box', transformOrigin: 'center',
              transform: `scaleY(${blinking ? 0.05 : 1})`,
              transition: 'transform 0.1s ease-in-out',
            }}
          />
        </svg>
      </ScrollDraw>

      <span style={{
        color: wordmark ? '#ffffff' : 'transparent',
        fontFamily: 'system-ui, sans-serif',
        fontWeight: 700,
        fontSize: '18px',
        letterSpacing: '0.02em',
        transition: 'color 0.5s ease 0.15s',
        userSelect: 'none',
      }}>
        Discord
      </span>
    </div>
  );
}

function LineChart() {
  // Monthly Revenue — realistic upward trend with a March dip
  const pts    : [number,number][] = [[55,138],[90,124],[125,132],[160,98],[195,72],[230,50],[265,28]];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul'];
  const vals   = ['$80k','$60k','$40k','$20k'];
  const gridYs = [28,56,84,112];

  const ptPath  = pts.map(([x,y]) => `${x} ${y}`).join(' L ');
  const areaPath = `M ${ptPath} L 265 155 L 55 155 Z`;

  return (
    <ScrollDraw easing="ease-in-out" speed={0.85} once trigger={TRIGGER} selector=".ink">
      <svg width="100%" viewBox="0 0 310 185" fill="none" style={{fontFamily:'monospace', display:'block'}}>
        {/* Static area fill */}
        <path d={areaPath} fill="#ff90e8" fillOpacity="0.07" />
        {/* Static grid */}
        {gridYs.map(y => (
          <line key={y} x1="48" y1={y} x2="278" y2={y} stroke="#f0f0f0" strokeWidth="1" strokeDasharray="4 3" />
        ))}
        {/* Static value labels */}
        {vals.map((v, i) => (
          <text key={v} x="44" y={gridYs[i]+4} textAnchor="end" fontSize="8" fill="#ccc">{v}</text>
        ))}
        {/* Static month labels */}
        {months.map((m, i) => (
          <text key={m} x={pts[i][0]} y="175" textAnchor="middle" fontSize="8" fill="#ccc">{m}</text>
        ))}
        {/* Static data points */}
        {pts.map(([x,y]) => (
          <circle key={x} cx={x} cy={y} r="3.5" fill="#ff90e8" />
        ))}
        {/* Axes — animated */}
        <line className="ink" x1="48" y1="12" x2="48" y2="155" stroke="#e0e0e0" strokeWidth="1.5" />
        <line className="ink" x1="48" y1="155" x2="278" y2="155" stroke="#e0e0e0" strokeWidth="1.5" />
        {/* Data line — animated with color shift */}
        <path className="ink"
          d="M 55 138 C 68 130 78 126 90 124 C 103 122 112 132 125 132 C 138 132 148 100 160 98 C 172 96 183 74 195 72 C 207 70 218 52 230 50 C 242 48 254 30 265 28"
          stroke="#ff90e8" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    </ScrollDraw>
  );
}

function SignatureAnim() {
  return (
    <ScrollDraw easing="ease-out" speed={0.6} stagger={0.35} once trigger={TRIGGER}>
      <svg width="100%" viewBox="0 0 300 145" fill="none" style={{fontFamily:'serif', display:'block'}}>
        {/* Static: document context */}
        <text x="12" y="18" fontSize="8" fill="#ccc" style={{fontFamily:'monospace',letterSpacing:'0.12em',textTransform:'uppercase'}}>Authorized Signature</text>
        {/* Animated: signature path — capital loop + cursive body + flourish */}
        <path
          d="M 18 90 C 14 62 20 34 34 28 C 48 22 62 36 58 56 C 55 70 47 80 54 88 C 60 95 70 91 76 83 C 84 72 86 80 84 90 C 83 97 91 94 103 84 C 114 73 117 81 115 91 C 114 98 123 94 135 84 C 148 72 162 68 175 80 C 185 90 183 102 196 92 C 210 81 220 66 236 74 C 248 80 252 90 265 82 L 275 75"
          stroke="#111" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
        />
        {/* Animated: underline flourish */}
        <path
          d="M 12 112 C 90 122 210 120 282 112"
          stroke="#ff90e8" strokeWidth="1.8" strokeLinecap="round"
        />
        {/* Static: printed name + date */}
        <text x="12"  y="132" fontSize="8" fill="#bbb" style={{fontFamily:'monospace'}}>J. Anderson, CEO</text>
        <text x="220" y="132" fontSize="8" fill="#bbb" style={{fontFamily:'monospace'}}>May 2026</text>
      </svg>
    </ScrollDraw>
  );
}

function Flowchart() {
  // Checkout flow: Cart → Shipping → Payment → Confirmed
  const steps = [
    { x: 8,   label: '🛒', sub: 'Cart',      fill: '#f0f4ff', stroke: '#5865F2' },
    { x: 82,  label: '📦', sub: 'Shipping',  fill: '#fff8f0', stroke: '#f59e0b' },
    { x: 156, label: '💳', sub: 'Payment',   fill: '#fff0fb', stroke: '#ff90e8' },
    { x: 230, label: '✓',  sub: 'Confirmed', fill: '#f0fff4', stroke: '#22c55e' },
  ];
  const BOX_W = 62, BOX_H = 52, BOX_Y = 44, CY = BOX_Y + BOX_H / 2;

  return (
    <ScrollDraw easing="ease-out" speed={1.1} stagger={0.18} once trigger={TRIGGER} selector=".ink">
      <svg width="100%" viewBox="0 0 300 140" fill="none" style={{fontFamily:'system-ui,sans-serif', display:'block'}}>
        {/* Static fills + labels */}
        {steps.map(s => (
          <g key={s.x}>
            <rect x={s.x} y={BOX_Y} width={BOX_W} height={BOX_H} rx="8" fill={s.fill} />
            <text x={s.x + BOX_W/2} y={BOX_Y + 24} textAnchor="middle" fontSize="16">{s.label}</text>
            <text x={s.x + BOX_W/2} y={BOX_Y + 42} textAnchor="middle" fontSize="8" fill="#666">{s.sub}</text>
          </g>
        ))}
        {/* Static: step numbers */}
        {steps.map((s, i) => (
          <text key={`n${i}`} x={s.x + BOX_W/2} y={BOX_Y - 8} textAnchor="middle" fontSize="8" fill="#bbb" style={{fontFamily:'monospace'}}>0{i+1}</text>
        ))}
        {/* Animated: box borders */}
        {steps.map(s => (
          <rect key={`b${s.x}`} className="ink" x={s.x} y={BOX_Y} width={BOX_W} height={BOX_H} rx="8" stroke={s.stroke} strokeWidth="1.8" />
        ))}
        {/* Animated: arrow connectors */}
        {steps.slice(0,-1).map((s, i) => {
          const x1 = s.x + BOX_W, x2 = steps[i+1].x;
          return (
            <g key={`a${i}`}>
              <path className="ink" d={`M ${x1} ${CY} L ${x2} ${CY}`} stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" />
              <path className="ink" d={`M ${x2-6} ${CY-4} L ${x2} ${CY} L ${x2-6} ${CY+4}`} stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          );
        })}
      </svg>
    </ScrollDraw>
  );
}

function MapRoute() {
  return (
    <ScrollDraw easing="ease-in-out" speed={0.75} once trigger={TRIGGER} selector=".ink" strokeColor={['#fbbf24','#ff90e8']}>
      <svg width="100%" viewBox="0 0 300 200" fill="none" style={{fontFamily:'monospace', display:'block'}}>
        {/* Static: city blocks */}
        {[
          [8,8,72,52],[100,8,82,52],[192,8,100,52],
          [8,70,72,52],[192,70,100,52],
          [8,132,72,58],[100,132,82,58],[192,132,100,58],
        ].map(([x,y,w,h],i) => (
          <rect key={i} x={x} y={y} width={w} height={h} rx="4" fill="#f4f4f2" stroke="#e8e8e8" strokeWidth="0.5" />
        ))}
        {/* Static: street labels */}
        <text x="90" y="62" textAnchor="middle" fontSize="7" fill="#ccc">Oak St</text>
        <text x="90" y="128" textAnchor="middle" fontSize="7" fill="#ccc">Main Ave</text>
        <text x="150" y="35" textAnchor="middle" fontSize="7" fill="#ccc">1st St</text>
        {/* Animated: delivery route */}
        <path className="ink"
          d="M 44 175 L 44 132 L 90 132 L 90 70 L 192 70 L 192 34 L 242 34"
          stroke="#fbbf24" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
        />
        {/* Static: start marker — warehouse */}
        <circle cx="44" cy="175" r="8" fill="#fbbf24" />
        <text x="44" y="179" textAnchor="middle" fontSize="8" fill="white">W</text>
        <text x="44" y="194" textAnchor="middle" fontSize="7" fill="#999">Warehouse</text>
        {/* Static: end marker — customer */}
        <circle cx="242" cy="34" r="8" fill="#ff90e8" />
        <text x="242" y="38" textAnchor="middle" fontSize="8" fill="white">C</text>
        <text x="242" y="18" textAnchor="middle" fontSize="7" fill="#999">Customer</text>
        {/* Static: distance badge */}
        <rect x="108" y="92" width="84" height="18" rx="9" fill="white" stroke="#e8e8e8" strokeWidth="1" />
        <text x="150" y="105" textAnchor="middle" fontSize="8" fill="#666">2.4 km · 8 min</text>
      </svg>
    </ScrollDraw>
  );
}

function NetworkDiagram() {
  // App architecture: Browser → API Gateway → (Auth, DB, Cache)
  const services = [
    { x: 110, y: 152, w: 60,  h: 28, label: 'Auth',    fill: '#fff0fb', stroke: '#ff90e8' },
    { x: 120, y: 152, w: 60,  h: 28, label: 'Database', fill: '#f0f4ff', stroke: '#5865F2' },
    { x: 130, y: 152, w: 60,  h: 28, label: 'Cache',    fill: '#fffbeb', stroke: '#f59e0b' },
  ];
  return (
    <ScrollDraw easing="ease-out" speed={1.1} selector=".ink" once trigger={TRIGGER}>
      <svg width="100%" viewBox="0 0 300 200" fill="none" style={{fontFamily:'system-ui,sans-serif', display:'block'}}>
        {/* Static: service boxes */}
        {/* Browser */}
        <rect x="110" y="8" width="80" height="32" rx="6" fill="#f8f8f8" />
        <text x="150" y="29" textAnchor="middle" fontSize="10" fill="#333">🌐 Browser</text>
        {/* API Gateway */}
        <rect x="90" y="78" width="120" height="34" rx="6" fill="#111" />
        <text x="150" y="100" textAnchor="middle" fontSize="10" fill="white">API Gateway</text>
        {/* Auth */}
        <rect x="12" y="152" width="72" height="32" rx="6" fill="#fff0fb" />
        <text x="48" y="173" textAnchor="middle" fontSize="9" fill="#d946ef">🔐 Auth</text>
        {/* Database */}
        <rect x="114" y="152" width="72" height="32" rx="6" fill="#f0f4ff" />
        <text x="150" y="173" textAnchor="middle" fontSize="9" fill="#5865F2">🗄️ Database</text>
        {/* Cache */}
        <rect x="216" y="152" width="72" height="32" rx="6" fill="#fffbeb" />
        <text x="252" y="173" textAnchor="middle" fontSize="9" fill="#d97706">⚡ Cache</text>

        {/* Animated: connection lines */}
        <line className="ink" x1="150" y1="40"  x2="150" y2="78"  stroke="#000" strokeWidth="2" />
        <line className="ink" x1="110" y1="95"  x2="48"  y2="152" stroke="#d946ef" strokeWidth="1.5" strokeDasharray="4 3" />
        <line className="ink" x1="150" y1="112" x2="150" y2="152" stroke="#5865F2" strokeWidth="1.5" strokeDasharray="4 3" />
        <line className="ink" x1="190" y1="95"  x2="252" y2="152" stroke="#d97706" strokeWidth="1.5" strokeDasharray="4 3" />
        {/* Arrowheads */}
        <path className="ink" d="M 143 74 L 150 78 L 157 74" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </ScrollDraw>
  );
}

function GroupDemo() {
  const c1 = useRef<HTMLDivElement>(null);
  const c2 = useRef<HTMLDivElement>(null);
  const c3 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const els = [c1.current, c2.current, c3.current].filter(Boolean) as Element[];
    const instance = scrollDrawGroup(els, {
      easing: 'ease-out',
      speed: 1.1,
      fade: true,
      once: true,
      trigger: TRIGGER,
    });
    return () => instance.destroy();
  }, []);

  const boxCls = 'flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-5 rounded-2xl border border-[#e8e8e8] bg-white min-w-0';

  return (
    <div className="flex gap-2 sm:gap-4 justify-center w-full">
      {/* Speed */}
      <div ref={c1} className={boxCls}>
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="28" stroke="#ff90e8" strokeWidth="2.5" />
          <path d="M20 32 L44 32" stroke="#ff90e8" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M38 25 L45 32 L38 39" stroke="#ff90e8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M32 20 L32 14" stroke="#ff90e8" strokeWidth="2" strokeLinecap="round" />
          <path d="M44 24 L48 20" stroke="#ff90e8" strokeWidth="2" strokeLinecap="round" />
          <path d="M20 24 L16 20" stroke="#ff90e8" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span style={{ fontFamily: 'system-ui', fontSize: 11, color: '#999', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Speed</span>
      </div>

      {/* Size */}
      <div ref={c2} className={boxCls}>
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
          <rect x="12" y="12" width="40" height="40" rx="6" stroke="#ffc900" strokeWidth="2.5" />
          <rect x="22" y="22" width="20" height="20" rx="3" stroke="#ffc900" strokeWidth="2.5" />
          <line x1="32" y1="12" x2="32" y2="7"  stroke="#ffc900" strokeWidth="2" strokeLinecap="round" />
          <line x1="52" y1="32" x2="57" y2="32" stroke="#ffc900" strokeWidth="2" strokeLinecap="round" />
          <line x1="32" y1="52" x2="32" y2="57" stroke="#ffc900" strokeWidth="2" strokeLinecap="round" />
          <line x1="12" y1="32" x2="7"  y2="32" stroke="#ffc900" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span style={{ fontFamily: 'system-ui', fontSize: 11, color: '#999', letterSpacing: '0.08em', textTransform: 'uppercase' }}>~3 KB</span>
      </div>

      {/* Framework */}
      <div ref={c3} className={boxCls}>
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="12" r="7" stroke="#5865F2" strokeWidth="2.5" />
          <circle cx="12" cy="48" r="7" stroke="#5865F2" strokeWidth="2.5" />
          <circle cx="52" cy="48" r="7" stroke="#5865F2" strokeWidth="2.5" />
          <line x1="27" y1="17" x2="17"  y2="43" stroke="#5865F2" strokeWidth="2" strokeLinecap="round" />
          <line x1="37" y1="17" x2="47"  y2="43" stroke="#5865F2" strokeWidth="2" strokeLinecap="round" />
          <line x1="19" y1="48" x2="45"  y2="48" stroke="#5865F2" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span style={{ fontFamily: 'system-ui', fontSize: 11, color: '#999', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Any&nbsp;framework</span>
      </div>
    </div>
  );
}

function SequenceDemo() {
  const c1 = useRef<HTMLDivElement>(null);
  const c2 = useRef<HTMLDivElement>(null);
  const c3 = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const els = [c1.current, c2.current, c3.current].filter(Boolean) as Element[];
    const instance = scrollDrawSequence(els, {
      easing: 'ease-out',
      speed: 1.4,
      fade: true,
      trigger: TRIGGER,
      onComplete: () => setStep((s) => Math.min(s + 1, 3)),
    });
    return () => instance.destroy();
  }, []);

  const steps = [
    { ref: c1, label: 'Code', color: '#ff90e8', num: '01',
      svg: (
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
          <path d="M22 20 L10 32 L22 44" stroke="#ff90e8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M42 20 L54 32 L42 44" stroke="#ff90e8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M36 14 L28 50"        stroke="#ff90e8" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      ),
    },
    { ref: c2, label: 'Build', color: '#ffc900', num: '02',
      svg: (
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
          <path d="M12 46 L12 28 L32 16 L52 28 L52 46 Z" stroke="#ffc900" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M22 46 L22 34 L42 34 L42 46"          stroke="#ffc900" strokeWidth="2.5" strokeLinejoin="round" />
          <line x1="32" y1="16" x2="32" y2="34"          stroke="#ffc900" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      ),
    },
    { ref: c3, label: 'Ship', color: '#22c55e', num: '03',
      svg: (
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
          <path d="M32 8 C32 8 48 20 48 36 C48 44 42 50 32 54 C22 50 16 44 16 36 C16 20 32 8 32 8Z" stroke="#22c55e" strokeWidth="2.5" strokeLinejoin="round" />
          <circle cx="32" cy="36" r="8" stroke="#22c55e" strokeWidth="2.5" />
          <line x1="32" y1="8"  x2="32" y2="28" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4 w-full max-w-[280px] mx-auto">
      {steps.map(({ ref, label, color, num, svg }, i) => (
        <div key={label} className="flex items-center gap-4">
          <div
            ref={ref}
            className="flex items-center justify-center w-20 h-20 rounded-2xl border bg-white shrink-0"
            style={{ borderColor: i < step ? color : '#e8e8e8', transition: 'border-color 0.3s ease' }}
          >
            {svg}
          </div>
          <div>
            <p style={{ fontFamily: 'monospace', fontSize: 10, color: '#bbb', letterSpacing: '0.14em', textTransform: 'uppercase' }}>{num}</p>
            <p style={{ fontFamily: 'system-ui', fontSize: 14, fontWeight: 600, color: i < step ? '#111' : '#bbb', transition: 'color 0.3s ease' }}>{label}</p>
            {i < steps.length - 1 && (
              <div style={{ width: 2, height: 12, background: i < step - 1 ? color : '#e8e8e8', marginTop: 6, marginLeft: 1, borderRadius: 1, transition: 'background 0.3s ease' }} />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function TimelineDemo() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const instance = scrollDrawTimeline(ref.current, {
      trigger: TRIGGER,
      tracks: [
        // Axes first
        { selector: '.tl-axis', from: 0,    to: 0.28, easing: 'ease-out' },
        // Bars staggered, each with its own window
        { selector: '.tl-b1',   from: 0.1,  to: 0.42, easing: 'ease-out' },
        { selector: '.tl-b2',   from: 0.26, to: 0.56, easing: 'ease-out' },
        { selector: '.tl-b3',   from: 0.42, to: 0.72, easing: 'ease-out' },
        { selector: '.tl-b4',   from: 0.58, to: 0.88, easing: 'ease-out' },
        // Trend line last, after all bars are visible
        { selector: '.tl-trend', from: 0.75, to: 1.0,  easing: 'spring'  },
      ],
    });
    return () => instance.destroy();
  }, []);

  const bars = [
    { cls: 'tl-b1', x: 75,  y2: 62,  color: '#ff90e8', label: 'Q1', val: '$92k' },
    { cls: 'tl-b2', x: 135, y2: 32,  color: '#ffc900', label: 'Q2', val: '$122k' },
    { cls: 'tl-b3', x: 195, y2: 78,  color: '#5865F2', label: 'Q3', val: '$77k' },
    { cls: 'tl-b4', x: 255, y2: 44,  color: '#22c55e', label: 'Q4', val: '$111k' },
  ] as const;

  const Y_BASE = 158;

  return (
    <div ref={ref} className="w-full flex justify-center">
      <svg width="100%" viewBox="0 0 310 200" fill="none" style={{ fontFamily: 'monospace', display: 'block' }}>

        {/* Static: subtle grid */}
        {[40, 70, 100, 130].map((offset) => (
          <line key={offset}
            x1="48" y1={Y_BASE - offset} x2="285" y2={Y_BASE - offset}
            stroke="#f0f0f0" strokeWidth="0.5" strokeDasharray="3 3"
          />
        ))}

        {/* Static: y-axis value labels */}
        {[0, 40, 80, 120].map((v, i) => (
          <text key={v} x="42" y={Y_BASE - i * 30 + 4}
            textAnchor="end" fontSize="8" fill="#ccc"
          >${v}k</text>
        ))}

        {/* Static: bar fills (always visible as ghost) */}
        {bars.map(({ x, y2, color }) => (
          <rect key={x} x={x - 16} y={y2} width={32} height={Y_BASE - y2}
            fill={color} fillOpacity="0.07"
          />
        ))}

        {/* Static: x labels + value badges */}
        {bars.map(({ x, label, val, color }) => (
          <g key={x}>
            <text x={x} y={Y_BASE + 13} textAnchor="middle" fontSize="8" fill="#aaa">{label}</text>
            <text x={x} y={22} textAnchor="middle" fontSize="8" fontWeight="bold" fill={color}>{val}</text>
          </g>
        ))}

        {/* Animated: axes */}
        <line className="tl-axis" x1="48" y1="25" x2="48" y2={Y_BASE} stroke="#ccc" strokeWidth="1.5" />
        <line className="tl-axis" x1="48" y1={Y_BASE} x2="288" y2={Y_BASE} stroke="#ccc" strokeWidth="1.5" />

        {/* Animated: bars — thick vertical lines drawing bottom-to-top */}
        {bars.map(({ cls, x, y2, color }) => (
          <line key={cls}
            className={cls}
            x1={x} y1={Y_BASE} x2={x} y2={y2}
            stroke={color} strokeWidth="30" strokeLinecap="round"
          />
        ))}

        {/* Animated: trend line connecting bar peaks */}
        <polyline
          className="tl-trend"
          points={bars.map(({ x, y2 }) => `${x},${y2}`).join(' ')}
          stroke="#111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        />
        {/* Animated: trend dots */}
        {bars.map(({ x, y2 }) => (
          <circle key={x} className="tl-trend"
            cx={x} cy={y2} r="4.5"
            stroke="#111" strokeWidth="2"
          />
        ))}

        {/* Static: "Timeline API" label */}
        <text x="168" y="192" textAnchor="middle" fontSize="8"
          fill="#bbb" letterSpacing="0.1em" style={{ textTransform: 'uppercase' }}>
          Each bar is an independent track
        </text>
      </svg>
    </div>
  );
}

/* ── Example cards data ───────────────────────────────────── */

const EXAMPLES = [
  {
    id: 'logo-reveal',
    label: 'Logo Reveal',
    tag: 'onComplete · fill transition',
    darkPreview: true,
    description:
      'The Discord logo strokes itself in as an outline, then floods with color on completion — followed by a right-eye blink. Uses onComplete to trigger the fill transition and blink sequence.',
    preview: <LogoReveal />,
    code: `// 1. stroke draws on scroll (fill starts transparent)
// 2. onComplete: fill floods in + right eye blinks

<ScrollDraw easing="ease-out" speed={0.95} once
  onComplete={handleComplete}>
  <svg viewBox="0 0 127.14 96.36">
    <path d="M107.7,8.07…"
      fill={filled ? '#5865F2' : 'transparent'}
      stroke="#5865F2" strokeWidth="2.5"
      style={{ transition: 'fill 0.45s ease' }} />

    {/* Left eye — floods white on complete */}
    <ellipse cx="42.45" cy="53.03" rx="11.42" ry="12.67"
      fill={filled ? 'white' : 'transparent'}
      style={{ transition: 'fill 0.45s ease' }} />

    {/* Right eye — blinks via scaleY */}
    <ellipse cx="84.69" cy="53.03" rx="11.42" ry="12.67"
      fill={filled ? 'white' : 'transparent'}
      style={{ transform: \`scaleY(\${blinking ? 0.05 : 1})\`,
               transformBox: 'fill-box', transformOrigin: 'center',
               transition: 'fill 0.45s ease, transform 0.1s ease-in-out' }} />
  </svg>
</ScrollDraw>`,
  },
  {
    id: 'line-chart',
    label: 'Revenue Chart',
    tag: 'selector · strokeColor',
    description:
      'Monthly revenue line draws itself across the chart axes on scroll — axes animate first, then the data line traces in with a color shift from grey to brand pink.',
    preview: <LineChart />,
    code: `<ScrollDraw
  easing="ease-in-out" speed={0.85} once
  selector=".ink"
  strokeColor={['#e2e8f0', '#ff90e8']}
>
  <svg>
    {/* Static: grid, labels, data points, area */}
    {/* .ink elements animate: axes + data line */}
    <line className="ink" {/* y-axis */} />
    <line className="ink" {/* x-axis */} />
    <path className="ink" d="M 55 138 C…" {/* data line */} />
  </svg>
</ScrollDraw>`,
  },
  {
    id: 'signature',
    label: 'Contract Signature',
    tag: 'stagger · ease-out',
    description:
      'CEO signature draws on scroll with a staggered underline flourish — label, printed name and date are static context. Looks like ink drying on a real document.',
    preview: <SignatureAnim />,
    code: `<ScrollDraw
  easing="ease-out" speed={0.6}
  stagger={0.35} once
>
  <svg>
    {/* Static: "Authorized Signature" label, name, date */}
    {/* Animated path 1: cursive signature */}
    <path d="M 18 90 C 14 62…" stroke="#111" strokeWidth="2.2" />
    {/* Animated path 2: underline flourish (starts after sig) */}
    <path d="M 12 112 C 90 122…" stroke="#ff90e8" />
  </svg>
</ScrollDraw>`,
  },
  {
    id: 'flowchart',
    label: 'Checkout Flow',
    tag: 'selector · stagger',
    description:
      'Box borders and arrow connectors draw in sequence across a 4-step checkout process. Static fills and emoji keep the diagram readable before animation starts.',
    preview: <Flowchart />,
    code: `<ScrollDraw
  easing="ease-out" speed={1.1}
  selector=".ink" stagger={0.18} once
>
  <svg>
    {/* Static: filled boxes + emoji + step labels */}
    <rect x={8}   fill="#f0f4ff" />{/* Cart */}
    <rect x={82}  fill="#fff8f0" />{/* Shipping */}
    {/* .ink elements animate: borders + arrows */}
    <rect className="ink" x={8}  stroke="#5865F2" />
    <path className="ink" d="M 70 70 L 82 70" {/* arrow */} />
  </svg>
</ScrollDraw>`,
  },
  {
    id: 'map-route',
    label: 'Delivery Route',
    tag: 'selector · strokeColor',
    description:
      'A delivery route traces itself across a city block map — warehouse to customer. City blocks, street names and the distance badge are static; only the route line animates.',
    preview: <MapRoute />,
    code: `<ScrollDraw
  easing="ease-in-out" speed={0.75} once
  selector=".ink"
  strokeColor={['#fbbf24', '#ff90e8']}
>
  <svg>
    {/* Static: city blocks, street labels, distance badge */}
    {/* Static: start/end markers */}
    {/* Animated: route path only */}
    <path className="ink"
      d="M 44 175 L 44 132 L 90 132…"
      stroke="#fbbf24" strokeWidth="4" />
  </svg>
</ScrollDraw>`,
  },
  {
    id: 'network',
    label: 'API Architecture',
    tag: 'selector · ease-out',
    description:
      'Connection lines between services draw in on scroll — Browser → API Gateway → Auth / Database / Cache. Service boxes and labels are always visible; only the wires animate.',
    preview: <NetworkDiagram />,
    code: `<ScrollDraw
  easing="ease-out" speed={1.1} once
  selector=".ink"
>
  <svg>
    {/* Static: labeled service boxes */}
    <rect … /><text>🌐 Browser</text>
    <rect … /><text>API Gateway</text>
    {/* .ink lines draw the connections */}
    <line className="ink" {/* Browser → API */} />
    <line className="ink" {/* API → Auth */} strokeDasharray="4 3" />
    <line className="ink" {/* API → DB */}   strokeDasharray="4 3" />
    <line className="ink" {/* API → Cache */} strokeDasharray="4 3" />
  </svg>
</ScrollDraw>`,
  },
  {
    id: 'astro',
    label: 'Astro Integration',
    tag: 'data-scroll-draw · initScrollDraw()',
    description:
      'Zero-JS server components — add data-scroll-draw to any element and call initScrollDraw() in a client script. Options are passed as a JSON attribute. No framework wrapper needed.',
    preview: (
      <div style={{ width: '100%', background: '#0f172a', borderRadius: 12, padding: '16px', fontFamily: 'monospace', fontSize: 11, lineHeight: 1.6, overflowX: 'auto' }}>
        <div style={{ color: '#94a3b8', marginBottom: 16, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          src/pages/index.astro
        </div>
        <div>
          <span style={{ color: '#f472b6' }}>&lt;div</span>
          <span style={{ color: '#7dd3fc' }}> data-scroll-draw</span>
        </div>
        <div style={{ paddingLeft: 16 }}>
          <span style={{ color: '#7dd3fc' }}>data-scroll-draw-options</span>
          <span style={{ color: '#e2e8f0' }}>=</span>
          <span style={{ color: '#86efac' }}>'&#123;"easing":"ease-out","once":true&#125;'</span>
        </div>
        <div><span style={{ color: '#f472b6' }}>&gt;</span></div>
        <div style={{ paddingLeft: 16 }}>
          <span style={{ color: '#f472b6' }}>&lt;svg</span>
          <span style={{ color: '#7dd3fc' }}> viewBox</span>
          <span style={{ color: '#e2e8f0' }}>=</span>
          <span style={{ color: '#86efac' }}>"0 0 200 80"</span>
          <span style={{ color: '#f472b6' }}>&gt;</span>
        </div>
        <div style={{ paddingLeft: 32 }}>
          <span style={{ color: '#f472b6' }}>&lt;path</span>
          <span style={{ color: '#7dd3fc' }}> d</span>
          <span style={{ color: '#e2e8f0' }}>=</span>
          <span style={{ color: '#86efac' }}>"M10 40 Q100 5 190 40"</span>
        </div>
        <div style={{ paddingLeft: 32, color: '#94a3b8' }}>stroke="white" fill="none" /&gt;</div>
        <div style={{ paddingLeft: 16 }}><span style={{ color: '#f472b6' }}>&lt;/svg&gt;</span></div>
        <div><span style={{ color: '#f472b6' }}>&lt;/div&gt;</span></div>
        <div style={{ marginTop: 16 }}><span style={{ color: '#f472b6' }}>&lt;script&gt;</span></div>
        <div style={{ paddingLeft: 16 }}>
          <span style={{ color: '#c084fc' }}>import</span>
          <span style={{ color: '#e2e8f0' }}> &#123; initScrollDraw &#125; </span>
          <span style={{ color: '#c084fc' }}>from</span>
          <span style={{ color: '#86efac' }}> 'svg-scroll-draw/astro'</span>
          <span style={{ color: '#e2e8f0' }}>;</span>
        </div>
        <div style={{ paddingLeft: 16, color: '#fbbf24' }}>initScrollDraw();</div>
        <div><span style={{ color: '#f472b6' }}>&lt;/script&gt;</span></div>
      </div>
    ),
    code: `// src/pages/index.astro
---
// No server-side imports needed
---

<div
  data-scroll-draw
  data-scroll-draw-options='{"easing":"ease-out","fade":true,"once":true}'
>
  <svg viewBox="0 0 200 80" fill="none">
    <path d="M10 40 Q100 5 190 40"
      stroke="white" strokeWidth="2" />
  </svg>
</div>

<script>
  import { initScrollDraw } from 'svg-scroll-draw/astro';

  // Finds all [data-scroll-draw] on the page and
  // initialises each one — no React, no Vue needed.
  initScrollDraw();
</script>`,
  },
  {
    id: 'timeline-api',
    label: 'Timeline API',
    tag: 'scrollDrawTimeline · independent tracks',
    description:
      'Four quarterly bars and a trend line — each animated on its own independent scroll window using scrollDrawTimeline. Axes draw first (0→28%), then Q1–Q4 bars stagger across (10→88%), and the trend line traces last (75→100%) once all bars are fully visible.',
    preview: <TimelineDemo />,
    code: `import { scrollDrawTimeline } from 'svg-scroll-draw/timeline';

// Each track owns its own from/to slice of the scroll range.
// Unlike stagger (time offset), windows can overlap freely.
scrollDrawTimeline('#chart', {
  trigger: { start: 'top 88%', end: 'top 25%' },
  tracks: [
    { selector: '.axis',  from: 0,    to: 0.28, easing: 'ease-out' },
    { selector: '.bar-1', from: 0.1,  to: 0.42, easing: 'ease-out' },
    { selector: '.bar-2', from: 0.26, to: 0.56, easing: 'ease-out' },
    { selector: '.bar-3', from: 0.42, to: 0.72, easing: 'ease-out' },
    { selector: '.bar-4', from: 0.58, to: 0.88, easing: 'ease-out' },
    // Trend line draws only after all bars are visible
    { selector: '.trend', from: 0.75, to: 1.0,  easing: 'spring'   },
  ],
});`,
  },
  {
    id: 'group-api',
    label: 'Group API',
    tag: 'scrollDrawGroup · synchronized',
    description:
      'Three separate SVG containers — Speed, Size, and Framework icons — all animate simultaneously the moment the section scrolls into view. scrollDrawGroup wires them to the same scroll timeline with one call.',
    preview: <GroupDemo />,
    code: `import { scrollDrawGroup } from 'svg-scroll-draw/group';

// All three containers share the same options and
// start drawing at exactly the same scroll position.
const group = scrollDrawGroup(
  [speedRef.current, sizeRef.current, frameworkRef.current],
  {
    easing: 'ease-out',
    speed:  1.1,
    fade:   true,
    once:   true,
    trigger: { start: 'top 88%', end: 'top 25%' },
  }
);

// One call controls all instances
group.replay();
group.pause();
group.destroy(); // cleanup on unmount`,
  },
  {
    id: 'sequence-api',
    label: 'Sequence API',
    tag: 'scrollDrawSequence · one after another',
    description:
      'Three steps — Code, Build, Ship — draw in strict sequence: each one starts only after the previous reaches 100%. The border and label color up as each step completes. Uses scrollDrawSequence with onComplete to track state.',
    preview: <SequenceDemo />,
    code: `import { scrollDrawSequence } from 'svg-scroll-draw/group';

// Each container starts drawing only after
// the previous one fully completes.
const seq = scrollDrawSequence(
  [codeRef.current, buildRef.current, shipRef.current],
  {
    easing:     'ease-out',
    speed:      1.4,
    fade:       true,
    trigger:    { start: 'top 88%', end: 'top 25%' },
    onComplete: () => setStep((s) => s + 1),
  }
);

seq.replay();   // restart from step 1
seq.destroy();  // cleanup on unmount`,
  },
];

/* ── Page ─────────────────────────────────────────────────── */

export function ExamplesPage() {
  return (
    <div className="bg-light-linen text-pitch-black min-h-screen">

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-light-linen/95 backdrop-blur-sm border-b border-pitch-black flex items-center justify-between px-4 md:px-12 h-14">
        <Link href="/" className="font-display font-bold text-sm tracking-tight hover:opacity-70 transition-opacity shrink-0">
          svg-scroll-draw
        </Link>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Link href="/playground" className="text-xs px-3 sm:px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-medium whitespace-nowrap">
            ⚡ Playground
          </Link>
          <Link href="/docs" className="text-xs px-3 sm:px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-medium whitespace-nowrap">
            ← Docs
          </Link>
        </div>
      </nav>

      {/* Header */}
      <section className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-12 sm:py-16 md:py-20">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] uppercase tracking-[0.22em] text-graphite-border mb-4 font-medium">
            Real-world examples
          </p>
          <h1 className="font-display font-extrabold text-[clamp(30px,6vw,72px)] leading-[0.92] tracking-[-0.04em] mb-6">
            SVG scroll animations<br />
            <span className="relative inline-block">
              <span className="relative z-10 px-2 sm:px-3">without GSAP.</span>
              <span className="absolute inset-0 bg-creator-pink rounded-xl -rotate-[0.8deg]" />
            </span>
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-graphite-border max-w-2xl leading-relaxed break-words">
            Ten production-ready patterns — logo reveals, charts, signatures, diagrams, Timeline API, Group API, Sequence API, and more.
            Each one is powered by <code className="inline font-mono text-pitch-black text-[0.9em] bg-marketplace-gray border border-subtle-ash px-1.5 py-0.5 rounded-md break-all">svg-scroll-draw</code> and
            works in React, Next.js, Vue, and vanilla JS.
            Scroll down to see them draw live.
          </p>
        </div>
      </section>

      {/* Examples grid */}
      <div className="divide-y divide-pitch-black">
        {EXAMPLES.map((ex, i) => (
          <section key={ex.id} id={ex.id} className={`px-4 sm:px-6 md:px-12 py-12 sm:py-14 md:py-16 overflow-hidden ${i % 2 === 1 ? 'bg-marketplace-gray' : ''}`}>
            <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8 md:gap-12 items-start">

              {/* Text + code */}
              <div className={i % 2 === 1 ? 'order-1 md:order-2' : ''}>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-graphite-border font-medium">
                    {String(i + 1).padStart(2, '0')}
                  </p>
                  <span className="text-subtle-ash">·</span>
                  <code className="text-[10px] sm:text-[11px] font-mono bg-sunshine-yellow/30 text-pitch-black px-2 py-0.5 rounded-full border border-sunshine-yellow/50 break-all">
                    {ex.tag}
                  </code>
                </div>
                <h2 className="font-display font-extrabold text-[clamp(22px,3vw,36px)] leading-[1] tracking-[-0.03em] mb-4">
                  {ex.label}
                </h2>
                <p className="text-graphite-border leading-relaxed mb-5 sm:mb-6 text-[14px] sm:text-[15px] break-words">
                  {ex.description}
                </p>
                <CodeBlock filename="Hero.tsx">{ex.code}</CodeBlock>
              </div>

              {/* Live preview */}
              <div className={`flex items-center justify-center rounded-2xl border border-pitch-black shadow-[4px_4px_0px_#000] min-h-[200px] sm:min-h-[240px] overflow-hidden ${'darkPreview' in ex && ex.darkPreview ? 'bg-[#1e1f22] p-0' : 'bg-[#ffffff] p-6 sm:p-10'} ${i % 2 === 1 ? 'order-2 md:order-1' : ''}`}>
                {ex.preview}
              </div>

            </div>
          </section>
        ))}
      </div>

      {/* CTA */}
      <section className="border-t border-pitch-black bg-creator-pink px-4 sm:px-6 md:px-12 py-12 sm:py-16 text-center">
        <h2 className="font-display font-extrabold text-[clamp(24px,5vw,52px)] leading-[0.95] tracking-[-0.03em] mb-6 text-pitch-black">
          Ready to add this<br />to your project?
        </h2>
        <div className="flex flex-col items-center justify-center gap-3 w-full max-w-xs mx-auto sm:max-w-none sm:flex-row sm:flex-wrap">
          <div className="flex items-center gap-2 bg-pitch-black text-light-linen rounded-full px-5 sm:px-6 py-3 text-sm font-mono shadow-[3px_3px_0px_rgba(0,0,0,0.3)] w-full sm:w-auto justify-center">
            <span className="opacity-50">$</span>
            <span>npm i svg-scroll-draw</span>
          </div>
          <Link
            href="/playground"
            className="px-5 sm:px-6 py-3 rounded-full border-2 border-pitch-black bg-transparent text-pitch-black text-sm font-semibold hover:bg-pitch-black hover:text-creator-pink transition-colors shadow-[3px_3px_0px_rgba(0,0,0,0.2)] w-full sm:w-auto text-center"
          >
            ⚡ Try the Playground →
          </Link>
          <Link
            href="/"
            className="px-5 sm:px-6 py-3 rounded-full border-2 border-pitch-black bg-transparent text-pitch-black text-sm font-semibold hover:bg-pitch-black hover:text-creator-pink transition-colors shadow-[3px_3px_0px_rgba(0,0,0,0.2)] w-full sm:w-auto text-center"
          >
            Read the Docs →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 md:px-12 py-6 border-t border-subtle-ash text-center text-[11px] font-mono text-graphite-border">
        svg-scroll-draw · MIT · ~3 KB gzipped ·{' '}
        <a href="https://github.com/DhruvilChauahan0210/ink-scroll" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-pitch-black transition-colors">
          GitHub
        </a>
      </footer>
    </div>
  );
}
