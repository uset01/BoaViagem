// Tabela oficial de piso mínimo de frete da ANTT (Resolução ANTT Nº 6.084),
// transcrita a partir das tabelas A/B/C/D enviadas em 2026-08-03.
//
// ATENÇÃO: transcrição manual de ~150 valores a partir de imagens — antes de
// usar isso pra decisões reais de frete, confira os valores abaixo contra a
// fonte oficial (gov.br/antt), especialmente as células marcadas "REVISAR"
// (onde o alinhamento de colunas na imagem ficou ambíguo).

export type TabelaAntt = "A" | "B" | "C" | "D";

export const TABELAS_ANTT: Record<TabelaAntt, { label: string; descricao: string }> = {
  A: {
    label: "Tabela A",
    descricao: "Cavalo e carreta do contratado — o transportador usa seu próprio veículo e implemento rodoviário.",
  },
  B: {
    label: "Tabela B",
    descricao: "Somente carreta do contratante — o transportador usa apenas seu veículo, e o implemento é fornecido pelo contratante.",
  },
  C: {
    label: "Tabela C",
    descricao: "Alto desempenho, cavalo e carreta — o transportador usa seu próprio veículo e implemento, em operação de alto desempenho.",
  },
  D: {
    label: "Tabela D",
    descricao: "Alto desempenho, carreta do contratante — o transportador usa apenas seu veículo, e o implemento é do contratante, em operação de alto desempenho.",
  },
};

export type TipoCargaAntt =
  | "granel_solido"
  | "granel_liquido"
  | "frigorificada"
  | "conteinerizada"
  | "carga_geral"
  | "neogranel"
  | "perigosa_granel_solido"
  | "perigosa_granel_liquido"
  | "perigosa_frigorificada"
  | "perigosa_conteinerizada"
  | "perigosa_carga_geral"
  | "carga_granel_pressurizada";

export const TIPOS_CARGA_ANTT: { id: TipoCargaAntt; label: string }[] = [
  { id: "granel_solido", label: "Granel sólido" },
  { id: "granel_liquido", label: "Granel líquido" },
  { id: "frigorificada", label: "Frigorificada ou Aquecida" },
  { id: "conteinerizada", label: "Conteinerizada" },
  { id: "carga_geral", label: "Carga Geral" },
  { id: "neogranel", label: "Neogranel" },
  { id: "perigosa_granel_solido", label: "Perigosa (granel sólido)" },
  { id: "perigosa_granel_liquido", label: "Perigosa (granel líquido)" },
  { id: "perigosa_frigorificada", label: "Perigosa (frigorificada ou aquecida)" },
  { id: "perigosa_conteinerizada", label: "Perigosa (conteinerizada)" },
  { id: "perigosa_carga_geral", label: "Perigosa (carga geral)" },
  { id: "carga_granel_pressurizada", label: "Carga Granel Pressurizada" },
];

// Colunas de eixos presentes nas 4 tabelas (note: não existe coluna "8").
export const EIXOS_ANTT = [2, 3, 4, 5, 6, 7, 9] as const;
export type EixosAntt = (typeof EIXOS_ANTT)[number];

interface Coeficiente {
  /** Deslocamento (CCD) — R$ por km, por número de eixos. null = combinação não prevista na tabela. */
  ccdPorKm: Record<EixosAntt, number | null>;
  /** Carga e descarga (CC) — valor fixo em R$, por número de eixos. */
  ccFixo: Record<EixosAntt, number | null>;
}

function linha(
  ccd: [number | null, number | null, number | null, number | null, number | null, number | null, number | null],
  cc: [number | null, number | null, number | null, number | null, number | null, number | null, number | null]
): Coeficiente {
  const [c2, c3, c4, c5, c6, c7, c9] = ccd;
  const [f2, f3, f4, f5, f6, f7, f9] = cc;
  return {
    ccdPorKm: { 2: c2, 3: c3, 4: c4, 5: c5, 6: c6, 7: c7, 9: c9 },
    ccFixo: { 2: f2, 3: f3, 4: f4, 5: f5, 6: f6, 7: f7, 9: f9 },
  };
}

