/**
 * What the animated counter generator (/counter-animation-generator) offers,
 * all of it scrollCounter's own options (packages/svg-scroll-draw/src/counter/
 * index.ts):
 *
 * - the easings are its EasingName values (core/types.ts, EASINGS in core/easing.ts);
 * - COUNTER_DEFAULTS are buildCounter's defaults (the destructuring at the top
 *   of buildCounter, and the trigger.start / trigger.end fallbacks under it),
 *   used to leave unchanged options out of the generated code;
 * - the number formats are Intl.NumberFormat, handed to the counter through its
 *   `format` option. The counter's own `decimals` option is n.toFixed(decimals),
 *   and it replaces `format` entirely (the `fmt` line in buildCounter), so the
 *   generator only writes `decimals` when nothing else about the format changed
 *   and the count does not cross zero, where toFixed prints "-0".
 */

export const COUNTER_EASINGS = ['ease-out', 'ease-in-out', 'ease-in', 'linear', 'spring', 'bounce', 'elastic'] as const;
export type CounterEasing = (typeof COUNTER_EASINGS)[number];

export const COUNTER_DEFAULTS = {
  from: 0,
  easing: 'ease-out' as CounterEasing,
  once: true,
  start: 'top 80%',
  end: 'top 20%',
};

/** Counting windows: when the count starts and when it is done. */
export const COUNTER_TRIGGERS = [
  { key: 'default', label: 'top 80% → top 20%', start: 'top 80%', end: 'top 20%' },
  { key: 'in-view', label: 'top bottom → bottom 90%', start: 'top bottom', end: 'bottom 90%' },
  { key: 'middle', label: 'top bottom → center center', start: 'top bottom', end: 'center center' },
] as const;
export type CounterTrigger = (typeof COUNTER_TRIGGERS)[number]['key'];

export const COUNTER_LOCALES = ['en-US', 'en-IN', 'de-DE', 'fr-FR', 'ja-JP'] as const;
export type CounterLocale = (typeof COUNTER_LOCALES)[number];

export const COUNTER_DECIMALS = ['0', '1', '2', '3'] as const;

/** Prefix and suffix: short, and nothing that would break the HTML, JSX or JS the generator writes. */
export const AFFIX_MAX = 6;
export const cleanAffix = (v: string) => v.replace(/[<>{}&\\\r\n]/g, '').slice(0, AFFIX_MAX);

export type CounterSettings = {
  /** As typed: a JavaScript number, '.' for decimals. */
  from: string;
  to: string;
  decimals: number;
  prefix: string;
  suffix: string;
  locale: CounterLocale;
  grouping: boolean;
  compact: boolean;
  easing: CounterEasing;
  trigger: CounterTrigger;
  once: boolean;
  /** Write a visually hidden copy of the final number into the generated code. */
  srCopy: boolean;
};

/** The settings that decide the number shown, and nothing else. */
export type CounterNumber = Pick<CounterSettings, 'from' | 'to' | 'decimals' | 'prefix' | 'suffix' | 'locale' | 'grouping' | 'compact'>;

export const COUNTER_INITIAL: CounterSettings = {
  from: '0',
  to: '1250000',
  decimals: 0,
  prefix: '',
  suffix: '',
  locale: 'en-US',
  grouping: true,
  compact: false,
  easing: 'ease-out',
  trigger: 'default',
  once: true,
  srCopy: true,
};

/** Realistic stats, each one counting on the page as it scrolls by. */
export const COUNTER_EXAMPLES: { key: string; label: string; note: string; settings: CounterSettings }[] = [
  { key: 'users', label: 'Users', note: 'separators, a plus', settings: { ...COUNTER_INITIAL, to: '12400', suffix: '+' } },
  {
    key: 'uptime', label: 'Uptime', note: 'two decimals, a percent',
    settings: { ...COUNTER_INITIAL, to: '99.98', decimals: 2, suffix: '%', grouping: false },
  },
  {
    key: 'revenue', label: 'Revenue', note: 'compact, a currency sign',
    settings: { ...COUNTER_INITIAL, to: '4200000', decimals: 1, prefix: '$', compact: true },
  },
  {
    key: 'reply', label: 'Reply time', note: 'counting down',
    settings: { ...COUNTER_INITIAL, from: '2400', to: '180', suffix: ' ms' },
  },
];

// ── Numbers ──────────────────────────────────────────────────────────────────

export const MAX_ABS = 1e12;

/** A typed number, or null when it is not one (commas are not decimals in JavaScript). */
export function parseNumber(text: string): number | null {
  const t = text.trim().replace(/[\s_]/g, '');
  if (!t || /,/.test(t)) return null;
  const n = Number(t);
  return Number.isFinite(n) && Math.abs(n) <= MAX_ABS ? n : null;
}

