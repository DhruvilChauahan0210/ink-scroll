/**
 * `npx svg-scroll-draw migrate` — move a project off AOS, ScrollReveal and vivus.
 *
 * Each of the three has a drop-in entry point (`svg-scroll-draw/aos`,
 * `/scrollreveal`, `/vivus`) that keeps its API, so migrating is mechanical:
 * point the imports and script tags at the drop-in, drop AOS's stylesheet (the
 * drop-in ships its own), and swap the dependency in package.json. This does
 * exactly that and nothing else — it rewrites module specifiers, CDN URLs and
 * dependency entries, never the code that uses them.
 *
 * The transforms are pure functions over file contents so they can be tested
 * without a file system; `runMigrate` is the thin CLI around them.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';

export type Lib = 'aos' | 'scrollreveal' | 'vivus';
export const LIBS: Lib[] = ['aos', 'scrollreveal', 'vivus'];
const LABEL: Record<Lib, string> = { aos: 'AOS', scrollreveal: 'ScrollReveal', vivus: 'vivus' };

export interface Result {
  code: string;
  changes: string[];
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ── JavaScript / TypeScript / SFC sources ─────────────────────────────────────

/**
 * Rewrite module specifiers. `import … from 'aos'`, `import('aos')` and
 * `require('aos')` all point at the drop-in. For ScrollReveal and vivus a
 * CommonJS `require` gets `.default`: their drop-ins export the function or
 * class as the default, where the originals' UMD builds returned it directly.
 */
function rewriteSpecifiers(src: string, changes: string[]): string {
  let out = src;
  for (const lib of LIBS) {
    // 'aos' and 'aos/dist/aos(.js)' are both the library itself.
    const spec = lib === 'aos' ? `aos(?:\\/dist\\/aos(?:\\.js)?)?` : esc(lib);
    const target = `svg-scroll-draw/${lib}`;

    const fromRe = new RegExp(`(\\bfrom\\s*)(['"])${spec}\\2`, 'g');
    const dynRe = new RegExp(`(\\bimport\\s*\\(\\s*)(['"])${spec}\\2(\\s*\\))`, 'g');
    const reqRe = new RegExp(`(\\brequire\\s*\\(\\s*)(['"])${spec}\\2(\\s*\\))`, 'g');

    let n = 0;
    out = out.replace(fromRe, (_m, pre, q) => { n++; return `${pre}${q}${target}${q}`; });
    out = out.replace(dynRe, (_m, pre, q, post) => { n++; return `${pre}${q}${target}${q}${post}`; });
    out = out.replace(reqRe, (_m, pre, q, post) => {
      n++;
      return lib === 'aos' ? `${pre}${q}${target}${q}${post}` : `${pre}${q}${target}${q}${post}.default`;
    });
    if (n) changes.push(`${LABEL[lib]}: ${n} import${n === 1 ? '' : 's'} → ${target}`);
  }
  return out;
}

