export function formatBRL(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatBRLAprox(valor: number): string {
  return Math.round(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function toMoneyString(valor: number): string {
  return valor.toFixed(2).replace(".", ",");
}

export function parseMoney(input: string): number {
  if (!input) return 0;
  const normalizado = input.replace(",", ".").trim();
  const numero = parseFloat(normalizado);
  return Number.isFinite(numero) ? numero : 0;
}

export function formatDateBR(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
