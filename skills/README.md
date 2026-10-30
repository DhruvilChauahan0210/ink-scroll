# Agent skills for svg-scroll-draw

Instructions that teach AI coding agents to use
[svg-scroll-draw](https://www.npmjs.com/package/svg-scroll-draw) correctly: which
entry to import for which effect, the real options (no invented ones), framework
recipes, cleanup, SSR, reduced motion, and how to port GSAP ScrollTrigger snippets.

```
skills/
└── svg-scroll-draw/
    ├── SKILL.md                    # entry point: when to use it + the essentials
    └── references/
        ├── api.md                  # every entry, signature, option and default
        ├── recipes.md              # React, Next.js, Vue/Nuxt, Svelte, Solid, Angular, Astro, vanilla, CDN
        └── migrate-from-gsap.md    # ScrollTrigger → svg-scroll-draw, and when not to migrate
```

## Install

### Claude Code

Copy the `svg-scroll-draw` folder into a skills directory:

```bash
# For one project (commit it so your team gets it too)
mkdir -p .claude/skills
cp -r path/to/ink-scroll/skills/svg-scroll-draw .claude/skills/

# For every project on your machine
mkdir -p ~/.claude/skills
cp -r path/to/ink-scroll/skills/svg-scroll-draw ~/.claude/skills/
```

Or without cloning the repo:

```bash
mkdir -p .claude/skills && cd .claude/skills
npx degit DhruvilChauahan0210/ink-scroll/skills/svg-scroll-draw svg-scroll-draw
```

Claude Code loads the skill when a task matches its `description` (scroll
animation, SVG path drawing, reveal, parallax, pin, snap, counters, text
split, video scrub, replacing ScrollTrigger/AOS). You can also ask for it by name.

### Other agents (Cursor, Copilot, Codex, Windsurf, Cline, …)

Point the agent at `SKILL.md`: add it to your rules/instructions file, or
reference it in context, e.g.

```
@https://github.com/DhruvilChauahan0210/ink-scroll/blob/main/skills/svg-scroll-draw/SKILL.md
```

`SKILL.md` links to the files in `references/` for detail; include those too
if your agent does not follow links.

### llms.txt

A plain-text summary of the library for LLMs lives at
<https://svg-scroll-draw.vercel.app/llms.txt>.

## Keeping it accurate

Every import path in these files is in `packages/svg-scroll-draw/package.json`
`exports`, and every option is in the TypeScript types under
`packages/svg-scroll-draw/src/`. When an API changes, update
`references/api.md` in the same PR.
