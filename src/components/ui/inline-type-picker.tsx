"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { PRESET_PRODUCT_TYPES } from "@/lib/constants/product-types";

interface InlineTypePickerProps {
  value: string;
  onSave: (value: string) => void;
}

export function InlineTypePicker({ value, onSave }: InlineTypePickerProps) {
  const [open, setOpen] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const customInputRef = useRef<HTMLInputElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  // Position popover using fixed coordinates
  useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 4,
        left: rect.left,
      });
    }
  }, [open]);

  // Focus custom input when visible
  useEffect(() => {
    if (open && customInputRef.current) {
      // Delay to let popover render
      const t = setTimeout(() => customInputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Click outside to close
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setCustomValue("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleSelect = useCallback(
    (tag: string) => {
      // Toggle: clicking current value clears it
      const newValue = tag === value ? "" : tag;
      onSave(newValue);
      setOpen(false);
      setCustomValue("");
    },
    [onSave, value]
  );

  const handleCustomSubmit = useCallback(() => {
    const trimmed = customValue.trim();
    if (trimmed) {
      onSave(trimmed);
      setOpen(false);
      setCustomValue("");
    }
  }, [customValue, onSave]);

  const isCustom =
    value && !PRESET_PRODUCT_TYPES.includes(value as (typeof PRESET_PRODUCT_TYPES)[number]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium transition-all ${
          value
            ? "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            : "text-muted-foreground/40 hover:text-muted-foreground"
        }`}
      >
        {value || "--"}
      </button>

      {open && (
        <div
          ref={popoverRef}
          className="fixed z-[100] rounded-xl border border-border bg-white p-3 shadow-xl shadow-black/10 animate-fade-in"
          style={{ top: position.top, left: position.left, minWidth: 240 }}
        >
          <div className="flex flex-wrap gap-1.5">
            {PRESET_PRODUCT_TYPES.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleSelect(tag)}
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-all ${
                  value === tag
                    ? "bg-primary text-white shadow-sm"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {tag}
              </button>
            ))}

            {/* Show custom value as selected pill if it's not a preset */}
            {isCustom && (
              <button
                type="button"
                onClick={() => handleSelect(value)}
                className="flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-medium text-white shadow-sm"
              >
                {value}
                <svg
                  className="h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18 18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Custom input */}
          <div className="mt-2 flex items-center gap-1">
            <input
              ref={customInputRef}
              type="text"
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleCustomSubmit();
                }
                if (e.key === "Escape") {
                  setOpen(false);
                  setCustomValue("");
                }
              }}
              placeholder="Custom type…"
              className="w-full rounded-full border border-border bg-white px-2.5 py-0.5 text-[11px] text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
            />
            {customValue.trim() && (
              <button
                type="button"
                onClick={handleCustomSubmit}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary/20"
              >
                <svg
                  className="h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m4.5 12.75 6 6 9-13.5"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
