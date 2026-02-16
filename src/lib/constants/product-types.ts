export const PRESET_PRODUCT_TYPES = [
  "Accessories",
  "Base",
  "Monitors",
  "Motion",
  "PC Related",
  "Pedals",
  "Seats",
  "Wheels",
] as const;

export type PresetProductType = (typeof PRESET_PRODUCT_TYPES)[number];

interface TypeColorScheme {
  bg: string;
  text: string;
  activeBg: string;
  activeText: string;
}

/**
 * Color key -> Tailwind class mapping.
 * Used by both the legacy TYPE_COLORS (keyed by type name) and
 * the DB-backed product_types (keyed by color_key column).
 */
export const COLOR_KEY_MAP: Record<string, TypeColorScheme> = {
  blue:    { bg: "bg-blue-100",    text: "text-blue-700",    activeBg: "bg-blue-600",    activeText: "text-white" },
  amber:   { bg: "bg-amber-100",   text: "text-amber-700",   activeBg: "bg-amber-600",   activeText: "text-white" },
  green:   { bg: "bg-green-100",   text: "text-green-700",   activeBg: "bg-green-600",   activeText: "text-white" },
  purple:  { bg: "bg-purple-100",  text: "text-purple-700",  activeBg: "bg-purple-600",  activeText: "text-white" },
  cyan:    { bg: "bg-cyan-100",    text: "text-cyan-700",    activeBg: "bg-cyan-600",    activeText: "text-white" },
  rose:    { bg: "bg-rose-100",    text: "text-rose-700",    activeBg: "bg-rose-600",    activeText: "text-white" },
  orange:  { bg: "bg-orange-100",  text: "text-orange-700",  activeBg: "bg-orange-600",  activeText: "text-white" },
  indigo:  { bg: "bg-indigo-100",  text: "text-indigo-700",  activeBg: "bg-indigo-600",  activeText: "text-white" },
  gray:    { bg: "bg-gray-100",    text: "text-gray-600",    activeBg: "bg-gray-600",    activeText: "text-white" },
  red:     { bg: "bg-red-100",     text: "text-red-700",     activeBg: "bg-red-600",     activeText: "text-white" },
  teal:    { bg: "bg-teal-100",    text: "text-teal-700",    activeBg: "bg-teal-600",    activeText: "text-white" },
  pink:    { bg: "bg-pink-100",    text: "text-pink-700",    activeBg: "bg-pink-600",    activeText: "text-white" },
};

/** All available color keys for the type color picker */
export const AVAILABLE_COLOR_KEYS = Object.keys(COLOR_KEY_MAP);

/**
 * Color scheme for each product type — tailwind class pairs [bg, text].
 * Maps type names -> color schemes for backward compatibility.
 */
export const TYPE_COLORS: Record<string, TypeColorScheme> = {
  Base:          COLOR_KEY_MAP.blue,
  Wheels:        COLOR_KEY_MAP.amber,
  Pedals:        COLOR_KEY_MAP.green,
  Accessories:   COLOR_KEY_MAP.purple,
  Monitors:      COLOR_KEY_MAP.cyan,
  "PC Related":  COLOR_KEY_MAP.rose,
  Seats:         COLOR_KEY_MAP.orange,
  Motion:        COLOR_KEY_MAP.indigo,
};

/** Fallback colors for custom / unknown types */
export const DEFAULT_TYPE_COLOR: TypeColorScheme = COLOR_KEY_MAP.gray;

/** Get color scheme for a type (falls back to default for custom types) */
export function getTypeColor(type: string) {
  return TYPE_COLORS[type] ?? DEFAULT_TYPE_COLOR;
}

/** Get color scheme by color key (used for DB-backed types) */
export function getColorByKey(colorKey: string): TypeColorScheme {
  return COLOR_KEY_MAP[colorKey] ?? DEFAULT_TYPE_COLOR;
}
