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
