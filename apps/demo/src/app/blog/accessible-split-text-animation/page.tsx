import type { Metadata } from 'next';
import { seoTitle } from '../../_lib/seo';
import { SELF_ENTRIES } from '@/data/competitors';
import { BlogArticle, Section, Code, Callout, Compare } from '@/components/blog/BlogArticle';

const TITLE = 'Accessible Split-Text Animation for Screen Readers';
const DESCRIPTION =
  'Animate text word by word without hiding it from screen readers: why aria-label on a <p> breaks, and the visually hidden copy that works instead.';
const URL = 'https://svg-scroll-draw.vercel.app/blog/accessible-split-text-animation';

export const metadata: Metadata = {
  title: seoTitle(TITLE),
  description: DESCRIPTION,
  keywords: [
    'accessible text animation',
    'split text screen reader',
    'split text aria-label',
    'splittext accessibility',
    'aria-label paragraph',
    'aria-prohibited-attr',
    'screen reader only text',
    'text reveal animation accessibility',
    'svg-scroll-draw scrollText',
  ],
  alternates: { canonical: '/blog/accessible-split-text-animation' },
  openGraph: { title: TITLE, description: DESCRIPTION, url: URL },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline: 'Accessible split-text animation: screen readers included',
  description: DESCRIPTION,
  url: URL,
  datePublished: '2026-11-06',
  dateModified: '2026-11-06',
  author: { '@type': 'Person', name: 'Dhruvil Chauhan', url: 'https://github.com/DhruvilChauahan0210' },
  publisher: { '@type': 'Organization', name: 'svg-scroll-draw', url: 'https://svg-scroll-draw.vercel.app' },
  image: `${URL}/opengraph-image`,
  mainEntityOfPage: { '@type': 'WebPage', '@id': URL },
};

const SPLIT = `<p class="headline">
  <span>Ship</span> <span>real</span> <span>browser</span> <span>tests</span>
</p>`;

const USUAL = `<p class="headline" aria-label="Ship real browser tests">
  <span aria-hidden="true">Ship</span>
  <span aria-hidden="true">real</span>
  <span aria-hidden="true">browser</span>
  <span aria-hidden="true">tests</span>
</p>`;

const FIXED = `<p class="headline">
  <span aria-hidden="true">Ship</span>
  <span aria-hidden="true">real</span>
  <span aria-hidden="true">browser</span>
  <span aria-hidden="true">tests</span>
  <span class="sr-only">Ship real browser tests</span>
</p>`;

const SPLITTER = `function splitWords(el) {
  const text = el.textContent;
  el.textContent = '';
  for (const chunk of text.split(/(\\s+)/)) {
    const piece = document.createElement('span');
    piece.setAttribute('aria-hidden', 'true');
    piece.textContent = chunk;
    if (chunk.trim()) piece.style.display = 'inline-block';
    el.append(piece);
  }
  // The whole sentence once, for screen readers: on the page, not on screen.
  const copy = document.createElement('span');
  copy.textContent = text;
  copy.style.cssText =
    'position:absolute;width:1px;height:1px;overflow:hidden;' +
    'clip-path:inset(50%);white-space:nowrap;user-select:none';
  el.append(copy);
}`;

const CHECK = `// Playwright: what the browser hands assistive technology.
const tree = await page.locator('.headline').ariaSnapshot();
expect(tree.split('Ship real browser tests').length - 1).toBe(1);`;

const LIBRARY = `import { scrollText } from 'svg-scroll-draw/text';

scrollText('.headline', { split: 'words', stagger: 0.05 });`;

const REACT = `import { ScrollText } from 'svg-scroll-draw/react';

<ScrollText as="p" split="words" className="headline">
  Ship real browser tests
</ScrollText>`;

