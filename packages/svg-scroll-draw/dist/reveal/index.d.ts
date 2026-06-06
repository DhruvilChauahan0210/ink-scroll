type EasingName = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'spring' | 'bounce' | 'elastic';
interface TriggerConfig {
    start?: string;
    end?: string;
}

interface ScrollRevealFrom {
    /** Start opacity (0–1). Animates to 1. */
    opacity?: number;
    /** Start translateX in px. Animates to 0. */
    x?: number;
    /** Start translateY in px. Animates to 0. */
    y?: number;
    /** Start scale. Animates to 1. */
    scale?: number;
    /** Start rotate in degrees. Animates to 0. */
    rotate?: number;
    /** Start rotateX in degrees. Animates to 0. */
    rotateX?: number;
    /** Start rotateY in degrees. Animates to 0. */
    rotateY?: number;
}
type ScrollRevealPreset = 'fadeUp' | 'fadeDown' | 'fadeLeft' | 'fadeRight' | 'scale' | 'flip' | 'flipX';
interface ScrollRevealOptions {
    /**
     * Named preset for the reveal animation. Default: `'fadeUp'`.
     * Custom `from` overrides the preset when both are provided.
     *
     * Presets:
     * - `fadeUp`    — opacity 0→1, y +32→0 (default)
     * - `fadeDown`  — opacity 0→1, y -32→0
     * - `fadeLeft`  — opacity 0→1, x +32→0
     * - `fadeRight` — opacity 0→1, x -32→0
     * - `scale`     — opacity 0→1, scale 0.88→1
     * - `flip`      — opacity 0→1, rotateX 20→0
     * - `flipX`     — opacity 0→1, rotateY 20→0
     */
    preset?: ScrollRevealPreset;
    /** Custom start state. Keys: opacity, x, y, scale, rotate, rotateX, rotateY. */
    from?: ScrollRevealFrom;
    /**
     * Delay between each element's animation start (seconds).
     * Elements are staggered by offsetting their trigger window.
     * Default: 0.08.
     */
    stagger?: number;
    /** Animation easing. Default: `'ease-out'`. */
    easing?: EasingName | ((t: number) => number);
    /** Freeze at max progress — don't reverse on scroll back. Default: true. */
    once?: boolean;
    /** Override the default trigger window. */
    trigger?: TriggerConfig;
    /** Fires when the first element enters the trigger zone. */
    onEnter?: () => void;
    /** Fires when the last element leaves the trigger zone. */
    onLeave?: () => void;
}
interface ScrollRevealInstance {
    /** Remove all animations and restore original styles. */
    destroy: () => void;
}
/**
 * Reveal elements as they scroll into view.
 *
 * The zero-config replacement for AOS, ScrollReveal.js, and GSAP + ScrollTrigger
 * for the most common scroll animation use case — in one function call.
 *
 * @example
 * // Fade up (default)
 * scrollReveal('.card');
 *
 * // Custom from state
 * scrollReveal('.feature', { from: { opacity: 0, y: 40, scale: 0.95 } });
 *
 * // Named preset with stagger
 * scrollReveal('.item', { preset: 'fadeLeft', stagger: 0.1 });
 */
declare function scrollReveal(target: string | NodeList | Element[], options?: ScrollRevealOptions): ScrollRevealInstance;

export { type ScrollRevealFrom, type ScrollRevealInstance, type ScrollRevealOptions, type ScrollRevealPreset, scrollReveal };
