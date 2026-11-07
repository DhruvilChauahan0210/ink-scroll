'use client';

import './casaverde.css';
import { useEffect, useRef, useState } from 'react';
import { scrollDraw, type ScrollDrawInstance } from 'svg-scroll-draw';
import { scrollSnap, type ScrollSnapInstance } from 'svg-scroll-draw/snap';
import { Site, Hero, Sec, Quote } from '../kit/Site';

/*
 * Casa Verde — a demo site for a fictional boutique holiday-rentals company
 * with country houses in Portugal and Spain, built with svg-scroll-draw:
 *   · the houses sit in a horizontal track that scrollSnap holds to one house
 *     at a time — swipe, trackpad, arrow keys, the arrows or the dots
 *   · onSnap moves the "2 / 6" counter, the active dot and the details panel
 *     (name, region, sleeps, price per night) to the house that landed
 *   · each house is a pen-and-wash painting whose pen lines ink in the first
 *     time its slide snaps into place; the wash waits for it
 */

/* ── Drawing helpers ──────────────────────────────────────────────────── */

type Paint = [d: string, fill: string, opacity?: number];
/** Back: the land and its pen lines. Front: the house and trees, painted over
    the land's lines, then their own. The pen draws back to front. */
type Scene = { sky: [number, string][]; back: Paint[]; backInk: string[]; paint: Paint[]; ink: string[] };

const R = (x: number, y: number, w: number, h: number) => `M${x} ${y}h${w}v${h}h${-w}Z`;
const C = (cx: number, cy: number, r: number) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
/** An arched opening, open at the bottom; close it with Z to fill it. */
const ARCH = (x: number, base: number, w: number, h: number) => `M${x} ${base}V${base - h + w / 2}a${w / 2} ${w / 2} 0 0 1 ${w} 0V${base}`;
const CYPRESS = (x: number, base: number, h: number, w = 9) =>
  `M${x} ${base}C${x - w} ${base - h * 0.35} ${x - w * 0.6} ${base - h * 0.8} ${x} ${base - h}C${x + w * 0.6} ${base - h * 0.8} ${x + w} ${base - h * 0.35} ${x} ${base}Z`;
/** A soft, lumpy canopy: a closed curve through the midpoints of a wobbling ring. */
const BLOB = (cx: number, cy: number, rx: number, ry: number, n = 10) => {
  const p = Array.from({ length: n }, (_, k) => {
    const a = (k / n) * Math.PI * 2, f = k % 2 ? 1.12 : 0.93;
    return [cx + Math.cos(a) * rx * f, cy + Math.sin(a) * ry * f];
  });
  const f1 = (v: number) => v.toFixed(1);
  const mid = (a: number[], b: number[]) => `${f1((a[0] + b[0]) / 2)} ${f1((a[1] + b[1]) / 2)}`;
  return `M${mid(p[n - 1], p[0])}${p.map((q, k) => `Q${f1(q[0])} ${f1(q[1])} ${mid(q, p[(k + 1) % n])}`).join('')}Z`;
};
const dots = (pts: [number, number][], r: number) => pts.map(([x, y]) => C(x, y, r)).join('');
const fillTo = (line: string, floor = 'V440H0Z') => line + floor;

/* ── The houses, each a 640 × 440 pen-and-wash scene ──────────────────── */

const AZ_HILL = 'M0 262C90 246 170 252 250 246C340 238 420 250 500 244C560 240 610 246 640 242';
const AZ_PLAIN = 'M0 292C140 282 260 290 380 284C480 279 570 284 640 280';
const AZ_GROUND = 'M0 352C160 342 330 350 470 344C550 341 600 342 640 340';
const AZ_OAK = BLOB(104, 236, 64, 32);
const AZ_WIN = R(222, 258, 18, 22) + R(262, 258, 18, 22) + R(392, 258, 18, 22) + R(476, 274, 16, 18);
const AZINHEIRA: Scene = {
  sky: [[0, '#a9b0d3'], [0.5, '#f2bda2'], [1, '#fae2bf']],
  back: [
    [C(566, 178, 28), '#fdebcb'],
    [fillTo(AZ_HILL), '#c99f98'],
    [fillTo(AZ_PLAIN), '#e8c58f'],
    [fillTo(AZ_GROUND), '#d9ae70'],
  ],
  backInk: [AZ_HILL, AZ_GROUND, C(566, 178, 28), 'M470 130q6-6 12 0q6-6 12 0M506 152q5-5 10 0q5-5 10 0', 'M40 374l6-14M54 378l4-16M592 366l5-13M606 370l3-15'],
  paint: [
    ['M190 314H540L562 323H176Z', '#b98d55', 0.5],
    [AZ_OAK, '#6d7547'],
    [R(196, 236, 250, 78), '#fbf6ec'],
    [R(446, 258, 84, 56), '#f1e9dc'],
    [R(196, 302, 334, 12), '#3f70a8'],
    ['M188 238L316 212L454 238Z', '#c96b47'],
    [R(356, 204, 22, 30), '#fbf6ec'],
    [R(352, 198, 30, 7), '#efe7da'],
    [AZ_WIN, '#58698c'],
    [ARCH(318, 314, 28, 30) + 'Z', '#3f70a8'],
    ['M250 382H586L604 408H232Z', '#7cc6c8'],
    ['M258 386H582L587 392H254Z', '#a8dcd9'],
  ],
  ink: [
    'M188 238L316 212L454 238', 'M196 238V314H446V238', 'M446 258H530V314', 'M196 302H530',
    'M356 228V204H378V226M352 205H382V198H352Z', AZ_WIN, ARCH(318, 314, 28, 30),
    'M196 280H136M144 280V314M170 280V314M136 280C148 272 160 286 172 276C182 270 190 280 196 274',
    AZ_OAK, 'M104 314C103 296 101 282 94 264M104 300C110 288 116 278 128 268M100 286C92 280 84 278 76 270',
    'M250 382H586L604 408H232Z', 'M300 397c14-5 28 5 42 0M430 399c14-5 28 5 42 0',
  ],
};

