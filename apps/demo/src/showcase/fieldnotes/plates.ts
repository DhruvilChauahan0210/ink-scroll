import { smooth, circle, type P } from '@/components/examples/ink/geo';

/*
 * Line drawings for Fieldnotes, as path data. Fixed numbers only, so the
 * server and the client render the same markup.
 *
 * Plates I and II are drawn on scroll by one initScrollDraw() call with
 * stagger 0.02, and stagger accumulates per path in document order — so each
 * plate keeps its path count low by drawing one frond's veins, or one wall's
 * stones, as a single multi-part path. Plate I is 18 paths, Plate II is 6.
 */

const f1 = (v: number) => (Math.abs(v) < 0.05 ? '0' : v.toFixed(1));
const seg = (a: P, b: P) => `M ${f1(a[0])} ${f1(a[1])} L ${f1(b[0])} ${f1(b[1])}`;

/** A deterministic pseudo-random sequence, so stones and grass match on server and client. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

type Bez = [P, P, P, P];
const bez = ([a, b, c, d]: Bez, t: number): P => {
  const u = 1 - t;
  return [
    u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0],
    u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1],
  ];
};
const tan = ([a, b, c, d]: Bez, t: number): P => {
  const u = 1 - t;
  const x = 3 * u * u * (b[0] - a[0]) + 6 * u * t * (c[0] - b[0]) + 3 * t * t * (d[0] - c[0]);
  const y = 3 * u * u * (b[1] - a[1]) + 6 * u * t * (c[1] - b[1]) + 3 * t * t * (d[1] - c[1]);
  const l = Math.hypot(x, y) || 1;
  return [x / l, y / l];
};

/**
 * One hart's-tongue frond: a stalk, then an undivided strap-shaped blade with
 * a heart-shaped (cordate) base, a wavy margin and an acuminate tip.
 */
function frond(spine: Bez, W: number, t0: number, phase: number) {
  const at = (t: number, off: number): P => {
    const p = bez(spine, t), d = tan(spine, t);
    return [p[0] - d[1] * off, p[1] + d[0] * off];
  };
  const width = (t: number) => {
    const u = Math.max(0, (t - t0) / (1 - t0));
    const body = 0.8 + 0.2 * Math.sin(Math.min(1, u / 0.35) * (Math.PI / 2));
    const taper = u > 0.7 ? Math.pow(Math.cos(((u - 0.7) / 0.3) * (Math.PI / 2)), 0.85) : 1;
    return W * body * taper;
  };
  const wave = (t: number, side: number) => 1 + 0.065 * Math.sin(t * 46 + phase + side * 1.3);
  const ts = Array.from({ length: 24 }, (_, i) => t0 + 0.015 + (i / 23) * (0.975 - t0 - 0.015));
  const left = ts.map((t) => at(t, width(t) * wave(t, 1)));
  const right = ts.map((t) => at(t, -width(t) * wave(t, -1))).reverse();
  const outline = smooth([
    at(t0, 0), at(t0 - 0.03, 0.4 * W), at(t0 - 0.004, 0.66 * W),
    ...left, at(0.995, 0),
    ...right, at(t0 - 0.004, -0.66 * W), at(t0 - 0.03, -0.4 * W), at(t0, 0),
  ]);
  const rib = smooth(Array.from({ length: 16 }, (_, i) => at((i / 15) * 0.975, 0)));
  return { at, width, outline, rib, t0 };
}

// ── Plate I: Asplenium scolopendrium on a lime-mortared wall ───────────────

const CROWN: P = [300, 404];
const FRONDS = [
  { a: -16, len: 300, W: 16, fertile: true },
  { a: 9, len: 290, W: 16 },
  { a: -42, len: 268, W: 15 },
  { a: 35, len: 262, W: 15, fertile: true },
  { a: -68, len: 222, W: 13 },
  { a: 62, len: 214, W: 13 },
];