/** Remove AOS's stylesheet import: `import 'aos/dist/aos.css'` and `require('aos/dist/aos.css')`. */
function dropAosCssImports(src: string, changes: string[]): string {
  let n = 0;
  const out = src
    .replace(/^[ \t]*import\s+(['"])aos\/dist\/aos(?:\.min)?\.css\1;?[ \t]*\r?\n?/gm, () => { n++; return ''; })
    .replace(/^[ \t]*require\s*\(\s*(['"])aos\/dist\/aos(?:\.min)?\.css\1\s*\);?[ \t]*\r?\n?/gm, () => { n++; return ''; });
  if (n) changes.push(`AOS: removed ${n} aos.css import${n === 1 ? '' : 's'} (the drop-in ships its styles)`);
  return out;
}

// ── HTML ─────────────────────────────────────────────────────────────────────

/** Where each library is commonly loaded from: unpkg, jsDelivr, cdnjs, or node_modules. */
const SCRIPT_URL: Record<Lib, RegExp> = {
  aos: /^(?:https?:)?\/\/(?:unpkg\.com\/aos(?:@[^/]+)?(?:\/dist\/aos(?:\.min)?\.js)?|cdn\.jsdelivr\.net\/npm\/aos(?:@[^/]+)?(?:\/dist\/aos(?:\.min)?\.js)?|cdnjs\.cloudflare\.com\/ajax\/libs\/aos\/[^/]+\/aos(?:\.min)?\.js)$|(?:^|\/)node_modules\/aos\/dist\/aos(?:\.min)?\.js$/,
  scrollreveal: /^(?:https?:)?\/\/(?:unpkg\.com\/scrollreveal(?:@[^/]+)?(?:\/dist\/scrollreveal(?:\.min)?\.js)?|cdn\.jsdelivr\.net\/npm\/scrollreveal(?:@[^/]+)?(?:\/dist\/scrollreveal(?:\.min)?\.js)?|cdnjs\.cloudflare\.com\/ajax\/libs\/scrollReveal\.js\/[^/]+\/scrollreveal(?:\.min)?\.js)$|(?:^|\/)node_modules\/scrollreveal\/dist\/scrollreveal(?:\.min)?\.js$/i,
  vivus: /^(?:https?:)?\/\/(?:unpkg\.com\/vivus(?:@[^/]+)?(?:\/dist\/vivus(?:\.min)?\.js)?|cdn\.jsdelivr\.net\/npm\/vivus(?:@[^/]+)?(?:\/dist\/vivus(?:\.min)?\.js)?|cdnjs\.cloudflare\.com\/ajax\/libs\/vivus\/[^/]+\/vivus(?:\.min)?\.js)$|(?:^|\/)node_modules\/vivus\/dist\/vivus(?:\.min)?\.js$/,
};

const AOS_CSS_URL =
  /^(?:https?:)?\/\/(?:unpkg\.com\/aos(?:@[^/]+)?\/dist\/aos\.css|cdn\.jsdelivr\.net\/npm\/aos(?:@[^/]+)?\/dist\/aos\.css|cdnjs\.cloudflare\.com\/ajax\/libs\/aos\/[^/]+\/aos(?:\.min)?\.css)$|(?:^|\/)node_modules\/aos\/dist\/aos\.css$/;

function rewriteScriptTags(src: string, version: string, changes: string[]): string {
  return src.replace(/<script\b([^>]*)>/gi, (tag, attrs: string) => {
    const m = /\bsrc\s*=\s*(["'])([^"']+)\1/i.exec(attrs);
    if (!m) return tag;
    const lib = LIBS.find((l) => SCRIPT_URL[l].test(m[2]));
    if (!lib) return tag;
    const url = `https://unpkg.com/svg-scroll-draw@${version}/dist/cdn/${lib}.global.js`;
    // A subresource-integrity hash is for the old file and would block the new one.
    const hadIntegrity = /\bintegrity\s*=/i.test(attrs);
    const next = attrs.replace(m[0], `src=${m[1]}${url}${m[1]}`).replace(/\s+integrity\s*=\s*(["'])[^"']*\1/gi, '');
    changes.push(`${LABEL[lib]}: <script> → ${url}${hadIntegrity ? ' (old integrity hash removed)' : ''}`);
    return `<script${next}>`;
  });
}

function dropAosCssLinks(src: string, changes: string[]): string {
  let n = 0;
  const out = src.replace(/^[ \t]*<link\b[^>]*>[ \t]*\r?\n?/gim, (line) => {
    const m = /\bhref\s*=\s*(["'])([^"']+)\1/i.exec(line);
    if (m && AOS_CSS_URL.test(m[2])) {
      n++;
      return '';
    }
    return line;
  });
  if (n) changes.push(`AOS: removed ${n} aos.css <link> (the drop-in ships its styles)`);
  return out;
}

// ── CSS ──────────────────────────────────────────────────────────────────────

function dropAosCssAtImports(src: string, changes: string[]): string {
  let n = 0;
  const out = src.replace(
    /^[ \t]*@import\s+(?:url\(\s*)?(['"]?)~?aos\/dist\/aos(?:\.min)?\.css\1\s*\)?\s*;?[ \t]*\r?\n?/gm,
    () => { n++; return ''; },
  );
  if (n) changes.push(`AOS: removed ${n} @import of aos.css (the drop-in ships its styles)`);
  return out;
}

// ── Entry points ─────────────────────────────────────────────────────────────

const SCRIPT_EXT = /\.(?:[cm]?[jt]sx?|vue|svelte|astro)$/i;
const HTML_EXT = /\.(?:html?|vue|svelte|astro|php|ejs|hbs|njk|liquid|erb)$/i;
const CSS_EXT = /\.(?:css|scss|sass|less)$/i;

/** Migrate one file's contents. `version` is the svg-scroll-draw version for CDN URLs. */
export function migrateSource(src: string, filename: string, version: string): Result {
  const changes: string[] = [];
  let code = src;
  if (SCRIPT_EXT.test(filename)) {
    code = dropAosCssImports(code, changes);
    code = rewriteSpecifiers(code, changes);
  }
  if (HTML_EXT.test(filename)) {
    code = rewriteScriptTags(code, version, changes);
    code = dropAosCssLinks(code, changes);
  }
  if (CSS_EXT.test(filename) || /\.(?:vue|svelte|astro)$/i.test(filename)) {
    code = dropAosCssAtImports(code, changes);
  }
  return { code, changes };
}

/**
 * Swap the dependencies: remove aos, scrollreveal, vivus and @types/aos, and add
 * svg-scroll-draw where the first of them was (dependencies or devDependencies).
 * Formatting is kept: two-space or tab indentation, trailing newline.
 */
export function migratePackageJson(text: string, version: string): Result {
  const changes: string[] = [];
  let pkg: Record<string, unknown>;
  try {
    pkg = JSON.parse(text);
  } catch {
    return { code: text, changes };
  }
  const remove = [...LIBS, '@types/aos'];
  let home: 'dependencies' | 'devDependencies' | null = null;
  for (const field of ['dependencies', 'devDependencies'] as const) {
    const deps = pkg[field] as Record<string, string> | undefined;
    if (!deps) continue;
    for (const name of remove) {
      if (name in deps) {
        delete deps[name];
        changes.push(`package.json: removed ${name} from ${field}`);
        if (!home && name !== '@types/aos') home = field;
      }
    }
  }
  if (!home) return { code: text, changes };
  const already = ['dependencies', 'devDependencies'].some(
    (f) => (pkg[f] as Record<string, string> | undefined)?.['svg-scroll-draw'],
  );
  if (!already) {
    const deps = ((pkg[home] as Record<string, string>) ??= {});
    deps['svg-scroll-draw'] = `^${version}`;
    // Keep the block sorted, as npm writes it.
    pkg[home] = Object.fromEntries(Object.entries(deps).sort(([a], [b]) => a.localeCompare(b)));
    changes.push(`package.json: added svg-scroll-draw ^${version} to ${home}`);
  }
  const indent = /^\{\r?\n(\t| +)/.exec(text)?.[1] ?? '  ';
  return { code: JSON.stringify(pkg, null, indent) + (text.endsWith('\n') ? '\n' : ''), changes };
}

// ── CLI ──────────────────────────────────────────────────────────────────────

const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', 'out', '.next', '.nuxt', '.output', '.svelte-kit',
  '.vercel', '.netlify', '.turbo', '.cache', 'coverage', '.parcel-cache', 'vendor',
]);
const MAX_BYTES = 2 * 1024 * 1024;

function* walk(dir: string): Generator<string> {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name) && !entry.name.startsWith('.')) yield* walk(path.join(dir, entry.name));
    } else if (entry.isFile()) {
      yield path.join(dir, entry.name);
    }
  }
}

function installCommand(dir: string): string {
  if (fs.existsSync(path.join(dir, 'pnpm-lock.yaml'))) return 'pnpm install';
  if (fs.existsSync(path.join(dir, 'yarn.lock'))) return 'yarn install';
  if (fs.existsSync(path.join(dir, 'bun.lockb')) || fs.existsSync(path.join(dir, 'bun.lock'))) return 'bun install';
  return 'npm install';
}

function gitDirty(dir: string): boolean {
  try {
    return execSync('git status --porcelain', { cwd: dir, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() !== '';
  } catch {
    return false; // not a git repository, or git is not installed
  }
}

const HELP = `
  svg-scroll-draw migrate [dir] [--dry-run] [--force]

  Moves a project off AOS, ScrollReveal and vivus onto svg-scroll-draw's drop-ins:
    • imports / requires of 'aos', 'scrollreveal', 'vivus' → svg-scroll-draw/<lib>
    • CDN <script> tags → svg-scroll-draw's script-tag builds
    • AOS's aos.css imports, <link>s and @imports removed (the drop-in ships its styles)
    • package.json: the old packages swapped for svg-scroll-draw

  --dry-run   show what would change, write nothing
  --force     write even if the git working tree has uncommitted changes
`;

/** Run the command. Returns the process exit code. */
export function runMigrate(args: string[], version: string, log: (s: string) => void = console.log): number {
  if (args.includes('--help') || args.includes('-h')) {
    log(HELP);
    return 0;
  }
  const dryRun = args.includes('--dry-run');
  const force = args.includes('--force');
  const dir = path.resolve(args.find((a) => !a.startsWith('-')) ?? '.');
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
    log(`  ✗ Not a directory: ${dir}`);
    return 1;
  }

  const edits: Array<{ file: string; code: string; changes: string[] }> = [];
  for (const file of walk(dir)) {
    const base = path.basename(file);
    const isPkg = base === 'package.json';
    if (!isPkg && !SCRIPT_EXT.test(base) && !HTML_EXT.test(base) && !CSS_EXT.test(base)) continue;
    if (fs.statSync(file).size > MAX_BYTES) continue;
    const text = fs.readFileSync(file, 'utf8');
    if (!isPkg && !/aos|scrollreveal|vivus/i.test(text)) continue;
    const result = isPkg ? migratePackageJson(text, version) : migrateSource(text, base, version);
    if (result.changes.length && result.code !== text) edits.push({ file, code: result.code, changes: result.changes });
  }

  log(`\n  svg-scroll-draw migrate${dryRun ? ' (dry run)' : ''} — ${dir}\n`);
  if (!edits.length) {
    log('  No AOS, ScrollReveal or vivus usage found. Nothing to do.\n');
    return 0;
  }
  for (const { file, changes } of edits) {
    log(`  ${path.relative(dir, file) || path.basename(file)}`);
    for (const c of changes) log(`    • ${c}`);
  }

  if (dryRun) {
    log(`\n  ${edits.length} file${edits.length === 1 ? '' : 's'} would change. Run again without --dry-run to apply.\n`);
    return 0;
  }
  if (!force && gitDirty(dir)) {
    log('\n  ✗ The git working tree has uncommitted changes. Commit or stash them first so the');
    log('    migration is a clean diff you can review, or pass --force to write anyway.\n');
    return 1;
  }
  for (const { file, code } of edits) fs.writeFileSync(file, code);
  const touchedPkg = edits.some((e) => path.basename(e.file) === 'package.json');
  log(`\n  ✓ Updated ${edits.length} file${edits.length === 1 ? '' : 's'}.`);
  log(`  Next: ${touchedPkg ? `run \`${installCommand(dir)}\`, then ` : ''}review the diff (git diff) and try the page.\n`);
  return 0;
}
