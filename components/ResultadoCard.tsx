"use client";

import { forwardRef, useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { AlertTriangleIcon } from "@/components/icons";
import {
  calcularPisoAnttOficial,
  eixosAnttMaisProximo,
  TABELAS_ANTT,
  TIPOS_CARGA_ANTT,
  type EixosAntt,
  type TabelaAntt,
  type TipoCargaAntt,
} from "@/lib/antt-tabela-oficial";
import { CUSTO_LABELS, type CustoKey } from "@/lib/calculo-custos";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface ResultadoCalculo {
  trecho: string;
  distanciaKm: number;
  truckLabel: string;
  eixos: number;
  frete: number;
  custos: Record<CustoKey, number>;
  custoTotal: number;
  lucro: number;
  /** Ausentes em viagens antigas salvas antes dessa tabela existir — nesse
   * caso o card simplesmente não mostra a comparação com o piso ANTT. */
  tabelaAntt?: TabelaAntt;
  tipoCarga?: TipoCargaAntt;
  /** Eixos escolhidos direto no seletor "Número de Eixos" do formulário.
   * Se ausente (viagem antiga), cai pro eixos do tipo de caminhão. */
  eixosAntt?: EixosAntt;
}

export type SaveState = "idle" | "saving" | "success" | "error";

interface ResultadoCardProps {
  resultado: ResultadoCalculo;
  saveState?: SaveState;
  onSalvar?: () => void;
  /** Modo leitura — usado no histórico pra reexibir uma viagem já salva,
   * sem o botão "Salvar viagem". */
  readOnly?: boolean;
}

export const ResultadoCard = forwardRef<HTMLDivElement, ResultadoCardProps>(function ResultadoCard(
  { resultado, saveState = "idle", onSalvar, readOnly = false },
  ref
) {
  const [pulseFlip, setPulseFlip] = useState(false);

  useEffect(() => {
    setPulseFlip((flip) => !flip);
  }, [resultado]);

  const lucrativo = resultado.lucro >= 0;
  const piso =
    resultado.tabelaAntt && resultado.tipoCarga
      ? calcularPisoAnttOficial(
          resultado.distanciaKm,
          resultado.eixosAntt ?? eixosAnttMaisProximo(resultado.eixos),
          resultado.tabelaAntt,
          resultado.tipoCarga
        )
      : null;
  const abaixoDoPiso = Boolean(piso?.disponivel) && piso!.pisoTotal > 0 && resultado.frete < piso!.pisoTotal;

  return (
    <Card ref={ref} padding="p-5">
      <p className="text-center text-sm font-semibold text-ink">{resultado.trecho}</p>
      <p className="mt-0.5 text-center text-xs text-ink-tertiary">
        {resultado.distanciaKm} km · {resultado.truckLabel}
      </p>

      <div
        className={cn("mt-5 rounded-[24px] p-5 text-center", lucrativo ? "bg-success-bg" : "bg-danger-bg")}
      >
        <p className={cn("text-xs font-bold uppercase tracking-wide", lucrativo ? "text-success" : "text-danger")}>
          Lucro
        </p>
        <p
          className={cn(
            "mt-1 text-3xl font-extrabold",
            lucrativo ? "text-success" : "text-danger",
            pulseFlip ? "animate-number-pulse-a" : "animate-number-pulse-b"
          )}
        >
          {formatBRL(resultado.lucro)}
        </p>
      </div>

      {abaixoDoPiso && piso && (
        <div className="mt-4 flex items-start gap-2.5 rounded-2xl bg-warning-bg px-4 py-3">
          <span className="mt-0.5 shrink-0 text-warning-text">
            <AlertTriangleIcon />
          </span>
          <p className="text-sm text-warning-text">
            Abaixo do piso da ANTT ({TABELAS_ANTT[resultado.tabelaAntt!].label} ·{" "}
            {TIPOS_CARGA_ANTT.find((t) => t.id === resultado.tipoCarga)?.label}). O mínimo pra esse
            trecho é {formatBRL(piso.pisoTotal)} (deslocamento {formatBRL(piso.valorDeslocamento)} + carga/descarga{" "}
            {formatBRL(piso.valorCargaDescarga)}).
          </p>
        </div>
      )}

      {resultado.tabelaAntt && resultado.tipoCarga && piso && !piso.disponivel && (
        <div className="mt-4 flex items-start gap-2.5 rounded-2xl bg-warning-bg px-4 py-3">
          <span className="mt-0.5 shrink-0 text-warning-text">
            <AlertTriangleIcon />
          </span>
          <p className="text-sm text-warning-text">
            A tabela ANTT não prevê essa combinação de eixos, tabela e tipo de carga — não foi possível
            comparar com o piso mínimo.
          </p>
        </div>
      )}

      <div className="mt-5 space-y-2.5">
        <ResultRow label="Frete oferecido" valor={resultado.frete} />
        {(Object.keys(resultado.custos) as CustoKey[]).map((key) => (
          <ResultRow key={key} label={CUSTO_LABELS[key]} valor={-resultado.custos[key]} />
        ))}
        <div className="my-1 h-px bg-divider" />
        <ResultRow label="Total de custos" valor={-resultado.custoTotal} bold />
      </div>

      {!readOnly && (
        <>
          <button
            type="button"
            onClick={onSalvar}
            disabled={saveState === "saving" || saveState === "success"}
            className="mt-6 w-full rounded-full bg-accent py-3.5 text-[15px] font-bold text-white transition-opacity disabled:opacity-60"
          >
            {saveState === "saving" ? "Salvando..." : saveState === "success" ? "Viagem salva" : "Salvar viagem"}
          </button>

          {saveState === "success" && (
            <p className="mt-2 text-center text-sm text-success">Viagem registrada com sucesso.</p>
          )}
          {saveState === "error" && (
            <p className="mt-2 text-center text-sm text-danger">
              Não foi possível salvar agora. Tente novamente.
            </p>
          )}
        </>
      )}
    </Card>
  );
});

function ResultRow({ label, valor, bold = false }: { label: string; valor: number; bold?: boolean }) {
  const negativo = valor < 0;
  return (
    <div className="flex items-center justify-between">
      <span className={cn("text-sm text-ink-secondary", bold && "font-semibold text-ink")}>{label}</span>
      <span
        className={cn(
          "text-sm",
          bold ? "font-bold text-ink" : "font-medium text-ink",
          negativo && !bold && "text-ink-secondary"
        )}
      >
        {negativo ? "− " : ""}
        {formatBRL(Math.abs(valor))}
      </span>
    </div>
  );
}
