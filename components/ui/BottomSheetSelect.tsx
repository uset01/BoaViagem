"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { BottomSheet } from "./BottomSheet";

export interface BottomSheetSelectOption {
  label: string;
  value: string;
}

interface BottomSheetSelectProps {
  options: BottomSheetSelectOption[];
  value: string;
  onChange: (value: string) => void;
  searchable?: boolean;
  placeholder?: string;
  label?: string;
  className?: string;
}

export function BottomSheetSelect({
  options,
  value,
  onChange,
  searchable = false,
  placeholder = "Selecionar",
  label,
  className,
}: BottomSheetSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const selected = options.find((option) => option.value === value);

  const filtered = useMemo(() => {
    if (!searchable || !query.trim()) return options;
    const q = query.trim().toLowerCase();
    return options.filter((option) => option.label.toLowerCase().includes(q));
  }, [options, query, searchable]);

  function handleSelect(nextValue: string) {
    onChange(nextValue);
    setOpen(false);
  }

  return (
    <div className={className}>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-ink-secondary">{label}</label>
      )}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between rounded-2xl border border-divider bg-surface px-4 py-3.5 text-left text-[15px] transition-colors hover:border-ink-tertiary"
      >
        <span className={selected ? "text-ink" : "text-ink-tertiary"}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={16} strokeWidth={2} className="shrink-0 text-ink-secondary" />
      </button>

      <BottomSheet open={open} onClose={() => setOpen(false)}>
        {searchable && (
          <div className="px-5 pt-4">
            <input
              autoFocus={open}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar..."
              className="w-full rounded-2xl bg-surface-muted px-4 py-3 text-[15px] text-ink outline-none placeholder:text-ink-tertiary"
            />
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
          {filtered.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-ink-tertiary">
              Nenhum resultado encontrado
            </p>
          )}
          {filtered.map((option) => {
            const active = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={cn(
                  "flex w-full items-center justify-between rounded-2xl px-4 py-3.5 text-left text-[15px] transition-colors",
                  active ? "bg-accent/10 font-medium text-accent" : "text-ink hover:bg-surface-muted"
                )}
              >
                {option.label}
                {active && <Check size={16} strokeWidth={2} className="shrink-0 text-accent" />}
              </button>
            );
          })}
        </div>
      </BottomSheet>
    </div>
  );
}
