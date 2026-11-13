/**
 * Frames out of a video, in the browser: a <video> sought to each time in
 * turn, drawn onto a canvas once it has `seeked`, and saved with toBlob. The
 * file never leaves the tab.
 *
 * Frame i of n is taken from the middle of the i-th n-th of the video, so the
 * set is evenly spaced and never asks for a time at or past the end (where
 * some files have no picture).
 */

export type ImageType = 'image/webp' | 'image/jpeg';

export type ExtractOptions = {
  count: number;
  /** The widest a frame may be; smaller videos keep their own width. */
  maxWidth: number;
  type: ImageType;
  /** 0 to 1, for toBlob. */
  quality: number;
  signal: AbortSignal;
  onProgress: (done: number, total: number) => void;
};

export type Extracted = { blobs: Blob[]; width: number; height: number; duration: number };

export class Cancelled extends Error {
  constructor() {
    super('Cancelled.');
    this.name = 'Cancelled';
  }
}

/** Waits for `type` on the video, or fails on its error, a timeout, or the signal. */
function event(v: HTMLVideoElement, type: string, signal: AbortSignal, ms = 15000): Promise<void> {
  return new Promise((ok, no) => {
    if (signal.aborted) return no(new Cancelled());
    const off = () => {
      clearTimeout(timer);
      v.removeEventListener(type, onOk);
      v.removeEventListener('error', onErr);
      signal.removeEventListener('abort', onAbort);
    };
    const onOk = () => { off(); ok(); };
    const onErr = () => {
      off();
      no(new Error(v.error?.code === 4
        ? 'This browser cannot decode that video: its codec or container is not supported here. Try an MP4 (H.264) or a WebM (VP9).'
        : 'The video could not be read.'));
    };
    const onAbort = () => { off(); no(new Cancelled()); };
    const timer = setTimeout(() => { off(); no(new Error('The video took too long to answer a seek.')); }, ms);
    v.addEventListener(type, onOk);
    v.addEventListener('error', onErr);
    signal.addEventListener('abort', onAbort);
  });
}

const toBlob = (c: HTMLCanvasElement, type: string, quality: number) =>
  new Promise<Blob>((ok, no) => c.toBlob((b) => (b ? ok(b) : no(new Error('The frame could not be saved.'))), type, quality));

/** Whether this browser's canvas can write `type` (Safari writes PNG when asked for WebP). */
export async function canEncode(type: ImageType): Promise<boolean> {
  const c = document.createElement('canvas');
  c.width = c.height = 2;
  const b = await new Promise<Blob | null>((ok) => c.toBlob(ok, type, 0.8));
  return b?.type === type;
}

export async function extractFrames(url: string, o: ExtractOptions): Promise<Extracted> {
  const v = document.createElement('video');
  v.muted = true;
  v.playsInline = true;
  v.preload = 'auto';
  v.src = url;
  try {
    if (v.readyState < 1) await event(v, 'loadedmetadata', o.signal);
    let duration = v.duration;
    // A recording straight from MediaRecorder has no duration in its header
    // (it reads Infinity) until the browser has been to the end: seek far.
    if (!Number.isFinite(duration)) {
      v.currentTime = 1e7;
      await event(v, 'seeked', o.signal);
      duration = v.duration;
      if (!Number.isFinite(duration)) throw new Error('This file does not say how long it is, so it has no times to take frames at. Re-encode it with ffmpeg first.');
    }
    if (!(duration > 0) || !v.videoWidth) throw new Error('This file has no pictures to take frames from.');

    const width = Math.min(o.maxWidth, v.videoWidth);
    const height = Math.max(1, Math.round((width * v.videoHeight) / v.videoWidth));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('This browser has no 2D canvas.');

    const blobs: Blob[] = [];
    o.onProgress(0, o.count);
    for (let i = 0; i < o.count; i++) {
      if (o.signal.aborted) throw new Cancelled();
      const seeked = event(v, 'seeked', o.signal);
      v.currentTime = ((i + 0.5) * duration) / o.count;
      await seeked;
      ctx.drawImage(v, 0, 0, width, height);
      blobs.push(await toBlob(canvas, o.type, o.quality));
      o.onProgress(i + 1, o.count);
    }
    return { blobs, width, height, duration };
  } finally {
    v.removeAttribute('src');
    v.load();
  }
}