export default function Page() {
  return (
    <BlogArticle
      slug="accessible-split-text-animation"
      jsonLd={articleJsonLd}
      tags={['scrollText', 'ARIA', 'screen readers']}
      title={<>Split-text animation a screen reader can read</>}
      lede={
        <>
          Animating a headline word by word means wrapping every word in its own element. The usual way to keep
          that readable puts an <code>aria-label</code> on the paragraph, and ARIA does not allow that on a
          paragraph. Here is why it can leave a screen reader with nothing, and the pattern that holds up.
        </>
      }
      facts={[
        { k: 'ARIA 1.2', v: '§5.2.8.6' },
        { k: 'axe rule', v: 'aria-prohibited-attr' },
        { k: 'scrollText', v: `${SELF_ENTRIES.text.toFixed(1)} KB` },
      ]}
      further={[
        { href: '/docs#scroll-text', label: 'scrollText reference', blurb: 'Every option: split by words, characters or lines, stagger, from, trigger.' },
        { href: '/examples/scroll-text', label: 'scrollText example', blurb: 'A headline revealed word by word, with the code to copy.' },
      ]}
    >
      <Section id="split" k="the split" title="Splitting text changes what is read">
        <p>
          To move each word on its own, a script replaces the text with one element per word (or per character,
          or per line). The page looks the same; the document does not.
        </p>
        <Code file="index.html">{SPLIT}</Code>
        <p>
          A screen reader can now meet four separate pieces instead of one sentence. With a character split it
          is worse: one element per letter, and some readers spell the headline out. So the pieces get hidden
          from assistive technology, and the sentence has to be put back somewhere it will be read.
        </p>
      </Section>

      <Section id="aria-label" k="the usual fix" title="The usual fix: an aria-label on the parent">
        <p>
          The common answer hides every piece with <code>aria-hidden</code> and gives the whole sentence to the
          parent as its <code>aria-label</code>. It is what GSAP’s SplitText does by default (its{' '}
          <code>{'aria: "auto"'}</code> option), and what svg-scroll-draw’s <code>scrollText</code> did
          until 2.21.0.
        </p>
        <Code file="index.html">{USUAL}</Code>
        <p>
          On a heading or a button it works: those elements can carry a name. On a <code>&lt;p&gt;</code>, a{' '}
          <code>&lt;span&gt;</code> or a <code>&lt;div&gt;</code> it does not.
        </p>
      </Section>

      <Section id="why" k="ARIA 1.2" title="Why it breaks on a paragraph">
        <p>
          WAI-ARIA 1.2 lists eleven roles that cannot be named (section 5.2.8.6). Two of them are{' '}
          <code>generic</code>, which every <code>&lt;div&gt;</code> and <code>&lt;span&gt;</code> is, and{' '}
          <code>paragraph</code>. On those, authors must not use <code>aria-label</code> or{' '}
          <code>aria-labelledby</code>: the label is not part of what the element is allowed to say.
        </p>
        <p>
          A browser or screen reader is therefore free to leave the label out. If it does, the pattern above
          reads nothing at all, because every word that is on the page carries <code>aria-hidden</code>. axe
          reports it as <code>aria-prohibited-attr</code>, with an impact of serious.
        </p>
        <Callout k="found here">
          This site’s own headline block, a <code>&lt;p&gt;</code> revealed word by word, failed that rule
          when every page was put through axe. The fix below is what <code>scrollText</code> does since 2.21.0.
        </Callout>
      </Section>

      <Section id="fix" k="the copy" title="The fix: one visually hidden copy">
        <p>
          Keep the pieces hidden, and put the sentence back as ordinary text: one span after the pieces,
          positioned off the layout and clipped to nothing, the same technique as a <code>.sr-only</code> class.
          A screen reader reads it as part of the paragraph, whatever element the paragraph is.
        </p>
        <Compare
          before={{ label: 'a label the paragraph may not have', file: 'before.html', code: USUAL }}
          after={{ label: 'text every role reads', file: 'after.html', code: FIXED }}
        />
        <p>The whole splitter, with the copy built in:</p>
        <Code file="split-words.js">{SPLITTER}</Code>
        <ul>
          <li>
            <code>user-select: none</code> on the copy keeps a reader who selects the headline from copying it
            twice.
          </li>
          <li>
            <code>el.textContent</code> now holds the sentence twice: the pieces and the copy. Read the text
            before you split it if you need it later.
          </li>
          <li>
            Links or other markup inside the text are flattened by a word split either way. GSAP’s docs say
            the same of their default and suggest a screen-reader-only copy for that case too.
          </li>
        </ul>
      </Section>

      <Section id="check" k="verify" title="Check it in a real browser">
        <p>
          Two checks catch it. axe flags an <code>aria-label</code> on a paragraph wherever it runs. And the
          browser’s accessibility tree shows what a screen reader is actually given: Playwright reads it
          with <code>ariaSnapshot()</code>, and the sentence should appear exactly once.
        </p>
        <Code file="split.spec.ts">{CHECK}</Code>
        <p>
          svg-scroll-draw runs that test in Chromium, Firefox and WebKit, and a mutation test removes the copy
          to prove the test fails without it.
        </p>
      </Section>

      <Section id="library" k="scrollText" title="With svg-scroll-draw">
        <p>
          <code>scrollText</code> splits by words, characters or lines and reveals the pieces as the page
          scrolls. Since 2.21.0 it adds the visually hidden copy itself and sets no <code>aria-label</code>;{' '}
          <code>destroy()</code> puts the original markup back. Under reduced motion it shows the final text
          straight away.
        </p>
        <Code file="headline.js">{LIBRARY}</Code>
        <Code file="Headline.tsx">{REACT}</Code>
      </Section>
    </BlogArticle>
  );
}
