/**
 * The converter's sample: a camera, drawn for this page (no outside artwork),
 * out of every shape the converter handles: a rounded rect with rx only, a
 * small one whose ry has to be clamped, a square one, a polygon, an ellipse,
 * a line, a polyline, two circles, and one path that is kept as it is.
 */
export const SAMPLE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
  <!-- body -->
  <rect x="20" y="40" width="200" height="104" rx="16"/>
  <polygon points="84,40 98,22 142,22 156,40"/>
  <ellipse cx="52" cy="35" rx="13" ry="5"/>
  <line x1="62" y1="40" x2="62" y2="144"/>
  <polyline points="30,56 46,64 30,72 46,80 30,88 46,96 30,104 46,112 30,120 46,128"/>
  <!-- lens -->
  <circle id="lens" cx="120" cy="92" r="36"/>
  <circle cx="120" cy="92" r="22"/>
  <path d="M106 84 A15 15 0 0 1 120 76"/>
  <!-- flash and plate -->
  <rect class="flash" x="176" y="52" width="28" height="16" rx="10"/>
  <rect x="166" y="124" width="40" height="10"/>
</svg>`;
