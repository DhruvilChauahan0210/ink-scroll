import { smooth, type P } from '@/components/examples/ink/geo';
import { ring } from './geo';

/* The coverage map: greater Lisbon in a 560 × 420 box, north up. A basemap
   (street mesh, Monsanto, the airport, motorways, rail, both bridges) under
   the three price zones, the hubs with their ten-minute reach, and the
   riders out right now. Fixed seeds, so server and client agree. */

const Z3: P[] = [[40, 200], [90, 120], [190, 70], [300, 50], [420, 70], [500, 130], [520, 230], [470, 300], [400, 312], [300, 318], [170, 322], [70, 300]];
const Z2: P[] = [[150, 230], [190, 160], [270, 130], [360, 140], [420, 190], [410, 262], [340, 300], [240, 306], [170, 290]];
const Z1: P[] = [[240, 268], [262, 232], [310, 222], [352, 240], [356, 276], [320, 300], [270, 300]];
const ALMADA: P[] = [[150, 392], [200, 366], [290, 358], [350, 376], [340, 412], [260, 418], [180, 414]];
const MONSANTO: P[] = [[166, 222], [196, 204], [234, 208], [248, 232], [228, 258], [192, 262], [170, 246]];

const TEJO = `${smooth([[-10, 322], [80, 318], [170, 330], [260, 316], [340, 306], [420, 296], [480, 270], [540, 200], [580, 150]])} L 580 430 L -10 430 Z`;
const SOUTH = `${smooth([[-10, 380], [80, 372], [170, 356], [250, 346], [330, 350], [400, 344], [460, 326], [520, 300], [580, 290]])} L 580 430 L -10 430 Z`;

const MOTORWAYS: { d: string; n: string; at: P }[] = [
  { d: smooth([[34, 296], [120, 270], [200, 252], [262, 262]]), n: 'A5', at: [96, 277] },
  { d: smooth([[40, 150], [110, 172], [170, 196], [214, 210]]), n: 'IC19', at: [104, 170] },
  { d: smooth([[322, 34], [334, 110], [326, 180], [314, 236]]), n: 'A1', at: [333, 86] },
  { d: smooth([[120, 252], [126, 196], [176, 146], [256, 112], [332, 102], [424, 92]]), n: 'CRIL', at: [196, 136] },
  { d: smooth([[188, 214], [250, 190], [330, 182], [404, 198], [446, 242]]), n: '2ª Circ.', at: [404, 199] },
  { d: smooth([[452, 70], [432, 140], [398, 210], [356, 252]]), n: 'A12', at: [441, 110] },
];
const RAIL = [
  smooth([[0, 310], [80, 308], [170, 319], [250, 306]]),
  smooth([[304, 240], [246, 202], [176, 182], [104, 168], [30, 152]]),
];

function rand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

/** A faint street mesh: a jittered grid, each node joined right and down. */
const MESH = (() => {
  const r = rand(4242);
  const S = 17, cols = 34, rows = 26;
  const pts: P[][] = [];
  for (let j = 0; j < rows; j++) {
    pts.push([]);
    for (let i = 0; i < cols; i++) pts[j].push([i * S + (r() - 0.5) * 9, j * S + (r() - 0.5) * 9]);
  }
  let d = '';
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const [x, y] = pts[j][i];
      if (i + 1 < cols && r() < 0.78) { const [x2, y2] = pts[j][i + 1]; d += `M${x.toFixed(0)} ${y.toFixed(0)}L${x2.toFixed(0)} ${y2.toFixed(0)}`; }
      if (j + 1 < rows && r() < 0.66) { const [x2, y2] = pts[j + 1][i]; d += `M${x.toFixed(0)} ${y.toFixed(0)}L${x2.toFixed(0)} ${y2.toFixed(0)}`; }
    }
  }
  return d;
})();

const HUBS: [number, number, string][] = [[306, 248, 'Intendente'], [176, 284, 'Alcântara'], [270, 386, 'Almada']];
const RIDERS: P[] = [
  [268, 252], [286, 276], [326, 232], [342, 262], [300, 292], [252, 286], [318, 270],
  [214, 290], [232, 180], [290, 160], [384, 214], [396, 252], [372, 286], [198, 248],
  [236, 378], [308, 372], [128, 236], [452, 160],
];

