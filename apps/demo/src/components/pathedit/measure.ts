const SVG_NS = 'http://www.w3.org/2000/svg';

let probe: SVGPathElement | null = null;

/**
 * getTotalLength() of a d string, from one hidden path the page keeps (a
 * path's length needs no layout, only its d). Null on the server, or where
 * the browser cannot measure it.
 */
export function measureLength(d: string): number | null {
  if (typeof document === 'undefined') return null;
  if (!probe || !probe.isConnected) {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.style.cssText = 'position:absolute;left:0;top:0;width:0;height:0;overflow:hidden;visibility:hidden;pointer-events:none';
    probe = document.createElementNS(SVG_NS, 'path');
    svg.appendChild(probe);
    document.body.appendChild(svg);
  }
  probe.setAttribute('d', d);
  try {
    return probe.getTotalLength();
  } catch {
    return null;
  }
}
