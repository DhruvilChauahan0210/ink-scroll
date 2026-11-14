/**
 * The React pieces the framework contract (react.entry.js) does not cover,
 * mounted for real with react-dom:
 *  - useScrollDrawProgress inside a scroll container, rendering its progress
 *    into `data-progress` so the spec reads what a component would render;
 *  - <ScrollVideo> with a `preload` option and a `poster`;
 *  - useScrollDrawProgress on the window, for engine-gate.html: a jump across
 *    its whole window (mountJump);
 *  - <ScrollCounter> rendered on the server, then hydrated (hydrateCounter).
 */
import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { useScrollDrawProgress, ScrollVideo, ScrollCounter } from '../../dist/react/index.mjs';

const h = React.createElement;

function Panel() {
  const ref = React.useRef(null);
  const progress = useScrollDrawProgress(ref, { scrollContainer: '#box' });
  return h('div', { ref, id: 'panel', 'data-progress': progress });
}

export function mount() {
  const root = createRoot(document.querySelector('#slot'));
  const video = createRoot(document.querySelector('#film'));
  const render = () => {
    root.render(h(Panel));
    video.render(h(ScrollVideo, { src: '/e2e/fixtures/clip.webm', preload: 'metadata', poster: '/e2e/fixtures/poster.png', id: 'rv' }));
  };
  React.act ? React.act(render) : render();
}

function JumpPanel() {
  const ref = React.useRef(null);
  const progress = useScrollDrawProgress(ref);
  return h('div', { ref, id: 'hook', 'data-progress': progress, style: { height: '200px' } });
}

/** useScrollDrawProgress on the window, mounted into `slot`. */
export function mountJump(slot) {
  const root = createRoot(slot);
  const render = () => root.render(h(JumpPanel));
  React.act ? React.act(render) : render();
}

/**
 * <ScrollCounter> as a server renders it, then hydrated over that HTML, the way
 * Next.js does. Up to 2.26.0 the server HTML was an empty <span>.
 */
export function hydrateCounter(host) {
  const counter = () => h(ScrollCounter, { to: 1250, format: (n) => Math.round(n).toLocaleString('en-US'), id: 'count' });
  host.innerHTML = renderToString(counter());
  const span = host.querySelector('#count');
  const server = span.textContent;
  const hydrate = () => { hydrateRoot(host, counter()); };
  React.act ? React.act(hydrate) : hydrate();
  return { server, hydrated: span.textContent, nodes: span.childNodes.length };
}
