/* Linework's drawings as path data. Everything here is plain line art: the
   hero poster of the Graslei in Ghent is generated house by house, the five
   client pieces are drawn by hand. Kept apart from the page so the page reads
   as a page. */

const r1 = (n: number) => Math.round(n * 10) / 10;
const circle = (cx: number, cy: number, r: number) =>
  `M${r1(cx + r)} ${r1(cy)} A${r} ${r} 0 1 0 ${r1(cx - r)} ${r1(cy)} A${r} ${r} 0 1 0 ${r1(cx + r)} ${r1(cy)}`;

/* ── Hero poster: Graslei at dusk ─────────────────────────────────────────
   1200 × 380. The quay is y = 290. Houses carry a paper fill so the three
   towers behind them disappear behind the roofs, the way they do from the
   Grasbrug. Order matters: the towers draw first, then the street, then the
   water. */

const QUAY = 290;
type Gable = 'step' | 'point' | 'bell' | 'cornice';
type House = { w: number; h: number; g: Gable; n?: number };

const HOUSES: House[] = [
  { w: 92, h: 122, g: 'step', n: 4 },
  { w: 70, h: 150, g: 'point' },
  { w: 122, h: 112, g: 'step', n: 5 },
  { w: 64, h: 168, g: 'step', n: 3 },
  { w: 104, h: 142, g: 'cornice' },
  { w: 78, h: 128, g: 'point' },
  { w: 136, h: 118, g: 'step', n: 5 },
  { w: 72, h: 158, g: 'step', n: 3 },
  { w: 96, h: 126, g: 'bell' },
  { w: 84, h: 146, g: 'point' },
  { w: 110, h: 116, g: 'step', n: 4 },
  { w: 70, h: 140, g: 'point' },
];

function gablePoints(x0: number, w: number, top: number, g: Gable, n = 4): string {
  const xc = x0 + w / 2;
  if (g === 'point') return `L${r1(xc)} ${r1(top - w * 0.56)} L${r1(x0 + w)} ${top}`;
  if (g === 'cornice') {
    // a flat cornice with a dormer in the middle
    const dw = w * 0.34;
    return `H${r1(x0 - 4)} V${top - 8} H${r1(xc - dw / 2)} V${top - 34} L${r1(xc)} ${top - 50} L${r1(xc + dw / 2)} ${top - 34} V${top - 8} H${r1(x0 + w + 4)} V${top} H${r1(x0 + w)}`;
  }
  if (g === 'bell') {
    const gh = w * 0.72;
    return `C${r1(x0)} ${r1(top - gh * 0.42)} ${r1(xc - w * 0.3)} ${r1(top - gh * 0.38)} ${r1(xc - w * 0.18)} ${r1(top - gh * 0.72)} L${r1(xc)} ${r1(top - gh)} L${r1(xc + w * 0.18)} ${r1(top - gh * 0.72)} C${r1(xc + w * 0.3)} ${r1(top - gh * 0.38)} ${r1(x0 + w)} ${r1(top - gh * 0.42)} ${r1(x0 + w)} ${top}`;
  }
  // stepped gable: build the left half, mirror it for the right
  const gh = w * 0.64;
  const sw = w / (2 * n + 1);
  const s = gh / n;
  const left: [number, number][] = [];
  for (let i = 1; i <= n; i++) {
    left.push([x0 + (i - 1) * sw, top - i * s]);
    left.push([x0 + i * sw, top - i * s]);
  }
  const right = left.slice().reverse().map(([x, y]) => [2 * xc - x, y] as [number, number]);
  return [...left, ...right, [x0 + w, top]].map(([x, y]) => `L${r1(x)} ${r1(y)}`).join(' ');
}

