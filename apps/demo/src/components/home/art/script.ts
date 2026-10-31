/**
 * The hero's hand-lettered "draw": one continuous monoline cursive stroke,
 * written the way a pen writes it so it can be drawn live with a nib.
 *
 * One subpath: a single M and 42 absolute cubic C segments, about 3520
 * user units long. Render with fill none, round caps and round joins, and never
 * vector-effect: non-scaling-stroke (it breaks the dash maths).
 *
 * Letters are slanted 14 degrees. The baseline is y 348, the x-line about y 213
 * and the d ascender reaches y 72, so the word is centred in the 1000 x 420 box.
 *
 * Writing order: an S lead-in kisses the top of the d bowl, then goes over the
 * top to the stem and back. The bowl runs counter-clockwise and up the stem
 * line, then branches into the ascender loop. A dead-straight downstroke returns
 * exactly over the bowl's right side to the foot. Then come the looped r, the a
 * (built like the d, with a short straight retrace at the stem top) and the w
 * (two pointed valleys and an eyelet), and the exit rises to the upper right.
 * The retraces sit exactly on existing ink, so the static word shows a single
 * line there while the nib visibly travels back over it.
 */
export const SCRIPT_DRAW = {
  d: 'M60.6 342C87 333.2 109 312.3 127.5 290C149.1 263.9 173.2 238.9 202.5 222C235.1 203.1 271.5 206.2 292 228C271.5 206.2 235.1 203.1 202.5 222C180.4 234.7 165.7 257.1 160 280C151 316.2 168.4 348 203.1 348C236.2 348 269.1 319.7 277.5 286C283.5 262 289.5 238 295.5 214C319.8 186.2 340.1 154.7 345.4 122C348.9 100.6 365 72 343.9 72C318.8 72 322.4 105.8 315.9 132C299.8 196.7 283.7 261.3 267.5 326C264.7 337.5 269.3 348 280.1 348C336.6 348 343 271.4 367.5 214C373.3 200.2 377.9 185 366.7 185C356.6 185 346.6 193.6 343 204C339 215.1 341.7 226 351.5 226C364.6 226 377.5 213.9 390.7 213C402 212.2 404.1 224.6 405 236C407.2 264.9 393.1 295.7 385.5 326C382.7 337.3 386.6 348 397.1 348C422.8 348 423.7 312.6 437.5 290C453.9 263.3 474.9 237.9 502.5 222C535.9 202.7 573 205.7 594 228C573 205.7 535.9 202.7 502.5 222C480.4 234.7 465.7 257.1 460 280C450.9 316.5 469.7 348 505.1 348C538.2 348 571.1 319.7 579.5 286C585.7 261.3 591.8 236.7 598 212C588.5 250 579 288 569.5 326C566.7 337.5 571.3 348 582.1 348C637.6 348 645.6 273 668.2 215C654.9 249.1 653.1 283.6 644.5 318C640.6 333.7 647.3 348 662.1 348C716.5 348 713.9 274 735 220C722.3 252.5 720.7 285.2 712.5 318C708.6 333.7 715.3 348 730.1 348C784.5 348 781.9 274 803 220C807 209.6 810 198 801.5 198C793.8 198 786.2 204.3 784 212C781.7 219.9 784.9 227.3 792.2 227C842.2 225.3 893.5 201.9 939.4 170',
  viewBox: '0 0 1000 420',
  strokeWidth: 9,
} as const;
