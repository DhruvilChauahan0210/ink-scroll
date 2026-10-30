/*
 * Shared markup for the vivus parity fixtures. vivus-real.html runs vivus 0.4.6
 * itself (copied into build/ by build-fixtures.mjs); vivus-ours.html and
 * vivus-cdn.html run svg-scroll-draw's drop-in on the same SVGs and options.
 */
const SHAPES = `
  <path d="M10 80 C 40 10, 65 10, 95 80 S 150 150, 180 80" data-start="0" data-duration="40" data-delay="5"/>
  <path d="M10 140 L 190 140" data-start="20" data-duration="30" data-async=""/>
  <path d="M20 20 Q 100 0 180 20" data-ignore="true"/>
  <rect x="20" y="160" width="60" height="30"/>
  <rect x="100" y="160" width="70" height="30" rx="8"/>
  <circle cx="40" cy="230" r="18"/>
  <ellipse cx="120" cy="230" rx="40" ry="14"/>
  <line x1="10" y1="270" x2="190" y2="290"/>
  <polyline points="10 300 60 320 110 300 160 320"/>
  <polygon points="20,340 60,370 100,340 60,330"/>`;

const CONFIGS = [
  { type: 'delayed' },
  { type: 'sync' },
  { type: 'oneByOne' },
  { type: 'scenario' },
  { type: 'scenario-sync' },
  { type: 'delayed', reverseStack: true, dashGap: 5 },
  { type: 'oneByOne', pathTimingFunction: 'EASE', animTimingFunction: 'EASE_OUT_BOUNCE' },
  { type: 'delayed', duration: 90, delay: 30, animTimingFunction: 'EASE_IN' },
  { type: 'sync', duration: 60, pathTimingFunction: 'EASE_OUT' },
];

document.body.insertAdjacentHTML(
  'beforeend',
  CONFIGS.map(
    (_, i) =>
      `<svg id="v${i}" viewBox="0 0 200 400" width="200" height="400" fill="none" stroke="black" stroke-width="3">${SHAPES}</svg>`,
  ).join('') +
    '<div style="height:1600px"></div>' +
    `<svg id="late" viewBox="0 0 200 400" width="200" height="400" fill="none" stroke="black">${SHAPES}</svg>` +
    '<div style="height:600px"></div>',
);

/** Build every instance the same way, against whichever Vivus the page loaded. */
window.__plan = (Vivus, start = 'manual') => {
  window.__done = {};
  const instances = CONFIGS.map((cfg, i) => {
    const opts = { ...cfg, start };
    for (const key of ['pathTimingFunction', 'animTimingFunction']) {
      if (cfg[key]) opts[key] = Vivus[cfg[key]];
    }
    window.__done[`v${i}`] = 0;
    return new Vivus(`v${i}`, opts, () => { window.__done[`v${i}`]++; });
  });
  window.__late = new Vivus('late', { duration: 30 });
  window.__vivus = instances;
  return instances;
};

window.__probe = {
  /** Every SVG's markup: the generated paths, their d strings and dash styles. */
  read: () => Object.fromEntries([...document.querySelectorAll('svg')].map((s) => [s.id, s.innerHTML])),
  /** vivus's own numbers: frame length, delay unit and each path's timing. */
  model: () =>
    window.__vivus.map((v) => ({
      frameLength: v.frameLength,
      delayUnit: v.delayUnit,
      map: v.map.map((p) => [p.length, p.startAt, p.duration]),
    })),
  seek: (p) => window.__vivus.forEach((v) => v.setFrameProgress(p)),
  status: () => ({ all: window.__vivus.map((v) => v.getStatus()), late: window.__late.getStatus() }),
  play: (speed) => window.__vivus.forEach((v) => v.play(speed)),
  done: () => window.__done,
  destroy: () => window.__vivus.forEach((v) => v.destroy()),
};
