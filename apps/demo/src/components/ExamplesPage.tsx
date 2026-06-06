'use client';

import { useState, useRef, useEffect } from 'react';
import { ScrollDraw } from 'svg-scroll-draw/react';
import { scrollDraw } from 'svg-scroll-draw';
import { scrollDrawGroup, scrollDrawSequence } from 'svg-scroll-draw/group';
import { scrollDrawTimeline } from 'svg-scroll-draw/timeline';
import Link from 'next/link';
import { CopyButton } from './CopyButton';
import { MobileMenu } from './MobileMenu';
import { scrollAnimate, scrollCounter, scrollParallax } from 'svg-scroll-draw';
import { ScrollAnimate } from 'svg-scroll-draw/react';
import { scrollText } from 'svg-scroll-draw/text';
import { scrollAnimateGroup } from 'svg-scroll-draw/group';
import { scrollPin } from 'svg-scroll-draw/pin';
import { scrollSnap } from 'svg-scroll-draw/snap';

function CodeBlock({ filename, children }: { filename: string; children: string }) {
  return (
    <div className="rounded-xl overflow-hidden border border-pitch-black text-sm">
      <div className="bg-[#111] flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#444]" />
          <span className="w-2 h-2 rounded-full bg-[#444]" />
          <span className="w-2 h-2 rounded-full bg-[#444]" />
        </div>
        <span className="text-[11px] text-[#888] font-mono">{filename}</span>
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
      <div style={{ width: '100%', maxWidth: '200px', margin: '0 auto' }}>
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
          viewBox="0 0 128 98"
          style={{ width: '100%', height: 'auto', display: 'block' }}
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
      </div>

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
        <span style={{ fontFamily: 'system-ui', fontSize: 11, color: '#999', letterSpacing: '0.08em', textTransform: 'uppercase' }}>~9 KB</span>
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

const TL_TRACKS = [
  { label: 'Axes',  from: 0,    to: 0.28, color: '#aaa'     },
  { label: 'Q1',    from: 0.1,  to: 0.42, color: '#ff90e8'  },
  { label: 'Q2',    from: 0.26, to: 0.56, color: '#ffc900'  },
  { label: 'Q3',    from: 0.42, to: 0.72, color: '#5865F2'  },
  { label: 'Q4',    from: 0.58, to: 0.88, color: '#22c55e'  },
  { label: 'Trend', from: 0.75, to: 1.0,  color: '#111'     },
] as const;

function TimelineDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!ref.current) return;
    const instance = scrollDrawTimeline(ref.current, {
      trigger: TRIGGER,
      tracks: [
        { selector: '.tl-axis',  from: 0,    to: 0.28, easing: 'ease-out' },
        { selector: '.tl-b1',    from: 0.1,  to: 0.42, easing: 'ease-out' },
        { selector: '.tl-b2',    from: 0.26, to: 0.56, easing: 'ease-out' },
        { selector: '.tl-b3',    from: 0.42, to: 0.72, easing: 'ease-out' },
        { selector: '.tl-b4',    from: 0.58, to: 0.88, easing: 'ease-out' },
        { selector: '.tl-trend', from: 0.75, to: 1.0,  easing: 'spring'   },
      ],
    });

    function poll() {
      setProgress(instance.getProgress());
      rafRef.current = requestAnimationFrame(poll);
    }
    rafRef.current = requestAnimationFrame(poll);

    return () => {
      instance.destroy();
      cancelAnimationFrame(rafRef.current);
    };
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

      {/* Scrub bar — shows each track's window and live fill */}
      <div style={{ width: '100%', padding: '12px 0 4px', display: 'flex', flexDirection: 'column', gap: 5 }}>
        {TL_TRACKS.map((track) => {
          const localRaw = track.to > track.from
            ? Math.min(1, Math.max(0, (progress - track.from) / (track.to - track.from)))
            : 0;
          const isActive = progress >= track.from && progress < track.to;
          return (
            <div key={track.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontFamily: 'monospace', fontSize: 9, color: isActive ? track.color : '#aaa',
                width: 32, textAlign: 'right', flexShrink: 0,
                fontWeight: isActive ? 700 : 400,
                transition: 'color 0.1s',
              }}>{track.label}</span>
              {/* Track window container */}
              <div style={{ flex: 1, height: 4, background: '#f0f0f0', borderRadius: 2, position: 'relative' }}>
                {/* Track window highlight */}
                <div style={{
                  position: 'absolute',
                  left: `${track.from * 100}%`,
                  width: `${(track.to - track.from) * 100}%`,
                  height: '100%',
                  background: track.color + '30',
                  borderRadius: 2,
                }} />
                {/* Live fill within the window */}
                <div style={{
                  position: 'absolute',
                  left: `${track.from * 100}%`,
                  width: `${(track.to - track.from) * localRaw * 100}%`,
                  height: '100%',
                  background: track.color,
                  borderRadius: 2,
                  transition: 'width 0.05s linear',
                }} />
              </div>
              <span style={{
                fontFamily: 'monospace', fontSize: 9, color: '#ccc',
                width: 28, flexShrink: 0,
              }}>{Math.round(localRaw * 100)}%</span>
            </div>
          );
        })}
        {/* Global progress tick */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
          <span style={{ fontFamily: 'monospace', fontSize: 9, color: '#888', width: 32, textAlign: 'right', flexShrink: 0 }}>scroll</span>
          <div style={{ flex: 1, height: 2, background: '#e8e8e8', borderRadius: 1, position: 'relative' }}>
            <div style={{
              position: 'absolute', left: 0,
              width: `${progress * 100}%`,
              height: '100%', background: '#111', borderRadius: 1,
              transition: 'width 0.05s linear',
            }} />
          </div>
          <span style={{ fontFamily: 'monospace', fontSize: 9, color: '#888', width: 28, flexShrink: 0 }}>
            {Math.round(progress * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
}

const PRESET_LIST = [
  { name: 'sketch',     color: '#ff90e8', label: 'sketch'     },
  { name: 'reveal',     color: '#22c55e', label: 'reveal'     },
  { name: 'typewriter', color: '#ffc900', label: 'typewriter' },
  { name: 'cinematic',  color: '#5865F2', label: 'cinematic'  },
  { name: 'spring',     color: '#ef4444', label: 'spring'     },
] as const;

const WAVE_SVG = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50" style={{ width: '100%', height: 'auto', display: 'block' }}>
    <path d="M5 25 C 20 5, 35 45, 50 25 S 80 5, 95 25" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
  </svg>
);

function PresetShowcase() {
  const refs = [
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
  ];

  useEffect(() => {
    const instances = PRESET_LIST.map(({ name }, i) =>
      refs[i].current
        ? scrollDraw(refs[i].current!, { preset: name, trigger: TRIGGER })
        : null,
    );
    return () => instances.forEach(inst => inst?.destroy());
  }, []);

  return (
    <div style={{ width: '100%', padding: '8px 0' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
        {PRESET_LIST.map(({ name, color, label }, i) => (
          <div key={name} style={{ textAlign: 'center' }}>
            <div
              ref={refs[i]}
              style={{
                background: color + '12',
                borderRadius: 10,
                padding: '12px 8px 8px',
                marginBottom: 6,
                color,
              }}
            >
              {WAVE_SVG}
            </div>
            <span style={{ fontFamily: 'monospace', fontSize: 9, color, fontWeight: 700, letterSpacing: '0.05em' }}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function VueDemo() {
  // Vue component tree — App.vue → Header.vue + Content.vue
  // Static fills + labels always visible; .ink borders + connections animate with stagger
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <span style={{
        position: 'absolute', top: 12, right: 12, zIndex: 1,
        background: '#42b883', color: '#fff',
        padding: '2px 8px', borderRadius: 4,
        fontSize: 10, fontFamily: 'var(--font-geist-mono, monospace)', fontWeight: 700,
        letterSpacing: '0.06em', pointerEvents: 'none',
      }}>Vue 3</span>

      <ScrollDraw easing="ease-out" speed={0.9} once trigger={TRIGGER} stagger={0.1} selector=".ink">
        <svg width="100%" viewBox="0 0 280 210" fill="none" style={{ fontFamily: 'monospace', display: 'block' }}>
          {/* Static: box fills */}
          <rect x="90"  y="14"  width="100" height="38" rx="7" fill="#f0fdf4"/>
          <rect x="18"  y="106" width="106" height="38" rx="7" fill="#f0fdf4"/>
          <rect x="156" y="106" width="106" height="38" rx="7" fill="#f0fdf4"/>
          {/* Static: component labels */}
          <text x="140" y="39"  textAnchor="middle" fontSize="11" fontWeight="600" fill="#15803d">App.vue</text>
          <text x="71"  y="131" textAnchor="middle" fontSize="10" fontWeight="500" fill="#15803d">Header.vue</text>
          <text x="209" y="131" textAnchor="middle" fontSize="10" fontWeight="500" fill="#15803d">Content.vue</text>
          {/* Static: slot/prop badges */}
          <rect x="32"  y="148" width="52" height="16" rx="8" fill="#dcfce7"/>
          <rect x="170" y="148" width="52" height="16" rx="8" fill="#dcfce7"/>
          <text x="58"  y="160" textAnchor="middle" fontSize="7" fill="#15803d">:title="…"</text>
          <text x="196" y="160" textAnchor="middle" fontSize="7" fill="#15803d">v-for</text>
          {/* Animated: box borders */}
          <rect className="ink" x="90"  y="14"  width="100" height="38" rx="7" stroke="#42b883" strokeWidth="2"/>
          <rect className="ink" x="18"  y="106" width="106" height="38" rx="7" stroke="#42b883" strokeWidth="2"/>
          <rect className="ink" x="156" y="106" width="106" height="38" rx="7" stroke="#42b883" strokeWidth="2"/>
          {/* Animated: prop-flow connectors */}
          <path className="ink" d="M 116 52 L 71 106"  stroke="#35495e" strokeWidth="1.5" strokeLinecap="round"/>
          <path className="ink" d="M 164 52 L 209 106" stroke="#35495e" strokeWidth="1.5" strokeLinecap="round"/>
          {/* Animated: arrowheads */}
          <path className="ink" d="M 65 100 L 71 106 L 77 100"  stroke="#35495e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path className="ink" d="M 203 100 L 209 106 L 215 100" stroke="#35495e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          {/* Animated: emit bus at bottom */}
          <path className="ink" d="M 71 144 L 71 186 L 209 186 L 209 144" stroke="#42b883" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="5 4"/>
          <text x="140" y="200" textAnchor="middle" fontSize="8" fill="#42b883">emit('update')</text>
        </svg>
      </ScrollDraw>
    </div>
  );
}

function SvelteDemo() {
  // Svelte reactive store graph — $source drives $count and $label
  // Central source node spreads reactivity outward via spring easing
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <span style={{
        position: 'absolute', top: 12, right: 12, zIndex: 1,
        background: '#ff3e00', color: '#fff',
        padding: '2px 8px', borderRadius: 4,
        fontSize: 10, fontFamily: 'var(--font-geist-mono, monospace)', fontWeight: 700,
        letterSpacing: '0.06em', pointerEvents: 'none',
      }}>Svelte</span>

      <ScrollDraw easing="spring" speed={0.85} once trigger={TRIGGER} stagger={0.15} selector=".ink">
        <svg width="100%" viewBox="0 0 280 200" fill="none" style={{ fontFamily: 'monospace', display: 'block' }}>
          {/* Static: node fills */}
          <circle cx="140" cy="52"  r="32" fill="#fff5f0"/>
          <circle cx="60"  cy="152" r="26" fill="#fff5f0"/>
          <circle cx="220" cy="152" r="26" fill="#fff5f0"/>
          <circle cx="140" cy="152" r="26" fill="#fff5f0"/>
          {/* Static: labels */}
          <text x="140" y="48"  textAnchor="middle" fontSize="8"  fontWeight="700" fill="#ff3e00">$source</text>
          <text x="140" y="60"  textAnchor="middle" fontSize="7"  fill="#ff7a5c">writable</text>
          <text x="60"  y="149" textAnchor="middle" fontSize="7" fontWeight="600" fill="#c2410c">$count</text>
          <text x="60"  y="160" textAnchor="middle" fontSize="6"  fill="#c2410c">derived</text>
          <text x="140" y="149" textAnchor="middle" fontSize="7"  fontWeight="600" fill="#c2410c">$label</text>
          <text x="140" y="160" textAnchor="middle" fontSize="6"  fill="#c2410c">derived</text>
          <text x="220" y="149" textAnchor="middle" fontSize="7"  fontWeight="600" fill="#c2410c">$effect</text>
          <text x="220" y="160" textAnchor="middle" fontSize="6"  fill="#c2410c">autorun</text>
          {/* Animated: node borders */}
          <circle className="ink" cx="140" cy="52"  r="32" stroke="#ff3e00" strokeWidth="2.5"/>
          <circle className="ink" cx="60"  cy="152" r="26" stroke="#ff3e00" strokeWidth="2"/>
          <circle className="ink" cx="140" cy="152" r="26" stroke="#ff3e00" strokeWidth="2"/>
          <circle className="ink" cx="220" cy="152" r="26" stroke="#ff3e00" strokeWidth="2"/>
          {/* Animated: reactive dependency edges */}
          <path className="ink" d="M 112 76  L 72  126" stroke="#ff7a5c" strokeWidth="1.5" strokeLinecap="round"/>
          <path className="ink" d="M 140 84  L 140 126" stroke="#ff7a5c" strokeWidth="1.5" strokeLinecap="round"/>
          <path className="ink" d="M 168 76  L 208 126" stroke="#ff7a5c" strokeWidth="1.5" strokeLinecap="round"/>
          {/* Animated: arrowheads */}
          <path className="ink" d="M 66 120 L 72 126 L 78 120"   stroke="#ff7a5c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path className="ink" d="M 134 120 L 140 126 L 146 120" stroke="#ff7a5c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path className="ink" d="M 202 120 L 208 126 L 214 120" stroke="#ff7a5c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </ScrollDraw>
    </div>
  );
}

function SolidDemo() {
  // Fine-grained reactivity graph: createSignal → createMemo × 2 → createEffect
  // Top-down dependency flow; borders + edges animate with stagger
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <span style={{
        position: 'absolute', top: 12, right: 12, zIndex: 1,
        background: '#2C4F7C', color: '#fff',
        padding: '2px 8px', borderRadius: 4,
        fontSize: 10, fontFamily: 'var(--font-geist-mono, monospace)', fontWeight: 700,
        letterSpacing: '0.06em', pointerEvents: 'none',
      }}>Solid.js</span>

      <ScrollDraw easing="ease-out" speed={0.9} once trigger={TRIGGER} stagger={0.12} selector=".ink">
        <svg width="100%" viewBox="0 0 280 200" fill="none" style={{ fontFamily: 'monospace', display: 'block' }}>
          {/* Static: node fills */}
          <circle cx="140" cy="38"  r="30" fill="#eef2f8"/>
          <circle cx="70"  cy="128" r="24" fill="#eef2f8"/>
          <circle cx="210" cy="128" r="24" fill="#eef2f8"/>
          <rect   x="80"   y="168" width="120" height="28" rx="7" fill="#eef2f8"/>
          {/* Static: labels */}
          <text x="140" y="33"  textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#2C4F7C">createSignal</text>
          <text x="140" y="44"  textAnchor="middle" fontSize="7"   fill="#446B9E">count = 0</text>
          <text x="70"  y="124" textAnchor="middle" fontSize="7"   fontWeight="600" fill="#2C4F7C">createMemo</text>
          <text x="70"  y="135" textAnchor="middle" fontSize="6.5" fill="#446B9E">doubled</text>
          <text x="210" y="124" textAnchor="middle" fontSize="7"   fontWeight="600" fill="#2C4F7C">createMemo</text>
          <text x="210" y="135" textAnchor="middle" fontSize="6.5" fill="#446B9E">isEven</text>
          <text x="140" y="179" textAnchor="middle" fontSize="7"   fontWeight="600" fill="#2C4F7C">createEffect</text>
          <text x="140" y="190" textAnchor="middle" fontSize="6.5" fill="#446B9E">DOM update</text>
          {/* Animated: node borders */}
          <circle className="ink" cx="140" cy="38"  r="30" stroke="#2C4F7C" strokeWidth="2.5"/>
          <circle className="ink" cx="70"  cy="128" r="24" stroke="#446B9E" strokeWidth="2"/>
          <circle className="ink" cx="210" cy="128" r="24" stroke="#446B9E" strokeWidth="2"/>
          <rect   className="ink" x="80" y="168" width="120" height="28" rx="7" stroke="#446B9E" strokeWidth="2"/>
          {/* Animated: dependency edges */}
          <path className="ink" d="M 118 62  L 80  104" stroke="#6B8CB8" strokeWidth="1.5" strokeLinecap="round"/>
          <path className="ink" d="M 162 62  L 200 104" stroke="#6B8CB8" strokeWidth="1.5" strokeLinecap="round"/>
          <path className="ink" d="M 80  148 L 108 168" stroke="#6B8CB8" strokeWidth="1.5" strokeLinecap="round"/>
          <path className="ink" d="M 200 148 L 172 168" stroke="#6B8CB8" strokeWidth="1.5" strokeLinecap="round"/>
          {/* Animated: arrowheads */}
          <path className="ink" d="M 74  98  L 80  104 L 86  98"  stroke="#6B8CB8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path className="ink" d="M 194 98  L 200 104 L 206 98"  stroke="#6B8CB8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path className="ink" d="M 102 162 L 108 168 L 114 162" stroke="#6B8CB8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path className="ink" d="M 166 162 L 172 168 L 178 162" stroke="#6B8CB8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </ScrollDraw>
    </div>
  );
}

/* ── v2 real example components ──────────────────────────── */

// scrollAnimate — Pricing card where every element reveals on scroll
function PricingCardReveal() {
  const badgeRef    = useRef<HTMLDivElement>(null);
  const planRef     = useRef<HTMLDivElement>(null);
  const priceRef    = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLUListElement>(null);
  const ctaRef      = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tr = { start: 'top 85%', end: 'top 45%' };
    const instances = [
      badgeRef.current && scrollAnimate(badgeRef.current, {
        props: { opacity: [0, 1], transform: ['translateY(16px)', 'translateY(0)'] },
        trigger: tr, easing: 'ease-out', once: true,
      }),
      planRef.current && scrollAnimate(planRef.current, {
        props: { opacity: [0, 1], transform: ['translateY(20px)', 'translateY(0)'] },
        trigger: { start: 'top 83%', end: 'top 43%' }, easing: 'ease-out', once: true,
      }),
      priceRef.current && scrollAnimate(priceRef.current, {
        props: { opacity: [0, 1], transform: ['translateY(24px)', 'translateY(0)'] },
        trigger: { start: 'top 80%', end: 'top 40%' }, easing: 'ease-out', once: true,
      }),
      featuresRef.current && scrollAnimate(featuresRef.current, {
        props: { opacity: [0, 1] },
        trigger: { start: 'top 77%', end: 'top 37%' }, easing: 'ease-out', once: true,
      }),
      ctaRef.current && scrollAnimate(ctaRef.current, {
        props: { opacity: [0, 1], transform: ['translateY(12px)', 'translateY(0)'] },
        trigger: { start: 'top 74%', end: 'top 34%' }, easing: 'ease-out', once: true,
      }),
    ].filter(Boolean);
    return () => instances.forEach(i => i && i.destroy());
  }, []);

  return (
    <div style={{ width: '100%', padding: '20px', background: '#f8f8f6' }}>
      <div style={{
        maxWidth: 320, margin: '0 auto',
        background: '#fff', borderRadius: 16,
        border: '1.5px solid #111', boxShadow: '4px 4px 0 #111',
        padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        <div ref={badgeRef} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#ffeaa7', border: '1px solid #f0d040', borderRadius: 20, padding: '4px 10px', width: 'fit-content' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#e6a817' }} />
          <span style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Pro Plan</span>
        </div>
        <div ref={planRef}>
          <div style={{ fontFamily: 'system-ui', fontWeight: 800, fontSize: 22, letterSpacing: '-0.03em', lineHeight: 1.1 }}>Everything you need</div>
          <div style={{ fontFamily: 'system-ui', fontSize: 13, color: '#666', marginTop: 4 }}>For teams shipping fast.</div>
        </div>
        <div ref={priceRef} style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ fontFamily: 'system-ui', fontWeight: 800, fontSize: 42, letterSpacing: '-0.05em', lineHeight: 1 }}>$49</span>
          <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#666' }}>/mo</span>
        </div>
        <ul ref={featuresRef} style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {['Unlimited projects', 'scrollAnimate + scrollText', 'Zero dependencies', 'MIT license'].map(f => (
            <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'system-ui', fontSize: 13 }}>
              <span style={{ width: 16, height: 16, borderRadius: '50%', background: '#4ade80', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, flexShrink: 0 }}>✓</span>
              {f}
            </li>
          ))}
        </ul>
        <div ref={ctaRef}>
          <button style={{ width: '100%', background: '#111', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 0', fontFamily: 'system-ui', fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '2px 2px 0 #555' }}>
            Get started →
          </button>
        </div>
      </div>
    </div>
  );
}

// scrollCounter — clean SaaS metrics row
function SocialProofStats() {
  const STATS = [
    { to: 50000, label: 'developers',  fmt: (n: number) => Math.round(n).toLocaleString() + '+' },
    { to: 9,     label: 'KB gzipped',  fmt: (n: number) => '~' + Math.round(n) },
    { to: 358,   label: 'tests green', fmt: (n: number) => Math.round(n).toString() },
    { to: 0,     label: 'dependencies', fmt: (n: number) => Math.round(n).toString() },
  ];

  const numRefs  = [useRef<HTMLSpanElement>(null), useRef<HTMLSpanElement>(null), useRef<HTMLSpanElement>(null), useRef<HTMLSpanElement>(null)];
  const itemRefs = [useRef<HTMLDivElement>(null),  useRef<HTMLDivElement>(null),  useRef<HTMLDivElement>(null),  useRef<HTMLDivElement>(null)];

  useEffect(() => {
    const insts = STATS.flatMap((s, i) => [
      numRefs[i].current && scrollCounter(numRefs[i].current!, {
        to: s.to, format: s.fmt, easing: 'ease-out', once: true,
        trigger: { start: `top ${86 - i * 4}%`, end: `top ${46 - i * 4}%` },
      }),
      itemRefs[i].current && scrollAnimate(itemRefs[i].current!, {
        props: { opacity: [0, 1], transform: ['translateY(18px)', 'translateY(0)'] },
        trigger: { start: `top ${88 - i * 4}%`, end: `top ${54 - i * 4}%` },
        easing: 'ease-out', once: true,
      }),
    ]).filter(Boolean);
    return () => insts.forEach(i => i && i.destroy());
  }, []);

  return (
    <div style={{ width: '100%', background: '#faf9f5', padding: '32px 20px' }}>
      {/* header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#111', flexShrink: 0 }} />
        <span style={{ fontFamily: 'var(--font-geist-mono, monospace)', fontSize: 10, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#888' }}>
          The numbers
        </span>
      </div>

      {/* stats — 2 columns, full-width dividers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: '1px solid #e0e0d8' }}>
        {STATS.map((s, i) => (
          <div
            key={s.label}
            ref={itemRefs[i]}
            style={{
              padding: '20px 0 20px',
              paddingRight: i % 2 === 0 ? 20 : 0,
              paddingLeft:  i % 2 === 1 ? 20 : 0,
              borderBottom: '1px solid #e0e0d8',
              borderRight:  i % 2 === 0 ? '1px solid #e0e0d8' : 'none',
            }}
          >
            <span
              ref={numRefs[i]}
              style={{
                fontFamily: 'var(--font-syne, system-ui)',
                fontWeight: 800,
                fontSize: 38,
                lineHeight: 1,
                letterSpacing: '-0.04em',
                color: '#111',
                display: 'block',
              }}
            >
              {s.fmt(0)}
            </span>
            <span style={{
              fontFamily: 'var(--font-geist-mono, monospace)',
              fontSize: 10,
              color: '#888',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              marginTop: 6,
              display: 'block',
            }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// scrollText — hero headline reveal
function HeadlineReveal() {
  const eyebrow = useRef<HTMLDivElement>(null);
  const line1   = useRef<HTMLHeadingElement>(null);
  const line2   = useRef<HTMLHeadingElement>(null);
  const desc    = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const insts = [
      eyebrow.current && scrollAnimate(eyebrow.current, {
        props: { opacity: [0, 1], transform: ['translateY(10px)', 'translateY(0)'] },
        trigger: { start: 'top 90%', end: 'top 65%' }, easing: 'ease-out', once: true,
      }),
      line1.current && scrollText(line1.current, {
        split: 'words', stagger: 0.08,
        from: { opacity: 0, y: 40 },
        easing: 'ease-out', once: true,
        trigger: { start: 'top 87%', end: 'top 54%' },
      }),
      line2.current && scrollText(line2.current, {
        split: 'words', stagger: 0.08,
        from: { opacity: 0, y: 40 },
        easing: 'ease-out', once: true,
        trigger: { start: 'top 82%', end: 'top 49%' },
      }),
      desc.current && scrollText(desc.current, {
        split: 'chars', stagger: 0.012,
        from: { opacity: 0 },
        easing: 'linear', once: true,
        trigger: { start: 'top 78%', end: 'top 44%' },
      }),
    ].filter(Boolean);
    return () => insts.forEach(i => i && i.destroy());
  }, []);

  return (
    <div style={{
      background: '#0d0d0d',
      padding: '48px 28px',
      minHeight: 280,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      gap: 0,
    }}>
      {/* eyebrow */}
      <div ref={eyebrow} style={{ marginBottom: 16 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontFamily: 'var(--font-geist-mono, monospace)',
          fontSize: 10, fontWeight: 600,
          letterSpacing: '0.2em', textTransform: 'uppercase',
          color: '#555',
          border: '1px solid #2a2a2a',
          borderRadius: 20,
          padding: '4px 10px',
        }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#ffd60a' }} />
          scrollText demo
        </span>
      </div>

      {/* headline line 1 — white */}
      <h2 ref={line1} style={{
        fontFamily: 'var(--font-syne, system-ui)',
        fontWeight: 800,
        fontSize: 'clamp(28px, 5vw, 44px)',
        lineHeight: 1.0,
        letterSpacing: '-0.04em',
        color: '#f5f5f5',
        margin: '0 0 4px',
      }}>
        Build scroll animations.
      </h2>

      {/* headline line 2 — accent yellow */}
      <h2 ref={line2} style={{
        fontFamily: 'var(--font-syne, system-ui)',
        fontWeight: 800,
        fontSize: 'clamp(28px, 5vw, 44px)',
        lineHeight: 1.0,
        letterSpacing: '-0.04em',
        color: '#ffd60a',
        margin: '0 0 20px',
      }}>
        Without GSAP.
      </h2>

      {/* descriptor — char trickle */}
      <p ref={desc} style={{
        fontFamily: 'var(--font-geist-mono, monospace)',
        fontSize: 11,
        color: '#444',
        letterSpacing: '0.05em',
        margin: 0,
        lineHeight: 1.6,
      }}>
        Zero deps · MIT · 9 KB · works with React, Vue, Svelte
      </p>
    </div>
  );
}

// scrollVideo — product video scrub concept (mock preview, real API code)
// Canvas frame scrubber — simulates Apple-style video scrub where each scroll
// position maps to a distinct rendered frame. This is exactly what scrollVideo
// does: video.currentTime = scroll_progress * video.duration.
function VideoScrubDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap   = wrapRef.current;
    if (!canvas || !wrap) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = 320, H = 260;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width  = '100%';
    canvas.style.height = H + 'px';
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);

    // ── helpers ──────────────────────────────────────────────────────────────
    const lerp  = (a: number, b: number, t: number) => a + (b - a) * t;
    const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
    const ease  = (t: number) => t < 0.5 ? 2*t*t : -1+(4-2*t)*t;
    // scene(progress, rangeStart, rangeEnd) → 0..1 within that range
    const sc    = (p: number, a: number, b: number) => ease(clamp((p - a) / (b - a), 0, 1));

    function phoneRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    }

    // ── main render — called every scroll tick ────────────────────────────────
    function render(p: number) {
      ctx.clearRect(0, 0, W, H);

      // Background: pitch black → very dark blue-black
      const bgB = Math.floor(lerp(0, 8, p));
      ctx.fillStyle = `rgb(0,0,${bgB})`;
      ctx.fillRect(0, 0, W, H);

      const cx = W / 2, cy = H / 2 - 4;

      // Phase timeline:
      // 0.00–0.20  phone outline emerges from black
      // 0.15–0.45  screen ignites (gradient washes in)
      // 0.35–0.65  UI content renders frame by frame (app icons)
      // 0.50–0.80  device tilts to 3/4 view + glow bloom
      // 0.70–1.00  feature callout lines animate in

      const p1 = sc(p, 0.00, 0.20); // outline emerge
      const p2 = sc(p, 0.15, 0.45); // screen ignite
      const p3 = sc(p, 0.35, 0.65); // UI content
      const p4 = sc(p, 0.50, 0.80); // tilt + glow
      const p5 = sc(p, 0.70, 1.00); // callouts

      const PW = 80, PH = 148, PR = 14;
      // tilt: starts at 0, tilts to ~10deg right then settles at 5deg
      const tilt = lerp(0, 0.14, p4) * Math.sin(Math.PI * clamp(p4, 0, 1));
      const tiltFinal = lerp(0, 0.08, p4);
      const angle = tilt + tiltFinal;

      // Ambient glow halo (behind phone)
      if (p2 > 0.1) {
        const glowSize = lerp(60, 110, p4);
        const g = ctx.createRadialGradient(cx, cy, 8, cx, cy, glowSize);
        g.addColorStop(0, `rgba(60,100,255,${p2 * 0.35})`);
        g.addColorStop(0.5, `rgba(100,60,200,${p2 * 0.15})`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(cx, cy, glowSize, glowSize * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);

      // ── Phone body ──────────────────────────────────────────────────────────
      // Shadow
      if (p1 > 0.3) {
        ctx.shadowColor = `rgba(80,120,255,${p1 * 0.4})`;
        ctx.shadowBlur = 24 * p1;
      }
      phoneRect(ctx, -PW/2, -PH/2, PW, PH, PR);
      ctx.fillStyle = `rgba(10,10,18,${p1})`;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Border — glows brighter as screen turns on
      const borderAlpha = lerp(p1 * 0.5, p1 * 0.95, p2);
      const borderBlue  = Math.floor(lerp(140, 200, p2));
      ctx.strokeStyle = `rgba(${borderBlue},${Math.floor(lerp(140,160,p2))},255,${borderAlpha})`;
      ctx.lineWidth = 1.5;
      phoneRect(ctx, -PW/2, -PH/2, PW, PH, PR);
      ctx.stroke();

      // ── Screen ──────────────────────────────────────────────────────────────
      if (p2 > 0) {
        phoneRect(ctx, -PW/2+6, -PH/2+14, PW-12, PH-28, 8);
        // Gradient shifts: blue → purple/indigo as content loads
        const sg = ctx.createLinearGradient(-PW/2, -PH/2, PW/2, PH/2);
        const sr = Math.floor(lerp(15, 60, p3));
        const sg1 = Math.floor(lerp(25, 15, p3));
        const sb = Math.floor(lerp(80, 140, p3));
        sg.addColorStop(0, `rgba(${sr},${sg1},${sb},${p2})`);
        sg.addColorStop(1, `rgba(${Math.floor(sr*0.5)},${Math.floor(sg1*2)},${Math.floor(sb*1.3)},${p2})`);
        ctx.fillStyle = sg;
        ctx.fill();

        // Wallpaper shimmer lines (like video decompressing)
        if (p2 > 0.3 && p3 < 0.8) {
          const shimmerA = (1 - p3) * (p2 - 0.3) / 0.7 * 0.08;
          for (let i = 0; i < 6; i++) {
            const ly = -PH/2 + 20 + i * 18 + (p * 12) % 18;
            if (ly > PH/2 - 14) continue;
            ctx.fillStyle = `rgba(255,255,255,${shimmerA})`;
            ctx.fillRect(-PW/2+6, ly, PW-12, 2);
          }
        }

        // App icons grid (materializes frame by frame as p3 rises)
        if (p3 > 0.15) {
          const ICON_COLORS = ['#FF6B6B','#FFD93D','#6BCB77','#4D96FF','#C77DFF','#FF6BB5','#FF9A3C','#00D4FF'];
          const gridA = (p3 - 0.15) / 0.85;
          for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 3; col++) {
              // Stagger reveal: each icon appears slightly after the previous
              const iconIdx = row * 3 + col;
              const iconA = clamp((gridA - iconIdx * 0.04) / 0.5, 0, 1);
              if (iconA <= 0) continue;
              const ix = -PW/2 + 10 + col * 20;
              const iy = -PH/2 + 22 + row * 26;
              phoneRect(ctx, ix, iy, 16, 20, 4);
              const col2 = ICON_COLORS[iconIdx % ICON_COLORS.length];
              // Parse hex color to rgba
              const r2 = parseInt(col2.slice(1,3), 16);
              const g2 = parseInt(col2.slice(3,5), 16);
              const b2 = parseInt(col2.slice(5,7), 16);
              ctx.fillStyle = `rgba(${r2},${g2},${b2},${iconA})`;
              ctx.fill();
              // Icon shine
              if (iconA > 0.5) {
                phoneRect(ctx, ix, iy, 16, 9, 4);
                ctx.fillStyle = `rgba(255,255,255,${iconA * 0.15})`;
                ctx.fill();
              }
            }
          }
        }

        // Home indicator
        ctx.beginPath();
        ctx.roundRect(-16, PH/2 - 20, 32, 4, 2);
        ctx.fillStyle = `rgba(255,255,255,${p2 * 0.4})`;
        ctx.fill();
      }

      // Dynamic Island
      if (p1 > 0.5) {
        const niA = (p1 - 0.5) * 2;
        ctx.beginPath();
        ctx.roundRect(-15, -PH/2 + 16, 30, 10, 5);
        ctx.fillStyle = `rgba(0,0,0,${niA})`;
        ctx.fill();
        // Camera dot
        ctx.beginPath();
        ctx.arc(8, -PH/2 + 21, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(30,30,40,${niA})`;
        ctx.fill();
      }

      // Side button
      phoneRect(ctx, PW/2, -22, 3, 38, 2);
      ctx.fillStyle = `rgba(80,100,140,${p1 * 0.7})`;
      ctx.fill();

      ctx.restore();

      // ── Feature callout lines ────────────────────────────────────────────────
      if (p5 > 0) {
        ctx.font = '8px -apple-system, "SF Pro Display", system-ui, monospace';

        // Callout 1: upper right — camera
        const c1 = clamp(p5 / 0.55, 0, 1);
        if (c1 > 0) {
          const ox = cx + Math.cos(angle) * (PW/2 - 4) + 4;
          const oy = cy - 52;
          ctx.beginPath();
          ctx.moveTo(ox + 2, oy);
          ctx.lineTo(ox + 50 * c1, oy - 20 * c1);
          ctx.strokeStyle = `rgba(160,200,255,${p5 * 0.65})`;
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(ox + 2, oy, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(160,200,255,${p5})`;
          ctx.fill();
          if (c1 > 0.65) {
            const ta = (c1 - 0.65) / 0.35;
            ctx.fillStyle = `rgba(160,200,255,${p5 * ta})`;
            ctx.fillText('48 MP camera', ox + 54, oy - 22);
          }
        }

        // Callout 2: lower left — chip
        const c2 = clamp((p5 - 0.35) / 0.65, 0, 1);
        if (c2 > 0) {
          const ox2 = cx - PW/2 - 2;
          const oy2 = cy + 18;
          ctx.beginPath();
          ctx.moveTo(ox2, oy2);
          ctx.lineTo(ox2 - 48 * c2, oy2 + 16 * c2);
          ctx.strokeStyle = `rgba(190,140,255,${p5 * 0.65})`;
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(ox2, oy2, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(190,140,255,${p5})`;
          ctx.fill();
          if (c2 > 0.65) {
            const ta2 = (c2 - 0.65) / 0.35;
            ctx.fillStyle = `rgba(190,140,255,${p5 * ta2})`;
            ctx.fillText('A18 Pro chip', ox2 - 130, oy2 + 22);
          }
        }
      }

      // ── Scrub bar + frame counter ────────────────────────────────────────────
      const TOTAL_FRAMES = 180;
      const frame = Math.round(p * TOTAL_FRAMES);
      const secs  = (p * 9).toFixed(1);

      ctx.fillStyle = 'rgba(255,255,255,0.07)';
      ctx.beginPath(); ctx.roundRect(16, H - 20, W - 32, 3, 2); ctx.fill();

      // Scrubbed portion
      ctx.fillStyle = 'rgba(120,160,255,0.75)';
      ctx.beginPath(); ctx.roundRect(16, H - 20, (W - 32) * p, 3, 2); ctx.fill();

      // Playhead dot
      const dotX = 16 + (W - 32) * p;
      ctx.beginPath();
      ctx.arc(dotX, H - 18.5, 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(160,200,255,0.9)';
      ctx.fill();

      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = '8px monospace';
      ctx.fillText(`${secs}s`, 16, H - 6);

      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.textAlign = 'right';
      ctx.fillText(`frame ${frame} / ${TOTAL_FRAMES}`, W - 16, H - 6);
      ctx.textAlign = 'left';
    }

    // ── Drive render from scroll ─────────────────────────────────────────────
    function onScroll() {
      const rect = wrap!.getBoundingClientRect();
      const vh   = window.innerHeight;
      const start = vh * 0.85, end = vh * 0.18;
      const prog  = Math.max(0, Math.min(1, (start - rect.top) / (start - end)));
      render(prog);
    }

    render(0);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div ref={wrapRef} style={{ width: '100%', background: '#000', borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
      <canvas ref={canvasRef} style={{ display: 'block' }} />
      <div style={{
        position: 'absolute', top: 10, left: 12,
        fontFamily: 'monospace', fontSize: 9,
        color: 'rgba(100,150,255,0.45)',
        letterSpacing: '0.14em', textTransform: 'uppercase',
        pointerEvents: 'none',
      }}>
        scroll to scrub ↓
      </div>
    </div>
  );
}

// scrollText lines — marketing feature section
function FeatureLinesDemo() {
  const features = [
    { icon: '⚡', text: 'Native CSS compositor path. Zero JS on Chrome.' },
    { icon: '🧩', text: 'React, Vue, Svelte, Solid, Angular, Astro, Nuxt.' },
    { icon: '📦', text: '~9 KB gzipped. Zero runtime dependencies.' },
    { icon: '♿', text: 'aria-label, aria-hidden, prefers-reduced-motion.' },
  ];
  const refs = [
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
  ];

  useEffect(() => {
    const insts = refs.map((r, i) =>
      r.current && scrollAnimate(r.current, {
        props: { opacity: [0, 1], transform: ['translateX(-20px)', 'translateX(0)'] },
        trigger: { start: `top ${90 - i * 5}%`, end: `top ${60 - i * 5}%` },
        easing: 'ease-out', once: true, native: false,
      })
    ).filter(Boolean);
    return () => insts.forEach(i => i?.destroy());
  }, []);

  return (
    <div style={{ width: '100%', background: '#fafaf8', padding: '24px 20px', borderRadius: 12 }}>
      <div style={{ fontFamily: 'var(--font-geist-mono, monospace)', fontSize: 10, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#999', marginBottom: 20 }}>
        Why developers choose it
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {features.map((f, i) => (
          <div key={i} ref={refs[i]} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <span style={{ fontSize: 18, flexShrink: 0, lineHeight: 1.3 }}>{f.icon}</span>
            <span style={{ fontFamily: 'system-ui', fontSize: 14, color: '#333', lineHeight: 1.5 }}>{f.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// scrollAnimateGroup — fan-out card grid
function AnimateGroupDemo() {
  const refs = [
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
  ];
  const cards = [
    { icon: '🎯', label: 'scrollAnimate', color: '#ff90e8', desc: 'Any CSS property' },
    { icon: '🔢', label: 'scrollCounter', color: '#ffc900', desc: 'Animated numbers' },
    { icon: '📝', label: 'scrollText',    color: '#5865F2', desc: 'Split + stagger'  },
    { icon: '🎬', label: 'scrollVideo',   color: '#22c55e', desc: 'Scrub video'      },
  ];

  useEffect(() => {
    const els = refs.map(r => r.current).filter(Boolean) as Element[];
    const group = scrollAnimateGroup(els, {
      props: { opacity: [0, 1], transform: ['translateY(28px)', 'translateY(0)'] },
      easing: 'ease-out',
      once: true,
      trigger: TRIGGER,
      native: false,
    });
    return () => group.destroy();
  }, []);

  return (
    <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '8px 0' }}>
      {cards.map((c, i) => (
        <div key={c.label} ref={refs[i]} style={{
          background: '#fff', borderRadius: 12,
          border: `1.5px solid ${c.color}30`,
          padding: '16px 14px',
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          <span style={{ fontSize: 22 }}>{c.icon}</span>
          <code style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 700, color: c.color }}>{c.label}</code>
          <span style={{ fontFamily: 'system-ui', fontSize: 11, color: '#666' }}>{c.desc}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Example cards data ───────────────────────────────────── */

// scrollPin — sticky feature panel demo
function StickyFeaturePanel() {
  const wrapRef  = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!wrapRef.current || !panelRef.current || !badgeRef.current) return;
    const badge = badgeRef.current;

    const inst = scrollPin(panelRef.current, {
      top:             0,
      pinDistance:     400,
      scrollContainer: wrapRef.current,
      onEnter:     () => { badge.textContent = 'PINNED'; badge.style.background = '#4ade80'; badge.style.color = '#000'; },
      onLeave:     () => { badge.textContent = 'RELEASED'; badge.style.background = '#f59e0b'; badge.style.color = '#000'; },
      onEnterBack: () => { badge.textContent = 'PINNED'; badge.style.background = '#4ade80'; badge.style.color = '#000'; },
      onLeaveBack: () => { badge.textContent = 'BEFORE'; badge.style.background = '#e5e7eb'; badge.style.color = '#444'; },
    });
    return () => inst.destroy();
  }, []);

  const FEATURES = [
    { title: 'One function call', body: 'scrollPin wraps the target in a spacer — no layout shift.' },
    { title: 'Full callbacks', body: 'onEnter, onLeave, onEnterBack, onLeaveBack — same as GSAP.' },
    { title: 'Refresh on resize', body: 'Call pin.refresh() after any layout change to recalculate.' },
  ];

  return (
    <div ref={wrapRef} style={{ width: '100%', height: 320, overflowY: 'auto', background: '#0d0d0d', position: 'relative' }}>
      <div style={{ display: 'flex', gap: 0, minHeight: 720 }}>
        {/* Pinned panel */}
        <div ref={panelRef} style={{ width: 140, flexShrink: 0, background: '#1a1a1a', borderRight: '1px solid #2a2a2a', padding: '20px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: 10, background: '#ff90e8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>📌</div>
          <div style={{ fontFamily: 'system-ui', fontWeight: 700, fontSize: 13, color: '#f5f5f5', lineHeight: 1.3 }}>Product Image</div>
          <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#555', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Stays fixed →</div>
          <span ref={badgeRef} style={{ display: 'inline-block', fontFamily: 'monospace', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', background: '#e5e7eb', color: '#444', borderRadius: 20, padding: '3px 8px', width: 'fit-content', transition: 'background 0.2s, color 0.2s' }}>
            BEFORE
          </span>
        </div>

        {/* Scrollable features */}
        <div style={{ flex: 1, padding: '0 20px' }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{ height: 200, display: 'flex', flexDirection: 'column', justifyContent: 'center', borderBottom: i < 2 ? '1px solid #1e1e1e' : 'none', paddingBottom: 16 }}>
              <div style={{ fontFamily: 'system-ui', fontWeight: 700, fontSize: 14, color: '#f5f5f5', marginBottom: 6 }}>{f.title}</div>
              <div style={{ fontFamily: 'system-ui', fontSize: 12, color: '#666', lineHeight: 1.5 }}>{f.body}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// scrollSnap — horizontal card carousel demo
function HorizontalSnapCarousel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  const CARDS = [
    { label: '01', title: 'Scroll Pin', color: '#ff90e8', icon: '📌' },
    { label: '02', title: 'Scroll Snap', color: '#60a5fa', icon: '⚡' },
    { label: '03', title: 'Callbacks', color: '#4ade80', icon: '🎯' },
    { label: '04', title: 'Lenis', color: '#fbbf24', icon: '🌊' },
  ];

  useEffect(() => {
    if (!containerRef.current) return;
    const sections = Array.from(containerRef.current.querySelectorAll<HTMLElement>('.snap-card'));
    const inst = scrollSnap(sections, {
      direction:       'horizontal',
      duration:        400,
      easing:          'ease-out',
      scrollContainer: containerRef.current,
      onSnap:          (i) => setActiveIdx(i),
    });
    return () => inst.destroy();
  }, []);

  return (
    <div style={{ width: '100%', background: '#0d0d0d', padding: '20px 0 16px' }}>
      {/* Scroll container */}
      <div
        ref={containerRef}
        style={{
          display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none', gap: 0,
        }}
      >
        {CARDS.map((c, i) => (
          <div
            key={c.label}
            className="snap-card"
            style={{
              minWidth: '100%', scrollSnapAlign: 'start',
              padding: '28px 24px',
              display: 'flex', flexDirection: 'column', gap: 10,
              borderRight: i < CARDS.length - 1 ? '1px solid #1e1e1e' : 'none',
            }}
          >
            <div style={{ fontSize: 28 }}>{c.icon}</div>
            <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#555', letterSpacing: '0.16em', textTransform: 'uppercase' }}>{c.label} / {CARDS.length}</div>
            <div style={{ fontFamily: 'system-ui', fontWeight: 800, fontSize: 20, color: c.color, letterSpacing: '-0.02em' }}>{c.title}</div>
            <div style={{ fontFamily: 'system-ui', fontSize: 12, color: '#555' }}>Swipe or drag to snap →</div>
          </div>
        ))}
      </div>

      {/* Dot indicators */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 12 }}>
        {CARDS.map((_, i) => (
          <div key={i} style={{ width: i === activeIdx ? 16 : 6, height: 6, borderRadius: 3, background: i === activeIdx ? '#ff90e8' : '#333', transition: 'all 0.2s ease' }} />
        ))}
      </div>
    </div>
  );
}

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
    id: 'vue',
    label: 'Vue 3',
    tag: 'ScrollDraw component · useScrollDraw composable',
    description:
      'A Vue component tree animates its borders and prop-flow connections on scroll. Uses the <ScrollDraw> component — or the useScrollDraw composable for full ref control. Both are included in svg-scroll-draw/vue.',
    preview: <VueDemo />,
    code: `<!-- Option 1: <ScrollDraw> component -->
<script setup>
import { ScrollDraw } from 'svg-scroll-draw/vue';
</script>

<template>
  <ScrollDraw easing="ease-out" :speed="0.9" fade once>
    <svg viewBox="0 0 200 100" fill="none">
      <path d="M10 50 Q100 10 190 50"
        stroke="#42b883" stroke-width="2.5" />
    </svg>
  </ScrollDraw>
</template>

<!-- Option 2: useScrollDraw composable -->
<script setup>
import { useScrollDraw } from 'svg-scroll-draw/vue';

const containerRef = useScrollDraw({
  easing: 'spring',
  once:   true,
  trigger: { start: 'top 80%', end: 'center 20%' },
});
</script>

<template>
  <div :ref="containerRef">
    <svg viewBox="0 0 200 100" fill="none">
      <path d="M10 50 Q100 10 190 50"
        stroke="#42b883" stroke-width="2.5" />
    </svg>
  </div>
</template>`,
  },
  {
    id: 'svelte',
    label: 'Svelte',
    tag: 'use:scrollDraw action · createScrollDraw',
    description:
      'A reactive store graph — $source driving three derived values — animates with spring easing on scroll. Uses the Svelte use:scrollDraw action; createScrollDraw gives access to the instance for replay/pause.',
    preview: <SvelteDemo />,
    code: `<!-- Option 1: use:scrollDraw action (simplest) -->
<script>
  import { scrollDraw } from 'svg-scroll-draw/svelte';
</script>

<div use:scrollDraw={{ easing: 'spring', fade: true, once: true }}>
  <svg viewBox="0 0 200 100" fill="none">
    <path d="M10 50 Q100 10 190 50"
      stroke="#ff3e00" stroke-width="2.5" />
  </svg>
</div>

<!-- Option 2: createScrollDraw for instance control -->
<script>
  import { createScrollDraw } from 'svg-scroll-draw/svelte';

  const { action, getInstance } = createScrollDraw({
    easing: 'spring',
    once:   true,
    speed:  1.2,
  });
</script>

<div use:action>
  <svg viewBox="0 0 200 100" fill="none">
    <path d="M10 50 Q100 10 190 50"
      stroke="#ff3e00" stroke-width="2.5" />
  </svg>
</div>
<button on:click={() => getInstance()?.replay()}>
  Replay
</button>`,
  },
  {
    id: 'solid',
    label: 'Solid.js',
    tag: 'useScrollDraw hook · createScrollDraw',
    description:
      'A fine-grained reactivity graph — createSignal feeding two createMemo derivations into a createEffect — animates with ease-out on scroll. Uses the useScrollDraw hook; createScrollDraw gives access to the instance for replay and pause.',
    preview: <SolidDemo />,
    code: `// Option 1: useScrollDraw hook (simplest)
import { useScrollDraw } from 'svg-scroll-draw/solid';

function Hero() {
  const ref = useScrollDraw({
    easing: 'ease-out',
    fade:   true,
    once:   true,
  });
  return (
    <div ref={ref}>
      <svg viewBox="0 0 200 80" fill="none">
        <path d="M10 40 Q100 5 190 40"
          stroke="#446B9E" stroke-width="2.5" />
      </svg>
    </div>
  );
}

// Option 2: createScrollDraw — instance control
import { createScrollDraw } from 'svg-scroll-draw/solid';

function HeroWithReplay() {
  const { ref, getInstance } = createScrollDraw({
    easing: 'spring',
    once:   true,
  });
  return (
    <>
      <div ref={ref}>
        <svg viewBox="0 0 200 80" fill="none">
          <path d="M10 40 Q100 5 190 40"
            stroke="#446B9E" stroke-width="2.5" />
        </svg>
      </div>
      <button onClick={() => getInstance()?.replay()}>
        Replay
      </button>
    </>
  );
}`,
  },
  {
    id: 'presets',
    label: 'Presets',
    tag: 'preset option · one-liner setup',
    description:
      'Five named presets — sketch, reveal, typewriter, cinematic, spring — apply sensible defaults in a single option. Each preset is a shorthand for 2–4 common options; user options always override.',
    preview: <PresetShowcase />,
    code: `import { scrollDraw } from 'svg-scroll-draw';

// One-liner for each common pattern
scrollDraw('#logo',    { preset: 'reveal'     }); // fade + ease-out, once
scrollDraw('#diagram', { preset: 'sketch'     }); // staggered ease-in
scrollDraw('#text',    { preset: 'typewriter' }); // fast linear stagger
scrollDraw('#hero',    { preset: 'cinematic'  }); // slow fade ease-in-out
scrollDraw('#icon',    { preset: 'spring'     }); // spring easing

// Override any preset value
scrollDraw('#logo', { preset: 'reveal', easing: 'spring' });

// Inspect presets
import { PRESETS } from 'svg-scroll-draw';
console.log(PRESETS.reveal);
// { easing: 'ease-out', fade: true, speed: 1.2, once: true }`,
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

  // ── v2 examples ────────────────────────────────────────────────────────────

  {
    id: 'scroll-animate',
    label: 'Pricing Card Reveal',
    tag: 'v2 · scrollAnimate · staggered',
    darkPreview: false,
    description:
      'A pricing card where every element — badge, plan name, price, feature list, CTA — reveals on scroll with staggered scrollAnimate calls. Each element has its own trigger offset for a natural cascade.',
    preview: <PricingCardReveal />,
    code: `import { scrollAnimate } from 'svg-scroll-draw';

// Each element gets its own trigger offset → natural cascade
scrollAnimate(badgeEl, {
  props: { opacity: [0, 1], transform: ['translateY(16px)', 'translateY(0)'] },
  trigger: { start: 'top 85%', end: 'top 45%' },
  easing: 'ease-out', once: true,
});

scrollAnimate(priceEl, {
  props: { opacity: [0, 1], transform: ['translateY(24px)', 'translateY(0)'] },
  trigger: { start: 'top 80%', end: 'top 40%' }, // starts 5% later
  easing: 'ease-out', once: true,
});

scrollAnimate(ctaEl, {
  props: { opacity: [0, 1], transform: ['translateY(12px)', 'translateY(0)'] },
  trigger: { start: 'top 74%', end: 'top 34%' }, // last to reveal
  easing: 'ease-out', once: true,
});`,
  },

  {
    id: 'scroll-counter',
    label: 'Social Proof Strip',
    tag: 'v2 · scrollCounter · formatted',
    darkPreview: true,
    description:
      'A dark social proof section with 4 live counters — each with a different format function. Numbers count up from zero as the section scrolls into view. Cards also fade in with scrollAnimate.',
    preview: <SocialProofStats />,
    code: `import { scrollCounter, scrollAnimate } from 'svg-scroll-draw';

// Users — integer with locale formatting
scrollCounter('#users', {
  to: 50_000,
  format: n => Math.round(n).toLocaleString() + '+',
  once: true,
});

// Satisfaction — fixed decimal percentage
scrollCounter('#satisfaction', {
  to: 94.7,
  format: n => n.toFixed(1) + '%',
  once: true,
});

// KB size — prefix notation
scrollCounter('#size', {
  to: 9,
  format: n => '~' + Math.round(n),
  once: true,
});

// Zero — counts down to 0 (dependencies)
scrollCounter('#deps', { to: 0, once: true });`,
  },

  {
    id: 'scroll-video',
    label: 'Product Video Scrub',
    tag: 'v2 · scrollVideo · currentTime',
    darkPreview: true,
    description:
      'Tie a <video> element\'s currentTime to scroll position — the Apple and Stripe product-page pattern. One function call. Supports from/to in seconds, preload strategy, onReady callback, and the full pause/resume/seek/replay instance API.',
    preview: <VideoScrubDemo />,
    code: `import { scrollVideo } from 'svg-scroll-draw/video';

// The full Apple / Stripe product scrub pattern.
// video.currentTime is tied directly to scroll position.
scrollVideo('#hero-video', {
  // Animate across the full sticky section
  trigger: { start: 'top top', end: 'bottom top' },

  // Optionally scrub only a clip of the video
  from: 0,    // seconds
  to:   12.5, // seconds (defaults to video.duration)

  easing: 'linear', // linear feels most natural for scrub
  once:   false,    // reverse on scroll-up

  onReady:    () => console.log('metadata loaded'),
  onProgress: p  => progressBar.style.width = p * 100 + '%',
  onComplete: () => console.log('reached end'),
});`,
  },

  {
    id: 'scroll-text-lines',
    label: 'Feature List Reveal',
    tag: 'v2 · scrollAnimate · staggered list',
    description:
      'Four feature rows slide in from the left on scroll with staggered scrollAnimate calls — each row has its own trigger offset for a natural cascade. The same pattern works with scrollText split: "lines" for text blocks.',
    preview: <FeatureLinesDemo />,
    code: `import { scrollAnimate } from 'svg-scroll-draw';

// Each row has its own trigger offset — a 5% stagger
// in start position creates a natural waterfall effect.
const rows = document.querySelectorAll('.feature-row');

rows.forEach((row, i) => {
  scrollAnimate(row, {
    props: {
      opacity:   [0, 1],
      transform: ['translateX(-20px)', 'translateX(0)'],
    },
    trigger: {
      start: \`top \${90 - i * 5}%\`,
      end:   \`top \${60 - i * 5}%\`,
    },
    easing: 'ease-out',
    once:   true,
  });
});

// Or use scrollText with split: 'lines' for text blocks:
// scrollText('#features', {
//   split: 'lines', stagger: 0.08,
//   from: { opacity: 0, x: -20 },
//   once: true,
// });`,
  },

  {
    id: 'scroll-animate-group',
    label: 'Animate Group',
    tag: 'v2 · scrollAnimateGroup · fan-out',
    description:
      'Animate multiple HTML elements simultaneously with one call using scrollAnimateGroup. All four v2 API cards reveal together on scroll. Same options, same scroll timeline, zero boilerplate — the v2 parallel to scrollDrawGroup.',
    preview: <AnimateGroupDemo />,
    code: `import { scrollAnimateGroup } from 'svg-scroll-draw/group';

// All four cards animate simultaneously — same props,
// same trigger, one call.
const group = scrollAnimateGroup(
  [card1El, card2El, card3El, card4El],
  {
    props: {
      opacity:   [0, 1],
      transform: ['translateY(28px)', 'translateY(0)'],
    },
    easing: 'ease-out',
    once:   true,
  }
);

// Full instance API works across the entire group
group.replay();   // replay all
group.pause();    // pause all
group.destroy();  // cleanup on unmount`,
  },

  {
    id: 'scroll-text',
    label: 'Hero Headline Reveal',
    tag: 'v2 · scrollText · words + chars',
    darkPreview: true,
    description:
      'A two-line marketing headline that reveals word-by-word on scroll, followed by a subtitle trickling in char by char. Each line has its own trigger window so they cascade naturally.',
    preview: <HeadlineReveal />,
    code: `import { scrollText } from 'svg-scroll-draw/text';

// Line 1 — words fade up with stagger
scrollText('#line1', {
  split:   'words',
  stagger: 0.07,
  from:    { opacity: 0, y: 32 },
  easing:  'ease-out',
  once:    true,
  trigger: { start: 'top 88%', end: 'top 52%' },
});

// Line 2 — offset trigger, starts after line 1
scrollText('#line2', {
  split:   'words',
  stagger: 0.07,
  from:    { opacity: 0, y: 32 },
  once:    true,
  trigger: { start: 'top 84%', end: 'top 48%' },
});

// Subtitle — char-by-char typewriter trickle
scrollText('#subtitle', {
  split:   'chars',
  stagger: 0.015,
  from:    { opacity: 0 },
  easing:  'linear',
  once:    true,
});`,
  },
  {
    id: 'scroll-pin',
    label: 'Sticky Feature Panel',
    tag: 'v2.7 · scrollPin · onEnter / onLeave',
    darkPreview: true,
    description:
      'Product image stays pinned while feature descriptions scroll past — the Apple / Stripe product walkthrough pattern. Uses scrollPin with lifecycle callbacks. Scroll inside the preview to see the pin state change.',
    preview: <StickyFeaturePanel />,
    code: `import { scrollPin } from 'svg-scroll-draw/pin';

// Pin the product image while features scroll past
const pin = scrollPin('#product-image', {
  top:         80,           // 80px below top (under a fixed nav)
  pinDistance: window.innerHeight * 3,
  onEnter:     () => image.classList.add('active'),
  onLeave:     () => image.classList.remove('active'),
  onEnterBack: () => image.classList.add('active'),
  onLeaveBack: () => image.classList.remove('active'),
  onProgress:  (p) => progressBar.style.width = p * 100 + '%',
});

// Animate each feature block as it scrolls in
document.querySelectorAll('.feature').forEach(el =>
  scrollAnimate(el, {
    props: { opacity: [0, 1], transform: ['translateY(32px)', 'translateY(0)'] },
    easing: 'ease-out', once: true,
  })
);

// Recalculate after layout change (accordion, content load)
pin.refresh();
pin.destroy(); // removes pin and restores DOM`,
  },
  {
    id: 'scroll-snap',
    label: 'Horizontal Snap Carousel',
    tag: 'v2.7 · scrollSnap · horizontal',
    darkPreview: true,
    description:
      'Drag or swipe between cards — scrollSnap detects when you pass the threshold and smoothly animates to the nearest card with custom easing. Dot indicators update via onSnap callback.',
    preview: <HorizontalSnapCarousel />,
    code: `import { scrollSnap } from 'svg-scroll-draw/snap';

// Horizontal card carousel with custom easing
const snap = scrollSnap('.card', {
  direction:  'horizontal',
  duration:   400,
  easing:     'ease-out',
  threshold:  0.3,       // snap if user dragged >30% of card width
  onSnap:     (index) => setActiveCard(index),
});

// Vertical section snapping (fullscreen sections)
scrollSnap('.section', {
  duration: 600,
  easing:   'ease-in-out',
  onSnap:   (i) => history.replaceState(null, '', \`#section-\${i}\`),
});

// Programmatic control
snap.snapTo(2);             // jump to index 2 with animation
snap.getCurrentIndex();     // → currently snapped index
snap.destroy();`,
  },
];

const EXAMPLE_FRAMEWORKS: Record<string, string[]> = {
  'logo-reveal':  ['react'],
  'line-chart':   ['react'],
  'signature':    ['react'],
  'flowchart':    ['react'],
  'map-route':    ['react'],
  'network':      ['react'],
  'astro':        ['vanilla'],
  'timeline-api': ['api'],
  'group-api':    ['api'],
  'vue':          ['vue'],
  'svelte':       ['svelte'],
  'solid':        ['solid'],
  'sequence-api':    ['api'],
  'scroll-animate':        ['react', 'vanilla'],
  'scroll-counter':        ['vanilla', 'react'],
  'scroll-video':          ['vanilla', 'react'],
  'scroll-text-lines':     ['vanilla', 'react'],
  'scroll-animate-group':  ['api', 'vanilla'],
  'scroll-text':           ['react', 'vanilla'],
  'presets':               ['api'],
  'scroll-pin':            ['vanilla', 'react'],
  'scroll-snap':           ['vanilla', 'react'],
};

const FILTERS = [
  { key: 'all',     label: 'All' },
  { key: 'react',   label: 'React' },
  { key: 'vue',     label: 'Vue 3' },
  { key: 'svelte',  label: 'Svelte' },
  { key: 'solid',   label: 'Solid' },
  { key: 'vanilla', label: 'Vanilla' },
  { key: 'api',     label: 'API' },
];

/* ── Page ─────────────────────────────────────────────────── */

export function ExamplesPage() {
  const [activeFilter, setActiveFilter] = useState('all');
  const filtered = activeFilter === 'all'
    ? EXAMPLES
    : EXAMPLES.filter(ex => (EXAMPLE_FRAMEWORKS[ex.id] ?? []).includes(activeFilter));

  return (
    <div className="bg-light-linen text-pitch-black min-h-screen">

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-light-linen/95 backdrop-blur-sm border-b border-pitch-black flex items-center justify-between px-4 md:px-12 h-14">
        <Link href="/" className="font-display font-bold text-sm tracking-tight hover:opacity-70 transition-opacity shrink-0">svg-scroll-draw</Link>

        {/* Desktop */}
        <div className="hidden lg:flex items-center gap-2">
          <Link href="/" className="text-xs px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-medium whitespace-nowrap">Home</Link>
          <Link href="/docs" className="text-xs px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-medium whitespace-nowrap">Docs</Link>
          <Link href="/blog" className="text-xs px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-medium whitespace-nowrap">Blog</Link>
          <Link href="/changelog" className="text-xs px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-medium whitespace-nowrap">Changelog</Link>
          <Link href="/playground" className="text-xs px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-medium whitespace-nowrap">⚡ Playground</Link>
        </div>

        {/* Mobile / tablet */}
        <div className="flex lg:hidden">
          <MobileMenu />
        </div>
      </nav>

      {/* Header */}
      <section className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-12 sm:py-16 md:py-20 overflow-hidden">
        <div className="max-w-4xl mx-auto min-w-0">
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
            Seventeen production-ready patterns — logo reveals, charts, signatures, video scrub, scrollAnimateGroup, feature reveals, Vue 3, Svelte, Solid.js, Timeline API, Group API, Sequence API, and more.
            Each one is powered by <code className="inline font-mono text-pitch-black text-[0.9em] bg-marketplace-gray border border-subtle-ash px-1.5 py-0.5 rounded-md break-all">svg-scroll-draw</code> and
            works in React, Vue 3, Svelte, Solid, and vanilla JS.
            Scroll down to see them draw live.
          </p>

          {/* Framework filter pills */}
          <div className="flex flex-wrap gap-2 mt-8">
            {FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={`text-xs px-3.5 py-1.5 rounded-full border font-medium transition-colors whitespace-nowrap ${
                  activeFilter === f.key
                    ? 'bg-pitch-black text-light-linen border-pitch-black'
                    : 'border-subtle-ash text-graphite-border hover:border-pitch-black hover:text-pitch-black'
                }`}
              >
                {f.label}
                {f.key !== 'all' && (
                  <span className={`ml-1.5 text-[10px] ${activeFilter === f.key ? 'opacity-60' : 'opacity-40'}`}>
                    {EXAMPLES.filter(ex => (EXAMPLE_FRAMEWORKS[ex.id] ?? []).includes(f.key)).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Examples grid */}
      <div className="divide-y divide-pitch-black">
        {filtered.map((ex, i) => (
          <section key={ex.id} id={ex.id} className={`px-4 sm:px-6 md:px-12 py-12 sm:py-14 md:py-16 overflow-hidden ${i % 2 === 1 ? 'bg-marketplace-gray' : ''}`}>
            <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8 md:gap-12 items-start">

              {/* Text + code — min-w-0 stops grid cell from overflowing */}
              <div className={`min-w-0 ${i % 2 === 1 ? 'order-1 md:order-2' : ''}`}>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-graphite-border font-medium shrink-0">
                    {String(i + 1).padStart(2, '0')}
                  </p>
                  <span className="text-subtle-ash shrink-0">·</span>
                  <code className="text-[10px] sm:text-[11px] font-mono bg-sunshine-yellow/30 text-pitch-black px-2 py-0.5 rounded-full border border-sunshine-yellow/50 break-all min-w-0">
                    {ex.tag}
                  </code>
                </div>
                <h2 className="font-display font-extrabold text-[clamp(22px,3vw,36px)] leading-[1] tracking-[-0.03em] mb-4 break-words">
                  {ex.label}
                </h2>
                <p className="text-graphite-border leading-relaxed mb-5 sm:mb-6 text-[14px] sm:text-[15px] break-words">
                  {ex.description}
                </p>
                <div className="max-w-full overflow-hidden">
                  <CodeBlock filename="Hero.tsx">{ex.code}</CodeBlock>
                </div>
              </div>

              {/* Live preview */}
              <div className={`min-w-0 flex items-center justify-center rounded-2xl border border-pitch-black shadow-[4px_4px_0px_#000] min-h-[200px] sm:min-h-[240px] overflow-hidden ${'darkPreview' in ex && ex.darkPreview ? 'bg-[#1e1f22] p-0' : 'bg-[#ffffff] p-4 sm:p-8'} ${i % 2 === 1 ? 'order-2 md:order-1' : ''}`}>
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
            href="/docs"
            className="px-5 sm:px-6 py-3 rounded-full border-2 border-pitch-black bg-transparent text-pitch-black text-sm font-semibold hover:bg-pitch-black hover:text-creator-pink transition-colors shadow-[3px_3px_0px_rgba(0,0,0,0.2)] w-full sm:w-auto text-center"
          >
            Read the Docs →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 md:px-12 py-6 border-t border-subtle-ash text-center text-[11px] font-mono text-graphite-border">
        svg-scroll-draw · MIT · ~9 KB gzipped ·{' '}
        <a href="https://github.com/DhruvilChauahan0210/ink-scroll" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-pitch-black transition-colors">
          GitHub
        </a>
      </footer>
    </div>
  );
}
