import type { Metadata } from 'next';
import '@/components/stack/stack.css';
import '@/components/textfill/textfill.css';
import Link from 'next/link';
import { SELF } from '@/data/competitors';
import { seoTitle } from '../_lib/seo';
import { SiteShell } from '@/components/site/SiteShell';
import { jsonLd, SITE_URL } from '@/lib/json-ld';
import { CodeBox } from '@/components/site/CodeBox';
import { ToolNextStep } from '@/components/tool-kit/ToolNextStep';
import { TextFillGenerator } from '@/components/textfill/TextFillGenerator';
import { FillFigure } from '@/components/textfill/FillFigure';
import { StripFigure } from '@/components/textfill/StripFigure';
import { DARK, DIRECTIONS, ENGINES, INITIAL, SLUG, SPLITS, rangeText } from '@/components/textfill/model';
import { C, Note, Sec, Toc } from '@/components/stack/parts';

// Searches this page is for: "text fill on scroll", "scroll text highlight",
// "text reveal on scroll css", "apple text scroll animation". It writes both
// answers people mean by them: a colour sweep through the text (a gradient
// clipped to it, in CSS or with scrollProgress) and words lighting up one by
// one (scrollText).
const TITLE = 'Text Fill on Scroll Generator: CSS & JS Text Highlight';
const DESCRIPTION =
  'Make text fill with colour, or light up word by word, as it scrolls: the Apple-style highlight in pure CSS or scrollText. Preview it, copy CSS, JS or React.';

const ANATOMY = `.text-fill > span {
  /* The letters show only what is behind them. */
  color: transparent;
  background:
    /* The filled colour, p of the way along... */
    linear-gradient(${DARK.full}, ${DARK.full}) 0 0 / calc(var(--p) * 100%) 100% no-repeat
    /* ...and the unfilled colour under it. */
    ${DARK.dim};
  /* Both painted inside the letters only. */
  -webkit-background-clip: text;
  background-clip: text;
}`;

const REDUCED = `/* Optional: show it filled for readers who ask for less motion. */
@media (prefers-reduced-motion: reduce) {
  .text-fill,
  .text-fill > span {
    animation: none;
    background-size: 100% 100%;
  }
}`;

