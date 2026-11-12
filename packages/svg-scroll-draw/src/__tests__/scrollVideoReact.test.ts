import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { ScrollVideo } from '../react';

/*
 * The React <ScrollVideo> rendered preload="auto" whatever the options said,
 * and scrollVideo leaves a preload attribute the page set alone, so the
 * `preload` option never applied. It had no way to pass a poster either.
 */

let root: Root | null = null;

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  vi.stubGlobal('IntersectionObserver', class { observe() {} disconnect() {} });
  vi.stubGlobal('matchMedia', (q: string) => ({ matches: false, media: q, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
});

afterEach(() => {
  act(() => root?.unmount());
  root = null;
  document.body.innerHTML = '';
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function render(props: Record<string, unknown>): HTMLVideoElement {
  const host = document.body.appendChild(document.createElement('div'));
  root = createRoot(host);
  act(() => root!.render(createElement(ScrollVideo, { src: '/clip.mp4', ...props } as never)));
  return host.querySelector('video')!;
}

describe('<ScrollVideo>', () => {
  it('renders preload from the option', () => {
    expect(render({ preload: 'metadata' }).getAttribute('preload')).toBe('metadata');
  });

  it('defaults preload to auto, as scrollVideo does', () => {
    expect(render({}).getAttribute('preload')).toBe('auto');
  });

  it('passes poster to the video', () => {
    expect(render({ poster: '/still.jpg' }).getAttribute('poster')).toBe('/still.jpg');
  });
});
