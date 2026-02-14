"use client";

import { useState, useRef, useEffect } from "react";

const PRESET_TAGS = [
  "Base",
  "Wheels",
  "Pedals",
  "Accessories",
  "Monitors",
  "PC Related",
  "Seats",
  "Motion",
] as const;

interface TypeTagPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export function TypeTagPicker({ value, onChange }: TypeTagPickerProps) {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const customInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showCustomInput) {
      customInputRef.current?.focus();
    }
  }, [showCustomInput]);

  function handleSelectTag(tag: string) {
    // Toggle: if already selected, deselect
    if (value === tag) {
      onChange("");
    } else {
      onChange(tag);
      setShowCustomInput(false);
    }
  }

  function handleAddCustom() {
    const trimmed = customValue.trim();
    if (trimmed) {
      onChange(trimmed);
      setCustomValue("");
      setShowCustomInput(false);
    }
  }

  const isCustom = value && !PRESET_TAGS.includes(value as typeof PRESET_TAGS[number]);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {PRESET_TAGS.map((tag) => (
        <button
          key={tag}
          type="button"
          onClick={() => handleSelectTag(tag)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
            value === tag
              ? "bg-primary text-white shadow-sm"
              : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          {tag}
        </button>
      ))}

      {/* Custom tag — show if selected and not a preset */}
      {isCustom && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-medium text-white shadow-sm"
        >
          {value}
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* Add custom tag */}
      {showCustomInput ? (
        <div className="flex items-center gap-1">
          <input
            ref={customInputRef}
            type="text"
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddCustom();
              }
              if (e.key === "Escape") {
                setShowCustomInput(false);
                setCustomValue("");
              }
            }}
            placeholder="Custom type…"
            className="w-24 rounded-full border border-border bg-white px-3 py-1 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
          />
          <button
            type="button"
            onClick={handleAddCustom}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary/20"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowCustomInput(true)}
          className="flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-border/60 text-muted-foreground/50 transition-all hover:border-primary/40 hover:text-primary"
          title="Add custom type"
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      )}

      {/* Hidden input to include value in form submission */}
      <input type="hidden" name="type" value={value} />
    </div>
  );
}
