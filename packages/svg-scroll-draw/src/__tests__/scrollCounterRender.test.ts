import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { createApp, createSSRApp, h, nextTick, ref } from 'vue';
import { renderToString as vueToString } from 'vue/server-renderer';
import { ScrollCounter } from '../react';
import * as vue from '../vue';

/*
 * <ScrollCounter> rendered an empty <span> on the server, so a crawler, a reader
 * without JavaScript and the first paint had no number at all. It now renders
 * the final figure, once: after mount the engine owns the text, so the
 * framework must not write it again (Vue patched a new `to` in after the
 * engine's rebuild, leaving the final number showing).
 */

let root: Root | null = null;

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  vi.stubGlobal('IntersectionObserver', class { observe() {} disconnect() {} });
  vi.stubGlobal('matchMedia', (q: string) => ({ matches: false, media: q, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  vi.stubGlobal('innerHeight', 800);
  // Below the fold, so the counter starts on `from`.
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    top: 900, height: 100, left: 0, width: 200, right: 200, bottom: 1000, x: 0, y: 0, toJSON: () => ({}),
  });
});

afterEach(() => {
  act(() => root?.unmount());
  root = null;
  document.body.innerHTML = '';
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const format = (n: number) => Math.round(n).toLocaleString('en-US');

describe('<ScrollCounter> (React)', () => {
  it('hydrates the server number, then the engine owns the text', () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    const host = document.body.appendChild(document.createElement('div'));
    host.innerHTML = renderToString(createElement(ScrollCounter, { to: 1250, format, className: 'n' }));
    const span = host.querySelector('span')!;
    expect(span.textContent).toBe('1,250');

    act(() => { root = hydrateRoot(host, createElement(ScrollCounter, { to: 1250, format, className: 'n' })); });
    expect(errors).not.toHaveBeenCalled();
    // Below its window, the engine draws `from`.
    expect(span.textContent).toBe('0');

    // A new `to` rebuilds the engine, and React leaves the text to it.
    act(() => root!.render(createElement(ScrollCounter, { to: 90, decimals: 1, className: 'n' })));
    expect(span.childNodes).toHaveLength(1);
    expect(span.textContent).toBe('0.0');
    expect(errors).not.toHaveBeenCalled();
  });
});

describe('<ScrollCounter> (Vue)', () => {
  it('renders the final number on the server', async () => {
    const html = await vueToString(createSSRApp({ render: () => h(vue.ScrollCounter, { to: 42.5, decimals: 1 }) }));
    expect(html).toBe('<span>42.5</span>');
  });

  // Vue sets textContent for a string child, so its node is not kept; what
  // matters is that a new `to` does not leave the final number showing.
  it('keeps counting after a new `to`', async () => {
    const to = ref(1000);
    const host = document.body.appendChild(document.createElement('div'));
    const app = createApp({ render: () => h(vue.ScrollCounter, { to: to.value }) });
    app.mount(host);
    await nextTick();
    const span = host.querySelector('span')!;
    expect(span.textContent).toBe('0');

    to.value = 7;
    await nextTick();
    await nextTick();
    expect(span.childNodes).toHaveLength(1);
    expect(span.textContent).toBe('0');
    app.unmount();
  });
});
