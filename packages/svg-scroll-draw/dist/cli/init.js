#!/usr/bin/env node
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/cli/init.ts
var readline = __toESM(require("readline"));
var fs = __toESM(require("fs"));
var path = __toESM(require("path"));
var RESET = "\x1B[0m";
var BOLD = "\x1B[1m";
var DIM = "\x1B[2m";
var PINK = "\x1B[35m";
var GREEN = "\x1B[32m";
var CYAN = "\x1B[36m";
var rl = readline.createInterface({ input: process.stdin, output: process.stdout });
function ask(question, fallback) {
  return new Promise(
    (resolve) => rl.question(`  ${CYAN}?${RESET} ${question} ${DIM}(${fallback})${RESET} `, (ans) => {
      resolve(ans.trim() || fallback);
    })
  );
}
function pick(question, options, fallback) {
  const opts = options.map((o, i) => `${DIM}${i + 1})${RESET} ${o}`).join("  ");
  return new Promise(
    (resolve) => rl.question(`  ${CYAN}?${RESET} ${question}
     ${opts}
     ${DIM}(${fallback})${RESET} `, (ans) => {
      const idx = parseInt(ans) - 1;
      resolve(idx >= 0 && idx < options.length ? options[idx] : fallback);
    })
  );
}
var SAMPLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100">
    <path
      d="M10 50 C 40 10, 80 10, 100 50 S 160 90, 190 50"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      fill="none"
    />
  </svg>`;
function genReact(selector, easing, preset) {
  const presetProp = preset !== "none" ? `
      preset="${preset}"` : "";
  const easingProp = preset !== "none" ? "" : `
      easing="${easing}"`;
  return `'use client';
import { ScrollDraw } from 'svg-scroll-draw/react';

export function AnimatedSVG() {
  return (
    <ScrollDraw${presetProp}${easingProp}
      fade
      once
    >
      ${SAMPLE_SVG}
    </ScrollDraw>
  );
}
`;
}
function genVue(selector, easing, preset) {
  const opts = preset !== "none" ? `preset: '${preset}'` : `easing: '${easing}', fade: true, once: true`;
  return `<script setup>
import { useScrollDraw } from 'svg-scroll-draw/vue';

const { ref } = useScrollDraw({
  ${opts},
});
</script>

<template>
  <div :ref="ref">
    ${SAMPLE_SVG}
  </div>
</template>
`;
}
function genSvelte(selector, easing, preset) {
  const opts = preset !== "none" ? `{ preset: '${preset}' }` : `{ easing: '${easing}', fade: true, once: true }`;
  return `<script>
  import { scrollDraw } from 'svg-scroll-draw/svelte';
</script>

<div use:scrollDraw={${opts}}>
  ${SAMPLE_SVG}
</div>
`;
}
function genSolid(selector, easing, preset) {
  const opts = preset !== "none" ? `preset: '${preset}'` : `easing: '${easing}', fade: true, once: true`;
  return `import { createScrollDraw } from 'svg-scroll-draw/solid';

export function AnimatedSVG() {
  const { ref } = createScrollDraw({
    ${opts},
  });

  return (
    <div ref={ref}>
      ${SAMPLE_SVG}
    </div>
  );
}
`;
}
function genVanilla(selector, easing, preset) {
  const opts = preset !== "none" ? `preset: '${preset}'` : `easing: '${easing}',
  fade: true,
  once: true`;
  return `import { scrollDraw } from 'svg-scroll-draw';

scrollDraw('${selector}', {
  ${opts},
});
`;
}
var GENERATORS = {
  react: genReact,
  vue: genVue,
  svelte: genSvelte,
  solid: genSolid,
  vanilla: genVanilla
};
var FILE_NAMES = {
  react: "ScrollDraw.tsx",
  vue: "ScrollDraw.vue",
  svelte: "ScrollDraw.svelte",
  solid: "ScrollDraw.tsx",
  vanilla: "scroll-draw.js"
};
async function main() {
  console.log(`
 ${BOLD}${PINK}svg-scroll-draw${RESET} ${DIM}init${RESET}
`);
  console.log(` ${DIM}Generates a starter file for your framework.${RESET}
`);
  const framework = await pick(
    "Framework?",
    ["react", "vue", "svelte", "solid", "vanilla"],
    "react"
  );
  const preset = await pick(
    "Preset?",
    ["none", "sketch", "reveal", "typewriter", "cinematic", "spring"],
    "none"
  );
  let easing = "ease-out";
  if (preset === "none") {
    easing = await pick(
      "Easing?",
      ["ease-out", "ease-in", "ease-in-out", "linear", "spring", "bounce"],
      "ease-out"
    );
  }
  const selector = await ask("CSS selector for your SVG container?", "#my-svg");
  const outFile = FILE_NAMES[framework] ?? "scroll-draw.js";
  const outPath = path.join(process.cwd(), outFile);
  if (fs.existsSync(outPath)) {
    const overwrite = await ask(`${outFile} already exists. Overwrite?`, "y");
    if (overwrite.toLowerCase() !== "y") {
      console.log(`
 ${DIM}Aborted.${RESET}
`);
      rl.close();
      return;
    }
  }
  const code = GENERATORS[framework]?.(selector, easing, preset) ?? "";
  fs.writeFileSync(outPath, code, "utf8");
  console.log(`
 ${GREEN}\u2713${RESET} ${BOLD}${outFile}${RESET} created.
`);
  console.log(` ${DIM}Next steps:${RESET}`);
  console.log(`   npm i svg-scroll-draw`);
  if (framework === "vanilla") {
    console.log(`   Add your SVG to the DOM and call scrollDraw('${selector}', ...)`);
  } else {
    console.log(`   Import ${outFile.replace(/\.\w+$/, "")} and drop it into your page.`);
  }
  console.log(`
   ${DIM}Docs: https://svg-scroll-draw.vercel.app/docs${RESET}
`);
  rl.close();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
