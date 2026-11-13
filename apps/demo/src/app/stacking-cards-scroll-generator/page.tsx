import type { Metadata } from 'next';
import '@/components/stack/stack.css';
import '@/components/stackcards/stackcards.css';
import Link from 'next/link';
import { SELF, SELF_ENTRIES } from '@/data/competitors';
import { BROWSER_SUPPORT } from '@/data/cssdriven';
import { seoTitle } from '../_lib/seo';
import { SiteShell } from '@/components/site/SiteShell';
import { jsonLd, SITE_URL } from '@/lib/json-ld';
import { CodeBox } from '@/components/site/CodeBox';
import { ToolNextStep } from '@/components/tool-kit/ToolNextStep';
import { StackingCardsGenerator } from '@/components/stackcards/StackingCardsGenerator';
import { StackFigure } from '@/components/stackcards/StackFigure';
import {
  GAP, LIB_DEFAULTS, LIMITS, SLUG, STACK_DEFAULTS, TRIGGER, landOf, pileHeight,
} from '@/components/stackcards/stack-code';
import { C, Note, Sec, Toc } from '@/components/stack/parts';

// Searches this page is for: "stacking cards scroll animation", "sticky cards
// stack css", "card stack scroll effect", "scroll stack cards". The geometry
// and every number below come from components/stackcards/stack-code.ts; the
// scrollProgress options from packages/svg-scroll-draw/src/progress/index.ts.
const TITLE = 'Stacking Cards on Scroll Generator: Sticky CSS Card Stack';
const DESCRIPTION =
  'Make cards stack on scroll: each sticks a step lower as the one under it shrinks and dims. Set offsets and size, scroll the preview, copy CSS, JS or React.';

const PROGRESS_KB = SELF_ENTRIES.progress;
const SUPPORT = BROWSER_SUPPORT.map((b) => `${b.browser} ${b.since}`).join(', ');
const D = STACK_DEFAULTS;
const LAND = landOf(D);

/** What each setting writes, in both versions. */
const SETTINGS: { k: string; range: string; css: string; what: string }[] = [
  {
    k: 'Cards',
    range: `${LIMITS.cards.min}–${LIMITS.cards.max}`,
    css: 'one <li class="stack-card" style="--i: n">',
    what: 'How many cards. --i is each card’s place: it sets the card’s offset and its stretch of scroll, so a card added to the markup with the next --i joins the stack.',
  },
  {
    k: 'top',
    range: `${LIMITS.top.min}–${LIMITS.top.max}px`,
    css: '.stack { padding-top }, the first card’s top',
    what: 'Where the first card sticks: under a fixed or sticky header, its height. The list is given the same top padding, so the first card sticks just as the list’s top reaches the window’s top.',
  },
  {
    k: 'step',
    range: `${LIMITS.step.min}–${LIMITS.step.max}px`,
    css: 'top: calc(top + var(--i) × step)',
    what: 'How much lower each next card sticks: the strip of every covered card that stays in view. 0 lays every card exactly over the last.',
  },
  {
    k: 'card height',
    range: `${LIMITS.height.min}–${LIMITS.height.max}px`,
    css: 'height',
    what: 'Each card’s height. A fixed height keeps every card’s stretch of scroll the same, which is what lets one number, LAND, place them all.',
  },
  {
    k: 'scale',
    range: `0–${LIMITS.scale.max * 100}%`,
    css: 'scale: 1 − scale × cover',
    what: 'How much a covered card shrinks, towards its top edge (transform-origin: 50% 0), so its strip stays where it was.',
  },
  {
    k: 'dim',
    range: `0–${LIMITS.dim.max * 100}%`,
    css: 'filter: brightness(1 − dim × cover)',
    what: 'How much a covered card darkens, which pushes it back behind the one arriving.',
  },
  {
    k: 'rounded corners',
    range: `${LIMITS.radius.min}–${LIMITS.radius.max}px`,
    css: 'border-radius',
    what: 'The cards’ corners. overflow: hidden keeps their content inside them.',
  },
];

