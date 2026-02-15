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
