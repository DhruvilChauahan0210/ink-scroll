import { describe, it, expect } from 'vitest';
import nuxtModule from '../nuxt';
import * as vue from '../vue';

/*
 * The Nuxt module adds the components and composables through Nuxt's own
 * hooks. Here a stand-in Nuxt records what each hook receives; the real
 * install, build and render is checked in a Nuxt app (see the changelog).
 */

type Entry = Record<string, unknown>;

function install(inline?: Parameters<typeof nuxtModule>[0], config?: Record<string, unknown>) {
  const hooks: Record<string, Entry[]> = {};
  nuxtModule(inline, {
    options: { svgScrollDraw: config },
    hook(name, fn) { fn((hooks[name] ??= [])); },
  });
  return hooks;
}

describe('the Nuxt module', () => {
  it('is the default export of svg-scroll-draw/nuxt, with its meta', async () => {
    expect(typeof nuxtModule).toBe('function');
    expect(await nuxtModule.getMeta()).toMatchObject({ name: 'svg-scroll-draw', configKey: 'svgScrollDraw' });
  });

  it('registers the six components from svg-scroll-draw/vue, under names that exist there', () => {
    const list = install()['components:extend'];
    expect(list.map((c) => c.pascalName)).toEqual(
      ['ScrollDraw', 'ScrollAnimate', 'ScrollCounter', 'ScrollVideo', 'ScrollFrames', 'ScrollText'],
    );
    for (const c of list) {
      expect(c.filePath).toBe('svg-scroll-draw/vue');
      expect(vue).toHaveProperty(c.export as string);
    }
    expect(list[0]).toMatchObject({ kebabName: 'scroll-draw', export: 'ScrollDraw', mode: 'all', global: false });
  });

  it('auto-imports the six composables, under names that exist in svg-scroll-draw/vue', () => {
    const list = install()['imports:extend'];
    expect(list.map((c) => c.name)).toEqual(
      ['useScrollDraw', 'useScrollAnimate', 'useScrollCounter', 'useScrollVideo', 'useScrollFrames', 'useScrollText'],
    );
    for (const c of list) {
      expect(c.from).toBe('svg-scroll-draw/vue');
      expect(typeof (vue as Record<string, unknown>)[c.name as string]).toBe('function');
    }
  });

  it('takes a prefix, and can leave either half out', () => {
    expect(install({ prefix: 'Ink' })['components:extend'][1]).toMatchObject({ pascalName: 'InkScrollAnimate', kebabName: 'ink-scroll-animate', export: 'ScrollAnimate' });
    expect(install({ components: false })['components:extend']).toBeUndefined();
    expect(install({ composables: false })['imports:extend']).toBeUndefined();
  });

  it('reads svgScrollDraw from nuxt.config, and inline options win', () => {
    expect(install(undefined, { composables: false })['imports:extend']).toBeUndefined();
    expect(install({ prefix: 'A' }, { prefix: 'B' })['components:extend'][0].pascalName).toBe('AScrollDraw');
  });
});
