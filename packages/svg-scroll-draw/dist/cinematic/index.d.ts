type StoryEasing = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'spring' | 'bounce' | 'elastic';
/** A traced path that strokes itself on across a scroll range. */
interface DrawAnimation {
    type: 'draw';
    /** DOM id the runtime binds to (with leading '#'), e.g. "#path-3". */
    target: string;
    /** SVG path data, in canvas coordinates. */
    d: string;
    /** Pre-measured total path length (px). */
    length: number;
    /** Scroll progress where the draw begins, e.g. "20%". */
    start: string;
    /** Scroll progress where the draw completes, e.g. "50%". */
    end: string;
    stroke: string;
    strokeWidth: number;
    easing: StoryEasing;
}
/** Any layer fading opacity across a scroll range. */
interface FadeAnimation {
    type: 'fade';
    target: string;
    start: string;
    end: string;
    from: number;
    to: number;
}
type StoryAnimation = DrawAnimation | FadeAnimation;
interface StoryScene {
    id: string;
    /** Optional background layer (a product photo) as a data URL or remote URL. */
    background?: string;
    animations: StoryAnimation[];
}
interface Story {
    version: 1;
    /** Total scroll height of the experience, e.g. "400vh". */
    totalHeight: string;
    /** The authoring viewBox the coordinates are expressed in. */
    canvas: {
        width: number;
        height: number;
    };
    scenes: StoryScene[];
}

interface CinematicOptions {
    /** Mount point — a selector or element. Becomes the scroll wrapper. */
    wrapper: string | HTMLElement;
}
interface CinematicInstance {
    /** Stop the scroll loop and detach observers (built DOM is left in place). */
    destroy: () => void;
    /** Current global scroll progress through the story (0–1). */
    getProgress: () => number;
}
/**
 * The viral loader. Reads a Cinematic Story (authored in the Studio) and wires
 * a scroll-scrubbed timeline: paths stroke themselves on and layers fade in as
 * the user scrolls, all driven off the wrapper's scroll progress.
 *
 *   import { Cinematic } from "svg-scroll-draw";
 *   import story from "./story.json";
 *   new Cinematic({ wrapper: "#app" }).loadStory(story);
 */
declare class Cinematic {
    private mount;
    constructor(options: CinematicOptions);
    loadStory(story: Story): CinematicInstance;
}

export { Cinematic, type CinematicInstance, type CinematicOptions, type DrawAnimation, type FadeAnimation, type Story, type StoryAnimation, type StoryEasing, type StoryScene };
