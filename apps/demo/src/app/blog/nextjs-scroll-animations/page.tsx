import type { Metadata } from 'next';
import Link from 'next/link';
import { seoTitle } from '../../_lib/seo';
import { SELF_ENTRIES } from '@/data/competitors';
import { BROWSER_SUPPORT } from '@/data/cssdriven';
import { BlogArticle, Section, Code, Callout, Figure, Closing } from '@/components/blog/BlogArticle';
import { IslandFigure } from './IslandFigure';

// Searches this post is for: "next.js scroll animation", "nextjs animate on
// scroll", "next js framer motion scroll", "app router animation", "use client
// animation". Every listing but the two marked "fails" and the two marked
// "avoid" was built with `next build` (Next 16.4.5, React 19.3.1) into one App
// Router app, served with `next start` and run in Chromium, Firefox and WebKit;
// the "fails" listings were built and fail as the post says, and the "avoid"
// mismatch one was run to show what it does.
const TITLE = 'Scroll Animations in Next.js (App Router): A Practical Guide';
const DESCRIPTION =
  'Scroll animations in the Next.js App Router: where ‘use client’ goes, client islands, CSS-only effects, server HTML that shows, route changes and next/image.';
const URL = 'https://svg-scroll-draw.vercel.app/blog/nextjs-scroll-animations';

export const metadata: Metadata = {
  title: seoTitle(TITLE),
  description: DESCRIPTION,
  keywords: [
    'next.js scroll animation',
    'nextjs animate on scroll',
    'next js framer motion scroll',
    'app router animation',
    'use client animation',
    'next.js server components animation',
    'next.js hydration animation',
    'next/dynamic ssr false',
  ],
  alternates: { canonical: '/blog/nextjs-scroll-animations' },
  openGraph: { title: TITLE, description: DESCRIPTION, url: URL },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline: 'Scroll animations in Next.js (App Router): a practical guide',
  description: DESCRIPTION,
  url: URL,
  datePublished: '2026-11-13',
  dateModified: '2026-11-13',
  author: { '@type': 'Person', name: 'Dhruvil Chauhan', url: 'https://github.com/DhruvilChauahan0210' },
  publisher: { '@type': 'Organization', name: 'svg-scroll-draw', url: 'https://svg-scroll-draw.vercel.app' },
  image: `${URL}/opengraph-image`,
  mainEntityOfPage: { '@type': 'WebPage', '@id': URL },
};

const support = (b: string) => BROWSER_SUPPORT.find((s) => s.browser.startsWith(b))?.since;

const FN_PROP_TSX = `// app/page.tsx, a Server Component. This fails: a function cannot
// travel from the server to the browser as a prop.
<ScrollAnimate props={{ opacity: [0, 1] }} onComplete={() => console.log('seen')}>
  <Card />
</ScrollAnimate>`;

const TREE = `app/
  layout.tsx        server: a CSS progress bar, no JavaScript
  globals.css       the scroll() timeline behind it
  page.tsx          server: async, reads the data, places the islands
  about/page.tsx    server: streams a slow part in <Suspense>
components/
  Reveal.tsx        'use client': the only client file`;

const REVEAL_TSX = `'use client';

import type { ReactNode } from 'react';
import { ScrollAnimate } from 'svg-scroll-draw/react';

type Props = { children: ReactNode; y?: number };

/** Fades its children up as they scroll in, once. */
export function Reveal({ children, y = 32 }: Props) {
  return (
    <ScrollAnimate
      props={{ opacity: [0, 1], transform: [\`translateY(\${y}px)\`, 'translateY(0px)'] }}
      trigger={{ start: 'top 88%', end: 'top 53%' }}
      once
    >
      {children}
    </ScrollAnimate>
  );
}`;

