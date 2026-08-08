"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ExternalLink, MessageCircle } from "lucide-react";
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

// TODO: número provisório — trocar pelo WhatsApp real de suporte (formato
// wa.me: só dígitos, com código do país, sem espaços/símbolos).
const WHATSAPP_SUPORTE_NUMERO = "5500000000000";
const WHATSAPP_SUPORTE_URL = `https://wa.me/${WHATSAPP_SUPORTE_NUMERO}`;

export default function PerfilPage() {
  const router = useRouter();
  const [dados, setDados] = useState<DadosUsuario | null>(null);
  const [sheetAberto, setSheetAberto] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [erroCancelamento, setErroCancelamento] = useState<string | null>(null);
  const [indoParaStripe, setIndoParaStripe] = useState(false);
  const [erroStripe, setErroStripe] = useState<string | null>(null);

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

  // "Assinar novamente" (sem assinatura ativa) cria um novo checkout;
  // "Gerenciar assinatura" (já é assinante) abre o portal de faturamento
  // do Stripe, onde dá pra trocar cartão e ver faturas.
  async function handleGerenciarOuAssinar() {
    setIndoParaStripe(true);
    setErroStripe(null);
    try {
      const supabase = createClient();
      const nomeFuncao = plano === "cancelado" ? "criar-checkout-stripe" : "criar-portal-stripe";
      const { data, error } = await supabase.functions.invoke<{ url?: string; error?: string }>(nomeFuncao);
      if (error || !data?.url) {
        setErroStripe(data?.error ?? "Não foi possível abrir agora. Tente novamente.");
        setIndoParaStripe(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setErroStripe("Não foi possível abrir agora. Tente novamente.");
      setIndoParaStripe(false);
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

        <Card padding="px-4 py-3" className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-ink">Assinatura</p>
            <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", PLANO_BADGE_CLASS[plano])}>
              {PLANO_LABEL[plano]}
            </span>
          </div>
          <button
            type="button"
            onClick={handleGerenciarOuAssinar}
            disabled={indoParaStripe}
            className={cn(
              "flex w-full items-center justify-center gap-1.5 rounded-full py-3 text-sm font-semibold transition-opacity",
              plano === "cancelado" ? "bg-accent text-white" : "border border-divider bg-surface text-ink",
              indoParaStripe && "opacity-60"
            )}
          >
            {indoParaStripe ? "Abrindo..." : plano === "cancelado" ? "Assinar novamente" : "Gerenciar assinatura"}
            {!indoParaStripe && (
              <ExternalLink size={14} strokeWidth={2} className={plano === "cancelado" ? "text-white/80" : "text-ink-secondary"} />
            )}
          </button>
          {erroStripe && <p className="text-center text-xs font-medium text-danger">{erroStripe}</p>}

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

        <section className="space-y-2">
          <p className="px-1 text-xs font-semibold uppercase tracking-wide text-ink-tertiary">Ajuda</p>
          <Card padding="p-0">
            <a
              href={WHATSAPP_SUPORTE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4"
            >
              <IconCircle icon={<MessageCircle size={18} strokeWidth={2} />} />
              <span className="flex-1 text-sm font-semibold text-ink">Falar com suporte</span>
              <ExternalLink size={14} strokeWidth={2} className="text-ink-tertiary" />
            </a>
          </Card>
        </section>

        <button
          type="button"
          onClick={handleSair}
          className="w-full rounded-full border border-divider py-3 text-sm font-semibold text-danger"
        >
          Sair
        </button>

        <div className="flex items-center justify-center gap-4 pt-1">
          <Link href="/termos" className="text-xs text-ink-tertiary underline-offset-2 hover:underline">
            Termos de uso
          </Link>
          <Link href="/privacidade" className="text-xs text-ink-tertiary underline-offset-2 hover:underline">
            Política de privacidade
          </Link>
        </div>
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
