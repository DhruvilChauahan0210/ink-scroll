// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { execSync } from 'node:child_process';
import { migrateSource, migratePackageJson, runMigrate } from '../cli/migrate';

const V = '2.14.0';

describe('migrate: JavaScript and TypeScript', () => {
  it('points ESM imports at the drop-ins and drops aos.css', () => {
    const src = [
      "import AOS from 'aos';",
      "import 'aos/dist/aos.css';",
      'import ScrollReveal from "scrollreveal";',
      "import Vivus from 'vivus';",
      'AOS.init({ once: true });',
    ].join('\n');
    const { code, changes } = migrateSource(src, 'main.ts', V);
    expect(code).toBe(
      [
        "import AOS from 'svg-scroll-draw/aos';",
        'import ScrollReveal from "svg-scroll-draw/scrollreveal";',
        "import Vivus from 'svg-scroll-draw/vivus';",
        'AOS.init({ once: true });',
      ].join('\n'),
    );
    expect(changes).toHaveLength(4);
  });

  it('handles namespace imports, re-exports, dynamic import and aos/dist/aos', () => {
    const src = "import * as AOS from 'aos/dist/aos';\nexport { default } from 'vivus';\nconst SR = await import('scrollreveal');";
    expect(migrateSource(src, 'x.mjs', V).code).toBe(
      "import * as AOS from 'svg-scroll-draw/aos';\nexport { default } from 'svg-scroll-draw/vivus';\nconst SR = await import('svg-scroll-draw/scrollreveal');",
    );
  });

  it('adds .default to CommonJS requires of ScrollReveal and vivus, not AOS', () => {
    const src = "const AOS = require('aos');\nrequire('aos/dist/aos.css');\nconst ScrollReveal = require('scrollreveal');\nconst Vivus = require( 'vivus' );";
    expect(migrateSource(src, 'x.cjs', V).code).toBe(
      "const AOS = require('svg-scroll-draw/aos');\nconst ScrollReveal = require('svg-scroll-draw/scrollreveal').default;\nconst Vivus = require( 'svg-scroll-draw/vivus' ).default;",
    );
  });

  it('leaves look-alikes alone', () => {
    const src = "import x from 'aos-utils';\nimport y from 'my-vivus';\nconst chaos = 'aos';\nimport z from './aos';";
    const { code, changes } = migrateSource(src, 'x.js', V);
    expect(code).toBe(src);
    expect(changes).toEqual([]);
  });

  it('works inside Vue, Svelte and Astro files', () => {
    const vue = "<template><div data-aos=\"fade\"/></template>\n<script setup>\nimport AOS from 'aos'\nimport 'aos/dist/aos.css'\n</script>";
    expect(migrateSource(vue, 'App.vue', V).code).toBe(
      "<template><div data-aos=\"fade\"/></template>\n<script setup>\nimport AOS from 'svg-scroll-draw/aos'\n</script>",
    );
  });
});

describe('migrate: HTML', () => {
  it('rewrites CDN script tags, drops integrity hashes and the aos.css link', () => {
    const html = [
      '<link href="https://unpkg.com/aos@2.3.1/dist/aos.css" rel="stylesheet">',
      '<script src="https://unpkg.com/aos@2.3.1/dist/aos.js"></script>',
      '<script src="https://unpkg.com/scrollreveal"></script>',
      '<script src="https://cdnjs.cloudflare.com/ajax/libs/vivus/0.4.6/vivus.min.js" integrity="sha512-abc" crossorigin="anonymous"></script>',
      '<script>AOS.init();</script>',
    ].join('\n');
    const { code, changes } = migrateSource(html, 'index.html', V);
    expect(code).toBe(
      [
        `<script src="https://unpkg.com/svg-scroll-draw@${V}/dist/cdn/aos.global.js"></script>`,
        `<script src="https://unpkg.com/svg-scroll-draw@${V}/dist/cdn/scrollreveal.global.js"></script>`,
        `<script src="https://unpkg.com/svg-scroll-draw@${V}/dist/cdn/vivus.global.js" crossorigin="anonymous"></script>`,
        '<script>AOS.init();</script>',
      ].join('\n'),
    );
    expect(changes.join('\n')).toContain('old integrity hash removed');
  });

  it('recognises jsDelivr, cdnjs scrollReveal.js and node_modules paths', () => {
    const html = [
      '<script src="https://cdn.jsdelivr.net/npm/aos@2.3.4/dist/aos.js"></script>',
      "<script src='https://cdnjs.cloudflare.com/ajax/libs/scrollReveal.js/4.0.9/scrollreveal.min.js'></script>",
      '<script src="/node_modules/vivus/dist/vivus.min.js"></script>',
    ].join('\n');
    const out = migrateSource(html, 'page.htm', V).code;
    expect(out).toContain('cdn/aos.global.js');
    expect(out).toContain("'https://unpkg.com/svg-scroll-draw@2.14.0/dist/cdn/scrollreveal.global.js'");
    expect(out).toContain('cdn/vivus.global.js');
  });

  it('leaves other scripts and stylesheets alone', () => {
    const html = '<link rel="stylesheet" href="/styles/aos-theme.css">\n<script src="https://unpkg.com/react"></script>';
    expect(migrateSource(html, 'index.html', V).code).toBe(html);
  });
});

