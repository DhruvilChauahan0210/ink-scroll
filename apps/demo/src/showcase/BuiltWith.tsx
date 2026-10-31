import Link from 'next/link';
import './builtwith.css';

/**
 * The tab every showcase site carries: these are demo sites for fictional
 * companies, built with svg-scroll-draw, and this says so and links back to
 * the example that explains how.
 */
export function BuiltWith({ example, apis }: { example: string; apis: string }) {
  return (
    <aside className="bw" aria-label="About this demo">
      <span className="bw-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="14" height="14"><path d="M3 17 C 6 6, 10 6, 12 12 S 18 18, 21 7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></svg>
      </span>
      <span className="bw-text">
        <b>Demo site</b> built with svg-scroll-draw <i>· {apis}</i>
      </span>
      <Link href={`/examples/${example}`} className="bw-link">How it&apos;s built →</Link>
    </aside>
  );
}
