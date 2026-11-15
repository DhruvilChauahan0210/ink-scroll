import { scrollDraw } from 'svg-scroll-draw';
import { flowField } from './flow-field.js';

// Each path draws across the whole trigger, and `stagger` starts each one a
// little later, so the last one ends `spread` ranges after trigger.end.
// Measure both ends from the element's centre and solve for the end, so the
// last stroke lands as the centre reaches `to`.
function scrollWindow(spread, from = 1.15, to = 0.5) {
  const end = (to + spread * from) / (1 + spread);
  const pct = (v) => `${(v * 100).toFixed(1)}%`;
  return { start: `center ${pct(from)}`, end: `center ${pct(end)}` };
}

const svg = document.querySelector('#art');
// Top to bottom, as a plotter travels.
const lines = flowField().sort((a, b) => Math.min(a[0][1], a.at(-1)[1]) - Math.min(b[0][1], b.at(-1)[1]));
for (const line of lines) {
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  // Every third point is plenty at this scale, and a third of the markup.
  const pts = line.filter((_, i) => i % 3 === 0 || i === line.length - 1);
  path.setAttribute('d', 'M' + pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L'));
  svg.append(path);
}

const spread = 1; // the last line starts one range after the first
scrollDraw(svg, { easing: 'linear', stagger: spread / (lines.length - 1), trigger: scrollWindow(spread) });
