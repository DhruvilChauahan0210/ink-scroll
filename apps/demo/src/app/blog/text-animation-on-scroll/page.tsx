import type { Metadata } from 'next';
import Link from 'next/link';
import { seoTitle } from '../../_lib/seo';
import { SELF_ENTRIES } from '@/data/competitors';
import { AOS_EFFECT_COUNT } from '@/data/aos-effects';
import { BlogArticle, Section, Code, Callout, Figure, Closing } from '@/components/blog/BlogArticle';
import { StaggerFigure } from './StaggerFigure';

// Searches this post is for: "animated text with css/js", "text animation on
// scroll", "animate text on scroll css", "split text animation". Every listing
// below was run in Chromium, Firefox and WebKit, screen-reader name included.
const TITLE = 'How to Animate Text on Scroll with CSS and JavaScript';
const DESCRIPTION =
  'Split a heading into words or letters, reveal them one by one as it scrolls in, scrub them with pure CSS, and keep the text whole for screen readers.';
const URL = 'https://svg-scroll-draw.vercel.app/blog/text-animation-on-scroll';

export const metadata: Metadata = {
  title: seoTitle(TITLE),
  description: DESCRIPTION,
  keywords: [
    'text animation on scroll',
    'animate text on scroll',
    'animated text css js',
    'scroll text animation css',
    'split text animation',
    'word by word text animation',
    'letter by letter animation css',
    'text reveal on scroll',
  ],
  alternates: { canonical: '/blog/text-animation-on-scroll' },
  openGraph: { title: TITLE, description: DESCRIPTION, url: URL },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline: 'How to animate text on scroll with CSS and JavaScript',
  description: DESCRIPTION,
  url: URL,
  datePublished: '2026-11-13',
  dateModified: '2026-11-13',
  author: { '@type': 'Person', name: 'Dhruvil Chauhan', url: 'https://github.com/DhruvilChauahan0210' },
  publisher: { '@type': 'Organization', name: 'svg-scroll-draw', url: 'https://svg-scroll-draw.vercel.app' },
  image: `${URL}/opengraph-image`,
  mainEntityOfPage: { '@type': 'WebPage', '@id': URL },
};

const HTML = `<h2 class="reveal-text">Words arrive one at a time</h2>`;

const SPLIT_JS = `// Wrap each word in a span that knows its place (--i), hide the
// pieces from screen readers, and give them one plain copy instead.
function splitWords(el) {
  const text = el.textContent.trim();
  const words = text.split(/\\s+/);
  el.textContent = '';
  words.forEach((word, i) => {
    const span = document.createElement('span');
    span.className = 'word';
    span.textContent = word;
    span.style.setProperty('--i', i);
    span.setAttribute('aria-hidden', 'true');
    el.append(span, i < words.length - 1 ? ' ' : '');
  });
  el.style.setProperty('--n', words.length);

  const copy = document.createElement('span');
  copy.className = 'visually-hidden';
  copy.textContent = text;
  el.append(copy);
}`;

const BASE_CSS = `.word,
.char {
  display: inline-block;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}`;

const REVEAL_CSS = `@media (prefers-reduced-motion: no-preference) {
  .reveal-text .word {
    opacity: 0;
    translate: 0 0.6em;
    transition: opacity 0.5s ease-out, translate 0.5s ease-out;
    /* Word i waits i × 60ms. */
    transition-delay: calc(var(--i) * 60ms);
  }
  .reveal-text.is-in .word {
    opacity: 1;
    translate: 0 0;
  }
}`;

const OBSERVE_JS = `const observer = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    entry.target.classList.add('is-in');
    observer.unobserve(entry.target); // play once
  }
}, { rootMargin: '0px 0px -15% 0px' }); // once it is 15% above the bottom

for (const el of document.querySelectorAll('.reveal-text')) {
  splitWords(el);
  observer.observe(el);
}`;

const CHARS_JS = `const graphemes = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

function splitChars(el) {
  const text = el.textContent.trim();
  const words = text.split(/\\s+/);
  el.textContent = '';
  let i = 0;
  words.forEach((word, w) => {
    // Each word is one box that does not wrap, so a line never breaks mid-word.
    const box = document.createElement('span');
    box.className = 'word';
    box.style.whiteSpace = 'nowrap';
    box.setAttribute('aria-hidden', 'true');
    // By grapheme: an emoji with a skin tone, or a flag, stays one piece.
    for (const { segment } of graphemes.segment(word)) {
      const span = document.createElement('span');
      span.className = 'char';
      span.textContent = segment;
      span.style.setProperty('--i', i++);
      box.append(span);
    }
    el.append(box, w < words.length - 1 ? ' ' : '');
  });
  el.style.setProperty('--n', i);

  const copy = document.createElement('span');
  copy.className = 'visually-hidden';
  copy.textContent = text;
  el.append(copy);
}`;

