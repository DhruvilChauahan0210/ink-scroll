type EasingName = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'spring' | 'bounce' | 'elastic';

interface ScrollSnapOptions {
    /** Scroll axis. Default: 'vertical'. */
    direction?: 'vertical' | 'horizontal';
    /** Snap animation duration in ms. Default: 600. */
    duration?: number;
    /** Easing for the snap scroll animation. Default: 'ease-in-out'. */
    easing?: EasingName | ((t: number) => number);
    /**
     * Fraction of a section's size the user must scroll past before it snaps
     * forward instead of snapping back. Range 0–1. Default: 0.3.
     */
    threshold?: number;
    /** Custom scroll container. Default: window. */
    scrollContainer?: string | Element;
    /** Fires after each snap with the target section index. */
    onSnap?: (index: number) => void;
}
interface ScrollSnapInstance {
    /** Remove snap behaviour and all listeners. */
    destroy: () => void;
    /** Programmatically snap to a section by zero-based index. */
    snapTo: (index: number) => void;
    /** Returns the index of the currently snapped section. */
    getCurrentIndex: () => number;
}
declare function scrollSnap(sections: string | NodeList | Element[], options?: ScrollSnapOptions): ScrollSnapInstance;

export { type ScrollSnapInstance, type ScrollSnapOptions, scrollSnap };