const VE_RIDGE = 'M0 200C80 176 150 186 220 170C300 152 380 178 450 166C530 152 590 170 640 160';
const VE_MID = 'M0 250C100 228 180 240 260 226C330 214 380 230 430 244';
const VE_TERR = 'M200 440C250 330 360 262 470 238C540 224 600 226 640 230';
const VE_RIVER = 'M0 372C70 364 150 376 220 386C280 394 318 414 332 440';
const VE_WIN = R(452, 212, 12, 15) + R(476, 212, 12, 15) + R(500, 212, 12, 15) + R(524, 212, 12, 15) + R(452, 232, 12, 16) + R(524, 232, 12, 16) + R(566, 230, 12, 14);
const VALE_ESCURO: Scene = {
  sky: [[0, '#c6dce6'], [1, '#f6efe1']],
  back: [
    [C(118, 92, 24), '#fff5dc'],
    [fillTo(VE_RIDGE), '#a9b9b0'],
    [fillTo(VE_MID), '#93a77e'],
    [VE_TERR + 'V440Z', '#b1b86f'],
    [VE_RIVER + 'H0Z', '#86b4bf'],
  ],
  backInk: [
    VE_RIDGE, VE_MID, VE_TERR,
    'M248 404C304 326 400 282 506 266C566 258 612 260 640 262',
    'M286 432C340 356 426 312 528 298C580 292 616 294 640 296',
    'M344 440C392 380 458 346 552 334C596 329 624 330 640 332',
    'M424 440C466 410 516 388 578 378C606 374 626 372 640 372',
    VE_RIVER, C(118, 92, 24),
    'M88 400C108 410 150 410 170 398M128 404V374M128 378L152 384V396H128',
    'M30 414c16-4 32 4 48 0M190 426c14-4 28 4 42 0',
  ],
  paint: [
    [CYPRESS(424, 256, 74), '#4a5e44'],
    [CYPRESS(408, 258, 52, 7), '#55684a'],
    [R(440, 204, 110, 50), '#efe6d5'],
    [R(550, 218, 46, 36), '#e5dac7'],
    ['M432 206L462 184H528L558 206Z', '#b55e3d'],
    ['M546 220L572 206L600 220Z', '#a9583a'],
    [VE_WIN, '#3e6b52'],
    [R(486, 230, 16, 24), '#6b4a33'],
  ],
  ink: [
    'M432 206L462 184H528L558 206Z', 'M440 206V254H550V206', 'M550 220H596V254H550M546 220L572 206L600 220',
    VE_WIN, R(486, 230, 16, 24), CYPRESS(424, 256, 74), CYPRESS(408, 258, 52, 7),
  ],
};

const FA_HEAD = 'M0 220C30 212 70 210 104 216C128 220 148 230 166 240';
const FA_CLIFF = 'M640 192C600 190 560 198 520 212C482 226 452 252 436 286C420 320 400 360 360 400C342 418 332 430 326 440';
const FAROL: Scene = {
  sky: [[0, '#b5d9ea'], [1, '#eef6f3']],
  back: [
    [C(232, 84, 22), '#fffbe8'],
    [R(0, 238, 640, 202), '#5d9fbd'],
    ['M0 330C200 322 400 334 640 326V440H0Z', '#4183a2'],
    ['M0 240V220C30 212 70 210 104 216C128 220 148 230 166 240Z', '#b29a7f'],
    ['M64 216L67 178H77L80 216Z', '#fbfbf7'],
    [R(66, 192, 13, 7) + 'M64 170L72 162L80 170Z', '#c4473b'],
    [R(67, 170, 10, 8), '#f6e7a8'],
    [FA_CLIFF + 'H640Z', '#d29a63'],
    ['M640 250C580 252 520 262 470 280C450 320 430 360 400 400C390 420 384 430 380 440H640Z', '#bf8452'],
    ['M640 186C600 184 556 192 516 208C500 214 486 222 474 232C510 220 560 210 640 208Z', '#8fa76b'],
  ],
  backInk: [
    'M166 240H468', FA_HEAD,
    'M64 216L67 178H77L80 216M67 178V170H77V178M64 170L72 162L80 170', 'M86 172L122 164M86 177L120 182',
    FA_CLIFF,
    'M452 262C500 252 560 248 640 246', 'M428 304C490 292 560 288 640 288', 'M400 350C470 336 560 332 640 332', 'M368 398C450 382 550 378 640 378',
    'M474 236C496 226 516 214 536 208',
    'M40 300q12-7 24 0t24 0', 'M150 344q14-8 28 0t28 0', 'M56 392q16-9 32 0t32 0', 'M236 290q10-6 20 0t20 0', 'M246 384q14-8 28 0t28 0',
    'M326 440C336 424 350 414 366 404',
    C(232, 84, 22), 'M300 126q8-7 16 0q8-7 16 0M354 104q6-5 12 0q6-5 12 0',
  ],
  paint: [
    [R(536, 164, 74, 42) + R(594, 146, 10, 18) + R(591, 141, 16, 5), '#fbfbf8'],
    [R(534, 160, 78, 5) + R(564, 182, 12, 24) + R(546, 178, 12, 12) + R(588, 178, 12, 12), '#2f6fa6'],
  ],
  ink: [
    'M536 206V164H610V206H536', 'M534 162H612', 'M564 206V182H576V206', R(546, 178, 12, 12) + R(588, 178, 12, 12),
    'M594 164V146H604V164M591 146H607V141H591Z',
  ],
};

