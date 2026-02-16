"use client";

import { useMemo } from "react";
import { getTypeColor } from "@/lib/constants/product-types";
import type { Item, ClientItem } from "@/types";

interface TagSidebarProps {
  items: (Item | ClientItem)[];
  value: string;
  onChange: (value: string) => void;
}

export function TagSidebar({ items, value, onChange }: TagSidebarProps) {
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
    <>
      {/* Desktop: vertical sticky sidebar */}
      <div className="hidden sm:block w-28 shrink-0 sticky top-20 self-start">
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => onChange("")}
            className={`w-full rounded-lg px-2.5 py-1.5 text-left text-[11px] font-medium transition-all ${
              value === ""
                ? "bg-primary text-white shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
                className={`w-full rounded-lg px-2.5 py-1.5 text-left text-[11px] font-medium transition-all flex items-center gap-1.5 ${
                  isActive
                    ? `${colors.activeBg} ${colors.activeText} shadow-sm`
                    : `${colors.bg} ${colors.text} hover:opacity-80`
                }`}
              >
                <span className="truncate flex-1">{tag}</span>
                <span className={`text-[10px] ${isActive ? "opacity-80" : "opacity-60"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile: horizontal scroll strip */}
      <div className="sm:hidden -mx-1 overflow-x-auto pb-1">
        <div className="flex items-center gap-1.5 px-1">
          <button
            type="button"
            onClick={() => onChange("")}
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-all ${
              value === ""
                ? "bg-primary text-white shadow-sm"
                : "bg-muted/60 text-muted-foreground"
            }`}
          >
            All
          </button>
          {tags.map(([tag]) => {
            const colors = getTypeColor(tag);
            const isActive = value === tag;
            return (
              <button
                key={tag}
                type="button"
                onClick={() => onChange(isActive ? "" : tag)}
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-all shadow-sm ${
                  isActive
                    ? `${colors.activeBg} ${colors.activeText}`
                    : `${colors.bg} ${colors.text} hover:opacity-80`
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
