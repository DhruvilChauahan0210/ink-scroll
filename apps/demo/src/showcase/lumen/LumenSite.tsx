'use client';

import './lumen.css';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { scrollPin } from 'svg-scroll-draw/pin';
import { ScrollDraw } from 'svg-scroll-draw/react';
import { Site, Hero, Sec } from '../kit/Site';

/*
 * Lumen — the product page for a fictional compact camera, the X2, built
 * with svg-scroll-draw:
 *   · the camera inks itself in, line by line, as the page opens (ScrollDraw
 *     autoplay); its finishes fade in once the last line is down
 *   · the feature tour pins the camera below the header (scrollPin) while
 *     the reader scrolls through sensor, lens, stabilisation and battery.
 *     onProgress picks the caption, moves the brass focus frame to the part
 *     being described, opens the x-ray of it and scrubs the camera's own
 *     readout: ISO climbs, the aperture blades close, the body shakes while
 *     the floating sensor holds still, the battery charges
 *   · onEnter / onLeave and the Back variants switch the "in tour" state:
 *     the chapter rail and the status light only show while it is pinned
 */

/* ── The camera, front view, in a 740 × 320 box (viewBox 30 84 740 320) ── */

const CX = 392;
const CY = 278;
const f1 = (n: number) => n.toFixed(1);
const pol = (r: number, deg: number): [number, number] => [CX + r * Math.cos((deg * Math.PI) / 180), CY + r * Math.sin((deg * Math.PI) / 180)];
const arc = (r: number, a0: number, a1: number) => {
  const [x0, y0] = pol(r, a0);
  const [x1, y1] = pol(r, a1);
  return `M${f1(x0)} ${f1(y0)}A${r} ${r} 0 0 1 ${f1(x1)} ${f1(y1)}`;
};
const knurl = (x0: number, x1: number, y0: number, y1: number) => {
  let d = '';
  for (let x = x0; x <= x1; x += 6) d += `M${x} ${y0}V${y1}`;
  return d;
};

const RIDGES = Array.from({ length: 72 }, (_, i) => {
  const [x0, y0] = pol(93, i * 5);
  const [x1, y1] = pol(99, i * 5);
  return `M${f1(x0)} ${f1(y0)}L${f1(x1)} ${f1(y1)}`;
}).join('');

const GRIP_RIBS = Array.from({ length: 15 }, (_, i) => {
  const y = 200 + i * 10.5;
  return `M86 ${f1(y)}H${f1(158 + 15 * Math.sin((Math.PI * (y - 186)) / 176))}`;
}).join('');

/* Nine blades: the opening is a nonagon; each blade edge runs on out to the barrel. */
function aperture(r: number) {
  const n = 9;
  const R = 36;
  const pts = Array.from({ length: n }, (_, i) => pol(r, i * (360 / n) - 78));
  let blades = '';
  pts.forEach(([x0, y0], i) => {
    const [x1, y1] = pts[(i + 1) % n];
    const len = Math.hypot(x0 - x1, y0 - y1) || 1;
    const dx = (x0 - x1) / len;
    const dy = (y0 - y1) / len;
    const ox = x0 - CX;
    const oy = y0 - CY;
    const b = ox * dx + oy * dy;
    const t = -b + Math.sqrt(Math.max(0, b * b - (ox * ox + oy * oy - R * R)));
    blades += `M${f1(x0)} ${f1(y0)}L${f1(x0 + dx * t)} ${f1(y0 + dy * t)}`;
  });
  return { open: pts.map(([x, y]) => `${f1(x)},${f1(y)}`).join(' '), blades };
}
const WIDE_OPEN = aperture(28);