const CO_PYR = 'M0 214L60 190L110 204L170 170L230 198L290 178L350 200L420 172L480 196L560 180L640 198';
const CO_HILLS = 'M0 262C120 246 220 254 330 244C440 234 540 246 640 238';
const CO_FIELD = 'M0 322C160 310 320 318 480 310C560 306 610 308 640 306';
const CO_OLIVES = [BLOB(70, 366, 46, 26), BLOB(196, 392, 50, 28), BLOB(470, 380, 52, 28), BLOB(590, 356, 44, 24)];
const CO_WIN = R(258, 200, 18, 26) + R(311, 200, 18, 26) + R(364, 200, 18, 26);
const CAN_OLIU: Scene = {
  sky: [[0, '#f1cf98'], [1, '#f9edd5']],
  back: [
    [C(540, 116, 34), '#fff2d2'],
    [fillTo(CO_PYR), '#cdb9a7'],
    [fillTo(CO_HILLS), '#bdb176'],
    [BLOB(60, 288, 18, 9) + BLOB(120, 286, 18, 9) + BLOB(480, 282, 18, 9) + BLOB(540, 280, 18, 9) + BLOB(600, 282, 18, 9), '#a2a774'],
    [fillTo(CO_FIELD), '#cfba7a'],
  ],
  backInk: [CO_PYR, CO_HILLS, CO_FIELD, 'M0 414C200 404 420 410 640 400', C(540, 116, 34)],
  paint: [
    ['M226 308H492L510 316H210Z', '#a9935f', 0.45],
    [CYPRESS(204, 310, 118, 10), '#4b5d40'],
    [CYPRESS(186, 312, 86, 8), '#55684a'],
    [R(232, 178, 176, 130), '#e3c9a1'],
    ['M222 182L320 146L418 182Z', '#b2623e'],
    [R(408, 242, 78, 66), '#d9bf93'],
    ['M404 246L446 224L490 246Z', '#a85b3b'],
    [ARCH(252, 308, 36, 32) + 'Z' + ARCH(302, 308, 36, 32) + 'Z' + ARCH(352, 308, 36, 32) + 'Z', '#6e523d'],
    [CO_WIN + ARCH(312, 172, 16, 14) + 'Z', '#6e523d'],
    [R(436, 270, 22, 38), '#7a5a3f'],
    [CO_OLIVES.join(''), '#9aa57c'],
  ],
  ink: [
    'M222 182L320 146L418 182', 'M232 182V308H408V182', 'M408 246V308H486V246M404 246L446 224L490 246',
    ARCH(252, 308, 36, 32) + ARCH(302, 308, 36, 32) + ARCH(352, 308, 36, 32), CO_WIN, ARCH(312, 172, 16, 14) + 'Z',
    'M436 308V270H458V308', 'M246 236h12M392 214h10M394 286h12M248 196h10M300 244h12M352 248h10',
    CYPRESS(204, 310, 118, 10), CYPRESS(186, 312, 86, 8),
    ...CO_OLIVES,
    'M70 394C70 386 66 380 60 376M70 388C74 382 80 380 86 376M196 420C196 412 192 406 186 402M196 414C200 408 206 406 212 402M470 408C470 400 466 394 460 390M470 402C474 396 480 394 486 390M590 380V370M590 376C594 372 598 370 602 368',
  ],
};

