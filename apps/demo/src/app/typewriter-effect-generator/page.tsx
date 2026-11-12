import type { Metadata } from 'next';
import '@/components/stack/stack.css';
import '@/components/typewriter/typewriter.css';
import Link from 'next/link';
import { SELF, SELF_ENTRIES } from '@/data/competitors';
import { seoTitle } from '../_lib/seo';
import { SiteShell } from '@/components/site/SiteShell';
import { jsonLd, SITE_URL } from '@/lib/json-ld';
import { CodeBox } from '@/components/site/CodeBox';
import { ToolNextStep } from '@/components/tool-kit/ToolNextStep';
import { TypewriterGenerator } from '@/components/typewriter/TypewriterGenerator';
import { StepsFigure } from '@/components/typewriter/StepsFigure';
import {
  CARETS, INITIAL, MODES, SCROLL_START, SLUG, TYPER_FN, cssTimes, endOf, fmtS, jsCode, phrasesOf, typeCss, typerLength,
  typerOptions,
} from '@/components/typewriter/model';
import { C, Note, Sec, Toc } from '@/components/stack/parts';

// Searches this page is for: "typewriter effect css", "typewriter animation",
// "typing animation css", "typewriter effect javascript". It writes all three
// answers people mean by them, and says when each one fits: pure CSS on
// steps(), letters typed by the scroll (scrollText), and a small JS typer that
// deletes and retypes.
const TITLE = 'Typewriter Effect Generator: CSS & JS Typing Animation';
const DESCRIPTION =
  'Make a typewriter effect in pure CSS with steps(), typed as the reader scrolls, or with a JS typer that deletes and retypes. Preview it, copy CSS, JS or React.';

/** Every figure below is worked from the generator's own defaults. */
const ONCE = { ...INITIAL, loop: false };
const CSS_T = cssTimes(ONCE);
const ANATOMY = typeCss(ONCE);
const SCROLL_JS = jsCode({ ...INITIAL, mode: 'scroll' });
const TYPER_LINES = TYPER_FN.split('\n').length;
const DONE_AFTER = typerLength(phrasesOf(INITIAL.text), typerOptions(ONCE));
const START_PCT = SCROLL_START.split(' ')[1];
const END_PCT = endOf('default').split(' ')[1];

