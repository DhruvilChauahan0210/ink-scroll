'use client';

import { CaseStrip, CASES } from '@/recipes/horizontal-scroll-sections/CaseStrip';

/** On this page the links go to the strip's own heading, not to case studies that do not exist. */
const LIVE_CASES = CASES.map((c) => ({ ...c, href: '#work-h' }));

/** The recipe's component as it runs on /blog/horizontal-scroll-sections. */
export function LiveStrip() {
  return <CaseStrip cases={LIVE_CASES} />;
}