const AL_MTN = 'M0 210L70 168L120 186L190 120L250 162L300 140L360 176L430 112L500 160L560 138L640 176';
const AL_FOOT = 'M0 270C120 248 220 262 330 250C450 238 540 256 640 248';
const AL_NEAR = 'M0 332C160 318 320 330 480 318C560 312 610 314 640 312';
const AL_TREES = [BLOB(110, 298, 48, 30), BLOB(556, 312, 52, 30), BLOB(196, 372, 40, 24)];
const AL_WIN = R(318, 250, 12, 14) + R(356, 250, 12, 14) + R(384, 250, 12, 14) + R(424, 272, 10, 12) + R(456, 272, 10, 12);
const ALMENDROS: Scene = {
  sky: [[0, '#bfd0e8'], [1, '#f4eff0']],
  back: [
    [C(96, 82, 18), '#fffaf0'],
    [fillTo(AL_MTN), '#8e9bb5'],
    ['M168 142L190 120L214 138L203 142L194 134L183 146ZM406 136L430 112L458 134L446 138L434 128L421 140ZM286 150L300 140L318 152L307 155L299 149ZM542 152L560 138L580 150L570 154L561 148ZM56 177L70 168L86 178L76 180Z', '#fbfcfe'],
    [fillTo(AL_FOOT), '#b6a37f'],
    [fillTo(AL_NEAR), '#ccb790'],
  ],
  backInk: [
    AL_MTN, 'M168 142L183 146L194 134L203 142L214 138M406 136L421 140L434 128L446 138L458 134',
    AL_FOOT, AL_NEAR,
    'M0 366C160 354 320 364 480 354C560 350 610 350 640 348', 'M0 400C200 390 420 398 640 386',
    C(96, 82, 18),
  ],
  paint: [
    ['M256 302H496L512 310H244Z', '#a99269', 0.45],
    [R(262, 258, 50, 44), '#f5f3ec'],
    [R(300, 230, 112, 72), '#fbfaf6'],
    [R(400, 256, 92, 46), '#f1efe8'],
    [R(330, 208, 12, 22) + R(452, 234, 10, 22), '#fbfaf6'],
    [R(298, 226, 116, 6) + R(260, 254, 54, 6) + R(398, 252, 96, 6) + R(322, 203, 28, 6) + R(445, 229, 24, 6), '#9a9790'],
    [AL_WIN, '#4a5470'],
    [R(276, 276, 14, 26), '#7b5635'],
    [AL_TREES.join(''), '#f3c9d3', 0.95],
    [dots([[94, 290], [122, 284], [136, 304], [104, 312], [80, 300], [540, 306], [566, 298], [580, 318], [548, 324], [184, 368], [204, 362], [212, 380]], 3.2), '#fdf0f3'],
  ],
  ink: [
    'M300 302V230H412V256', 'M262 302V258H300', 'M412 256H492V302', 'M246 302H500', 'M298 230H414M260 258H314M398 256H494',
    'M330 230V208H342V230M322 208H350V203H322Z', 'M452 256V234H462V256M445 234H469V229H445Z',
    AL_WIN, 'M276 302V276H290V302',
    ...AL_TREES,
    'M110 340C110 326 106 314 96 304M110 330C116 320 124 312 134 306M108 318C110 308 112 300 112 292',
    'M556 356C556 342 552 330 542 320M556 346C562 336 570 328 580 322',
    'M196 406C196 396 192 388 186 382M196 398C200 392 206 388 212 384',
  ],
};

const ST_MTL = 'M0 150C40 132 80 124 120 142C160 160 196 150 232 176C262 196 292 214 332 230';
const ST_MTR = 'M640 168C604 158 572 172 544 190C522 204 500 216 478 228';
const ST_VALLEY = 'M0 270C140 256 300 264 420 258C520 254 590 258 640 256';
const ST_NEAR = 'M0 336C160 326 320 334 480 326C560 322 610 324 640 322';
const ST_TREES = [BLOB(452, 318, 40, 26), BLOB(548, 302, 38, 24), BLOB(60, 322, 40, 26), BLOB(598, 344, 32, 20)];
const ST_SHUTTERS = R(146, 226, 14, 20) + R(178, 226, 14, 20) + R(236, 226, 14, 20) + R(286, 194, 12, 18) + R(286, 232, 12, 18) + R(150, 262, 14, 18) + R(240, 262, 14, 18);
const SA_TANCA: Scene = {
  sky: [[0, '#e9a98d'], [0.55, '#f6cfab'], [1, '#fbe7c6']],
  back: [
    [C(404, 198, 24), '#fff1d2'],
    [R(0, 222, 640, 34), '#7aa6bf'],
    [ST_MTL + 'L340 256H0Z', '#9d8583'],
    [ST_MTR + 'L470 256H640Z', '#ad9387'],
    [fillTo(ST_VALLEY), '#90a268'],
    [fillTo(ST_NEAR), '#7f9459'],
  ],
  backInk: [
    ST_MTL, ST_MTR, 'M332 222H478', 'M436 240H452M444 240V226L452 238',
    ST_VALLEY, ST_NEAR, 'M0 362C120 354 260 362 340 358', C(404, 198, 24),
  ],
  paint: [
    ['M124 292H330L348 300H110Z', '#5f7442', 0.5],
    [R(130, 208, 150, 84), '#e0c59c'],
    [R(270, 176, 46, 116), '#d7ba8f'],
    ['M124 210L200 188L276 208Z', '#bf6b45'],
    ['M266 178L293 158L320 178Z', '#b5623e'],
    [ST_SHUTTERS, '#4f7b56'],
    [ARCH(192, 292, 28, 28) + 'Z', '#6b4b34'],
    ['M368 380H598L618 408H348Z', '#6cc3c8'],
    ['M378 385H594L598 391H374Z', '#9fdcdc'],
    [ST_TREES.join(''), '#557539'],
    [dots([[440, 310], [462, 322], [450, 334], [472, 306], [536, 296], [560, 306], [548, 314], [48, 316], [70, 330], [62, 306], [590, 342], [606, 348]], 3.4), '#f2cf48'],
  ],
  ink: [
    'M130 210V292H270', 'M270 292V178H316V292', 'M124 210L200 188L270 206', 'M266 178L293 158L320 178',
    ST_SHUTTERS, ARCH(192, 292, 28, 28),
    'M368 380H598L618 408H348Z', 'M392 396c12-4 24 4 36 0M500 398c12-4 24 4 36 0',
    ...ST_TREES,
    'M452 344V332M548 326V316M60 348V336M598 364V356',
  ],
};