// ── Formatting ───────────────────────────────────────────────────────────────

/**
 * How the counter writes its number. 'default' is the counter's own
 * String(Math.round(n)); 'decimals' its toFixed; 'format' an Intl.NumberFormat
 * with a prefix and suffix around it, passed in as `format`.
 *
 * `zero` is set when the count passes between −half a unit and 0, where
 * toFixed and Intl.NumberFormat both print "-0" (measured in Chromium, Firefox
 * and WebKit: (-0.3).toFixed(0) and nf.format(-0.3) are both "-0"; the
 * default String(Math.round(-0.3)) is "0"). Values closer to 0 than `zero`
 * are formatted as 0.
 */
export type FormatPlan =
  | { kind: 'default' }
  | { kind: 'decimals'; decimals: number }
  | { kind: 'format'; locale: CounterLocale; intl: Intl.NumberFormatOptions; prefix: string; suffix: string; zero?: number };

const decimalMark = (locale: string) =>
  new Intl.NumberFormat(locale).formatToParts(1.5).find((p) => p.type === 'decimal')?.value ?? '.';

/** Half the last digit shown: 0.5 with no decimals, 0.05 with one. */
const halfUnit = (decimals: number) => Number((0.5 / 10 ** decimals).toFixed(decimals + 1));

export function formatPlan(s: CounterNumber): FormatPlan {
  const from = parseNumber(s.from) ?? 0;
  const to = parseNumber(s.to) ?? 0;
  // Does the count pass a value in (−half, 0)? Then a rounding format prints "-0".
  const half = halfUnit(s.decimals);
  const negZero = Math.min(from, to) < 0 && Math.max(from, to) > -half;
  const plain = !s.prefix && !s.suffix && !s.grouping && !s.compact && (s.decimals === 0 || decimalMark(s.locale) === '.');
  if (plain && s.decimals === 0) return { kind: 'default' };
  if (plain && !negZero) return { kind: 'decimals', decimals: s.decimals };
  const intl: Intl.NumberFormatOptions = {};
  if (s.compact) intl.notation = 'compact';
  // Fixed decimals hold the width still while it counts; compact numbers
  // keep "up to", or 450,000 would read 450.0K.
  if (!s.compact && s.decimals > 0) intl.minimumFractionDigits = s.decimals;
  // Always set: Intl's default of 3 would show 523.457 half way through a count to 1,000.
  intl.maximumFractionDigits = s.decimals;
  if (!s.grouping) intl.useGrouping = false;
  return { kind: 'format', locale: s.locale, intl, prefix: s.prefix, suffix: s.suffix, ...(negZero ? { zero: half } : {}) };
}

/** The function the counter calls on every frame, exactly as the generated code builds it. */
export function formatterOf(plan: FormatPlan): (n: number) => string {
  if (plan.kind === 'default') return (n) => String(Math.round(n));
  if (plan.kind === 'decimals') return (n) => n.toFixed(plan.decimals);
  const nf = new Intl.NumberFormat(plan.locale, plan.intl);
  const zero = plan.zero;
  return zero === undefined
    ? (n) => plan.prefix + nf.format(n) + plan.suffix
    : (n) => plan.prefix + nf.format(Math.abs(n) < zero ? 0 : n) + plan.suffix;
}

/** A JavaScript string literal in single quotes. */
export const lit = (v: string) => `'${v.replace(/'/g, "\\'")}'`;

/** `{ notation: 'compact', maximumFractionDigits: 1 }` */
export function intlLiteral(o: Intl.NumberFormatOptions): string {
  const parts = Object.entries(o).map(([k, v]) => `${k}: ${typeof v === 'string' ? lit(v) : String(v)}`);
  return `{ ${parts.join(', ')} }`;
}

/** The body of the format arrow: `'$' + nf.format(n) + '+'`, or `nf.format(Math.abs(n) < 0.5 ? 0 : n)` across zero. */
export function formatExpr(plan: Extract<FormatPlan, { kind: 'format' }>): string {
  const call = plan.zero === undefined ? 'nf.format(n)' : `nf.format(Math.abs(n) < ${plan.zero} ? 0 : n)`;
  return [plan.prefix && lit(plan.prefix), call, plan.suffix && lit(plan.suffix)].filter(Boolean).join(' + ');
}

/** The ease-out curve, t × (2 − t): EASINGS['ease-out'] in core/easing.ts. */
export const easeOut = (t: number) => t * (2 - t);
