import { ref, onMounted, onUnmounted, defineComponent, h } from 'vue';
import { createEngine } from '../core/engine';
import type { ScrollDrawOptions } from '../core/types';

export type { ScrollDrawOptions };

/** Composable — attach to any container ref. */
export function useScrollDraw(options: ScrollDrawOptions = {}) {
  const containerRef = ref<HTMLElement | null>(null);

  onMounted(() => {
    if (!containerRef.value) return;
    const instance = createEngine(containerRef.value, options);
    onUnmounted(() => instance.destroy());
  });

  return containerRef;
}

/** Component — wraps children in a <div> and initialises the engine. */
export const ScrollDraw = defineComponent({
  name: 'ScrollDraw',
  props: {
    selector:   { type: String },
    speed:      { type: Number },
    fade:       { type: Boolean },
    stagger:    { type: Number },
    easing:     { type: [String, Function] },
    direction:  { type: String as () => 'forward' | 'reverse' },
    trigger:    { type: Object },
    onProgress: { type: Function },
    onStart:    { type: Function },
    onComplete: { type: Function },
    once:       { type: Boolean },
    debug:      { type: Boolean },
  },
  setup(props, { slots }) {
    const containerRef = ref<HTMLElement | null>(null);

    onMounted(() => {
      if (!containerRef.value) return;
      const opts: ScrollDrawOptions = {};
      if (props.selector   != null) opts.selector   = props.selector;
      if (props.speed      != null) opts.speed      = props.speed;
      if (props.fade       != null) opts.fade       = props.fade;
      if (props.stagger    != null) opts.stagger    = props.stagger;
      if (props.easing     != null) opts.easing     = props.easing as ScrollDrawOptions['easing'];
      if (props.direction  != null) opts.direction  = props.direction;
      if (props.trigger    != null) opts.trigger    = props.trigger as ScrollDrawOptions['trigger'];
      if (props.once       != null) opts.once       = props.once;
      if (props.debug      != null) opts.debug      = props.debug;
      if (props.onProgress != null) opts.onProgress = props.onProgress as ScrollDrawOptions['onProgress'];
      if (props.onStart    != null) opts.onStart    = props.onStart    as ScrollDrawOptions['onStart'];
      if (props.onComplete != null) opts.onComplete = props.onComplete as ScrollDrawOptions['onComplete'];
      const instance = createEngine(containerRef.value, opts);
      onUnmounted(() => instance.destroy());
    });

    return () => h('div', { ref: containerRef }, slots.default?.());
  },
});
