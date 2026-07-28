"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ExternalLink } from "lucide-react";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { Card } from "@/components/ui/Card";
import { IconCircle } from "@/components/ui/IconCircle";
import { UserIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { CancelarAssinaturaSheet } from "./_components/CancelarAssinaturaSheet";

type Plano = "trial" | "ativo" | "cancelado";

interface DadosUsuario {
  telefone: string | null;
  nome: string | null;
  plano: Plano;
}

const PLANO_LABEL: Record<Plano, string> = {
  trial: "Trial",
  ativo: "Ativo",
  cancelado: "Cancelado",
};

const PLANO_BADGE_CLASS: Record<Plano, string> = {
  trial: "bg-warning-bg text-warning-text",
  ativo: "bg-success-bg text-success",
  cancelado: "bg-danger-bg text-danger",
};

const PLANO_DESCRICAO: Record<Plano, string> = {
  trial: "Plano: Trial gratuito",
  ativo: "Assinatura ativa",
  cancelado: "Assinatura cancelada",
};

// Reaproveita o mesmo link de checkout: pra quem já é assinante, a Cakto
// mostra a assinatura/login em vez de pedir pagamento de novo.
const CAKTO_MANAGE_URL = "https://pay.cakto.com.br/3teeu9s_1003860";

export default function PerfilPage() {
  const router = useRouter();
  const [dados, setDados] = useState<DadosUsuario | null>(null);
  const [sheetAberto, setSheetAberto] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [erroCancelamento, setErroCancelamento] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    async function carregar() {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) return;

      const { data } = await supabase.from("usuarios").select("nome, plano").eq("id", userId).maybeSingle();
      if (cancelado) return;
      setDados({
        telefone: userData.user?.phone ?? null,
        nome: data?.nome ?? null,
        plano: (data?.plano as Plano) ?? "trial",
      });
    }
    carregar();
    return () => {
      cancelado = true;
    };
  }, []);

  async function handleSair() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  async function handleConfirmarCancelamento() {
    setCancelando(true);
    setErroCancelamento(null);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.functions.invoke<{ error?: string }>("cancelar-assinatura");
      if (error || data?.error) {
        setErroCancelamento(data?.error ?? "Não foi possível cancelar agora. Tente novamente.");
        return;
      }
      setDados((prev) => (prev ? { ...prev, plano: "cancelado" } : prev));
      setSheetAberto(false);
    } catch {
      setErroCancelamento("Não foi possível cancelar agora. Tente novamente.");
    } finally {
      setCancelando(false);
    }
  }

  const plano = dados?.plano ?? "trial";

  return (
    <ScreenShell showTopBand={false}>
      <div className="space-y-5 px-5 pb-10 pt-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="-ml-1.5 inline-flex items-center gap-1 text-sm font-semibold text-ink-secondary"
        >
          <ChevronLeft size={18} strokeWidth={2} />
          Voltar
        </button>

        <header className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">Sua conta</p>
          <h1 className="text-xl font-extrabold text-ink">Perfil</h1>
        </header>

        <Card padding="p-4" className="flex items-center gap-3">
          <IconCircle icon={<UserIcon />} />
          <div>
            <p className="text-sm font-semibold text-ink">{dados?.nome || "Motorista"}</p>
            <p className="text-xs text-ink-tertiary">{dados?.telefone ?? "—"}</p>
          </div>
        </Card>

        <Card padding="p-4" className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-ink">Assinatura</p>
            <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", PLANO_BADGE_CLASS[plano])}>
              {PLANO_LABEL[plano]}
            </span>
          </div>
          <p className="text-sm text-ink-secondary">{PLANO_DESCRICAO[plano]}</p>
          <a
            href={CAKTO_MANAGE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-1.5 rounded-full border border-divider bg-surface py-3 text-sm font-semibold text-ink"
          >
            Gerenciar assinatura
            <ExternalLink size={14} strokeWidth={2} className="text-ink-secondary" />
          </a>

          {plano !== "cancelado" && (
            <button
              type="button"
              onClick={() => setSheetAberto(true)}
              className="w-full rounded-full py-2 text-sm font-semibold text-danger"
            >
              Cancelar assinatura
            </button>
          )}
        </Card>

        <button
          type="button"
          onClick={handleSair}
          className="w-full rounded-full border border-divider py-3 text-sm font-semibold text-danger"
        >
          Sair
        </button>
      </div>

      <CancelarAssinaturaSheet
        open={sheetAberto}
        cancelando={cancelando}
        erro={erroCancelamento}
        onClose={() => setSheetAberto(false)}
        onConfirm={handleConfirmarCancelamento}
      />
    </ScreenShell>
  );
}
