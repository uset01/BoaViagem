"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

// A função criar-checkout-stripe já manda success_url com
// "?retorno=stripe" — é esse parâmetro que essa tela usa pra saber que a
// pessoa acabou de voltar de um pagamento.
const RETORNO_CHECKOUT_PARAM = "stripe";

// Guarda "estou esperando o pagamento confirmar" ANTES de sair pro checkout
// — celular costuma recarregar a aba quando a pessoa sai pro app do banco
// pra pagar e volta, o que derrubaria o "?retorno=stripe" da URL e faria a
// tela achar que é uma visita normal, sem checar o pagamento.
const AGUARDANDO_PAGAMENTO_KEY = "boaviagem-aguardando-pagamento";

type Plano = "trial" | "ativo" | "cancelado" | null;
type Status = "carregando" | "pronto" | "erro";

const POLL_INTERVAL_MS = 3000;
// Pix + webhook às vezes demora mais que meio minuto pra confirmar —
// 40 tentativas de 3s dá 2 minutos antes de desistir de reconsultar sozinho.
const POLL_MAX_TENTATIVAS = 40;

const BENEFICIOS = ["Cálculo de lucro ilimitado", "Histórico completo de viagens", "Resumo mensal com gráficos"];

function planoLiberado(plano: Plano): boolean {
  return plano === "ativo";
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
  const [voltouDoCheckout, setVoltouDoCheckout] = useState(false);

  useEffect(() => {
    const peloParametro = searchParams.get("retorno") === RETORNO_CHECKOUT_PARAM;
    const peloStorage = sessionStorage.getItem(AGUARDANDO_PAGAMENTO_KEY) === "1";
    setVoltouDoCheckout(peloParametro || peloStorage);
  }, [searchParams]);

  const [status, setStatus] = useState<Status>("carregando");
  const [plano, setPlano] = useState<Plano>(null);
  const [indoParaCheckout, setIndoParaCheckout] = useState(false);
  const [erroCheckout, setErroCheckout] = useState<string | null>(null);
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
        if (planoLiberado(planoAtual)) {
          sessionStorage.removeItem(AGUARDANDO_PAGAMENTO_KEY);
          router.push("/calcular");
        }
      } catch {
        if (!cancelado) setStatus("erro");
      }
    }
    carregar();
    return () => {
      cancelado = true;
    };
  }, [router]);

  // Voltou do checkout do Stripe mas o plano ainda não foi liberado — o
  // webhook pode levar alguns segundos pra chegar e atualizar a tabela.
  // Em vez de deixar a pessoa numa tela de "sem acesso", fica reconsultando
  // por um tempo antes de desistir.
  useEffect(() => {
    if (!voltouDoCheckout || status !== "pronto" || planoLiberado(plano)) return;
    if (tentativasRef.current >= POLL_MAX_TENTATIVAS) return;

    const timeout = setTimeout(async () => {
      tentativasRef.current += 1;
      const planoAtual = await buscarPlano();
      setPlano(planoAtual);
      if (planoLiberado(planoAtual)) {
        sessionStorage.removeItem(AGUARDANDO_PAGAMENTO_KEY);
        router.push("/calcular");
      }
    }, POLL_INTERVAL_MS);

    return () => clearTimeout(timeout);
  }, [voltouDoCheckout, status, plano, router]);

  async function handleAssinar() {
    setIndoParaCheckout(true);
    setErroCheckout(null);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.functions.invoke<{ url?: string; error?: string }>(
        "criar-checkout-stripe"
      );
      if (error || !data?.url) {
        setErroCheckout(data?.error ?? "Não foi possível iniciar o checkout. Tente novamente.");
        setIndoParaCheckout(false);
        return;
      }
      sessionStorage.setItem(AGUARDANDO_PAGAMENTO_KEY, "1");
      window.location.href = data.url;
    } catch {
      setErroCheckout("Não foi possível iniciar o checkout. Tente novamente.");
      setIndoParaCheckout(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg px-5 pb-10" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <header className="mt-8 space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">Quase lá</p>
        <h1 className="text-xl font-extrabold text-ink">Ative seu acesso</h1>
      </header>

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
            R$ 24,99<span className="text-base font-medium text-ink-secondary">/mês</span>
          </p>
          <p className="mt-1 text-sm font-semibold text-accent">7 dias grátis, depois R$ 24,99/mês.</p>
          <p className="mt-1 text-sm text-ink-secondary">Cancele quando quiser.</p>
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
        disabled={indoParaCheckout}
        className={cn(
          "mt-6 w-full rounded-full bg-accent py-4 text-base font-bold text-white transition-opacity",
          indoParaCheckout && "opacity-60"
        )}
      >
        {indoParaCheckout ? "Abrindo checkout..." : "Começar teste grátis de 7 dias"}
      </button>
      {erroCheckout && <p className="mt-3 text-center text-sm font-medium text-danger">{erroCheckout}</p>}
      <p className="mt-3 text-center text-xs text-ink-tertiary">Você será redirecionado pro checkout seguro.</p>
    </div>
  );
}
