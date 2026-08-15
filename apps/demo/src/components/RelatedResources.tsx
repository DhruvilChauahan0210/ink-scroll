import Link from 'next/link';
import { EXAMPLE_SEO } from '@/data/examples-seo';
import { RELATED_BY_POST } from '@/data/related-links';

/**
 * "Keep reading" block for the end of a blog post.
 *
 * Renders nothing if the post has no entry in RELATED_BY_POST, so adding it to
 * a page is always safe. Example labels come from EXAMPLE_SEO rather than being
 * retyped here — one source, so a renamed example cannot leave a stale label
 * behind on twelve blog posts.
 */
export function RelatedResources({ post }: { post: string }) {
  const related = RELATED_BY_POST[post];
  if (!related) return null;

  const examples = (related.examples ?? [])
    .map((slug) => EXAMPLE_SEO[slug])
    .filter(Boolean)
    .map((seo) => ({
      href: `/examples/${seo.slug}`,
      label: seo.heading,
      blurb: seo.description,
    }));

  const items = [...examples, ...(related.pages ?? [])];
  if (items.length === 0) return null;

  return (
    <section className="border-t border-pitch-black bg-marketplace-gray px-4 sm:px-6 md:px-12 py-12">
      <div className="max-w-3xl mx-auto">
        <h2 className="font-display font-extrabold text-2xl sm:text-3xl tracking-[-0.02em] mb-6">Keep reading</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block p-4 rounded-xl border border-pitch-black bg-light-linen hover:shadow-[3px_3px_0px_#000] transition-shadow"
            >
              <p className="font-semibold text-[15px] mb-1">{item.label}</p>
              <p className="text-[13px] text-graphite-border leading-relaxed">{item.blurb}</p>
            </Link>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <Link href="/examples" className="underline underline-offset-4 hover:opacity-70 transition-opacity">
            All 23 examples →
          </Link>
          <Link href="/docs" className="underline underline-offset-4 hover:opacity-70 transition-opacity">
            API reference →
          </Link>
          <Link href="/blog" className="underline underline-offset-4 hover:opacity-70 transition-opacity">
            More posts →
          </Link>
        </div>
      </div>
    </section>
  );
}