const PAGE_TSX = `import Image from 'next/image';
import Link from 'next/link';
import { Reveal } from '@/components/Reveal';

type Feature = { id: string; title: string; body: string };

// Stands in for your database or CMS. It runs on the server only.
async function getFeatures(): Promise<Feature[]> {
  return [
    { id: 'html', title: 'In the HTML', body: 'Every word is in the server response.' },
    { id: 'island', title: 'One small island', body: 'Only the reveal ships JavaScript.' },
    { id: 'motion', title: 'Reduced motion', body: 'Shown in place, without the trip.' },
  ];
}

export default async function Page() {
  const features = await getFeatures();
  return (
    <main>
      <h1>Ship the words, animate the arrival</h1>
      <p>This heading and paragraph never move, so nothing ever hides them.</p>

      {features.map((f) => (
        <Reveal key={f.id}>
          <article className="card">
            <h2>{f.title}</h2>
            <p>{f.body}</p>
          </article>
        </Reveal>
      ))}

      <Reveal y={48}>
        <Image
          src="/team.jpg"
          alt="The team at work"
          width={1200}
          height={800}
          sizes="(max-width: 768px) 100vw, 768px"
        />
      </Reveal>

      <Link href="/about">About us</Link>
    </main>
  );
}`;

const LAYOUT_TSX = `import type { ReactNode } from 'react';
import './globals.css';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* Driven by the page's scroll in CSS: no JavaScript at all. */}
        <div className="read-progress" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}`;

const PROGRESS_CSS = `.read-progress {
  display: none;
}

@supports (animation-timeline: scroll()) {
  .read-progress {
    display: block;
    position: fixed;
    inset: 0 0 auto;
    z-index: 10;
    height: 3px;
    background: currentColor;
    transform-origin: 0 50%;
    animation: read-progress linear both;
    animation-timeline: scroll(root);
  }
}

@keyframes read-progress {
  from { scale: 0 1; }
  to   { scale: 1 1; }
}`;

const HIDDEN_TSX = `// Avoid: the server HTML says opacity 0. The card is blank until the
// script loads and hydrates, and blank for good if it never does.
<div className="opacity-0 translate-y-8 transition-all" data-reveal>
  <Card />
</div>`;

const MISMATCH_TSX = `'use client';
import { useState, type ReactNode } from 'react';

// Avoid: the server has no window, so it renders data-motion="on". In the
// browser of a reader who asked for reduced motion, the first render says
// "off". React does not patch an attribute on hydration: it stays "on".
export function Hero({ children }: { children: ReactNode }) {
  const [reduce] = useState(
    () => typeof window !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  return <section data-motion={reduce ? 'off' : 'on'}>{children}</section>;
}`;

const REDUCED_TS = `import { useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

function subscribe(onChange: () => void) {
  const mq = matchMedia(QUERY);
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}

// The server and the hydrating render both read false, so they agree. React
// then renders again with the real value, and again whenever it changes.
export function useReducedMotion() {
  return useSyncExternalStore(subscribe, () => matchMedia(QUERY).matches, () => false);
}`;

const ABOUT_TSX = `import { Suspense } from 'react';
import { connection } from 'next/server';
import Link from 'next/link';
import { Reveal } from '@/components/Reveal';

// Stands in for a slow query. connection() makes it run per request,
// so the page streams: the shell first, the team when it is ready.
async function Team() {
  await connection();
  await new Promise((resolve) => setTimeout(resolve, 800));
  const team = ['Ada', 'Grace', 'Linus', 'Margaret'];
  return (
    <ul className="team">
      {team.map((name) => <li key={name}>{name}</li>)}
    </ul>
  );
}

export default function About() {
  return (
    <main>
      <h1>About us</h1>
      <Suspense fallback={<p>Loading the team…</p>}>
        <Team />
      </Suspense>
      <Reveal>
        <p className="card">Three roles open.</p>
      </Reveal>
      <Reveal>
        <p className="card">Offices in two cities.</p>
      </Reveal>
      <Link href="/">Home</Link>
    </main>
  );
}`;

const SSR_FALSE_TSX = `// app/page.tsx, a Server Component. This fails the build.
import dynamic from 'next/dynamic';

const Globe = dynamic(() => import('@/components/Globe'), { ssr: false });`;

const DYNAMIC_TSX = `'use client';

import dynamic from 'next/dynamic';

// Its JavaScript comes in a chunk of its own, and it is still rendered on
// the server: its words are in the HTML.
const Showcase = dynamic(() => import('./Showcase'));

// Only for a part that cannot render without a browser. The server HTML
// has the loading fallback, and nothing of the part itself.
const Globe = dynamic(() => import('./Globe'), {
  ssr: false,
  loading: () => <p>Loading the globe…</p>,
});

export function Sections() {
  return (
    <>
      <Showcase />
      <Globe />
    </>
  );
}`;

