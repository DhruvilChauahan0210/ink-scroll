/**
 * The dash that draws a line of length `len`: the line, then a gap twice as
 * long. Every offset the engines write is in [0, len], so the gap covers the
 * whole path whenever it is undrawn. An equal gap (`len len`, what this wrote
 * before 2.26.0) puts the start of the next dash on the path's end at offset
 * `len`, and WebKit, whose own measure of a diagonal line or a closed outline
 * can run a hair past `len`, painted it: a round or square cap showed as a dot
 * on paths not drawn yet. A gap of 2 * len leaves room for any such error.
 */
export function dashFor(len: number): string {
  return `${len} ${len * 2}`;
}
