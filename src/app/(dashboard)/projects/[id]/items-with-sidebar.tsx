"use client";

import { useState } from "react";
import { TagFilterPills } from "@/components/items/tag-sidebar";
import { ItemsTable } from "@/components/items/items-table";
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
  const [tagFilter, setTagFilter] = useState("");

  return (
    <div className="space-y-3">
      {/* Items table */}
      <ItemsTable
        items={items}
        projectId={projectId}
        isAdmin={isAdmin}
        unreadNoteCount={unreadNoteCount}
        readOnly={readOnly}
        tagFilter={tagFilter}
        onTagFilterChange={setTagFilter}
      />

      {/* Tag filter pills — below the table */}
      <TagFilterPills items={items} value={tagFilter} onChange={setTagFilter} />
    </div>
  );
}
