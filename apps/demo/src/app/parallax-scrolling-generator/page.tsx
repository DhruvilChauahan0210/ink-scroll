import type { Metadata } from 'next';
import '@/components/stack/stack.css';
import '@/components/parallax/parallax.css';
import Link from 'next/link';
import { SELF } from '@/data/competitors';
import { TEXT_EASINGS } from '@/data/text-effects';
import { PARALLAX_DEFAULTS, PARALLAX_LAYERS, PARALLAX_PRESETS, SPEED_MAX, screenRate } from '@/data/parallax';
import { seoTitle } from '../_lib/seo';
import { SiteShell } from '@/components/site/SiteShell';
import { jsonLd, SITE_URL } from '@/lib/json-ld';
import { CodeBox } from '@/components/site/CodeBox';
import { CopyCommand } from '@/components/home/CopyCommand';
import { ParallaxGenerator } from '@/components/parallax/ParallaxGenerator';
import { DepthFigure } from '@/components/parallax/DepthFigure';
import { C, Note, Sec, Toc } from '@/components/stack/parts';

// Searchers type "parallax scrolling", "parallax generator", "parallax effect
// css js" and "react parallax", and want to see the effect and take the code.
// This page is a generator whose output is scrollParallax, one call per layer.
const TITLE = 'Parallax Scrolling Generator: Depth Effect for JS & React';
const DESCRIPTION =
  'Make a parallax scrolling effect: set each layer’s speed, scroll the preview to see the depth, copy the JavaScript, React or HTML. Free, MIT.';

const minus = (n: number) => (n < 0 ? `−${Math.abs(n)}` : String(n));
const share = (n: number) => (n === 1 ? 'H' : `${n} × H`);

/** What each speed does, worked out with the same arithmetic as the generator's readouts. */
const SPEEDS: { s: number; reads: string }[] = [
  { s: -1, reads: 'Far away: half the page’s rate.' },
  { s: -0.5, reads: 'Far: a distant ridge or the sky.' },
  { s: -0.2, reads: 'Just behind the page.' },
  { s: 0, reads: 'The page itself: no parallax, and no call needed.' },
  { s: PARALLAX_DEFAULTS.speed, reads: 'The default: a little nearer than the page.' },
  { s: 0.5, reads: 'Near: the foreground.' },
  { s: 1, reads: 'Very near: rushes past. Its art has to run its whole height past its bottom edge.' },
];

const OPTIONS: { k: string; def: string; d: string }[] = [
  { k: 'speed', def: String(PARALLAX_DEFAULTS.speed), d: 'How far the element travels over its window, as a share of its own height: positive up, negative down, 0 leaves it where the page puts it. It sets the element’s transform inline, which replaces any transform your CSS gives it, so put one of your own on a wrapper.' },
  { k: 'axis', def: `'${PARALLAX_DEFAULTS.axis}'`, d: "'x' moves it sideways by speed × its own width instead, a positive speed to the left. It still follows the page’s vertical scroll." },
  { k: 'easing', def: `'${PARALLAX_DEFAULTS.easing}'`, d: `How the travel is spread over the window: ${TEXT_EASINGS.map((e) => `'${e}'`).join(', ')}, or any function of t. Linear keeps the layer locked to the scroll, which is what parallax wants.` },
  { k: 'trigger', def: `{ start: '${PARALLAX_DEFAULTS.start}', end: '${PARALLAX_DEFAULTS.end}' }`, d: 'The window the travel is spread over, element edge then window edge, as in ScrollTrigger: from the element’s top at the window’s bottom to its bottom at the window’s top.' },
  { k: 'onProgress', def: 'none', d: 'Called with the progress (after the easing, so 0 to 1 when it is linear) on every frame while the element is on screen, for anything else that should follow it.' },
];

const SINGLE = `import { scrollParallax } from 'svg-scroll-draw';

// Half its own height over the window, upward: a near layer.
const hero = scrollParallax('#hero-art', { speed: 0.5 });

hero.seek(0.5);   // place it by hand, as the generator's preview does:
                  // it stops following the scroll until resume()
hero.resume();
hero.destroy();   // stop, and put the element back as it was`;

