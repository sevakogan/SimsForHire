"use client";

import { useMemo } from "react";
import { getTypeColor } from "@/lib/constants/product-types";
import type { Item, ClientItem } from "@/types";

interface TagFilterPillsProps {
  items: (Item | ClientItem)[];
  value: string;
  onChange: (value: string) => void;
}

export function TagFilterPills({ items, value, onChange }: TagFilterPillsProps) {
  const tags = useMemo(() => {
    const tagCounts = new Map<string, number>();
    for (const item of items) {
      const t = item.item_type;
      if (t && t.length > 0) {
        tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
      }
    }
    return [...tagCounts.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [items]);

  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        onClick={() => onChange("")}
        className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
          value === ""
            ? "bg-primary text-white shadow-sm"
            : "bg-muted/60 text-muted-foreground hover:bg-muted"
        }`}
      >
        All ({items.length})
      </button>

      {tags.map(([tag, count]) => {
        const colors = getTypeColor(tag);
        const isActive = value === tag;
        return (
          <button
            key={tag}
            type="button"
            onClick={() => onChange(isActive ? "" : tag)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
              isActive
                ? `${colors.activeBg} ${colors.activeText} shadow-sm`
                : `${colors.bg} ${colors.text} hover:opacity-80`
            }`}
          >
            {tag}
            <span className={`ml-1 text-[10px] ${isActive ? "opacity-80" : "opacity-60"}`}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
