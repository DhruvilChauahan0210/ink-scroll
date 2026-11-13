#!/usr/bin/env node
/**
 * Minimal static server for the Playwright fixtures.
 *
 * Serves the package root so fixtures can import the real built bundle at
 * /dist/index.mjs — the same file published to npm. No dependencies, because
 * adding a server framework just to run tests is not worth the install.
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { deflateSync, crc32 } from 'node:zlib';
import { join, extname, normalize } from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.E2E_PORT ?? 4173);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.cjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.map': 'application/json; charset=utf-8',
};

/**
 * A frame for the scrollFrames suite, drawn on request rather than committed:
 * `/e2e/gen/frame.png?i=3&w=160&h=90`. Solid colour, its red channel the frame
 * index × 10, so a pixel read off the canvas names the frame on it; the left
 * and right `band` pixels (default 20) are black, so cover's crop and
 * contain's letterbox show in the geometry. `delay` holds the reply that many
 * ms; `fail=1` answers 404, a frame that never arrives.
 */
function framePng(params) {
  const i = Number(params.get('i') ?? 0);
  const w = Number(params.get('w') ?? 160);
  const h = Number(params.get('h') ?? 90);
  const band = Number(params.get('band') ?? 20);
  const row = Buffer.alloc(1 + w * 3);
  for (let x = 0; x < w; x++) {
    const inside = x >= band && x < w - band;
    row.set(inside ? [i * 10, 255 - i * 10, 64] : [0, 0, 0], 1 + x * 3);
  }
  const chunk = (type, data) => {
    const head = Buffer.alloc(8);
    head.writeUInt32BE(data.length, 0);
    head.write(type, 4, 'latin1');
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), data])) >>> 0, 0);
    return Buffer.concat([head, data, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr.set([8, 2, 0, 0, 0], 8); // 8-bit RGB, no interlace
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(Buffer.concat(Array.from({ length: h }, () => row)))),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://localhost:${PORT}`);

    if (url.pathname === '/e2e/gen/frame.png') {
      const delay = Number(url.searchParams.get('delay') ?? 0);
      if (delay) await new Promise((r) => setTimeout(r, delay));
      if (url.searchParams.get('fail')) {
        res.writeHead(404, { 'Cache-Control': 'no-store' }).end('Not found');
        return;
      }
      const body = framePng(url.searchParams);
      res.writeHead(200, { 'Content-Type': 'image/png', 'Content-Length': body.length, 'Cache-Control': 'no-store' });
      res.end(body);
      return;
    }
    // normalize() collapses ../ so requests cannot escape the package root.
    const rel = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '');
    const path = join(ROOT, rel);

    if (!path.startsWith(ROOT)) {
      res.writeHead(403).end('Forbidden');
      return;
    }

    const body = await readFile(path);
    const type = TYPES[extname(path)] ?? 'application/octet-stream';

    /*
     * Range support exists for one reason: <video> seeking.
     *
     * Without `Accept-Ranges` and 206 replies, Chromium reports the media as
     * non-seekable — `video.seekable` stays empty and every assignment to
     * `currentTime` is silently ignored. That made the whole scrollVideo suite
     * read as "the library never scrubs", when in fact the library was writing
     * the right values and the server was refusing to let the decoder move. A
     * fixture server that cannot serve media honestly produces exactly the kind
     * of false negative this phase is supposed to eliminate.
     */
    const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? '');
    if (range) {
      const start = range[1] === '' ? Math.max(0, body.length - Number(range[2])) : Number(range[1]);
      const end = range[1] === '' || range[2] === '' ? body.length - 1 : Number(range[2]);

      if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= body.length) {
        res.writeHead(416, { 'Content-Range': `bytes */${body.length}` }).end();
        return;
      }

      const slice = body.subarray(start, end + 1);
      res.writeHead(206, {
        'Content-Type': type,
        'Content-Range': `bytes ${start}-${end}/${body.length}`,
        'Content-Length': slice.length,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'no-store',
      });
      res.end(slice);
      return;
    }

    res.writeHead(200, {
      'Content-Type': type,
      'Content-Length': body.length,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-store',
    });
    res.end(body);
  } catch {
    res.writeHead(404).end('Not found');
  }
}).listen(PORT, () => {
  console.log(`e2e static server on http://localhost:${PORT}`);
});