const GROUP = `import { scrollParallaxGroup } from 'svg-scroll-draw/group';

// The same options for several elements, with one instance to destroy.
const badges = scrollParallaxGroup(['#badge', '#tag', '#pill'], { speed: -0.2 });`;

const FAQ: { q: string; a: string }[] = [
  {
    q: 'What is parallax scrolling?',
    a: 'A scrolling effect where the layers of a scene move at different speeds, so the near ones seem to pass faster than the far ones and the page gains depth. With svg-scroll-draw each layer is an element, and scrollParallax(element, { speed }) moves it a share of its own height as it crosses the window: negative speeds lag behind the page and look far away, positive ones run ahead of it and look near.',
  },
  {
    q: 'How do I make a parallax effect with CSS and JavaScript?',
    a: "Stack the layers in one container with position: relative and overflow: hidden, make each one position: absolute with inset: 0, then call scrollParallax('#layer', { speed }) for each layer that should move. The generator above writes the CSS and the calls; its HTML tab is a whole file, with a comment where each layer’s art goes; give the scene a page to scroll through and it runs as it is. CSS alone can tie an animation to scroll with animation-timeline: view() in the browsers that support it; scrollParallax always runs on its own JavaScript engine, so it does not depend on that support.",
  },
  {
    q: 'How do I add a parallax effect in React or Next.js?',
    a: "svg-scroll-draw/react has no parallax component. Call scrollParallax in a useEffect with a ref to each layer, and destroy the instances in the effect’s cleanup; the generator’s React tab writes the component, with 'use client' for the Next.js App Router. For a single element, <ScrollAnimate> from svg-scroll-draw/react does the same with the transform scrollParallax would set: props={{ transform: ['translateY(0%)', 'translateY(-50%)'] }}, easing=\"linear\" and native={false} for a speed of 0.5.",
  },
  {
    q: 'What do the parallax speed values mean?',
    a: `Speed is how far a layer travels over its window, as a share of its own height: 0.5 is half its height, 1 all of it, 0 no movement at all, and a negative value moves it down instead of up. On screen it moves at the page’s rate plus that travel, 1 + speed × H ÷ (V + H) times the scroll for a layer H tall in a window V tall. The default is ${PARALLAX_DEFAULTS.speed}.`,
  },
  {
    q: 'Does parallax scrolling hurt performance?',
    a: 'Not when it only moves transforms, which is all scrollParallax changes: it writes transform (and a progress variable for CSS) once a frame while a layer is on screen, measures the layer only at the start and when the window or the layout around it changes, never while scrolling, and stops when the layer leaves the screen. Keep the layers few, clip the scene with overflow: hidden, and give large layers will-change: transform.',
  },
  {
    q: 'Is parallax scrolling bad for accessibility?',
    a: 'It can be: large motion the reader does not control can make some people dizzy or sick, which is what the reduced-motion setting is for. scrollParallax honours it. Under prefers-reduced-motion: reduce each layer is set at its end position and stays there, and if the setting is turned on while the page is open, every layer goes there at once. Keep the differences between layers small, and the scene readable at its end position.',
  },
  {
    q: 'Can parallax run inside a scrolling div instead of the page?',
    a: "scrollParallax follows the window’s scroll. For layers inside their own scrolling element, use scrollAnimate with the same transform and its scrollContainer option: scrollAnimate('#layer', { props: { transform: ['translateY(0%)', 'translateY(-50%)'] }, easing: 'linear', scrollContainer: '#box' }) moves the layer half its height as it crosses the box.",
  },
];

const TOC = [
  { id: 'generator', label: 'The generator' },
  { id: 'speed', label: 'How speed works' },
  { id: 'options', label: `Options · ${OPTIONS.length}` },
  { id: 'performance', label: 'Performance' },
  { id: 'reduced-motion', label: 'Reduced motion' },
  { id: 'faq', label: `Questions · ${FAQ.length}` },
];

