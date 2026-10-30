/*
 * Shared markup for the AOS parity fixtures. aos-real.html runs AOS 2.3.4 itself
 * on it, aos-ours.html and aos-cdn.html run svg-scroll-draw's drop-in, so the
 * spec can compare the two at the same scroll offsets on the same layout.
 *
 * Options arrive as JSON in ?opts=, so one spec can run several configurations.
 */
window.__aosOptions = JSON.parse(new URLSearchParams(location.search).get('opts') || '{}');

const SPECS = [
  ['fade-up', { 'data-aos': 'fade-up' }],
  ['zoom-offset', { 'data-aos': 'zoom-in', 'data-aos-offset': '300' }],
  ['center-center', { 'data-aos': 'fade', 'data-aos-anchor-placement': 'center-center' }],
  ['bottom-bottom', { 'data-aos': 'flip-left', 'data-aos-anchor-placement': 'bottom-bottom' }],
  ['top-center', { 'data-aos': 'slide-up', 'data-aos-anchor-placement': 'top-center' }],
  ['center-top', { 'data-aos': 'fade-left', 'data-aos-anchor-placement': 'center-top' }],
  ['bad-offset', { 'data-aos': 'fade', 'data-aos-offset': 'abc' }],
  ['once', { 'data-aos': 'zoom-out', 'data-aos-once': 'true' }],
  ['once-empty', { 'data-aos': 'fade-down', 'data-aos-once': '' }],
  ['not-once', { 'data-aos': 'fade-right', 'data-aos-once': 'false' }],
  ['anchored', { 'data-aos': 'fade', 'data-aos-anchor': '#trigger' }],
  ['bottom-top', { 'data-aos': 'zoom-in-up', 'data-aos-anchor-placement': 'bottom-top' }],
  ['custom', { 'data-aos': 'my-custom' }],
];

document.body.insertAdjacentHTML('beforeend', '<div style="height:900px"></div>');
for (const [id, attrs] of SPECS) {
  const el = document.createElement('div');
  el.id = id;
  el.className = 'box';
  el.textContent = id;
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  document.body.appendChild(el);
}
document.body.insertAdjacentHTML('beforeend', '<div id="trigger" class="box">trigger</div><div style="height:1200px"></div>');

window.__probe = {
  /** Which elements are animated in, keyed by id. */
  read: () => Object.fromEntries(SPECS.map(([id]) => [id, document.getElementById(id).classList.contains('aos-animate')])),
  /** Settled computed styles, for comparing what the reader actually sees. */
  styles: () =>
    Object.fromEntries(
      SPECS.map(([id]) => {
        const cs = getComputedStyle(document.getElementById(id));
        return [id, { opacity: cs.opacity, transform: cs.transform, visibility: cs.visibility }];
      }),
    ),
  max: () => document.documentElement.scrollHeight - innerHeight,
};