const ROWS: { k: string; css: string; progress: string; text: string }[] = [
  {
    k: 'What changes',
    css: 'A colour gradient behind the letters.',
    progress: 'The same gradient.',
    text: 'Each piece’s opacity, from from.opacity to 1.',
  },
  {
    k: 'The fill',
    css: 'A smooth front through the text, in any of the three directions.',
    progress: 'The same.',
    text: 'A word, letter or line at a time, in reading order, overlapping as the stagger allows.',
  },
  {
    k: 'Unfilled state',
    css: 'Any colour.',
    progress: 'Any colour.',
    text: 'The text colour at a lower opacity, so a blend of it and the background.',
  },
  {
    k: 'JavaScript',
    css: 'None.',
    progress: 'scrollProgress writes --scroll-progress and its eased twin on each frame while the text is on screen.',
    text: 'scrollText writes every piece’s opacity on each frame while the text is on screen.',
  },
  {
    k: 'Browsers',
    css: 'Those with animation-timeline. The others show the text filled, from the rule outside @supports.',
    progress: 'Wherever the script runs.',
    text: 'Wherever the script runs.',
  },
  {
    k: 'Stay filled',
    css: 'No: a scroll timeline always follows the scroll.',
    progress: 'With onProgress keeping the furthest value, as the generator writes it.',
    text: 'once: true, its default.',
  },
  {
    k: 'Reduced motion',
    css: 'Still fills: nothing moves.',
    progress: 'Still fills.',
    text: 'Shows the text in full at once.',
  },
  {
    k: 'Scrolls with',
    css: 'The nearest scrolling box: the window, or a panel.',
    progress: 'The window, or the box given as scrollContainer.',
    text: 'The window only.',
  },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: 'How do I make text fill with colour on scroll?',
    a: 'Paint the text with its background: give it color: transparent and background-clip: text, and put two colours behind it, the filled one as a gradient layer sized to the progress and the unfilled one under it. Then let the scroll set the progress, so background-size runs from 0% to 100% as the text crosses the viewport. In CSS a view timeline does that (animation-timeline); with svg-scroll-draw, scrollProgress writes the progress to --scroll-progress and the CSS sizes the gradient with calc(var(--scroll-progress) * 100%). The generator above writes either.',
  },
  {
    q: 'Can I make a text reveal on scroll with CSS only?',
    a: `Yes, in browsers with CSS scroll-driven animations. Animate background-size in a @keyframes rule, attach it to a view timeline on the text block with animation-timeline, and say where it starts and ends with animation-range: the generator’s default is ${rangeText(INITIAL)}. Put the transparent text and the gradient inside @supports (animation-timeline: view()), so a browser without scroll timelines shows ordinary, fully coloured text. What CSS cannot do is keep the text filled once it has been read, or split it into words for you.`,
  },
  {
    q: 'How do I make the Apple-style text highlight that lights up word by word?',
    a: 'Split the text into words and take each one from dim to full as it scrolls, one after another. scrollText does the splitting: scrollText(el, { from: { opacity: 0.3 }, stagger: 0.05 }) leaves every word where it is at 30% opacity and brings each to full opacity in turn as the text crosses the viewport. For one word strictly after another, set the stagger to 1 ÷ the number of words; the generator has a button for it. For a smooth colour sweep through the words instead, use one of the gradient engines.',
  },
  {
    q: 'Why does my text fill every line at once instead of line by line?',
    a: 'The gradient is on a block. A block’s background is one rectangle, so a fill 50% across it is half of every line. Wrap the text in an inline <span> inside the block and put the gradient on the span: an inline box’s background is laid out as if its lines were set end to end (box-decoration-break: slice, the default), so 50% is the first half of the text in reading order, line after line. Fig. 2 draws both.',
  },
  {
    q: 'Is text that fills on scroll accessible?',
    a: 'It can be. With the gradient the text itself is never changed: it stays one ordinary piece of text that screen readers read, search engines index and readers can select. scrollText wraps each piece in an aria-hidden span and adds one visually hidden copy of the whole text, so a screen reader reads the sentence once, in full. Two things are worth checking: the unfilled text is still text someone may be reading, so give it enough contrast (the generator shows the ratio), and readers who ask for reduced motion get scrollText’s text in full straight away.',
  },
  {
    q: 'How do I keep the text filled after it scrolls past?',
    a: 'Use once. scrollText has it on by default (once: true): it keeps the furthest progress it has reached, so scrolling back up leaves the words lit. scrollProgress has no once of its own, so the generator’s code keeps the furthest value in an onProgress callback and writes it to --text-fill for the CSS to read. A CSS scroll timeline always follows the scroll, both ways.',
  },
  {
    q: 'How do I add text fill on scroll in React or Next.js?',
    a: 'For the word-by-word fill, render <ScrollText> from svg-scroll-draw/react with the text as its child and the options as props, such as from={{ opacity: 0.4 }}; its module is marked use client, so it can be imported from a Server Component. For the colour fill, call scrollProgress in a useEffect and return its destroy(), in a component marked use client, as the React tab writes it. The CSS-only engine needs no JavaScript: a className and the stylesheet.',
  },
];

const TOC = [
  { id: 'generator', label: 'The generator' },
  { id: 'how', label: 'How the fill works' },
  { id: 'engines', label: `Three engines · ${ENGINES.length}` },
  { id: 'readable', label: 'Readable all the way' },
  { id: 'use', label: 'Use it in your project' },
  { id: 'faq', label: `Questions · ${FAQ.length}` },
];

