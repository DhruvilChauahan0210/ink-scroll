'use client';

import { HorizontalCaseStrip, DEFAULT_CASES } from '../../../registry/blocks/horizontal-case-strip';

/**
 * The strip as it ships, but its sample "Read the case study" links point at its
 * own section on /blocks: the shipped /work/<slug> placeholders are 404s on this
 * site, and the link check (scripts/test-a11y.mjs) and crawlers both follow them.
 * A client file, because the block is one: a Server Component importing
 * DEFAULT_CASES would get a client reference, not the array.
 */
export function CaseStripPreview() {
  return <HorizontalCaseStrip cases={DEFAULT_CASES.map((c) => ({ ...c, href: '#horizontal-case-strip' }))} />;
}