const LENS_TEXT = `M${CX - 73} ${CY}a73 73 0 1 1 146 0a73 73 0 1 1 -146 0`;
const GLINT = arc(50, 200, 245) + arc(22, 205, 240);
const SENSOR = 'M320 230H464V326H320Z';
let grid = '';
for (let x = 332; x <= 452; x += 12) grid += `M${x} 230V326`;
for (let y = 242; y <= 314; y += 12) grid += `M320 ${y}H464`;
const SENSOR_GRID = grid;
const STAGE = 'M306 212H478Q484 212 484 218V338Q484 344 478 344H306Q300 344 300 338V218Q300 212 306 212Z';
const COILS = 'M300 266h10v24h-10zM474 266h10v24h-10zM380 212h24v10h-24zM380 334h24v10h-24z';
const ROLL = (() => {
  const [ex, ey] = pol(124, 176);
  const t = (176 * Math.PI) / 180;
  const [tx, ty] = [-Math.sin(t), Math.cos(t)];
  const [nx, ny] = [Math.cos(t), Math.sin(t)];
  const bx = ex - 9 * tx;
  const by = ey - 9 * ty;
  return `${arc(124, 140, 176)}M${f1(bx + 5 * nx)} ${f1(by + 5 * ny)}L${f1(ex)} ${f1(ey)}L${f1(bx - 5 * nx)} ${f1(by - 5 * ny)}`;
})();
const ARROWS = `M330 352H454M330 352l8-5M330 352l8 5M454 352l-8-5M454 352l-8 5M504 234V322M504 234l-5 8M504 234l5 8M504 322l-5-8M504 322l5-8${ROLL}`;
const BATTERY = 'M98 206H146Q152 206 152 212V340Q152 346 146 346H98Q92 346 92 340V212Q92 206 98 206ZM112 206V199H132V206';
const BOLT = 'M127 252L115 279H125L119 302L137 271H127L132 252Z';

type Finish = 'graphite' | 'silver';

