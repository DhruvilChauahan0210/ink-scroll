import type { Metadata } from 'next';
import '@/components/stack/stack.css';
import '@/components/jsx/jsx.css';
import Link from 'next/link';
import { SELF } from '@/data/competitors';
import { seoTitle } from '../_lib/seo';
import { SiteShell } from '@/components/site/SiteShell';
import { jsonLd, SITE_URL } from '@/lib/json-ld';
import { CodeBox } from '@/components/site/CodeBox';
import { SvgToJsx } from '@/components/jsx/SvgToJsx';
import { PipelineFigure } from '@/components/jsx/PipelineFigure';
import {
  RENAMED_ATTRIBUTES, SVG_NS, WRAP_DEFAULTS, convertSnippet, toComponent, toSvgText, type SvgEl, type SvgKid,
} from '@/components/jsx/convert';
import { C, Note, Sec, Toc } from '@/components/stack/parts';

// Searches this page is for: "svg to jsx", "svg to react component", "convert
// svg to jsx online", "svg to tsx". Every converted line quoted below is
// written by the converter's own functions (components/jsx/convert.ts), never
// typed by hand.
const TITLE = 'SVG to JSX Converter: SVG to React Component & TSX';
const DESCRIPTION =
  'Convert SVG to JSX or a typed TSX React component: camelCase props, style objects, {...props} and an optional scroll-drawing wrapper. Runs in your browser.';

const el = (tag: string, attrs: Record<string, string> = {}, kids: SvgKid[] = []): SvgEl => ({ tag, attrs: Object.entries(attrs), kids });

/** One rule: an SVG snippet, and what the converter writes for it and why. */
function rule(k: string, node: SvgKid, root = false, svg = toSvgText(node), why?: string) {
  const { jsx, changes } = convertSnippet(node, root);
  const text = why ?? changes[0]?.why ?? 'kept as it is';
  return { k, svg, jsx: jsx || '(removed)', why: text[0].toUpperCase() + text.slice(1) };
}

const RULES = [
  rule('Hyphenated names', el('path', { 'stroke-width': '2', 'fill-rule': 'evenodd' })),
  rule('clip-path, stop-color…', el('stop', { 'stop-color': '#fff' })),
  rule('class', el('g', { class: 'steam' })),
  rule('style', el('g', { style: 'opacity: .6; --rise: 12px' })),
  rule('xlink:href', el('use', { 'xlink:href': '#leaf' })),
  rule('xml:space', el('text', { 'xml:space': 'preserve' }, [{ text: 'Hi' }])),
  // The root's own tag only: the rule is about the attribute.
  rule('xmlns:xlink', el('svg', { 'xmlns:xlink': 'http://www.w3.org/1999/xlink' }), true, '<svg xmlns:xlink="http://www.w3.org/1999/xlink">'),
  rule('xmlns', el('svg', { xmlns: SVG_NS }, [el('g', { xmlns: SVG_NS })]), true),
  rule('data-* and aria-*', el('g', { 'data-name': 'Cup', 'aria-hidden': 'true' })),
  rule('Case', el('svg', { viewbox: '0 0 24 24' })),
  rule('Event handlers', el('rect', { onclick: 'go()' })),
  rule('Comments', { comment: ' steam ' }),
  // The DOM cannot tell <path></path> from <path/>, so the converter records no change: the why is the page's.
  rule('Empty elements', el('path', { d: 'M2 2h20' }), false, '<path d="M2 2h20"></path>', 'an element with nothing in it closes itself'),
  rule('Text', el('text', {}, [{ text: 'a < b {c}' }])),
  rule('<style>', el('style', {}, [{ text: '.a { fill: red }' }])),
  rule('Editor data', el('g', { 'inkscape:label': 'Layer 1' })),
];

/** A check mark, converted with the wrap on: the code a reader would copy. */
const CHECK: SvgEl = el('svg', {
  xmlns: SVG_NS, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
}, [el('circle', { cx: '12', cy: '12', r: '10' }), el('path', { d: 'M7 12.5l3.5 3.5 6.5-7' })]);
const WRAPPED = toComponent(CHECK, {
  name: 'CheckDrawn', ts: true, spread: true, size: '1em', title: '',
  wrap: { ...WRAP_DEFAULTS, easing: 'ease-out', stagger: 0.2, once: true },
});
const WRAPPED_CODE = 'code' in WRAPPED ? WRAPPED.code : '';

