## Product Requirement Document (PRD)## 1. Overview & Objectives
svg-scroll-draw is a lightweight, zero-dependency, open-source npm library designed to animate SVG paths based on the user's scroll position.
## Problem Statement
Implementing premium scroll-driven line drawing animations currently forces developers to choose between heavy animation frameworks (e.g., GSAP ScrollTrigger) or writing complex, boilerplate scroll-math utilizing window.scroll event listeners, requestAnimationFrame, and getBoundingClientRect manual calculations.
## Objectives

* Provide a high-performance solution under 3KB minified + gzipped.
* Achieve a zero-config developer experience where an SVG path is automatically calculated and animated out-of-the-box.
* Maintain 60 FPS / 120 FPS performance by using modern browser APIs (IntersectionObserver) and hardware-accelerated CSS properties.

------------------------------
## 2. Technical Core Architecture & Math## The SVG Dash-Offset Technique
The core mechanics rely on manipulating the SVG stroke properties. For every target path element:

   1. Compute Length: Determine total path length via SVGPathElement.getTotalLength().
   2. Hide Path: Set both stroke-dasharray and stroke-dashoffset equal to this total length.
   3. Animate Path: Dynamically decrease stroke-dashoffset to 0 as scroll progress moves from $0\%$ to $100\%$.

## Scroll Progress Interpolation Formula
To prevent layout shifts from breaking calculations, the library computes the scroll progress ratio ($\alpha$) relative to a specified viewport trigger zone:
$$\alpha = \frac{V_{\text{current}} - T_{\text{start}}}{T_{\text{end}} - T_{\text{start}}}$$ 
Where:

* $V_{\text{current}}$ is the absolute scroll position of the viewport.
* $T_{\text{start}}$ is the scroll milestone where the element's bounding box hits the entry trigger.
* $T_{\text{end}}$ is the scroll milestone where the element's bounding box hits the exit trigger.
* $\alpha$ is clamped strictly between 0.0 (invisible) and 1.0 (fully drawn).

------------------------------
## 3. Product Specifications & API Design## 3.1 Vanilla JavaScript API
The library exposes a primary initialization function, scrollDraw().

import { scrollDraw } from 'svg-scroll-draw';
// Minimal Configurationconst instance = scrollDraw('#my-svg-container');
// Destroy instance when navigating away (SPA cleanup)
instance.destroy();

## Detailed Configuration Object (ScrollDrawOptions)

interface ScrollDrawOptions {
  /** Target specific paths or default to all paths inside container */
  selector?: string;      
  /** Scale factor to speed up or slow down animation relative to scroll (default: 1.0) */
  speed?: number;         
  /** Gradually fade in opacity while drawing (default: false) */
  fade?: boolean;         
  /** Easing function mapping progress (0-1) to output progress (0-1) (default: 'linear') */
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | ((t: number) => number);
  /** Viewport entry/exit anchors. Format: 'element-anchor viewport-anchor' (default: 'top bottom') */
  trigger?: {
    start?: string; 
    end?: string;
  };
  /** Fire callback when path animation completes */
  onComplete?: () => void;
}

## 3.2 React Wrapper API (/react entrypoint)
To maximize developer adoption, a native React component wrapper must be bundled within the package via a separate subpath export.

import { ScrollDraw } from 'svg-scroll-draw/react';
export default function GeometricHero() {
  return (
    <ScrollDraw speed={1.2} fade={true} easing="ease-out">
      <svg width="500" height="500" viewBox="0 0 500 500">
        <path d="M10 80 C 40 10, 60 10, 95 80" stroke="black" fill="none" />
      </svg>
    </ScrollDraw>
  );
}

------------------------------
## 4. Functional Requirements & Core Engine Logic

[Window Scroll Event] ──> [IntersectionObserver checks visibility]
                                    │
                                    ├───> (If Out of Viewport) ──> Sleep / Idle
                                    │
                                    └───> (If In Viewport) ─────> [RequestAnimationFrame]
                                                                        │
                                                                        ▼
                                                              [Calculate Delta Scroll]
                                                                        │
                                                                        ▼
                                                              [Update strokeDashoffset]

