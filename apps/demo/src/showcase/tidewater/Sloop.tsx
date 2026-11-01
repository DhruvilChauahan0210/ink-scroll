'use client';

import { ScrollDraw } from 'svg-scroll-draw/react';
import { smooth, type P } from '@/components/examples/ink/geo';

/*
 * The hero's sloop — the svg-scroll-draw effect on this page. One ScrollDraw
 * (fade · stagger 0.07 · ease-out · once, trigger top 90% → top 20%) with
 * the default selector, so every shape inside draws: hull, mast, sails, then
 * the swell, in DOM order. The golden-hour estuary behind it is a separate,
 * static layer (EstuaryBackdrop) so the library never touches it.
 */

/** A row of swell: a few broken, gently rolling strokes between x0 and x1. */
function swell(y: number, x0: number, x1: number, amp: number, phase: number, gaps: number[]): string {
  const segs: string[] = [];
  const cuts = [x0, ...gaps, x1];
  for (let s = 0; s < cuts.length - 1; s += 2) {
    const a = cuts[s];
    const b = cuts[s + 1];
    const n = Math.max(3, Math.round((b - a) / 34));
    const pts: P[] = Array.from({ length: n + 1 }, (_, i) => {
      const x = a + ((b - a) * i) / n;
      return [x, y + Math.sin(x / 26 + phase) * amp];
    });
    segs.push(smooth(pts));
  }
  return segs.join(' ');
}

const SEA = [
  swell(350, 18, 548, 2.4, 0.4, [96, 118, 300, 326]),
  swell(368, 40, 530, 2.8, 1.6, [210, 238, 420, 446]),
  swell(390, 8, 556, 3.2, 2.7, [140, 170, 352, 380]),
  swell(414, 30, 540, 3.6, 0.9, [250, 286]),
].join(' ');

export function Sloop() {
  return (
    <ScrollDraw className="tw-boat" trigger={{ start: 'top 90%', end: 'top 20%' }} stagger={0.07} easing="ease-out" fade once>
      <svg viewBox="0 0 560 440" role="img" aria-label="A line drawing of Kittiwake, the school's 36-foot sloop, close-hauled on a light swell with two gulls overhead">
        {/* hull — navy topsides with a counter stern and a raked stem — and the two crew in the cockpit */}
        <path className="tw-hull" d="M 124 296 C 210 304, 350 302, 472 280 C 466 300, 456 322, 444 336 Q 300 344, 154 336 C 140 326, 128 310, 124 296 Z M 168 299 C 168 284, 171 276, 178 276 C 185 276, 188 284, 188 299 Z M 178 262 a 7 7 0 1 0 0.1 0 Z M 196 300 C 196 287, 199 280, 205 280 C 211 280, 214 287, 214 300 Z M 205 267 a 6.5 6.5 0 1 0 0.1 0 Z" />
        {/* boot-top */}
        <path className="tw-boot" d="M 160 331 Q 300 339, 448 329" />
        {/* coachroof and portlights */}
        <path className="tw-cabin" d="M 214 301 L 228 285 C 262 282, 300 281, 336 281 L 350 297 M 246 291 h 14 M 274 290 h 14 M 302 290 h 14" />
        {/* mast, spreaders, boom */}
        <path className="tw-spar" d="M 283 284 L 271 36 M 258 150 L 293 148 M 281 246 L 146 258" />
        {/* mainsail */}
        <path className="tw-sail" d="M 271 48 L 279 242 Q 214 249, 152 252 C 172 178, 222 98, 271 48 Z" />
        {/* jib */}
        <path className="tw-sail tw-jib" d="M 281 72 L 456 276 Q 396 278, 332 264 C 324 200, 300 132, 281 72 Z" />
        {/* standing and running rigging */}
        <path className="tw-rig" d="M 272 52 L 467 281 M 270 40 L 128 294 M 272 50 L 293 148 L 289 283 M 272 50 L 258 150 L 276 283 M 332 264 Q 270 286, 206 292 M 160 256 L 172 292" />
        {/* battens and the school's mark on the main */}
        <path className="tw-fine" d="M 162 216 L 180 219 M 178 175 L 197 179 M 199 132 L 216 136 M 226 91 L 240 95 M 222 154 q 7 -7 14 0 t 14 0" />
        {/* stanchions, lifelines, pulpit, pushpit and the tiller */}
        <path className="tw-gear" d="M 232 300 V 284 M 392 297 V 280 M 430 291 V 274 M 132 281 C 200 286, 360 285, 452 268 M 452 286 L 454 268 Q 462 262, 470 266 L 472 280 M 130 297 L 128 281 Q 134 276, 142 278 M 146 292 L 170 288" />
        {/* burgee */}
        <path className="tw-flag" d="M 271 30 L 289 35 L 271 40 Z" />
        {/* the swell */}
        <path className="tw-sea" d={SEA} />
        {/* bow wave, wake and the hull's reflection */}
        <path className="tw-wake" d="M 444 335 q 16 -6 32 0 M 456 344 q 18 -3 36 1 M 150 340 q -34 4 -76 2 M 136 350 q -40 4 -90 5 M 200 353 h 40 M 272 355 h 56 M 352 352 h 44" />
        {/* gulls */}
        <path className="tw-gull" d="M 86 122 q 10 -10 20 0 q 10 -10 20 0 M 140 94 q 7 -7 14 0 q 7 -7 14 0 M 418 78 q 8 -8 16 0 q 8 -8 16 0" />
      </svg>
    </ScrollDraw>
  );
}

