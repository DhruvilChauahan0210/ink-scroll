import type { Metadata } from 'next';
import Link from 'next/link';
import { MobileMenu } from '@/components/MobileMenu';
import { CopyButton } from '@/components/CopyButton';

export const metadata: Metadata = {
  title: 'Replace GSAP ScrollTrigger with scrollAnimate — svg-scroll-draw v2',
  description:
    'scrollAnimate replaces gsap.to() + ScrollTrigger for 95% of scroll animation use cases. Zero GSAP dependency, 9× smaller, same one-call API. Full migration guide with side-by-side code.',
  keywords: [
    'replace gsap scrolltrigger',
    'gsap alternative',
    'scrolltrigger alternative',
    'scroll animation without gsap',
    'scrollAnimate svg-scroll-draw',
    'gsap to replacement',
    'lightweight scroll animation library',
    'scroll animation javascript',
    'fade in on scroll javascript',
    'animate on scroll without gsap',
  ],
  alternates: { canonical: '/blog/replace-gsap-scrolltrigger' },
  openGraph: {
    title: 'Replace GSAP ScrollTrigger with scrollAnimate',
    description: 'scrollAnimate covers 95% of ScrollTrigger use cases. 9× smaller. Zero deps. One function call.',
    url: 'https://svg-scroll-draw.vercel.app/blog/replace-gsap-scrolltrigger',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Replace GSAP ScrollTrigger with scrollAnimate',
    description: '9× smaller than GSAP. Zero deps. Same expressive API. Full migration guide.',
  },
};

function CodeBlock({ file, children }: { file: string; children: string }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-pitch-black my-5">
      <div className="bg-[#111] flex items-center justify-between px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#444]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#444]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#444]" />
        </div>
        <span className="text-[11px] text-[#888] font-mono">{file}</span>
        <CopyButton text={children} />
      </div>
      <pre className="bg-[#1c1c1c] text-[#e8e8e3] px-4 sm:px-6 py-4 text-[12px] sm:text-[13px] font-mono leading-[1.75] overflow-x-auto">
        {children}
      </pre>
    </div>
  );
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-l-4 border-creator-pink bg-creator-pink/5 px-5 py-4 rounded-r-xl my-5 text-sm leading-relaxed">
      {children}
    </div>
  );
}