const OPTIONS: { k: string; type: string; def: string; set: string }[] = [
  { k: 'trigger', type: '{ start, end }', def: `'${LIB_DEFAULTS.start}' → '${LIB_DEFAULTS.end}'`, set: `'${TRIGGER.start}' → '${TRIGGER.end}': 0 when the list’s top reaches the window’s top, 1 when its bottom does, so progress × the list’s height is the scroll past its top.` },
  { k: 'easedVariable', type: 'string | null', def: `'${LIB_DEFAULTS.easedVariable}'`, set: 'null: the cards read the raw progress only.' },
  { k: 'onProgress', type: '(raw, eased) => void', def: '—', set: 'Works out each card’s cover, 0 to 1, and writes it to --cover on the card.' },
  { k: 'variable', type: 'string', def: `'${LIB_DEFAULTS.variable}'`, set: 'Left at its default: the raw progress is written to the list too, if your CSS wants it.' },
  { k: 'scrollContainer', type: 'string | Element', def: 'window', set: 'Left out. Pass it when the cards scroll inside a box of their own, as the preview does.' },
];

const COMPARE: { k: string; css: string; js: string }[] = [
  { k: 'The stacking', css: 'position: sticky, in every current browser.', js: 'The same position: sticky: the script does not move the cards.' },
  { k: 'Shrink and dim', css: `A view timeline on the list and one animation-range per card: ${SUPPORT}. Elsewhere the cards stack without it.`, js: 'scrollProgress writes --cover on each card, in any browser that runs the script.' },
  { k: 'JavaScript', css: 'None.', js: `${PROGRESS_KB} KB gzipped, the progress entry on its own.` },
  { k: 'Your code knows', css: 'Nothing.', js: 'How far each card is covered, every frame: enough to change its text, play a video or count which cards were seen.' },
  { k: 'Reduced motion', css: 'animation: none: the cards stack, and do not shrink or dim.', js: 'The same, in the CSS: scale: none and filter: none.' },
  { k: 'What breaks it', css: 'An ancestor with overflow hidden, auto or scroll between the list and the page, which stops position: sticky.', js: 'The same, and a list whose height changes after load is measured again by scrollProgress, so it keeps up.' },
];

const STICKY_ONLY = `/* Cards that only stack: no timeline, no script. */
.stack-card {
  position: sticky;
  top: calc(${D.top}px + var(--i) * ${D.step}px);
  height: ${D.height}px;
  margin-bottom: ${GAP}px;
}`;

