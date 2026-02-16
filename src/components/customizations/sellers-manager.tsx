"use client";

import { useState, useCallback } from "react";
import { createSeller, updateSeller, deleteSeller } from "@/lib/actions/sellers";
import type { Seller } from "@/lib/actions/sellers";
import { useRouter } from "next/navigation";

interface SellersManagerProps {
  sellers: Seller[];
}

export function SellersManager({ sellers: initialSellers }: SellersManagerProps) {
  const router = useRouter();
  const [sellers, setSellers] = useState(initialSellers);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const handleAdd = useCallback(async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;

    setAdding(true);
    setError(null);

    const result = await createSeller(trimmed);
    if (result.error) {
      setError(result.error);
      setAdding(false);
      return;
    }

    // Optimistic: add to local list
    setSellers((prev) => [
      ...prev,
      { id: result.id!, name: trimmed, created_at: new Date().toISOString() },
    ].sort((a, b) => a.name.localeCompare(b.name)));
    setNewName("");
    setAdding(false);
    router.refresh();
  }, [newName, router]);

  const handleUpdate = useCallback(
    async (id: string) => {
      const trimmed = editingName.trim();
      if (!trimmed) return;

      setError(null);
      const result = await updateSeller(id, trimmed);
      if (result.error) {
        setError(result.error);
        return;
      }

      setSellers((prev) =>
        prev
          .map((s) => (s.id === id ? { ...s, name: trimmed } : s))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      setEditingId(null);
      setEditingName("");
      router.refresh();
    },
    [editingName, router]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm("Delete this seller?")) return;

      setError(null);
      setSellers((prev) => prev.filter((s) => s.id !== id));
      const result = await deleteSeller(id);
      if (result.error) {
        setError(result.error);
      }
      router.refresh();
    },
    [router]
  );

  const startEditing = useCallback((seller: Seller) => {
    setEditingId(seller.id);
    setEditingName(seller.name);
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingId(null);
    setEditingName("");
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">
          Sellers / Merchants
        </h2>
        <p className="text-xs text-muted-foreground mb-4">
          Manage the list of sellers that appear as autocomplete suggestions when adding products or items.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Add new seller */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder="Add new seller…"
          className="flex-1 rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={adding || !newName.trim()}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          {adding ? "Adding…" : "Add"}
        </button>
      </div>

      {/* Sellers list */}
      {sellers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-6 text-center">
          <p className="text-sm text-muted-foreground">
            No sellers yet. Add one above to get started.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-white overflow-hidden">
          {sellers.map((seller, idx) => (
            <div
              key={seller.id}
              className={`flex items-center gap-3 px-4 py-3 ${
                idx < sellers.length - 1 ? "border-b border-border/50" : ""
              }`}
            >
              {editingId === seller.id ? (
                <>
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleUpdate(seller.id);
                      }
                      if (e.key === "Escape") cancelEditing();
                    }}
                    autoFocus
                    className="flex-1 rounded-md border border-primary/40 bg-white px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                  />
                  <button
                    type="button"
                    onClick={() => handleUpdate(seller.id)}
                    className="rounded-md p-1.5 text-green-600 transition-all hover:bg-green-50"
                    title="Save"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={cancelEditing}
                    className="rounded-md p-1.5 text-red-500 transition-all hover:bg-red-50"
                    title="Cancel"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm text-foreground">{seller.name}</span>
                  <button
                    type="button"
                    onClick={() => startEditing(seller)}
                    className="rounded-md p-1.5 text-muted-foreground/60 transition-all hover:bg-primary/10 hover:text-primary"
                    title="Edit"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(seller.id)}
                    className="rounded-md p-1.5 text-muted-foreground/40 transition-all hover:bg-destructive/10 hover:text-destructive"
                    title="Delete"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
