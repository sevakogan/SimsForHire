"use client";

import { useEffect } from "react";
import { ItemsTable } from "@/components/items/items-table";
import { useTagFilter } from "@/components/items/tag-filter-context";
import type { Item, ClientItem } from "@/types";

interface ItemsWithSidebarProps {
  items: (Item | ClientItem)[];
  projectId: string;
  isAdmin: boolean;
  unreadNoteCount: number;
  readOnly: boolean;
}

export function ItemsWithSidebar({
  items,
  projectId,
  isAdmin,
  unreadNoteCount,
  readOnly,
}: ItemsWithSidebarProps) {
  const { tagFilter, setTagFilter, registerItems } = useTagFilter();

  // Register items with the context so the sidebar can show tag pills
  useEffect(() => {
    registerItems(items);
  }, [items, registerItems]);

  return (
    <ItemsTable
      items={items}
      projectId={projectId}
      isAdmin={isAdmin}
      unreadNoteCount={unreadNoteCount}
      readOnly={readOnly}
      tagFilter={tagFilter}
      onTagFilterChange={setTagFilter}
    />
  );
}
