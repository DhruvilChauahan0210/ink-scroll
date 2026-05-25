export type EasingName = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';

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
  onComplete?: () => void;
}

export interface ScrollDrawInstance {
  destroy: () => void;
}
