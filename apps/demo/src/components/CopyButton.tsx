'use client';
import { useState } from 'react';

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  }

  return (
    <button
      onClick={handleCopy}
      aria-label="Copy to clipboard"
      className={`text-[11px] font-mono transition-all px-2 py-0.5 rounded border ${
        copied
          ? 'text-lime-glow border-lime-glow'
          : 'text-[#666] border-transparent hover:text-[#aaa] hover:border-[#444]'
      }`}
    >
      {copied ? 'copied!' : 'copy'}
    </button>
  );
}
