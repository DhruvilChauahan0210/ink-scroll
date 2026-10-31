/**
 * The demo sites built with svg-scroll-draw, one per example. Each is a full
 * page for a fictional company under /showcase; the examples pages show its
 * first screen and link to it. Add an entry when a site is finished.
 */
export type Showcase = {
  /** Route under /showcase. */
  slug: string;
  brand: string;
  /** One line on what the company is. */
  what: string;
  image: string;
  width: number;
  height: number;
};

export const SHOWCASE: Record<string, Showcase> = {
  'logo-reveal': {
    slug: 'ferrow',
    brand: 'Ferrow Coffee Roasters',
    what: 'A small-lot coffee roaster in Lisbon',
    image: '/showcase/ferrow.webp',
    width: 1920,
    height: 1200,
  },
  'line-chart': {
    slug: 'ledgerline',
    brand: 'Ledgerline',
    what: 'Revenue analytics for subscription businesses',
    image: '/showcase/ledgerline.webp',
    width: 1920,
    height: 1200,
  },
  signature: {
    slug: 'quillmark',
    brand: 'Quillmark',
    what: 'E-signatures for small firms',
    image: '/showcase/quillmark.webp',
    width: 1920,
    height: 1200,
  },
};
