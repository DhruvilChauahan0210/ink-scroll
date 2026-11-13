import type { Metadata } from 'next';
import Link from 'next/link';
import { seoTitle } from '../../_lib/seo';
import { SELF } from '@/data/competitors';
import { PARALLAX_DEFAULTS } from '@/data/parallax';
import { BlogArticle, Section, Code, Callout, Figure, Closing } from '@/components/blog/BlogArticle';
import { DepthLinesFigure } from './DepthLinesFigure';

// Searches this post is for: "parallax scrolling", "parallax scrolling css",
// "css parallax effect", "parallax scroll javascript". Every listing below was
// run in Chromium, Firefox and WebKit, and the CSS one's fallback in Firefox
// with scroll timelines turned off.
const TITLE = 'Parallax Scrolling with CSS and JavaScript';
const DESCRIPTION =
  'Move the layers of a scene at different speeds as the page scrolls: pure CSS on a scroll timeline, a small script for older browsers, and reduced motion.';
const URL = 'https://svg-scroll-draw.vercel.app/blog/parallax-scrolling-css';

export const metadata: Metadata = {
  title: seoTitle(TITLE),
  description: DESCRIPTION,
  keywords: [
    'parallax scrolling',
    'parallax scrolling css',
    'css parallax effect',
    'parallax scroll javascript',
    'parallax effect on scroll',
    'animation-timeline view parallax',
    'background-attachment fixed ios',
    'parallax reduced motion',
  ],
  alternates: { canonical: '/blog/parallax-scrolling-css' },
  openGraph: { title: TITLE, description: DESCRIPTION, url: URL },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline: 'Parallax scrolling with CSS and JavaScript',
  description: DESCRIPTION,
  url: URL,
  datePublished: '2026-11-13',
  dateModified: '2026-11-13',
  author: { '@type': 'Person', name: 'Dhruvil Chauhan', url: 'https://github.com/DhruvilChauahan0210' },
  publisher: { '@type': 'Organization', name: 'svg-scroll-draw', url: 'https://svg-scroll-draw.vercel.app' },
  image: `${URL}/opengraph-image`,
  mainEntityOfPage: { '@type': 'WebPage', '@id': URL },
};

const SCENE_HTML = `<section class="scene">
  <div class="layer" style="--speed: -0.2"><!-- far: sky, sun --></div>
  <div class="layer" style="--speed: -0.1"><!-- middle: hills --></div>
  <div class="layer" style="--speed: 0.1"><!-- near: grass --></div>
  <h2>Three layers, three speeds</h2>
</section>`;

const SCENE_CSS = `.scene {
  position: relative;
  height: 70vh;
  overflow: clip; /* not hidden: see below */
}

.layer {
  position: absolute;
  /* 40% of the scene past its top and its bottom, so a layer
     can travel without showing an edge. */
  inset: -40% 0;
}

.scene h2 {
  position: relative; /* above the layers */
}`;

const PARALLAX_CSS = `@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .layer {
      animation: parallax linear both;
      /* From the layer's top meeting the bottom of the window
         to its bottom leaving the top. */
      animation-timeline: view();
    }
  }
}

@keyframes parallax {
  to { transform: translateY(calc(var(--speed) * -100%)); }
}`;

const PERSPECTIVE_CSS = `/* The old trick: the page scrolls inside .viewport, not the
   window, and a layer pushed 1px back moves at half speed. */
.viewport {
  height: 100vh;
  overflow-x: hidden;
  overflow-y: auto;
  perspective: 1px;
}

.back {
  /* Pushed back, it looks smaller: scale(1 + 1px ÷ 1px) undoes that. */
  transform: translateZ(-1px) scale(2);
}`;

