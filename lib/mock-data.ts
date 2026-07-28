// Store local em memória pra /calcular, /historico e /resumo funcionarem
// sem Supabase conectado ainda. Persiste entre navegações client-side
// (o módulo continua carregado) mas reseta pro estado inicial quando a
// página é recarregada de verdade (F5) — isso é esperado por enquanto.
//
// TODO: quando o Supabase estiver conectado de verdade, apagar este
// arquivo inteiro e trocar cada chamada (listarViagensMock/
// adicionarViagemMock/removerViagemMock) pela query/insert/delete real —
// os pontos exatos já estão marcados com "TODO: trocar por Supabase aqui"
// em app/(app)/historico/page.tsx, app/(app)/resumo/page.tsx e
// app/(app)/calcular/page.tsx.

import { calcularCustosPadrao, VALORES_MEDIOS_PADRAO, type TruckTypeId } from "./calculo-custos";

export interface Viagem {
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

interface ViagemSeed {
  origem: string | null;
  destino: string | null;
  distanciaKm: number;
  tipoCaminhao: TruckTypeId;
  frete: number;
  /** meses antes do mês atual (0 = mês atual) */
  mesesAtras: number;
  diaDoMes: number;
}

function construirViagem(id: string, seed: ViagemSeed): Viagem {
  const custos = calcularCustosPadrao(seed.distanciaKm, seed.tipoCaminhao, VALORES_MEDIOS_PADRAO);
  const custoTotal = custos.diesel + custos.pedagio + custos.manutencao + custos.alimentacao;
  const hoje = new Date();
  const createdAt = new Date(
    hoje.getFullYear(),
    hoje.getMonth() - seed.mesesAtras,
    seed.diaDoMes,
    10,
    30
  ).toISOString();

  return {
    id,
    origem: seed.origem,
    destino: seed.destino,
    distancia_km: seed.distanciaKm,
    tipo_caminhao: seed.tipoCaminhao,
    valor_frete: seed.frete,
    custo_diesel: custos.diesel,
    custo_pedagio: custos.pedagio,
    custo_manutencao: custos.manutencao,
    custo_alimentacao: custos.alimentacao,
    custo_total: Math.round(custoTotal * 100) / 100,
    lucro: Math.round((seed.frete - custoTotal) * 100) / 100,
    created_at: createdAt,
  };
}

const VIAGENS_SEED: ViagemSeed[] = [
  {
    origem: "São Paulo",
    destino: "Rio de Janeiro",
    distanciaKm: 451,
    tipoCaminhao: "truck",
    frete: 3500,
    mesesAtras: 0,
    diaDoMes: 4,
  },
  {
    origem: "Curitiba",
    destino: "Florianópolis",
    distanciaKm: 300,
    tipoCaminhao: "toco",
    frete: 900,
    mesesAtras: 0,
    diaDoMes: 11,
  },
  {
    origem: null,
    destino: null,
    distanciaKm: 180,
    tipoCaminhao: "carreta",
    frete: 400,
    mesesAtras: 0,
    diaDoMes: 18,
  },
  {
    origem: "Belo Horizonte",
    destino: "Brasília",
    distanciaKm: 740,
    tipoCaminhao: "bitrem",
    frete: 4200,
    mesesAtras: 1,
    diaDoMes: 6,
  },
  {
    origem: "Salvador",
    destino: "Recife",
    distanciaKm: 680,
    tipoCaminhao: "truck",
    frete: 1400,
    mesesAtras: 1,
    diaDoMes: 20,
  },
  {
    origem: "Rio de Janeiro",
    destino: "São Paulo",
    distanciaKm: 429,
    tipoCaminhao: "toco",
    frete: 1900,
    mesesAtras: 2,
    diaDoMes: 3,
  },
  {
    origem: null,
    destino: null,
    distanciaKm: 210,
    tipoCaminhao: "toco",
    frete: 620,
    mesesAtras: 2,
    diaDoMes: 15,
  },
  {
    origem: "Curitiba",
    destino: "São Paulo",
    distanciaKm: 408,
    tipoCaminhao: "carreta",
    frete: 900,
    mesesAtras: 2,
    diaDoMes: 24,
  },
];

let viagens: Viagem[] = VIAGENS_SEED.map((seed, index) => construirViagem(`mock-${index + 1}`, seed));

// Mais recente primeiro, igual à ordenação que a query real do Supabase usa.
function ordenar(lista: Viagem[]): Viagem[] {
  return [...lista].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function listarViagensMock(): Viagem[] {
  return ordenar(viagens);
}

export function adicionarViagemMock(viagem: Omit<Viagem, "id" | "created_at">): Viagem {
  const nova: Viagem = {
    ...viagem,
    id: `mock-${Date.now()}`,
    created_at: new Date().toISOString(),
  };
  viagens = [nova, ...viagens];
  return nova;
}

export function removerViagemMock(id: string): void {
  viagens = viagens.filter((v) => v.id !== id);
}
