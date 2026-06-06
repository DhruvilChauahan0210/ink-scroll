interface ScrollPinOptions {
    /** Extra pixels of scroll to stay pinned after the element hits its viewport position. Default: viewport height. */
    pinDistance?: number;
    /** Viewport Y position (px) where the element pins. Default: 0 (top of viewport). */
    top?: number;
    /** Custom scroll container (CSS selector or Element). Default: window. */
    scrollContainer?: string | Element;
    /** Fires when the element begins being pinned (scrolling forward). */
    onEnter?: () => void;
    /** Fires when the element unpins at the end of the pin zone (scrolling forward). */
    onLeave?: () => void;
    /** Fires when the element re-pins after scrolling back into the pin zone. */
    onEnterBack?: () => void;
    /** Fires when the element unpins back before the pin zone (scrolling back). */
    onLeaveBack?: () => void;
    /** Progress through the pin zone (0 = start, 1 = end). */
    onProgress?: (progress: number) => void;
}
interface ScrollPinInstance {
    /** Remove pin behaviour and restore the element to its original state. */
    destroy: () => void;
    /** Recalculate pin dimensions after a layout change. */
    refresh: () => void;
    /** Returns progress through the pin zone (0–1). */
    getProgress: () => number;
}
declare function scrollPin(target: string | Element, options?: ScrollPinOptions): ScrollPinInstance;

export { type ScrollPinInstance, type ScrollPinOptions, scrollPin };