const PAGE_USE = `// app/page.tsx: a Server Component. No "use client" anywhere.
import { CheckDrawn } from './CheckDrawn';

export default function Page() {
  return <CheckDrawn className="check" aria-label="Done" />;
}`;

const LEFT_OUT: { what: string; all: string; drawing: string }[] = [
  { what: '<script>, onclick and other on… attributes, javascript: links', all: 'Left out: they would run code', drawing: 'Left out' },
  { what: '<foreignObject>', all: 'Left out: it holds HTML, not SVG', drawing: 'Left out' },
  { what: 'Editor data: inkscape:, sodipodi:, <metadata>', all: 'Left out', drawing: 'Left out' },
  { what: 'class, style, id, data-*, aria-*', all: 'Kept, converted', drawing: 'Left out' },
  { what: '<title>, <desc>, <text>', all: 'Kept, text escaped', drawing: 'Left out' },
  { what: '<defs>, gradients, clip paths, masks, <use>, <a> and what is in it', all: 'Kept', drawing: 'Left out; a gradient fill becomes currentColor' },
  { what: 'width and height on the <svg>', all: 'Kept, or 1em, or removed', drawing: 'Left out, or 1em' },
  { what: 'Paths, shapes and groups: geometry, transform, fill, stroke, stroke width, caps, joins, opacity', all: 'Kept, converted', drawing: 'Kept, converted' },
  { what: 'Any other attribute: stroke-dasharray, clip-path, font-size…', all: 'Kept, converted', drawing: 'Left out' },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: 'How do I convert SVG to JSX?',
    a: 'JSX is not HTML: an attribute becomes a JavaScript prop, so stroke-width is written strokeWidth and class is written className, a style string becomes an object, comments go, an empty element closes itself, and a { or < in text has to be escaped. Paste the SVG above and copy the result; the table under the code lists every change it made and why.',
  },
  {
    q: 'How do I turn an SVG into a React component?',
    a: 'Put the converted JSX in a function that returns it, and spread props onto the <svg> so whatever the caller passes (className, width, aria-label, onClick) lands on it: export function Logo(props) { return <svg … {...props}>…</svg>; }. The converter writes that function. The other ways are an <img src="/logo.svg">, which cannot be styled from your CSS or take currentColor, and a build plugin such as SVGR that imports .svg files as components.',
  },
  {
    q: 'Why does React use strokeWidth and className instead of stroke-width and class?',
    a: 'A JSX attribute is a JavaScript name, and class is a reserved word there, so React calls it className; React’s DOM props are camelCase, and it writes them back to the page as stroke-width and class. A hyphenated stroke-width still renders, but React warns about it in development. data-* and aria-* are the exception: they keep their hyphens.',
  },
  {
    q: 'How do I convert an SVG to TSX with typed props?',
    a: 'Choose TypeScript. The component then takes props: SVGProps<SVGSVGElement>, imported as a type from react: the props React gives an <svg> element, so every attribute and event handler you pass is type-checked. A style with a custom property such as --rise is cast as CSSProperties, because React’s style type does not list custom properties. The converter also says when the SVG uses a name React’s types do not know.',
  },
  {
    q: 'How do I animate an SVG React component on scroll?',
    a: `Turn on the wrap: the <svg> goes inside <ScrollDraw> from svg-scroll-draw/react, which draws each path, line, polyline, polygon, rect and circle along its stroke as the page scrolls. By default it starts when the drawing’s top comes up past the bottom of the window and finishes when its bottom leaves the top; easing, stagger, once and the finish point are props. It animates strokes, so a filled icon shows at once unless you add fillOpacity={[0, 1]}, which the “fill fades in” option writes.`,
  },
  {
    q: 'Does the SVG component need “use client” in Next.js?',
    a: 'No. The plain component has no hooks or handlers, so it is a Server Component as it is. Wrapped in ScrollDraw it still needs no directive: svg-scroll-draw/react has started with "use client" since 2.16.1, so a Server Component can render <ScrollDraw> directly. Add "use client" to your own file only if you pass ScrollDraw a function, such as onComplete, because a function cannot be sent from the server to the browser.',
  },
  {
    q: 'Is it safe to paste my SVG here?',
    a: 'Yes. Nothing is uploaded: the SVG is read in your browser as an inert XML document, never inserted into the page, and the code is shown only as text. The preview is rebuilt separately from drawing elements alone. The code leaves out anything that could run, <script>, event handler attributes and javascript: links, and so cannot run anything from the paste either.',
  },
];

