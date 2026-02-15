"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface InlineNumberInputProps {
  value: number;
  onChange: (value: number) => void;
  step?: string;
  min?: number;
  className?: string;
  prefix?: string;
  isInteger?: boolean;
}

export function InlineNumberInput({
  value,
  onChange,
  step = "0.01",
  min = 0,
  className = "",
  prefix = "",
  isInteger = false,
}: InlineNumberInputProps) {
  const [localValue, setLocalValue] = useState(String(value));
  const prevValueRef = useRef(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync local state when prop changes (parent revert or server revalidation)
  useEffect(() => {
    if (prevValueRef.current !== value) {
      prevValueRef.current = value;
      setLocalValue(String(value));
    }
  }, [value]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      setLocalValue(raw);
      const parsed = isInteger ? parseInt(raw, 10) : parseFloat(raw);
      if (!isNaN(parsed) && parsed >= min) {
        onChange(parsed);
      }
    },
    [onChange, min, isInteger]
  );

  const handleBlur = useCallback(() => {
    const parsed = isInteger ? parseInt(localValue, 10) : parseFloat(localValue);
    if (isNaN(parsed) || parsed < min) {
      // Revert display to current prop value
      setLocalValue(String(value));
    }
  }, [localValue, value, min, isInteger]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        setLocalValue(String(value));
        onChange(value);
        inputRef.current?.blur();
      }
    },
    [value, onChange]
  );

  return (
    <div className={`relative ${className}`}>
      {prefix && (
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
          {prefix}
        </span>
      )}
      <input
        ref={inputRef}
        type="number"
        step={step}
        min={min}
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`w-full rounded-md border border-border/60 bg-white py-1 text-sm text-foreground text-right focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 ${
          prefix ? "pl-5 pr-2" : "px-2"
        }`}
      />
    </div>
  );
}
