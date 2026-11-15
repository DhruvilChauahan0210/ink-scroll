import { scrollDraw } from 'svg-scroll-draw';
import { harmonograph } from './harmonograph.js';

const svg = document.querySelector('#art');
const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
path.setAttribute('d', harmonograph(34));
svg.append(path);

// One line: it draws as the drawing rises, and is done when its
// centre reaches the middle of the screen.
scrollDraw(svg, { easing: 'linear', trigger: { start: 'center 115%', end: 'center 50%' } });
