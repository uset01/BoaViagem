export interface Cidade {
  id: string;
  nome: string;
  uf: string;
  lat: number;
  lng: number;
}

export const CIDADES: Cidade[] = [
  { id: "sao-paulo-sp", nome: "São Paulo", uf: "SP", lat: -23.5505, lng: -46.6333 },
  { id: "rio-de-janeiro-rj", nome: "Rio de Janeiro", uf: "RJ", lat: -22.9068, lng: -43.1729 },
  { id: "belo-horizonte-mg", nome: "Belo Horizonte", uf: "MG", lat: -19.9167, lng: -43.9345 },
  { id: "curitiba-pr", nome: "Curitiba", uf: "PR", lat: -25.4284, lng: -49.2733 },
  { id: "porto-alegre-rs", nome: "Porto Alegre", uf: "RS", lat: -30.0346, lng: -51.2177 },
  { id: "salvador-ba", nome: "Salvador", uf: "BA", lat: -12.9777, lng: -38.5016 },
  { id: "recife-pe", nome: "Recife", uf: "PE", lat: -8.0476, lng: -34.877 },
  { id: "fortaleza-ce", nome: "Fortaleza", uf: "CE", lat: -3.7172, lng: -38.5433 },
  { id: "brasilia-df", nome: "Brasília", uf: "DF", lat: -15.7939, lng: -47.8828 },
  { id: "goiania-go", nome: "Goiânia", uf: "GO", lat: -16.6869, lng: -49.2648 },
  { id: "campinas-sp", nome: "Campinas", uf: "SP", lat: -22.9099, lng: -47.0626 },
  { id: "ribeirao-preto-sp", nome: "Ribeirão Preto", uf: "SP", lat: -21.1775, lng: -47.8103 },
  { id: "uberlandia-mg", nome: "Uberlândia", uf: "MG", lat: -18.9186, lng: -48.2772 },
  { id: "londrina-pr", nome: "Londrina", uf: "PR", lat: -23.3103, lng: -51.1628 },
  { id: "joinville-sc", nome: "Joinville", uf: "SC", lat: -26.3044, lng: -48.8464 },
  { id: "florianopolis-sc", nome: "Florianópolis", uf: "SC", lat: -27.5954, lng: -48.548 },
  { id: "vitoria-es", nome: "Vitória", uf: "ES", lat: -20.3155, lng: -40.3128 },
  { id: "natal-rn", nome: "Natal", uf: "RN", lat: -5.7945, lng: -35.211 },
  { id: "joao-pessoa-pb", nome: "João Pessoa", uf: "PB", lat: -7.1195, lng: -34.845 },
  { id: "maceio-al", nome: "Maceió", uf: "AL", lat: -9.6498, lng: -35.7089 },
  { id: "cuiaba-mt", nome: "Cuiabá", uf: "MT", lat: -15.601, lng: -56.0974 },
  { id: "campo-grande-ms", nome: "Campo Grande", uf: "MS", lat: -20.4697, lng: -54.6201 },
  { id: "belem-pa", nome: "Belém", uf: "PA", lat: -1.4558, lng: -48.4902 },
  { id: "manaus-am", nome: "Manaus", uf: "AM", lat: -3.119, lng: -60.0217 },
  { id: "sao-luis-ma", nome: "São Luís", uf: "MA", lat: -2.5297, lng: -44.3028 },
  { id: "teresina-pi", nome: "Teresina", uf: "PI", lat: -5.0892, lng: -42.8019 },
];

const RAIO_TERRA_KM = 6371;
const FATOR_RODOVIA = 1.25;

function toRad(graus: number) {
  return (graus * Math.PI) / 180;
}

function distanciaHaversineKm(a: Cidade, b: Cidade) {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return RAIO_TERRA_KM * c;
}

export function calcularDistanciaKm(origem: Cidade, destino: Cidade): number {
  if (origem.id === destino.id) return 0;
  return Math.round(distanciaHaversineKm(origem, destino) * FATOR_RODOVIA);
}

function normalizarNome(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

// Usado pelo autocomplete de Origem/Destino: tenta casar o texto digitado
// livremente (com ou sem UF) com uma cidade conhecida, sem exigir que o
// usuário escolha exatamente uma opção da lista de sugestões.
export function encontrarCidadePorNome(texto: string): Cidade | undefined {
  const alvo = normalizarNome(texto);
  if (!alvo) return undefined;
  return CIDADES.find(
    (c) => normalizarNome(c.nome) === alvo || normalizarNome(`${c.nome} - ${c.uf}`) === alvo
  );
}
