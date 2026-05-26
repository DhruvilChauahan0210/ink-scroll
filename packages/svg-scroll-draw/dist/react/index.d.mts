import * as react_jsx_runtime from 'react/jsx-runtime';
import React, { RefObject } from 'react';

type EasingName = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'spring';
interface TriggerConfig {
    start?: string;
    end?: string;
}
interface ScrollDrawOptions {
    selector?: string;
    speed?: number;
    fade?: boolean;
    easing?: EasingName | ((t: number) => number);
    trigger?: TriggerConfig;
    stagger?: number;
    direction?: 'forward' | 'reverse';
    once?: boolean;
    debug?: boolean;
    /** Scroll axis to track. 'y' (default) for vertical, 'x' for horizontal. */
    axis?: 'x' | 'y';
    /** CSS selector or Element for a custom scroll container (default: window). */
    scrollContainer?: string | Element;
    /** Automatically reverse the animation when the user scrolls back up. */
    autoReverse?: boolean;
    /** Delay in milliseconds before the engine starts observing. */
    delay?: number;
    /** Animate stroke color. Single string = static override. Tuple = interpolate from → to. */
    strokeColor?: string | [string, string];
    /** Animate stroke width. Single number = static override. Tuple = interpolate from → to. */
    strokeWidth?: number | [number, number];
    /** Animate fill opacity. Single number = static override. Tuple [from, to] = interpolate as the path draws. Use [0, 1] to flood fill in sync with the stroke draw. */
    fillOpacity?: number | [number, number];
    /**
     * Reveal the container using CSS clip-path instead of stroke-dashoffset.
     * Works on any content — SVG, images, text, divs.
     * `true` defaults to `'left'`. Values: `'left' | 'right' | 'top' | 'bottom' | 'center'`.
     */
    clip?: boolean | 'left' | 'right' | 'top' | 'bottom' | 'center';
    /** Fire callbacks at specific progress thresholds (0–1). Resets on replay(). */
    waypoints?: Record<number, () => void>;
    /** Scale animation speed by scroll velocity — faster scrolling = faster draw. Pass a number to control sensitivity (default 1). */
    velocityScale?: boolean | number;
    /** IntersectionObserver threshold (0–1). Default 0. */
    threshold?: number;
    /** IntersectionObserver rootMargin. Default "0px". */
    rootMargin?: string;
    /** Repeat the animation N times after completion. Use 'infinite' to loop forever. */
    repeat?: number | 'infinite';
    /** Milliseconds to wait between repeats. Default 0. */
    repeatDelay?: number;
    /** Target path `d` attribute to morph toward as the animation progresses. Paths must have compatible structures. */
    morphTo?: string;
    onProgress?: (alpha: number) => void;
    onStart?: () => void;
    onComplete?: () => void;
}

interface UseScrollDrawProgressOptions {
    /** Same speed multiplier as ScrollDraw. Values > 1 complete faster. Default 1. */
    speed?: number;
    /** Same easing curves as ScrollDraw. Default 'linear'. */
    easing?: EasingName | ((t: number) => number);
    /** Same trigger syntax as ScrollDraw. Default: start 'top bottom', end 'bottom top'. */
    trigger?: TriggerConfig;
    /** Scroll axis. Default 'y'. */
    axis?: 'x' | 'y';
    /** CSS selector or Element for a custom scroll container. Default: window. */
    scrollContainer?: string | Element;
    /** Lock at maximum progress once reached — never decreases on scroll back. Default false. */
    once?: boolean;
}
/**
 * Returns a reactive scroll progress value (0–1) for the given element.
 * Identical trigger/speed/easing semantics to ScrollDraw — use this to
 * drive any animation alongside or independent of an SVG draw.
 *
 * @example
 * const ref = useRef<HTMLDivElement>(null);
 * const progress = useScrollDrawProgress(ref, { speed: 1.2, easing: 'ease-out' });
 * // progress is 0→1 as ref scrolls through the viewport
 */
declare function useScrollDrawProgress(target: RefObject<Element | null> | string, options?: UseScrollDrawProgressOptions): number;

type ScrollDrawProps = ScrollDrawOptions & {
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
};
declare function ScrollDraw({ children, className, style, ...options }: ScrollDrawProps): react_jsx_runtime.JSX.Element;

export { ScrollDraw, type UseScrollDrawProgressOptions, useScrollDrawProgress };