describe('migrate: CSS', () => {
  it('removes @import of aos.css in CSS, SCSS and SFC styles', () => {
    expect(migrateSource("@import 'aos/dist/aos.css';\nbody { margin: 0 }", 'main.scss', V).code).toBe('body { margin: 0 }');
    expect(migrateSource('@import url("~aos/dist/aos.css");\n.a{}', 'a.css', V).code).toBe('.a{}');
  });
});

describe('migrate: package.json', () => {
  it('swaps the dependencies and keeps the indentation', () => {
    const text = '{\n    "name": "site",\n    "dependencies": {\n        "aos": "^2.3.4",\n        "react": "^18.3.1",\n        "vivus": "^0.4.6"\n    },\n    "devDependencies": {\n        "@types/aos": "^3.0.7"\n    }\n}\n';
    const { code, changes } = migratePackageJson(text, V);
    const pkg = JSON.parse(code);
    expect(pkg.dependencies).toEqual({ react: '^18.3.1', 'svg-scroll-draw': `^${V}` });
    expect(pkg.devDependencies).toEqual({});
    expect(code.startsWith('{\n    "name"')).toBe(true);
    expect(code.endsWith('}\n')).toBe(true);
    expect(changes).toHaveLength(4);
  });

  it('adds to devDependencies when that is where the old library lived', () => {
    const { code } = migratePackageJson('{"devDependencies":{"scrollreveal":"4.0.9"}}', V);
    expect(JSON.parse(code).devDependencies).toEqual({ 'svg-scroll-draw': `^${V}` });
  });

  it('does not add svg-scroll-draw twice, and ignores unrelated packages', () => {
    const both = migratePackageJson('{"dependencies":{"aos":"2","svg-scroll-draw":"^2.0.0"}}', V);
    expect(JSON.parse(both.code).dependencies).toEqual({ 'svg-scroll-draw': '^2.0.0' });
    const none = migratePackageJson('{"dependencies":{"react":"18"}}', V);
    expect(none.changes).toEqual([]);
  });
});

describe('migrate: the command', () => {
  let dir: string;
  const lines: string[] = [];
  const log = (s: string) => { lines.push(s); };

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ssd-migrate-'));
    lines.length = 0;
    fs.writeFileSync(path.join(dir, 'package.json'), '{\n  "dependencies": {\n    "aos": "^2.3.4"\n  }\n}\n');
    fs.mkdirSync(path.join(dir, 'src'));
    fs.writeFileSync(path.join(dir, 'src', 'main.js'), "import AOS from 'aos';\nimport 'aos/dist/aos.css';\nAOS.init();\n");
    fs.mkdirSync(path.join(dir, 'node_modules', 'aos'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'node_modules', 'aos', 'index.js'), "module.exports = require('aos');");
  });

  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

  it('--dry-run reports and writes nothing', () => {
    expect(runMigrate([dir, '--dry-run'], V, log)).toBe(0);
    expect(fs.readFileSync(path.join(dir, 'src', 'main.js'), 'utf8')).toContain("from 'aos'");
    expect(lines.join('\n')).toContain('2 files would change');
  });

  it('writes the migration, skipping node_modules', () => {
    expect(runMigrate([dir], V, log)).toBe(0);
    expect(fs.readFileSync(path.join(dir, 'src', 'main.js'), 'utf8')).toBe("import AOS from 'svg-scroll-draw/aos';\nAOS.init();\n");
    expect(JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')).dependencies).toEqual({ 'svg-scroll-draw': `^${V}` });
    expect(fs.readFileSync(path.join(dir, 'node_modules', 'aos', 'index.js'), 'utf8')).toContain("require('aos')");
    expect(lines.join('\n')).toContain('npm install');
  });

  it('refuses to write over uncommitted git changes without --force', () => {
    execSync('git init -q && git add -A && git -c user.email=t@t -c user.name=t commit -qm init', { cwd: dir });
    fs.writeFileSync(path.join(dir, 'src', 'other.js'), '// dirty');
    expect(runMigrate([dir], V, log)).toBe(1);
    expect(fs.readFileSync(path.join(dir, 'src', 'main.js'), 'utf8')).toContain("from 'aos'");
    expect(runMigrate([dir, '--force'], V, log)).toBe(0);
    expect(fs.readFileSync(path.join(dir, 'src', 'main.js'), 'utf8')).toContain('svg-scroll-draw/aos');
  });

  it('says so when there is nothing to migrate', () => {
    fs.writeFileSync(path.join(dir, 'package.json'), '{"dependencies":{"react":"18"}}');
    fs.writeFileSync(path.join(dir, 'src', 'main.js'), 'console.log(1)');
    expect(runMigrate([dir], V, log)).toBe(0);
    expect(lines.join('\n')).toContain('Nothing to do');
  });

  it('rejects a path that is not a directory', () => {
    expect(runMigrate([path.join(dir, 'nope')], V, log)).toBe(1);
  });
});