const WAYS: { k: string; css: string; scroll: string; typer: string }[] = [
  {
    k: 'Moved by',
    css: 'The clock: a CSS animation.',
    scroll: 'The scroll position, between a start and an end line across the window.',
    typer: 'The clock: setTimeout, one letter at a time.',
  },
  {
    k: 'Text',
    css: 'One line, cut to its character count.',
    scroll: 'One text, of any length; it wraps.',
    typer: 'Several phrases, one after another.',
  },
  { k: 'Font', css: 'Monospace only.', scroll: 'Any.', typer: 'Any.' },
  {
    k: 'Deletes',
    css: 'The same line, on a loop.',
    scroll: 'Only as the reader scrolls back, with once: false.',
    typer: 'Each phrase, at a speed of its own.',
  },
  {
    k: 'Starts',
    css: 'On load; when in view with a few lines of JavaScript.',
    scroll: `As its top passes ${START_PCT} of the way down the window.`,
    typer: 'On load, or when in view.',
  },
  {
    k: 'Script',
    css: 'None, or the few lines that wait for the scroll.',
    scroll: `scrollText, ${SELF_ENTRIES.text} KB gzipped, and a short function for the caret.`,
    typer: `${TYPER_LINES} lines, no library.`,
  },
  {
    k: 'Screen readers',
    css: 'Read the whole line: it is all in the HTML, only clipped.',
    scroll: 'Read the hidden copy scrollText adds, once.',
    typer: 'Read a hidden copy in the markup, once.',
  },
  { k: 'Less motion', css: 'The whole line, still.', scroll: 'The whole text, at once.', typer: 'Every phrase, still.' },
  {
    k: 'Use it for',
    css: 'A short heading or a terminal line, with no script at all.',
    scroll: 'A heading or a sentence that types itself as the reader reaches it.',
    typer: 'Rotating words in a hero; any text that changes.',
  },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: 'How do I make a typewriter effect in CSS?',
    a: `Set the line in a monospace font with white-space: nowrap and overflow: hidden, and animate its width from 0 to its length in ch with steps() set to the same number: for a ${CSS_T.n}-character line, width: ${CSS_T.n}ch and animation: typing ${fmtS(CSS_T.type)} steps(${CSS_T.n}) both, with @keyframes typing { from { width: 0 } }. Each step uncovers one whole letter, because in a monospace font every letter is 1ch wide. A border-right on the same element is the caret, and a second animation on its colour, with step-end timing, makes it blink. The generator above writes the whole rule for your line.`,
  },
  {
    q: 'Why does my CSS typewriter cut letters in half or stop too early?',
    a: 'The width and the letters disagree. The number in steps() and in the width must be the exact character count, spaces included. The font must be monospace, because ch is the width of the digit 0 and only a monospace font makes every letter that wide. letter-spacing must be 0, since it widens every letter. Under box-sizing: border-box the caret’s border eats into the width, so the rule needs content-box. And emoji and Chinese, Japanese or Korean characters are about 2ch wide, which no count fixes: type those with JavaScript.',
  },
  {
    q: 'How do I make a typewriter effect in JavaScript?',
    a: `Add one character at a time on a timer: write the first n characters of the phrase into an element, wait the typing speed, and do it again; when the phrase is whole, wait, then take characters away at the delete speed and start the next one. The generator’s JS typer is ${TYPER_LINES} lines with no library. Two details matter. Count characters with Array.from(text), not text.length, so an emoji is never cut in half. And write into an aria-hidden element beside a visually hidden copy of the whole text, so a screen reader reads the text once instead of every change.`,
  },
  {
    q: 'How do I type, delete and retype several words?',
    a: 'Keep the words in an array and loop over it: type one, hold it, delete it letter by letter, then type the next, back to the first after the last. The JS typer above does exactly that, with a typing speed, a delete speed and a hold of its own, and loop: false to stop on the last word. CSS alone can type, delete and retype one line, but each different word needs its own width and step count, so rotating several words is a job for JavaScript.',
  },
  {
    q: 'How do I make text type itself as you scroll?',
    a: `Tie each letter to its own share of the scroll. With svg-scroll-draw that is scrollText(el, { split: 'chars', stagger: 1 / letters, easing: (t) => (t > 0 ? 1 : 0), from: { opacity: 0 } }), where letters is the number of characters other than spaces: each letter appears whole as the reader scrolls through its share, between the text’s top reaching ${START_PCT} of the way down the window and reaching ${END_PCT}. Scrolling back leaves it typed, because once is on by default; once: false un-types it. The generator’s On scroll way writes this, with a caret that follows the last letter shown.`,
  },
  {
    q: 'Is a typewriter effect accessible?',
    a: 'It can be, with three things. Screen readers must get the whole text once, from the start, not each letter as it appears: keep the full text in the page, hide the typed letters with aria-hidden beside a visually hidden copy, and never put them in an aria-live region. Readers who ask for reduced motion should see the text whole, which all three ways here do through prefers-reduced-motion. And text that keeps moving, or a caret that keeps blinking, for more than five seconds needs a way to pause or stop it under WCAG 2.2.2: type once, or give a looping typer a pause button.',
  },
  {
    q: 'How do I make a blinking cursor in CSS?',
    a: 'Draw the caret, then switch it on and off. For a CSS typewriter line it can be the element’s border-right; anywhere else, an empty ::after with display: inline-block, a width, a height of 1em and background: currentColor, pulled back by a negative margin of its own width so the text never moves. Then animate it with @keyframes caret { 50% { opacity: 0 } } over 1s, step-end, infinite: step-end holds each half still, so it blinks instead of fading. Turn the animation off under prefers-reduced-motion.',
  },
];

