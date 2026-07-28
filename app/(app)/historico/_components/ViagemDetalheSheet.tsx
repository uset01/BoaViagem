"use client";

import { BottomSheet } from "@/components/ui/BottomSheet";
import { ResultadoCard, type ResultadoCalculo } from "@/components/ResultadoCard";
import { getTruckType } from "@/lib/calculo-custos";
import { trechoLabel, viagemParaCustos, type ViagemRow } from "./types";

interface ViagemDetalheSheetProps {
  open: boolean;
  viagem: ViagemRow | null;
  onClose: () => void;
}

function viagemParaResultado(viagem: ViagemRow): ResultadoCalculo {
  const truck = getTruckType(viagem.tipo_caminhao);
  return {
    trecho: trechoLabel(viagem),
    distanciaKm: viagem.distancia_km,
    truckLabel: truck.label,
    eixos: truck.eixos,
    frete: viagem.valor_frete,
    custos: viagemParaCustos(viagem),
    custoTotal: viagem.custo_total,
    lucro: viagem.lucro,
  };
}

export function ViagemDetalheSheet({ open, viagem, onClose }: ViagemDetalheSheetProps) {
  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className="max-h-[80vh] overflow-y-auto px-5 pb-6 pt-3">
        {viagem && <ResultadoCard resultado={viagemParaResultado(viagem)} readOnly />}
      </div>
    </BottomSheet>
  );
}