export const PLATE_I = (() => {
  const fronds = FRONDS.map(({ a, len, W, fertile }, k) => {
    const r = (a * Math.PI) / 180, r0 = r * 0.6, r1 = r * 1.1;
    const droop = len * 0.5 * Math.pow(Math.abs(Math.sin(r)), 1.4);
    const B: P = [CROWN[0] + Math.sin(r) * 6, CROWN[1] - 2];
    const spine: Bez = [
      B,
      [B[0] + Math.sin(r0) * len * 0.36, B[1] - Math.cos(r0) * len * 0.36],
      [B[0] + Math.sin(r) * len * 0.8, B[1] - Math.cos(r) * len * 0.8 + droop * 0.25],
      [B[0] + Math.sin(r1) * len, B[1] - Math.cos(r1) * len + droop],
    ];
    const fr = frond(spine, W, 0.24, k * 1.7);
    const u = (t: number) => (t - fr.t0) / (1 - fr.t0);
    const veins: string[] = [];
    const sori: string[] = [];
    for (let t = fr.t0 + 0.04; t < 0.93; t += 0.026) {
      for (const s of [1, -1]) {
        if (fertile) {
          if (u(t) > 0.2 && u(t) < 0.84 && Math.round((t - fr.t0) / 0.026) % 2 === 0) {
            sori.push(seg(fr.at(t, s * fr.width(t) * 0.2), fr.at(t + 0.05, s * fr.width(t) * 0.74)));
          }
        } else {
          veins.push(seg(fr.at(t, s * 1.6), fr.at(t + 0.045, s * fr.width(t) * 0.84)));
        }
      }
    }
    return {
      outline: fr.outline,
      // the stalk and midrib, then the veins, as one thin path
      rib: [fr.rib, ...veins].join(' '),
      sori: sori.length ? sori.join(' ') : null,
    };
  });

  // A crozier: a young frond still rolled like the head of a violin,
  // rising in front of the others and curling over to the right.
  const stalk = smooth([[302, 403], [305, 384], [310, 362], [320, 342]]);
  const O: P = [340, 338];
  const spiral = (r0: number, from: number, to: number) => smooth(
    Array.from({ length: 30 }, (_, i) => {
      const ph = from + ((to - from) * i) / 29;
      const rr = r0 * Math.exp(-0.26 * (ph - Math.PI));
      return [O[0] + rr * Math.cos(ph), O[1] + rr * Math.sin(ph)] as P;
    }),
  );
  const crozier = [stalk, spiral(20, Math.PI, 3.5 * Math.PI), spiral(26, Math.PI + 0.2, 2.55 * Math.PI), 'M 306 380 l -5 -3 M 309 366 l 5 -4 M 313 354 l -5 -2'].join(' ');

  // The crown: old stalk bases and the brown scales, roots into the joint.
  const crown = [
    'M 284 407 C 289 398, 311 398, 316 407',
    'M 290 404 C 288 409, 283 413, 277 415', 'M 299 406 C 299 411, 297 415, 294 419',
    'M 308 405 C 310 410, 314 413, 320 414', 'M 288 401 l -4 -5 M 296 399 l -1 -6 M 305 399 l 2 -6 M 313 401 l 4 -5',
  ].join(' ');

  // The wall: two courses of rubble stone in lime mortar, under the crown,
  // with moss in the joints. Widths and heights vary like a real wall.
  const rnd = seeded(14);
  const stoneParts: string[] = [];
  const texture: string[] = [];
  const courses = [
    { y0: 411, y1: 449, xs: [118, 196, 236, 284, 316, 404, 446, 512] },
    { y0: 455, y1: 503, xs: [86, 170, 262, 300, 388, 470, 548] },
  ];
  courses.forEach(({ y0, y1, xs }, ci) => {
    for (let i = 0; i < xs.length - 1; i++) {
      const a = xs[i] + 3, b = xs[i + 1] - 3;
      if (ci === 0 && a < 300 && b > 300) continue; // the joint the fern roots into
      const h = (y1 - y0) * (0.78 + rnd() * 0.22);
      const top = y1 - h;
      stoneParts.push(stone(a, top, b, y1, rnd));
    }
  });
  // moss tufts along the top joint, thickest by the fern
  [[262, 410], [276, 409], [326, 409], [342, 410], [208, 410], [426, 410]].forEach(([x, y], i) => {
    const s1 = i < 4 ? 1 : 0.7;
    texture.push(`M ${x - 7 * s1} ${y} q ${3 * s1} ${-7 * s1} ${5 * s1} 0 q ${2 * s1} ${-9 * s1} ${5 * s1} 0 q ${2 * s1} ${-6 * s1} ${5 * s1} 0`);
  });

  return {
    crown,
    fronds,
    crozier,
    stones: stoneParts.join(' '),
    moss: texture.join(' '),
  };
})();

