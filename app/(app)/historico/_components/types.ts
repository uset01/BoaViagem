import type { CustoKey, TruckTypeId } from "@/lib/calculo-custos";

export interface ViagemRow {
  id: string;
  origem: string | null;
  destino: string | null;
  distancia_km: number;
  tipo_caminhao: TruckTypeId;
  valor_frete: number;
  custo_diesel: number;
  custo_pedagio: number;
  custo_manutencao: number;
  custo_alimentacao: number;
  custo_total: number;
  lucro: number;
  created_at: string;
}

export function trechoLabel(viagem: Pick<ViagemRow, "origem" | "destino" | "distancia_km">): string {
  if (viagem.origem && viagem.destino) {
    return `${viagem.origem} → ${viagem.destino}`;
  }
  return `Viagem de ${viagem.distancia_km} km`;
}

export function viagemParaCustos(viagem: ViagemRow): Record<CustoKey, number> {
  return {
    diesel: viagem.custo_diesel,
    pedagio: viagem.custo_pedagio,
    manutencao: viagem.custo_manutencao,
    alimentacao: viagem.custo_alimentacao,
  };
}
