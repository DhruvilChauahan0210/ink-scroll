export type EasingName = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'spring';

export interface TriggerConfig {
  start?: string;
  end?: string;
}

export interface ScrollDrawOptions {
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
  /** Delay in milliseconds before the engine starts observing (useful for page-load sequences). */
  delay?: number;
  /** Animate stroke color. Single string = static override. Tuple = interpolate from → to. */
  strokeColor?: string | [string, string];
  /** Animate stroke width. Single number = static override. Tuple = interpolate from → to. */
  strokeWidth?: number | [number, number];
  /** Fire callbacks at specific progress thresholds (0–1). Resets on replay(). */
  waypoints?: Record<number, () => void>;
  onProgress?: (alpha: number) => void;
  onStart?: () => void;
  onComplete?: () => void;
}

export interface ScrollDrawInstance {
  destroy: () => void;
  /** Reset and replay the animation from the beginning. */
  replay: () => void;
}
