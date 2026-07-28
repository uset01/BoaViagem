"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { Card } from "@/components/ui/Card";
import { IconCircle } from "@/components/ui/IconCircle";
import { BottomNav } from "@/components/ui/BottomNav";
import { RouteIcon } from "@/components/icons";
import { NAV_ITEMS } from "@/components/nav-items";
import { createClient } from "@/lib/supabase/client";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";
import { LucroPorViagemChart, type PontoLucro } from "./_components/LucroPorViagemChart";

type Status = "loading" | "ready" | "error";

interface ViagemResumo {
  origem: string | null;
  destino: string | null;
  distancia_km: number;
  valor_frete: number;
  custo_total: number;
  lucro: number;
  created_at: string;
}

const SELECT_COLUNAS = "origem, destino, distancia_km, valor_frete, custo_total, lucro, created_at";

function trechoLabel(viagem: Pick<ViagemResumo, "origem" | "destino" | "distancia_km">): string {
  if (viagem.origem && viagem.destino) return `${viagem.origem} → ${viagem.destino}`;
  return `Viagem de ${viagem.distancia_km} km`;
}

function formatMesAno(ano: number, mes: number): string {
  const label = new Date(ano, mes, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function nomeMes(ano: number, mes: number): string {
  const label = new Date(ano, mes, 1).toLocaleDateString("pt-BR", { month: "long" });
  return label;
}

export default function ResumoPage() {
  const hoje = new Date();
  const [ano, setAno] = useState(hoje.getFullYear());
  const [mes, setMes] = useState(hoje.getMonth());
  const [viagens, setViagens] = useState<ViagemResumo[]>([]);
  const [status, setStatus] = useState<Status>("loading");

  const isMesAtual = ano === hoje.getFullYear() && mes === hoje.getMonth();

  function mesAnterior() {
    setMes((m) => {
      if (m === 0) {
        setAno((a) => a - 1);
        return 11;
      }
      return m - 1;
    });
  }

  function mesSeguinte() {
    if (isMesAtual) return;
    setMes((m) => {
      if (m === 11) {
        setAno((a) => a + 1);
        return 0;
      }
      return m + 1;
    });
  }

  useEffect(() => {
    let cancelado = false;
    async function carregar() {
      setStatus("loading");
      try {
        const supabase = createClient();
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;

        const inicio = new Date(ano, mes, 1).toISOString();
        const fim = new Date(ano, mes + 1, 1).toISOString();

        let query = supabase
          .from("viagens")
          .select(SELECT_COLUNAS)
          .gte("created_at", inicio)
          .lt("created_at", fim)
          .order("created_at", { ascending: true });

        if (userId) query = query.eq("user_id", userId);

        const { data, error } = await query;
        if (error) throw error;
        if (cancelado) return;
        setViagens((data ?? []) as unknown as ViagemResumo[]);
        setStatus("ready");
      } catch {
        if (!cancelado) setStatus("error");
      }
    }
    carregar();
    return () => {
      cancelado = true;
    };
  }, [ano, mes]);

  const totalFaturado = viagens.reduce((soma, v) => soma + v.valor_frete, 0);
  const totalGasto = viagens.reduce((soma, v) => soma + v.custo_total, 0);
  const totalLucro = viagens.reduce((soma, v) => soma + v.lucro, 0);
  const lucrativo = totalLucro >= 0;
  const ticketMedio = viagens.length > 0 ? totalLucro / viagens.length : 0;

  const melhorViagem = viagens.reduce<ViagemResumo | null>(
    (melhor, v) => (!melhor || v.lucro > melhor.lucro ? v : melhor),
    null
  );
  const piorViagem = viagens.reduce<ViagemResumo | null>(
    (pior, v) => (!pior || v.lucro < pior.lucro ? v : pior),
    null
  );

  const pontosGrafico: PontoLucro[] = viagens.map((v) => ({
    data: v.created_at,
    lucro: v.lucro,
    trecho: trechoLabel(v),
  }));

  return (
    <ScreenShell showNav showTopBand={false}>
      <div className="space-y-5 px-5 pb-8 pt-8">
        <header className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">Seu desempenho</p>
          <h1 className="text-xl font-extrabold text-ink">Resumo</h1>
        </header>

        <div className="flex items-center justify-between rounded-full bg-surface-muted p-1.5">
          <button
            type="button"
            onClick={mesAnterior}
            aria-label="Mês anterior"
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-secondary transition-colors hover:bg-surface"
          >
            <ChevronLeft size={18} strokeWidth={2} />
          </button>
          <p className="text-sm font-semibold text-ink">{formatMesAno(ano, mes)}</p>
          <button
            type="button"
            onClick={mesSeguinte}
            disabled={isMesAtual}
            aria-label="Próximo mês"
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-secondary transition-colors hover:bg-surface disabled:opacity-30"
          >
            <ChevronRight size={18} strokeWidth={2} />
          </button>
        </div>

        {status === "loading" && (
          <div className="space-y-3">
            <div className="h-[120px] animate-pulse rounded-[20px] bg-surface-muted" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-[88px] animate-pulse rounded-[20px] bg-surface-muted" />
              <div className="h-[88px] animate-pulse rounded-[20px] bg-surface-muted" />
            </div>
            <div className="h-[72px] animate-pulse rounded-[20px] bg-surface-muted" />
          </div>
        )}

        {status === "error" && (
          <Card className="flex flex-col items-center gap-3 py-10 text-center">
            <IconCircle icon={<RouteIcon />} />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-ink">Não foi possível carregar o resumo</p>
              <p className="text-sm text-ink-secondary">Verifique sua conexão e tente novamente.</p>
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-1 rounded-full bg-surface-muted px-5 py-2.5 text-sm font-semibold text-ink-secondary"
            >
              Tentar novamente
            </button>
          </Card>
        )}

        {status === "ready" && viagens.length === 0 && (
          <Card className="flex flex-col items-center gap-3 py-10 text-center">
            <IconCircle icon={<RouteIcon />} />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-ink">
                Nenhuma viagem calculada em {nomeMes(ano, mes)}
              </p>
              <p className="text-sm text-ink-secondary">Calcule e salve uma viagem pra ver o resumo do mês aqui.</p>
            </div>
            <Link
              href="/calcular"
              className="mt-1 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white"
            >
              Calcular uma viagem
            </Link>
          </Card>
        )}

        {status === "ready" && viagens.length > 0 && (
          <>
            <Card padding="p-6" className="text-center">
              <p
                className={cn(
                  "text-xs font-bold uppercase tracking-wide",
                  lucrativo ? "text-success" : "text-danger"
                )}
              >
                Lucro líquido do mês
              </p>
              <p className={cn("mt-1 text-4xl font-extrabold", lucrativo ? "text-success" : "text-danger")}>
                {formatBRL(totalLucro)}
              </p>
            </Card>

            <div className="grid grid-cols-2 gap-3">
              <Card padding="p-4">
                <p className="text-sm font-medium text-ink-secondary">Faturado</p>
                <p className="mt-1 text-xl font-extrabold text-ink">{formatBRL(totalFaturado)}</p>
              </Card>
              <Card padding="p-4">
                <p className="text-sm font-medium text-ink-secondary">Gasto</p>
                <p className="mt-1 text-xl font-extrabold text-danger">{formatBRL(totalGasto)}</p>
              </Card>
            </div>

            <Card padding="p-4">
              <div className="flex items-center gap-3">
                <IconCircle icon={<RouteIcon />} />
                <p className="text-sm font-semibold text-ink">
                  {viagens.length} {viagens.length === 1 ? "viagem" : "viagens"} no mês
                </p>
              </div>

              <div className="mt-3 space-y-2 border-t border-divider pt-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-ink-secondary">Ticket médio por viagem</p>
                  <p className={cn("text-sm font-bold", ticketMedio >= 0 ? "text-success" : "text-danger")}>
                    {formatBRL(ticketMedio)}
                  </p>
                </div>

                {melhorViagem && (
                  <div className="flex items-center justify-between gap-3">
                    <p className="min-w-0 truncate text-sm text-ink-secondary">
                      Melhor viagem <span className="text-ink-tertiary">· {trechoLabel(melhorViagem)}</span>
                    </p>
                    <p className="shrink-0 text-sm font-bold text-success">{formatBRL(melhorViagem.lucro)}</p>
                  </div>
                )}

                {piorViagem && (
                  <div className="flex items-center justify-between gap-3">
                    <p className="min-w-0 truncate text-sm text-ink-secondary">
                      Pior viagem <span className="text-ink-tertiary">· {trechoLabel(piorViagem)}</span>
                    </p>
                    <p className="shrink-0 text-sm font-bold text-danger">{formatBRL(piorViagem.lucro)}</p>
                  </div>
                )}
              </div>
            </Card>

            <Card padding="p-4">
              <LucroPorViagemChart pontos={pontosGrafico} />
            </Card>
          </>
        )}
      </div>

      <BottomNav items={NAV_ITEMS} active="resumo" />
    </ScreenShell>
  );
}
