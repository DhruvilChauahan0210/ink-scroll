# Converting a blog post to the article frame

Two posts are already converted. Use them as the reference:

- `app/blog/scroll-pin-without-gsap/page.tsx`: prose, code, a callout and an API table.
- `app/blog/gsap-drawsvg-alternative/page.tsx`: before/after code, a matrix, measured bars, steps and a closing CTA.

Everything you need is in `components/blog/BlogArticle.tsx` (it imports `components/blog.css` itself).
Don't edit `BlogArticle.tsx`, `blog.css` or anything in `components/site/*`. If your post needs a new
piece, build it in your own file next to the post and style it in your own stylesheet, scoped under
`.site .ba`.

## 1. Remove

- `import { MobileMenu } …`, `import { RelatedResources } …`, `import { CopyButton } …`, and usually `import Link …`
- The whole `<nav>…</nav>` bar, the `{/* Hero */}` header, `<RelatedResources post=… />` and the `<footer>`.
  SiteShell supplies the nav and the signed footer, and the frame supplies the related links.
- The outer `<div className="bg-light-linen text-pitch-black min-h-screen">` and `<article>` wrappers.
- The post's local `CodeBlock` / `Code` / `Callout` / `SectionLabel` / `Check` / `Cross` helpers.
- The `<script type="application/ld+json">`. Pass the object as `jsonLd` instead; the frame serialises it safely.
- Every Tailwind class on prose (`text-graphite-border leading-relaxed mb-4`, `font-mono text-sm bg-marketplace-gray px-1 rounded`…).
  Plain `<p>`, `<code>`, `<strong>`, `<ul>`, `<ol>` and `<a>` are styled by the frame. Only class-less
  elements are styled, so a leftover class switches the styling off.

Keep `metadata`, the JSON-LD object, every sentence, every code sample and every link.

## 2. Wrap

```tsx
import { BlogArticle, Section, Code, Callout, Defs, Table, Figure } from '@/components/blog/BlogArticle';

export default function Page() {
  return (
    <BlogArticle
      slug="your-slug"                        // must match data/blog-posts.ts: it supplies the tag, date, read time and the "05 /" sheet number
      jsonLd={articleJsonLd}
      title={<>Pin sections on scroll without GSAP.</>}
      lede={<>The old hero paragraph. Inline <code>code</code> is fine.</>}
      tags={['scrollPin', 'no GSAP']}          // optional; the post's own tag always comes first
      facts={[{ k: 'scrollPin alone', v: `${SELF_ENTRIES.pin.toFixed(1)} KB` }]}   // optional; values come from data/*
      figure={<Figure n={1} caption="…"><YourDrawing /></Figure>}                  // optional opening drawing
      further={[{ href: '/vs-gsap', label: 'Full GSAP comparison', blurb: '…' }]}  // the old "Continue reading" links
    >
      <Section id="install" k="install" title="Install">
        <Code file="terminal">{`npm install svg-scroll-draw`}</Code>
      </Section>
      …
    </BlogArticle>
  );
}
```

- Each old `<h2>` becomes a `<Section id title k>`. The frame numbers the sections (01, 02…) and builds the
  "In this post" contents from them, so **sections must be direct children of `<BlogArticle>`**. Don't wrap
  them in a fragment or a div.
- `title` can be JSX. If it isn't a plain string, also pass `toc="Short label"`.
- `k` is the small mono label in the title strip beside the number (e.g. `install`, `onProgress`). It keeps its case.
- Old `<h3>` → `<h3 className="ba-h3">`.
- Anything that isn't a `Section` (a `<Closing>`, say) renders in order between the sections.
- The footer ("Keep reading": your `further` links, then `RELATED_BY_POST[slug]` from `data/related-links.ts`,
  then the next three posts) is automatic.

## 3. The pieces

| Old markup | Use |
|---|---|
| `<CodeBlock file="x">{`…`}</CodeBlock>` | `<Code file="x">{`…`}</Code>`. Line numbers and the copy button are built in; `file` defaults to `snippet` |
| GSAP / before and after code side by side | `<Compare before={{ label, file, code }} after={{ label, file, code }} />` |
| `<Callout>` / a pink or yellow note box | `<Callout k="note">…</Callout>`, with a `<Defs items={[['onEnter', 'fires when…'], …]} />` inside for term lists |
| `<table>` with option / type / description | `<Table head={['Option','Type','Description']} rows={[[name, <code>type</code>, desc], …]} />`. Column 1 is mono and accented; pass `first="plain"` when it holds labels instead of API names |
| ✓ / ✗ cells in a matrix | `<span className="ba-cell"><Mark ok={true} /><span>text</span></span>`. `ok={null}` draws a dash |
| two "pros / cons" cards | `<Cols><Checks title="svg-scroll-draw" items={[{ ok: true, text }]} /><Checks muted title="GSAP" items={…} /></Cols>` |
| a grid of "when X makes sense" cards | `<Notes items={[{ t: 'Title', d: 'Line' }, …]} />` |
| small "MIT · ~10 KB · zero deps" chips | `<Spec items={[{ k: 'svg-scroll-draw', v: '…' }]} />` |
| "1. Install / 2. Replace / 3. …" | `<Steps><Step n={1} title="Install">…</Step>…</Steps>`: a numbered rail the library inks as you scroll |
| bundle-size bars | `<Bars rows={[{ label, value, self?: true }]} />` (import from `@/components/blog/Bars`), wrapped in `<Figure n caption>` |
| a live demo | `<Plate n={2} caption="live — scroll to draw">…</Plate>` (re-exported from BlogArticle) |
| the pink "Ready to switch?" CTA band | `<Closing title="…" lede="…" links={[{ href: '/playground', label: 'Try the Playground →' }]} />`. The npm command and copy button are built in |

## 4. Numbers

Never type a size, ratio or count. Take it from `@/data/competitors` (`SELF.gzipKb`, `SELF_ENTRIES.pin`,
`COMPETITORS.gsapStack.gzipKb`, `ratioVsSelf('gsapStack')`, `provenance([...])`) or `@/data/facts`, the way
the DrawSVG pilot does (`const APPROX = \`~${Math.round(SELF.gzipKb)} KB\``). If a count can't be derived
(e.g. "23 examples", since `EXAMPLES` lives in a client module), drop the number from the link text and keep the link.
Fix any claim that contradicts the data, e.g. "GSAP plugin (paid)": GSAP has been free since 2025.
Then run `npm run check:claims` from the repo root.

## 5. Opening drawing (optional, but it's what makes a post feel finished)

If you add one, it has to show something real: the mechanism the post explains (`PinFigure`: a viewport
mid-pin over the scroll axis) or a measured comparison (`BomFigure`: each side's parts list, to scale).
Abstract decoration has been rejected. Draw with `<ScrollDraw autoplay once selector=".your-ink">` from
`svg-scroll-draw/react` in a `'use client'` file. Colour everything with `currentColor` or the tokens
(`--fg`, `--fg-2`, `--fg-3`, `--line-2`, `--accent`) so it holds in both themes. Keep text as HTML, or
make SVG labels at least 12 units, so they're still legible at 390px.

## 6. Check

- Screenshot at 1440×900 and 390×844 in dark and light (toggle `html.dark`), scroll the whole page, and check
  for no horizontal overflow and no console errors.
- `cd apps/demo && npx eslint <your files>`.
- Add the route to `components/site/routes.ts` only through the main session (it hides the old mascot).
  `/blog` is not listed there yet.
