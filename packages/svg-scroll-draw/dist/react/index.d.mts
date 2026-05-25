import * as react_jsx_runtime from 'react/jsx-runtime';
import React from 'react';

type EasingName = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
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
    onComplete?: () => void;
}

type ScrollDrawProps = ScrollDrawOptions & {
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
};
declare function ScrollDraw({ children, className, style, ...options }: ScrollDrawProps): react_jsx_runtime.JSX.Element;

export { ScrollDraw };