/** A rubble stone: an irregular rounded block, from eight jittered points. */
function stone(x0: number, y0: number, x1: number, y1: number, rnd: () => number): string {
  const j = (a: number) => (rnd() - 0.5) * a;
  const w = x1 - x0, h = y1 - y0;
  const pts: P[] = [
    [x0 + 5 + j(4), y0 + 3 + j(3)], [x0 + w * 0.5 + j(w * 0.3), y0 + j(4)], [x1 - 5 + j(4), y0 + 3 + j(3)],
    [x1 + j(4), y0 + h * 0.5 + j(6)],
    [x1 - 4 + j(4), y1 - 2 + j(3)], [x0 + w * 0.5 + j(w * 0.3), y1 + j(3)], [x0 + 4 + j(4), y1 - 2 + j(3)],
    [x0 + j(4), y0 + h * 0.5 + j(6)],
  ];
  return smooth([...pts, pts[0], pts[1]]).split(' C ').slice(0, 9).join(' C ');
}

// ── Plate II: the underside of a fertile frond, with a ×10 lens ─────────────

export const PLATE_II = (() => {
  const spine: Bez = [[34, 262], [170, 214], [330, 150], [470, 52]];
  const fr = frond(spine, 27, 0.1, 0.6);
  const sori: string[] = [];
  let pick: P = [0, 0];
  for (let t = 0.2; t < 0.86; t += 0.042) {
    for (const s of [1, -1]) {
      const a = fr.at(t, s * fr.width(t) * 0.16), b = fr.at(t + 0.05, s * fr.width(t) * 0.76);
      sori.push(seg(a, b));
    }
    if (t > 0.45 && t < 0.5) pick = fr.at(t + 0.025, fr.width(t) * 0.46);
  }
  const L: P = [478, 214], R = 66;
  const lens = `${circle(L[0], L[1], R)} ${circle(L[0], L[1], R + 6)}`;
  const dx = L[0] - pick[0], dy = L[1] - pick[1], dl = Math.hypot(dx, dy);
  const leader = `${seg(pick, [L[0] - (dx / dl) * (R + 6), L[1] - (dy / dl) * (R + 6)])} ${circle(pick[0], pick[1], 7)}`;

  // Inside the lens: two sori face to face, their flaps (indusia) parting,
  // and the stalked capsules (sporangia) crowded between them.
  const detail: string[] = [];
  const rot = (x: number, y: number): P => {
    const ang = -0.62;
    return [L[0] + x * Math.cos(ang) - y * Math.sin(ang), L[1] + x * Math.sin(ang) + y * Math.cos(ang)];
  };
  for (const off of [-15, 15]) {
    detail.push(smooth([rot(-50, off - 9), rot(-20, off - 11), rot(20, off - 11), rot(50, off - 9)]));
    detail.push(smooth([rot(-50, off + 9), rot(-20, off + 11), rot(20, off + 11), rot(50, off + 9)]));
  }
  detail.push(smooth([rot(-56, -2), rot(0, 0), rot(56, -2)]));
  const rnd = seeded(7);
  for (let x = -40; x <= 40; x += 10) {
    for (const off of [-15, 15]) {
      const [cx, cy] = rot(x + (rnd() - 0.5) * 3, off + (rnd() - 0.5) * 4);
      detail.push(circle(cx, cy, 3.4 + rnd() * 0.8));
    }
  }
  // One spore capsule at ×100: the body, the stalk, and the ring of
  // thickened cells (the annulus) that flings the spores when it dries.
  const C: P = [128, 104];
  const ell = (rx: number, ry: number, a0: number, a1: number, n: number) => Array.from({ length: n }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / (n - 1), tilt = -0.35;
    const x = Math.cos(a) * rx, y = Math.sin(a) * ry;
    return [C[0] + x * Math.cos(tilt) - y * Math.sin(tilt), C[1] + x * Math.sin(tilt) + y * Math.cos(tilt)] as P;
  });
  const body = ell(30, 23, 0, Math.PI * 2, 25);
  const ring = ell(36, 29, -Math.PI * 1.15, Math.PI * 0.3, 22);
  const ticks: string[] = [];
  ell(30, 23, -Math.PI * 1.15, Math.PI * 0.3, 14).forEach((a, i) => { const b = ring[Math.round((i * 21) / 13)]; ticks.push(seg(a, b)); });
  const capsule = [smooth(body), smooth(ring), ...ticks, smooth([[C[0] + 6, C[1] + 22], [C[0] + 10, C[1] + 44], [C[0] + 22, C[1] + 66]])].join(' ');

  return {
    outline: fr.outline,
    rib: fr.rib,
    sori: sori.join(' '),
    capsule,
    lens,
    leader,
    detail: detail.join(' '),
    lensAt: L,
  };
})();

