"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export interface InlineSelectOption {
  label: string;
  value: string;
  description?: string;
}

interface InlineSelectProps {
  options: InlineSelectOption[];
  value: string;
  onChange: (value: string) => void;
  searchable?: boolean;
  placeholder?: string;
  label?: string;
  className?: string;
}

// Painel de opções abre ancorado logo abaixo do campo (em vez de um bottom
// sheet cobrindo a tela) — mesmo padrão de outras calculadoras de frete.
export function InlineSelect({
  options,
  value,
  onChange,
  searchable = false,
  placeholder = "Selecionar",
  label,
  className,
}: InlineSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
    <div ref={rootRef} className={cn("relative", className)}>
      {label && <label className="mb-1.5 block text-sm font-medium text-ink-secondary">{label}</label>}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center justify-between rounded-2xl border bg-surface px-4 py-3.5 text-left text-[15px] transition-colors",
          open ? "border-accent" : "border-divider hover:border-ink-tertiary"
        )}
      >
        <span className={selected ? "text-ink" : "text-ink-tertiary"}>
          {selected ? selected.label : placeholder}
        </span>
        {open ? (
          <ChevronUp size={16} strokeWidth={2} className="shrink-0 text-ink-secondary" />
        ) : (
          <ChevronDown size={16} strokeWidth={2} className="shrink-0 text-ink-secondary" />
        )}
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full z-30 mt-1.5 max-h-72 overflow-y-auto rounded-2xl border border-divider bg-surface py-2 shadow-card">
          {searchable && (
            <div className="px-3 pb-2">
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar..."
                className="w-full rounded-xl bg-surface-muted px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-tertiary"
              />
            </div>
          )}

          {!searchable && <p className="px-4 py-2 text-sm text-ink-tertiary">{placeholder}</p>}

          {filtered.length === 0 && (
            <p className="px-4 py-4 text-center text-sm text-ink-tertiary">Nenhum resultado encontrado</p>
          )}
          {filtered.map((option) => {
            const active = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={cn(
                  "flex w-full items-start justify-between gap-2 px-4 py-2.5 text-left text-[15px] transition-colors",
                  active ? "bg-accent/10 text-accent" : "text-ink hover:bg-surface-muted"
                )}
              >
                <span className="min-w-0">
                  <span className={cn("block", active && "font-medium")}>{option.label}</span>
                  {option.description && (
                    <span className={cn("mt-0.5 block text-xs", active ? "text-accent/80" : "text-ink-tertiary")}>
                      {option.description}
                    </span>
                  )}
                </span>
                {active && <Check size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-accent" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