/** Golden hour over the Carrick Roads: sky, sun, Pendennis Point with the
 *  castle, St Anthony Head with its lighthouse, and the sea. Static. */
export function EstuaryBackdrop() {
  return (
    <svg className="tw-backdrop" viewBox="0 0 1600 700" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id="tw-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c9dadd" />
          <stop offset="0.45" stopColor="#ecdcc4" />
          <stop offset="0.62" stopColor="#f5cf9f" />
        </linearGradient>
        <radialGradient id="tw-glow" cx="0.7" cy="0.6" r="0.42">
          <stop offset="0" stopColor="#fff1d6" stopOpacity="0.95" />
          <stop offset="0.3" stopColor="#ffd9a6" stopOpacity="0.5" />
          <stop offset="1" stopColor="#ffd9a6" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="tw-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c8d3cc" />
          <stop offset="0.25" stopColor="#8fb0b6" />
          <stop offset="1" stopColor="#3f6e80" />
        </linearGradient>
        <linearGradient id="tw-glitter" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff4dc" stopOpacity="0.9" />
          <stop offset="1" stopColor="#fff4dc" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="1600" height="700" fill="url(#tw-sky)" />
      <rect width="1600" height="700" fill="url(#tw-glow)" />
      <g fill="#fbf3e6" opacity="0.55">
        <path d="M 180 170 C 210 150, 260 150, 280 168 C 320 160, 370 172, 372 188 L 150 188 C 150 180, 160 172, 180 170 Z" />
        <path d="M 1240 120 C 1262 104, 1300 104, 1316 118 C 1350 112, 1392 122, 1394 136 L 1220 136 C 1220 128, 1228 122, 1240 120 Z" />
        <path d="M 760 230 C 776 220, 802 220, 814 230 C 838 226, 864 232, 866 242 L 742 242 C 742 236, 748 232, 760 230 Z" opacity="0.7" />
      </g>
      <circle cx="1120" cy="388" r="34" fill="#fff3dc" />
      {/* far shore */}
      <path d="M 0 418 C 140 404, 260 398, 420 404 C 560 410, 700 402, 820 408 L 820 426 L 0 426 Z" fill="#b9c6c4" />
      {/* St Anthony Head and its lighthouse, right */}
      <path d="M 1180 426 C 1260 404, 1330 380, 1420 372 C 1500 366, 1560 374, 1600 380 L 1600 426 Z" fill="#8ea6a8" />
      <path d="M 1452 371 h 12 l -2 -24 h -8 Z M 1450 347 h 16 M 1454 343 h 8 v -6 h -8 Z" fill="#f4efe6" stroke="#6c8789" strokeWidth="1.5" />
      {/* Pendennis Point and the castle, left */}
      <path d="M 0 432 L 0 352 C 70 344, 150 340, 220 350 C 300 362, 360 390, 470 418 L 520 432 Z" fill="#5f8188" />
      <path d="M 120 343 v -18 h 6 v -6 h 6 v 6 h 8 v -6 h 6 v 6 h 8 v -6 h 6 v 6 h 6 v 20 Z M 172 345 v -10 h 26 v 12 Z" fill="#4c6c74" />
      {/* the sea */}
      <rect y="426" width="1600" height="274" fill="url(#tw-water)" />
      <path d="M 1086 432 h 70 M 1072 446 h 100 M 1094 462 h 58 M 1060 480 h 124 M 1088 500 h 70 M 1050 524 h 140 M 1084 552 h 76" stroke="url(#tw-glitter)" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
      <path d="M 0 426 H 1600" stroke="#f6e7cf" strokeWidth="1.5" opacity="0.8" />
      {/* a far yacht off the point */}
      <path d="M 640 424 l 8 -30 l 7 30 Z M 636 425 h 24" fill="#5f8188" stroke="#5f8188" strokeWidth="1.5" />
    </svg>
  );
}
