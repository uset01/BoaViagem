"use client";

import { BottomSheet } from "@/components/ui/BottomSheet";

interface CancelarAssinaturaSheetProps {
  open: boolean;
  cancelando: boolean;
  erro: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function CancelarAssinaturaSheet({
  open,
  cancelando,
  erro,
  onClose,
  onConfirm,
}: CancelarAssinaturaSheetProps) {
  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className="px-5 pb-6 pt-3">
        <p className="text-center text-[15px] font-semibold text-ink">Cancelar sua assinatura?</p>
        <p className="mt-1 text-center text-sm text-ink-secondary">
          Isso cancela a cobrança e exclui sua conta e todo o histórico de viagens permanentemente — essa ação não
          pode ser desfeita.
        </p>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={cancelando}
            className="flex-1 rounded-full bg-surface-muted py-3 text-sm font-semibold text-ink-secondary disabled:opacity-60"
          >
            Voltar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={cancelando}
            className="flex-1 rounded-full bg-danger py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
          >
            {cancelando ? "Cancelando..." : "Cancelar assinatura"}
          </button>
        </div>

        {erro && <p className="mt-3 text-center text-sm text-danger">{erro}</p>}
      </div>
    </BottomSheet>
  );
}
