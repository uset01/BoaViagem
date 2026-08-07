import Link from "next/link";
import { ChevronLeft } from "lucide-react";

// TODO: substituir pelo texto real da Política de Privacidade (LGPD) antes
// de lançar pra usuários de verdade — não inventar cláusulas legais aqui.
export default function PrivacidadePage() {
  return (
    <div className="flex min-h-screen flex-col bg-bg px-5 pb-10" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="pt-4">
        <Link href="/perfil" className="-ml-1.5 inline-flex items-center gap-1 text-sm font-semibold text-ink-secondary">
          <ChevronLeft size={18} strokeWidth={2} />
          Voltar
        </Link>
      </div>

      <header className="mt-4 space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">BoaViagem</p>
        <h1 className="text-xl font-extrabold text-ink">Política de privacidade</h1>
      </header>

      <p className="mt-5 text-sm leading-relaxed text-ink-secondary">
        Este texto ainda não foi escrito. Assim que a política de privacidade estiver definida (incluindo como
        os dados pessoais são coletados e usados, conforme a LGPD), ela será publicada aqui.
      </p>
    </div>
  );
}
