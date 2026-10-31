/**
 * The drop-ins' React hooks, mounted for real with react-dom in StrictMode —
 * the double mount that breaks hand-written `AOS.init()` / `new Vivus()`
 * effects — plus a state-driven "route change" between two pages.
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { AOSInit } from '../../dist/aos/react/index.mjs';
import { useScrollReveal } from '../../dist/scrollreveal/react/index.mjs';
import { useVivus } from '../../dist/vivus/react/index.mjs';

const h = React.createElement;

let vivusInstance = null;
let vivusDone = 0;
let setPage;
let setAosOn;

function RevealList() {
  const ref = useScrollReveal({ selector: '.sr-card', interval: 60, distance: '30px', duration: 200 });
  return h('div', { ref, id: 'sr-list' }, ['a', 'b', 'c'].map((k) => h('div', { key: k, className: 'sr-card box' }, k)));
}

function Drawing() {
  const [ref, vivus] = useVivus({ duration: 30, start: 'manual' }, () => { vivusDone++; });
  vivusInstance = vivus;
  return h(
    'svg',
    { ref, id: 'vv', viewBox: '0 0 100 50', width: 200, height: 100, fill: 'none', stroke: '#000' },
    h('path', { d: 'M5 25 L95 25' }),
    h('rect', { x: 10, y: 5, width: 30, height: 10 }),
  );
}

const PageA = () => h('div', { id: 'page-a' }, h('div', { className: 'box', 'data-aos': 'fade-up', id: 'aos-a' }, 'A'), h(RevealList), h(Drawing));
const PageB = () => h('div', { id: 'page-b' }, h('div', { className: 'box', 'data-aos': 'zoom-in', id: 'aos-b' }, 'B'));

function App() {
  const [page, sp] = React.useState('a');
  const [aosOn, sa] = React.useState(true);
  setPage = sp;
  setAosOn = sa;
  React.useEffect(() => { window.__ready = true; }, []);
  return h(
    React.Fragment,
    null,
    aosOn ? h(AOSInit, { offset: 0, duration: 100, refreshKey: page }) : null,
    page === 'a' ? h(PageA) : h(PageB),
  );
}

createRoot(document.querySelector('#root')).render(h(React.StrictMode, null, h(App)));

window.__probe = {
  read: () => ({
    aosStyleTags: document.querySelectorAll('style#svg-scroll-draw-aos').length,
    aos: [...document.querySelectorAll('[data-aos]')].map((e) => ({
      id: e.id,
      init: e.classList.contains('aos-init'),
      animated: e.classList.contains('aos-animate'),
    })),
    srIds: [...document.querySelectorAll('.sr-card')].map((e) => e.getAttribute('data-sr-id')),
    srVisible: [...document.querySelectorAll('.sr-card')].map((e) => getComputedStyle(e).visibility),
    vivus: vivusInstance && document.getElementById('vv')
      ? {
          status: vivusInstance.getStatus(),
          done: vivusDone,
          paths: document.querySelectorAll('#vv path').length,
          dashed: [...document.querySelectorAll('#vv path')].every((p) => p.style.strokeDasharray !== ''),
        }
      : null,
  }),
  page: (p) => setPage(p),
  aos: (on) => setAosOn(on),
  play: () => vivusInstance.play(10),
};
