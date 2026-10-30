import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';

const createEngine = vi.fn(() => ({ destroy: vi.fn() }));
vi.mock('../core/engine', () => ({ createEngine }));

beforeAll(async () => {
  await import('../web-component');
});

beforeEach(() => {
  createEngine.mockClear();
  document.body.innerHTML = '';
});

function mount(attrs: Record<string, string>): HTMLElement {
  const el = document.createElement('scroll-draw');
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  document.body.appendChild(el);
  return el;
}

const optsOf = () => (createEngine.mock.calls[0] as unknown[])[1];

describe('<scroll-draw>', () => {
  it('passes every attribute through to the engine', () => {
    mount({ speed: '1.2', easing: 'ease-out', stagger: '0.1', direction: 'reverse', selector: 'path', fade: '', once: '' });
    expect(optsOf()).toEqual({
      speed: 1.2, easing: 'ease-out', stagger: 0.1, direction: 'reverse', selector: 'path', fade: true, once: true,
    });
  });

  it('reads once="false" and fade="false" as off', () => {
    mount({ once: 'false', fade: 'false' });
    expect(optsOf()).toEqual({ once: false, fade: false });
  });

  it('leaves unset attributes out, so engine defaults apply', () => {
    mount({});
    expect(optsOf()).toEqual({});
  });

  it('destroys its instance when removed', () => {
    const el = mount({});
    const inst = createEngine.mock.results[0].value as { destroy: ReturnType<typeof vi.fn> };
    el.remove();
    expect(inst.destroy).toHaveBeenCalledTimes(1);
  });
});
