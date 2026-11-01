#!/usr/bin/env node
/**
 * Fails when JSX text would lose the space in front of it.
 *
 * Why: Next's SWC drops the leading space of a JSX text node that spans more
 * than one line AND contains an HTML entity. So
 *
 *   <code>view-timeline</code> on the container, so its box
 *   defines the range — which is exactly the JS engine&apos;s{' '}
 *
 * renders "view-timelineon the container". Single-line text keeps its space,
 * and so does the same text written with a real ’ instead of &apos; — which is
 * the fix: use typographic characters (’ “ ”) in prose, which
 * react/no-unescaped-entities accepts. Twenty-two sentences across the blog,
 * the vs-* pages, the docs and /verify had run two words together before this
 * check existed.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const here = dirname(fileURLToPath(import.meta.url));
const app = resolve(here, '..');
const roots = [resolve(app, 'src'), resolve(app, 'registry')];

const files = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = resolve(dir, name);
    if (statSync(p).isDirectory()) {
      if (name !== 'node_modules' && name !== '.next') walk(p);
    } else if (name.endsWith('.tsx')) files.push(p);
  }
};
roots.forEach(walk);

const ENTITY = /&(#\d+|#x[0-9a-f]+|[a-z]+);/i;
const failures = [];

for (const file of files) {
  const src = readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const visit = (node) => {
    if (node.kind === ts.SyntaxKind.JsxText) {
      const raw = src.slice(node.pos, node.end);
      const first = raw.split('\n')[0];
      const follows = (node.parent.children ?? []).indexOf(node) > 0;
      // A space after a sibling on the same line, then more lines, then an entity.
      if (follows && raw.includes('\n') && /^[ \t]+\S/.test(first) && ENTITY.test(raw)) {
        const line = sf.getLineAndCharacterOfPosition(node.pos).line + 1;
        failures.push(`${relative(app, file)}:${line}  “${first.trim().slice(0, 60)}”`);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
}

if (files.length === 0) {
  console.error('✗ check-jsx-text read 0 files — the check is not looking in the right place.');
  process.exit(1);
}

if (failures.length) {
  console.error(
    `✗ ${failures.length} JSX text node(s) will render without the space in front of them.\n` +
      '  Write ’ “ ” instead of &apos; &ldquo; &rdquo; in these lines, or end the line before with {\' \'}:\n' +
      failures.map((f) => `  ${f}`).join('\n'),
  );
  process.exit(1);
}

console.log(`✓ JSX text keeps its spaces (${files.length} files)`);
