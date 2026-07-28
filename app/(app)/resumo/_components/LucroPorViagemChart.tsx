"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { formatBRL } from "@/lib/format";

// Mesmos tokens de --success/--danger do resto do app — não é uma paleta
// categórica nova, é o mesmo par de status (lucro/prejuízo) reutilizado.
const COR_SUCESSO = "#17915A";
const COR_PERIGO = "#D8483B";
const COR_EIXO_ZERO = "#D1D5DB";

export interface PontoLucro {
  data: string;
  lucro: number;
  trecho: string;
}

interface LucroPorViagemChartProps {
  pontos: PontoLucro[];
}

type Modo = "viagem" | "acumulado";

const MODO_OPTIONS: { label: string; value: Modo }[] = [
  { label: "Por viagem", value: "viagem" },
  { label: "Acumulado", value: "acumulado" },
];

export function LucroPorViagemChart({ pontos }: LucroPorViagemChartProps) {
  const [modo, setModo] = useState<Modo>("viagem");

  let somaCorrente = 0;
  const dados = pontos.map((p, index) => {
    somaCorrente += p.lucro;
    return { ...p, dia: new Date(p.data).getDate(), indice: index, acumulado: somaCorrente };
  });

  const ultimoAcumulado = dados.length > 0 ? dados[dados.length - 1].acumulado : 0;
  const corLinha = ultimoAcumulado >= 0 ? COR_SUCESSO : COR_PERIGO;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-ink">
          {modo === "viagem" ? "Lucro por viagem" : "Lucro acumulado no mês"}
        </p>
        <SegmentedControl options={MODO_OPTIONS} value={modo} onChange={(v) => setModo(v as Modo)} />
      </div>

      <div className="h-[160px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {modo === "viagem" ? (
            <BarChart data={dados} margin={{ top: 4, right: 4, bottom: 0, left: 4 }} barCategoryGap="30%">
              <XAxis
                dataKey="dia"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#9CA3AF" }}
                interval="preserveStartEnd"
              />
              <ReferenceLine y={0} stroke={COR_EIXO_ZERO} strokeWidth={1} />
              <Tooltip content={<TooltipContent modo={modo} />} cursor={{ fill: "rgba(15,23,42,0.04)" }} />
              <Bar dataKey="lucro" radius={[3, 3, 3, 3]} maxBarSize={22}>
                {dados.map((ponto) => (
                  <Cell key={ponto.indice} fill={ponto.lucro >= 0 ? COR_SUCESSO : COR_PERIGO} />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <LineChart data={dados} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
              <XAxis
                dataKey="dia"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#9CA3AF" }}
                interval="preserveStartEnd"
              />
              <ReferenceLine y={0} stroke={COR_EIXO_ZERO} strokeWidth={1} />
              <Tooltip content={<TooltipContent modo={modo} />} cursor={{ stroke: "#D1D5DB", strokeWidth: 1 }} />
              <Line
                type="monotone"
                dataKey="acumulado"
                stroke={corLinha}
                strokeWidth={2}
                dot={{ r: 3, fill: corLinha, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

interface TooltipPontoPayload {
  data: string;
  lucro: number;
  trecho: string;
  acumulado: number;
}

function TooltipContent({
  active,
  payload,
  modo,
}: {
  active?: boolean;
  payload?: Array<{ payload: TooltipPontoPayload }>;
  modo: Modo;
}) {
  if (!active || !payload?.length) return null;
  const { data, lucro, trecho, acumulado } = payload[0].payload;
  const valor = modo === "viagem" ? lucro : acumulado;
  const positivo = valor >= 0;
  return (
    <div className="max-w-[190px] rounded-xl bg-ink px-3 py-2 text-center shadow-card">
      <p className="text-[11px] text-white/70">
        {new Date(data).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
      </p>
      <p className="truncate text-[11px] text-white/90">{trecho}</p>
      <p className={`text-sm font-bold ${positivo ? "text-success" : "text-danger"}`}>{formatBRL(valor)}</p>
    </div>
  );
}