export function Coverage() {
  return (
    <svg className="pc-cov" viewBox="0 0 560 420" role="img" aria-label="Coverage map of greater Lisbon: Zone 1 is the historic centre, Zone 2 the rest of the city, Zone 3 reaches Oeiras, Amadora, Odivelas, Loures and, across the bridge, Almada. Three hubs, each with a ten-minute reach, and the riders out now.">
      <defs>
        <clipPath id="pc-cov-urban"><path d={ring(Z3)} /></clipPath>
        <clipPath id="pc-cov-south"><path d={ring(ALMADA)} /></clipPath>
      </defs>
      <rect width="560" height="420" className="pc-cov-land" />
      <path d="M0 0H30V420H0Z" className="pc-cov-sea" />
      <path d={MESH} className="pc-cov-mesh" clipPath="url(#pc-cov-urban)" />
      <path d={ring(MONSANTO)} className="pc-cov-park" />
      <g className="pc-cov-air">
        <path d="M344 122 L398 112 L410 150 L356 162 Z" />
        <path d="M352 152 L402 120 M360 128 L404 146" className="rw" />
      </g>

      <path d={ring(Z3)} className="pc-z3" />
      <path d={ring(Z2)} className="pc-z2" />
      <path d={ring(Z1)} className="pc-z1" />

      {RAIL.map((d, i) => <g key={i}><path d={d} className="pc-cov-rail" /><path d={d} className="pc-cov-rail-t" /></g>)}
      {MOTORWAYS.map((m) => <path key={m.n} d={m.d} className="pc-cov-mw-case" />)}
      {MOTORWAYS.map((m) => <path key={m.n} d={m.d} className="pc-cov-mw" />)}

      <path d={TEJO} className="pc-cov-water" />
      <path d={SOUTH} className="pc-cov-land" />
      <path d={MESH} className="pc-cov-mesh" clipPath="url(#pc-cov-south)" />
      <path d={ring(ALMADA)} className="pc-z3" />

      <path d="M196 326 L206 360" className="pc-bridge" />
      <path d="M198 332 l-4 -2 M204 352 l4 2" className="pc-bridge-t" />
      <path d="M470 270 C 492 282, 520 290, 552 294" className="pc-bridge pc-bridge-vg" />

      {MOTORWAYS.map((m) => (
        <g key={m.n} className="pc-shield" transform={`translate(${m.at[0]} ${m.at[1]})`}>
          <rect x={-(m.n.length * 3.4 + 5)} y="-6.5" width={m.n.length * 6.8 + 10} height="13" rx="3" />
          <text y="3.4">{m.n}</text>
        </g>
      ))}

      <g className="pc-cov-lbl">
        <text x="298" y="290" className="z1">Zone 1 · €6</text>
        <text x="270" y="152" className="z2">Zone 2 · €8</text>
        <text x="240" y="88" className="z3">Zone 3 · €11</text>
        <text x="80" y="246">Oeiras</text>
        <text x="62" y="134">Amadora</text>
        <text x="236" y="64" className="pc-hide-s">Odivelas</text>
        <text x="460" y="88">Loures</text>
        <text x="196" y="408">Almada</text>
        <text x="206" y="232" className="pc-cov-pk">Monsanto</text>
        <text x="377" y="104" className="pc-cov-ap pc-hide-s">Aeroporto</text>
        <text x="420" y="378" className="pc-cov-w">Rio Tejo</text>
        <text x="214" y="348" className="pc-cov-b">Ponte 25 de Abril</text>
        <text x="500" y="316" className="pc-cov-b pc-hide-s">Ponte Vasco da Gama</text>
        <text x="9" y="190" className="pc-cov-sea-l" transform="rotate(-90 9 190)">Atlantic</text>
      </g>

      {HUBS.map(([x, y]) => <circle key={`r${x}`} cx={x} cy={y} r="40" className="pc-hub-reach" />)}
      <g className="pc-riders-now">
        {RIDERS.map(([x, y]) => <g key={`${x}-${y}`} transform={`translate(${x} ${y})`}><circle r="5.5" className="h" /><circle r="2.6" /></g>)}
      </g>
      {HUBS.map(([x, y, n]) => (
        <g key={n} className="pc-hub" transform={`translate(${x} ${y})`}>
          <circle r="7" /><circle r="2.6" className="in" />
          <text x="11" y="4">Hub {n}</text>
        </g>
      ))}
      <g className="pc-cov-scale" transform="translate(470 404)">
        <path d="M0 0 V-4 M0 -2 H60 M60 0 V-4 M30 -2 V-4" />
        <text x="30" y="-8">2 km</text>
      </g>
    </svg>
  );
}
