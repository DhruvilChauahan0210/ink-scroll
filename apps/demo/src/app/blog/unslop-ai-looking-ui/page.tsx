import type { Metadata } from 'next';
import { seoTitle } from '../../_lib/seo';
import { BlogArticle, Section, Code, Callout, Table } from '@/components/blog/BlogArticle';

const TITLE = 'Unslopping a Site: 13 Signs of AI-Looking UI, Fixed';
const DESCRIPTION =
  'We checked this site against heydamir/unslop’s 60 signs of AI-looking UI: the 13 we had, how each was fixed, and what changing colours taught us about contrast.';
const URL = 'https://svg-scroll-draw.vercel.app/blog/unslop-ai-looking-ui';
const UNSLOP = 'https://github.com/heydamir/unslop';

export const metadata: Metadata = {
  title: seoTitle(TITLE),
  description: DESCRIPTION,
  keywords: [
    'ai looking ui',
    'ai slop design',
    'unslop',
    'vibecoded ui',
    'design audit checklist',
    'uppercase labels letter spacing',
    'wcag contrast opacity',
    '4px spacing grid',
  ],
  alternates: { canonical: '/blog/unslop-ai-looking-ui' },
  openGraph: { title: TITLE, description: DESCRIPTION, url: URL },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline: 'Unslopping a site: 13 signs of AI-looking UI, fixed',
  description: DESCRIPTION,
  url: URL,
  datePublished: '2026-11-07',
  dateModified: '2026-11-07',
  author: { '@type': 'Person', name: 'Dhruvil Chauhan', url: 'https://github.com/DhruvilChauahan0210' },
  publisher: { '@type': 'Organization', name: 'svg-scroll-draw', url: 'https://svg-scroll-draw.vercel.app' },
  image: `${URL}/opengraph-image`,
  mainEntityOfPage: { '@type': 'WebPage', '@id': URL },
};

const AUDIT: [string, string, string][] = [
  ['Uppercase labels with wide tracking', '169 CSS rules', 'Nav, buttons, stat labels, section eyebrows'],
  ['Spacing off the 4px grid', '642 rules', 'Mostly 2px steps (10, 14, 18), about 160 odd values'],
  ['Everything a full pill', '44 controls', 'Buttons, the nav bar, chips, tags, tabs'],
  ['Headlines ending in a period', '60 headings', 'Page and section titles'],
  ['Negative tracking on small text', '21 rules', '-0.01em on 13–17px text'],
  ['Italic for emphasis', 'about 12', '<em> in prose, a blog rule that italicised all of it'],
  ['A pill badge above the headline', '1', '“New in v2.22.0” for hooks shipped months before'],
  ['Emoji as a label', '1', '“⚡ Playground” in the docs'],
  ['Exclamation marks', '2', '“copied!” on every code block'],
  ['Hype words', '3', '“seamlessly”'],
  ['Wordy placeholders', '2', 'The playground’s text fields'],
  ['A loop on something not live', '1', 'A glowing pulse that never stopped'],
  ['Glass', '2', 'A frosted nav and its menu'],
];

const SNAP = `// Margins, paddings, gaps and row heights onto the 4px grid.
// Odd values go to the nearest multiple of 4; a 2px step (6, 10, 14…)
// sits exactly between two, so it goes to the one that is a multiple of 8.
const snap = (n) => {
  if (n <= 2 || n % 4 === 0) return n;          // 1–2px nudges stay
  if (n % 2) return Math.round(n / 4) * 4;
  return (n - 2) % 8 === 0 ? n - 2 : n + 2;
};
// Left alone: negative and fractional values (they centre something
// exactly) and heights under 16px (dots and rules are drawings).`;

const SHADE = `// The nearest shade of the same hue that clears the ratio on EVERY
// background the colour sits on, not only the one where it failed.
function shade(fg, backgrounds, need) {
  const light = backgrounds.every((b) => luminance(b) > 0.18);
  const target = light ? [0, 0, 0] : [255, 255, 255];
  for (let k = 0; k <= 1; k += 0.01) {
    const c = mix(fg, target, k);
    if (backgrounds.every((b) => ratio(c, b) >= need)) return c;
  }
  return null;
}`;