const FAQ: { q: string; a: string }[] = [
  {
    q: 'How do I make cards stack on scroll with CSS?',
    a: `Give every card position: sticky and a top a little lower than the last one's: top: calc(${D.top}px + var(--i) * ${D.step}px), with --i the card's place in the list. Each card then scrolls up over the one before and stops ${D.step}px below it, so the cards pile up with their top edges showing. That part needs no script and works in every current browser. To shrink and dim the covered cards as well, add a view timeline on the list and one animation-range per card, inside @supports, as the CSS only tab writes.`,
  },
  {
    q: 'How do I scale down the card underneath as the next one arrives?',
    a: `Work out how far the next card has come: with a fixed card height, card i + 1 lands on card i after the same scroll for every card, LAND = card height + gap − step (${LAND}px with the defaults). Card i is covered over the scroll from i × LAND to (i + 1) × LAND past the list's top. In CSS that is animation-range: exit-crossing calc(var(--i) * LAND) exit-crossing calc(var(--i) * LAND + LAND) on the list's view timeline; with scrollProgress it is clamp(past ÷ LAND − i, 0, 1), written to --cover. Scale towards the card's top edge, with transform-origin: 50% 0, so its strip stays put.`,
  },
  {
    q: 'Why are my sticky cards not stacking?',
    a: 'Most often an ancestor between the cards and the page has overflow set to hidden, auto or scroll: the cards then stick inside that box, which does not scroll, so they never seem to stick. overflow: clip does not do this. Next, the cards must share one parent that runs the whole length of the stack, since a sticky element only holds while its parent is on screen; and each needs a top. If they stick but the later ones slide under the earlier ones, something has given the earlier cards a higher z-index.',
  },
  {
    q: 'Why does the pile leave as soon as the last card lands?',
    a: `A sticky card cannot leave its parent, so the pile scrolls away when the list's bottom reaches it. With nothing after the last card, that is the moment it lands. The generated CSS adds room after the last card with .stack::after, one card's scroll (${LAND}px with the defaults), so the finished pile rests there before it goes. Make it taller to hold it longer.`,
  },
  {
    q: 'Does it work on phones?',
    a: `Yes: position: sticky and the scroll timeline both work in mobile browsers, and the cards are as wide as their list. What to watch is height: the pile is top + (cards − 1) × step + card height tall (${pileHeight(D)}px with the defaults), and it has to fit the shortest window you support, or the last card's bottom is never seen while stuck. The generator warns when the pile is taller than its preview window.`,
  },
  {
    q: 'What about readers who ask for reduced motion?',
    a: 'The generated CSS keeps the stacking and drops the shrink and dim for them: animation: none in the CSS only version, scale: none and filter: none in the script version. The cards still move only as the reader scrolls, which is direct manipulation rather than motion that plays at them.',
  },
  {
    q: 'Can I make the card stack without GSAP?',
    a: `Yes. The stacking is position: sticky, which needs no library at all, and the shrink and dim are a scroll-driven animation in CSS, or scrollProgress from svg-scroll-draw/progress at ${PROGRESS_KB} KB gzipped. GSAP ScrollTrigger versions of this effect often pin each card with pin: true and scrub a scale tween; here the browser does the pinning.`,
  },
];

const TOC = [
  { id: 'generator', label: 'The generator' },
  { id: 'geometry', label: `How it stacks · ${SETTINGS.length} settings` },
  { id: 'css', label: 'The CSS version' },
  { id: 'js', label: `The script · ${OPTIONS.length} options` },
  { id: 'use', label: 'Use it in your project' },
  { id: 'faq', label: `Questions · ${FAQ.length}` },
];

