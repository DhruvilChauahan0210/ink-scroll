import type { Metadata } from 'next';
import '@/components/stack/stack.css';
import '@/components/text-gen/text-gen.css';
import Link from 'next/link';
import { SELF, SELF_ENTRIES } from '@/data/competitors';
import { TEXT_DEFAULTS, TEXT_EASINGS, TEXT_EFFECTS } from '@/data/text-effects';
import { seoTitle } from '../_lib/seo';
import { SiteShell } from '@/components/site/SiteShell';
import { jsonLd, SITE_URL } from '@/lib/json-ld';
import { CodeBox } from '@/components/site/CodeBox';
import { CopyCommand } from '@/components/home/CopyCommand';
import { TextGenerator } from '@/components/text-gen/TextGenerator';
import { StaggerFigure } from '@/components/text-gen/StaggerFigure';
import { C, Note, Sec, Toc } from '@/components/stack/parts';

// Bing keyword research (2026-11-11): "text animation" 871, "animated text
// generator" 374, "animated text with css/js" 327 searches in three months,
// led by online tools. This is one, and its output is code for the web.
const TITLE = 'Text Animation Generator: Animated Text for JS & React';
const DESCRIPTION =
  'Make animated text for the web: split by word, letter or line, pick the motion, preview it, copy the JavaScript or React code. Free, MIT.';

const SPLITS = [
  { k: 'words', d: 'Each word moves on its own. The default, and the most readable.' },
  { k: 'chars', d: 'Each letter moves on its own. Best for short headings; long text needs a small stagger.' },
  { k: 'lines', d: 'Each line as it wraps in the layout, measured again when the window resizes.' },
];

const OPTIONS: { k: string; def: string; d: string }[] = [
  { k: 'split', def: `'${TEXT_DEFAULTS.split}'`, d: "'words', 'chars' or 'lines'." },
  { k: 'stagger', def: String(TEXT_DEFAULTS.stagger), d: 'How far into the scroll each piece starts after the one before, as a fraction of the whole (0–1).' },
  { k: 'easing', def: `'${TEXT_DEFAULTS.easing}'`, d: `${TEXT_EASINGS.map((e) => `'${e}'`).join(', ')}, or any function of t.` },
  { k: 'from', def: '{ opacity: 0, y: 24 }', d: 'Where each piece starts: opacity, x, y, rotate (degrees), scale. It ends at its natural place.' },
  { k: 'trigger', def: `{ start: '${TEXT_DEFAULTS.start}', end: '${TEXT_DEFAULTS.end}' }`, d: 'Element edge and window edge, as in ScrollTrigger: start when its top is at 85% of the window, finish at 40%.' },
  { k: 'once', def: String(TEXT_DEFAULTS.once), d: 'Keep the text in place after it has arrived, instead of reversing when you scroll back up.' },
];

const SCROLL_TRIGGERED = `import { scrollText } from 'svg-scroll-draw/text';

// Starts when the heading's top is 85% down the window, done at 40%.
const headline = scrollText('#headline', {
  split: 'chars',
  stagger: 0.03,
  trigger: { start: 'top 85%', end: 'top 40%' },
});

// The same instance can be driven by hand, as the generator does:
headline.seek(0.5);   // half way
headline.replay();    // back to the start, following the scroll again`;

const FAQ: { q: string; a: string }[] = [
  {
    q: 'How do I animate text on scroll?',
    a: "Split the text into pieces (words, letters or lines), give each piece a starting state such as opacity 0 and 24px down, and move each one to its natural place as the page scrolls, a little after the one before. scrollText('#headline') does all of that: the generator above sets its options and gives you the code.",
  },
  {
    q: 'How do I animate text letter by letter?',
    a: "Use split: 'chars'. Every letter becomes its own piece and arrives in turn. Keep the stagger small for long text: with n letters the stagger has to stay below 1 / (n - 1) or the letters pop on instead of moving, and the generator warns when it crosses that line.",
  },
  {
    q: 'Can I animate text on scroll with CSS only?',
    a: 'Partly. CSS animation-timeline: view() ties an animation to scroll in browsers that support it, but CSS cannot split a sentence into words or letters, so every piece needs its own element written by hand, and older browsers get no animation. A script does the splitting and works everywhere.',
  },
  {
    q: 'How do I make animated text in React?',
    a: "Render <ScrollText> from svg-scroll-draw/react with the text as its child and the same options as props, for example <ScrollText as=\"h2\" split=\"chars\">Your heading</ScrollText>. The React tab of the generator writes it for you. It works in the Next.js App Router too.",
  },
  {
    q: 'Do screen readers and search engines still read animated text?',
    a: 'Yes. scrollText keeps one visually hidden copy of the whole text for screen readers and hides the split pieces from them, so the sentence is read once, in full. The text is in the HTML from the start, so search engines see it as normal text.',
  },
  {
    q: 'Is this text animation generator free?',
    a: `Yes. The generator is free to use and the code it writes uses svg-scroll-draw, which is MIT-licensed. The text entry is ${SELF_ENTRIES.text} KB gzipped with nothing else to load.`,
  },
];

