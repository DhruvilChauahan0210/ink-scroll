'use client';

import { ScrollDraw } from 'svg-scroll-draw/react';

export function ScrollShowcase() {
  return (
    <section className="w-full bg-marketplace-gray border-b border-pitch-black py-12 sm:py-16 md:py-24 lg:py-32 px-4 sm:px-6 md:px-16 overflow-hidden">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 lg:gap-16 items-center">

        {/* Left: Copy */}
        <div className="lg:col-span-5 flex flex-col items-start text-left max-w-xl">
          <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-graphite-border mb-4 font-medium">
            Live on this page
          </p>
          <h2 className="font-display font-extrabold text-[clamp(36px,5vw,56px)] leading-[0.95] tracking-[-0.03em] text-pitch-black dark:text-white mb-6">
            This page<br />draws itself.
          </h2>
          <p className="text-[15px] text-graphite-border dark:text-subtle-ash leading-relaxed mb-6">
            The fountain pen illustration to the right isn't a video or a GIF.
            It's a live SVG animated by <code className="font-mono text-pitch-black dark:text-white text-[0.9em] bg-light-linen dark:bg-subtle-ash/10 border border-subtle-ash px-1.5 py-0.5 rounded-md">svg-scroll-draw</code> — the exact same package you'd install.
            Scroll down and watch the ink ribbon draw out in real time.
          </p>

          {/* Minimal code callout */}
          <div className="w-full rounded-xl overflow-hidden border border-pitch-black mb-8">
            <div className="bg-[#111] flex items-center justify-between px-4 py-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#444]" />
                <span className="w-2 h-2 rounded-full bg-[#444]" />
                <span className="w-2 h-2 rounded-full bg-[#444]" />
              </div>
              <span className="text-[11px] text-[#666] font-mono tracking-wide">showcase.tsx</span>
              <span className="w-12" />
            </div>
            <pre className="bg-[#242423] text-[#e8e8e3] px-5 py-4 text-[12px] font-mono leading-[1.75] overflow-x-auto">{`<ScrollDraw
  selector=".ink-ribbon"
  easing="ease-out"
  speed={1.5}
>
  <svg>{/* fountain pen */}</svg>
</ScrollDraw>`}</pre>
          </div>

          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-creator-pink animate-ping flex-shrink-0" />
            <span className="text-xs font-mono uppercase tracking-wider text-pitch-black dark:text-white">
              Scroll to draw the ink ribbon
            </span>
          </div>
        </div>

        {/* Right: Live SVG demo */}
        <div className="lg:col-span-7 w-full relative flex justify-center items-center">

          <div className="absolute inset-0 dot-grid opacity-40 pointer-events-none rounded-2xl" />

          <ScrollDraw
            easing="ease-out"
            speed={1.5}
            stagger={0}
            className="w-full relative z-10 p-4 md:p-8"
            selector=".editorial-contour"
          >
            <svg
              width="100%"
              viewBox="0 0 700 500"
              preserveAspectRatio="xMidYMid meet"
              className="w-full h-auto overflow-visible"
            >
              <defs>
                <linearGradient id="fluid-gradient-pink-yellow" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--color-creator-pink)" />
                  <stop offset="100%" stopColor="var(--color-sunshine-yellow)" />
                </linearGradient>
                <linearGradient id="fluid-gradient-dark" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2c2c2c" />
                  <stop offset="100%" stopColor="var(--color-pitch-black)" />
                </linearGradient>
                <linearGradient id="fluid-gradient-silver" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="50%" stopColor="#e2e8f0" />
                  <stop offset="100%" stopColor="#cbd5e1" />
                </linearGradient>
                <linearGradient id="glowing-neon-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="var(--color-creator-pink)">
                    <animate attributeName="stop-color" values="var(--color-creator-pink); var(--color-firecracker-orange); var(--color-sunshine-yellow); var(--color-creator-pink)" dur="6s" repeatCount="indefinite" />
                  </stop>
                  <stop offset="50%" stopColor="var(--color-firecracker-orange)">
                    <animate attributeName="stop-color" values="var(--color-firecracker-orange); var(--color-sunshine-yellow); var(--color-lime-glow); var(--color-firecracker-orange)" dur="6s" repeatCount="indefinite" />
                  </stop>
                  <stop offset="100%" stopColor="var(--color-lime-glow)">
                    <animate attributeName="stop-color" values="var(--color-lime-glow); var(--color-creator-pink); var(--color-firecracker-orange); var(--color-lime-glow)" dur="6s" repeatCount="indefinite" />
                  </stop>
                </linearGradient>
                <filter id="neon-blur-filter" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Pen grip */}
              <path d="M 300 400 L 300 480 C 300 490, 400 490, 400 480 L 400 400 Z" fill="url(#fluid-gradient-dark)" stroke="var(--color-pitch-black)" strokeWidth="2.5" />

              {/* Silver nib face */}
              <path d="M 290 400 C 270 330, 240 280, 240 240 C 240 180, 310 110, 350 80 C 390 110, 460 180, 460 240 C 460 280, 430 330, 410 400 Z" fill="url(#fluid-gradient-silver)" stroke="var(--color-pitch-black)" strokeWidth="3.5" strokeLinejoin="round" />

              {/* Gold inlay */}
              <path d="M 305 390 C 290 330, 265 280, 265 245 C 265 195, 320 135, 350 110 C 380 135, 435 195, 435 245 C 435 280, 410 330, 395 390 Z" fill="url(#fluid-gradient-pink-yellow)" stroke="var(--color-pitch-black)" strokeWidth="2" strokeLinejoin="round" opacity="0.95" />

              {/* Engravings */}
              <path d="M 315 380 C 305 330, 285 280, 285 250 C 285 210, 330 160, 350 140" stroke="var(--color-pitch-black)" strokeWidth="1.8" fill="none" />
              <path d="M 385 380 C 395 330, 415 280, 415 250 C 415 210, 370 160, 350 140" stroke="var(--color-pitch-black)" strokeWidth="1.8" fill="none" />

              {/* Crest circles */}
              <circle cx="350" cy="300" r="24" stroke="var(--color-pitch-black)" strokeWidth="1.5" fill="none" />
              <circle cx="350" cy="300" r="16" stroke="var(--color-pitch-black)" strokeWidth="1.2" fill="none" />

              {/* Nib slit & hole */}
              <circle cx="350" cy="230" r="8.5" fill="var(--color-light-linen)" stroke="var(--color-pitch-black)" strokeWidth="2.5" />
              <line x1="350" y1="80" x2="350" y2="221.5" stroke="var(--color-pitch-black)" strokeWidth="2.5" />

              {/* Ink ribbon — drawn by svg-scroll-draw on scroll */}
              {/* Shadow layer */}
              <path
                d="M 350 80 C 290 30, 450 -10, 550 50 C 650 110, 680 200, 580 260 C 480 320, 180 220, 120 280 C 60 340, 100 430, 220 440 C 340 450, 550 420, 680 430"
                stroke="var(--color-pitch-black)"
                strokeWidth="9"
                strokeLinecap="round"
                fill="none"
                className="editorial-contour"
              />
              {/* Bloom aura */}
              <path
                d="M 350 80 C 290 30, 450 -10, 550 50 C 650 110, 680 200, 580 260 C 480 320, 180 220, 120 280 C 60 340, 100 430, 220 440 C 340 450, 550 420, 680 430"
                stroke="url(#glowing-neon-gradient)"
                strokeWidth="18"
                strokeLinecap="round"
                fill="none"
                filter="url(#neon-blur-filter)"
                opacity="0.45"
                className="editorial-contour"
              />
              {/* Color core */}
              <path
                d="M 350 80 C 290 30, 450 -10, 550 50 C 650 110, 680 200, 580 260 C 480 320, 180 220, 120 280 C 60 340, 100 430, 220 440 C 340 450, 550 420, 680 430"
                stroke="url(#glowing-neon-gradient)"
                strokeWidth="5.5"
                strokeLinecap="round"
                fill="none"
                opacity="0.95"
                className="editorial-contour"
              />
              {/* White gloss */}
              <path
                d="M 350 80 C 290 30, 450 -10, 550 50 C 650 110, 680 200, 580 260 C 480 320, 180 220, 120 280 C 60 340, 100 430, 220 440 C 340 450, 550 420, 680 430"
                stroke="#ffffff"
                strokeWidth="1.8"
                strokeLinecap="round"
                fill="none"
                className="editorial-contour"
              />

              {/* Ink drops */}
              <circle cx="580" cy="110" r="14" fill="var(--color-lime-glow)" stroke="var(--color-pitch-black)" strokeWidth="2.5" />
              <circle cx="602" cy="90" r="5" fill="var(--color-lime-glow)" stroke="var(--color-pitch-black)" strokeWidth="1.5" />
              <circle cx="90" cy="320" r="10" fill="var(--color-firecracker-orange)" stroke="var(--color-pitch-black)" strokeWidth="2.5" />
              <circle cx="70" cy="338" r="4" fill="var(--color-firecracker-orange)" stroke="var(--color-pitch-black)" strokeWidth="1.5" />

              {/* Crosshair accent */}
              <path d="M 640 330 L 640 350 M 630 340 L 650 340" stroke="var(--color-pitch-black)" strokeWidth="1.5" opacity="0.4" className="dark:stroke-white" />
              <circle cx="640" cy="340" r="4" stroke="var(--color-pitch-black)" strokeWidth="1.2" fill="none" opacity="0.4" className="dark:stroke-white" />
            </svg>
          </ScrollDraw>
        </div>
      </div>
    </section>
  );
}