function Camera({ id, finish = 'graphite', xray = false }: { id: string; finish?: Finish; xray?: boolean }) {
  return (
    <svg className={`lu-cam-svg is-${finish}`} viewBox="30 84 740 320" role="img" aria-label="The Lumen X2 from the front: a compact body with a fixed 28 mm lens, two machined dials on the top plate and a viewfinder window">
      <defs><path id={`lu-lt-${id}`} d={LENS_TEXT} /></defs>
      <g className="lu-body">
        <g className="lu-fill">
          <rect className="lu-bodyfill" x="70" y="140" width="660" height="250" rx="28" />
          <path className="lu-plate" d="M70 186V168A28 28 0 0 1 98 140H702A28 28 0 0 1 730 168V186Z" />
          <path className="lu-plate" d="M70 362A28 28 0 0 0 98 390H702A28 28 0 0 0 730 362Z" />
        </g>
        {/* Body and seams first: the drawing order is the DOM order */}
        <rect className="lu-ink" x="70" y="140" width="660" height="250" rx="28" />
        <path className="lu-ink" d="M70 186H352.8M431.2 186H730M70 362H337.7M446.3 362H730" />
        {/* Strap lugs */}
        <path className="lu-ink" d="M70 160H62a4 4 0 0 0-4 4v6a4 4 0 0 0 4 4H70" />
        <circle className="lu-ink lu-thin" cx="50" cy="167" r="8" />
        <path className="lu-ink" d="M730 160H738a4 4 0 0 1 4 4v6a4 4 0 0 1-4 4H730" />
        <circle className="lu-ink lu-thin" cx="750" cy="167" r="8" />
        {/* Top plate: shutter release and power lever, exposure dial, hot shoe, shutter-speed dial */}
        <rect className="lu-ink" x="128" y="118" width="56" height="22" rx="3" />
        <rect className="lu-ink" x="140" y="105" width="32" height="13" rx="5" />
        <path className="lu-ink lu-thin" d="M147 111.5H165" />
        <path className="lu-ink" d="M184 127H204a4.5 4.5 0 0 1 0 9H184" />
        <rect className="lu-ink" x="228" y="110" width="64" height="30" rx="3" />
        <path className="lu-ink lu-thin" d={`M228 118H292${knurl(233, 287, 121, 137)}`} />
        <rect className="lu-ink" x="346" y="127" width="92" height="13" rx="2" />
        <path className="lu-ink" d="M350 127V120H434V127" />
        <path className="lu-ink lu-thin" d="M370 123.5H414" />
        <rect className="lu-ink" x="566" y="104" width="86" height="36" rx="3" />
        <path className="lu-ink lu-thin" d={`M566 113H652${knurl(571, 647, 116, 137)}`} />
        <rect className="lu-ink" x="601" y="97" width="16" height="7" rx="3" />
        {/* Front: the grip, AF-assist lamp, light sensor and viewfinder window */}
        <g className="lu-grip">
          <path className="lu-ink" d="M170 186C190 236 190 312 170 362" />
          <path className="lu-ink lu-thin" d={GRIP_RIBS} />
        </g>
        <circle className="lu-ink" cx="216" cy="212" r="8" />
        <circle className="lu-ink lu-thin" cx="216" cy="212" r="3.5" />
        <circle className="lu-ink lu-thin" cx="548" cy="222" r="6" />
        <rect className="lu-ink" x="588" y="200" width="110" height="58" rx="8" />
        <rect className="lu-ink lu-thin" x="597" y="209" width="92" height="40" rx="4" />
        <path className="lu-ink lu-thin" d="M607 245L619 215M615 247L625 224" />
        <text className="lu-fill lu-word" x="184" y="170">LUMEN</text>
        <text className="lu-fill lu-model" x="700" y="170" textAnchor="end">X2</text>
        {/* The lens, from the barrel in */}
        <g className="lu-lens">
          <circle className="lu-fill lu-barrel" cx={CX} cy={CY} r="100" />
          <circle className="lu-ink" cx={CX} cy={CY} r="100" />
          <path className="lu-ink lu-thin" d={RIDGES} />
          <circle className="lu-ink" cx={CX} cy={CY} r="92" />
          <circle className="lu-ink" cx={CX} cy={CY} r="80" />
          <text className="lu-fill lu-lens-text" textAnchor="middle">
            <textPath href={`#lu-lt-${id}`} startOffset="25%">LUMEN · 28mm 1:2.0 · ASPH</textPath>
          </text>
          <circle className="lu-ink" cx={CX} cy={CY} r="66" />
          <circle className="lu-ink lu-thin" cx={CX} cy={CY} r="58" />
          <circle className="lu-ink" cx={CX} cy={CY} r="40" />
          <polygon className="lu-ink lu-ap lu-ap-open" points={WIDE_OPEN.open} />
          <path className="lu-ink lu-thin lu-ap lu-ap-blades" d={WIDE_OPEN.blades} />
          <path className="lu-ink lu-glint" d={GLINT} />
        </g>
      </g>
      {xray && (
        <>
          <g className="lu-x lu-x-sensor">
            <path className="lu-xd" pathLength={1} d={SENSOR} />
            <path className="lu-xd lu-xg" pathLength={1} d={SENSOR_GRID} />
            <line className="lu-scan" x1="320" y1="230" x2="464" y2="230" />
          </g>
          <g className="lu-x lu-x-ibis">
            <path className="lu-xd" pathLength={1} d={STAGE} />
            <path className="lu-xd lu-xg" pathLength={1} d={COILS} />
            <path className="lu-xd" pathLength={1} d={SENSOR} />
            <path className="lu-xd lu-xg" pathLength={1} d="M338 292H446" />
            <path className="lu-xd" pathLength={1} d={ARROWS} />
            <text className="lu-xt" x="462" y="356">X</text>
            <text className="lu-xt" x="512" y="282">Y</text>
            <text className="lu-xt" x="262" y="332" textAnchor="end">ROLL</text>
          </g>
          <g className="lu-x lu-x-battery">
            <rect className="lu-charge" x="97" y="211" width="50" height="130" rx="3" />
            <path className="lu-xd" pathLength={1} d={BATTERY} />
            <path className="lu-xd lu-xg" pathLength={1} d="M97 254H147M97 298H147" />
            <path className="lu-xd" pathLength={1} d={BOLT} />
          </g>
          <g aria-hidden="true">
            <path className="lu-af lu-af-tl" d="M0 16V0H16" />
            <path className="lu-af lu-af-tr" d="M-16 0H0V16" />
            <path className="lu-af lu-af-bl" d="M0 -16V0H16" />
            <path className="lu-af lu-af-br" d="M-16 0H0V-16" />
          </g>
        </>
      )}
    </svg>
  );
}

