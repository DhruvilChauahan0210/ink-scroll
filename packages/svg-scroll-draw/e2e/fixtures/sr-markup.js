/*
 * Shared markup and reveal plan for the ScrollReveal parity fixtures.
 * sr-real.html runs ScrollReveal 4.0.9 itself (copied into build/ by
 * build-fixtures.mjs), sr-ours.html and sr-cdn.html run svg-scroll-draw's
 * drop-in, so the spec can compare them stop by stop on the same layout.
 */
const IDS = [];
function box(id, cls, extra = '') {
  IDS.push(id);
  return `<div id="${id}" class="box ${cls}" ${extra}>${id}</div>`;
}

document.body.insertAdjacentHTML(
  'beforeend',
  '<div style="height:900px"></div>' +
    box('a1', 'a') + box('a2', 'a') +
    box('b1', 'b', 'style="color: rgb(200, 0, 0); transition: color 1s ease 0s"') +
    box('c1', 'c') + box('c2', 'c') +
    '<div class="row">' + box('d1', 'd') + box('d2', 'd') + box('d3', 'd') + box('d4', 'd') + '</div>' +
    box('e1', 'e') +
    box('f1', 'f') +
    box('g1', 'g') +
    '<div style="height:1400px"></div>',
);

window.__events = Object.fromEntries(IDS.map((id) => [id, []]));
const record = (name) => (el) => window.__events[el.id].push(name);
const callbacks = {
  beforeReveal: record('beforeReveal'),
  afterReveal: record('afterReveal'),
  beforeReset: record('beforeReset'),
  afterReset: record('afterReset'),
};

/** The same calls, in the same order, against whichever ScrollReveal the page loaded. */
window.__plan = (ScrollReveal) => {
  const sr = ScrollReveal({ duration: 300, ...callbacks });
  sr.reveal('.a', { distance: '40px', origin: 'bottom' });
  sr.reveal('.b', { opacity: 0.2, scale: 0.85, rotate: { x: 20, z: 10 }, duration: 400, delay: 150 });
  sr.reveal('.c', { distance: '2em', origin: 'left', reset: true });
  sr.reveal('.d', { distance: '20px', interval: 60, reset: true });
  sr.reveal('#e1', { viewFactor: 0.5, viewOffset: { top: 50, bottom: 100 }, distance: '10%', origin: 'right' });
  sr.reveal('#f1', { useDelay: 'once', reset: true, delay: 200, distance: '12.25px', origin: 'top' });
  sr.reveal('#g1', { scale: 0, cleanup: true, duration: 200 });
  return sr;
};

window.__probe = {
  /** Every inline style and id, exactly as the browser serialises them. */
  read: () =>
    Object.fromEntries(
      IDS.map((id) => {
        const el = document.getElementById(id);
        return [id, { style: el.getAttribute('style'), srId: el.getAttribute('data-sr-id') }];
      }),
    ),
  events: () => window.__events,
  root: () => ({ sr: document.documentElement.classList.contains('sr'), bodyHeight: document.body.style.height }),
  max: () => document.documentElement.scrollHeight - innerHeight,
};