const TOC = [
  { id: 'converter', label: 'The converter' },
  { id: 'rules', label: `What changes · ${RULES.length} rules` },
  { id: 'scroll', label: 'Drawing it on scroll' },
  { id: 'left-out', label: 'What is left out' },
  { id: 'faq', label: `Questions · ${FAQ.length}` },
];

export const metadata: Metadata = {
  title: seoTitle(TITLE),
  description: DESCRIPTION,
  keywords: [
    'svg to jsx', 'svg to react component', 'convert svg to jsx online', 'svg to tsx', 'svg to react',
    'svg jsx converter', 'react svg component', 'svg to react typescript', 'inline svg react', 'svg classname react',
  ],
  alternates: { canonical: '/svg-to-jsx-converter' },
  openGraph: { type: 'article', title: TITLE, description: DESCRIPTION, url: `${SITE_URL}/svg-to-jsx-converter` },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

const JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      name: 'SVG to JSX converter',
      url: `${SITE_URL}/svg-to-jsx-converter`,
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

export default function SvgToJsxPage() {
  return (
    <SiteShell active="/svg-to-jsx-converter" crumbs={[['SVG to JSX converter', '/svg-to-jsx-converter']]} kicker="svg / your turn">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(JSON_LD) }} />
      <div className="stk">

        <header className="pg-head stk-head">
          <div>
            <p className="pg-kicker">
              <span>tool / svg to jsx</span>
              <span>runs in your browser</span>
            </p>
            <h1 className="pg-title stk-title">SVG to JSX converter</h1>
            <p className="pg-lede">
              Paste an SVG and get a React component: every attribute in the name React wants, the style as an object,
              comments and anything that could run left out, typed props if you write TypeScript. Wrap it in{' '}
              <C>{'<ScrollDraw>'}</C> and it draws itself as the page scrolls.
            </p>
            <div className="pg-actions">
              <a href="#converter" className="btn btn-solid" data-magnetic>Open the converter ↓</a>
              <Link href="/svg-path-viewer" className="btn" data-magnetic>SVG path viewer →</Link>
            </div>
            <dl className="pg-facts">
              <div><dt>Names renamed</dt><dd>{RENAMED_ATTRIBUTES}</dd></div>
              <div><dt>Rules</dt><dd>{RULES.length}</dd></div>
              <div><dt>Output</dt><dd>TSX · JSX</dd></div>
              <div><dt>Uploads</dt><dd>0</dd></div>
            </dl>
          </div>
          <PipelineFigure />
        </header>

        <div className="stk-body">
          <Toc label="On this page" items={TOC} />
          <div className="stk-main">

            <Sec n={1} k="The tool" id="converter" title="Convert SVG to a React component">
              <p className="stk-p">
                The sample is a cup of coffee, exported the way a drawing tool writes a file. Change any option and the
                code follows; the table under it says what changed and why. The preview is the drawing itself, rebuilt
                from its shapes, never the code.
              </p>
              <SvgToJsx />
            </Sec>

            <Sec n={2} k={`${RULES.length} rules`} id="rules" title="What changes, and why">
              <p className="stk-p">
                Names follow react-dom’s own table of SVG attributes, the one behind its “Invalid DOM property” warning,
                so every prop written here renders back as the attribute the SVG had. Each row below is the
                converter’s output for the snippet beside it.
              </p>
              <div className="jx-scroll" tabIndex={0} role="region" aria-label="What changes, and why">
                <table className="jx-ref">
                  <thead><tr><th>Rule</th><th>SVG</th><th>JSX</th><th>Why</th></tr></thead>
                  <tbody>
                    {RULES.map((r) => (
                      <tr key={r.k}>
                        <td>{r.k}</td>
                        <td className="is-code" data-k="svg">{r.svg}</td>
                        <td className="is-code" data-k="jsx">{r.jsx}</td>
                        <td data-k="why">{r.why}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Note k="Exceptions">
                React knows <C>transform-origin</C> and <C>mask-type</C> as attributes but its TypeScript types do not,
                so the converter writes them as the CSS properties of the same name in <C>style</C>, which do the same
                (a bare number in <C>transform-origin</C> gets the <C>px</C> CSS needs). And <C>tabindex</C> becomes{' '}
                <C>{'tabIndex={0}'}</C>, a number, because that is the one SVG prop React types as a number.
              </Note>
            </Sec>

            <Sec n={3} k="<ScrollDraw>" id="scroll" title="Drawing it on scroll">
              <p className="stk-p">
                With the wrap on, the <C>{'<svg>'}</C> goes inside <C>{'<ScrollDraw>'}</C> from{' '}
                <C>svg-scroll-draw/react</C>. It renders a <C>{'<div>'}</C> around the drawing and draws every path,
                line, polyline, polygon, rect and circle in it along its stroke as the page scrolls, from when the
                div’s top comes up past the bottom of the window (<C>{"start: 'top bottom'"}</C>) to when its bottom
                leaves the top (<C>{"end: 'bottom top'"}</C>). Only the options you change are written: the easing is{' '}
                <C>{`'${WRAP_DEFAULTS.easing}'`}</C> and the stagger {WRAP_DEFAULTS.stagger} unless you say otherwise.
              </p>
              <CodeBox file="CheckDrawn.tsx">{WRAPPED_CODE}</CodeBox>
              <CodeBox file="app/page.tsx">{PAGE_USE}</CodeBox>
              <p className="stk-p">
                <C>className</C> and <C>style</C> on <C>{'<ScrollDraw>'}</C> go on its div, and so do <C>data-*</C>,{' '}
                <C>aria-*</C>, <C>id</C> and <C>role</C>; every other prop is an option. Changing one draws it afresh,
                and an inline object such as <C>{"trigger={{ end: 'center center' }}"}</C> does not count as a change
                each render, because options are compared by value. Left at its defaults, or with only the easing
                changed to ease-in, ease-out or ease-in-out, the drawing runs on the browser’s own scroll timeline
                where that is supported; spring, bounce, elastic, a stagger, <C>once</C>, another trigger or{' '}
                <C>fillOpacity</C> use the JavaScript engine. A visitor who asks for reduced motion gets the drawing
                whole.
              </p>
              <Note k="Strokes, not fills">
                The drawing moves along each shape’s stroke, so a shape with a fill and no stroke appears at once. The
                converter warns when it finds them; <C>{'fillOpacity={[0, 1]}'}</C> (“fill fades in”) brings the fill
                up as the line draws. An <C>{'<ellipse>'}</C> is not in the default selector: turn it into a path with
                the <Link href="/svg-shape-to-path-converter">shape to path converter</Link>.
              </Note>
              <Note k="once, 2.23.2">
                On 2.23.2 and earlier, <C>once</C> with spring or elastic stopped on the overshoot past the end, and
                with bounce lost its dips, because it held the eased value. 2.23.3 holds the scroll progress and eases
                it after, so they settle as they should.
              </Note>
            </Sec>

            <Sec n={4} k="Safe by design" id="left-out" title="What is left out">
              <p className="stk-p">
                The paste is read by the browser’s XML parser into a document that is never put on the page, so
                nothing in it runs or loads while you convert. Two outputs come from it (fig. 1). The code is written
                from that document, and <b>Convert: everything</b> keeps all of it but what could run or what only an
                editor reads. <b>Convert: drawing only</b> writes the code from what the preview shows instead: the
                same strict rebuild the <Link href="/svg-path-viewer">SVG path viewer</Link> uses, drawing elements and
                drawing attributes only.
              </p>
              <div className="jx-scroll" tabIndex={0} role="region" aria-label="What each setting keeps">
                <table className="jx-ref">
                  <thead><tr><th>In the SVG</th><th>Everything</th><th>Drawing only</th></tr></thead>
                  <tbody>
                    {LEFT_OUT.map((r) => (
                      <tr key={r.what}><td className="is-code">{r.what}</td><td data-k="everything">{r.all}</td><td data-k="drawing only">{r.drawing}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Note k="White space">
                Runs of spaces and line breaks in text become one space, as the browser shows them, and the
                formatting between elements goes. A text that needs its spaces kept wants <C>white-space: pre</C> in
                CSS, since <C>xml:space</C> is removed.
              </Note>
            </Sec>

            <Sec n={5} k={`${FAQ.length} questions`} id="faq" title="SVG to JSX questions">
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
                Drawing on scroll with svg-scroll-draw {SELF.version}: <Link href="/react-scroll-animation">React</Link>,{' '}
                <Link href="/nextjs-scroll-animation">Next.js</Link>, or <Link href="/docs">the docs</Link>.
              </p>
            </Sec>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
