"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { searchSellers } from "@/lib/actions/sellers";
import type { Seller } from "@/lib/actions/sellers";

interface SellerAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SellerAutocomplete({
  value,
  onChange,
  placeholder = "Seller…",
  className = "",
}: SellerAutocompleteProps) {
  const [results, setResults] = useState<Seller[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    try {
      const data = await searchSellers(query);
      setResults(data);
      setIsOpen(data.length > 0);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      handleSearch(value);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, handleSearch]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(seller: Seller) {
    onChange(seller.name);
    setIsOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => {
          if (results.length > 0) setIsOpen(true);
        }}
        placeholder={placeholder}
        className={className}
      />
      {loading && (
        <span className="absolute right-2 top-1/2 -translate-y-1/2">
          <svg
            className="h-3 w-3 animate-spin text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        </span>
      )}

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-white shadow-lg max-h-40 overflow-y-auto">
          {results.map((seller) => (
            <button
              key={seller.id}
              type="button"
              onClick={() => handleSelect(seller)}
              className="flex w-full items-center px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted/50 border-b border-border/30 last:border-b-0"
            >
              {seller.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
