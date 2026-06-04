declare function enable(): void;
declare function disable(): void;
declare function toggle(): void;
declare function highlight(target: string | Element): void;
declare const devtools: {
    enable: typeof enable;
    disable: typeof disable;
    toggle: typeof toggle;
    highlight: typeof highlight;
};

export { devtools };
