"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { parseMoney } from "@/lib/format";

interface MoneyFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  large?: boolean;
  className?: string;
  "aria-label"?: string;
}

export function MoneyField({
  value,
  onChange,
  placeholder = "0,00",
  large = false,
  className,
  ...rest
}: MoneyFieldProps) {
  const [pulseFlip, setPulseFlip] = useState(false);
  const hasValue = parseMoney(value) > 0;

  function handleChange(next: string) {
    onChange(next);
    setPulseFlip((flip) => !flip);
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-2xl border border-divider bg-surface px-4",
        large ? "py-4" : "py-2.5",
        className
      )}
    >
      <span className={cn("shrink-0 font-bold text-ink-tertiary", large ? "text-2xl" : "text-sm")}>
        R$
      </span>
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(event) => handleChange(event.target.value)}
        placeholder={placeholder}
        aria-label={rest["aria-label"]}
        className={cn(
          "w-full min-w-0 bg-transparent outline-none transition-colors duration-200 placeholder:text-ink-tertiary",
          hasValue ? "text-ink" : "text-ink-secondary",
          hasValue && (pulseFlip ? "animate-number-pulse-a" : "animate-number-pulse-b"),
          large ? "text-2xl font-extrabold" : "text-right text-[15px] font-semibold"
        )}
      />
    </div>
  );
}