const CHARS_CSS = `@media (prefers-reduced-motion: no-preference) {
  .reveal-chars .char {
    opacity: 0;
    translate: 0 0.6em;
    transition: opacity 0.4s ease-out, translate 0.4s ease-out;
    transition-delay: calc(var(--i) * 25ms);
  }
  .reveal-chars.is-in .char {
    opacity: 1;
    translate: 0 0;
  }
}`;

const CHARS_OBSERVE_JS = `for (const el of document.querySelectorAll('.reveal-chars')) {
  splitChars(el);
  observer.observe(el);
}`;

const SCRUB_CSS = `@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .scrub-text { view-timeline: --text; }

    .scrub-text .word {
      animation: light-up linear both;
      animation-timeline: --text;
      /* Word i of n lights up in its own slice of the crossing. */
      animation-range:
        cover calc(20% + 30% * var(--i) / var(--n))
        cover calc(25% + 30% * var(--i) / var(--n));
    }
  }
}

@keyframes light-up {
  from { opacity: 0.15; }
  to   { opacity: 1; }
}`;

const LIB_JS = `import { scrollText } from 'svg-scroll-draw/text';

// Splits by letter, adds the screen-reader copy, and brings each letter
// up 24px from transparent as the heading moves through the window.
scrollText('.headline', { split: 'chars', stagger: 0.03 });`;