function houseParts(x0: number, hs: House) {
  const { w, h, g } = hs;
  const top = QUAY - h;
  const xc = x0 + w / 2;
  const shell = `M${r1(x0)} ${QUAY} V${top} ${gablePoints(x0, w, top, g, hs.n)} V${QUAY} Z`;

  // windows: tall mullioned openings on each upper floor
  const cols = w < 80 ? 2 : w < 112 ? 3 : 4;
  const ground = 46;
  const floors = Math.max(1, Math.floor((h - ground - 8) / 34));
  const ww = Math.min(14, (w / cols) * 0.42);
  const wh = 21;
  let win = '';
  for (let f = 0; f < floors; f++) {
    const y = QUAY - ground - 10 - (f + 1) * 34 + (34 - wh) / 2 + 4;
    for (let c = 0; c < cols; c++) {
      const cx = x0 + (w / cols) * (c + 0.5);
      const x = cx - ww / 2;
      win += `M${r1(x)} ${r1(y + wh)} V${r1(y)} H${r1(x + ww)} V${r1(y + wh)} Z M${r1(cx)} ${r1(y)} V${r1(y + wh)} `;
    }
  }
  // string course above the ground floor, and a gable window
  let detail = `M${r1(x0)} ${QUAY - ground} H${r1(x0 + w)} `;
  if (g === 'step' || g === 'bell') detail += circle(xc, top - w * (g === 'bell' ? 0.3 : 0.24), Math.min(7, w * 0.07)) + ' ';
  if (g === 'point') detail += `M${r1(xc - 5)} ${top - 4} V${r1(top - 18)} A5 5 0 0 1 ${r1(xc + 5)} ${r1(top - 18)} V${top - 4} Z `;

  // ground floor: an arched door and one shop window, or two arches
  const dw = Math.min(22, w * 0.26);
  const dx = x0 + w * (w > 96 ? 0.22 : 0.3) - dw / 2;
  let ground$ = `M${r1(dx)} ${QUAY} V${QUAY - 26} A${r1(dw / 2)} ${r1(dw / 2)} 0 0 1 ${r1(dx + dw)} ${QUAY - 26} V${QUAY} `;
  const sx = x0 + w * (w > 96 ? 0.5 : 0.56);
  const sw = x0 + w - 8 - sx;
  if (sw > 16) ground$ += `M${r1(sx)} ${QUAY - 8} V${QUAY - 34} H${r1(sx + sw)} V${QUAY - 8} Z`;
  return { shell, win: win.trim(), detail: (detail + ground$).trim() };
}

function graslei() {
  let x = 52;
  const houses = HOUSES.map((hs) => {
    const parts = houseParts(x, hs);
    x += hs.w;
    return parts;
  });

  const towers = [
    // Sint-Niklaaskerk: a broad crossing tower with corner turrets
    'M268 290 V112 M332 290 V112 M262 112 H338',
    'M262 112 V74 L270 54 L278 74 V112 M322 112 V74 L330 54 L338 74 V112 M282 112 L300 34 L318 112',
    'M286 176 V142 A6 6 0 0 1 298 142 V176 M302 176 V142 A6 6 0 0 1 314 142 V176',
    // the Belfry: tall shaft, gallery, spire, the dragon on top
    'M618 290 V126 M662 290 V126 M610 126 H670',
    'M610 126 V100 L616 86 L622 100 V126 M658 126 V100 L664 86 L670 100 V126 M628 126 V82 M652 126 V82 M624 82 H656',
    'M626 82 L640 26 L654 82 M640 26 V10 M632 14 Q640 6 648 14',
    'M632 206 V158 A8 8 0 0 1 648 158 V206 M634 120 V100 A6 6 0 0 1 646 100 V120',
    // Sint-Baafskathedraal: the square tower with pinnacles
    'M922 290 V72 M998 290 V72 M936 290 V72 M984 290 V72 M916 72 H1004',
    'M916 72 V44 L923 24 L930 44 V72 M990 72 V44 L997 24 L1004 44 V72 M948 72 V56 L953 44 L958 56 V72 M962 72 V56 L967 44 L972 56 V72',
    'M946 170 V108 A14 14 0 0 1 974 108 V170 M960 170 V94',
  ];

  const water = [
    'M24 290 H1176',
    'M24 300 H1176',
    // reflections of the facades, broken by the current
    ...HOUSES.map((hs, i) => {
      let x0 = 52;
      for (let k = 0; k < i; k++) x0 += HOUSES[k].w;
      const c = x0 + hs.w / 2;
      return `M${r1(c - hs.w * 0.32)} ${314 + (i % 3) * 3} H${r1(c + hs.w * 0.12)} M${r1(c - hs.w * 0.14)} ${330 + (i % 2) * 4} H${r1(c + hs.w * 0.26)} M${r1(c - hs.w * 0.06)} ${348 + (i % 3) * 2} H${r1(c + hs.w * 0.08)}`;
    }),
  ];

  const boat = [
    'M708 326 H866 L852 344 H722 Z',
    'M734 326 V308 H842 V326 M752 308 V326 M772 308 V326 M792 308 V326 M812 308 V326',
  ];

  const sky = [
    'M1112 44 A20 20 0 1 0 1132 76 A15 15 0 1 1 1112 44 Z',
    'M440 66 Q448 58 456 66 Q464 58 472 66 M488 48 Q494 42 500 48 Q506 42 512 48 M770 70 Q777 63 784 70 Q791 63 798 70',
  ];

  return { towers, houses, water, boat, sky };
}

export const POSTER = graslei();

