import Link from 'next/link';
import { CodeBox } from '@/components/site/CodeBox';
import { GitHubStar } from '@/components/site/GitHubStar';
import { SELF, SELF_ENTRIES } from '@/data/competitors';
import { TOOLS, type Tool } from '@/data/tools';
import './tool-kit.css';

/** Tools every page points on to: the drawing tools are what the library is for. */
const CORE = ['svg-path-viewer', 'svg-line-drawing-generator'];

/**
 * The end of every tool, before its questions: install it, the docs for the
 * API the tool wrote, a star on GitHub, and where to go next. One block for all of them, so a
 * visitor who has just copied code always finds the same next step.
 *
 * Render it inside the tool's own numbered Sec.
 */
export function ToolNextStep({
  slug,
  api,
  entry = '',
  docs,
  related = [],
  importLine,
}: {
  /** This tool's slug, left out of the suggestions. */
  slug: string;
  /** The API the tool's code calls, e.g. 'scrollReveal'. */
  api: string;
  /** Its entry: '' for 'svg-scroll-draw', 'reveal' for 'svg-scroll-draw/reveal'. */
  entry?: string;
  /** The docs anchor for that API, e.g. '/docs#scroll-reveal'. */
  docs: string;
  /** Up to two more tool slugs that follow on from this one. */
  related?: string[];
  /**
   * The import line, when it is not `import { api } from …`: the AOS drop-in
   * is a default export (`import AOS from 'svg-scroll-draw/aos'`).
   */
  importLine?: string;
}) {
  const from = entry ? `svg-scroll-draw/${entry}` : 'svg-scroll-draw';
  const kb: number | undefined = entry ? SELF_ENTRIES[entry] : SELF.gzipKb;
  const next = [...related, ...CORE]
    .filter((s, i, all) => s !== slug && all.indexOf(s) === i)
    .map((s) => TOOLS.find((t) => t.slug === s))
    .filter((t): t is Tool => t != null)
    .slice(0, 3);

  return (
    <div className="tk-next">
      <div className="tk-next-install">
        <CodeBox file="terminal">{`npm i svg-scroll-draw`}</CodeBox>
        <dl className="tk-next-facts">
          <div><dt>Import</dt><dd><code>{importLine ?? `import { ${api} } from '${from}'`}</code></dd></div>
          {kb != null ? <div><dt>Size</dt><dd>{kb} KB gzipped{entry ? ' for this entry' : ', the whole main entry'}</dd></div> : null}
          <div><dt>Licence</dt><dd>{SELF.license}, version {SELF.version}</dd></div>
        </dl>
        <p className="tk-next-links">
          <Link href={docs}>{api} in the docs →</Link>
          <Link href="/examples">Live examples →</Link>
        </p>
        <div className="tk-next-star">
          <GitHubStar className="btn-sm" />
          <p>Saved you some time? A star helps others find it.</p>
        </div>
      </div>
      {next.length ? (
        <div className="tk-next-more">
          <p className="tk-next-k">Next tool</p>
          {next.map((t) => (
            <Link key={t.slug} href={`/${t.slug}`} className="tk-next-row">
              <span className="tk-next-t">{t.name}</span>
              <span className="tk-next-d">{t.blurb}</span>
            </Link>
          ))}
          <Link href="/tools" className="tk-next-all">All {TOOLS.length} tools →</Link>
        </div>
      ) : null}
    </div>
  );
}
