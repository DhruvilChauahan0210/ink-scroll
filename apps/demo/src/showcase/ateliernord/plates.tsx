'use client';

import { useId } from 'react';

/*
 * Atelier Nord's "photographs". The page ships no image files: every plate is
 * a scene in inline SVG — atmospheric gradients for the renders, flat collage
 * colour for the elevations, an isometric card model for the model shots —
 * with a grain layer laid over it in CSS. Every random-looking detail comes
 * from a seeded generator, so the server and the browser draw the same scene.
 */

export const r1 = (v: number) => Math.round(v * 10) / 10;

export function rng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function useUid(prefix: string) {
  const raw = useId();
  const u = prefix + raw.replace(/[^a-zA-Z0-9]/g, '');
  return { id: (k: string) => `${u}-${k}`, url: (k: string) => `url(#${u}-${k})` };
}

type SceneProps = { align?: string };

/* A soft blur over the whole scene box — for clouds and mist, which read as
   flat bars without it. userSpaceOnUse, so thin ellipses are not clipped. */
function Soft({ id, d = 7 }: { id: string; d?: number }) {
  return (
    <filter id={id} filterUnits="userSpaceOnUse" x="-100" y="-100" width="1800" height="1200">
      <feGaussianBlur stdDeviation={d} />
    </filter>
  );
}

/* ── A spruce, the one tree every Norwegian site plan has ─────────────────── */
function sprucePath(x: number, base: number, h: number, tiers = 6) {
  const pts: [number, number][] = [[x, base - h]];
  const right: [number, number][] = [];
  for (let k = 0; k < tiers; k++) {
    const y = base - h + ((k + 1) * h * 0.9) / tiers;
    const w = (0.34 * h * (k + 1)) / tiers;
    right.push([x + w * 0.42, y - (h / tiers) * 0.5], [x + w, y]);
  }
  pts.push(...right);
  pts.push([x + h * 0.03, base - h * 0.1], [x + h * 0.03, base], [x - h * 0.03, base], [x - h * 0.03, base - h * 0.1]);
  pts.push(...right.slice().reverse().map(([px, py]) => [2 * x - px, py] as [number, number]));
  return 'M' + pts.map(([a, b]) => `${r1(a)} ${r1(b)}`).join(' L') + ' Z';
}
function spruceSnow(x: number, base: number, h: number, tiers = 6) {
  let d = '';
  for (let k = 0; k < tiers; k++) {
    const y = base - h + ((k + 1) * h * 0.9) / tiers;
    const w = (0.34 * h * (k + 1)) / tiers;
    d += `M${r1(x + w * 0.42)} ${r1(y - (h / tiers) * 0.5)} L${r1(x + w)} ${r1(y)} `;
  }
  return d;
}

/* ══ 1 · Fjordhus, Lofoten — blue hour ═══════════════════════════════════ */

const FJ_GLITTER = (() => {
  const r = rng(11);
  return Array.from({ length: 46 }, (_, i) => {
    const t = i / 45;
    const y = 616 + Math.pow(t, 1.6) * 330;
    const w = (20 + t * 250) * (0.4 + r() * 0.9);
    const x = 1180 - w / 2 + (r() - 0.5) * 90 * t;
    return { x: r1(x), y: r1(y), w: r1(w), h: r1(1 + t * 3), o: Math.round((0.62 * (1 - t) + 0.05) * 100) / 100 };
  });
})();
const FJ_STARS: [number, number, number][] = [[118, 58, 1.1], [262, 112, 0.9], [408, 38, 1.2], [618, 92, 0.8], [764, 28, 1], [980, 70, 0.9], [1124, 24, 1.1], [1392, 86, 0.8], [1502, 38, 1], [880, 150, 0.7], [330, 190, 0.7]];
const FJ_BOARDS = Array.from({ length: 66 }, (_, i) => 436 + i * 7);
const FJ_SEAMS = Array.from({ length: 50 }, (_, i) => 420 + i * 10);
const FJ_MID = 'M0 612 L0 244 L34 226 L68 164 L92 186 L122 112 L146 146 L170 128 L202 192 L236 214 L266 202 L298 258 L336 296 L370 288 L410 344 L452 388 L500 420 L548 468 L602 500 L662 540 L722 570 L782 596 L842 612 Z';
const FJ_HEAD = 'M1330 612 L1372 594 L1420 566 L1466 556 L1512 530 L1560 522 L1600 514 L1600 612 Z';

