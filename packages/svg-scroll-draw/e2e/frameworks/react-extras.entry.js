/**
 * The React pieces the framework contract (react.entry.js) does not cover,
 * mounted for real with react-dom:
 *  - useScrollDrawProgress inside a scroll container, rendering its progress
 *    into `data-progress` so the spec reads what a component would render;
 *  - <ScrollVideo> with a `preload` option and a `poster`;
 *  - useScrollDrawProgress on the window, for engine-gate.html: a jump across
 *    its whole window (mountJump).
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { useScrollDrawProgress, ScrollVideo } from '../../dist/react/index.mjs';

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