/* ── Orchard & Vine: the cellar door, for a wine label (200 × 224) ─────── */
const vouss = Array.from({ length: 8 }, (_, i) => {
  const a = ((i + 1) * Math.PI) / 9;
  const c = Math.cos(a), s = Math.sin(a);
  return `M${r1(100 + 44 * c)} ${r1(108 - 44 * s)} L${r1(100 + 60 * c)} ${r1(108 - 60 * s)}`;
}).join(' ');
/* a leaf from its stem (x, y) to its tip, bulging either side of the rib */
const leaf = (x: number, y: number, dx: number, dy: number) => {
  const mx = x + dx / 2, my = y + dy / 2, px = -dy * 0.42, py = dx * 0.42;
  return `M${x} ${y} Q${r1(mx + px)} ${r1(my + py)} ${x + dx} ${y + dy} Q${r1(mx - px)} ${r1(my - py)} ${x} ${y} L${r1(mx + dx * 0.2)} ${r1(my + dy * 0.2)}`;
};

export const CELLAR = [
  'M26 208 H174', 'M36 216 H164',
  'M40 208 V108 A60 60 0 0 1 160 108 V208',
  'M56 208 V108 A44 44 0 0 1 144 108 V208',
  vouss,
  'M78 70 V208 M100 64 V208 M122 70 V208',
  'M58 130 H90 M58 182 H90 M110 130 H142 M110 182 H142',
  `${circle(92, 156, 4.5)} ${circle(108, 156, 4.5)}`,
  'M30 208 C22 182 34 164 28 140 C22 116 30 90 46 72 C62 54 86 42 110 40 C130 38 148 44 162 56',
  `${leaf(27, 176, -14, -6)} ${leaf(29, 132, -15, -4)} ${leaf(40, 84, -12, -10)} ${leaf(76, 48, -6, -14)} ${leaf(120, 40, 6, -14)}`,
  'M156 52 V64',
  `${circle(148, 70, 5)} ${circle(158, 70, 5)} ${circle(168, 70, 5)} ${circle(153, 79, 5)} ${circle(163, 79, 5)} ${circle(158, 88, 5)}`,
  'M162 56 C168 50 176 54 172 60 C169 64 164 61 166 58',
];

/* ── Northbeam: the mark, with its construction (160 × 160) ───────────── */
export const NORTHBEAM = {
  guides: [
    'M10 6 H150 V150 H10 Z',
    'M80 0 V156 M4 124 H156',
    circle(80, 86.5, 62.5),
    circle(80, 93.1, 30.9),
  ],
  mark: ['M30 124 L80 24 L130 124', 'M55 124 H105'],
};

/* ── Kiln & Co: clay to counter, as a process diagram (640 × 172) ─────── */
export const KILN = [
  // wedge
  'M50 136 C44 114 56 92 80 90 C104 88 116 112 110 136 Z',
  'M64 116 C72 111 80 111 88 116 M70 126 C76 123 84 123 90 126',
  'M42 70 H118 M38 64 V76 M122 64 V76',
  'M128 116 H168 M160 110 L168 116 L160 122',
  // throw
  'M190 122 A50 11 0 1 0 290 122 A50 11 0 1 0 190 122',
  'M226 133 V146 H254 V133',
  'M216 118 C210 98 220 84 228 78 V70 H252 V78 C260 84 270 98 264 118',
  'M224 70 H256',
  'M178 102 C170 110 170 124 178 132 M302 102 C310 110 310 124 302 132',
  'M314 116 H342 M334 110 L342 116 L334 122',
  // fire
  'M356 146 V96 A44 44 0 0 1 444 96 V146 Z',
  'M380 146 V112 A20 20 0 0 1 420 112 V146',
  'M392 144 C386 134 394 126 394 118 C400 126 404 134 398 144 M406 144 C402 136 408 130 408 124 C412 130 416 136 410 144',
  'M356 120 H380 M420 120 H444 M356 132 H380 M420 132 H444',
  'M424 59 V40 H438 V74',
  'M431 34 C425 28 437 24 431 18 C425 12 437 8 431 2',
  'M456 116 H514 M506 110 L514 116 L506 122',
  // glaze
  'M542 146 C524 126 526 102 546 90 C540 82 540 72 546 64 H574 C580 72 580 82 574 90 C594 102 596 126 578 146 Z',
  'M544 64 H576',
  'M532 110 C546 118 556 106 568 114 C576 120 584 112 590 114',
  'M542 115 V126 M556 111 V128 M570 117 V125',
  // the timeline underneath
  'M20 162 H620',
  'M80 156 V168 M240 156 V168 M400 156 V168 M560 156 V168',
];

