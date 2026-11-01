'use client';

/** Pieces both benches of /playground share (v1 scrollDraw, v2 animate · text · counter). */

export type Ground = 'paper' | 'slate';

/** How far along its track a range input is, for the red ink up to the thumb. */
export const fill = (v: number, min: number, max: number) =>
  ({ '--p': `${((v - min) / (max - min)) * 100}%` }) as React.CSSProperties;

export const pad = (n: number) => String(n).padStart(2, '0');

/** The scrubber's icons, drawn rather than typed so they sit on the grid. */
export function PlayIcon({ playing }: { playing: boolean }) {
  return playing ? (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><rect x="3.5" y="2.5" width="3" height="11" /><rect x="9.5" y="2.5" width="3" height="11" /></svg>
  ) : (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M4.5 2.5 L13.5 8 L4.5 13.5 Z" /></svg>
  );
}

export function ResetIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 8 A5 5 0 1 0 4.6 4.3" /><path d="M2.8 2.2 V5 H5.6" />
    </svg>
  );
}

/** Paper or slate under the specimen — test the drawing on the ground it will ship on. */
export function GroundSwitch({ ground, onChange }: { ground: Ground; onChange: (g: Ground) => void }) {
  return (
    <span className="pl-ph-btn" role="group" aria-label="Specimen ground">
      {(['paper', 'slate'] as const).map((g) => (
        <button key={g} type="button" aria-pressed={ground === g} onClick={() => onChange(g)}>{g}</button>
      ))}
    </span>
  );
}

/** Crop marks at the specimen's four corners. */
export function CropMarks() {
  return (
    <>
      <i className="pl-crop pl-crop-tl" /><i className="pl-crop pl-crop-tr" />
      <i className="pl-crop pl-crop-bl" /><i className="pl-crop pl-crop-br" />
    </>
  );
}