export function Fjordhus({ align = 'xMidYMid' }: SceneProps) {
  const { id, url } = useUid('fj');
  return (
    <svg viewBox="0 0 1600 1000" preserveAspectRatio={`${align} slice`} aria-hidden="true">
      <defs>
        <linearGradient id={id('sky')} x1="0" y1="0" x2="0" y2="612" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#121a25" />
          <stop offset="0.36" stopColor="#2c3747" />
          <stop offset="0.64" stopColor="#6a6774" />
          <stop offset="0.83" stopColor="#bb977f" />
          <stop offset="0.95" stopColor="#e6c298" />
          <stop offset="1" stopColor="#efd2a6" />
        </linearGradient>
        <radialGradient id={id('sun')} cx="1180" cy="606" r="640" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffe4b4" stopOpacity="0.95" />
          <stop offset="0.22" stopColor="#f2bf8a" stopOpacity="0.45" />
          <stop offset="1" stopColor="#f2bf8a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id('far')} x1="0" y1="420" x2="0" y2="612" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#6b6672" />
          <stop offset="1" stopColor="#a08d86" />
        </linearGradient>
        <linearGradient id={id('mid')} x1="0" y1="110" x2="0" y2="612" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#272e39" />
          <stop offset="1" stopColor="#4a4d58" />
        </linearGradient>
        <linearGradient id={id('sea')} x1="0" y1="610" x2="0" y2="1000" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#a48e87" />
          <stop offset="0.06" stopColor="#5b5f6e" />
          <stop offset="0.45" stopColor="#2e3646" />
          <stop offset="1" stopColor="#11161e" />
        </linearGradient>
        <linearGradient id={id('rock')} x1="0" y1="664" x2="0" y2="1000" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#30353c" />
          <stop offset="0.28" stopColor="#1b1f24" />
          <stop offset="1" stopColor="#0b0d10" />
        </linearGradient>
        <linearGradient id={id('win')} x1="0" y1="612" x2="0" y2="664" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffe6b8" />
          <stop offset="1" stopColor="#e8964e" />
        </linearGradient>
        <radialGradient id={id('halo')} cx="680" cy="650" r="320" gradientUnits="userSpaceOnUse" gradientTransform="matrix(1 0 0 0.32 0 442)">
          <stop offset="0" stopColor="#f6b468" stopOpacity="0.5" />
          <stop offset="1" stopColor="#f6b468" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id('roof')} x1="0" y1="566" x2="0" y2="606" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#4a4e56" />
          <stop offset="0.2" stopColor="#2a2e34" />
          <stop offset="1" stopColor="#17191d" />
        </linearGradient>
        <Soft id={id('cl')} d={6} />
      </defs>

      <rect width="1600" height="612" fill={url('sky')} />
      {FJ_STARS.map(([x, y, r]) => <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill="#fff" opacity="0.5" />)}
      <g filter={url('cl')}>
        <ellipse cx="300" cy="150" rx="320" ry="10" fill="#3b4453" opacity="0.7" />
        <ellipse cx="560" cy="182" rx="220" ry="6" fill="#3b4453" opacity="0.5" />
        <ellipse cx="940" cy="276" rx="420" ry="12" fill="#8a7d84" opacity="0.34" />
        <ellipse cx="1300" cy="392" rx="340" ry="9" fill="#d0a48a" opacity="0.42" />
        <ellipse cx="1000" cy="474" rx="460" ry="6" fill="#e6bb94" opacity="0.34" />
      </g>
      <rect width="1600" height="612" fill={url('sun')} />
      <path d="M560 612 L640 600 L700 594 L760 598 L820 582 L880 588 L940 558 L990 570 L1040 538 L1090 554 L1130 518 L1170 532 L1210 496 L1250 518 L1300 468 L1340 490 L1380 444 L1420 466 L1470 418 L1520 450 L1560 428 L1600 444 L1600 612 Z" fill={url('far')} />
      <rect width="1600" height="612" fill={url('sun')} opacity="0.38" />
      <path d={FJ_MID} fill={url('mid')} />
      <path d="M122 112 L130 160 L126 206 M170 128 L176 170 M68 164 L74 200 L70 236 M266 202 L272 236 M410 344 L418 372" stroke="#9aa0ab" strokeWidth="1.6" fill="none" opacity="0.14" strokeLinecap="round" />
      <path d={FJ_HEAD} fill="#3a404b" />

      <rect y="610" width="1600" height="390" fill={url('sea')} />
      <path d={FJ_MID} fill="#202733" opacity="0.5" transform="matrix(1 0 0 -0.55 0 948.6)" />
      <path d={FJ_HEAD} fill="#202733" opacity="0.45" transform="matrix(1 0 0 -0.55 0 948.6)" />
      <rect y="610" width="1600" height="2" fill="#f3d3a8" opacity="0.26" />
      {FJ_GLITTER.map((g) => <rect key={`${g.x}-${g.y}`} x={g.x} y={g.y} width={g.w} height={g.h} rx={g.h / 2} fill="#ffdcaa" opacity={g.o} />)}
      <path d="M1298 702 L1362 702 L1353 709 L1307 709 Z" fill="#12161b" />
      <path d="M1328 702 V640 M1328 646 L1352 698" stroke="#12161b" strokeWidth="1.6" fill="none" />
      <path d="M1328 712 V740" stroke="#12161b" strokeWidth="1.2" opacity="0.3" />

      <path d="M0 1000 L0 712 C60 700 120 690 190 688 C260 686 320 678 380 672 L1020 668 C1060 672 1090 690 1120 712 C1170 748 1230 780 1290 820 C1360 866 1420 920 1470 1000 Z" fill={url('rock')} />
      <path d="M0 712 C60 700 120 690 190 688 C260 686 320 678 380 672 L1020 668 C1060 672 1090 690 1120 712 C1170 748 1230 780 1290 820 C1360 866 1420 920 1470 1000" stroke="#6a6c70" strokeWidth="2" fill="none" opacity="0.45" />
      <path d="M40 760 C180 744 300 750 420 742 M220 820 C380 800 520 812 700 796 C820 786 900 790 1010 770 M80 900 C260 880 420 900 600 880 M1080 760 C1140 790 1200 810 1260 850" stroke="#3a3f46" strokeWidth="1.6" fill="none" opacity="0.7" />
      <rect x="300" y="560" width="900" height="200" fill={url('halo')} />

      <rect x="416" y="566" width="498" height="40" fill={url('roof')} />
      {FJ_SEAMS.map((x) => <path key={x} d={`M${x} 567 V606`} stroke="#30343a" strokeWidth="1" />)}
      <rect x="416" y="565" width="498" height="1.6" fill="#7b7e84" opacity="0.7" />
      <rect x="760" y="546" width="13" height="21" fill="#16191d" />
      <rect x="430" y="606" width="470" height="64" fill="#14171b" />
      {FJ_BOARDS.map((x) => <path key={x} d={`M${x} 606 V670`} stroke="#1f2328" strokeWidth="1.3" />)}
      <rect x="560" y="613" width="240" height="52" fill={url('win')} />
      <circle cx="650" cy="628" r="16" fill="#fff3d6" opacity="0.35" />
      <circle cx="650" cy="628" r="4" fill="#fff8e6" />
      <path d="M650 613 V624" stroke="#5a3d24" strokeWidth="1" />
      <circle cx="712" cy="628" r="14" fill="#fff3d6" opacity="0.3" />
      <circle cx="712" cy="628" r="3.6" fill="#fff8e6" />
      <path d="M712 613 V624" stroke="#5a3d24" strokeWidth="1" />
      <rect x="626" y="646" width="110" height="3" fill="#5c3e25" />
      <path d="M634 649 V665 M728 649 V665" stroke="#5c3e25" strokeWidth="2" />
      <circle cx="774" cy="629" r="5" fill="#3d2b1f" />
      <path d="M766 665 L767 640 C767 636 770 635 774 635 C778 635 781 636 781 640 L782 665 Z" fill="#3d2b1f" />
      <path d="M590 665 C592 652 596 646 602 644 L612 644 L612 665 Z" fill="#a8683b" opacity="0.8" />
      {[620, 680, 740].map((x) => <rect key={x} x={x - 1.5} y="613" width="3" height="52" fill="#14171b" />)}
      <rect x="560" y="664" width="240" height="2" fill="#2b2016" />
      <rect x="900" y="622" width="150" height="40" fill="#111316" />
      <rect x="900" y="621" width="150" height="1.4" fill="#6c6f75" opacity="0.6" />
      <rect x="975" y="630" width="58" height="23" fill={url('win')} />
      <rect x="1003" y="630" width="2" height="23" fill="#111316" />
      <path d="M1036 662 V680" stroke="#111316" strokeWidth="4" />
      <path d="M360 670 H430 M366 670 V656 M392 670 V656 M418 670 V656 M360 656 H430" stroke="#2a2e33" strokeWidth="1.6" fill="none" />
      <ellipse cx="680" cy="676" rx="220" ry="9" fill="#f2b46a" opacity="0.16" />

      <path d="M0 1000 L0 862 C120 842 260 852 380 880 C470 902 540 940 600 1000 Z" fill="#0b0d0f" />
    </svg>
  );
}

/* ══ 2 · Bryggen Library, Bergen — collage elevation of the wharf ═════════ */

type Gable = { w: number; h: number; c: string; lib?: boolean };
const BRYGGEN: Gable[] = [
  { w: 140, h: 176, c: '#b9663f' },
  { w: 120, h: 186, c: '#c99a4e' },
  { w: 100, h: 160, c: '#9a4835' },
  { w: 130, h: 202, c: '#e8e0cf' },
  { w: 110, h: 170, c: '#d5ae62' },
  { w: 236, h: 206, c: '#2a2826', lib: true },
  { w: 120, h: 190, c: '#a24d38' },
  { w: 100, h: 152, c: '#ebe6da' },
  { w: 140, h: 200, c: '#c79145' },
  { w: 110, h: 172, c: '#7e3a2b' },
  { w: 130, h: 186, c: '#e1d4b8' },
  { w: 120, h: 166, c: '#b85b3e' },
];
const QUAY = 690;
const BRYGGEN_LAYOUT = (() => {
  let x = -60;
  return BRYGGEN.map((g) => {
    const out = { ...g, x, top: QUAY - g.h, peak: QUAY - g.h - g.w * (g.lib ? 0.55 : 0.62) };
    x += g.w;
    return out;
  });
})();
const mtn = (x: number) => 330 - 60 * Math.sin(x / 300) + 0.00012 * (x - 900) ** 2;
const BRY_MTN = 'M0 700 L' + Array.from({ length: 41 }, (_, i) => `${i * 40} ${r1(mtn(i * 40))}`).join(' L') + ' L1600 700 Z';
const BRY_HOUSES = (() => {
  const r = rng(29);
  const cols = ['#f2eee6', '#f2eee6', '#ece4d2', '#e6cf98', '#c98466', '#f2eee6', '#dcd6c8'];
  const out: { x: number; y: number; w: number; h: number; c: string }[] = [];
  for (let k = 0; k < 7; k++) {
    for (let x = 6 + r() * 30; x < 1594; x += 15 + r() * 24) {
      if (r() < 0.42) continue;
      const y = mtn(x) + 58 + k * 26 + (r() - 0.5) * 7;
      if (y > 520) continue;
      const s = 0.75 + k * 0.1;
      out.push({ x: r1(x), y: r1(y), w: r1((8 + r() * 5) * s), h: r1((5.5 + r() * 2) * s), c: cols[Math.floor(r() * cols.length)] });
    }
  }
  return out;
})();
const BRY_FOREST = (() => {
  const r = rng(31);
  return Array.from({ length: 150 }, () => {
    const x = r() * 1600;
    return { x: r1(x), y: r1(mtn(x) + 6 + r() * 46), r: r1(5 + r() * 7) };
  });
})();
const BRY_RIPPLES = (() => {
  const r = rng(5);
  return Array.from({ length: 70 }, (_, i) => {
    const y = 712 + i * 4.2;
    const x = r() * 1500 - 100;
    return { x: r1(x), y: r1(y), w: r1(120 + r() * 520) };
  });
})();

