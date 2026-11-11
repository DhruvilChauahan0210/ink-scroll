import type { Metadata } from 'next';
import '@/components/stack/stack.css';
import '@/components/reveal/reveal.css';
import Link from 'next/link';
import { COMPETITORS, SELF, SELF_ENTRIES } from '@/data/competitors';
import {
  REVEAL_DEFAULTS, REVEAL_EASINGS, REVEAL_FROM, REVEAL_PRESETS, describeFrom, rowWindows, trig, type RevealPreset,
} from '@/data/reveal';
import { seoTitle } from '../_lib/seo';
import { SiteShell } from '@/components/site/SiteShell';
import { jsonLd, SITE_URL } from '@/lib/json-ld';
import { CodeBox } from '@/components/site/CodeBox';
import { CopyCommand } from '@/components/home/CopyCommand';
import { RevealGenerator } from '@/components/reveal/RevealGenerator';
import { RevealFigure } from '@/components/reveal/RevealFigure';
import { C, Note, Sec, Toc } from '@/components/stack/parts';

// Searches this page answers: "scroll reveal animation", "reveal on scroll",
// "animate on scroll js" and "react reveal on scroll". It is a generator for
// scrollReveal (packages/svg-scroll-draw/src/reveal/index.ts), whose names,
// defaults and maths all come from data/reveal.ts.
const TITLE = 'Scroll Reveal Animation Generator: JS & React Code';
const DESCRIPTION =
  'Make a reveal-on-scroll animation: pick a preset, stagger and trigger, watch it in a scrolling preview, then copy the JavaScript or React code. Free, MIT.';

const D = REVEAL_DEFAULTS;
const F = REVEAL_FROM;
const SPAN = D.start - D.end;
const STEP = +(D.stagger * SPAN).toFixed(2);
const AOS = COMPETITORS.aos;
const SR = COMPETITORS.scrollreveal;
const abs = (n: number | undefined) => Math.abs(n ?? 0);

const PRESET_NOTES: Record<RevealPreset, string> = {
  fadeUp: `Rises ${abs(F.fadeUp.y)}px into place as it fades in. The default.`,
  fadeDown: `Drops ${abs(F.fadeDown.y)}px into place from above.`,
  fadeLeft: `Starts ${abs(F.fadeLeft.x)}px to the right and slides left into place.`,
  fadeRight: `Starts ${abs(F.fadeRight.x)}px to the left and slides right into place.`,
  scale: `Grows from ${F.scale.scale} of its size to full size.`,
  flip: `Turns ${F.flip.rotateX}° around its horizontal axis into place.`,
  flipX: `Turns ${F.flipX.rotateY}° around its vertical axis into place.`,
};

const OPTIONS: { k: string; def: string; d: string }[] = [
  { k: 'preset', def: `'${D.preset}'`, d: `The start state, by name: one of the ${REVEAL_PRESETS.length} below.` },
  { k: 'from', def: 'none', d: 'A start state of your own: opacity, x and y in px, scale, rotate, rotateX and rotateY in degrees. Each key wins over the preset’s, and each animates to its resting value: opacity and scale to 1, the rest to 0.' },
  { k: 'stagger', def: String(D.stagger), d: 'How far behind its neighbour in the same row each element starts, as a fraction of the reveal window, from 0 to 1.' },
  { k: 'easing', def: `'${D.easing}'`, d: `${REVEAL_EASINGS.map((e) => `'${e}'`).join(', ')}, or any function of t.` },
  { k: 'once', def: String(D.once), d: 'Keep each element at the furthest it has got, instead of reversing as you scroll back up. In 2.23.2 and earlier it kept the highest eased value, so spring and elastic stopped past their place and bounce lost its dips; fixed in 2.23.3, which keeps the scroll progress and eases it after.' },
  { k: 'trigger', def: `{ start: '${trig(D.start)}', end: '${trig(D.end)}' }`, d: `The element’s edge and a line down the window: it starts when its top is ${D.start}% down the window and is in place at ${D.end}%. Either key can be set alone.` },
  { k: 'onEnter', def: 'none', d: 'Called each time the first element enters its window, scrolling down, once: true included.' },
  { k: 'onLeave', def: 'none', d: 'Called each time the last element passes the end of its window, scrolling down.' },
];

const DEFAULTS_JS = `import { scrollReveal } from 'svg-scroll-draw/reveal';

// Every default written out: the same as scrollReveal('.card').
const reveal = scrollReveal('.card', {
  preset: '${D.preset}',    // ${describeFrom(F[D.preset])}
  stagger: ${D.stagger},
  easing: '${D.easing}',
  once: ${D.once},
  trigger: { start: '${trig(D.start)}', end: '${trig(D.end)}' },
});

// When the page changes: every element's inline styles back as they were.
reveal.destroy();`;