/* ── The tour ── */

const FEATURES = [
  {
    k: 'sensor', n: 'Sensor', tag: 'APS-C · 40.2 MP', frame: [392, 278, 168, 120],
    h: 'Forty megapixels that keep their nerve in the dark.',
    p: 'A back-illuminated APS-C sensor with no low-pass filter, so fine detail stays fine. Push it to ISO 25,600 at a gig or a wedding and the shadows stay clean enough to print.',
    figs: [['40.2 MP', 'APS-C, back-illuminated'], ['25,600', 'top native ISO'], ['14.5', 'stops of dynamic range']],
  },
  {
    k: 'lens', n: 'Lens', tag: '28 mm · f/2–16', frame: [392, 278, 222, 222],
    h: 'A 28 mm f/2, made for this body and only this body.',
    p: 'Eight elements in six groups, two of them aspherical, set 4 mm from the sensor. Nine rounded blades give soft, round highlights wide open and corner-to-corner sharpness by f/5.6.',
    figs: [['28 mm', 'full-frame equivalent'], ['9 blades', 'rounded, f/2 to f/16'], ['10 cm', 'closest focus']],
  },
  {
    k: 'ibis', n: 'Stabilisation', tag: '5-axis IBIS', frame: [394, 284, 268, 180],
    h: 'Seven stops of steady, in your hand.',
    p: 'The sensor floats on a five-axis magnetic stage that cancels the shake in your hands 4,000 times a second. Shoot at half a second without a tripod and the street lights stay points.',
    figs: [['5-axis', 'sensor-shift'], ['7 stops', 'CIPA standard'], ['½ s', 'sharp, handheld']],
  },
  {
    k: 'battery', n: 'Battery', tag: 'NP-L2 · USB-C', frame: [122, 274, 84, 172],
    h: 'One charge for the whole day out.',
    p: 'The NP-L2 cell lives in the grip, where its weight steadies your hand. It is good for 450 shots or 70 minutes of 6K video, and charges over USB-C: to 80% in 35 minutes.',
    figs: [['450', 'shots per charge'], ['USB-C', 'charge as you shoot'], ['35 min', 'to 80%']],
  },
] as const;

/* What the camera's own readout shows as each step scrubs */
const ISO = ['80', '100', '125', '160', '200', '400', '800', '1,600', '3,200', '6,400', '12,800', '25,600'];
const FSTOP = ['2.0', '2.2', '2.5', '2.8', '3.2', '3.5', '4.0', '4.5', '5.0', '5.6', '6.3', '7.1', '8.0', '9.0', '10', '11', '13', '14', '16'];
const SHUTTER = ['1/250', '1/200', '1/160', '1/125', '1/100', '1/80', '1/60', '1/50', '1/40', '1/30', '1/25', '1/20', '1/15', '1/13', '1/10', '1/8', '1/6', '1/5', '1/4', '0.3″', '0.4″', '0.5″'];
const LCD = [['ISO', ISO[0]], ['Aperture', `f/${FSTOP[0]}`], ['Shutter', SHUTTER[0]], ['Battery', '12%']];

type TourState = 'before' | 'on' | 'after';

