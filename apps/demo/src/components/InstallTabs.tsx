'use client';
import { useState } from 'react';
import { CopyButton } from './CopyButton';

const TABS = [
  { id: 'npm',  label: 'npm',  cmd: 'npm i svg-scroll-draw',         showDollar: true },
  { id: 'pnpm', label: 'pnpm', cmd: 'pnpm add svg-scroll-draw',       showDollar: true },
  { id: 'yarn', label: 'yarn', cmd: 'yarn add svg-scroll-draw',       showDollar: true },
  { id: 'bun',  label: 'bun',  cmd: 'bun add svg-scroll-draw',        showDollar: true },
  {
    id: 'cdn',
    label: 'CDN',
    cmd: '<script src="https://unpkg.com/svg-scroll-draw/dist/cdn/svg-scroll-draw.global.js"></script>',
    showDollar: false,
  },
] as const;

export function InstallTabs() {
  const [active, setActive] = useState<string>('npm');
  const tab = TABS.find((t) => t.id === active) ?? TABS[0];

  return (
    <div className="border border-pitch-black rounded-2xl overflow-hidden bg-light-linen shadow-[2px_2px_0px_#000] w-full max-w-sm sm:max-w-md">
      {/* Tab row */}
      <div className="flex border-b border-pitch-black">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={`flex-1 py-2 text-[11px] font-mono font-medium tracking-wide transition-colors ${
              active === t.id
                ? 'bg-pitch-black text-light-linen'
                : 'text-graphite-border hover:text-pitch-black hover:bg-subtle-ash/30'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {/* Command line */}
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <div className="flex items-center gap-2 font-mono text-sm min-w-0">
          {tab.showDollar && (
            <span className="text-graphite-border select-none shrink-0">$</span>
          )}
          <span className="font-medium truncate">{tab.cmd}</span>
        </div>
        <div className="shrink-0">
          <CopyButton text={tab.cmd} />
        </div>
      </div>
    </div>
  );
}
