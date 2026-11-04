/**
 * Serialise a JSON-LD object for embedding in a <script type="application/ld+json">.
 *
 * Why this is not just JSON.stringify: inside a script element the HTML parser
 * treats the sequences `<script` and `<!--` specially. A JSON-LD value whose
 * text mentions a script tag — an FAQ answer explaining one, say — flips the
 * parser into script-data-double-escaped state, so the closing tag no longer
 * ends the element. The rest of the document is swallowed and the page throws a
 * syntax error, which is exactly what /astro-scroll-animation did before this
 * existed.
 *
 * Escaping the angle brackets and ampersand is valid JSON, parses identically,
 * and makes the sequence unreachable.
 */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

export const SITE_URL = 'https://svg-scroll-draw.vercel.app';

/** One step of a page's trail below Home: its name and path, e.g. ['Guides', '/guides']. */
export type Crumb = [name: string, path: string];

/**
 * A BreadcrumbList for a page, Home first. Google shows the trail in place of
 * the bare URL in results; SiteShell emits it from its `crumbs` prop.
 */
export function breadcrumbs(trail: Crumb[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [['Home', '/'] as Crumb, ...trail].map(([name, path], i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name,
      item: path === '/' ? SITE_URL : `${SITE_URL}${path}`,
    })),
  };
}
