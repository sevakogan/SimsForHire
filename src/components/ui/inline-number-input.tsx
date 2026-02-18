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
  /** Override the default text-foreground color on the input (e.g. "text-green-600") */
  textColorClass?: string;
}

export function InlineNumberInput({
  value,
  onChange,
  step = "0.01",
  min = 0,
  className = "",
  prefix = "",
  isInteger = false,
  textColorClass = "text-foreground",
}: InlineNumberInputProps) {
  const [localValue, setLocalValue] = useState(String(value));
  const [isFocused, setIsFocused] = useState(false);
  const prevValueRef = useRef(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync local state when prop changes (parent revert or server revalidation)
  useEffect(() => {
    if (prevValueRef.current !== value) {
      prevValueRef.current = value;
      setLocalValue(String(value));
    }
  }, [value]);

  // Allow digits, decimal point, and minus sign only
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      // Allow empty string for mid-edit, or valid numeric patterns
      if (raw === "" || raw === "-" || raw === "." || raw === "-.") {
        setLocalValue(raw);
        return;
      }
      // Only allow valid numeric characters
      if (isInteger && !/^-?\d*$/.test(raw)) return;
      if (!isInteger && !/^-?\d*\.?\d*$/.test(raw)) return;

      setLocalValue(raw);
      const parsed = isInteger ? parseInt(raw, 10) : parseFloat(raw);
      if (!isNaN(parsed) && parsed >= min) {
        onChange(parsed);
      }
    },
    [onChange, min, isInteger]
  );

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    const parsed = isInteger ? parseInt(localValue, 10) : parseFloat(localValue);
    if (isNaN(parsed) || parsed < min) {
      // Revert display to current prop value
      setLocalValue(String(value));
    }
  }, [localValue, value, min, isInteger]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    // Select all text on focus for easy replacement
    requestAnimationFrame(() => {
      inputRef.current?.select();
    });
  }, []);

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
        <span
          className={`absolute left-2 top-1/2 -translate-y-1/2 text-xs pointer-events-none transition-colors ${
            isFocused
              ? "text-primary"
              : textColorClass !== "text-foreground"
                ? `${textColorClass} opacity-60`
                : "text-muted-foreground/60"
          }`}
        >
          {prefix}
        </span>
      )}
      <input
        ref={inputRef}
        type="text"
        inputMode={isInteger ? "numeric" : "decimal"}
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        className={`w-full rounded-md border border-transparent bg-transparent py-1 text-sm ${textColorClass} text-right transition-all hover:border-border/60 hover:bg-white focus:border-primary/40 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary/40 ${
          prefix ? "pl-5 pr-2" : "px-2"
        }`}
      />
    </div>
  );
}
