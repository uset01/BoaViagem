export type TruckTypeId = "toco" | "truck" | "carreta" | "bitrem" | "rodotrem";

export interface TruckType {
  id: TruckTypeId;
  label: string;
  eixos: number;
  consumoKmPorLitro: number;
  iconSrc: string;
}

export const TRUCK_TYPES: TruckType[] = [
  { id: "toco", label: "Toco", eixos: 2, consumoKmPorLitro: 8, iconSrc: "/icones/toco.png" },
  { id: "truck", label: "Truck", eixos: 3, consumoKmPorLitro: 6, iconSrc: "/icones/truck.png" },
  { id: "carreta", label: "Carreta", eixos: 5, consumoKmPorLitro: 3.2, iconSrc: "/icones/carreta.png" },
  { id: "bitrem", label: "Bitrem", eixos: 7, consumoKmPorLitro: 2.6, iconSrc: "/icones/bitrem.png" },
  { id: "rodotrem", label: "Rodotrem", eixos: 9, consumoKmPorLitro: 2.3, iconSrc: "/icones/rodotrem.png" },
];

export function getTruckType(id: TruckTypeId): TruckType {
  return TRUCK_TYPES.find((t) => t.id === id) ?? TRUCK_TYPES[1];
}

export interface ValoresMedios {
  precoDiesel: number;
  pedagioPorKmPorEixo: number;
  manutencaoPorKm: number;
  alimentacaoPorDia: number;
  kmPorDia: number;
}

export const VALORES_MEDIOS_PADRAO: ValoresMedios = {
  precoDiesel: 6.1,
  pedagioPorKmPorEixo: 0.09,
  manutencaoPorKm: 0.35,
  alimentacaoPorDia: 70,
  kmPorDia: 500,
};

export type CustoKey = "diesel" | "pedagio" | "manutencao" | "alimentacao";

export const CUSTO_LABELS: Record<CustoKey, string> = {
  diesel: "Diesel",
  pedagio: "Pedágio",
  manutencao: "Manutenção",
  alimentacao: "Alimentação",
};

function arredondar(valor: number) {
  return Math.round(valor * 100) / 100;
}

export function calcularCustosPadrao(
  km: number,
  truckTypeId: TruckTypeId,
  valoresMedios: ValoresMedios
): Record<CustoKey, number> {
  if (!km || km <= 0) {
    return { diesel: 0, pedagio: 0, manutencao: 0, alimentacao: 0 };
  }

  const truck = getTruckType(truckTypeId);
  const diesel = (km / truck.consumoKmPorLitro) * valoresMedios.precoDiesel;
  const pedagio = km * valoresMedios.pedagioPorKmPorEixo * truck.eixos;
  const manutencao = km * valoresMedios.manutencaoPorKm;
  const dias = Math.max(1, Math.ceil(km / valoresMedios.kmPorDia));
  const alimentacao = dias * valoresMedios.alimentacaoPorDia;

  return {
    diesel: arredondar(diesel),
    pedagio: arredondar(pedagio),
    manutencao: arredondar(manutencao),
    alimentacao: arredondar(alimentacao),
  };
}