/* The hero: a whitewashed wall the colour of the page, with an arched window
   onto the hills, a geranium on the sill and blue tiles beneath. 560 × 520. */
const HV_FAR = 'M0 314C90 300 180 310 270 302C360 294 450 306 560 298';
const HV_MID = 'M0 360C110 344 220 356 330 346C420 338 490 346 560 342';
const HV_NEAR = 'M0 410C140 396 280 404 420 396C480 392 530 394 560 392';
const HV_LEAVES = BLOB(388, 390, 30, 16);
const TILES = Array.from({ length: 7 }, (_, k) => 105 + k * 50);
const VIEW: Scene = {
  sky: [[0, '#e8b8a2'], [0.6, '#f6d6b4'], [1, '#fbe7c8']],
  back: [
    [C(300, 262, 26), '#fff2d8'],
    [R(0, 290, 560, 24), '#8eb6c2'],
    [fillTo(HV_FAR, 'V520H0Z'), '#c4a289'],
    [R(344, 296, 12, 10) + R(358, 292, 14, 14) + R(374, 298, 10, 8) + R(386, 294, 12, 12), '#fbf4ea'],
    [fillTo(HV_MID, 'V520H0Z'), '#b2a46c'],
    [fillTo(HV_NEAR, 'V520H0Z'), '#9c9a5a'],
  ],
  backInk: [
    'M0 290H560', HV_FAR, HV_MID, HV_NEAR,
    'M344 296l6-5l6 5M358 292l7-6l7 6M386 294l6-5l6 5',
    C(300, 262, 26), 'M220 170q7-6 14 0q7-6 14 0M262 150q5-4 10 0q5-4 10 0',
  ],
  paint: [
    [CYPRESS(196, 372, 110, 11), '#4e5f43'],
    [CYPRESS(216, 370, 80, 8), '#57694a'],
    [CYPRESS(392, 352, 64, 7), '#55674a'],
    ['M-20 -20H580V540H-20Z' + ARCH(124, 440, 312, 346) + 'Z', '#fbf7ef'],
    ['M124 440V250A156 156 0 0 1 436 250V440H420V252A140 140 0 0 0 140 252V440Z', '#efe5d4'],
    [R(104, 440, 352, 16), '#f1e8d8'],
    [R(112, 456, 336, 6), '#e2d6c1'],
    [TILES.map((x) => R(x, 470, 48, 48)).join(''), '#eef1f6'],
    [TILES.map((x) => `M${x + 24} 476l18 18l-18 18l-18-18Z`).join(''), '#3c6aa6'],
    [TILES.map((x) => C(x + 24, 494, 6)).join(''), '#eef1f6'],
    ['M368 440L362 408H414L408 440Z', '#c2643f'],
    [R(358, 402, 60, 8), '#b25a38'],
    [HV_LEAVES, '#6c8a4b'],
    [dots([[372, 380], [390, 372], [404, 384], [382, 392], [398, 396]], 5), '#d94a3c'],
  ],
  ink: [
    CYPRESS(196, 372, 110, 11), CYPRESS(216, 370, 80, 8), CYPRESS(392, 352, 64, 7),
    ARCH(124, 440, 312, 346), 'M140 440V252A140 140 0 0 1 420 252V440',
    'M104 440H456V456H104Z',
    'M368 440L362 408H414L408 440M358 402H418V410H358Z', HV_LEAVES,
    'M380 402C378 394 376 386 374 382M392 402V376M402 402C404 396 404 390 404 386',
    TILES.map((x) => R(x, 470, 48, 48)).join(''),
  ],
};

function Art({ id, scene, label, w = 640, h = 440 }: { id: string; scene: Scene; label: string; w?: number; h?: number }) {
  const fills = (ps: Paint[]) => ps.map(([d, fill, op], k) => <path key={k} d={d} fill={fill} fillOpacity={op} fillRule="evenodd" />);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid slice" role="img" aria-label={label}>
      <defs>
        <linearGradient id={`cv-sky-${id}`} x1="0" y1="0" x2="0" y2="1">
          {scene.sky.map(([o, c]) => <stop key={o} offset={o} stopColor={c} />)}
        </linearGradient>
      </defs>
      <rect width={w} height={h} fill={`url(#cv-sky-${id})`} />
      {fills(scene.back)}
      <g className="cv-ink">{scene.backInk.map((d, k) => <path key={k} d={d} />)}</g>
      {fills(scene.paint)}
      <g className="cv-ink">{scene.ink.map((d, k) => <path key={k} d={d} />)}</g>
    </svg>
  );
}

