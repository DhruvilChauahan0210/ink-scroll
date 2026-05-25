import { createEngine } from '../core/engine';
import type { ScrollDrawOptions, ScrollDrawInstance } from '../core/types';

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

if (typeof customElements !== 'undefined' && !customElements.get('scroll-draw')) {
  customElements.define('scroll-draw', ScrollDrawElement);
}