const TOC = [
  { id: 'generator', label: 'The generator' },
  { id: 'ways', label: `Three ways · ${MODES.length}` },
  { id: 'css', label: 'The CSS version' },
  { id: 'scroll', label: 'Typing on scroll' },
  { id: 'readable', label: 'Accessible typing' },
  { id: 'use', label: 'Use it in your project' },
  { id: 'faq', label: `Questions · ${FAQ.length}` },
];

export const metadata: Metadata = {
  title: seoTitle(TITLE),
  description: DESCRIPTION,
  keywords: [
    'typewriter effect css', 'typewriter animation', 'typing animation css', 'typewriter effect javascript',
    'typewriter effect generator', 'css typing effect', 'typing text animation', 'typewriter effect react',
    'blinking cursor css', 'typewriter effect on scroll',
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
      name: 'Typewriter effect generator',
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

export default function TypewriterEffectGeneratorPage() {
  return (
    <SiteShell
      active={`/${SLUG}`}
      crumbs={[['Typewriter effect generator', `/${SLUG}`]]}
      kicker="text / your turn"
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(JSON_LD) }} />
      <div className="stk">

        <header className="pg-head stk-head">
          <div>
            <p className="pg-kicker">
              <span>tool / typewriter effect</span>
              <span>css · javascript · react</span>
            </p>
            <h1 className="pg-title stk-title">Typewriter effect generator</h1>
            <p className="pg-lede">
              Make text appear one letter at a time behind a blinking caret: in pure CSS with steps(), as the reader
              scrolls with scrollText, or with a small JavaScript typer that deletes and retypes several phrases.
              Preview each one, then copy the CSS, HTML, JavaScript or React.
            </p>
            <div className="pg-actions">
              <a href="#generator" className="btn btn-solid" data-magnetic>Open the generator ↓</a>
              <Link href="/text-animation-generator" className="btn" data-magnetic>Text animation generator →</Link>
            </div>
            <dl className="pg-facts">
              <div><dt>Ways</dt><dd>{MODES.length}</dd></div>
              <div><dt>Carets</dt><dd>{CARETS.length}</dd></div>
              <div><dt>Typer</dt><dd>{TYPER_LINES} lines</dd></div>
              <div><dt>scrollText</dt><dd>{SELF_ENTRIES.text} KB</dd></div>
            </dl>
          </div>
          <StepsFigure />
        </header>

        <div className="stk-body">
          <Toc label="On this page" items={TOC} />
          <div className="stk-main">

            <Sec n={1} k="The tool" id="generator" title="Make a typewriter effect">
              <p className="stk-p">
                Pick a way to type, write your text (one phrase per line), set the speeds and the caret, and watch the
                preview: it runs the code below, written from the same settings with only what differs from each
                one’s defaults.
              </p>
              <TypewriterGenerator version={SELF.version} />
            </Sec>

            <Sec n={2} k={`${MODES.length} ways`} id="ways" title="Three ways to type, and when each fits">
              <p className="stk-p">
                They look alike for a second and part company after that. CSS is the lightest and the most limited;
                scrollText ties the typing to the reader’s scroll instead of a clock; the typer is the only one that
                can change what it types.
              </p>
              <table className="typ-table">
                <thead>
                  <tr><th scope="col">Aspect</th><th scope="col">CSS only</th><th scope="col">On scroll · scrollText</th><th scope="col">JS typer</th></tr>
                </thead>
                <tbody>
                  {WAYS.map((r) => (
                    <tr key={r.k}>
                      <th scope="row">{r.k}</th>
                      <td data-k="CSS only">{r.css}</td>
                      <td data-k="scrollText">{r.scroll}</td>
                      <td data-k="JS typer">{r.typer}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Note k="The typer">
                Each phrase gets a short blank, then a letter every <C>speed</C> ms, a <C>hold</C> while it is whole,
                and a letter gone every <C>eraseSpeed</C> ms; then the next phrase. It shows the caret steady while
                letters come and go and blinks it in the pauses, as a real one does.
              </Note>
            </Sec>

            <Sec n={3} k="steps()" id="css" title="How the CSS typewriter works">
              <p className="stk-p">
                Three properties do the work. <C>white-space: nowrap</C> keeps the text on one line,{' '}
                <C>overflow: hidden</C> hides whatever is past the box’s right edge, and the width, animated from 0 to
                the text’s length, decides how much shows. In a monospace font every character is the same width,
                1ch, so {CSS_T.n} characters are exactly {CSS_T.n}ch, and <C>steps({CSS_T.n})</C> takes the width there
                in {CSS_T.n} jumps of 1ch: one whole letter each (fig. 1).
              </p>
              <CodeBox file="typewriter.css">{ANATOMY}</CodeBox>
              <p className="stk-p">
                <C>steps(N)</C> on its own means <C>steps(N, end)</C>: each jump comes at the end of its step, so the
                first letter shows one letter’s time after the start and the last at the very end. The caret is the
                element’s own right border, and <C>overflow: hidden</C> clips what is inside the border, never the
                border, so it rides along at the edge of the text. A second animation blinks it, with{' '}
                <C>step-end</C> timing so it switches instead of fading. On a loop, one <C>@keyframes</C> rule holds
                the whole cycle, typing, holding, deleting and a blank, and the step timing applies to each stretch
                between two keyframes.
              </p>
              <Note k="One line">
                <C>white-space: nowrap</C> never wraps, so a line wider than the screen runs off it. The generated CSS
                sizes the font so all the letters fit 90% of the screen, taking a monospace letter as about 0.6em.
              </Note>
              <Note k="Monospace">
                <C>ch</C> is the width of the digit 0. In a monospace font that is every letter’s width; in any other,
                an i and a W differ, and the steps stop part way through letters.
              </Note>
              <Note k="Fixed count">
                The count is in two places, the width and <C>steps()</C>, so a different text needs both changed. That
                is why the generator writes the CSS for your line, and why its React component keeps its text fixed.
              </Note>
              <Note k="Spacing">
                <C>letter-spacing</C> adds to every letter, so N letters overrun Nch and the end is cut off: the rule
                sets it to 0. Emoji and Chinese, Japanese or Korean characters are about 2ch wide, which no count fixes.
              </Note>
              <Note k="The box">
                Under <C>box-sizing: border-box</C>, which many resets put on every element, the width would include
                the caret’s border and cut the last letter: the rule sets <C>content-box</C>.
              </Note>
            </Sec>

            <Sec n={4} k="scrollText" id="scroll" title="Typing as the reader scrolls">
              <p className="stk-p">
                scrollText’s progress runs from 0, when the text’s top reaches {START_PCT} of the way down the window,
                to 1, when it reaches {END_PCT}: its default trigger. With <C>{"split: 'chars'"}</C> every character
                but a space is a piece of its own, and each piece takes its own share of that progress, starting{' '}
                <C>stagger</C> × its place in line of the way through. With <C>stagger</C> at 1 ÷ the number of
                letters, the shares run one after another and never overlap, so letter i begins as progress passes
                i ÷ letters. The easing <C long>{'(t) => (t > 0 ? 1 : 0)'}</C> turns each share into a switch, hidden
                until it begins and whole after, and <C>{'from: { opacity: 0 }'}</C> only fades, where the default
                would also move each letter 24px.
              </p>
              <CodeBox file="main.js">{SCROLL_JS}</CodeBox>
              <Note k="The caret">
                scrollText draws no caret and reports no step, only <C>onComplete</C> at the end. followCaret watches
                the letters’ <C>style</C> attributes with a MutationObserver, which fires each time scrollText changes
                a letter’s opacity, and moves the <C>is-caret</C> class onto the last letter shown; the CSS draws the
                caret on that letter’s <C>::after</C>.
              </Note>
              <Note k="Whole words">
                <C>{"split: 'chars'"}</C> makes each letter an inline-block, and a line may break between any two
                inline-blocks, so in 2.23.3 a word can split across two lines. Letters that only fade need no box of
                their own: the generated CSS sets them back to inline, with <C>!important</C> to win over the inline
                style, and lets the spaces between them wrap again.
              </Note>
              <Note k="Emoji">
                In 2.23.3 <C>{"split: 'chars'"}</C> cuts the text into UTF-16 units, so an emoji, or any character
                outside the Basic Multilingual Plane, becomes two halves that each show as �. Leave such characters
                out of a scroll typewriter; the JS typer counts with <C>Array.from</C> and keeps them whole.
              </Note>
              <Note k="The window">
                scrollText follows the window’s scroll and has no option for another scroller. The preview above runs
                it in a box by handing it the progress with <C>seek()</C>, worked out from the box’s scroll with the
                same trigger arithmetic.
              </Note>
              <Note k="React">
                <C>{'<ScrollText>'}</C> from <C>svg-scroll-draw/react</C> takes the same options as props and rebuilds
                only when one of them changes; a new easing function on each render is called through, not rebuilt.
                Its module is marked <C>use client</C>, and so must be the component that hands it an easing function,
                since a function cannot be passed from a Server Component.
              </Note>
            </Sec>

            <Sec n={5} k="Accessibility" id="readable" title="Typing that everyone can read">
              <p className="stk-p">
                <b className="typ-b">Read once, in full, from the start.</b> A screen reader should hear the sentence,
                not letters arriving. Each way here keeps the whole text in the page from the first moment: the CSS
                version only clips its line, so the text is all there; scrollText hides its letters with{' '}
                <C>aria-hidden</C> and adds one visually hidden copy of the whole text; and the typer writes into an{' '}
                <C>aria-hidden</C> span beside a hidden copy of every phrase. None of them is a live region (
                <C>aria-live</C>), the one thing that would make a screen reader announce each change.
              </p>
              <p className="stk-p">
                <b className="typ-b">A hidden copy, not an aria-label.</b> ARIA does not allow <C>aria-label</C> on a{' '}
                <C>{'<p>'}</C>, a <C>{'<span>'}</C> or a <C>{'<div>'}</C>, and a screen reader may skip it there; with
                every letter hidden it would then read nothing. scrollText uses a hidden copy for that reason, and so
                does the typer. <Link href="/blog/accessible-split-text-animation">More on splitting text a screen
                reader can read</Link>.
              </p>
              <p className="stk-p">
                <b className="typ-b">Less motion.</b> Readers who ask their system for reduced motion see the text whole
                and still. The CSS turns its animations off under <C>prefers-reduced-motion</C>; scrollText shows every
                letter at once, and switches to that if the setting is turned on during a visit; the typer shows every
                phrase. The caret stops blinking.
              </p>
              <p className="stk-p">
                <b className="typ-b">Five seconds.</b> WCAG 2.2.2, Pause, Stop, Hide, asks that anything moving or
                blinking by itself for more than five seconds, beside other content, can be paused, stopped or hidden. A
                typer on a loop never stops, and a caret that blinks for ever counts as well. Type once instead (with the
                generator’s default text and speeds the typer is done after {fmtS(DONE_AFTER)}), or wire the function{' '}
                <C>typewriter()</C> returns, which stops it, to a pause button, and choose a steady caret.
              </p>
            </Sec>

            <Sec n={6} k="Next" id="use" title="Use it in your project">
              <ToolNextStep
                slug={SLUG}
                api="scrollText"
                entry="text"
                docs="/docs#scroll-text"
                related={['text-animation-generator', 'css-keyframes-animation-generator']}
              />
              <Note k="No package">
                Only the scroll way imports anything. The CSS version is a stylesheet, and the typer is the function
                at the end of its own script.
              </Note>
            </Sec>

            <Sec n={7} k={`${FAQ.length} questions`} id="faq" title="Typewriter effect questions">
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
                <Link href="/text-animation-generator">text animation generator</Link> for words and letters that move,
                and the <Link href="/text-fill-scroll-generator">text fill on scroll generator</Link>.
              </p>
            </Sec>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
