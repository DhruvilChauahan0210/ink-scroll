/**
 * A ZIP archive with every file stored as it is (method 0, no compression):
 * WebP and JPEG frames are compressed already, so deflating them again would
 * cost time for a few bytes. Enough of PKWARE's APPNOTE for that: a local
 * header before each file, a central directory, and the end record. No ZIP64,
 * so at most 65,535 files and 4 GB, far beyond a frame set.
 *
 * Client-safe, no dependencies. The archive is a Blob built from the frames'
 * own Blobs, so the frames are read once (for their CRC-32) and not copied.
 */

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

/** CRC-32 (the ZIP and PNG one, polynomial 0xEDB88320). */
export function crc32(data: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** MS-DOS time and date, as ZIP stores them: two-second steps, years from 1980. */
function dosTime(d: Date): { time: number; date: number } {
  const year = Math.max(1980, d.getFullYear());
  return {
    time: (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1),
    date: ((year - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(),
  };
}

export type ZipEntry = { name: string; data: Blob };

const UTF8_FLAG = 0x0800;

/** The archive of `entries`, in order, as one Blob. */
export async function zipStore(entries: ZipEntry[], when = new Date()): Promise<Blob> {
  if (entries.length > 0xffff) throw new Error('A ZIP without ZIP64 holds at most 65,535 files.');
  const enc = new TextEncoder();
  const { time, date } = dosTime(when);
  const parts: BlobPart[] = [];
  const central: Uint8Array<ArrayBuffer>[] = [];
  let offset = 0;

  for (const e of entries) {
    const name = enc.encode(e.name);
    const bytes = new Uint8Array(await e.data.arrayBuffer());
    const crc = crc32(bytes);
    const size = bytes.length;
    if (offset + 30 + name.length + size > 0xffffffff) throw new Error('A ZIP without ZIP64 holds at most 4 GB.');

    const local = new Uint8Array(30 + name.length);
    const l = new DataView(local.buffer);
    l.setUint32(0, 0x04034b50, true);   // local file header
    l.setUint16(4, 20, true);           // version needed: 2.0
    l.setUint16(6, UTF8_FLAG, true);
    l.setUint16(8, 0, true);            // stored
    l.setUint16(10, time, true);
    l.setUint16(12, date, true);
    l.setUint32(14, crc, true);
    l.setUint32(18, size, true);        // compressed size
    l.setUint32(22, size, true);        // uncompressed size
    l.setUint16(26, name.length, true);
    l.setUint16(28, 0, true);           // no extra field
    local.set(name, 30);

    const cd = new Uint8Array(46 + name.length);
    const c = new DataView(cd.buffer);
    c.setUint32(0, 0x02014b50, true);   // central directory header
    c.setUint16(4, 20, true);           // made by: 2.0, MS-DOS attributes
    c.setUint16(6, 20, true);
    c.setUint16(8, UTF8_FLAG, true);
    c.setUint16(10, 0, true);
    c.setUint16(12, time, true);
    c.setUint16(14, date, true);
    c.setUint32(16, crc, true);
    c.setUint32(20, size, true);
    c.setUint32(24, size, true);
    c.setUint16(28, name.length, true);
    // extra, comment, disk, internal and external attributes: all 0
    c.setUint32(42, offset, true);      // where its local header is
    cd.set(name, 46);

    parts.push(local, e.data);
    central.push(cd);
    offset += local.length + size;
  }

  const cdSize = central.reduce((n, b) => n + b.length, 0);
  const end = new Uint8Array(22);
  const v = new DataView(end.buffer);
  v.setUint32(0, 0x06054b50, true);     // end of central directory
  v.setUint16(8, entries.length, true); // entries on this disk
  v.setUint16(10, entries.length, true);
  v.setUint32(12, cdSize, true);
  v.setUint32(16, offset, true);        // where the directory starts

  return new Blob([...parts, ...central, end], { type: 'application/zip' });
}