const ROWS = [0, 1].flatMap((r) =>
  rowWindows(D.start, D.end, D.stagger, 3).map((w, i) => ({ n: r * 3 + i + 1, row: r + 1, place: i, ...w })),
);

const FAQ: { q: string; a: string }[] = [
  {
    q: 'How do I make a scroll reveal animation?',
    a: `Call scrollReveal on the elements: scrollReveal('.card'), imported from svg-scroll-draw/reveal. By default each one fades in and rises ${abs(F.fadeUp.y)}px as its top moves from ${D.start}% to ${D.end}% of the window, and the cards in a row follow one another a little apart. There is no stylesheet to add. The generator above sets the options and writes the call.`,
  },
  {
    q: 'How do I reveal elements on scroll in React?',
    a: "Call scrollReveal in a useEffect on the elements a ref holds, and return its destroy() as the cleanup: const r = scrollReveal(ref.current.querySelectorAll('.card')); return () => r.destroy(). destroy() puts every element’s inline styles back as they were, so Strict Mode, which runs effects twice in development, leaves nothing behind. In the Next.js App Router the component needs 'use client'. The React tab of the generator writes the whole component.",
  },
  {
    q: 'How do I animate on scroll with plain JavaScript?',
    a: `Import scrollReveal from svg-scroll-draw/reveal and call it with a selector, a NodeList or an array of elements. It is one function with typed options instead of attributes in your HTML, and it is ${SELF_ENTRIES.reveal} KB gzipped with nothing else to load. To keep AOS’s data-aos markup instead, the AOS drop-in, svg-scroll-draw/aos, runs it as it is.`,
  },
  {
    q: 'How do I make a reveal play only once, or reverse when scrolling up?',
    a: 'once: true, the default, keeps every element at the furthest it has got, so scrolling back up leaves it where it is. once: false ties it to the scroll both ways: scrolling up plays it backwards, and it hides again once its top drops below the start line. In 2.23.2 and earlier, once: true with a spring or elastic easing stopped each element past its place, on the top of the overshoot; 2.23.3 fixes that, and it settles in place.',
  },
  {
    q: 'Why does scrollReveal not animate inside a scrolling div?',
    a: 'scrollReveal follows the window’s scroll. It has no scrollContainer option, so elements in a panel that scrolls on its own do not move as the panel scrolls. For that case, scrollAnimate from svg-scroll-draw takes a scrollContainer option and explicit props such as opacity: [0, 1]; the preview box above is built that way.',
  },
  {
    q: 'Does scrollReveal respect prefers-reduced-motion?',
    a: 'Yes. For readers who ask their system for less motion, every element is shown in its final state at once, with nothing moving. A reader who turns the setting on while the page is open gets the same from that moment.',
  },
  {
    q: 'Is scrollReveal the same as ScrollReveal.js?',
    a: `No. ScrollReveal.js is a separate library (${SR.version}), licensed ${SR.license}. scrollReveal is svg-scroll-draw’s own function, with the options on this page. svg-scroll-draw also has an MIT drop-in for ScrollReveal.js’s API, svg-scroll-draw/scrollreveal, so a site using it can switch by changing the import.`,
  },
];

const TOC = [
  { id: 'generator', label: 'The generator' },
  { id: 'how', label: 'How it follows the scroll' },
  { id: 'presets', label: `Presets · ${REVEAL_PRESETS.length}` },
  { id: 'stagger', label: 'Stagger, once, reduced motion' },
  { id: 'aos', label: 'scrollReveal or AOS' },
  { id: 'faq', label: `Questions · ${FAQ.length}` },
];