export default function Page() {
  return (
    <BlogArticle
      slug="nextjs-scroll-animations"
      jsonLd={articleJsonLd}
      tags={['Next.js', 'Server Components', 'Hydration']}
      title={<>Scroll animations in Next.js (App Router): a practical guide</>}
      lede={
        <>
          In the App Router every component renders on the server first, and a scroll animation needs the browser. The
          work is in the seam between the two: which file says <code>&apos;use client&apos;</code>, what the server
          HTML shows before any script runs, and what happens when the reader navigates, streams in late content or
          asks for less motion. Here is each of those, with a small App Router app built and run in three browsers.
        </>
      }
      facts={[
        { k: '‘use client’', v: 'in 1 file' },
        { k: 'Server HTML', v: 'nothing hidden' },
        { k: 'svg-scroll-draw/react', v: `${SELF_ENTRIES.react} KB` },
      ]}
      figure={
        <Figure n={1} caption={<>the example’s page by where each part runs. Every box is in the server HTML. Only the two kinds of <code>Reveal</code> are client islands, and what they hold was rendered on the server and handed in as children.</>}>
          <IslandFigure />
        </Figure>
      }
      further={[
        { href: '/blog/react-scroll-animations', label: 'React scroll animations: CSS, Framer Motion or a hook?', blurb: 'The four ways to animate on scroll in React, and which to pick.' },
        { href: '/blog/css-scroll-driven-animations', label: 'CSS scroll-driven animations explained', blurb: 'view(), scroll() and animation-range, behind the zero-JavaScript parts.' },
      ]}
    >
      <Section id="use-client" k="the boundary" title={<>Where <code>&apos;use client&apos;</code> goes</>} toc="Where ‘use client’ goes">
        <p>
          Every file under <code>app/</code> is a Server Component until it says otherwise. The directive does not
          mean “this component runs in the browser” so much as “the browser starts here”: the file and everything it
          imports become client code, and the props that cross into it must be plain data the server can serialise.
        </p>
        <p>
          A scroll animation reads the scroll position and the layout, so it runs in a client component. The question
          is how little of the page has to be one. With svg-scroll-draw the answer can be none of your files: the
          built <code>svg-scroll-draw/react</code> entry begins with <code>&quot;use client&quot;</code>, so a Server
          Component imports <code>ScrollAnimate</code> or <code>ScrollDraw</code> and renders it directly. This
          site does exactly that: the <Link href="/nextjs-scroll-animation">Next.js scroll animation page</Link> is a
          Server Component rendering a live <code>&lt;ScrollDraw&gt;</code>, so the site’s build fails if the
          directive ever goes missing from the package.
        </p>
        <p>
          The other entries, <code>svg-scroll-draw</code>, <code>/reveal</code>, <code>/pin</code>,{' '}
          <code>/text</code>, are plain functions with no directive. Call them inside <code>useEffect</code> in a
          client file, and return their <code>destroy()</code>; on the server each returns an instance that does
          nothing, so an accidental call during rendering never touches <code>window</code>.
        </p>
        <p>
          What cannot cross the boundary is a function. A callback passed from a Server Component stops the build:
        </p>
        <Code file="app/page.tsx (fails)">{FN_PROP_TSX}</Code>
        <p>
          For a prop named <code>on…</code> the build stops with “Event handlers cannot be passed to Client Component
          props”, and for any other function, such as a counter’s <code>format</code>, with “Functions cannot be
          passed directly to Client Components”. Either way the fix is the same: the component with the callback goes
          in a <code>&apos;use client&apos;</code> file of your own, and the page renders that.
        </p>
      </Section>

      <Section id="islands" k="client islands" title="Keep the animated part a small island">
        <p>
          The quick fix for any client-only error is <code>&apos;use client&apos;</code> at the top of{' '}
          <code>page.tsx</code>. It works, and it costs the page three things. A client component cannot be{' '}
          <code>async</code>, so the data fetching moves to the browser or into an effect. Everything the page imports,
          a Markdown parser or a date library, ships to every reader. And every child is hydrated, including the
          paragraphs that never move.
        </p>
        <p>
          The better shape is a wrapper that takes <code>children</code>. When a Server Component puts its own JSX
          inside a client component, that JSX is rendered on the server and arrives as finished output: the client
          component places it, and none of its code ships. Fig. 1 is the example below drawn that way. The page
          stays a Server Component that reads its data; each card is server-rendered; only the{' '}
          <code>Reveal</code> around it is client code.
        </p>
        <Code file="project">{TREE}</Code>
      </Section>

      <Section id="example" k="the example" title="A minimal App Router example">
        <p>
          One client file. It sets the effect once, so every reveal on the site moves the same way:
        </p>
        <Code file="components/Reveal.tsx">{REVEAL_TSX}</Code>
        <p>
          Each card starts as its top edge passes 88% of the way down the screen and is in place by 53%, following the
          scroll in between. <code>once</code> holds it there when the reader scrolls back up. The library measures the
          card where the page lays it out, not where the 32px offset draws it, so the window does not shift with the
          animation.
        </p>
        <p>
          Strictly, <code>Reveal</code> would work without the directive, since <code>ScrollAnimate</code> brings its
          own. It is there because this is the island you own: the day it takes a callback or calls a hook, the
          boundary is already in the right place. Its props, <code>children</code> and a number, cross it as data.
        </p>
        <Code file="app/page.tsx">{PAGE_TSX}</Code>
        <p>
          The page has no directive. It is <code>async</code>, it reads its data on the server, and it places a{' '}
          <code>Reveal</code> around each part that moves. The heading and the first paragraph are not wrapped,
          because the reader sees them before any scroll: they need no animation, and no JavaScript.
        </p>
        <Callout k="the components work bare">
          If you never need a callback, skip <code>Reveal.tsx</code> and render <code>&lt;ScrollAnimate&gt;</code>{' '}
          from the page itself, as the <Link href="/nextjs-scroll-animation">Next.js page</Link> does. The{' '}
          <Link href="/react-scroll-animation">React scroll animation page</Link> lists every component and its props.
        </Callout>
      </Section>

      <Section id="css-only" k="zero javascript" title="CSS-only scroll animations in a Server Component">
        <p>
          Some scroll effects need no JavaScript at all, and so no client component. A scroll timeline drives a CSS
          animation by the scroll position itself, and a Server Component only has to render the element. Here is a
          reading progress bar, put in the root layout so every page has it:
        </p>
        <Code file="app/layout.tsx">{LAYOUT_TSX}</Code>
        <Code file="app/globals.css">{PROGRESS_CSS}</Code>
        <p>
          <code>scroll(root)</code> runs from the top of the page to the bottom, and the bar scales across the screen
          with it. Chrome and Edge have scroll timelines since {support('Chrome')}, Safari since {support('Safari')} and
          Firefox since {support('Firefox')}; anywhere else the <code>@supports</code> block is skipped and the bar is
          never shown, which beats a bar stuck at zero. It stays for readers who ask for reduced motion, because it moves
          only while they scroll, in step with their hand. The whole technique, and a version for one article rather
          than the page, is in{' '}
          <Link href="/blog/reading-progress-bar-css">a reading progress bar in CSS</Link>.
        </p>
        <p>
          The same works for reveals, with <code>animation-timeline: view()</code> on a class: the{' '}
          <Link href="/blog/react-scroll-animations#css">CSS way in the React post</Link> is a Server Component with a
          class name and no directive. What CSS cannot do is hold the end state once reached, or tell your code it
          happened. That is when the client island earns its bytes.
        </p>
      </Section>

      <Section id="server-html" k="hydration" title="Keep the content in the server HTML">
        <p>
          Between the server HTML arriving and the page hydrating there is a gap: a fraction of a second on a fast
          laptop, seconds on a slow phone, forever if the script fails. Whatever the server HTML shows is what the
          reader has in that gap. The common way to get it wrong is to put the start of the animation in the markup:
        </p>
        <Code file="avoid.tsx">{HIDDEN_TSX}</Code>
        <p>
          The same happens with a component that writes its start state on the server. Motion’s{' '}
          <code>initial</code> is one: the server HTML carries <code>opacity: 0</code>, as the{' '}
          <Link href="/blog/react-scroll-animations#nextjs">React post’s Next.js section</Link> shows.
        </p>
        <p>
          svg-scroll-draw’s components render your markup and nothing else: <code>&lt;ScrollAnimate&gt;</code> is a
          plain <code>div</code> with your children, no style attribute. The start state is written in the browser,
          after hydration, and only for an element that is still before its window. An element already past it, such
          as a card on screen at load, gets its end state on the first frame instead, so it never blinks. The app
          behind this post was checked for exactly that: its server HTML has no <code>opacity</code> in it, every card
          shows with JavaScript turned off, and the card on screen at load stayed at full opacity through hydration in
          all three browsers.
        </p>
        <p>
          Two edges remain, and both are smaller than a blank page. A card already part-way through its window at load
          starts part-way, so keep the window’s start near the bottom of the screen (88% here) and few cards will be.
          And a reader who scrolls before the page hydrates sees a card in place, then sees it drop back and come in.
        </p>
        <p>
          The other way to break hydration is to render from something only the browser knows:
        </p>
        <Code file="avoid.tsx">{MISMATCH_TSX}</Code>
        <p>
          In development React warns that the attributes did not match, and its message says they will not be patched
          up; in production it says nothing. Run under reduced motion, the attribute stayed <code>on</code>. To read a
          media query in your own components, let the server and the hydrating render agree, and change after:
        </p>
        <Code file="components/useReducedMotion.ts">{REDUCED_TS}</Code>
        <p>
          <code>useSyncExternalStore</code> takes a third function for the server and for hydration, here{' '}
          <code>false</code>; React then renders again with the real value, without a mismatch, and again when the
          reader changes the setting. svg-scroll-draw’s components need none of this, since they read the setting
          in the browser, after mounting.
        </p>
      </Section>

      <Section id="routes" k="navigation" title="Route changes, streaming and scroll restoration">
        <p>
          Each component sets its animation up in an effect and tears it down in the effect’s cleanup:{' '}
          <code>destroy()</code> removes its scroll and resize listeners and observers, puts back the inline styles it
          wrote, and drops the instance from the library’s registry. When the reader follows a <code>&lt;Link&gt;</code>,
          the old page’s components unmount and clean up, and the new page’s set up. In the app behind this post, six
          client-side navigations, three there and back, left the scroll listeners and the live instances exactly
          where they started.
        </p>
        <p>
          The scroll position is Next’s to manage. Following a <code>&lt;Link&gt;</code>, Next keeps the position if the
          new page is in view and otherwise scrolls to its top; going back returns the reader part-way down the old
          page. Neither needs anything from you, because the engines measure each card’s window from the page and
          read the scroll on every frame, so a position simply shows each card as it is at that point. Following a
          link from the bottom of one page, the next page’s cards below the fold still wait for the reader; going
          back, every card above the screen is already in place.
        </p>
        <p>
          A <code>layout.tsx</code> does not remount between its pages. Components rendered in it stay set up, and
          one below <code>{'{children}'}</code>, a footer that draws itself say, moves whenever the new page is a
          different height. It measures again on its own, because one shared <code>ResizeObserver</code> watches the
          body and every box above each animated element. A selector-based
          call made in a persistent layout, such as <code>scrollReveal(&apos;.card&apos;)</code>, is different: it
          found the cards that existed when it ran, and needs to run again when the pathname changes, as{' '}
          <Link href="/nextjs-scroll-animation#pt-4">pattern 4 on the Next.js page</Link> shows.
        </p>
        <p>
          Streaming moves things too. A <code>&lt;Suspense&gt;</code> boundary sends its fallback with the shell and
          its content when it is ready, and everything below it moves down when that content arrives:
        </p>
        <Code file="app/about/page.tsx">{ABOUT_TSX}</Code>
        <p>
          Whether the reveals set up before or after the team arrives depends on when the browser hydrates. Run here,
          Chromium and Firefox hydrated the shell first and WebKit waited for the whole response. Both cases end
          well. A reveal still below the fold when the team arrives measures again when the observer reports the move,
          so the second card starts as its own top passes 88%, wherever that now is. A reveal that was on screen when
          it set up, like the first card under the short fallback, counted as seen: <code>once</code> keeps it shown
          after the team pushes it down. To have neither case, give the fallback the height of what it stands for,
          and nothing below it moves.
        </p>
        <Callout k="view transitions">
          Animating between routes is a different job. React 19.3’s <code>&lt;ViewTransition&gt;</code>, which the
          Next.js 16 docs say works in the App Router with no configuration, animates elements from one page to the
          next during a navigation. Scroll animations work within one page. Neither replaces the other.
        </Callout>
      </Section>

      <Section id="dynamic" k="bundle size" title="next/dynamic: split the code, keep the HTML">
        <p>
          The reflex for a library that touches the browser is <code>next/dynamic</code> with{' '}
          <code>ssr: false</code>. For a reveal it is the wrong tool: it takes the section out of the server HTML, so
          the reader gets the loading fallback, or nothing, until the chunk arrives. And in a Server Component it is not
          allowed at all:
        </p>
        <Code file="app/page.tsx (fails)">{SSR_FALSE_TSX}</Code>
        <p>
          The build stops with “<code>ssr: false</code> is not allowed with <code>next/dynamic</code> in Server
          Components”. The Next.js docs add that a Server Component dynamically importing a client component does not
          get automatic code splitting either. So both kinds of dynamic import go in a client file:
        </p>
        <Code file="components/Sections.tsx">{DYNAMIC_TSX}</Code>
        <p>
          Run, <code>Showcase</code>’s words were in the server HTML and <code>Globe</code>’s were not: the HTML had
          only “Loading the globe…” until the browser drew it. Use <code>ssr: false</code> for a part that truly
          cannot render on a server, like a canvas sized from <code>window</code>. svg-scroll-draw is not one: it
          renders on the server as it is.
        </p>
        <p>
          Splitting is worth it for a heavy section, a scroll video or an image sequence with its frames. The animation
          code itself is small: the whole <code>svg-scroll-draw/react</code> entry, every component and its engines, is{' '}
          {SELF_ENTRIES.react} KB gzipped, loaded once and shared by every island on the page.
        </p>
      </Section>

      <Section id="images" k="next/image" title="Revealing a next/image">
        <p>
          The example’s last island holds a <code>next/image</code>. Put the reveal on a wrapper, as there, not on the
          image: <code>next/image</code> writes its own styles to the <code>img</code>, such as a blurred placeholder,
          and the wrapper’s opacity covers the image and its placeholder alike.
        </p>
        <ul>
          <li>
            <strong>Give it a size.</strong> <code>width</code> and <code>height</code> reserve the box before the file
            arrives, so the page does not shift. If an image without a size above a reveal loads late and pushes it
            down, the reveal measures again, as with streaming, but the reader still sees the jump.
          </li>
          <li>
            <strong>Let it load lazily.</strong> <code>next/image</code> loads lazily by default, so a revealed image
            far down the page starts loading as the reader nears it, and is usually ready by the time its window starts.
          </li>
          <li>
            <strong>Never reveal the hero.</strong> The largest image above the fold should be on screen the moment it
            loads. Next.js 16 deprecated <code>priority</code> for <code>preload</code>, and its docs recommend{' '}
            <code>loading=&quot;eager&quot;</code> or <code>fetchPriority=&quot;high&quot;</code> in most cases.
            Leave that one out of any reveal.
          </li>
        </ul>
      </Section>

      <Section id="reduced-motion" k="accessibility" title="Reduced motion">
        <p>
          A reader who asks for less motion should get the content in place. svg-scroll-draw’s components do it by
          default: under <code>prefers-reduced-motion: reduce</code> each one shows its end state when it mounts, and if
          the reader turns the setting on while the page is open, anything part-way finishes at once. Both were checked
          in the app above, in all three browsers.
        </p>
        <p>
          CSS you write yourself puts the movement inside <code>@media (prefers-reduced-motion: no-preference)</code>,
          except for effects that move only with the reader’s own scroll, like the progress bar. React code that needs
          the setting reads it through the <code>useReducedMotion</code> hook above, never in a{' '}
          <code>useState</code> initialiser. Which scroll effects should stop and which can stay is in{' '}
          <Link href="/blog/reduced-motion-scroll-animations">reduced motion for scroll animations</Link>.
        </p>
      </Section>

      <Closing
        title="Install a ready-made island"
        lede="Each block is one 'use client' file you install with the shadcn CLI and render from a Server Component. This one is a grid of feature cards that fade up once, every card in the server HTML."
        command="npx shadcn@latest add https://svg-scroll-draw.vercel.app/r/reveal-cards.json"
        links={[
          { href: '/blocks', label: 'Browse the blocks →' },
          { href: '/examples', label: 'Examples' },
        ]}
      />
    </BlogArticle>
  );
}
