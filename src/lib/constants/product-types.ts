export const PRESET_PRODUCT_TYPES = [
  "Base",
  "Wheels",
  "Pedals",
  "Accessories",
  "Monitors",
  "PC Related",
  "Seats",
  "Motion",
] as const;

export type PresetProductType = (typeof PRESET_PRODUCT_TYPES)[number];

/**
 * Color scheme for each product type — tailwind class pairs [bg, text].
 * Used for pills, badges, and filter buttons.
 */
export const TYPE_COLORS: Record<string, { bg: string; text: string; activeBg: string; activeText: string }> = {
  Base:          { bg: "bg-blue-100",    text: "text-blue-700",    activeBg: "bg-blue-600",    activeText: "text-white" },
  Wheels:        { bg: "bg-amber-100",   text: "text-amber-700",   activeBg: "bg-amber-600",   activeText: "text-white" },
  Pedals:        { bg: "bg-green-100",   text: "text-green-700",   activeBg: "bg-green-600",   activeText: "text-white" },
  Accessories:   { bg: "bg-purple-100",  text: "text-purple-700",  activeBg: "bg-purple-600",  activeText: "text-white" },
  Monitors:      { bg: "bg-cyan-100",    text: "text-cyan-700",    activeBg: "bg-cyan-600",    activeText: "text-white" },
  "PC Related":  { bg: "bg-rose-100",    text: "text-rose-700",    activeBg: "bg-rose-600",    activeText: "text-white" },
  Seats:         { bg: "bg-orange-100",  text: "text-orange-700",  activeBg: "bg-orange-600",  activeText: "text-white" },
  Motion:        { bg: "bg-indigo-100",  text: "text-indigo-700",  activeBg: "bg-indigo-600",  activeText: "text-white" },
};

/** Fallback colors for custom / unknown types */
export const DEFAULT_TYPE_COLOR = {
  bg: "bg-gray-100",
  text: "text-gray-600",
  activeBg: "bg-gray-600",
  activeText: "text-white",
};

/** Get color scheme for a type (falls back to default for custom types) */
export function getTypeColor(type: string) {
  return TYPE_COLORS[type] ?? DEFAULT_TYPE_COLOR;
}
