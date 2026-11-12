/**
 * The length a dash on `el` is measured in. With a `pathLength` the browser
 * reads stroke-dasharray and stroke-dashoffset in its units, not user units,
 * so that is the length: measured on 2.23.3, a 280-unit line with
 * pathLength="1" was given a 280 dash and was drawn whole by seek(0.004).
 */
export function getElementLength(el: SVGElement): number {
  const declared = parseFloat(el.getAttribute('pathLength') ?? '');
  if (declared > 0) return declared;
  const tag = el.tagName.toLowerCase();
  if (tag === 'rect') {
    const w = parseFloat(el.getAttribute('width') ?? '0');
    const h = parseFloat(el.getAttribute('height') ?? '0');
    return 2 * (w + h);
  }
  if (tag === 'circle') {
    const r = parseFloat(el.getAttribute('r') ?? '0');
    return 2 * Math.PI * r;
  }
  return (el as SVGGeometryElement).getTotalLength();
}