function Tour() {
  const stage = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [tour, setTour] = useState<TourState>('before');

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const nav = el.closest('.sk')?.querySelector('.sk-nav');
    const top = nav ? Math.round(nav.getBoundingClientRect().height) : 66;
    el.style.setProperty('--lu-nav', `${top}px`);
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const body = el.querySelector('.lu-body');
    const open = el.querySelector('.lu-ap-open');
    const blades = el.querySelector('.lu-ap-blades');
    const scan = el.querySelector('.lu-scan');
    const charge = el.querySelector('.lu-charge');
    const lcd = Array.from(el.querySelectorAll<HTMLElement>('.lu-lcd b'));
    const pick = (list: string[], k: number) => list[Math.round(k * (list.length - 1))];
    let shown = -1;

    const pin = scrollPin(el, {
      top,
      pinDistance: Math.round(window.innerHeight * 3),
      onEnter: () => setTour('on'),
      onEnterBack: () => setTour('on'),
      onLeave: () => setTour('after'),
      onLeaveBack: () => setTour('before'),
      onProgress: (p) => {
        const i = Math.min(3, Math.floor(p * 4));
        if (i !== shown) {
          shown = i;
          setActive(i);
        }
        el.style.setProperty('--p', p.toFixed(4));
        // How far through feature n the reader is, with a little hold at each end
        const k = (n: number) => Math.min(1, Math.max(0, (p * 4 - n - 0.08) / 0.84));

        lcd[0].textContent = pick(ISO, k(0));
        scan?.setAttribute('transform', `translate(0 ${f1(k(0) * 96)})`);

        lcd[1].textContent = `f/${pick(FSTOP, k(1))}`;
        const ap = aperture(56 / (2 * 2 ** (k(1) * 3)));
        open?.setAttribute('points', ap.open);
        blades?.setAttribute('d', ap.blades);

        lcd[2].textContent = pick(SHUTTER, k(2));
        const shake = Math.min(1, Math.max(0, p * 4 - 2));
        const deg = still || i !== 2 ? 0 : 1.5 * Math.sin(Math.PI * shake) * Math.sin(shake * Math.PI * 7);
        body?.setAttribute('transform', `rotate(${deg.toFixed(2)} ${CX} ${CY})`);

        const v = 0.12 + 0.88 * k(3);
        lcd[3].textContent = `${Math.round(v * 100)}%`;
        charge?.setAttribute('y', f1(341 - 130 * v));
        charge?.setAttribute('height', f1(130 * v));
      },
    });
    return () => pin.destroy();
  }, []);

  const f = FEATURES[active];
  const [fx, fy, fw, fh] = f.frame;

  return (
    <div className="lu-pin-host">
      <div ref={stage} className="lu-stage" data-tour={tour}>
        <div className="lu-rail">
          <span className="lu-rail-l">Inside the X2</span>
          <ol>
            {FEATURES.map((x, i) => (
              <li key={x.k} className={i === active ? 'is-on' : ''} style={{ '--i': i } as CSSProperties}>
                <i />
                <span><em>0{i + 1}</em> {x.n}</span>
              </li>
            ))}
          </ol>
          <a className="lu-skip" href="#specs">Skip the tour ↓</a>
        </div>

        <div className="lu-stage-body">
          <div className="lu-cam-col">
            <div className="lu-cam" data-f={f.k} style={{ '--fx': fx, '--fy': fy, '--fw': fw, '--fh': fh } as CSSProperties}>
              <div className="lu-zoom">
                <Camera id="tour" xray />
                <span className="lu-tag">{f.tag}</span>
              </div>
            </div>
            <div className="lu-lcd" aria-label="Camera readout">
              <span className="lu-led" aria-hidden="true" />
              {LCD.map(([label, value], i) => (
                <span key={label} className={i === active ? 'is-on' : ''}>
                  <i>{label}</i>
                  <b>{value}</b>
                </span>
              ))}
            </div>
          </div>

          <div className="lu-caps">
            {FEATURES.map((x, i) => (
              <article key={x.k} className={`lu-cap${i === active ? ' is-on' : i < active ? ' is-past' : ''}`} aria-hidden={i !== active}>
                <p className="lu-cap-n">0{i + 1} <span>/ 04</span> · {x.n}</p>
                <h3>{x.h}</h3>
                <p className="lu-cap-p">{x.p}</p>
                <ul className="lu-figs">
                  {x.figs.map(([v, l]) => <li key={v}><b>{v}</b><span>{l}</span></li>)}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── The rest of the page ── */

function HeroCamera() {
  const [inked, setInked] = useState(false);
  return (
    <>
      <ScrollDraw className={`lu-hero-cam${inked ? ' is-inked' : ''}`} selector=".lu-ink" autoplay duration={1100} delay={200} stagger={0.035} easing="ease-in-out" once onComplete={() => setInked(true)}>
        <Camera id="hero" />
      </ScrollDraw>
      <p className="lu-hero-note">Shown in Graphite · 128 × 75 × 55 mm · 478 g</p>
    </>
  );
}

const SHOTS = [
  { s: 'golden', t: 'Alfama, 7:48 pm', e: 'f/5.6 · 1/500 · ISO 160', look: 'Warm Chrome' },
  { s: 'harbour', t: 'Cais do Sodré, blue hour', e: 'f/2 · ½ s handheld · ISO 400', look: 'Standard' },
  { s: 'bokeh', t: 'Tram stop after rain', e: 'f/2 · 1/125 · ISO 6,400', look: 'Standard' },
  { s: 'fog', t: 'Morning fog, Sintra', e: 'f/8 · 1/250 · ISO 100', look: 'Soft Slide' },
  { s: 'mono', t: 'Arcade, Rua Augusta', e: 'f/11 · 1/1000 · ISO 200', look: 'Lumen Mono' },
  { s: 'dunes', t: 'Comporta, noon', e: 'f/2 · 1/4000 · ND on · ISO 80', look: 'Warm Chrome' },
];

const SPECS: [string, [string, string][]][] = [
  ['Imaging', [
    ['Sensor', '40.2 MP APS-C (23.5 × 15.6 mm), back-illuminated, no low-pass filter'],
    ['ISO', '80–25,600 native, extended to 51,200'],
    ['Stabilisation', '5-axis sensor-shift, 7 stops (CIPA)'],
    ['Autofocus', '425-point phase detect; people, animal and vehicle tracking'],
    ['Video', '6.2K 30p, 4K 60p in 10-bit 4:2:2, Lumen Log'],
  ]],
  ['Lens', [
    ['Focal length', '18.5 mm (28 mm full-frame equivalent)'],
    ['Aperture', 'f/2.0–16, nine rounded blades'],
    ['Construction', '8 elements in 6 groups, 2 aspherical'],
    ['Close focus', '10 cm in macro mode'],
    ['ND filter', 'Built in, 4 stops'],
  ]],
  ['Body', [
    ['Shutter', 'Leaf shutter to 1/4000 s; electronic to 1/180,000 s'],
    ['Viewfinder', 'Hybrid: optical, or 3.69M-dot OLED at 0.66×'],
    ['Screen', '3.0″ 1.62M-dot tilting touchscreen'],
    ['Materials', 'Magnesium top and bottom plates, machined brass dials'],
    ['Size and weight', '128 × 75 × 55 mm, 478 g with battery and card'],
  ]],
  ['Power and connections', [
    ['Battery', 'NP-L2 Li-ion, 450 shots (CIPA) or 70 min of 6K video'],
    ['Charging', 'USB-C Power Delivery, to 80% in 35 minutes'],
    ['Storage', 'One UHS-II SD slot'],
    ['Ports', 'USB-C 3.2, micro-HDMI, 3.5 mm mic'],
    ['Wireless', 'Wi-Fi 6, Bluetooth 5.2, Lumen Link app'],
  ]],
];

const FINISHES: { k: Finish; n: string; sw: string }[] = [
  { k: 'graphite', n: 'Graphite', sw: 'linear-gradient(135deg, #2a2a2d, #0e0e10)' },
  { k: 'silver', n: 'Silver', sw: 'linear-gradient(135deg, #e6e3dc, #a9a59d)' },
];
const PACKAGES = [
  { k: 'body', n: 'Camera', d: 'X2, one battery, strap, USB-C cable', p: 1599 },
  { k: 'travel', n: 'Travel kit', d: 'Adds a second battery, a thumb grip and a lens hood', p: 1749 },
] as const;
const usd = (n: number) => `$${Math.floor(n / 1000)},${String(n % 1000).padStart(3, '0')}`;

function Buy() {
  const [finish, setFinish] = useState<Finish>('graphite');
  const [pack, setPack] = useState<(typeof PACKAGES)[number]['k']>('body');
  const price = PACKAGES.find((x) => x.k === pack)?.p ?? 1599;
  return (
    <div className="lu-buy">
      <div className="lu-buy-art">
        <Camera id="buy" finish={finish} />
        <p>Lumen X2 · {finish === 'graphite' ? 'Graphite' : 'Silver'}</p>
      </div>
      <div className="lu-buy-panel">
        <fieldset className="lu-opts">
          <legend>Finish</legend>
          <div className="lu-opts-row">
            {FINISHES.map((x) => (
              <label key={x.k} className="lu-opt">
                <input type="radio" name="lu-finish" value={x.k} checked={finish === x.k} onChange={() => setFinish(x.k)} />
                <span className="lu-swatch" style={{ background: x.sw }} />
                <b>{x.n}</b>
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="lu-opts">
          <legend>Package</legend>
          {PACKAGES.map((x) => (
            <label key={x.k} className="lu-opt">
              <input type="radio" name="lu-pack" value={x.k} checked={pack === x.k} onChange={() => setPack(x.k)} />
              <span><b>{x.n}</b><small>{x.d}</small></span>
              <em>{usd(x.p)}</em>
            </label>
          ))}
        </fieldset>
        <div className="lu-total">
          <span>Total</span>
          <b>{usd(price)}</b>
        </div>
        <a className="sk-btn lu-buy-cta" href="#buy">Pre-order — {usd(price)}</a>
        <ul className="lu-notes">
          <li>Ships from 14 November, in the order pre-orders were placed</li>
          <li>Free two-day delivery and 30-day returns</li>
          <li>Two-year warranty, three if you register it</li>
        </ul>
      </div>
    </div>
  );
}

export function LumenSite() {
  return (
    <Site
      className="lu"
      brand={<><span className="lu-mark" aria-hidden="true" />LUMEN</>}
      links={['X2', 'Tour', 'Samples', 'Specs', 'Support']}
      cta="Pre-order"
      example="scroll-pin"
      apis="scrollPin · onProgress · onEnter/onLeave"
      footnote="Lumen Optical · Porto, Portugal"
    >
      <Hero
        kicker="Lumen X2 · New"
        title="The whole day, in one pocket."
        lede={<>A 40-megapixel compact with a fixed 28 mm f/2 lens, seven stops of stabilisation and a battery that outlasts the light. Machined from magnesium and brass.<span className="lu-price"><b>$1,599</b> body and lens · ships 14 November</span></>}
        actions={['Pre-order', 'Take the tour']}
        art={<HeroCamera />}
      />
      <ul className="lu-facts">
        {[['40.2 MP', 'APS-C sensor'], ['28 mm f/2', 'fixed lens'], ['7 stops', 'stabilisation'], ['478 g', 'with battery']].map(([v, l]) => (
          <li key={v}><b>{v}</b><span>{l}</span></li>
        ))}
      </ul>

      <Sec id="tour" kicker="Inside the X2" title="Four parts, one small camera." lede="Keep scrolling. The camera stays put while we take you through the sensor, the lens, the stabiliser and the battery.">
        <Tour />
      </Sec>

      <Sec id="samples" tone="alt" kicker="Sample photos" title="Straight out of the X2." lede="Unedited JPEGs from a week in and around Lisbon, in three of the camera's built-in film looks.">
        <div className="lu-gallery">
          {SHOTS.map((x) => (
            <figure key={x.s} className="lu-tile">
              <div className={`lu-shot s-${x.s}`} role="img" aria-label={`Sample photo: ${x.t}`} />
              <span className="lu-look">{x.look}</span>
              <figcaption><b>{x.t}</b><span>{x.e}</span></figcaption>
            </figure>
          ))}
        </div>
      </Sec>

      <Sec id="specs" kicker="Tech specs" title="Lumen X2, in full.">
        <div className="lu-specs">
          {SPECS.map(([group, rows]) => (
            <div key={group} className="lu-spec">
              <h3>{group}</h3>
              <table>
                <tbody>
                  {rows.map(([k, v]) => <tr key={k}><th scope="row">{k}</th><td>{v}</td></tr>)}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </Sec>

      <Sec id="buy" tone="alt" kicker="Pre-order" title="Make it yours." lede="Two finishes, one camera. Pre-orders ship from 14 November, in the order they were placed.">
        <Buy />
      </Sec>
    </Site>
  );
}