export const TABELA_COEFICIENTES: Record<TabelaAntt, Record<TipoCargaAntt, Coeficiente>> = {
  A: {
    granel_solido: linha(
      [4.0144, 5.1355, 5.8118, 6.6983, 7.3841, 8.0516, 9.9231],
      [460.59, 552.24, 597.0, 664.83, 680.01, 820.34, 908.91]
    ),
    granel_liquido: linha(
      [4.0844, 5.2311, 5.9661, 6.8661, 7.5572, 8.19, 9.3822],
      [471.98, 569.57, 621.52, 693.08, 709.72, 840.5, 934.76]
    ),
    frigorificada: linha(
      [4.7095, 6.0159, 6.8646, 7.8666, 8.6661, 9.5884, 10.887],
      [520.07, 623.27, 686.63, 757.98, 772.35, 982.76, 1067.06]
    ),
    conteinerizada: linha(
      [null, 5.1082, 5.7396, 6.6345, 7.3186, 8.0492, 9.1399],
      [null, 544.75, 577.15, 647.29, 662.01, 819.69, 886.05]
    ),
    carga_geral: linha(
      [3.9826, 5.0977, 5.7822, 6.6718, 7.3547, 8.0927, 9.2027],
      [451.84, 541.86, 588.86, 657.56, 671.93, 831.66, 903.32]
    ),
    neogranel: linha(
      [3.6023, 5.0962, 5.8094, 6.6718, 7.3547, 8.0927, 9.2027],
      [451.84, 541.44, 596.35, 657.56, 671.93, 831.66, 903.32]
    ),
    perigosa_granel_solido: linha(
      [4.7845, 5.9154, 6.6285, 7.515, 8.2008, 8.8866, 10.066],
      [608.79, 703.16, 753.03, 820.86, 836.04, 981.39, 1072.15]
    ),
    // REVISAR: na imagem, a linha de CCD (deslocamento) só trouxe 6 valores
    // legíveis pra 7 colunas — falta o valor da coluna "4 eixos". Os demais
    // vêm da coluna seguinte pra frente (por isso o desalinhamento aqui).
    perigosa_granel_liquido: linha(
      [4.871, 6.0236, null, 7.6628, 8.3539, 9.0049, 10.2051],
      [632.58, 732.9, 789.96, 861.51, 878.16, 1013.95, 1110.41]
    ),
    perigosa_frigorificada: linha(
      [5.3176, 6.6369, 7.502, 8.5039, 9.3034, 10.2495, 11.5584],
      [630.88, 737.63, 807.63, 878.98, 893.35, 1110.28, 1197.43]
    ),
    perigosa_conteinerizada: linha(
      [null, 5.4926, 6.1608, 7.0556, 7.7398, 8.4886, 9.5873],
      [null, 645.45, 682.95, 753.1, 767.81, 930.51, 999.06]
    ),
    perigosa_carga_geral: linha(
      [4.3571, 5.4821, 6.2033, 7.093, 7.7758, 8.5321, 9.6501],
      [549.81, 642.55, 694.66, 763.36, 777.73, 942.48, 1016.33]
    ),
    // REVISAR: linha com vários espaços em branco na imagem original — só 3
    // valores de CCD e 2 de CC ficaram nítidos. Confira contra a fonte.
    carga_granel_pressurizada: linha(
      [null, null, null, 7.0364, null, 7.7652, 9.7444],
      [null, null, null, null, null, 757.81, 784.82]
    ),
  },
  B: {
    granel_solido: linha(
      [null, null, 5.218, 5.9334, 6.6063, 7.0381, 7.8292],
      [null, null, 533.4, 594.62, 608.99, 720.31, 773.22]
    ),
    granel_liquido: linha(
      [null, null, 5.2831, 5.9986, 6.6714, 7.1032, 7.8943],
      [null, null, 533.4, 594.62, 608.99, 720.31, 773.22]
    ),
    frigorificada: linha(
      [null, null, 6.129, 6.9472, 7.7367, 8.1867, 9.1284],
      [null, null, 584.04, 645.26, 659.62, 775.96, 831.06]
    ),
    conteinerizada: linha(
      [null, null, 5.218, 5.9334, 6.6063, 7.0381, 7.8292],
      [null, null, 533.4, 594.62, 608.99, 720.31, 773.22]
    ),
    carga_geral: linha(
      [null, null, 5.218, 5.9334, 6.6063, 7.0381, 7.8292],
      [null, null, 533.4, 594.62, 608.99, 720.31, 773.22]
    ),
    neogranel: linha(
      [null, null, 5.218, 5.9334, 6.6063, 7.0381, 7.8292],
      [null, null, 533.4, 594.62, 608.99, 720.31, 773.22]
    ),
    perigosa_granel_solido: linha(
      [null, null, 6.0347, 6.7502, 7.423, 7.873, 8.6721],
      [null, null, 689.44, 750.65, 765.02, 881.36, 936.46]
    ),
    perigosa_granel_liquido: linha(
      [null, null, 6.0798, 6.7953, 7.4681, 7.9181, 8.7172],
      [null, null, 701.84, 763.06, 777.43, 893.76, 948.87]
    ),
    perigosa_frigorificada: linha(
      [null, null, 6.7663, 7.5845, 8.374, 8.8477, 9.7997],
      [null, null, 705.04, 766.25, 780.62, 903.48, 961.43]
    ),
    perigosa_conteinerizada: linha(
      [null, null, 5.6391, 6.3546, 7.0274, 7.4774, 8.2766],
      [null, null, 639.21, 700.42, 714.79, 831.13, 886.23]
    ),
    perigosa_carga_geral: linha(
      [null, null, 5.6391, 6.3546, 7.0274, 7.4774, 8.2766],
      [null, null, 639.21, 700.42, 714.79, 831.13, 886.23]
    ),
    // REVISAR: linha com espaços em branco irregulares na imagem original.
    carga_granel_pressurizada: linha(
      [null, null, null, 5.9334, 6.6063, null, 7.8292],
      [null, null, null, null, 594.62, 608.99, 773.22]
    ),
  },
  C: {
    granel_solido: linha(
      [3.3964, 4.3276, 4.9441, 5.6725, 6.3229, 6.7071, 7.6912],
      [174.38, 198.05, 215.03, 229.64, 232.91, 270.36, 292.59]
    ),
    granel_liquido: linha(
      [3.4439, 4.3828, 5.0412, 5.7745, 6.4268, 6.7985, 7.7901],
      [176.84, 201.78, 220.31, 235.73, 239.32, 274.7, 298.16]
    ),
    frigorificada: linha(
      [4.0647, 5.1615, 5.9203, 6.756, 7.522, 8.0108, 9.1377],
      [205.65, 232.97, 256.16, 271.54, 274.63, 329.34, 351.6]
    ),
    conteinerizada: linha(
      [null, 4.3178, 4.9182, 5.6496, 6.2994, 6.7062, 7.6614],
      [null, 196.43, 210.75, 225.87, 229.04, 270.2, 287.67]
    ),
    carga_geral: linha(
      [3.385, 4.3141, 4.9335, 5.663, 6.3124, 6.7218, 7.6839],
      [172.5, 195.81, 213.27, 228.08, 231.17, 272.8, 291.39]
    ),
    neogranel: linha(
      [3.0047, 4.3135, 4.9432, 5.663, 6.3124, 6.7218, 7.6839],
      [172.5, 195.72, 214.89, 228.08, 231.17, 272.8, 291.39]
    ),
    perigosa_granel_solido: linha(
      [3.9329, 4.8748, 5.5294, 6.2578, 6.9083, 7.3121, 8.3048],
      [224.77, 250.19, 270.47, 285.09, 288.36, 329.05, 352.7]
    ),
    perigosa_granel_liquido: linha(
      [3.964, 4.9136, 5.5777, 6.3109, 6.9633, 7.3546, 8.3548],
      [229.89, 256.6, 278.43, 293.85, 297.43, 336.06, 360.94]
    ),
    perigosa_frigorificada: linha(
      [4.5599, 5.6705, 6.4476, 7.2833, 8.0493, 8.5636, 9.7016],
      [253.51, 283.12, 310.6, 325.98, 329.07, 388.0, 412.1]
    ),
    // REVISAR: valores de CCD e CC dessa linha ficaram parcialmente
    // ilegíveis na imagem original — confira todos os 7 contra a fonte.
    perigosa_conteinerizada: linha(
      [null, 4.8865, 5.525, 5.9564, 6.0602, 7.0327, 7.9965],
      [null, 237.75, 255.37, 270.49, 273.66, 318.08, 336.95]
    ),
    perigosa_carga_geral: linha(
      [3.643, 4.5827, 5.2403, 5.9698, 6.6192, 7.0483, 8.019],
      [212.06, 237.13, 257.89, 272.7, 275.79, 320.66, 340.67]
    ),
    // REVISAR: linha com espaços em branco irregulares na imagem original.
    carga_granel_pressurizada: linha(
      [null, null, null, null, 5.9737, 6.4598, 7.8784],
      [null, null, null, null, null, 249.68, 255.5]
    ),
  },
  D: {
    granel_solido: linha(
      [null, null, 4.4985, 5.0713, 5.7107, 5.9267, 6.6136],
      [null, null, 201.32, 214.52, 217.61, 248.8, 263.35]
    ),
    granel_liquido: linha(
      [null, null, 4.5636, 5.1364, 5.7758, 5.9918, 6.6787],
      [null, null, 201.32, 214.52, 217.61, 248.8, 263.35]
    ),
    frigorificada: linha(
      [null, null, 5.4237, 6.0993, 6.8553, 7.091, 7.929],
      [null, null, 234.06, 247.25, 250.34, 284.78, 300.75]
    ),
    conteinerizada: linha(
      [null, null, 4.4985, 5.0713, 5.7107, 5.9267, 6.6136],
      [null, null, 201.32, 214.52, 217.61, 248.8, 263.35]
    ),
    carga_geral: linha(
      [null, null, 4.4985, 5.0713, 5.7107, 5.9267, 6.6136],
      [null, null, 201.32, 214.52, 217.61, 248.8, 263.35]
    ),
    neogranel: linha(
      [null, null, 4.4985, 5.0713, 5.7107, 5.9267, 6.6136],
      [null, null, 201.32, 214.52, 217.61, 248.8, 263.35]
    ),
    perigosa_granel_solido: linha(
      [null, null, 5.0838, 5.6566, 6.296, 6.5317, 7.2272],
      [null, null, 256.77, 269.96, 273.05, 307.49, 323.46]
    ),
    perigosa_granel_liquido: linha(
      [null, null, 5.1, 5.6728, 6.3122, 6.5479, 7.2434],
      [null, null, 259.44, 272.63, 275.73, 310.16, 326.13]
    ),
    perigosa_frigorificada: linha(
      [null, null, 5.951, 6.6265, 7.3826, 7.6438, 8.493],
      [null, null, 288.5, 301.69, 304.78, 343.44, 361.25]
    ),
    perigosa_conteinerizada: linha(
      [null, null, 4.8053, 5.3781, 6.0175, 6.2532, 6.9487],
      [null, null, 245.95, 259.14, 262.23, 296.67, 312.64]
    ),
    perigosa_carga_geral: linha(
      [null, null, 4.8053, 5.3781, 6.0175, 6.2532, 6.9487],
      [null, null, 245.95, 259.14, 262.23, 296.67, 312.64]
    ),
    // REVISAR: linha com espaços em branco irregulares na imagem original.
    carga_granel_pressurizada: linha(
      [null, null, null, 5.0713, 5.7107, null, 6.6136],
      [null, null, null, 214.52, 217.61, null, 263.35]
    ),
  },
};