## FR-1: Initialization Lifecycle

* Path Discovery: On calling scrollDraw(), the script must query all valid <path>, <polyline>, <line>, and <polygon> elements within the targeted container.
* Property Injection: Automatically parse and overwrite layout-specific styles on target elements. It must apply stroke-dasharray dynamically based on client runtime measurements.
* Layout Safeguards: If an SVG element lacks a stroke attribute or has a fill that obscures the line work, output a soft non-blocking console warning in development mode.

## FR-2: Performance Optimization Pipeline

* Visibility Culling: Use an IntersectionObserver to track the bounding rect of the target SVG wrapper.
* Scroll Throttling: Do not execute mathematics or updates on elements currently outside the active viewport window.
* Frame Optimization: Wrap scroll calculation loops inside a native requestAnimationFrame block to synchronize updates seamlessly with screen refresh rates (60Hz–120Hz+).

## FR-3: Dynamic Resize Handling

* Recalibration: Listen for window resize and orientation change events.
* Debouncing: Debounce recalculations by 150ms to prevent browser execution lockups.
* Redrawing: Recompute overall path lengths (.getTotalLength()) and viewport trigger thresholds seamlessly without resetting animation progress frames.

------------------------------
## 5. Non-Functional Requirements (NFRs)## NFR-1: Size Constraints

* Bundle Target: Must utilize tree-shaking architectures natively.
* Hard Limits: Maximum package footprint cannot exceed 3KB minified and gzipped. Zero third-party runtime dependencies are allowed.

## NFR-2: Target Compatibility

* Browsers: Must target Modern ECMAScript (ES6+). Compatibility required for Chrome 80+, Safari 14+, Edge 80+, Firefox 75+.
* Module Formats: The package build pipeline must output multiple compiler definitions:
* ESM (.mjs) for modern bundlers (Vite, Webpack 5).
   * CJS (.cjs) for legacy node frameworks and Server-Side Rendering (SSR) fallback execution safety.
   * UMD/IIFE bundle distributed via CDN links for rapid inclusion in vanilla standard HTML files.

## NFR-3: SSR/SSG Proofing

* The library must explicitly verify global availability of window objects (typeof window !== 'undefined') prior to code execution, ensuring Next.js (App/Pages Router), Remix, and Nuxt builds do not crash during build compile/hydrate cycles.

------------------------------
## 6. Implementation & Bundle Architecture## Directory Tree Plan

svg-scroll-draw/
├── src/
│   ├── core/
│   │   ├── engine.ts       # Core logic, math loops, intersection observer
│   │   └── types.ts        # Shared TypeScript interfaces
│   ├── react/
│   │   └── index.tsx       # React hooks wrapper implementation
│   └── index.ts            # Vanilla entry point
├── tsup.config.ts          # Zero-config bundler setup (Outputs ESM, CJS, UMD)
├── package.json            # Dual exports routing specifications
└── tsconfig.json

## Conditional Exports Configuration (package.json)
To guarantee standard module imports work out-of-the-box, the package structure must follow these definitions:

{
  "name": "svg-scroll-draw",
  "version": "1.0.0",
  "main": "./dist/index.cjs",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs"
    },
    "/react": {
      "types": "./dist/react/index.d.ts",
      "import": "./dist/react/index.mjs",
      "require": "./dist/react/index.cjs"
    }
  }
}

------------------------------
## 7. Success Criteria & Testing Metrics## Automation Verification Matrix

* Unit Verification: Validate individual path duration algorithms under jsdom environments.
* Integrity Validation: Confirm lifecycle .destroy() cleanly unbinds and references every event registry, mitigating memory leak events completely.
* Coverage Thresholds: Code unit test execution metrics must satisfy $\ge 90\%$ code coverage across all core functions before a stable release can be published.

To proceed with building this project, what bundler tool do you want to configure first (e.g., tsup, Rollup, or Vite)? I can provide the exact file configuration code next.

