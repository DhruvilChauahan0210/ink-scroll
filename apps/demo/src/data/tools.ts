/**
 * Every interactive tool on the site, in the groups the /tools hub shows.
 * The hub, the nav's Tools group and the sitemap all read this list, so a new
 * tool is added here once.
 */

export type Tool = { slug: string; name: string; blurb: string };
export type ToolGroup = { key: string; title: string; note: string; tools: Tool[] };

export const TOOL_GROUPS: ToolGroup[] = [
  {
    key: 'generate',
    title: 'Generators',
    note: 'Set it up, watch it run, copy the code.',
    tools: [
      { slug: 'text-animation-generator', name: 'Text animation generator', blurb: 'Split a line by word, letter or line, choose how each piece arrives, and copy the JavaScript or React.' },
      { slug: 'text-fill-scroll-generator', name: 'Text fill on scroll generator', blurb: 'Make text fill with colour, or light up word by word, as it scrolls: pure CSS, scrollProgress or scrollText, scrolled live, with the code.' },
      { slug: 'counter-animation-generator', name: 'Counter animation generator', blurb: 'Set from, to, decimals, a prefix or suffix and the easing, watch the number count, and copy a scrollCounter call or a React component.' },
      { slug: 'scroll-reveal-generator', name: 'Scroll reveal generator', blurb: 'Pick a preset, stagger, easing and trigger, watch cards reveal in a box that scrolls, and copy one scrollReveal call or a React component.' },
      { slug: 'parallax-scrolling-generator', name: 'Parallax scrolling generator', blurb: 'Give each layer of a scene its own speed, scroll the little window to see the depth, and copy the scrollParallax code.' },
      { slug: 'scroll-progress-bar-generator', name: 'Scroll progress bar generator', blurb: 'A reading progress bar on any edge or as a ring, for the page or one article: pure CSS on a scroll timeline, or scrollProgress.' },
      { slug: 'css-scroll-driven-animation-generator', name: 'CSS scroll-driven animation generator', blurb: 'Seven effects on animation-timeline and animation-range, run in a box you scroll; copy the CSS with a fallback, or the same in JavaScript.' },
      { slug: 'css-keyframes-animation-generator', name: 'CSS keyframes animation generator', blurb: 'Pick an entrance, attention effect or exit, set duration, delay, repeats and easing, and copy the @keyframes or a version that runs on scroll.' },
      { slug: 'css-scroll-snap-generator', name: 'CSS scroll snap generator', blurb: 'Build a snapping carousel, full-height sections or a two-way grid, swipe the live preview, and copy the CSS, HTML and button JS.' },
      { slug: 'horizontal-scroll-generator', name: 'Horizontal scroll generator', blurb: 'A pinned section that scrolls sideways: panels, width, gap and scroll length, run in a box you scroll; HTML, CSS, JS, React or CSS only.' },
      { slug: 'scroll-pin-generator', name: 'Scroll pin generator', blurb: 'Set a pin distance, top and steps, scroll a feature tour pinned by scrollPin, and copy HTML, CSS, JS, React or a CSS-only version.' },
      { slug: 'cubic-bezier-generator', name: 'Cubic-bezier generator', blurb: 'Drag two control points to make a CSS cubic-bezier(), race it against ease or easeOutBack, and copy the CSS or a JS easing function.' },
    ],
  },
  {
    key: 'svg',
    title: 'SVG',
    note: 'Get a drawing ready to animate.',
    tools: [
      { slug: 'svg-path-viewer', name: 'SVG path viewer', blurb: 'Paste an SVG: every path’s length and commands, what stops it drawing, and the draw code.' },
      { slug: 'svg-line-drawing-generator', name: 'SVG line drawing generator', blurb: 'Paste any SVG and get one self-contained file that draws itself line by line with CSS and no JavaScript, or the scroll version.' },
      { slug: 'svg-morph-generator', name: 'SVG morph generator', blurb: 'Pick or paste two shapes, match their points so nothing twists, watch scrollDraw morph them as you scroll, and copy the morphTo code.' },
      { slug: 'svg-shape-to-path-converter', name: 'SVG shape to path converter', blurb: 'Turn every rect, circle, ellipse, line, polyline and polygon into the exact path it equals, watch both draw, and copy the SVG.' },
      { slug: 'svg-to-jsx-converter', name: 'SVG to JSX converter', blurb: 'Paste an SVG and get a React component in TSX or JSX: React’s prop names, style objects, typed props and an optional ScrollDraw wrapper.' },
      { slug: 'svg-wave-generator', name: 'SVG wave generator', blurb: 'Layered wave dividers from a seed: curves, peaks or steps, copied as SVG, React or a CSS background, or as a line drawn on scroll.' },
      { slug: 'svg-blob-generator', name: 'SVG blob generator', blurb: 'Random organic blob shapes from points, randomness and a seed; morph to the next one, draw the outline on scroll, copy SVG or React.' },
    ],
  },
  {
    key: 'reference',
    title: 'See how it works',
    note: 'The ideas behind scroll animation, live.',
    tools: [
      { slug: 'scroll-trigger-visualizer', name: 'Scroll trigger visualizer', blurb: 'Pick an element edge and a viewport line for start and end, scroll a live preview, and watch progress run 0 to 1 with the arithmetic beside it.' },
      { slug: 'easing-visualizer', name: 'Easing visualizer', blurb: 'Plot the seven named easings or build a spring, bounce or elastic one, watch a line draw with it, compare two, and copy JS, React or CSS.' },
      { slug: 'aos-animation', name: 'AOS animation examples', blurb: 'All 27 data-aos effects running live, with the markup to copy.' },
    ],
  },
];

export const TOOLS: Tool[] = TOOL_GROUPS.flatMap((g) => g.tools);
