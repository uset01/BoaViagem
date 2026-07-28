"use client";

import { cn } from "@/lib/utils";

export interface SegmentedControlOption {
  label: string;
  value: string;
}

interface SegmentedControlProps {
  options: SegmentedControlOption[];
  value: string;
  onChange: (value: string) => void;
  variant?: "surface" | "accent";
  className?: string;
}

export function SegmentedControl({
  options,
  value,
  onChange,
  variant = "surface",
  className,
}: SegmentedControlProps) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex items-center rounded-full bg-surface-muted p-1",
        className
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex-1 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
              active
                ? variant === "accent"
                  ? "bg-accent text-white shadow-inner"
                  : "bg-surface text-ink shadow-inner"
                : "bg-transparent text-ink-secondary"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