const PARALLAX_JS = `// For browsers without scroll timelines: the same layers and the
// same --speed, moved by one scroll listener, once per frame.
const reduce = matchMedia('(prefers-reduced-motion: reduce)');

function parallax(scene) {
  const layers = [...scene.querySelectorAll('.layer')].map((el) => ({
    el,
    speed: parseFloat(getComputedStyle(el).getPropertyValue('--speed')) || 0,
    top: 0,
    height: 0,
  }));
  let viewport = 0;
  let onScreen = false;
  let queued = false;

  // Layout is read here, at the start and on resize, never per frame.
  function measure() {
    viewport = innerHeight;
    const sceneTop = scene.getBoundingClientRect().top + scrollY;
    for (const l of layers) {
      l.top = sceneTop + l.el.offsetTop; // offsetTop ignores transforms
      l.height = l.el.offsetHeight;
    }
    frame();
  }

  function frame() {
    queued = false;
    for (const l of layers) {
      if (reduce.matches) {
        l.el.style.transform = '';
        continue;
      }
      // 0 as its top meets the bottom of the window, 1 as its bottom leaves the top.
      const p = (scrollY + viewport - l.top) / (viewport + l.height);
      const t = Math.min(1, Math.max(0, p));
      l.el.style.transform = \`translateY(\${-l.speed * l.height * t}px)\`;
    }
  }

  function request() {
    if (!onScreen || queued) return;
    queued = true;
    requestAnimationFrame(frame);
  }

  // Watch the scene, not the layers: a layer's box moves and is clipped.
  new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    request();
  }).observe(scene);

  addEventListener('scroll', request, { passive: true });
  addEventListener('resize', measure);
  reduce.addEventListener('change', frame);
  measure();
}

if (!CSS.supports('animation-timeline: view()')) {
  document.querySelectorAll('.scene').forEach(parallax);
}`;

const LIB_JS = `import { scrollParallax } from 'svg-scroll-draw';

// In place of the CSS animation and the script above: one call per
// layer, with the same --speed. It writes the transform itself.
for (const layer of document.querySelectorAll('.scene .layer')) {
  const speed = parseFloat(getComputedStyle(layer).getPropertyValue('--speed'));
  scrollParallax(layer, { speed });
}`;