export const metadata: Metadata = {
  title: seoTitle(TITLE),
  description: DESCRIPTION,
  keywords: [
    'parallax scrolling', 'parallax generator', 'parallax scrolling generator', 'parallax effect',
    'parallax effect css js', 'react parallax', 'nextjs parallax', 'parallax scroll animation',
    'parallax background', 'scrollParallax',
  ],
  alternates: { canonical: '/parallax-scrolling-generator' },
  openGraph: { type: 'article', title: TITLE, description: DESCRIPTION, url: `${SITE_URL}/parallax-scrolling-generator` },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

const JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      name: 'Parallax scrolling generator',
      url: `${SITE_URL}/parallax-scrolling-generator`,
      description: DESCRIPTION,
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Any (runs in the browser)',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      isPartOf: { '@id': `${SITE_URL}/#software` },
    },
    {
      '@type': 'FAQPage',
      mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
  ],
};

export default function ParallaxScrollingGeneratorPage() {
  return (
    <SiteShell
      active="/parallax-scrolling-generator"
      crumbs={[['Parallax scrolling generator', '/parallax-scrolling-generator']]}
      kicker="parallax / your turn"
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(JSON_LD) }} />
      <div className="stk">

        <header className="pg-head stk-head">
          <div>
            <p className="pg-kicker">
              <span>tool / parallax</span>
              <span>javascript · react · html</span>
            </p>
            <h1 className="pg-title stk-title">Parallax scrolling generator</h1>
            <p className="pg-lede">
              Give each layer of a scene its own speed, scroll the little window to see the depth, then copy the code:
              one <C>scrollParallax</C> call per layer, as plain JavaScript, a React component or a single HTML file.
            </p>
            <div className="pg-actions">
              <a href="#generator" className="btn btn-solid" data-magnetic>Open the generator ↓</a>
              <CopyCommand />
            </div>
            <dl className="pg-facts">
              <div><dt>Layers</dt><dd>{PARALLAX_LAYERS.length}</dd></div>
              <div><dt>Presets</dt><dd>{PARALLAX_PRESETS.length}</dd></div>
              <div><dt>Options</dt><dd>{OPTIONS.length}</dd></div>
              <div><dt>Main entry, gzip</dt><dd>{SELF.gzipKb} KB</dd></div>
            </dl>
          </div>
          <DepthFigure />
        </header>

        <div className="stk-body">
          <Toc label="On this page" items={TOC} />
          <div className="stk-main">

            <Sec n={1} k="The tool" id="generator" title="Make your parallax scene">
              <ParallaxGenerator version={SELF.version} />
              <Note k="The preview">
                scrollParallax follows the page’s scroll, so the little window works out each layer’s progress from its
                own scroll, over the library’s default trigger window, and hands it to the real instances with{' '}
                <C>seek()</C>. Under the code, the same scene runs on this page’s scroll, with no <C>seek()</C>.
              </Note>
            </Sec>

            <Sec n={2} k="The model" id="speed" title="How speed works">
              <p className="stk-p">
                scrollParallax moves an element from <C>translateY(0%)</C> to <C>translateY(−speed × 100%)</C> while its
                window is scrolled through: from the moment its top reaches the bottom of the window to the moment its
                bottom leaves the top. The percentage is of the element’s own height, so speed is a share of the
                layer’s size, not of the scroll: 0.5 moves it half its height over that window, 1 its whole height,
                and a negative speed moves it down instead of up.
              </p>
              <p className="stk-p">
                The page moves too, so what you see is the page’s rate plus the layer’s own (fig. 1). Positive speeds
                run ahead of the page and read as near, negative ones lag behind and read as far, 0 moves with it. For
                a layer <C>H</C> tall in a window <C>V</C> tall that is <C>1 + speed × H ÷ (V + H)</C> times the scroll.
                The table gives each speed’s travel over that window, for layers as tall as the window, <C>H = V</C>.
              </p>
              <div className="plx-scroll">
                <table className="plx-table">
                  <thead><tr><th>speed</th><th>travel</th><th>on screen</th><th>reads as</th></tr></thead>
                  <tbody>
                    {SPEEDS.map(({ s, reads }) => (
                      <tr key={s}>
                        <td>{minus(s)}</td>
                        <td>{s === 0 ? 'none' : `${s > 0 ? '↑' : '↓'} ${share(Math.abs(s))}`}</td>
                        <td>{screenRate(s, 1, 1).toFixed(2)}×</td>
                        <td>{reads}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Note k="Keep it small">
                Two layers drift apart by the difference of their speeds times their height over the window, the whole
                time the scene is on screen. Differences of 0.1 to 0.4 read as depth; much more and the scene comes
                apart before it has left the window.
              </Note>
              <Note k={`Why ±${SPEED_MAX}`}>
                Beyond ±{SPEED_MAX} a layer travels further than its own size, so the scene’s <C>overflow: hidden</C> clips
                its whole box away before the window ends. Measured with 2.23.2 in Chromium, Firefox and WebKit, the
                layer then stops following the scroll, and when its box has left the scene it stays where it stopped,
                even after scrolling back. The generator’s sliders stop at ±{SPEED_MAX}.
              </Note>
            </Sec>

            <Sec n={3} k={`${OPTIONS.length} options`} id="options" title="Every scrollParallax option">
              <div className="stk-faq plx-opts">
                {OPTIONS.map((o) => (
                  <div key={o.k} className="stk-q">
                    <span className="stk-q-n">{o.k}</span>
                    <div>
                      <p className="stk-p"><C long>{o.def}</C> by default. {o.d}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="stk-p stk-more">
                It returns the same instance as every other API in the library, so a layer can be placed by hand or
                taken away:
              </p>
              <CodeBox file="hero.js">{SINGLE}</CodeBox>
              <Note k="Many at once">
                <C>scrollParallaxGroup</C> applies one set of options to several elements and hands back a single
                instance for all of them.
              </Note>
              <CodeBox file="badges.js">{GROUP}</CodeBox>
            </Sec>

            <Sec n={4} k="Transforms only" id="performance" title="Parallax that stays smooth">
              <p className="stk-p">
                scrollParallax changes one property per layer, <C>transform</C>, plus the <C>--scroll-draw-progress</C>{' '}
                variable for your own CSS, so moving a layer never makes the browser lay the page out again. It
                measures each layer when it starts and again when the window resizes or the layout around the layer
                changes, never while you scroll, and runs its frame loop only while the layer is on screen.
              </p>
              <p className="stk-p">
                The travel is a percentage of the layer’s own box, which the browser resolves every frame, so a layer
                that grows after it starts, an image arriving inside it, travels its new size. Inside an SVG, a{' '}
                <C>{'<g>'}</C> can be a layer too: scrollParallax gives it its own transform box, so the percentage is of
                the group, and puts the old one back on <C>destroy()</C>.
              </p>
              <Note k="Your part">
                Keep the layers few and their art simple, clip the scene with <C>overflow: hidden</C>, and give large
                layers <C>will-change: transform</C> so the browser can move them without painting them again.
              </Note>
            </Sec>

            <Sec n={5} k="prefers-reduced-motion" id="reduced-motion" title="Parallax and reduced motion">
              <p className="stk-p">
                For readers whose system asks for reduced motion, scrollParallax does not move at all. Each layer is set
                at its end position, <C>translateY(−speed × 100%)</C> (<C>translateX</C> on axis x), and stays there; if
                the setting is turned on while the page is open, every layer goes there at once, as if the page had
                loaded that way.
              </p>
              <p className="stk-p">
                Parallax is the kind of motion that setting exists for, so make sure the scene still reads at its end
                position: the generator’s End position button shows it.
              </p>
            </Sec>

            <Sec n={6} k={`${FAQ.length} questions`} id="faq" title="Parallax scrolling questions">
              <div className="stk-faq">
                {FAQ.map((f, i) => (
                  <div key={f.q} className="stk-q">
                    <span className="stk-q-n">Q{i + 1}</span>
                    <div>
                      <h3 className="stk-q-t">{f.q}</h3>
                      <p className="stk-p">{f.a}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="stk-p stk-more">
                More: <Link href="/blog/scroll-animation-groups">parallax on many elements at once</Link>,{' '}
                <Link href="/blog/reduced-motion-scroll-animations">scroll animation and reduced motion</Link>, and the{' '}
                <Link href="/text-animation-generator">text animation generator</Link>. All of svg-scroll-draw{' '}
                {SELF.version}: <Link href="/docs">the docs</Link>.
              </p>
            </Sec>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
