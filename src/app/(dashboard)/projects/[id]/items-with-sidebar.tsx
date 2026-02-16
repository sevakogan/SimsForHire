"use client";

import { useState } from "react";
import { TagSidebar } from "@/components/items/tag-sidebar";
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
    <div className="flex gap-4 items-start">
      {/* Tag sidebar — left */}
      <TagSidebar items={items} value={tagFilter} onChange={setTagFilter} />

      {/* Items table — right, flex-1 */}
      <div className="flex-1 min-w-0">
        <ItemsTable
          items={items}
          projectId={projectId}
          isAdmin={isAdmin}
          unreadNoteCount={unreadNoteCount}
          readOnly={readOnly}
          tagFilter={tagFilter}
          onTagFilterChange={setTagFilter}
        />
      </div>
    </div>
  );
}
