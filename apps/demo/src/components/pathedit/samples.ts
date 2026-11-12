/**
 * The paths the editor opens with, drawn for this page. The first uses every
 * command once, absolute and relative mixed; the clock is written the way a
 * minifier writes it (letters left out, arc flags run together).
 */
export type Sample = { key: string; name: string; d: string };

export const SAMPLES: Sample[] = [
  {
    key: 'landscape',
    name: 'Landscape',
    d: 'M20 120 C40 60 90 60 110 100 s60 50 80 0 q15 -30 40 -20 t40 0 a30 30 0 0 1 30 30 l0 20 v20 H20 z',
  },
  { key: 'clock', name: 'Clock, minified', d: 'M12 2a10 10 0 100 20 10 10 0 100-20zm0 5v5l3 3' },
  { key: 'wave', name: 'Wave', d: 'M10 60 C20 20 40 20 45 50 S60 90 70 60 S85 20 95 45 S110 80 125 55 S150 30 160 50' },
  { key: 'heart', name: 'Heart', d: 'M50 88 L14 52 A20 20 0 0 1 50 22 A20 20 0 0 1 86 52 Z' },
];

export const DEFAULT_SAMPLE = SAMPLES[0];
