/**
 * The Nuxt module: `modules: ['svg-scroll-draw/nuxt']` in nuxt.config, and the
 * components and composables are auto-imported, as Nuxt's own are.
 *
 * A plain function module, which Nuxt 3 and 4 both install, so the library
 * takes no dependency on nuxt or @nuxt/kit: it only adds entries through two
 * of Nuxt's hooks, `components:extend` and `imports:extend`. Every entry
 * points at `svg-scroll-draw/vue`, imported where a page uses it.
 *
 * Nuxt runs it at build time, in Node.
 */

export interface ModuleOptions {
  /** Auto-import <ScrollDraw>, <ScrollAnimate>, <ScrollCounter>, <ScrollVideo>, <ScrollFrames> and <ScrollText>. Default: true. */
  components?: boolean;
  /** Auto-import useScrollDraw, useScrollAnimate, useScrollCounter, useScrollVideo, useScrollFrames and useScrollText. Default: true. */
  composables?: boolean;
  /** Put before every component name: 'Ink' gives <InkScrollDraw>. Default: ''. */
  prefix?: string;
}

/** The part of Nuxt the module touches, typed here instead of imported. */
interface NuxtLike {
  options: { svgScrollDraw?: ModuleOptions };
  hook(name: string, fn: (list: object[]) => void): unknown;
}

const NAMES = ['Draw', 'Animate', 'Counter', 'Video', 'Frames', 'Text'];
const FROM = 'svg-scroll-draw/vue';
const kebab = (s: string): string => s.replace(/([a-z\d])([A-Z])/g, '$1-$2').toLowerCase();

function svgScrollDraw(inline: ModuleOptions | undefined, nuxt: NuxtLike): void {
  const { components = true, composables = true, prefix = '' } = { ...nuxt.options.svgScrollDraw, ...inline };

  if (components) {
    nuxt.hook('components:extend', (list) => {
      for (const n of NAMES) {
        const name = `${prefix}Scroll${n}`;
        // The fields @nuxt/kit's addComponent fills in, so Nuxt reads these as
        // it reads its own.
        list.push({
          pascalName: name,
          kebabName: kebab(name),
          export: `Scroll${n}`,
          filePath: FROM,
          shortPath: FROM,
          chunkName: `components/${kebab(name)}`,
          global: false,
          prefetch: false,
          preload: false,
          mode: 'all',
          priority: 1,
          meta: {},
        });
      }
    });
  }

  if (composables) {
    nuxt.hook('imports:extend', (list) => {
      for (const n of NAMES) list.push({ name: `useScroll${n}`, from: FROM });
    });
  }
}

/** What Nuxt lists for the module, and the nuxt.config key its options live under. */
svgScrollDraw.getMeta = () =>
  Promise.resolve({ name: 'svg-scroll-draw', configKey: 'svgScrollDraw', compatibility: { nuxt: '>=3.0.0' } });

export default svgScrollDraw;