function Wharf({ reflect = false }: { reflect?: boolean }) {
  return (
    <g>
      {BRYGGEN_LAYOUT.map((g) => {
        const cols = Math.max(2, Math.floor(g.w / 36));
        const rows = Math.max(2, Math.floor(g.h / 50));
        const gx = g.w / cols;
        const gy = (g.h - 30) / rows;
        const light = g.c === '#e8e0cf' || g.c === '#ebe6da' || g.c === '#e1d4b8';
        return (
          <g key={g.x}>
            <path d={`M${g.x} ${QUAY} V${g.top} L${g.x + g.w / 2} ${r1(g.peak)} L${g.x + g.w} ${g.top} V${QUAY} Z`} fill={g.c} />
            {!g.lib && Array.from({ length: Math.floor(g.w / 6) }, (_, i) => (
              <path key={i} d={`M${g.x + 3 + i * 6} ${QUAY} V${g.top}`} stroke={light ? '#000' : '#000'} strokeOpacity={light ? 0.05 : 0.09} strokeWidth="1" />
            ))}
            <path d={`M${g.x - 3} ${g.top + 3} L${g.x + g.w / 2} ${r1(g.peak - 4)} L${g.x + g.w + 3} ${g.top + 3}`} stroke={g.lib ? '#141312' : '#3a2c24'} strokeWidth="5" fill="none" strokeLinejoin="miter" />
            <rect x={g.x + g.w - 7} y={g.top} width="7" height={g.h} fill="#000" opacity="0.12" />
            {g.lib ? (
              <g>
                <path d={`M${g.x + 22} ${QUAY} V${g.top + 14} L${g.x + g.w / 2} ${r1(g.peak + 24)} L${g.x + g.w - 22} ${g.top + 14} V${QUAY} Z`} fill="#b9c1c0" />
                <path d={`M${g.x + 22} ${QUAY} V${g.top + 80} H${g.x + g.w - 22} V${QUAY} Z`} fill="#e3bd86" />
                <path d={`M${g.x + 22} ${g.top + 80} V${g.top + 14} L${g.x + g.w / 2} ${r1(g.peak + 24)} L${g.x + g.w - 22} ${g.top + 14} V${g.top + 80} Z`} fill="#c5ccca" opacity="0.9" />
                <path d={`M${g.x + 40} ${g.top + 60} L${g.x + 150} ${r1(g.peak + 60)}`} stroke="#fff" strokeWidth="26" opacity="0.18" />
                {[0.25, 0.5, 0.75].map((t) => <path key={t} d={`M${g.x + 22 + (g.w - 44) * t} ${QUAY} V${g.top + 10}`} stroke="#141312" strokeWidth="3" />)}
                <path d={`M${g.x + 22} ${g.top + 80} H${g.x + g.w - 22} M${g.x + 22} ${g.top + 140} H${g.x + g.w - 22}`} stroke="#141312" strokeWidth="3" />
                {Array.from({ length: 22 }, (_, i) => <rect key={i} x={g.x + 30 + i * 8} y={g.top + 120 - (i % 3) * 2} width="5" height={14 + (i % 3) * 2} fill={['#7d3e2f', '#3e4a52', '#a8813f', '#5b5148'][i % 4]} opacity="0.85" />)}
                <rect x={g.x + 26} y={g.top + 134} width={g.w - 52} height="3" fill="#6e4c2c" />
                <circle cx={g.x + 92} cy={g.top + 160} r="4" fill="#2d2420" />
                <path d={`M${g.x + 86} ${QUAY - 2} L${g.x + 87} ${g.top + 168} C${g.x + 87} ${g.top + 165} ${g.x + 97} ${g.top + 165} ${g.x + 97} ${g.top + 168} L${g.x + 98} ${QUAY - 2} Z`} fill="#2d2420" />
                <circle cx={g.x + 150} cy={g.top + 166} r="3.4" fill="#2d2420" />
                <path d={`M${g.x + 145} ${QUAY - 2} L${g.x + 146} ${g.top + 173} C${g.x + 146} ${g.top + 170} ${g.x + 154} ${g.top + 170} ${g.x + 154} ${g.top + 173} L${g.x + 155} ${QUAY - 2} Z`} fill="#2d2420" />
              </g>
            ) : (
              <g>
                {Array.from({ length: rows }, (_, ry) => Array.from({ length: cols }, (_, cx) => (
                  <g key={`${ry}-${cx}`}>
                    <rect x={r1(g.x + gx * cx + gx / 2 - 8)} y={r1(g.top + 18 + gy * ry)} width="16" height="22" fill="#f3efe5" />
                    <rect x={r1(g.x + gx * cx + gx / 2 - 5.5)} y={r1(g.top + 20.5 + gy * ry)} width="11" height="17" fill="#3b3733" />
                    <path d={`M${r1(g.x + gx * cx + gx / 2)} ${r1(g.top + 20.5 + gy * ry)} v17 M${r1(g.x + gx * cx + gx / 2 - 5.5)} ${r1(g.top + 29 + gy * ry)} h11`} stroke="#f3efe5" strokeWidth="1.2" />
                  </g>
                )))}
                <rect x={r1(g.x + g.w / 2 - 9)} y={r1(g.top - (g.top - g.peak) * 0.62)} width="18" height="24" fill={light ? '#5a4a3e' : '#2c2622'} />
                <path d={`M${g.x + g.w / 2} ${r1(g.peak + 6)} v-6 m-14 0 h28`} stroke="#2c2622" strokeWidth="3" />
              </g>
            )}
          </g>
        );
      })}
      {!reflect && <rect x="-60" y={QUAY} width="1720" height="16" fill="#6b5846" />}
    </g>
  );
}