export const metadata: Metadata = {
  title: seoTitle(TITLE),
  description: DESCRIPTION,
  keywords: [
    'text fill on scroll', 'scroll text highlight', 'text reveal on scroll css', 'apple text scroll animation',
    'text highlight on scroll', 'background-clip text scroll', 'animation-timeline view text', 'scroll text color change',
    'word by word highlight on scroll', 'react text fill on scroll',
  ],
  alternates: { canonical: `/${SLUG}` },
  openGraph: { type: 'article', title: TITLE, description: DESCRIPTION, url: `${SITE_URL}/${SLUG}` },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

const JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      name: 'Text fill on scroll generator',
      url: `${SITE_URL}/${SLUG}`,
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

export default function TextFillScrollGeneratorPage() {
  return (
    <SiteShell
      active={`/${SLUG}`}
      crumbs={[['Text fill on scroll generator', `/${SLUG}`]]}
      kicker="text / your turn"
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(JSON_LD) }} />
      <div className="stk">

        <header className="pg-head stk-head">
          <div>
            <p className="pg-kicker">
              <span>tool / text fill</span>
              <span>css · javascript · react</span>
            </p>
            <h1 className="pg-title stk-title">Text fill on scroll generator</h1>
            <p className="pg-lede">
              A heading or a paragraph that fills with colour as it scrolls into view, or lights up word by word: the
              highlight from product pages. Make it in plain CSS on a scroll timeline, or with svg-scroll-draw, scroll
              the preview, and copy the CSS, HTML, JavaScript or React.
            </p>
            <div className="pg-actions">
              <a href="#generator" className="btn btn-solid" data-magnetic>Open the generator ↓</a>
              <Link href="/text-animation-generator" className="btn" data-magnetic>Text animation generator →</Link>
            </div>
            <dl className="pg-facts">
              <div><dt>Engines</dt><dd>{ENGINES.length}</dd></div>
              <div><dt>Directions</dt><dd>{DIRECTIONS.length}</dd></div>
              <div><dt>Splits</dt><dd>{SPLITS.length}</dd></div>
              <div><dt>Library</dt><dd>{SELF.version}</dd></div>
            </dl>
          </div>
          <FillFigure />
        </header>

        <div className="stk-body">
          <Toc label="On this page" items={TOC} />
          <div className="stk-main">

            <Sec n={1} k="The tool" id="generator" title="Fill text as it scrolls">
              <p className="stk-p">
                The box below is a small viewport. Scroll it, drag the slider or press Play: the text fills between the
                start and end lines, and what fills it is the engine you picked, given your settings and the box in
                place of the window.
              </p>
              <TextFillGenerator version={SELF.version} />
            </Sec>

            <Sec n={2} k="The mechanism" id="how" title="How the fill works">
              <p className="stk-p">
                The letters are see-through, and what shows through them is the background, clipped to their shapes by{' '}
                <C>background-clip: text</C>. The background has two colours: the unfilled one everywhere, and over it
                a gradient layer of the filled colour, sized to the progress. At progress 0 that layer has no width; at
                1 it covers the text (fig. 1).
              </p>
              <CodeBox file="the idea.css">{ANATOMY}</CodeBox>
              <p className="stk-p">
                Which box carries the background decides the direction. Put it on an inline <C>{'<span>'}</C> and the
                fill runs through the text in reading order, because an inline box’s background is laid out as if its
                lines were one line, end to end. Put it on the block and one front crosses every line at once; size it
                downwards instead and it fills from the top (fig. 2).
              </p>
              <StripFigure />
              <Note k="Where p comes from">
                The CSS engine animates <C>background-size</C> on a view timeline: the browser’s own scroll progress for
                the block, between the two points of <C>animation-range</C>. scrollProgress measures the same window in
                JavaScript and writes it as <C>--scroll-progress</C> on the block, for the CSS to read with{' '}
                <C long>calc(var(--scroll-progress, 0) * 100%)</C>.
              </Note>
              <Note k="The range">
                The generator writes each trigger point as an <C>entry-crossing</C> position: 0% is the block’s top on
                the viewport’s bottom and 100% its bottom there, whatever its height, and from there the edge still has
                (100 − line)% of the viewport to go. So <C>{"'bottom 50%'"}</C> is{' '}
                <C long>entry-crossing calc(100% + 50vh)</C>, and the two say the same thing to the pixel.
              </Note>
            </Sec>

            <Sec n={3} k={`${ENGINES.length} engines`} id="engines" title="CSS, scrollProgress or scrollText">
              <p className="stk-p">
                The two gradient engines draw exactly the same thing; they differ in what drives it. scrollText is a
                different effect, words that brighten one after another, and the one to use when a sentence should
                light up a word at a time.
              </p>
              <table className="tfl-table">
                <thead>
                  <tr><th scope="col">Aspect</th><th scope="col">CSS only</th><th scope="col">scrollProgress</th><th scope="col">scrollText</th></tr>
                </thead>
                <tbody>
                  {ROWS.map((r) => (
                    <tr key={r.k}>
                      <th scope="row">{r.k}</th>
                      <td data-k="CSS only">{r.css}</td>
                      <td data-k="scrollProgress">{r.progress}</td>
                      <td data-k="scrollText">{r.text}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Note k="In a panel">
                scrollText follows the window’s scroll and has no option for another scroller. For text inside a
                scrolling panel, use the CSS engine, whose view timeline finds the nearest scrolling box, or
                scrollProgress with <C>scrollContainer</C>, as the preview above does.
              </Note>
              <Note k="Plain text">
                scrollText splits the element’s text content, so markup inside it, a link or an <C>{'<em>'}</C>, comes
                out as plain text. The gradient engines leave the markup alone.
              </Note>
            </Sec>

            <Sec n={4} k="Accessibility" id="readable" title="Readable before, during and after">
              <p className="stk-p">
                <b className="tfl-b">The text stays text.</b> The gradient engines change nothing but the paint: one
                text node, read by screen readers, indexed by search engines and selectable like any other. The CSS
                adds a <C>::selection</C> rule, because selected see-through letters would otherwise show the
                browser’s highlight colour where the letters should be.
              </p>
              <p className="stk-p">
                <b className="tfl-b">Split, but read once.</b> scrollText wraps each word, letter or line in a span
                marked <C>aria-hidden</C> and adds one visually hidden copy of the whole text, which cannot be selected,
                so a screen reader reads the sentence once and a copy picks up the visible text once.{' '}
                <Link href="/blog/accessible-split-text-animation">Why a hidden copy and not an aria-label</Link>.
              </p>
              <p className="stk-p">
                <b className="tfl-b">The unfilled text is still text.</b> Someone may read a paragraph faster than they
                scroll it, so the dim state needs contrast too: WCAG asks 4.5:1 for body text and 3:1 for large text.
                The generator shows the ratio for both states as you pick the colours, the scrollText one blended
                from the text colour and its opacity as the browser composites it.
              </p>
              <p className="stk-p">
                <b className="tfl-b">Reduced motion.</b> For readers who ask their system for less motion, scrollText
                shows the text in full at once, and switches to that if they turn the setting on mid-visit. The
                gradient engines move nothing, only change colour in place, so they keep filling; to show the text
                filled for those readers as well, add this after the generated CSS.
              </p>
              <CodeBox file="reduced-motion.css">{REDUCED}</CodeBox>
            </Sec>

            <Sec n={5} k="Next" id="use" title="Use it in your project">
              <ToolNextStep
                slug={SLUG}
                api="scrollText"
                entry="text"
                docs="/docs#scroll-text"
                related={['text-animation-generator', 'scroll-trigger-visualizer']}
              />
              <Note k="Colour fill">
                The gradient engine’s script is scrollProgress, from <C>svg-scroll-draw/progress</C>:{' '}
                <Link href="/docs#scroll-progress" className="tfl-a">scrollProgress in the docs</Link>. The CSS-only engine needs no
                package at all.
              </Note>
            </Sec>

            <Sec n={6} k={`${FAQ.length} questions`} id="faq" title="Text fill on scroll questions">
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
                The rest of svg-scroll-draw {SELF.version}: <Link href="/docs">the docs</Link>, the{' '}
                <Link href="/scroll-trigger-visualizer">scroll trigger visualizer</Link> for the start and end lines,
                and the <Link href="/css-scroll-driven-animation-generator">CSS scroll-driven animation generator</Link>.
              </p>
            </Sec>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
