"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

// No painel da Cakto, configure a URL de retorno pós-pagamento pra
// "<seu-domínio>/assinatura?retorno=cakto" — é esse parâmetro que essa
// tela usa pra saber que a pessoa acabou de voltar de um pagamento.
const CAKTO_CHECKOUT_URL = "https://pay.cakto.com.br/3teeu9s_1003860";

type Plano = "trial" | "ativo" | "cancelado" | null;
type Status = "carregando" | "pronto" | "erro";

const POLL_INTERVAL_MS = 3000;
const POLL_MAX_TENTATIVAS = 10;

const BENEFICIOS = ["Cálculo de lucro ilimitado", "Histórico completo de viagens", "Resumo mensal com gráficos"];

function planoLiberado(plano: Plano): boolean {
  return plano === "trial" || plano === "ativo";
}

async function buscarPlano(): Promise<Plano> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  if (!userId) return null;
  // TODO: se a tabela usuarios crescer muito, considerar mover esse status
  // pra um claim no JWT (custom access token hook do Supabase) em vez de
  // consultar a tabela toda vez.
  const { data } = await supabase.from("usuarios").select("plano").eq("id", userId).maybeSingle();
  return (data?.plano as Plano) ?? null;
}

export default function AssinaturaPage() {
  return (
    <Suspense fallback={null}>
      <AssinaturaConteudo />
    </Suspense>
  );
}

function AssinaturaConteudo() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const voltouDaCakto = searchParams.get("retorno") === "cakto";

  const [status, setStatus] = useState<Status>("carregando");
  const [plano, setPlano] = useState<Plano>(null);
  const [indoParaCheckout, setIndoParaCheckout] = useState(false);
  const tentativasRef = useRef(0);

  useEffect(() => {
    let cancelado = false;
    async function carregar() {
      setStatus("carregando");
      try {
        const planoAtual = await buscarPlano();
        if (cancelado) return;
        setPlano(planoAtual);
        setStatus("pronto");
        if (planoLiberado(planoAtual)) router.push("/calcular");
      } catch {
        if (!cancelado) setStatus("erro");
      }
    }
    carregar();
    return () => {
      cancelado = true;
    };
  }, [router]);

  // Voltou do checkout da Cakto mas o plano ainda não foi liberado — o
  // webhook pode levar alguns segundos pra chegar e atualizar a tabela.
  // Em vez de deixar a pessoa numa tela de "sem acesso", fica reconsultando
  // por um tempo antes de desistir.
  useEffect(() => {
    if (!voltouDaCakto || status !== "pronto" || planoLiberado(plano)) return;
    if (tentativasRef.current >= POLL_MAX_TENTATIVAS) return;

    const timeout = setTimeout(async () => {
      tentativasRef.current += 1;
      const planoAtual = await buscarPlano();
      setPlano(planoAtual);
      if (planoLiberado(planoAtual)) router.push("/calcular");
    }, POLL_INTERVAL_MS);

    return () => clearTimeout(timeout);
  }, [voltouDaCakto, status, plano, router]);

  function handleAssinar() {
    if (!CAKTO_CHECKOUT_URL) return;
    setIndoParaCheckout(true);
    window.location.href = CAKTO_CHECKOUT_URL;
  }

  const aguardandoConfirmacao =
    voltouDaCakto && status === "pronto" && !planoLiberado(plano) && tentativasRef.current < POLL_MAX_TENTATIVAS;

  return (
    <div className="flex min-h-screen flex-col bg-bg px-5 pb-10" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <header className="mt-8 space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">Quase lá</p>
        <h1 className="text-xl font-extrabold text-ink">Ative seu acesso</h1>
      </header>

      {aguardandoConfirmacao && (
        <Card padding="p-4" className="mt-5 flex items-center gap-3 bg-warning-bg">
          <span className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-warning-text" />
          <p className="text-sm font-semibold text-warning-text">
            Recebemos seu retorno do pagamento — confirmando com a Cakto, isso leva só alguns segundos.
          </p>
        </Card>
      )}

      {status === "erro" && (
        <Card padding="p-4" className="mt-5">
          <p className="text-sm font-semibold text-ink">Não foi possível verificar sua assinatura</p>
          <p className="mt-1 text-sm text-ink-secondary">Verifique sua conexão e tente novamente.</p>
        </Card>
      )}

      <Card padding="p-6" className="mt-5 space-y-4">
        <div>
          <p className="text-sm font-semibold text-ink-secondary">Plano BoaViagem</p>
          <p className="mt-1 text-4xl font-extrabold text-ink">
            R$ 29,90<span className="text-base font-medium text-ink-secondary">/mês</span>
          </p>
          <p className="mt-1 text-sm text-ink-secondary">
            7 dias grátis, depois R$ 29,90/mês. Cancele quando quiser.
          </p>
        </div>

        <ul className="space-y-2 border-t border-divider pt-4 text-sm text-ink-secondary">
          {BENEFICIOS.map((beneficio) => (
            <li key={beneficio}>• {beneficio}</li>
          ))}
        </ul>
      </Card>

      <button
        type="button"
        onClick={handleAssinar}
        disabled={indoParaCheckout || !CAKTO_CHECKOUT_URL}
        className={cn(
          "mt-6 w-full rounded-full bg-accent py-4 text-base font-bold text-white transition-opacity",
          (indoParaCheckout || !CAKTO_CHECKOUT_URL) && "opacity-60"
        )}
      >
        {indoParaCheckout ? "Abrindo checkout..." : "Assinar agora"}
      </button>
      <p className="mt-3 text-center text-xs text-ink-tertiary">
        {CAKTO_CHECKOUT_URL
          ? "Você será redirecionado pro checkout seguro da Cakto."
          : "Link de checkout da Cakto ainda não configurado."}
      </p>
    </div>
  );
}
