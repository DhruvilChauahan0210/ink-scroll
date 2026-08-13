# Security policy

## Supported versions

| Version | Supported |
|---|---|
| 2.x | ✅ |
| 1.x | ❌ — please upgrade; 2.x is API-compatible for `scrollDraw` |

## Reporting a vulnerability

**Please do not open a public issue for security problems.**

Report privately through GitHub's
[private vulnerability reporting](https://github.com/DhruvilChauahan0210/ink-scroll/security/advisories/new).
If that is unavailable to you, open an issue titled "Security contact request"
with no details and you will be given a private channel.

Please include:

- The version of `svg-scroll-draw` affected
- A minimal reproduction — a CodeSandbox, StackBlitz, or a short HTML file
- What an attacker gains, and what access they need to get it

You can expect an acknowledgement within 5 working days.

## Threat model

`svg-scroll-draw` is a client-side animation library. It has **no runtime
dependencies**, makes no network requests, reads no cookies or storage, and runs
no `eval`. That rules out most of the usual categories.

The realistic surface is small, and worth being explicit about:

- **Selector and option strings** are passed to `document.querySelector` and
  written into inline styles and a generated `<style>` element. If your
  application feeds *untrusted user input* into `scrollDraw` options — a
  `strokeColor`, a `morphTo` path, a selector — treat that as you would any other
  string you inject into CSS. The library does not sanitise these, because it
  assumes they are authored values, not user data.
- **`scrollText`** rewrites the `innerHTML` of the element it targets in order to
  split it into per-character spans. It re-serialises the element's existing text
  content; it does not accept HTML as an option. `destroy()` restores the original
  markup.
- **`devtools`** injects a debug overlay and is intended for development only. It
  no-ops when `process.env.NODE_ENV === 'production'` is visible to your bundler.

If you find something outside this model, it is worth reporting.

## Supply chain

Releases are published from GitHub Actions with
[npm provenance](https://docs.npmjs.com/generating-provenance-statements) enabled,
so each published version is cryptographically linked to the commit and workflow
run that produced it. You can verify a release with:

```bash
npm audit signatures
```

The package has zero runtime dependencies, so installing it does not pull in a
transitive tree.
