import { POSTS } from '@/data/blog-posts';

export const dynamic = 'force-static';

const SITE_URL = 'https://svg-scroll-draw.vercel.app';

/** Escape the five XML predefined entities. Post titles contain & and — regularly. */
function xml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * "June 2026" → RFC 822, which is what RSS 2.0 requires. Falls back to the
 * build date rather than emitting an invalid pubDate, since a malformed date
 * makes some readers drop the whole item.
 */
function pubDate(post: { published?: string; date: string }): string {
  // Parse as UTC. `1 June 2026` in a UTC+5:30 timezone resolves to 31 May
  // 18:30 UTC, which publishes the post in the wrong month.
  const d = new Date(post.published ? `${post.published}T00:00:00Z` : `1 ${post.date} UTC`);
  return Number.isNaN(d.getTime()) ? new Date('2026-06-06T00:00:00Z').toUTCString() : d.toUTCString();
}

export function GET() {
  const items = POSTS.map(
    (post) => `    <item>
      <title>${xml(post.title)}</title>
      <link>${SITE_URL}/blog/${post.slug}</link>
      <guid isPermaLink="true">${SITE_URL}/blog/${post.slug}</guid>
      <description>${xml(post.description)}</description>
      <category>${xml(post.tag)}</category>
      <pubDate>${pubDate(post)}</pubDate>
    </item>`,
  ).join('\n');

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>svg-scroll-draw — blog</title>
    <link>${SITE_URL}/blog</link>
    <description>Scroll-driven animation for the web: SVG path drawing, reveal, pin, snap, text splitting and video scrub. Guides, migrations and performance notes.</description>
    <language>en</language>
    <atom:link href="${SITE_URL}/blog/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
