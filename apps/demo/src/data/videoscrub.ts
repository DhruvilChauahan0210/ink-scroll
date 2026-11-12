/**
 * Measured facts for /scroll-video-scrub-generator. Nothing here is typed from
 * memory: each figure says how it was read, so it can be read again.
 *
 * Client-safe: plain data, no Node APIs.
 */

/**
 * The film the tool previews by default: the Aural showcase's, the same file
 * the scroll-video recipe and the /blocks page scrub. Read with ffmpeg 9.0:
 * `ffmpeg -i aural-fdc4222c.webm` for the stream, and
 * `ffmpeg -i aural-fdc4222c.webm -vf showinfo -f null -` for the frames
 * (162 lines, `iskey:1` on every third one, pts 0, 0.1, 0.2 … 5.3).
 */
export const FILM = {
  /** Served from apps/demo/public. */
  src: '/showcase/aural-fdc4222c.webm',
  /** What the generated code calls it. */
  file: 'film.webm',
  label: 'Headphones turning, then taken apart',
  codec: 'VP8',
  container: 'WebM',
  width: 1120,
  height: 840,
  fps: 30,
  frames: 162,
  /** Seconds. */
  duration: 5.4,
  /** A keyframe every this many frames. */
  keyEvery: 3,
  keyframes: 54,
  /** Bytes on disk. */
  bytes: 1667474,
  /**
   * Where the scrub stops: colourway stills follow the film in the same file,
   * so the recipe (recipes.tsx, FilmScrub `to={4.98}`) and /blocks stop here.
   */
  to: 4.98,
} as const;

/** What the seek timings below were measured in. */
export const MEASURED = {
  date: '2026-11-12',
  ffmpeg: '9.0',
  playwright: '1.65.0',
  browsers: { chromium: 'Chromium 158', firefox: 'Firefox 159', webkit: 'WebKit 27.2' },
  machine: 'an Apple-silicon Mac',
  /**
   * The method: the film served with Range support, the whole file buffered
   * first (what preload="auto" aims for), then a seek to the middle of every
   * frame, last to first and back again, each one timed from setting
   * currentTime to the `seeked` event. Two runs per browser; the median is
   * the middle of the runs' medians, p95 the higher of their 95th percentiles.
   */
  method: 'every frame, backwards then forwards, two runs',
} as const;

export type Encode = {
  codec: 'VP8' | 'VP9' | 'H.264';
  /** The -g value; null when it was left out (the encoder's default). */
  g: number | null;
  /** Keyframes of the 162 frames, counted with -vf showinfo. */
  keyframes: number;
  bytes: number;
  /** [median, p95] seek time in ms. */
  chromium: [number, number];
  firefox: [number, number];
  webkit: [number, number];
};

/**
 * The site's film re-encoded from its own WebM with only -g changed, then
 * timed as MEASURED says. VP8 is the file itself (the recipe's command).
 * VP9: -an -c:v libvpx-vp9 -b:v 0 -crf 32 -g N -row-mt 1.
 * H.264: -an -c:v libx264 -preset slow -crf 20 -g N -pix_fmt yuv420p -movflags +faststart.
 */
export const ENCODES: Encode[] = [
  { codec: 'VP8', g: 3, keyframes: 54, bytes: 1667474, chromium: [8, 11], firefox: [4, 5], webkit: [6, 12] },
  { codec: 'VP9', g: 1, keyframes: 162, bytes: 2991797, chromium: [6, 7], firefox: [3, 5], webkit: [2, 4] },
  { codec: 'VP9', g: 3, keyframes: 54, bytes: 1139182, chromium: [4, 6], firefox: [4, 5], webkit: [3, 4] },
  { codec: 'VP9', g: 15, keyframes: 11, bytes: 502756, chromium: [6, 13], firefox: [7, 10], webkit: [7, 17] },
  { codec: 'VP9', g: null, keyframes: 2, bytes: 392429, chromium: [26, 72], firefox: [25, 58], webkit: [34, 116] },
  { codec: 'H.264', g: 1, keyframes: 162, bytes: 2122470, chromium: [5, 7], firefox: [3, 4], webkit: [1, 2] },
  { codec: 'H.264', g: 3, keyframes: 54, bytes: 977390, chromium: [6, 18], firefox: [3, 7], webkit: [1, 2] },
  { codec: 'H.264', g: 15, keyframes: 12, bytes: 586632, chromium: [7, 11], firefox: [4, 6], webkit: [1, 3] },
  { codec: 'H.264', g: null, keyframes: 2, bytes: 498664, chromium: [37, 79], firefox: [18, 35], webkit: [2, 24] },
];
