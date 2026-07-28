"use client";

import { Card } from "@/components/ui/Card";
import { IconCircle } from "@/components/ui/IconCircle";
import { RouteIcon, TrashIcon } from "@/components/icons";
import { formatBRL, formatDateBR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { trechoLabel, type ViagemRow } from "./types";

interface ViagemCardProps {
  viagem: ViagemRow;
  onAbrir: (viagem: ViagemRow) => void;
  onExcluir: (viagem: ViagemRow) => void;
}

export function ViagemCard({ viagem, onAbrir, onExcluir }: ViagemCardProps) {
  const trecho = trechoLabel(viagem);
  const temCidade = Boolean(viagem.origem && viagem.destino);
  const lucrativo = viagem.lucro >= 0;

  return (
    <Card padding="p-4" className="flex items-center gap-3">
      <button type="button" onClick={() => onAbrir(viagem)} className="flex min-w-0 flex-1 items-center gap-3">
        <IconCircle
          icon={
            temCidade ? (
              <span className="text-[13px] font-bold">{viagem.origem![0].toUpperCase()}</span>
            ) : (
              <RouteIcon />
            )
          }
        />
        <div className="min-w-0 flex-1 text-left">
          <p className="truncate text-sm font-semibold text-ink">{trecho}</p>
          <p className="truncate text-xs text-ink-secondary">
            {formatDateBR(viagem.created_at)} · {formatBRL(viagem.valor_frete)}
          </p>
        </div>
      </button>

      <div className="flex shrink-0 flex-col items-end gap-2">
        <span
          className={cn(
            "whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold",
            lucrativo ? "bg-success-bg text-success" : "bg-danger-bg text-danger"
          )}
        >
          {lucrativo ? "+" : "− "}
          {formatBRL(Math.abs(viagem.lucro))}
        </span>
        <button
          type="button"
          onClick={() => onExcluir(viagem)}
          aria-label="Excluir viagem"
          className="p-0.5 text-ink-secondary transition-colors hover:text-danger"
        >
          <TrashIcon />
        </button>
      </div>
    </Card>
  );
}