export interface PisoAnttResultado {
  /** Piso mínimo total (deslocamento + carga/descarga). */
  pisoTotal: number;
  /** Só a parte de deslocamento (R$/km × km). */
  valorDeslocamento: number;
  /** Só a taxa fixa de carga e descarga. */
  valorCargaDescarga: number;
  /** false quando a combinação eixos/tabela/carga não consta na tabela oficial. */
  disponivel: boolean;
}

export function calcularPisoAnttOficial(
  km: number,
  eixos: EixosAntt,
  tabela: TabelaAntt,
  tipoCarga: TipoCargaAntt
): PisoAnttResultado {
  const coef = TABELA_COEFICIENTES[tabela][tipoCarga];
  const ccdPorKm = coef.ccdPorKm[eixos];
  const ccFixo = coef.ccFixo[eixos];

  if (km <= 0 || ccdPorKm === null || ccFixo === null) {
    return { pisoTotal: 0, valorDeslocamento: 0, valorCargaDescarga: 0, disponivel: ccdPorKm !== null && ccFixo !== null };
  }

  const valorDeslocamento = Math.round(km * ccdPorKm * 100) / 100;
  const valorCargaDescarga = Math.round(ccFixo * 100) / 100;
  return {
    pisoTotal: Math.round((valorDeslocamento + valorCargaDescarga) * 100) / 100,
    valorDeslocamento,
    valorCargaDescarga,
    disponivel: true,
  };
}

// Eixos "carregados do veículo combinado" mais próximo de um número de eixos
// arbitrário (ex: o Toco do app tem 2 eixos "físicos", que já bate direto
// com uma coluna da tabela; mas nem todo truck-type do app cai exatamente
// numa coluna prevista — essa função arredonda pro valor válido mais próximo
// pra sempre conseguir mostrar um resultado).
export function eixosAnttMaisProximo(eixos: number): EixosAntt {
  return EIXOS_ANTT.reduce((maisProximo, atual) =>
    Math.abs(atual - eixos) < Math.abs(maisProximo - eixos) ? atual : maisProximo
  );
}
