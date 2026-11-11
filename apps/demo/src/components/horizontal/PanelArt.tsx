/**
 * The preview's eight panels: plain line drawings, one per card, drawn for
 * this page. Each is a 120 × 72 sheet in one stroke weight.
 */

export const PANEL_NAMES = ['Hills', 'Tide', 'House', 'Tree', 'Boat', 'Peaks', 'Bridge', 'Lighthouse'] as const;

const ART: string[] = [
  // Hills, a low sun, the horizon.
  'M4 62 Q 30 30 56 52 T 116 44 M4 66 H116 M97 22 a 9 9 0 1 0 -18 0 a 9 9 0 1 0 18 0',
  // Three rows of waves.
  'M6 26 q 9 -7 18 0 t 18 0 t 18 0 t 18 0 t 18 0 t 18 0 M6 40 q 9 -7 18 0 t 18 0 t 18 0 t 18 0 t 18 0 t 18 0 M6 54 q 9 -7 18 0 t 18 0 t 18 0 t 18 0 t 18 0 t 18 0',
  // A house with a door and a window.
  'M30 66 V38 L60 14 L90 38 V66 Z M54 66 V50 H66 V66 M37 42 H49 V52 H37 Z M71 42 H83 V52 H71 Z M16 66 H104',
  // A tree and a bush on level ground.
  'M50 66 V46 M68 28 a 18 18 0 1 0 -36 0 a 18 18 0 1 0 36 0 M78 66 q 9 -16 18 0 M18 66 H102',
  // A sailing boat on the water.
  'M24 50 H96 L84 60 H36 Z M60 50 V10 M60 12 L88 46 H60 M8 66 q 10 -5 20 0 t 20 0 t 20 0 t 20 0 t 20 0 t 16 0',
  // A range of peaks, one with snow.
  'M4 66 L34 26 L50 44 L72 12 L116 66 M64 22 L72 12 L80 22 L72 27 Z',
  // An arch bridge and its hangers.
  'M4 48 H116 M14 66 Q 60 0 106 66 M38 48 V39.3 M60 48 V32 M82 48 V39.3 M4 66 H116',
  // A lighthouse with two beams.
  'M52 66 L56 26 H64 L68 66 Z M54 26 V18 H66 V26 M53 18 L60 10 L67 18 M72 20 L104 12 M72 24 L104 32 M20 66 H100',
];

export function PanelArt({ i }: { i: number }) {
  return (
    <svg className="hz-art" viewBox="0 0 120 72" aria-hidden="true" focusable="false">
      <path d={ART[i % ART.length]} />
    </svg>
  );
}