export const metadata: Metadata = {
  title: seoTitle(TITLE),
  description: DESCRIPTION,
  keywords: [
    'scroll reveal animation', 'reveal on scroll', 'animate on scroll js', 'react reveal on scroll',
    'scroll reveal generator', 'scroll animation generator', 'fade in on scroll', 'stagger animation on scroll',
    'scrollreveal alternative', 'aos alternative',
  ],
  alternates: { canonical: '/scroll-reveal-generator' },
  openGraph: { type: 'article', title: TITLE, description: DESCRIPTION, url: `${SITE_URL}/scroll-reveal-generator` },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

const JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      name: 'Scroll reveal generator',
      url: `${SITE_URL}/scroll-reveal-generator`,
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

export default function ScrollRevealGeneratorPage() {
  return (
    <SiteShell
      active="/scroll-reveal-generator"
      crumbs={[['Scroll reveal generator', '/scroll-reveal-generator']]}
      kicker="reveal / your turn"
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(JSON_LD) }} />
      <div className="stk">

        <header className="pg-head stk-head">
          <div>
            <p className="pg-kicker">
              <span>tool / scroll reveal</span>
              <span>javascript · react</span>
            </p>
            <h1 className="pg-title stk-title">Scroll reveal generator</h1>
            <p className="pg-lede">
              Pick a preset, set the stagger, the easing and the trigger window, and watch cards reveal as a box
              scrolls. Then copy the code: one <C>scrollReveal</C> call in JavaScript, or a React component.
            </p>
            <div className="pg-actions">
              <a href="#generator" className="btn btn-solid" data-magnetic>Open the generator ↓</a>
              <CopyCommand />
            </div>
            <dl className="pg-facts">
              <div><dt>Presets</dt><dd>{REVEAL_PRESETS.length}</dd></div>
              <div><dt>Easings</dt><dd>{REVEAL_EASINGS.length}</dd></div>
              <div><dt>Options</dt><dd>{OPTIONS.length}</dd></div>
              <div><dt>Gzipped</dt><dd>{SELF_ENTRIES.reveal} KB</dd></div>
            </dl>
          </div>
          <RevealFigure />
        </header>

        <div className="stk-body">
          <Toc label="On this page" items={TOC} />
          <div className="stk-main">

            <Sec n={1} k="The tool" id="generator" title="Make your scroll reveal">
              <RevealGenerator />
            </Sec>

            <Sec n={2} k="The model" id="how" title="How a reveal follows the scroll">
              <p className="stk-p">
                Each element gets its own progress, a number from 0 to 1 read from the scroll: 0 when its top reaches{' '}
                {D.start}% of the window, 1 when it reaches {D.end}%, a little later for the next ones in a row
                (section 4). The easing shapes that number, and the element’s style follows it from the start state to
                where it sits (fig. 1). So there is no duration: scroll faster and it plays faster, stop half way and it
                waits half way.
              </p>
              <CodeBox file="main.js">{DEFAULTS_JS}</CodeBox>
              <div className="srg-scroll">
                <table className="srg-table is-stack">
                  <thead><tr><th>Option</th><th>Default</th><th>What it does</th></tr></thead>
                  <tbody>
                    {OPTIONS.map((o) => (
                      <tr key={o.k}>
                        <td className="is-code is-key">{o.k}</td>
                        <td className="is-code is-def" data-k="default">{o.def}</td>
                        <td className="is-wide">{o.d}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Note k="Its place">
                The window is measured from where the element sits in the layout, not from where its start state has
                moved it, so a card that starts {abs(F.fadeUp.y)}px low still starts on time.
              </Note>
              <Note k="JavaScript">
                scrollReveal always runs on the library’s JavaScript scroll engine, never on CSS scroll timelines, so
                it behaves the same in every browser.
              </Note>
            </Sec>

            <Sec n={3} k={`${REVEAL_PRESETS.length} presets`} id="presets" title="Every preset, or your own">
              <p className="stk-p">
                Each preset is a start state; every element animates from it to opacity 1, scale 1, no offset and no
                turn, written on the element as inline styles.
              </p>
              <div className="srg-scroll">
                <table className="srg-table is-stack">
                  <thead><tr><th>Preset</th><th>Starts at</th><th>What it does</th></tr></thead>
                  <tbody>
                    {REVEAL_PRESETS.map((p) => (
                      <tr key={p}>
                        <td className="is-code is-key">{p}</td>
                        <td className="is-code is-def">{describeFrom(F[p])}</td>
                        <td className="is-wide">{PRESET_NOTES[p]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="stk-p">
                <C>from</C> changes a preset key by key: <C long>{"preset: 'fadeLeft', from: { x: 80 }"}</C> keeps the fade
                and slides 80px instead of {abs(F.fadeLeft.x)}. Given alone, <C>from</C> is laid over the default,{' '}
                {D.preset}, so <C>{'from: { y: 0 }'}</C> is a plain fade.
              </p>
              <Note k="Flips">
                <C>flip</C> and <C>flipX</C> turn the element with <C>rotateX</C> and <C>rotateY</C> and bring no
                perspective of their own, so on a flat parent the turn reads as a slight squash. Give the parent a
                perspective, such as <C>perspective: 800px</C>, for depth; the generator adds it for these two.
              </Note>
              <Note k="Its own CSS">
                The end state stays on the element as inline styles, <C>opacity: 1</C> and a transform such as{' '}
                <C>translateY(0px)</C>, and inline styles win over a stylesheet: an opacity or a transform the element
                gets from your CSS, a hover lift for example, does not show while scrollReveal runs. Put those on a
                child of the revealed element. <C>destroy()</C> puts the element’s own inline styles back.
              </Note>
            </Sec>

            <Sec n={4} k="Rows and replays" id="stagger" title="Stagger by row, once, and reduced motion">
              <p className="stk-p">
                <C>stagger</C> starts each element a fraction of its window later than the one before it in its row.
                The default window runs from {D.start}% to {D.end}%, {SPAN}% of the window’s height, so the default{' '}
                {D.stagger} puts each card {STEP}% after its neighbour. Rows come from the layout: elements whose tops
                line up count 0, 1, 2…, and one further down starts a new row at 0, since its place on the page
                already delays it. However long the row, none starts more than one whole window after its first.
              </p>
              <div className="srg-scroll">
                <table className="srg-table">
                  <thead><tr><th>Card</th><th>Row</th><th>Place</th><th>Starts</th><th>In place</th></tr></thead>
                  <tbody>
                    {ROWS.map((w) => (
                      <tr key={w.n}>
                        <td className="is-code">{String(w.n).padStart(2, '0')}</td>
                        <td className="is-code">{w.row}</td>
                        <td className="is-code">{w.place}</td>
                        <td className="is-code">{trig(w.start)}</td>
                        <td className="is-code">{trig(w.end)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Note k="Scrolling back">
                <C>once: true</C>, the default, keeps each element at the furthest it has got: scroll back up and it
                stays. With <C>once: false</C> it follows the scroll both ways, playing backwards as you scroll up and
                hiding again below the start line. In 2.23.2 and earlier, <C>once: true</C> kept the highest eased
                value, so with spring or elastic each element stopped past its place, on the top of the overshoot, and
                bounce lost its dips; fixed in 2.23.3, which keeps the furthest scroll progress and eases it after.
              </Note>
              <Note k="Reduced motion">
                For readers who ask their system for less motion, every element is shown in its final state at once,
                with nothing moving, including when the setting is turned on while the page is open.
              </Note>
            </Sec>

            <Sec n={5} k="Two ways in" id="aos" title="scrollReveal or the AOS drop-in">
              <p className="stk-p">
                svg-scroll-draw reveals on scroll in two ways. <C>scrollReveal</C> is a JavaScript call whose motion
                follows the scroll. The AOS drop-in, <C>svg-scroll-draw/aos</C>, speaks AOS’s <C>data-aos</C> markup
                and <C>AOS.init()</C>: once an element crosses its trigger it plays a CSS transition of a set duration,
                as AOS {AOS.version} does. Keep an AOS site’s HTML as it is with the drop-in; write new code with
                either.
              </p>
              <div className="srg-scroll">
                <table className="srg-table is-stack is-vs">
                  <thead><tr><th>What</th><th>scrollReveal</th><th>AOS drop-in</th></tr></thead>
                  <tbody>
                    <tr>
                      <td className="is-key">Set up with</td>
                      <td className="is-code" data-k="scrollReveal">{"scrollReveal('.card')"}</td>
                      <td className="is-code" data-k="AOS drop-in">{'data-aos="fade-up"'} + AOS.init()</td>
                    </tr>
                    <tr>
                      <td className="is-key">Moves with</td>
                      <td data-k="scrollReveal">The scroll position</td>
                      <td data-k="AOS drop-in">A CSS transition, started at the trigger</td>
                    </tr>
                    <tr>
                      <td className="is-key">Stagger</td>
                      <td data-k="scrollReveal">By row, one <C>stagger</C> value</td>
                      <td data-k="AOS drop-in"><C>data-aos-delay</C> on each element</td>
                    </tr>
                    <tr>
                      <td className="is-key">Gzipped</td>
                      <td className="is-code" data-k="scrollReveal">{SELF_ENTRIES.reveal} KB</td>
                      <td className="is-code" data-k="AOS drop-in">{SELF_ENTRIES.aos} KB, styles included</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="stk-p">
                Every <C>data-aos</C> effect, live: <Link href="/aos-animation">AOS animation examples</Link>. Sizes,
                features and the same reveal written for each: <Link href="/vs-aos">svg-scroll-draw vs AOS</Link>.
              </p>
            </Sec>

            <Sec n={6} k={`${FAQ.length} questions`} id="faq" title="Scroll reveal questions">
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
                The generator is free, and the code it writes uses svg-scroll-draw {SELF.version}, MIT-licensed. Words
                instead of cards: the <Link href="/text-animation-generator">text animation generator</Link>. All of
                it: <Link href="/docs">the docs</Link>.
              </p>
            </Sec>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
