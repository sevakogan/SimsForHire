"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface InlineTextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  /** If true, reverts to original on blur when empty */
  required?: boolean;
}

export function InlineTextInput({
  value,
  onChange,
  placeholder = "--",
  className = "",
  required = false,
}: InlineTextInputProps) {
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevValueRef = useRef(value);

  // Sync local state when prop changes (parent revert or server revalidation)
  useEffect(() => {
    if (prevValueRef.current !== value) {
      prevValueRef.current = value;
      setLocalValue(value);
    }
  }, [value]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      setLocalValue(raw);
      const trimmed = raw.trim();
      if (required && !trimmed) return;
      onChange(trimmed);
    },
    [onChange, required]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        setLocalValue(value);
        onChange(value);
        inputRef.current?.blur();
      }
    },
    [value, onChange]
  );

  return (
    <input
      ref={inputRef}
      type="text"
      value={localValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      className={`w-full rounded-md border border-transparent bg-transparent py-1 px-2 text-sm text-foreground placeholder:text-muted-foreground/40 hover:border-border/60 focus:border-primary/40 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary/40 ${className}`}
    />
  );
}
