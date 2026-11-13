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
  /** Who made material the site shows that is not this repository's, shown with its card. */
  credit?: Credit;
};

export type Credit = { text: string; links: { label: string; href: string }[] };

/** The Landsat 8 turntable frames in public/frames/landsat (see the README there). */
export const LANDSAT_CREDIT: Credit = {
  text: 'Landsat 8 (LDCM) model animation: NASA/Goddard Space Flight Center Conceptual Image Lab. Public domain.',
  links: [
    { label: 'NASA SVS', href: 'https://svs.gsfc.nasa.gov/10812' },
    { label: 'Wikimedia Commons', href: 'https://commons.wikimedia.org/wiki/File:LDCM_spacecraft_rotating.webm' },
  ],
};

export const SHOWCASE: Record<string, Showcase> = {
  'logo-reveal': {
    slug: 'ferrow',
    brand: 'Ferrow Coffee Roasters',
    what: 'A small-lot coffee roaster in Lisbon',
    image: '/showcase/ferrow-62095348.webp',
    width: 1920,
    height: 1200,
  },
  'line-chart': {
    slug: 'ledgerline',
    brand: 'Ledgerline',
    what: 'Revenue analytics for subscription businesses',
    image: '/showcase/ledgerline-00bb6f17.webp',
    width: 1920,
    height: 1200,
  },
  signature: {
    slug: 'quillmark',
    brand: 'Quillmark',
    what: 'E-signatures for small firms',
    image: '/showcase/quillmark-bbd1ed80.webp',
    width: 1920,
    height: 1200,
  },
  flowchart: {
    slug: 'hearth',
    brand: 'Hearth & Field',
    what: 'A homeware shop’s order confirmation',
    image: '/showcase/hearth-f3d5aae0.webp',
    width: 1920,
    height: 1200,
  },
  'map-route': {
    slug: 'parcelry',
    brand: 'Parcelry',
    what: 'Same-day courier tracking in Lisbon',
    image: '/showcase/parcelry-bed3c47e.webp',
    width: 1920,
    height: 1200,
  },
  'network': {
    slug: 'northbeam',
    brand: 'Northbeam',
    what: 'An edge cloud for apps and APIs',
    image: '/showcase/northbeam-a83715d7.webp',
    width: 1920,
    height: 1200,
  },
  'astro': {
    slug: 'fieldnotes',
    brand: 'Fieldnotes',
    what: 'A quarterly journal of walking and noticing',
    image: '/showcase/fieldnotes-69a56d71.webp',
    width: 1920,
    height: 1200,
  },
  'timeline-api': {
    slug: 'halyard',
    brand: 'Halyard Capital',
    what: 'A shipping group’s annual report',
    image: '/showcase/halyard-232c6080.webp',
    width: 1920,
    height: 1200,
  },
  'group-api': {
    slug: 'relay',
    brand: 'Relay',
    what: 'Team messaging that keeps work in one place',
    image: '/showcase/relay-0f14522d.webp',
    width: 1920,
    height: 1200,
  },
  'vue': {
    slug: 'tidewater',
    brand: 'Tidewater',
    what: 'A sailing school in Falmouth',
    image: '/showcase/tidewater-67621a84.webp',
    width: 1920,
    height: 1200,
  },
  'svelte': {
    slug: 'stride',
    brand: 'Stride',
    what: 'A running app that draws every route',
    image: '/showcase/stride-741abf06.webp',
    width: 1920,
    height: 1200,
  },
  'solid': {
    slug: 'statusline',
    brand: 'Paygrid status',
    what: 'A payments API’s live status page',
    image: '/showcase/statusline-663684a2.webp',
    width: 1920,
    height: 1200,
  },
  'presets': {
    slug: 'linework',
    brand: 'Linework',
    what: 'An illustration and motion studio in Ghent',
    image: '/showcase/linework-44abaf85.webp',
    width: 1920,
    height: 1200,
  },
  'sequence-api': {
    slug: 'shipyard',
    brand: 'Shipyard',
    what: 'CI/CD that runs every stage in order',
    image: '/showcase/shipyard-da88f283.webp',
    width: 1920,
    height: 1200,
  },
  'scroll-animate': {
    slug: 'tessera',
    brand: 'Tessera',
    what: 'A team wiki’s pricing page',
    image: '/showcase/tessera-91236847.webp',
    width: 1920,
    height: 1200,
  },
  'scroll-counter': {
    slug: 'greenline',
    brand: 'Greenline',
    what: 'A reforestation charity’s impact report',
    image: '/showcase/greenline-210eb52c.webp',
    width: 1920,
    height: 1200,
  },
  'scroll-text-lines': {
    slug: 'mintco',
    brand: 'Mint & Co',
    what: 'A bank’s account-switching page',
    image: '/showcase/mintco-3c4312a9.webp',
    width: 1920,
    height: 1200,
  },
  'scroll-animate-group': {
    slug: 'plugboard',
    brand: 'Plugboard',
    what: 'No-code automations and their integrations',
    image: '/showcase/plugboard-a54c90a1.webp',
    width: 1920,
    height: 1200,
  },
  'scroll-text': {
    slug: 'ateliernord',
    brand: 'Atelier Nord',
    what: 'An architecture studio in Oslo and Bergen',
    image: '/showcase/ateliernord-79edc678.webp',
    width: 1920,
    height: 1200,
  },
  'scroll-reveal': {
    slug: 'folio',
    brand: 'Folio',
    what: 'A notes app’s “What’s new” page',
    image: '/showcase/folio-d356fbcb.webp',
    width: 1920,
    height: 1200,
  },
  'scroll-pin': {
    slug: 'lumen',
    brand: 'Lumen',
    what: 'A compact camera’s product page',
    image: '/showcase/lumen-9ff99dbe.webp',
    width: 1920,
    height: 1200,
  },
  'scroll-snap': {
    slug: 'casaverde',
    brand: 'Casa Verde',
    what: 'Holiday rentals in Portugal and Spain',
    image: '/showcase/casaverde-f2cbfb11.webp',
    width: 1920,
    height: 1200,
  },
  'scroll-video': {
    slug: 'aural',
    brand: 'Aural',
    what: 'Over-ear headphones, the Aural One',
    image: '/showcase/aural-fb25d22f.webp',
    width: 1920,
    height: 1200,
  },
  'scroll-frames': {
    slug: 'groundtrack',
    brand: 'Groundtrack',
    what: 'An exhibition of Earth-observing satellites',
    image: '/showcase/groundtrack-7d834c64.webp',
    width: 1920,
    height: 1200,
    credit: LANDSAT_CREDIT,
  },
};