/* ── Content ──────────────────────────────────────────────────────────── */

const HOUSES = [
  {
    id: 'azinheira', name: 'Monte da Azinheira', region: 'Alentejo', country: 'Portugal', scene: AZINHEIRA,
    sleeps: 8, beds: 4, baths: 3, price: 420, rating: '4.97', reviews: 118, badge: 'Guest favourite',
    blurb: 'A whitewashed farmhouse in forty hectares of cork oak, twenty minutes from Évora. Long table under the vine, salt-water pool, walls a metre thick.',
    tags: ['Salt-water pool', 'Cork-oak estate', 'Wood stove'],
    art: 'Monte da Azinheira at dusk: a long whitewashed farmhouse with a blue base, a cork oak and a pool',
  },
  {
    id: 'vale-escuro', name: 'Quinta do Vale Escuro', region: 'Douro Valley', country: 'Portugal', scene: VALE_ESCURO,
    sleeps: 10, beds: 5, baths: 5, price: 560, rating: '4.95', reviews: 86, badge: 'Working vineyard',
    blurb: 'A granite wine quinta on the terraces above the Douro, with its own stone lagar, a vineyard walk and a jetty on the river below.',
    tags: ['Vineyard', 'River jetty', 'Wine tasting'],
    art: 'Quinta do Vale Escuro: a granite house on vineyard terraces above the river, with two cypresses',
  },
  {
    id: 'farol', name: 'Casa do Farol', region: 'Costa Vicentina', country: 'Portugal', scene: FAROL,
    sleeps: 4, beds: 2, baths: 2, price: 260, rating: '4.98', reviews: 203, badge: 'Guest favourite',
    blurb: 'A fisherman’s cottage on the cliffs at Carrapateira. The Rota Vicentina passes the gate and the surf beach is ten minutes down the path.',
    tags: ['Ocean view', 'Clifftop trail', 'Outdoor shower'],
    art: 'Casa do Farol: a small white cottage with blue trim on an ochre cliff above the Atlantic, a lighthouse on the far headland',
  },
  {
    id: 'can-oliu', name: 'Masia Can Oliu', region: 'Empordà', country: 'Spain', scene: CAN_OLIU,
    sleeps: 12, beds: 6, baths: 5, price: 690, rating: '4.96', reviews: 64, badge: 'Sleeps 12',
    blurb: 'An eighteenth-century stone masia among olive groves, half an hour from the coves of the Costa Brava. Arched porch, bread oven, pool on the old threshing floor.',
    tags: ['Olive grove', 'Bread oven', 'Pool'],
    art: 'Masia Can Oliu: a tall stone farmhouse with an arched porch among olive trees, the Pyrenees behind',
  },
  {
    id: 'almendros', name: 'Cortijo Los Almendros', region: 'Alpujarra, Granada', country: 'Spain', scene: ALMENDROS,
    sleeps: 6, beds: 3, baths: 2, price: 340, rating: '4.94', reviews: 97, badge: 'Walks from the door',
    blurb: 'A white Alpujarran cortijo under the Sierra Nevada. Almond blossom in February, snow on the peaks until May, mountain trails from the gate.',
    tags: ['Mountain views', 'Fireplace', 'Hiking'],
    art: 'Cortijo Los Almendros: white flat-roofed houses with mushroom chimneys, almond trees in blossom, snowy peaks behind',
  },
  {
    id: 'sa-tanca', name: 'Finca Sa Tanca', region: 'Sóller, Mallorca', country: 'Spain', scene: SA_TANCA,
    sleeps: 8, beds: 4, baths: 4, price: 610, rating: '4.97', reviews: 152, badge: 'Guest favourite',
    blurb: 'A honey-stone finca with a watchtower in an orange and lemon grove in the Tramuntana. The old tram to Port de Sóller stops at the end of the lane.',
    tags: ['Citrus grove', 'Heated pool', 'Sea glimpse'],
    art: 'Finca Sa Tanca at sunset: a stone farmhouse with a tower and green shutters, lemon trees, a pool and the sea between the mountains',
  },
];

const WHY = [
  { t: 'We’ve slept in every house', d: 'Forty-two houses, and one of us has spent at least three nights in each. If it isn’t on our list, we didn’t love it.', icon: 'M3 18V9M3 14h18v4M21 14v-1.5A3.5 3.5 0 0 0 17.5 9H11v5M7 9.5a1.75 1.75 0 1 0 .01 0' },
  { t: 'A host who lives nearby', d: 'Someone local meets you at the gate, fills the fridge if you ask and still answers the phone in August.', icon: 'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4.5 21c0-4 3.4-6.5 7.5-6.5s7.5 2.5 7.5 6.5' },
  { t: 'The price is the price', d: 'Cleaning, linen, the pool, tourist tax and your host are all in the nightly rate. Nothing is added at checkout.', icon: 'M3 12.5V4h8.5L21 13.5 13.5 21ZM7.5 8.5h.01' },
  { t: 'Change your mind until 30 days out', d: 'A full refund up to thirty days before you arrive, then a credit you can use at any of our houses for two years.', icon: 'M4 6h16v14H4ZM4 10h16M8 3v4M16 3v4M9 15l2 2 4-4' },
];

