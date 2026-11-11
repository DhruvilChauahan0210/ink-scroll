/**
 * The generator's sample: a house on a hill, drawn for this page (no outside
 * artwork). It uses every shape the generator animates (path, line, polyline,
 * polygon, rect, circle, ellipse), two fills to fade in once their lines are
 * drawn, and one path of several pieces (the sun's rays).
 */
export const SAMPLE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
  <!-- the hill -->
  <path d="M6 136 C 44 116, 86 112, 122 120 S 198 138, 234 124"/>
  <!-- the house -->
  <rect x="74" y="78" width="58" height="42"/>
  <polygon points="66,82 103,50 140,82"/>
  <polyline points="118,63 118,50 128,50 128,72"/>
  <rect x="97" y="96" width="14" height="24" fill="currentColor"/>
  <rect x="81" y="88" width="10" height="10"/>
  <line x1="86" y1="88" x2="86" y2="98"/>
  <path d="M123 44 C 117 38, 129 34, 123 28 S 129 18, 123 12"/>
  <!-- the sun -->
  <circle cx="194" cy="38" r="12" fill="currentColor" fill-opacity="0.18"/>
  <path d="M194 18 V 12 M194 58 V 64 M174 38 H 168 M214 38 H 220"/>
  <!-- the tree -->
  <ellipse cx="172" cy="102" rx="14" ry="18"/>
  <line x1="172" y1="120" x2="172" y2="131"/>
  <!-- two birds -->
  <path d="M28 46 q 6 -6 12 0 q 6 -6 12 0"/>
  <path d="M52 30 q 4 -4 8 0 q 4 -4 8 0"/>
</svg>`;