export default function Page() {
  return (
    <BlogArticle
      slug="parallax-scrolling-css"
      jsonLd={articleJsonLd}
      tags={['Parallax', 'Scroll-driven animations', 'prefers-reduced-motion']}
      title={<>Parallax scrolling with CSS and JavaScript</>}
      lede={
        <>
          Parallax is layers moving at different speeds as the page scrolls: the far ones lag behind, the near ones
          run ahead, and a flat page gains depth. Here is a scene that does it in pure CSS on a scroll timeline, a
          short script for browsers without one, the same in one library call, and what each does for readers who
          ask for less motion.
        </>
      }
      facts={[
        { k: 'Moves', v: 'transform only' },
        { k: 'CSS path', v: 'animation-timeline: view()' },
        { k: 'scrollParallax', v: `in the ${SELF.gzipKb} KB main entry` },
      ]}
      figure={
        <Figure n={1} caption="what the CSS below does to each layer while it crosses the window: it ends --speed × 100% of its own height from where the page put it. Up runs ahead of the page and reads as near, down lags behind and reads as far. Added to the page’s own movement, that is the rate each one moves on screen against the scroll, in this 70vh scene.">
          <DepthLinesFigure />
        </Figure>
      }
      further={[
        { href: '/blog/css-scroll-driven-animations', label: 'CSS scroll-driven animations explained', blurb: 'view(), scroll() and animation-range, behind the pure-CSS version here.' },
        { href: '/blog/reduced-motion-scroll-animations', label: 'Reduced motion for scroll animations, effect by effect', blurb: 'What each kind of scroll effect should do when the reader asks for less motion.' },
      ]}
    >
      <Section id="what" k="the idea" title="What parallax scrolling is">
        <p>
          When you look out of a train window, the fence rushes past and the hills barely move. Parallax scrolling
          copies that: a scene is cut into layers, and as the page scrolls each layer moves at its own speed. A layer
          that moves slower than the page looks far away, one that moves faster looks close.
        </p>
        <p>
          Each layer here is an element stacked inside the scene, with its speed in a custom property,{' '}
          <code>--speed</code>. A positive speed moves it up, ahead of the page; a negative one moves it down,
          behind; 0 leaves it where the page puts it.
        </p>
        <Code file="index.html">{SCENE_HTML}</Code>
        <Code file="scene.css">{SCENE_CSS}</Code>
        <p>
          The layers are taller than the scene so that moving them never shows an edge. A layer travels{' '}
          <code>--speed</code> times its own height in all, and the 40% overhang on each side covers speeds up to
          ±0.2 at any window height. A faster layer needs more art past the edge it moves toward.
        </p>
        <Callout k="overflow: clip, not hidden">
          The scene clips its layers with <code>overflow: clip</code>. With <code>hidden</code> the scene becomes a
          scroll container, one that never scrolls, and <code>view()</code> in the next step tracks each layer
          against that box instead of the window, so nothing moves.
        </Callout>
      </Section>

      <Section id="css" k="pure CSS" title="Parallax in CSS with a scroll timeline">
        <p>
          A scroll-driven animation runs on the scroll instead of the clock. With{' '}
          <code>animation-timeline: view()</code>, each layer’s animation goes from 0% as the layer’s top meets the
          bottom of the window to 100% as its bottom leaves the top, so it takes the whole time the layer is on
          screen. The keyframe moves it <code>--speed</code> times its own height: up for a positive speed, down
          for a negative one.
        </p>
        <Code file="parallax.css">{PARALLAX_CSS}</Code>
        <p>
          The <code>linear</code> keeps each layer moving at a steady rate against the scroll; any other easing makes
          it speed up and slow down as it crosses, which reads as a wobble rather than depth. The{' '}
          <Link href="/easing-visualizer">easing visualizer</Link> plots the difference. The window a layer’s travel
          is spread over, from its top at the bottom of the screen to its bottom at the top, is the one you can
          scroll through in the <Link href="/scroll-trigger-visualizer">scroll trigger visualizer</Link>, set to{' '}
          <code>{PARALLAX_DEFAULTS.start}</code> and <code>{PARALLAX_DEFAULTS.end}</code>.
        </p>
        <p>
          What you see is the page’s movement plus the layer’s own. A layer <code>H</code> tall in a window{' '}
          <code>V</code> tall crosses it in <code>V + H</code> of scroll and moves <code>speed × H</code> more over
          it, so on screen it moves <code>1 + speed × H ÷ (V + H)</code> times the scroll. Here every layer is 1.26
          windows tall, which gives the rates in Fig. 1.
        </p>
        <p>
          The whole effect sits inside <code>@supports</code> and{' '}
          <code>@media (prefers-reduced-motion: no-preference)</code>. A browser without scroll timelines skips it, as
          does a reader who asked for less motion, and both see the scene as it is laid out: every layer at rest,
          nothing missing. More on <code>view()</code> and its ranges is in{' '}
          <Link href="/blog/css-scroll-driven-animations">CSS scroll-driven animations explained</Link>.
        </p>
      </Section>

      <Section id="old-ways" k="what to avoid" title="Why not background-attachment: fixed, or perspective">
        <p>
          Two older ways of doing this in CSS are still copied around. <code>background-attachment: fixed</code>{' '}
          keeps a background still while the page moves over it. That is one layer at one speed, zero, and Safari
          on iOS does not support it: WebKit bug 234779, open since 2022, describes it as unsupported there, with the
          background scrolling along with the page.
        </p>
        <p>
          The other pushes layers back in 3D. The page scrolls inside an element with a <code>perspective</code>,
          and a layer moved back with <code>translateZ</code> moves slower, as far things do:
        </p>
        <Code file="perspective.css">{PERSPECTIVE_CSS}</Code>
        <p>
          It works in all three engines, at half speed for the layer above, but only because the window no longer
          scrolls: <code>.viewport</code> does. <code>window.scrollY</code> stays 0, scroll listeners on the window
          never fire, and nothing else on the page that follows the window’s scroll moves. Every layer needs its
          scale worked out from its depth, and a layer that is not a direct child of <code>.viewport</code> needs{' '}
          <code>transform-style: preserve-3d</code> on each element in between. The scroll timeline above has none of
          that: the window scrolls as usual, and each layer states its speed.
        </p>
      </Section>

      <Section id="javascript" k="JavaScript" title="A small JavaScript version">
        <p>
          For browsers without scroll timelines, a script can do the same with the same markup and the same{' '}
          <code>--speed</code>. It runs only where <code>CSS.supports</code> says the CSS version will not, so the two
          never both move a layer.
        </p>
        <Code file="parallax.js">{PARALLAX_JS}</Code>
        <p>
          The scroll listener is <code>passive</code> and does no work itself: it asks for one animation frame, and
          further scroll events before that frame are ignored. The frame reads only <code>scrollY</code> and writes
          only <code>transform</code>. Where each layer sits and how tall it is are measured once at the start and
          again on a resize, never in the frame, because reading layout right after writing styles makes the browser
          lay the page out again, on every frame. Moving a layer with <code>transform</code> never changes the
          layout, so the browser can move it without repainting it.
        </p>
        <p>
          The <code>IntersectionObserver</code> stops the frames while the scene is off screen. It watches the scene,
          not the layers, on purpose: a layer’s box includes its own transform and is cut by the scene’s clip, so a
          layer that has moved far enough can be reported out of view while its scene is still on screen, and would
          stop where it was. svg-scroll-draw’s own parallax did exactly that until 2.23.4.
        </p>
        <Callout k="your part">
          Keep the layers few and their art simple, and give large ones <code>will-change: transform</code> so the
          browser keeps them on their own layer. More on what makes scroll effects smooth, measured, is in{' '}
          <Link href="/blog/scroll-animation-performance">scroll animation performance</Link>.
        </Callout>
      </Section>

      <Section id="library" k="svg-scroll-draw" title="scrollParallax, one call per layer">
        <p>
          svg-scroll-draw’s <code>scrollParallax</code> moves an element the same way: from{' '}
          <code>translateY(0%)</code> to <code>translateY(−speed × 100%)</code> of its own height, linearly, from its
          top meeting the bottom of the window to its bottom leaving the top. It is in the main entry,{' '}
          <code>svg-scroll-draw</code>, and the same speeds give the same scene:
        </p>
        <Code file="parallax.js">{LIB_JS}</Code>
        <p>
          It runs the frame loop in JavaScript in every browser, measures each layer when it starts and when the
          layout around it changes, never while you scroll, and runs frames only while the scroll is inside the
          layer’s window. The speed defaults to {PARALLAX_DEFAULTS.speed}; <code>axis: &apos;x&apos;</code> moves a
          layer sideways instead, still following the vertical scroll. For sections that really scroll sideways,
          the <Link href="/horizontal-scroll-generator">horizontal scroll generator</Link> builds those.
        </p>
        <p>
          The <Link href="/parallax-scrolling-generator">parallax scrolling generator</Link> has a four-layer scene
          with a slider for each layer’s speed: scroll its preview to feel the depth, then copy the calls, a React
          component or a whole HTML page. For one set of options on many elements, there is{' '}
          <code>scrollParallaxGroup</code>, in{' '}
          <Link href="/blog/scroll-animation-groups">animate multiple elements on scroll</Link>.
        </p>
      </Section>

      <Section id="reduced-motion" k="prefers-reduced-motion" title="Parallax and reduced motion">
        <p>
          Large movement that the reader did not ask for can make some people dizzy or sick, and parallax, where
          parts of the page slide against each other, is the kind of motion the reduced-motion setting exists for.
          All three versions here honour it, in slightly different ways:
        </p>
        <ul>
          <li>
            <strong>The CSS</strong> only animates inside{' '}
            <code>prefers-reduced-motion: no-preference</code>, so under reduced motion every layer stays where the
            page lays it out, and it follows the setting live.
          </li>
          <li>
            <strong>The script</strong> clears each layer’s transform when the setting is on, and listens for it
            changing, so the scene goes back to rest as soon as the reader turns it on.
          </li>
          <li>
            <strong>scrollParallax</strong> sets each layer at its end position,{' '}
            <code>translateY(−speed × 100%)</code>, and leaves it there; if the setting is turned on while the page is
            open, every layer goes there at once. Make sure the scene still reads that way: the generator’s End
            position button shows it.
          </li>
        </ul>
        <p>
          Either way nothing moves against the scroll. Keeping the differences between speeds small, 0.1 to 0.4,
          helps everyone else. More on handling the setting for each kind of effect is in{' '}
          <Link href="/blog/reduced-motion-scroll-animations">reduced motion for scroll animations</Link>.
        </p>
      </Section>

      <Closing
        title="Set the speeds, copy the code"
        lede="Give each layer of a scene its own speed, scroll the preview to see the depth, and copy the JavaScript, a React component or an HTML page."
        command="npm i svg-scroll-draw"
        links={[
          { href: '/parallax-scrolling-generator', label: 'Parallax scrolling generator →' },
          { href: '/scroll-trigger-visualizer', label: 'Scroll trigger visualizer' },
        ]}
      />
    </BlogArticle>
  );
}
