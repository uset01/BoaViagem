// Tabela de exemplo (R$/km por número de eixos) — NÃO é a tabela oficial.
// Antes de usar em produção, atualizar com os valores vigentes da
// Resolução ANTT de piso mínimo de frete (https://www.gov.br/antt).
const PISO_POR_KM_POR_EIXO: Record<number, number> = {
  2: 2.3,
  3: 2.8,
  5: 3.5,
  7: 4.3,
};

const PISO_POR_KM_PADRAO = PISO_POR_KM_POR_EIXO[2];

export function calcularPisoAntt(km: number, eixos: number): number {
  if (!km || km <= 0) return 0;
  const pisoPorKm = PISO_POR_KM_POR_EIXO[eixos] ?? PISO_POR_KM_PADRAO;
  return Math.round(km * pisoPorKm * 100) / 100;
}
