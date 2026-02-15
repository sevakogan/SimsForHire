"use client";

import { PRESET_PRODUCT_TYPES } from "@/lib/constants/product-types";

const PRESET_TAGS = PRESET_PRODUCT_TYPES;

interface TypeFilterPillsProps {
  value: string;
  onChange: (value: string) => void;
  /** Extra type values found in the data that aren't presets */
  extraTypes?: readonly string[];
}

export function TypeFilterPills({
  value,
  onChange,
  extraTypes = [],
}: TypeFilterPillsProps) {
  const allTags = [
    ...PRESET_TAGS,
    ...extraTypes.filter(
      (t) => !PRESET_TAGS.includes(t as (typeof PRESET_TAGS)[number])
    ),
  ];

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {/* All pill */}
      <button
        type="button"
        onClick={() => onChange("")}
        className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-all ${
          value === ""
            ? "bg-primary text-white shadow-sm"
            : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
        }`}
      >
        All
      </button>

      {allTags.map((tag) => (
        <button
          key={tag}
          type="button"
          onClick={() => onChange(value === tag ? "" : tag)}
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-all ${
            value === tag
              ? "bg-primary text-white shadow-sm"
              : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}
