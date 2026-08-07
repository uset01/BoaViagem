"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";

type Etapa = "telefone" | "codigo";

// Celular costuma recarregar a aba quando a pessoa sai pro app do banco/SMS
// pra pegar o código e volta — sem isso, perderia o telefone digitado e
// voltaria pra estaca zero. Guarda em sessionStorage (não sensível, só o
// telefone e em que etapa estava; some ao fechar a aba).
const STORAGE_KEY = "boaviagem-login-em-andamento";

// Supabase exige o telefone em E.164. Como o app é só em pt-BR por
// enquanto, assume DDI 55 (Brasil) quando o usuário não digita o "+".
function paraE164(telefone: string): string {
  const digitos = telefone.replace(/\D/g, "");
  if (digitos.startsWith("55") && digitos.length >= 12) return `+${digitos}`;
  return `+55${digitos}`;
}

export default function LoginPage() {
  const router = useRouter();
  const [etapa, setEtapa] = useState<Etapa>("telefone");
  const [telefone, setTelefone] = useState("");
  const [codigo, setCodigo] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Restaura telefone/etapa se a aba recarregou no meio do fluxo (só
  // interessa restaurar quando já passou pro código — voltar pra "telefone"
  // vazio não precisa de nada especial).
  useEffect(() => {
    try {
      const salvo = sessionStorage.getItem(STORAGE_KEY);
      if (!salvo) return;
      const dados = JSON.parse(salvo) as { etapa?: Etapa; telefone?: string };
      if (dados.etapa === "codigo" && dados.telefone) {
        setTelefone(dados.telefone);
        setEtapa("codigo");
      }
    } catch {
      // sessionStorage indisponível ou dado corrompido — segue do zero
    }
  }, []);

  useEffect(() => {
    if (etapa === "codigo" && telefone) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ etapa, telefone }));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, [etapa, telefone]);

  const telefoneValido = telefone.replace(/\D/g, "").length >= 10;
  const codigoValido = codigo.trim().length === 6;

  async function handleEnviarCodigo() {
    if (!telefoneValido || carregando) return;
    setCarregando(true);
    setErro(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({ phone: paraE164(telefone) });
      if (error) throw error;
      setEtapa("codigo");
    } catch {
      setErro("Não foi possível enviar o código. Confira o número e tente de novo.");
    } finally {
      setCarregando(false);
    }
  }

  async function handleConfirmarCodigo() {
    if (!codigoValido || carregando) return;
    setCarregando(true);
    setErro(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.verifyOtp({
        phone: paraE164(telefone),
        token: codigo.trim(),
        type: "sms",
      });
      if (error) throw error;
      sessionStorage.removeItem(STORAGE_KEY);
      router.push("/assinatura");
    } catch {
      setErro("Código inválido ou expirado. Confira e tente de novo.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg px-5 pb-10" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="pt-4">
        {etapa === "telefone" ? (
          <Link href="/" className="-ml-1.5 inline-flex items-center gap-1 text-sm font-semibold text-ink-secondary">
            <ChevronLeft size={18} strokeWidth={2} />
            Voltar
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => {
              setEtapa("telefone");
              setErro(null);
            }}
            className="-ml-1.5 inline-flex items-center gap-1 text-sm font-semibold text-ink-secondary"
          >
            <ChevronLeft size={18} strokeWidth={2} />
            Voltar
          </button>
        )}
      </div>

      <header className="mt-4 space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">Entrar</p>
        <h1 className="text-xl font-extrabold text-ink">
          {etapa === "telefone" ? "Qual é o seu celular?" : "Digite o código"}
        </h1>
        <p className="text-sm text-ink-secondary">
          {etapa === "telefone"
            ? "Vamos enviar um código por SMS pra confirmar."
            : `Enviamos um código de 6 dígitos pro número ${telefone || "informado"}.`}
        </p>
      </header>

      <Card padding="p-4" className="mt-5">
        {etapa === "telefone" ? (
          <input
            type="tel"
            inputMode="tel"
            autoFocus
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            placeholder="(11) 98765-4321"
            aria-label="Número de celular"
            className="w-full bg-transparent text-lg font-semibold text-ink outline-none placeholder:text-ink-tertiary"
          />
        ) : (
          <input
            type="text"
            inputMode="numeric"
            autoFocus
            maxLength={6}
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            aria-label="Código recebido por SMS"
            className="w-full bg-transparent text-center text-3xl font-extrabold tracking-[0.3em] text-ink outline-none placeholder:text-ink-tertiary"
          />
        )}
      </Card>

      {erro && <p className="mt-3 text-center text-sm font-medium text-danger">{erro}</p>}

      <button
        type="button"
        onClick={etapa === "telefone" ? handleEnviarCodigo : handleConfirmarCodigo}
        disabled={carregando || (etapa === "telefone" ? !telefoneValido : !codigoValido)}
        className="mt-5 w-full rounded-full bg-accent py-4 text-base font-bold text-white transition-opacity disabled:opacity-40"
      >
        {carregando
          ? "Enviando..."
          : etapa === "telefone"
            ? "Enviar código"
            : "Confirmar código"}
      </button>
    </div>
  );
}
