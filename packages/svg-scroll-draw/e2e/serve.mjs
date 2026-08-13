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

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://localhost:${PORT}`);
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
