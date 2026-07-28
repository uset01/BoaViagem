"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

interface AutocompleteInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  className?: string;
  "aria-label"?: string;
}

const MIN_CHARS = 2;
const MAX_SUGESTOES = 6;

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

// Campo de texto livre com sugestões — diferente de um <select>, nunca
// trava o usuário a escolher uma opção da lista: ele pode ignorar as
// sugestões e seguir digitando qualquer coisa.
export function AutocompleteInput({
  label,
  value,
  onChange,
  suggestions,
  placeholder,
  className,
  ...rest
}: AutocompleteInputProps) {
  const [open, setOpen] = useState(false);

  const filtradas = useMemo(() => {
    const query = normalizar(value);
    if (query.length < MIN_CHARS) return [];
    return suggestions.filter((s) => normalizar(s).includes(query)).slice(0, MAX_SUGESTOES);
  }, [value, suggestions]);

  function handleSelect(sugestao: string) {
    onChange(sugestao);
    setOpen(false);
  }

  return (
    <div className={cn("relative", className)}>
      {label && <label className="mb-1.5 block text-sm font-medium text-ink-secondary">{label}</label>}
      <input
        type="text"
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        placeholder={placeholder}
        aria-label={rest["aria-label"]}
        autoComplete="off"
        className="w-full rounded-2xl border border-divider bg-surface px-4 py-3.5 text-[15px] text-ink outline-none placeholder:text-ink-tertiary"
      />
      {open && filtradas.length > 0 && (
        <div className="absolute inset-x-0 top-full z-30 mt-1.5 overflow-hidden rounded-2xl bg-surface shadow-card">
          {filtradas.map((sugestao) => (
            <button
              key={sugestao}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => handleSelect(sugestao)}
              className="block w-full px-4 py-3 text-left text-[15px] text-ink transition-colors hover:bg-surface-muted"
            >
              {sugestao}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