export default function Page() {
  return (
    <div className="bg-light-linen text-pitch-black min-h-screen">

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-light-linen/95 backdrop-blur-sm border-b border-pitch-black flex items-center justify-between px-4 md:px-12 h-14">
        <Link href="/" className="font-display font-bold text-sm tracking-tight hover:opacity-70 transition-opacity shrink-0">
          svg-scroll-draw
        </Link>
        <div className="hidden lg:flex items-center gap-2">
          {['Home', 'Docs', 'Examples', 'Changelog', 'Blog'].map((label) => (
            <Link key={label} href={label === 'Home' ? '/' : `/${label.toLowerCase()}`}
              className="text-xs px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-medium">
              {label}
            </Link>
          ))}
          <Link href="/playground" className="text-xs px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-medium">
            ⚡ Playground
          </Link>
        </div>
        <MobileMenu />
      </nav>

      {/* Hero */}
      <header className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-12 sm:py-16">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-5">
            <span className="inline-block text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full bg-creator-pink/20 text-pitch-black border border-creator-pink/40">
              Migration Guide
            </span>
            <span className="text-[11px] font-mono text-graphite-border">June 2026 · 8 min read</span>
          </div>
          <h1 className="font-display font-extrabold text-[clamp(28px,6vw,60px)] leading-[0.92] tracking-[-0.04em] mb-5">
            Replace GSAP ScrollTrigger<br />with scrollAnimate.
          </h1>
          <p className="text-base sm:text-lg text-graphite-border leading-relaxed max-w-2xl">
            svg-scroll-draw v2 ships <code className="font-mono text-[0.9em] bg-marketplace-gray px-1.5 py-0.5 rounded">scrollAnimate</code> —
            a drop-in replacement for the 95% of scroll animation use cases that today require GSAP + ScrollTrigger.
            9× smaller. Zero dependencies. One function call.
          </p>
        </div>
      </header>

      {/* Article */}
      <article className="px-4 sm:px-6 md:px-12 py-12 sm:py-16">
        <div className="max-w-3xl mx-auto prose-custom">

          <h2 className="font-display font-extrabold text-2xl sm:text-3xl tracking-[-0.02em] mb-4 mt-10">Why GSAP in the first place?</h2>
          <p className="text-graphite-border leading-relaxed mb-4">
            GSAP is the de facto choice for scroll animations because it covers everything: fade, slide, color transitions, counters, text reveals, video scrubbing. Developers install it once and use it for everything.
          </p>
          <p className="text-graphite-border leading-relaxed mb-4">
            The cost: <strong>40+ KB gzipped</strong> (ScrollTrigger adds ~22 KB on top of GSAP core), a non-trivial API surface, and a business license requirement for commercial SplitText usage. For most projects, 80% of that weight covers use cases you never touch.
          </p>

          <h2 className="font-display font-extrabold text-2xl sm:text-3xl tracking-[-0.02em] mb-4 mt-10">The side-by-side</h2>
          <p className="text-graphite-border leading-relaxed mb-2">Here is the most common GSAP scroll pattern — fade + slide in on scroll:</p>

          <CodeBlock file="gsap-before.js">{`// GSAP — 40+ KB gzipped, needs two imports
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

gsap.to('#hero-text', {
  opacity:    1,
  y:          0,
  duration:   0.8,
  ease:       'power2.out',
  scrollTrigger: {
    trigger:  '#hero-text',
    start:    'top 80%',
    end:      'top 40%',
    scrub:    true,
    once:     true,
  },
});`}</CodeBlock>

          <CodeBlock file="svg-scroll-draw-after.js">{`// svg-scroll-draw v2 — ~9 KB total, one import, no plugin registration
import { scrollAnimate } from 'svg-scroll-draw';

scrollAnimate('#hero-text', {
  props: {
    opacity:   [0, 1],
    transform: ['translateY(40px)', 'translateY(0px)'],
  },
  trigger: { start: 'top 80%', end: 'top 40%' },
  easing:  'ease-out',
  once:    true,
});`}</CodeBlock>

          <Callout>
            <strong>Bundle impact:</strong> GSAP core + ScrollTrigger = ~40 KB gzipped. svg-scroll-draw v2 full bundle = ~9 KB gzipped. For scroll animations only, that is a <strong>4–5× size reduction</strong> in real-world projects.
          </Callout>

          <h2 className="font-display font-extrabold text-2xl sm:text-3xl tracking-[-0.02em] mb-4 mt-10">Common patterns, migrated</h2>

          <h3 className="font-semibold text-lg mb-2 mt-6">Parallax background</h3>
          <CodeBlock file="parallax.js">{`// GSAP
gsap.to('#bg', { y: -120, ease: 'none',
  scrollTrigger: { trigger: '#bg', start: 'top bottom', end: 'bottom top', scrub: true } });

// svg-scroll-draw
import { scrollParallax } from 'svg-scroll-draw';
scrollParallax('#bg', { speed: 0.4 }); // speed = fraction of element height`}</CodeBlock>

          <h3 className="font-semibold text-lg mb-2 mt-6">Stats counter</h3>
          <CodeBlock file="counter.js">{`// GSAP (needs a custom plugin or TextPlugin)
gsap.to({ val: 0 }, {
  val: 50000, duration: 2, ease: 'power1.out',
  scrollTrigger: { trigger: '#count', start: 'top 80%', once: true },
  onUpdate() { document.getElementById('count').textContent = Math.round(this.targets()[0].val); },
});

// svg-scroll-draw
import { scrollCounter } from 'svg-scroll-draw';
scrollCounter('#count', { to: 50000, easing: 'ease-out', once: true });`}</CodeBlock>

          <h3 className="font-semibold text-lg mb-2 mt-6">Text reveal (SplitText)</h3>
          <CodeBlock file="text.js">{`// GSAP SplitText — requires Club GreenSock ($150+/yr)
const split = new SplitText('#headline', { type: 'words' });
gsap.from(split.words, { opacity: 0, y: 24, stagger: 0.05, ease: 'power2.out',
  scrollTrigger: { trigger: '#headline', start: 'top 85%', once: true } });

// svg-scroll-draw/text — free, MIT
import { scrollText } from 'svg-scroll-draw/text';
scrollText('#headline', { split: 'words', stagger: 0.05, from: { opacity: 0, y: 24 }, once: true });`}</CodeBlock>

          <h3 className="font-semibold text-lg mb-2 mt-6">Video scrubbing</h3>
          <CodeBlock file="video.js">{`// GSAP
gsap.to({}, {
  scrollTrigger: { trigger: '#section', start: 'top top', end: 'bottom top', scrub: true,
    onUpdate: self => { video.currentTime = self.progress * video.duration; } },
});

// svg-scroll-draw/video
import { scrollVideo } from 'svg-scroll-draw/video';
scrollVideo('#hero-video', { trigger: { start: 'top top', end: 'bottom top' } });`}</CodeBlock>

          <h2 className="font-display font-extrabold text-2xl sm:text-3xl tracking-[-0.02em] mb-4 mt-10">The instance API is the same</h2>
          <p className="text-graphite-border leading-relaxed mb-4">
            Every function in svg-scroll-draw returns the same instance object, so programmatic control feels identical to GSAP:
          </p>
          <CodeBlock file="instance.js">{`const anim = scrollAnimate('#el', { props: { opacity: [0, 1] } });

anim.pause();           // pause at current frame
anim.resume();          // resume
anim.seek(0.5);         // jump to 50%
anim.replay();          // reset and replay
anim.getProgress();     // → 0–1
anim.destroy();         // remove all listeners`}</CodeBlock>

          <h2 className="font-display font-extrabold text-2xl sm:text-3xl tracking-[-0.02em] mb-4 mt-10">When to still use GSAP</h2>
          <p className="text-graphite-border leading-relaxed mb-4">
            svg-scroll-draw covers the 95% case. There are scenarios where GSAP is still the right tool:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-graphite-border mb-4">
            <li>Complex multi-element non-scroll timelines (absolute time, tweening unrelated to scroll)</li>
            <li>Physics simulations and draggable interactions (Draggable plugin)</li>
            <li>Advanced SVG morphing with incompatible path structures (MorphSVG plugin)</li>
            <li>Canvas / WebGL animations</li>
          </ul>
          <p className="text-graphite-border leading-relaxed">
            For everything scroll-driven — and that is the vast majority of landing page and marketing site animation — svg-scroll-draw v2 gets you there at a fraction of the bundle cost.
          </p>

          <div className="mt-12 pt-8 border-t border-subtle-ash">
            <p className="text-[13px] font-mono text-graphite-border mb-4">Further reading</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/docs#scroll-animate" className="text-sm px-4 py-2.5 rounded-xl border border-pitch-black hover:bg-pitch-black hover:text-light-linen transition-colors font-medium text-center">
                scrollAnimate API docs →
              </Link>
              <Link href="/examples" className="text-sm px-4 py-2.5 rounded-xl border border-subtle-ash hover:border-pitch-black transition-colors font-medium text-center">
                Live examples
              </Link>
              <Link href="/blog" className="text-sm px-4 py-2.5 rounded-xl border border-subtle-ash hover:border-pitch-black transition-colors font-medium text-center">
                ← All posts
              </Link>
            </div>
          </div>

        </div>
      </article>

      {/* Footer */}
      <footer className="px-6 md:px-12 py-6 border-t border-subtle-ash text-center text-[11px] font-mono text-graphite-border">
        svg-scroll-draw · MIT · ~9 KB gzipped ·{' '}
        <a href="https://github.com/DhruvilChauahan0210/ink-scroll" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-pitch-black transition-colors">
          GitHub
        </a>
      </footer>

    </div>
  );
}
