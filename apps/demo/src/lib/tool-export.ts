/**
 * What every tool's code leaves with: a line saying where it came from, a
 * complete HTML file that runs when opened, and the same file (or a React
 * project) opened in StackBlitz.
 *
 * The source line is how the site learns which tools end up in real projects
 * without tracking anyone: a GitHub code search for `svg-scroll-draw.vercel.app/`
 * finds the files that kept it. It is a comment, so deleting it changes nothing.
 *
 * Client-safe: no Node APIs, no data files a browser bundle should not carry.
 */

export const SITE_HOST = 'svg-scroll-draw.vercel.app';

export type CodeLang = 'js' | 'ts' | 'jsx' | 'tsx' | 'css' | 'html' | 'svg' | 'vue';

/** `// Made with https://svg-scroll-draw.vercel.app/<slug>` in the comment syntax of `lang`. */
export function sourceLine(slug: string, lang: CodeLang): string {
  const text = `Made with https://${SITE_HOST}/${slug}`;
  if (lang === 'css') return `/* ${text} */`;
  if (lang === 'html' || lang === 'svg' || lang === 'vue') return `<!-- ${text} -->`;
  return `// ${text}`;
}

/**
 * `code` with the source line on top. A leading directive ('use client') or an
 * XML declaration has to stay first, so the line goes under it.
 */
export function withSource(code: string, slug: string, lang: CodeLang): string {
  const line = sourceLine(slug, lang);
  const first = code.match(/^(\s*(?:(['"])use (?:client|server)\2;?|<\?xml[^>]*\?>)[^\n]*\n)/);
  if (first) return first[1] + line + '\n' + code.slice(first[1].length);
  return `${line}\n${code}`;
}

/**
 * The ES module of one entry on jsDelivr, pinned to `version`: '' is the main
 * entry ('svg-scroll-draw'), 'reveal' is 'svg-scroll-draw/reveal', and so on.
 * The same URLs the recipe files use, which test-recipes serves from dist/.
 */
export function cdnModule(version: string, entry = ''): string {
  return `https://cdn.jsdelivr.net/npm/svg-scroll-draw@${version}/dist/${entry ? `${entry}/` : ''}index.mjs`;
}

export type HtmlFileParts = {
  /** The tool's slug, for the source line. */
  slug: string;
  /** The document title. */
  title: string;
  /** Page CSS, without a <style> tag. Leave out for none. */
  css?: string;
  /** Everything inside <body> before the script. */
  body: string;
  /**
   * A module script, without a <script> tag. Import the library from
   * cdnModule(); `import` lines are kept at the top as written.
   */
  script?: string;
};

/** One self-contained HTML file: open it from disk and it runs. */
export function htmlFile({ slug, title, css, body, script }: HtmlFileParts): string {
  const indent = (s: string, n: number) => s.trim().split('\n').map((l) => (l ? ' '.repeat(n) + l : l)).join('\n');
  return [
    '<!doctype html>',
    sourceLine(slug, 'html'),
    '<html lang="en">',
    '  <head>',
    '    <meta charset="utf-8" />',
    '    <meta name="viewport" content="width=device-width, initial-scale=1" />',
    `    <title>${escapeHtml(title)}</title>`,
    ...(css ? ['    <style>', indent(css, 6), '    </style>'] : []),
    '  </head>',
    '  <body>',
    indent(body, 4),
    ...(script ? ['    <script type="module">', indent(script, 6), '    </script>'] : []),
    '  </body>',
    '</html>',
    '',
  ].join('\n');
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Saves `text` as a file named `filename`, without leaving an object URL behind. */
export function downloadText(filename: string, text: string, type = 'text/html'): void {
  const url = URL.createObjectURL(new Blob([text], { type: `${type};charset=utf-8` }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoked on the next task: Safari cancels a download whose URL is revoked
  // in the same task as the click.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

type StackBlitzProject = {
  title: string;
  description: string;
  template: 'html' | 'node';
  files: Record<string, string>;
  /** The file StackBlitz opens first. */
  open: string;
};

/**
 * Opens a project in StackBlitz through its POST API: a form submitted to a new
 * tab, so nothing is sent until the visitor clicks, and only to StackBlitz.
 * https://developer.stackblitz.com/platform/api/post-api
 */
function postToStackBlitz({ title, description, template, files, open }: StackBlitzProject): void {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = `https://stackblitz.com/run?file=${encodeURIComponent(open)}`;
  form.target = '_blank';
  form.rel = 'noopener';
  const field = (name: string, value: string) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value;
    form.appendChild(input);
  };
  field('project[title]', title);
  field('project[description]', description);
  field('project[template]', template);
  for (const [path, contents] of Object.entries(files)) field(`project[files][${path}]`, contents);
  document.body.appendChild(form);
  form.submit();
  form.remove();
}

/** The HTML file as a static StackBlitz project. */
export function openHtmlInStackBlitz({ title, html }: { title: string; html: string }): void {
  postToStackBlitz({
    title,
    description: `Made with https://${SITE_HOST}`,
    template: 'html',
    files: { 'index.html': html },
    open: 'index.html',
  });
}

export type ReactProject = {
  slug: string;
  title: string;
  /** src/App.jsx: a module whose default export is the component to render. */
  app: string;
  /** src/styles.css, imported by main.jsx. */
  css?: string;
  /** svg-scroll-draw's version, for package.json. */
  version: string;
};

/** A Vite + React project around `app`, running in StackBlitz's WebContainer. */
export function openReactInStackBlitz({ slug, title, app, css = '', version }: ReactProject): void {
  const pkg = {
    name: slug,
    private: true,
    type: 'module',
    scripts: { dev: 'vite', build: 'vite build' },
    dependencies: { react: '^19.0.0', 'react-dom': '^19.0.0', 'svg-scroll-draw': `^${version}` },
    devDependencies: { vite: '^7.0.0', '@vitejs/plugin-react': '^5.0.0' },
  };
  postToStackBlitz({
    title,
    description: `Made with https://${SITE_HOST}/${slug}`,
    template: 'node',
    open: 'src/App.jsx',
    files: {
      'package.json': JSON.stringify(pkg, null, 2) + '\n',
      'vite.config.js': "import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\n\nexport default defineConfig({ plugins: [react()] });\n",
      'index.html': '<!doctype html>\n<html lang="en">\n  <head>\n    <meta charset="utf-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1" />\n' +
        `    <title>${escapeHtml(title)}</title>\n  </head>\n  <body>\n    <div id="root"></div>\n    <script type="module" src="/src/main.jsx"></script>\n  </body>\n</html>\n`,
      'src/main.jsx': "import { StrictMode } from 'react';\nimport { createRoot } from 'react-dom/client';\nimport './styles.css';\nimport App from './App.jsx';\n\ncreateRoot(document.getElementById('root')).render(\n  <StrictMode>\n    <App />\n  </StrictMode>,\n);\n",
      'src/App.jsx': withSource(app, slug, 'jsx'),
      'src/styles.css': css,
    },
  });
}
