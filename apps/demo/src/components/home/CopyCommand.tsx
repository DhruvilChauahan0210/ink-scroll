'use client';

import { useState } from 'react';

/** The install command as a button that copies itself. */
export function CopyCommand({ command = 'npm i svg-scroll-draw' }: { command?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked: the command stays selectable on screen */
    }
  };
  return (
    <button type="button" className="chip" onClick={copy} aria-label={`Copy: ${command}`}>
      <span><span className="prompt">$ </span>{command}</span>
      <span className="copy" aria-live="polite">{copied ? 'copied' : 'copy'}</span>
    </button>
  );
}