export const metadata: Metadata = {
  title: seoTitle(TITLE),
  description: DESCRIPTION,
  keywords: [
    'stacking cards scroll animation', 'sticky cards stack css', 'card stack scroll effect', 'scroll stack cards',
    'stacking cards generator', 'css sticky stacking cards', 'cards stack on scroll', 'position sticky card stack',
    'scroll driven animation cards', 'stacking cards react', 'stacking cards without gsap',
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
      name: 'Stacking cards on scroll generator',
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

export default function StackingCardsGeneratorPage() {
  return (
    <SiteShell
      active={`/${SLUG}`}
      crumbs={[['Stacking cards on scroll generator', `/${SLUG}`]]}
      kicker="stack / your turn"
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(JSON_LD) }} />
      <div className="stk">

        <header className="pg-head stk-head">
          <div>
            <p className="pg-kicker">
              <span>tool / stacking cards</span>
              <span>sticky · scale · dim</span>
            </p>
            <h1 className="pg-title stk-title">Stacking cards on scroll</h1>
            <p className="pg-lede">
              Cards that pile up as the page scrolls: each one sticks a little lower than the last, and the one
              underneath shrinks and dims as the next arrives. Set the number of cards, where they stick, their height,
              the shrink, the dim and the corners, scroll the preview, and copy it in CSS alone, as HTML, CSS and
              JavaScript, or as a React component.
            </p>
            <div className="pg-actions">
              <a href="#generator" className="btn btn-solid" data-magnetic>Open the generator ↓</a>
              <a href="#css" className="btn" data-magnetic>The CSS version →</a>
            </div>
            <dl className="pg-facts">
              <div><dt>Settings</dt><dd>{SETTINGS.length}</dd></div>
              <div><dt>Cards</dt><dd>{LIMITS.cards.min}–{LIMITS.cards.max}</dd></div>
              <div><dt>scrollProgress alone</dt><dd>{PROGRESS_KB} KB</dd></div>
              <div><dt>Library</dt><dd>{SELF.version}</dd></div>
            </dl>
          </div>
          <StackFigure />
        </header>

        <div className="stk-body">
          <Toc label="On this page" items={TOC} />
          <div className="stk-main">

            <Sec n={1} k="The tool" id="generator" title="Build a stack of cards">
              <p className="stk-p">
                The box below is a small window. Scroll it, drag the slider or press Play: each card sticks under the
                one before, a step lower, and the card underneath shrinks and dims while the next slides over it.
                Preview it with scrollProgress, the JavaScript tab’s call told to follow the box, or with the CSS only
                tab’s stylesheet and no script. The numbers beside it are read back from the cards as the browser has
                them.
              </p>
              <StackingCardsGenerator version={SELF.version} />
              <Note k="Recipe">
                For a stage that holds still while steps change inside it, see the{' '}
                <Link href="/scroll-pin-generator" className="scg-a">scroll pin generator</Link>; for any other effect
                on a scroll timeline, the{' '}
                <Link href="/css-scroll-driven-animation-generator" className="scg-a">CSS scroll-driven animation
                generator</Link>.
              </Note>
            </Sec>

            <Sec n={2} k={`${SETTINGS.length} settings`} id="geometry" title="How the cards stack">
              <p className="stk-p">
                Card i is <C>position: sticky</C> at <C long>top + i × step</C>, inside one list. While the list
                scrolls past, each card scrolls up until it reaches its own top, stops there over the cards before it,
                and leaves its strip of them, <C>step</C> px, in view (fig. 1). The list has a top padding as tall as{' '}
                <C>top</C>, so the first card sticks just as the list’s top reaches the window’s top: from there, card i
                sticks after i × LAND px of scroll, where LAND = card height + gap − step, and the next card lands on it
                LAND px later. With the defaults that is {D.height} + {GAP} − {D.step} = {LAND}px.
              </p>
              <div className="scg-scroll" tabIndex={0} role="region" aria-label="Every setting">
                <table className="scg-table">
                  <thead><tr><th>Setting</th><th>Range</th><th>Becomes</th><th>What it does</th></tr></thead>
                  <tbody>
                    {SETTINGS.map((o) => (
                      <tr key={o.k}>
                        <th scope="row" className="is-key">{o.k}</th>
                        <td className="is-code">{o.range}</td>
                        <td className="is-code">{o.css}</td>
                        <td>{o.what}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Note k="Covered">
                Each card’s cover runs 0 to 1 over its own LAND: <C long>clamp(past ÷ LAND − i, 0, 1)</C>, where past
                is the scroll since the list’s top passed the window’s top. The last card has nothing landing on it, so
                it never shrinks.
              </Note>
              <Note k="The pile">
                Once every card is in, the pile is top + (cards − 1) × step + card height tall: {pileHeight(D)}px with
                the defaults. It has to fit the shortest window you support. The generated CSS adds one LAND of room
                after the last card, so the finished pile rests before the page takes it away.
              </Note>
            </Sec>

            <Sec n={3} k="No script" id="css" title="The pure CSS version">
              <p className="stk-p">
                The stacking is <C>position: sticky</C> alone, in every current browser. If the cards only have to pile
                up, this is all it takes:
              </p>
              <CodeBox file="stack.css">{STICKY_ONLY}</CodeBox>
              <p className="stk-p">
                The shrink and dim need scroll-driven animations. The CSS only tab gives the list a view timeline. On
                it, <C>exit-crossing 0</C> is the moment the list’s top reaches the window’s top, which is where the
                first card sticks, and a length after it is that much more scroll. So card i’s range is{' '}
                <C long>exit-crossing calc(var(--i) * LAND) exit-crossing calc(var(--i) * LAND + LAND)</C>: one rule
                for every card, whatever their number. Its keyframes only say where it ends, so before its range a
                card shows as written, and <C>forwards</C> keeps it covered after. It all sits inside{' '}
                <C>@supports</C>: where there are no scroll timelines the cards still stack.
              </p>
              <div className="scg-scroll" tabIndex={0} role="region" aria-label="CSS or scrollProgress">
                <table className="scg-table">
                  <thead><tr><th /><th>CSS: sticky and a view timeline</th><th>Sticky and scrollProgress</th></tr></thead>
                  <tbody>
                    {COMPARE.map((r) => (
                      <tr key={r.k}>
                        <th scope="row" className="is-key">{r.k}</th>
                        <td>{r.css}</td>
                        <td>{r.js}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Note k="Tested">
                Both files were scrolled through in Playwright’s Chromium, Firefox and WebKit: every card stuck at
                top + i × step, the covered card was half way to its scale and brightness when the next one was half
                way in, and fully there once it landed. Under reduced motion they stacked without either, and at 375px
                the page did not scroll sideways.
              </Note>
            </Sec>

            <Sec n={4} k={`${OPTIONS.length} options`} id="js" title="The script: scrollProgress on the list">
              <p className="stk-p">
                The JavaScript tab keeps the stacking in CSS and hands the shrink and dim to{' '}
                <C>{"scrollProgress(target, options)"}</C>, which follows the scroll in every browser and writes a
                number for CSS to read. It is called once, on the list, not once per card: a sticky card’s position on
                screen stops changing while it is stuck, so the list, which never sticks, is the one to measure.
              </p>
              <div className="scg-scroll" tabIndex={0} role="region" aria-label="The scrollProgress options it uses">
                <table className="scg-table">
                  <thead><tr><th>Option</th><th>Type</th><th>Default</th><th>Set to</th></tr></thead>
                  <tbody>
                    {OPTIONS.map((o) => (
                      <tr key={o.k}>
                        <th scope="row" className="is-key">{o.k}</th>
                        <td className="is-code">{o.type}</td>
                        <td className="is-code">{o.def}</td>
                        <td>{o.set}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Note k="Measured">
                scrollProgress measures the list when it starts, and again when the window resizes or the layout
                changes: images, fonts, late content. The cards’ height is fixed, so LAND is a constant in the script.
              </Note>
              <Note k="Instance">
                <C>destroy()</C> takes the listeners off and removes the variable it wrote; the React tab also takes
                each card’s <C>--cover</C> off. On the server it returns an instance that does nothing.
              </Note>
            </Sec>

            <Sec n={5} k="Next step" id="use" title="Use it in your project">
              <p className="stk-p">
                scrollProgress has an entry of its own, <C>svg-scroll-draw/progress</C>, and the generated code imports
                it from there.
              </p>
              <ToolNextStep
                slug={SLUG}
                api="scrollProgress"
                entry="progress"
                docs="/docs#scroll-progress"
                related={['scroll-pin-generator', 'css-scroll-driven-animation-generator']}
              />
            </Sec>

            <Sec n={6} k={`${FAQ.length} questions`} id="faq" title="Stacking cards questions">
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
                More on scroll with svg-scroll-draw {SELF.version}: <Link href="/blog/css-scroll-driven-animations">CSS
                scroll-driven animations</Link>, <Link href="/blog/scroll-pin-without-gsap">pinning without
                GSAP</Link> and <Link href="/docs#scroll-progress">scrollProgress in the docs</Link>.
              </p>
            </Sec>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
