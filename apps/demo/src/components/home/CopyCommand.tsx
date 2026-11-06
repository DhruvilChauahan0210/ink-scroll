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
    // Named by what it shows ("npm i svg-scroll-draw copy"): an aria-label of
    // "Copy: …" did not contain the visible text, and failed axe's
    // label-content-name-mismatch wherever the chip appears.
    <button type="button" className="chip" onClick={copy}>
      <span><span className="prompt" aria-hidden="true">$ </span>{command}</span>
      <span className="copy" aria-live="polite">{copied ? 'Copied' : 'Copy'}</span>
    </button>
  );
}