export function Bryggen({ align = 'xMidYMid' }: SceneProps) {
  const { id, url } = useUid('br');
  return (
    <svg viewBox="0 0 1600 1000" preserveAspectRatio={`${align} slice`} aria-hidden="true">
      <defs>
        <linearGradient id={id('sky')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#cfd4d4" />
          <stop offset="1" stopColor="#ebe9e2" />
        </linearGradient>
        <linearGradient id={id('mtn')} x1="0" y1="240" x2="0" y2="700" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#6f7c70" />
          <stop offset="1" stopColor="#8e968a" />
        </linearGradient>
        <linearGradient id={id('sea')} x1="0" y1="706" x2="0" y2="1000" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#7c8784" />
          <stop offset="0.5" stopColor="#4c5755" />
          <stop offset="1" stopColor="#2c3534" />
        </linearGradient>
        <linearGradient id={id('fade')} x1="0" y1="706" x2="0" y2="1000" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#3f4a48" stopOpacity="0" />
          <stop offset="1" stopColor="#2c3534" stopOpacity="1" />
        </linearGradient>
        <linearGradient id={id('mist')} x1="0" y1="360" x2="0" y2="700" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#e4e5e0" stopOpacity="0" />
          <stop offset="1" stopColor="#e4e5e0" stopOpacity="0.55" />
        </linearGradient>
        <Soft id={id('cl')} d={10} />
      </defs>
      <rect width="1600" height="1000" fill={url('sky')} />
      <g filter={url('cl')}>
        <ellipse cx="420" cy="170" rx="400" ry="34" fill="#fff" opacity="0.45" />
        <ellipse cx="1200" cy="110" rx="480" ry="40" fill="#fff" opacity="0.4" />
      </g>
      <path d={BRY_MTN} fill={url('mtn')} />
      <g fill="#56634f" opacity="0.4">{BRY_FOREST.map((t) => <circle key={`${t.x}-${t.y}`} cx={t.x} cy={t.y} r={t.r} />)}</g>
      <path d="M0 540 C220 490 420 520 640 490 C860 460 1080 500 1300 472 C1440 456 1540 466 1600 472 L1600 700 L0 700 Z" fill="#7d8676" opacity="0.4" />
      {BRY_HOUSES.map((h) => (
        <g key={`${h.x}-${h.y}`}>
          <rect x={h.x} y={h.y} width={h.w} height={h.h} fill={h.c} opacity="0.92" />
          <rect x={h.x - 0.5} y={h.y - 1.6} width={h.w + 1} height="1.8" fill="#5b4f45" opacity="0.55" />
        </g>
      ))}
      <rect y="360" width="1600" height="340" fill={url('mist')} />
      <Wharf />
      {Array.from({ length: 58 }, (_, i) => <rect key={i} x={-40 + i * 30} y={QUAY + 16} width="7" height="22" fill="#3a3029" />)}
      <rect y={QUAY + 16} width="1600" height="294" fill={url('sea')} />
      <g transform={`matrix(1 0 0 -0.82 0 ${r1((QUAY + 16) * 1.82)})`} opacity="0.32">
        <Wharf reflect />
      </g>
      {BRY_RIPPLES.map((p) => <rect key={`${p.x}-${p.y}`} x={p.x} y={p.y} width={p.w} height="1.6" fill="#97a3a0" opacity="0.32" />)}
      <rect y={QUAY + 16} width="1600" height="294" fill={url('fade')} />
      <path d="M262 742 C300 752 380 752 420 742 L410 756 C380 762 300 762 272 756 Z" fill="#e9e3d6" />
      <path d="M268 748 H414" stroke="#a24d38" strokeWidth="2" />
      <path d="M340 742 V700" stroke="#2a2522" strokeWidth="1.6" />
      {[[120, 1], [168, 0.9], [560, 1], [598, 0.82], [904, 1], [1182, 0.95], [1214, 0.7], [1420, 1]].map(([x, s]) => (
        <g key={x} transform={`translate(${x} ${QUAY}) scale(${s})`} fill="#2b2724">
          <circle cx="0" cy="-19.5" r="3.6" />
          <path d="M-4 0 L-4.5 -12 L-5.5 -12 L-5.5 -14 C-5.5 -15.4 -4 -16 0 -16 C4 -16 5.5 -15.4 5.5 -14 L5.5 -12 L4.5 -12 L4 0 Z" />
        </g>
      ))}
    </svg>
  );
}

/* ══ 3 · Kvitfjell Cabin — winter, low sun ════════════════════════════════ */

const ridge = (x: number) => 452 + 24 * Math.sin(x / 210 + 1) + 14 * Math.sin(x / 88);
const KV_RIDGE = 'M0 620 L' + Array.from({ length: 81 }, (_, i) => `${i * 20} ${r1(ridge(i * 20))}`).join(' L') + ' L1600 620 Z';
const KV_FAR = (() => {
  const r = rng(3);
  const out: { x: number; b: number; h: number }[] = [];
  for (let x = 4; x < 1600; x += 7 + r() * 8) {
    if (r() < 0.18) continue;
    out.push({ x: r1(x), b: r1(ridge(x) + 6), h: r1(12 + r() * 16) });
  }
  return out;
})();
const KV_TREES = (() => {
  const r = rng(17);
  const left = Array.from({ length: 13 }, (_, i) => ({ x: 40 + i * 30 + r() * 18, b: 650 + r() * 26, h: 90 + r() * 90 }));
  const right = Array.from({ length: 11 }, (_, i) => ({ x: 1230 + i * 34 + r() * 18, b: 664 + r() * 24, h: 100 + r() * 100 }));
  return [...left, ...right].sort((a, b) => a.b - b.b).map((t) => ({ x: r1(t.x), b: r1(t.b), h: r1(t.h) }));
})();

export function Kvitfjell({ align = 'xMidYMid' }: SceneProps) {
  const { id, url } = useUid('kv');
  return (
    <svg viewBox="0 0 1600 1000" preserveAspectRatio={`${align} slice`} aria-hidden="true">
      <defs>
        <linearGradient id={id('sky')} x1="0" y1="0" x2="0" y2="620" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#aab4be" />
          <stop offset="0.55" stopColor="#d6dadd" />
          <stop offset="1" stopColor="#ebecea" />
        </linearGradient>
        <radialGradient id={id('sun')} cx="1250" cy="300" r="380" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fbf3e2" stopOpacity="0.95" />
          <stop offset="0.12" stopColor="#f6ead4" stopOpacity="0.6" />
          <stop offset="1" stopColor="#f6ead4" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id('mist')} x1="0" y1="420" x2="0" y2="640" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#eceeee" stopOpacity="0" />
          <stop offset="1" stopColor="#eceeee" stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id={id('snow')} x1="0" y1="590" x2="0" y2="1000" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#f6f7f8" />
          <stop offset="1" stopColor="#e3e8ec" />
        </linearGradient>
        <linearGradient id={id('roof')} x1="0" y1="420" x2="0" y2="560" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#dfe5ea" />
        </linearGradient>
        <linearGradient id={id('glass')} x1="0" y1="520" x2="0" y2="712" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#c0c9cf" />
          <stop offset="1" stopColor="#5d6a73" />
        </linearGradient>
        <radialGradient id={id('fire')} cx="716" cy="684" r="80" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffcf86" stopOpacity="0.95" />
          <stop offset="1" stopColor="#ffcf86" stopOpacity="0" />
        </radialGradient>
        <clipPath id={id('gable')}>
          <path d="M600 712 V560 L760 430 L920 560 V712 Z" />
        </clipPath>
        <filter id={id('blur')} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5" /></filter>
      </defs>
      <rect width="1600" height="1000" fill={url('sky')} />
      <rect width="1600" height="700" fill={url('sun')} />
      <circle cx="1250" cy="300" r="26" fill="#fffaf0" opacity="0.85" />
      <path d={KV_RIDGE} fill="#a5aeb5" />
      {KV_FAR.map((t) => <path key={t.x} d={sprucePath(t.x, t.b, t.h, 4)} fill="#87929a" />)}
      <rect y="400" width="1600" height="240" fill={url('mist')} />
      <path d="M0 640 C300 600 600 590 900 600 C1200 610 1400 640 1600 662 L1600 1000 L0 1000 Z" fill={url('snow')} />
      <path d="M0 700 C260 676 520 690 760 712 M900 760 C1100 740 1300 760 1600 740 M0 820 C300 800 600 830 900 810" stroke="#dde3e8" strokeWidth="3" fill="none" />
      {KV_TREES.filter((t) => t.x < 800).map((t) => (
        <g key={t.x}>
          <path d={sprucePath(t.x, t.b, t.h)} fill="#2e3936" />
          <path d={spruceSnow(t.x, t.b, t.h)} stroke="#f7f9fa" strokeWidth="2.4" strokeLinecap="round" fill="none" />
        </g>
      ))}
      <path d="M600 712 L380 728 L470 746 L640 734 Z" fill="#cfd8df" opacity="0.8" />
      <path d="M920 712 L1134 690 L1130 548 L920 560 Z" fill="#1e1916" />
      <path d="M760 430 L966 418 L1146 546 L920 562 Z" fill={url('roof')} />
      <path d="M760 430 L966 418" stroke="#fff" strokeWidth="4" />
      <path d="M600 712 V560 L760 430 L920 560 V712 Z" fill="#2c2521" />
      <g clipPath={url('gable')}>
        {Array.from({ length: 40 }, (_, i) => <path key={i} d={`M${604 + i * 8} 420 V712`} stroke="#3a312b" strokeWidth="1.4" />)}
      </g>
      <path d="M660 712 V600 L760 518 L860 600 V712 Z" fill={url('glass')} />
      <path d="M660 712 V600 L760 518 L860 600 V712 Z" fill={url('fire')} />
      <path d="M676 712 L760 548" stroke="#fff" strokeWidth="18" opacity="0.12" />
      <path d="M727 712 V546 M793 712 V546 M660 640 H860" stroke="#171311" strokeWidth="4" />
      <path d="M660 712 V600 L760 518 L860 600 V712" stroke="#171311" strokeWidth="5" fill="none" />
      <path d="M584 568 L760 422 L936 568" stroke="#171311" strokeWidth="6" fill="none" />
      <path d="M582 562 L760 414 L938 562" stroke="#fbfcfd" strokeWidth="10" fill="none" strokeLinecap="round" />
      <rect x="1004" y="436" width="20" height="40" fill="#2a2422" />
      <rect x="1000" y="430" width="28" height="8" rx="3" fill="#fbfcfd" />
      <path d="M1014 424 C1002 392 1034 372 1018 336 C1006 306 1032 282 1022 250" stroke="#c4cbd0" strokeWidth="12" strokeLinecap="round" fill="none" opacity="0.4" filter={url('blur')} />
      <path d="M1176 684 V636 L1214 612 L1252 636 V684 Z" fill="#2a2320" />
      <path d="M1170 640 L1214 608 L1258 640" stroke="#fbfcfd" strokeWidth="8" fill="none" strokeLinecap="round" />
      <path d="M1186 684 V650 H1242 V684" fill="#4b3a2c" />
      {Array.from({ length: 6 }, (_, i) => <path key={i} d={`M1190 ${654 + i * 5} H1238`} stroke="#8a6a49" strokeWidth="2" />)}
      <path d="M540 728 C640 700 760 704 900 708 C1020 706 1100 696 1180 690 L1200 740 L520 760 Z" fill="#f8fafb" />
      <path d="M560 724 C660 704 780 708 900 710" stroke="#e0e6ea" strokeWidth="3" fill="none" />
      {KV_TREES.filter((t) => t.x >= 800).map((t) => (
        <g key={t.x}>
          <path d={sprucePath(t.x, t.b, t.h)} fill="#2a3431" />
          <path d={spruceSnow(t.x, t.b, t.h)} stroke="#f7f9fa" strokeWidth="2.4" strokeLinecap="round" fill="none" />
        </g>
      ))}
      <path d="M520 1000 C600 900 700 800 770 718 M552 1000 C626 900 718 802 784 718" stroke="#d2d9df" strokeWidth="3" fill="none" />
      <path d="M0 1000 L0 930 C200 900 420 920 600 940 C800 960 1100 930 1300 944 C1440 954 1540 940 1600 930 L1600 1000 Z" fill="#fbfcfc" />
    </svg>
  );
}