const TOC = [
  { id: 'generator', label: 'The generator' },
  { id: 'how', label: 'How scroll drives it' },
  { id: 'split', label: 'Words, letters or lines' },
  { id: 'options', label: `Options · ${OPTIONS.length}` },
  { id: 'faq', label: `Questions · ${FAQ.length}` },
];

export const metadata: Metadata = {
  title: seoTitle(TITLE),
  description: DESCRIPTION,
  keywords: [
    'text animation generator', 'animated text generator', 'text animation', 'animated text css js',
    'text animation on scroll', 'scroll text animation', 'split text animation', 'letter by letter animation',
    'react text animation', 'gsap splittext alternative',
  ],
  alternates: { canonical: '/text-animation-generator' },
  openGraph: { type: 'article', title: TITLE, description: DESCRIPTION, url: `${SITE_URL}/text-animation-generator` },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

const JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      name: 'Text animation generator',
      url: `${SITE_URL}/text-animation-generator`,
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

export default function TextAnimationGeneratorPage() {
  return (
    <SiteShell
      active="/text-animation-generator"
      crumbs={[['Text animation generator', '/text-animation-generator']]}
      kicker="text / your turn"
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(JSON_LD) }} />
      <div className="stk">

        <header className="pg-head stk-head">
          <div>
            <p className="pg-kicker">
              <span>tool / text animation</span>
              <span>javascript · react</span>
            </p>
            <h1 className="pg-title stk-title">Text animation generator</h1>
            <p className="pg-lede">
              Type a line, split it by word, letter or line, choose how each piece arrives, and watch it play. Then copy
              the code: plain JavaScript or a React component, animated by scroll on your page.
            </p>
            <div className="pg-actions">
              <a href="#generator" className="btn btn-solid" data-magnetic>Open the generator ↓</a>
              <CopyCommand />
            </div>
            <dl className="pg-facts">
              <div><dt>Splits</dt><dd>{SPLITS.length}</dd></div>
              <div><dt>Motions</dt><dd>{TEXT_EFFECTS.length}</dd></div>
              <div><dt>Easings</dt><dd>{TEXT_EASINGS.length}</dd></div>
              <div><dt>Gzipped</dt><dd>{SELF_ENTRIES.text} KB</dd></div>
            </dl>
          </div>
          <StaggerFigure />
        </header>

        <div className="stk-body">
          <Toc label="On this page" items={TOC} />
          <div className="stk-main">

            <Sec n={1} k="The tool" id="generator" title="Make your text animation">
              <TextGenerator />
            </Sec>

            <Sec n={2} k="The model" id="how" title="How scroll drives it">
              <p className="stk-p">
                The animation has one number behind it, its progress from 0 to 1. On a page that number comes from the
                scroll: 0 when the element’s top reaches 85% of the window, 1 when it reaches 40%. Each piece
                takes its own slice of that range, <C>stagger</C> after the one before (fig. 1), so scrolling faster
                plays it faster and scrolling back plays it backwards, unless <C>once</C> keeps it in place.
              </p>
              <CodeBox file="main.js">{SCROLL_TRIGGERED}</CodeBox>
              <Note k="Reduced motion">
                For readers who ask their system for less motion, the text appears in place at once, with no movement.
              </Note>
            </Sec>

            <Sec n={3} k={`${SPLITS.length} ways`} id="split" title="Words, letters or lines">
              <div className="stk-faq">
                {SPLITS.map((s) => (
                  <div key={s.k} className="stk-q">
                    <span className="stk-q-n">{s.k}</span>
                    <div><p className="stk-p">{s.d}</p></div>
                  </div>
                ))}
              </div>
            </Sec>

            <Sec n={4} k={`${OPTIONS.length} options`} id="options" title="Every scrollText option">
              <div className="stk-faq">
                {OPTIONS.map((o) => (
                  <div key={o.k} className="stk-q">
                    <span className="stk-q-n">{o.k}</span>
                    <div>
                      <p className="stk-p"><C>{o.def}</C> by default. {o.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Sec>

            <Sec n={5} k={`${FAQ.length} questions`} id="faq" title="Text animation questions">
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
                Accessible splitting in depth: <Link href="/blog/accessible-split-text-animation">split text a screen
                reader can read</Link>. All of svg-scroll-draw {SELF.version}: <Link href="/docs">the docs</Link>.
              </p>
            </Sec>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