/* ── Tidewater: a headland, for a website hero (600 × 340) ─────────────── */
const wave = (y: number, amp: number, len: number, x0: number, x1: number) => {
  let d = `M${x0} ${y}`;
  for (let x = x0; x < x1; x += len) d += ` q${len / 4} ${-amp} ${len / 2} 0 q${len / 4} ${amp} ${len / 2} 0`;
  return d;
};
export const HEADLAND = [
  circle(150, 118, 34),
  'M0 236 C40 222 90 218 130 228 C150 232 170 230 190 236',
  'M0 236 H368',
  'M360 236 C380 222 396 206 420 196 C448 184 470 168 500 160 C530 152 560 150 600 148',
  'M420 196 L414 236 M446 186 L440 236 M472 170 L466 236 M436 204 L432 226 M458 182 L455 214',
  'M508 156 L512 92 H528 L532 156 M510 136 H530 M511 116 H529',
  'M505 92 H535 M513 92 V78 H527 V92 M509 78 L520 66 L531 78',
  'M536 82 L600 66 M536 86 L600 102',
  'M546 152 V138 L558 128 L570 138 V150',
  'M200 262 H316 L302 280 H216 Z',
  'M262 262 V126 M262 126 L278 131 L262 136',
  'M267 138 C286 174 298 214 302 256 H267 Z',
  'M257 144 C240 186 222 222 208 256 H257 Z',
  wave(298, 5, 60, 0, 600),
  wave(318, 4, 46, 30, 580),
  wave(338, 3, 36, 10, 600),
  'M330 82 Q338 74 346 82 Q354 74 362 82 M374 62 Q380 56 386 62 Q392 56 398 62',
  'M54 72 C54 60 72 56 80 66 C86 54 110 56 110 70 C122 70 124 84 112 86 H58 C46 84 46 72 54 72 Z',
  // the sun on the water, a yacht on the horizon, the wake, the grass on the cliff
  'M128 250 H172 M136 260 H164 M144 270 H156',
  'M322 233 L331 210 V233 Z M316 236 H342',
  'M318 278 C338 282 356 280 376 286 M312 287 C332 293 350 293 370 299',
  'M486 168 L482 194 M498 163 L495 186 M512 158 L510 172',
  'M560 150 L557 143 M566 149 L567 141 M572 148 L576 141 M586 148 L584 141 M592 148 L595 141',
];

/* ── Stride: an app icon (200 × 200) ───────────────────────────────────── */
export const STRIDE = [
  'M64 16 H136 C170 16 184 30 184 64 V136 C184 170 170 184 136 184 H64 C30 184 16 170 16 136 V64 C16 30 30 16 64 16 Z',
  'M50 146 C66 146 70 122 88 118 C110 112 100 86 120 78 C136 72 146 82 152 62',
  circle(50, 146, 8),
  'M152 62 V38 L172 45 L152 52',
];

/* ── Roughs: six pencil thumbnails for Orchard & Vine (100 × 100 each) ─── */
export const ROUGHS: { vb: string; d: string[]; pick?: boolean }[] = [
  { vb: '0 0 100 100', d: ['M44 10 H56 V30 C56 36 66 38 66 46 V88 H34 V46 C34 38 44 36 44 30 Z', 'M28 86 C38 70 58 72 60 54 C62 42 52 36 58 24', 'M40 70 Q30 64 34 56 Q42 60 40 70 M60 44 Q70 40 70 32 Q60 32 60 44'] },
  { vb: '0 0 100 100', d: [`${circle(38, 44, 8)} ${circle(54, 44, 8)} ${circle(70, 44, 8)} ${circle(46, 58, 8)} ${circle(62, 58, 8)} ${circle(54, 72, 8)}`, 'M54 36 V18', 'M54 22 Q70 8 84 20 Q70 32 54 22'] },
  { vb: '0 0 100 100', d: ['M36 12 H64 C67 34 62 48 50 50 C38 48 33 34 36 12 Z', 'M37 28 H63', 'M50 50 V82 M34 84 H66'] },
  { vb: '16 30 168 192', d: CELLAR, pick: true },
  { vb: '0 0 100 100', d: ['M28 20 Q50 12 72 20 Q82 50 72 80 Q50 88 28 80 Q18 50 28 20 Z', 'M23 36 Q50 44 77 36 M22 64 Q50 72 78 64', 'M50 48 H62 V56'] },
  { vb: '0 0 100 100', d: ['M18 78 V46 L50 20 L82 46 V78 Z', 'M44 78 V60 H56 V78', 'M26 54 H36 V64 H26 Z M64 54 H74 V64 H64 Z', 'M6 78 H94 M6 86 H94 M6 94 H94'] },
];
