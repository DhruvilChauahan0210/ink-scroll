import { createEngine } from '../core/engine';
import type { ScrollDrawOptions, ScrollDrawInstance } from '../core/types';

/**
 * `<scroll-draw>` — the no-build usage the README advertises.
 *
 * Everything is inside the guard because `class … extends HTMLElement` is
 * evaluated the moment the module is imported, and `HTMLElement` does not exist
 * on a server. The class used to sit at module scope with only the `define()`
 * call guarded, so importing this entry — or the CDN bundle that includes it —
 * during an SSR render threw `ReferenceError: HTMLElement is not defined` and
 * took the whole render down. Every other entry point in this library degrades
 * to a no-op without a DOM; this one crashed.
 */
if (
  typeof HTMLElement !== 'undefined' &&
  typeof customElements !== 'undefined' &&
  !customElements.get('scroll-draw')
) {
  class ScrollDrawElement extends HTMLElement {
    private instance: ScrollDrawInstance | null = null;

    connectedCallback() {
      const opts: ScrollDrawOptions = {};

      const speed     = this.getAttribute('speed');
      const easing    = this.getAttribute('easing');
      const stagger   = this.getAttribute('stagger');
      const direction = this.getAttribute('direction');
      const selector  = this.getAttribute('selector');

      if (speed)     opts.speed     = parseFloat(speed);
      if (easing)    opts.easing    = easing as ScrollDrawOptions['easing'];
      if (stagger)   opts.stagger   = parseFloat(stagger);
      if (direction) opts.direction = direction as ScrollDrawOptions['direction'];
      if (selector)  opts.selector  = selector;
      if (this.hasAttribute('fade')) opts.fade = this.getAttribute('fade') !== 'false';

      this.instance = createEngine(this, opts);
    }

    disconnectedCallback() {
      this.instance?.destroy();
      this.instance = null;
    }
  }

  customElements.define('scroll-draw', ScrollDrawElement);
}