// ── The walk map: the Ashcombe walls, 7.4 km (static) ────────────────────

export const WALK = (() => {
  const contours = [0, 1, 2, 3, 4, 5].map((i) => {
    const cx = 392 + i * 6, cy = 118 + i * 5, rx = 150 - i * 24, ry = 92 - i * 14;
    const pts: P[] = Array.from({ length: 14 }, (_, k) => {
      const a = (k / 14) * Math.PI * 2;
      const wob = 1 + 0.08 * Math.sin(a * 3 + i) + 0.05 * Math.cos(a * 5 - i * 2);
      return [cx + Math.cos(a) * rx * wob, cy + Math.sin(a) * ry * wob];
    });
    return `${smooth([...pts, pts[0], pts[1]]).split(' C ').slice(0, 15).join(' C ')}`;
  });
  const contoursW = [0, 1, 2].map((i) => {
    const cx = 70 - i * 4, cy = 300 + i * 4, rx = 120 - i * 30, ry = 70 - i * 18;
    const pts: P[] = Array.from({ length: 12 }, (_, k) => {
      const a = (k / 12) * Math.PI * 2;
      const wob = 1 + 0.07 * Math.sin(a * 2 + i * 1.4);
      return [cx + Math.cos(a) * rx * wob, cy + Math.sin(a) * ry * wob];
    });
    return smooth([...pts, pts[0], pts[1]]).split(' C ').slice(0, 13).join(' C ');
  });
  const stream = smooth([[150, -10], [168, 40], [158, 90], [182, 140], [214, 182], [236, 232], [262, 280], [300, 318], [352, 372]]);
  const lanes = [
    smooth([[-150, 214], [-60, 200], [20, 194], [80, 190], [150, 176], [214, 182], [290, 200], [380, 206], [530, 214], [670, 230]]),
    smooth([[214, 182], [226, 130], [250, 80], [262, -10]]),
    smooth([[530, 214], [560, 160], [600, 110], [620, 40], [640, -10]]),
  ];
  // field boundaries and two woods, for a map that reads like a walker's map
  const fields = [
    smooth([[-140, 120], [-60, 110], [30, 128], [120, 118]]), smooth([[-80, 20], [-70, 110]]), smooth([[30, 128], [24, 194]]),
    smooth([[470, 214], [474, 300], [520, 372]]), smooth([[560, 290], [660, 280]]), smooth([[-140, 300], [-40, 288]]),
  ];
  const woods: P[] = [];
  const wr = seeded(3);
  for (let i = 0; i < 26; i++) woods.push([560 + wr() * 90, 290 + wr() * 60]);
  for (let i = 0; i < 18; i++) woods.push([-130 + wr() * 80, 30 + wr() * 70]);
  const route: P[] = [[206, 196], [176, 150], [160, 96], [202, 62], [270, 52], [338, 70], [404, 108], [440, 170], [404, 236], [330, 262], [262, 280], [222, 236], [206, 196]];
  const stops: P[] = [[206, 196], [162, 104], [268, 52], [432, 152], [334, 262], [244, 262]];
  const village: [number, number, number, number][] = [
    [188, 200, 14, 10], [206, 206, 10, 12], [222, 196, 12, 9], [194, 216, 9, 9], [232, 212, 13, 10], [178, 184, 10, 8], [240, 190, 9, 11],
  ];
  return { contours: [...contours, ...contoursW], stream, lanes, fields, woods, route: smooth(route), stops, village };
})();

