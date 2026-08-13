#!/usr/bin/env node
/**
 * Regenerate `e2e/fixtures/clip.webm`, the scrub target for the scrollVideo tests.
 *
 * The generated file is committed, so nobody needs to run this to run the tests —
 * it exists so the fixture is reproducible rather than a mystery binary.
 *
 *   node scripts/make-fixture-video.mjs
 *
 * Design notes, all of which the video spec depends on:
 *
 * - **Every frame is a solid, unique colour.** Encoding the frame index into the
 *   pixels lets the spec assert that the browser actually PAINTED the frame for a
 *   given `currentTime`, instead of only trusting the `currentTime` number the
 *   library wrote. A scrub that sets the property but never repaints looks
 *   identical from JS otherwise.
 * - **`-g 1` makes every frame a keyframe**, so a seek lands on the exact frame
 *   rather than the previous keyframe. Without it, seek accuracy depends on the
 *   GOP layout and the assertions get fuzzy for no good reason.
 * - **VP8 in WebM** is the only codec Playwright's bundled ffmpeg can encode
 *   (it ships purely to record test videos), and requiring a system ffmpeg just
 *   to regenerate a 4-second clip is a worse trade.
 * - **Frames are JPEGs encoded by a headless canvas.** That bundled ffmpeg can
 *   only *decode* MJPEG, and the one image encoder already guaranteed to be
 *   installed here is the browser Playwright downloads. It keeps the generator
 *   dependency-free instead of reaching for a system `sips`/ImageMagick.
 */
import { spawn } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'e2e/fixtures/clip.webm');

const WIDTH = 160;
const HEIGHT = 120;
const FPS = 10;
const SECONDS = 4;
const FRAMES = FPS * SECONDS;

/** Frame i's colour. Distinct per frame and easy to invert into an index. */
export function frameColour(i) {
  return [(i * 6) % 256, (i * 6) % 256, (i * 6) % 256];
}

/** Encode every frame as a solid-colour JPEG, using a headless canvas. */
async function renderFrames() {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const dataUrls = await page.evaluate(
      ({ w, h, frames }) => {
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        const out = [];
        for (let i = 0; i < frames; i++) {
          const v = (i * 6) % 256;
          ctx.fillStyle = `rgb(${v},${v},${v})`;
          ctx.fillRect(0, 0, w, h);
          // Quality 1: a solid fill compresses to almost nothing anyway, and
          // lossless-as-possible keeps the decoded grey close to the authored one
          // so the spec can map a painted pixel back to a frame index.
          out.push(canvas.toDataURL('image/jpeg', 1).split(',')[1]);
        }
        return out;
      },
      { w: WIDTH, h: HEIGHT, frames: FRAMES },
    );
    return dataUrls.map((b64) => Buffer.from(b64, 'base64'));
  } finally {
    await browser.close();
  }
}

function findPlaywrightFfmpeg() {
  const base = join(homedir(), 'Library/Caches/ms-playwright');
  const linux = join(homedir(), '.cache/ms-playwright');
  for (const dir of [base, linux]) {
    if (!existsSync(dir)) continue;
    const pack = readdirSync(dir).find((d) => d.startsWith('ffmpeg-'));
    if (!pack) continue;
    const packDir = join(dir, pack);
    const bin = readdirSync(packDir).find((f) => f.startsWith('ffmpeg-'));
    if (bin) return join(packDir, bin);
  }
  return null;
}

const ffmpeg = process.env.FFMPEG ?? findPlaywrightFfmpeg();
if (!ffmpeg) {
  console.error(
    'No ffmpeg found. Install Playwright browsers (npx playwright install) or set FFMPEG=/path/to/ffmpeg.',
  );
  process.exit(1);
}

const frames = await renderFrames();

const proc = spawn(
  ffmpeg,
  [
    '-y', '-hide_banner', '-loglevel', 'error',
    // -vcodec is not optional: this ffmpeg has no image2pipe probe for JPEG, so
    // without it the input is detected as having no streams at all.
    '-f', 'image2pipe', '-vcodec', 'mjpeg', '-framerate', String(FPS), '-i', 'pipe:0',
    '-c:v', 'libvpx', '-b:v', '150k',
    '-g', '1', // every frame a keyframe, so seeks are exact
    '-pix_fmt', 'yuv420p',
    OUT,
  ],
  { stdio: ['pipe', 'inherit', 'inherit'] },
);

const done = new Promise((resolve, reject) => {
  proc.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}`))));
  proc.on('error', reject);
});

for (const frame of frames) proc.stdin.write(frame);
proc.stdin.end();

await done;
const { size } = statSync(OUT);
console.log(
  `Wrote ${OUT} — ${FRAMES} frames, ${SECONDS}s at ${FPS}fps, ${WIDTH}x${HEIGHT}, ${size} bytes`,
);
