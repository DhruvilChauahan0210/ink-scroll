import type { Metadata } from 'next';
import { jsonLd, SITE_URL } from '@/lib/json-ld';
import '@/components/blog.css';
import { seoTitle } from '../_lib/seo';
import { POSTS } from '@/data/blog-posts';
import { SiteShell } from '@/components/site/SiteShell';
import { BlogIndex, type Topic } from '@/components/blog/BlogIndex';

export const metadata: Metadata = {
  title: seoTitle('Scroll Animation Guides & Comparisons'),
  description:
    'Guides, comparisons, and deep-dives on scroll-driven SVG animation — svg-scroll-draw vs GSAP, migration guides, and more.',
  alternates: { canonical: '/blog' },
  openGraph: {
    title: 'Blog — svg-scroll-draw',
    description: 'Guides, comparisons, and deep-dives on scroll-driven SVG animation.',
    url: 'https://svg-scroll-draw.vercel.app/blog',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog — svg-scroll-draw',
    description: 'Guides, comparisons, and deep-dives on scroll-driven SVG animation.',
  },
};

const minutes = (readTime: string) => parseInt(readTime, 10) || 0;

/** The blog and its posts, for search engines. */
const JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Blog',
  name: 'svg-scroll-draw blog',
  url: `${SITE_URL}/blog`,
  blogPost: POSTS.map((p) => ({
    '@type': 'BlogPosting',
    headline: p.title,
    description: p.description,
    url: `${SITE_URL}/blog/${p.slug}`,
    ...(p.published ? { datePublished: p.published } : {}),
  })),
};

export default function BlogPage() {
  // Every figure on this page is counted from data/blog-posts.ts.
  const topics: Topic[] = [];
  for (const p of POSTS) {
    const t = topics.find((x) => x.tag === p.tag);
    if (t) { t.posts += 1; t.minutes += minutes(p.readTime); }
    else topics.push({ tag: p.tag, posts: 1, minutes: minutes(p.readTime) });
  }
  topics.sort((a, b) => b.minutes - a.minutes || a.tag.localeCompare(b.tag));
  const total = POSTS.reduce((s, p) => s + minutes(p.readTime), 0);
  const issued = [...new Set(POSTS.map((p) => p.date))];

  return (
    <SiteShell active="/blog" crumbs={[['Blog', '/blog']]} kicker="blog / your turn">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(JSON_LD) }} />
      <div className="bl">
        <BlogIndex
          posts={POSTS}
          topics={topics}
          total={total}
          head={
            <>
              <p className="pg-kicker"><span>blog / {POSTS.length} posts</span><span>guides · comparisons · deep-dives</span></p>
              <h1 className="pg-title bl-title">Guides &amp; comparisons</h1>
              <p className="pg-lede">
                Guides, comparisons, and deep-dives on scroll-driven SVG animation — svg-scroll-draw vs GSAP,
                migration guides, and more
              </p>
              <dl className="pg-facts bl-facts">
                <div><dt>Posts</dt><dd>{POSTS.length}</dd></div>
                <div><dt>Topics</dt><dd>{topics.length}</dd></div>
                <div><dt>Reading</dt><dd>{total} min</dd></div>
                <div><dt>Feed</dt><dd><a href="/blog/rss.xml" className="bl-rss">RSS ↗</a></dd></div>
              </dl>
              <p className="bl-issued">issued {issued.join(' · ')}</p>
            </>
          }
        />
      </div>
    </SiteShell>
  );
}
