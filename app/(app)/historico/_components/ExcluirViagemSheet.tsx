"use client";

import { BottomSheet } from "@/components/ui/BottomSheet";
import { trechoLabel, type ViagemRow } from "./types";

interface ExcluirViagemSheetProps {
  open: boolean;
  viagem: ViagemRow | null;
  deleting: boolean;
  error: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ExcluirViagemSheet({
  open,
  viagem,
  deleting,
  error,
  onClose,
  onConfirm,
}: ExcluirViagemSheetProps) {
  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className="px-5 pb-6 pt-3">
        <p className="text-center text-[15px] font-semibold text-ink">Excluir essa viagem?</p>
        {viagem && (
          <p className="mt-1 text-center text-sm text-ink-secondary">
            {trechoLabel(viagem)} — essa ação não pode ser desfeita.
          </p>
        )}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full bg-surface-muted py-3 text-sm font-semibold text-ink-secondary"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 rounded-full bg-danger py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
          >
            {deleting ? "Excluindo..." : "Excluir"}
          </button>
        </div>

        {error && (
          <p className="mt-3 text-center text-sm text-danger">
            Não foi possível excluir agora. Tente novamente.
          </p>
        )}
      </div>
    </BottomSheet>
  );
}
