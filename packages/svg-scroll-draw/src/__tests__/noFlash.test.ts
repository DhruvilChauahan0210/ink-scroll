import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createElement, act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { createSSRApp, h } from 'vue';
import { renderToString as vueToString } from 'vue/server-renderer';
import { ScrollDraw } from '../react';
import { ScrollDraw as VueScrollDraw } from '../vue';

/**
 * no-flash.css hides the strokes under [data-scroll-draw-pending] until the
 * engine has set their starting state and removed the attribute. The server
 * HTML has to carry it, or the first paint shows the drawing whole: what the
 * GSAP benchmark measured in every run on 2.27.3.
 */

const svg = () => createElement('svg', { viewBox: '0 0 10 10' }, createElement('path', { d: 'M0 0L10 10', stroke: 'black' }));

describe('no-flash: the components render the attribute', () => {
  it('React <ScrollDraw> server HTML has data-scroll-draw-pending', () => {
    expect(renderToString(createElement(ScrollDraw, null, svg()))).toContain('data-scroll-draw-pending=""');
  });

  it('Vue <ScrollDraw> server HTML has data-scroll-draw-pending', async () => {
    const app = createSSRApp({ render: () => h(VueScrollDraw, null, () => h('svg')) });
    expect(await vueToString(app)).toContain('data-scroll-draw-pending');
  });
});

describe('no-flash: the engine removes it once mounted', () => {
  let root: Root | null = null;

  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', class { observe() {} disconnect() {} });
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} }));
    // jsdom has no geometry: give paths a length, as engine.test does.
    (window.SVGElement.prototype as unknown as { getTotalLength: () => number }).getTotalLength = () => 100;
  });

  afterEach(() => {
    act(() => root?.unmount());
    root = null;
    document.body.innerHTML = '';
    vi.unstubAllGlobals();
  });

  it('React <ScrollDraw>: gone after mount, with the path at its starting state', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    act(() => {
      root = createRoot(host);
      root.render(createElement(ScrollDraw, { native: false, children: svg() }));
    });
    const div = host.firstElementChild as HTMLElement;
    expect(div.hasAttribute('data-scroll-draw-pending')).toBe(false);
    expect((div.querySelector('path') as SVGPathElement).style.strokeDashoffset).toBe('100');
  });
});

describe('no-flash: the package ships the stylesheet', () => {
  const pkg = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf8'));
  const css = readFileSync(join(__dirname, '../../no-flash.css'), 'utf8');

  it('exports it, lists it in files, and marks it a side effect so bundlers keep the import', () => {
    expect(pkg.exports['./no-flash.css']).toBe('./no-flash.css');
    expect(pkg.files).toContain('no-flash.css');
    expect(pkg.sideEffects).toContain('./no-flash.css');
  });

  it('hides strokes only while pending, and only with scripting on', () => {
    expect(css).toMatch(/@media \(scripting: enabled\)/);
    expect(css).toMatch(/\[data-scroll-draw-pending\][^{]*\{\s*stroke-opacity:\s*0;/);
  });
});