const REVIEWS = [
  { q: 'Exactly as described, down to the creak in the third stair. Ana left bread from the village bakery and a bottle of the neighbour’s red.', who: 'Hannah & Tom, London', where: 'Monte da Azinheira · July 2026' },
  { q: 'Twelve of us, booked six weeks out. They found the masia, a chef for the last night and a minibus from Girona airport.', who: 'Javier M., Madrid', where: 'Masia Can Oliu · June 2026' },
  { q: 'We woke to almond blossom and snow on the Sierra. The walk from the gate to Trevélez is now our favourite day of the year.', who: 'Claire D., Lyon', where: 'Cortijo Los Almendros · February 2026' },
];

const n = HOUSES.length;

function Icon({ d, size = 18 }: { d: string; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────── */

export function CasaverdeSite() {
  const [active, setActive] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  const hero = useRef<HTMLDivElement>(null);
  const snap = useRef<ScrollSnapInstance | null>(null);
  const want = useRef<number | null>(null); // where the arrows are heading mid-snap

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const slides = Array.from(el.querySelectorAll<HTMLElement>('.cv-slide'));

    // A painting's pen lines ink in once, the first time its house arrives.
    const draws: ScrollDrawInstance[] = [];
    const ink = (art: HTMLElement | null | undefined, delay = 0) => {
      if (!art || art.hasAttribute('data-inked')) return;
      draws.push(scrollDraw(art, { selector: '.cv-ink > path', autoplay: true, duration: 820, delay, stagger: 0.065, easing: 'ease-out', once: true }));
      art.setAttribute('data-inked', '');
    };
    ink(hero.current, 250);
    ink(slides[0].querySelector<HTMLElement>('[data-ink]'));

    const inst = scrollSnap(slides, {
      direction: 'horizontal',
      scrollContainer: el,
      duration: 700,
      easing: 'ease-in-out',
      threshold: 0.18,
      onSnap: (i) => {
        want.current = null;
        setActive(i);
        ink(slides[i].querySelector<HTMLElement>('[data-ink]'));
      },
    });
    snap.current = inst;

    // A resize moves every slide; settle back onto the current one.
    let t: ReturnType<typeof setTimeout> | undefined;
    const onResize = () => { clearTimeout(t); t = setTimeout(() => inst.snapTo(inst.getCurrentIndex()), 160); };
    window.addEventListener('resize', onResize);

    return () => {
      inst.destroy();
      draws.forEach((d) => d.destroy());
      window.removeEventListener('resize', onResize);
      clearTimeout(t);
      snap.current = null;
    };
  }, []);

  const go = (to: number) => {
    const s = snap.current;
    if (!s) return;
    want.current = Math.max(0, Math.min(n - 1, to));
    s.snapTo(want.current);
  };
  const step = (d: number) => go((want.current ?? snap.current?.getCurrentIndex() ?? active) + d);
  const h = HOUSES[active];

  return (
    <Site
      className="cv"
      brand={<><svg className="cv-mark" viewBox="0 0 28 28" aria-hidden="true"><path d="M4 25V12L14 4l10 8v13ZM10 25v-7a4 4 0 0 1 8 0v7" /></svg>Casa <em>Verde</em></>}
      links={['Houses', 'Regions', 'How it works', 'Journal']}
      cta="Plan my stay"
      example="scroll-snap"
      apis="scrollSnap · horizontal · onSnap"
      footnote="Holiday houses in Portugal & Spain · Lisbon and Barcelona"
    >
      <Hero
        kicker="Portugal & Spain · 42 country houses"
        title={<>Country houses, <em>chosen one by one</em></>}
        lede="Farmhouses, quintas and fincas we have visited, slept in and loved — each with a local host who meets you at the gate."
        art={<div className="cv-hero-art" ref={hero} data-ink><Art id="view" w={560} h={520} scene={VIEW} label="An arched window in a whitewashed wall, looking out over hills, cypresses and the sea at sunset" /></div>}
      />

      <div className="cv-find">
        <div className="cv-search" role="search" aria-label="Find a house">
          <button type="button" className="cv-field"><span className="cv-field-k"><Icon d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21ZM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" size={15} />Where</span><span className="cv-field-v">Anywhere in Portugal &amp; Spain</span></button>
          <button type="button" className="cv-field"><span className="cv-field-k">Arrive</span><span className="cv-field-v">Sat 7 Aug 2027</span></button>
          <button type="button" className="cv-field"><span className="cv-field-k">Leave</span><span className="cv-field-v">Sat 14 Aug 2027</span></button>
          <button type="button" className="cv-field"><span className="cv-field-k">Guests</span><span className="cv-field-v">6 adults · 2 children</span></button>
          <a className="cv-go" href="#houses"><Icon d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM20 20l-4-4" />Search</a>
        </div>
        <p className="cv-chips" aria-label="Popular filters"><span>Private pool</span><span>Sea view</span><span>Sleeps 10+</span><span>Dogs welcome</span><span>Walk to a village</span></p>
      </div>

      <Sec id="houses" kicker="Free in August · summer 2027" title={<>Six houses with <em>August</em> still open</>} lede="Swipe through, or use the arrows. Every price is per night for the whole house, with cleaning, linen and your host included.">
        <div className="cv-stage">
          <div className="cv-viewer">
            <div
              className="cv-track"
              ref={track}
              tabIndex={0}
              role="region"
              aria-roledescription="carousel"
              aria-label="Houses with August dates"
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
                if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
              }}
            >
              {HOUSES.map((x, i) => (
                <div key={x.id} className={`cv-slide${i === active ? ' is-active' : ''}`} role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${n}: ${x.name}`}>
                  <div className="cv-photo" data-ink>
                    <Art id={x.id} scene={x.scene} label={x.art} />
                    <span className="cv-badge">{x.badge}</span>
                    <button type="button" className="cv-heart" aria-label={`Save ${x.name}`}><Icon d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.4a4.3 4.3 0 0 1 7.5 2.4C19.5 15.4 12 20 12 20Z" /></button>
                    <span className="cv-where">{x.region} · {x.country}</span>
                  </div>
                </div>
              ))}
              <span className="cv-tail" aria-hidden="true" />
            </div>
            <div className="cv-bar">
              <div className="cv-dots">
                {HOUSES.map((x, i) => (
                  <button key={x.id} type="button" className={`cv-dot${i === active ? ' on' : ''}`} aria-label={`Show ${x.name}`} aria-current={i === active ? 'true' : undefined} onClick={() => go(i)} />
                ))}
              </div>
              <p className="cv-count" aria-live="polite"><b>{active + 1}</b> <span>/ {n}</span></p>
              <button type="button" className="cv-arrow" aria-label="Previous house" disabled={active === 0} onClick={() => step(-1)}><Icon d="M15 5l-7 7 7 7" size={20} /></button>
              <button type="button" className="cv-arrow" aria-label="Next house" disabled={active === n - 1} onClick={() => step(1)}><Icon d="M9 5l7 7-7 7" size={20} /></button>
            </div>
          </div>

          <aside className="cv-panel" aria-label="House details">
            <div className="cv-detail" key={h.id}>
              <p className="cv-region">{h.region}, {h.country}</p>
              <h3 className="cv-name">{h.name}</h3>
              <p className="cv-rating"><b>★ {h.rating}</b> · {h.reviews} reviews</p>
              <dl className="cv-facts">
                <div><dt>Sleeps</dt><dd>{h.sleeps}</dd></div>
                <div><dt>Bedrooms</dt><dd>{h.beds}</dd></div>
                <div><dt>Bathrooms</dt><dd>{h.baths}</dd></div>
              </dl>
              <p className="cv-blurb">{h.blurb}</p>
              <ul className="cv-tags">{h.tags.map((t) => <li key={t}>{t}</li>)}</ul>
              <div className="cv-book">
                <p className="cv-price"><b>€{h.price}</b> / night</p>
                <a className="sk-btn" href="#top">Check dates</a>
              </div>
              <p className="cv-terms">7 nights minimum in August · free cancellation to 30 days out</p>
            </div>
          </aside>
        </div>
      </Sec>

      <Sec tone="alt" kicker="Why stay with us" title="Fewer houses, known well">
        <div className="cv-why">
          {WHY.map((w) => (
            <article key={w.t}>
              <span className="cv-why-ico"><Icon d={w.icon} size={22} /></span>
              <h3>{w.t}</h3>
              <p>{w.d}</p>
            </article>
          ))}
        </div>
      </Sec>

      <Quote
        text="We’ve rented holiday houses for twenty summers. Casa Verde is the first company whose houses were better than the pictures."
        who={<><b>Marta &amp; Joaquim Ferreira</b> · four stays since 2023</>}
      />

      <Sec kicker="Reviews" title={<>4.96 from <em>2,140</em> stays</>}>
        <div className="cv-reviews">
          {REVIEWS.map((r) => (
            <article key={r.who} className="cv-review">
              <span className="cv-stars" aria-label="5 out of 5">★★★★★</span>
              <blockquote>{r.q}</blockquote>
              <footer><b>{r.who}</b>{r.where}</footer>
            </article>
          ))}
        </div>
      </Sec>

      <Sec tone="ink" center kicker="Summer 2027" title="August books up by March" lede="Tell us who’s coming and when. Within a day, a real person sends you three houses that fit, with honest notes on each.">
        <div className="cv-cta">
          <a className="sk-btn" href="#top">Plan my stay</a>
          <a className="sk-btn sk-btn-ghost" href="#houses">Browse all 42 houses</a>
        </div>
        <p className="cv-call">Or call us: +351 21 340 2710 · Lisbon &amp; Barcelona, 9:00–19:00</p>
      </Sec>
    </Site>
  );
}
