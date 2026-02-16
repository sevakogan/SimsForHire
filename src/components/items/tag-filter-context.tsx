"use client";

import { createContext, useContext, useState, useMemo, type ReactNode } from "react";

interface TagFilterContextValue {
  /** All unique tags with counts from current items */
  tags: ReadonlyArray<readonly [string, number]>;
  /** Total item count */
  totalItems: number;
  /** Currently selected tag filter (empty string = all) */
  tagFilter: string;
  /** Set the tag filter */
  setTagFilter: (value: string) => void;
  /** Register items so the sidebar can display tags */
  registerItems: (items: ReadonlyArray<{ item_type: string }>) => void;
}

const TagFilterContext = createContext<TagFilterContextValue | null>(null);

export function TagFilterProvider({ children }: { children: ReactNode }) {
  const [tagFilter, setTagFilter] = useState("");
  const [items, setItems] = useState<ReadonlyArray<{ item_type: string }>>([]);

  const tags = useMemo(() => {
    const tagCounts = new Map<string, number>();
    for (const item of items) {
      const t = item.item_type;
      if (t && t.length > 0) {
        tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
      }
    }
    return [...tagCounts.entries()].sort((a, b) => a[0].localeCompare(b[0])) as ReadonlyArray<readonly [string, number]>;
  }, [items]);

  const value = useMemo(
    () => ({
      tags,
      totalItems: items.length,
      tagFilter,
      setTagFilter,
      registerItems: setItems,
    }),
    [tags, items.length, tagFilter]
  );

  return (
    <TagFilterContext.Provider value={value}>
      {children}
    </TagFilterContext.Provider>
  );
}

export function useTagFilter() {
  const ctx = useContext(TagFilterContext);
  if (!ctx) {
    throw new Error("useTagFilter must be used within TagFilterProvider");
  }
  return ctx;
}

/** Safe hook that returns null when outside the provider (e.g., non-project pages) */
export function useTagFilterSafe() {
  return useContext(TagFilterContext);
}
