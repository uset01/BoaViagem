"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { Card } from "@/components/ui/Card";
import { IconCircle } from "@/components/ui/IconCircle";
import { BottomNav } from "@/components/ui/BottomNav";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { RouteIcon } from "@/components/icons";
import { NAV_ITEMS } from "@/components/nav-items";
import { createClient } from "@/lib/supabase/client";
import { ViagemCard } from "./_components/ViagemCard";
import { ExcluirViagemSheet } from "./_components/ExcluirViagemSheet";
import { ViagemDetalheSheet } from "./_components/ViagemDetalheSheet";
import type { ViagemRow } from "./_components/types";

const PAGE_SIZE = 15;
const SELECT_COLUNAS =
  "id, origem, destino, distancia_km, tipo_caminhao, valor_frete, custo_diesel, custo_pedagio, custo_manutencao, custo_alimentacao, custo_total, lucro, created_at";

type Status = "loading" | "ready" | "error";

type Periodo = "30d" | "90d" | "ano" | "tudo";

const PERIODO_OPTIONS: { label: string; value: Periodo }[] = [
  { label: "Últimos 30 dias", value: "30d" },
  { label: "Últimos 90 dias", value: "90d" },
  { label: "Este ano", value: "ano" },
  { label: "Tudo", value: "tudo" },
];

function corteDoPeriodo(periodo: Periodo, hoje: Date): string | null {
  if (periodo === "tudo") return null;
  if (periodo === "ano") return new Date(hoje.getFullYear(), 0, 1).toISOString();
  const dias = periodo === "30d" ? 30 : 90;
  return new Date(hoje.getTime() - dias * 24 * 60 * 60 * 1000).toISOString();
}

export default function HistoricoPage() {
  const [periodo, setPeriodo] = useState<Periodo>("30d");
  const [viagens, setViagens] = useState<ViagemRow[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [viagemAberta, setViagemAberta] = useState<ViagemRow | null>(null);
  const [detalheOpen, setDetalheOpen] = useState(false);

  const [viagemParaExcluir, setViagemParaExcluir] = useState<ViagemRow | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(false);

  async function buscarPagina(offset: number) {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    let query = supabase
      .from("viagens")
      .select(SELECT_COLUNAS)
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (userId) query = query.eq("user_id", userId);

    const corte = corteDoPeriodo(periodo, new Date());
    if (corte) query = query.gte("created_at", corte);

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as unknown as ViagemRow[];
  }

  useEffect(() => {
    let cancelado = false;
    async function carregar() {
      setStatus("loading");
      try {
        const pagina = await buscarPagina(0);
        if (cancelado) return;
        setViagens(pagina);
        setHasMore(pagina.length === PAGE_SIZE);
        setStatus("ready");
      } catch {
        if (!cancelado) setStatus("error");
      }
    }
    carregar();
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodo]);

  async function handleCarregarMais() {
    setLoadingMore(true);
    try {
      const proximaPagina = await buscarPagina(viagens.length);
      setViagens((prev) => [...prev, ...proximaPagina]);
      setHasMore(proximaPagina.length === PAGE_SIZE);
    } finally {
      setLoadingMore(false);
    }
  }

  function handleAbrirDetalhe(viagem: ViagemRow) {
    setViagemAberta(viagem);
    setDetalheOpen(true);
  }

  function handleAbrirExclusao(viagem: ViagemRow) {
    setViagemParaExcluir(viagem);
    setDeleteError(false);
    setConfirmOpen(true);
  }

  async function handleConfirmarExclusao() {
    if (!viagemParaExcluir) return;
    setDeleting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("viagens").delete().eq("id", viagemParaExcluir.id);
      if (error) throw error;
      setViagens((prev) => prev.filter((v) => v.id !== viagemParaExcluir.id));
      setDeleteError(false);
      setConfirmOpen(false);
    } catch {
      setDeleteError(true);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <ScreenShell showNav showTopBand={false}>
      <div className="space-y-5 px-5 pb-8 pt-8">
        <header className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">Suas viagens</p>
          <h1 className="text-xl font-extrabold text-ink">Histórico</h1>
        </header>

        <div className="-mx-5 overflow-x-auto px-5">
          <SegmentedControl
            options={PERIODO_OPTIONS}
            value={periodo}
            onChange={(v) => setPeriodo(v as Periodo)}
            className="w-max"
          />
        </div>

        {status === "loading" && (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[72px] animate-pulse rounded-[20px] bg-surface-muted" />
            ))}
          </div>
        )}

        {status === "error" && (
          <Card className="flex flex-col items-center gap-3 py-10 text-center">
            <IconCircle icon={<RouteIcon />} />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-ink">Não foi possível carregar seu histórico</p>
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
              <p className="text-sm font-semibold text-ink">Você ainda não calculou nenhuma viagem</p>
              <p className="text-sm text-ink-secondary">
                Calcule o lucro da sua próxima viagem e salve pra acompanhar aqui.
              </p>
            </div>
            <Link
              href="/calcular"
              className="mt-1 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white"
            >
              Calcular agora
            </Link>
          </Card>
        )}

        {status === "ready" && viagens.length > 0 && (
          <>
            <div className="space-y-3">
              {viagens.map((viagem) => (
                <ViagemCard
                  key={viagem.id}
                  viagem={viagem}
                  onAbrir={handleAbrirDetalhe}
                  onExcluir={handleAbrirExclusao}
                />
              ))}
            </div>

            {hasMore && (
              <button
                type="button"
                onClick={handleCarregarMais}
                disabled={loadingMore}
                className="w-full rounded-full bg-surface-muted py-3 text-sm font-semibold text-ink-secondary transition-opacity disabled:opacity-60"
              >
                {loadingMore ? "Carregando..." : "Carregar mais"}
              </button>
            )}
          </>
        )}
      </div>

      <ViagemDetalheSheet open={detalheOpen} viagem={viagemAberta} onClose={() => setDetalheOpen(false)} />

      <ExcluirViagemSheet
        open={confirmOpen}
        viagem={viagemParaExcluir}
        deleting={deleting}
        error={deleteError}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmarExclusao}
      />

      <BottomNav items={NAV_ITEMS} active="historico" />
    </ScreenShell>
  );
}