// ── Thumbnails for the related essays (static) ───────────────────────────

export const THUMBS = {
  lichen: (() => {
    const stoneD = 'M 92 172 V 58 C 92 26, 188 26, 188 58 V 172';
    const lr = seeded(21);
    const rosette = (cx: number, cy: number, r: number, lobes: number) => {
      const pts: P[] = Array.from({ length: lobes * 2 }, (_, i) => {
        const a = (i / (lobes * 2)) * Math.PI * 2;
        const rr = (i % 2 ? r * 0.84 : r) * (0.88 + lr() * 0.2);
        return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.9];
      });
      const inner: P[] = Array.from({ length: 9 }, (_, i) => {
        const a = (i / 9) * Math.PI * 2, rr = r * (0.42 + lr() * 0.12);
        return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.9];
      });
      const dots = Array.from({ length: 4 }, () => circle(cx + (lr() - 0.5) * r * 0.5, cy + (lr() - 0.5) * r * 0.45, 1.6)).join(' ');
      return `${smooth([...pts, pts[0], pts[1]])} ${smooth([...inner, inner[0], inner[1]])} ${dots}`;
    };
    return [stoneD, 'M 70 172 H 210', 'M 118 86 H 162 M 124 98 H 156', rosette(122, 128, 18, 14), rosette(160, 148, 11, 11), rosette(150, 62, 8, 9)];
  })(),
  swifts: (() => {
    // A swift from below: scythe wings swept back, a short forked tail.
    const swift = (x: number, y: number, s: number, a: number) => {
      const c = Math.cos(a), si = Math.sin(a);
      const T = (px: number, py: number): P => [x + (px * c - py * si) * s, y + (px * si + py * c) * s];
      const half: P[] = [[0, -9], [3, -7], [13, -6], [26, -2], [37, 7], [25, 2], [13, 1], [4, 3], [3, 9], [5, 15], [1, 11], [0, 10]];
      const pts = [...half, ...half.slice(0, -1).reverse().map(([px, py]) => [-px, py] as P)].map(([px, py]) => T(px, py));
      return smooth(pts);
    };
    return ['M 20 162 L 70 130 L 120 162 M 120 162 H 260 M 150 162 V 140 H 172 V 162 M 70 130 V 116 H 80 V 137', swift(98, 70, 1.25, -0.2), swift(176, 46, 0.9, 0.15), swift(212, 98, 0.7, -0.35)];
  })(),
  hedge: (() => {
    const leaf = (x: number, y: number, a: number, s: number) => {
      const c = Math.cos(a), si = Math.sin(a);
      const T = (px: number, py: number): P => [x + (px * c - py * si) * s, y + (px * si + py * c) * s];
      const half: [number, number][] = [[6, 3], [12, 9], [14.5, 4.5], [20, 10], [22.5, 4.5], [28, 2]];
      const pts = [T(0, 0), ...half.map(([px, py]) => T(px, py)), T(30, 0), ...half.slice().reverse().map(([px, py]) => T(px, -py)), T(0, 0)];
      return `${smooth(pts)} M ${T(1, 0).map((v) => v.toFixed(1)).join(' ')} L ${T(25, 0).map((v) => v.toFixed(1)).join(' ')}`;
    };
    return [
      smooth([[30, 160], [80, 132], [140, 112], [200, 84], [250, 60]]),
      smooth([[110, 122], [118, 150], [134, 166]]),
      smooth([[176, 95], [196, 118], [202, 140]]),
      leaf(80, 132, -1.9, 1.2), leaf(140, 112, -2.1, 1.1), leaf(200, 84, -1.7, 1.0), leaf(110, 122, 0.4, 1.0), leaf(176, 95, 0.6, 0.95), leaf(236, 66, -0.4, 0.9),
      circle(134, 172, 5), circle(144, 168, 5), circle(140, 178, 5), circle(202, 146, 5), circle(210, 140, 4.6),
    ];
  })(),
};