export default function Page() {
  return (
    <BlogArticle
      slug="text-animation-on-scroll"
      jsonLd={articleJsonLd}
      tags={['split text', 'IntersectionObserver', 'Scroll effects']}
      title={<>How to animate text on scroll with CSS and JavaScript</>}
      lede={
        <>
          A heading that arrives word by word is three small pieces: a script that splits the text into spans, CSS
          that staggers them, and an observer that starts it when the heading scrolls in. Here are all three, a
          letter-by-letter version, a pure-CSS one that follows the scroll, and the plain copy a screen reader needs.
        </>
      }
      facts={[
        { k: 'Split by', v: 'word · letter' },
        { k: 'Screen readers', v: 'one plain copy' },
        { k: 'scrollText', v: `${SELF_ENTRIES.text.toFixed(1)} KB` },
      ]}
      figure={
        <Figure n={1} caption="what the reveal CSS below does once the heading scrolls in: each word waits its place times 60 ms, then takes 0.5 s to arrive. A screen reader reads the plain copy, which never moves.">
          <StaggerFigure />
        </Figure>
      }
      further={[
        { href: '/blog/accessible-split-text-animation', label: 'Split-text animation a screen reader can read', blurb: 'Why the copy is a hidden span and not an aria-label on the heading.' },
        { href: '/blog/css-scroll-driven-animations', label: 'CSS scroll-driven animations explained', blurb: 'view(), scroll() and animation-range, behind the pure-CSS version here.' },
      ]}
    >
      <Section id="split" k="step 1" title="Split the text into pieces">
        <p>
          CSS cannot animate one word of a text node on its own, so each word needs its own element. A small function
          replaces the text with one <code>span</code> per word and writes each word’s place in the order into a
          custom property, <code>--i</code>, for the CSS to multiply.
        </p>
        <Code file="split.js">{SPLIT_JS}</Code>
        <Code file="split.css">{BASE_CSS}</Code>
        <p>
          The spans are <code>inline-block</code> because <code>translate</code> does not move an inline box. Each
          one is <code>aria-hidden</code>, and one visually hidden copy of the whole sentence goes at the end, so a
          screen reader reads “Words arrive one at a time” once, not six separate words. Why a hidden copy and
          not an <code>aria-label</code> on the heading is in{' '}
          <Link href="/blog/accessible-split-text-animation">split-text animation a screen reader can read</Link>.
        </p>
        <Callout k="no script, no animation">
          The words are only hidden by CSS that targets <code>.word</code>, and only the script makes those spans. If
          the script fails to load, the heading is plain text, fully shown.
        </Callout>
      </Section>

      <Section id="reveal" k="step 2" title="Reveal the words when the heading scrolls in">
        <p>
          Start each word hidden and a little low, and let a <code>transition-delay</code> of{' '}
          <code>--i</code> × 60 ms stagger them. Adding one class to the heading then plays the whole sentence,
          as Fig. 1 shows. Everything that hides is inside{' '}
          <code>@media (prefers-reduced-motion: no-preference)</code>, so readers who ask for less motion get the
          heading as it is.
        </p>
        <Code file="index.html">{HTML}</Code>
        <Code file="reveal.css">{REVEAL_CSS}</Code>
        <p>
          An <code>IntersectionObserver</code> adds that class when the heading comes into view, and then stops
          watching it so it plays once. The negative bottom margin waits until the heading is 15% of the screen above
          the bottom edge, so the reader sees it happen rather than catching the end of it.
        </p>
        <Code file="reveal.js">{OBSERVE_JS}</Code>
        <p>
          The same pattern reveals whole blocks: cards, images, paragraphs. If that is what you are after, the{' '}
          <Link href="/scroll-reveal-generator">scroll reveal generator</Link> builds it with presets, and the{' '}
          <Link href="/aos-animation">AOS animation examples</Link> show all {AOS_EFFECT_COUNT} of AOS’s{' '}
          <code>data-aos</code> effects running, with the markup.
        </p>
      </Section>

      <Section id="letters" k="variant" title="Letter by letter">
        <p>
          Splitting into letters works the same way, with two traps. Side by side as inline-blocks, a line can break
          between any two letters, in the middle of a word; wrapping each word’s letters in a box that does not wrap
          keeps words whole. And splitting a string with <code>{"split('')"}</code>, or even by code point,
          cuts an emoji with a skin tone or a flag in two. <code>Intl.Segmenter</code> splits by what a reader
          sees as one character.
        </p>
        <Code file="split-chars.js">{CHARS_JS}</Code>
        <Code file="reveal-chars.css">{CHARS_CSS}</Code>
        <p>
          Give the heading the class <code>reveal-chars</code>, and observe it with the same observer:
        </p>
        <Code file="reveal-chars.js">{CHARS_OBSERVE_JS}</Code>
        <p>
          Keep the delay per letter small. At 25 ms, a 40-letter heading takes a second just to start its last letter,
          which is about as long as anyone waits for a heading.
        </p>
      </Section>

      <Section id="scrub" k="pure CSS" title="Follow the scroll, in CSS only">
        <p>
          The reveal above plays on a clock once it starts. To tie the text to the scroll instead, so it lights up as
          the reader scrolls and dims if they scroll back, use the same split and a scroll timeline, with no
          observer. The heading names a <code>view()</code> timeline, and each word takes its own slice of it, worked
          out from <code>--i</code> and the word count <code>--n</code> that <code>splitWords</code> set:
        </p>
        <Code file="scrub.css">{SCRUB_CSS}</Code>
        <p>
          The first word lights up between 20% and 25% of the heading’s crossing and the last ends before 55%, around
          the moment the heading’s centre passes the centre of the screen. Browsers without scroll timelines skip
          the block and show the text as it is. How <code>view()</code> and the <code>cover</code> range work is in{' '}
          <Link href="/blog/css-scroll-driven-animations">CSS scroll-driven animations explained</Link>, and the{' '}
          <Link href="/text-fill-scroll-generator">text fill on scroll generator</Link> builds this effect, and a
          colour fill, with the code to copy.
        </p>
      </Section>

      <Section id="library" k="svg-scroll-draw" title="The same with a library">
        <p>
          svg-scroll-draw’s <code>scrollText</code> does the split, the screen-reader copy and the stagger in one call,
          by word, letter or line, and keeps line splits correct when the width changes.
        </p>
        <Code file="headline.js">{LIB_JS}</Code>
        <p>
          It is scrubbed by the scroll: the text starts as the heading’s top passes 85% of the way down the screen
          and is finished when it reaches 40%, and with <code>once</code>, on by default, it stays finished when the
          reader scrolls back. Each piece starts transparent and 24px low unless you pass <code>from</code>. Under
          reduced motion it shows the text finished, also when the setting changes while the page is open. The{' '}
          <Link href="/text-animation-generator">text animation generator</Link> lets you pick the split and the
          effect, watch it, and copy the call or a React component; for text that types itself instead, there is the{' '}
          <Link href="/typewriter-effect-generator">typewriter effect generator</Link>.
        </p>
      </Section>

      <Closing
        title="Pick a split, copy the code"
        lede="Choose words, letters or lines and how each piece arrives, scroll the preview, and copy the JavaScript or a React component."
        command="npm i svg-scroll-draw"
        links={[
          { href: '/text-animation-generator', label: 'Text animation generator →' },
          { href: '/text-fill-scroll-generator', label: 'Text fill on scroll' },
        ]}
      />
    </BlogArticle>
  );
}
