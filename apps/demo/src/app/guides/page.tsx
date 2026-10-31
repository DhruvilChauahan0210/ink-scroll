import type { Metadata } from 'next';
import Link from 'next/link';
import { seoTitle } from '../_lib/seo';
import { GUIDES } from '@/data/guides';

export const metadata: Metadata = {
  title: seoTitle('Migration Guides: AOS, ScrollReveal and vivus in React'),
  description:
    'Step-by-step guides for moving AOS, ScrollReveal and vivus projects in React and Next.js onto maintained, MIT drop-ins — one command, same markup.',
  alternates: { canonical: '/guides' },
};

export default function GuidesIndex() {
  return (
    <div className="bg-light-linen text-pitch-black min-h-screen px-4 sm:px-6 md:px-12 py-14 sm:py-20">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="font-display font-bold text-sm tracking-tight hover:opacity-70">svg-scroll-draw</Link>
        <h1 className="font-display font-extrabold text-[clamp(32px,6vw,56px)] leading-[0.95] tracking-[-0.04em] mt-10 mb-4">Migration guides</h1>
        <p className="text-graphite-border text-base sm:text-lg leading-relaxed mb-10">
          Already on AOS, ScrollReveal or vivus? Each guide moves one of them onto its drop-in in React or Next.js — the same
          API and markup, maintained, MIT, with hooks that clean up after themselves.
        </p>
        <div className="grid gap-4">
          {GUIDES.map((g) => (
            <Link key={g.slug} href={`/guides/${g.slug}`} className="block rounded-xl border border-pitch-black bg-white p-5 hover:shadow-[4px_4px_0px_#000] transition-shadow">
              <p className="text-[11px] uppercase tracking-[0.2em] text-graphite-border font-mono mb-1">{g.from} · {g.framework}</p>
              <p className="font-display font-extrabold text-xl tracking-[-0.02em] mb-1">{g.title}</p>
              <p className="text-[14px] text-graphite-border leading-relaxed">{g.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