/* ══ 4 · Sjøbadet, Bergen — the sea bath on an overcast morning ═══════════ */

const SJ_STREAKS = (() => {
  const r = rng(41);
  return Array.from({ length: 40 }, () => ({ x: r1(r() * 1600 - 100), y: r1(540 + Math.pow(r(), 1.4) * 440), w: r1(60 + r() * 320) }));
})();
const SJ_PILES = Array.from({ length: 27 }, (_, i) => 6 + i * 52);

function Pier() {
  return (
    <g>
      {SJ_PILES.map((x) => <rect key={x} x={x} y="652" width="5" height="34" fill="#4a3f35" />)}
      <rect x="-20" y="632" width="1360" height="9" fill="#d6bd96" />
      <rect x="-20" y="641" width="1360" height="13" fill="#957552" />
      <path d="M1300 654 h18 v12 h12 v12 h12 v12" stroke="#957552" strokeWidth="5" fill="none" />
      <rect x="880" y="498" width="224" height="134" fill="#25211f" />
      <rect x="880" y="496" width="224" height="3" fill="#6e655d" />
      <rect x="900" y="548" width="184" height="15" fill="#e8b876" />
      {[946, 992, 1038].map((x) => <rect key={x} x={x} y="548" width="2" height="15" fill="#25211f" />)}
      <rect x="1066" y="466" width="6" height="32" fill="#2a2522" />
      {Array.from({ length: 22 }, (_, i) => <rect key={i} x={560 + i * 9.4} y="556" width="5" height="76" fill="#b8956a" />)}
      <rect x="556" y="552" width="212" height="4" fill="#8b6c4b" />
      <circle cx="790" cy="596" r="10" fill="none" stroke="#e9e3d8" strokeWidth="5" />
      <circle cx="790" cy="596" r="10" fill="none" stroke="#c8552a" strokeWidth="5" strokeDasharray="7.85 7.85" />
      <path d="M1200 632 V600 M1194 600 h12 M1200 600 V576 L1220 582 L1200 588" stroke="#3a322b" strokeWidth="2" fill="#c8552a" />
      <path d="M300 632 V420 M368 632 V420 M300 520 H368 M292 420 H392" stroke="#3a322b" strokeWidth="5" fill="none" />
      <rect x="290" y="414" width="104" height="7" fill="#c9ad86" />
      <path d="M334 632 V522 M346 632 V522" stroke="#3a322b" strokeWidth="2" />
      {Array.from({ length: 11 }, (_, i) => <path key={i} d={`M334 ${626 - i * 10} H346`} stroke="#3a322b" strokeWidth="2" />)}
      <path d="M388 420 L392 360 M300 420 V396 M392 396 H300" stroke="#3a322b" strokeWidth="2" fill="none" />
    </g>
  );
}

export function Sjobad({ align = 'xMidYMid' }: SceneProps) {
  const { id, url } = useUid('sj');
  return (
    <svg viewBox="0 0 1600 1000" preserveAspectRatio={`${align} slice`} aria-hidden="true">
      <defs>
        <linearGradient id={id('sky')} x1="0" y1="0" x2="0" y2="520" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#b6bfc2" />
          <stop offset="1" stopColor="#e3e2dc" />
        </linearGradient>
        <linearGradient id={id('sea')} x1="0" y1="520" x2="0" y2="1000" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#a3aaa8" />
          <stop offset="0.12" stopColor="#748080" />
          <stop offset="0.6" stopColor="#465454" />
          <stop offset="1" stopColor="#2c3838" />
        </linearGradient>
        <Soft id={id('cl')} d={12} />
      </defs>
      <rect width="1600" height="520" fill={url('sky')} />
      <g filter={url('cl')}>
        <ellipse cx="500" cy="200" rx="540" ry="40" fill="#fff" opacity="0.38" />
        <ellipse cx="1300" cy="300" rx="380" ry="26" fill="#fff" opacity="0.28" />
      </g>
      <path d="M0 520 C200 476 400 486 600 466 C800 446 1000 476 1200 456 C1400 436 1500 462 1600 470 L1600 520 Z" fill="#a2aaad" />
      <path d="M860 520 C1020 470 1180 420 1340 398 C1450 384 1540 392 1600 398 L1600 520 Z" fill="#848f95" />
      {Array.from({ length: 26 }, (_, i) => <rect key={i} x={1180 + (i * 53) % 400} y={448 + ((i * 37) % 60)} width="7" height="5" fill={['#efe9dc', '#d9c08a', '#c78467'][i % 3]} opacity="0.85" />)}
      <rect y="519" width="1600" height="481" fill={url('sea')} />
      {SJ_STREAKS.map((s) => <rect key={`${s.x}-${s.y}`} x={s.x} y={s.y} width={s.w} height="1.6" fill="#d5dbd9" opacity="0.28" />)}
      <g transform="matrix(1 0 0 -0.7 0 1101.2)" opacity="0.28">
        <Pier />
      </g>
      <Pier />
      <g fill="#2b2724">
        <circle cx="342" cy="388" r="4.6" />
        <path d="M336 414 L337 398 C337 395 339 394 342 394 C345 394 347 395 347 398 L348 414 Z" />
      </g>
      <circle cx="1190" cy="752" r="6" fill="#2b2724" />
      <ellipse cx="1190" cy="758" rx="22" ry="4" stroke="#c9d2d0" strokeWidth="1.6" fill="none" opacity="0.7" />
      <ellipse cx="1190" cy="760" rx="44" ry="7" stroke="#c9d2d0" strokeWidth="1.2" fill="none" opacity="0.4" />
      <g fill="#2b2724">
        <circle cx="470" cy="618" r="4" />
        <path d="M465 634 L466 623 C466 621 468 620 470 620 C472 620 474 621 474 623 L475 634 Z M466 640 L468 660 M473 640 L476 660" stroke="#2b2724" strokeWidth="2.4" />
        <circle cx="640" cy="614" r="4" />
        <path d="M635 632 L636 620 C636 618 638 617 640 617 C642 617 644 618 644 620 L645 632 Z" />
        <circle cx="1124" cy="610" r="4" />
        <path d="M1119 632 L1120 616 C1120 614 1122 613 1124 613 C1126 613 1128 614 1128 616 L1129 632 Z" />
      </g>
    </svg>
  );
}