const CASE = `/* Before: the stylesheet made every label look the same. */
.label { text-transform: uppercase; letter-spacing: 0.14em; }

<span class="label">in this post</span>   →  IN THIS POST
<span class="label">npm i svg-scroll-draw</span>  →  NPM I SVG-SCROLL-DRAW

/* After: no transform, so the source decides. English gets a capital,
   code keeps its case. */
<span class="label">In this post</span>
<span class="label">npm i svg-scroll-draw</span>`;

export default function Page() {
  return (
    <BlogArticle
      slug="unslop-ai-looking-ui"
      jsonLd={articleJsonLd}
      tags={['design', 'accessibility', 'unslop']}
      title={<>Unslopping a site: 13 signs of AI-looking UI, fixed</>}
      lede={
        <>
          AI-generated interfaces go wrong in the same few ways, and someone wrote them down. We put this site,
          its copy-paste blocks and its 23 demo sites through that list. Here is what it found, how each sign
          was fixed, and the contrast mistakes we made fixing them.
        </>
      }
      facts={[
        { k: 'Signs checked', v: '60, in 9 groups' },
        { k: 'Found here', v: '13 (“light slop”)' },
        { k: 'Contrast failures', v: '708 → 0' },
      ]}
      further={[
        { href: '/blog/reduced-motion-scroll-animations', label: 'Reduced motion, effect by effect', blurb: 'What each scroll effect should do when a reader asks for less motion.' },
        { href: '/blog/accessible-split-text-animation', label: 'Accessible split-text animation', blurb: 'The other accessibility fix that started from an audit of every page.' },
      ]}
    >
      <Section id="rubric" k="the list" title="What unslop checks">
        <p>
          <a href={UNSLOP}>unslop</a> is a skill by Damir Sokolovsky (CC BY 4.0) for turning AI-looking screens
          into designed ones. At its core is a list of 60 signs in nine groups: surfaces and colour, type,
          icons, spacing, copy, components, landing-page heroes, visuals and motion. Each sign comes with its
          fix: a purple-to-blue gradient becomes one neutral surface, an uppercase tracked label becomes
          sentence case, a pill badge over the headline goes.
        </p>
        <p>
          It also sets a process. Audit first, listing every sign with where it lives. Then decide how much
          to change: heavy slop gets the full redesign, light slop gets polish (fix what the audit found, keep
          the palette, type and layout), and a good screen gets left alone. Then fix in passes, in a fixed
          order: spacing, colour, icons, copy, type, layout, details, visuals, motion.
        </p>
      </Section>

      <Section id="audit" k="the audit" title="Thirteen signs, all in the details">
        <p>
          A scan of 249 components and 71 stylesheets, plus three pages read by eye, found 13 of the 60. None
          were the loud ones: no purple gradients, no gradient text, no glows, no sparkles, no “Trusted by
          10,000+ teams”. By unslop’s own scale that is light slop, so it got polish.
        </p>
        <Table head={['Sign', 'How much', 'Where']} rows={AUDIT} />
        <Callout k="raw counts lie">
          The first scan reported 534 lines of wide letter-spacing and 305 gradients. Counted per CSS rule and
          read one by one, that was 169 label rules, and gradients that were all grid lines, fade masks and
          neutral shading, which unslop allows. Every finding needs a second look before it becomes a fix.
        </Callout>
      </Section>

      <Section id="spacing" k="pass 1" title="Spacing: onto the 4px grid">
        <p>
          unslop puts everything on a 4px grid. Most of our off-grid values were 2px steps a designer might
          choose on purpose, so the codemod needed a rule that was predictable rather than clever:
        </p>
        <Code file="grid4.mjs">{SNAP}</Code>
        <p>
          633 declarations moved by one to four pixels. A later pass caught 52 more hiding inside{' '}
          <code>clamp()</code>, and the demo sites, which write whole rules on one line, had 2,145.
        </p>
      </Section>

      <Section id="type" k="pass 2" title="Type: the transform was hiding the text">
        <p>
          The biggest sign was the label style: mono, uppercase, 0.14em tracking, on 169 rules. Deleting{' '}
          <code>text-transform: uppercase</code> is one line. The problem is what it uncovers. Under an
          uppercase transform it does not matter how a label is written, so many were written in lowercase,
          and now showed that way.
        </p>
        <Code file="labels.html">{CASE}</Code>
        <p>
          A blanket CSS capital would mangle code, so the English labels were sentence-cased where they are
          written, in two rounds: 85 that were JSX text, then 136 that were data. A script lists every short
          lowercase label still on the site, page by page; the ones left are code, option names, package names
          and path-style breadcrumbs, which stay as they are.
        </p>
      </Section>

      <Section id="copy" k="pass 3" title="Copy: say it once, plainly">
        <p>
          Sixty headlines lost their final period. On the demo sites, 34 headlines used the two-beat fragment
          cadence (“Four finishes. One sound.”) and became one line (“Four finishes, one sound”). The pill
          badge above our own headline was not even true any more: it announced as new a feature from months
          before. “Seamlessly” became what actually happens: the JS engine draws the same thing.
        </p>
      </Section>

      <Section id="details" k="passes 4–6" title="Radius by size, solid surfaces, no idle loops">
        <p>
          Buttons, chips and tabs went from full pills to an 8px radius, tags to 4px, with nested corners
          worked out (a copy button 4px inside an 8px chip gets 4). Switches, sliders and dots stay round,
          because they are round. The frosted-glass nav became the page surface with a hairline. A pulse that
          looped forever under a blurred accent glow now runs once.
        </p>
      </Section>

      <Section id="showcase" k="the demos" title="The demo sites had the loud signs">
        <p>
          The 23 showcase sites are fictional brands built to show the library, and they had what the main
          site did not: a pill badge above the headline on ten of them (“New”, mostly), gradient headlines on four,
          “Trusted by 48,000 teams” and two like it, 19 coloured glows, 58 colour washes behind content and 19 glass panels.
          All of it went. Two things stayed on purpose: one site’s sunset sky, which is the scene its product
          lights, and looping animations that show a live state in a product mock-up, like a recording dot or
          a CI spinner.
        </p>
      </Section>

      <Section id="contrast" k="what broke" title="Contrast, and the mistakes we made">
        <p>
          The demo sites had never been through an accessibility check, and a new test found 708 elements
          below WCAG AA. Most came down to a handful of colours per site, so we fixed colours, not elements.
          Along the way:
        </p>
        <ul>
          <li>
            <strong>Lighter weights move the threshold.</strong> Text from 18.66px counts as large, needing
            only 3:1, when it is bold (700). The type pass took weights down to 600, and two rows of logo
            wordmarks fell under the 4.5:1 that normal text needs.
          </li>
          <li>
            <strong>A colour lives on more than one background.</strong> One site’s grey failed on a single
            light pill, was darkened everywhere, and broke 68 places on dark backgrounds where it had been
            fine. The fix that sticks checks every background the colour is used on.
          </li>
          <li>
            <strong>Opacity cannot pass.</strong> Inactive states faded to 22–60% opacity are below 4.5:1
            however good their colour; each went up to the lowest value that reads.
          </li>
          <li>
            <strong>White on a bright accent needs a darker accent,</strong> or dark text, as unslop says;
            eight buttons were darkened, and one amber avatar got dark text instead.
          </li>
        </ul>
        <Code file="contrast.mjs">{SHADE}</Code>
        <p>All 23 sites now pass, and the check runs in CI so it stays that way.</p>
      </Section>

      <Section id="eye" k="by eye" title="The sign no scan found">
        <p>
          Looking at the pages caught one more: rows of stars and claim chips stacked under the hero buttons,
          the kind of social proof unslop asks you to make quiet and specific or remove. One demo’s three
          unverifiable claims went; three others kept their rating figure, such as “4.9 from 8,214 reviews”,
          and lost the row of star icons.
        </p>
      </Section>

      <Section id="kept" k="judgement" title="What stayed, and why">
        <p>
          unslop lists parallax and elements that move on scroll as signs. On most sites they are. Here they
          are the product: the scroll demos stayed, and so did every effect a reader drives with their own
          scroll. The skill says as much itself: keep what the product is, and keep motion that explains
          something. A checklist is a way to look, not a reason to stop looking.
        </p>
      </Section>
    </BlogArticle>
  );
}