/* ══ 5 · Tårnet, Oslo — thirteen storeys of timber, on site ═══════════════ */

const TA_LIT = (() => {
  const r = rng(23);
  const out: { c: number; f: number; k: 'lit' | 'blind' }[] = [];
  for (let f = 0; f < 9; f++) for (let c = 0; c < 7; c++) {
    const v = r();
    if (v < 0.2) out.push({ c, f, k: 'lit' });
    else if (v < 0.36) out.push({ c, f, k: 'blind' });
  }
  return out;
})();
const TA_X0 = 600;
const TA_BAY = 57;
const TA_FLOOR = 66;
const TA_BASE = 900;
const taY = (f: number) => TA_BASE - 96 - f * TA_FLOOR; // top of floor f (0 = first above ground)

export function Taarnet({ align = 'xMidYMid' }: SceneProps) {
  const { id, url } = useUid('ta');
  const topGlass = taY(8);
  return (
    <svg viewBox="0 0 1600 1000" preserveAspectRatio={`${align} slice`} aria-hidden="true">
      <defs>
        <linearGradient id={id('sky')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9fb1bd" />
          <stop offset="1" stopColor="#e2e5e2" />
        </linearGradient>
        <linearGradient id={id('glass')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#b9c7ce" />
          <stop offset="0.45" stopColor="#7f94a1" />
          <stop offset="0.6" stopColor="#a9bac3" />
          <stop offset="1" stopColor="#5f7380" />
        </linearGradient>
        <Soft id={id('cl')} d={14} />
      </defs>
      <rect width="1600" height="1000" fill={url('sky')} />
      <g filter={url('cl')}>
        <ellipse cx="300" cy="180" rx="340" ry="46" fill="#fff" opacity="0.42" />
        <ellipse cx="1260" cy="270" rx="400" ry="40" fill="#fff" opacity="0.36" />
        <ellipse cx="700" cy="60" rx="300" ry="24" fill="#fff" opacity="0.3" />
      </g>
      <rect x="80" y="560" width="460" height="340" fill="#cdbfa8" />
      {Array.from({ length: 5 }, (_, r) => Array.from({ length: 8 }, (_, c) => <rect key={`${r}-${c}`} x={104 + c * 54} y={590 + r * 60} width="26" height="36" fill="#5b5752" />))}
      <rect x="80" y="556" width="460" height="6" fill="#a99a84" />
      <rect x="-20" y="700" width="140" height="200" fill="#9b8c79" />
      <rect x="1060" y="620" width="460" height="280" fill="#bdb3a5" />
      {Array.from({ length: 4 }, (_, r) => Array.from({ length: 9 }, (_, c) => <rect key={`${r}-${c}`} x={1080 + c * 48} y={646 + r * 60} width="22" height="34" fill="#4e4c4a" />))}
      <rect x="1060" y="616" width="460" height="6" fill="#9b9183" />

      <rect x={TA_X0} y={topGlass} width={7 * TA_BAY} height={TA_BASE - topGlass} fill={url('glass')} />
      {TA_LIT.map((w) => (
        <rect key={`${w.c}-${w.f}`} x={TA_X0 + w.c * TA_BAY + 6} y={taY(w.f) + 14} width={TA_BAY - 12} height={w.k === 'lit' ? TA_FLOOR - 14 : 24} fill={w.k === 'lit' ? '#ecd3a4' : '#e6e2d9'} opacity={w.k === 'lit' ? 0.75 : 0.9} />
      ))}
      <rect x={TA_X0} y={TA_BASE - 96} width={7 * TA_BAY} height="96" fill="#d9c6a6" opacity="0.55" />
      {Array.from({ length: 10 }, (_, f) => <rect key={f} x={TA_X0 - 4} y={taY(f) - 2} width={7 * TA_BAY + 8} height="14" fill="#b98652" />)}
      {Array.from({ length: 8 }, (_, c) => <rect key={c} x={TA_X0 + c * TA_BAY - 6} y={taY(11)} width="12" height={TA_BASE - taY(11)} fill="#c69462" />)}
      {Array.from({ length: 8 }, (_, c) => <rect key={c} x={TA_X0 + c * TA_BAY + 3} y={taY(11)} width="3" height={TA_BASE - taY(11)} fill="#9c6c3f" />)}
      {[9, 10, 11].map((f) => <rect key={f} x={TA_X0 - 4} y={taY(f) - 2} width={7 * TA_BAY + 8} height="12" fill="#c69462" />)}
      <path d={`M${TA_X0 - 30} ${taY(11) - 10} H${TA_X0 + 7 * TA_BAY + 30} M${TA_X0 - 30} ${taY(11) - 10} V${taY(8)} M${TA_X0 + 7 * TA_BAY + 30} ${taY(11) - 10} V${taY(8)}`} stroke="#7b8085" strokeWidth="2" fill="none" />
      {Array.from({ length: 4 }, (_, i) => <path key={i} d={`M${TA_X0 - 30} ${taY(8) - i * 50} H${TA_X0 - 4} M${TA_X0 + 7 * TA_BAY + 4} ${taY(8) - i * 50} H${TA_X0 + 7 * TA_BAY + 30}`} stroke="#7b8085" strokeWidth="2" />)}
      <rect x={TA_X0 + 4 * TA_BAY} y={taY(11) - 10} width={3 * TA_BAY + 30} height={taY(8) - taY(11) + 10} fill="#e9ecec" opacity="0.5" />

      <g stroke="#d1932f" fill="none" strokeWidth="3">
        <path d="M1150 900 V96 M1172 900 V96" />
        <path d={'M1150 900 ' + Array.from({ length: 40 }, (_, i) => `L${i % 2 ? 1150 : 1172} ${900 - (i + 1) * 20}`).join(' ')} strokeWidth="1.6" />
        <path d="M660 96 H1500 M660 112 H1500 M660 96 L660 112" />
        <path d={'M660 112 ' + Array.from({ length: 42 }, (_, i) => `L${680 + i * 20} ${i % 2 ? 112 : 96}`).join(' ')} strokeWidth="1.6" />
        <path d="M1161 96 V40 M1161 40 L700 96 M1161 40 L1490 96" strokeWidth="2" />
      </g>
      <rect x="1360" y="112" width="110" height="40" fill="#5d5f61" />
      <rect x="1134" y="112" width="54" height="34" fill="#d1932f" />
      <rect x="1140" y="118" width="22" height="16" fill="#cfdbe0" />
      <path d="M836 112 V244" stroke="#3d3f41" strokeWidth="1.6" />
      <path d="M826 244 h20 v6 h-20 z" fill="#3d3f41" />
      <path d="M836 250 L780 264 M836 250 L892 264" stroke="#3d3f41" strokeWidth="1.2" />
      <rect x="760" y="264" width="152" height="10" fill="#c69462" />

      <rect y="900" width="1600" height="100" fill="#b5afa4" />
      <rect y="900" width="1600" height="4" fill="#8f897f" />
      {[[470, 836, 54], [560, 852, 44], [1040, 846, 50], [1110, 860, 40]].map(([x, y, r]) => (
        <g key={x}>
          <path d={`M${x} ${y} V900`} stroke="#4c4438" strokeWidth="5" />
          <circle cx={x} cy={y - r * 0.5} r={r} fill="#6c7a5a" />
          <circle cx={x - r * 0.3} cy={y - r * 0.7} r={r * 0.6} fill="#7d8b69" />
        </g>
      ))}
      {[[660, 1], [700, 0.92], [868, 1], [930, 0.8], [1250, 1]].map(([x, s]) => (
        <g key={x} transform={`translate(${x} 900) scale(${s})`} fill="#2b2724">
          <circle cx="0" cy="-24" r="4.4" />
          <path d="M-5 0 L-5.5 -15 L-6.6 -15 L-6.6 -17 C-6.6 -19 -5 -20 0 -20 C5 -20 6.6 -19 6.6 -17 L6.6 -15 L5.5 -15 L5 0 Z" />
        </g>
      ))}
    </svg>
  );
}

/* ══ White card models — an isometric generator ══════════════════════════ */

type P3 = [number, number, number];
type Face = { p: P3[]; n: P3; tone: 'card' | 'board' | 'void' | 'glass' | 'water'; d: number };
type Obj = { faces: Face[]; key: number; shadow?: { x0: number; y0: number; w: number; d: number; h: number }; tree?: { x: number; y: number; z: number; r: number } };

const C30 = Math.cos(Math.PI / 6);
const LIGHT: P3 = (() => { const v: P3 = [-0.62, 0.48, 1]; const m = Math.hypot(...v); return [v[0] / m, v[1] / m, v[2] / m]; })();
const norm = (v: P3): P3 => { const m = Math.hypot(...v); return [v[0] / m, v[1] / m, v[2] / m]; };
const face = (p: P3[], n: P3, tone: Face['tone'] = 'card'): Face => ({ p, n: norm(n), tone, d: p.reduce((s, q) => s + q[0] + q[1] + q[2], 0) / p.length });

function boxF(x0: number, y0: number, z0: number, w: number, d: number, h: number, tone: Face['tone'] = 'card'): Face[] {
  const x1 = x0 + w, y1 = y0 + d, z1 = z0 + h;
  return [
    face([[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]], [1, 0, 0], tone),
    face([[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], [0, 1, 0], tone),
    face([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], [0, 0, 1], tone),
  ];
}

function gableF(x0: number, y0: number, w: number, d: number, h: number, r: number, axis: 'x' | 'y', opts: { glassEnd?: boolean } = {}): Face[] {
  const x1 = x0 + w, y1 = y0 + d;
  const out: Face[] = [];
  if (axis === 'x') {
    const ym = y0 + d / 2;
    out.push(face([[x0, y1, 0], [x1, y1, 0], [x1, y1, h], [x0, y1, h]], [0, 1, 0]));
    out.push(face([[x1, y0, 0], [x1, y1, 0], [x1, y1, h], [x1, ym, h + r], [x1, y0, h]], [1, 0, 0]));
    if (opts.glassEnd) out.push(face([[x1, y0 + d * 0.16, 0], [x1, y1 - d * 0.16, 0], [x1, y1 - d * 0.16, h], [x1, ym, h + r * 0.7], [x1, y0 + d * 0.16, h]], [1, 0, 0], 'glass'));
    else for (let i = 0; i < Math.floor(w / 1.6); i++) out.push(face([[x0 + 0.6 + i * 1.6, y1, h * 0.3], [x0 + 1.4 + i * 1.6, y1, h * 0.3], [x0 + 1.4 + i * 1.6, y1, h * 0.75], [x0 + 0.6 + i * 1.6, y1, h * 0.75]], [0, 1, 0], 'void'));
    out.push(face([[x0, y0, h], [x1, y0, h], [x1, ym, h + r], [x0, ym, h + r]], [0, -r, d / 2]));
    out.push(face([[x0, ym, h + r], [x1, ym, h + r], [x1, y1, h], [x0, y1, h]], [0, r, d / 2]));
  } else {
    const xm = x0 + w / 2;
    out.push(face([[x1, y0, 0], [x1, y1, 0], [x1, y1, h], [x1, y0, h]], [1, 0, 0]));
    out.push(face([[x0, y1, 0], [x1, y1, 0], [x1, y1, h], [xm, y1, h + r], [x0, y1, h]], [0, 1, 0]));
    for (let i = 0; i < Math.floor(d / 1.6); i++) out.push(face([[x1, y0 + 0.6 + i * 1.6, h * 0.3], [x1, y0 + 1.4 + i * 1.6, h * 0.3], [x1, y0 + 1.4 + i * 1.6, h * 0.75], [x1, y0 + 0.6 + i * 1.6, h * 0.75]], [1, 0, 0], 'void'));
    out.push(face([[x0, y0, h], [xm, y0, h + r], [xm, y1, h + r], [x0, y1, h]], [-r, 0, w / 2]));
    out.push(face([[xm, y0, h + r], [x1, y0, h], [x1, y1, h], [xm, y1, h + r]], [r, 0, w / 2]));
  }
  return out.filter((f) => f.n[0] + f.n[1] + f.n[2] > 0.0001);
}

const TONES: Record<Face['tone'], [number, number, number]> = {
  card: [251, 249, 244],
  board: [236, 232, 223],
  void: [120, 116, 110],
  glass: [150, 160, 162],
  water: [166, 178, 180],
};

function shadeOf(f: Face) {
  const k = Math.max(0, f.n[0] * LIGHT[0] + f.n[1] * LIGHT[1] + f.n[2] * LIGHT[2]);
  const s = 0.72 + 0.28 * k;
  const [r, g, b] = TONES[f.tone];
  return `rgb(${Math.round(r * s)},${Math.round(g * s)},${Math.round(b * s)})`;
}

function hull(pts: [number, number][]) {
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: number[], a: number[], b: number[]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: [number, number][] = [];
  for (const q of p) { while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop(); lower.push(q); }
  const upper: [number, number][] = [];
  for (const q of p.slice().reverse()) { while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop(); upper.push(q); }
  return lower.slice(0, -1).concat(upper.slice(0, -1));
}

type Model = { vb: string; board: { d: string; fill: string }[]; faces: { d: string; fill: string }[]; shadows: string[]; trees: { cx: number; cy: number; r: number; tx: number; ty: number; sh: string }[] };

function buildModel(objs: Obj[], board: Face[], aspect = 1.6, pad = 0.16): Model {
  const S = 20;
  const pr = ([x, y, z]: P3): [number, number] => [(x - y) * C30 * S, ((x + y) * 0.5 - z) * S];
  const path = (pts: P3[]) => 'M' + pts.map((q) => pr(q).map(r1).join(' ')).join(' L') + ' Z';
  const all: [number, number][] = [];
  board.forEach((f) => f.p.forEach((q) => all.push(pr(q))));
  objs.forEach((o) => o.faces.forEach((f) => f.p.forEach((q) => all.push(pr(q)))));
  const xs = all.map((q) => q[0]);
  const ys = all.map((q) => q[1]);
  const maxX = Math.max(...xs), maxY = Math.max(...ys);
  let minX = Math.min(...xs), minY = Math.min(...ys);
  let w = maxX - minX, h = maxY - minY;
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
  w *= 1 + pad * 2; h *= 1 + pad * 2;
  if (w / h > aspect) h = w / aspect; else w = h * aspect;
  minX = cx - w / 2; minY = cy - h / 2;
  const off = (z: number): [number, number] => [-(LIGHT[0] / LIGHT[2]) * z, -(LIGHT[1] / LIGHT[2]) * z];
  const shadows = objs.filter((o) => o.shadow).map((o) => {
    const s = o.shadow!;
    const [ox, oy] = off(s.h);
    const foot: [number, number][] = [[s.x0, s.y0], [s.x0 + s.w, s.y0], [s.x0 + s.w, s.y0 + s.d], [s.x0, s.y0 + s.d]];
    const pts = hull([...foot, ...foot.map(([a, b]) => [a + ox, b + oy] as [number, number])]);
    return path(pts.map(([a, b]) => [a, b, 0] as P3));
  });
  const sorted = objs.slice().sort((a, b) => a.key - b.key);
  const faces: { d: string; fill: string }[] = [];
  const trees: Model['trees'] = [];
  const boardOut = board.slice().sort((a, b) => a.d - b.d).map((f) => ({ d: path(f.p), fill: shadeOf(f) }));
  for (const o of sorted) {
    if (o.tree) {
      const t = o.tree;
      const [px, py] = pr([t.x, t.y, t.z]);
      const [bx, by] = pr([t.x, t.y, 0]);
      const [ox, oy] = off(t.z);
      trees.push({ cx: r1(px), cy: r1(py), r: r1(t.r * S * 1.15), tx: r1(bx), ty: r1(by), sh: path([[t.x + ox - t.r, t.y + oy - t.r, 0], [t.x + ox + t.r, t.y + oy - t.r, 0], [t.x + ox + t.r, t.y + oy + t.r, 0], [t.x + ox - t.r, t.y + oy + t.r, 0]]) });
      faces.push({ d: `T${trees.length - 1}`, fill: '' });
      continue;
    }
    o.faces.slice().sort((a, b) => a.d - b.d).forEach((f) => faces.push({ d: path(f.p), fill: shadeOf(f) }));
  }
  return { vb: `${r1(minX)} ${r1(minY)} ${r1(w)} ${r1(h)}`, board: boardOut, faces, shadows, trees };
}

function ModelSvg({ m, align = 'xMidYMid' }: { m: Model; align?: string }) {
  const { id, url } = useUid('md');
  const [vx, vy, vw, vh] = m.vb.split(' ').map(Number);
  return (
    <svg viewBox={m.vb} preserveAspectRatio={`${align} meet`} aria-hidden="true">
      <defs>
        <linearGradient id={id('bg')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d9d5ce" />
          <stop offset="1" stopColor="#b9b3a9" />
        </linearGradient>
        <radialGradient id={id('hi')} cx={vx + vw * 0.42} cy={vy + vh * 0.28} r={vw * 0.75} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#f3f0ea" stopOpacity="0.8" />
          <stop offset="1" stopColor="#f3f0ea" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id('tree')} cx="0.35" cy="0.3" r="0.75">
          <stop offset="0" stopColor="#fbfaf7" />
          <stop offset="0.6" stopColor="#dedad2" />
          <stop offset="1" stopColor="#b8b3aa" />
        </radialGradient>
        <filter id={id('soft')} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="7" /></filter>
        <filter id={id('drop')} x="-20%" y="-20%" width="140%" height="160%"><feGaussianBlur stdDeviation="22" /></filter>
      </defs>
      <rect x={vx - vw} y={vy - vh} width={vw * 3} height={vh * 3} fill={url('bg')} />
      <rect x={vx - vw} y={vy - vh} width={vw * 3} height={vh * 3} fill={url('hi')} />
      <ellipse cx={vx + vw * 0.52} cy={vy + vh * 0.72} rx={vw * 0.4} ry={vh * 0.16} fill="#5b554c" opacity="0.32" filter={url('drop')} />
      {m.board.map((f, i) => <path key={`b${i}`} d={f.d} fill={f.fill} stroke="rgba(0,0,0,0.05)" strokeWidth="0.8" strokeLinejoin="round" />)}
      <g filter={url('soft')} opacity="0.34" fill="#6b655c">
        {m.shadows.map((d, i) => <path key={i} d={d} />)}
        {m.trees.map((t, i) => <path key={`t${i}`} d={t.sh} />)}
      </g>
      {m.faces.map((f, i) => {
        if (f.d.startsWith('T')) {
          const t = m.trees[Number(f.d.slice(1))];
          return (
            <g key={i}>
              <path d={`M${t.tx} ${t.ty} L${t.cx} ${t.cy}`} stroke="#9a948a" strokeWidth="2" />
              <circle cx={t.cx} cy={t.cy} r={t.r} fill={url('tree')} />
            </g>
          );
        }
        return <path key={i} d={f.d} fill={f.fill} stroke="rgba(0,0,0,0.06)" strokeWidth="0.8" strokeLinejoin="round" />;
      })}
    </svg>
  );
}

function plinth(x0: number, y0: number, w: number, d: number): Face[] {
  return boxF(x0, y0, -1.1, w, d, 1.1, 'board');
}

/* Skogly School: twelve classrooms around one covered yard. */
const SKOGLY = (() => {
  const objs: Obj[] = [];
  const room = (x: number, y: number, axis: 'x' | 'y') => {
    const w = axis === 'x' ? 4.6 : 4.2;
    const d = axis === 'x' ? 4.2 : 4.6;
    objs.push({ faces: gableF(x, y, w, d, 2.5, 1.5, axis), key: x + w / 2 + y + d / 2, shadow: { x0: x, y0: y, w, d, h: 3.4 } });
  };
  [10, 15.6, 21.2, 26.8].forEach((x) => room(x, 2.4, 'y'));
  [10, 15.6, 21.2, 26.8].forEach((x) => room(x, 25.6, 'y'));
  [10.6, 16.2].forEach((y) => room(3.4, y, 'x'));
  [10.6, 16.2].forEach((y) => room(33.4, y, 'x'));
  const canopy: Face[] = [
    ...boxF(10, 8.6, 3.1, 21, 2.6, 0.28),
    ...boxF(10, 20.2, 3.1, 21, 2.6, 0.28),
    ...boxF(10, 11.2, 3.1, 6.6, 9, 0.28),
    ...boxF(24.4, 11.2, 3.1, 6.6, 9, 0.28),
  ];
  objs.push({ faces: canopy, key: 20.5 + 16.5, shadow: { x0: 10, y0: 8.6, w: 21, d: 14.2, h: 1.2 } });
  [[13, 8.8], [28, 8.8], [13, 22.6], [28, 22.6]].forEach(([x, y]) => objs.push({ faces: boxF(x, y, 0, 0.3, 0.3, 3.1), key: x + y + 0.2 }));
  objs.push({ faces: [], key: 20.5 + 15.7 + 0.5, tree: { x: 20.5, y: 15.7, z: 3.6, r: 1.6 } });
  [[2, 4], [1.5, 26], [6, 31], [39, 6], [41, 28], [37, 33], [24, 34], [8, 1], [33, 0.6]].forEach(([x, y], i) => objs.push({ faces: [], key: x + y + 0.5, tree: { x, y, z: 1.6 + (i % 3) * 0.4, r: 1 + (i % 2) * 0.3 } }));
  const board = plinth(-2, -2, 46, 38.6);
  return buildModel(objs, board, 1.3, 0.06);
})();

/* Bryggen Library: the warehouse, its neighbours on the wharf, and the harbour. */
const BRY_MODEL = (() => {
  const objs: Obj[] = [];
  const rows: [number, number, number, number][] = [[0, 5.2, 4.4, 2.4], [5.2, 4.6, 3.8, 2.4], [9.8, 8.8, 5.2, 4.4], [18.6, 5, 4.2, 2.6], [23.6, 4.4, 3.6, 2.2]];
  rows.forEach(([y, d, h, r], i) => {
    const lib = i === 2;
    const len = lib ? 24 : 18 + (i % 2) * 3;
    const x0 = 24 - len;
    objs.push({ faces: gableF(x0, y, len, d - 0.25, h, r, 'x', { glassEnd: lib }), key: x0 + len / 2 + y + d / 2, shadow: { x0, y0: y, w: len, d, h: h + r * 0.6 } });
  });
  [[2, 31], [7, 32], [13, 31.5]].forEach(([x, y]) => objs.push({ faces: [], key: x + y, tree: { x, y, z: 1.8, r: 1.1 } }));
  const board = [...boxF(-6, -2, -1.1, 30, 34, 1.1, 'board'), ...boxF(24, -2, -1.5, 12, 34, 0.9, 'water')];
  return buildModel(objs, board, 1.3, 0.06);
})();

export function SkoglyModel({ align }: SceneProps) { return <ModelSvg m={SKOGLY} align={align} />; }
export function BryggenModel({ align }: SceneProps) { return <ModelSvg m={BRY_MODEL} align={align} />; }
